import { Role } from "../constants/roles";

export interface User {
  id: string | number;
  full_name?: string;
  email?: string;
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
  telegram?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  avatar?: string | null;
  photoURL?: string | null;
  experience_years?: number | null;
  education?: string | null;
  role?: Role;
  email_verified?: boolean;
  created_at?: string;
}

export interface UserUpdatePayload {
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  telegram?: string;
  instagram?: string;
  whatsapp?: string;
  experience_years?: number;
  education?: string;
}