import { endpoints } from "./endpoints";
import { apiClient } from "./http";

export const supportApi = {
  createTicket: (payload) => apiClient.post(endpoints.support.tickets, payload),
  getTickets: (params = "") => apiClient.get(`${endpoints.support.tickets}${params}`),
  getTicket: (id) => apiClient.get(endpoints.support.ticket(id)),
  getMessages: (id, params = "") => apiClient.get(`${endpoints.support.messages(id)}${params}`),
  sendMessage: (id, payload) => apiClient.post(endpoints.support.send(id), payload),
  markRead: (id) => apiClient.post(endpoints.support.markRead(id)),
  close: (id) => apiClient.post(endpoints.support.close(id)),
  reopen: (id) => apiClient.post(endpoints.support.reopen(id)),
};

export const adminSupportApi = {
  getTickets: (params = "") => apiClient.get(`${endpoints.adminSupport.tickets}${params}`),
  getTicket: (id) => apiClient.get(endpoints.adminSupport.ticket(id)),
  assign: (id, payload) => apiClient.post(endpoints.adminSupport.assign(id), payload || {}),
  take: (id) => apiClient.post(endpoints.adminSupport.take(id)),
  updateStatus: (id, status) => apiClient.put(endpoints.adminSupport.status(id), { status }),
  updatePriority: (id, priority) => apiClient.put(endpoints.adminSupport.priority(id), { priority }),
  sendMessage: (id, payload) => apiClient.post(endpoints.support.send(id), payload),
  getAgents: () => apiClient.get(endpoints.adminSupport.agents),
};
