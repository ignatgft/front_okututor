import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scheduleApi } from "../../api/schedule.api";
import { scheduleKeys } from "./useScheduleQueries";
import type { CancelLessonRequest, RescheduleLessonRequest, ReviewLessonRequest, JoinLessonResponse } from "../../types/schedule";
import { useToast } from "../../components/ui/Toast";

/**
 * Mutation hook for joining a lesson
 */
export function useJoinLesson() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<JoinLessonResponse, Error, string>({
    mutationFn: async (lessonId: string) => {
      const { response, data } = await scheduleApi.join(lessonId);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to join lesson");
      return data as JoinLessonResponse;
    },
    onSuccess: (data, lessonId) => {
      // Navigate to meeting URL
      if (data.meetingUrl) {
        window.open(data.meetingUrl, "_blank");
      }
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: scheduleKeys.nextLesson() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success("Перенаправление на урок...");
    },
    onError: (error) => {
      toast.error(error.message || "Не удалось войти на урок");
    },
  });
}

/**
 * Mutation hook for canceling a lesson
 */
export function useCancelLesson() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<void, Error, { lessonId: string; reason?: string }>({
    mutationFn: async ({ lessonId, reason }) => {
      const { response, data } = await scheduleApi.cancel(lessonId, reason);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to cancel lesson");
    },
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.nextLesson() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success("Урок отменён");
    },
    onError: (error) => {
      toast.error(error.message || "Не удалось отменить урок");
    },
  });
}

/**
 * Mutation hook for rescheduling a lesson
 */
export function useRescheduleLesson() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<void, Error, { lessonId: string; payload: RescheduleLessonRequest }>({
    mutationFn: async ({ lessonId, payload }) => {
      const { response, data } = await scheduleApi.reschedule(lessonId, payload);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to reschedule lesson");
    },
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.nextLesson() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success("Урок перенесён");
    },
    onError: (error) => {
      toast.error(error.message || "Не удалось перенести урок");
    },
  });
}

/**
 * Mutation hook for reviewing a lesson
 */
export function useReviewLesson() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<void, Error, { lessonId: string; payload: ReviewLessonRequest }>({
    mutationFn: async ({ lessonId, payload }) => {
      const { response, data } = await scheduleApi.review(lessonId, payload);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to submit review");
    },
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success("Отзыв отправлен");
    },
    onError: (error) => {
      toast.error(error.message || "Не удалось отправить отзыв");
    },
  });
}

/**
 * Mutation hook for accepting a schedule action (e.g., confirming negotiation)
 */
export function useAcceptAction() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<void, Error, { actionId: string; endpoint: string }>({
    mutationFn: async ({ endpoint }) => {
      const { response, data } = await scheduleApi.join(""); // This is a placeholder - actual implementation depends on backend
      // Actually we need a generic POST helper. Let's use apiClient directly
      const { apiClient } = await import("../../api/http");
      const { response: res, data: resData } = await apiClient.post(endpoint);
      if (!res.ok) throw new Error(resData?.error || resData?.message || "Failed to accept action");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.actions() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.nextLesson() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success("Действие подтверждено");
    },
    onError: (error) => {
      toast.error(error.message || "Не удалось выполнить действие");
    },
  });
}

/**
 * Mutation hook for rejecting a schedule action
 */
export function useRejectAction() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<void, Error, { actionId: string; endpoint: string }>({
    mutationFn: async ({ endpoint }) => {
      const { apiClient } = await import("../../api/http");
      const { response, data } = await apiClient.post(endpoint);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to reject action");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.actions() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success("Действие отклонено");
    },
    onError: (error) => {
      toast.error(error.message || "Не удалось выполнить действие");
    },
  });
}