import React, { ReactNode } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { sizes } from "../../theme/shadows";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}

/** Custom header used on every screen (keeps full styling control). */
export function ScreenHeader({ title, subtitle, back = false, right }: ScreenHeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
          paddingTop: insets.top,
          height: insets.top + sizes.headerHeight,
        },
      ]}
    >
      <View style={styles.inner}>
        {back ? (
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="go-back"
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        <View style={styles.titles}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.right}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { borderBottomWidth: StyleSheet.hairlineWidth },
  inner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: sizes.headerHeight,
  },
  back: { width: 40, alignItems: "flex-start", justifyContent: "center" },
  titles: { flex: 1, alignItems: "center" },
  title: { fontSize: 17, fontWeight: "600" },
  subtitle: { fontSize: 12, marginTop: 1 },
  right: { width: 40, alignItems: "flex-end", justifyContent: "center" },
});