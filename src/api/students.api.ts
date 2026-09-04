import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import type { HttpResult } from "./client/responseParser";
import type { EnrollmentDTO } from "../types/api";

export const studentsApi = {
  myEnrollments: (): Promise<HttpResult<unknown>> =>
    apiClient.get(endpoints.enrollments.myEnrollments),

  requestCourse: (
    courseId: string | number,
    payload: Record<string, unknown>
  ): Promise<HttpResult<EnrollmentDTO>> =>
    apiClient.post<EnrollmentDTO>(endpoints.enrollments.enroll(courseId), payload),

  cancelEnrollment: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.request("DELETE", endpoints.enrollments.cancel(id)),
};
