import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scheduleApi } from "../../api/schedule.api";
import { lessonsApi } from "../../api/lessons.api";
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
 * Mutation hook for starting a lesson (SCHEDULED -> IN_PROGRESS)
 */
export function useStartLesson() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation<void, Error, string>({
    mutationFn: async (lessonId: string) => {
      const { response, data } = await lessonsApi.start(lessonId);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to start lesson");
    },
    onSuccess: (_, lessonId) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success("Занятие началось");
    },
    onError: (error) => toast.error(error.message || "Не удалось начать занятие"),
  });
}

export function useCompleteLesson() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation<void, Error, string>({
    mutationFn: async (lessonId: string) => {
      const { response, data } = await lessonsApi.complete(lessonId);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to complete lesson");
    },
    onSuccess: (_, lessonId) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success("Занятие завершено");
    },
    onError: (error) => toast.error(error.message || "Не удалось завершить занятие"),
  });
}

export function useStudentNoShow() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation<void, Error, string>({
    mutationFn: async (lessonId: string) => {
      const { response, data } = await lessonsApi.studentNoShow(lessonId);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to mark no-show");
    },
    onSuccess: (_, lessonId) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success("Отмечено: ученик не пришёл");
    },
    onError: (error) => toast.error(error.message || "Не удалось отметить"),
  });
}

export function useTutorNoShow() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation<void, Error, { lessonId: string; reason?: string }>({
    mutationFn: async ({ lessonId, reason }) => {
      const { response, data } = await lessonsApi.tutorNoShow(lessonId, reason);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to mark no-show");
    },
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success("Отмечено: тьютор не пришёл");
    },
    onError: (error) => toast.error(error.message || "Не удалось отметить"),
  });
}

export function useReportIssue() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation<void, Error, { lessonId: string; reason?: string }>({
    mutationFn: async ({ lessonId, reason }) => {
      const { response, data } = await lessonsApi.issue(lessonId, reason);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to report issue");
    },
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success("Сообщение о проблеме отправлено");
    },
    onError: (error) => toast.error(error.message || "Не удалось сообщить о проблеме"),
  });
}

export function useUpdateLessonDetails() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation<void, Error, { lessonId: string; payload: any }>({
    mutationFn: async ({ lessonId, payload }) => {
      const { response, data } = await lessonsApi.details(lessonId, payload);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to update details");
    },
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success("Детали сохранены");
    },
    onError: (error) => toast.error(error.message || "Не удалось сохранить"),
  });
}

export function useProposeReschedule() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation<void, Error, { lessonId: string; payload: any }>({
    mutationFn: async ({ lessonId, payload }) => {
      const { response, data } = await lessonsApi.reschedulePropose(lessonId, payload);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to propose reschedule");
    },
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success("Предложение переноса отправлено");
    },
    onError: (error) => toast.error(error.message || "Не удалось предложить перенос"),
  });
}
export function useAcceptReschedule() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation<void, Error, string>({
    mutationFn: async (lessonId: string) => {
      const { response, data } = await lessonsApi.rescheduleAccept(lessonId);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to accept");
    },
    onSuccess: (_, lessonId) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success("Перенос подтверждён");
    },
    onError: (error) => toast.error(error.message || "Не удалось подтвердить"),
  });
}
export function useRejectReschedule() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation<void, Error, string>({
    mutationFn: async (lessonId: string) => {
      const { response, data } = await lessonsApi.rescheduleReject(lessonId);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to reject");
    },
    onSuccess: (_, lessonId) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success("Предложение отклонено");
    },
    onError: (error) => toast.error(error.message || "Не удалось отклонить"),
  });
}

export function useProposeFormat() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation<void, Error, { lessonId: string; payload: any }>({
    mutationFn: async ({ lessonId, payload }) => {
      const { response, data } = await lessonsApi.formatPropose(lessonId, payload);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to propose format change");
    },
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success("Предложение смены формата отправлено");
    },
    onError: (error) => toast.error(error.message || "Не удалось предложить смену формата"),
  });
}
export function useAcceptFormat() {
  const qc = useQueryClient(); const toast = useToast();
  return useMutation<void, Error, string>({ mutationFn: async (id)=>{ const {response,data}=await lessonsApi.formatAccept(id); if(!response.ok) throw new Error(data?.error||"Failed");}, onSuccess:(_,id)=>{ qc.invalidateQueries({queryKey:scheduleKeys.lesson(id)}); qc.invalidateQueries({queryKey:scheduleKeys.all}); toast.success("Формат подтверждён");}, onError:(e)=>toast.error(e.message) });
}
export function useRejectFormat() {
  const qc = useQueryClient(); const toast = useToast();
  return useMutation<void, Error, string>({ mutationFn: async (id)=>{ const {response,data}=await lessonsApi.formatReject(id); if(!response.ok) throw new Error(data?.error||"Failed");}, onSuccess:(_,id)=>{ qc.invalidateQueries({queryKey:scheduleKeys.lesson(id)}); qc.invalidateQueries({queryKey:scheduleKeys.all}); toast.success("Отклонено");}, onError:(e)=>toast.error(e.message) });
}
export function useAcceptLocation() {
  const qc = useQueryClient(); const toast = useToast();
  return useMutation<void, Error, string>({ mutationFn: async (id)=>{ const {response,data}=await lessonsApi.locationAccept(id); if(!response.ok) throw new Error(data?.error||"Failed");}, onSuccess:(_,id)=>{ qc.invalidateQueries({queryKey:scheduleKeys.lesson(id)}); qc.invalidateQueries({queryKey:scheduleKeys.all}); toast.success("Место подтверждено");}, onError:(e)=>toast.error(e.message) });
}
export function useRejectLocation() {
  const qc = useQueryClient(); const toast = useToast();
  return useMutation<void, Error, string>({ mutationFn: async (id)=>{ const {response,data}=await lessonsApi.locationReject(id); if(!response.ok) throw new Error(data?.error||"Failed");}, onSuccess:(_,id)=>{ qc.invalidateQueries({queryKey:scheduleKeys.lesson(id)}); qc.invalidateQueries({queryKey:scheduleKeys.all}); toast.success("Отклонено");}, onError:(e)=>toast.error(e.message) });
}
export function useAcceptDuration() {
  const qc = useQueryClient(); const toast = useToast();
  return useMutation<void, Error, string>({ mutationFn: async (id)=>{ const {response,data}=await lessonsApi.durationAccept(id); if(!response.ok) throw new Error(data?.error||"Failed");}, onSuccess:(_,id)=>{ qc.invalidateQueries({queryKey:scheduleKeys.lesson(id)}); qc.invalidateQueries({queryKey:scheduleKeys.all}); toast.success("Длительность подтверждена");}, onError:(e)=>toast.error(e.message) });
}
export function useRejectDuration() {
  const qc = useQueryClient(); const toast = useToast();
  return useMutation<void, Error, string>({ mutationFn: async (id)=>{ const {response,data}=await lessonsApi.durationReject(id); if(!response.ok) throw new Error(data?.error||"Failed");}, onSuccess:(_,id)=>{ qc.invalidateQueries({queryKey:scheduleKeys.lesson(id)}); qc.invalidateQueries({queryKey:scheduleKeys.all}); toast.success("Отклонено");}, onError:(e)=>toast.error(e.message) });
}
export function useProposeLocation() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation<void, Error, { lessonId: string; payload: any }>({
    mutationFn: async ({ lessonId, payload }) => {
      const { response, data } = await lessonsApi.locationPropose(lessonId, payload);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to propose location change");
    },
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success("Предложение смены места отправлено");
    },
    onError: (error) => toast.error(error.message || "Не удалось предложить смену места"),
  });
}
export function useProposeDuration() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation<void, Error, { lessonId: string; payload: any }>({
    mutationFn: async ({ lessonId, payload }) => {
      const { response, data } = await lessonsApi.durationPropose(lessonId, payload);
      if (!response.ok) throw new Error(data?.error || data?.message || "Failed to propose duration change");
    },
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      toast.success("Предложение смены длительности отправлено");
    },
    onError: (error) => toast.error(error.message || "Не удалось предложить"),
  });
}

/**
 * Mutation hook for rescheduling a lesson (instant — deprecated, use propose flow)
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