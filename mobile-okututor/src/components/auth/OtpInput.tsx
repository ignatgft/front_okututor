import React, { useRef } from "react";
import { View, TextInput, StyleSheet, Keyboard } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing } from "../../theme/spacing";

const OTP_LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

/**
 * 6-box one-time-password input: typing advances to the next box and a full
 * code immediately triggers `onComplete`.
 */
export function OtpInput({ value, onChange, onComplete, disabled = false, error = false, autoFocus = false }: OtpInputProps) {
  const { theme } = useTheme();
  const refs = useRef<(TextInput | null)[]>([]);

  const digits = Array.from({ length: OTP_LENGTH }).map((_, i) => value[i] || "");

  const handleChangeText = (index: number, text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned) {
      const chars = Array.from(value).slice(0, OTP_LENGTH);
      chars[index] = cleaned[cleaned.length - 1];
      const next = chars.join("").slice(0, OTP_LENGTH);
      onChange(next);
      if (next.length === OTP_LENGTH) {
        Keyboard.dismiss();
        onComplete?.(next);
      } else {
        refs.current[Math.min(index + 1, OTP_LENGTH - 1)]?.focus();
      }
    } else {
      const chars = Array.from(value).slice(0, index);
      onChange(chars.join(""));
      if (index > 0) refs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => {
        const isCaret = value.length === index;
        return (
          <TextInput
            key={index}
            ref={(el) => { refs.current[index] = el; }}
            value={digit}
            onChangeText={(text) => handleChangeText(index, text)}
            editable={!disabled}
            autoFocus={autoFocus && index === 0 && value.length === 0}
            keyboardType="number-pad"
            maxLength={2}
            selectTextOnFocus
            accessibilityLabel={`Digit ${index + 1} of ${OTP_LENGTH}`}
            style={[
              styles.box,
              {
                backgroundColor: theme.colors.input,
                color: theme.colors.text,
                borderColor: error
                  ? theme.colors.danger
                  : digit
                    ? theme.colors.primary
                    : theme.colors.border,
                borderWidth: 1.5,
              },
              isCaret && { borderColor: theme.colors.primary },
              disabled && { opacity: 0.55 },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing[2] },
  box: {
    width: 48,
    height: 54,
    borderRadius: radius.md,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    padding: 0,
  },
});