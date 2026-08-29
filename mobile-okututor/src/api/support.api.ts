import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { ApiResult } from "./types";
import { SupportTicket } from "../types/support";

export const supportApi = {
  createTicket: (payload: Record<string, unknown>): ApiResult<SupportTicket> =>
    apiClient.post(endpoints.support.tickets, payload),

  getTickets: (params = ""): ApiResult<SupportTicket[]> =>
    apiClient.get(`${endpoints.support.tickets}${params}`),

  getTicket: (id: string | number): ApiResult<SupportTicket> =>
    apiClient.get(endpoints.support.ticket(id)),

  getMessages: (id: string | number, params = ""): ApiResult<unknown> =>
    apiClient.get(`${endpoints.support.messages(id)}${params}`),

  sendMessage: (id: string | number, payload: Record<string, unknown>): ApiResult<unknown> =>
    apiClient.post(endpoints.support.send(id), payload),

  markRead: (id: string | number): ApiResult<unknown> =>
    apiClient.post(endpoints.support.markRead(id)),

  close: (id: string | number): ApiResult<unknown> => apiClient.post(endpoints.support.close(id)),

  reopen: (id: string | number): ApiResult<unknown> => apiClient.post(endpoints.support.reopen(id)),
};

export const adminSupportApi = {
  getTickets: (params = ""): ApiResult<unknown> =>
    apiClient.get(`${endpoints.adminSupport.tickets}${params}`),
  getTicket: (id: string | number): ApiResult<unknown> =>
    apiClient.get(endpoints.adminSupport.ticket(id)),
  assign: (id: string | number, payload: Record<string, unknown>): ApiResult<unknown> =>
    apiClient.post(endpoints.adminSupport.assign(id), payload || {}),
  take: (id: string | number): ApiResult<unknown> => apiClient.post(endpoints.adminSupport.take(id)),
  updateStatus: (id: string | number, status: string): ApiResult<unknown> =>
    apiClient.put(endpoints.adminSupport.status(id), { status }),
  updatePriority: (id: string | number, priority: string): ApiResult<unknown> =>
    apiClient.put(endpoints.adminSupport.priority(id), { priority }),
  sendMessage: (id: string | number, payload: Record<string, unknown>): ApiResult<unknown> =>
    apiClient.post(endpoints.support.send(id), payload),
  getAgents: (): ApiResult<unknown> => apiClient.get(endpoints.adminSupport.agents),
};