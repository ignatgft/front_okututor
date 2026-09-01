import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { buildApiUrl } from "./config";
import { clearTokens, setTokens, getRefreshToken } from "./token";
import { ROLES } from "../constants/roles";

export function buildGoogleOAuthUrl(role) {
  const base =
    import.meta.env.VITE_GOOGLE_OAUTH_URL ||
    buildApiUrl("/oauth2/authorization/google");
  return role ? `${base}?role=${encodeURIComponent(role)}` : base;
}

/**
 * Login result shapes:
 *   { user }                         — success, email verified
 *   { emailNotVerified: true, email } — EMAIL_NOT_VERIFIED from backend
 */
export async function login(email, password) {
  const { response, data } = await apiClient.post(endpoints.auth.login, { email, password }, false);
  if (!response.ok) throw new Error(data.message || data.error || "Login failed");
  if (data.status === "EMAIL_NOT_VERIFIED" || data.error === "EMAIL_NOT_VERIFIED") {
    return { emailNotVerified: true, email: data.email || email };
  }
  if (data.access_token) setTokens(data.access_token, data.refresh_token || null);
  return { user: data.user || data };
}

/**
 * Register result shapes:
 *   { user }                              — success (legacy, already verified)
 *   { emailVerificationRequired: true, email } — needs email verification
 */
export async function register(email, password, repeatPassword, fullName, role = ROLES.STUDENT) {
  const { response, data } = await apiClient.post(endpoints.auth.register, {
    email,
    password,
    repeat_password: repeatPassword,
    full_name: fullName,
    role,
  }, false);
  if (!response.ok) throw new Error(data.message || data.error || "Registration failed");
  if (data.status === "EMAIL_VERIFICATION_REQUIRED" || data.requires_verification) {
    return { emailVerificationRequired: true, email: data.email || email };
  }
  if (data.access_token) setTokens(data.access_token, data.refresh_token || null);
  return { user: data.user || data };
}

export async function logout() {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    await apiClient.post(endpoints.auth.logout, { refresh_token: refreshToken }, false).catch(() => {});
  }
  clearTokens();
}

export async function getCurrentUser() {
  try {
    const { response, data } = await apiClient.get(endpoints.users.me, true);
    if (response.ok) return data;
    // 401/403/404 mean not authenticated or not found -> return null without throwing
    // 4xx/5xx with retryable (5xx, network) should be propagated so caller can decide
    if (response.status === 401 || response.status === 403 || response.status === 404) return null;
    return null;
  } catch (e) {
    // Network/timeout/server errors are retryable -> propagate to caller (authStore) so it doesn't clear tokens
    if (e?.retryable || e?.code === "NETWORK_ERROR" || e?.code === "TIMEOUT" || e?.code === "SERVER_ERROR") {
      throw e;
    }
    return null;
  }
}
