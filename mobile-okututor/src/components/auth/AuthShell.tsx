import React, { ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  SafeAreaView,
} from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing } from "../../theme/spacing";

interface AuthShellProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Shared layout for all authentication screens: safe area, keyboard
 * avoidance, scroll, centered card and an optional footer below it.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <View
              style={[
                styles.logo,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.logoText}>О</Text>
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {children}
          </View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing[4],
  },
  brand: { alignItems: "center", marginBottom: spacing[6] },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius["2xl"],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[4],
  },
  logoText: { color: "#FFFFFF", fontSize: 32, fontWeight: "700" },
  title: { fontSize: 26, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 14, marginTop: spacing[2], textAlign: "center" },
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[5],
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
  },
  footer: {
    marginTop: spacing[5],
    alignItems: "center",
    maxWidth: 460,
    alignSelf: "center",
  },
});