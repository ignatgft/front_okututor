import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import type { HttpResult } from "./client/responseParser";
import type { SupportTicketDTO, SupportMessageDTO } from "../types/api";

export const supportApi = {
  createTicket: (payload: Record<string, unknown>): Promise<HttpResult<SupportTicketDTO>> =>
    apiClient.post<SupportTicketDTO>(endpoints.support.tickets, payload),

  getTickets: (params = ""): Promise<HttpResult<SupportTicketDTO[] | unknown>> =>
    apiClient.get(`${endpoints.support.tickets}${params}`),

  getTicket: (id: string | number): Promise<HttpResult<SupportTicketDTO>> =>
    apiClient.get<SupportTicketDTO>(endpoints.support.ticket(id)),

  getMessages: (
    id: string | number,
    params = ""
  ): Promise<HttpResult<SupportMessageDTO[] | unknown>> =>
    apiClient.get(`${endpoints.support.messages(id)}${params}`),

  sendMessage: (
    id: string | number,
    payload: Record<string, unknown>
  ): Promise<HttpResult<unknown>> => apiClient.post(endpoints.support.send(id), payload),

  markRead: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.support.markRead(id)),

  close: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.support.close(id)),

  reopen: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.support.reopen(id)),
};

export const adminSupportApi = {
  getTickets: (params = ""): Promise<HttpResult<unknown>> =>
    apiClient.get(`${endpoints.adminSupport.tickets}${params}`),

  getTicket: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.get(endpoints.adminSupport.ticket(id)),

  assign: (
    id: string | number,
    payload: Record<string, unknown> = {}
  ): Promise<HttpResult<unknown>> => apiClient.post(endpoints.adminSupport.assign(id), payload),

  take: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.adminSupport.take(id)),

  updateStatus: (id: string | number, status: string): Promise<HttpResult<unknown>> =>
    apiClient.put(endpoints.adminSupport.status(id), { status }),

  updatePriority: (id: string | number, priority: string): Promise<HttpResult<unknown>> =>
    apiClient.put(endpoints.adminSupport.priority(id), { priority }),

  sendMessage: (id: string | number, payload: Record<string, unknown>): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.support.send(id), payload),

  getAgents: (): Promise<HttpResult<unknown>> => apiClient.get(endpoints.adminSupport.agents),
};
