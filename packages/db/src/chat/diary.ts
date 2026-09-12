import { vnDayDate } from "@mtct/core";
import type { PrismaClient } from "../../generated/client";
import { saveClassDiary } from "../diary/save";

/**
 * `POST /api/internal/diary` — the Edi Parent post, pasted from the phone (docs/13 §7.1).
 *
 * It goes through the same pattern reader as the parent's own paste (docs/13 §4, ADR-10): the
 * "Thông tin" half of a teacher's post has a fixed shape, and a regular expression reads it in a
 * millisecond for nothing. What the patterns cannot place is queued for a reader as before, so the
 * line that failed is never silently lost.
 *
 * A `ChatBatch(DIARY)` row is written so the evening shows up on the dashboard next to the photos —
 * with no undo button, because a diary produces no evidence about the child: re-pasting the day
 * rewrites it, which is the correction that actually makes sense here.
 */

type Db = PrismaClient;

export interface ApplyChatDiaryInput {
  className?: string;
  date?: Date | null;
  text: string;
  now?: Date;
}

export interface ApplyChatDiaryResult {
  batchId: string;
  diaryId: string;
  date: string;
  lessons: number;
  homework: number;
  reminders: number;
  unmatched: string[];
  queuedForReading: boolean;
  confidence: number;
}

export async function applyChatDiary(
  db: Db,
  input: ApplyChatDiaryInput,
): Promise<ApplyChatDiaryResult> {
  const now = input.now ?? new Date();
  const className = input.className?.trim() || "1B3";
  const day = vnDayDate(input.date ?? now);

  const saved = await saveClassDiary(db, { className, date: day, rawText: input.text });

  const summary = [
    `nhật ký lớp ${className} ngày ${day.toISOString().slice(0, 10)}`,
    `${saved.lessons} bài học`,
    `${saved.homework} việc cô giao`,
  ].join(" · ");

  const batch = await db.chatBatch.create({
    data: {
      kind: "DIARY",
      status: "APPLIED",
      date: day,
      summary,
      itemCount: saved.lessons + saved.homework + saved.reminders,
      confidence: saved.confidence,
      resultRef: `ClassDiary:${saved.diaryId}`,
      heldReasons: saved.queuedForReading
        ? ["có dòng chưa đọc được bằng mẫu — đã đưa vào hàng chờ, mai có"]
        : [],
      heldCount: saved.unmatched.length,
      raw: { className, date: day.toISOString().slice(0, 10), text: input.text },
    },
  });

  return {
    batchId: batch.id,
    diaryId: saved.diaryId,
    date: day.toISOString().slice(0, 10),
    lessons: saved.lessons,
    homework: saved.homework,
    reminders: saved.reminders,
    unmatched: saved.unmatched,
    queuedForReading: saved.queuedForReading,
    confidence: saved.confidence,
  };
}
