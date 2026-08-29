export interface Lesson {
  id: string | number;
  booking_id?: string | number;
  course_title?: string;
  teacher_name?: string;
  student_name?: string;
  start_at?: string;
  end_at?: string;
  status: string;
  meeting_url?: string | null;
}

export interface MeetingToken {
  server_url?: string;
  token?: string;
}

export interface Review {
  id: string | number;
  course_id?: string | number;
  course_title?: string;
  author_name?: string;
  rating?: number;
  comment?: string;
  created_at?: string;
}

export interface CreateReviewPayload {
  rating: number;
  comment?: string;
}