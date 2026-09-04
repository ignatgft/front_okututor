import { useCallback, useEffect, useState } from "react";
import { tutorsApi } from "../api/tutors.api";
import type { AvailabilitySlot } from "../types/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalize(data: unknown): AvailabilitySlot[] {
  if (Array.isArray(data)) return data as AvailabilitySlot[];
  if (isRecord(data) && Array.isArray(data["content"])) return data["content"] as AvailabilitySlot[];
  return [];
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && typeof err.message === "string") return err.message;
  if (isRecord(err) && typeof err["message"] === "string") return err["message"] as string;
  return "Failed to load availability";
}

export interface UseTutorAvailabilityReturn {
  availability: AvailabilitySlot[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
}

export function useTutorAvailability(tutorId: string | number | null | undefined): UseTutorAvailabilityReturn {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const load = useCallback(async (): Promise<void> => {
    if (!tutorId) {
      setAvailability([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { response, data } = await tutorsApi.availabilityByTeacher(tutorId);
      if (response.ok) setAvailability(normalize(data));
      else setAvailability([]);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  }, [tutorId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { availability, loading, error, reload: load };
}
