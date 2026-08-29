import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../src/components/ui/Screen";
import { ScreenHeader } from "../../src/components/features/ScreenHeader";
import { Button, Badge, Input, ConfirmDialog, EmptyState } from "../../src/components/ui";
import { toneForStatus } from "../../src/components/ui/Badge";
import { coursesApi } from "../../src/api/courses.api";
import { reviewsApi } from "../../src/api/lessons.api";
import { studentsApi, enrollmentsApi } from "../../src/api/booking.api";
import { useAuthStore } from "../../src/store/authStore";
import { useApi } from "../../src/hooks/useApi";
import { Course } from "../../src/types/course";
import { ROLES, isTutorLike } from "../../src/constants/enums";
import { useTheme } from "../../src/theme/ThemeProvider";
import { spacing } from "../../src/theme/spacing";
import { useToast } from "../../src/components/ui/Toast";
import { formatPrice } from "../../src/utils/format";

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [enrollmentStatus, setEnrollmentStatus] = useState("NOT_REQUESTED");
  const [enrollmentId, setEnrollmentId] = useState<string | number | null>(null);
  const [reviews, setReviews] = useState<{ id?: string | number; rating?: number; comment?: string; student_name?: string }[]>([]);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState("");
  const [enrollSchedule, setEnrollSchedule] = useState("");
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [reviewForm, setReviewForm] = useState<{ rating: number; comment: string }>({ rating: 0, comment: "" });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [canReview, setCanReview] = useState<{ eligible?: boolean; has_attended?: boolean; already_reviewed?: boolean } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const courseApi = useApi<Course>(() => coursesApi.byId(id), [id]);
  const course = courseApi.data;
  const isOwner = !!course && !!user && String(course.teacher_id) === String(user.id);

  const reloadContext = useCallback(async () => {
    if (!isAuthenticated || !user || !id) return;
    if (isTutorLike({ role: user.role })) return;
    try {
      const { response, data } = await enrollmentsApi.forCourse(id);
      if (response.ok && (data as { status?: string }).status) {
        setEnrollmentStatus((data as { status: string }).status);
        setEnrollmentId((data as { id?: string | number }).id || null);
      }
      const cr = await coursesApi.canReview(id);
      if (cr.response.ok) setCanReview(cr.data);
    } catch {
      // non-fatal: keep the detail page usable
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, id]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const rev = await reviewsApi.byCourse(id).catch(() => ({ response: { ok: false }, data: null }));
        if (rev.response.ok && Array.isArray(rev.data)) {
          setReviews(rev.data);
        }
      })();
      reloadContext();
      courseApi.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])
  );

  const sendEnrollRequest = async () => {
    setEnrollLoading(true);
    try {
      const { response, data } = await studentsApi.requestCourse(id, {
        message: enrollMessage,
        preferred_schedule: enrollSchedule,
      });
      if (response.ok) {
        setEnrollmentStatus("PENDING");
        setEnrollmentId((data as { id?: string | number }).id || null);
        setShowEnrollForm(false);
        showToast(t("course_enroll.request_sent", "Request sent! The tutor will review it."), "success");
      } else {
        showToast("message" in (data || {}) ? (data as { message?: string }).message || "" : t("course_enroll.request_fail", "Failed to send request"), "error");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("course.network_error", "Network error"), "error");
    } finally {
      setEnrollLoading(false);
    }
  };

  const cancelEnroll = async () => {
    if (!enrollmentId) return;
    setEnrollLoading(true);
    try {
      await studentsApi.cancelEnrollment(enrollmentId);
      setEnrollmentStatus("NOT_REQUESTED");
      setEnrollmentId(null);
      setShowCancelConfirm(false);
      showToast(t("courses.request_cancelled", "Request cancelled"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("course.network_error", "Network error"), "error");
    } finally {
      setEnrollLoading(false);
    }
  };

  const submitReview = async () => {
    if (reviewForm.rating === 0) {
      showToast(t("course.rating_required", "Please choose a rating"), "error");
      return;
    }
    setReviewLoading(true);
    try {
      const { response } = await reviewsApi.create(id, { rating: reviewForm.rating, comment: reviewForm.comment });
      if (response.ok) {
        showToast(t("course.review_submitted", "Review submitted"), "success");
        setReviewForm({ rating: 0, comment: "" });
        const rev = await reviewsApi.byCourse(id).catch(() => ({ response: { ok: false }, data: null }));
        if (rev.response.ok && Array.isArray(rev.data)) setReviews(rev.data);
      } else {
        showToast(t("course.review_submit_fail", "Failed to submit review"), "error");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("course.network_error", "Network error"), "error");
    } finally {
      setReviewLoading(false);
    }
  };

  const deleteCourse = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const { response } = await coursesApi.delete(id);
      if (response.ok) router.replace("/");
      else showToast(t("course.delete_error", "Failed to delete course"), "error");
    } catch {
      showToast(t("course.delete_error", "Failed to delete course"), "error");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const openBooking = () => {
    router.push({ pathname: "/booking/new", params: { course_id: id } });
  };

  if (courseApi.loading && !course) {
    return <Screen><View style={styles.center}><Text style={{ color: theme.colors.textMuted }}>{t("common.loading", "Loading...")}</Text></View></Screen>;
  }
  if (!course) {
    return (
      <Screen>
        <ScreenHeader title={t("course.not_found", "Course not found")} back />
        <EmptyState title={courseApi.error || t("course.not_found", "Course not found")} />
      </Screen>
    );
  }

  const rating = course.rating ?? null;

  return (
    <Screen>
      <ScreenHeader title={t("course.title", "Course")} back right={undefined} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{course.title}</Text>
            {course.status ? <Badge label={t(`statuses.${course.status}`, course.status)} tone={toneForStatus(course.status)} /> : null}
          </View>

          {course.description ? (
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{course.description}</Text>
          ) : null}

          <View style={styles.facts}>
            <FactRow icon="book-outline" label={t("course.subject_label", "Subject")} value={course.subject || "—"} />
            <FactRow icon="location-outline" label={t("course.location", "Location")} value={course.location_type ? t(`course.location_type.${course.location_type}`, course.location_type) : "—"} />
            <FactRow icon="people-outline" label={t("course.group", "Group")} value={course.group_size ? t(`course.group_type.${course.group_size}`, course.group_size) : "—"} />
            <FactRow
              icon="cash-outline"
              label={t("course.price", "Price")}
              value={course.price_per_hour != null ? `${formatPrice(course.price_per_hour, course.currency)} /h` : t("common.price_not_set", "Price not set")}
            />
            {rating ? (
              <FactRow icon="star" label={t("course.rating", "Rating")} value={`${rating.toFixed(1)} (${course.review_count ?? 0})`} />
            ) : null}
          </View>

          {course.teacher_name || course.teacher_id ? (
            <Pressable
              onPress={() => course.teacher_id && router.push(`/tutor/${course.teacher_id}`)}
              style={({ pressed }) => [
                styles.tutorRow,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="person-circle-outline" size={22} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>{t("course.tutor", "Tutor")}</Text>
                <Text style={{ color: theme.colors.text, fontWeight: "600" }}>{course.teacher_name || "—"}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </Pressable>
          ) : null}

          {isOwner ? (
            <View style={styles.ownerActions}>
              <Button title={t("course.edit", "Edit")} variant="outline" onPress={() => router.push(`/course-form?id=${course.id}`)} />
              <Button title={t("course.delete", "Delete")} variant="danger" onPress={() => setShowDeleteConfirm(true)} />
            </View>
          ) : isAuthenticated && !isTutorLike({ role: user?.role }) ? (
            <View style={styles.studentActions}>
              {enrollmentStatus === "PENDING" ? (
                <>
                  <View style={styles.statusNote}>
                    <Ionicons name="time-outline" size={18} color={theme.colors.warning} />
                    <Text style={{ color: theme.colors.textSecondary, flex: 1 }}>
                      {t("course_enroll.request_pending", "Request pending — waiting for tutor's response")}
                    </Text>
                  </View>
                  <Button title={t("common.cancel_request", "Cancel request")} variant="ghost" onPress={() => setShowCancelConfirm(true)} />
                </>
              ) : enrollmentStatus === "ACCEPTED" || enrollmentStatus === "COMPLETED" || enrollmentStatus === "ENROLLED" ? (
                <>
                  <Text style={{ color: theme.colors.success, marginVertical: 8 }}>
                    {t("course_enroll.request_accepted", "You are enrolled in this course 🎉")}
                  </Text>
                  <Button title={t("course.book_lesson", "Book Lesson")} onPress={openBooking} />
                </>
              ) : enrollmentStatus === "REJECTED" ? (
                <Text style={{ color: theme.colors.danger }}>{t("course_enroll.request_rejected", "Your request was declined by the tutor.")}</Text>
              ) : (
                !showEnrollForm ? (
                  <Button title={t("course_enroll.request_to_join", "Request to join")} onPress={() => setShowEnrollForm(true)} />
                ) : (
                  <>
                    <Text style={[styles.formTitle, { color: theme.colors.text }]}>
                      {t("course_enroll.request_form_title", "Join this course")}
                    </Text>
                    <Input
                      label={t("course_enroll.message_label", "Message to tutor")}
                      value={enrollMessage}
                      onChangeText={setEnrollMessage}
                      multiline
                      numberOfLines={3}
                      error={null}
                    />
                    <Input
                      label={t("course_enroll.preferred_schedule", "Preferred schedule")}
                      value={enrollSchedule}
                      onChangeText={setEnrollSchedule}
                      placeholder={t("course_enroll.preferred_schedule_hint", "e.g. weekdays after 18:00")}
                      error={null}
                    />
                    <View style={styles.rowGap}>
                      <Button title={t("course.cancel", "Cancel")} variant="ghost" onPress={() => setShowEnrollForm(false)} />
                      <Button
                        title={enrollLoading ? t("common.sending", "Sending...") : t("course_enroll.send_request", "Send request")}
                        onPress={sendEnrollRequest}
                        loading={enrollLoading}
                      />
                    </View>
                  </>
                )
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.reviews}>
          <Text style={[styles.reviewsTitle, { color: theme.colors.text }]}>{t("course.reviews", "Reviews")}</Text>
          {reviews.length === 0 ? (
            <Text style={{ color: theme.colors.textMuted }}>{t("course.no_reviews", "No reviews yet.")}</Text>
          ) : (
            reviews.map((r, i) => (
              <View key={String(r.id ?? i)} style={[styles.review, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={{ color: theme.colors.text, fontWeight: "600" }}>{r.student_name || "Student"}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Ionicons key={n} name={n <= (r.rating || 0) ? "star" : "star-outline"} size={14} color="#F5A623" />
                  ))}
                </View>
                {r.comment ? <Text style={{ color: theme.colors.textSecondary, marginTop: 4 }}>{r.comment}</Text> : null}
              </View>
            ))
          )}

          {isAuthenticated && user?.role === ROLES.STUDENT && !isOwner && canReview?.eligible ? (
            <View style={styles.reviewForm}>
              <Text style={[styles.formTitle, { color: theme.colors.text }]}>{t("course.leave_review", "Leave a review")}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => setReviewForm((p) => ({ ...p, rating: p.rating === n ? 0 : n }))} hitSlop={6}>
                    <Ionicons name={n <= reviewForm.rating ? "star" : "star-outline"} size={26} color="#F5A623" />
                  </Pressable>
                ))}
              </View>
              <Input
                label={t("course.comment_placeholder", "Your review")}
                value={reviewForm.comment}
                onChangeText={(comment) => setReviewForm((p) => ({ ...p, comment }))}
                multiline
                numberOfLines={3}
                error={null}
              />
              <Button title={reviewLoading ? t("common.sending", "Sending...") : t("course.submit_review", "Submit review")} onPress={submitReview} loading={reviewLoading} />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showCancelConfirm}
        title={t("student_requests.cancel_title", "Cancel request?")}
        message={t("course_enroll.cancel_request_message", "Your join request will be withdrawn.")}
        confirmLabel={t("common.cancel_request", "Cancel request")}
        loading={enrollLoading}
        tone="danger"
        onCancel={() => setShowCancelConfirm(false)}
        onConfirm={cancelEnroll}
      />
      <ConfirmDialog
        visible={showDeleteConfirm}
        title={t("course.delete_confirm_title", "Delete course?")}
        message={t("course.delete_confirm_message", "This action cannot be undone.")}
        confirmLabel={t("common.delete", "Delete")}
        loading={deleting}
        tone="danger"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={deleteCourse}
      />
    </Screen>
  );
}

function FactRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.factRow}>
      <Ionicons name={icon} size={16} color={theme.colors.textMuted} />
      <Text style={{ color: theme.colors.textTertiary, width: 80 }}>{label}</Text>
      <Text style={{ color: theme.colors.text, flex: 1 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", flex: 1 },
  body: { padding: spacing[4], gap: spacing[3] },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  title: { flex: 1, fontSize: 20, fontWeight: "700" },
  description: { fontSize: 14, lineHeight: 21 },
  facts: { gap: spacing[2], marginTop: spacing[1] },
  factRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tutorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: spacing[3],
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing[2],
  },
  ownerActions: { flexDirection: "row", gap: 12, marginTop: spacing[3] },
  studentActions: { gap: spacing[3], marginTop: spacing[3] },
  statusNote: { flexDirection: "row", alignItems: "center", gap: 8 },
  formTitle: { fontSize: 15, fontWeight: "600", marginTop: 4 },
  rowGap: { flexDirection: "row", gap: 10 },
  reviews: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[3] },
  reviewsTitle: { fontSize: 16, fontWeight: "600" },
  review: { padding: spacing[3], borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  starsRow: { flexDirection: "row", gap: 2, marginTop: 4 },
  reviewForm: { gap: spacing[2], marginTop: spacing[2] },
});