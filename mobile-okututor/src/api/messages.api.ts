import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { ApiResult } from "./types";
import { CONVERSATION_TYPES } from "../constants/roles";
import { Conversation, Message, SendMessagePayload } from "../types/message";
import { MaybePaginated, toList } from "../types/api";
import { AppNotification } from "../types/tutor";

export const messagesApi = {
  conversations: (): ApiResult<MaybePaginated<Conversation>> =>
    apiClient.get(endpoints.messages.conversations),
  conversation: (id: string | number): ApiResult<MaybePaginated<Message>> =>
    apiClient.get(endpoints.messages.conversation(id)),
  send: (payload: SendMessagePayload): ApiResult<Message> =>
    apiClient.post(endpoints.messages.send, payload),
};

export const notificationsApi = {
  list: (): ApiResult<MaybePaginated<AppNotification>> => apiClient.get(endpoints.notifications.list),
  unreadCount: (): ApiResult<{ count: number }> => apiClient.get(endpoints.notifications.unreadCount),
  markRead: (id: string | number): ApiResult<unknown> =>
    apiClient.post(endpoints.notifications.markRead(id)),
  markAllRead: (): ApiResult<unknown> => apiClient.post(endpoints.notifications.markAllRead),
};

function mapTicketToConversation(ticket: Record<string, unknown>): Conversation {
  return {
    id: `support-${String(ticket.id)}`,
    type: CONVERSATION_TYPES.SUPPORT,
    counterpart_name: (ticket.subject as string) || `Ticket ${String(ticket.id)}`,
    ticket_id: ticket.id as string | number,
    ticket_status: ticket.status as string,
    ticket_priority: ticket.priority as string,
    ticket_category: ticket.category as string,
    unread_count: (ticket.unread_count as number) || 0,
    last_message: (ticket.last_message as string) || null,
    updated_at: (ticket.updated_at as string) || (ticket.created_at as string),
  };
}

export async function loadUnifiedConversations(): Promise<Conversation[]> {
  const [convRes, ticketsRes] = await Promise.all([
    messagesApi.conversations().catch(() => ({ response: { ok: false }, data: null })),
    apiClient.get(endpoints.support.tickets).catch(() => ({ response: { ok: false }, data: null })),
  ]);

  const direct = convRes.response.ok
    ? toList<Conversation>(convRes.data as MaybePaginated<Conversation>).map((c) => ({
        ...c,
        type: c.type || CONVERSATION_TYPES.DIRECT,
      }))
    : [];

  const support = ticketsRes.response.ok
    ? toList<Record<string, unknown>>(ticketsRes.data as MaybePaginated<Record<string, unknown>>).map(mapTicketToConversation)
    : [];

  const all = [...direct, ...support].sort((a, b) => {
    const da = a.updated_at || "";
    const db = b.updated_at || "";
    return db.localeCompare(da);
  });

  return all;
}

export async function loadSupportThread(ticketId: string | number): Promise<Message[]> {
  const { response, data } = await apiClient.get<unknown>(endpoints.support.messages(ticketId));
  if (!response.ok) return [];
  if (Array.isArray(data)) return data as Message[];
  const messages = (data as { messages?: Message[] } | null)?.messages;
  return messages || [];
}

export async function sendSupportMessage(ticketId: string | number, body: string): Promise<unknown> {
  const { response, data } = await apiClient.post(endpoints.support.send(ticketId), { body });
  if (!response.ok) {
    const d = data as { message?: string } | null;
    throw new Error(d?.message || "Failed to send");
  }
  return data;
}