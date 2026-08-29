import { getAccessToken } from "../token";

export function buildAuthHeaders(auth, body = null) {
  const headers = body instanceof FormData ? {} : { "Content-Type": "application/json" };
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
