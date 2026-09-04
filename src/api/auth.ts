import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { buildApiUrl } from "./config";
import { clearTokens, setTokens, getRefreshToken } from "./token";
import { ROLES } from "../constants/roles";
import type { UserDTO, LoginResponse } from "../types/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function buildGoogleOAuthUrl(role?: string): string {
  const env = (import.meta as unknown as { env: Record<string, unknown> }).env ?? {};
  const baseEnv = env["VITE_GOOGLE_OAUTH_URL"] as string | undefined;
  const base = baseEnv ?? buildApiUrl("/oauth2/authorization/google");
  return role ? `${base}?role=${encodeURIComponent(role)}` : base;
}

export interface LoginResult {
  user?: UserDTO;
  emailNotVerified?: boolean;
  email?: string;
}

export interface RegisterResult {
  user?: UserDTO;
  emailVerificationRequired?: boolean;
  email?: string;
}

/**
 * Login result shapes:
 *   { user }                         — success, email verified
 *   { emailNotVerified: true, email } — EMAIL_NOT_VERIFIED from backend
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const { response, data } = await apiClient.post<LoginResponse>(endpoints.auth.login, { email, password }, false);
  if (!response.ok) {
    const d = isRecord(data) ? (data as Record<string, unknown>) : null;
    const msg =
      (d?.["message"] as string | undefined) ??
      (d?.["error"] as string | undefined) ??
      "Login failed";
    throw new Error(msg);
  }
  if (data.status === "EMAIL_NOT_VERIFIED" || data.error === "EMAIL_NOT_VERIFIED") {
    return { emailNotVerified: true, email: (data.email as string | undefined) ?? email };
  }
  if (data.access_token) setTokens(data.access_token, (data.refresh_token as string | null | undefined) ?? null);
  return { user: (data.user as UserDTO | undefined) ?? (data as unknown as UserDTO) };
}

/**
 * Register result shapes:
 *   { user }                              — success (legacy, already verified)
 *   { emailVerificationRequired: true, email } — needs email verification
 */
export async function register(
  email: string,
  password: string,
  repeatPassword: string,
  fullName: string,
  role: (typeof ROLES)[keyof typeof ROLES] = ROLES.STUDENT
): Promise<RegisterResult> {
  const { response, data } = await apiClient.post<LoginResponse>(
    endpoints.auth.register,
    {
      email,
      password,
      repeat_password: repeatPassword,
      full_name: fullName,
      role,
    },
    false
  );
  if (!response.ok) {
    const d = isRecord(data) ? (data as Record<string, unknown>) : null;
    const msg =
      (d?.["message"] as string | undefined) ??
      (d?.["error"] as string | undefined) ??
      "Registration failed";
    throw new Error(msg);
  }
  if (data.status === "EMAIL_VERIFICATION_REQUIRED" || (data as Record<string, unknown>)["requires_verification"]) {
    return { emailVerificationRequired: true, email: (data.email as string | undefined) ?? email };
  }
  if (data.access_token) setTokens(data.access_token, (data.refresh_token as string | null | undefined) ?? null);
  return { user: (data.user as UserDTO | undefined) ?? (data as unknown as UserDTO) };
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    await apiClient.post(endpoints.auth.logout, { refresh_token: refreshToken }, false).catch((): void => {});
  }
  clearTokens();
}

function isRetryableError(e: unknown): boolean {
  if (!isRecord(e)) return false;
  if (e["retryable"] === true) return true;
  const code = e["code"];
  return code === "NETWORK_ERROR" || code === "TIMEOUT" || code === "SERVER_ERROR" || code === "RATE_LIMIT";
}

export async function getCurrentUser(): Promise<UserDTO | null> {
  try {
    const { response, data } = await apiClient.get<unknown>(endpoints.users.me, true);
    if (response.ok) return data as UserDTO;
    // 401/403/404 mean not authenticated or not found -> return null without throwing
    if (response.status === 401 || response.status === 403 || response.status === 404) return null;
    return null;
  } catch (e: unknown) {
    // Network/timeout/server errors are retryable -> propagate to caller (authStore) so it doesn't clear tokens
    if (isRetryableError(e)) {
      throw e;
    }
    const asRecord = isRecord(e) ? (e as Record<string, unknown>) : null;
    if (
      asRecord?.["code"] === "NETWORK_ERROR" ||
      asRecord?.["code"] === "TIMEOUT" ||
      asRecord?.["code"] === "SERVER_ERROR"
    ) {
      throw e;
    }
    return null;
  }
}
