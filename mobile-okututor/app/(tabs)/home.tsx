import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Screen } from "../../src/components/ui/Screen";
import { CourseCard } from "../../src/components/features/CourseCard";
import { coursesApi } from "../../src/api/courses.api";
import { useApi } from "../../src/hooks/useApi";
import { Course } from "../../src/types/course";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useAuthStore } from "../../src/store/authStore";
import { useNotificationStore } from "../../src/store/notificationStore";
import { IconButton } from "../../src/components/ui/IconButton";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const fetchUnread = useNotificationStore((s) => s.fetchUnread);
  const unread = useNotificationStore((s) => s.unreadCount);

  const popular = useApi<Course[]>(() => coursesApi.popular(), []);

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

  return (
    <Screen scroll onRefresh={popular.refetch} refreshing={popular.loading && !popular.data}>
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Text style={[styles.hello, { color: theme.colors.textTertiary }]}>
            {t("home.hello", "Hello")},
          </Text>
          <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
            {user?.full_name || t("home.guest", "Guest")}
          </Text>
        </View>
        <IconButton
          name="notifications-outline"
          size={24}
          color={theme.colors.textSecondary}
          onPress={() => router.push("/notifications")}
          accessibilityLabel="notifications"
        />
        {unread > 0 ? (
          <View style={[styles.badge, { backgroundColor: theme.colors.danger }]}>
            <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.hero}>
        <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
          {t("home.hero_title", "Learn with Okututor")}
        </Text>
        <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
          {t("home.hero_subtitle", "Find experienced tutors and book lessons in a few taps.")}
        </Text>
        <IconSearchBar onNavigate={() => router.push("/search")} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t("home.popular", "Popular courses")}
        </Text>
        {popular.loading && !popular.data ? (
          <Text style={{ color: theme.colors.textMuted }}>{t("common.loading", "Loading...")}</Text>
        ) : popular.error ? (
          <Text style={{ color: theme.colors.danger }}>
            {popular.error || t("errors.default", "Something went wrong.")}
          </Text>
        ) : (popular.data || []).length === 0 ? (
          <Text style={{ color: theme.colors.textMuted }}>{t("home.no_courses", "No courses yet.")}</Text>
        ) : (
          (popular.data || []).map((course) => (
            <CourseCard
              key={String(course.id)}
              course={course}
              onPress={() => router.push(`/course/${course.id}`)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

function IconSearchBar({ onNavigate }: { onNavigate: () => void }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onNavigate}
      accessibilityRole="button"
      accessibilityLabel="search"
      style={[
        styles.searchBar,
        { backgroundColor: theme.colors.input, borderColor: theme.colors.border },
      ]}
    >
      <Ionicons name="search" size={20} color={theme.colors.textMuted} />
      <Text style={{ color: theme.colors.textMuted, marginLeft: 8 }}>
        {t("home.search_placeholder", "Search courses…")}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  greeting: { flex: 1, marginRight: 12 },
  hello: { fontSize: 13 },
  name: { fontSize: 20, fontWeight: "700" },
  badge: {
    position: "absolute",
    top: 6,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  hero: { paddingHorizontal: 16, paddingVertical: 12 },
  heroTitle: { fontSize: 22, fontWeight: "700" },
  heroSubtitle: { fontSize: 14, marginTop: 4 },
  searchBar: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
});