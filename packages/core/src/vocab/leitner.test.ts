import { describe, expect, it } from "vitest";
import { BOX_DAYS, reviewWord, TOP_BOX, vocabProgress, wordsDue } from "./leitner";

const at = (iso: string) => new Date(iso);
const fresh = { box: 0, dueAt: at("2026-09-16T10:00:00Z"), seen: 0, known: 0, streak: 0 };

describe("the Leitner ladder for a word", () => {
  it("meets a new word and puts it in tomorrow's box", () => {
    const after = reviewWord(fresh, { correct: true, now: at("2026-09-16T19:00:00Z") });
    expect(after.box).toBe(1);
    expect(after.seen).toBe(1);
    expect(after.known).toBe(1);
    expect(after.dueAt.toISOString().slice(0, 10)).toBe("2026-09-17");
  });

  it("climbs one box a day: 1 → 3 → 7 → 14 → 30 days", () => {
    let memory = { ...fresh };
    const days = ["16", "17", "20", "27"];
    const expected = [1, 2, 3, 4];
    days.forEach((day, i) => {
      memory = reviewWord(memory, { correct: true, now: at(`2026-09-${day}T19:00:00Z`) });
      expect(memory.box).toBe(expected[i]);
    });
    // and the wait grows with the box
    expect(BOX_DAYS[memory.box]).toBe(14);
  });

  it("does not let a word climb twice in one evening", () => {
    const evening = at("2026-09-16T19:00:00Z");
    const first = reviewWord(fresh, { correct: true, now: evening });
    const second = reviewWord(first, { correct: true, now: at("2026-09-16T19:04:00Z") });
    expect(second.box).toBe(first.box);
    // the practice still counts
    expect(second.seen).toBe(2);
    expect(second.known).toBe(2);
  });

  it("brings a forgotten word back tomorrow instead of losing it", () => {
    const high = { ...fresh, box: 4, streak: 6, seen: 12, known: 10 };
    const after = reviewWord(high, { correct: false, now: at("2026-09-16T19:00:00Z") });
    expect(after.box).toBe(1);
    expect(after.streak).toBe(0);
    expect(after.known).toBe(10); // nothing is taken away
    expect(after.seen).toBe(13);
  });

  it("stops at the top box", () => {
    let memory = { ...fresh, box: TOP_BOX, lastSeenAt: at("2026-09-01T19:00:00Z") };
    memory = reviewWord(memory, { correct: true, now: at("2026-10-01T19:00:00Z") });
    expect(memory.box).toBe(TOP_BOX);
    expect(BOX_DAYS[TOP_BOX]).toBe(30);
  });
});

describe("choosing tonight's words", () => {
  const now = at("2026-09-16T19:00:00Z");
  const words = [
    { wordId: "new-1", box: 0, dueAt: at("2026-09-16T00:00:00Z") },
    { wordId: "late", box: 2, dueAt: at("2026-09-13T00:00:00Z") },
    { wordId: "today", box: 1, dueAt: at("2026-09-16T08:00:00Z") },
    { wordId: "later", box: 3, dueAt: at("2026-09-30T00:00:00Z") },
  ];

  it("takes the most overdue first and leaves tomorrow's words alone", () => {
    expect(wordsDue(words, now, 2).map((w) => w.wordId)).toEqual(["late", "today"]);
  });

  it("only hands out a new word once the started ones are dealt with", () => {
    expect(wordsDue(words, now, 3).map((w) => w.wordId)).toEqual(["late", "today", "new-1"]);
  });

  it("gives nothing when nothing is due", () => {
    expect(wordsDue([{ wordId: "x", box: 3, dueAt: at("2026-09-30T00:00:00Z") }], now, 5)).toEqual(
      [],
    );
  });
});

describe("what the Sổ từ can say", () => {
  it("counts met, learning and known — and never a score", () => {
    expect(vocabProgress([{ box: 0 }, { box: 1 }, { box: 4 }, { box: 5 }])).toEqual({
      met: 3,
      learning: 1,
      known: 2,
    });
  });
});
