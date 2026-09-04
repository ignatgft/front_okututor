// migrated to TSX — minimal strict types (controlled)
import { useState, useEffect, useRef, useCallback, Fragment, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../components/pageTitleContext";
import useAuthStore from "../store/authStore";
import { loadSupportThread, sendSupportMessage, messagesApi } from "../api/messages.api";
import { supportApi } from "../api/support.api";
import { CONVERSATION_TYPES } from "../constants/roles";
import { STATUS_I18N, PRIORITY_I18N, CATEGORY_I18N, OPEN_STATUSES } from "../constants/support";
import { Spinner, EmptyState, ErrorState, Badge } from "../components/ui/Primitives";
import { useToast } from "../components/ui/Toast";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import NewTicketModal from "../components/messages/NewTicketModal";
import AttachmentRenderer from "../components/attachments/AttachmentRenderer";
import { Search, Paperclip, Image as ImageIcon, Send, Smile, ArrowLeft, MoreVertical, Reply, Heart, Forward, Trash2, Edit2, X, Check, CheckCheck, Clock3, AlertCircle } from "lucide-react";
import "../styles/Messages.css";
import { safeDisplayName, initials, avatarColor, formatChatTime, dayLabel, previewText, isUnread, MAX_ATTACHMENT_SIZE, POLL_INTERVAL } from "../features/messaging/utils/messageHelpers";
import { useConversations } from "../features/messaging/hooks/useConversations";
import { useMessagingThread } from "../features/messaging/hooks/useMessagingThread";

function TgAvatar({ name, size = 44 }: { name: unknown; size?: number }): JSX.Element {
  const bg = avatarColor(name);
  return (
    <span className="tg-avatar" style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

function SupportHeader({ conversation, onClose, onReopen, busy }) {
  const { t } = useTranslation();
  const isOpen = OPEN_STATUSES.includes(conversation.ticket_status);
  const statusKey = STATUS_I18N[conversation.ticket_status] || null;
  const priorityKey = PRIORITY_I18N[conversation.ticket_priority] || null;
  const categoryKey = CATEGORY_I18N[conversation.ticket_category] || null;
  return (
    <div className="tg-chat-header tg-chat-header--support">
      <div className="tg-chat-header__main">
        <div className="tg-chat-header__title">{safeDisplayName(conversation.counterpart_name || conversation.name, t)}</div>
        <div className="tg-chat-header__subtitle">
          {categoryKey && <span>{t(categoryKey)}</span>}
          {statusKey && <Badge status={isOpen ? "active" : "completed"}>{t(statusKey)}</Badge>}
          {priorityKey && <Badge status={conversation.ticket_priority === "HIGH" || conversation.ticket_priority === "URGENT" ? "cancelled" : "active"}>{t(priorityKey)}</Badge>}
        </div>
      </div>
      {isOpen ? (
        <button type="button" className="tg-icon-btn tg-icon-btn--danger" onClick={onClose} disabled={busy} title={t("support.close_ticket", "Close ticket")}>
          <X size={18} />
        </button>
      ) : (
        <button type="button" className="tg-btn tg-btn--primary tg-btn--sm" onClick={onReopen} disabled={busy}>
          {t("support.reopen_ticket", "Reopen")}
        </button>
      )}
    </div>
  );
}

export default function PgMessages() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const setPageTitle = usePageTitle();
  const { user } = useAuthStore();

  useEffect(() => { setPageTitle(t("navbar.messages", "Сообщения")); }, [setPageTitle, t]);

  const { conversations, activeConvo, setActiveConvo, filter, setFilter, query, setQuery, loading, error, reload: loadConversations } = useConversations();
  const { messages, threadLoading, setMessages } = useMessagingThread(activeConvo);
  const [draft, setDraft] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);

  const [reactions, setReactions] = useState<Record<string, unknown>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, unknown> | null>(null);
  const [editingMessage, setEditingMessage] = useState<Record<string, unknown> | null>(null);
  const [editDraft, setEditDraft] = useState<string>("");
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Record<string, unknown> | null>(null);
  const [forwardTargetConvo, setForwardTargetConvo] = useState<Record<string, unknown> | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState<boolean>(false);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, replyingTo, editingMessage]);

  const tempIdRef = useRef(0);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const updateActiveTicket = (patch) => {
    setActiveConvo((prev) => {
      const next = prev ? { ...prev, ...patch } : prev;
      if (next) setConversations((list) => list.map((c) => (c.id === next.id ? next : c)));
      return next;
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error(t("attachments.too_large", "File must be 10 MB or smaller"));
      return;
    }
    const allowedTypes = ["image/", "video/", "audio/", "application/pdf", "application/zip", "application/x-zip-compressed", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "text/plain", "text/csv", "application/rtf"];
    if (!allowedTypes.some((p) => file.type.startsWith(p)) && file.type !== "") {
      toast.error(t("attachments.unsupported_type", "Unsupported file type"));
      return;
    }
    if (pendingFile?.objectUrl) URL.revokeObjectURL(pendingFile.objectUrl);
    setPendingFile({ file, progress: 0, objectUrl: URL.createObjectURL(file) });
    setShowAttachMenu(false);
  };
  const clearPendingFile = useCallback(() => {
    setPendingFile((pf) => { if (pf?.objectUrl) URL.revokeObjectURL(pf.objectUrl); return null; });
  }, []);

  const closeTicket = async () => {
    if (!activeConvo) return;
    setBusy(true);
    try {
      const { response, data } = await supportApi.close(activeConvo.ticket_id);
      if (response.ok) { toast.success(t("support.ticket_closed", "Ticket closed")); updateActiveTicket({ ticket_status: "CLOSED" }); }
      else toast.error(data?.message || t("support.action_failed", "Action failed"));
    } catch { toast.error(t("support.action_failed", "Action failed")); }
    finally { setBusy(false); setConfirmAction(null); }
  };
  const reopenTicket = async () => {
    if (!activeConvo) return;
    setBusy(true);
    try {
      const { response, data } = await supportApi.reopen(activeConvo.ticket_id);
      if (response.ok) { toast.success(t("support.ticket_reopened", "Ticket reopened")); updateActiveTicket({ ticket_status: "OPEN" }); }
      else toast.error(data?.message || t("support.action_failed", "Action failed"));
    } catch { toast.error(t("support.action_failed", "Action failed")); }
    finally { setBusy(false); setConfirmAction(null); }
  };
  const handleTicketCreated = () => { setNewTicketOpen(false); loadConversations().then(() => setFilter(CONVERSATION_TYPES.SUPPORT)); };

  const handleSend = async (e) => {
    e.preventDefault();
    // if replying, delegate to reply flow
    if (replyingTo) return handleReplySend(e);
    const body = draft.trim();
    if ((!body && !pendingFile) || !activeConvo) return;
    const optimisticAttachment = pendingFile ? { id: `tmp-file-${tempIdRef.current}`, name: pendingFile.file.name, size: pendingFile.file.size, mime_type: pendingFile.file.type, kind: pendingFile.file.type?.startsWith("image/") ? "IMAGE" : "FILE", url: pendingFile.objectUrl, pending: true } : null;
    const optimistic = { id: `tmp-${++tempIdRef.current}`, body, attachment: optimisticAttachment, sender_id: user?.id, own: true, sending: true, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    setSending(true);
    try {
      let attachmentId = null;
      if (pendingFile) {
        const up = await messagesApi.uploadAttachment(pendingFile.file, (p) => setPendingFile((pf) => (pf ? { ...pf, progress: p } : pf)));
        if (!up.response.ok) throw new Error(up.data?.message || "upload failed");
        attachmentId = up.data?.id || up.data?.attachment?.id || null;
        clearPendingFile();
      }
      if (activeConvo.type === CONVERSATION_TYPES.SUPPORT) {
        await sendSupportMessage(activeConvo.ticket_id, body, attachmentId);
        const msgs = await loadSupportThread(activeConvo.ticket_id);
        setMessages(msgs);
      } else {
        await messagesApi.send({ conversation_id: activeConvo.id, body, ...(attachmentId ? { attachment_id: attachmentId } : {}) });
        const { response, data } = await messagesApi.conversation(activeConvo.id);
        if (response.ok) setMessages(Array.isArray(data) ? data : data.messages || []);
      }
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, sending: false, failed: true } : m)));
      toast.error(t("messages.send_failed", "Failed to send message"));
    } finally { setSending(false); if (pendingFile) clearPendingFile(); }
  };

  const retrySend = async (m) => {
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, sending: true, failed: false } : x)));
    try {
      const attachmentId = m.attachment?.id && !String(m.attachment.id).startsWith("tmp-file") ? m.attachment.id : null;
      if (activeConvo.type === CONVERSATION_TYPES.SUPPORT) {
        await sendSupportMessage(activeConvo.ticket_id, m.body, attachmentId);
        const msgs = await loadSupportThread(activeConvo.ticket_id);
        setMessages(msgs);
      } else {
        await messagesApi.send({ conversation_id: activeConvo.id, body: m.body, ...(attachmentId ? { attachment_id: attachmentId } : {}) });
        const { response, data } = await messagesApi.conversation(activeConvo.id);
        if (response.ok) setMessages(Array.isArray(data) ? data : data.messages || []);
      }
    } catch {
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, sending: false, failed: true } : x)));
      toast.error(t("messages.send_failed", "Failed to send message"));
    }
  };

  const handleAddReaction = async (messageId, emoji) => {
    try {
      await messagesApi.addReaction(messageId, emoji);
      setReactions((prev) => {
        const existing = prev[messageId] || { emoji: {}, userReacted: {} };
        const newCount = (existing.emoji[emoji] || 0) + 1;
        return { ...prev, [messageId]: { emoji: { ...existing.emoji, [emoji]: newCount }, userReacted: { ...existing.userReacted, [emoji]: true } } };
      });
    } catch { toast.error(t("messages.reaction_failed", "Failed to add reaction")); }
  };
  const handleRemoveReaction = async (messageId, emoji) => {
    try {
      await messagesApi.removeReaction(messageId, emoji);
      setReactions((prev) => {
        const existing = prev[messageId];
        if (!existing) return prev;
        const newCount = Math.max(0, (existing.emoji[emoji] || 1) - 1);
        return { ...prev, [messageId]: { emoji: { ...existing.emoji, [emoji]: newCount }, userReacted: { ...existing.userReacted, [emoji]: false } } };
      });
    } catch { toast.error(t("messages.reaction_failed", "Failed to remove reaction")); }
  };
  const handleToggleReaction = (messageId, emoji) => {
    const existing = reactions[messageId];
    const userReacted = existing?.userReacted?.[emoji];
    if (userReacted) handleRemoveReaction(messageId, emoji);
    else handleAddReaction(messageId, emoji);
  };
  const startReply = (message) => { setReplyingTo(message); setEditingMessage(null); composerRef.current?.querySelector("input")?.focus(); };
  const cancelReply = () => setReplyingTo(null);
  const handleReplySend = async (e) => {
    e.preventDefault();
    if (!replyingTo || (!draft.trim() && !pendingFile)) return;
    const body = draft.trim();
    const optimisticAttachment = pendingFile ? { id: `tmp-file-${tempIdRef.current}`, name: pendingFile.file.name, size: pendingFile.file.size, mime_type: pendingFile.file.type, kind: pendingFile.file.type?.startsWith("image/") ? "IMAGE" : "FILE", url: pendingFile.objectUrl, pending: true } : null;
    const optimistic = { id: `tmp-${++tempIdRef.current}`, body, attachment: optimisticAttachment, sender_id: user?.id, own: true, sending: true, created_at: new Date().toISOString(), reply_to: replyingTo.id };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    setSending(true);
    const savedReply = replyingTo;
    setReplyingTo(null);
    try {
      let attachmentId = null;
      if (pendingFile) {
        const up = await messagesApi.uploadAttachment(pendingFile.file, (p) => setPendingFile((pf) => (pf ? { ...pf, progress: p } : pf)));
        if (!up.response.ok) throw new Error(up.data?.message || "upload failed");
        attachmentId = up.data?.id || up.data?.attachment?.id || null;
        clearPendingFile();
      }
      if (activeConvo.type === CONVERSATION_TYPES.SUPPORT) {
        await sendSupportMessage(activeConvo.ticket_id, body, attachmentId);
        const msgs = await loadSupportThread(activeConvo.ticket_id);
        setMessages(msgs);
      } else {
        await messagesApi.reply(savedReply.id, body, attachmentId);
        const { response, data } = await messagesApi.conversation(activeConvo.id);
        if (response.ok) setMessages(Array.isArray(data) ? data : data.messages || []);
      }
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, sending: false, failed: true } : m)));
      toast.error(t("messages.reply_failed", "Failed to send reply"));
    } finally { setSending(false); if (pendingFile) clearPendingFile(); }
  };
  const startEdit = (message) => { setEditingMessage(message); setEditDraft(message.body || message.text || ""); setReplyingTo(null); };
  const cancelEdit = () => { setEditingMessage(null); setEditDraft(""); };
  const handleEditSave = async () => {
    if (!editingMessage || !editDraft.trim()) return;
    try {
      await messagesApi.edit(editingMessage.id, editDraft);
      setMessages((prev) => prev.map((m) => (m.id === editingMessage.id ? { ...m, body: editDraft, edited: true } : m)));
      setEditingMessage(null); setEditDraft("");
    } catch { toast.error(t("messages.edit_failed", "Failed to edit message")); }
  };
  const handleDelete = async (messageId) => {
    try { await messagesApi.delete(messageId); setMessages((prev) => prev.filter((m) => m.id !== messageId)); }
    catch { toast.error(t("messages.delete_failed", "Failed to delete message")); }
  };
  const startForward = (message) => { setForwardingMessage(message); setForwardTargetConvo(null); };
  const cancelForward = () => { setForwardingMessage(null); setForwardTargetConvo(null); };
  const handleForward = async () => {
    if (!forwardingMessage || !forwardTargetConvo) return;
    try { await messagesApi.forward(forwardingMessage.id, forwardTargetConvo); toast.success(t("messages.forwarded", "Message forwarded")); setForwardingMessage(null); setForwardTargetConvo(null); }
    catch { toast.error(t("messages.forward_failed", "Failed to forward message")); }
  };

  // умный поиск: токенизация, нормализация, ранжирование, подсветка
  const normalize = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const highlightMatch = (text, q) => {
    if (!q || !text) return text;
    const nq = normalize(q);
    const nt = normalize(text);
    const idx = nt.indexOf(nq);
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + q.length);
    const after = text.slice(idx + q.length);
    return <>{before}<mark className="tg-highlight">{match}</mark>{after}</>;
  };
  const filtered = useMemo(() => {
    const byType = filter === "all" ? conversations : conversations.filter((c) => c.type === filter);
    const q = normalize(query);
    if (!q) {
      // сортировка: непрочитанные наверху, затем по дате
      return [...byType].sort((a, b) => {
        const ua = Number(a.unread_count) > 0 ? 1 : 0;
        const ub = Number(b.unread_count) > 0 ? 1 : 0;
        if (ua !== ub) return ub - ua;
        return (b.updated_at || "").localeCompare(a.updated_at || "");
      });
    }
    const tokens = q.split(/\s+/).filter(Boolean);
    const scored = byType.map((c) => {
      const name = normalize(c.counterpart_name || c.name || "");
      const preview = normalize(c.last_message?.body || c.last_message?.text || previewText(c, t) || "");
      const status = normalize(c.ticket_status || "");
      const hay = `${name} ${preview} ${status}`;
      let score = 0;
      for (const tok of tokens) {
        if (name === tok) score += 10;
        else if (name.startsWith(tok)) score += 8;
        else if (name.includes(tok)) score += 5;
        else if (preview.includes(tok)) score += 3;
        else if (hay.includes(tok)) score += 1;
        else score -= 1;
      }
      // бонус за непрочитанные и свежие
      if (Number(c.unread_count) > 0) score += 2;
      return { c, score, matched: tokens.every((tok) => hay.includes(tok)) };
    }).filter((x) => x.matched);
    scored.sort((a, b) => b.score - a.score || (b.c.updated_at || "").localeCompare(a.c.updated_at || ""));
    return scored.map((x) => x.c);
  }, [conversations, filter, query, t]);

  const filteredMessages = useMemo(() => {
    if (!query.trim()) return messages;
    const q = normalize(query);
    return messages.filter((m) => {
      const body = normalize(m.body || m.text || "");
      const sender = normalize(m.sender_name || "");
      return body.includes(q) || sender.includes(q);
    });
  }, [messages, query]);

  // close attach menu on outside click
  useEffect(() => {
    const onDoc = (e) => { if (showAttachMenu && !e.target.closest(".tg-attach-wrap")) setShowAttachMenu(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showAttachMenu]);

  return (
    <div className="tg-page">
      {/* SIDEBAR */}
      <aside className={`tg-sidebar ${activeConvo ? "tg-sidebar--hidden-mobile" : ""}`}>
        <div className="tg-sidebar__header">
          <div className="tg-search">
            <Search size={16} className="tg-search__icon" />
            <input className="tg-search__input" placeholder={t("messages.search_placeholder", "Search")} value={query} onChange={(e) => setQuery(e.target.value)} aria-label={t("messages.search_placeholder", "Search")} />
            {query && <button type="button" className="tg-search__clear" onClick={() => setQuery("")} aria-label={t("common.clear", "Clear")}><X size={14} /></button>}
          </div>
          <div className="tg-filters">
            <button type="button" className={`tg-chip ${filter === "all" ? "tg-chip--active" : ""}`} onClick={() => setFilter("all")}>{t("messages.all", "All")}</button>
            <button type="button" className={`tg-chip ${filter === CONVERSATION_TYPES.DIRECT ? "tg-chip--active" : ""}`} onClick={() => setFilter(CONVERSATION_TYPES.DIRECT)}>{t("messages.direct", "Chat")}</button>
            <button type="button" className={`tg-chip ${filter === CONVERSATION_TYPES.SUPPORT ? "tg-chip--active" : ""}`} onClick={() => setFilter(CONVERSATION_TYPES.SUPPORT)}>{t("messages.support", "Support")}</button>
            <button type="button" className="tg-new-ticket" onClick={() => setNewTicketOpen(true)} title={t("messages.new_ticket", "New ticket")}>+</button>
          </div>
        </div>

        <div className="tg-convo-list" role="list">
          {loading ? <div className="tg-center"><Spinner label={t("common.loading")} /></div>
          : error ? <div className="tg-center"><ErrorState message={error} onRetry={loadConversations} /></div>
          : filtered.length === 0 ? <div className="tg-center"><EmptyState icon="💬" title={t("messages.no_conversations", "No chats yet")} hint={<p className="tg-hint">{t("messages.start_hint", "Chats with tutors and support will appear here.")}</p>} /></div>
          : filtered.length === 0 && query.trim() ? <div className="tg-center"><EmptyState icon="🔍" title={t("messages.no_search_results", "No results")} hint={<p className="tg-hint">{t("messages.no_search_hint", "Try another keywords")}</p>} /></div>
          : filtered.map((c) => {
              const rawName = safeDisplayName(c.counterpart_name || c.name || `#${c.id}`, t);
              const name = query.trim() ? highlightMatch(rawName, query.trim()) : rawName;
              const active = activeConvo?.id === c.id;
              const unread = Number(c.unread_count) || 0;
              const time = c.updated_at ? formatChatTime(c.updated_at, i18n.language) : "";
              const rawPreview = previewText(c, t);
              const preview = query.trim() ? highlightMatch(rawPreview, query.trim()) : rawPreview;
              return (
                <button key={c.id} type="button" role="listitem" className={`tg-convo ${active ? "tg-convo--active" : ""} ${c.type === CONVERSATION_TYPES.SUPPORT ? "tg-convo--support" : ""}`} onClick={() => setActiveConvo(c)}>
                  <TgAvatar name={rawName} size={48} />
                  <span className={`tg-convo__dot ${c.type === CONVERSATION_TYPES.SUPPORT ? "tg-convo__dot--support" : isUnread(c) ? "tg-convo__dot--unread" : ""}`} aria-hidden="true" />
                  <span className="tg-convo__main">
                    <span className="tg-convo__top">
                      <span className="tg-convo__name">{name}</span>
                      {time && <span className="tg-convo__time">{time}</span>}
                    </span>
                    <span className="tg-convo__bottom">
                      <span className="tg-convo__preview">{preview}</span>
                      {unread > 0 && <span className="tg-badge">{unread > 99 ? "99+" : unread}</span>}
                    </span>
                  </span>
                </button>
              );
            })}
        </div>
      </aside>

      {/* CHAT */}
      <section className={`tg-chat ${activeConvo ? "tg-chat--visible-mobile" : "tg-chat--hidden-mobile"}`}>
        {!activeConvo ? (
          <div className="tg-empty-chat"><EmptyState icon="✉️" title={t("messages.pick_conversation", "Select a chat")} hint={<span className="tg-hint">{t("messages.pick_hint", "Choose a conversation from the list")}</span>} /></div>
        ) : (
          <>
            {/* Header */}
            <div className="tg-chat-header">
              <button type="button" className="tg-icon-btn tg-icon-btn--ghost tg-only-mobile" onClick={() => setActiveConvo(null)} aria-label={t("a11y.back_to_list", "Back")}><ArrowLeft size={20} /></button>
              <TgAvatar name={safeDisplayName(activeConvo.counterpart_name || activeConvo.name, t)} size={36} />
              <div className="tg-chat-header__info" onClick={() => { /* future: open profile */ }}>
                <div className="tg-chat-header__name">{safeDisplayName(activeConvo.counterpart_name || activeConvo.name, t)}</div>
                <div className="tg-chat-header__status">
                  {activeConvo.type === CONVERSATION_TYPES.SUPPORT
                    ? (OPEN_STATUSES.includes(activeConvo.ticket_status) ? t("support.status_open", "Open") : t("support.status_closed", "Closed"))
                    : t("messages.tap_to_info", "tap to view info")}
                </div>
              </div>
              <div className="tg-chat-header__actions">
                {activeConvo.type === CONVERSATION_TYPES.SUPPORT ? (
                  OPEN_STATUSES.includes(activeConvo.ticket_status) ? (
                    <button type="button" className="tg-icon-btn" onClick={() => setConfirmAction("close")} disabled={busy} title={t("support.close_ticket", "Close")}><X size={18} /></button>
                  ) : (
                    <button type="button" className="tg-btn tg-btn--primary tg-btn--sm" onClick={() => setConfirmAction("reopen")} disabled={busy}>{t("support.reopen_ticket", "Reopen")}</button>
                  )
                ) : <button type="button" className="tg-icon-btn" aria-label={t("common.more", "More")}><MoreVertical size={18} /></button>}
              </div>
            </div>

            {activeConvo.type === CONVERSATION_TYPES.SUPPORT && (
              <div className="tg-support-strip">
                {CATEGORY_I18N[activeConvo.ticket_category] && <span className="tg-support-strip__cat">{t(CATEGORY_I18N[activeConvo.ticket_category])}</span>}
                <Badge status={OPEN_STATUSES.includes(activeConvo.ticket_status) ? "active" : "completed"}>{STATUS_I18N[activeConvo.ticket_status] ? t(STATUS_I18N[activeConvo.ticket_status]) : activeConvo.ticket_status}</Badge>
                {PRIORITY_I18N[activeConvo.ticket_priority] && <Badge status={activeConvo.ticket_priority === "HIGH" || activeConvo.ticket_priority === "URGENT" ? "cancelled" : "active"}>{t(PRIORITY_I18N[activeConvo.ticket_priority])}</Badge>}
              </div>
            )}

            {/* Messages — с умным поиском внутри чата */}
            {query.trim() && filteredMessages.length !== messages.length && (
              <div className="tg-search-banner">
                <span>{t("messages.search_results", "Found {{count}} messages").replace("{{count}}", String(filteredMessages.length))}</span>
                <button type="button" className="tg-search-banner__clear" onClick={() => setQuery("")}>{t("common.clear", "Clear")}</button>
              </div>
            )}
            <div className="tg-messages" ref={threadRef} role="log" aria-live="polite" aria-label={t("messages.chat_log", "Chat messages")}>
              {threadLoading && messages.length === 0 ? <div className="tg-center"><Spinner /></div>
              : messages.length === 0 ? <div className="tg-center"><EmptyState title={t("messages.no_messages_yet", "No messages yet")} hint={<span className="tg-hint">{t("messages.say_hi", "Say hi 👋")}</span>} /></div>
              : filteredMessages.length === 0 && query.trim() ? <div className="tg-center"><EmptyState icon="🔍" title={t("messages.no_search_results", "No results")} hint={<span className="tg-hint">{t("messages.no_search_in_chat", "No messages match your search")}</span>} /></div>
              : filteredMessages.map((m, idx) => {
                  const prev = messages[idx - 1];
                  const isOwn = m.own || m.is_own || (user?.id && String(m.sender_id) === String(user.id));
                  const showDay = !prev || dayLabel(prev.created_at, i18n.language, t) !== dayLabel(m.created_at, i18n.language, t);
                  const msgReactions = reactions[m.id];
                  const replySource = m.reply_to ? messages.find((x) => String(x.id) === String(m.reply_to)) : null;
                  return (
                    <Fragment key={m.id}>
                      {m.created_at && showDay && (
                        <div className="tg-day"><span>{dayLabel(m.created_at, i18n.language, t)}</span></div>
                      )}
                      <div className={`tg-msg ${isOwn ? "tg-msg--own" : "tg-msg--other"} ${m.failed ? "tg-msg--failed" : ""}`}>
                        {!isOwn && m.sender_name && <div className="tg-msg__sender">{safeDisplayName(m.sender_name, t)}</div>}
                        {replySource && (
                          <div className="tg-reply-quote">
                            <span className="tg-reply-quote__bar" />
                            <span className="tg-reply-quote__text">{replySource.body || replySource.text || t("messages.attachment", "Attachment")}</span>
                          </div>
                        )}
                        {(m.attachment || (Array.isArray(m.attachments) && m.attachments.length > 0)) && (
                          <div className="tg-msg__attachments">
                            {m.attachment ? <AttachmentRenderer attachment={m.attachment} /> : m.attachments.map((a, ai) => <AttachmentRenderer key={a.id || ai} attachment={a} />)}
                          </div>
                        )}
                        {editingMessage?.id === m.id ? (
                          <div className="tg-edit-inline">
                            <textarea className="tg-edit-inline__area" value={editDraft} onChange={(e) => setEditDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSave(); } if (e.key === "Escape") cancelEdit(); }} autoFocus rows={2} />
                            <div className="tg-edit-inline__actions">
                              <button type="button" className="tg-btn tg-btn--ghost tg-btn--sm" onClick={cancelEdit}>{t("common.cancel", "Cancel")}</button>
                              <button type="button" className="tg-btn tg-btn--primary tg-btn--sm" onClick={handleEditSave}>{t("common.save", "Save")}</button>
                            </div>
                          </div>
                        ) : (
                          <div className="tg-msg__text">{query.trim() ? highlightMatch(m.body || m.text || "", query.trim()) : (m.body || m.text)}</div>
                        )}
                        {msgReactions && Object.keys(msgReactions.emoji).length > 0 && (
                          <div className="tg-reactions">
                            {Object.entries(msgReactions.emoji).filter(([,c])=>c>0).map(([emoji, count]) => (
                              <button key={emoji} type="button" className={`tg-reaction ${msgReactions.userReacted?.[emoji] ? "tg-reaction--reacted" : ""}`} onClick={() => handleToggleReaction(m.id, emoji)}>{emoji} {count}</button>
                            ))}
                          </div>
                        )}
                        <div className="tg-msg__meta">
                          <span className="tg-msg__time">{m.created_at ? formatChatTime(m.created_at, i18n.language) : ""}{m.edited ? ` · ${t("messages.edited", "edited")}` : ""}</span>
                          {isOwn && (
                            <span className="tg-msg__ticks">
                              {m.sending ? <Clock3 size={12} className="tg-tick tg-tick--sending" /> : m.failed ? <AlertCircle size={12} className="tg-tick tg-tick--failed" /> : m.read_at ? <CheckCheck size={14} className="tg-tick tg-tick--read" /> : <Check size={14} className="tg-tick tg-tick--sent" />}
                            </span>
                          )}
                        </div>
                        {/* hover actions */}
                        <div className="tg-msg__actions">
                          <button type="button" className="tg-msg-action" onClick={() => setShowReactionPicker(m.id)} title={t("messages.add_reaction", "React")}><Heart size={14} /></button>
                          <button type="button" className="tg-msg-action" onClick={() => startReply(m)} title={t("messages.reply", "Reply")}><Reply size={14} /></button>
                          <button type="button" className="tg-msg-action" onClick={() => startForward(m)} title={t("messages.forward", "Forward")}><Forward size={14} /></button>
                          {isOwn && !m.sending && !m.failed && (
                            <>
                              <button type="button" className="tg-msg-action" onClick={() => startEdit(m)} title={t("messages.edit", "Edit")}><Edit2 size={14} /></button>
                              <button type="button" className="tg-msg-action tg-msg-action--danger" onClick={() => handleDelete(m.id)} title={t("messages.delete", "Delete")}><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
                      </div>
                      {m.failed && isOwn && (
                        <div className="tg-failed-row">
                          <span className="tg-failed-row__label">{t("messages.not_delivered", "Not delivered")}</span>
                          <button type="button" className="tg-btn tg-btn--ghost tg-btn--sm" onClick={() => retrySend(m)}>{t("messages.retry", "Retry")}</button>
                        </div>
                      )}
                    </Fragment>
                  );
                })}
            </div>

            {/* Reply / Edit bars */}
            {replyingTo && (
              <div className="tg-reply-bar">
                <div className="tg-reply-bar__line" />
                <div className="tg-reply-bar__content">
                  <div className="tg-reply-bar__title">{t("messages.replying_to", "Replying to")} {safeDisplayName(replyingTo.sender_name, t)}</div>
                  <div className="tg-reply-bar__text">{replyingTo.body || replyingTo.text || t("messages.attachment", "Attachment")}</div>
                </div>
                <button type="button" className="tg-icon-btn tg-icon-btn--ghost" onClick={cancelReply} aria-label={t("common.cancel", "Cancel")}><X size={16} /></button>
              </div>
            )}
            {editingMessage && (
              <div className="tg-reply-bar tg-reply-bar--edit">
                <div className="tg-reply-bar__line tg-reply-bar__line--edit" />
                <div className="tg-reply-bar__content">
                  <div className="tg-reply-bar__title">{t("messages.editing", "Editing")}</div>
                  <div className="tg-reply-bar__text">{editingMessage.body || editingMessage.text}</div>
                </div>
                <button type="button" className="tg-icon-btn tg-icon-btn--ghost" onClick={cancelEdit} aria-label={t("common.cancel", "Cancel")}><X size={16} /></button>
              </div>
            )}

            {/* Attachment preview */}
            {pendingFile && (
              <div className="tg-attach-preview">
                {pendingFile.file.type?.startsWith("image/") && pendingFile.objectUrl ? (
                  <img className="tg-attach-preview__thumb" src={pendingFile.objectUrl} alt={pendingFile.file.name} />
                ) : (
                  <span className="tg-attach-preview__icon">📄</span>
                )}
                <span className="tg-attach-preview__info">
                  <span className="tg-attach-preview__name">{pendingFile.file.name}</span>
                  {typeof pendingFile.progress === "number" && pendingFile.progress < 100 && sending ? (
                    <span className="tg-attach-preview__progress"><i style={{ width: `${pendingFile.progress}%` }} /><span>{pendingFile.progress}%</span></span>
                  ) : sending && pendingFile.progress >= 100 ? (
                    <span className="tg-hint">{t("attachments.uploading", "Uploading…")}</span>
                  ) : (
                    <span className="tg-hint">{pendingFile.file.type || "file"} · {(pendingFile.file.size / 1024).toFixed(1)} KB</span>
                  )}
                </span>
                <button type="button" className="tg-icon-btn tg-icon-btn--ghost" onClick={clearPendingFile} disabled={sending} aria-label={t("attachments.remove_file", "Remove file")}><X size={16} /></button>
              </div>
            )}

            {/* Composer */}
            <form className="tg-composer" onSubmit={editingMessage ? (e) => { e.preventDefault(); handleEditSave(); } : handleSend} ref={composerRef}>
              <div className="tg-attach-wrap">
                <button type="button" className="tg-icon-btn tg-icon-btn--ghost" onClick={() => setShowAttachMenu((v) => !v)} disabled={sending} aria-label={t("attachments.attach_file", "Attach")}>
                  <Paperclip size={18} />
                </button>
                {showAttachMenu && (
                  <div className="tg-attach-menu">
                    <button type="button" className="tg-attach-menu__item" onClick={() => photoInputRef.current?.click()} disabled={!!pendingFile}><ImageIcon size={16} /> {t("attachments.photo", "Photo")}</button>
                    <button type="button" className="tg-attach-menu__item" onClick={() => fileInputRef.current?.click()} disabled={!!pendingFile}><Paperclip size={16} /> {t("attachments.file", "File")}</button>
                  </div>
                )}
                <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={handleFileSelect} data-testid="photo-input" />
                <input ref={fileInputRef} type="file" hidden onChange={handleFileSelect} data-testid="file-input" />
              </div>

              <div className="tg-composer__input-wrap">
                <input
                  className="tg-composer__input"
                  type="text"
                  value={editingMessage ? editDraft : draft}
                  onChange={(e) => editingMessage ? setEditDraft(e.target.value) : setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") { cancelReply(); cancelEdit(); } }}
                  placeholder={editingMessage ? t("messages.edit_placeholder", "Edit message...") : replyingTo ? t("messages.reply_placeholder", "Write a reply...") : t("messages.type_message", "Write a message...")}
                  disabled={sending}
                  aria-label={t("messages.type_message", "Write a message...")}
                />
                <button type="button" className="tg-icon-btn tg-icon-btn--ghost tg-composer__emoji" aria-label="Emoji" onClick={() => setShowReactionPicker(showReactionPicker ? null : "__composer")}>
                  <Smile size={18} />
                </button>
              </div>

              {editingMessage ? (
                <>
                  <button type="button" className="tg-btn tg-btn--ghost" onClick={cancelEdit}>{t("common.cancel", "Cancel")}</button>
                  <button type="submit" className="tg-btn tg-btn--primary tg-btn--icon" disabled={!editDraft.trim()} aria-label={t("common.save", "Save")}><Check size={18} /></button>
                </>
              ) : (
                <button type="submit" className="tg-btn tg-btn--primary tg-btn--icon tg-btn--send" disabled={sending || (!draft.trim() && !pendingFile && !replyingTo)} aria-label={t("messages.send", "Send")}>
                  {sending ? <Clock3 size={18} className="tg-spin" /> : <Send size={18} />}
                </button>
              )}
            </form>

            {/* quick emoji for composer */}
            {showReactionPicker === "__composer" && (
              <div className="tg-emoji-bar">
                {["😀","😂","❤️","🔥","👍","🎉","😮","😢","🙏","👏"].map((e) => (
                  <button key={e} type="button" className="tg-emoji" onClick={() => { setDraft((d) => d + e); setShowReactionPicker(null); }}>{e}</button>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {newTicketOpen && <NewTicketModal onClose={() => setNewTicketOpen(false)} onCreated={handleTicketCreated} />}

      {showReactionPicker && showReactionPicker !== "__composer" && (
        <div className="tg-reaction-picker" role="dialog" aria-modal="true" onClick={() => setShowReactionPicker(null)}>
          <div className="tg-reaction-picker__panel" onClick={(e) => e.stopPropagation()}>
            {["👍","❤️","😂","😮","😢","😡","🎉","🔥","👏","🤔"].map((emoji) => (
              <button key={emoji} type="button" className="tg-emoji" onClick={() => { handleAddReaction(showReactionPicker, emoji); setShowReactionPicker(null); }} aria-label={emoji}>{emoji}</button>
            ))}
          </div>
        </div>
      )}

      {forwardingMessage && (
        <div className="tg-modal" onClick={cancelForward}>
          <div className="tg-modal__panel" onClick={(e) => e.stopPropagation()}>
            <div className="tg-modal__header">
              <h3 className="tg-modal__title">{t("messages.forward_to", "Forward to")}</h3>
              <button type="button" className="tg-icon-btn tg-icon-btn--ghost" onClick={cancelForward}><X size={16} /></button>
            </div>
            <div className="tg-modal__preview">{forwardingMessage.body?.slice(0,120) || forwardingMessage.text?.slice(0,120) || t("messages.attachment", "Attachment")}</div>
            <div className="tg-forward-list">
              {filtered.map((c) => (
                <button key={c.id} type="button" className={`tg-forward-item ${forwardTargetConvo === c.id ? "tg-forward-item--active" : ""}`} onClick={() => setForwardTargetConvo(c.id)}>
                  <TgAvatar name={safeDisplayName(c.counterpart_name || c.name, t)} size={36} />
                  <span className="tg-forward-item__name">{safeDisplayName(c.counterpart_name || c.name, t)}</span>
                  <span className="tg-forward-item__type">{c.type === CONVERSATION_TYPES.SUPPORT ? "Support" : "Chat"}</span>
                </button>
              ))}
            </div>
            <div className="tg-modal__actions">
              <button type="button" className="tg-btn tg-btn--ghost" onClick={cancelForward}>{t("common.cancel", "Cancel")}</button>
              <button type="button" className="tg-btn tg-btn--primary" onClick={handleForward} disabled={!forwardTargetConvo}>{t("messages.forward", "Forward")}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirmAction === "close"} title={t("support.close_confirm_title", "Close this ticket?")} message={t("support.close_confirm_text", "This will mark the ticket as closed.")} confirmLabel={t("support.close_ticket", "Close ticket")} loading={busy} onConfirm={closeTicket} onCancel={() => setConfirmAction(null)} />
      <ConfirmDialog open={confirmAction === "reopen"} title={t("support.reopen_confirm_title", "Reopen this ticket?")} message={t("support.reopen_confirm_text", "The ticket status will change back to open.")} confirmLabel={t("support.reopen_ticket", "Reopen")} tone="active" loading={busy} onConfirm={reopenTicket} onCancel={() => setConfirmAction(null)} />
    </div>
  );
}
