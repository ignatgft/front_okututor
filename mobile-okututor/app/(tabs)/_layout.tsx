import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { StyleSheet, ColorValue } from "react-native";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useAuthStore } from "../../src/store/authStore";
import { useNotificationStore } from "../../src/store/notificationStore";
import { isTutorLike } from "../../src/constants/roles";

type TabBarIconName = keyof typeof Ionicons.glyphMap;

function tabIcon(focused: TabBarIconName, unfocused: TabBarIconName) {
  function TabBarIcon(props: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={props.focused ? focused : unfocused} size={24} color={props.color} />;
  }
  return TabBarIcon;
}

export default function TabsLayout() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const unread = useNotificationStore((s) => s.unreadCount);
  const tutorMode = isTutorLike(user?.role);

  const baseOptions = {
    headerShown: false,
    tabBarActiveTintColor: theme.colors.tabActive,
    tabBarInactiveTintColor: theme.colors.textMuted,
    tabBarStyle: [
      styles.tabBar,
      {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border,
      },
    ],
    tabBarLabelStyle: { fontSize: 11 },
  };

  return (
    <Tabs screenOptions={baseOptions}>
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabs.home", "Home"),
          tabBarIcon: tabIcon("home", "home-outline"),
          href: tutorMode ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t("tabs.search", "Search"),
          tabBarIcon: tabIcon("search", "search-outline"),
          href: tutorMode ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("tabs.dashboard", "Dashboard"),
          tabBarIcon: tabIcon("stats-chart", "stats-chart-outline"),
          href: tutorMode ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: t("tabs.courses", "Courses"),
          tabBarIcon: tabIcon("book", "book-outline"),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t("tabs.calendar", "Calendar"),
          tabBarIcon: tabIcon("calendar-clear", "calendar-clear-outline"),
          href: tutorMode ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t("tabs.messages", "Messages"),
          tabBarIcon: tabIcon("chatbubble-ellipses", "chatbubble-ellipses-outline"),
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.colors.danger, color: "#FFFFFF" },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile", "Profile"),
          tabBarIcon: tabIcon("person", "person-outline"),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    paddingTop: 6,
    paddingBottom: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});