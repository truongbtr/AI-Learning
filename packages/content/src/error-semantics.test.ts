import { describe, expect, it } from "vitest";
import { type ExerciseContext, explainErrorTagMismatch } from "./error-semantics";

const maths: ExerciseContext = {
  type: "MCQ",
  language: "vi",
  subject: "VMATH",
  prompt: "2 và mấy thì được 8?",
};
const viet: ExerciseContext = {
  type: "MCQ",
  language: "vi",
  subject: "VIET",
  prompt: "Tiếng nào mang dấu huyền?",
};

const check = (code: string, correct: string | null, distractor: string | null, ctx = maths) =>
  explainErrorTagMismatch({ code, correct, distractor }, ctx);

describe("the tag QC caught", () => {
  it('refuses "quen_so_0" on a question with no zero in it', () => {
    expect(check("quen_so_0", "6", "8")).toMatch(/no 0 in it/);
  });

  it('accepts "lap_lai_tong" for the child who answered with the total', () => {
    expect(check("lap_lai_tong", "6", "8")).toBeNull();
  });

  it('refuses "lap_lai_tong" for a number the question never mentions', () => {
    expect(check("lap_lai_tong", "6", "5")).toMatch(/not one of/);
  });

  it("keeps quen_so_0 where a zero really is the point", () => {
    const ctx = {
      ...maths,
      prompt: "Mai có 4 quả cam, mẹ không cho thêm quả nào. Mai có mấy quả?",
    };
    expect(check("quen_so_0", "4", "0", ctx)).toBeNull();
  });
});

describe("counting codes", () => {
  it("insists one short means one short", () => {
    expect(check("dem_thieu_1", "6", "5")).toBeNull();
    expect(check("dem_thieu_1", "6", "4")).toMatch(/one short of 6/);
  });
  it("insists one too many means one too many", () => {
    expect(check("dem_thua_1", "6", "7")).toBeNull();
    expect(check("dem_thua_1", "6", "8")).toMatch(/one too many/);
  });
  it("counting things twice must land above the answer", () => {
    expect(check("dem_lai_tu_dau", "6", "8")).toBeNull();
    expect(check("dem_lai_tu_dau", "6", "4")).toMatch(/more than 6/);
  });
});

describe("letters and tones", () => {
  it("b/d has to be an actual b/d swap", () => {
    expect(check("nham_b_d", "bà", "dà", viet)).toBeNull();
    expect(check("nham_b_d", "a", "o", viet)).toMatch(/not "a" with that swap/);
  });

  it("look-alike letters are the ă/â/ê/ô/ơ/ư family, d/đ and the round pair a/o", () => {
    expect(check("nham_chu_gan_giong", "a", "ă", viet)).toBeNull();
    expect(check("nham_chu_gan_giong", "d", "đ", viet)).toBeNull();
    expect(check("nham_chu_gan_giong", "a", "b", viet)).toMatch(/not look-alike/);
  });

  it("a missing tone is the same letters without the mark", () => {
    expect(check("thieu_dau_thanh", "cà", "ca", viet)).toBeNull();
    expect(check("thieu_dau_thanh", "ca", "cà", viet)).toMatch(/that is "sai_dau_thanh"/);
    expect(check("thieu_dau_thanh", "cà", "bà", viet)).toMatch(/not the same letters/);
  });

  it("hỏi/ngã is only hỏi against ngã", () => {
    expect(check("nham_hoi_nga", "bả", "bã", viet)).toBeNull();
    expect(check("nham_hoi_nga", "bả", "bà", viet)).toMatch(/different tone mix-up/);
  });

  it("âm đầu changes the first sound, vần changes the rest", () => {
    expect(check("nham_am_dau", "cà", "bà", viet)).toBeNull();
    expect(check("nham_am_dau", "cà", "cò", viet)).toMatch(/same âm đầu/);
    expect(check("doc_nham_van", "cà", "cò", viet)).toBeNull();
    expect(check("doc_nham_van", "cà", "bà", viet)).toMatch(/same vần/);
  });
});

describe("English", () => {
  const en: ExerciseContext = {
    type: "MCQ",
    language: "en",
    subject: "ENL",
    prompt: "Which word rhymes with dog?",
  };
  it("a rhyme miss is a rime error; a word that does rhyme is not", () => {
    expect(check("doc_nham_van", "log", "hat", en)).toBeNull();
    expect(check("doc_nham_van", "log", "fog", en)).toMatch(/rhymes with/);
  });
  it("have/has must be a have/has swap", () => {
    expect(check("nham_have_has", "has", "have", en)).toBeNull();
    expect(check("nham_have_has", "has", "is", en)).toMatch(/not that swap/);
  });
  it("a spelling slip is a near miss, not a different word", () => {
    expect(check("sai_chinh_ta_tu", "was", "saw", en)).toBeNull();
    expect(check("sai_chinh_ta_tu", "tall", "short", en)).toMatch(/edits from/);
  });
});

describe("codes that can never sit on an option", () => {
  it("refuses behavioural codes", () => {
    expect(check("doan_bua", "6", "8")).toMatch(/behavioural code/);
    expect(check("met_cuoi_phien", "6", "8")).toMatch(/behavioural code/);
  });

  it("refuses handwriting codes on something the child is reading", () => {
    expect(check("viet_nguoc_chu", "bà", "dà", viet)).toMatch(/about handwriting/);
    expect(check("viet_nguoc_chu", "b", "d", viet)).toBeNull(); // one glyph: shape, not reading
  });
});

describe("silence when it cannot tell", () => {
  it("says nothing about an image-only option", () => {
    expect(check("doc_nham_van", null, null, viet)).toBeNull();
    expect(check("nham_b_d", "bà", null, viet)).toBeNull();
  });
});
