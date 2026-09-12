import { createHash } from "node:crypto";
import type { PrismaClient } from "../../generated/client";

/**
 * `POST /api/internal/intake/photo` — the picture arrives before the reading does (docs/13 §7.1).
 *
 * Two calls rather than one because a phone in a kitchen uploads a 1.5 MB photo on one bar of
 * signal: the upload either finishes or it does not, and the reading that follows is a few hundred
 * bytes that can be retried on its own. The original bytes are stored once and never touched again
 * (docs/07 §1) — they are what a parent comes back to in a month when they disagree with a label.
 *
 * Sending the same picture twice returns the first row: `sha256` makes that free, and an evening
 * where the owner taps send twice must not become two batches.
 */

type Db = PrismaClient;

export interface SaveChatPhotoInput {
  studentId?: string | null;
  key: string;
  mime: string;
  bytes: Uint8Array;
  now?: Date;
}

export interface SaveChatPhotoResult {
  photoId: string;
  sha256: string;
  bytes: number;
  duplicate: boolean;
}

export function sha256Of(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function saveChatPhoto(
  db: Db,
  input: SaveChatPhotoInput,
): Promise<SaveChatPhotoResult> {
  const sha256 = sha256Of(input.bytes);
  const existing = await db.chatIntakePhoto.findFirst({
    where: { sha256, usedBy: null, studentId: input.studentId ?? null },
    orderBy: { createdAt: "desc" },
  });
  if (existing)
    return {
      photoId: existing.id,
      sha256,
      bytes: existing.bytes,
      duplicate: true,
    };
  const row = await db.chatIntakePhoto.create({
    data: {
      studentId: input.studentId ?? null,
      key: input.key,
      mime: input.mime,
      bytes: input.bytes.byteLength,
      sha256,
    },
  });
  return { photoId: row.id, sha256, bytes: row.bytes, duplicate: false };
}
