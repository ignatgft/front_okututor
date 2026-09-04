import { buildApiUrl, REQUEST_TIMEOUT_MS } from "../config";
import { clearTokens, getRefreshToken, isCookieRefreshEnabled } from "../token";
import { buildAuthHeaders } from "./authInterceptor";
import {
  isRefreshInProgress,
  refreshAccessToken,
  waitForRefresh,
} from "./refreshManager";
import { parseBody, type HttpResult } from "./responseParser";
import { ApiRequestError, normalizeApiError } from "./errorMapper";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(error: unknown): string | undefined {
  if (isRecord(error) && typeof error["message"] === "string") return error["message"] as string;
  if (error instanceof Error) return error.message;
  return undefined;
}

function hasName(value: unknown): value is { name: string } {
  return isRecord(value) && typeof (value as Record<string, unknown>).name === "string";
}

const redirectToLogin = (): void => {
  try {
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("auth:logout", { detail: { reason: "session_expired" } }));
    }
  } catch {
    // ignore
  }
};

/**
 * Creates a timeout signal compatible with older browsers (Safari ≤ 16)
 * Returns { signal, cancel } so caller can clearTimeout after fetch.
 */
const createTimeoutSignal = (ms: number): { signal: AbortSignal; cancel: () => void } => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    try {
      controller.abort(new DOMException(`Timeout after ${ms}ms`, "TimeoutError"));
    } catch {
      controller.abort();
    }
  }, ms);
  return {
    signal: controller.signal,
    cancel: (): void => clearTimeout(timeoutId),
  };
};

/**
 * Creates a combined signal from multiple signals (polyfill for AbortSignal.any)
 * Handles already-aborted inputs synchronously.
 */
const createAnySignal = (...signals: (AbortSignal | null | undefined)[]): AbortSignal => {
  const controller = new AbortController();
  const abort = (reason: unknown): void => {
    if (!controller.signal.aborted) {
      try {
        // `AbortController.abort(reason)` is supported in modern browsers
        (controller as unknown as { abort: (r?: unknown) => void }).abort(reason);
      } catch {
        controller.abort();
      }
    }
  };
  for (const signal of signals) {
    if (!signal) continue;
    if (signal.aborted) {
      abort((signal as unknown as { reason?: unknown }).reason);
      break;
    }
    if (typeof signal.addEventListener === "function") {
      signal.addEventListener("abort", () => abort((signal as unknown as { reason?: unknown }).reason), {
        once: true,
      });
    }
  }
  return controller.signal;
};

/**
 * Transport + 401 orchestration. Returns `{ response, data }` for every HTTP
 * outcome (including non-2xx). Throws ApiRequestError only on network-level
 * failures (offline / timeout / aborted).
 */
export async function sendRequest<T = unknown>(
  method: string,
  path: string,
  body: unknown = null,
  auth = true,
  _retry = false,
  signal: AbortSignal | null = null
): Promise<HttpResult<T>> {
  const { signal: timeoutSignal, cancel: cancelTimeout } = createTimeoutSignal(REQUEST_TIMEOUT_MS);
  const combinedSignal: AbortSignal = signal ? createAnySignal(timeoutSignal, signal) : timeoutSignal;

  const options: RequestInit = {
    method,
    headers: buildAuthHeaders(auth, body),
    signal: combinedSignal,
    // Required for HttpOnly cookie refresh flow (when isCookieRefreshEnabled)
    credentials: isCookieRefreshEnabled() ? "include" : "same-origin",
  };

  if (body !== null && body !== undefined) {
    options.body = body instanceof FormData ? (body as BodyInit) : JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(buildApiUrl(path), options);
  } catch (cause: unknown) {
    const normalizedCause: { name?: string } | undefined = hasName(cause)
      ? { name: (cause as { name: string }).name }
      : undefined;
    // Also preserve cause as unknown for errorMapper (it guards)
    throw new ApiRequestError(normalizeApiError({ cause: normalizedCause ?? cause }));
  } finally {
    cancelTimeout();
  }

  const canRefresh = auth && !_retry && (getRefreshToken() !== null || isCookieRefreshEnabled());
  if (response.status === 401 && canRefresh) {
    try {
      if (!isRefreshInProgress()) {
        await refreshAccessToken();
      } else {
        await waitForRefresh();
      }
      return sendRequest<T>(method, path, body, auth, true, signal);
    } catch (refreshError: unknown) {
      clearTokens();
      redirectToLogin();
      // Normalize to ApiRequestError so caller can handle as auth failure, not as 401 success
      throw new ApiRequestError(
        normalizeApiError({
          status: 401,
          data: null,
          message: getErrorMessage(refreshError) ?? "Session expired",
          cause: refreshError,
        })
      );
    }
  }

  return parseBody<T>(response);
}
