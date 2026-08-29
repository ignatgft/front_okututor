export interface TeacherSummary {
  id: string | number;
  full_name?: string;
  avatar?: string | null;
  photoURL?: string | null;
  rating?: number;
  review_count?: number;
  experience_years?: number;
  subjects?: string[];
  languages?: string[];
}

export interface Course {
  id: string | number;
  title: string;
  description?: string;
  subject?: string | null;
  category?: string | null;
  days?: string[] | string | null;
  group_size?: string | null;
  location_type?: string | null;
  location?: string | null;
  experience?: string | null;
  price_per_hour?: number | null;
  currency?: string | null;
  max_students?: number | null;
  status?: string;
  teacher?: TeacherSummary | null;
  teacher_id?: string | number;
  teacher_name?: string;
  rating?: number | null;
  review_count?: number | null;
  student_count?: number | null;
  created_at?: string;
  updated_at?: string;
  has_review?: boolean;
  enrolled?: boolean;
}

export interface CoursePayload {
  title: string;
  description: string;
  subject: string;
  category?: string;
  days?: string | null;
  group_size: string;
  location_type: string;
  location?: string;
  experience?: string;
  price_per_hour: number;
  currency: string;
  max_students: number;
  status: string;
  specific_days?: string | null;
}