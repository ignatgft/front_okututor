import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../src/components/ui/Screen";
import { ScreenHeader } from "../../src/components/features/ScreenHeader";
import { Avatar, EmptyState } from "../../src/components/ui";
import { loadUnifiedConversations } from "../../src/api/messages.api";
import { Conversation } from "../../src/types/message";
import { useTheme } from "../../src/theme/ThemeProvider";
import { spacing } from "../../src/theme/spacing";

export default function MessagesScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await loadUnifiedConversations();
      setConversations(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  return (
    <Screen scroll onRefresh={load} refreshing={loading && conversations.length === 0}>
      <ScreenHeader title={t("tabs.messages", "Messages")} />
      {error ? (
        <Text style={{ color: theme.colors.danger, paddingHorizontal: spacing[4] }}>{error}</Text>
      ) : null}
      {!loading && conversations.length === 0 && !error ? (
        <EmptyState
          title={t("messages.empty_title", "No conversations yet")}
          hint={t("messages.empty_hint", "Start a conversation from a course or booking.")}
          icon="chatbubbles-outline"
        />
      ) : null}
      {conversations.map((conv) => (
        <Pressable
          key={String(conv.id)}
          onPress={() => router.push(`/chat/${conv.id}`)}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: theme.colors.surface },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Avatar uri={conv.counterpart_avatar} name={conv.counterpart_name} size={44} />
          <View style={styles.rowBody}>
            <Text style={{ color: theme.colors.text, fontWeight: "600" }} numberOfLines={1}>
              {conv.counterpart_name || (conv.ticket_id ? `Support #${conv.ticket_id}` : "—")}
            </Text>
            {conv.last_message ? (
              <Text style={{ color: theme.colors.textTertiary, fontSize: 13 }} numberOfLines={1}>
                {conv.last_message}
              </Text>
            ) : null}
          </View>
          <View style={styles.rowSide}>
            {conv.unread_count ? (
              <View style={[styles.unread, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.unreadText}>{conv.unread_count}</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            )}
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
    padding: spacing[3],
    borderRadius: 14,
  },
  rowBody: { flex: 1 },
  rowSide: { alignItems: "flex-end" },
  unread: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
});