import { endpoints } from "./endpoints";
import { apiFetch } from "./http";
import { clearToken, getToken, setToken } from "./token";

export async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const { response, data } = await apiFetch(endpoints.auth.currentUser, {
      auth: true,
    });
    if (!response.ok) return null;
    return data;
  } catch (e) {
    console.error("getCurrentUser error", e);
    return null;
  }
}

export function logoutClient() {
  clearToken();
}

export { getToken, setToken };
