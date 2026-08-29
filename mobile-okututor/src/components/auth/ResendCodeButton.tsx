import React, { useEffect, useState } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

interface ResendCodeButtonProps {
  onResend: () => Promise<{ ok: boolean; resendAvailableIn?: number }>;
}

/** Countdown + resend button shown under OTP inputs. */
export function ResendCodeButton({ onResend }: ResendCodeButtonProps) {
  const { theme } = useTheme();
  const [availableIn, setAvailableIn] = useState(60);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(true);

  useEffect(() => {
    if (availableIn <= 0) return;
    const timer = setTimeout(() => {
      if (availableIn - 1 <= 0) setCooldown(false);
      setAvailableIn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [availableIn]);

  const handleResend = async () => {
    setLoading(true);
    try {
      const result = await onResend();
      if (result.ok) {
        setAvailableIn(result.resendAvailableIn ?? 60);
        setCooldown(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || cooldown;

  return (
    <Pressable
      onPress={handleResend}
      disabled={disabled}
      accessibilityRole="button"
      style={styles.wrap}
    >
      <Text
        style={[
          styles.text,
          { color: disabled ? theme.colors.textMuted : theme.colors.primary },
        ]}
      >
        {cooldown
          ? "0:" + String(Math.max(0, availableIn)).padStart(2, "0")
          : "Resend code"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 8 },
  text: { fontSize: 14, fontWeight: "500" },
});