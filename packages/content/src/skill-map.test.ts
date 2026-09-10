import { describe, expect, it } from "vitest";
import { validateErrorTaxonomy } from "./error-taxonomy";
import { validateLessonUnits } from "./lesson-units";
import { loadErrorTaxonomy, loadLessonUnitFiles, loadSkillMaps } from "./load";
import {
  MIN_SKILLS_PER_SUBJECT,
  MIN_SKILLS_TOTAL,
  type SkillMapFile,
  topoOrder,
  validateSkillMaps,
} from "./skill-map";

function map(subject: SkillMapFile["subject"], skills: Partial<SkillMapFile["skills"][number]>[]) {
  return {
    subject,
    strands: { SO: "So", HH: "Hinh" },
    skills: skills.map((s) => ({
      strand: "SO",
      nameVi: "Ten",
      nameEn: "Name",
      description: "Mo ta du dai. Ví dụ: a. Lỗi thường gặp: b.",
      gradeLevel: "1" as const,
      prerequisites: [],
      relatedSkillCodes: [],
      confusableWith: [],
      exerciseTypes: ["MCQ" as const],
      difficultyRange: [1, 5] as [number, number],
      code: "VMATH.SO.X",
      ...s,
    })),
  } satisfies SkillMapFile;
}

describe("validateSkillMaps - synthetic cases", () => {
  it("flags duplicate codes, unknown prerequisites and cycles", () => {
    const m = map("VMATH", [
      { code: "VMATH.SO.A", prerequisites: ["VMATH.SO.B"] },
      { code: "VMATH.SO.B", prerequisites: ["VMATH.SO.C"] },
      { code: "VMATH.SO.C", prerequisites: ["VMATH.SO.A"] },
      { code: "VMATH.SO.C" },
      { code: "VMATH.SO.D", prerequisites: ["VMATH.SO.NOPE"] },
    ]);
    const r = validateSkillMaps([{ name: "t.json", map: m }], null);
    const msgs = r.errors.map((e) => e.message);
    expect(msgs.some((x) => x.startsWith("duplicate code"))).toBe(true);
    expect(msgs.some((x) => x.includes('prerequisite "VMATH.SO.NOPE" does not exist'))).toBe(true);
    expect(msgs.some((x) => x.startsWith("prerequisite cycle"))).toBe(true);
    expect(msgs.some((x) => x.includes(`need >= ${MIN_SKILLS_PER_SUBJECT}`))).toBe(true);
  });

  it("checks code prefix, lessonRef existence and expectedWeek range", () => {
    const m = map("VMATH", [
      { code: "VMATH.HH.A", strand: "SO" },
      { code: "VMATH.SO.B", lessonRef: "KNTT-T1-B99" },
      { code: "VMATH.SO.C", expectedWeek: 36 },
    ]);
    // zod caps expectedWeek at 35, so build the object past the schema on purpose
    const r = validateSkillMaps([{ name: "t.json", map: m }], new Set(["KNTT-T1-B01"]));
    const msgs = r.errors.map((e) => e.message);
    expect(msgs.some((x) => x.includes('code strand "HH" != strand "SO"'))).toBe(true);
    expect(msgs.some((x) => x.includes('lessonRef "KNTT-T1-B99"'))).toBe(true);
    expect(msgs.some((x) => x.includes("expectedWeek 36"))).toBe(true);
  });

  it("orders prerequisites first", () => {
    const m = map("VMATH", [
      { code: "VMATH.SO.C", prerequisites: ["VMATH.SO.B"] },
      { code: "VMATH.SO.B", prerequisites: ["VMATH.SO.A"] },
      { code: "VMATH.SO.A" },
    ]);
    expect(topoOrder(m.skills).map((s) => s.code)).toEqual([
      "VMATH.SO.A",
      "VMATH.SO.B",
      "VMATH.SO.C",
    ]);
  });
});

describe("content/ on disk (docs/08 phase 1 item 1)", () => {
  const maps = loadSkillMaps();
  const unitFiles = loadLessonUnitFiles();
  const taxonomy = loadErrorTaxonomy();

  it("has six subjects with >= 35 skills each and >= 250 in total, no errors", () => {
    const lessonCodes = new Set(unitFiles.flatMap((f) => f.units.units.map((u) => u.code)));
    const r = validateSkillMaps(maps, lessonCodes);
    expect(r.errors).toEqual([]);
    expect(Object.keys(r.bySubject).sort()).toEqual([
      "EMATH",
      "ENL",
      "ESCI",
      "ESL",
      "VIET",
      "VMATH",
    ]);
    for (const n of Object.values(r.bySubject)) expect(n).toBeGreaterThanOrEqual(35);
    expect(r.total).toBeGreaterThanOrEqual(MIN_SKILLS_TOTAL);
  });

  it("has the 83 Vietnamese lessons, 41 maths lessons and 8 reading topics as units", () => {
    const codes = unitFiles.flatMap((f) => f.units.units.map((u) => u.code));
    const tv1 = codes.filter((c) => /^KNTT-TV1-T1-B\d{2}$/.test(c) && c !== "KNTT-TV1-T1-B00");
    const toan = codes.filter((c) => /^KNTT-T1-B\d{2}$/.test(c) && c !== "KNTT-T1-B00");
    const topics = new Set(
      codes.map((c) => /^KNTT-TV1-T2-CD(\d)-/.exec(c)?.[1]).filter((x): x is string => !!x),
    );
    expect(tv1).toHaveLength(83);
    expect(toan).toHaveLength(41);
    expect(topics.size).toBe(8);
    expect(
      validateLessonUnits(unitFiles, new Set(maps.flatMap((m) => m.map.skills.map((s) => s.code)))),
    ).toEqual([]);
  });

  it("has ~40 error codes that only reference existing skills", () => {
    expect(taxonomy).not.toBeNull();
    const skillCodes = new Set(maps.flatMap((m) => m.map.skills.map((s) => s.code)));
    expect(validateErrorTaxonomy(taxonomy!, skillCodes)).toEqual([]);
    expect(taxonomy!.codes.length).toBeGreaterThanOrEqual(40);
    for (const code of ["nham_b_d", "dem_thieu_1", "nham_have_has", "doan_bua"])
      expect(taxonomy!.codes.some((c) => c.code === code)).toBe(true);
  });

  it("keeps the phase-1 acceptance skill for full-text search", () => {
    const esl = maps.find((m) => m.map.subject === "ESL")!;
    const s = esl.map.skills.find((x) => x.code === "ESL.PH.DIGRAPHS_SH_CH_TH")!;
    expect(s.nameVi).toMatch(/sh/);
  });
});
