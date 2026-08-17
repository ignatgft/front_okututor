import axios from "axios";
import { API_BASE_URL, buildApiUrl } from "./config";
import { getToken } from "./token";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const readResponseBody = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
};

export const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function apiFetch(path, { method = "GET", body, headers = {}, auth = false } = {}) {
  const response = await fetch(buildApiUrl(path), {
    method,
    headers: {
      ...(auth ? authHeaders() : {}),
      ...headers,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await readResponseBody(response);
  return { response, data };
}
