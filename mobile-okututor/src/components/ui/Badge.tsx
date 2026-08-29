import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing } from "../../theme/spacing";

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
}

const toneColors: Record<BadgeTone, { text: string; bg: string }> = {
  neutral: { text: "#667085", bg: "#F2F4F7" },
  primary: { text: "#3563E9", bg: "#EDF2FF" },
  success: { text: "#12B76A", bg: "#E7F8EF" },
  warning: { text: "#B54708", bg: "#FFF4E5" },
  danger: { text: "#B42318", bg: "#FEECEB" },
  info: { text: "#3563E9", bg: "#EDF2FF" },
};

function toneColorsFor(tone: BadgeTone, dark: boolean) {
  if (!dark) return toneColors[tone];
  const map: Record<BadgeTone, { text: string; bg: string }> = {
    neutral: { text: "#A9B4C7", bg: "#1A2942" },
    primary: { text: "#7CA2FF", bg: "#1A2942" },
    success: { text: "#34D399", bg: "#0B3B2E" },
    warning: { text: "#FBBF24", bg: "#3A2A08" },
    danger: { text: "#F87171", bg: "#3B1416" },
    info: { text: "#7CA2FF", bg: "#1A2942" },
  };
  return map[tone];
}

export function Badge({ label, tone = "neutral", style }: BadgeProps) {
  const { theme } = useTheme();
  const dark = theme.mode === "dark";
  const c = toneColorsFor(tone, dark);
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg },
        style,
      ]}
    >
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
    </View>
  );
}

export function StatusBadge({ status, t }: { status: string; t: (k: string, d?: string) => string }) {
  const tone = toneForStatus(status);
  return <Badge label={t(`statuses.${status}`, status)} tone={tone} />;
}

export function toneForStatus(status: string | undefined): BadgeTone {
  switch (status) {
    case "CONFIRMED":
    case "ACCEPTED":
    case "APPROVED":
    case "ACTIVE":
    case "PUBLISHED":
    case "COMPLETED":
      return "success";
    case "PENDING":
    case "IN_PROGRESS":
    case "OPEN":
    case "DRAFT":
      return "warning";
    case "REJECTED":
    case "CANCELLED":
    case "BLOCKED":
    case "ARCHIVED":
      return "danger";
    default:
      return "neutral";
  }
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  label: { fontSize: 11, fontWeight: "600" },
});