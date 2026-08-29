type FetchResponse = Awaited<ReturnType<typeof fetch>>;

/**
 * Extracts the JSON or text body from a fetch response without throwing on
 * malformed bodies. Returns the raw `{ response, data }` tuple consumed by
 * every API module.
 */
export async function parseBody<T = unknown>(
  response: FetchResponse
): Promise<{ response: FetchResponse; data: T | null }> {
  const contentType = response.headers.get("content-type") || "";
  let data: T | null;
  if (contentType.includes("application/json")) {
    try {
      data = (await response.json()) as T;
    } catch {
      data = null;
    }
  } else {
    data = (await response.text()) as unknown as T;
  }
  return { response, data };
}

export type ParseResult<D = unknown> = Awaited<ReturnType<typeof parseBody<D>>>;