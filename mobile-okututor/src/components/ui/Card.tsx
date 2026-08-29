import React, { ReactNode } from "react";
import { View, Pressable, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing } from "../../theme/spacing";

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
}

export function Card({ children, onPress, style, padded = true }: CardProps) {
  const { theme } = useTheme();
  const base: ViewStyle = {
    backgroundColor: theme.colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: padded ? spacing[4] : 0,
  };

  if (!onPress) {
    return <View style={[base, style]}>{children}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [base, style, pressed && { opacity: 0.85 }]}
    >
      {children}
    </Pressable>
  );
}