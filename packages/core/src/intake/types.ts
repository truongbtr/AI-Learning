/**
 * What the app stores about one photo of schoolwork (docs/07 §2, docs/03 IntakeJob.files).
 *
 * The original is kept for ever — it is the evidence a parent goes back to — and the version the
 * reader is given is a smaller, straighter, slightly contrastier copy made by the worker.
 */

export interface IntakeFileRef {
  /** Storage key of the picture the reader gets (rotated, resized, compressed). */
  key: string;
  /** Storage key of exactly what the phone uploaded. Never deleted, never overwritten. */
  originalKey: string;
  mime: string;
  bytes: number;
  width?: number;
  height?: number;
  /** dHash of the processed picture, for the duplicate warning. */
  pHash?: string;
  /** Set when this file is one half of a two-page photo. */
  page?: 1 | 2;
  /** Key of a file uploaded in the last week that looks like the same page. */
  duplicateOf?: string;
  /** When the worker has not run yet. */
  pending?: boolean;
}

export const INTAKE_MAX_FILES = 20;
/** What a phone may upload, before the worker shrinks it. */
export const INTAKE_MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
/** What the reader is given — docs/13 §6 keeps one image under 1.5 MB. */
export const INTAKE_TARGET_BYTES = 1_500_000;
export const INTAKE_LONG_EDGE = 2000;

export const INTAKE_MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

/** Duplicate warnings look back this far (docs/07 §2.2). */
export const INTAKE_DUPLICATE_WINDOW_DAYS = 7;
