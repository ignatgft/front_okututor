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

  // Fixed backend contract: both endpoints accept { message: string }
  // (ApplicationController.firstNonBlank reads "message" on both paths).
  requestInfo: (id: string | number, message: string): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.enrollments.requestInfo(id), { message }),

  provideInfo: (id: string | number, message: string): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.enrollments.provideInfo(id), { message }),

  forCourse: (courseId: string | number): Promise<HttpResult<unknown>> =>
    apiClient.get(endpoints.enrollments.forCourse(courseId)),
};
