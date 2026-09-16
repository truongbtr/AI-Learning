/**
 * The vocabulary games' side of the database (pha 11, ADR-22): which words a child meets tonight,
 * and what one meeting changes.
 *
 * `Word` is content (written by `content:import`); `LexemeProgress` (kind=word) is the child's own
 * memory of a word and is written **only** through `recordLexemeMeeting`, by a child actually playing. `ops/requests` may not
 * touch it and `ops:export` only reads it (docs/14).
 */
import { type SchedulableWord, vocabProgress, wordsDue } from "@mtct/core";
import type { PrismaClient } from "../../generated/client";
import { progressFor, recordLexemeMeeting } from "../lexeme/progress";

type Db = PrismaClient;

export interface PlayableWord {
  wordId: string;
  stableId: string;
  en: string;
  vi: string;
  /** ImageRef, drawn by the same Picture component as the exercises. */
  picture: unknown;
  phraseEn: string;
  phraseVi: string;
  skillCode: string;
  box: number;
  /** The word has never been met. */
  isNew: boolean;
}

/**
 * The words for one vocabulary station: what is due for these skills, most overdue first, topped
 * up with words the child has never met when nothing is waiting.
 *
 * A station needs a handful of words to play with (six pictures on screen), so `count` is the size
 * of the round rather than "everything due".
 */
export async function wordsForStation(
  db: Db,
  studentId: string,
  opts: { skillCodes: string[]; count?: number; now?: Date },
): Promise<PlayableWord[]> {
  const now = opts.now ?? new Date();
  const count = opts.count ?? 6;
  const rows = await db.word.findMany({
    where: {
      isActive: true,
      skill: { code: { in: opts.skillCodes }, isActive: true },
    },
    select: {
      id: true,
      stableId: true,
      en: true,
      vi: true,
      picture: true,
      phraseEn: true,
      phraseVi: true,
      skill: { select: { code: true } },
    },
  });
  const progress = await progressFor(
    db,
    studentId,
    "word",
    rows.map((r) => r.id),
  );

  const schedulable: (SchedulableWord & { row: (typeof rows)[number] })[] = rows.map((row) => {
    const p = progress.get(row.id);
    return {
      wordId: row.id,
      box: p?.box ?? 0,
      // never met = due now, so a first evening has something to play with
      dueAt: p?.dueAt ?? now,
      lastGame: p?.lastGame ?? null,
      row,
    };
  });

  const chosen = wordsDue(schedulable, now, count);
  // A round with two words is not a game: if little is due, bring forward the words closest to
  // their day rather than showing an empty harbour.
  if (chosen.length < count) {
    const picked = new Set(chosen.map((c) => c.wordId));
    const rest = schedulable
      .filter((s) => !picked.has(s.wordId))
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
      .slice(0, count - chosen.length);
    chosen.push(...rest);
  }

  return chosen.map(({ row, box }) => ({
    wordId: row.id,
    stableId: row.stableId,
    en: row.en,
    vi: row.vi,
    picture: row.picture,
    phraseEn: row.phraseEn,
    phraseVi: row.phraseVi,
    skillCode: row.skill.code,
    box,
    isNew: box === 0,
  }));
}

export interface WordMeeting {
  studentId: string;
  wordId: string;
  correct: boolean;
  game: string;
  now?: Date;
}

export interface WordMeetingResult {
  box: number;
  /** The word moved up a box just now — the harbour boat comes in for this. */
  promoted: boolean;
  dueAt: Date;
  seen: number;
}

/** One meeting with one word, from one game. Never writes anything else. */
export async function recordWordMeeting(db: Db, m: WordMeeting): Promise<WordMeetingResult> {
  const result = await recordLexemeMeeting(db, {
    studentId: m.studentId,
    kind: "word",
    lexemeId: m.wordId,
    correct: m.correct,
    game: m.game,
    now: m.now,
  });
  return { box: result.box, promoted: result.promoted, dueAt: result.dueAt, seen: result.seen };
}

/** How many of this skill's words the child has met since `since` — "a round was played". */
export async function wordsMetSince(
  db: Db,
  studentId: string,
  skillCode: string,
  since: Date,
): Promise<number> {
  const ids = await db.word.findMany({
    where: { skill: { code: skillCode } },
    select: { id: true },
  });
  if (ids.length === 0) return 0;
  return db.lexemeProgress.count({
    where: {
      studentId,
      kind: "word",
      lastSeenAt: { gte: since },
      lexemeId: { in: ids.map((w) => w.id) },
    },
  });
}

export interface WordBookEntry {
  stableId: string;
  en: string;
  vi: string;
  picture: unknown;
  phraseEn: string;
  box: number;
  seen: number;
}

export interface WordBook {
  /** Grouped by skill, in the order of the skill map. */
  topics: {
    skillCode: string;
    nameVi: string;
    words: WordBookEntry[];
    met: number;
    known: number;
    total: number;
  }[];
  met: number;
  known: number;
  total: number;
}

/**
 * "Sổ từ": every word the child has met, by topic. No score, no percentage and no comparison
 * between the two children — just the words, their pictures, and a way to hear them again.
 */
export async function wordBook(db: Db, studentId: string): Promise<WordBook> {
  const rows = await db.word.findMany({
    where: { isActive: true, skill: { isActive: true } },
    orderBy: [{ skill: { order: "asc" } }, { stableId: "asc" }],
    select: {
      stableId: true,
      en: true,
      vi: true,
      picture: true,
      phraseEn: true,
      id: true,
      skill: { select: { code: true, nameVi: true, order: true } },
    },
  });
  const progress = await progressFor(db, studentId, "word");

  const byTopic = new Map<string, WordBook["topics"][number]>();
  for (const row of rows) {
    const p = progress.get(row.id);
    const topic = byTopic.get(row.skill.code) ?? {
      skillCode: row.skill.code,
      nameVi: row.skill.nameVi,
      words: [],
      met: 0,
      known: 0,
      total: 0,
    };
    topic.total++;
    // Only words the child has actually met appear: an empty page of unknown words is not a book.
    if ((p?.box ?? 0) > 0) {
      topic.words.push({
        stableId: row.stableId,
        en: row.en,
        vi: row.vi,
        picture: row.picture,
        phraseEn: row.phraseEn,
        box: p?.box ?? 0,
        seen: p?.seen ?? 0,
      });
    }
    byTopic.set(row.skill.code, topic);
  }

  const topics = [...byTopic.values()]
    .map((t) => {
      const counts = vocabProgress(t.words);
      return { ...t, met: counts.met, known: counts.known };
    })
    .filter((t) => t.words.length > 0);

  return {
    topics,
    met: topics.reduce((n, t) => n + t.met, 0),
    known: topics.reduce((n, t) => n + t.known, 0),
    total: rows.length,
  };
}
