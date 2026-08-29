import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  AccessibilityProps,
} from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/spacing";
import { sizes } from "../../theme/shadows";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";

interface ButtonProps extends AccessibilityProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  icon,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const { theme } = useTheme();

  const bg: Record<ButtonVariant, string> = {
    primary: theme.colors.primary,
    secondary: theme.colors.secondaryLight,
    outline: "transparent",
    danger: theme.colors.danger,
    ghost: "transparent",
  };

  const fg: Record<ButtonVariant, string> = {
    primary: theme.colors.primaryForeground,
    secondary: theme.colors.text,
    outline: theme.colors.primary,
    danger: "#FFFFFF",
    ghost: theme.colors.primary,
  };

  const border: Record<ButtonVariant, ViewStyle["borderWidth"]> = {
    primary: undefined,
    secondary: undefined,
    outline: StyleSheet.hairlineWidth * 2,
    danger: undefined,
    ghost: undefined,
  };

  const borderColor: Record<ButtonVariant, string | undefined> = {
    primary: undefined,
    secondary: undefined,
    outline: theme.colors.primary,
    danger: undefined,
    ghost: undefined,
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        { backgroundColor: bg[variant] },
        variant === "outline" && border[variant] != null && {
          borderWidth: border[variant],
          borderColor: borderColor[variant],
        },
        isDisabled && { opacity: 0.5 },
        pressed && !isDisabled && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg[variant]} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              { color: fg[variant], fontWeight: theme.typography.fontWeights.semibold },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.touchTarget,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fullWidth: { width: "100%" },
  label: {
    fontSize: 15,
    textAlign: "center",
  },
});