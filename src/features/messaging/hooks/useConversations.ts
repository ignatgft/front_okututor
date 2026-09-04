import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { loadUnifiedConversations } from "../../../api/messages.api";
import { CONVERSATION_TYPES } from "../../../constants/roles";
import type { ConversationDTO } from "../../../types/api";

export function useConversations(): {
  conversations: ConversationDTO[];
  activeConvo: ConversationDTO | null;
  setActiveConvo: (c: ConversationDTO | null) => void;
  filter: string;
  setFilter: (f: string) => void;
  query: string;
  setQuery: (q: string) => void;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
} {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<ConversationDTO[]>([]);
  const [activeConvo, setActiveConvo] = useState<ConversationDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [filter, setFilter] = useState<string>(() => {
    const param = searchParams.get("filter");
    if (param === "support") return CONVERSATION_TYPES.SUPPORT;
    if (param === "direct") return CONVERSATION_TYPES.DIRECT;
    return "all";
  });
  const [query, setQuery] = useState<string>("");

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      const all = await loadUnifiedConversations();
      setConversations(all as ConversationDTO[]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const ticketId = searchParams.get("ticket");
    if (ticketId && conversations.length > 0) {
      const match = conversations.find((c) => (c as Record<string, unknown>)["type"] === CONVERSATION_TYPES.SUPPORT && (c as Record<string, unknown>)["ticket_id"] === ticketId);
      if (match) setActiveConvo(match);
    }
  }, [searchParams, conversations]);

  return { conversations, activeConvo, setActiveConvo, filter, setFilter, query, setQuery, loading, error, reload: load };
}
