import { KNOWN_BOX } from "@mtct/core";
import { afterAll, beforeAll, describe, expect, it, type TestContext } from "vitest";
import {
  createTempStudent,
  databaseReachable,
  disconnectTestDb,
  removeTempStudent,
  type TempStudent,
  testDb,
} from "../test-db";
import { recordWordMeeting, wordBook, wordsForStation } from "./service";

/**
 * The vocabulary games against the real dictionary (pha 11, ADR-22).
 *
 * What these guard: a meeting moves the word and nothing else, the same word does not climb twice
 * in one evening, and the Sổ từ only ever shows words the child has actually met.
 */
const SKILL = "ESL.VOC.FAMILY";

describe("words and the Leitner ladder (integration, needs the imported lexicon)", () => {
  let ready = false;
  let student: TempStudent | null = null;

  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no lexicon in the database (run pnpm content:import)");
  };

  beforeAll(async () => {
    ready = await databaseReachable();
    if (!ready) return;
    const words = await testDb().word.count({ where: { skill: { code: SKILL } } });
    ready = words > 0;
    if (!ready) return;
    student = await createTempStudent("vocab");
  });

  afterAll(async () => {
    await removeTempStudent(student);
    await disconnectTestDb();
  });

  it("hands a child who has met nothing a round of new words", async (ctx) => {
    needDb(ctx);
    const words = await wordsForStation(testDb(), student?.id ?? "", {
      skillCodes: [SKILL],
      count: 6,
    });
    expect(words.length).toBe(6);
    expect(words.every((w) => w.isNew)).toBe(true);
    expect(words[0]?.picture).toBeTruthy();
    expect(words[0]?.phraseEn.length).toBeGreaterThan(3);
  });

  it("moves a word up a box, and writes nothing else", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const [word] = await wordsForStation(db, student?.id ?? "", { skillCodes: [SKILL], count: 1 });
    if (!word) throw new Error("no word");
    const attemptsBefore = await db.attempt.count();
    const evidenceBefore = await db.evidence.count();

    const first = await recordWordMeeting(db, {
      studentId: student?.id ?? "",
      wordId: word.wordId,
      correct: true,
      game: "listen-touch",
    });
    expect(first.box).toBe(1);
    expect(first.promoted).toBe(true);
    expect(first.dueAt.getTime()).toBeGreaterThan(Date.now());

    // the same evening, the same word: practice counts, the box waits for tomorrow
    const second = await recordWordMeeting(db, {
      studentId: student?.id ?? "",
      wordId: word.wordId,
      correct: true,
      game: "market",
    });
    expect(second.box).toBe(1);
    expect(second.promoted).toBe(false);
    expect(second.seen).toBe(2);

    // a game never touches a child's exercise history
    expect(await db.attempt.count()).toBe(attemptsBefore);
    expect(await db.evidence.count()).toBe(evidenceBefore);
  });

  it("brings a forgotten word back instead of marking it wrong", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const [word] = await wordsForStation(db, student?.id ?? "", { skillCodes: [SKILL], count: 6 });
    if (!word) throw new Error("no word");
    const key = { studentId: student?.id ?? "", kind: "word" as const, lexemeId: word.wordId };
    await db.lexemeProgress.upsert({
      where: { studentId_kind_lexemeId: key },
      create: {
        ...key,
        box: 4,
        seen: 9,
        known: 8,
        lastSeenAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      update: { box: 4, lastSeenAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    });
    const after = await recordWordMeeting(db, {
      studentId: student?.id ?? "",
      wordId: word.wordId,
      correct: false,
      game: "say-it",
    });
    expect(after.box).toBe(1);
    expect(after.promoted).toBe(false);
  });

  it("shows only met words in the Sổ từ, and no score", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const book = await wordBook(db, student?.id ?? "");
    expect(book.met).toBeGreaterThan(0);
    for (const topic of book.topics) {
      expect(topic.words.length).toBeGreaterThan(0);
      for (const w of topic.words) expect(w.box).toBeGreaterThan(0);
    }
    // a word at the top of the ladder counts as kept — that is what brings a boat in
    expect(book.known).toBeLessThanOrEqual(book.met);
    expect(KNOWN_BOX).toBe(4);
  });
});
