import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import type { HttpResult } from "./client/responseParser";
import type { ProposeSchedulePayload, AvailabilitySlot } from "../types/api";

export interface MyScheduleParams {
  includeLessons?: boolean;
  page?: number;
  size?: number;
}

export interface BuildProposePayloadInput {
  timezone: string;
  format?: string;
  start_date: string;
  end_date: string;
  duration_minutes: number | string;
  days?: string[];
  time?: string;
  location?: {
    address?: string;
    details?: string;
    place?: string;
    spot?: string;
    [key: string]: unknown;
  } | null;
  message?: string;
}

export const scheduleApi = {
  // legacy wizard
  propose: (applicationId: string | number, payload: Record<string, unknown>): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.schedule.propose(applicationId), payload),

  listProposals: (applicationId: string | number): Promise<HttpResult<unknown>> =>
    apiClient.get(endpoints.schedule.proposals(applicationId)),

  getProposal: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.get(endpoints.schedule.proposal(id)),

  acceptProposal: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.schedule.accept(id)),

  rejectProposal: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.schedule.reject(id)),

  counterProposal: (id: string | number, payload: Record<string, unknown>): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.schedule.counter(id), payload),

  mySchedules: (): Promise<HttpResult<unknown>> => apiClient.get(endpoints.schedule.my),

  byId: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.get(endpoints.schedule.byId(id)),

  lessons: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.get(endpoints.schedule.lessons(id)),

  availableSlots: (applicationId: string | number, params = ""): Promise<HttpResult<unknown>> =>
    apiClient.get(`${endpoints.schedule.availableSlots(applicationId)}${params}`),

  checkAvailability: (payload: Record<string, unknown>): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.schedule.checkAvailability, payload),

  // new schedule/me
  mySchedule: (params?: MyScheduleParams): Promise<HttpResult<unknown>> => {
    const search = new URLSearchParams();
    if (params?.includeLessons) search.set("includeLessons", "true");
    if (params?.page !== undefined) search.set("page", String(params.page));
    if (params?.size !== undefined) search.set("size", String(params.size));
    const query = search.toString();
    return apiClient.get(`${endpoints.schedule.my}${query ? `?${query}` : ""}`);
  },

  nextLesson: (): Promise<HttpResult<unknown>> => apiClient.get(`${endpoints.schedule.my}/next`),

  actions: (): Promise<HttpResult<unknown>> => apiClient.get(`${endpoints.schedule.my}/actions`),

  day: (date: string): Promise<HttpResult<unknown>> =>
    apiClient.get(`${endpoints.schedule.my}/day?date=${encodeURIComponent(date)}`),

  week: (startDate: string): Promise<HttpResult<unknown>> =>
    apiClient.get(`${endpoints.schedule.my}/week?start=${encodeURIComponent(startDate)}`),

  month: (year: number, month: number): Promise<HttpResult<unknown>> =>
    apiClient.get(`${endpoints.schedule.my}/month?year=${year}&month=${month}`),

  lesson: (id: string | number): Promise<HttpResult<unknown>> => apiClient.get(endpoints.lessons.byId(id)),

  join: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(`${endpoints.lessons.byId(id)}/join`),

  cancel: (id: string | number, reason?: string): Promise<HttpResult<unknown>> =>
    apiClient.post(`${endpoints.lessons.byId(id)}/cancel`, reason ? { reason } : {}),

  reschedule: (id: string | number, payload: Record<string, unknown>): Promise<HttpResult<unknown>> =>
    apiClient.post(`${endpoints.lessons.byId(id)}/reschedule`, payload),

  review: (id: string | number, payload: Record<string, unknown>): Promise<HttpResult<unknown>> =>
    apiClient.post(`${endpoints.lessons.byId(id)}/review`, payload),
};

export function buildProposePayload({
  timezone,
  format,
  start_date,
  end_date,
  duration_minutes,
  days,
  time,
  location,
  message,
}: BuildProposePayloadInput): ProposeSchedulePayload {
  const slots: AvailabilitySlot[] = (days ?? []).map((d) => {
    const weekday = String(d).toUpperCase();
    const start_time = time ?? "09:00";
    // compute end_time from start_time + duration
    const [hRaw, mRaw] = start_time.split(":").map(Number);
    const h = Number.isFinite(hRaw) ? (hRaw as number) : 0;
    const m = Number.isFinite(mRaw) ? (mRaw as number) : 0;
    const total = h * 60 + m + (Number(duration_minutes) || 60);
    const eh = Math.floor(total / 60) % 24;
    const em = total % 60;
    const end_time = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
    return { weekday, start_time, end_time };
  });

  const payload: ProposeSchedulePayload = {
    timezone,
    start_date,
    end_date,
    duration_minutes: Number(duration_minutes),
    slots,
  };

  if (format) payload.format = String(format).toUpperCase();
  if (message) payload.message = message;
  if (location) {
    // map LocationPicker {spot/place, address, details} to backend location_* fields
    const loc = location as Record<string, unknown>;
    if (typeof loc["address"] === "string" && loc["address"]) payload.location_address = loc["address"] as string;
    if (typeof loc["details"] === "string" && loc["details"]) payload.location_details = loc["details"] as string;
    const rawPlace = (loc["place"] as string | undefined) ?? (loc["spot"] as string | undefined);
    if (rawPlace) {
      const v = String(rawPlace).toLowerCase();
      const map: Record<string, string> = {
        tutor: "TUTOR_PLACE",
        student: "STUDENT_PLACE",
        center: "CENTER",
        other: "OTHER",
      };
      payload.location_type = map[v] ?? String(rawPlace).toUpperCase();
    } else if (format === "offline") payload.location_type = "OTHER";
    else if (payload.format === "ONLINE") payload.location_type = undefined;
  }

  return payload;
}
