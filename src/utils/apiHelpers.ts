/** Shared API helpers: narrow type guards and error extraction used across hooks/pages. */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Extracts `message` / `error` text from an API error payload, if present. */
export function extractError(data: unknown): string | undefined {
  if (!isRecord(data)) return undefined;
  const msg = data["message"];
  const err = data["error"];
  if (typeof msg === "string" && msg) return msg;
  if (typeof err === "string" && err) return err;
  return undefined;
}
