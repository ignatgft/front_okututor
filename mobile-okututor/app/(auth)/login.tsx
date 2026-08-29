import React, { useState } from "react";
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";
import { AuthShell } from "../../src/components/auth/AuthShell";
import { Button, Input } from "../../src/components/ui";
import { useToast } from "../../src/components/ui/Toast";
import { login } from "../../src/api/auth";
import { useAuthStore } from "../../src/store/authStore";
import { getDashboardPath } from "../../src/utils/navigation";
import { startGoogleSignIn } from "../../src/services/oauth";
import { useTheme } from "../../src/theme/ThemeProvider";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim()) {
      setError(t("auth_login.errors.email_required", "Enter your email"));
      return;
    }
    if (!password) {
      setError(t("auth_login.errors.password_required", "Enter your password"));
      return;
    }
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.emailNotVerified) {
        router.replace({ pathname: "/verify-email", params: { email: result.email || "" } });
        return;
      }
      if (result.user) {
        useAuthStore.getState().login(result.user);
        router.replace(getDashboardPath(result.user.role));
      } else {
        setError(t("auth_login.errors.no_user", "Login succeeded but no user was returned."));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth_login.errors.default", "Login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const result = await startGoogleSignIn();
    if (result === "error") {
      showToast(t("auth_login.errors.google", "Google sign-in failed."), "error");
    }
  };

  return (
    <AuthShell
      title={t("auth_login.title", "Welcome back")}
      subtitle={t("auth_login.subtitle", "Log in to continue to Okututor")}
      footer={
        <Text style={{ color: theme.colors.text }}>
          {t("auth_login.no_account", "Don't have an account?")}{" "}
          <Link href="/register" style={{ color: theme.colors.primary, fontWeight: "600" }}>
            {t("auth_login.sign_up", "Sign up")}
          </Link>
        </Text>
      }
    >
      <Input
        label={t("common.email", "Email")}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={error}
      />
      <Input
        label={t("common.password", "Password")}
        value={password}
        onChangeText={setPassword}
        secure
        placeholder="••••••••"
        autoComplete="password"
        error={null}
      />
      <Button
        title={loading ? t("common.loading", "Loading...") : t("auth_login.submit", "Log in")}
        onPress={handleSubmit}
        loading={loading}
        fullWidth
      />
      <Link href="/forgot-password" style={{ marginTop: 12, textAlign: "center", color: theme.colors.primary }}>
        {t("auth_login.forgot", "Forgot password?")}
      </Link>
      <Button
        title={t("auth_login.google", "Continue with Google")}
        variant="outline"
        fullWidth
        style={{ marginTop: 8 }}
        onPress={handleGoogle}
      />
    </AuthShell>
  );
}