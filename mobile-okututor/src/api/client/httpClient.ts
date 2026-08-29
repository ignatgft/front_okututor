import { buildApiUrl, REQUEST_TIMEOUT_MS } from "../config";
import { getRefreshToken } from "../token";
import { buildAuthHeaders } from "./authInterceptor";
import { isRefreshInProgress, refreshAccessToken, waitForRefresh } from "./refreshManager";
import { parseBody } from "./responseParser";
import { ApiRequestError, normalizeApiError } from "./errorMapper";

type FetchResponse = Awaited<ReturnType<typeof fetch>>;

/**
 * Creates a timeout signal (Safari/older RN-safe).
 */
const createTimeoutSignal = (ms: number): AbortSignal => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  // no-op on platforms where timers have no .unref (React Native)
  if (typeof timer === "object" && timer !== null && "unref" in timer && typeof (timer as { unref?: unknown }).unref === "function") {
    (timer as unknown as { unref: () => void }).unref();
  }
  return controller.signal;
};

/**
 * Combines multiple signals into one (polyfill for AbortSignal.any).
 */
const createAnySignal = (...signals: AbortSignal[]): AbortSignal => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signals.forEach((signal) => {
    if (signal && typeof signal.addEventListener === "function") {
      signal.addEventListener("abort", abort, { once: true });
    }
  });
  return controller.signal;
};

export type HttpResult<D = unknown> = { response: FetchResponse; data: D | null };

/**
 * Transport + 401 orchestration. Returns `{ response, data }` for every HTTP
 * outcome (including non-2xx). Throws ApiRequestError only on network-level
 * failures (offline / timeout / aborted).
 */
export async function sendRequest<D = unknown>(
  method: string,
  path: string,
  body: unknown = null,
  auth = true,
  retrying = false,
  signal: AbortSignal | null = null
): Promise<HttpResult<D>> {
  const timeoutSignal = createTimeoutSignal(REQUEST_TIMEOUT_MS);
  const combinedSignal = signal ? createAnySignal(timeoutSignal, signal) : timeoutSignal;

  const options: RequestInit = {
    method,
    headers: await buildAuthHeaders(auth),
    signal: combinedSignal,
  };
  if (body !== null && body !== undefined) {
    options.body = JSON.stringify(body);
  }

  let response: FetchResponse;
  try {
    response = await fetch(buildApiUrl(path), options);
  } catch (cause) {
    throw new ApiRequestError(normalizeApiError({ cause: { name: (cause as Error)?.name } }));
  }

  if (response.status === 401 && auth && (await getRefreshToken()) && !retrying) {
    try {
      if (!isRefreshInProgress()) {
        await refreshAccessToken();
      } else {
        await waitForRefresh();
      }
      return sendRequest<D>(method, path, body, auth, true, signal);
    } catch {
      // refresh failed → tokens cleared + auth:logout emitted; surface the
      // original 401 response so callers can render a session-expired state.
      return parseBody(response);
    }
  }

  return parseBody(response);
}