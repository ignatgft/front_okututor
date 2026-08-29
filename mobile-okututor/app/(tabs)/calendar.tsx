import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../src/components/ui/Screen";
import { ScreenHeader } from "../../src/components/features/ScreenHeader";
import { Badge } from "../../src/components/ui/Badge";
import { loadCalendarRange } from "../../src/api/calendar.api";
import { Booking } from "../../src/types/booking";
import { addMonths, formatTime, isSameDay, toLocalInput } from "../../src/utils/calendar";
import { useTheme } from "../../src/theme/ThemeProvider";
import { spacing } from "../../src/theme/spacing";

/** Simple month calendar for tutors, listing bookings on selected days. */
export default function CalendarScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [month, setMonth] = useState<Date>(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [events, setEvents] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Date | null>(new Date());

  const load = useCallback(async (current: Date) => {
    const from = new Date(current.getFullYear(), current.getMonth(), 1);
    const to = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    setLoading(true);
    setError("");
    try {
      const items = await loadCalendarRange(toLocalInput(from), toLocalInput(to), { tutorMode: true });
      setEvents(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(month);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const cells = gridFor(month);

  const selectedEvents = events.filter((e) => selected && isSameDay(parseDate(e.start_at), selected));

  return (
    <Screen scroll>
      <ScreenHeader title={t("tabs.calendar", "Calendar")} />
      <View style={styles.monthNav}>
        <Pressable onPress={() => { const m = addMonths(month, -1); setMonth(m); load(m); }} hitSlop={8} accessibilityRole="button">
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.monthTitle, { color: theme.colors.text }]}>
          {month.toLocaleDateString(t("date.locale", "en"), { month: "long", year: "numeric" })}
        </Text>
        <Pressable onPress={() => { const m = addMonths(month, 1); setMonth(m); load(m); }} hitSlop={8} accessibilityRole="button">
          <Ionicons name="chevron-forward" size={22} color={theme.colors.text} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {weekDayLetters().map((d) => (
          <Text key={d} style={[styles.weekDay, { color: theme.colors.textMuted }]}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell, index) => {
          if (!cell) return <View key={`empty-${index}`} style={styles.cell} />;
          const key = toLocalInput(cell);
          const count = events.filter((e) => isSameDay(parseDate(e.start_at), cell)).length;
          const isToday = isSameDay(cell, new Date());
          const isSelected = selected && isSameDay(cell, selected);
          return (
            <Pressable
              key={key}
              onPress={() => setSelected(cell)}
              accessibilityRole="button"
              style={[
                styles.cell,
                isSelected && { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Text
                style={[
                  styles.day,
                  { color: theme.colors.text },
                  isToday && { color: theme.colors.primary, fontWeight: "700" },
                ]}
              >
                {cell.getDate()}
              </Text>
              {count > 0 ? (
                <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.list}>
        {loading ? (
          <Text style={{ color: theme.colors.textMuted }}>{t("common.loading", "Loading...")}</Text>
        ) : error ? (
          <Text style={{ color: theme.colors.danger }}>{error}</Text>
        ) : selectedEvents.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted }}>
            {t("calendar.no_lessons", "No lessons on this day.")}
          </Text>
        ) : (
          selectedEvents.map((event) => (
            <Pressable
              key={String(event.id)}
              onPress={() => router.push(`/booking/${event.id}`)}
              style={({ pressed }) => [
                styles.event,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontWeight: "600" }} numberOfLines={1}>
                  {event.course_title || event.student_name || "#" + String(event.id)}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginTop: 2 }}>
                  {formatTime(event.start_at)}
                </Text>
              </View>
              <Badge label={event.status || ""} tone="neutral" />
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}

function parseDate(raw: string | undefined | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function gridFor(date: Date): (Date | null)[] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(date.getFullYear(), date.getMonth(), d));
  return cells;
}

function weekDayLetters(): string[] {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
}

const styles = StyleSheet.create({
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  monthTitle: { fontSize: 16, fontWeight: "600" },
  weekRow: { flexDirection: "row", paddingHorizontal: spacing[4] },
  weekDay: { flex: 1, textAlign: "center", fontSize: 12 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
  },
  cell: {
    width: "14.2857%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  day: { fontSize: 14 },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 3 },
  list: { paddingHorizontal: spacing[4], paddingBottom: spacing[8], gap: spacing[3] },
  event: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[3],
  },
});