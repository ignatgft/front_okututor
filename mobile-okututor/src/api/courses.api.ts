import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { ApiResult } from "./types";
import { Course, CoursePayload } from "../types/course";
import { MaybePaginated } from "../types/api";

export const coursesApi = {
  list: (query = ""): ApiResult<MaybePaginated<Course>> =>
    apiClient.get(`${endpoints.courses.list}${query}`, false),

  popular: (): ApiResult<Course[]> => apiClient.get(endpoints.courses.popular, false),

  byId: (id: string | number): ApiResult<Course> => apiClient.get(endpoints.courses.byId(id)),

  create: (payload: CoursePayload): ApiResult<Course> =>
    apiClient.post(endpoints.courses.create, payload),

  update: (id: string | number, payload: Partial<CoursePayload>): ApiResult<Course> =>
    apiClient.put(endpoints.courses.update(id), payload),

  delete: (id: string | number): ApiResult<unknown> =>
    apiClient.delete(endpoints.courses.delete(id)),

  byTeacher: (teacherId: string | number): ApiResult<MaybePaginated<Course>> =>
    apiClient.get(endpoints.courses.byTeacher(teacherId)),

  canReview: (
    courseId: string | number
  ): ApiResult<{ eligible?: boolean; has_attended?: boolean; already_reviewed?: boolean }> =>
    apiClient.get(endpoints.courses.canReview(courseId)),
};