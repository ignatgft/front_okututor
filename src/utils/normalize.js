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
