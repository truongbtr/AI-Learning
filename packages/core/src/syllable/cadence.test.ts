import { describe, expect, it } from "vitest";
import { cadence, cadenceLine, withTone } from "./cadence";
import { applyTone, joinSyllable, splitSyllable, TONES } from "./parts";

/**
 * The spelling-out rhythm (pha 13, ADR-24). The project owner is confirming with the class
 * teacher that "bờ – a – ba – huyền – bà" is what the children hear at school; until then this
 * file is the specification, and every mp3 in the phase is generated from it.
 */

/** One case: the syllable, and the line it should be read as. */
const LINES: [string, string][] = [
  // the plainest three: onset, rime, blend
  ["ba", "bờ – a – ba"],
  ["co", "cờ – o – co"],
  ["me", "mờ – e – me"],
  // with a tone, all five of them
  ["bà", "bờ – a – ba – huyền – bà"],
  ["bá", "bờ – a – ba – sắc – bá"],
  ["bả", "bờ – a – ba – hỏi – bả"],
  ["bã", "bờ – a – ba – ngã – bã"],
  ["bạ", "bờ – a – ba – nặng – bạ"],
  // no onset at all: a flat one says itself once, a toned one gets its tone named
  ["anh", "anh"],
  ["ăn", "ăn"],
  ["ánh", "anh – sắc – ánh"],
  ["ổ", "ô – hỏi – ổ"],
  ["yêu", "yêu"],
  // rimes that end in a consonant
  ["mẹ", "mờ – e – me – nặng – mẹ"],
  ["cánh", "cờ – anh – canh – sắc – cánh"],
  ["bàn", "bờ – an – ban – huyền – bàn"],
  ["trường", "trờ – ương – trương – huyền – trường"],
  // two-letter and three-letter onsets read as one sound
  ["nhà", "nhờ – a – nha – huyền – nhà"],
  ["nghé", "ngờ – e – nghe – sắc – nghé"],
  ["khỏe", "khờ – oe – khoe – hỏi – khỏe"],
  ["chị", "chờ – i – chi – nặng – chị"],
  // the glide rimes the phase promises to handle
  ["toán", "tờ – oan – toan – sắc – toán"],
  ["quyển", "quờ – yên – quyên – hỏi – quyển"],
  ["quả", "quờ – a – qua – hỏi – quả"],
  ["tuổi", "tờ – uôi – tuôi – hỏi – tuổi"],
  ["rượu", "rờ – ươu – rươu – nặng – rượu"],
  ["giỏ", "giờ – o – gio – hỏi – giỏ"],
];

describe("cadence", () => {
  it.each(LINES)("reads %s as %s", (syllable, line) => {
    expect(cadenceLine(syllable)).toBe(line);
  });

  it("names no tone for a flat syllable, and never shows the word for it", () => {
    const kinds = cadence("ba").map((s) => s.kind);
    expect(kinds).toEqual(["onset", "rime", "blend"]);
    expect(cadence("ba").some((s) => s.kind === "tone")).toBe(false);
  });

  it("lights up the tile it is saying", () => {
    expect(cadence("bà")).toEqual([
      { kind: "onset", text: "b", say: "bờ" },
      { kind: "rime", text: "a", say: "a" },
      { kind: "blend", text: "ba", say: "ba" },
      { kind: "tone", text: "huyền", say: "huyền" },
      { kind: "full", text: "bà", say: "bà" },
    ]);
  });

  it("says a syllable with no onset exactly once", () => {
    expect(cadence("anh")).toEqual([{ kind: "rime", text: "anh", say: "anh" }]);
  });

  it("gives nothing back for something that is not a syllable", () => {
    expect(cadence("xin chào")).toEqual([]);
    expect(cadence("abc123")).toEqual([]);
    expect(cadence("")).toEqual([]);
  });

  it("takes parts as well as text, so a child's three tiles can be read back", () => {
    expect(cadenceLine({ amDau: "b", van: "a", thanh: "huyen" })).toBe("bờ – a – ba – huyền – bà");
  });
});

describe("splitSyllable", () => {
  const CASES: [string, string, string, string][] = [
    ["bà", "b", "a", "huyen"],
    ["anh", "", "anh", "ngang"],
    ["ánh", "", "anh", "sac"],
    ["quyển", "qu", "yên", "hoi"],
    ["nghiêng", "ngh", "iêng", "ngang"],
    ["giấy", "gi", "ây", "sac"],
    ["khỏe", "kh", "oe", "hoi"],
    ["trường", "tr", "ương", "huyen"],
    ["của", "c", "ua", "hoi"],
    ["yêu", "", "yêu", "ngang"],
  ];
  it.each(CASES)("splits %s", (text, amDau, van, thanh) => {
    expect(splitSyllable(text)).toEqual({ amDau, van, thanh });
  });

  it("refuses the merged gi spellings, which cannot be built from three tiles", () => {
    // "gì" is onset gi + rime i written with one letter — out of scope (ADR-24)
    expect(joinSyllable("gi", "i", "huyen")).not.toBe("gì");
  });

  it("round-trips: what it splits, it can write again", () => {
    for (const [text] of CASES) {
      const p = splitSyllable(text);
      expect(p && joinSyllable(p.amDau, p.van, p.thanh)).toBe(text);
    }
  });
});

describe("tone placing", () => {
  it("puts the mark on the last of â ê ô ơ ă ư", () => {
    expect(applyTone("ươu", "nang")).toBe("ượu");
    expect(applyTone("uôi", "hoi")).toBe("uổi");
    expect(applyTone("yên", "hoi")).toBe("yển");
  });

  it("puts it on the last vowel when a consonant follows", () => {
    expect(applyTone("oan", "sac")).toBe("oán");
    expect(applyTone("iêng", "huyen")).toBe("iềng");
  });

  it("puts it on the vowel before the last when the rime ends in one", () => {
    expect(applyTone("oai", "huyen")).toBe("oài");
    expect(applyTone("ua", "hoi")).toBe("ủa");
    expect(applyTone("oe", "hoi")).toBe("ỏe");
  });

  it("leaves a flat rime alone", () => {
    for (const van of ["a", "oan", "ương"]) expect(applyTone(van, "ngang")).toBe(van);
  });
});

describe("withTone", () => {
  it("turns the tone wheel through all six", () => {
    expect(TONES.map((t) => withTone("ma", t))).toEqual(["ma", "mà", "má", "mả", "mã", "mạ"]);
  });
  it("keeps the onset and the rime while the tone changes", () => {
    expect(withTone("quyển", "sac")).toBe("quyến");
  });
});
