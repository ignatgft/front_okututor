import { sendRequest } from "./client/httpClient";
import type { HttpResult } from "./client/responseParser";

export const apiClient = {
  request<T = unknown>(
    method: string,
    path: string,
    body: unknown = null,
    auth = true,
    _retry = false,
    signal: AbortSignal | null = null
  ): Promise<HttpResult<T>> {
    return sendRequest<T>(method, path, body, auth, _retry, signal);
  },

  get<T = unknown>(path: string, auth = true): Promise<HttpResult<T>> {
    return this.request<T>("GET", path, null, auth);
  },

  post<T = unknown>(path: string, body: unknown = null, auth = true): Promise<HttpResult<T>> {
    return this.request<T>("POST", path, body, auth);
  },

  put<T = unknown>(path: string, body: unknown = null, auth = true): Promise<HttpResult<T>> {
    return this.request<T>("PUT", path, body, auth);
  },

  patch<T = unknown>(path: string, body: unknown = null, auth = true): Promise<HttpResult<T>> {
    return this.request<T>("PATCH", path, body, auth);
  },

  delete<T = unknown>(path: string, auth = true): Promise<HttpResult<T>> {
    return this.request<T>("DELETE", path, null, auth);
  },
};

export async function apiFetch<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<HttpResult<T>> {
  const { method = "GET", body, auth = false } = opts;
  return apiClient.request<T>(method, path, body, auth);
}
