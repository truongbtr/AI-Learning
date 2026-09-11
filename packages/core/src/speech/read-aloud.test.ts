import { describe, expect, it } from "vitest";
import { matchReadAloud, normaliseSpoken, sameWord } from "./read-aloud";

describe("what counts as the same word", () => {
  it("forgives a northern accent", () => {
    expect(sameWord("trâu", "châu")).toBe(true); // tr → ch
    expect(sameWord("sáu", "xáu")).toBe(true); // s → x
    expect(sameWord("rổ", "dổ")).toBe(true); // r → d
    expect(sameWord("bàn", "bàng")).toBe(true); // final n → ng
  });

  it("does not forgive a missing tone — that is the reading mistake itself", () => {
    expect(sameWord("bà", "ba")).toBe(false);
    expect(sameWord("cá", "cà")).toBe(false);
  });

  it("ignores case and punctuation", () => {
    expect(normaliseSpoken("Nam và Hà, ca hát!")).toEqual(["nam", "và", "hà", "ca", "hát"]);
  });
});

describe("marking a read-aloud", () => {
  it("gives full marks for a clean read", () => {
    const r = matchReadAloud(["bà", "bế", "bé"], "bà bế bé", { seconds: 6 });
    expect(r.accuracy).toBe(1);
    expect(r.verdict).toBe("good");
    expect(r.missed).toEqual([]);
    expect(r.wordsPerMinute).toBe(30);
  });

  it("finds the word that was skipped", () => {
    const r = matchReadAloud(["bà", "bế", "bé"], "bà bé");
    expect(r.missed).toEqual(["bế"]);
    expect(r.accuracy).toBeCloseTo(2 / 3);
    expect(r.verdict).toBe("partial");
  });

  it("keeps a false start out of the score", () => {
    const r = matchReadAloud(["cá", "cà"], "ờ cá cà");
    expect(r.accuracy).toBe(1);
    expect(r.extra).toEqual(["ờ"]);
  });

  it("asks for another go when almost nothing was read", () => {
    const r = matchReadAloud(["bà", "bế", "bé", "bê"], "ừ");
    expect(r.verdict).toBe("retry");
    expect(r.accuracy).toBeLessThan(0.5);
  });

  it("records what was heard instead, so a parent can see why", () => {
    const r = matchReadAloud(["bà"], "ba");
    expect(r.words[0]).toMatchObject({ word: "bà", ok: false, heardAs: "ba" });
  });

  it("works in English too, where only the letters matter", () => {
    const r = matchReadAloud(["the", "cat", "sat"], "The cat sat.", { lang: "en" });
    expect(r.accuracy).toBe(1);
  });

  it("says nothing was read when nothing was said", () => {
    const r = matchReadAloud(["bà", "bé"], "");
    expect(r.accuracy).toBe(0);
    expect(r.verdict).toBe("retry");
    expect(r.wordsPerMinute).toBeNull();
  });
});
