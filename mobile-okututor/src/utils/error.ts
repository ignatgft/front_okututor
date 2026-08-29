import { API_ERROR_CODES } from "../api/client/errorMapper";

export type { ApiErrorShape, ApiRequestErrorLike } from "../api/client/errorMapper";

/**
 * Runtime-safe extraction of a user-facing error message from any thrown
 * value produced by the API layer. Never exposes raw stack traces.
 */
export function toErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (err instanceof Error) {
    const anyErr = err as { message?: string; code?: string; data?: unknown };
    if (anyErr.message) return anyErr.message;
  }
  const anyErr = err as { message?: string; data?: { message?: string; error?: string } };
  if (anyErr.data?.message) return anyErr.data.message;
  if (anyErr.data?.error) return anyErr.data.error;
  if (anyErr.message) return anyErr.message;
  return fallback;
}

/** Returns true when the error corresponds to a network-level failure. */
export function isNetworkError(err: unknown): boolean {
  const anyErr = err as { code?: string } | null;
  return !!anyErr && (anyErr.code === API_ERROR_CODES.NETWORK_ERROR || anyErr.code === API_ERROR_CODES.TIMEOUT);
}

/** Returns true when the failure can be retried safely. */
export function isRetryableError(err: unknown): boolean {
  const anyErr = err as { retryable?: boolean } | null;
  return !!anyErr?.retryable;
}