import React, { useCallback , useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, ScrollView, Linking, Pressable } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../src/components/ui/Screen";
import { ScreenHeader } from "../../src/components/features/ScreenHeader";
import { Avatar, Badge, Button, ConfirmDialog, EmptyState } from "../../src/components/ui";
import { toneForStatus } from "../../src/components/ui/Badge";
import { bookingApi } from "../../src/api/booking.api";
import { useApi } from "../../src/hooks/useApi";
import { Booking } from "../../src/types/booking";
import { useAuthStore } from "../../src/store/authStore";
import { bookingStatusLabel } from "../../src/utils/statusLabels";
import { formatDateTime } from "../../src/utils/date";
import { useTheme } from "../../src/theme/ThemeProvider";
import { spacing } from "../../src/theme/spacing";
import { useToast } from "../../src/components/ui/Toast";

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const isTutor = user?.role === "TUTOR";

  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);

  const api = useApi<Booking>(() => bookingApi.byId(id), [id]);
  const booking = api.data;

  useFocusEffect(
    useCallback(() => {
      api.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])
  );

  const act = async (fn: () => Promise<{ response: { ok: boolean }; data?: unknown }>, successKey: string) => {
    try {
      const { response } = await fn();
      if (response.ok) {
        showToast(t(successKey, successKey), "success");
        api.refetch();
      } else {
        showToast(t("booking.error", "Failed"), "error");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("errors.network", "Network error"), "error");
    }
  };

  const confirm = () => {
    setConfirming(true);
    act(() => bookingApi.confirm(id), "booking.booking_confirmed").finally(() => setConfirming(false));
  };
  const complete = () => act(() => bookingApi.complete(id), "booking.booking_completed");
  const reject = () => {
    setRejecting(true);
    act(() => bookingApi.reject(id), "booking.booking_rejected").finally(() => {
      setRejecting(false);
      setRejectDialog(false);
    });
  };
  const cancel = () => {
    act(() => bookingApi.cancel(id), "booking.booking_cancelled").finally(() => setCancelDialog(false));
  };

  const joinLesson = async () => {
    if (booking?.meeting_url) {
      await Linking.openURL(booking.meeting_url).catch(() => showToast(t("errors.network", "Network error"), "error"));
      return;
    }
    router.push(`/lesson/${id}`);
  };

  if (api.loading && !booking) {
    return (
      <Screen>
        <ScreenHeader title={t("booking.title", "Booking")} back />
        <View style={styles.center}><Text style={{ color: theme.colors.textMuted }}>{t("common.loading", "Loading...")}</Text></View>
      </Screen>
    );
  }
  if (!booking) {
    return (
      <Screen>
        <ScreenHeader title={t("booking.title", "Booking")} back />
        <EmptyState title={api.error || t("booking.not_found", "Booking not found")} />
      </Screen>
    );
  }

  const isJoined =
    booking.status === "CONFIRMED" ||
    booking.status === "COMPLETED" ||
    booking.status === "IN_PROGRESS";
  const canCancel = booking.status === "PENDING" || booking.status === "CONFIRMED";
  const partnerName = isTutor ? booking.student_name : booking.teacher_name;

  return (
    <Screen>
      <ScreenHeader title={t("booking.title", "Booking")} back />
      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[3] }}>
        <View style={[styles.statusRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Badge label={bookingStatusLabel(booking.status, t)} tone={toneForStatus(booking.status)} />
        </View>

        {booking.course_title ? (
          <Pressable
            onPress={() => booking.course_id && router.push(`/course/${booking.course_id}`)}
            style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <Ionicons name="book-outline" size={20} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>{t("booking.course", "Course")}</Text>
              <Text style={{ color: theme.colors.text, fontWeight: "600" }}>{booking.course_title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}

        {partnerName ? (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Avatar name={partnerName} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>
                {isTutor ? t("booking.student", "Student") : t("booking.tutor", "Tutor")}
              </Text>
              <Text style={{ color: theme.colors.text, fontWeight: "600" }}>{partnerName}</Text>
            </View>
          </View>
        ) : null}

        {booking.start_at ? (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>{t("booking.when", "When")}</Text>
              <Text style={{ color: theme.colors.text, fontWeight: "600" }}>{formatDateTime(booking.start_at)}</Text>
              {booking.duration_minutes ? (
                <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
                  {booking.duration_minutes} {t("booking.minutes", "min")}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {booking.location ? (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.text, flex: 1 }}>{booking.location}</Text>
          </View>
        ) : null}

        {isJoined ? (
          <Button title={t("booking.join_lesson", "Join Lesson")} onPress={joinLesson} />
        ) : null}

        <View style={styles.actions}>
          {isTutor && booking.status === "PENDING" ? (
            <>
              <Button title={t("booking.confirm", "Confirm")} onPress={confirm} loading={confirming} />
              <Button title={t("booking.reject", "Reject")} variant="danger" onPress={() => setRejectDialog(true)} loading={rejecting} />
            </>
          ) : null}
          {isTutor && booking.status === "CONFIRMED" ? (
            <Button title={t("booking.complete", "Complete")} variant="outline" onPress={complete} />
          ) : null}
          {!isTutor && canCancel ? (
            <Button title={t("booking.cancel_booking", "Cancel booking")} variant="ghost" onPress={() => setCancelDialog(true)} />
          ) : null}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={rejectDialog}
        title={t("booking.reject_title", "Reject booking?")}
        confirmLabel={t("booking.reject", "Reject")}
        loading={rejecting}
        tone="danger"
        onCancel={() => setRejectDialog(false)}
        onConfirm={reject}
      />
      <ConfirmDialog
        visible={cancelDialog}
        title={t("booking.cancel_title", "Cancel booking?")}
        message={t("booking.cancel_message", "This booking will be cancelled.")}
        confirmLabel={t("booking.cancel_booking", "Cancel booking")}
        tone="danger"
        onCancel={() => setCancelDialog(false)}
        onConfirm={cancel}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", flex: 1 },
  statusRow: { padding: spacing[3], borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: "flex-start" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: spacing[3],
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: { gap: spacing[2], marginTop: spacing[2] },
});