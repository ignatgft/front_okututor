export interface HttpResult<T = unknown> {
  response: Response;
  data: T;
}

export async function parseBody<T = unknown>(response: Response): Promise<HttpResult<T>> {
  const contentType = response.headers.get("content-type") ?? "";
  let data: unknown;
  if (contentType.includes("application/json")) {
    try {
      data = (await response.json()) as T;
    } catch {
      data = null as unknown as T;
    }
  } else {
    data = await response.text() as unknown as T;
  }
  return { response, data: data as T };
}

export type ParseResult<T = unknown> = Awaited<ReturnType<typeof parseBody<T>>>;
