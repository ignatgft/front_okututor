import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import type { HttpResult } from "./client/responseParser";
import type { LessonDTOBase } from "../types/api";

export const lessonsApi = {
  list: (params = "?page=0&size=100"): Promise<HttpResult<unknown>> =>
    apiClient.get(`${endpoints.lessons.list}${params}`),

  byId: (id: string | number): Promise<HttpResult<LessonDTOBase>> =>
    apiClient.get<LessonDTOBase>(endpoints.lessons.byId(id)),

  dto: (id: string | number): Promise<HttpResult<LessonDTOBase>> =>
    apiClient.get<LessonDTOBase>(endpoints.lessons.dto(id)),

  create: (payload: Record<string, unknown>): Promise<HttpResult<LessonDTOBase>> =>
    apiClient.post<LessonDTOBase>(endpoints.lessons.create, payload),

  start: (id: string | number): Promise<HttpResult<LessonDTOBase>> =>
    apiClient.post<LessonDTOBase>(endpoints.lessons.start(id)),

  complete: (id: string | number): Promise<HttpResult<LessonDTOBase>> =>
    apiClient.post<LessonDTOBase>(endpoints.lessons.complete(id)),

  cancel: (id: string | number, reason?: string): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.cancel(id), reason ? { reason } : {}),

  studentNoShow: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.studentNoShow(id)),

  tutorNoShow: (id: string | number, reason?: string): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.tutorNoShow(id), reason ? { reason } : {}),

  issue: (id: string | number, reason?: string): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.issue(id), reason ? { reason } : {}),

  join: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.join(id)),

  review: (id: string | number, payload: Record<string, unknown>): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.review(id), payload),

  details: (id: string | number, payload: Record<string, unknown>): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.details(id), payload),

  // pending flows
  reschedulePropose: (id: string | number, payload: Record<string, unknown>): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.reschedulePropose(id), payload),

  rescheduleAccept: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.rescheduleAccept(id)),

  rescheduleReject: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.rescheduleReject(id)),

  reschedule: (id: string | number, payload: Record<string, unknown>): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.reschedule(id), payload),

  formatPropose: (id: string | number, payload: Record<string, unknown>): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.formatPropose(id), payload),

  formatAccept: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.formatAccept(id)),

  formatReject: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.formatReject(id)),

  locationPropose: (id: string | number, payload: Record<string, unknown>): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.locationPropose(id), payload),

  locationAccept: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.locationAccept(id)),

  locationReject: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.locationReject(id)),

  durationPropose: (id: string | number, payload: Record<string, unknown>): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.durationPropose(id), payload),

  durationAccept: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.durationAccept(id)),

  durationReject: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.lessons.durationReject(id)),
};
