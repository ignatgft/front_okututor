// migrated to TSX — minimal strict types (controlled)
import { ScheduleWizard } from "./schedule/ScheduleWizard";
import { useTutorAvailability } from "../hooks/useTutorAvailability";
import useAuthStore from "../store/authStore";

/**
 * Thin wrapper over ScheduleWizard for backward compatibility.
 * PgTutorRequests historically used this component; now it delegates
 * to the canonical ScheduleWizard so both list and detail share one UX.
 */
export default function ScheduleModal({ enrollment, onClose, onSuccess }: Record<string, unknown>) {
  const tutorId = useAuthStore((s) => s.user?.id);
  const { availability } = useTutorAvailability(tutorId);

  return (
    <ScheduleWizard
      enrollment={enrollment}
      tutorAvailability={availability}
      studentInput={{
        days: enrollment?.preferred_days || [],
        startTime: enrollment?.preferred_start_time || enrollment?.preferred_time || "",
        endTime: enrollment?.preferred_end_time || "",
      }}
      onClose={onClose}
      onSuccess={() => {
        onSuccess?.();
      }}
    />
  );
}
