import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing } from "../../theme/spacing";
import { Button } from "./Button";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string | null;
}

export function Select({ options, value, onChange, placeholder = "Select…", label, error }: SelectProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          {
            backgroundColor: theme.colors.input,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            borderWidth: 1,
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text
          style={[
            styles.value,
            { color: selected ? theme.colors.text : theme.colors.textMuted },
          ]}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.colors.textMuted} />
      </Pressable>
      {error ? (
        <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text>
      ) : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>{label || placeholder}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      pressed && { backgroundColor: theme.colors.surfaceHover },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: isSelected ? theme.colors.primary : theme.colors.text },
                        isSelected && { fontWeight: "600" },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
            <Button title="Close" variant="ghost" onPress={() => setOpen(false)} />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing[4] },
  label: { fontSize: 13, marginBottom: spacing[1], fontWeight: "500" },
  field: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  value: { fontSize: 15 },
  error: { fontSize: 12, marginTop: spacing[1] },
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    padding: spacing[4],
    paddingBottom: spacing[8],
    maxHeight: "70%",
  },
  sheetTitle: { fontSize: 17, fontWeight: "600", marginBottom: spacing[3] },
  option: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionLabel: { fontSize: 15 },
});