import React, { ReactNode } from "react";
import { Modal, View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing } from "../../theme/spacing";
import { Button } from "./Button";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  tone = "primary",
  loading = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const { theme } = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.dialog, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          {message ? (
            <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>
          ) : null}
          {children}
          <View style={styles.actions}>
            <Button title={cancelLabel} variant="ghost" onPress={onCancel} disabled={loading} style={styles.btn} />
            <Button
              title={confirmLabel}
              variant={tone === "danger" ? "danger" : "primary"}
              onPress={onConfirm}
              loading={loading}
              style={styles.btn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[4],
  },
  dialog: {
    width: "100%",
    maxWidth: 400,
    borderRadius: radius.xl,
    padding: spacing[5],
    gap: spacing[3],
  },
  title: { fontSize: 17, fontWeight: "600" },
  message: { fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: "row", gap: spacing[3], justifyContent: "flex-end", marginTop: spacing[2] },
  btn: { minWidth: 96 },
});