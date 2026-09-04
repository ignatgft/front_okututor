import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import type { HttpResult } from "./client/responseParser";

export const EMAIL_ERROR_CODES = {
  INVALID_CODE: "INVALID_CODE",
  VERIFICATION_CODE_EXPIRED: "VERIFICATION_CODE_EXPIRED",
  TOO_MANY_ATTEMPTS: "TOO_MANY_ATTEMPTS",
  RATE_LIMITED: "RATE_LIMITED",
  NETWORK: "NETWORK",
} as const;

export type EmailErrorCode = (typeof EMAIL_ERROR_CODES)[keyof typeof EMAIL_ERROR_CODES];

interface AuthErrorData {
  error?: unknown;
  code?: unknown;
  message?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasCodeOrName(value: unknown): value is { name?: string; code?: string } {
  return isRecord(value) && ("name" in value || "code" in value);
}

function mapAuthError(err: unknown, data: unknown): EmailErrorCode | null {
  const d = isRecord(data) ? (data as AuthErrorData) : null;
  const raw = String(d?.error ?? d?.code ?? d?.message ?? (err instanceof Error ? err.message : "") ?? "").toUpperCase();
  if (raw.includes("INVALID_CODE") || raw.includes("INVALID")) return EMAIL_ERROR_CODES.INVALID_CODE;
  if (raw.includes("EXPIRED")) return EMAIL_ERROR_CODES.VERIFICATION_CODE_EXPIRED;
  if (raw.includes("TOO_MANY")) return EMAIL_ERROR_CODES.TOO_MANY_ATTEMPTS;
  if (raw.includes("RATE_LIMIT") || raw.includes("429")) return EMAIL_ERROR_CODES.RATE_LIMITED;
  if (hasCodeOrName(err) && err.name === "ApiRequestError" && err.code === "NETWORK_ERROR") return EMAIL_ERROR_CODES.NETWORK;
  return null;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface AuthApiResponse {
  access_token?: string;
  refresh_token?: string;
  user?: unknown;
  message?: string;
  error?: string;
  status?: string;
  code?: string;
  email?: string;
  requires_verification?: boolean;
  [key: string]: unknown;
}

export const authApi = {
  login: (email: string, password: string): Promise<HttpResult<AuthApiResponse>> =>
    apiClient.post<AuthApiResponse>(endpoints.auth.login, { email, password }, false),

  register: (payload: Record<string, unknown>): Promise<HttpResult<AuthApiResponse>> =>
    apiClient.post<AuthApiResponse>(endpoints.auth.register, payload, false),

  refresh: (refreshToken: string): Promise<HttpResult<AuthApiResponse>> =>
    apiClient.post<AuthApiResponse>(endpoints.auth.refresh, { refresh_token: refreshToken }, false),

  logout: (refreshToken: string): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.auth.logout, { refresh_token: refreshToken }, false),

  me: (): Promise<HttpResult<unknown>> => apiClient.get(endpoints.auth.me),

  forgotPassword: (email: string): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.auth.forgotPassword, { email }, false),

  resetPassword: (payload: Record<string, unknown>): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.auth.resetPassword, payload, false),

  async verifyEmail(email: string, code: string): Promise<HttpResult<unknown>> {
    const result = await apiClient.post<Record<string, unknown>>(endpoints.auth.verifyEmail, { email, code }, false);
    if (!result.response.ok) {
      const code2 = mapAuthError(null, result.data);
      const msg =
        isRecord(result.data) && typeof result.data["message"] === "string"
          ? (result.data["message"] as string)
          : "Verification failed";
      if (code2) throw Object.assign(new Error(msg), { code: code2 });
    }
    return result as HttpResult<unknown>;
  },

  async resendVerification(email: string): Promise<HttpResult<unknown>> {
    return apiClient.post(endpoints.auth.resendVerification, { email }, false);
  },

  async verifyResetCode(email: string, code: string): Promise<HttpResult<unknown>> {
    const result = await apiClient.post<Record<string, unknown>>(endpoints.auth.verifyResetCode, { email, code }, false);
    if (!result.response.ok) {
      const code2 = mapAuthError(null, result.data);
      const msg =
        isRecord(result.data) && typeof result.data["message"] === "string"
          ? (result.data["message"] as string)
          : "Verification failed";
      if (code2) throw Object.assign(new Error(msg), { code: code2 });
    }
    return result as HttpResult<unknown>;
  },

  async changeEmail(newEmail: string): Promise<HttpResult<unknown>> {
    return apiClient.post(endpoints.auth.changeEmail, { email: newEmail });
  },

  async resendResetCode(email: string): Promise<HttpResult<unknown>> {
    // TODO(backend): add POST /api/v1/auth/resend-reset-code endpoint
    return apiClient.post(endpoints.auth.resendVerification, { email }, false);
  },
};
