import React, { useState } from "react";
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";
import { AuthShell } from "../../src/components/auth/AuthShell";
import { OtpInput } from "../../src/components/auth/OtpInput";
import { ResendCodeButton } from "../../src/components/auth/ResendCodeButton";
import { Button, Input } from "../../src/components/ui";
import { authApi, EMAIL_ERROR_CODES } from "../../src/api/auth.api";
import { useTheme } from "../../src/theme/ThemeProvider";

const STEP = { EMAIL: "email", CODE: "code", NEW_PASSWORD: "password", DONE: "done" } as const;
type StepValue = (typeof STEP)[keyof typeof STEP];

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [step, setStep] = useState<StepValue>(STEP.EMAIL);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitEmail = async () => {
    setError("");
    if (!email.trim()) {
      setError(t("auth_forgot.error_email", "Please enter your email"));
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setStep(STEP.CODE);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth_forgot.error_default", "Failed to send reset code"));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (otp: string) => {
    if (otp.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const { response, data } = await authApi.verifyResetCode(email, otp);
      const d = data as { error?: string; message?: string } | null;
      if (response.ok) {
        setStep(STEP.NEW_PASSWORD);
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
      setError(err instanceof Error ? err.message : t("errors.network", "Network error."));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      const { response } = await authApi.resendResetCode(email);
      return { ok: response.ok };
    } catch {
      return { ok: false };
    }
  };

  const submitPassword = async () => {
    setError("");
    if (password.length < 8) {
      setError(t("auth_reset.error_length", "Password must be at least 8 characters"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth_register.passwords_no_match", "Passwords do not match"));
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, code, new_password: password });
      setStep(STEP.DONE);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth_reset.error_default", "Failed to reset password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={
        step === STEP.EMAIL
          ? t("auth_forgot.title", "Forgot password")
          : step === STEP.CODE
            ? t("verify.title", "Check your email")
            : step === STEP.NEW_PASSWORD
              ? t("auth_reset.title", "Reset password")
              : t("success.password_changed", "Password changed!")
      }
      subtitle={
        step === STEP.EMAIL
          ? t("auth_forgot.hint", "Enter your email and we'll send you a code to reset your password.")
          : step === STEP.CODE
            ? t("auth_forgot.code_sent", "We sent a 6-digit code to your email")
            : step === STEP.DONE
              ? t("auth_reset.success_hint", "You can now log in with your new password.")
              : undefined
      }
      footer={
        step !== STEP.DONE ? (
          <Link href="/login" style={{ color: theme.colors.primary, textAlign: "center" }}>
            {t("auth_forgot.back_to_login", "Back to login")}
          </Link>
        ) : (
          <Button
            title={t("auth_forgot.back_to_login", "Back to login")}
            variant="primary"
            onPress={() => router.replace("/login")}
            style={{ alignSelf: "stretch" }}
          />
        )
      }
    >
      {step === STEP.EMAIL && (
        <>
          <Input
            label={t("common.email", "Email")}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={error}
          />
          <Button
            title={loading ? t("common.sending", "Sending...") : t("auth_forgot.submit", "Send code")}
            onPress={submitEmail}
            loading={loading}
            fullWidth
          />
        </>
      )}

      {step === STEP.CODE && (
        <>
          <Text style={{ color: theme.colors.textMuted, marginBottom: 12, fontSize: 14 }}>
            {t("auth_forgot.code_sent", "We sent a 6-digit code to")} {email}
          </Text>
          {error ? <Text style={{ color: theme.colors.danger, marginBottom: 12 }}>{error}</Text> : null}
          <OtpInput
            value={code}
            onChange={setCode}
            onComplete={verifyCode}
            disabled={loading}
            error={!!error}
            autoFocus
          />
          <Button
            title={loading ? t("common.loading", "Loading...") : t("verify.confirm", "Verify")}
            onPress={() => verifyCode(code)}
            loading={loading}
            disabled={code.length !== 6}
            fullWidth
            style={{ marginTop: 16 }}
          />
          <ResendCodeButton onResend={resend} />
        </>
      )}

      {step === STEP.NEW_PASSWORD && (
        <>
          <Input
            label={t("auth_register.password", "New password")}
            value={password}
            onChangeText={setPassword}
            secure
            autoComplete="new-password"
            error={null}
          />
          <Input
            label={t("auth_register.repeat_password", "Confirm password")}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secure
            autoComplete="new-password"
            error={error}
          />
          <Button
            title={loading ? t("common.saving", "Saving...") : t("auth_reset.submit", "Update password")}
            onPress={submitPassword}
            loading={loading}
            fullWidth
          />
        </>
      )}

      {step === STEP.DONE && (
        <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
          {t("auth_reset.success_hint", "You can now log in with your new password.")}
        </Text>
      )}
    </AuthShell>
  );
}