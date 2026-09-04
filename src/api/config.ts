const rawApiUrl: string =
  ((import.meta as unknown as { env: Record<string, unknown> }).env["VITE_API_URL"] as string | undefined) ||
  "http://localhost:8080";

// Normalize: "/" -> "" so "/api/..." stays "/api/...", "/api" base with "/api/..." won't duplicate
const normalized: string = rawApiUrl === "/" ? "" : rawApiUrl.replace(/\/$/, "");
// If base is "/api" and path starts with "/api", avoid double "/api/api"
export const API_BASE_URL: string = normalized;

export const APP_ENV: string =
  ((import.meta as unknown as { env: Record<string, unknown> }).env["VITE_APP_ENV"] as string | undefined) ||
  ((import.meta as unknown as { env: Record<string, unknown> }).env["MODE"] as string | undefined) ||
  "development";

export const buildApiUrl = (path = ""): string => {
  if (!path) return API_BASE_URL || "/";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // Avoid duplicate /api prefix when base ends with /api
  if (API_BASE_URL.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${API_BASE_URL}${normalizedPath.slice(4)}`;
  }
  if (!API_BASE_URL) return normalizedPath;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const REQUEST_TIMEOUT_MS = 30000;
