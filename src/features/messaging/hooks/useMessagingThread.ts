import { useState, useEffect } from "react";
import { loadSupportThread, messagesApi } from "../../../api/messages.api";
import { CONVERSATION_TYPES } from "../../../constants/roles";
import { POLL_INTERVAL } from "../utils/messageHelpers";
import type { ConversationDTO } from "../../../types/api";

export function useMessagingThread(activeConvo: ConversationDTO | null): {
  messages: Record<string, unknown>[];
  threadLoading: boolean;
  setMessages: (msgs: Record<string, unknown>[]) => void;
} {
  const [messages, setMessages] = useState<Record<string, unknown>[]>([]);
  const [threadLoading, setThreadLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!activeConvo) { setMessages([]); return undefined; }
    let cancelled = false;
    const loadThread = async (): Promise<void> => {
      try {
        let msgs: Record<string, unknown>[];
        if ((activeConvo as Record<string, unknown>)["type"] === CONVERSATION_TYPES.SUPPORT) {
          msgs = (await loadSupportThread((activeConvo as Record<string, unknown>)["ticket_id"] as string)) as Record<string, unknown>[];
        } else {
          const { response, data } = await messagesApi.conversation(String((activeConvo as Record<string, unknown>)["id"] ?? ""));
          const rec = data as Record<string, unknown> | unknown[];
          if (response.ok) {
            if (Array.isArray(rec)) msgs = rec as Record<string, unknown>[];
            else if (rec && typeof rec === "object" && Array.isArray((rec as Record<string, unknown>)["messages"])) msgs = (rec as Record<string, unknown>)["messages"] as Record<string, unknown>[];
            else msgs = [];
          } else msgs = [];
        }
        if (!cancelled) setMessages(msgs);
        const type = (activeConvo as Record<string, unknown>)["type"];
        const id = (activeConvo as Record<string, unknown>)["id"];
        if (type !== CONVERSATION_TYPES.SUPPORT && id && !String(id).startsWith("support-")) {
          messagesApi.markConversationRead(String(id)).catch(() => {});
        }
      } catch { /* keep */ }
    };
    setThreadLoading(true);
    void loadThread().finally(() => !cancelled && setThreadLoading(false));
    const timer = window.setInterval(() => void loadThread(), POLL_INTERVAL);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [activeConvo]);

  return { messages, threadLoading, setMessages };
}
