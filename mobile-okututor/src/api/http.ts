import { sendRequest } from "./client/httpClient";

export const apiClient = {
  request<D = unknown>(
    method: string,
    path: string,
    body: unknown = null,
    auth = true,
    retrying = false,
    signal: AbortSignal | null = null
  ) {
    return sendRequest<D>(method, path, body, auth, retrying, signal);
  },

  get<D = unknown>(path: string, auth = true) {
    return this.request<D>("GET", path, null, auth);
  },

  post<D = unknown>(path: string, body: unknown = null, auth = true) {
    return this.request<D>("POST", path, body, auth);
  },

  put<D = unknown>(path: string, body: unknown = null, auth = true) {
    return this.request<D>("PUT", path, body, auth);
  },

  delete<D = unknown>(path: string, auth = true) {
    return this.request<D>("DELETE", path, null, auth);
  },
};

export async function apiFetch<D = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<ReturnType<typeof sendRequest<D>>> {
  const { method = "GET", body, auth = false } = opts;
  return apiClient.request<D>(method, path, body, auth);
}