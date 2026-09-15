import { describe, expect, it } from "vitest";
import {
  buildCityState,
  bustleFor,
  type CityInput,
  type CitySkillInput,
  cityChanges,
  decorationFor,
  landFromStars,
  levelFor,
  majoritySubject,
  mergeSkillOrder,
  mondayOfDayKey,
  nextMasteredSince,
  petFor,
  plotCost,
  publicBuildingsFor,
  skillLabel,
  snapshotOf,
  starsForPlots,
  townHallOrderFor,
  unlockedPlotBuilds,
  wonderProgress,
} from "./rules";

const now = new Date("2026-10-20T10:00:00+07:00");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

describe("mastery → building level (Pha 10 §3)", () => {
  it("follows the bands 0–39 / 40–59 / 60–84 / 85+", () => {
    const lv = (mastery: number) =>
      levelFor({ mastery, status: "LEARNING", masteredSince: null }, now);
    expect([0, 39.9, 40, 59, 60, 84.9, 85, 100].map(lv)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });

  it("becomes a skyscraper only when MASTERED has held for 30 days", () => {
    expect(levelFor({ mastery: 92, status: "MASTERED", masteredSince: daysAgo(29) }, now)).toBe(3);
    expect(levelFor({ mastery: 92, status: "MASTERED", masteredSince: daysAgo(30) }, now)).toBe(4);
    // status slipped: no skyscraper even if the date is old
    expect(levelFor({ mastery: 86, status: "SOLID", masteredSince: daysAgo(90) }, now)).toBe(3);
  });

  it("keeps masteredSince while MASTERED, sets it on entry, clears it on exit", () => {
    const t = daysAgo(40);
    expect(nextMasteredSince("SOLID", null, "MASTERED", now)).toEqual(now);
    expect(nextMasteredSince("MASTERED", t, "MASTERED", now)).toEqual(t);
    expect(nextMasteredSince("MASTERED", null, "MASTERED", now)).toEqual(now);
    expect(nextMasteredSince("MASTERED", t, "SOLID", now)).toBeNull();
  });
});

describe("stars → land (nothing is ever spent)", () => {
  it("opens the first plot at 20 stars and asks a little more each time", () => {
    expect(plotCost(0)).toBe(20);
    expect(plotCost(1)).toBe(25);
    expect(starsForPlots(2)).toBe(45);
    expect(landFromStars(0)).toEqual({ owned: 0, nextCost: 20, progress: 0 });
    expect(landFromStars(19)).toEqual({ owned: 0, nextCost: 20, progress: 19 });
    expect(landFromStars(20)).toEqual({ owned: 1, nextCost: 25, progress: 0 });
    expect(landFromStars(46)).toEqual({ owned: 2, nextCost: 30, progress: 1 });
  });

  it("never loses land when the total grows", () => {
    let prev = 0;
    for (let s = 0; s < 2000; s += 7) {
      const { owned } = landFromStars(s);
      expect(owned).toBeGreaterThanOrEqual(prev);
      prev = owned;
    }
  });

  it("gives a session's bonus to the subject most stations were about", () => {
    expect(majoritySubject(["VIET", "VMATH", "VIET"])).toBe("VIET");
    expect(majoritySubject([])).toBeNull();
  });

  it("opens plot builds as buildings become steady", () => {
    expect(unlockedPlotBuilds([])).toEqual(["house", "garden", "pond"]);
    expect(unlockedPlotBuilds([2, 2, 3, 1, 0])).toHaveLength(4);
    expect(unlockedPlotBuilds(Array(40).fill(4))).toHaveLength(10);
  });
});

describe("badges → public buildings", () => {
  it("adds one building per badge, city-flavoured first, at least 12 per city", () => {
    expect(publicBuildingsFor("esl", 1)).toEqual(["aquarium"]);
    expect(publicBuildingsFor("enl", 2)).toEqual(["library", "theater"]);
    expect(publicBuildingsFor("vmath", 0)).toEqual([]);
    for (const city of ["viet", "vmath", "esl", "enl", "emath", "esci"] as const) {
      const all = publicBuildingsFor(city, 99);
      expect(all.length).toBeGreaterThanOrEqual(12);
      expect(new Set(all).size).toBe(all.length);
    }
  });
});

describe("weeks → wonder pieces", () => {
  it("finds the Monday of a day", () => {
    expect(mondayOfDayKey("2026-09-13")).toBe("2026-09-07"); // Sunday
    expect(mondayOfDayKey("2026-09-14")).toBe("2026-09-14"); // Monday
  });

  it("adds a piece for every week with ≥ 4 learning days and never resets after a missed week", () => {
    const week1 = ["2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10"];
    const week2 = ["2026-09-14", "2026-09-15"]; // missed
    const week3 = ["2026-09-21", "2026-09-22", "2026-09-24", "2026-09-26", "2026-09-26"];
    const p = wonderProgress([...week1, ...week2, ...week3], 6, "2026-09-26");
    expect(p.pieces).toBe(2);
    expect(p.thisWeekDays).toBe(4);
    expect(p.needed).toBe(4);
  });

  it("stops at the wonder's size", () => {
    const days: string[] = [];
    for (let w = 0; w < 12; w++) {
      for (let d = 0; d < 4; d++) {
        const t = new Date(Date.UTC(2026, 8, 7 + w * 7 + d));
        days.push(t.toISOString().slice(0, 10));
      }
    }
    expect(wonderProgress(days, 8, "2026-12-01").pieces).toBe(8);
  });
});

describe("streak, collectibles, pets, homework", () => {
  it("only ever gets busier", () => {
    const values = [0, 1, 2, 3, 6, 7, 13, 14, 200].map(bustleFor);
    expect(values).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });

  it("maps collectibles and pets onto what the city can draw", () => {
    expect(decorationFor("cau-vong")).toBe("rainbow");
    expect(decorationFor("unknown-thing")).toBe("flowerBed");
    expect(petFor("meo-con")).toBe("cat");
    expect(petFor("robot-nho")).toBe("dog");
  });

  it("turns today's homework into the town-hall order", () => {
    expect(townHallOrderFor([])).toBe("none");
    expect(townHallOrderFor([{ status: "PENDING", optional: false }])).toBe("open");
    expect(
      townHallOrderFor([
        { status: "DONE", optional: false },
        { status: "PENDING", optional: true },
      ]),
    ).toBe("done");
    expect(townHallOrderFor([{ status: "SKIPPED", optional: false }])).toBe("none");
  });
});

describe("sign labels", () => {
  it("picks a letter, an operator, a number or a word, at most 5 characters", () => {
    expect(skillLabel("viet", "VIET.HV.AM_A", "Âm a", "Letter a")).toBe("a");
    expect(skillLabel("viet", "VIET.HV.AM_E_EE", "Âm e, ê", "Letters e, ê")).toBe("e");
    expect(skillLabel("viet", "VIET.HV.DAU_SAC", "Dấu sắc", "Acute tone")).toBe("á");
    expect(skillLabel("vmath", "VMATH.SO.PHEP_CONG", "Phép cộng trong phạm vi 10", "Add")).toBe(
      "+",
    );
    expect(skillLabel("vmath", "VMATH.SO.SO_6_10", "Các số 6, 7, 8, 9, 10", "Numbers 6-10")).toBe(
      "10",
    );
    expect(skillLabel("esl", "ESL.VOC.COLORS", "Màu sắc", "Colors")).toBe("color");
    for (const l of [skillLabel("enl", "ENL.RF.X", "Đọc", "Reading foundations and more")]) {
      expect([...l].length).toBeLessThanOrEqual(5);
    }
  });
});

describe("lot order", () => {
  it("is append-only: stored skills keep their place, new ones join in activation order", () => {
    const stored = ["b", "a"];
    const merged = mergeSkillOrder(stored, [
      { skillId: "a", firstAt: daysAgo(10), order: 1 },
      { skillId: "d", firstAt: daysAgo(1), order: 4 },
      { skillId: "c", firstAt: daysAgo(2), order: 9 },
      { skillId: "b", firstAt: daysAgo(3), order: 2 },
    ]);
    expect(merged).toEqual(["b", "a", "c", "d"]);
  });
});

const skill = (id: string, over: Partial<CitySkillInput> = {}): CitySkillInput => ({
  skillId: id,
  code: `VIET.HV.AM_${id.toUpperCase()}`,
  nameVi: `Âm ${id}`,
  nameEn: `Letter ${id}`,
  order: 1,
  firstAt: daysAgo(5),
  mastery: 50,
  status: "LEARNING",
  masteredSince: null,
  errorCount7d: 0,
  remediationActive: false,
  ...over,
});

const input = (over: Partial<CityInput> = {}): CityInput => ({
  city: "viet",
  now,
  todayKey: "2026-10-20",
  skills: [skill("a"), skill("b", { mastery: 90, status: "MASTERED", masteredSince: daysAgo(45) })],
  storedOrder: [],
  missionSkillCodes: ["VIET.HV.AM_A"],
  starsEarned: 46,
  plotBuilds: [
    { plot: 0, build: "garden" },
    { plot: 5, build: "tower" },
  ],
  badgesEarned: 2,
  learningDayKeys: ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15"],
  daysLearnt: 9,
  collectibleCodes: ["cau-vong"],
  petCodes: ["meo-con"],
  homework: [{ status: "PENDING", optional: false }],
  ...over,
});

describe("buildCityState", () => {
  it("assembles the whole view and HUD", () => {
    const { view, hud, skillOrder } = buildCityState(input());
    expect(skillOrder).toEqual(["a", "b"]);
    expect(view.skills.map((s) => [s.label, s.level, s.mission])).toEqual([
      ["a", 1, true],
      ["b", 4, false],
    ]);
    expect(view.land).toEqual({
      owned: 2,
      nextCost: 30,
      progress: 1,
      builds: [{ plot: 0, build: "garden" }],
    });
    expect(view.publicBuildings).toEqual(["market", "school"]);
    expect(view.wonder.pieces).toBe(1);
    expect(view.bustle).toBe(3);
    expect(view.decorations).toEqual(["rainbow"]);
    expect(view.pets).toEqual(["cat"]);
    expect(view.townHallOrder).toBe("open");
    expect(hud.land.owned).toBe(2);
    expect(hud.wonder.total).toBe(6);
  });

  it("marks scaffolding and a worker on skills with repeated errors", () => {
    const { view } = buildCityState(
      input({ skills: [skill("a", { mastery: 70, errorCount7d: 3 })] }),
    );
    expect(view.skills[0]?.needsHelp).toBe(true);
    expect(view.skills[0]?.level).toBe(2);
  });

  it("keeps a lot even when a skill's evidence disappears (undo)", () => {
    const { view } = buildCityState(input({ storedOrder: ["gone", "a"], skills: [skill("a")] }));
    expect(view.skills.map((s) => s.skillId)).toEqual(["gone", "a"]);
    expect(view.skills[0]?.level).toBe(0);
  });
});

describe("cityChanges", () => {
  it("reports only growth since the last visit, nothing on the first visit", () => {
    const before = buildCityState(input()).view;
    expect(cityChanges(null, before)).toEqual([]);
    const seen = snapshotOf(before);
    const after = buildCityState(
      input({
        skills: [
          skill("a", { mastery: 65 }),
          skill("b", { mastery: 90, status: "MASTERED", masteredSince: daysAgo(45) }),
          skill("c", { firstAt: daysAgo(0) }),
        ],
        starsEarned: 80,
        badgesEarned: 3,
        collectibleCodes: ["cau-vong", "cai-o"],
        learningDayKeys: [
          "2026-10-12",
          "2026-10-13",
          "2026-10-14",
          "2026-10-15",
          "2026-10-19",
          "2026-10-20",
          "2026-10-21",
          "2026-10-22",
        ],
      }),
    ).view;
    const types = cityChanges(seen, after).map((c) => c.type);
    expect(types).toEqual([
      "levelUp",
      "newBuilding",
      "plotUnlocked",
      "publicBuilt",
      "wonderPiece",
      "decoration",
    ]);
    // a lower level (decay) is never reported as a change
    const decayed = buildCityState(
      input({
        skills: [
          skill("a", { mastery: 10 }),
          skill("b", { mastery: 90, status: "MASTERED", masteredSince: daysAgo(45) }),
        ],
      }),
    ).view;
    expect(cityChanges(seen, decayed)).toEqual([]);
  });
});
