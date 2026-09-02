import { endpoints } from "./endpoints";
import { apiClient } from "./http";

/**
 * Schedule API — Target contract for new Schedule page
 * Backend endpoints that need to exist:
 * - GET /api/v1/schedule/me              → nextLesson + actions + lessons (or paginated)
 * - GET /api/v1/schedule/actions         → actions required
 * - GET /api/v1/schedule/day?date=...    → day view
 * - GET /api/v1/schedule/week?start=...  → week view
 * - GET /api/v1/schedule/month?year=...&month=... → month view
 * - GET /api/v1/lessons/{id}             → lesson details
 * - POST /api/v1/lessons/{id}/join       → join lesson
 * - POST /api/v1/lessons/{id}/cancel     → cancel lesson
 * - POST /api/v1/lessons/{id}/reschedule → reschedule lesson
 * - POST /api/v1/lessons/{id}/review     → review lesson
 */

export const scheduleApi = {
  /** Get my full schedule: next lesson, actions, and optionally lessons list */
  mySchedule: (params?: { includeLessons?: boolean; page?: number; size?: number }) => {
    const search = new URLSearchParams();
    if (params?.includeLessons) search.set("includeLessons", "true");
    if (params?.page !== undefined) search.set("page", String(params.page));
    if (params?.size !== undefined) search.set("size", String(params.size));
    const query = search.toString();
    return apiClient.get(`${endpoints.schedule.my}${query ? `?${query}` : ""}`);
  },

  /** Get only the next upcoming lesson */
  nextLesson: () => apiClient.get(`${endpoints.schedule.my}/next`),

  /** Get actions required (negotiations, confirmations, payments, etc.) */
  actions: () => apiClient.get(`${endpoints.schedule.my}/actions`),

  /** Day view: lessons for a specific date */
  day: (date: string) => apiClient.get(`${endpoints.schedule.my}/day?date=${encodeURIComponent(date)}`),

  /** Week view: lessons for a week starting from start date */
  week: (startDate: string) => apiClient.get(`${endpoints.schedule.my}/week?start=${encodeURIComponent(startDate)}`),

  /** Month view: lesson counts for a month */
  month: (year: number, month: number) =>
    apiClient.get(`${endpoints.schedule.my}/month?year=${year}&month=${month}`),

  /** Lesson details by ID */
  lesson: (id: string) => apiClient.get(endpoints.lessons.byId(id)),

  /** Join lesson → returns meeting URL */
  join: (id: string) => apiClient.post(`${endpoints.lessons.byId(id)}/join`),

  /** Cancel lesson */
  cancel: (id: string, reason?: string) =>
    apiClient.post(`${endpoints.lessons.byId(id)}/cancel`, reason ? { reason } : {}),

  /** Reschedule lesson */
  reschedule: (id: string, payload: { newStartAt: string; newEndAt: string; timezone: string }) =>
    apiClient.post(`${endpoints.lessons.byId(id)}/reschedule`, payload),

  /** Submit review for completed lesson */
  review: (id: string, payload: { rating: number; comment?: string }) =>
    apiClient.post(`${endpoints.lessons.byId(id)}/review`, payload),
};

/**
 * Legacy schedule API (for ScheduleWizard, etc.) — keep for backward compatibility
 */
export const legacyScheduleApi = {
  propose: (applicationId: string, payload: unknown) =>
    apiClient.post(endpoints.schedule.propose(applicationId), payload),
  listProposals: (applicationId: string) => apiClient.get(endpoints.schedule.proposals(applicationId)),
  getProposal: (id: string) => apiClient.get(endpoints.schedule.proposal(id)),
  acceptProposal: (id: string) => apiClient.post(endpoints.schedule.accept(id)),
  rejectProposal: (id: string) => apiClient.post(endpoints.schedule.reject(id)),
  counterProposal: (id: string, payload: unknown) => apiClient.post(endpoints.schedule.counter(id), payload),
  mySchedules: () => apiClient.get(endpoints.schedule.my),
  byId: (id: string) => apiClient.get(endpoints.schedule.byId(id)),
  lessons: (id: string) => apiClient.get(endpoints.schedule.lessons(id)),
  availableSlots: (applicationId: string, params = "") =>
    apiClient.get(`${endpoints.schedule.availableSlots(applicationId)}${params}`),
};