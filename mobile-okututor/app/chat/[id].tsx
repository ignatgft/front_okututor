import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "../../src/components/ui/Screen";
import { ScreenHeader } from "../../src/components/features/ScreenHeader";
import { EmptyState } from "../../src/components/ui";
import {
  loadUnifiedConversations,
  loadSupportThread,
  sendSupportMessage,
 messagesApi } from "../../src/api/messages.api";
import { Conversation, Message } from "../../src/types/message";
import { toList } from "../../src/types/api";
import { useAuthStore } from "../../src/store/authStore";
import { useTheme } from "../../src/theme/ThemeProvider";
import { spacing } from "../../src/theme/spacing";
import { formatTime } from "../../src/utils/calendar";

const POLL_MS = 5000;

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const [conv, setConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<View>(null);

  const isTicket = typeof id === "string" && id.startsWith("support-");
  const ticketId = isTicket ? id.replace(/^support-/, "") : null;

  const load = useCallback(async () => {
    try {
      const items = await loadUnifiedConversations();
      const current = items.find((c) => String(c.id) === String(id)) || null;
      setConv(current);
      if (isTicket && ticketId) {
        const msgs = await loadSupportThread(ticketId);
        setMessages(msgs);
      } else {
        const { response, data } = await messagesApi.conversation(id);
        if (response.ok) setMessages(toList<Message>(data));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => {
      (async () => {
        try {
          let fresh: Message[] | null = null;
          if (isTicket && ticketId) fresh = await loadSupportThread(ticketId);
          else {
            const { response, data } = await messagesApi.conversation(id);
            if (response.ok) fresh = toList<Message>(data);
          }
          if (fresh) {
            setMessages((prev) => {
              const known = new Set(prev.map((m) => String(m.id)));
              const added = fresh.filter((m) => !known.has(String(m.id)));
              if (added.length === 0) return prev;
              return [...prev, ...added].sort((a, b) => timeOf(a) - timeOf(b));
            });
          }
        } catch {
          // silent poll failure
        }
      })();
    }, POLL_MS);
    return () => clearInterval(timer);
     
  }, [id, isTicket, ticketId]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    setSending(true);
    const temp: Message = {
      id: `temp-${Date.now()}`,
      sender_id: user?.id,
      body,
      created_at: new Date().toISOString(),
      own: true,
      is_own: true,
      sending: true,
    };
    setMessages((prev) => [...prev, temp]);
    try {
      if (isTicket && ticketId) {
        await sendSupportMessage(ticketId, body);
      } else {
        const { response, data } = await messagesApi.send({ conversation_id: id, body });
        if (!response.ok) throw new Error((data as { message?: string })?.message || "Failed to send");
      }
      setMessages((prev) => prev.map((m) => (m.id === temp.id ? { ...m, sending: false, id: `sent-${Date.now()}` } : m)));
      setTimeout(() => listRef.current?.measure(() => {}), 0);
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === temp.id ? { ...m, sending: false, failed: true } : m)));
    } finally {
      setSending(false);
    }
  };

  const title =
    conv?.counterpart_name ||
    (isTicket && ticketId ? t("support.title", "Support") : t("chat.title", "Chat"));

  return (
    <Screen keyboard>
      <ScreenHeader title={String(title)} back />
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>
      ) : error && messages.length === 0 ? (
        <EmptyState title={error} onAction={load} />
      ) : (
        <>
          <View
            ref={listRef}
            style={[styles.list, { backgroundColor: theme.colors.background }]}
          >
            {messages.map((m, idx) => {
              const mine = m.is_own === true || m.own === true || (!!m.sender_id && String(m.sender_id) === String(user?.id));
              const showDate =
                idx === 0 ||
                (m.created_at && messages[idx - 1]?.created_at
                  ? timeOf(m) - timeOf(messages[idx - 1]!) > 300_000
                  : true);
              return (
                <View key={String(m.id)} style={[styles.bubbleRow, mine ? styles.bubbleRowMine : null]}>
                  {showDate && m.created_at ? (
                    <Text style={[styles.timeLabel, { color: theme.colors.textMuted }]}>
                      {formatTime(m.created_at)}
                    </Text>
                  ) : null}
                  <View
                    style={[
                      styles.bubble,
                      { backgroundColor: mine ? theme.colors.primary : theme.colors.surface, borderColor: mine ? theme.colors.primary : theme.colors.border },
                    ]}
                  >
                    <Text style={{ color: mine ? theme.colors.primaryForeground : theme.colors.text, fontSize: 15 }}>
                      {m.body}
                    </Text>
                    {m.failed ? (
                      <Text style={{ color: theme.colors.danger, fontSize: 11, marginTop: 2 }}>
                        {t("chat.failed", "Failed to send")}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
          <View style={[styles.inputRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.input, color: theme.colors.text, borderColor: theme.colors.border }]}
              value={draft}
              onChangeText={setDraft}
              placeholder={t("chat.placeholder", "Type a message...")}
              placeholderTextColor={theme.colors.textMuted}
              multiline
              maxLength={2000}
              editable={!sending}
            />
            <Pressable
              onPress={send}
              disabled={!draft.trim() || sending}
              style={[styles.sendBtn, { backgroundColor: theme.colors.primary }, (!draft.trim() || sending) && { opacity: 0.5 }]}
            >
              <Ionicons name="send" size={18} color={theme.colors.primaryForeground} />
            </Pressable>
          </View>
        </>
      )}
    </Screen>
  );
}

function timeOf(m: Message): number {
  if (!m.created_at) return 0;
  return new Date(m.created_at).getTime();
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { flex: 1, paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[1] },
  bubbleRow: { alignItems: "flex-start" },
  bubbleRowMine: { alignItems: "flex-end" },
  timeLabel: { fontSize: 11, marginBottom: 2, textAlign: "center", alignSelf: "center" },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: spacing[4],
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});