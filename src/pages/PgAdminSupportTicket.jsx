import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import useSupportTicket from "../hooks/support/useSupportTicket";
import useSupportChat from "../hooks/support/useSupportChat";
import { adminSupportApi } from "../api/support.api";
import { usePageTitle } from "../components/pageTitleContext";
import SupportMessage from "../components/support/SupportMessage";
import SupportMessageInput from "../components/support/SupportMessageInput";
import SupportTicketStatus from "../components/support/SupportTicketStatus";
import SupportTicketCategory from "../components/support/SupportTicketCategory";
import SupportTicketPriority from "../components/support/SupportTicketPriority";
import AdminSupportAssignment from "../components/admin/support/AdminSupportAssignment";
import AdminSupportActions from "../components/admin/support/AdminSupportActions";
import AdminSupportInternalNote from "../components/admin/support/AdminSupportInternalNote";
import ConfirmModal from "../components/ui/ConfirmModal";
import { Spinner, ErrorState } from "../components/ui/Primitives";
import { useToast } from "../components/ui/Toast";
import "../styles/AdminSupport.css";

export default function PgAdminSupportTicket() {
  const { t } = useTranslation();
  const setPageTitle = usePageTitle();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const toast = useToast();
  const { ticket, loading: ticketLoading, error: ticketError, refetch: refetchTicket } = useSupportTicket(id);
  const { messages, loading: msgsLoading, sendMessage, markRead, refetch: refetchMsgs } = useSupportChat(id);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);
  const [showNewMessageBtn, setShowNewMessageBtn] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closing, setClosing] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");

  useEffect(() => { markRead(); }, [markRead]);
  useEffect(() => { setPageTitle(t("support.ticket", "Ticket")); }, [setPageTitle, t]);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
    }
  }, []);

  useEffect(() => {
    if (isUserNearBottom) scrollToBottom(true);
    else setShowNewMessageBtn(true);
  }, [messages.length, isUserNearBottom, scrollToBottom]);

  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setIsUserNearBottom(nearBottom);
    if (nearBottom) setShowNewMessageBtn(false);
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      const { response } = await adminSupportApi.updateStatus(id, "CLOSED");
      if (response.ok) {
        toast?.success(t("support.ticket_closed", "Ticket closed"));
        refetchTicket();
      }
    } catch { toast?.error(t("support.close_failed", "Failed")); }
    finally { setClosing(false); setShowCloseDialog(false); }
  };

  const handleReopen = async () => {
    try {
      const { response } = await adminSupportApi.updateStatus(id, "OPEN");
      if (response.ok) {
        toast?.success(t("support.ticket_reopened", "Ticket reopened"));
        refetchTicket();
      }
    } catch { toast?.error(t("support.reopen_failed", "Failed")); }
  };

  const handleSendUserMessage = async (body) => {
    await sendMessage(body, "USER_VISIBLE");
  };

  const handleSendInternalNote = async (body, type) => {
    await sendMessage(body, type);
  };

  const handleRefreshAll = () => {
    refetchTicket();
    refetchMsgs();
  };

  if (ticketLoading) return <Spinner label={t("common.loading", "Loading...")} />;
  if (ticketError) return <ErrorState message={t("support.load_error", "Failed to load ticket")} onRetry={() => navigate("/admin/support")} />;

  const isClosed = ticket?.status === "CLOSED" || ticket?.status === "RESOLVED";

  return (
    <>
      <div className="admin-support-ticket-page">
        <div className="admin-support-ticket-header">
          <button type="button" className="btn-secondary" onClick={() => navigate("/admin/support")}>
            {t("common.back", "Back")}
          </button>
          <span className="support-ticket-id">{ticket?.id}</span>
          <h2 className="admin-support-ticket-subject">{ticket?.subject}</h2>
          <div className="admin-support-ticket-actions">
            {isClosed ? (
              <button type="button" className="btn-primary" onClick={handleReopen}>{t("support.reopen", "Reopen")}</button>
            ) : (
              <button type="button" className="btn-secondary" onClick={() => setShowCloseDialog(true)}>{t("support.close_ticket", "Close")}</button>
            )}
          </div>
        </div>

        <div className="admin-support-ticket-layout">
          <div className="admin-support-ticket-chat-area">
            <div className="admin-support-chat-tabs">
              <button
                type="button"
                className={`admin-support-chat-tab ${activeTab === "chat" ? "admin-support-chat-tab--active" : ""}`}
                onClick={() => setActiveTab("chat")}
              >
                {t("support.chat", "Chat")}
              </button>
              <button
                type="button"
                className={`admin-support-chat-tab ${activeTab === "note" ? "admin-support-chat-tab--active" : ""}`}
                onClick={() => setActiveTab("note")}
              >
                {t("support.internal_note", "Internal note")}
              </button>
            </div>

            <div className="support-chat-container" ref={chatContainerRef} onScroll={handleScroll} role="log" aria-live="polite">
              {msgsLoading && <Spinner label={t("common.loading", "Loading...")} />}
              {!msgsLoading && messages.map(msg => (
                <SupportMessage key={msg.id} message={msg} currentUserId={user?.id} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {showNewMessageBtn && (
              <button type="button" className="support-scroll-down-btn" onClick={() => { scrollToBottom(true); setShowNewMessageBtn(false); }}>
                {t("support.new_messages", "New messages ↓")}
              </button>
            )}

            {isClosed ? (
              <div className="support-closed-banner">{t("support.ticket_closed_banner", "This ticket is closed")}</div>
            ) : activeTab === "chat" ? (
              <SupportMessageInput onSend={handleSendUserMessage} />
            ) : (
              <AdminSupportInternalNote onSend={handleSendInternalNote} />
            )}
          </div>

          <div className="admin-support-ticket-sidebar">
            <div className="admin-support-sidebar-section">
              <SupportTicketStatus status={ticket?.status} />
              <SupportTicketCategory category={ticket?.category} />
              <SupportTicketPriority priority={ticket?.priority} />
            </div>

            <div className="admin-support-sidebar-section">
              <div className="admin-support-sidebar-label">{t("support.user", "User")}</div>
              <div className="admin-support-sidebar-value">{ticket?.user?.name}</div>
              <div className="admin-support-sidebar-email">{ticket?.user?.email}</div>
            </div>

            <div className="admin-support-sidebar-section">
              <AdminSupportActions ticket={ticket} onUpdated={handleRefreshAll} />
            </div>

            <div className="admin-support-sidebar-section">
              <AdminSupportAssignment ticket={ticket} onAssigned={handleRefreshAll} />
            </div>

            <div className="admin-support-sidebar-section">
              <div className="admin-support-sidebar-label">{t("support.created", "Created")}</div>
              <div className="admin-support-sidebar-value">{ticket?.created_at ? new Date(ticket.created_at).toLocaleString() : "-"}</div>
              <div className="admin-support-sidebar-label">{t("support.updated", "Updated")}</div>
              <div className="admin-support-sidebar-value">{ticket?.updated_at ? new Date(ticket.updated_at).toLocaleString() : "-"}</div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showCloseDialog}
        title={t("support.close_confirm_title", "Close ticket?")}
        message={t("support.close_confirm_message", "Are you sure you want to close this ticket?")}
        confirmLabel={t("support.close_ticket", "Close ticket")}
        loading={closing}
        danger={false}
        onConfirm={handleClose}
        onCancel={() => setShowCloseDialog(false)}
      />
    </>
  );
}
