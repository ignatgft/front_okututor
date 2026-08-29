import { COURSE_SUBJECTS } from "./course";

export const SEARCH_SUBJECTS = COURSE_SUBJECTS;

// Kept for the UI select; the search backend does its own ranking and does not
// accept a sort param, so the selection is intentionally not sent to the API.
export const SEARCH_SORT_OPTIONS = ["recommended", "rating", "price_asc", "price_desc", "experience", "newest"];

export const SEARCH_LIST_FIELDS = ["location_type", "group_size", "days"];
export const SEARCH_SCALAR_FIELDS = ["subject", "min_price", "max_price", "rating", "sort", "page"];

const firstValue = (value) => (Array.isArray(value) ? value[0] : value);

/**
 * Maps UI filters to query params of GET /api/v1/search/courses
 * (okututor-backend docs/SEARCH_API.md):
 * - min_price -> price_min, max_price -> max_price, rating -> rating_min
 * - location_type / group_size are single-value hard filters on the backend,
 *   so only the first selected option is sent
 * - days and sort are not supported by the search backend and stay UI-only
 */
export function filtersToParams(filters) {
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
  if (filters.rating > 0) params.set("rating_min", String(filters.rating));
  return params;
}
