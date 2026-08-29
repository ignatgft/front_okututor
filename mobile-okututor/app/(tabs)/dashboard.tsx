import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Screen } from "../../src/components/ui/Screen";
import { ScreenHeader } from "../../src/components/features/ScreenHeader";
import { Button, Badge, Input, ConfirmDialog } from "../../src/components/ui";
import { toneForStatus } from "../../src/components/ui/Badge";
import { bookingApi, enrollmentsApi } from "../../src/api/booking.api";
import { useApi } from "../../src/hooks/useApi";
import { toList, MaybePaginated } from "../../src/types/api";
import { Booking, Enrollment } from "../../src/types/booking";
import { useTheme } from "../../src/theme/ThemeProvider";
import { spacing } from "../../src/theme/spacing";
import { useToast } from "../../src/components/ui/Toast";
import { formatDateTime } from "../../src/utils/date";

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const bookingsState = useApi<Booking[]>(
    () =>
      bookingApi.teacher().then((res) => ({
        response: res.response,
        data: toList<Booking>(res.data as MaybePaginated<Booking>),
      })),
    []
  );
  const requestsState = useApi<Enrollment[]>(
    () =>
      enrollmentsApi.tutorRequests().then((res) => ({
        response: res.response,
        data: toList<Enrollment>(res.data as MaybePaginated<Enrollment>),
      })),
    []
  );

  const [scheduling, setScheduling] = useState<Enrollment | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [busyId, setBusyId] = useState<string | number | null>(null);

  useFocusEffect(
    useCallback(() => {
      bookingsState.refetch();
      requestsState.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const refresh = async () => {
    await Promise.all([bookingsState.refetch(), requestsState.refetch()]);
  };

  const respondToRequest = async (enrollment: Enrollment, action: "accept" | "reject") => {
    setBusyId(enrollment.id);
    try {
      const { response, data } =
        action === "accept"
          ? await enrollmentsApi.accept(enrollment.id)
          : await enrollmentsApi.reject(enrollment.id);
      if (!response.ok) {
        const d = data as { message?: string } | null;
        showToast(d?.message || t("errors.default", "Failed to update request"), "error");
      } else {
        showToast(
          action === "accept" ? t("dashboard.request_accepted", "Request accepted") : t("dashboard.request_rejected", "Request rejected"),
          "success"
        );
        requestsState.refetch();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("errors.default", "Something went wrong."), "error");
    } finally {
      setBusyId(null);
    }
  };

  const confirmSchedule = async () => {
    if (!scheduling || !scheduleDate || !scheduleTime) return;
    setBusyId(scheduling.id);
    try {
      const { response, data } = await enrollmentsApi.acceptAndSchedule(scheduling.id, {
        date: scheduleDate,
        time: scheduleTime,
        duration_minutes: 60,
      });
      if (!response.ok) {
        const d = data as { message?: string } | null;
        showToast(d?.message || t("errors.default", "Failed to schedule"), "error");
      } else {
        showToast(t("dashboard.scheduled", "Scheduled"), "success");
        requestsState.refetch();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("errors.default", "Something went wrong."), "error");
    } finally {
      setBusyId(null);
      setScheduling(null);
      setScheduleDate("");
      setScheduleTime("");
    }
  };

  const bookings = bookingsState.data || [];
  const requests = requestsState.data || [];
  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const upcomingBookings = bookings
    .filter((b) => ["PENDING", "CONFIRMED"].includes(b.status))
    .sort((a, b) => String(a.start_at).localeCompare(String(b.start_at)));

  return (
    <Screen scroll onRefresh={refresh} refreshing={bookingsState.loading && !bookingsState.data}>
      <ScreenHeader title={t("tabs.dashboard", "Dashboard")} />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t("dashboard.requests", "Requests")}
        </Text>
        {pendingRequests.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted }}>{t("dashboard.no_requests", "No pending requests.")}</Text>
        ) : (
          pendingRequests.map((request) => (
            <View
              key={String(request.id)}
              style={[styles.entry, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <Text style={[styles.entryTitle, { color: theme.colors.text }]} numberOfLines={2}>
                {request.student_name || request.course_title || "#" + String(request.id)}
              </Text>
              {request.course_title ? (
                <Text style={[styles.entryMeta, { color: theme.colors.textTertiary }]}>{request.course_title}</Text>
              ) : null}
              {request.preferred_schedule ? (
                <Text style={[styles.entryMeta, { color: theme.colors.textTertiary }]} numberOfLines={2}>
                  {request.preferred_schedule}
                </Text>
              ) : null}
              <View style={styles.actions}>
                <Button
                  title={t("dashboard.reject", "Reject")}
                  variant="ghost"
                  onPress={() => respondToRequest(request, "reject")}
                  loading={busyId === request.id}
                />
                <Button
                  title={t("dashboard.accept_schedule", "Accept & Schedule")}
                  variant="primary"
                  onPress={() => setScheduling(request)}
                  disabled={busyId === request.id}
                />
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t("dashboard.upcoming", "Upcoming lessons")}
        </Text>
        {upcomingBookings.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted }}>{t("dashboard.no_bookings", "No upcoming lessons.")}</Text>
        ) : (
          upcomingBookings.map((booking) => (
            <Pressable
              key={String(booking.id)}
              onPress={() => router.push(`/booking/${booking.id}`)}
              style={({ pressed }) => [
                styles.entry,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.entryHeader}>
                <Text style={[styles.entryTitle, { color: theme.colors.text }]} numberOfLines={1}>
                  {booking.course_title || booking.student_name || "#" + String(booking.id)}
                </Text>
                <Badge label={t(`statuses.${booking.status}`, booking.status)} tone={toneForStatus(booking.status)} />
              </View>
              {booking.start_at ? (
                <Text style={[styles.entryMeta, { color: theme.colors.textTertiary }]}>
                  {formatDateTime(booking.start_at)}
                </Text>
              ) : null}
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Button
          title={t("dashboard.manage_calendar", "Open calendar")}
          variant="outline"
          fullWidth
          onPress={() => router.push("/(tabs)/calendar")}
        />
        <Button
          title={t("dashboard.create_course", "Create course")}
          variant="outline"
          fullWidth
          style={{ marginTop: 8 }}
          onPress={() => router.push("/course-form")}
        />
      </View>

      <ConfirmDialog
        visible={!!scheduling}
        title={t("dashboard.accept_schedule", "Accept & Schedule")}
        message={t("dashboard.schedule_hint", "Date (YYYY-MM-DD) and time (HH:MM).")}
        confirmLabel={t("common.confirm", "Confirm")}
        onConfirm={confirmSchedule}
        onCancel={() => setScheduling(null)}
        loading={busyId === scheduling?.id}
      >
        <Input label={t("common.date", "Date")} value={scheduleDate} onChangeText={setScheduleDate} placeholder="2026-09-20" error={null} />
        <Input label={t("common.time", "Time")} value={scheduleTime} onChangeText={setScheduleTime} placeholder="14:00" error={null} />
      </ConfirmDialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing[5] },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: spacing[3] },
  entry: {
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing[3],
    marginBottom: spacing[2],
    gap: spacing[1],
  },
  entryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing[2] },
  entryTitle: { fontSize: 15, fontWeight: "600", flexShrink: 1 },
  entryMeta: { fontSize: 13 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing[2], marginTop: spacing[2] },
});