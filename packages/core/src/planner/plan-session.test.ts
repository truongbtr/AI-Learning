import { describe, expect, it } from "vitest";
import {
  adaptDifficulty,
  difficultyFor,
  isWeak,
  MIN_REVIEW_SHARE,
  MIX_FOCUS,
  MIX_REVIEW,
  PLAN_SHARE,
  plannerMix,
  planSession,
  slotCount,
  timetableRank,
} from "./plan-session";
import type { PlannerInput, SkillSnapshot } from "./types";

const skill = (over: Partial<SkillSnapshot> & { code: string }): SkillSnapshot => ({
  subject: "VIET",
  mastery: 50,
  status: "LEARNING",
  confidence: 0.5,
  nextReviewAt: null,
  overdueDays: -1,
  trend14d: 0,
  evidenceCount: 5,
  prerequisites: [],
  confusableWith: [],
  ...over,
});

const base = (over: Partial<PlannerInput> = {}): PlannerInput => ({
  date: new Date("2026-09-14T08:00:00+07:00"),
  dailyMinutes: 15,
  skills: [
    skill({ code: "VIET.HV.AM_A", mastery: 80, status: "SOLID" }),
    skill({ code: "VIET.HV.AM_B", mastery: 55 }),
    skill({ code: "VIET.HV.AM_C", mastery: 40, status: "NEEDS_PRACTICE" }),
    skill({ code: "VMATH.SO.SO_0_5", subject: "VMATH", mastery: 70, status: "SOLID" }),
    skill({ code: "VMATH.SO.CONG_PV_10", subject: "VMATH", mastery: 45 }),
    skill({
      code: "VMATH.SO.TRU_PV_10",
      subject: "VMATH",
      mastery: 60,
      nextReviewAt: new Date("2026-09-11T00:00:00+07:00"),
      overdueDays: 3,
    }),
  ],
  ...over,
});

describe("how long a session is", () => {
  it("is about a minute and a third per exercise, inside 8 and 15", () => {
    expect(slotCount(15)).toBe(12);
    expect(slotCount(5)).toBe(8);
    expect(slotCount(40)).toBe(15);
  });
});

describe("how hard an exercise is", () => {
  it("follows mastery", () => {
    expect(difficultyFor(0)).toBe(1);
    expect(difficultyFor(50)).toBe(3);
    expect(difficultyFor(100)).toBe(5);
  });

  it("bends with the child's bias and the ladder's delta", () => {
    expect(difficultyFor(50, 1)).toBe(4);
    expect(difficultyFor(50, 0, -1)).toBe(2);
    expect(difficultyFor(100, 1)).toBe(5);
  });

  it("comes down a step after two wrong answers in a row", () => {
    expect(adaptDifficulty(4, true)).toBe(3);
    expect(adaptDifficulty(1, true)).toBe(1);
    expect(adaptDifficulty(4, false)).toBe(4);
  });
});

describe("what counts as weak (docs/04 §3.5)", () => {
  it("is NEEDS_PRACTICE, or learning-but-stuck, or a repeated mistake", () => {
    expect(isWeak(skill({ code: "x", status: "NEEDS_PRACTICE" }))).toBe(true);
    expect(isWeak(skill({ code: "x", status: "LEARNING", evidenceCount: 4, mastery: 40 }))).toBe(
      true,
    );
    expect(isWeak(skill({ code: "x", status: "SOLID", mastery: 70 }))).toBe(false);
    expect(isWeak(skill({ code: "x", status: "SOLID", mastery: 70 }), 2)).toBe(true);
  });
});

describe("the shape of a daily quest", () => {
  it("starts with something solid and ends with something certain", () => {
    const plan = planSession(base());
    expect(plan.slots[0]?.kind).toBe("warmup");
    expect(plan.slots.at(-1)?.kind).toBe("finish");
    expect(plan.slots).toHaveLength(12);
  });

  it("never puts three exercises of the same subject in a row", () => {
    const plan = planSession(base());
    let run = 1;
    for (let i = 1; i < plan.slots.length; i++) {
      run = plan.slots[i]?.subject === plan.slots[i - 1]?.subject ? run + 1 : 1;
      expect(run).toBeLessThanOrEqual(2);
    }
  });

  it("says why every exercise is there", () => {
    const plan = planSession(base());
    for (const slot of plan.slots) expect(slot.reason.length).toBeGreaterThan(4);
  });

  it("puts what the class did today at the front of the focus half", () => {
    const plan = planSession(base({ lessonSkills: ["VIET.HV.AM_B"] }));
    const focus = plan.slots.filter((s) => s.kind === "focus");
    expect(focus[0]?.skillCode).toBe("VIET.HV.AM_B");
    expect(focus[0]?.reason).toContain("bài lớp học hôm nay");
  });

  it("brings back what is overdue, most overdue first", () => {
    const plan = planSession(base());
    const review = plan.slots.filter((s) => s.kind === "review");
    expect(review[0]?.skillCode).toBe("VMATH.SO.TRU_PV_10");
    expect(review[0]?.reason).toContain("quá hạn 3 ngày");
  });

  it("holds a new skill back until its prerequisite is solid", () => {
    const withNew = base({
      skills: [
        ...base().skills,
        skill({
          code: "VIET.HV.AM_D_DD",
          status: "NOT_STARTED",
          evidenceCount: 0,
          mastery: 0,
          prerequisites: ["VIET.HV.AM_C"], // only 40 → not ready
        }),
        skill({
          code: "VIET.HV.AM_E_EE",
          status: "NOT_STARTED",
          evidenceCount: 0,
          mastery: 0,
          prerequisites: ["VIET.HV.AM_A"], // 80 → ready
        }),
      ],
    });
    const plan = planSession(withNew);
    const fresh = plan.slots.filter((s) => s.kind === "new").map((s) => s.skillCode);
    expect(fresh).toContain("VIET.HV.AM_E_EE");
    expect(fresh).not.toContain("VIET.HV.AM_D_DD");
  });
});

describe("the case docs/08 names: two b/d mistakes in a week", () => {
  const input = base({
    skills: [
      ...base().skills,
      skill({
        code: "VIET.HV.NHAM_LAN_B_D",
        mastery: 38,
        status: "NEEDS_PRACTICE",
        confusableWith: ["VIET.HV.AM_B", "VIET.HV.AM_D_DD"],
      }),
    ],
    activeErrors: [
      {
        code: "nham_b_d",
        count7d: 2,
        remediationSkills: ["VIET.HV.NHAM_LAN_B_D", "VIET.HV.AM_B"],
      },
    ],
    tracks: [
      {
        skillCode: "VIET.HV.NHAM_LAN_B_D",
        errorCode: "nham_b_d",
        rung: 5,
        status: "ACTIVE",
        lastStepAt: null,
      },
    ],
  });

  it("drills b/d in the next session, with contrast exercises", () => {
    const plan = planSession(input);
    const drill = plan.slots.filter((s) => s.kind === "remediation");
    expect(drill.length).toBeGreaterThan(0);
    expect(drill.every((s) => s.errorCode === "nham_b_d")).toBe(true);
    // rung 5 is the contrast pair: the picker is asked for exercises that target the error
    expect(drill.every((s) => s.prefer?.targetsError === "nham_b_d")).toBe(true);
    expect(plan.remediating).toEqual([
      { skillCode: "VIET.HV.NHAM_LAN_B_D", errorCode: "nham_b_d", rung: 5 },
    ]);
  });

  it("keeps the drilling to four exercises, so the session is not all drilling", () => {
    const plan = planSession(input);
    const drill = plan.slots.filter((s) => s.kind === "remediation");
    expect(drill.length).toBeLessThanOrEqual(4);
    expect(drill.length).toBeLessThan(plan.slots.length / 2);
  });

  it("asks the mascot to model one first when the ladder is on rung 3", () => {
    const plan = planSession({
      ...input,
      tracks: [
        {
          skillCode: "VIET.HV.NHAM_LAN_B_D",
          errorCode: "nham_b_d",
          rung: 3,
          status: "ACTIVE",
          lastStepAt: null,
        },
      ],
    });
    const drill = plan.slots.filter((s) => s.kind === "remediation");
    expect(drill.every((s) => s.prefer?.scaffold === "model")).toBe(true);
  });

  it("goes back to the prerequisite on rung 4", () => {
    const plan = planSession({
      ...input,
      skills: input.skills.map((s) =>
        s.code === "VIET.HV.NHAM_LAN_B_D" ? { ...s, prerequisites: ["VIET.HV.AM_B"] } : s,
      ),
      tracks: [
        {
          skillCode: "VIET.HV.NHAM_LAN_B_D",
          errorCode: "nham_b_d",
          rung: 4,
          status: "ACTIVE",
          lastStepAt: null,
        },
      ],
    });
    const drill = plan.slots.filter((s) => s.kind === "remediation");
    expect(drill.every((s) => s.skillCode === "VIET.HV.AM_B")).toBe(true);
  });

  it("never drills more than two skills at once", () => {
    const plan = planSession({
      ...input,
      tracks: [
        {
          skillCode: "VIET.HV.NHAM_LAN_B_D",
          errorCode: "nham_b_d",
          rung: 1,
          status: "ACTIVE",
          lastStepAt: null,
        },
        {
          skillCode: "VIET.HV.AM_C",
          errorCode: "nham_c_k_q",
          rung: 1,
          status: "ACTIVE",
          lastStepAt: null,
        },
        {
          skillCode: "VMATH.SO.CONG_PV_10",
          errorCode: "nham_cong_tru",
          rung: 1,
          status: "ACTIVE",
          lastStepAt: null,
        },
      ],
    });
    expect(plan.remediating).toHaveLength(2);
  });
});

/**
 * docs/08 pha 5, tiêu chí 2 and 3 — the two promises the parent dashboard makes about tomorrow.
 */
describe("the timetable and the approved plan steer tomorrow (docs/05 §2, FR-PAR-03, FR-PAR-06)", () => {
  it("ranks a subject by where it sits on today's timetable", () => {
    expect(timetableRank("VIET", ["VIET", "VMATH"])).toBe(2);
    expect(timetableRank("VMATH", ["VIET", "VMATH"])).toBe(1);
    expect(timetableRank("ESL", ["VIET", "VMATH"])).toBe(0);
    expect(timetableRank("ESL", undefined)).toBe(0);
  });

  it("changing the timetable changes which subject leads the session", () => {
    const vietDay = planSession(base({ todaySubjects: ["VIET"] }));
    const mathDay = planSession(base({ todaySubjects: ["VMATH"] }));
    // The warm-up is chosen on mastery, so the timetable shows in the first real station after it.
    expect(vietDay.slots[1]?.subject).toBe("VIET");
    expect(mathDay.slots[1]?.subject).toBe("VMATH");
  });

  it("gives the day's subject more of the session than a subject with no lesson today", () => {
    const count = (plan: ReturnType<typeof planSession>, subject: string) =>
      plan.slots.filter((s) => s.subject === subject).length;
    const mathDay = planSession(base({ todaySubjects: ["VMATH"] }));
    expect(count(mathDay, "VMATH")).toBeGreaterThan(count(mathDay, "VIET"));
  });

  it("says in the log which subject it favoured, so a parent can see why", () => {
    const plan = planSession(base({ todaySubjects: ["VMATH", "ESCI"] }));
    expect(plan.log.join("\n")).toContain("ưu tiên VMATH");
  });

  it("gives an approved plan its share of the session", () => {
    const plan = planSession(
      base({ planSkills: ["VMATH.SO.CONG_PV_10", "VIET.HV.AM_B", "VMATH.SO.SO_0_5"] }),
    );
    const mine = plan.slots.filter((s) =>
      ["VMATH.SO.CONG_PV_10", "VIET.HV.AM_B", "VMATH.SO.SO_0_5"].includes(s.skillCode),
    ).length;
    expect(mine).toBeGreaterThanOrEqual(Math.ceil(plan.slots.length * PLAN_SHARE));
    expect(plan.log.join("\n")).toMatch(/kế hoạch tuần đã duyệt/);
  });

  /**
   * A plan may not push the teacher's own homework or today's lesson out of the way: the class
   * comes first, and a plan written on Sunday cannot know what Wednesday's lesson turned out to be.
   */
  it("never displaces what the class did today to make room for the plan", () => {
    const plan = planSession(
      base({
        planSkills: ["VMATH.SO.CONG_PV_10", "VMATH.SO.SO_0_5", "VMATH.SO.TRU_PV_10"],
        lessonSkills: ["VIET.HV.AM_C"],
      }),
    );
    expect(plan.slots.some((s) => s.skillCode === "VIET.HV.AM_C")).toBe(true);
  });

  it("changes nothing when no plan has been approved", () => {
    const plan = planSession(base());
    expect(plan.log.join("\n")).not.toMatch(/kế hoạch tuần đã duyệt/);
  });
});

describe("an approved plan owns its share of the whole session, homework included", () => {
  const share = (plan: ReturnType<typeof planSession>, codes: string[]) =>
    plan.slots.filter((s) => codes.includes(s.skillCode)).length;

  it("fills a plan of few skills by coming back to them, not by giving up", () => {
    const codes = ["VMATH.SO.CONG_PV_10", "VIET.HV.AM_B"];
    const plan = planSession(base({ planSkills: codes }));
    expect(share(plan, codes)).toBeGreaterThanOrEqual(Math.ceil(plan.slots.length * PLAN_SHARE));
  });

  it("counts the teacher's homework in the share it has to reach", () => {
    const codes = ["VMATH.SO.CONG_PV_10", "VIET.HV.AM_B", "VMATH.SO.SO_0_5"];
    const extraSlots = 4;
    const withHomework = planSession(base({ planSkills: codes, extraSlots }));
    const without = planSession(base({ planSkills: codes }));
    // Four stations the planner does not build still have to be paid for out of the ones it does,
    // so the bar it clears is the one computed on everything the child is handed.
    expect(share(withHomework, codes)).toBeGreaterThanOrEqual(
      Math.ceil((withHomework.slots.length + extraSlots) * PLAN_SHARE),
    );
    expect(Math.ceil((withHomework.slots.length + extraSlots) * PLAN_SHARE)).toBeGreaterThan(
      Math.ceil(without.slots.length * PLAN_SHARE),
    );
  });

  /**
   * ADR-18 §1, reversed by the owner on 12/09/2026. The review slots are the spaced repetition;
   * a fortnight's plan may not borrow from them to hit its own number.
   */
  it("never takes the review share to pay for the plan", () => {
    const codes = ["VMATH.SO.CONG_PV_10", "VIET.HV.AM_B", "VMATH.SO.SO_0_5"];
    const due = (code: string, overdueDays: number) =>
      skill({
        code,
        subject: "ESL" as const,
        mastery: 62,
        nextReviewAt: new Date("2026-09-10T00:00:00+07:00"),
        overdueDays,
      });
    // A week that piled up reviews — exactly the case ADR-18 worried about.
    const input = base({
      planSkills: codes,
      skills: [
        ...(base().skills as SkillSnapshot[]),
        due("ESL.PH.A", 6),
        due("ESL.PH.B", 5),
        due("ESL.PH.C", 4),
        due("ESL.PH.D", 3),
      ],
    });
    const withPlan = planSession(input);
    const withoutPlan = planSession({ ...input, planSkills: undefined });

    const reviews = (p: ReturnType<typeof planSession>) =>
      p.slots.filter((s) => s.kind === "review").length;
    // The floor is what the 30% of docs/04 §4 asked for, computed on the same session length.
    expect(reviews(withPlan)).toBeGreaterThan(0);
    expect(reviews(withPlan)).toBeGreaterThanOrEqual(
      Math.min(reviews(withoutPlan), Math.floor(withPlan.slots.length * MIX_REVIEW)),
    );
    expect(withPlan.log.join("\n")).toMatch(/giữ \d+\/\d+ bài ôn/);
  });
});

describe("the review floor an ops request cannot get under (docs/14 sec. 4)", () => {
  it("plannerMix clamps review to 30% however low it is asked to go", () => {
    expect(plannerMix()).toEqual({ focus: MIX_FOCUS, review: MIX_REVIEW });
    expect(plannerMix({ focus: 0.7, review: 0.2 }).review).toBe(MIN_REVIEW_SHARE);
    expect(plannerMix({ review: 0 }).review).toBe(MIN_REVIEW_SHARE);
    // Focus never eats into what review was just guaranteed.
    expect(plannerMix({ focus: 0.9, review: 0.3 })).toEqual({ focus: 0.7, review: 0.3 });
  });

  it("a session planned with a 20% mix still keeps the 30% of review slots", () => {
    const due = (code: string, overdueDays: number): SkillSnapshot =>
      skill({
        code,
        subject: "ESL",
        mastery: 65,
        status: "SOLID",
        nextReviewAt: new Date("2026-09-10T00:00:00+07:00"),
        overdueDays,
      });
    const input = base({
      skills: [
        ...(base().skills as SkillSnapshot[]),
        due("ESL.PH.A", 6),
        due("ESL.PH.B", 5),
        due("ESL.PH.C", 4),
        due("ESL.PH.D", 3),
      ],
    });
    const floored = planSession({ ...input, mix: { focus: 0.7, review: 0.2 } });
    const normal = planSession(input);
    const reviews = (p: ReturnType<typeof planSession>) =>
      p.slots.filter((s) => s.kind === "review").length;
    // Asking for 20% buys nothing: the clamp is in the planner, not in the caller.
    expect(reviews(floored)).toBe(reviews(normal));
  });

  it("a mix that raises review above the floor is honoured", () => {
    const due = (code: string, overdueDays: number): SkillSnapshot =>
      skill({
        code,
        subject: "ESL",
        mastery: 65,
        status: "SOLID",
        nextReviewAt: new Date("2026-09-10T00:00:00+07:00"),
        overdueDays,
      });
    const input = base({
      skills: [
        ...(base().skills as SkillSnapshot[]),
        due("ESL.PH.A", 6),
        due("ESL.PH.B", 5),
        due("ESL.PH.C", 4),
        due("ESL.PH.D", 3),
        due("ESL.PH.E", 2),
      ],
    });
    const more = planSession({ ...input, mix: { focus: 0.3, review: 0.6 } });
    const normal = planSession(input);
    const reviews = (p: ReturnType<typeof planSession>) =>
      p.slots.filter((s) => s.kind === "review").length;
    expect(reviews(more)).toBeGreaterThan(reviews(normal));
  });
});
