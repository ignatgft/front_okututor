import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { usePageTitle } from "../components/pageTitleContext";
import useAuthStore from "../store/authStore";
import { loadUnifiedConversations, loadSupportThread, sendSupportMessage, messagesApi } from "../api/messages.api";
import { CONVERSATION_TYPES } from "../constants/roles";
import { Spinner, EmptyState, ErrorState, Badge } from "../components/ui/Primitives";
import { useToast } from "../components/ui/Toast";
import { isSameDay, isToday } from "../utils/date";
import "../styles/Messages.css";

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

function SupportThreadHeader({ conversation }) {
  return (
    <div className="support-thread-header">
      <span className="support-thread-subject">{conversation.counterpart_name}</span>
      <div className="support-thread-meta">
        <Badge status={conversation.ticket_status === "RESOLVED" ? "completed" : conversation.ticket_status}>
          {conversation.ticket_status}
        </Badge>
        {conversation.ticket_priority && (
          <Badge status={conversation.ticket_priority === "HIGH" || conversation.ticket_priority === "URGENT" ? "cancelled" : "active"}>
            {conversation.ticket_priority}
          </Badge>
        )}
        {conversation.ticket_category && (
          <span className="support-thread-category">{conversation.ticket_category}</span>
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

  const handleSend = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !activeConvo) return;

    const optimistic = {
      id: `tmp-${++tempIdRef.current}`,
      body,
      sender_id: user?.id,
      own: true,
      sending: true,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    setSending(true);
    try {
      if (activeConvo.type === CONVERSATION_TYPES.SUPPORT) {
        await sendSupportMessage(activeConvo.ticket_id, body);
        const msgs = await loadSupportThread(activeConvo.ticket_id);
        setMessages(msgs);
      } else {
        await messagesApi.send({ conversation_id: activeConvo.id, body });
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
    }
  };

  const retrySend = async (m) => {
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, sending: true, failed: false } : x)));
    try {
      if (activeConvo.type === CONVERSATION_TYPES.SUPPORT) {
        await sendSupportMessage(activeConvo.ticket_id, m.body);
        const msgs = await loadSupportThread(activeConvo.ticket_id);
        setMessages(msgs);
      } else {
        await messagesApi.send({ conversation_id: activeConvo.id, body: m.body });
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
                <SupportThreadHeader conversation={activeConvo} />
              ) : (
                <div className="thread-header">
                  <span className="thread-counterpart">{safeDisplayName(activeConvo.counterpart_name || activeConvo.name || "", t)}</span>
                </div>
              )}
              <div className="thread-messages" ref={threadRef}>
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
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.form.requestSubmit(); }}
                  placeholder={t("messages.type_message", "Type a message...")}
                  aria-label={t("messages.type_message", "Type a message...")}
                  disabled={sending}
                />
                <button type="submit" className="btn-primary" disabled={sending || !draft.trim()}>
                  {sending ? t("messages.sending", "Sending…") : t("messages.send", "Send")}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
  );
}
