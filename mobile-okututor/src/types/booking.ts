export interface Booking {
  id: string | number;
  course_id?: string | number;
  course_title?: string;
  teacher_name?: string;
  teacher_id?: string | number;
  student_name?: string;
  student_id?: string | number;
  start_at: string;
  end_at?: string;
  status: string;
  meeting_url?: string | null;
  location?: string | null;
  duration_minutes?: number;
  has_review?: boolean;
  created_at?: string;
}

export interface CreateBookingPayload {
  course_id: string | number;
  date: string;
  time: string;
  duration_minutes: number;
}

export interface Enrollment {
  id: string | number;
  course_id?: string | number;
  course_title?: string;
  student_id?: string | number;
  student_name?: string;
  tutor_id?: string | number;
  tutor_name?: string;
  status: string;
  message?: string;
  preferred_schedule?: string;
  created_at?: string;
}

export interface AvailabilitySlotInput {
  weekday: string;
  start_time: string;
  end_time: string;
}