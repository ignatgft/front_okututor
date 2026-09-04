import { useState, useEffect, useCallback, useRef } from "react";
import { loadCalendarRange } from "../api/calendar.api";
import { tutorsApi } from "../api/tutors.api";
import { toLocalInput } from "../utils/date";
import type { AvailabilitySlot, BookingDTO } from "../types/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && typeof err.message === "string") return err.message;
  if (isRecord(err) && typeof err["message"] === "string") return err["message"] as string;
  return "Failed to load calendar";
}

export interface UseCalendarParams {
  from: Date | null | undefined;
  to: Date | null | undefined;
  tutorMode?: boolean;
  includeAvailability?: boolean;
}

export interface AddSlotResult {
  ok: boolean;
}

export interface UseCalendarReturn {
  events: BookingDTO[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
  availability: AvailabilitySlot[];
  availabilityError: string;
  availabilityLoading: boolean;
  reloadAvailability: () => Promise<void>;
  addSlot: (slot: Omit<AvailabilitySlot, "id">) => Promise<AddSlotResult>;
  removeSlot: (id: string | number) => Promise<AddSlotResult>;
}

export function useCalendar({ from, to, tutorMode = false, includeAvailability = false }: UseCalendarParams): UseCalendarReturn {
  const [events, setEvents] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [availabilityError, setAvailabilityError] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const abortRef = useRef<AbortController | null>(null);

  const rangeKey = from && to ? `${from.getTime()}|${to.getTime()}` : "";

  const fetchEvents = useCallback(async (): Promise<void> => {
    if (!rangeKey) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    try {
      const data = await loadCalendarRange(
        toLocalInput(from as Date),
        toLocalInput(to as Date),
        { tutorMode }
      );
      if (controller.signal.aborted) return;
      setEvents(Array.isArray(data) ? (data as BookingDTO[]) : []);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      setError(getErrorMessage(err));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [rangeKey, from, to, tutorMode]);

  useEffect(() => {
    void fetchEvents();
    return () => abortRef.current?.abort();
  }, [fetchEvents]);

  const fetchAvailability = useCallback(async (): Promise<void> => {
    setAvailabilityError("");
    try {
      const { response, data } = await tutorsApi.availability();
      if (response.ok) {
        if (Array.isArray(data)) setAvailability(data as AvailabilitySlot[]);
        else if (isRecord(data) && Array.isArray(data["content"])) setAvailability(data["content"] as AvailabilitySlot[]);
        else setAvailability([]);
      } else {
        const rec = isRecord(data) ? (data as Record<string, unknown>) : null;
        const msg = (rec?.["error"] as string | undefined) ?? (rec?.["message"] as string | undefined) ?? "Failed to load availability";
        setAvailabilityError(msg);
      }
    } catch (e: unknown) {
      setAvailabilityError(getErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    if (tutorMode && includeAvailability) void fetchAvailability();
  }, [tutorMode, includeAvailability, fetchAvailability]);

  const addSlot = useCallback(
    async (slot: Omit<AvailabilitySlot, "id">): Promise<AddSlotResult> => {
      setSaving(true);
      try {
        const { response } = await tutorsApi.addAvailability(slot);
        if (!response.ok) return { ok: false };
        await fetchAvailability();
        return { ok: true };
      } finally {
        setSaving(false);
      }
    },
    [fetchAvailability]
  );

  const removeSlot = useCallback(
    async (id: string | number): Promise<AddSlotResult> => {
      setSaving(true);
      try {
        await tutorsApi.removeAvailability(id);
        await fetchAvailability();
        return { ok: true };
      } finally {
        setSaving(false);
      }
    },
    [fetchAvailability]
  );

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
    availability,
    availabilityError,
    availabilityLoading: saving,
    reloadAvailability: fetchAvailability,
    addSlot,
    removeSlot,
  };
}
