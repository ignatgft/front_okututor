import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { searchApi } from "../api/search.api";
import {
  SEARCH_LIST_FIELDS,
  SEARCH_SCALAR_FIELDS,
  filtersToParams,
} from "../constants/search";

/**
 * Owns the search page state: query + filters + results, URL sync and
 * request lifecycle. Outdated requests are aborted so a slow earlier
 * response can never overwrite a newer one.
 *
 * Results come from the smart search endpoint GET /api/v1/search/courses
 * (FTS ru/en, synonyms, ranking — see okututor-backend docs/SEARCH_API.md),
 * which responds with a snake_case PageResponse:
 * { content, page, size, total_elements, total_pages, first, last }.
 */
export function useCourseSearch(pageSize = 20) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(location.search);

  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState(urlParams.get("q") || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  const [filters, setFilters] = useState(() => ({
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

  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;
  const [searchTrigger, setSearchTrigger] = useState(0);

  const [suggestions, setSuggestions] = useState({ courses: [], tutors: [] });
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const suggestionsAbortRef = useRef(null);
  const suggestionsDebounceRef = useRef(null);

  const fetchSuggestions = useCallback(async (rawQuery) => {
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
      if (response.ok && data) {
        setSuggestions({ courses: data.courses || [], tutors: data.tutors || [] });
        setSuggestionsOpen(true);
      }
    } catch {
      if (!controller.signal.aborted) setSuggestions({ courses: [], tutors: [] });
    }
  }, []);

  const closeSuggestions = useCallback(() => {
    clearTimeout(suggestionsDebounceRef.current);
    setSuggestionsOpen(false);
  }, []);

  const fetchCourses = useCallback(
    async (currentFilters, pageNum = 0) => {
      if (abortRef.current) abortRef.current.abort();
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
          } else if (data && Array.isArray(data.content)) {
            setCourses(data.content);
            setTotalResults(data.total_elements ?? data.totalElements ?? data.content.length);
            setTotalPages(data.total_pages ?? data.totalPages ?? 0);
          } else {
            setCourses([]);
            setTotalResults(0);
            setTotalPages(0);
          }
        } else {
          setError((data && (data.message || data.error)) || t("search.error_loading_courses", "Failed to load courses"));
          setCourses([]);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(`${t("search.error_loading_courses", "Failed to load courses")}: ${err.message}`);
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
      clearTimeout(debounceRef.current);
      clearTimeout(suggestionsDebounceRef.current);
    };
  }, []);

  const syncUrl = useCallback(
    (nextFilters) => {
      const params = new URLSearchParams();
      const q = searchQueryRef.current.trim();
      if (q) params.set("q", q);
      Object.entries(nextFilters).forEach(([key, value]) => {
        if (SEARCH_LIST_FIELDS.includes(key)) {
          if (value.length) params.set(key, value.join(","));
        } else if (SEARCH_SCALAR_FIELDS.includes(key)) {
          if (key === "rating" && value > 0) params.set(key, String(value));
          else if (key === "sort" && value !== "recommended" && value) params.set(key, value);
          else if (["min_price", "max_price"].includes(key) && value) params.set(key, String(value));
          else if (key === "page" && value > 0) params.set(key, String(value));
        }
      });
      params.set("size", String(pageSize));
      navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: false });
    },
    [navigate, location.pathname, pageSize]
  );

  const applyFilters = useCallback(
    (updater) => {
      setFilters((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
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
    fetchCourses(filters, filters.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.subject, filters.min_price, filters.max_price, filters.rating, filters.sort,
    daysKey, groupSizeKey, locationTypeKey, filters.page,
    searchTrigger,
  ]);

  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchQuery(value);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSearchTrigger((n) => n + 1);
        applyFilters((prev) => ({ ...prev, page: 0 }));
      }, 600);
      clearTimeout(suggestionsDebounceRef.current);
      suggestionsDebounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
    },
    [applyFilters, fetchSuggestions]
  );

  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      clearTimeout(debounceRef.current);
      clearTimeout(suggestionsDebounceRef.current);
      setSuggestionsOpen(false);
      setSearchTrigger((n) => n + 1);
      applyFilters((prev) => ({ ...prev, page: 0 }));
    },
    [applyFilters]
  );

  const handleCheckboxChange = useCallback(
    (category, value) => {
      applyFilters((prev) => ({
        ...prev,
        page: 0,
        [category]: prev[category].includes(value)
          ? prev[category].filter((v) => v !== value)
          : [...prev[category], value],
      }));
    },
    [applyFilters]
  );

  const handlePageChange = useCallback(
    (newPage) => {
      applyFilters((prev) => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [applyFilters]
  );

  const handleRatingChange = useCallback(
    (value) => {
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
