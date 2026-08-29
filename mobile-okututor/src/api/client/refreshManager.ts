import { getRefreshToken, setTokens, clearTokens } from "../token";
import { endpoints } from "../endpoints";
import { sendRequest } from "./httpClient";
import { emitAuthEvent } from "../../security/authEvents";

let isRefreshing = false;
let failedQueue: { resolve: () => void; reject: (err: Error) => void }[] = [];

const processQueue = (error: Error | null): void => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

export const isRefreshInProgress = (): boolean => isRefreshing;

/**
 * Resolves when another in-flight refresh completes successfully;
 * rejects if that refresh fails.
 */
export function waitForRefresh(): Promise<void> {
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  });
}

/**
 * Single-flight refresh: the first caller performs POST /auth/refresh and
 * stores new tokens; concurrent callers wait on the same queue.
 * Throws on failure after clearing tokens and emitting auth:logout.
 */
export async function refreshAccessToken(): Promise<{ access_token: string; refresh_token: string }> {
  isRefreshing = true;
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) throw new Error("Session expired");

    const { response, data } = await sendRequest(
      "POST",
      endpoints.auth.refresh,
      { refresh_token: refreshToken },
      false
    );

    if (!response.ok) {
      const error = new Error("Session expired");
      await clearTokens();
      isRefreshing = false;
      processQueue(error);
      emitAuthEvent("auth:logout", { reason: "session_expired" });
      throw error;
    }

    const d = data as { access_token?: string; refresh_token?: string } | null;
    if (!d?.access_token) {
      const error = new Error("Session expired");
      await clearTokens();
      isRefreshing = false;
      processQueue(error);
      emitAuthEvent("auth:logout", { reason: "session_expired" });
      throw error;
    }
    await setTokens(d.access_token, d.refresh_token || null);
    isRefreshing = false;
    processQueue(null);
    return d as { access_token: string; refresh_token: string };
  } catch (e) {
    await clearTokens();
    isRefreshing = false;
    const error = e instanceof Error ? e : new Error("Session expired");
    processQueue(error);
    emitAuthEvent("auth:logout", { reason: "session_expired" });
    throw error;
  }
}