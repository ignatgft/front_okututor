import { CONVERSATION_TYPES } from "../../../constants/roles";
import { STATUS_I18N, PRIORITY_I18N } from "../../../constants/support";
import { isSameDay, isToday } from "../../../utils/date";

export function safeDisplayName(name: unknown, t: (k: string, f: string) => string): string {
  const trimmed = (String(name ?? "")).replace(/\s+/g, " ").trim();
  if (!trimmed || trimmed.length < 2) return t("messages.unknown", "Unknown user");
  return trimmed;
}

export function initials(name: unknown): string {
  const parts = (String(name ?? "")).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function avatarColor(name: unknown): string {
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57", "#A29BFE", "#FD79A8", "#FDCB6E", "#6C5CE7", "#00B894"];
  let hash = 0;
  const str = String(name ?? "");
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return colors[hash % colors.length];
}

export function formatChatTime(raw: unknown, locale = "ru"): string {
  if (!raw) return "";
  const d = new Date(raw as string);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function dayLabel(raw: unknown, locale = "ru", t?: (k: string, f: string) => string): string {
  if (!raw) return "";
  const d = new Date(raw as string);
  if (Number.isNaN(d.getTime())) return "";
  if (isToday(d)) return t ? t("messages.today", "Today") : "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(d, yesterday)) return t ? t("messages.yesterday", "Yesterday") : "Yesterday";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function previewText(c: Record<string, unknown>, t: (k: string, f?: string) => string): string {
  if (c["type"] === CONVERSATION_TYPES.SUPPORT) {
    if (c["ticket_status"]) {
      const sk = STATUS_I18N[c["ticket_status"] as string] ? t(STATUS_I18N[c["ticket_status"] as string] as string) : c["ticket_status"] as string;
      const pk = c["ticket_priority"] && PRIORITY_I18N[c["ticket_priority"] as string] ? ` · ${t(PRIORITY_I18N[c["ticket_priority"] as string] as string)}` : "";
      return `${sk}${pk}`;
    }
    return t("messages.support", "Support");
  }
  const last = c["last_message"] as Record<string, unknown> | undefined;
  return (last?.["body"] as string | undefined) ?? (last?.["text"] as string | undefined) ?? "";
}

export function isUnread(c: Record<string, unknown>): boolean {
  return Number(c["unread_count"] ?? 0) > 0;
}

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
export const POLL_INTERVAL = 5000;
