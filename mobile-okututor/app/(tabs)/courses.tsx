import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Screen } from "../../src/components/ui/Screen";
import { Button, Badge, EmptyState } from "../../src/components/ui";
import { ScreenHeader } from "../../src/components/features/ScreenHeader";
import { studentsApi } from "../../src/api/booking.api";
import { coursesApi } from "../../src/api/courses.api";
import { useAuthStore } from "../../src/store/authStore";
import { useApi } from "../../src/hooks/useApi";
import { toList, MaybePaginated } from "../../src/types/api";
import { Enrollment } from "../../src/types/booking";
import { Course } from "../../src/types/course";
import { toneForStatus } from "../../src/components/ui/Badge";
import { useTheme } from "../../src/theme/ThemeProvider";
import { spacing } from "../../src/theme/spacing";
import { isTutorLike } from "../../src/constants/roles";
import { useToast } from "../../src/components/ui/Toast";

export default function CoursesScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const tutorMode = isTutorLike(user?.role);

  const studentState = useApi<Enrollment[]>(
    () =>
      studentsApi.myEnrollments().then((res) => ({
        response: res.response,
        data: toList<Enrollment>(res.data as MaybePaginated<Enrollment>),
      })),
    []
  );
  const tutorState = useApi<Course[]>(
    () => {
      if (!user?.id) {
        return Promise.resolve({ response: { ok: true } as never, data: [] as never });
      }
      return coursesApi.byTeacher(user.id).then((res) => ({
        response: res.response,
        data: toList<Course>(res.data as MaybePaginated<Course>),
      }));
    },
    [user?.id]
  );

  useFocusEffect(
    useCallback(() => {
      if (tutorMode) tutorState.refetch();
      else studentState.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tutorMode])
  );

  const cancelEnrollment = async (id: string | number) => {
    const { response, data } = await studentsApi.cancelEnrollment(id);
    if (!response.ok) {
      const d = data as { message?: string } | null;
      showToast(d?.message || t("errors.default", "Failed to cancel request"), "error");
    } else {
      showToast(t("courses.request_cancelled", "Request cancelled"), "success");
      studentState.refetch();
    }
  };

  const state = tutorMode ? tutorState : studentState;
  const items = (state.data || []) as (Enrollment | Course)[];

  return (
    <Screen scroll onRefresh={state.refetch} refreshing={state.loading && !state.data}>
      <ScreenHeader
        title={tutorMode ? t("tabs.courses", "Courses") : t("student.courses_title", "My courses")}
        right={
          tutorMode ? (
            <Button
              title="＋"
              variant="ghost"
              style={{ minWidth: 40, paddingHorizontal: 0 }}
              onPress={() => router.push("/course-form")}
              accessibilityLabel={t("courses.create", "Create course")}
            />
          ) : undefined
        }
      />

      {state.error && !state.data ? (
        <Text style={{ color: theme.colors.danger, paddingHorizontal: spacing[4] }}>
          {state.error}
        </Text>
      ) : null}

      {!state.loading && items.length === 0 && !state.error ? (
        <EmptyState
          title={tutorMode ? t("courses.empty_tutor", "You have no courses yet") : t("courses.empty_student", "You have no course requests")}
          hint={
            tutorMode
              ? t("courses.empty_tutor_hint", "Create your first course to start teaching.")
              : t("courses.empty_student_hint", "Browse the catalog and request a course.")
          }
        />
      ) : null}

      {items.map((item) => {
        const isEnrollment = !tutorMode;
        const title = (item as Course).title || (item as Enrollment).course_title || "-";
        const status = (item as Course).status || (item as Enrollment).status || "PENDING";
        const id = item.id;
        return (
          <Pressable
            key={String(id)}
            onPress={() => router.push(isEnrollment ? `/course/${(item as Enrollment).course_id}` : `/course/${id}`)}
            style={({ pressed }) => [
              styles.entry,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <View style={styles.entryHeader}>
              <Text style={[styles.entryTitle, { color: theme.colors.text }]} numberOfLines={2}>
                {title}
              </Text>
              <Badge label={t(`statuses.${status}`, status)} tone={toneForStatus(status)} />
            </View>
            {"preferred_schedule" in item && (item as Enrollment).preferred_schedule ? (
              <Text style={[styles.entryMeta, { color: theme.colors.textTertiary }]} numberOfLines={2}>
                {(item as Enrollment).preferred_schedule}
              </Text>
            ) : null}
            {"subject" in item && (item as Course).subject ? (
              <Text style={[styles.entryMeta, { color: theme.colors.textTertiary }]}>
                {(item as Course).subject}
              </Text>
            ) : null}
            {isEnrollment && (item as Enrollment).status === "PENDING" ? (
              <Button
                title={t("courses.cancel_request", "Cancel request")}
                variant="ghost"
                onPress={() => cancelEnrollment((item as Enrollment).id)}
                style={styles.cancelBtn}
              />
            ) : null}
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  entry: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[4],
  },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  entryTitle: { flex: 1, fontSize: 15, fontWeight: "600" },
  entryMeta: { fontSize: 13, marginTop: 6 },
  cancelBtn: { marginTop: 8, alignSelf: "flex-start" },
});