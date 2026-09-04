import { useQuery } from "@tanstack/react-query";
import { scheduleApi } from "../../api/schedule.api";
import { normalizeLesson } from "../../utils/normalize";
import type { LessonDTO, ScheduleAction, DayScheduleResponse, WeekScheduleResponse, MonthScheduleResponse } from "../../types/schedule";

export const scheduleKeys = {
  all: ["schedule"] as const,
  mySchedule: () => [...scheduleKeys.all, "my"] as const,
  nextLesson: () => [...scheduleKeys.mySchedule(), "next"] as const,
  actions: () => [...scheduleKeys.mySchedule(), "actions"] as const,
  day: (date: string) => [...scheduleKeys.mySchedule(), "day", date] as const,
  week: (startDate: string) => [...scheduleKeys.mySchedule(), "week", startDate] as const,
  month: (year: number, month: number) => [...scheduleKeys.mySchedule(), "month", year, month] as const,
  lesson: (id: string) => [...scheduleKeys.all, "lesson", id] as const,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractError(data: unknown): string | undefined {
  if (!isRecord(data)) return undefined;
  const m = data["message"];
  const e = data["error"];
  if (typeof m === "string" && m) return m;
  if (typeof e === "string" && e) return e;
  return undefined;
}

export function useNextLesson() {
  return useQuery<LessonDTO | null, Error>({
    queryKey: scheduleKeys.nextLesson(),
    queryFn: async () => {
      const { response, data } = await scheduleApi.nextLesson();
      if (!response.ok) throw new Error(extractError(data) ?? "Failed to load next lesson");
      const rec = isRecord(data) ? (data as Record<string, unknown>) : null;
      const raw: unknown = rec && "lesson" in rec ? rec["lesson"] : data;
      if (!raw || (isRecord(raw) && Object.keys(raw).length === 0)) return null;
      return normalizeLesson(raw as Record<string, unknown>) as LessonDTO;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useScheduleActions() {
  return useQuery<ScheduleAction[], Error>({
    queryKey: scheduleKeys.actions(),
    queryFn: async () => {
      const { response, data } = await scheduleApi.actions();
      if (!response.ok) throw new Error(extractError(data) ?? "Failed to load actions");
      if (Array.isArray(data)) return data as ScheduleAction[];
      if (isRecord(data) && Array.isArray(data["content"])) return data["content"] as ScheduleAction[];
      return [];
    },
    staleTime: 60_000,
  });
}

export function useScheduleDay(date: string) {
  return useQuery<DayScheduleResponse, Error>({
    queryKey: scheduleKeys.day(date),
    queryFn: async () => {
      const { response, data } = await scheduleApi.day(date);
      if (!response.ok) throw new Error(extractError(data) ?? "Failed to load day schedule");
      const rec = (data ?? {}) as Record<string, unknown>;
      if (Array.isArray(rec["lessons"])) {
        rec["lessons"] = (rec["lessons"] as unknown[]).map((l) => normalizeLesson(l as Record<string, unknown>));
      }
      return rec as unknown as DayScheduleResponse;
    },
    enabled: !!date,
    staleTime: 60_000,
  });
}

export function useScheduleWeek(startDate: string) {
  return useQuery<WeekScheduleResponse, Error>({
    queryKey: scheduleKeys.week(startDate),
    queryFn: async () => {
      const { response, data } = await scheduleApi.week(startDate);
      if (!response.ok) throw new Error(extractError(data) ?? "Failed to load week schedule");
      const rec = (data ?? {}) as Record<string, unknown>;
      if (Array.isArray(rec["days"])) {
        for (const d of rec["days"] as Record<string, unknown>[]) {
          if (Array.isArray(d["lessons"])) {
            d["lessons"] = (d["lessons"] as unknown[]).map((l) => normalizeLesson(l as Record<string, unknown>));
          }
        }
      }
      return rec as unknown as WeekScheduleResponse;
    },
    enabled: !!startDate,
    staleTime: 60_000,
  });
}

export function useScheduleMonth(year: number, month: number) {
  return useQuery<MonthScheduleResponse, Error>({
    queryKey: scheduleKeys.month(year, month),
    queryFn: async () => {
      const { response, data } = await scheduleApi.month(year, month);
      if (!response.ok) throw new Error(extractError(data) ?? "Failed to load month schedule");
      const rec = (data ?? {}) as Record<string, unknown>;
      if (Array.isArray(rec["days"])) {
        for (const d of rec["days"] as Record<string, unknown>[]) {
          if (Array.isArray(d["lessons"])) {
            d["lessons"] = (d["lessons"] as unknown[]).map((l) => normalizeLesson(l as Record<string, unknown>));
          }
        }
      }
      return rec as unknown as MonthScheduleResponse;
    },
    enabled: year > 0 && month > 0 && month <= 12,
    staleTime: 60_000,
  });
}

export function useLesson(id: string) {
  return useQuery<LessonDTO, Error>({
    queryKey: scheduleKeys.lesson(id),
    queryFn: async () => {
      const { response, data } = await scheduleApi.lesson(id);
      if (!response.ok) throw new Error(extractError(data) ?? "Failed to load lesson");
      return data as LessonDTO;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}
