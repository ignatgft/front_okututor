import { ConversationType } from "../constants/roles";

export interface Conversation {
  id: string | number;
  type?: ConversationType;
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
}

export interface Message {
  id: string | number;
  conversation_id?: string | number;
  sender_id?: string | number;
  body: string;
  created_at?: string;
  own?: boolean;
  is_own?: boolean;
  read_at?: string | null;
  sending?: boolean;
  failed?: boolean;
  sender_name?: string;
}

export interface SendMessagePayload {
  conversation_id: string | number;
  body: string;
}