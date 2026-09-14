import { describe, expect, it } from "vitest";
import {
  checkPrintedVietnamese,
  graphemesOf,
  isSingleGrapheme,
  lessonNumberOf,
  lessonReachOf,
  splitTone,
  taughtUpTo,
  untaughtPartsOf,
} from "./tieng-viet-progression";

describe("what the class has met", () => {
  it("reads the lesson number out of a unit code", () => {
    expect(lessonNumberOf("KNTT-TV1-T1-B13")).toBe(13);
    expect(lessonNumberOf("KNTT-T1-B10")).toBeNull(); // maths, not hoc van
    expect(lessonReachOf(["KNTT-TV1-T1-B02", "KNTT-TV1-T1-B08"])).toBe(8);
    expect(lessonReachOf(undefined)).toBeNull();
  });

  it("bài 1 knows one letter and no tone", () => {
    const t = taughtUpTo(1);
    expect([...t.letters]).toEqual(["a"]);
    expect(t.tones.size).toBe(0);
  });

  it("bài 13 has the letters the class is on right now", () => {
    const t = taughtUpTo(13);
    for (const letter of [
      "a",
      "b",
      "c",
      "e",
      "ê",
      "o",
      "ô",
      "d",
      "đ",
      "ơ",
      "i",
      "k",
      "h",
      "l",
      "u",
      "ư",
    ])
      expect(t.letters.has(letter)).toBe(true);
    expect(t.letters.has("ch")).toBe(false); // bài 14
    expect([...t.tones].sort()).toEqual(["hoi", "huyen", "nang", "nga", "sac"]);
  });
});

describe("splitting a syllable", () => {
  it("takes the tone off but keeps the hat and the horn", () => {
    expect(splitTone("bà")).toEqual({ base: "ba", tone: "huyen" });
    expect(splitTone("cỡ")).toEqual({ base: "cơ", tone: "nga" });
    expect(splitTone("cỏ")).toEqual({ base: "co", tone: "hoi" });
    expect(splitTone("bê")).toEqual({ base: "bê", tone: null });
  });

  it("keeps digraphs together", () => {
    expect(graphemesOf("nghe")).toEqual(["ngh", "e"]);
    expect(graphemesOf("cho")).toEqual(["ch", "o"]);
    expect(graphemesOf("ba")).toEqual(["b", "a"]);
  });
});

describe("the phase-2 bugs this check exists for", () => {
  const bai1 = taughtUpTo(1);

  it('rejects "Nem" in a bài 1 exercise', () => {
    expect(untaughtPartsOf("Nem", bai1)).toEqual(['chữ "n"', 'chữ "e"', 'chữ "m"', 'vần "em"']);
  });

  it('rejects the huyền of "cà" four lessons before it is taught', () => {
    expect(untaughtPartsOf("cà", bai1)).toContain("dấu huyền");
    expect(untaughtPartsOf("cà", taughtUpTo(3))).toEqual([]);
  });

  it("accepts what the lesson really covers", () => {
    expect(untaughtPartsOf("ba", taughtUpTo(2))).toEqual([]);
    expect(untaughtPartsOf("bà", taughtUpTo(2))).toEqual([]);
    expect(untaughtPartsOf("dù", taughtUpTo(13))).toEqual([]);
    expect(untaughtPartsOf("chó", taughtUpTo(14))).toEqual([]);
  });

  it("holds a rime back until the rime lesson, even when both letters are known", () => {
    expect(untaughtPartsOf("tay", taughtUpTo(28))).toContain('vần "ay"'); // ay is bài 38
    expect(untaughtPartsOf("tay", taughtUpTo(38))).toEqual([]);
  });

  it("counts p as taught with ph (SGK tr.64 prints p – ph), so the p-rimes of bài 53–56 pass", () => {
    expect(untaughtPartsOf("đạp", taughtUpTo(25))).toContain('chữ "p"');
    expect(untaughtPartsOf("đạp", taughtUpTo(53))).toEqual([]);
    expect(untaughtPartsOf("búp", taughtUpTo(56))).toEqual([]);
  });

  it("lets a single letter through — picking a out of unknown letters is the bài 1 task", () => {
    expect(isSingleGrapheme("o")).toBe(true);
    expect(isSingleGrapheme("ngh")).toBe(true);
    expect(isSingleGrapheme("ba")).toBe(false);
    expect(checkPrintedVietnamese("choice a", "o", bai1)).toEqual([]);
  });

  it("names the field it found the problem in", () => {
    const issues = checkPrintedVietnamese("choice b", "Nam", bai1);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.where).toBe("choice b");
    expect(issues[0]?.word).toBe("Nam");
  });
});
