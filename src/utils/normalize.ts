type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord {
  if (typeof value === "object" && value !== null) return value as RawRecord;
  return {};
}

function getString(raw: RawRecord, keys: string[], fallback = ""): string {
  for (const k of keys) {
    const v = raw[k];
    if (typeof v === "string" && v) return v;
  }
  return fallback;
}

function getValue<T>(raw: RawRecord, keys: string[], fallback: T): T {
  for (const k of keys) {
    const v = raw[k];
    if (v !== undefined && v !== null) return v as T;
  }
  return fallback;
}

export interface NormalizedEnrollment extends RawRecord {
  id: string | number | null;
  status: string;
  course_id: string | number | null;
  course_title: string;
  course: unknown;
  student_id: string | number | null;
  student_name: string;
  student: unknown;
  teacher_name: string;
  preferred_schedule: string;
  preferred_days: unknown[];
  preferred_start_time: string;
  preferred_end_time: string;
  message: string;
  created_at: string | null;
  updated_at: string | null;
  raw: RawRecord;
}

export function normalizeEnrollment(raw: unknown = {}): NormalizedEnrollment {
  const r = asRecord(raw);
  const course = asRecord(r["course"]);
  const student = asRecord(r["student"]);
  return {
    id: (r["id"] as string | number | undefined) ?? (r["enrollment_id"] as string | number | undefined) ?? (r["_id"] as string | number | undefined) ?? null,
    status: getString(r, ["status", "enrollment_status"], "PENDING"),
    course_id: (r["course_id"] as string | number | undefined) ?? (course["id"] as string | number | undefined) ?? (r["courseId"] as string | number | undefined) ?? null,
    course_title: getString(r, ["course_title"], course["title"] as string ?? getString(r, ["courseTitle"], "")),
    course: r["course"] ?? null,
    student_id: (r["student_id"] as string | number | undefined) ?? (student["id"] as string | number | undefined) ?? null,
    student_name: getString(r, ["student_name"], student["full_name"] as string ?? getString(r, ["studentName"], "")),
    student: r["student"] ?? null,
    teacher_name: getString(r, ["teacher_name"], course["teacher_name"] as string ?? ""),
    preferred_schedule: getString(r, ["preferred_schedule", "preferredSchedule"], ""),
    preferred_days: (r["preferred_days"] as unknown[] | undefined) ?? (r["preferredDays"] as unknown[] | undefined) ?? [],
    preferred_start_time: getString(r, ["preferred_start_time", "preferredStartTime", "preferred_time"], ""),
    preferred_end_time: getString(r, ["preferred_end_time", "preferredEndTime"], ""),
    message: getString(r, ["message", "comment"], ""),
    created_at: getValue<string | null>(r, ["created_at", "createdAt", "created"], null),
    updated_at: getValue<string | null>(r, ["updated_at", "updatedAt"], null),
    raw: r,
  };
}

export interface NormalizedCourse extends RawRecord {
  id: string | number | null;
  title: string;
  description: string;
  teacher_id: string | number | null;
  teacher_name: string;
  teacher_avatar: string;
  price_per_hour: number | null;
  price: number | null;
  location_type: string | null;
  group_size: string | null;
  subject: string | null;
  status: string | null;
  raw: RawRecord;
}

export function normalizeCourse(raw: unknown = {}): NormalizedCourse {
  const r = asRecord(raw);
  const teacher = asRecord(r["teacher"]);
  return {
    id: (r["id"] as string | number | undefined) ?? (r["_id"] as string | number | undefined) ?? null,
    title: getString(r, ["title", "name"], ""),
    description: getString(r, ["description"], ""),
    teacher_id: (r["teacher_id"] as string | number | undefined) ?? (r["teacherId"] as string | number | undefined) ?? (teacher["id"] as string | number | undefined) ?? null,
    teacher_name: getString(r, ["teacher_name", "teacherName"], teacher["full_name"] as string ?? ""),
    teacher_avatar: getString(r, ["teacher_avatar", "teacherAvatar"], teacher["avatar"] as string ?? ""),
    price_per_hour: (r["price_per_hour"] as number | null | undefined) ?? (r["pricePerHour"] as number | null | undefined) ?? (r["price"] as number | null | undefined) ?? null,
    price: (r["price_per_hour"] as number | null | undefined) ?? (r["price"] as number | null | undefined) ?? null,
    location_type: getValue<string | null>(r, ["location_type", "locationType"], null),
    group_size: getValue<string | null>(r, ["group_size", "groupSize"], null),
    subject: getValue<string | null>(r, ["subject"], null),
    status: getValue<string | null>(r, ["status"], null),
    raw: r,
  };
}

export interface NormalizedUser extends RawRecord {
  id: string | number | null;
  full_name: string;
  email: string;
  role: string;
  avatar: string;
  timezone: string | null;
  raw: RawRecord;
}

export function normalizeUser(raw: unknown = {}): NormalizedUser {
  const r = asRecord(raw);
  return {
    id: (r["id"] as string | number | undefined) ?? (r["_id"] as string | number | undefined) ?? null,
    full_name: getString(r, ["full_name", "fullName", "name"], ""),
    email: getString(r, ["email"], ""),
    role: getString(r, ["role"], "STUDENT"),
    avatar: getString(r, ["avatar", "avatar_url"], ""),
    timezone: getValue<string | null>(r, ["timezone"], null),
    raw: r,
  };
}

export interface NormalizedLesson extends RawRecord {
  id: string | number | null;
  courseId: string | number | null;
  courseTitle: string;
  tutorId: string | number | null;
  tutorName: string;
  tutorAvatar: string | null;
  studentId: string | number | null;
  studentName: string;
  startAt: string | null;
  endAt: string | null;
  timezone: string;
  status: string;
  statusLabel: string;
  format: string;
  meetingRoomId: string | number | null;
  meetingUrl: string | null;
  location: string | null;
  locationType: string | null;
  locationAddress: string | null;
  locationDetails: string | null;
  canJoin: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  canReview: boolean;
  canStart: boolean;
  canComplete: boolean;
  canMarkStudentNoShow: boolean;
  canMarkTutorNoShow: boolean;
  canReportIssue: boolean;
  cancelledBy: unknown;
  cancelReason: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  durationMinutes: number | null;
  startedBy: unknown;
  completedBy: unknown;
  topic: string | null;
  notes: string | null;
  homework: string | null;
  materials: string | null;
  links: string | null;
  attendance: string | null;
  pendingStartAt: string | null;
  pendingEndAt: string | null;
  pendingReason: string | null;
  pendingFormat: string | null;
  pendingLocationType: string | null;
  pendingLocationAddress: string | null;
  pendingLocationDetails: string | null;
  pendingDurationMinutes: number | null;
  pendingScope: string | null;
  pendingProposedBy: unknown;
  pendingProposedAt: string | null;
  sequenceNumber: number | null;
  scheduleId: string | number | null;
  bookingId: string | number | null;
  createdAt: string | null;
  updatedAt: string | null;
  raw: RawRecord;
}

export function normalizeLesson(raw: unknown = {}): NormalizedLesson | null {
  if (!raw) return null;
  const r = asRecord(raw);
  const getBool = (keys: string[], fallback = false): boolean => {
    for (const k of keys) {
      const v = r[k];
      if (typeof v === "boolean") return v;
    }
    return fallback;
  };
  return {
    id: (r["id"] as string | number | undefined) ?? (r["_id"] as string | number | undefined) ?? null,
    courseId: (r["course_id"] as string | number | undefined) ?? (r["courseId"] as string | number | undefined) ?? null,
    courseTitle: getString(r, ["course_title", "courseTitle", "title"], ""),
    tutorId: (r["tutor_id"] as string | number | undefined) ?? (r["tutorId"] as string | number | undefined) ?? null,
    tutorName: getString(r, ["tutor_name", "tutorName"], ""),
    tutorAvatar: getValue<string | null>(r, ["tutor_avatar", "tutorAvatar"], null),
    studentId: (r["student_id"] as string | number | undefined) ?? (r["studentId"] as string | number | undefined) ?? null,
    studentName: getString(r, ["student_name", "studentName"], ""),
    startAt: getValue<string | null>(r, ["start_at", "startAt"], null),
    endAt: getValue<string | null>(r, ["end_at", "endAt"], null),
    timezone: getString(r, ["timezone"], "UTC"),
    status: getString(r, ["status"], "SCHEDULED"),
    statusLabel: getString(r, ["status_label", "statusLabel", "status"], ""),
    format: getString(r, ["format"], "ONLINE"),
    meetingRoomId: getValue(r, ["meeting_room_id", "meetingRoomId"], null) as string | number | null,
    meetingUrl: getValue<string | null>(r, ["meeting_url", "meetingUrl"], null),
    location: getValue<string | null>(r, ["location", "location_address"], null),
    locationType: getValue<string | null>(r, ["location_type", "locationType"], null),
    locationAddress: getValue<string | null>(r, ["location_address", "locationAddress"], null),
    locationDetails: getValue<string | null>(r, ["location_details", "locationDetails"], null),
    canJoin: getBool(["can_join", "canJoin"], false),
    canCancel: getBool(["can_cancel", "canCancel"], false),
    canReschedule: getBool(["can_reschedule", "canReschedule"], false),
    canReview: getBool(["can_review", "canReview"], false),
    canStart: getBool(["can_start", "canStart"], false),
    canComplete: getBool(["can_complete", "canComplete"], false),
    canMarkStudentNoShow: getBool(["can_mark_student_no_show", "canMarkStudentNoShow"], false),
    canMarkTutorNoShow: getBool(["can_mark_tutor_no_show", "canMarkTutorNoShow"], false),
    canReportIssue: getBool(["can_report_issue", "canReportIssue"], false),
    cancelledBy: r["cancelled_by"] ?? r["cancelledBy"] ?? null,
    cancelReason: getValue<string | null>(r, ["cancel_reason", "cancelReason"], null),
    actualStart: getValue<string | null>(r, ["actual_start", "actualStart"], null),
    actualEnd: getValue<string | null>(r, ["actual_end", "actualEnd"], null),
    durationMinutes: getValue<number | null>(r, ["duration_minutes", "durationMinutes"], null),
    startedBy: r["started_by"] ?? r["startedBy"] ?? null,
    completedBy: r["completed_by"] ?? r["completedBy"] ?? null,
    topic: getValue<string | null>(r, ["topic"], null),
    notes: getValue<string | null>(r, ["notes"], null),
    homework: getValue<string | null>(r, ["homework"], null),
    materials: getValue<string | null>(r, ["materials"], null),
    links: getValue<string | null>(r, ["links"], null),
    attendance: getValue<string | null>(r, ["attendance"], null),
    pendingStartAt: getValue<string | null>(r, ["pending_start_at", "pendingStartAt"], null),
    pendingEndAt: getValue<string | null>(r, ["pending_end_at", "pendingEndAt"], null),
    pendingReason: getValue<string | null>(r, ["pending_reason", "pendingReason"], null),
    pendingFormat: getValue<string | null>(r, ["pending_format", "pendingFormat"], null),
    pendingLocationType: getValue<string | null>(r, ["pending_location_type", "pendingLocationType"], null),
    pendingLocationAddress: getValue<string | null>(r, ["pending_location_address", "pendingLocationAddress"], null),
    pendingLocationDetails: getValue<string | null>(r, ["pending_location_details", "pendingLocationDetails"], null),
    pendingDurationMinutes: getValue<number | null>(r, ["pending_duration_minutes", "pendingDurationMinutes"], null),
    pendingScope: getValue<string | null>(r, ["pending_scope", "pendingScope"], null),
    pendingProposedBy: r["pending_proposed_by"] ?? r["pendingProposedBy"] ?? null,
    pendingProposedAt: getValue<string | null>(r, ["pending_proposed_at", "pendingProposedAt"], null),
    sequenceNumber: getValue<number | null>(r, ["sequence_number", "sequenceNumber"], null),
    scheduleId: getValue(r, ["schedule_id", "scheduleId"], null) as string | number | null,
    bookingId: getValue(r, ["booking_id", "bookingId"], null) as string | number | null,
    createdAt: getValue<string | null>(r, ["created_at", "createdAt"], null),
    updatedAt: getValue<string | null>(r, ["updated_at", "updatedAt"], null),
    raw: r,
  };
}

export function normalizeNotification(raw: unknown = {}): Record<string, unknown> {
  const r = asRecord(raw);
  const type = typeof r["type"] === "string" ? (r["type"] as string) : "";
  const message = (r["message"] as string | undefined) ?? (r["text"] as string | undefined) ?? "";
  const payload = asRecord(r["payload"] ?? {});
  const isRawBackendMessage = /^[A-Z_]+[A-Z]/.test(message) || /^[A-Z_]{3,}[a-z]/.test(message);
  const params = extractNotificationParams(type, message, payload);
  return {
    id: (r["id"] as string | number | undefined) ?? (r["_id"] as string | number | undefined) ?? null,
    type,
    read: (r["read"] as boolean | undefined) ?? false,
    created_at: (r["created_at"] as string | undefined) ?? (r["createdAt"] as string | undefined) ?? null,
    link: (r["link"] as string | null | undefined) ?? null,
    payload,
    params,
    rawMessage: isRawBackendMessage ? null : (message || null),
  };
}

function extractNotificationParams(type: string, message: string, payload: RawRecord): RawRecord {
  const params: RawRecord = { ...payload };
  switch (type) {
    case "MESSAGE":
    case "NEW_MESSAGE": {
      const msgMatch = message.match(/MESSAGE\s*New message from\s+(.+)/i);
      if (msgMatch) params["senderName"] = msgMatch[1].trim();
      const previewMatch = message.match(/New message from\s+.+?[:：]\s*(.+)/i);
      if (previewMatch) params["preview"] = previewMatch[1].trim();
      break;
    }
    case "APPLICATION_CANCELLED": {
      const cancelMatch = message.match(/APPLICATION_CANCELLED\s*(.+?)\s+cancelled/i);
      if (cancelMatch) params["studentName"] = cancelMatch[1].trim();
      break;
    }
    case "COURSE_APPLICATION":
      if (payload["course_title"]) params["courseTitle"] = payload["course_title"];
      if (payload["student_name"]) params["studentName"] = payload["student_name"];
      break;
    case "APPLICATION_ACCEPTED":
    case "APPLICATION_REJECTED":
      if (payload["course_title"]) params["courseTitle"] = payload["course_title"];
      if (payload["tutor_name"]) params["tutorName"] = payload["tutor_name"];
      break;
    case "BOOKING_CONFIRMED":
    case "BOOKING_CANCELLED":
    case "BOOKING_COMPLETED":
      if (payload["course_title"]) params["courseTitle"] = payload["course_title"];
      if (payload["tutor_name"]) params["tutorName"] = payload["tutor_name"];
      if (payload["start_at"]) params["startAt"] = payload["start_at"];
      break;
    case "LESSON_REMINDER":
      if (payload["course_title"]) params["courseTitle"] = payload["course_title"];
      if (payload["tutor_name"]) params["tutorName"] = payload["tutor_name"];
      if (payload["start_at"]) params["startAt"] = payload["start_at"];
      break;
    case "NEW_REVIEW":
      if (payload["course_title"]) params["courseTitle"] = payload["course_title"];
      if (payload["rating"]) params["rating"] = payload["rating"];
      break;
    case "TUTOR_APPROVED":
    case "TUTOR_REJECTED":
      if (payload["tutor_name"]) params["tutorName"] = payload["tutor_name"];
      break;
    case "COURSE_APPROVED":
    case "COURSE_REJECTED":
      if (payload["course_title"]) params["courseTitle"] = payload["course_title"];
      break;
    case "SYSTEM":
      if (message && !message.startsWith("SYSTEM")) {
        params["message"] = message;
      }
      break;
    default:
      break;
  }
  return params;
}

export function getNotificationTypeKey(type: string): string {
  const keyMap: Record<string, string> = {
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
  return keyMap[type] ?? `notifications.types.${type}`;
}
