import { buildApiUrl } from "../config";
import { clearTokens, getRefreshToken, isCookieRefreshEnabled } from "../token";
import { buildAuthHeaders } from "./authInterceptor";
import {
  isRefreshInProgress,
  refreshAccessToken,
  waitForRefresh,
} from "./refreshManager";
import { parseBody } from "./responseParser";
import { ApiRequestError, normalizeApiError } from "./errorMapper";

const REQUEST_TIMEOUT_MS = 30000;

const redirectToLogin = () => {
  window.dispatchEvent(new CustomEvent("auth:logout", { detail: { reason: "session_expired" } }));
};

/**
 * Creates a timeout signal compatible with older browsers (Safari ≤ 16)
 * Returns { signal, cancel } so caller can clearTimeout after fetch.
 */
const createTimeoutSignal = (ms) => {
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
    cancel: () => clearTimeout(timeoutId),
  };
};

/**
 * Creates a combined signal from multiple signals (polyfill for AbortSignal.any)
 * Handles already-aborted inputs synchronously.
 */
const createAnySignal = (...signals) => {
  const controller = new AbortController();
  const abort = (reason) => {
    if (!controller.signal.aborted) {
      try {
        controller.abort(reason);
      } catch {
        controller.abort();
      }
    }
  };
  for (const signal of signals) {
    if (!signal) continue;
    if (signal.aborted) {
      abort(signal.reason);
      break;
    }
    if (signal.addEventListener) {
      signal.addEventListener("abort", () => abort(signal.reason), { once: true });
    }
  }
  return controller.signal;
};

/**
 * Transport + 401 orchestration. Returns `{ response, data }` for every HTTP
 * outcome (including non-2xx). Throws ApiRequestError only on network-level
 * failures (offline / timeout / aborted).
 */
export async function sendRequest(method, path, body = null, auth = true, _retry = false, signal = null) {
  const { signal: timeoutSignal, cancel: cancelTimeout } = createTimeoutSignal(REQUEST_TIMEOUT_MS);
  const combinedSignal = signal ? createAnySignal(timeoutSignal, signal) : timeoutSignal;
  const options = {
    method,
    headers: buildAuthHeaders(auth, body),
    signal: combinedSignal,
    // Required for HttpOnly cookie refresh flow (when isCookieRefreshEnabled)
    credentials: isCookieRefreshEnabled() ? "include" : "same-origin",
  };
  if (body) {
    options.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(buildApiUrl(path), options);
  } catch (cause) {
    throw new ApiRequestError(normalizeApiError({ cause }));
  } finally {
    cancelTimeout();
  }

  const canRefresh = auth && ! _retry && (getRefreshToken() || isCookieRefreshEnabled());
  if (response.status === 401 && canRefresh) {
    try {
      if (!isRefreshInProgress()) {
        await refreshAccessToken();
      } else {
        await waitForRefresh();
      }
      return sendRequest(method, path, body, auth, true, signal);
    } catch (refreshError) {
      clearTokens();
      redirectToLogin();
      // Normalize to ApiRequestError so caller can handle as auth failure, not as 401 success
      throw new ApiRequestError(
        normalizeApiError({
          status: 401,
          data: null,
          message: refreshError?.message || "Session expired",
          cause: refreshError,
        })
      );
    }
  }

  return parseBody(response);
}
