import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { CONVERSATION_TYPES } from "../../../constants/roles";
import { EmptyState, Spinner, ErrorState } from "../../../components/ui/Primitives";
import { safeDisplayName, initials, avatarColor, previewText, isUnread } from "../utils/messageHelpers";
import type { ConversationDTO } from "../../../types/api";

function TgAvatar({ name, size = 44 }: { name: unknown; size?: number }): JSX.Element {
  const bg = avatarColor(name);
  return (
    <span className="tg-avatar" style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export interface ConversationListProps {
  conversations: ConversationDTO[];
  activeConvo: ConversationDTO | null;
  setActiveConvo: (c: ConversationDTO | null) => void;
  filter: string;
  setFilter: (f: string) => void;
  query: string;
  setQuery: (q: string) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onNewTicket: () => void;
}

export function ConversationList({
  conversations,
  activeConvo,
  setActiveConvo,
  filter,
  setFilter,
  query,
  setQuery,
  loading,
  error,
  onRetry,
  onNewTicket,
}: ConversationListProps): JSX.Element {
  const { t } = useTranslation();

  const filtered = conversations.filter((c) => {
    if (filter !== "all" && (c as Record<string, unknown>)["type"] !== filter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const name = String((c as Record<string, unknown>)["counterpart_name"] ?? (c as Record<string, unknown>)["name"] ?? "").toLowerCase();
    const preview = previewText(c as unknown as Record<string, unknown>, t as (k: string) => string).toLowerCase();
    return name.includes(q) || preview.includes(q);
  });

  return (
    <aside className="tg-sidebar" aria-label={t("messages.conversations", "Conversations")}>
      <div className="tg-sidebar__header">
        <h2 className="tg-sidebar__title">{t("messages.title", "Messages")}</h2>
        <button type="button" className="tg-btn tg-btn--primary tg-btn--sm" onClick={onNewTicket}>{t("messages.new_ticket", "New ticket")}</button>
      </div>

      <div className="tg-search">
        <Search size={16} className="tg-search__icon" />
        <input
          type="search"
          placeholder={t("messages.search_placeholder", "Search") as string}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="tg-search__input"
        />
      </div>

      <div className="tg-chips" role="tablist">
        <button type="button" className={`tg-chip ${filter === "all" ? "tg-chip--active" : ""}`} onClick={() => setFilter("all")}>{t("messages.all", "All")}</button>
        <button type="button" className={`tg-chip ${filter === CONVERSATION_TYPES.DIRECT ? "tg-chip--active" : ""}`} onClick={() => setFilter(CONVERSATION_TYPES.DIRECT)}>{t("messages.direct", "Chat")}</button>
        <button type="button" className={`tg-chip ${filter === CONVERSATION_TYPES.SUPPORT ? "tg-chip--active" : ""}`} onClick={() => setFilter(CONVERSATION_TYPES.SUPPORT)}>{t("messages.support", "Support")}</button>
      </div>

      <div className="tg-convo-list" role="list">
        {loading ? <Spinner label={t("common.loading", "Loading...") as string} />
        : error ? <ErrorState message={error} onRetry={onRetry} />
        : filtered.length === 0 ? <EmptyState title={t("messages.no_conversations", "No conversations") as string} />
        : filtered.map((c) => {
          const active = activeConvo?.id === c.id;
          const rec = c as unknown as Record<string, unknown>;
          return (
          <button key={String(c.id)} type="button" role="listitem" className={`tg-convo ${active ? "tg-convo--active" : ""} ${rec["type"] === CONVERSATION_TYPES.SUPPORT ? "tg-convo--support" : ""}`} onClick={() => setActiveConvo(c)}>
            <TgAvatar name={safeDisplayName(rec["counterpart_name"] ?? rec["name"], t as (k: string, f: string) => string)} size={40} />
            <div className="tg-convo__main">
              <div className="tg-convo__top">
                <span className="tg-convo__name">{safeDisplayName(rec["counterpart_name"] ?? rec["name"], t as (k: string, f: string) => string)}</span>
                <span className="tg-convo__time">{rec["updated_at"] ? new Date(rec["updated_at"] as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
              </div>
              <div className="tg-convo__preview">{previewText(rec, t as (k: string) => string)}</div>
            </div>
            <span className={`tg-convo__dot ${rec["type"] === CONVERSATION_TYPES.SUPPORT ? "tg-convo__dot--support" : isUnread(rec) ? "tg-convo__dot--unread" : ""}`} aria-hidden="true" />
          </button>
        )})}
      </div>
    </aside>
  );
}
