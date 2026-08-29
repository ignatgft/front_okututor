import React, { ReactNode } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { sizes } from "../../theme/shadows";

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  keyboard?: boolean;
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: object;
}

/**
 * Safe, keyboard-aware screen wrapper. `scroll` enables a ScrollView.
 */
export function Screen({
  children,
  scroll = false,
  keyboard = false,
  contentContainerStyle,
  onRefresh,
  refreshing,
  style,
}: ScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const wrap = keyboard ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {children}
    </KeyboardAvoidingView>
  ) : (
    children
  );

  const containerStyle = [
    styles.flex,
    { backgroundColor: theme.colors.background, paddingTop: insets.top },
    style,
  ];

  if (scroll) {
    return (
      <View style={containerStyle}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            { paddingBottom: insets.bottom + sizes.tabBarHeight },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            ) : undefined
          }
        >
          {wrap}
        </ScrollView>
      </View>
    );
  }

  return <View style={containerStyle}>{wrap}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});