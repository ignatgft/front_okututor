import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { uploadFile } from "./client/upload";
import { CONVERSATION_TYPES } from "../constants/roles";
import type { HttpResult } from "./client/responseParser";
import type { ConversationDTO, MessageDTO, NotificationDTO } from "../types/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export const messagesApi = {
  conversations: (): Promise<HttpResult<unknown>> => apiClient.get(endpoints.messages.conversations),

  conversation: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.get(endpoints.messages.conversation(id)),

  send: (payload: Record<string, unknown>): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.messages.send, payload),

  uploadAttachment: (file: File, onProgress?: (p: number) => void): Promise<HttpResult<unknown>> =>
    uploadFile({ endpoint: endpoints.messages.attachments, file, onProgress }),

  // Reactions
  addReaction: (messageId: string | number, emoji: string): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.messages.reaction(messageId), { emoji }),

  removeReaction: (messageId: string | number, emoji: string): Promise<HttpResult<unknown>> =>
    apiClient.delete(`${endpoints.messages.reaction(messageId)}?emoji=${encodeURIComponent(emoji)}`),

  getReactions: (messageId: string | number): Promise<HttpResult<unknown>> =>
    apiClient.get(endpoints.messages.reactions(messageId)),

  // Replies
  reply: (
    messageId: string | number,
    body: string,
    attachmentId?: string | number | null
  ): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.messages.reply(messageId), { body, attachment_id: attachmentId }),

  // Edit message
  edit: (messageId: string | number, body: string): Promise<HttpResult<unknown>> =>
    apiClient.patch(endpoints.messages.edit(messageId), { body }),

  // Delete message
  delete: (messageId: string | number): Promise<HttpResult<unknown>> =>
    apiClient.delete(endpoints.messages.delete(messageId)),

  // Forward message
  forward: (messageId: string | number, conversationId: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.messages.forward(messageId), { conversation_id: conversationId }),

  // Mark conversation as read
  markConversationRead: (conversationId: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.messages.markRead(conversationId)),
};

export const notificationsApi = {
  list: (): Promise<HttpResult<NotificationDTO[] | unknown>> =>
    apiClient.get(endpoints.notifications.list),

  unreadCount: (): Promise<HttpResult<{ count: number } | unknown>> =>
    apiClient.get(endpoints.notifications.unreadCount),

  markRead: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.notifications.markRead(id)),

  markAllRead: (): Promise<HttpResult<unknown>> => apiClient.post(endpoints.notifications.markAllRead),
};

function mapTicketToConversation(ticket: Record<string, unknown>): ConversationDTO {
  return {
    id: `support-${String(ticket["id"])}`,
    type: CONVERSATION_TYPES.SUPPORT,
    counterpart_name: (ticket["subject"] as string | undefined) ?? `Ticket ${String(ticket["id"])}`,
    ticket_id: ticket["id"] as string | number,
    ticket_status: ticket["status"] as string | undefined,
    ticket_priority: ticket["priority"] as string | undefined,
    ticket_category: ticket["category"] as string | undefined,
    unread_count: (ticket["unread_count"] as number | undefined) ?? 0,
    last_message: (ticket["last_message"] as string | null | undefined) ?? null,
    updated_at: (ticket["updated_at"] as string | undefined) ?? (ticket["created_at"] as string | undefined),
  };
}

function extractList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data as unknown[];
  if (isRecord(data) && Array.isArray(data["content"])) return data["content"] as unknown[];
  return [];
}

export async function loadUnifiedConversations(): Promise<ConversationDTO[]> {
  const [convRes, ticketsRes] = await Promise.all([
    messagesApi.conversations().catch(() => ({ response: { ok: false } as unknown as Response, data: [] as unknown })),
    apiClient.get(endpoints.support.tickets).catch(() => ({ response: { ok: false } as unknown as Response, data: [] as unknown })),
  ]);

  const direct: ConversationDTO[] = convRes.response.ok
    ? extractList(convRes.data).map((c) => {
        const rec = isRecord(c) ? (c as Record<string, unknown>) : {};
        return {
          ...(c as Record<string, unknown>),
          type: (rec["type"] as string | undefined) ?? CONVERSATION_TYPES.DIRECT,
        } as ConversationDTO;
      })
    : [];

  const support: ConversationDTO[] = ticketsRes.response.ok
    ? extractList(ticketsRes.data).map((t) => mapTicketToConversation(t as Record<string, unknown>))
    : [];

  const all = [...direct, ...support].sort((a, b) => {
    const da = (a.updated_at as string | undefined) ?? "";
    const db = (b.updated_at as string | undefined) ?? "";
    return db.localeCompare(da);
  });

  return all;
}

export async function loadSupportThread(ticketId: string | number): Promise<MessageDTO[]> {
  const { response, data } = await apiClient.get<unknown>(endpoints.support.messages(ticketId));
  if (!response.ok) return [];
  if (Array.isArray(data)) return data as MessageDTO[];
  if (isRecord(data) && Array.isArray(data["messages"])) return data["messages"] as MessageDTO[];
  return [];
}

export async function sendSupportMessage(
  ticketId: string | number,
  body: string,
  attachmentId: string | number | null = null
): Promise<unknown> {
  const payload: Record<string, unknown> = { body };
  if (attachmentId) payload["attachment_id"] = attachmentId;
  const { response, data } = await apiClient.post(endpoints.support.send(ticketId), payload);
  if (!response.ok) {
    const rec = isRecord(data) ? (data as Record<string, unknown>) : null;
    const msg = (rec?.["message"] as string | undefined) ?? "Failed to send";
    throw new Error(msg);
  }
  return data;
}
