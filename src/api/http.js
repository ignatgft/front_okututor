import { sendRequest } from "./client/httpClient";

export const apiClient = {
  request(method, path, body = null, auth = true, _retry = false, signal = null) {
    return sendRequest(method, path, body, auth, _retry, signal);
  },

  get(path, auth = true) {
    return this.request("GET", path, null, auth);
  },

  post(path, body, auth = true) {
    return this.request("POST", path, body, auth);
  },

  put(path, body, auth = true) {
    return this.request("PUT", path, body, auth);
  },

  delete(path, auth = true) {
    return this.request("DELETE", path, null, auth);
  },
};

export async function apiFetch(path, opts = {}) {
  const { method = "GET", body, auth = false } = opts;
  return apiClient.request(method, path, body, auth);
}
