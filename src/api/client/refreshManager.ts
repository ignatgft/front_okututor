import { getRefreshToken, setTokens, clearTokens, isCookieRefreshEnabled } from "../token";
import { apiClient } from "../http";
import { endpoints } from "../endpoints";

interface QueuedPromise {
  resolve: () => void;
  reject: (err: Error) => void;
}

let isRefreshing = false;
let failedQueue: QueuedPromise[] = [];

const processQueue = (error: Error | null): void => {
  const queue = [...failedQueue];
  failedQueue = [];
  for (const prom of queue) {
    if (error) prom.reject(error);
    else prom.resolve();
  }
};

export const isRefreshInProgress = (): boolean => isRefreshing;

export function waitForRefresh(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

interface RefreshData {
  access_token?: string;
  refresh_token?: string;
  [key: string]: unknown;
}

export async function refreshAccessToken(): Promise<RefreshData> {
  if (isRefreshing) {
    // Defensive: should be called only when not refreshing (httpClient checks), but queue if concurrent
    return new Promise<RefreshData>((resolve, reject) => {
      failedQueue.push({
        resolve: () => {
          // After current refresh, caller will retry via httpClient sendRequest
          resolve({} as RefreshData);
        },
        reject,
      });
    });
  }
  isRefreshing = true;
  let lastError: Error | null = null;
  let result: RefreshData | null = null;
  try {
    const payload: Record<string, unknown> = isCookieRefreshEnabled()
      ? {}
      : { refresh_token: getRefreshToken() };
    const { response, data } = await apiClient.post<RefreshData>(endpoints.auth.refresh, payload, false);

    if (!response.ok) {
      clearTokens();
      lastError = new Error("Session expired");
      throw lastError;
    }

    const typedData = data as RefreshData | null;
    const access = typedData?.access_token;
    if (!access) {
      clearTokens();
      lastError = new Error("Session expired");
      throw lastError;
    }

    setTokens(access, (typedData?.refresh_token as string | null | undefined) ?? null);
    result = typedData as RefreshData;
    return result;
  } catch (e: unknown) {
    clearTokens();
    if (e instanceof Error) lastError = e;
    else if (isRecord(e) && typeof e["message"] === "string") lastError = new Error(e["message"] as string);
    else lastError = new Error("Session expired");
    throw lastError;
  } finally {
    // Keep isRefreshing true while draining queue, then reset
    const queueError = lastError;
    // Use microtask to ensure queue drains before flag reset is observable
    processQueue(queueError);
    isRefreshing = false;
    // If we failed, rethrow is already done; if succeeded, result already returned
  }
}
