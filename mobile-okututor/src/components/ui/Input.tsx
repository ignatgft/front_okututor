import React, { forwardRef, useState } from "react";
import {
  Text,
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing } from "../../theme/spacing";

interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string | null;
  hint?: string;
  secure?: boolean;
  right?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, secure = false, right, ...textInputProps },
  ref
) {
  const { theme } = useTheme();
  const [secureVisible, setSecureVisible] = useState(false);
  const showSecureToggle = secure;

  const borderColor = error ? theme.colors.danger : theme.colors.border;

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.input,
            borderColor,
            borderWidth: 1,
          },
        ]}
      >
        <TextInput
          ref={ref}
          style={[styles.input, { color: theme.colors.text }]}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={secure && !secureVisible}
          autoCapitalize="none"
          {...textInputProps}
        />
        {showSecureToggle ? (
          <Pressable
            onPress={() => setSecureVisible((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="toggle-password-visibility"
          >
            <Ionicons
              name={secureVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={theme.colors.textMuted}
            />
          </Pressable>
        ) : right ? (
          right
        ) : null}
      </View>
      {error ? (
        <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: theme.colors.textTertiary }]}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing[4] },
  label: { fontSize: 13, marginBottom: spacing[1], fontWeight: "500" },
  field: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    flexDirection: "row",
    alignItems: "center",
  },
  input: { flex: 1, fontSize: 15, paddingVertical: spacing[3] },
  error: { fontSize: 12, marginTop: spacing[1] },
  hint: { fontSize: 12, marginTop: spacing[1] },
});