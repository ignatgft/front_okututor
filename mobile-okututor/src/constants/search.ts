import { COURSE_SUBJECTS , CourseOption } from "./course";

export const SEARCH_SUBJECTS: readonly CourseOption[] = COURSE_SUBJECTS;

// Kept for the UI select; the search backend does its own ranking and does not
// accept a sort param, so the selection is intentionally not sent to the API.
export const SEARCH_SORT_OPTIONS: readonly string[] = [
  "recommended",
  "rating",
  "price_asc",
  "price_desc",
  "experience",
  "newest",
];

export const SEARCH_LIST_FIELDS: readonly string[] = ["location_type", "group_size", "days"];
export const SEARCH_SCALAR_FIELDS: readonly string[] = ["subject", "min_price", "max_price", "rating", "sort", "page"];

export interface CourseFilters {
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

export const DEFAULT_FILTERS: CourseFilters = {
  subject: "",
  location_type: [],
  group_size: [],
  days: [],
  min_price: "",
  max_price: "",
  rating: 0,
  sort: "recommended",
  page: 0,
};

const firstValue = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/**
 * Maps UI filters to query params of GET /api/v1/search/courses
 * (okututor-backend docs/SEARCH_API.md):
 * - min_price -> price_min, max_price -> max_price, rating -> rating_min
 * - location_type / group_size are single-value hard filters on the backend,
 *   so only the first selected option is sent
 * - days and sort are not supported by the search backend and stay UI-only
 */
export function filtersToParams(filters: Partial<CourseFilters>): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.subject) params.set("subject", filters.subject);
  const locationType = firstValue(filters.location_type);
  if (locationType) params.set("location_type", locationType);
  const groupSize = firstValue(filters.group_size);
  if (groupSize) params.set("group_size", groupSize);
  if (filters.min_price !== "" && filters.min_price != null) {
    params.set("price_min", String(filters.min_price));
  }
  if (filters.max_price !== "" && filters.max_price != null) {
    params.set("max_price", String(filters.max_price));
  }
  if (filters.rating && filters.rating > 0) params.set("rating_min", String(filters.rating));
  return params;
}