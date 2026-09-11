import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { EXPECTS, parseInboxResult, parsePlanHint } from "./schemas";
import { validateInbox } from "./service";

const goodGrade = {
  kind: "SPEAK_GRADE",
  score: 0.8,
  outcome: "PARTIAL",
  errorCodes: ["doc_bo_tieng"],
  skillCodes: ["VIET.DOC.DOC_TIENG"],
  feedbackVi: "Con đọc to và rõ lắm! Lần sau đọc chậm hơn một chút nhé.",
  words: [
    { word: "bà", ok: true },
    { word: "bé", ok: false },
  ],
};

describe("inbox result schemas (docs/13)", () => {
  it("accepts a grade result and fills the defaults", () => {
    const parsed = parseInboxResult(goodGrade);
    expect(parsed.kind).toBe("SPEAK_GRADE");
    if (parsed.kind === "SPEAK_GRADE") expect(parsed.confidence).toBe(0.5);
  });

  it("rejects an error code that is not snake_case", () => {
    expect(() => parseInboxResult({ ...goodGrade, errorCodes: ["NhamBD"] })).toThrow();
  });

  it("rejects an unknown kind instead of guessing", () => {
    expect(() => parseInboxResult({ ...goodGrade, kind: "SOMETHING_ELSE" })).toThrow();
  });

  it("accepts a photo intake with BLANK items (docs/08 pha 4: blank is not wrong)", () => {
    const parsed = parseInboxResult({
      kind: "PHOTO_INTAKE",
      docType: "WORKSHEET",
      subject: "ESL",
      items: [
        { index: 0, questionText: "Circle the word", outcome: "BLANK" },
        { index: 1, questionText: "b or d?", outcome: "INCORRECT", errorCode: "nham_b_d" },
      ],
    });
    if (parsed.kind === "PHOTO_INTAKE") {
      expect(parsed.items[0]?.outcome).toBe("BLANK");
      expect(parsed.items[1]?.errorCode).toBe("nham_b_d");
      expect(parsed.items[0]?.skillCodes).toEqual([]);
    }
  });

  it("needs a note on a plan hint so the parent knows why", () => {
    expect(() => parsePlanHint({ studentNickname: "Thy", focusErrors: ["nham_b_d"] })).toThrow();
    expect(
      parsePlanHint({
        studentNickname: "Thy",
        focusErrors: ["nham_b_d"],
        note: "Tuần này con hay nhầm b với d.",
      }).validDays,
    ).toBe(3);
  });

  it("tells the reader what each kind expects, in Vietnamese", () => {
    expect(Object.keys(EXPECTS)).toHaveLength(5);
    for (const text of Object.values(EXPECTS)) expect(text.length).toBeGreaterThan(40);
  });
});

describe("validateInbox over a folder", () => {
  let root = "";
  const write = (id: string, kind: string, result?: unknown) => {
    const dir = join(root, "2026-09-11", id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "context.json"),
      JSON.stringify({
        id,
        kind,
        createdAt: new Date().toISOString(),
        student: { nickname: "Thy" },
        errorCodes: [
          { code: "doc_bo_tieng", nameVi: "Đọc bỏ tiếng" },
          { code: "nham_b_d", nameVi: "Nhầm b với d" },
        ],
        expects: "x",
      }),
    );
    if (result) writeFileSync(join(dir, "result.json"), JSON.stringify(result));
  };

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), "mtct-inbox-"));
    write("ok-1", "SPEAK_GRADE", goodGrade);
    write("waiting-1", "PHOTO_INTAKE");
    write("wrong-kind-1", "PHOTO_INTAKE", goodGrade);
    write("bad-code-1", "SPEAK_GRADE", { ...goodGrade, errorCodes: ["khong_co_ma_nay"] });
    write("says-sai-1", "SPEAK_GRADE", { ...goodGrade, feedbackVi: "Con đọc sai rồi." });
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("passes the good one and leaves the unanswered one as a warning", () => {
    const { ok, issues } = validateInbox(root);
    expect(ok.map((o) => o.id)).toEqual(["ok-1"]);
    expect(issues.find((i) => i.id === "waiting-1")?.level).toBe("warn");
  });

  it("refuses a result whose kind does not match the item", () => {
    const { issues } = validateInbox(root);
    expect(issues.find((i) => i.id === "wrong-kind-1")?.message).toContain("but the item is a");
  });

  it("refuses an error code the context did not offer", () => {
    const { issues } = validateInbox(root);
    expect(issues.find((i) => i.id === "bad-code-1")?.message).toContain("khong_co_ma_nay");
  });

  it('refuses feedback containing the word "sai" (docs/06 §1)', () => {
    const { issues } = validateInbox(root);
    expect(issues.find((i) => i.id === "says-sai-1")?.message).toContain(
      'never read the word "sai"',
    );
  });
});
