import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../src/components/ui/Screen";
import { ScreenHeader } from "../../src/components/features/ScreenHeader";
import { Avatar, Badge, EmptyState } from "../../src/components/ui";
import { usersApi } from "../../src/api/tutors.api";
import { coursesApi } from "../../src/api/courses.api";
import { Course } from "../../src/types/course";
import { useTheme } from "../../src/theme/ThemeProvider";
import { spacing } from "../../src/theme/spacing";
import { formatPrice } from "../../src/utils/format";

interface TutorProfile {
  id?: string | number;
  full_name?: string;
  avatar_url?: string | null;
  avatar?: string | null;
  photoURL?: string | null;
  location?: string | null;
  experience_years?: number;
  bio?: string | null;
  subjects?: string | string[] | null;
  verification_status?: string;
  rating?: number;
  review_count?: number;
  telegram?: string;
  instagram?: string;
  whatsapp?: string;
}

export default function TutorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [userRes, coursesRes] = await Promise.all([
        usersApi.byId(id),
        coursesApi.byTeacher(id),
      ]);
      if (userRes.response.ok) setTutor(userRes.data as TutorProfile);
      else setError((userRes.data as { error?: string })?.error || t("errors.default", "Something went wrong."));
      const list = Array.isArray(coursesRes.data)
        ? coursesRes.data
        : (coursesRes.data as { content?: Course[] })?.content || [];
      setCourses(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
     
  }, [id, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const subjectsText = Array.isArray(tutor?.subjects)
    ? tutor!.subjects.join(", ")
    : tutor?.subjects || "";

  if (loading && !tutor) {
    return (
      <Screen>
        <ScreenHeader title={t("tutor_profile.title", "Tutor")} back />
        <View style={styles.center}><Text style={{ color: theme.colors.textMuted }}>{t("common.loading", "Loading...")}</Text></View>
      </Screen>
    );
  }
  if (!tutor) {
    return (
      <Screen>
        <ScreenHeader title={t("tutor_profile.not_found", "Tutor not found")} back />
        <EmptyState title={error || t("tutor_profile.not_found", "Tutor not found")} />
      </Screen>
    );
  }

  const verified = tutor.verification_status === "VERIFIED";
  const avatarUri = tutor.avatar_url || tutor.avatar || tutor.photoURL || undefined;

  return (
    <Screen>
      <ScreenHeader title={t("tutor_profile.title", "Tutor")} back />
      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Avatar uri={avatarUri} name={tutor.full_name || "Tutor"} size={88} />
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: theme.colors.text }]}>{tutor.full_name || "—"}</Text>
              {verified ? <Badge label={t("tutor_profile.verified", "Verified")} tone="success" /> : null}
            </View>
            {tutor.location ? (
              <InfoLine icon="location-outline" text={tutor.location} />
            ) : null}
            {tutor.experience_years ? (
              <InfoLine icon="briefcase-outline" text={`${t("profile.experience", "Experience")}: ${tutor.experience_years} ${t("profile.years", "years")}`} />
            ) : null}
            {typeof tutor.rating === "number" && tutor.rating > 0 ? (
              <InfoLine icon="star" text={`${tutor.rating.toFixed(1)}${tutor.review_count ? ` (${tutor.review_count})` : ""}`} />
            ) : null}
          </View>
        </View>

        {tutor.bio ? (
          <View>
            <SectionTitle>{t("profile.bio", "About")}</SectionTitle>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 21 }}>{tutor.bio}</Text>
          </View>
        ) : null}

        {subjectsText ? (
          <View>
            <SectionTitle>{t("profile.subjects", "Subjects")}</SectionTitle>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>{subjectsText}</Text>
          </View>
        ) : null}

        {(tutor.telegram || tutor.instagram || tutor.whatsapp) ? (
          <View style={styles.socials}>
            <SectionTitle>{t("profile.contacts", "Contacts")}</SectionTitle>
            <View style={styles.socialRow}>
              {([
                ["telegram", "paper-plane"],
                ["instagram", "logo-instagram"],
                ["whatsapp", "logo-whatsapp"],
              ] as const).map(
                ([key, icon]) =>
                  tutor[key] ? (
                    <Pressable key={key} onPress={() => Linking.openURL(tutor[key]!)} style={[styles.socialChip, { backgroundColor: theme.colors.primaryLight }]}>
                      <Ionicons name={icon} size={16} color={theme.colors.primary} />
                      <Text style={{ color: theme.colors.primary, fontSize: 13 }}>{key}</Text>
                    </Pressable>
                  ) : null
              )}
            </View>
          </View>
        ) : null}

        <View>
          <SectionTitle>{t("tutor_profile.courses", "Courses")}</SectionTitle>
          {courses.length === 0 ? (
            <Text style={{ color: theme.colors.textMuted }}>{t("tutor_profile.no_courses", "No courses yet")}</Text>
          ) : (
            courses.map((c) => (
              <Pressable
                key={String(c.id)}
                onPress={() => router.push(`/course/${c.id}`)}
                style={({ pressed }) => [
                  styles.courseCard,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={{ color: theme.colors.text, fontWeight: "600" }}>{c.title}</Text>
                {c.description ? (
                  <Text numberOfLines={2} style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                    {c.description}
                  </Text>
                ) : null}
                <View style={styles.courseMeta}>
                  <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: "600" }}>
                    {c.price_per_hour != null ? `${formatPrice(c.price_per_hour, c.currency)} /h` : t("common.price_not_set", "Price not set")}
                  </Text>
                  {typeof c.rating === "number" && c.rating > 0 ? (
                    <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>{c.rating.toFixed(1)} ★</Text>
                  ) : null}
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{children}</Text>;
}

function InfoLine({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.infoLine}>
      <Ionicons name={icon} size={14} color={theme.colors.textMuted} />
      <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", flex: 1 },
  headerCard: {
    flexDirection: "row",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerInfo: { flex: 1, gap: spacing[1] },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  name: { fontSize: 18, fontWeight: "700" },
  infoLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  socials: {},
  socialRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  socialChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, textTransform: "capitalize" },
  courseCard: { padding: spacing[3], borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, marginBottom: spacing[2] },
  courseMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
});