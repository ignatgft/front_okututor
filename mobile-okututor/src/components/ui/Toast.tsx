import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing } from "../../theme/spacing";
import { IconName } from "./IconButton";

type ToastTone = "success" | "error" | "info";

interface ToastData {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => undefined });

export function ToastProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast((t) => (t && t.id === toast.id ? null : t));
    }, toast.tone === "error" ? 5000 : 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const toneIcon: Record<ToastTone, IconName> = {
    success: "checkmark-circle",
    error: "alert-circle",
    info: "information-circle",
  };

  const toneBg: Record<ToastTone, string> = {
    success: theme.colors.success,
    error: theme.colors.danger,
    info: theme.colors.text,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <Modal transparent visible animationType="fade">
          <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
            <View style={[styles.toast, { backgroundColor: toneBg[toast.tone] }]}>
              <Ionicons name={toneIcon[toast.tone]} size={20} color="#FFFFFF" />
              <Text style={styles.message}>{toast.message}</Text>
            </View>
          </SafeAreaView>
        </Modal>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: Platform.OS === "ios" ? "flex-start" : "flex-start",
    alignItems: "center",
    paddingTop: spacing[10],
    paddingHorizontal: spacing[4],
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    maxWidth: 480,
    ...(Platform.OS === "ios" ? { shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } } : { elevation: 6 }),
  },
  message: { color: "#FFFFFF", fontSize: 14, flexShrink: 1 },
});