import { useState, useEffect, useCallback, useRef } from "react";
import { searchApi } from "../api/search.api";
import {
  CourseFilters,
  DEFAULT_FILTERS,
  filtersToParams,
} from "../constants/search";

const pageSize = 20;

interface SearchSuggestions {
  courses: unknown[];
  tutors: unknown[];
}

/**
 * Port of the web `useCourseSearch` hook for mobile (no URL sync). Owns the
 * query + filters state, debounces input, and aborts outdated requests so a
 * slow earlier response can never overwrite a newer one.
 */
export function useCourseSearch() {
  const [courses, setCourses] = useState<unknown[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [filters, setFilters] = useState<CourseFilters>({ ...DEFAULT_FILTERS });
  const [searchTrigger, setSearchTrigger] = useState(0);

  const [suggestions, setSuggestions] = useState<SearchSuggestions>({ courses: [], tutors: [] });
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsAbortRef = useRef<AbortController | null>(null);
  const suggestionsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchQueryRef = useRef(searchQuery);
  const filtersRef = useRef(filters);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchCourses = useCallback(async (currentFilters: CourseFilters, pageNum = 0) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    try {
      const params = filtersToParams(currentFilters);
      const q = searchQueryRef.current.trim();
      if (q) params.set("q", q);
      params.set("page", String(pageNum));
      params.set("size", String(pageSize));

      const { response, data } = await searchApi.courses(params, controller.signal);
      if (controller.signal.aborted) return;

      if (response.ok) {
        if (Array.isArray(data)) {
          setCourses(data);
          setTotalResults(data.length);
          setTotalPages(data.length < pageSize ? pageNum + 1 : pageNum + 2);
        } else if (data && Array.isArray((data as { content?: unknown[] }).content)) {
          const d = data as { content: unknown[]; total_elements?: number; total_pages?: number };
          setCourses(d.content);
          setTotalResults(d.total_elements ?? d.content.length);
          setTotalPages(d.total_pages ?? 0);
        } else {
          setCourses([]);
          setTotalResults(0);
          setTotalPages(0);
        }
      } else {
        const d = data as { message?: string; error?: string } | null;
        setError(d?.message || d?.error || "Failed to load courses");
        setCourses([]);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Failed to load courses");
      setCourses([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const fetchSuggestions = useCallback(async (rawQuery: string) => {
    const query = rawQuery.trim();
    if (query.length < 2) {
      setSuggestions({ courses: [], tutors: [] });
      setSuggestionsOpen(false);
      return;
    }
    suggestionsAbortRef.current?.abort();
    const controller = new AbortController();
    suggestionsAbortRef.current = controller;
    try {
      const { response, data } = await searchApi.suggestions(query, controller.signal);
      if (controller.signal.aborted) return;
      if (response.ok && data) {
        const d = data as { courses?: unknown[]; tutors?: unknown[] };
        setSuggestions({ courses: d.courses || [], tutors: d.tutors || [] });
        setSuggestionsOpen(true);
      }
    } catch {
      if (!controller.signal.aborted) setSuggestions({ courses: [], tutors: [] });
    }
  }, []);

  const closeSuggestions = useCallback(() => {
    if (suggestionsDebounceRef.current) clearTimeout(suggestionsDebounceRef.current);
    setSuggestionsOpen(false);
  }, []);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    const timer = setTimeout(() => fetchCourses(filters, filters.page), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.subject,
    filters.min_price,
    filters.max_price,
    filters.rating,
    filters.sort,
    filters.page,
    filtersKey,
    searchTrigger,
  ]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      suggestionsAbortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (suggestionsDebounceRef.current) clearTimeout(suggestionsDebounceRef.current);
    };
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSearchTrigger((n) => n + 1);
        setFilters((prev) => ({ ...prev, page: 0 }));
      }, 600);
      if (suggestionsDebounceRef.current) clearTimeout(suggestionsDebounceRef.current);
      suggestionsDebounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
    },
    [fetchSuggestions]
  );

  const handleSearchSubmit = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    closeSuggestions();
    setSearchTrigger((n) => n + 1);
    setFilters((prev) => ({ ...prev, page: 0 }));
  }, [closeSuggestions]);

  const applyFilters = useCallback((updater: (prev: CourseFilters) => CourseFilters) => {
    setFilters((prev) => updater(prev));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTrigger((n) => n + 1);
    setFilters({ ...DEFAULT_FILTERS, page: 0 });
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  return {
    courses,
    searchQuery,
    error,
    loading,
    totalPages,
    totalResults,
    filters,
    suggestions,
    suggestionsOpen,
    handlers: {
      handleSearchChange,
      handleSearchSubmit,
      applyFilters,
      handlePageChange,
      resetFilters,
      closeSuggestions,
    },
  };
}