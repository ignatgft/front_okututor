const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

export const API_BASE_URL = rawApiUrl.replace(/\/$/, "");

export const APP_ENV: string =
  process.env.EXPO_PUBLIC_ENVIRONMENT || "development";

export const buildApiUrl = (path = ""): string => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const REQUEST_TIMEOUT_MS = 30000;