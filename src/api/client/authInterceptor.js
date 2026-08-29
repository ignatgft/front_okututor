import { getAccessToken } from "../token";

export function buildAuthHeaders(auth) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
