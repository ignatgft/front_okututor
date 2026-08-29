import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../src/components/ui/Screen";
import { ScreenHeader } from "../src/components/features/ScreenHeader";
import { Button, Input, Select, Badge, EmptyState, SkeletonList } from "../src/components/ui";
import { supportApi } from "../src/api/support.api";
import { SupportTicket } from "../src/types/support";
import { TICKET_PRIORITY, CATEGORY_I18N, STATUS_I18N, PRIORITY_I18N } from "../src/constants/support";
import { useTheme } from "../src/theme/ThemeProvider";
import { spacing } from "../src/theme/spacing";
import { useToast } from "../src/components/ui/Toast";
import { formatDateTime } from "../src/utils/date";

const CATEGORIES = Object.keys(CATEGORY_I18N).map((value) => ({
  value,
  label: CATEGORY_I18N[value],
}));

const PRIORITIES = Object.values(TICKET_PRIORITY).map((p) => ({ value: p, label: PRIORITY_I18N[p] }));
const STATUS_TONES: Record<string, "neutral" | "success" | "danger" | "warning"> = {
  OPEN: "warning",
  IN_PROGRESS: "warning",
  WAITING_FOR_USER: "warning",
  WAITING_FOR_SUPPORT: "warning",
  RESOLVED: "success",
  CLOSED: "success",
};

export default function SupportScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // create form
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ category?: string; subject?: string; description?: string }>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await supportApi.getTickets();
      if (response.ok) {
        setTickets(Array.isArray(data) ? data : []);
      } else {
        setError((data as { error?: string })?.error || t("common.error", "Error"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
     
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const validateForm = (): boolean => {
    const e: { category?: string; subject?: string; description?: string } = {};
    if (!category) e.category = t("support.error_category_required", "Category is required");
    if (!subject.trim()) e.subject = t("support.error_subject_required", "Subject is required");
    else if (subject.length > 120) e.subject = t("support.error_subject_max", "Subject must be 120 characters or less");
    if (!description.trim()) e.description = t("support.error_description_required", "Description is required");
    else if (description.length < 10) e.description = t("support.error_description_min", "Description must be at least 10 characters");
    else if (description.length > 2000) e.description = t("support.error_description_max", "Description must be 2000 characters or less");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const createTicket = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const { response, data } = await supportApi.createTicket({
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority,
      });
      if (response.ok && (data as { id?: string | number })?.id) {
        showToast(t("support.ticket_created", "Ticket created"), "success");
        router.push(`/chat/support-${(data as { id: string | number }).id}`);
      } else {
        showToast(t("support.create_failed", "Failed to create ticket"), "error");
      }
    } catch {
      showToast(t("support.create_failed", "Failed to create ticket"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll onRefresh={load} refreshing={loading && tickets.length === 0}>
      <ScreenHeader
        title={t("support.my_tickets", "My Tickets")}
        right={
          <Button
            title={showForm ? t("support.my_tickets", "My Tickets") : t("support.new_ticket", "New ticket")}
            variant={showForm ? "ghost" : "outline"}
            onPress={() => setShowForm((v) => !v)}
          />
        }
      />

      {showForm ? (
        <View style={styles.form}>
          <Select
            label={t("support.category", "Category")}
            options={CATEGORIES.map((c) => ({ value: c.value, label: t(c.label, c.value) }))}
            value={category || null}
            onChange={setCategory}
            placeholder={t("support.select_category", "Select category...")}
            error={errors.category || null}
          />
          <Input
            label={t("support.subject", "Subject")}
            value={subject}
            onChangeText={setSubject}
            maxLength={120}
            placeholder={t("support.subject_placeholder", "Brief description of your issue")}
            error={errors.subject || null}
          />
          <Select
            label={t("support.priority", "Priority")}
            options={PRIORITIES.map((p) => ({ value: p.value, label: t(p.label, p.value) }))}
            value={priority}
            onChange={setPriority}
          />
          <Input
            label={t("support.description", "Description")}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            maxLength={2000}
            placeholder={t("support.description_placeholder", "Describe your issue in detail...")}
            error={errors.description || null}
          />
          <View style={styles.formActions}>
            <Button title={t("common.cancel", "Cancel")} variant="ghost" onPress={() => setShowForm(false)} />
            <Button title={saving ? t("common.sending", "Sending...") : t("support.submit_ticket", "Submit ticket")} onPress={createTicket} loading={saving} />
          </View>
        </View>
      ) : (
        <>
          {loading && tickets.length === 0 ? <SkeletonList rows={4} /> : null}
          {error && tickets.length === 0 ? (
            <EmptyState title={error} onAction={load} />
          ) : tickets.length === 0 ? (
            <EmptyState
              icon="headset-outline"
              title={t("support.no_tickets", "No tickets yet")}
              hint={t("support.no_tickets_hint", "Create a ticket if you need help")}
            />
          ) : (
            tickets.map((ticket) => (
              <Pressable
                key={String(ticket.id)}
                onPress={() => router.push(`/chat/support-${ticket.id}`)}
                style={({ pressed }) => [
                  styles.ticket,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={styles.ticketBody}>
                  <Text style={{ color: theme.colors.text, fontWeight: "600", fontSize: 15 }} numberOfLines={1}>
                    {ticket.subject}
                  </Text>
                  <Text style={{ color: theme.colors.textTertiary, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
                    {ticket.last_message || t("support.no_messages", "No messages yet")}
                  </Text>
                  {ticket.created_at ? (
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 2 }}>
                      {formatDateTime(ticket.created_at)}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.ticketSide}>
                  <Badge
                    label={t(STATUS_I18N[ticket.status] || `support.status.${ticket.status}`.toLowerCase(), ticket.status)}
                    tone={STATUS_TONES[ticket.status] || "neutral"}
                  />
                  {ticket.unread_count ? (
                    <View style={[styles.unread, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.unreadText}>{ticket.unread_count}</Text>
                    </View>
                  ) : null}
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                </View>
              </Pressable>
            ))
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { paddingHorizontal: spacing[4], paddingTop: spacing[2] },
  formActions: { flexDirection: "row", gap: 10, marginTop: spacing[1] },
  ticket: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
    padding: spacing[3],
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ticketBody: { flex: 1 },
  ticketSide: { alignItems: "flex-end", gap: 6 },
  unread: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
});
