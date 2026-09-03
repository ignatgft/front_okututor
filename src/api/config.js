const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Normalize: "/" -> "" so "/api/..." stays "/api/...", "/api" base with "/api/..." won't duplicate
const normalized = rawApiUrl === "/" ? "" : rawApiUrl.replace(/\/$/, "");
// If base is "/api" and path starts with "/api", avoid double "/api/api"
export const API_BASE_URL = normalized;

export const APP_ENV =
  import.meta.env.VITE_APP_ENV || import.meta.env.MODE || "development";

export const buildApiUrl = (path = "") => {
  if (!path) return API_BASE_URL || "/";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // Avoid duplicate /api prefix when base ends with /api
  if (API_BASE_URL.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${API_BASE_URL}${normalizedPath.slice(4)}`;
  }
  if (!API_BASE_URL) return normalizedPath;
  return `${API_BASE_URL}${normalizedPath}`;
};
