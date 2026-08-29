import React from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { Screen } from "../src/components/ui/Screen";
import { ScreenHeader } from "../src/components/features/ScreenHeader";
import { EmptyState, SkeletonList, IconButton } from "../src/components/ui";
import { useNotificationStore } from "../src/store/notificationStore";
import { AppNotification } from "../src/types/tutor";
import { useTheme } from "../src/theme/ThemeProvider";
import { formatDateTime } from "../src/utils/date";

const typeKeys: Record<string, string> = {
  COURSE_APPLICATION: "notifications.types.COURSE_APPLICATION",
  APPLICATION_ACCEPTED: "notifications.types.APPLICATION_ACCEPTED",
  APPLICATION_REJECTED: "notifications.types.APPLICATION_REJECTED",
  BOOKING_CONFIRMED: "notifications.types.BOOKING_CONFIRMED",
  BOOKING_CANCELLED: "notifications.types.BOOKING_CANCELLED",
  BOOKING_NEW: "notifications.types.BOOKING_NEW",
  MESSAGE_NEW: "notifications.types.MESSAGE_NEW",
  SYSTEM: "notifications.types.SYSTEM",
};

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const items = useNotificationStore((s) => s.items);
  const loading = useNotificationStore((s) => s.loading);
  const error = useNotificationStore((s) => s.error);
  const fetchList = useNotificationStore((s) => s.fetchList);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  React.useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNotification = async (n: AppNotification) => {
    if (!n.read) {
      try {
        await markRead(n.id);
      } catch {
        // navigate anyway
      }
    }
    if (n.link) {
      router.push(n.link);
    } else if (n.payload?.booking_id) {
      router.push(`/booking/${n.payload.booking_id}`);
    } else if (n.payload?.conversation_id) {
      router.push(`/chat/${n.payload.conversation_id}`);
    } else if (n.payload?.enrollment_id) {
      router.push("/(tabs)/home");
    }
  };

  return (
    <Screen scroll onRefresh={() => fetchList()} refreshing={loading && items.length === 0}>
      <ScreenHeader
        title={t("notifications.title", "Notifications")}
        right={
          items.some((n) => !n.read) ? (
            <IconButton
              accessibilityLabel={t("notifications.mark_all", "Mark all read")}
              name="checkmark-done"
              color={theme.colors.primary}
              onPress={() => markAllRead().catch(() => {})}
            />
          ) : undefined
        }
      />
      {loading && items.length === 0 ? (
        <SkeletonList rows={6} />
      ) : error && items.length === 0 ? (
        <EmptyState title={t(error, "Failed to load notifications")} onAction={fetchList} />
      ) : items.length === 0 ? (
        <EmptyState title={t("notifications.empty", "No notifications yet")} />
      ) : (
        <View>
          {items.map((n) => {
            const raw = n.scheduled_at || n.created_at;
            return (
              <Pressable
                key={String(n.id)}
                onPress={() => openNotification(n)}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: n.read ? theme.colors.background : theme.colors.primaryLighter },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={styles.rowBody}>
                  <Text
                    style={[
                      styles.message,
                      { color: theme.colors.text },
                      !n.read && { fontWeight: "700" },
                    ]}
                  >
                    {n.message ||
                      t(typeKeys[n.type || ""] || "notifications.types.SYSTEM", "Notification")}
                  </Text>
                  {raw ? (
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                      {formatDateTime(raw)}
                    </Text>
                  ) : null}
                </View>
                {!n.read ? (
                  <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  rowBody: { flex: 1, paddingRight: 12 },
  message: { fontSize: 14, lineHeight: 20 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
