export const API_ERROR_CODES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  RATE_LIMIT: "RATE_LIMIT",
  SERVER_ERROR: "SERVER_ERROR",
  TIMEOUT: "TIMEOUT",
  UNKNOWN: "UNKNOWN",
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export interface NormalizedErrorShape {
  status: number;
  code: ApiErrorCode;
  message: string;
  fieldErrors: Record<string, string> | null;
  retryable: boolean;
}

const CODE_BY_STATUS: Record<number, ApiErrorCode> = {
  400: API_ERROR_CODES.VALIDATION_ERROR,
  401: API_ERROR_CODES.UNAUTHORIZED,
  403: API_ERROR_CODES.FORBIDDEN,
  404: API_ERROR_CODES.NOT_FOUND,
  409: API_ERROR_CODES.CONFLICT,
  422: API_ERROR_CODES.VALIDATION_ERROR,
  429: API_ERROR_CODES.RATE_LIMIT,
};

/**
 * Normalizes any API failure into a stable shape:
 * { status, code, message, fieldErrors }
 * UI must display `message`, never raw backend stack traces.
 */
export function normalizeApiError({
  status = 0,
  data = null,
  message,
  cause,
}: {
  status?: number;
  data?: unknown;
  message?: string;
  cause?: { name?: string };
} = {}): NormalizedErrorShape {
  let code: ApiErrorCode | undefined =
    (status && CODE_BY_STATUS[status]) ||
    (status >= 500 ? API_ERROR_CODES.SERVER_ERROR : undefined);

  if (!status && cause?.name === "AbortError") code = API_ERROR_CODES.TIMEOUT;
  if (!code) code = status ? API_ERROR_CODES.UNKNOWN : API_ERROR_CODES.NETWORK_ERROR;

  const dataObj = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
  const fieldErrors =
    dataObj && dataObj.errors && typeof dataObj.errors === "object"
      ? (dataObj.errors as Record<string, string>)
      : null;

  const rawDataMessage =
    dataObj && typeof dataObj.message === "string"
      ? dataObj.message
      : dataObj && typeof dataObj.error === "string"
        ? dataObj.error
        : "";

  const rawMessage = message || rawDataMessage || defaultMessage(code);

  const retryableCodes: ApiErrorCode[] = [
    API_ERROR_CODES.TIMEOUT,
    API_ERROR_CODES.NETWORK_ERROR,
    API_ERROR_CODES.RATE_LIMIT,
    API_ERROR_CODES.SERVER_ERROR,
  ];

  const retryable = retryableCodes.includes(code);

  return { status, code, message: rawMessage, fieldErrors, retryable };
}

function defaultMessage(code: ApiErrorCode): string {
  switch (code) {
    case API_ERROR_CODES.NETWORK_ERROR:
      return "Network error. Check your connection.";
    case API_ERROR_CODES.UNAUTHORIZED:
      return "Your session has expired. Please sign in again.";
    case API_ERROR_CODES.FORBIDDEN:
      return "You do not have permission for this action.";
    case API_ERROR_CODES.NOT_FOUND:
      return "The requested resource was not found.";
    case API_ERROR_CODES.VALIDATION_ERROR:
      return "Please check the entered values.";
    case API_ERROR_CODES.CONFLICT:
      return "This action conflicts with the current state.";
    case API_ERROR_CODES.RATE_LIMIT:
      return "Too many requests. Please slow down.";
    case API_ERROR_CODES.SERVER_ERROR:
      return "Server error. Please try again later.";
    default:
      return "Something went wrong.";
  }
}

/** Error thrown by the transport layer (network failure / timeout). */
export class ApiRequestError extends Error {
  readonly name = "ApiRequestError";
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly fieldErrors: Record<string, string> | null;
  readonly retryable: boolean;

  constructor(normalized: NormalizedErrorShape) {
    super(normalized.message);
    this.status = normalized.status;
    this.code = normalized.code;
    this.fieldErrors = normalized.fieldErrors;
    this.retryable = normalized.retryable;
  }
}

/** Shape consumed by utilities that inspect failures. */
export type ApiErrorShape = Pick<
  ApiRequestError,
  "status" | "code" | "message" | "fieldErrors" | "retryable"
> & { data?: unknown };

export type ApiRequestErrorLike = ApiRequestError | ApiErrorShape;