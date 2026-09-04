import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { searchApi } from "../api/search.api";
import {
  SEARCH_LIST_FIELDS,
  SEARCH_SCALAR_FIELDS,
  filtersToParams,
} from "../constants/search";
import type { CourseDTO } from "../types/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (isRecord(err) && typeof err["message"] === "string") return err["message"] as string;
  return String(err);
}

export interface CourseSearchFilters {
  subject: string;
  location_type: string[];
  group_size: string[];
  days: string[];
  min_price: string;
  max_price: string;
  rating: number;
  sort: string;
  page: number;
}

export interface Suggestions {
  courses: CourseDTO[];
  tutors: unknown[];
}

export interface UseCourseSearchReturn {
  courses: CourseDTO[];
  searchQuery: string;
  error: string;
  loading: boolean;
  totalPages: number;
  totalResults: number;
  filters: CourseSearchFilters;
  suggestions: Suggestions;
  suggestionsOpen: boolean;
  handlers: {
    handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSearchSubmit: (e: React.FormEvent) => void;
    applyFilters: (updater: Partial<CourseSearchFilters> | ((prev: CourseSearchFilters) => Partial<CourseSearchFilters>)) => void;
    handleCheckboxChange: (category: string, value: string) => void;
    handlePageChange: (newPage: number) => void;
    handleRatingChange: (value: number) => void;
    closeSuggestions: () => void;
  };
}

export function useCourseSearch(pageSize = 20): UseCourseSearchReturn {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(location.search);

  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(urlParams.get("q") || "");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalResults, setTotalResults] = useState<number>(0);

  const [filters, setFilters] = useState<CourseSearchFilters>(() => ({
    subject: urlParams.get("subject") || "",
    location_type: (urlParams.get("location_type") || "").split(",").filter(Boolean),
    group_size: (urlParams.get("group_size") || "").split(",").filter(Boolean),
    days: (urlParams.get("days") || "").split(",").filter(Boolean),
    min_price: urlParams.get("min_price") || "",
    max_price: urlParams.get("max_price") || "",
    rating: Number(urlParams.get("rating")) || 0,
    sort: urlParams.get("sort") || "recommended",
    page: Number(urlParams.get("page")) || 0,
  }));

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);
  const searchQueryRef = useRef<string>(searchQuery);
  searchQueryRef.current = searchQuery;
  const [searchTrigger, setSearchTrigger] = useState<number>(0);

  const [suggestions, setSuggestions] = useState<Suggestions>({ courses: [], tutors: [] });
  const [suggestionsOpen, setSuggestionsOpen] = useState<boolean>(false);
  const suggestionsAbortRef = useRef<AbortController | null>(null);
  const suggestionsDebounceRef = useRef<number | null>(null);

  const fetchSuggestions = useCallback(async (rawQuery: string): Promise<void> => {
    const query = rawQuery.trim();
    if (query.length < 2) {
      setSuggestions({ courses: [], tutors: [] });
      setSuggestionsOpen(false);
      return;
    }
    if (suggestionsAbortRef.current) suggestionsAbortRef.current.abort();
    const controller = new AbortController();
    suggestionsAbortRef.current = controller;
    try {
      const { response, data } = await searchApi.suggestions(query, controller.signal);
      if (controller.signal.aborted) return;
      if (response.ok && data && isRecord(data)) {
        const coursesData = Array.isArray(data["courses"]) ? (data["courses"] as CourseDTO[]) : [];
        const tutorsData = Array.isArray(data["tutors"]) ? (data["tutors"] as unknown[]) : [];
        setSuggestions({ courses: coursesData, tutors: tutorsData });
        setSuggestionsOpen(true);
      }
    } catch {
      if (!controller.signal.aborted) setSuggestions({ courses: [], tutors: [] });
    }
  }, []);

  const closeSuggestions = useCallback((): void => {
    if (suggestionsDebounceRef.current !== null) window.clearTimeout(suggestionsDebounceRef.current);
    setSuggestionsOpen(false);
  }, []);

  const fetchCourses = useCallback(
    async (currentFilters: CourseSearchFilters, pageNum = 0): Promise<void> => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError("");
      try {
        const params = filtersToParams(currentFilters as unknown as Record<string, unknown>);
        const q = searchQueryRef.current.trim();
        if (q) params.set("q", q);
        params.set("page", String(pageNum));
        params.set("size", String(pageSize));

        const { response, data } = await searchApi.courses(params, controller.signal);
        if (controller.signal.aborted) return;

        if (response.ok) {
          if (Array.isArray(data)) {
            const arr = data as CourseDTO[];
            setCourses(arr);
            setTotalResults(arr.length);
            setTotalPages(arr.length < pageSize ? pageNum + 1 : pageNum + 2);
          } else if (data && isRecord(data) && Array.isArray(data["content"])) {
            const content = data["content"] as CourseDTO[];
            setCourses(content);
            const totalEl = (data["total_elements"] as number | undefined) ?? (data["totalElements"] as number | undefined) ?? content.length;
            const totalPg = (data["total_pages"] as number | undefined) ?? (data["totalPages"] as number | undefined) ?? 0;
            setTotalResults(totalEl);
            setTotalPages(totalPg);
          } else {
            setCourses([]);
            setTotalResults(0);
            setTotalPages(0);
          }
        } else {
          const rec = isRecord(data) ? (data as Record<string, unknown>) : null;
          const msg = rec ? ((rec["message"] as string | undefined) ?? (rec["error"] as string | undefined)) : undefined;
          setError(msg ?? t("search.error_loading_courses", "Failed to load courses"));
          setCourses([]);
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setError(`${t("search.error_loading_courses", "Failed to load courses")}: ${getErrorMessage(err)}`);
        setCourses([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [pageSize, t]
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      suggestionsAbortRef.current?.abort();
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
      if (suggestionsDebounceRef.current !== null) window.clearTimeout(suggestionsDebounceRef.current);
    };
  }, []);

  const syncUrl = useCallback(
    (nextFilters: CourseSearchFilters): void => {
      const params = new URLSearchParams();
      const q = searchQueryRef.current.trim();
      if (q) params.set("q", q);
      for (const [key, value] of Object.entries(nextFilters)) {
        if ((SEARCH_LIST_FIELDS as readonly string[]).includes(key)) {
          if (Array.isArray(value) && value.length) params.set(key, (value as string[]).join(","));
        } else if ((SEARCH_SCALAR_FIELDS as readonly string[]).includes(key)) {
          if (key === "rating" && typeof value === "number" && value > 0) params.set(key, String(value));
          else if (key === "sort" && typeof value === "string" && value !== "recommended" && value) params.set(key, value);
          else if (["min_price", "max_price"].includes(key) && typeof value === "string" && value) params.set(key, String(value));
          else if (key === "page" && typeof value === "number" && value > 0) params.set(key, String(value));
        }
      }
      params.set("size", String(pageSize));
      navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: false });
    },
    [navigate, location.pathname, pageSize]
  );

  const applyFilters = useCallback(
    (updater: Partial<CourseSearchFilters> | ((prev: CourseSearchFilters) => Partial<CourseSearchFilters>)): void => {
      setFilters((prev) => {
        const next = typeof updater === "function" ? (updater as (p: CourseSearchFilters) => Partial<CourseSearchFilters>)(prev) : updater;
        return { ...prev, ...next };
      });
    },
    []
  );

  useEffect(() => {
    syncUrl(filters);
  }, [filters, syncUrl]);

  const daysKey = JSON.stringify(filters.days);
  const groupSizeKey = JSON.stringify(filters.group_size);
  const locationTypeKey = JSON.stringify(filters.location_type);

  useEffect(() => {
    void fetchCourses(filters, filters.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.subject, filters.min_price, filters.max_price, filters.rating, filters.sort,
    daysKey, groupSizeKey, locationTypeKey, filters.page,
    searchTrigger,
  ]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const value = e.target.value;
      setSearchQuery(value);
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        setSearchTrigger((n) => n + 1);
        applyFilters((prev) => ({ ...prev, page: 0 }));
      }, 600);
      if (suggestionsDebounceRef.current !== null) window.clearTimeout(suggestionsDebounceRef.current);
      suggestionsDebounceRef.current = window.setTimeout(() => void fetchSuggestions(value), 250);
    },
    [applyFilters, fetchSuggestions]
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent): void => {
      e.preventDefault();
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
      if (suggestionsDebounceRef.current !== null) window.clearTimeout(suggestionsDebounceRef.current);
      setSuggestionsOpen(false);
      setSearchTrigger((n) => n + 1);
      applyFilters((prev) => ({ ...prev, page: 0 }));
    },
    [applyFilters]
  );

  const handleCheckboxChange = useCallback(
    (category: string, value: string): void => {
      applyFilters((prev) => {
        const list = prev[category as keyof CourseSearchFilters] as unknown as string[];
        const nextList = Array.isArray(list) && list.includes(value)
          ? list.filter((v) => v !== value)
          : [...(Array.isArray(list) ? list : []), value];
        return { ...prev, page: 0, [category]: nextList } as Partial<CourseSearchFilters>;
      });
    },
    [applyFilters]
  );

  const handlePageChange = useCallback(
    (newPage: number): void => {
      applyFilters((prev) => ({ ...prev, page: newPage }));
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* ignore */ }
    },
    [applyFilters]
  );

  const handleRatingChange = useCallback(
    (value: number): void => {
      applyFilters((prev) => ({ ...prev, page: 0, rating: prev.rating === value ? 0 : value }));
    },
    [applyFilters]
  );

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
      handleCheckboxChange,
      handlePageChange,
      handleRatingChange,
      closeSuggestions,
    },
  };
}
