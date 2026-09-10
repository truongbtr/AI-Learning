/**
 * FileStorage adapter (docs/02 §1, docs/08 pha 0): local volume now, MinIO/S3 later.
 * Keys are relative POSIX paths like "intake/2026-09-10/abc.jpg".
 */
export interface StoredFile {
  key: string;
  size: number;
  contentType?: string;
}

export interface FileStorage {
  put(key: string, data: Uint8Array, contentType?: string): Promise<StoredFile>;
  get(key: string): Promise<Uint8Array>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}

/** Rejects keys that could escape the root ("../", absolute paths, backslashes). */
export function assertSafeKey(key: string): string {
  if (!key || key.startsWith("/") || key.includes("\\") || key.includes("\0")) {
    throw new Error(`Unsafe storage key: ${key}`);
  }
  const parts = key.split("/");
  if (parts.some((p) => p === "" || p === "." || p === "..")) {
    throw new Error(`Unsafe storage key: ${key}`);
  }
  return key;
}
