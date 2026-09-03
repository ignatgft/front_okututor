import { useQuery } from "@tanstack/react-query";
import { scheduleApi } from "../../api/schedule.api";
import { normalizeLesson } from "../../utils/normalize";
import type { LessonDTO, ScheduleAction, DayScheduleResponse, WeekScheduleResponse, MonthScheduleResponse } from "../../types/schedule";

// Query keys for React Query caching and invalidation
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

/**
 * Hook for next upcoming lesson
 * Used in NextLessonCard component
 */
export function useNextLesson() {
  return useQuery({
    queryKey: scheduleKeys.nextLesson(),
    queryFn: async () => {
      const { response, data } = await scheduleApi.nextLesson();
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to load next lesson");
      const raw = (data as any)?.lesson ?? data;
      if (!raw || (typeof raw === "object" && Object.keys(raw).length === 0)) return null;
      return normalizeLesson(raw) as LessonDTO;
    },
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refetch every minute for countdown accuracy
  });
}

/**
 * Hook for actions required (ActionRequiredBlock)
 */
export function useScheduleActions() {
  return useQuery({
    queryKey: scheduleKeys.actions(),
    queryFn: async () => {
      const { response, data } = await scheduleApi.actions();
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to load actions");
      return (data as ScheduleAction[]) || [];
    },
    staleTime: 60_000,
  });
}

/**
 * Hook for day view lessons
 */
export function useScheduleDay(date: string) {
  return useQuery({
    queryKey: scheduleKeys.day(date),
    queryFn: async () => {
      const { response, data } = await scheduleApi.day(date);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to load day schedule");
      const raw = data as any;
      if (raw?.lessons) raw.lessons = raw.lessons.map((l: any) => normalizeLesson(l));
      return raw as DayScheduleResponse;
    },
    enabled: !!date,
    staleTime: 60_000,
  });
}

/**
 * Hook for week view lessons
 */
export function useScheduleWeek(startDate: string) {
  return useQuery({
    queryKey: scheduleKeys.week(startDate),
    queryFn: async () => {
      const { response, data } = await scheduleApi.week(startDate);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to load week schedule");
      const raw = data as any;
      if (raw?.days) raw.days.forEach((d: any) => { if (d.lessons) d.lessons = d.lessons.map((l: any) => normalizeLesson(l)); });
      return raw as WeekScheduleResponse;
    },
    enabled: !!startDate,
    staleTime: 60_000,
  });
}

/**
 * Hook for month view lessons
 */
export function useScheduleMonth(year: number, month: number) {
  return useQuery({
    queryKey: scheduleKeys.month(year, month),
    queryFn: async () => {
      const { response, data } = await scheduleApi.month(year, month);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to load month schedule");
      const raw = data as any;
      if (raw?.days) raw.days.forEach((d: any) => { if (d.lessons) d.lessons = d.lessons.map((l: any) => normalizeLesson(l)); });
      return raw as MonthScheduleResponse;
    },
    enabled: year > 0 && month > 0 && month <= 12,
    staleTime: 60_000,
  });
}

/**
 * Hook for lesson details (LessonDetailsModal)
 */
export function useLesson(id: string) {
  return useQuery({
    queryKey: scheduleKeys.lesson(id),
    queryFn: async () => {
      const { response, data } = await scheduleApi.lesson(id);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to load lesson");
      return data as LessonDTO;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}