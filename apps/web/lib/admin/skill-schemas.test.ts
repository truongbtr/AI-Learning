import { describe, expect, it } from "vitest";
import { csvToSkillMap, importSkillsSchema, patchSkillSchema, splitCsvLine } from "./skill-schemas";

describe("splitCsvLine", () => {
  it("honours quoted fields, commas inside them and doubled quotes", () => {
    expect(splitCsvLine("a,b,c")).toEqual(["a", "b", "c"]);
    expect(splitCsvLine('a,"b,với dấu phẩy",c')).toEqual(["a", "b,với dấu phẩy", "c"]);
    expect(splitCsvLine('a,"nói ""xin chào""",c')).toEqual(["a", 'nói "xin chào"', "c"]);
    expect(splitCsvLine("a,,c")).toEqual(["a", "", "c"]);
  });
});

describe("csvToSkillMap", () => {
  const header = "code,strand,nameVi,nameEn,description,expectedWeek,prerequisites,exerciseTypes";
  const row =
    'VMATH.SO.THU,SO,Thử,Test,"Mô tả dài. Ví dụ: 1 + 1. Lỗi thường gặp: quên.",7,VMATH.SO.SO_0_5,MCQ COUNT_TAP';

  it("maps a CSV into the skill-map file shape", () => {
    const { subject, skills } = csvToSkillMap(`${header}\n${row}`);
    expect(subject).toBe("VMATH");
    expect(skills).toHaveLength(1);
    expect(skills[0]).toMatchObject({
      code: "VMATH.SO.THU",
      strand: "SO",
      nameVi: "Thử",
      expectedWeek: 7,
      prerequisites: ["VMATH.SO.SO_0_5"],
      exerciseTypes: ["MCQ", "COUNT_TAP"],
      difficultyRange: [1, 5],
    });
  });

  it("takes the subject from the code when there is no column", () => {
    expect(csvToSkillMap(`${header}\n${row}`).subject).toBe("VMATH");
    expect(csvToSkillMap(`${header}\n${row}`, "VMATH").subject).toBe("VMATH");
  });

  it("rejects a missing required column, an empty file and mixed subjects", () => {
    expect(() => csvToSkillMap("code,strand\nVMATH.SO.X,SO")).toThrow(/thiếu cột/);
    expect(() => csvToSkillMap(header)).toThrow(/ít nhất một dòng/);
    const mixed = `subject,${header}\nVMATH,VMATH.SO.A,SO,A,A,"x. Ví dụ: y. Lỗi thường gặp: z.",1,,MCQ\nVIET,VIET.HV.B,HV,B,B,"x. Ví dụ: y. Lỗi thường gặp: z.",1,,MCQ`;
    expect(() => csvToSkillMap(mixed)).toThrow(/nhiều môn/);
  });
});

describe("patchSkillSchema", () => {
  it("requires at least one field and validates prerequisite codes", () => {
    expect(patchSkillSchema.safeParse({}).success).toBe(false);
    expect(patchSkillSchema.safeParse({ nameVi: "Tên mới" }).success).toBe(true);
    expect(patchSkillSchema.safeParse({ isActive: false }).success).toBe(true);
    expect(patchSkillSchema.safeParse({ prerequisites: ["khong-phai-ma"] }).success).toBe(false);
    expect(patchSkillSchema.safeParse({ expectedWeek: 36 }).success).toBe(false);
    expect(patchSkillSchema.safeParse({ expectedWeek: null }).success).toBe(true);
  });
});

describe("importSkillsSchema", () => {
  it("defaults to a dry run", () => {
    const parsed = importSkillsSchema.parse({ format: "json", text: "{}" });
    expect(parsed.dryRun).toBe(true);
  });
});
