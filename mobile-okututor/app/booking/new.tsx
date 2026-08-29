import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Screen } from "../../src/components/ui/Screen";
import { ScreenHeader } from "../../src/components/features/ScreenHeader";
import { Button } from "../../src/components/ui";
import { bookingApi } from "../../src/api/booking.api";
import { coursesApi } from "../../src/api/courses.api";
import { tutorsApi } from "../../src/api/tutors.api";
import { useApi } from "../../src/hooks/useApi";
import { Course } from "../../src/types/course";
import { AvailabilitySlot, generateSlotTimes } from "../../src/utils/slots";
import { useTheme } from "../../src/theme/ThemeProvider";
import { spacing } from "../../src/theme/spacing";
import { useToast } from "../../src/components/ui/Toast";

const DURATIONS = [30, 60, 90, 120];

function dayOptions(count: number): Date[] {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });
}

export default function NewBookingScreen() {
  const { course_id } = useLocalSearchParams<{ course_id: string }>();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);

  const courseApi = useApi<Course>(() => coursesApi.byId(course_id), [course_id]);
  const course = courseApi.data;

  const availabilityApi = useApi<AvailabilitySlot[]>(
    () => (course?.teacher_id ? tutorsApi.availabilityByTeacher(course.teacher_id) : Promise.resolve({ response: { ok: false } as never, data: [] as never })),
    [course?.teacher_id]
  );
  const availability = useMemo(() => {
    const d = availabilityApi.data;
    if (Array.isArray(d)) return d;
    if (d && Array.isArray((d as { content?: AvailabilitySlot[] }).content)) return (d as { content: AvailabilitySlot[] }).content;
    return [];
  }, [availabilityApi.data]);

  const days = useMemo(() => dayOptions(14), []);
  const isToday = useCallback(
    (d: Date) => {
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    },
    []
  );

  const slots = useMemo(() => {
    if (!date) return [];
    const isTodayDate = isToday(date);
    return generateSlotTimes(availability, date, { step: 30, max: 48 }).filter((tm) => {
      if (!isTodayDate) return true;
      const [hh, mm] = tm.split(":").map(Number);
      const c = new Date();
      c.setHours(hh, mm, 0, 0);
      // Intentional: hide already-passed slots for today (time-of-day dependent by design)
      // eslint-disable-next-line react-hooks/purity
      return c.getTime() > Date.now();
    });
  }, [availability, date, isToday]);

  const formatDay = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const weekdayLabel = (d: Date, index: number) => {
    if (index === 0) return t("booking.today", "Today");
    return t(`weekdays_short.${d.getDay()}`) ||
      d.toLocaleDateString("en-US", { weekday: "short" });
  };

  const submit = async () => {
    if (!date) {
      showToast(t("validation.required", "Field is required"), "error");
      return;
    }
    if (!time) {
      showToast(t("booking.select_time", "Select Time"), "error");
      return;
    }
    setLoading(true);
    try {
      const { response, data } = await bookingApi.create({
        course_id,
        date: formatDay(date),
        time,
        duration_minutes: duration,
      });
      if (response.ok) {
        showToast(t("booking.booking_created", "Booking request sent!"), "success");
        router.replace(`/booking/${(data as { id?: string | number }).id ?? String(data)}`);
      } else {
        const msg =
          response.status === 409
            ? t("booking.slot_taken", "This slot is already taken")
            : (data as { error?: string; message?: string }).error ||
              (data as { message?: string }).message ||
              t("booking.error", "Failed to create booking");
        showToast(msg, "error");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("errors.network", "Network error"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title={t("booking.title", "Book a Lesson")} back />
      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
        {course ? (
          <View>
            <Text style={{ color: theme.colors.text, fontWeight: "700", fontSize: 16 }}>{course.title}</Text>
            {course.teacher_name ? (
              <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginTop: 2 }}>{course.teacher_name}</Text>
            ) : null}
          </View>
        ) : null}

        <View>
          <Label>{t("booking.select_date", "Select Date")}</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {days.map((d, i) => {
              const active = date && formatDay(d) === formatDay(date);
              return (
                <Pressable
                  key={formatDay(d)}
                  onPress={() => {
                    setDate(d);
                    setTime("");
                  }}
                  style={[
                    styles.dayChip,
                    { backgroundColor: active ? theme.colors.primary : theme.colors.surface, borderColor: theme.colors.border },
                    active && { borderColor: theme.colors.primary },
                  ]}
                >
                  <Text style={{ color: active ? theme.colors.primaryForeground : theme.colors.textMuted, fontSize: 11 }}>
                    {weekdayLabel(d, i)}
                  </Text>
                  <Text style={{ color: active ? theme.colors.primaryForeground : theme.colors.text, fontWeight: "700", fontSize: 16 }}>
                    {d.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View>
          <Label>{t("booking.select_time", "Select Time")}</Label>
          {slots.length === 0 ? (
            <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
              {date ? t("booking.no_slots", "No free slots for this day") : t("booking.choose_date_first", "Choose a date first")}
            </Text>
          ) : (
            <View style={styles.slotGrid}>
              {slots.map((tm) => {
                const active = tm === time;
                return (
                  <Pressable
                    key={tm}
                    onPress={() => setTime(tm)}
                    style={[
                      styles.slotChip,
                      { backgroundColor: active ? theme.colors.primary : theme.colors.surface, borderColor: theme.colors.border },
                      active && { borderColor: theme.colors.primary },
                    ]}
                  >
                    <Text style={{ color: active ? theme.colors.primaryForeground : theme.colors.text, fontSize: 13 }}>{tm}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View>
          <Label>{t("booking.duration", "Duration (minutes)")}</Label>
          <View style={styles.durationRow}>
            {DURATIONS.map((min) => {
              const active = min === duration;
              return (
                <Pressable
                  key={min}
                  onPress={() => setDuration(min)}
                  style={[
                    styles.durationChip,
                    { backgroundColor: active ? theme.colors.primaryLight : theme.colors.surface, borderColor: theme.colors.border },
                    active && { borderColor: theme.colors.primary },
                  ]}
                >
                  <Text style={{ color: active ? theme.colors.primary : theme.colors.text, fontWeight: "600", fontSize: 13 }}>
                    {t(`booking.duration_options.${min}`, `${min}m`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button title={loading ? t("common.loading", "Loading...") : t("booking.book_now", "Book Now")} onPress={submit} loading={loading} />
      </ScrollView>
    </Screen>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginBottom: 8 }}>{children}</Text>;
}

const styles = StyleSheet.create({
  dayChip: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 52,
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  durationRow: { flexDirection: "row", gap: 8 },
  durationChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
});
