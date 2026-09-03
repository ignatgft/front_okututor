import { endpoints } from "./endpoints";
import { apiClient } from "./http";

export const scheduleApi = {
  // legacy wizard
  propose: (applicationId, payload) => apiClient.post(endpoints.schedule.propose(applicationId), payload),
  listProposals: (applicationId) => apiClient.get(endpoints.schedule.proposals(applicationId)),
  getProposal: (id) => apiClient.get(endpoints.schedule.proposal(id)),
  acceptProposal: (id) => apiClient.post(endpoints.schedule.accept(id)),
  rejectProposal: (id) => apiClient.post(endpoints.schedule.reject(id)),
  counterProposal: (id, payload) => apiClient.post(endpoints.schedule.counter(id), payload),
  mySchedules: () => apiClient.get(endpoints.schedule.my),
  byId: (id) => apiClient.get(endpoints.schedule.byId(id)),
  lessons: (id) => apiClient.get(endpoints.schedule.lessons(id)),
  availableSlots: (applicationId, params = "") => apiClient.get(`${endpoints.schedule.availableSlots(applicationId)}${params}`),
  checkAvailability: (payload) => apiClient.post(endpoints.schedule.checkAvailability, payload),
  // new schedule/me
  mySchedule: (params) => {
    const search = new URLSearchParams();
    if (params?.includeLessons) search.set("includeLessons", "true");
    if (params?.page !== undefined) search.set("page", String(params.page));
    if (params?.size !== undefined) search.set("size", String(params.size));
    const query = search.toString();
    return apiClient.get(`${endpoints.schedule.my}${query ? `?${query}` : ""}`);
  },
  nextLesson: () => apiClient.get(`${endpoints.schedule.my}/next`),
  actions: () => apiClient.get(`${endpoints.schedule.my}/actions`),
  day: (date) => apiClient.get(`${endpoints.schedule.my}/day?date=${encodeURIComponent(date)}`),
  week: (startDate) => apiClient.get(`${endpoints.schedule.my}/week?start=${encodeURIComponent(startDate)}`),
  month: (year, month) => apiClient.get(`${endpoints.schedule.my}/month?year=${year}&month=${month}`),
  lesson: (id) => apiClient.get(endpoints.lessons.byId(id)),
  join: (id) => apiClient.post(`${endpoints.lessons.byId(id)}/join`),
  cancel: (id, reason) => apiClient.post(`${endpoints.lessons.byId(id)}/cancel`, reason ? { reason } : {}),
  reschedule: (id, payload) => apiClient.post(`${endpoints.lessons.byId(id)}/reschedule`, payload),
  review: (id, payload) => apiClient.post(`${endpoints.lessons.byId(id)}/review`, payload),
};

export function buildProposePayload({ timezone, format, start_date, end_date, duration_minutes, days, time, location, message }) {
  const slots = (days || []).map((d) => {
    const weekday = String(d).toUpperCase();
    const start_time = time || "09:00";
    // compute end_time from start_time + duration
    const [h, m] = start_time.split(":").map(Number);
    const total = (h || 0) * 60 + (m || 0) + (Number(duration_minutes) || 60);
    const eh = Math.floor(total / 60) % 24;
    const em = total % 60;
    const end_time = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
    return { weekday, start_time, end_time };
  });
  const payload = {
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
    if (location.address) payload.location_address = location.address;
    if (location.details) payload.location_details = location.details;
    const rawPlace = location.place || location.spot;
    if (rawPlace) {
      const v = String(rawPlace).toLowerCase();
      const map = { tutor: "TUTOR_PLACE", student: "STUDENT_PLACE", center: "CENTER", other: "OTHER" };
      payload.location_type = map[v] || String(rawPlace).toUpperCase();
    } else if (format === "offline") payload.location_type = "OTHER";
    else if (payload.format === "ONLINE") payload.location_type = undefined;
  }
  return payload;
}
