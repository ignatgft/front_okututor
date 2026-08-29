import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../src/components/ui/Screen";
import { ScreenHeader } from "../../src/components/features/ScreenHeader";
import { SkeletonList, ErrorState } from "../../src/components/ui";
import { adminApi } from "../../src/api/admin.api";
import { useTheme } from "../../src/theme/ThemeProvider";
import { spacing } from "../../src/theme/spacing";
import { useToast } from "../../src/components/ui/Toast";

interface AdminStats {
  total_users?: number;
  total_courses?: number;
  total_reviews?: number;
  total_bookings?: number;
  pending_tutors?: number;
  pending_courses?: number;
  [key: string]: number | undefined;
}

export default function AdminDashboardScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [stats, setStats] = useState<AdminStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await adminApi.stats();
      if (response.ok) setStats((data as AdminStats) || {});
      else setError((data as { error?: string })?.error || t("errors.default", "Something went wrong."));
    } catch (e: unknown) {
      setError(t("errors.network", "Network error") + ": " + String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
     
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const cards: { label: string; value: number | undefined; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: t("admin.users", "Users"), value: stats.total_users, icon: "people-outline" },
    { label: t("tutor_dashboard.courses", "Courses"), value: stats.total_courses, icon: "book-outline" },
    { label: t("course.reviews", "Reviews"), value: stats.total_reviews, icon: "star-outline" },
    { label: t("tutor_dashboard.bookings", "Bookings"), value: stats.total_bookings, icon: "calendar-outline" },
  ];

  const actions: { icon: keyof typeof Ionicons.glyphMap; label: string; href: string }[] = [
    { icon: "people-outline", label: t("admin.manage_users", "Manage users"), href: "/admin/users" },
    { icon: "school-outline", label: t("admin.tutor_applications", "Tutor applications"), href: "/admin/tutors" },
    { icon: "book-outline", label: t("admin.course_moderation", "Course moderation"), href: "/admin/courses" },
    { icon: "star-outline", label: t("admin.reviews_moderation", "Reviews"), href: "/admin/reviews" },
    { icon: "flag-outline", label: t("admin.reports", "Reports"), href: "/admin/reports" },
  ];

  return (
    <Screen>
      <ScreenHeader title={t("admin.dashboard", "Admin Dashboard")} />
      {loading && !stats.total_users ? (
        <SkeletonList rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
          <View style={styles.statsGrid}>
            {cards.map((c) => (
              <View key={c.label} style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Ionicons name={c.icon} size={18} color={theme.colors.primary} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{c.value ?? 0}</Text>
                <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>{c.label}</Text>
              </View>
            ))}
          </View>

          <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t("admin.quick_actions", "Quick actions")}
            </Text>
            <View style={{ gap: spacing[2] }}>
              {actions.map((a) => (
                <Pressable
                  key={a.href}
                  onPress={() => showToast(t("admin.web_console", "Available on web"), "info")}
                  style={({ pressed }) => [
                    styles.action,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Ionicons name={a.icon} size={20} color={theme.colors.primary} />
                  <Text style={{ color: theme.colors.text, fontWeight: "600", flex: 1 }}>{a.label}</Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                    {t("admin.web_console", "Available on web")}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  statCard: {
    width: "48%",
    flexGrow: 1,
    padding: spacing[3],
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  statValue: { fontSize: 24, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: spacing[2] },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: spacing[3],
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
});