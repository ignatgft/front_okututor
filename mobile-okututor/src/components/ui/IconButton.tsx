import React from "react";
import { Pressable, StyleSheet, ViewStyle, AccessibilityProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeProvider";
import { sizes } from "../../theme/shadows";

export type IconName = keyof typeof Ionicons.glyphMap;

interface IconButtonProps extends AccessibilityProps {
  name: IconName;
  onPress?: () => void;
  size?: number;
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function IconButton({
  name,
  onPress,
  size = 22,
  color,
  disabled = false,
  style,
  accessibilityLabel,
  testID,
}: IconButtonProps) {
  const { theme } = useTheme();
  const tint = color || theme.colors.textSecondary;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || name}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        { minWidth: sizes.touchTarget, minHeight: sizes.touchTarget },
        pressed && { opacity: 0.6 },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
});