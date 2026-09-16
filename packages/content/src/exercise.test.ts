import { describe, expect, it } from "vitest";
import {
  type ExerciseDef,
  errorTagsOf,
  parseExercisePack,
  toExerciseSpec,
  ttsLinesOf,
} from "./exercise";
import { validatePack } from "./exercise-validate";
import type { SkillDef } from "./skill-map";
import { answerBundleOf, contentHashOf, packToRows } from "./to-rows";

const skill = {
  code: "VMATH.SO.CONG_PV_10",
  subject: "VMATH",
  strand: "SO",
  nameVi: "Cộng trong phạm vi 10",
  nameEn: "Add within 10",
  description: "x".repeat(30),
  gradeLevel: "1",
  prerequisites: [],
  relatedSkillCodes: [],
  confusableWith: [],
  exerciseTypes: ["MCQ", "COUNT_TAP", "DRAG_DROP", "LISTEN_CHOOSE"],
  difficultyRange: [1, 4],
} as unknown as SkillDef & { subject: string };

const ctx = {
  skills: new Map([[skill.code, skill]]),
  lessonCodes: new Set(["KNTT-T1-B10"]),
  errorCodes: new Set(["dem_thieu_1", "nham_cong_tru", "quen_so_0"]),
  assetLabels: null,
};

function mcq(n: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `vmath-cong10-${String(n).padStart(4, "0")}`,
    type: "MCQ",
    language: "vi",
    difficulty: ((n - 1) % 5) + 1,
    skillCodes: [skill.code],
    prompt: { text: `Có ${n} con cá và 2 con cá. Tất cả mấy con cá?` },
    choices: [
      { id: "a", text: String(n + 1), errorTag: "dem_thieu_1" },
      { id: "b", text: String(n + 2) },
      { id: "c", text: String(Math.max(0, n - 2)), errorTag: "nham_cong_tru" },
    ],
    answerKey: "b",
    hints: ["Đếm tiếp từ số lớn."],
    explanation: `${n} cộng 2 bằng ${n + 2}.`,
    meta: { estSeconds: 25, lessonUnitCode: "KNTT-T1-B10", sourceRef: "SGK Toán 1 tập một tr.41" },
    ...overrides,
  };
}

function pack(exercises: unknown[]) {
  return { skillCode: skill.code, subject: "VMATH", exercises };
}

describe("exercise schema (docs/04 §5, docs/10 §4.2)", () => {
  it("accepts a well-formed MCQ", () => {
    const parsed = parseExercisePack(pack([mcq(3)]));
    expect(parsed.exercises[0]?.type).toBe("MCQ");
    expect(parsed.exercises[0]?.scaffold).toBe("none");
    expect(parsed.exercises[0]?.assetTheme).toBe("neutral");
  });

  it("rejects an answerKey that is not one of the choices", () => {
    expect(() => parseExercisePack(pack([mcq(3, { answerKey: "z" })]))).toThrow(/choice ids/);
  });

  it("refuses an errorTag on the correct choice — that would mislabel a right answer", () => {
    const bad = mcq(3);
    (bad.choices[1] as Record<string, unknown>).errorTag = "dem_thieu_1";
    expect(() => parseExercisePack(pack([bad]))).toThrow(/must not carry an errorTag/);
  });

  it('never lets the word "sai" reach a child', () => {
    expect(() =>
      parseExercisePack(pack([mcq(3, { explanation: "Con làm sai rồi, thử lại nhé." })])),
    ).toThrow(/"sai" must never appear/);
  });

  it("keeps the prompt short enough to read aloud (rubric 3)", () => {
    const long = { text: `Đây là ${"một câu rất dài ".repeat(8)} mấy?` };
    expect(() => parseExercisePack(pack([mcq(3, { prompt: long })]))).toThrow(/limit is 20/);
  });

  it("requires COUNT_TAP answerKey to equal the real count", () => {
    const count = {
      ...mcq(4),
      type: "COUNT_TAP",
      choices: undefined,
      countTarget: { objects: { kind: "emoji", value: "🍎" }, correctCount: 6 },
      answerKey: 5,
    };
    expect(() => parseExercisePack(pack([count]))).toThrow(/must equal countTarget.correctCount/);
  });

  it("checks that every drop zone gets an item (decoys may stay in the tray)", () => {
    const drag = {
      ...mcq(5),
      type: "DRAG_DROP",
      choices: undefined,
      dragItems: [
        { id: "i1", text: "3" },
        { id: "i2", text: "4" },
      ],
      dropZones: [
        { id: "z1", label: "5", accepts: ["i1", "i2"] },
        { id: "z2", label: "6", accepts: ["i1", "i2"] },
      ],
      answerKey: { z1: ["i1"] },
    };
    expect(() => parseExercisePack(pack([drag]))).toThrow(/every dropZone needs an entry/);
  });

  it("refuses a LISTEN_CHOOSE whose prompt prints the spoken word", () => {
    const listen = {
      ...mcq(7),
      type: "LISTEN_CHOOSE",
      prompt: { text: "Nghe rồi chọn tiếng: chè" },
      listenTarget: { text: "chè" },
    };
    expect(() => parseExercisePack(pack([listen]))).toThrow(/gives the answer away/);
    const fixed = { ...listen, prompt: { text: "Nghe rồi chọn ô đúng nhé!" } };
    expect(parseExercisePack(pack([fixed])).exercises[0]?.listenTarget?.text).toBe("chè");
  });

  it("needs listenTarget on a LISTEN_CHOOSE — otherwise there is nothing to listen to", () => {
    const listen = { ...mcq(8), type: "LISTEN_CHOOSE", prompt: { text: "Nghe rồi chọn ô đúng." } };
    expect(() => parseExercisePack(pack([listen]))).toThrow(/needs listenTarget/);
  });

  it("makes WRITE_PHOTO carry a rubric and a null answerKey (graded by the queue)", () => {
    const write = {
      ...mcq(6),
      type: "WRITE_PHOTO",
      choices: undefined,
      answerKey: "b",
      rubric: { criteria: ["Viết đúng phép tính"], sampleAnswers: ["3 + 2 = 5"] },
    };
    expect(() => parseExercisePack(pack([write]))).toThrow(/answerKey must be null/);
  });
});

describe("ExerciseSpec sent to the client", () => {
  const ex = parseExercisePack(pack([mcq(3)])).exercises[0] as ExerciseDef;

  it("never contains the answerKey or the diagnosis", () => {
    const spec = toExerciseSpec(ex, "VMATH");
    const json = JSON.stringify(spec);
    expect(json).not.toContain("answerKey");
    expect(json).not.toContain("errorTag");
    expect(json).not.toContain("dem_thieu_1");
    expect(spec.choices?.map((c) => c.text)).toEqual(["4", "5", "1"]);
  });

  it("hides the correct count of a COUNT_TAP", () => {
    const count = parseExercisePack(
      pack([
        {
          ...mcq(4),
          type: "COUNT_TAP",
          choices: undefined,
          countTarget: { objects: { kind: "emoji", value: "🍎" }, correctCount: 6 },
          answerKey: 6,
        },
      ]),
    ).exercises[0] as ExerciseDef;
    const spec = toExerciseSpec(count, "VMATH");
    expect(JSON.stringify(spec)).not.toContain("correctCount");
    expect(answerBundleOf(count)).toMatchObject({ value: 6, correctCount: 6 });
  });

  it("tells a drop zone how many cards it wants, never which ones", () => {
    const drag = parseExercisePack(
      pack([
        {
          ...mcq(5),
          type: "DRAG_DROP",
          choices: undefined,
          prompt: { text: "Kéo hai thẻ vào giỏ cho đủ nhé!" },
          dragItems: [
            { id: "k1", text: "3" },
            { id: "k2", text: "2" },
            { id: "d1", text: "9" },
          ],
          dropZones: [{ id: "gio", label: "5", accepts: ["k1", "k2", "d1"] }],
          answerKey: { gio: ["k1", "k2"] },
        },
      ]),
    ).exercises[0] as ExerciseDef;
    const spec = toExerciseSpec(drag, "VMATH");
    expect(spec.dropZones).toEqual([{ id: "gio", label: "5", expect: 2 }]);
    // `accepts` would narrow the answer down for anyone reading the payload
    expect(JSON.stringify(spec)).not.toContain("accepts");
  });

  it("plays the spoken word but never puts it in the prompt", () => {
    const listen = parseExercisePack(
      pack([
        {
          ...mcq(9),
          type: "LISTEN_CHOOSE",
          prompt: { text: "Nghe rồi chọn ô đúng nhé!" },
          listenTarget: { text: "chè" },
        },
      ]),
    ).exercises[0] as ExerciseDef;
    const spec = toExerciseSpec(listen, "VIET");
    // The client needs it to speak, so it is in the spec — the renderer must not print it.
    expect(spec.listenTarget?.text).toBe("chè");
    expect(spec.prompt.text).not.toContain("chè");
    // It also gets its own mp3 at import time.
    expect(ttsLinesOf(listen).map((l) => l.text)).toContain("chè");
  });

  it("keeps the diagnosis server-side in the answer bundle", () => {
    expect(errorTagsOf(ex)).toEqual({ a: "dem_thieu_1", c: "nham_cong_tru" });
    expect(answerBundleOf(ex)).toEqual({
      value: "b",
      errorTags: { a: "dem_thieu_1", c: "nham_cong_tru" },
    });
  });
});

describe("content hash", () => {
  const ex = parseExercisePack(pack([mcq(3)])).exercises[0] as ExerciseDef;

  it("is stable when only key order changes", () => {
    const source = mcq(3);
    const shuffled = Object.fromEntries(Object.entries(source).reverse());
    const reordered = parseExercisePack(pack([shuffled])).exercises[0] as ExerciseDef;
    expect(contentHashOf(reordered)).toBe(contentHashOf(ex));
  });

  it("changes when the explanation changes", () => {
    const edited = parseExercisePack(pack([mcq(3, { explanation: "Ba cộng hai bằng năm nhé." })]))
      .exercises[0] as ExerciseDef;
    expect(contentHashOf(edited)).not.toBe(contentHashOf(ex));
  });
});

describe("TTS lines picked up by content:import", () => {
  it("takes the prompt but skips prompts with a per-child placeholder", () => {
    const plain = parseExercisePack(pack([mcq(3)])).exercises[0] as ExerciseDef;
    expect(ttsLinesOf(plain)).toEqual([
      { text: "Có 3 con cá và 2 con cá. Tất cả mấy con cá?", lang: "vi" },
    ]);
    const personal = parseExercisePack(
      pack([mcq(3, { prompt: { text: "{ten} có 3 {vat} và 2 {vat}. Tất cả mấy?" } })]),
    ).exercises[0] as ExerciseDef;
    expect(ttsLinesOf(personal)).toEqual([]);
  });
});

describe("pack validation (docs/10 §6)", () => {
  it("flags a maths MCQ whose distractors carry no diagnosis", () => {
    const naked = mcq(7);
    naked.choices = [
      { id: "a", text: "8" },
      { id: "b", text: "9" },
    ] as never;
    const issues = validatePack(parseExercisePack(pack([naked])), "t.json", ctx);
    expect(issues.map((i) => i.message)).toContain(
      "at least one wrong choice must carry an errorTag (docs/04 §11.2)",
    );
  });

  it("flags two exercises that are the same question", () => {
    const issues = validatePack(parseExercisePack(pack([mcq(3), mcq(3)])), "t.json", ctx);
    expect(issues.some((i) => i.message.includes("duplicates"))).toBe(true);
  });

  it("flags a type the skill map does not declare", () => {
    const readAloud = {
      ...mcq(8),
      type: "READ_ALOUD",
      choices: undefined,
      readTarget: { text: "ba cộng hai", words: ["ba", "cộng", "hai"] },
      answerKey: { words: ["ba", "cộng", "hai"] },
    };
    const issues = validatePack(parseExercisePack(pack([readAloud])), "t.json", ctx);
    expect(issues.some((i) => i.message.includes("not declared in the skill map"))).toBe(true);
  });

  it("flags an unknown error code and an unknown lesson reference", () => {
    const issues = validatePack(
      parseExercisePack(
        pack([
          mcq(9, {
            targetsError: "khong_co_ma_nay",
            meta: { estSeconds: 20, lessonUnitCode: "KHONG-CO", sourceRef: "SGK tr.41" },
          }),
        ]),
      ),
      "t.json",
      ctx,
    );
    expect(issues.some((i) => i.message.includes("khong_co_ma_nay"))).toBe(true);
    expect(issues.some((i) => i.message.includes("KHONG-CO"))).toBe(true);
  });

  it("demands 35 exercises, five difficulties, model scaffolds and targeted drills", () => {
    const issues = validatePack(parseExercisePack(pack([mcq(3)])), "t.json", ctx);
    const text = issues.map((i) => i.message).join(" | ");
    expect(text).toContain("need >= 35");
    expect(text).toContain("no exercise at difficulty 2");
    expect(text).toContain('scaffold "model"');
    expect(text).toContain("targetsError");
  });
});

describe("packToRows", () => {
  it("produces the row the importer stores, with the subject of the pack", () => {
    const rows = packToRows(parseExercisePack(pack([mcq(3)])), "exercises/vmath/x.pack.json");
    expect(rows[0]).toMatchObject({
      stableId: "vmath-cong10-0003",
      subject: "VMATH",
      assetTheme: "NEUTRAL",
      sourceRef: "SGK Toán 1 tập một tr.41",
      lessonUnitCode: "KNTT-T1-B10",
    });
    expect(JSON.stringify(rows[0]?.spec)).not.toContain("dem_thieu_1");
  });
});
