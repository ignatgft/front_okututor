import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeProvider";
import { spacing } from "../../theme/spacing";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function ErrorState({ title, message, onRetry, icon = "cloud-offline-outline" }: ErrorStateProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.center}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: theme.colors.primaryLight },
        ]}
      >
        <Ionicons name={icon} size={34} color={theme.colors.danger} />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {title || "Something went wrong."}
      </Text>
      {message ? (
        <Text style={[styles.message, { color: theme.colors.textTertiary }]}>{message}</Text>
      ) : null}
      {onRetry ? <Button title="Retry" onPress={onRetry} variant="outline" style={styles.retry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { padding: spacing[8], alignItems: "center", gap: spacing[3] },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  message: { fontSize: 13, textAlign: "center", maxWidth: 280 },
  retry: { marginTop: spacing[2], alignSelf: "center" },
});