import React, { useState } from "react";
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";
import { AuthShell } from "../../src/components/auth/AuthShell";
import { Button, Input, Select } from "../../src/components/ui";
import { useToast } from "../../src/components/ui/Toast";
import { register } from "../../src/api/auth";
import { useAuthStore } from "../../src/store/authStore";
import { getDashboardPath } from "../../src/utils/navigation";
import { startGoogleSignIn } from "../../src/services/oauth";
import { ROLES } from "../../src/constants/roles";
import { useTheme } from "../../src/theme/ThemeProvider";

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [role, setRole] = useState<string>(ROLES.STUDENT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!fullName.trim()) {
      setError(t("auth_register.errors.name", "Enter your full name"));
      return;
    }
    if (!email.trim()) {
      setError(t("auth_register.errors.email", "Enter your email"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth_register.error_length", "Password must be at least 8 characters"));
      return;
    }
    if (password !== repeatPassword) {
      setError(t("auth_register.passwords_no_match", "Passwords do not match"));
      return;
    }
    setLoading(true);
    try {
      const result = await register(
        email.trim(),
        password,
        repeatPassword,
        fullName.trim(),
        role as (typeof ROLES)[keyof typeof ROLES]
      );
      if (result.emailVerificationRequired) {
        router.replace({ pathname: "/verify-email", params: { email: result.email || "" } });
        return;
      }
      if (result.user) {
        useAuthStore.getState().login(result.user);
        router.replace(getDashboardPath(result.user.role));
      } else {
        setError(t("auth_register.errors.no_user", "Account created but no user was returned."));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth_register.errors.default", "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const result = await startGoogleSignIn(role);
    if (result === "error") {
      showToast(t("auth_login.errors.google", "Google sign-in failed."), "error");
    }
  };

  return (
    <AuthShell
      title={t("auth_register.title", "Create account")}
      subtitle={t("auth_register.subtitle", "Join Okututor and start learning or teaching")}
      footer={
        <Text style={{ color: theme.colors.text }}>
          {t("auth_register.has_account", "Already have an account?")}{" "}
          <Link href="/login" style={{ color: theme.colors.primary, fontWeight: "600" }}>
            {t("auth_login.sign_in", "Log in")}
          </Link>
        </Text>
      }
    >
      <Input
        label={t("common.full_name", "Full name")}
        value={fullName}
        onChangeText={setFullName}
        placeholder="Jane Doe"
        autoComplete="name"
        error={null}
      />
      <Input
        label={t("common.email", "Email")}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
        error={null}
      />
      <Select
        label={t("auth_register.role", "I want to")}
        options={[
          { value: ROLES.STUDENT, label: t("auth_register.role_student", "Learn (Student)") },
          { value: ROLES.TUTOR, label: t("auth_register.role_tutor", "Teach (Tutor)") },
        ]}
        value={role}
        onChange={setRole}
      />
      <Input
        label={t("auth_register.password", "Password")}
        value={password}
        onChangeText={setPassword}
        secure
        autoComplete="new-password"
        error={null}
      />
      <Input
        label={t("auth_register.repeat_password", "Confirm password")}
        value={repeatPassword}
        onChangeText={setRepeatPassword}
        secure
        autoComplete="new-password"
        error={error}
      />
      <Button
        title={loading ? t("common.loading", "Loading...") : t("auth_register.submit", "Create account")}
        onPress={handleSubmit}
        loading={loading}
        fullWidth
      />
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