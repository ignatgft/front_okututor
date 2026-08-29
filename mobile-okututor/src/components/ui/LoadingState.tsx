import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { spacing } from "../../theme/spacing";

export function LoadingState({ label }: { label?: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {label ? (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
      ) : null}
    </View>
  );
}

export function SkeletonBlock({ width = "100%", height = 16 }: { width?: number | `${number}%`; height?: number }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        width,
        height,
        borderRadius: 6,
        backgroundColor: theme.colors.surfaceActive,
        opacity: 0.6,
      }}
    />
  );
}

export function SkeletonList({ rows = 6 }: { rows?: number }) {
  const { theme } = useTheme();
  return (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={[
            {
              backgroundColor: theme.colors.surface,
              borderRadius: 14,
              padding: spacing[4],
              gap: spacing[2],
            },
          ]}
        >
          <SkeletonBlock width="60%" />
          <SkeletonBlock width="90%" height={12} />
          <SkeletonBlock width="40%" height={12} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { padding: spacing[8], alignItems: "center", gap: spacing[3] },
  label: { fontSize: 14 },
  skeletonWrap: { padding: spacing[4], gap: spacing[3] },
});