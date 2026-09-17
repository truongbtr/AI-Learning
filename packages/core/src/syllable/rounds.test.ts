import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { joinSyllable, ONSETS, splitSyllable, TONES, type Tone } from "./parts";
import {
  buildErrorCode,
  buildRound,
  confusableRimes,
  type GameSyllable,
  lookAlike,
  pairRound,
  SYLLABLE_GAMES,
  seededRng,
  stationGames,
  toneErrorCode,
  toneRound,
  trainRound,
  unlockedGames,
  writtenSyllable,
} from "./rounds";

/**
 * The round builders of Xưởng Tiếng (pha 12). The owner's three promises are tested against the
 * real dictionary, not a toy one: no syllable twice in a round, every distractor a real piece,
 * and the counts each game expects.
 */
const file = JSON.parse(
  readFileSync(join(__dirname, "../../../../content/lexicon/viet.json"), "utf8"),
) as {
  amDau: { amDau: string }[];
  van: { van: string }[];
  syllables: {
    id: string;
    tieng: string;
    amDau: string;
    van: string;
    thanh: Tone;
    nghia: string;
    tranh: unknown;
    skillCode: string;
  }[];
};
const DICT: GameSyllable[] = file.syllables.map((s) => ({
  id: s.id,
  text: s.tieng,
  onset: s.amDau,
  rime: s.van,
  tone: s.thanh,
  meaning: s.nghia,
  picture: s.tranh,
  skillCode: s.skillCode,
}));
const TABLES = { onsets: file.amDau.map((o) => o.amDau), rimes: file.van.map((v) => v.van) };
const REAL_ONSETS = new Set(TABLES.onsets);
const REAL_RIMES = new Set(TABLES.rimes);
const REAL_TONES = new Set<string>(TONES);
const byText = (t: string) => DICT.find((s) => s.text === t) as GameSyllable;

describe("the dictionary the rounds are built from", () => {
  it("has 600–800 syllables, and the first thirty are the ones heard every day", () => {
    expect(DICT.length).toBeGreaterThanOrEqual(600);
    expect(DICT.length).toBeLessThanOrEqual(800);
    const first = DICT.slice(0, 30).map((s) => s.text);
    for (const t of ["bà", "ba", "mẹ", "bé", "cá", "gà", "nhà", "thy", "thanh"])
      expect(first).toContain(t);
  });

  it("splits every syllable the way the file says", () => {
    for (const s of DICT) {
      expect(splitSyllable(s.text)).toEqual({ amDau: s.onset, van: s.rime, thanh: s.tone });
      expect(joinSyllable(s.onset, s.rime, s.tone)).toBe(s.text);
    }
  });
});

describe("lắp tiếng / tách tiếng", () => {
  const targets = ["bà", "cá", "anh", "quyển", "nghé", "trường", "mẹ", "khỏe"].map(byText);

  it("never repeats a syllable in a round, even when asked to", () => {
    const round = buildRound([...targets, byText("bà"), byText("cá")], TABLES, {
      rng: seededRng(1),
    });
    const ids = round.map((r) => r.syllable.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(round).toHaveLength(targets.length);
  });

  it("offers three real tiles a slot, the right one among them, and no repeats", () => {
    for (let seed = 1; seed <= 25; seed++) {
      for (const item of buildRound(targets, TABLES, { rng: seededRng(seed) })) {
        const s = item.syllable;
        if (s.onset) {
          expect(item.onsets).toHaveLength(3);
          expect(item.onsets).toContain(s.onset);
          expect(new Set(item.onsets).size).toBe(3);
          for (const o of item.onsets) expect(REAL_ONSETS.has(o)).toBe(true);
        } else {
          expect(item.onsets).toEqual([]);
        }
        expect(item.rimes).toHaveLength(3);
        expect(item.rimes).toContain(s.rime);
        expect(new Set(item.rimes).size).toBe(3);
        for (const r of item.rimes) expect(REAL_RIMES.has(r)).toBe(true);
        expect(item.tones).toHaveLength(3);
        expect(item.tones).toContain(s.tone);
        expect(new Set(item.tones).size).toBe(3);
        for (const t of item.tones) expect(REAL_TONES.has(t)).toBe(true);
      }
    }
  });

  it("reaches for the look-alikes first: b gets d, hỏi gets ngã", () => {
    const [ba] = buildRound([byText("bà")], TABLES, { rng: seededRng(3) });
    expect(ba?.onsets.some((o) => o === "d" || o === "đ")).toBe(true);
    const [khoe] = buildRound([byText("khỏe")], TABLES, { rng: seededRng(3) });
    expect(khoe?.tones).toContain("nga");
  });

  it("marks tách tiếng rounds so the word is on screen from the start", () => {
    const round = buildRound(targets, TABLES, { rng: seededRng(2), split: true });
    expect(round.every((r) => r.showWord)).toBe(true);
    expect(buildRound(targets, TABLES, { rng: seededRng(2) }).some((r) => r.showWord)).toBe(false);
  });

  it("only offers rime look-alikes that exist", () => {
    expect(confusableRimes("an", REAL_RIMES)).toEqual(expect.arrayContaining(["ăn", "ân", "ang"]));
    for (const r of TABLES.rimes)
      for (const c of confusableRimes(r, REAL_RIMES)) expect(REAL_RIMES.has(c)).toBe(true);
  });
});

describe("error codes for a build", () => {
  const ba = { onset: "b", rime: "a", tone: "huyen" as Tone };
  it("names the onset slot first, with the pair code when there is one", () => {
    expect(buildErrorCode(ba, { onset: "d", rime: "a", tone: "huyen" })).toBe("nham_b_d");
    expect(buildErrorCode(ba, { onset: "m", rime: "a", tone: "huyen" })).toBe("nham_am_dau_viet");
    expect(buildErrorCode(ba, { onset: "m", rime: "o", tone: "sac" })).toBe("nham_am_dau_viet");
  });
  it("then the rime, then the tone", () => {
    expect(buildErrorCode(ba, { onset: "b", rime: "o", tone: "sac" })).toBe("doc_nham_van");
    expect(buildErrorCode(ba, { onset: "b", rime: "a", tone: "sac" })).toBe("sai_dau_thanh");
    expect(buildErrorCode(ba, { onset: "b", rime: "a", tone: "huyen" })).toBeNull();
  });
  it("tells hỏi/ngã and a forgotten mark apart", () => {
    expect(toneErrorCode("hoi", "nga")).toBe("nham_hoi_nga");
    expect(toneErrorCode("nga", "hoi")).toBe("nham_hoi_nga");
    expect(toneErrorCode("sac", "ngang")).toBe("thieu_dau_thanh");
    expect(toneErrorCode("sac", "nang")).toBe("sai_dau_thanh");
  });
  it("uses only codes the taxonomy has", () => {
    const taxonomy = JSON.parse(
      readFileSync(join(__dirname, "../../../../content/error-taxonomy.json"), "utf8"),
    ) as { codes: { code: string }[] };
    const known = new Set(taxonomy.codes.map((c) => c.code));
    const codes = new Set<string>();
    for (const target of DICT.slice(0, 200))
      for (const onset of [...ONSETS, ""])
        for (const tone of TONES) {
          const code = buildErrorCode(target, { onset, rime: "a", tone });
          if (code) codes.add(code);
        }
    for (const c of codes) expect(known.has(c)).toBe(true);
  });
});

describe("cặp dễ lẫn", () => {
  it("shows exactly two cards: the syllable and its look-alike", () => {
    const round = pairRound(
      ["bà", "chó", "sữa", "nghé", "cá", "mả", "nhà"].map(byText).filter(Boolean),
      seededRng(4),
    );
    for (const item of round) {
      expect(item.cards).toHaveLength(2);
      expect(item.cards).toContain(item.syllable.text);
      expect(new Set(item.cards).size).toBe(2);
    }
    // nhà belongs to no pair and stays out of this game
    expect(round.some((r) => r.syllable.text === "nhà")).toBe(false);
  });

  it("builds the look-alike from real pieces", () => {
    expect(lookAlike(byText("bà"))).toEqual({ text: "dà", kind: "b_d" });
    expect(lookAlike(byText("chó"))).toEqual({ text: "tró", kind: "ch_tr" });
    expect(lookAlike(byText("sữa"))?.kind).toBe("hoi_nga");
    expect(lookAlike(byText("nghé"))).toEqual({ text: "ngé", kind: "ng_ngh" });
    for (const s of DICT) {
      const twin = lookAlike(s);
      if (!twin) continue;
      const parts = splitSyllable(twin.text);
      expect(parts).not.toBeNull();
      if (parts?.amDau) expect(REAL_ONSETS.has(parts.amDau)).toBe(true);
      expect(REAL_RIMES.has(parts?.van ?? "")).toBe(true);
    }
  });
});

describe("bánh xe thanh điệu", () => {
  it("has six notches in tone order, with pictures only where the syllable is real", () => {
    const [wheel] = toneRound([byText("mẹ")], DICT, { rng: seededRng(5) });
    expect(wheel?.notches.map((n) => n.tone)).toEqual([...TONES]);
    expect(wheel?.notches.map((n) => n.text)).toEqual(["me", "mè", "mé", "mẻ", "mẽ", "mẹ"]);
    for (const n of wheel?.notches ?? []) if (n.syllable) expect(n.syllable.text).toBe(n.text);
  });

  it("does not turn the same wheel twice in a round", () => {
    const round = toneRound(["mà", "má", "mẹ", "bà", "bả"].map(byText), DICT, {
      rng: seededRng(6),
      size: 5,
    });
    const bases = round.map((r) => `${r.onset}|${r.rime}`);
    expect(new Set(bases).size).toBe(bases.length);
  });

  it("puts hỏi/ngã first for a child who mixes them up", () => {
    const round = toneRound(["mèo", "bả", "cá", "mũ"].map(byText), DICT, {
      rng: seededRng(7),
      preferHoiNga: true,
      size: 4,
    });
    expect(["hoi", "nga"]).toContain(round[0]?.syllable.tone);
  });
});

describe("tàu chở vần", () => {
  it("gives carriages with several right onsets and some that make nothing", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const cars = trainRound(DICT, { rng: seededRng(seed), onsets: TABLES.onsets });
      expect(cars.length).toBeGreaterThan(0);
      for (const car of cars) {
        expect(car.onsets).toHaveLength(6);
        expect(new Set(car.onsets).size).toBe(6);
        for (const o of car.onsets) expect(REAL_ONSETS.has(o)).toBe(true);
        const right = car.onsets.filter((o) => car.answers[o]);
        expect(right.length).toBeGreaterThanOrEqual(2);
        expect(right.length).toBeLessThan(car.onsets.length);
        for (const o of right) {
          const s = car.answers[o] as GameSyllable;
          expect(joinSyllable(o, car.rime, car.tone)).toBe(s.text);
        }
      }
      // two carriages never carry the same rime and tone
      const chunks = cars.map((c) => c.chunk);
      expect(new Set(chunks).size).toBe(chunks.length);
    }
  });

  it("keeps to what the class has reached", () => {
    const early = new Set(DICT.slice(0, 120).map((s) => s.id));
    const cars = trainRound(DICT, {
      rng: seededRng(9),
      allowed: (s) => early.has(s.id),
      onsets: TABLES.onsets,
    });
    for (const car of cars)
      for (const s of Object.values(car.answers)) expect(early.has(s.id)).toBe(true);
  });
});

describe("which games are open, and which two a station plays", () => {
  const fresh = { met: 0, steady: 0, buildAtBox2: { seen: 0, correct: 0 }, classWeek: 1 };

  it("starts with lắp tiếng, cặp dễ lẫn and đọc to", () => {
    expect(unlockedGames(fresh).sort()).toEqual(["build", "pair", "read"]);
  });

  it("opens tách tiếng at 80% on known syllables, not before", () => {
    expect(unlockedGames({ ...fresh, buildAtBox2: { seen: 10, correct: 7 } })).not.toContain(
      "split",
    );
    expect(unlockedGames({ ...fresh, buildAtBox2: { seen: 10, correct: 8 } })).toContain("split");
    expect(unlockedGames({ ...fresh, buildAtBox2: { seen: 3, correct: 3 } })).not.toContain(
      "split",
    );
  });

  it("opens the tone wheel after the six tones are taught, and the train with ten steady syllables", () => {
    expect(unlockedGames({ ...fresh, met: 8, classWeek: 1 })).not.toContain("tone");
    expect(unlockedGames({ ...fresh, met: 8, classWeek: 2 })).toContain("tone");
    expect(unlockedGames({ ...fresh, steady: 9 })).not.toContain("train");
    expect(unlockedGames({ ...fresh, steady: 10 })).toContain("train");
  });

  it("plays two different games a station, and turns them with the day", () => {
    const open = [...SYLLABLE_GAMES];
    const seen = new Set<string>();
    for (let day = 0; day < 12; day++)
      for (const station of [0, 1]) {
        const [a, b] = stationGames(open, day, station);
        expect(a).not.toBe(b);
        seen.add(`${a}+${b}`);
      }
    expect(seen.size).toBeGreaterThan(3);
    expect(stationGames(open, 3, 0)).not.toEqual(stationGames(open, 4, 0));
  });

  it("only hands out games that are open", () => {
    const open = unlockedGames(fresh);
    for (let day = 0; day < 10; day++)
      for (const station of [0, 1])
        for (const g of stationGames(open, day, station)) expect(open).toContain(g);
  });
});

describe("a given name on screen", () => {
  it("starts with a capital, and nothing else changes", () => {
    expect(writtenSyllable("thy", true)).toBe("Thy");
    expect(writtenSyllable("thanh", true)).toBe("Thanh");
    expect(writtenSyllable("đạt", true)).toBe("Đạt");
    expect(writtenSyllable("ông", true)).toBe("Ông");
    expect(writtenSyllable("thanh")).toBe("thanh");
    expect(writtenSyllable("thanh", false)).toBe("thanh");
  });
});
