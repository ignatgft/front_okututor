export interface SupportTicket {
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
}

export interface SupportMessage {
  id: string | number;
  ticket_id?: string | number;
  body: string;
  sender_id?: string | number;
  sender_name?: string;
  created_at?: string;
  own?: boolean;
}