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

  // If message already looks localized (contains spaces, not concatenated), return as-is
  const looksLocalized = /^[A-Z_]+[a-z\s]/.test(message) || message.includes(" ");

  return {
    id: raw.id ?? raw._id ?? null,
    type,
    read: raw.read ?? false,
    created_at: raw.created_at ?? raw.createdAt ?? null,
    link: raw.link ?? null,
    payload,
    // Extract structured data for i18n
    params: extractNotificationParams(type, message, payload),
    // Fallback to raw message if we can't parse
    rawMessage: looksLocalized ? message : null,
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
      // System notifications might have custom messages
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
