import { useState, useEffect, useCallback } from "react";
import { studentsApi } from "../../../api/students.api";
import type { EnrollmentDTO } from "../../../types/api";

export function useDashboardEnrollments(): {
  enrollments: EnrollmentDTO[];
  reload: () => Promise<void>;
} {
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);

  const load = useCallback(async (): Promise<void> => {
    try {
      const { response, data } = await studentsApi.myEnrollments();
      if (response.ok) setEnrollments(Array.isArray(data) ? (data as EnrollmentDTO[]) : (data as Record<string, unknown>)?.["content"] as EnrollmentDTO[] ?? []);
    } catch {
      // dashboard should not break if requests fail
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { enrollments, reload: load };
}
