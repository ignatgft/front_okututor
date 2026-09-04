/**
 * Central API types — strict, no `any`.
 * Used by all src/api/** modules.
 */

// ---------------------------------------------------------------------------
// Generic transport
// ---------------------------------------------------------------------------

export interface HttpResult<T = unknown> {
  response: Response;
  data: T;
}

export type ApiResult<T = unknown> = Promise<HttpResult<T>>;

// Legacy alias used by some mobile code / tests
export type ApiResponse<T = unknown> = HttpResult<T>;

export interface ApiError {
  status: number;
  code: string;
  message: string;
  fieldErrors: Record<string, unknown> | null;
  retryable: boolean;
}

export interface PaginatedData<T> {
  content: T[];
  page?: number;
  size?: number;
  total_elements?: number;
  total_pages?: number;
  totalElements?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
  number?: number;
  empty?: boolean;
}

export type MaybePaginated<T> = T[] | PaginatedData<T>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function toList<T>(data: MaybePaginated<T> | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray((data as PaginatedData<T>).content)) return (data as PaginatedData<T>).content;
  return [];
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface UserDTO {
  id: string | number;
  email?: string;
  full_name?: string;
  fullName?: string;
  role?: string;
  avatar?: string | null;
  photoURL?: string | null;
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
  telegram?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  timezone?: string;
  email_verified?: boolean;
  verified?: boolean;
  rating?: number | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token?: string;
  refresh_token?: string;
  user?: UserDTO;
  status?: string;
  error?: string;
  email?: string;
  message?: string;
  requires_verification?: boolean;
  [key: string]: unknown;
}

export interface RegisterRequest {
  email: string;
  password: string;
  repeat_password: string;
  full_name: string;
  role: string;
}

export type RegisterResponse = LoginResponse;

export interface RefreshRequest {
  refresh_token?: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token?: string | null;
  [key: string]: unknown;
}

export interface CourseDTO {
  id: string | number;
  title: string;
  description?: string | null;
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
  teacher?: UserDTO | null;
  teacher_id?: string | number;
  teacher_name?: string;
  rating?: number | null;
  review_count?: number | null;
  student_count?: number | null;
  created_at?: string;
  updated_at?: string;
  has_review?: boolean;
  enrolled?: boolean;
  [key: string]: unknown;
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
  [key: string]: unknown;
}

export interface BookingDTO {
  id: string | number;
  course_id?: string | number;
  course_title?: string;
  course?: { title?: string };
  teacher_name?: string;
  tutor_name?: string;
  teacher?: { full_name?: string };
  student_name?: string;
  student?: { full_name?: string };
  teacher_id?: string | number;
  student_id?: string | number;
  start_at: string;
  end_at?: string;
  status: string;
  meeting_url?: string | null;
  location?: string | null;
  duration_minutes?: number;
  has_review?: boolean;
  created_at?: string;
  [key: string]: unknown;
}

export interface CreateBookingPayload {
  course_id?: string | number;
  date?: string;
  time?: string;
  duration_minutes?: number;
  [key: string]: unknown;
}

export interface EnrollmentDTO {
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
  [key: string]: unknown;
}

export interface LessonDTOBase {
  id: string | number;
  booking_id?: string | number;
  course_title?: string;
  course_id?: string | number;
  teacher_name?: string;
  student_name?: string;
  start_at?: string;
  end_at?: string;
  status: string;
  meeting_url?: string | null;
  location?: string | null;
  format?: string;
  [key: string]: unknown;
}

export interface MeetingToken {
  server_url?: string;
  token?: string;
  [key: string]: unknown;
}

export interface ReviewDTO {
  id: string | number;
  course_id?: string | number;
  course_title?: string;
  author_name?: string;
  rating?: number;
  comment?: string;
  student_name?: string;
  student_avatar?: string | null;
  created_at?: string;
  [key: string]: unknown;
}

export interface CreateReviewPayload {
  rating: number;
  comment?: string;
  [key: string]: unknown;
}

export interface SearchParams extends Record<string, unknown> {
  q?: string;
  page?: number | string;
  size?: number | string;
  price_min?: number | string;
  price_max?: number | string;
  rating_min?: number | string;
  [key: string]: unknown;
}

export interface TutorApplicationDTO {
  id: string | number;
  status: string;
  full_name?: string;
  phone?: string;
  rejection_reason?: string | null;
  subjects?: string;
  languages?: string;
  bio?: string;
  created_at?: string;
  [key: string]: unknown;
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
  [key: string]: unknown;
}

export interface AvailabilitySlot {
  id?: string | number;
  weekday: string;
  start_time: string;
  end_time: string;
  [key: string]: unknown;
}

export interface ConversationDTO {
  id: string | number;
  type?: string;
  counterpart_name?: string;
  counterpart_avatar?: string | null;
  counterpart_id?: string | number;
  unread_count?: number;
  last_message?: string | null;
  updated_at?: string;
  ticket_id?: string | number;
  ticket_status?: string;
  ticket_priority?: string;
  ticket_category?: string;
  [key: string]: unknown;
}

export interface MessageDTO {
  id: string | number;
  conversation_id?: string | number;
  sender_id?: string | number;
  body: string;
  created_at?: string;
  own?: boolean;
  is_own?: boolean;
  read_at?: string | null;
  sender_name?: string;
  [key: string]: unknown;
}

export interface SendMessagePayload {
  conversation_id?: string | number;
  body: string;
  attachment_id?: string | number | null;
  [key: string]: unknown;
}

export interface SupportTicketDTO {
  id: string | number;
  subject: string;
  status: string;
  priority: string;
  category: string;
  message?: string;
  unread_count?: number;
  last_message?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface SupportMessageDTO {
  id: string | number;
  ticket_id?: string | number;
  body: string;
  sender_id?: string | number;
  sender_name?: string;
  created_at?: string;
  own?: boolean;
  [key: string]: unknown;
}

export interface NotificationDTO {
  id: string | number;
  type?: string;
  message?: string;
  read?: boolean;
  created_at?: string;
  link?: string | null;
  [key: string]: unknown;
}

export interface ScheduleProposalDTO {
  id: string | number;
  applicationId?: string | number;
  timezone?: string;
  start_date?: string;
  end_date?: string;
  duration_minutes?: number;
  slots?: AvailabilitySlot[];
  status?: string;
  [key: string]: unknown;
}

export interface ProposeSchedulePayload {
  timezone: string;
  format?: string;
  start_date: string;
  end_date: string;
  duration_minutes: number;
  slots: AvailabilitySlot[];
  message?: string;
  location_address?: string;
  location_details?: string;
  location_type?: string;
  [key: string]: unknown;
}

// Type guards
export function isPaginatedData<T>(value: unknown): value is PaginatedData<T> {
  return isRecord(value) && Array.isArray((value as Record<string, unknown>).content);
}
