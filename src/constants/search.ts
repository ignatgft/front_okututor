import { COURSE_SUBJECTS } from "./course";

export const SEARCH_SUBJECTS = COURSE_SUBJECTS;

export type SearchSubject = (typeof SEARCH_SUBJECTS)[number];

// Kept for the UI select; the search backend does its own ranking and does not
// accept a sort param, so the selection is intentionally not sent to the API.
export const SEARCH_SORT_OPTIONS = [
  "recommended",
  "rating",
  "price_asc",
  "price_desc",
  "experience",
  "newest",
] as const;

export type SearchSortOption = (typeof SEARCH_SORT_OPTIONS)[number];

export const SEARCH_LIST_FIELDS = ["location_type", "group_size", "days"] as const;

export type SearchListField = (typeof SEARCH_LIST_FIELDS)[number];

export const SEARCH_SCALAR_FIELDS = ["subject", "min_price", "max_price", "rating", "sort", "page"] as const;

export type SearchScalarField = (typeof SEARCH_SCALAR_FIELDS)[number];

export interface SearchFilters {
  subject?: string;
  location_type?: string | readonly string[];
  group_size?: string | readonly string[];
  days?: readonly string[];
  min_price?: string | number | null;
  max_price?: string | number | null;
  rating?: number;
  sort?: string;
  page?: number | string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const firstValue = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return typeof value === "string" ? value : undefined;
};

/**
 * Maps UI filters to query params of GET /api/v1/search/courses
 * (okututor-backend docs/SEARCH_API.md):
 * - min_price -> price_min, max_price -> max_price, rating -> rating_min
 * - location_type / group_size are single-value hard filters on the backend,
 *   so only the first selected option is sent
 * - days and sort are not supported by the search backend and stay UI-only
 */
export function filtersToParams(filters: unknown): URLSearchParams {
  const params = new URLSearchParams();
  if (!isRecord(filters)) return params;

  const subject = filters["subject"];
  if (typeof subject === "string" && subject) {
    params.set("subject", subject);
  }

  const locationType = firstValue(filters["location_type"]);
  if (locationType) params.set("location_type", locationType);

  const groupSize = firstValue(filters["group_size"]);
  if (groupSize) params.set("group_size", groupSize);

  const minPrice = filters["min_price"];
  if (minPrice !== "" && minPrice !== null && minPrice !== undefined) {
    params.set("price_min", String(minPrice));
  }

  const maxPrice = filters["max_price"];
  if (maxPrice !== "" && maxPrice !== null && maxPrice !== undefined) {
    params.set("max_price", String(maxPrice));
  }

  const rating = filters["rating"];
  if (typeof rating === "number" && rating > 0) {
    params.set("rating_min", String(rating));
  }

  return params;
}
