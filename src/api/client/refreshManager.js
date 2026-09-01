import { getRefreshToken, setTokens, clearTokens, isCookieRefreshEnabled } from "../token";
import { apiClient } from "../http";
import { endpoints } from "../endpoints";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

export const isRefreshInProgress = () => isRefreshing;

/**
 * Resolves when another in-flight refresh completes successfully;
 * rejects if that refresh fails.
 */
export function waitForRefresh() {
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  });
}

/**
 * Single-flight refresh: the first caller performs POST /auth/refresh and
 * stores new tokens; concurrent callers wait on the same queue.
 * Throws on failure after clearing tokens.
 */
export async function refreshAccessToken() {
  isRefreshing = true;
  try {
    const payload = isCookieRefreshEnabled() ? {} : { refresh_token: getRefreshToken() };
    // In cookie mode, refresh token is HttpOnly cookie — no body needed, credentials: include handles it
    const { response, data } = await apiClient.post(endpoints.auth.refresh, payload, false);

    if (!response.ok) {
      clearTokens();
      isRefreshing = false;
      const error = new Error("Session expired");
      processQueue(error);
      throw error;
    }

    setTokens(data.access_token, data.refresh_token);
    isRefreshing = false;
    processQueue(null);
    return data;
  } catch (e) {
    clearTokens();
    isRefreshing = false;
    processQueue(e);
    throw e;
  }
}
