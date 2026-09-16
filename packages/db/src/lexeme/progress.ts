/**
 * `LexemeProgress` — a child's memory of each English word (kind=word, pha 11) and each
 * Vietnamese syllable (kind=syllable, pha 12), on the one Leitner ladder of ADR-22.
 *
 * This is the only module that writes the table, and it is only ever called from a child actually
 * playing (`POST /api/kid/vocab`, `POST /api/kid/syllable`). `ops/requests` may not touch it,
 * `ops:export` only reads it, and the content importer never sees it.
 *
 * `lexemeId` points at `Word.id` or `Syllable.id` depending on `kind`; there is no foreign key
 * (one column cannot reference two tables), so reads join in memory. Content rows are never
 * deleted — only switched off — so a progress row never loses its meaning.
 */
import { reviewWord } from "@mtct/core";
import type { LexemeKind, PrismaClient } from "../../generated/client";

type Db = PrismaClient;

export type { LexemeKind };

export interface LexemeProgressRow {
  lexemeId: string;
  box: number;
  dueAt: Date;
  seen: number;
  known: number;
  streak: number;
  lastSeenAt: Date | null;
  lastGame: string | null;
}

/** Progress for these lexemes, keyed by id. Lexemes never met are simply absent. */
export async function progressFor(
  db: Db,
  studentId: string,
  kind: LexemeKind,
  lexemeIds?: string[],
): Promise<Map<string, LexemeProgressRow>> {
  const rows = await db.lexemeProgress.findMany({
    where: { studentId, kind, ...(lexemeIds ? { lexemeId: { in: lexemeIds } } : {}) },
    select: {
      lexemeId: true,
      box: true,
      dueAt: true,
      seen: true,
      known: true,
      streak: true,
      lastSeenAt: true,
      lastGame: true,
    },
  });
  return new Map(rows.map((r) => [r.lexemeId, r]));
}

export interface LexemeMeeting {
  studentId: string;
  kind: LexemeKind;
  lexemeId: string;
  correct: boolean;
  game: string;
  now?: Date;
}

export interface LexemeMeetingResult {
  box: number;
  /** Moved up a box just now — a boat comes in, or a brick goes on the pile. */
  promoted: boolean;
  dueAt: Date;
  seen: number;
  known: number;
}

/** One meeting with one lexeme, from one game. Writes that one row and nothing else. */
export async function recordLexemeMeeting(db: Db, m: LexemeMeeting): Promise<LexemeMeetingResult> {
  const now = m.now ?? new Date();
  const key = { studentId: m.studentId, kind: m.kind, lexemeId: m.lexemeId };
  const before = await db.lexemeProgress.findUnique({
    where: { studentId_kind_lexemeId: key },
  });
  const after = reviewWord(
    {
      box: before?.box ?? 0,
      dueAt: before?.dueAt ?? now,
      seen: before?.seen ?? 0,
      known: before?.known ?? 0,
      streak: before?.streak ?? 0,
      lastSeenAt: before?.lastSeenAt ?? null,
    },
    { correct: m.correct, now, game: m.game },
  );
  const data = {
    box: after.box,
    dueAt: after.dueAt,
    seen: after.seen,
    known: after.known,
    streak: after.streak,
    lastSeenAt: after.lastSeenAt ?? now,
    lastGame: m.game,
  };
  await db.lexemeProgress.upsert({
    where: { studentId_kind_lexemeId: key },
    create: { ...key, ...data },
    update: data,
  });
  return {
    box: after.box,
    promoted: after.box > (before?.box ?? 0),
    dueAt: after.dueAt,
    seen: after.seen,
    known: after.known,
  };
}
