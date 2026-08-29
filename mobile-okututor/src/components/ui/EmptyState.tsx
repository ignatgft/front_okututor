import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeProvider";
import { spacing } from "../../theme/spacing";
import { IconName } from "./IconButton";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  hint?: string;
  icon?: IconName;
  onAction?: () => void;
  actionLabel?: string;
}

export function EmptyState({ title, hint, icon = "file-tray-outline", onAction, actionLabel }: EmptyStateProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.center}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: theme.colors.secondaryLight },
        ]}
      >
        <Ionicons name={icon} size={34} color={theme.colors.textMuted} />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {hint ? (
        <Text style={[styles.hint, { color: theme.colors.textTertiary }]}>{hint}</Text>
      ) : null}
      {onAction ? <Button variant="outline" title={actionLabel || "Retry"} onPress={onAction} /> : null}
    </View>
  );
}

export default EmptyState;

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[10],
    gap: spacing[2],
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[1],
  },
  title: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  hint: { fontSize: 13, lineHeight: 19, textAlign: "center" },
});