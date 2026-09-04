import { buildApiUrl } from "../config";
import { getAccessToken } from "../token";
import type { HttpResult } from "./responseParser";

interface UploadParams {
  endpoint: string;
  file: File;
  fieldName?: string;
  method?: string;
  onProgress?: (percent: number) => void;
}

interface XhrResponse {
  ok: boolean;
  status: number;
  headers: { get: (name: string) => string | null };
}

/**
 * Multipart upload via XMLHttpRequest with progress reporting.
 * Resolves with the same `{ response, data }` shape used across the API
 * layer (`response.ok`, `response.status`, parsed `data`).
 */
export function uploadFile<T = unknown>({
  endpoint,
  file,
  fieldName = "file",
  method = "POST",
  onProgress,
}: UploadParams): Promise<HttpResult<T>> {
  return new Promise<HttpResult<T>>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append(fieldName, file, file.name);

    xhr.open(method, buildApiUrl(endpoint));

    const token = getAccessToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Accept", "application/json");

    xhr.upload.onprogress = (e: ProgressEvent) => {
      if (e.lengthComputable && typeof onProgress === "function") {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onerror = (): void => reject(new Error("Network error"));
    xhr.onabort = (): void => reject(new Error("Upload aborted"));
    xhr.ontimeout = (): void => reject(new Error("Upload timed out"));

    xhr.onload = (): void => {
      const contentType = xhr.getResponseHeader("content-type") ?? "";
      let data: unknown = null;
      try {
        data = contentType.includes("application/json")
          ? (JSON.parse(xhr.responseText || "null") as unknown)
          : (xhr.responseText as unknown);
      } catch {
        data = xhr.responseText as unknown;
      }
      const response: XhrResponse = {
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        headers: { get: (name: string): string | null => xhr.getResponseHeader(name) },
      };
      if (xhr.status === 401) {
        try {
          window.dispatchEvent(new CustomEvent("auth:logout", { detail: { reason: "session_expired" } }));
        } catch {
          // ignore
        }
      }
      resolve({ response: response as unknown as Response, data: data as T });
    };

    xhr.send(form);
  });
}
