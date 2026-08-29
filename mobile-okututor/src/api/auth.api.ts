import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { ApiResult } from "./types";

export const EMAIL_ERROR_CODES = {
  INVALID_CODE: "INVALID_CODE",
  VERIFICATION_CODE_EXPIRED: "VERIFICATION_CODE_EXPIRED",
  TOO_MANY_ATTEMPTS: "TOO_MANY_ATTEMPTS",
  RATE_LIMITED: "RATE_LIMITED",
  NETWORK: "NETWORK",
} as const;

function mapAuthError(err: unknown, data: unknown): string | null {
  const d = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
  const raw = String(
    d?.error || d?.code || d?.message || (err instanceof Error ? err.message : "") || ""
  ).toUpperCase();
  if (raw.includes("INVALID_CODE") || raw.includes("INVALID")) return EMAIL_ERROR_CODES.INVALID_CODE;
  if (raw.includes("EXPIRED")) return EMAIL_ERROR_CODES.VERIFICATION_CODE_EXPIRED;
  if (raw.includes("TOO_MANY")) return EMAIL_ERROR_CODES.TOO_MANY_ATTEMPTS;
  if (raw.includes("RATE_LIMIT") || raw.includes("429")) return EMAIL_ERROR_CODES.RATE_LIMITED;
  const anyErr = err as { name?: string; code?: string } | null;
  if (anyErr?.name === "ApiRequestError" && anyErr?.code === "NETWORK_ERROR")
    return EMAIL_ERROR_CODES.NETWORK;
  return null;
}

function throwMappedError(data: unknown): never {
  const d = data && typeof data === "object" ? (data as Record<string, string>) : null;
  const code2 = mapAuthError(null, data);
  const err = new Error(d?.message || d?.error || "Verification failed") as Error & { code?: string };
  if (code2) err.code = code2;
  throw err;
}

interface AuthResult {
  user?: unknown;
  access_token?: string;
  refresh_token?: string;
  status?: string;
  email?: string;
}

export const authApi = {
  login: (email: string, password: string): ApiResult<AuthResult> =>
    apiClient.post<AuthResult>(endpoints.auth.login, { email, password }, false),

  register: (payload: Record<string, unknown>): ApiResult<AuthResult> =>
    apiClient.post<AuthResult>(endpoints.auth.register, payload, false),

  refresh: (refreshToken: string): ApiResult<AuthResult> =>
    apiClient.post<AuthResult>(endpoints.auth.refresh, { refresh_token: refreshToken }, false),

  logout: (refreshToken: string): ApiResult<unknown> =>
    apiClient.post(endpoints.auth.logout, { refresh_token: refreshToken }, false),

  me: (): ApiResult<unknown> => apiClient.get(endpoints.auth.me),

  forgotPassword: (email: string): ApiResult<unknown> =>
    apiClient.post(endpoints.auth.forgotPassword, { email }, false),

  resetPassword: (payload: Record<string, unknown>): ApiResult<unknown> =>
    apiClient.post(endpoints.auth.resetPassword, payload, false),

  async verifyEmail(email: string, code: string): Promise<ApiResult<unknown>> {
    const result = await apiClient.post(endpoints.auth.verifyEmail, { email, code }, false);
    if (!result.response.ok) throwMappedError(result.data);
    return result;
  },

  async resendVerification(email: string): Promise<ApiResult<unknown>> {
    return apiClient.post(endpoints.auth.resendVerification, { email }, false);
  },

  async verifyResetCode(email: string, code: string): Promise<ApiResult<unknown>> {
    const result = await apiClient.post(endpoints.auth.verifyResetCode, { email, code }, false);
    if (!result.response.ok) throwMappedError(result.data);
    return result;
  },

  async changeEmail(newEmail: string): Promise<ApiResult<unknown>> {
    return apiClient.post(endpoints.auth.changeEmail, { email: newEmail });
  },

  async resendResetCode(email: string): Promise<ApiResult<unknown>> {
    return apiClient.post(endpoints.auth.resendVerification, { email }, false);
  },
};