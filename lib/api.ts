/**
 * Browser-side client for the app's own API routes (app/api/**).
 * Errors carry the server's `code` and a user-facing `message`.
 */

export class ApiClientError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function parse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = data?.error;
    throw new ApiClientError(res.status, e?.code || "error", e?.message || "Something went wrong. Try again.");
  }
  return data;
}

export async function api<T = any>(path: string, init?: { method?: string; json?: unknown }): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: init?.method || (init?.json !== undefined ? "POST" : "GET"),
    credentials: "same-origin",
    cache: "no-store",
    headers: init?.json !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.json !== undefined ? JSON.stringify(init.json) : undefined,
  });
  return parse(res);
}

/** Multipart upload with progress (fetch can't report upload progress). */
export function upload<T = any>(path: string, form: FormData, onProgress?: (pct: number) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api${path}`);
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new ApiClientError(0, "auth/network-request-failed", "Network error. Check your connection."));
    xhr.onload = () => {
      const data = xhr.response || {};
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new ApiClientError(xhr.status, data?.error?.code || "error", data?.error?.message || "Upload failed. Try again."));
    };
    xhr.send(form);
  });
}
