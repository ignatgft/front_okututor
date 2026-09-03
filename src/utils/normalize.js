export function normalizeEnrollment(raw = {}) {
  return {
    id: raw.id ?? raw.enrollment_id ?? raw._id ?? null,
    status: raw.status ?? raw.enrollment_status ?? "PENDING",
    course_id: raw.course_id ?? raw.course?.id ?? raw.courseId ?? null,
    course_title: raw.course_title ?? raw.course?.title ?? raw.courseTitle ?? "",
    course: raw.course ?? null,
    student_id: raw.student_id ?? raw.student?.id ?? null,
    student_name: raw.student_name ?? raw.student?.full_name ?? raw.studentName ?? "",
    student: raw.student ?? null,
    teacher_name: raw.teacher_name ?? raw.course?.teacher_name ?? "",
    preferred_schedule: raw.preferred_schedule ?? raw.preferredSchedule ?? "",
    preferred_days: raw.preferred_days ?? raw.preferredDays ?? [],
    preferred_start_time: raw.preferred_start_time ?? raw.preferredStartTime ?? raw.preferred_time ?? "",
    preferred_end_time: raw.preferred_end_time ?? raw.preferredEndTime ?? "",
    message: raw.message ?? raw.comment ?? "",
    created_at: raw.created_at ?? raw.createdAt ?? raw.created ?? null,
    updated_at: raw.updated_at ?? raw.updatedAt ?? null,
    raw,
  };
}

export function normalizeCourse(raw = {}) {
  return {
    id: raw.id ?? raw._id ?? null,
    title: raw.title ?? raw.name ?? "",
    description: raw.description ?? "",
    teacher_id: raw.teacher_id ?? raw.teacherId ?? raw.teacher?.id ?? null,
    teacher_name: raw.teacher_name ?? raw.teacherName ?? raw.teacher?.full_name ?? "",
    teacher_avatar: raw.teacher_avatar ?? raw.teacherAvatar ?? raw.teacher?.avatar ?? "",
    price_per_hour: raw.price_per_hour ?? raw.pricePerHour ?? raw.price ?? null,
    price: raw.price_per_hour ?? raw.price ?? null,
    location_type: raw.location_type ?? raw.locationType ?? null,
    group_size: raw.group_size ?? raw.groupSize ?? null,
    subject: raw.subject ?? null,
    status: raw.status ?? null,
    raw,
  };
}

export function normalizeUser(raw = {}) {
  return {
    id: raw.id ?? raw._id ?? null,
    full_name: raw.full_name ?? raw.fullName ?? raw.name ?? "",
    email: raw.email ?? "",
    role: raw.role ?? "STUDENT",
    avatar: raw.avatar ?? raw.avatar_url ?? "",
    timezone: raw.timezone ?? null,
    raw,
  };
}

export function normalizeLesson(raw = {}) {
  if (!raw) return null;
  return {
    id: raw.id ?? raw._id ?? null,
    courseId: raw.course_id ?? raw.courseId ?? null,
    courseTitle: raw.course_title ?? raw.courseTitle ?? raw.title ?? "",
    tutorId: raw.tutor_id ?? raw.tutorId ?? null,
    tutorName: raw.tutor_name ?? raw.tutorName ?? "",
    tutorAvatar: raw.tutor_avatar ?? raw.tutorAvatar ?? null,
    studentId: raw.student_id ?? raw.studentId ?? null,
    studentName: raw.student_name ?? raw.studentName ?? "",
    startAt: raw.start_at ?? raw.startAt ?? null,
    endAt: raw.end_at ?? raw.endAt ?? null,
    timezone: raw.timezone ?? "UTC",
    status: raw.status ?? "SCHEDULED",
    statusLabel: raw.status_label ?? raw.statusLabel ?? raw.status ?? "",
    format: raw.format ?? "ONLINE",
    meetingRoomId: raw.meeting_room_id ?? raw.meetingRoomId ?? null,
    meetingUrl: raw.meeting_url ?? raw.meetingUrl ?? null,
    location: raw.location ?? raw.location_address ?? null,
    locationType: raw.location_type ?? raw.locationType ?? null,
    locationAddress: raw.location_address ?? raw.locationAddress ?? null,
    locationDetails: raw.location_details ?? raw.locationDetails ?? null,
    canJoin: raw.can_join ?? raw.canJoin ?? false,
    canCancel: raw.can_cancel ?? raw.canCancel ?? false,
    canReschedule: raw.can_reschedule ?? raw.canReschedule ?? false,
    canReview: raw.can_review ?? raw.canReview ?? false,
    canStart: raw.can_start ?? raw.canStart ?? false,
    canComplete: raw.can_complete ?? raw.canComplete ?? false,
    canMarkStudentNoShow: raw.can_mark_student_no_show ?? raw.canMarkStudentNoShow ?? false,
    canMarkTutorNoShow: raw.can_mark_tutor_no_show ?? raw.canMarkTutorNoShow ?? false,
    canReportIssue: raw.can_report_issue ?? raw.canReportIssue ?? false,
    cancelledBy: raw.cancelled_by ?? raw.cancelledBy ?? null,
    cancelReason: raw.cancel_reason ?? raw.cancelReason ?? null,
    actualStart: raw.actual_start ?? raw.actualStart ?? null,
    actualEnd: raw.actual_end ?? raw.actualEnd ?? null,
    durationMinutes: raw.duration_minutes ?? raw.durationMinutes ?? null,
    startedBy: raw.started_by ?? raw.startedBy ?? null,
    completedBy: raw.completed_by ?? raw.completedBy ?? null,
    topic: raw.topic ?? null,
    notes: raw.notes ?? null,
    homework: raw.homework ?? null,
    materials: raw.materials ?? null,
    links: raw.links ?? null,
    attendance: raw.attendance ?? null,
    pendingStartAt: raw.pending_start_at ?? raw.pendingStartAt ?? null,
    pendingEndAt: raw.pending_end_at ?? raw.pendingEndAt ?? null,
    pendingReason: raw.pending_reason ?? raw.pendingReason ?? null,
    pendingFormat: raw.pending_format ?? raw.pendingFormat ?? null,
    pendingLocationType: raw.pending_location_type ?? raw.pendingLocationType ?? null,
    pendingLocationAddress: raw.pending_location_address ?? raw.pendingLocationAddress ?? null,
    pendingLocationDetails: raw.pending_location_details ?? raw.pendingLocationDetails ?? null,
    pendingDurationMinutes: raw.pending_duration_minutes ?? raw.pendingDurationMinutes ?? null,
    pendingScope: raw.pending_scope ?? raw.pendingScope ?? null,
    pendingProposedBy: raw.pending_proposed_by ?? raw.pendingProposedBy ?? null,
    pendingProposedAt: raw.pending_proposed_at ?? raw.pendingProposedAt ?? null,
    sequenceNumber: raw.sequence_number ?? raw.sequenceNumber ?? null,
    scheduleId: raw.schedule_id ?? raw.scheduleId ?? null,
    bookingId: raw.booking_id ?? raw.bookingId ?? null,
    createdAt: raw.created_at ?? raw.createdAt ?? null,
    updatedAt: raw.updated_at ?? raw.updatedAt ?? null,
    raw,
  };
}

/**
 * Normalize notification message from backend raw format to i18n-ready format.
 * Backend sends raw strings like "MESSAGENew message from John" or
 * "APPLICATION_CANCELLEDS student cancelled your course".
 * This function extracts the type and parameters for proper i18n rendering.
 */
export function normalizeNotification(raw = {}) {
  const type = raw.type || "";
  const message = raw.message || raw.text || "";
  const payload = raw.payload || {};

  // Detect raw backend messages: they typically have format "TYPERAWMESSAGE" (no space after type)
  // e.g., "MESSAGENew message from John", "BOOKING_COMPLETEDYour booking..."
  // Localized messages have proper spacing/punctuation
  const isRawBackendMessage = /^[A-Z_]+[A-Z]/.test(message) || /^[A-Z_]{3,}[a-z]/.test(message);

  const params = extractNotificationParams(type, message, payload);

  return {
    id: raw.id ?? raw._id ?? null,
    type,
    read: raw.read ?? false,
    created_at: raw.created_at ?? raw.createdAt ?? null,
    link: raw.link ?? null,
    payload,
    // Extract structured data for i18n
    params,
    // Only use raw message as fallback if it's NOT a raw backend message
    rawMessage: isRawBackendMessage ? null : (message || null),
  };
}

function extractNotificationParams(type, message, payload) {
  const params = { ...payload };

  // Common patterns from backend raw messages
  switch (type) {
    case "MESSAGE":
    case "NEW_MESSAGE": {
      // "MESSAGENew message from John" -> { senderName: "John" }
      const msgMatch = message.match(/MESSAGE\s*New message from\s+(.+)/i);
      if (msgMatch) params.senderName = msgMatch[1].trim();
      // Also try to extract preview from message
      const previewMatch = message.match(/New message from\s+.+?[:：]\s*(.+)/i);
      if (previewMatch) params.preview = previewMatch[1].trim();
      break;
    }

    case "APPLICATION_CANCELLED": {
      // "APPLICATION_CANCELLEDS student cancelled your course" -> { studentName: "..." }
      const cancelMatch = message.match(/APPLICATION_CANCELLED\s*(.+?)\s+cancelled/i);
      if (cancelMatch) params.studentName = cancelMatch[1].trim();
      break;
    }

    case "COURSE_APPLICATION":
      // Could contain course title, student name
      if (payload.course_title) params.courseTitle = payload.course_title;
      if (payload.student_name) params.studentName = payload.student_name;
      break;

    case "APPLICATION_ACCEPTED":
    case "APPLICATION_REJECTED":
      if (payload.course_title) params.courseTitle = payload.course_title;
      if (payload.tutor_name) params.tutorName = payload.tutor_name;
      break;

    case "BOOKING_CONFIRMED":
    case "BOOKING_CANCELLED":
    case "BOOKING_COMPLETED":
      if (payload.course_title) params.courseTitle = payload.course_title;
      if (payload.tutor_name) params.tutorName = payload.tutor_name;
      if (payload.start_at) params.startAt = payload.start_at;
      break;

    case "LESSON_REMINDER":
      if (payload.course_title) params.courseTitle = payload.course_title;
      if (payload.tutor_name) params.tutorName = payload.tutor_name;
      if (payload.start_at) params.startAt = payload.start_at;
      break;

    case "NEW_REVIEW":
      if (payload.course_title) params.courseTitle = payload.course_title;
      if (payload.rating) params.rating = payload.rating;
      break;

    case "TUTOR_APPROVED":
    case "TUTOR_REJECTED":
      if (payload.tutor_name) params.tutorName = payload.tutor_name;
      break;

    case "COURSE_APPROVED":
    case "COURSE_REJECTED":
      if (payload.course_title) params.courseTitle = payload.course_title;
      break;

    case "SYSTEM":
      // System notifications might have custom messages - try to use message as-is
      if (message && !message.startsWith("SYSTEM")) {
        params.message = message;
      }
      break;
  }

  return params;
}

/**
 * Get the i18n key for a notification type
 */
export function getNotificationTypeKey(type) {
  const keyMap = {
    COURSE_APPLICATION: "notifications.types.COURSE_APPLICATION",
    APPLICATION_ACCEPTED: "notifications.types.APPLICATION_ACCEPTED",
    APPLICATION_REJECTED: "notifications.types.APPLICATION_REJECTED",
    BOOKING_CONFIRMED: "notifications.types.BOOKING_CONFIRMED",
    BOOKING_CANCELLED: "notifications.types.BOOKING_CANCELLED",
    LESSON_REMINDER: "notifications.types.LESSON_REMINDER",
    LESSON_CANCELLED: "notifications.types.LESSON_CANCELLED",
    NEW_MESSAGE: "notifications.types.NEW_MESSAGE",
    MESSAGE: "notifications.types.NEW_MESSAGE",
    NEW_REVIEW: "notifications.types.NEW_REVIEW",
    TUTOR_APPROVED: "notifications.types.TUTOR_APPROVED",
    TUTOR_REJECTED: "notifications.types.TUTOR_REJECTED",
    COURSE_APPROVED: "notifications.types.COURSE_APPROVED",
    COURSE_REJECTED: "notifications.types.COURSE_REJECTED",
    APPLICATION_CANCELLED: "notifications.types.APPLICATION_CANCELLED",
    SYSTEM: "notifications.types.SYSTEM",
  };
  return keyMap[type] || `notifications.types.${type}`;
}
