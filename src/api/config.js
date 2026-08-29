const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const API_BASE_URL = rawApiUrl.replace(/\/$/, "");

export const APP_ENV =
  import.meta.env.VITE_APP_ENV || import.meta.env.MODE || "development";

export const buildApiUrl = (path = "") => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};
