import { endpoints } from "./endpoints";
import { apiClient } from "./http";

export const EMAIL_ERROR_CODES = {
  INVALID_CODE: "INVALID_CODE",
  VERIFICATION_CODE_EXPIRED: "VERIFICATION_CODE_EXPIRED",
  TOO_MANY_ATTEMPTS: "TOO_MANY_ATTEMPTS",
  RATE_LIMITED: "RATE_LIMITED",
  NETWORK: "NETWORK",
};

function mapAuthError(err, data) {
  const raw = (data?.error || data?.code || data?.message || err?.message || "").toUpperCase();
  if (raw.includes("INVALID_CODE") || raw.includes("INVALID")) return EMAIL_ERROR_CODES.INVALID_CODE;
  if (raw.includes("EXPIRED")) return EMAIL_ERROR_CODES.VERIFICATION_CODE_EXPIRED;
  if (raw.includes("TOO_MANY")) return EMAIL_ERROR_CODES.TOO_MANY_ATTEMPTS;
  if (raw.includes("RATE_LIMIT") || raw.includes("429")) return EMAIL_ERROR_CODES.RATE_LIMITED;
  if (err?.name === "ApiRequestError" && err?.code === "NETWORK_ERROR") return EMAIL_ERROR_CODES.NETWORK;
  return null;
}

export const authApi = {
  login: (email, password) => apiClient.post(endpoints.auth.login, { email, password }, false),
  register: (payload) => apiClient.post(endpoints.auth.register, payload, false),
  refresh: (refreshToken) => apiClient.post(endpoints.auth.refresh, { refresh_token: refreshToken }, false),
  logout: (refreshToken) => apiClient.post(endpoints.auth.logout, { refresh_token: refreshToken }, false),
  me: () => apiClient.get(endpoints.auth.me),
  forgotPassword: (email) => apiClient.post(endpoints.auth.forgotPassword, { email }, false),
  resetPassword: (payload) => apiClient.post(endpoints.auth.resetPassword, payload, false),

  async verifyEmail(email, code) {
    const result = await apiClient.post(endpoints.auth.verifyEmail, { email, code }, false);
    if (!result.response.ok) {
      const code2 = mapAuthError(null, result.data);
      if (code2) throw Object.assign(new Error(result.data.message || "Verification failed"), { code: code2 });
    }
    return result;
  },

  async resendVerification(email) {
    return apiClient.post(endpoints.auth.resendVerification, { email }, false);
  },

  async verifyResetCode(email, code) {
    const result = await apiClient.post(endpoints.auth.verifyResetCode, { email, code }, false);
    if (!result.response.ok) {
      const code2 = mapAuthError(null, result.data);
      if (code2) throw Object.assign(new Error(result.data.message || "Verification failed"), { code: code2 });
    }
    return result;
  },

  async changeEmail(newEmail) {
    return apiClient.post(endpoints.auth.changeEmail, { email: newEmail });
  },

  async resendResetCode(email) {
    // TODO(backend): add POST /api/v1/auth/resend-reset-code endpoint
    return apiClient.post(endpoints.auth.resendVerification, { email }, false);
  },
};
