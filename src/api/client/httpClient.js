import { buildApiUrl } from "../config";
import { getRefreshToken } from "../token";
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
 */
const createTimeoutSignal = (ms) => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
};

/**
 * Creates a combined signal from multiple signals (polyfill for AbortSignal.any)
 */
const createAnySignal = (...signals) => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signals.forEach((signal) => {
    if (signal.addEventListener) {
      signal.addEventListener("abort", abort, { once: true });
    }
  });
  return controller.signal;
};

/**
 * Transport + 401 orchestration. Returns `{ response, data }` for every HTTP
 * outcome (including non-2xx). Throws ApiRequestError only on network-level
 * failures (offline / timeout / aborted).
 */
export async function sendRequest(method, path, body = null, auth = true, _retry = false, signal = null) {
  const timeoutSignal = createTimeoutSignal(REQUEST_TIMEOUT_MS);
  const combinedSignal = signal ? createAnySignal(timeoutSignal, signal) : timeoutSignal;
  const options = {
    method,
    headers: buildAuthHeaders(auth, body),
    signal: combinedSignal,
  };
  if (body) {
    options.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(buildApiUrl(path), options);
  } catch (cause) {
    throw new ApiRequestError(normalizeApiError({ cause }));
  }

  if (response.status === 401 && auth && getRefreshToken() && !_retry) {
    try {
      if (!isRefreshInProgress()) {
        await refreshAccessToken();
      } else {
        await waitForRefresh();
      }
      return sendRequest(method, path, body, auth, true, signal);
    } catch {
      redirectToLogin();
      return parseBody(response);
    }
  }

  return parseBody(response);
}
