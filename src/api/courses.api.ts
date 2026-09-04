import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import type { HttpResult } from "./client/responseParser";
import type { CourseDTO, CoursePayload } from "../types/api";
import type { PaginatedData } from "../types/api";

export const coursesApi = {
  list: (query = ""): Promise<HttpResult<PaginatedData<CourseDTO> | CourseDTO[]>> =>
    apiClient.get<PaginatedData<CourseDTO> | CourseDTO[]>(`${endpoints.courses.list}${query}`, false),

  popular: (): Promise<HttpResult<CourseDTO[] | PaginatedData<CourseDTO>>> =>
    apiClient.get<CourseDTO[] | PaginatedData<CourseDTO>>(endpoints.courses.popular, false),

  byId: (id: string | number): Promise<HttpResult<CourseDTO>> =>
    apiClient.get<CourseDTO>(endpoints.courses.byId(id)),

  create: (payload: CoursePayload): Promise<HttpResult<CourseDTO>> =>
    apiClient.post<CourseDTO>(endpoints.courses.create, payload),

  update: (id: string | number, payload: Partial<CoursePayload>): Promise<HttpResult<CourseDTO>> =>
    apiClient.put<CourseDTO>(endpoints.courses.update(id), payload),

  delete: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.delete(endpoints.courses.delete(id)),

  byTeacher: (teacherId: string | number): Promise<HttpResult<PaginatedData<CourseDTO> | CourseDTO[]>> =>
    apiClient.get<PaginatedData<CourseDTO> | CourseDTO[]>(endpoints.courses.byTeacher(teacherId)),
};
