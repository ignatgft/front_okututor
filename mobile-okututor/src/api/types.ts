import { HttpResult } from "./client/httpClient";

/** The `{ response, data }` tuple returned by every HTTP call. */
export type ApiResult<D = unknown> = Promise<HttpResult<D>>;

export function ok<D = unknown>(r: HttpResult<D>): r is HttpResult<D> & { data: D } {
  return r.response.ok;
}

export function apiErrorMessage<D = unknown>(r: HttpResult<D>, fallback: string): string {
  const d = r.data as { message?: unknown; error?: unknown } | null;
  if (d?.message && typeof d.message === "string") return d.message;
  if (d?.error && typeof d.error === "string") return d.error;
  return fallback;
}