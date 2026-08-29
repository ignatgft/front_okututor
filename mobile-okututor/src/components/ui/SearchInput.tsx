import React, { forwardRef } from "react";
import { View, TextInput, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing } from "../../theme/spacing";

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  placeholder?: string;
  loading?: boolean;
}

export const SearchInput = forwardRef<TextInput, SearchInputProps>(function SearchInput(
  { value, onChangeText, onSubmit, onClear, placeholder = "Search…", loading = false },
  ref
) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.field,
        {
          backgroundColor: theme.colors.input,
          borderColor: theme.colors.border,
          borderWidth: 1,
        },
      ]}
    >
      <Ionicons name="search" size={18} color={theme.colors.textMuted} />
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        returnKeyType="search"
        autoCorrect={false}
        style={[styles.input, { color: theme.colors.text }]}
        accessibilityLabel={placeholder}
      />
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.primary} />
      ) : value.length > 0 && onClear ? (
        <Pressable onPress={onClear} hitSlop={8} accessibilityRole="button" accessibilityLabel="clear-search">
          <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  field: {
    minHeight: 48,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  input: { flex: 1, fontSize: 15, paddingVertical: spacing[3] },
});