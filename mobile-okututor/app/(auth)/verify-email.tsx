import React, { useState } from "react";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, StyleSheet, Pressable } from "react-native";
import { AuthShell } from "../../src/components/auth/AuthShell";
import { OtpInput } from "../../src/components/auth/OtpInput";
import { ResendCodeButton } from "../../src/components/auth/ResendCodeButton";
import { Button, Input } from "../../src/components/ui";
import { authApi, EMAIL_ERROR_CODES } from "../../src/api/auth.api";
import { setTokens } from "../../src/api/token";
import { useAuthStore } from "../../src/store/authStore";
import { getDashboardPath } from "../../src/utils/navigation";
import { maskEmail } from "../../src/utils/maskEmail";
import { useTheme } from "../../src/theme/ThemeProvider";

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [changeEmailLoading, setChangeEmailLoading] = useState(false);

  const verify = async (otp: string) => {
    if (!email || otp.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const { response, data } = await authApi.verifyEmail(email, otp);
      const d = data as {
        status?: string;
        access_token?: string;
        refresh_token?: string;
        user?: unknown;
        error?: string;
        message?: string;
      } | null;
      if (response.ok && d?.status === "EMAIL_VERIFIED") {
        if (d.access_token) await setTokens(d.access_token, d.refresh_token ?? null);
        if (d.user) {
          useAuthStore.getState().login(d.user as never);
          router.replace(getDashboardPath((d.user as { role?: string })?.role));
        } else {
          const current = useAuthStore.getState().user;
          if (current) {
            useAuthStore.getState().setUser(current);
            router.replace(getDashboardPath(current.role));
          } else {
            router.replace("/login");
          }
        }
      } else if (d?.error === EMAIL_ERROR_CODES.TOO_MANY_ATTEMPTS) {
        setError(t("errors.too_many_attempts", "Too many attempts. Request a new code."));
      } else if (d?.error === EMAIL_ERROR_CODES.VERIFICATION_CODE_EXPIRED) {
        setError(t("errors.expired", "Code expired. Request a new one."));
      } else if (d?.error === EMAIL_ERROR_CODES.INVALID_CODE) {
        setError(t("errors.invalid_code", "Invalid code. Please try again."));
      } else {
        setError(d?.message || t("errors.default", "Something went wrong."));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.network", "Network error. Check your connection."));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      const { response } = await authApi.resendVerification(email);
      return { ok: response.ok };
    } catch {
      return { ok: false };
    }
  };

  const changeEmail = async () => {
    setChangeEmailLoading(true);
    setError("");
    try {
      const { response } = await authApi.changeEmail(newEmail);
      if (response.ok) {
        setEmail(newEmail);
        setNewEmail("");
        setShowChangeEmail(false);
        setCode("");
      } else {
        setError(t("errors.default", "Failed to change email."));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.network", "Network error."));
    } finally {
      setChangeEmailLoading(false);
    }
  };

  return (
    <AuthShell
      title={t("verify.title", "Check your email")}
      subtitle={
        <>
          {t("verify.subtitle", "We sent a 6-digit code to")}{" "}
          <Text style={{ fontWeight: "600" }}>{maskEmail(email)}</Text>
        </>
      }
      footer={
        <Link href="/login" style={{ color: theme.colors.primary, textAlign: "center" }}>
          {t("auth_forgot.back_to_login", "Back to login")}
        </Link>
      }
    >
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
      <OtpInput
        value={code}
        onChange={setCode}
        onComplete={verify}
        disabled={loading}
        error={!!error}
        autoFocus
      />
      <Button
        title={loading ? t("common.loading", "Loading...") : t("verify.confirm", "Verify")}
        onPress={() => verify(code)}
        loading={loading}
        disabled={code.length !== 6}
        fullWidth
        style={{ marginTop: 16 }}
      />
      <ResendCodeButton onResend={resend} />

      {showChangeEmail ? (
        <>
          <Input
            label={t("verify.new_email", "New email")}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            error={null}
          />
          <Button
            title={changeEmailLoading ? t("common.sending", "Sending...") : t("verify.change_email", "Change email")}
            onPress={changeEmail}
            loading={changeEmailLoading}
            fullWidth
          />
        </>
      ) : (
        <Pressable
          onPress={() => setShowChangeEmail(true)}
          accessibilityRole="button"
          style={{ marginTop: 16, alignItems: "center" }}
        >
          <Text style={{ color: theme.colors.primary }}>{t("verify.change_email", "Change email")}</Text>
        </Pressable>
      )}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  error: { marginBottom: 12, fontSize: 14 },
});