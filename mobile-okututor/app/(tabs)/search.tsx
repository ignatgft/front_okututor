import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/ui/Screen";
import { SearchInput, Select } from "../../src/components/ui";
import { CourseCard } from "../../src/components/features/CourseCard";
import { useCourseSearch } from "../../src/hooks/useCourseSearch";
import { SEARCH_SUBJECTS, SEARCH_SORT_OPTIONS } from "../../src/constants/search";
import { useTheme } from "../../src/theme/ThemeProvider";
import { spacing } from "../../src/theme/spacing";

export default function SearchScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const {
    courses,
    searchQuery,
    error,
    loading,
    totalPages,
    filters,
    suggestions,
    suggestionsOpen,
    handlers,
  } = useCourseSearch();
  const [sort, setSort] = useState("recommended");

  const results = courses as {
    id: string | number;
    title: string;
    subject?: string | null;
    price_per_hour?: number | null;
    currency?: string | null;
    rating?: number | null;
    review_count?: number | null;
    teacher_name?: string;
    status?: string;
  }[];

  const suggestionItems = [
    ...(suggestions.courses || []).map((c) => ({
      type: "course",
      id: (c as { id: string | number }).id,
      title: (c as { title?: string }).title,
      meta: (c as { subject?: string }).subject,
    })),
    ...(suggestions.tutors || []).map((tutor) => ({
      type: "tutor",
      id: (tutor as { id: string | number }).id,
      title: (tutor as { full_name?: string }).full_name,
      meta: "",
    })),
  ].filter((i) => i.title);

  const selectSuggestion = (item: { type: string; id: string | number }) => {
    handlers.closeSuggestions();
    if (item.type === "tutor") router.push(`/tutor/${item.id}`);
    else router.push(`/course/${item.id}`);
  };

  const renderSuggestions = () =>
    suggestionsOpen && suggestionItems.length > 0 ? (
      <View style={[styles.suggestions, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {suggestionItems.map((item, index) => (
          <Pressable
            key={`${item.type}-${item.id}`}
            onPress={() => selectSuggestion(item)}
            style={({ pressed }) => [styles.suggestion, pressed && { backgroundColor: theme.colors.surfaceHover }]}
          >
            <Text style={{ color: theme.colors.text }}>{item.title}</Text>
            {item.meta ? (
              <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>{item.meta}</Text>
            ) : null}
          </Pressable>
        ))}
      </View>
    ) : null;

  return (
    <Screen>
      <View style={styles.container}>
        <View style={[styles.searchWrap, { paddingTop: 8 }]}>
          <SearchInput
            value={searchQuery}
            onChangeText={handlers.handleSearchChange}
            onSubmit={handlers.handleSearchSubmit}
            onClear={() => handlers.handleSearchChange("")}
            loading={loading}
            placeholder={t("search.placeholder", "Search courses…")}
          />
          {renderSuggestions()}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          keyboardShouldPersistTaps="handled"
        >
          {SEARCH_SUBJECTS.slice(0, 8).map((subject) => {
            const active = filters.subject === subject.value;
            return (
              <Pressable
                key={subject.value}
                onPress={() =>
                  handlers.applyFilters((prev) => ({
                    ...prev,
                    page: 0,
                    subject: prev.subject === subject.value ? "" : subject.value,
                  }))
                }
                style={[
                  styles.chip,
                  { backgroundColor: active ? theme.colors.primary : theme.colors.surface },
                  { borderColor: active ? theme.colors.primary : theme.colors.border },
                ]}
              >
                <Text style={{ color: active ? theme.colors.primaryForeground : theme.colors.textSecondary, fontSize: 13 }}>
                  {t(subject.labelKey, subject.value)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sortRow}>
          <Select
            options={SEARCH_SORT_OPTIONS.map((s) => ({ value: s, label: t(`search.sort.${s}`, s) }))}
            value={sort}
            onChange={(v) => {
              setSort(v);
              handlers.applyFilters((prev) => ({ ...prev, page: 0, sort: v }));
            }}
            placeholder={t("search.sort", "Sort")}
          />
        </View>

        <ScrollView
          style={styles.results}
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {error ? (
            <View style={styles.stateBox}>
              <Text style={{ color: theme.colors.danger }}>{error}</Text>
            </View>
          ) : loading && results.length === 0 ? (
            <Text style={{ color: theme.colors.textMuted, textAlign: "center", marginTop: 24 }}>
              {t("common.loading", "Loading...")}
            </Text>
          ) : results.length === 0 ? (
            <View style={styles.stateBox}>
              <Text style={{ color: theme.colors.textMuted, textAlign: "center" }}>
                {t("search.no_results", "No courses found. Try different filters.")}
              </Text>
              <Pressable onPress={handlers.resetFilters} style={{ marginTop: 12 }}>
                <Text style={{ color: theme.colors.primary, textAlign: "center", fontWeight: "600" }}>
                  {t("search.reset_all", "Reset all")}
                </Text>
              </Pressable>
            </View>
          ) : (
            results.map((course) => (
              <CourseCard
                key={String(course.id)}
                course={course}
                onPress={() => router.push(`/course/${course.id}`)}
              />
            ))
          )}
          {!loading && results.length > 0 && filters.page + 1 < totalPages ? (
            <Pressable onPress={() => handlers.handlePageChange(filters.page + 1)} style={styles.loadMore}>
              <Text style={{ color: theme.colors.primary, fontWeight: "600" }}>
                {t("search.load_more", "Load more")}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing[4] },
  searchWrap: { position: "relative", zIndex: 10 },
  suggestions: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  suggestion: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chips: { gap: 8, paddingVertical: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  sortRow: { marginBottom: 4, maxWidth: 220 },
  results: { flex: 1 },
  stateBox: { paddingVertical: 32, paddingHorizontal: 16 },
  loadMore: { paddingVertical: 16, alignItems: "center" },
});