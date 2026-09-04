import { useState, useEffect, useCallback, useRef } from "react";
import { supportApi } from "../../api/support.api";
import type { SupportMessageDTO, SupportTicketDTO } from "../../types/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export type ClientSupportMessage = SupportMessageDTO & {
  client_status: "SENDING" | "SENT" | "FAILED";
  type?: string;
  attachments?: unknown[];
  sender_role?: string;
  ticket_id?: string | number;
};

function toList(data: unknown): SupportMessageDTO[] {
  if (Array.isArray(data)) return data as SupportMessageDTO[];
  if (isRecord(data) && Array.isArray(data["content"])) return data["content"] as SupportMessageDTO[];
  return [];
}

export interface UseSupportChatReturn {
  messages: ClientSupportMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  sendMessage: (body: string, type?: string) => Promise<unknown | null>;
  retryMessage: (failedMsg: ClientSupportMessage) => Promise<void>;
  markRead: () => Promise<void>;
  refetch: () => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<ClientSupportMessage[]>>;
}

export default function useSupportChat(ticketId: string | number | null | undefined): UseSupportChatReturn {
  const [messages, setMessages] = useState<ClientSupportMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const markReadCalledRef = useRef<boolean>(false);

  const fetchMessages = useCallback(async (): Promise<void> => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const { response, data } = await supportApi.getMessages(ticketId);
      if (response.ok) {
        const list = toList(data);
        setMessages(list.map((m) => ({ ...m, client_status: "SENT" as const })));
      }
    } catch {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { void fetchMessages(); }, [fetchMessages]);

  const markRead = useCallback(async (): Promise<void> => {
    if (!ticketId || markReadCalledRef.current) return;
    markReadCalledRef.current = true;
    try { await supportApi.markRead(ticketId); } catch { /* noop */ }
  }, [ticketId]);

  const sendMessage = useCallback(async (body: string, type = "USER_VISIBLE"): Promise<unknown | null> => {
    if (!ticketId || !body?.trim()) return null;
    const clientMsg: ClientSupportMessage = {
      id: `local-${Date.now()}`,
      ticket_id: ticketId,
      sender_id: 0,
      sender_name: "You",
      sender_role: "USER",
      body: body.trim(),
      created_at: new Date().toISOString(),
      type,
      attachments: [],
      client_status: "SENDING",
    };
    setMessages((prev) => [...prev, clientMsg]);
    setSending(true);
    try {
      const { response, data } = await supportApi.sendMessage(ticketId, { body: body.trim(), type });
      if (response.ok) {
        setMessages((prev) => prev.map((m) => m.id === clientMsg.id ? { ...(data as SupportMessageDTO), client_status: "SENT" as const } : m));
        return data;
      }
      setMessages((prev) => prev.map((m) => m.id === clientMsg.id ? { ...m, client_status: "FAILED" as const } : m));
      return null;
    } catch {
      setMessages((prev) => prev.map((m) => m.id === clientMsg.id ? { ...m, client_status: "FAILED" as const } : m));
      return null;
    } finally {
      setSending(false);
    }
  }, [ticketId]);

  const retryMessage = useCallback(async (failedMsg: ClientSupportMessage): Promise<void> => {
    if (!ticketId) return;
    setMessages((prev) => prev.map((m) => m.id === failedMsg.id ? { ...m, client_status: "SENDING" as const } : m));
    try {
      const { response, data } = await supportApi.sendMessage(ticketId, { body: failedMsg.body, type: failedMsg.type });
      if (response.ok) {
        setMessages((prev) => prev.map((m) => m.id === failedMsg.id ? { ...(data as SupportMessageDTO), client_status: "SENT" as const } : m));
      } else {
        setMessages((prev) => prev.map((m) => m.id === failedMsg.id ? { ...m, client_status: "FAILED" as const } : m));
      }
    } catch {
      setMessages((prev) => prev.map((m) => m.id === failedMsg.id ? { ...m, client_status: "FAILED" as const } : m));
    }
  }, [ticketId]);

  return { messages, loading, sending, error, sendMessage, retryMessage, markRead, refetch: fetchMessages, setMessages };
}
