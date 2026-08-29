import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../src/components/ui/Screen";
import { ScreenHeader } from "../../src/components/features/ScreenHeader";
import { Avatar, Button, Input, Select } from "../../src/components/ui";
import { useToast } from "../../src/components/ui/Toast";
import { useAuthStore } from "../../src/store/authStore";
import { useUserStore } from "../../src/store/userStore";
import { useTheme, ThemeMode } from "../../src/theme/ThemeProvider";
import { setAppLanguage, SupportedLanguage } from "../../src/i18n";
import { spacing } from "../../src/theme/spacing";

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { theme, setMode } = useTheme();
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useUserStore((s) => s.updateUser);
  const saving = useUserStore((s) => s.saving);

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [editError, setEditError] = useState<string | null>(null);

  const handleLanguage = (lng: SupportedLanguage) => {
    setAppLanguage(lng).catch(() => undefined);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const saveProfile = async () => {
    setEditError(null);
    const result = await updateUser({
      full_name: fullName.trim(),
      phone,
      bio,
      location,
    });
    if (!result.ok) {
      setEditError(result.message || t("errors.default", "Something went wrong."));
      return;
    }
    setEditing(false);
    showToast(t("profile.updated", "Profile updated"), "success");
  };

  return (
    <Screen scroll>
      <ScreenHeader title={t("tabs.profile", "Profile")} />

      <View style={styles.card}>
        <Avatar uri={user?.photoURL || user?.avatar} name={user?.full_name} size={72} />
        <Text style={[styles.name, { color: theme.colors.text }]}>{user?.full_name || "—"}</Text>
        <Text style={{ color: theme.colors.textSecondary }}>{user?.email}</Text>
        {user?.role ? (
          <Text style={[styles.role, { color: theme.colors.primary }]}>{user.role}</Text>
        ) : null}
        {user?.email_verified === false ? (
          <Link href="/verify-email" style={{ color: theme.colors.danger, marginTop: 8 }}>
            {t("profile.verify_email", "Verify email")}
          </Link>
        ) : (
          <Text style={{ color: theme.colors.success, marginTop: 8 }}>
            {t("profile.email_verified", "Email verified")}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t("profile.account", "Account")}
        </Text>

        <View style={[styles.item, { borderColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.text }}>{t("profile.language", "Language")}</Text>
          <Select
            options={[
              { value: "en", label: "English" },
              { value: "ru", label: "Русский" },
              { value: "kg", label: "Кыргызча" },
            ]}
            value={i18n.language === "ky" ? "kg" : i18n.language}
            onChange={(v) => handleLanguage(v as SupportedLanguage)}
            placeholder={t("profile.language", "Language")}
          />
        </View>

        <View style={[styles.item, { borderColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.text }}>{t("profile.theme", "Theme")}</Text>
          <Select
            options={[
              { value: "system", label: t("theme.system", "System") },
              { value: "light", label: t("theme.light", "Light") },
              { value: "dark", label: t("theme.dark", "Dark") },
            ]}
            value={theme.mode}
            onChange={(v) => setMode(v as ThemeMode)}
            placeholder={t("profile.theme", "Theme")}
          />
        </View>

        <Pressable
          onPress={() => router.push("/notifications")}
          style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
        >
          <Text style={{ color: theme.colors.text }}>{t("profile.notifications", "Notifications")}</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => router.push("/support")}
          style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
        >
          <Text style={{ color: theme.colors.text }}>{t("profile.support", "Contact support")}</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t("profile.personal", "Personal info")}
        </Text>
        {!editing ? (
          <>
            <View style={styles.infoRow}>
              <Text style={{ color: theme.colors.textTertiary, width: 90 }}>{t("profile.phone", "Phone")}</Text>
              <Text style={{ color: theme.colors.text, flex: 1 }}>{user?.phone || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={{ color: theme.colors.textTertiary, width: 90 }}>{t("profile.bio", "About")}</Text>
              <Text style={{ color: theme.colors.text, flex: 1 }}>{user?.bio || "—"}</Text>
            </View>
            <Button
              title={t("profile.edit", "Edit profile")}
              variant="outline"
              onPress={() => {
                setFullName(user?.full_name || "");
                setPhone(user?.phone || "");
                setBio(user?.bio || "");
                setLocation(user?.location || "");
                setEditing(true);
              }}
            />
          </>
        ) : (
          <>
            {editError ? (
              <Text style={{ color: theme.colors.danger, marginBottom: 8 }}>{editError}</Text>
            ) : null}
            <Input
              label={t("common.full_name", "Full name")}
              value={fullName}
              onChangeText={setFullName}
              error={null}
            />
            <Input label={t("profile.phone", "Phone")} value={phone} onChangeText={setPhone} error={null} />
            <Input
              label={t("profile.bio", "About")}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              error={null}
            />
            <Input label={t("profile.location", "Location")} value={location} onChangeText={setLocation} error={null} />
            <View style={styles.editActions}>
              <Button
                title={t("common.cancel", "Cancel")}
                variant="ghost"
                onPress={() => setEditing(false)}
              />
              <Button
                title={saving ? t("common.saving", "Saving...") : t("common.save", "Save")}
                onPress={saveProfile}
                loading={saving}
              />
            </View>
          </>
        )}
      </View>

      <Button
        title={t("profile.logout", "Log out")}
        variant="danger"
        onPress={handleLogout}
        style={{ marginHorizontal: spacing[4], marginBottom: spacing[8] }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", paddingVertical: spacing[5], paddingHorizontal: spacing[4] },
  name: { fontSize: 19, fontWeight: "700", marginTop: 8 },
  role: { fontSize: 13, marginTop: 4, fontWeight: "600" },
  section: { paddingHorizontal: spacing[4], marginBottom: spacing[2] },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  item: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: spacing[3] },
  link: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  infoRow: { flexDirection: "row", marginBottom: 8 },
  editActions: { flexDirection: "row", gap: 12, marginTop: 4 },
});