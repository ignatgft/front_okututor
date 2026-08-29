import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeProvider";
import { spacing } from "../../theme/spacing";
import { Card } from "../ui/Card";
import { Badge, toneForStatus } from "../ui/Badge";
import { Course } from "../../types/course";
import { formatPrice } from "../../utils/format";

interface CourseCardProps {
  course: Course;
  onPress?: () => void;
  showTeacher?: boolean;
}

/** Compact course card used across lists, search results and dashboards. */
export function CourseCard({ course, onPress, showTeacher = true }: CourseCardProps) {
  const { theme } = useTheme();
  const rating = course.rating ?? null;

  return (
    <Card onPress={onPress} padded style={{ marginBottom: spacing[3] }}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
            {course.title}
          </Text>
          {course.status ? (
            <Badge label={course.status} tone={toneForStatus(course.status)} />
          ) : null}
        </View>

        <View style={styles.meta}>
          {course.subject ? (
            <View style={styles.metaItem}>
              <Ionicons name="book-outline" size={14} color={theme.colors.textMuted} />
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {course.subject}
              </Text>
            </View>
          ) : null}
          {rating ? (
            <View style={styles.metaItem}>
              <Ionicons name="star" size={14} color="#F5A623" />
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                {rating.toFixed(1)} ({course.review_count ?? 0})
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.price, { color: theme.colors.primary }]}>
            {course.price_per_hour != null
              ? formatPrice(course.price_per_hour, course.currency)
              : "—"}
            <Text style={styles.perHour}> /h</Text>
          </Text>
          {showTeacher && course.teacher_name ? (
            <Text style={[styles.teacher, { color: theme.colors.textTertiary }]} numberOfLines={1}>
              {course.teacher_name}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  inner: { gap: spacing[2] },
  header: { flexDirection: "row", alignItems: "flex-start", gap: spacing[2], justifyContent: "space-between" },
  title: { flex: 1, fontSize: 16, fontWeight: "600" },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: spacing[3] },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing[1] },
  price: { fontSize: 16, fontWeight: "700" },
  perHour: { fontSize: 12, color: "#98A6BE", fontWeight: "400" },
  teacher: { fontSize: 12, maxWidth: "55%" },
});