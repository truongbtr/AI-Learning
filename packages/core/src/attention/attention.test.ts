import { describe, expect, it } from "vitest";
import {
  type AttentionErrorInput,
  type AttentionSkillInput,
  activityFor,
  attentionPoints,
  isWeakForAttention,
  shortSkillName,
} from "./attention";

const error = (over: Partial<AttentionErrorInput> = {}): AttentionErrorInput => ({
  code: "nham_b_d",
  nameVi: "Nhầm b và d",
  group: "viet_am_chu",
  count7d: 4,
  count30d: 6,
  lastAt: new Date("2026-09-12"),
  remediationSkills: ["VIET.HV.AM_B"],
  behavioural: false,
  ...over,
});

const skill = (over: Partial<AttentionSkillInput> = {}): AttentionSkillInput => ({
  code: "VIET.HV.AM_B",
  nameVi: "Âm b",
  subject: "VIET",
  mastery: 40,
  status: "NEEDS_PRACTICE",
  confidence: 0.6,
  evidenceCount: 5,
  trend14d: 0,
  prerequisites: [],
  ...over,
});

describe("3 điều cần chú ý, v1 by rule (docs/04 §3.5, §11.5)", () => {
  describe("what counts as weak (§3.5)", () => {
    it("NEEDS_PRACTICE is weak", () => {
      expect(isWeakForAttention(skill({ status: "NEEDS_PRACTICE" }))).toBe(true);
    });

    it("LEARNING with at least 3 pieces of evidence and mastery under 50 is weak", () => {
      expect(isWeakForAttention(skill({ status: "LEARNING", evidenceCount: 3, mastery: 49 }))).toBe(
        true,
      );
      expect(isWeakForAttention(skill({ status: "LEARNING", evidenceCount: 2, mastery: 20 }))).toBe(
        false,
      );
      expect(isWeakForAttention(skill({ status: "LEARNING", evidenceCount: 9, mastery: 51 }))).toBe(
        false,
      );
    });

    /**
     * A slide of 8 points or more already makes the status NEEDS_PRACTICE upstream (`statusOf`,
     * §3.3), so "SOLID and sliding" is a state the database cannot hold. What matters here is that
     * this screen agrees with the planner rather than inventing a second rule.
     */
    it("sees a sliding skill as weak, through the status the model already gave it", () => {
      expect(
        isWeakForAttention(skill({ status: "NEEDS_PRACTICE", mastery: 80, trend14d: -12 })),
      ).toBe(true);
      expect(isWeakForAttention(skill({ status: "SOLID", mastery: 80, trend14d: -7 }))).toBe(false);
    });

    it("two of the same mistake in a fortnight is weak", () => {
      expect(
        isWeakForAttention(
          skill({ status: "SOLID", mastery: 80, errorCounts14d: { nham_b_d: 2 } }),
        ),
      ).toBe(true);
    });
  });

  it("says what, how often, which rung and what to do tonight", () => {
    const [point] = attentionPoints({
      errors: [error()],
      skills: [skill()],
      tracks: [
        { skillCode: "VIET.HV.AM_B", errorCode: "nham_b_d", rung: 5, status: "ACTIVE" as const },
      ],
    });
    expect(point).toBeDefined();
    expect(point?.title).toBe("Nhầm b và d");
    expect(point?.countLabel).toBe("4 lần trong 7 ngày");
    expect(point?.rung).toBe(5);
    expect(point?.rungLabel).toBe("Đối chiếu cặp dễ nhầm cạnh nhau");
    expect(point?.suggestion).toContain("nhầm b và d");
    // and the handles the dashboard needs to open the evidence
    expect(point?.errorCode).toBe("nham_b_d");
    expect(point?.skillCode).toBe("VIET.HV.AM_B");
  });

  it("ignores a mistake seen only once — that is noise, not a pattern (§11.3)", () => {
    const points = attentionPoints({
      errors: [error({ count7d: 1, count30d: 1 })],
      skills: [],
    });
    expect(points).toHaveLength(0);
  });

  it("keeps a mistake that has faded this week but was frequent this month", () => {
    const [point] = attentionPoints({
      errors: [error({ count7d: 0, count30d: 5 })],
      skills: [],
    });
    expect(point?.countLabel).toBe("5 lần trong 30 ngày");
  });

  it("returns at most three, worst first", () => {
    const points = attentionPoints({
      errors: [
        error({ code: "nham_b_d", count7d: 2 }),
        error({ code: "dem_thieu_1", nameVi: "Đếm thiếu 1", group: "toan_dem_so", count7d: 9 }),
        error({ code: "nham_s_x", nameVi: "Nhầm s và x", count7d: 5 }),
        error({ code: "nham_hoi_nga", nameVi: "Nhầm hỏi ngã", count7d: 4 }),
      ],
      skills: [],
    });
    expect(points).toHaveLength(3);
    expect(points.map((p) => p.count)).toEqual([9, 5, 4]);
  });

  /**
   * The rule that stops a week being wasted: the child is stuck on a skill, but the thing under it
   * is weaker still, so that is what gets the five minutes.
   */
  it("reports the weaker prerequisite instead of the skill on top of it", () => {
    const [point] = attentionPoints({
      errors: [],
      skills: [
        skill({
          code: "VIET.HV.VAN_AN",
          nameVi: "Vần an",
          mastery: 45,
          prerequisites: ["VIET.HV.AM_N"],
        }),
        skill({ code: "VIET.HV.AM_N", nameVi: "Âm n", mastery: 20, status: "LEARNING" }),
      ],
    });
    expect(point?.kind).toBe("PREREQUISITE");
    expect(point?.skillCode).toBe("VIET.HV.AM_N");
    expect(point?.title).toBe("Vần an — nhưng gốc là Âm n");
    expect(point?.suggestion).toContain("Âm n");
  });

  it("leaves the skill alone when its prerequisite is the stronger of the two", () => {
    const [point] = attentionPoints({
      errors: [],
      skills: [
        skill({
          code: "VIET.HV.VAN_AN",
          nameVi: "Vần an",
          mastery: 45,
          prerequisites: ["VIET.HV.AM_N"],
        }),
        skill({ code: "VIET.HV.AM_N", nameVi: "Âm n", mastery: 90, status: "MASTERED" }),
      ],
    });
    expect(point?.kind).toBe("SKILL");
    expect(point?.skillCode).toBe("VIET.HV.VAN_AN");
  });

  it("does not report the same skill twice through a mistake and again on its own", () => {
    const points = attentionPoints({
      errors: [error()],
      skills: [skill()],
    });
    expect(points).toHaveLength(1);
    expect(points[0]?.kind).toBe("ERROR");
  });

  /**
   * Guessing and leaving blanks are worth telling a parent, but a parent who reads them first
   * concludes their child is careless when the truth is that they are stuck.
   */
  it("puts a behaviour code below a mistake of knowledge, however often it happens", () => {
    const points = attentionPoints({
      errors: [
        error({
          code: "doan_bua",
          nameVi: "Đoán bừa",
          group: "chung_hanh_vi",
          count7d: 12,
          behavioural: true,
          remediationSkills: [],
        }),
        error({ count7d: 2 }),
      ],
      skills: [skill()],
    });
    expect(points[0]?.kind).toBe("ERROR");
    expect(points[1]?.kind).toBe("BEHAVIOUR");
  });

  it("calls out a skill that is sliding, and says by how much", () => {
    const [point] = attentionPoints({
      errors: [],
      skills: [skill({ status: "NEEDS_PRACTICE", mastery: 78, trend14d: -12, prerequisites: [] })],
    });
    expect(point?.title).toContain("đang đi xuống");
    expect(point?.countLabel).toBe("giảm 12 điểm trong 14 ngày");
  });

  it("has a five-minute activity for every family of mistake, and a fallback", () => {
    for (const group of [
      "viet_am_chu",
      "viet_dau_thanh",
      "viet_doc",
      "viet_viet",
      "toan_dem_so",
      "toan_phep_tinh",
      "toan_so_sanh",
      "anh_ngu_phap",
      "anh_am_chu",
      "chung_hanh_vi",
    ])
      expect(activityFor(group, "Thử").length).toBeGreaterThan(30);
    expect(activityFor("nhom_moi_chua_biet", "Lỗi mới")).toContain("lỗi mới");
  });

  it("never uses the word a child must not read about themselves", () => {
    const points = attentionPoints({ errors: [error()], skills: [skill()] });
    for (const p of points) expect(`${p.title} ${p.suggestion}`).not.toMatch(/\bsai\b/i);
  });

  it("is empty when there is nothing worth an evening", () => {
    expect(
      attentionPoints({
        errors: [],
        skills: [skill({ status: "MASTERED", mastery: 92, trend14d: 3 })],
      }),
    ).toHaveLength(0);
  });
});

/**
 * Names in the skill map spell out their whole scope after a colon. Two of those in one sentence
 * is a title nobody reads, which is the same as no title at all.
 */
describe("skill names in a sentence", () => {
  it("keeps the part before the colon", () => {
    expect(
      shortSkillName("Tính từ tả người: old, young, tall, short, funny, kind, cute, smart"),
    ).toBe("Tính từ tả người");
  });

  it("leaves a short name exactly as it is", () => {
    expect(shortSkillName("Âm b")).toBe("Âm b");
  });

  it("cuts a long name on a word rather than mid-syllable", () => {
    const long = shortSkillName("Cộng trừ trong phạm vi 10 có nhớ và không nhớ theo hàng đơn vị");
    expect(long.length).toBeLessThanOrEqual(43);
    expect(long.endsWith("…")).toBe(true);
    expect(long).not.toMatch(/ …$/);
  });

  it("uses the short name in the prerequisite title and in tonight's activity", () => {
    const [point] = attentionPoints({
      errors: [],
      skills: [
        skill({
          code: "ESL.VOC.ADJECTIVES",
          nameVi: "Tính từ tả người: old, young, tall, short, funny, kind, cute, smart",
          mastery: 45,
          prerequisites: ["ESL.VOC.FAMILY"],
        }),
        skill({ code: "ESL.VOC.FAMILY", nameVi: "Từ vựng gia đình", mastery: 15 }),
      ],
    });
    expect(point?.title).toBe("Tính từ tả người — nhưng gốc là Từ vựng gia đình");
    expect(point?.suggestion).not.toContain("smart");
  });
});
