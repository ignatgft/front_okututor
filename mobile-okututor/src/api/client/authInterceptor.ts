import { getAccessToken } from "../token";

/**
 * Builds request headers, attaching the Bearer token when `auth` is true.
 * Async because secure token storage is async on mobile.
 */
export async function buildAuthHeaders(auth: boolean): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}