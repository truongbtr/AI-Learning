/**
 * Xưởng Tiếng's side of the database (pha 12, ADR-24): which syllables a child meets tonight, what
 * one meeting changes, and what the Sổ tiếng and Phố Chữ show.
 *
 * `Syllable` is content. A meeting writes two things and only through their own services:
 *   - `LexemeProgress` (kind=syllable) — the Leitner memory, via `recordLexemeMeeting`;
 *   - `Evidence` for the syllable's VIET.HV.* skill, via `commitEvidence` — so mastery keeps moving
 *     the way it always has, with the error code the build revealed (docs/04 §11.1).
 * The child's device only says what was built or picked; right or wrong is decided here.
 */
import {
  type BuildItem,
  buildErrorCode,
  buildRound,
  type GameSyllable,
  type PairItem,
  pairRound,
  SYLLABLE_BRICK_BOX,
  type SyllableGameId,
  type SyllableStats,
  seededRng,
  type Tone,
  type ToneItem,
  type TrainCar,
  toneErrorCode,
  toneRound,
  trainRound,
  vnDayDate,
  wordsDue,
} from "@mtct/core";
import type { PrismaClient } from "../../generated/client";
import { progressFor, recordLexemeMeeting } from "../lexeme/progress";
import { commitEvidence } from "../mastery/service";

type Db = PrismaClient;

const DAY_MS = 24 * 60 * 60 * 1000;
/** docs/08 pha 12: five syllables that are due, three new ones from what the class is on. */
export const DUE_PER_STATION = 5;
export const NEW_PER_STATION = 3;
/** How many first rounds lean on the syllables a child hears every day. */
const EVERYDAY_UNTIL_MET = 30;

/**
 * How much one game meeting weighs against a graded exercise (EXERCISE = 1.0). A build has three
 * slots of three tiles, so a lucky guess is rare; a two-card pair is a coin toss; the train only
 * ever reports what the child found.
 */
export const GAME_WEIGHT: Record<SyllableGameId, number> = {
  build: 0.6,
  split: 0.6,
  tone: 0.5,
  pair: 0.4,
  train: 0.4,
  read: 0.5,
};

/** Evidence notes start with this, so the meeting log can be read back for the unlock rules. */
export const EVIDENCE_NOTE_PREFIX = "xuong-tieng";

export interface PlayableSyllable extends GameSyllable {
  stableId: string;
  week: number;
  box: number;
  isNew: boolean;
}

function toGame(row: {
  id: string;
  stableId: string;
  text: string;
  onset: string;
  rime: string;
  tone: string;
  meaning: string;
  picture: unknown;
  week: number;
  skill: { code: string };
}): Omit<PlayableSyllable, "box" | "isNew"> {
  return {
    id: row.id,
    stableId: row.stableId,
    text: row.text,
    onset: row.onset,
    rime: row.rime,
    tone: row.tone as Tone,
    meaning: row.meaning,
    picture: row.picture ?? null,
    skillCode: row.skill.code,
    week: row.week,
  };
}

const SYLLABLE_SELECT = {
  id: true,
  stableId: true,
  text: true,
  onset: true,
  rime: true,
  tone: true,
  meaning: true,
  picture: true,
  week: true,
  everyday: true,
  position: true,
  skill: { select: { code: true } },
} as const;

/**
 * How far the class has got in the Tiếng Việt book: the latest VIET.HV skill in the last week of
 * the class diary, or the school calendar's week when the diary is quiet. Never below week 1.
 */
export async function classSyllableWeek(db: Db, className: string, now: Date): Promise<number> {
  const since = new Date(vnDayDate(now).getTime() - 7 * DAY_MS);
  const [lessons, week] = await Promise.all([
    db.diaryLesson.findMany({
      where: { diary: { className, date: { gte: since } } },
      select: { skillCodes: true },
    }),
    db.schoolWeek.findFirst({
      where: { dateFrom: { lte: now }, dateTo: { gte: now } },
      select: { weekNo: true },
    }),
  ]);
  const codes = [...new Set(lessons.flatMap((l) => l.skillCodes))].filter((c) =>
    c.startsWith("VIET.HV."),
  );
  const fromDiary = codes.length
    ? await db.skill.aggregate({ where: { code: { in: codes } }, _max: { expectedWeek: true } })
    : null;
  return Math.max(1, week?.weekNo ?? 1, fromDiary?._max.expectedWeek ?? 0);
}

/**
 * The syllables for one station: five that are due (most overdue first), then three new ones —
 * the everyday syllables while the child is new to the workshop, then the book's order up to where
 * the class is, the station's own skill first. Topped up from what is nearest its day when too
 * little is due, so a round is never two syllables long.
 */
export async function syllablesForStation(
  db: Db,
  studentId: string,
  opts: {
    skillCodes?: string[];
    now?: Date;
    classWeek?: number;
    due?: number;
    fresh?: number;
    /** Syllables already on tonight's other station. */
    exclude?: string[];
  } = {},
): Promise<PlayableSyllable[]> {
  const now = opts.now ?? new Date();
  const dueCount = opts.due ?? DUE_PER_STATION;
  const freshCount = opts.fresh ?? NEW_PER_STATION;
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { className: true },
  });
  const classWeek =
    opts.classWeek ?? (await classSyllableWeek(db, student?.className ?? "1B3", now));
  const exclude = new Set(opts.exclude ?? []);

  const progress = await progressFor(db, studentId, "syllable");
  const rows = await db.syllable.findMany({
    where: { isActive: true, skill: { isActive: true } },
    select: SYLLABLE_SELECT,
    orderBy: { position: "asc" },
  });
  const usable = rows.filter((r) => !exclude.has(r.id));
  const skills = new Set(opts.skillCodes ?? []);

  // what is due, among what the child has already met
  const met = usable
    .filter((r) => (progress.get(r.id)?.box ?? 0) > 0)
    .map((r) => {
      const p = progress.get(r.id);
      return { wordId: r.id, box: p?.box ?? 0, dueAt: p?.dueAt ?? now, row: r };
    });
  const due = wordsDue(met, now, dueCount);

  // new ones: everyday first for a newcomer — even ahead of the class, since the child hears them
  // at home every day — then the station's skill, then the book up to where the class is
  const newcomer = progress.size < EVERYDAY_UNTIL_MET;
  const unseen = usable.filter(
    (r) => !progress.has(r.id) && (r.week <= classWeek || (newcomer && r.everyday)),
  );
  const rank = (r: (typeof rows)[number]) =>
    (newcomer && r.everyday ? 0 : 10) +
    (skills.size > 0 && skills.has(r.skill.code) ? 0 : 1) +
    // the latest lessons first: what the class did this week is what the child needs tonight
    (classWeek - r.week) * 0.01;
  const fresh = unseen
    .sort((a, b) => rank(a) - rank(b) || a.position - b.position)
    .slice(0, freshCount + Math.max(0, dueCount - due.length));

  const chosen = [...due.map((d) => d.row), ...fresh];
  // still short: bring forward whatever is closest to its day
  const target = dueCount + freshCount;
  if (chosen.length < target) {
    const have = new Set(chosen.map((c) => c.id));
    const nearest = met
      .filter((m) => !have.has(m.wordId))
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
      .slice(0, target - chosen.length)
      .map((m) => m.row);
    chosen.push(...nearest);
  }

  return chosen.map((r) => {
    const box = progress.get(r.id)?.box ?? 0;
    return { ...toGame(r), box, isNew: box === 0 };
  });
}

/** Every active syllable as game data — for the tone wheel's pictures and the train's answers. */
export async function syllableDictionary(
  db: Db,
  opts: { maxWeek?: number } = {},
): Promise<PlayableSyllable[]> {
  const rows = await db.syllable.findMany({
    where: {
      isActive: true,
      skill: { isActive: true },
      ...(opts.maxWeek ? { week: { lte: opts.maxWeek } } : {}),
    },
    select: SYLLABLE_SELECT,
    orderBy: { position: "asc" },
  });
  return rows.map((r) => ({ ...toGame(r), box: 0, isNew: false }));
}

/** The pieces the dictionary teaches, for real distractors. */
export async function syllablePieces(db: Db): Promise<{ onsets: string[]; rimes: string[] }> {
  const rows = await db.syllable.findMany({
    where: { isActive: true },
    select: { onset: true, rime: true },
    distinct: ["onset", "rime"],
  });
  return {
    onsets: [...new Set(rows.map((r) => r.onset).filter(Boolean))].sort(),
    rimes: [...new Set(rows.map((r) => r.rime))].sort(),
  };
}

// ------------------------------------------------------------------ one meeting

/** What the child did with one syllable, as the device reports it. */
export type SyllableAnswer =
  | { game: "build" | "split"; onset: string; rime: string; tone: Tone }
  | { game: "tone"; tone: Tone }
  | { game: "pair"; picked: string; errorCode: string }
  | { game: "train" }
  /** Read aloud and heard — by the microphone, or by a parent ("cùng ba mẹ"). A reading the
   * microphone missed is never sent: a machine that did not hear is not a child who could not read. */
  | { game: "read" };

export interface SyllableMeetingResult {
  correct: boolean;
  errorCode: string | null;
  promoted: boolean;
  box: number;
  /** The syllable just reached the brick box — a brick goes on Phố Chữ's pile. */
  brick: boolean;
}

/** Right or wrong, and why — decided from the syllable, never taken from the device. */
export function judgeSyllable(
  s: { text: string; onset: string; rime: string; tone: Tone },
  answer: SyllableAnswer,
): { correct: boolean; errorCode: string | null } {
  switch (answer.game) {
    case "build":
    case "split": {
      const code = buildErrorCode(s, answer);
      return { correct: code === null, errorCode: code };
    }
    case "tone":
      return answer.tone === s.tone
        ? { correct: true, errorCode: null }
        : { correct: false, errorCode: toneErrorCode(s.tone, answer.tone) };
    case "pair":
      return answer.picked === s.text
        ? { correct: true, errorCode: null }
        : { correct: false, errorCode: answer.errorCode };
    case "train":
      // the train only reports syllables the child found; nonsense never reaches the server
      return { correct: true, errorCode: null };
    case "read":
      return { correct: true, errorCode: null };
  }
}

/** Pair codes the device may name — anything else is refused, not stored. */
const PAIR_CODES = new Set([
  "nham_b_d",
  "nham_ch_tr",
  "nham_s_x",
  "nham_ng_ngh",
  "nham_c_k_q",
  "nham_hoi_nga",
]);

export class SyllableMeetingError extends Error {}

/**
 * One meeting with one syllable, from one game: the Leitner row, and one piece of evidence for the
 * syllable's skill. Nothing else is written.
 */
export async function recordSyllableMeeting(
  db: Db,
  m: { studentId: string; syllableId: string; answer: SyllableAnswer; now?: Date },
): Promise<SyllableMeetingResult> {
  const now = m.now ?? new Date();
  const syllable = await db.syllable.findUnique({
    where: { id: m.syllableId },
    select: {
      id: true,
      stableId: true,
      text: true,
      onset: true,
      rime: true,
      tone: true,
      isActive: true,
      skillId: true,
    },
  });
  if (!syllable?.isActive) throw new SyllableMeetingError("Không tìm thấy tiếng");
  if (m.answer.game === "pair" && !PAIR_CODES.has(m.answer.errorCode))
    throw new SyllableMeetingError("Mã lỗi cặp dễ lẫn không hợp lệ");

  const verdict = judgeSyllable({ ...syllable, tone: syllable.tone as Tone }, m.answer);
  const before = (await progressFor(db, m.studentId, "syllable", [syllable.id])).get(syllable.id);
  const result = await recordLexemeMeeting(db, {
    studentId: m.studentId,
    kind: "syllable",
    lexemeId: syllable.id,
    correct: verdict.correct,
    game: m.answer.game,
    now,
  });

  await commitEvidence(db, {
    studentId: m.studentId,
    skillId: syllable.skillId,
    source: "EXERCISE",
    outcome: verdict.correct ? "CORRECT" : "INCORRECT",
    score: verdict.correct ? 1 : 0,
    difficulty: 2,
    errorCode: verdict.errorCode,
    weightFactor: GAME_WEIGHT[m.answer.game],
    observedAt: now,
    // the meeting log the unlock rules read back: game, syllable, and the box it was in before
    note: `${EVIDENCE_NOTE_PREFIX}:${m.answer.game}:${syllable.stableId}:box${before?.box ?? 0}`,
  });

  return {
    ...verdict,
    promoted: result.promoted,
    box: result.box,
    brick: (before?.box ?? 0) < SYLLABLE_BRICK_BOX && result.box >= SYLLABLE_BRICK_BOX,
  };
}

// ------------------------------------------------------------------ unlocks, bricks, the book

/** Everything `unlockedGames` needs about one child. */
export async function syllableStats(
  db: Db,
  studentId: string,
  now = new Date(),
): Promise<SyllableStats> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { className: true },
  });
  const [met, steady, builds, classWeek] = await Promise.all([
    db.lexemeProgress.count({ where: { studentId, kind: "syllable", box: { gt: 0 } } }),
    db.lexemeProgress.count({ where: { studentId, kind: "syllable", box: { gte: 2 } } }),
    db.evidence.findMany({
      where: {
        studentId,
        note: { startsWith: `${EVIDENCE_NOTE_PREFIX}:build:` },
        observedAt: { gte: new Date(now.getTime() - 30 * DAY_MS) },
      },
      orderBy: { observedAt: "desc" },
      take: 40,
      select: { note: true, outcome: true },
    }),
    classSyllableWeek(db, student?.className ?? "1B3", now),
  ]);
  const known = builds.filter((b) => Number(/:box(\d+)$/.exec(b.note ?? "")?.[1] ?? 0) >= 2);
  return {
    met,
    steady,
    buildAtBox2: {
      seen: known.length,
      correct: known.filter((b) => b.outcome === "CORRECT").length,
    },
    classWeek,
  };
}

/** Syllables at the brick box — Phố Chữ's pile, and the Sổ tiếng's grid. */
export async function syllableBricks(db: Db, studentId: string): Promise<number> {
  return db.lexemeProgress.count({
    where: { studentId, kind: "syllable", box: { gte: SYLLABLE_BRICK_BOX } },
  });
}

/** How many syllables this child met today — "a round was played" for a station. */
export async function syllablesMetSince(db: Db, studentId: string, since: Date): Promise<number> {
  return db.lexemeProgress.count({
    where: { studentId, kind: "syllable", lastSeenAt: { gte: since } },
  });
}

export interface SyllableBookEntry {
  stableId: string;
  text: string;
  meaning: string;
  picture: unknown;
  box: number;
  seen: number;
}

export interface SyllableBook {
  /** Grouped by the SGK lesson group (the skill), in the book's order. */
  groups: { skillCode: string; nameVi: string; syllables: SyllableBookEntry[] }[];
  /** Syllables at the brick box — the only number the page shows as "thuộc". */
  known: number;
  /** Met but not yet at the brick box. */
  practising: number;
}

/**
 * "Sổ tiếng": the syllables a child keeps (box ≥ 3, one brick each in Phố Chữ), by lesson group.
 * No score, no percentage, no empty slots for what is still to come.
 */
export async function syllableBook(db: Db, studentId: string): Promise<SyllableBook> {
  const progress = await progressFor(db, studentId, "syllable");
  const ids = [...progress.keys()];
  if (ids.length === 0) return { groups: [], known: 0, practising: 0 };
  const rows = await db.syllable.findMany({
    where: { id: { in: ids } },
    orderBy: { position: "asc" },
    select: {
      id: true,
      stableId: true,
      text: true,
      meaning: true,
      picture: true,
      skill: { select: { code: true, nameVi: true, order: true } },
    },
  });
  const groups = new Map<string, SyllableBook["groups"][number] & { order: number }>();
  let practising = 0;
  let known = 0;
  for (const r of rows) {
    const p = progress.get(r.id);
    const box = p?.box ?? 0;
    if (box <= 0) continue;
    if (box < SYLLABLE_BRICK_BOX) {
      practising++;
      continue;
    }
    known++;
    const g = groups.get(r.skill.code) ?? {
      skillCode: r.skill.code,
      nameVi: r.skill.nameVi,
      order: r.skill.order,
      syllables: [],
    };
    g.syllables.push({
      stableId: r.stableId,
      text: r.text,
      meaning: r.meaning,
      picture: r.picture,
      box,
      seen: p?.seen ?? 0,
    });
    groups.set(r.skill.code, g);
  }
  return {
    groups: [...groups.values()]
      .sort((a, b) => a.order - b.order)
      .map(({ order: _order, ...g }) => g),
    known,
    practising,
  };
}

// ------------------------------------------------------------------ a station, ready to play

export type SyllableRound =
  | { game: "build" | "split"; items: BuildItem[] }
  | { game: "tone"; items: ToneItem[] }
  | { game: "pair"; items: PairItem[] }
  | { game: "train"; cars: TrainCar[] }
  | { game: "read"; items: GameSyllable[] };

export interface SyllableStationPayload {
  games: SyllableGameId[];
  rounds: SyllableRound[];
  /** The child already finished this station today (its star is in the ledger). */
  done: boolean;
}

/** Syllables a round shows: 6 by default, 8 at most (docs/08 pha 12: 6–8 a round). */
export const ROUND_SIZE = 6;

/** A stable number from a string, so a reload deals the same tiles. */
function seedOf(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ (ch.codePointAt(0) ?? 0), 16777619);
  return h >>> 0;
}

/**
 * Everything one Xưởng Tiếng station needs, built when the child opens it: tonight's syllables and
 * a round for each of its two games. A game that cannot be dealt from what is at hand (no pair in
 * the syllables, no carriage the class can fill) quietly becomes Lắp tiếng instead.
 */
export async function syllableStation(
  db: Db,
  studentId: string,
  opts: {
    sessionId: string;
    order: number;
    games: SyllableGameId[];
    skills: string[];
    now?: Date;
    exclude?: string[];
  },
): Promise<SyllableStationPayload & { syllableIds: string[] }> {
  const now = opts.now ?? new Date();
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { className: true },
  });
  const classWeek = await classSyllableWeek(db, student?.className ?? "1B3", now);
  const syllables = await syllablesForStation(db, studentId, {
    skillCodes: opts.skills,
    now,
    classWeek,
    exclude: opts.exclude,
  });
  const done = Boolean(
    await db.starLedger.findFirst({
      where: {
        studentId,
        refType: "SyllableStation",
        refId: `${opts.sessionId}-${opts.order}`,
      },
      select: { id: true },
    }),
  );
  const rng = seededRng(seedOf(`${opts.sessionId}-${opts.order}-${vnDayDate(now).getTime()}`));
  const pieces = await syllablePieces(db);
  const needsDictionary = opts.games.some((g) => g === "tone" || g === "train");
  const dictionary = needsDictionary ? await syllableDictionary(db) : [];
  const hoiNga = await db.errorStat.findFirst({
    where: { studentId, errorCode: "nham_hoi_nga", count7d: { gt: 0 } },
    select: { id: true },
  });
  const size = Math.min(8, Math.max(ROUND_SIZE, syllables.length));

  const rounds: SyllableRound[] = [];
  for (const game of opts.games) {
    const take = syllables.slice(0, size);
    let round: SyllableRound | null = null;
    if (game === "build" || game === "split") {
      round = { game, items: buildRound(take, pieces, { rng, split: game === "split" }) };
    } else if (game === "pair") {
      // pairs only exist for some syllables: look through all of tonight's before giving up
      const items = pairRound(syllables, rng).slice(0, size);
      round = items.length >= 3 ? { game, items } : null;
    } else if (game === "tone") {
      const items = toneRound(syllables, dictionary, {
        rng,
        preferHoiNga: Boolean(hoiNga),
        size: 4,
      });
      round = items.length >= 2 ? { game, items } : null;
    } else if (game === "train") {
      const cars = trainRound(dictionary, {
        rng,
        allowed: (s) => (s as PlayableSyllable).week <= classWeek,
        onsets: pieces.onsets,
      });
      round = cars.length > 0 ? { game, cars } : null;
    } else if (game === "read") {
      round = { game, items: take.slice(0, 4) };
    }
    rounds.push(round ?? { game: "build", items: buildRound(take, pieces, { rng }) });
  }
  // two games of the same kind after a fallback: turn the second into pairs or reading instead
  if (rounds.length === 2 && rounds[0]?.game === rounds[1]?.game) {
    const items = pairRound(syllables, rng).slice(0, size);
    rounds[1] =
      items.length >= 3 ? { game: "pair", items } : { game: "read", items: syllables.slice(0, 4) };
  }

  return {
    games: rounds.map((r) => r.game),
    rounds,
    done,
    syllableIds: syllables.map((s) => s.id),
  };
}
