/**
 * Local file store.
 *
 * Browser-only replacement for object storage, with the same call shapes the
 * app uses (ref / uploadBytesResumable / getDownloadURL / deleteObject).
 * Files are saved as data URLs in localStorage when they fit; larger files fall
 * back to a session-only object URL. Replace this file to use real storage.
 */

const FILES_KEY = "anonfeedback:files:v1";

export interface Storage {
  readonly kind: "local";
}
export const storage: Storage = { kind: "local" };

export interface StorageReference {
  fullPath: string;
}

const sessionUrls = new Map<string, string>();
const isBrowser = () => typeof window !== "undefined";

function readFiles(): Record<string, string> {
  if (!isBrowser()) return {};
  try {
    return JSON.parse(window.localStorage.getItem(FILES_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeFiles(files: Record<string, string>): boolean {
  try {
    window.localStorage.setItem(FILES_KEY, JSON.stringify(files));
    return true;
  } catch {
    return false;
  }
}

function toDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ref(_storage: Storage, path: string): StorageReference {
  return { fullPath: path };
}

type Snapshot = { bytesTransferred: number; totalBytes: number; ref: StorageReference };

export function uploadBytesResumable(
  target: StorageReference,
  file: Blob,
  _metadata?: { contentType?: string },
) {
  const snapshot: Snapshot = { bytesTransferred: 0, totalBytes: file.size, ref: target };
  return {
    snapshot,
    on(
      _event: "state_changed",
      progress?: (s: Snapshot) => void,
      error?: (e: Error) => void,
      complete?: () => void,
    ) {
      (async () => {
        try {
          progress?.({ ...snapshot, bytesTransferred: Math.floor(file.size / 2) });
          const dataUrl = await toDataUrl(file);
          const files = readFiles();
          files[target.fullPath] = dataUrl;
          if (!writeFiles(files)) {
            // Too large to persist: keep a session-only URL instead.
            delete files[target.fullPath];
            sessionUrls.set(target.fullPath, URL.createObjectURL(file));
          }
          snapshot.bytesTransferred = file.size;
          progress?.({ ...snapshot });
          complete?.();
        } catch (e) {
          error?.(e as Error);
        }
      })();
    },
  };
}

export async function getDownloadURL(target: StorageReference): Promise<string> {
  return (
    sessionUrls.get(target.fullPath) ||
    readFiles()[target.fullPath] ||
    ""
  );
}

export async function deleteObject(target: StorageReference): Promise<void> {
  const url = sessionUrls.get(target.fullPath);
  if (url) {
    URL.revokeObjectURL(url);
    sessionUrls.delete(target.fullPath);
  }
  const files = readFiles();
  if (target.fullPath in files) {
    delete files[target.fullPath];
    writeFiles(files);
  }
}
