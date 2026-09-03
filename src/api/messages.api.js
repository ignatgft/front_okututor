import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { uploadFile } from "./client/upload";
import { CONVERSATION_TYPES } from "../constants/roles";

export const messagesApi = {
  conversations: () => apiClient.get(endpoints.messages.conversations),
  conversation: (id) => apiClient.get(endpoints.messages.conversation(id)),
  send: (payload) => apiClient.post(endpoints.messages.send, payload),
  uploadAttachment: (file, onProgress) =>
    uploadFile({ endpoint: endpoints.messages.attachments, file, onProgress }),
  // Reactions
  addReaction: (messageId, emoji) => apiClient.post(endpoints.messages.reaction(messageId), { emoji }),
  removeReaction: (messageId, emoji) => apiClient.delete(`${endpoints.messages.reaction(messageId)}?emoji=${encodeURIComponent(emoji)}`),
  getReactions: (messageId) => apiClient.get(endpoints.messages.reactions(messageId)),
  // Replies
  reply: (messageId, body, attachmentId) => apiClient.post(endpoints.messages.reply(messageId), { body, attachment_id: attachmentId }),
  // Edit message
  edit: (messageId, body) => apiClient.patch(endpoints.messages.edit(messageId), { body }),
  // Delete message
  delete: (messageId) => apiClient.delete(endpoints.messages.delete(messageId)),
  // Forward message
  forward: (messageId, conversationId) => apiClient.post(endpoints.messages.forward(messageId), { conversation_id: conversationId }),
  // Mark conversation as read
  markConversationRead: (conversationId) => apiClient.post(endpoints.messages.markRead(conversationId)),
};

export const notificationsApi = {
  list: () => apiClient.get(endpoints.notifications.list),
  unreadCount: () => apiClient.get(endpoints.notifications.unreadCount),
  markRead: (id) => apiClient.post(endpoints.notifications.markRead(id)),
  markAllRead: () => apiClient.post(endpoints.notifications.markAllRead),
};

function mapTicketToConversation(ticket) {
  return {
    id: `support-${ticket.id}`,
    type: CONVERSATION_TYPES.SUPPORT,
    counterpart_name: ticket.subject || `Ticket ${ticket.id}`,
    ticket_id: ticket.id,
    ticket_status: ticket.status,
    ticket_priority: ticket.priority,
    ticket_category: ticket.category,
    unread_count: ticket.unread_count || 0,
    last_message: ticket.last_message || null,
    updated_at: ticket.updated_at || ticket.created_at,
  };
}

export async function loadUnifiedConversations() {
  const [convRes, ticketsRes] = await Promise.all([
    messagesApi.conversations().catch(() => ({ response: { ok: false }, data: [] })),
    apiClient.get(endpoints.support.tickets).catch(() => ({ response: { ok: false }, data: [] })),
  ]);

  const direct = convRes.response.ok
    ? (Array.isArray(convRes.data) ? convRes.data : convRes.data.content || []).map((c) => ({
        ...c,
        type: c.type || CONVERSATION_TYPES.DIRECT,
      }))
    : [];

  const support = ticketsRes.response.ok
    ? (Array.isArray(ticketsRes.data) ? ticketsRes.data : ticketsRes.data.content || []).map(mapTicketToConversation)
    : [];

  const all = [...direct, ...support].sort((a, b) => {
    const da = a.updated_at || "";
    const db = b.updated_at || "";
    return db.localeCompare(da);
  });

  return all;
}

export async function loadSupportThread(ticketId) {
  const { response, data } = await apiClient.get(endpoints.support.messages(ticketId));
  if (!response.ok) return [];
  return Array.isArray(data) ? data : data.messages || [];
}

export async function sendSupportMessage(ticketId, body, attachmentId = null) {
  const payload = { body };
  if (attachmentId) payload.attachment_id = attachmentId;
  const { response, data } = await apiClient.post(endpoints.support.send(ticketId), payload);
  if (!response.ok) throw new Error(data.message || "Failed to send");
  return data;
}
