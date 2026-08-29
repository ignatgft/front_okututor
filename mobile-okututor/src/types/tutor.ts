import { User } from "./user";

export interface AppNotification {
  id: string | number;
  type?: string;
  message?: string;
  read?: boolean;
  created_at?: string;
  link?: string | null;
  scheduled_at?: string | null;
  payload?: {
    booking_id?: string | number;
    enrollment_id?: string | number;
    course_id?: string | number;
    conversation_id?: string | number;
  } | null;
}

export interface TutorProfile {
  id: string | number;
  full_name?: string;
  avatar?: string | null;
  photoURL?: string | null;
  bio?: string | null;
  rating?: number;
  review_count?: number;
  experience_years?: number;
  education?: string | null;
  subjects?: string[];
  languages?: string[];
  location?: string | null;
  phone?: string | null;
  status?: string;
  rejection_reason?: string | null;
  courses?: CourseSummary[];
}

export interface CourseSummary {
  id: string | number;
  title: string;
  price_per_hour?: number | null;
  currency?: string | null;
  subject?: string | null;
  location_type?: string | null;
  rating?: number | null;
  review_count?: number | null;
  status?: string;
}

export interface TutorApplicationPayload {
  full_name: string;
  phone: string;
  location?: string;
  experience_years: number;
  experience_description?: string;
  education?: string;
  subjects?: string;
  languages?: string;
  bio?: string;
  id_document_name?: string;
}

export interface TutorApplication {
  id: string | number;
  status: string;
  full_name?: string;
  phone?: string;
  rejection_reason?: string | null;
  subjects?: string;
  languages?: string;
  bio?: string;
  created_at?: string;
}

export function asUserProfile(tutor: TutorProfile | null | undefined): User | null {
  if (!tutor) return null;
  return {
    id: tutor.id,
    full_name: tutor.full_name,
    avatar: tutor.avatar,
    photoURL: tutor.photoURL,
    bio: tutor.bio,
    phone: tutor.phone,
    location: tutor.location,
    experience_years: tutor.experience_years,
    education: tutor.education,
  };
}