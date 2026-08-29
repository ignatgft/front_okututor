import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { usePageTitle } from "../components/pageTitleContext";
import useAuthStore from "../store/authStore";
import { loadUnifiedConversations, loadSupportThread, sendSupportMessage, messagesApi } from "../api/messages.api";
import { supportApi } from "../api/support.api";
import { CONVERSATION_TYPES } from "../constants/roles";
import { STATUS_I18N, PRIORITY_I18N, CATEGORY_I18N, OPEN_STATUSES } from "../constants/support";
import { Spinner, EmptyState, ErrorState, Badge } from "../components/ui/Primitives";
import { useToast } from "../components/ui/Toast";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import NewTicketModal from "../components/messages/NewTicketModal";
import AttachmentRenderer from "../components/attachments/AttachmentRenderer";
import { isSameDay, isToday } from "../utils/date";
import "../styles/Messages.css";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

const POLL_INTERVAL = 5000;

function conversationIcon(type) {
  if (type === CONVERSATION_TYPES.SUPPORT) return "🎫";
  if (type === CONVERSATION_TYPES.SYSTEM) return "🔔";
  return "💬";
}

function conversationSubtitle(c) {
  if (c.type === CONVERSATION_TYPES.SUPPORT) {
    return c.ticket_status ? `${c.ticket_status}${c.ticket_priority ? ` · ${c.ticket_priority}` : ""}` : "Support";
  }
  return c.last_message?.body || "";
}

function safeDisplayName(name, t) {
  const trimmed = (name || "").replace(/\s+/g, " ").trim();
  if (!trimmed || trimmed.length < 2) {
    return t("messages.unknown", "Unknown user");
  }
  return trimmed;
}

function formatChatTime(raw, locale = "ru") {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
}

function dayLabel(raw, locale = "ru", t) {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  if (isToday(d)) return t ? t("messages.today", "Today") : "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(d, yesterday)) return t ? t("messages.yesterday", "Yesterday") : "Yesterday";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(d);
}

function SupportThreadHeader({ conversation, onClose, onReopen, busy }) {
  const { t } = useTranslation();
  const isOpen = OPEN_STATUSES.includes(conversation.ticket_status);
  const statusKey = STATUS_I18N[conversation.ticket_status] || null;
  const priorityKey = PRIORITY_I18N[conversation.ticket_priority] || null;
  const categoryKey = CATEGORY_I18N[conversation.ticket_category] || null;

  return (
    <div className="support-thread-header">
      <div className="support-thread-title">
        <div className="support-thread-subject">{conversation.counterpart_name || safeDisplayName(conversation.name, t)}</div>
        {categoryKey && <span className="support-thread-category">{t(categoryKey)}</span>}
      </div>
      <div className="support-thread-meta">
        <Badge status={isOpen ? "active" : "completed"}>
          {statusKey ? t(statusKey) : conversation.ticket_status}
        </Badge>
        {priorityKey && (
          <Badge status={conversation.ticket_priority === "HIGH" || conversation.ticket_priority === "URGENT" ? "cancelled" : "active"}>
            {t(priorityKey)}
          </Badge>
        )}
        {conversation.ticket_assigned_to && (
          <span className="support-thread-assigned">
            {t("support.assigned_to", "Agent")}: {conversation.ticket_assigned_to}
          </span>
        )}
        {isOpen ? (
          <button type="button" className="support-thread-action close" onClick={onClose} disabled={busy}>
            {t("support.close_ticket", "Close ticket")}
          </button>
        ) : (
          <button type="button" className="support-thread-action reopen" onClick={onReopen} disabled={busy}>
            {t("support.reopen_ticket", "Reopen")}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PgMessages() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const setPageTitle = usePageTitle();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();

  useEffect(() => { setPageTitle(t("navbar.messages", "Сообщения")); }, [setPageTitle, t]);

  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState(() => {
    const param = searchParams.get("filter");
    if (param === "support") return CONVERSATION_TYPES.SUPPORT;
    if (param === "direct") return CONVERSATION_TYPES.DIRECT;
    return "all";
  });
  const threadRef = useRef(null);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const all = await loadUnifiedConversations();
      setConversations(all);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const ticketId = searchParams.get("ticket");
    if (ticketId && conversations.length > 0) {
      const match = conversations.find((c) => c.type === CONVERSATION_TYPES.SUPPORT && c.ticket_id === ticketId);
      if (match) setActiveConvo(match);
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    if (!activeConvo) {
      setMessages([]);
      return undefined;
    }
    let cancelled = false;

    const loadThread = async () => {
      try {
        let msgs;
        if (activeConvo.type === CONVERSATION_TYPES.SUPPORT) {
          msgs = await loadSupportThread(activeConvo.ticket_id);
        } else {
          const { response, data } = await messagesApi.conversation(activeConvo.id);
          msgs = response.ok ? (Array.isArray(data) ? data : data.messages || []) : [];
        }
        if (!cancelled) setMessages(msgs);
      } catch {
        /* keep last state on transient errors */
      }
    };

    setThreadLoading(true);
    loadThread().finally(() => !cancelled && setThreadLoading(false));
    const timer = setInterval(loadThread, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activeConvo]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

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
    const allowedTypes = [
      "image/", "video/", "audio/",
      "application/pdf", "application/zip", "application/x-zip-compressed",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain", "text/csv", "application/rtf",
    ];
    if (!allowedTypes.some((prefix) => file.type.startsWith(prefix)) && file.type !== "") {
      toast.error(t("attachments.unsupported_type", "Unsupported file type"));
      return;
    }
    if (pendingFile) {
      if (pendingFile.objectUrl) URL.revokeObjectURL(pendingFile.objectUrl);
    }
    setPendingFile({ file, progress: 0, objectUrl: URL.createObjectURL(file) });
  };

  const clearPendingFile = useCallback(() => {
    setPendingFile((pf) => {
      if (pf?.objectUrl) URL.revokeObjectURL(pf.objectUrl);
      return null;
    });
  }, []);

  const closeTicket = async () => {
    if (!activeConvo) return;
    setBusy(true);
    try {
      const { response, data } = await supportApi.close(activeConvo.ticket_id);
      if (response.ok) {
        toast.success(t("support.ticket_closed", "Ticket closed"));
        updateActiveTicket({ ticket_status: "CLOSED" });
      } else {
        toast.error(data?.message || t("support.action_failed", "Action failed"));
      }
    } catch {
      toast.error(t("support.action_failed", "Action failed"));
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  };

  const reopenTicket = async () => {
    if (!activeConvo) return;
    setBusy(true);
    try {
      const { response, data } = await supportApi.reopen(activeConvo.ticket_id);
      if (response.ok) {
        toast.success(t("support.ticket_reopened", "Ticket reopened"));
        updateActiveTicket({ ticket_status: "OPEN" });
      } else {
        toast.error(data?.message || t("support.action_failed", "Action failed"));
      }
    } catch {
      toast.error(t("support.action_failed", "Action failed"));
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  };

  const handleTicketCreated = (ticket) => {
    setNewTicketOpen(false);
    loadConversations().then(() => setFilter(CONVERSATION_TYPES.SUPPORT));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if ((!body && !pendingFile) || !activeConvo) return;

    const optimisticAttachment = pendingFile
      ? {
          id: `tmp-file-${tempIdRef.current}`,
          name: pendingFile.file.name,
          size: pendingFile.file.size,
          mime_type: pendingFile.file.type,
          kind: pendingFile.file.type?.startsWith("image/") ? "IMAGE" : "FILE",
          url: pendingFile.objectUrl,
          pending: true,
        }
      : null;

    const optimistic = {
      id: `tmp-${++tempIdRef.current}`,
      body,
      attachment: optimisticAttachment,
      sender_id: user?.id,
      own: true,
      sending: true,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    setSending(true);
    try {
      let attachmentId = null;
      if (pendingFile) {
        const up = await messagesApi.uploadAttachment(pendingFile.file, (p) =>
          setPendingFile((pf) => (pf ? { ...pf, progress: p } : pf))
        );
        if (!up.response.ok) throw new Error(up.data?.message || "upload failed");
        attachmentId = up.data?.id || up.data?.attachment?.id || null;
        clearPendingFile();
      }
      if (activeConvo.type === CONVERSATION_TYPES.SUPPORT) {
        await sendSupportMessage(activeConvo.ticket_id, body, attachmentId);
        const msgs = await loadSupportThread(activeConvo.ticket_id);
        setMessages(msgs);
      } else {
        await messagesApi.send({
          conversation_id: activeConvo.id,
          body,
          ...(attachmentId ? { attachment_id: attachmentId } : {}),
        });
        const { response, data } = await messagesApi.conversation(activeConvo.id);
        if (response.ok) setMessages(Array.isArray(data) ? data : data.messages || []);
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...m, sending: false, failed: true } : m))
      );
      toast.error(t("messages.send_failed", "Failed to send message"));
    } finally {
      setSending(false);
      if (pendingFile) clearPendingFile();
    }
  };

  const retrySend = async (m) => {
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, sending: true, failed: false } : x)));
    try {
      const attachmentId = m.attachment?.id && !String(m.attachment.id).startsWith("tmp-file")
        ? m.attachment.id
        : null;
      if (activeConvo.type === CONVERSATION_TYPES.SUPPORT) {
        await sendSupportMessage(activeConvo.ticket_id, m.body, attachmentId);
        const msgs = await loadSupportThread(activeConvo.ticket_id);
        setMessages(msgs);
      } else {
        await messagesApi.send({
          conversation_id: activeConvo.id,
          body: m.body,
          ...(attachmentId ? { attachment_id: attachmentId } : {}),
        });
        const { response, data } = await messagesApi.conversation(activeConvo.id);
        if (response.ok) setMessages(Array.isArray(data) ? data : data.messages || []);
      }
    } catch {
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, sending: false, failed: true } : x)));
      toast.error(t("messages.send_failed", "Failed to send message"));
    }
  };

  const filtered = filter === "all"
    ? conversations
    : conversations.filter((c) => c.type === filter);

  return (
      <div className="messages-page">
        <aside className={`messages-list${activeConvo ? " hidden-mobile" : ""}`} aria-label={t("navbar.messages", "Сообщения")}>
          <div className="messages-filters">
            <button
              className={`messages-filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              {t("messages.all", "All")}
            </button>
            <button
              className={`messages-filter-btn ${filter === CONVERSATION_TYPES.DIRECT ? "active" : ""}`}
              onClick={() => setFilter(CONVERSATION_TYPES.DIRECT)}
            >
              {t("messages.direct", "Messages")}
            </button>
            <button
              className={`messages-filter-btn ${filter === CONVERSATION_TYPES.SUPPORT ? "active" : ""}`}
              onClick={() => setFilter(CONVERSATION_TYPES.SUPPORT)}
            >
              {t("messages.support", "Support")}
            </button>
            <button
              type="button"
              className="messages-new-ticket"
              onClick={() => setNewTicketOpen(true)}
            >
              + {t("messages.new_ticket", "New ticket")}
            </button>
          </div>

          {loading ? (
            <Spinner label={t("common.loading")} />
          ) : error ? (
            <ErrorState message={error} onRetry={loadConversations} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="💬"
              title={t("messages.no_conversations", "No conversations yet")}
              hint={
                <p className="empty-state-hint">
                  {t("messages.start_hint", "Conversations with tutors and support will appear here.")}
                </p>
              }
            />
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`conversation-item ${activeConvo?.id === c.id ? "active" : ""} conversation-${c.type?.toLowerCase() || "direct"}`}
                onClick={() => setActiveConvo(c)}
              >
                <span className="conversation-icon">{conversationIcon(c.type)}</span>
                <div className="conversation-info">
                  <span className="conversation-name">
                    {safeDisplayName(c.counterpart_name || c.name || `#${c.id}`, t)}
                  </span>
                  <span className="conversation-preview">{conversationSubtitle(c)}</span>
                </div>
                {Number(c.unread_count) > 0 && (
                  <span className="unread-badge">{c.unread_count}</span>
                )}
              </button>
            ))
          )}
        </aside>

        <section className={`messages-thread${activeConvo ? " visible-mobile" : " hidden-mobile"}`} aria-live="polite">
          {/* Кнопка назад на мобиле */}
          {activeConvo && (
            <button
              className="messages-back-btn"
              onClick={() => setActiveConvo(null)}
              aria-label={t("a11y.back_to_list", "Back to list")}
            >
              ← {t("common.back", "Назад")}
            </button>
          )}
          {!activeConvo ? (
            <EmptyState icon="✉️" title={t("messages.pick_conversation", "Select a conversation")} />
          ) : (
            <>
              {activeConvo.type === CONVERSATION_TYPES.SUPPORT ? (
                <SupportThreadHeader
                  conversation={activeConvo}
                  onClose={() => setConfirmAction("close")}
                  onReopen={() => setConfirmAction("reopen")}
                  busy={busy}
                />
              ) : (
                <div className="thread-header">
                  <span className="thread-counterpart">{safeDisplayName(activeConvo.counterpart_name || activeConvo.name || "", t)}</span>
                </div>
              )}
              <div className="thread-messages" ref={threadRef} role="log" aria-live="polite" aria-label={t("messages.chat_log", "Chat messages")}>
                {threadLoading && messages.length === 0 ? (
                  <Spinner />
                ) : messages.length === 0 ? (
                  <EmptyState title={t("messages.no_messages_yet", "No messages yet")} />
                ) : (
                  messages.map((m, idx) => {
                    const prev = messages[idx - 1];
                    const isOwn = m.own || m.is_own || (user?.id && String(m.sender_id) === String(user.id));
                    const showDay = !prev || !dayLabel(prev.created_at, i18n.language, t) || dayLabel(prev.created_at, i18n.language, t) !== dayLabel(m.created_at, i18n.language, t);
                    return (
                      <Fragment key={m.id}>
                        {m.created_at && showDay && (
                          <div className="message-day-separator">
                            <span>{dayLabel(m.created_at, i18n.language, t)}</span>
                          </div>
                        )}
                        <div className={`message-bubble ${isOwn ? "own" : ""} ${m.failed ? "failed" : ""}`}>
                          {!isOwn && m.sender_name && (
                            <span className="message-sender">{safeDisplayName(m.sender_name, t)}</span>
                          )}
                          {(m.attachment || (Array.isArray(m.attachments) && m.attachments.length > 0)) && (
                            <div className="message-attachments">
                              {m.attachment ? (
                                <AttachmentRenderer attachment={m.attachment} />
                              ) : (
                                m.attachments.map((a, ai) => (
                                  <AttachmentRenderer key={a.id || ai} attachment={a} />
                                ))
                              )}
                            </div>
                          )}
                          <p>{m.body || m.text}</p>
                          <div className="message-meta">
                            {m.created_at && (
                              <time>{formatChatTime(m.created_at, i18n.language)}</time>
                            )}
                            {isOwn && m.sending && (
                              <span className="message-status" aria-live="polite">{t("messages.sending", "Sending…")}</span>
                            )}
                            {isOwn && !m.sending && m.failed && (
                              <button type="button" className="message-retry" onClick={() => retrySend(m)}>
                                {t("messages.retry", "Retry")}
                              </button>
                            )}
                            {isOwn && !m.sending && !m.failed && m.read_at && (
                              <span className="message-status read" title={t("messages.read", "Read")}>✓✓</span>
                            )}
                          </div>
                        </div>
                      </Fragment>
                    );
                  })
                )}
              </div>
              <form className="message-composer" onSubmit={handleSend}>
                {pendingFile && (
                  <div className="composer-attachment">
                    {pendingFile.file.type?.startsWith("image/") && pendingFile.objectUrl ? (
                      <img className="composer-attachment-thumb" src={pendingFile.objectUrl} alt={pendingFile.file.name} />
                    ) : (
                      <span className="composer-attachment-icon" aria-hidden="true">📄</span>
                    )}
                    <div className="composer-attachment-info">
                      <span className="composer-attachment-name">{pendingFile.file.name}</span>
                      {typeof pendingFile.progress === "number" && pendingFile.progress < 100 && sending && (
                        <div className="composer-attachment-progress" role="progressbar" aria-valuenow={pendingFile.progress} aria-valuemin={0} aria-valuemax={100}>
                          <i style={{ width: `${pendingFile.progress}%` }} />
                          <span>{pendingFile.progress}%</span>
                        </div>
                      )}
                      {sending && pendingFile.progress >= 100 && (
                        <span className="composer-attachment-uploading">{t("attachments.uploading", "Uploading…")}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="composer-attachment-remove"
                      onClick={clearPendingFile}
                      disabled={sending}
                      aria-label={t("attachments.remove_file", "Remove file")}
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div className="composer-row">
                  <>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleFileSelect}
                      data-testid="photo-input"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      onChange={handleFileSelect}
                      data-testid="file-input"
                    />
                    <button
                      type="button"
                      className="composer-attach-btn"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={sending || !!pendingFile}
                      aria-label={t("attachments.attach_photo", "Attach photo")}
                    >
                      📷
                    </button>
                    <button
                      type="button"
                      className="composer-attach-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || !!pendingFile}
                      aria-label={t("attachments.attach_file", "Attach file")}
                    >
                      📎
                    </button>
                  </>
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.form.requestSubmit(); }}
                    placeholder={t("messages.type_message", "Type a message...")}
                    aria-label={t("messages.type_message", "Type a message...")}
                    disabled={sending}
                  />
                  <button type="submit" className="btn-primary" disabled={sending || (!draft.trim() && !pendingFile)}>
                    {sending ? t("messages.sending", "Sending…") : t("messages.send", "Send")}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>

        {newTicketOpen && <NewTicketModal onClose={() => setNewTicketOpen(false)} onCreated={handleTicketCreated} />}

        <ConfirmDialog
          open={confirmAction === "close"}
          title={t("support.close_confirm_title", "Close this ticket?")}
          message={t("support.close_confirm_text", "This will mark the ticket as closed. You can reopen it later.")}
          confirmLabel={t("support.close_ticket", "Close ticket")}
          loading={busy}
          onConfirm={closeTicket}
          onCancel={() => setConfirmAction(null)}
        />
        <ConfirmDialog
          open={confirmAction === "reopen"}
          title={t("support.reopen_confirm_title", "Reopen this ticket?")}
          message={t("support.reopen_confirm_text", "The ticket status will change back to open.")}
          confirmLabel={t("support.reopen_ticket", "Reopen")}
          tone="active"
          loading={busy}
          onConfirm={reopenTicket}
          onCancel={() => setConfirmAction(null)}
        />
      </div>
  );
}
