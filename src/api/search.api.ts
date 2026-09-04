import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import type { HttpResult } from "./client/responseParser";

const withQuery = (
  base: string,
  params: URLSearchParams | Record<string, unknown> | null | undefined
): string => {
  if (!params) return base;
  const query =
    params instanceof URLSearchParams
      ? params.toString()
      : new URLSearchParams(
          Object.entries(params as Record<string, unknown>)
            .filter(([, v]) => v !== undefined && v !== null && v !== "")
            .map(([k, v]) => [k, String(v)] as [string, string])
        ).toString();
  return query ? `${base}?${query}` : base;
};

/**
 * Smart course search (FTS ru/en, synonyms, ranking).
 * Contract: okututor-backend docs/SEARCH_API.md.
 * Search is public — no auth credentials are sent.
 */
export const searchApi = {
  courses: (
    params: URLSearchParams | Record<string, unknown>,
    signal: AbortSignal | null = null
  ): Promise<HttpResult<unknown>> =>
    apiClient.request("GET", withQuery(endpoints.search.courses, params), null, false, false, signal),

  coursesV2: (
    params: URLSearchParams | Record<string, unknown>,
    signal: AbortSignal | null = null
  ): Promise<HttpResult<unknown>> =>
    apiClient.request("GET", withQuery(endpoints.search.coursesV2, params), null, false, false, signal),

  suggestions: (q: string, signal: AbortSignal | null = null): Promise<HttpResult<unknown>> =>
    apiClient.request(
      "GET",
      withQuery(endpoints.search.suggestions, { q }),
      null,
      false,
      false,
      signal
    ),

  tutors: (
    params: URLSearchParams | Record<string, unknown>,
    signal: AbortSignal | null = null
  ): Promise<HttpResult<unknown>> =>
    apiClient.request("GET", withQuery(endpoints.search.tutors, params), null, false, false, signal),
};

// Re-export for test compatibility
export { withQuery };
