import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import type { HttpResult } from "./client/responseParser";
import type { EnrollmentDTO } from "../types/api";

export const enrollmentsApi = {
  byId: (id: string | number): Promise<HttpResult<EnrollmentDTO>> =>
    apiClient.get<EnrollmentDTO>(endpoints.enrollments.byId(id)),

  tutorRequests: (): Promise<HttpResult<unknown>> =>
    apiClient.get(endpoints.enrollments.tutorRequests),

  accept: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.enrollments.accept(id)),

  acceptAndSchedule: (id: string | number, payload: Record<string, unknown>): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.enrollments.acceptAndSchedule(id), payload),

  reject: (id: string | number, payload?: Record<string, unknown>): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.enrollments.reject(id), payload ?? {}),

  requestInfo: (
    id: string | number,
    payload: Record<string, unknown> = {}
  ): Promise<HttpResult<unknown>> => {
    const rec = payload as Record<string, unknown>;
    let body: Record<string, unknown>;
    if (rec["request"] !== undefined) body = payload;
    else if (typeof rec["question"] === "string") body = { request: rec["question"] as string };
    else body = payload;
    return apiClient.post(endpoints.enrollments.requestInfo(id), (body ?? {}) as Record<string, unknown>);
  },

  provideInfo: (
    id: string | number,
    payload: Record<string, unknown> = {}
  ): Promise<HttpResult<unknown>> => {
    const rec = payload as Record<string, unknown>;
    let body: Record<string, unknown>;
    if (typeof rec["message"] === "string") body = payload;
    else {
      const msg = (rec["request"] as string | undefined) ?? (rec["question"] as string | undefined) ?? "";
      body = { message: msg };
    }
    return apiClient.post(endpoints.enrollments.provideInfo(id), (body ?? {}) as Record<string, unknown>);
  },

  forCourse: (courseId: string | number): Promise<HttpResult<unknown>> =>
    apiClient.get(endpoints.enrollments.forCourse(courseId)),
};
