import { endpoints } from "./endpoints";
import { apiClient } from "./http";

const withQuery = (base, params) => {
  if (!params) return base;
  const query =
    params instanceof URLSearchParams ? params.toString() : new URLSearchParams(params).toString();
  return query ? `${base}?${query}` : base;
};

/**
 * Smart course search (FTS ru/en, synonyms, ranking).
 * Contract: okututor-backend docs/SEARCH_API.md.
 * Search is public — no auth credentials are sent.
 */
export const searchApi = {
  courses: (params, signal = null) =>
    apiClient.request("GET", withQuery(endpoints.search.courses, params), null, false, false, signal),
  coursesV2: (params, signal = null) =>
    apiClient.request("GET", withQuery(endpoints.search.coursesV2, params), null, false, false, signal),
  suggestions: (q, signal = null) =>
    apiClient.request(
      "GET",
      withQuery(endpoints.search.suggestions, { q }),
      null,
      false,
      false,
      signal
    ),
  tutors: (params, signal = null) =>
    apiClient.request("GET", withQuery(endpoints.search.tutors, params), null, false, false, signal),
};
