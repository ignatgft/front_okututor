// migrated to TSX — minimal strict types (controlled)
import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import useSupportTicket from "../hooks/support/useSupportTicket";
import useSupportChat from "../hooks/support/useSupportChat";
import { supportApi } from "../api/support.api";
import DashboardLayout from "../components/DashboardLayout";
import SupportTicketHeader from "../components/support/SupportTicketHeader";
import SupportMessage from "../components/support/SupportMessage";
import SupportMessageInput from "../components/support/SupportMessageInput";
import SupportTicketStatus from "../components/support/SupportTicketStatus";
import SupportTicketCategory from "../components/support/SupportTicketCategory";
import SupportTicketPriority from "../components/support/SupportTicketPriority";
import ConfirmModal from "../components/ui/ConfirmModal";
import { Spinner, ErrorState } from "../components/ui/Primitives";
import { useToast } from "../components/ui/Toast";
import "../styles/Support.css";

export default function PgSupportTicket() {
  const { t } = useTranslation();
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const toast = useToast();
  const { ticket, loading: ticketLoading, error: ticketError, refetch: refetchTicket } = useSupportTicket(ticketId);
  const { messages, loading: msgsLoading, sendMessage, markRead } = useSupportChat(ticketId);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);
  const [showNewMessageBtn, setShowNewMessageBtn] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    markRead();
  }, [markRead]);

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
      const { response } = await supportApi.close(ticketId);
      if (response.ok) {
        toast?.success(t("support.ticket_closed", "Ticket closed"));
        refetchTicket();
      } else {
        toast?.error(t("support.close_failed", "Failed to close ticket"));
      }
    } catch {
      toast?.error(t("support.close_failed", "Failed to close ticket"));
    } finally {
      setClosing(false);
      setShowCloseDialog(false);
    }
  };

  const handleReopen = async () => {
    try {
      const { response } = await supportApi.reopen(ticketId);
      if (response.ok) {
        toast?.success(t("support.ticket_reopened", "Ticket reopened"));
        refetchTicket();
      } else {
        toast?.error(t("support.reopen_failed", "Failed to reopen ticket"));
      }
    } catch {
      toast?.error(t("support.reopen_failed", "Failed to reopen ticket"));
    }
  };

  if (ticketLoading) {
    return (
      <DashboardLayout>
        <Spinner label={t("common.loading", "Loading...")} />
      </DashboardLayout>
    );
  }

  if (ticketError === "NOT_FOUND") {
    return (
      <DashboardLayout>
        <div className="support-page">
          <ErrorState message={t("support.not_found", "Ticket not found")} onRetry={() => navigate("/support")} />
        </div>
      </DashboardLayout>
    );
  }

  if (ticketError === "FORBIDDEN") {
    return (
      <DashboardLayout>
        <ErrorState message={t("support.no_access", "You don't have access to this ticket")} onRetry={() => navigate("/support")} />
      </DashboardLayout>
    );
  }

  if (ticketError) {
    return (
      <DashboardLayout>
        <ErrorState message={t("support.load_error", "Failed to load ticket")} onRetry={refetchTicket} />
      </DashboardLayout>
    );
  }

  const isClosed = ticket?.status === "CLOSED" || ticket?.status === "RESOLVED";

  return (
    <DashboardLayout>
      <div className="support-page support-ticket-page">
        <SupportTicketHeader
          ticket={ticket}
          onReopen={handleReopen}
          onCloseDialog={() => setShowCloseDialog(true)}
        />

        <div className="support-ticket-meta">
          <SupportTicketStatus status={ticket?.status} />
          <SupportTicketCategory category={ticket?.category} />
          <SupportTicketPriority priority={ticket?.priority} />
          {ticket?.assigned_admin_name && (
            <span className="support-assigned">{t("support.assigned_to", "Assigned to {{name}}", { name: ticket.assigned_admin_name })}</span>
          )}
        </div>

        <div
          className="support-chat-container"
          ref={chatContainerRef}
          onScroll={handleScroll}
          role="log"
          aria-label={t("support.chat", "Chat")}
          aria-live="polite"
        >
          {msgsLoading && <Spinner label={t("common.loading", "Loading...")} />}

          {!msgsLoading && messages.map(msg => (
            <SupportMessage
              key={msg.id}
              message={msg}
              currentUserId={user?.id}
            />
          ))}

          <div ref={messagesEndRef} />
        </div>

        {showNewMessageBtn && (
          <button
            type="button"
            className="support-scroll-down-btn"
            onClick={() => { scrollToBottom(true); setShowNewMessageBtn(false); }}
          >
            {t("support.new_messages", "New messages ↓")}
          </button>
        )}

        {isClosed ? (
          <div className="support-closed-banner">
            {t("support.ticket_closed_banner", "This ticket is closed")}
          </div>
        ) : (
          <SupportMessageInput
            onSend={(body) => sendMessage(body)}
            placeholder={t("support.type_message", "Type your message...")}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={showCloseDialog}
        title={t("support.close_confirm_title", "Close ticket?")}
        message={t("support.close_confirm_message", "Are you sure you want to close this ticket? You can reopen it later if needed.")}
        confirmLabel={t("support.close_ticket", "Close ticket")}
        cancelLabel={t("common.cancel", "Cancel")}
        loading={closing}
        danger={false}
        onConfirm={handleClose}
        onCancel={() => setShowCloseDialog(false)}
      />
    </DashboardLayout>
  );
}
