import { useState, useEffect, useCallback, useRef } from "react";
import { supportApi } from "../../api/support.api";

export default function useSupportChat(ticketId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const markReadCalledRef = useRef(false);

  const fetchMessages = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const { response, data } = await supportApi.getMessages(ticketId);
      if (response.ok) {
        setMessages((data?.content || data || []).map(m => ({ ...m, client_status: "SENT" })));
      }
    } catch {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const markRead = useCallback(async () => {
    if (!ticketId || markReadCalledRef.current) return;
    markReadCalledRef.current = true;
    try { await supportApi.markRead(ticketId); } catch { /* noop */ }
  }, [ticketId]);

  const sendMessage = useCallback(async (body, type = "USER_VISIBLE") => {
    if (!ticketId || !body?.trim()) return null;
    const clientMsg = {
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
    setMessages(prev => [...prev, clientMsg]);
    setSending(true);
    try {
      const { response, data } = await supportApi.sendMessage(ticketId, { body: body.trim(), type });
      if (response.ok) {
        setMessages(prev => prev.map(m => m.id === clientMsg.id ? { ...data, client_status: "SENT" } : m));
        return data;
      }
      setMessages(prev => prev.map(m => m.id === clientMsg.id ? { ...m, client_status: "FAILED" } : m));
      return null;
    } catch {
      setMessages(prev => prev.map(m => m.id === clientMsg.id ? { ...m, client_status: "FAILED" } : m));
      return null;
    } finally {
      setSending(false);
    }
  }, [ticketId]);

  const retryMessage = useCallback(async (failedMsg) => {
    setMessages(prev => prev.map(m => m.id === failedMsg.id ? { ...m, client_status: "SENDING" } : m));
    try {
      const { response, data } = await supportApi.sendMessage(ticketId, { body: failedMsg.body, type: failedMsg.type });
      if (response.ok) {
        setMessages(prev => prev.map(m => m.id === failedMsg.id ? { ...data, client_status: "SENT" } : m));
      } else {
        setMessages(prev => prev.map(m => m.id === failedMsg.id ? { ...m, client_status: "FAILED" } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === failedMsg.id ? { ...m, client_status: "FAILED" } : m));
    }
  }, [ticketId]);

  return { messages, loading, sending, error, sendMessage, retryMessage, markRead, refetch: fetchMessages, setMessages };
}
