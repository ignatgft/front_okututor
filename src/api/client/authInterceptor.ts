import { getAccessToken } from "../token";
import { getUserTimezone } from "../../utils/timezone";

export function buildAuthHeaders(auth: boolean, body: unknown = null): Record<string, string> {
  const headers: Record<string, string> = body instanceof FormData ? {} : { "Content-Type": "application/json" };
  if (auth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  headers["X-Time-Zone"] = getUserTimezone();
  return headers;
}
