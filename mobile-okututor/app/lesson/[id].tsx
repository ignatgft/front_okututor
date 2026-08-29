import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, ScrollView, Linking, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../src/components/ui/Screen";
import { ScreenHeader } from "../../src/components/features/ScreenHeader";
import { Button, Badge, EmptyState } from "../../src/components/ui";
import { toneForStatus } from "../../src/components/ui/Badge";
import { bookingApi } from "../../src/api/booking.api";
import { meetingsApi } from "../../src/api/lessons.api";
import { MeetingToken } from "../../src/types/lesson";
import { Booking } from "../../src/types/booking";
import { useTheme } from "../../src/theme/ThemeProvider";
import { spacing } from "../../src/theme/spacing";
import { useToast } from "../../src/components/ui/Toast";
import { formatDateTime } from "../../src/utils/date";

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [token, setToken] = React.useState<MeetingToken | null>(null);
  const [tokenLoading, setTokenLoading] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [leaving, setLeaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await bookingApi.byId(id);
      if (response.ok) setBooking(data);
      else setError((data as { error?: string }).error || t("booking.not_found", "Booking not found"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
     
  }, [id, t]);

  React.useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const getToken = async () => {
    setTokenLoading(true);
    setError("");
    try {
      const { response, data } = await meetingsApi.token(id);
      if (response.ok) {
        if (!data?.token) {
          console.error(`[lesson] meeting token response missing token: booking=${id}`, data);
          setError(t("lesson.errors.connect", "Could not connect to the lesson. Please try opening it again."));
          return;
        }
        setToken(data);
        showToast(t("lesson.connected", "Meeting token received"), "success");
      } else {
        console.error(`[lesson] meeting token request failed: status=${response.status} booking=${id}`, data ?? "");
        switch (Number(response.status)) {
          case 401:
            setError(t("lesson.errors.session_expired", "Your session has expired. Please sign in again."));
            break;
          case 403:
            setError(t("lesson.errors.forbidden", "You do not have access to this lesson."));
            break;
          case 404:
            setError(t("lesson.errors.not_found", "Lesson not found. It may have been cancelled."));
            break;
          case 409:
            setError(t("lesson.errors.conflict", "Could not connect to the lesson. Please try opening it again."));
            break;
          default:
            setError(t("lesson.errors.connect", "Could not connect to the lesson. Please try opening it again."));
        }
      }
    } catch (e) {
      console.error(`[lesson] meeting token request error: booking=${id}`, e);
      setError(t("lesson.errors.connect", "Could not connect to the lesson. Please try opening it again."));
    } finally {
      setTokenLoading(false);
    }
  };

  const openMeeting = () => {
    if (!booking?.meeting_url) return;
    Linking.openURL(booking.meeting_url).catch(() =>
      showToast(booking?.meeting_url || t("errors.network", "Network error"), "error")
    );
  };

  const leave = async () => {
    setLeaving(true);
    try {
      await meetingsApi.end(id);
    } catch {
      // best-effort: the backend may already have closed the meeting
    } finally {
      setLeaving(false);
      router.back();
    }
  };

  if (loading) {
    return (
      <Screen>
        <ScreenHeader title={t("lesson.title", "Lesson")} back />
        <View style={styles.center}><Text style={{ color: theme.colors.textMuted }}>{t("common.loading", "Loading...")}</Text></View>
      </Screen>
    );
  }
  if (!booking) {
    return (
      <Screen>
        <ScreenHeader title={t("lesson.title", "Lesson")} back />
        <EmptyState title={error || t("booking.not_found", "Booking not found")} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={t("lesson.title", "Okututor Lesson")} back />
      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Badge label={t(`statuses.${booking.status}`, booking.status)} tone={toneForStatus(booking.status)} />
          {booking.course_title ? (
            <Text style={{ color: theme.colors.text, fontWeight: "700", fontSize: 16, marginTop: 8 }}>{booking.course_title}</Text>
          ) : null}
          {booking.start_at ? (
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 4 }}>
              {formatDateTime(booking.start_at)}
            </Text>
          ) : null}
        </View>

        {booking.meeting_url ? (
          <Button title={t("booking.join_lesson", "Join Lesson")} onPress={openMeeting} />
        ) : (
          <>
            <Button title={tokenLoading ? t("common.loading", "Loading...") : t("lesson.get_token", "Get meeting access")} onPress={getToken} loading={tokenLoading} />

            {token ? (
              <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Ionicons name="videocam-outline" size={20} color={theme.colors.primary} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: theme.colors.text, fontWeight: "600" }}>{t("lesson.access_ready", "Meeting access ready")}</Text>
                  {token.server_url ? (
                    <Text numberOfLines={1} style={{ color: theme.colors.textMuted, fontSize: 12 }}>{token.server_url}</Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {!token && error ? (
              <Text style={{ color: theme.colors.danger, fontSize: 13 }}>{error}</Text>
            ) : null}

            {token ? (
              <Pressable
                onPress={leave}
                disabled={leaving}
                style={[styles.leaveSection, { borderColor: theme.colors.danger, opacity: leaving ? 0.6 : 1 }]}
              >
                <Ionicons name="call-outline" size={18} color={theme.colors.danger} />
                <Text style={{ color: theme.colors.danger, fontWeight: "600" }}>{t("lesson.leave", "Leave lesson")}</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", flex: 1 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: spacing[3],
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  leaveSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing[3],
  },
});