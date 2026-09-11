import { describe, expect, it } from "vitest";
import type { ExercisePack } from "./exercise";
import { checkPromptVariety } from "./exercise-validate";

/** A pack of `n` exercises of one type, using `prompts` in turn. */
function packOf(type: string, language: "vi" | "en", prompts: string[], n: number): ExercisePack {
  return {
    skillCode: "VIET.HV.AM_A",
    subject: "VIET",
    generatedBy: "claude-code",
    promptVersion: "test",
    lessonRefs: [],
    exercises: Array.from({ length: n }, (_, i) => ({
      id: `test-${i}`,
      type,
      language,
      difficulty: 1,
      skillCodes: ["VIET.HV.AM_A"],
      assetTheme: "neutral",
      targetsError: null,
      scaffold: "none",
      prompt: { text: prompts[i % prompts.length] as string, tts: true },
      answerKey: "a",
      hints: [`hint ${i % 5}`],
      explanation: "vì thế",
      meta: { estSeconds: 20, sourceRef: "test" },
    })),
  } as unknown as ExercisePack;
}

describe("instructions must not all read the same", () => {
  it("warns when one sentence covers more than a quarter of a type", () => {
    const issues = checkPromptVariety([
      {
        file: "a.pack.json",
        pack: packOf("LISTEN_CHOOSE", "vi", ["Nghe rồi chọn ô đúng nhé!"], 40),
      },
    ]);
    expect(issues.some((i) => i.message.includes("100%"))).toBe(true);
    expect(issues.every((i) => i.level === "warn")).toBe(true);
  });

  it("is quiet when six wordings are shared out evenly", () => {
    const six = ["a1", "b2", "c3", "d4", "e5", "f6"].map((s) => `Câu lệnh ${s} dài vừa đủ`);
    const issues = checkPromptVariety([
      { file: "a.pack.json", pack: packOf("LISTEN_CHOOSE", "vi", six, 60) },
    ]);
    expect(issues.filter((i) => i.message.includes("is the instruction of"))).toHaveLength(0);
  });

  it("asks for six wordings and four hints per language", () => {
    const three = ["một", "hai", "ba"].map((s) => `Câu lệnh ${s}`);
    const issues = checkPromptVariety([
      { file: "a.pack.json", pack: packOf("MCQ", "en", three, 30) },
    ]);
    expect(issues.some((i) => i.message.includes("only 3 different instructions"))).toBe(true);
  });

  it("leaves a handful of exercises alone — they cannot be varied six ways", () => {
    const issues = checkPromptVariety([
      { file: "a.pack.json", pack: packOf("COUNT_TAP", "vi", ["Chạm để đếm nhé"], 4) },
    ]);
    expect(issues).toHaveLength(0);
  });
});
