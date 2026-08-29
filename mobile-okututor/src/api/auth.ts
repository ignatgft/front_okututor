import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { buildApiUrl } from "./config";
import { clearTokens, setTokens, getRefreshToken } from "./token";
import { ROLES } from "../constants/roles";
import { User } from "../types/user";

export interface LoginResult {
  user?: User;
  emailNotVerified?: boolean;
  email?: string;
}

export interface RegisterResult {
  user?: User;
  emailVerificationRequired?: boolean;
  email?: string;
}

let googleOAuthUrl: string | undefined;

/** Injectable in tests / E2E. Uses backend OAuth2 endpoint by default. */
export function configureGoogleOAuth(url: string): void {
  googleOAuthUrl = url;
}

export function buildGoogleOAuthUrl(role?: string): string {
  const base = googleOAuthUrl || process.env.EXPO_PUBLIC_GOOGLE_OAUTH_URL || buildApiUrl("/oauth2/authorization/google");
  return role ? `${base}?role=${encodeURIComponent(role)}` : base;
}

/**
 * Login result shapes:
 *   { user }                          — success, email verified
 *   { emailNotVerified: true, email }  — EMAIL_NOT_VERIFIED from backend
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const { response, data } = await apiClient.post<Record<string, unknown>>(
    endpoints.auth.login,
    { email, password },
    false
  );
  if (!response.ok) {
    const d = data as { message?: string; error?: string } | null;
    throw new Error(d?.message || d?.error || "Login failed");
  }
  if (data?.status === "EMAIL_NOT_VERIFIED" || data?.error === "EMAIL_NOT_VERIFIED") {
    return { emailNotVerified: true, email: (data.email as string) || email };
  }
  if (data?.access_token) {
    await setTokens(data.access_token as string, (data.refresh_token as string) || null);
  }
  return { user: (data?.user as User) || (data as unknown as User) };
}

/**
 * Register result shapes:
 *   { user }                               — success (legacy, already verified)
 *   { emailVerificationRequired: true, email } — needs email verification
 */
export async function register(
  email: string,
  password: string,
  repeatPassword: string,
  fullName: string,
  role: (typeof ROLES)[keyof typeof ROLES] = ROLES.STUDENT
): Promise<RegisterResult> {
  const { response, data } = await apiClient.post<Record<string, unknown>>(
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
    const d = data as { message?: string; error?: string } | null;
    throw new Error(d?.message || d?.error || "Registration failed");
  }
  if (data?.status === "EMAIL_VERIFICATION_REQUIRED" || data?.requires_verification) {
    return { emailVerificationRequired: true, email: (data.email as string) || email };
  }
  if (data?.access_token) {
    await setTokens(data.access_token as string, (data.refresh_token as string) || null);
  }
  return { user: (data?.user as User) || (data as unknown as User) };
}

export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    await apiClient
      .post(endpoints.auth.logout, { refresh_token: refreshToken }, false)
      .catch(() => undefined);
  }
  await clearTokens();
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { response, data } = await apiClient.get<unknown>(endpoints.users.me, true);
    if (!response.ok) return null;
    return data as User;
  } catch {
    return null;
  }
}