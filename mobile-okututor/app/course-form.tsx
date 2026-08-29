import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Screen } from "../src/components/ui/Screen";
import { ScreenHeader } from "../src/components/features/ScreenHeader";
import { Button, Input, Select, ConfirmDialog } from "../src/components/ui";
import { coursesApi } from "../src/api/courses.api";
import { Course, CoursePayload } from "../src/types/course";
import {
  COURSE_SUBJECTS,
  COURSE_CATEGORIES,
  COURSE_DAYS,
  LOCATION_TYPES,
  GROUP_SIZES,
  CURRENCIES,
  CourseOption,
} from "../src/constants/course";
import { useTheme } from "../src/theme/ThemeProvider";
import { spacing } from "../src/theme/spacing";
import { useToast } from "../src/components/ui/Toast";

const toOptions = (arr: CourseOption[], t: TFunction) =>
  arr.map((o) => ({ value: o.value, label: String(t(o.labelKey, o.value)) }));

type DraftForm = {
  title: string;
  description: string;
  subject: string;
  category: string;
  days: string;
  specific_days: string[];
  group_size: string;
  location_type: string;
  experience: string;
  price_per_hour: string;
  currency: string;
  max_students: string;
  status: string;
};

export default function CourseFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [form, setForm] = useState<DraftForm>({
    title: "",
    description: "",
    subject: "",
    category: "",
    days: "",
    specific_days: [],
    group_size: "",
    location_type: "",
    experience: "0",
    price_per_hour: "0",
    currency: "KGS",
    max_students: "2",
    status: "DRAFT",
  });
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmPublish, setConfirmPublish] = useState(false);

  const set = <K extends keyof DraftForm>(key: K, value: DraftForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { response, data } = await coursesApi.byId(id);
        if (response.ok) {
          const c = data as Course;
          setForm({
            title: c.title,
            description: c.description || "",
            subject: c.subject || "",
            category: c.category || "",
            days: String(c.days || ""),
            specific_days: String(c.days || "")
              .split(",")
              .map((d) => d.trim())
              .filter(Boolean),
            group_size: c.group_size || "",
            location_type: c.location_type || "",
            experience: String(c.experience ?? 0),
            price_per_hour: String(c.price_per_hour ?? 0),
            currency: c.currency || "KGS",
            max_students: String(c.max_students ?? 2),
            status: c.status || "DRAFT",
          });
        } else {
          setError((data as { error?: string })?.error || t("course.fetch_error", "Failed to load course"));
        }
      } catch {
        setError(t("course.fetch_error", "Failed to load course"));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const validate = (): string => {
    if (!form.title.trim()) return t("cr_course.errors.title_required", "Title is required");
    if (!form.subject) return t("become_tutor.error_subjects", "Select at least one subject");
    if (!form.description.trim()) return t("cr_course.errors.description_required", "Description is required");
    if (!form.group_size) return t("cr_course.placeholders.group", "Select format");
    if (!form.location_type) return t("cr_course.placeholders.location", "Select location type");
    if (Number(form.price_per_hour) < 0) return t("cr_course.errors.price", "Invalid price");
    if (form.group_size === "group" && Number(form.max_students) < 2)
      return t("cr_course.max_students_min", "Max students must be at least 2 for group courses");
    if (form.days === "specific" && form.specific_days.length === 0)
      return t("cr_course.placeholders.days", "Select schedule");
    if (!form.days) return t("cr_course.placeholders.days", "Select schedule");
    return "";
  };

  const buildPayload = (status: string): CoursePayload => ({
    title: form.title.trim(),
    description: form.description,
    subject: form.subject,
    category: form.category || "",
    days: form.days,
    specific_days: form.days === "specific" ? form.specific_days.join(",") : null,
    group_size: form.group_size,
    location_type: form.location_type,
    experience: form.experience || "",
    price_per_hour: Number(form.price_per_hour) || 0,
    currency: form.currency,
    max_students: form.group_size === "group" ? Number(form.max_students) : 1,
    status,
  });

  const save = async (status: string) => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      showToast(validationError, "error");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = buildPayload(status);
      let courseId = id;
      if (isEdit && id) {
        const { response, data } = await coursesApi.update(id, payload);
        if (!response.ok) throw new Error((data as { error?: string; message?: string })?.error || (data as { message?: string })?.message || t("common.error", "Error"));
        showToast(t("cr_course.update_success", "Course updated!"), "success");
      } else {
        const { response, data } = await coursesApi.create(payload);
        if (!response.ok) throw new Error((data as { error?: string; message?: string })?.error || (data as { message?: string })?.message || t("common.error", "Error"));
        courseId = String((data as { id?: string | number }).id);
        showToast(t("cw.submitted", "Course submitted for review"), "success");
      }
      if (courseId) router.replace(`/course/${courseId}`);
      else router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
      setConfirmPublish(false);
    }
  };

  const toggleSpecificDay = (day: string) =>
    set(
      "specific_days",
      form.specific_days.includes(day)
        ? form.specific_days.filter((d) => d !== day)
        : [...form.specific_days, day]
    );

  if (loading) {
    return (
      <Screen>
        <ScreenHeader title={isEdit ? t("cr_course.edit_title", "Edit course") : t("cr_course.page_title", "Create course")} back />
        <View style={styles.center}><Text style={{ color: theme.colors.textMuted }}>{t("common.loading", "Loading...")}</Text></View>
      </Screen>
    );
  }

  return (
    <Screen keyboard>
      <ScreenHeader title={isEdit ? t("cr_course.edit_title", "Edit course") : t("cr_course.page_title", "Create course")} back />
      <View style={styles.body}>
        <Input
          label={t("cr_course.name", "Course title")}
          value={form.title}
          onChangeText={(v) => set("title", v)}
          placeholder={t("cr_course.placeholders.name", "e.g. English for beginners")}
          error={null}
        />
        <Input
          label={t("cr_course.experience_label", "Years of experience")}
          value={form.experience}
          onChangeText={(v) => set("experience", v.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          error={null}
        />
        <Select
          label={t("cr_course.subject", "Subject")}
          options={toOptions(COURSE_SUBJECTS, t)}
          value={form.subject || null}
          onChange={(v) => set("subject", v)}
          placeholder={t("cr_course.placeholders.subject", "Select subject")}
        />
        <Select
          label={t("cr_course.category", "Category")}
          options={toOptions(COURSE_CATEGORIES, t)}
          value={form.category || null}
          onChange={(v) => set("category", v)}
          placeholder={t("cr_course.placeholders.category", "Select category")}
        />
        <Input
          label={t("cr_course.description_label", "Description")}
          value={form.description}
          onChangeText={(v) => set("description", v)}
          placeholder={t("cr_course.placeholders.description", "Describe the course...")}
          multiline
          numberOfLines={4}
          error={null}
        />
        <Select
          label={t("cr_course.group_label", "Group size")}
          options={toOptions(GROUP_SIZES, t)}
          value={form.group_size || null}
          onChange={(v) => set("group_size", v)}
          placeholder={t("cr_course.placeholders.group", "Select format")}
        />
        {form.group_size === "group" ? (
          <Input
            label={t("cr_course.max_students", "Max students")}
            value={form.max_students}
            onChangeText={(v) => set("max_students", v.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            error={null}
          />
        ) : null}
        <Select
          label={t("cr_course.location_label", "Location type")}
          options={toOptions(LOCATION_TYPES, t)}
          value={form.location_type || null}
          onChange={(v) => set("location_type", v)}
          placeholder={t("cr_course.placeholders.location", "Select location type")}
        />
        <View style={styles.priceRow}>
          <View style={{ flex: 1 }}>
            <Input
              label={t("cr_course.price_label", "Price per hour")}
              value={form.price_per_hour}
              onChangeText={(v) => set("price_per_hour", v.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
              error={null}
            />
          </View>
          <View style={styles.currencyWrap}>
            <Select
              label={t("cr_course.currency", "Currency")}
              options={toOptions(CURRENCIES, t)}
              value={form.currency}
              onChange={(v) => set("currency", v)}
            />
          </View>
        </View>
        <Select
          label={t("cr_course.days_label", "Days")}
          options={[
            { value: "weekdays", label: t("cr_course.days.weekdays", "Weekdays") },
            { value: "weekends", label: t("cr_course.days.weekends", "Weekends") },
            { value: "specific", label: t("cr_course.days.specific", "Specific days") },
          ]}
          value={form.days || null}
          onChange={(v) => set("days", v === "specific" ? v : v)}
          placeholder={t("cr_course.placeholders.days", "Select schedule")}
        />
        {form.days === "specific" ? (
          <View style={styles.dayRow}>
            {COURSE_DAYS.map((d) => {
              const active = form.specific_days.includes(d.value);
              return (
                <Pressable
                  key={d.value}
                  onPress={() => toggleSpecificDay(d.value)}
                  style={[
                    styles.dayChip,
                    { backgroundColor: active ? theme.colors.primary : theme.colors.surface, borderColor: theme.colors.border },
                    active && { borderColor: theme.colors.primary },
                  ]}
                >
                  <Text style={{ color: active ? theme.colors.primaryForeground : theme.colors.text, fontSize: 12 }}>
                    {t(d.labelKey, d.value)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {error ? <Text style={{ color: theme.colors.danger, fontSize: 13 }}>{error}</Text> : null}
        {!isEdit ? (
          <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>
            {t("cw.moderation_hint", "Submitted courses are reviewed by our team before publishing.")}
          </Text>
        ) : null}

        <View style={styles.actions}>
          {!isEdit ? (
            <Button title={t("cw.save_draft", "Save as draft")} variant="outline" onPress={() => save("DRAFT")} loading={saving} />
          ) : null}
          <Button
            title={isEdit ? t("cr_course.save", "Save changes") : t("cw.submit_review", "Submit for review")}
            onPress={() => (isEdit ? save(form.status) : setConfirmPublish(true))}
            loading={saving}
          />
        </View>
      </View>

      <ConfirmDialog
        visible={confirmPublish}
        title={t("cw.submit_title", "Submit for review?")}
        message={t("cw.submit_message", "Your course will be reviewed by our team. You'll be notified once it is approved.")}
        confirmLabel={t("cw.submit_review", "Submit for review")}
        loading={saving}
        onCancel={() => setConfirmPublish(false)}
        onConfirm={() => save("PENDING")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", flex: 1 },
  body: { padding: spacing[4] },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  currencyWrap: { flex: 1 },
  dayRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing[4] },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: { gap: spacing[2], marginTop: spacing[2] },
});
