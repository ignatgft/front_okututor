import { buildApiUrl } from "../config";
import { getAccessToken } from "../token";

/**
 * Multipart upload via XMLHttpRequest with progress reporting.
 * Resolves with the same `{ response, data }` shape used across the API
 * layer (`response.ok`, `response.status`, parsed `data`).
 */
export function uploadFile({ endpoint, file, fieldName = "file", method = "POST", onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append(fieldName, file, file.name);

    xhr.open(method, buildApiUrl(endpoint));

    const token = getAccessToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Accept", "application/json");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === "function") {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.onabort = () => reject(new Error("Upload aborted"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));

    xhr.onload = () => {
      const contentType = xhr.getResponseHeader("content-type") || "";
      let data = null;
      try {
        data = contentType.includes("application/json") ? JSON.parse(xhr.responseText || "null") : xhr.responseText;
      } catch {
        data = xhr.responseText;
      }
      const response = {
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        headers: { get: (name) => xhr.getResponseHeader(name) },
      };
      if (xhr.status === 401) {
        window.dispatchEvent(new CustomEvent("auth:logout", { detail: { reason: "session_expired" } }));
      }
      resolve({ response, data });
    };

    xhr.send(form);
  });
}