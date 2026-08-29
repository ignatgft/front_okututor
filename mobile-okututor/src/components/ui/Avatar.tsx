import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { sizes } from "../../theme/shadows";

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  onPress?: () => void;
}

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

export function Avatar({ uri, name, size = sizes.avatarMd, onPress }: AvatarProps) {
  const { theme } = useTheme();
  const imgSize = size;

  const inner = uri ? (
    <Image
      source={{ uri }}
      style={{ width: imgSize, height: imgSize, borderRadius: imgSize / 2 }}
      resizeMode="cover"
      accessibilityLabel={name ? `avatar: ${name}` : "avatar"}
    />
  ) : (
    <View
      style={[
        styles.initials,
        {
          width: imgSize,
          height: imgSize,
          borderRadius: imgSize / 2,
          backgroundColor: theme.colors.primaryLight,
        },
      ]}
    >
      <Text style={{ color: theme.colors.primary, fontWeight: "600", fontSize: imgSize * 0.36 }}>
        {initials(name)}
      </Text>
    </View>
  );

  if (!onPress) return <View style={[styles.wrap, { width: imgSize, height: imgSize }]}>{inner}</View>;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={name || "avatar"}>
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  initials: { alignItems: "center", justifyContent: "center" },
});