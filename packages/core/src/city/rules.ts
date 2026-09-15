// Learning data → city (Pha 10 §3). Pure functions only; packages/db gathers the inputs.
//
// Every rule here only ever adds: a missed day freezes the city, nothing withers, nothing is taken
// back (Pha 10 §1.5–1.6). Code lists mirror the catalogues in @mtct/city — a test there keeps the
// two in step.

import type { BuildingLevel, CityPlotBuild, CitySubject, CityView, GrowthStep } from "./view";

export const CITY_SUBJECTS: readonly CitySubject[] = [
  "viet",
  "vmath",
  "esl",
  "enl",
  "emath",
  "esci",
];

/** The Prisma `Subject` enum value for a city, and back. */
export const subjectToCity = (subject: string): CitySubject => subject.toLowerCase() as CitySubject;
export const cityToSubject = (city: CitySubject) =>
  city.toUpperCase() as "VIET" | "VMATH" | "ESL" | "ENL" | "EMATH" | "ESCI";

// ------------------------------------------------------------------ mastery → building level

/** Mastery bands of Pha 10 §3 (0–39 scaffold · 40–59 · 60–84 · 85+). */
export const LEVEL_BANDS = [40, 60, 85] as const;
/** MASTERED and held this long → skyscraper. */
export const SKYSCRAPER_DAYS = 30;

const DAY_MS = 86_400_000;

export interface MasterySnapshot {
  mastery: number;
  status: string;
  /** When the skill last entered MASTERED (null when not MASTERED). */
  masteredSince: Date | null;
}

export function levelFor(m: MasterySnapshot, now: Date): BuildingLevel {
  if (
    m.status === "MASTERED" &&
    m.masteredSince &&
    now.getTime() - m.masteredSince.getTime() >= SKYSCRAPER_DAYS * DAY_MS
  )
    return 4;
  if (m.mastery >= LEVEL_BANDS[2]) return 3;
  if (m.mastery >= LEVEL_BANDS[1]) return 2;
  if (m.mastery >= LEVEL_BANDS[0]) return 1;
  return 0;
}

/** Thirds of the way through the level's mastery band (levels 0 and 4 have no steps). */
export function stepFor(mastery: number, level: BuildingLevel): GrowthStep {
  if (level === 0 || level === 4) return 0;
  const lo = [0, LEVEL_BANDS[0], LEVEL_BANDS[1], LEVEL_BANDS[2]][level] as number;
  const hi = [LEVEL_BANDS[0], LEVEL_BANDS[1], LEVEL_BANDS[2], 101][level] as number;
  const t = Math.floor(((mastery - lo) / (hi - lo)) * 3);
  return Math.max(0, Math.min(2, t)) as GrowthStep;
}

/**
 * Keeps `SkillMastery.masteredSince` right on every write: set when the status becomes MASTERED,
 * kept while it stays MASTERED, cleared when it leaves.
 */
export function nextMasteredSince(
  prevStatus: string | null | undefined,
  prevSince: Date | null | undefined,
  nextStatus: string,
  at: Date,
): Date | null {
  if (nextStatus !== "MASTERED") return null;
  if (prevStatus === "MASTERED" && prevSince) return prevSince;
  return at;
}

// ------------------------------------------------------------------ stars → land

/** Stars the plot with index `k` needs (first = 20, then a little more each time). */
export function plotCost(k: number): number {
  return 20 + 5 * k;
}

/** Stars needed in total to open `n` plots. */
export function starsForPlots(n: number): number {
  return 20 * n + (5 * n * (n - 1)) / 2;
}

export function landFromStars(stars: number): {
  owned: number;
  nextCost: number;
  progress: number;
} {
  const earned = Math.max(0, Math.floor(stars));
  let owned = 0;
  while (starsForPlots(owned + 1) <= earned) owned++;
  return { owned, nextCost: plotCost(owned), progress: earned - starsForPlots(owned) };
}

/** A session's +3 goes to the subject most of its stations were about. Ties → first seen. */
export function majoritySubject<T extends string>(subjects: readonly T[]): T | null {
  const counts = new Map<T, number>();
  for (const s of subjects) counts.set(s, (counts.get(s) ?? 0) + 1);
  let best: T | null = null;
  let bestCount = 0;
  for (const [s, c] of counts) {
    if (c > bestCount) {
      best = s;
      bestCount = c;
    }
  }
  return best;
}

/** Plot builds open up as the city grows: three at first, one more for every two steady buildings. */
export const PLOT_BUILD_ORDER = [
  "house",
  "garden",
  "pond",
  "shop",
  "miniPark",
  "bakery",
  "treehouse",
  "windmill",
  "lighthouse",
  "tower",
] as const;

export function unlockedPlotBuilds(levels: readonly BuildingLevel[]): string[] {
  const steady = levels.filter((l) => l >= 2).length;
  return PLOT_BUILD_ORDER.slice(0, Math.min(PLOT_BUILD_ORDER.length, 3 + Math.floor(steady / 2)));
}

// ------------------------------------------------------------------ badges → public buildings

/** Order public buildings appear in, city-flavoured first (every earned badge adds the next one). */
export const PUBLIC_ORDER: Record<CitySubject, readonly string[]> = {
  viet: [
    "market",
    "school",
    "library",
    "playground",
    "zoo",
    "circus",
    "pool",
    "football",
    "theater",
    "museum",
    "station",
    "ferris",
    "postOffice",
    "fireStation",
    "aquarium",
  ],
  vmath: [
    "school",
    "playground",
    "football",
    "station",
    "pool",
    "ferris",
    "zoo",
    "library",
    "market",
    "circus",
    "museum",
    "theater",
    "fireStation",
    "postOffice",
    "aquarium",
  ],
  esl: [
    "aquarium",
    "school",
    "pool",
    "playground",
    "ferris",
    "market",
    "zoo",
    "library",
    "station",
    "circus",
    "football",
    "theater",
    "museum",
    "postOffice",
    "fireStation",
  ],
  enl: [
    "library",
    "theater",
    "school",
    "playground",
    "museum",
    "zoo",
    "pool",
    "market",
    "circus",
    "football",
    "ferris",
    "station",
    "postOffice",
    "fireStation",
    "aquarium",
  ],
  emath: [
    "station",
    "school",
    "fireStation",
    "playground",
    "football",
    "ferris",
    "museum",
    "pool",
    "market",
    "zoo",
    "library",
    "circus",
    "theater",
    "postOffice",
    "aquarium",
  ],
  esci: [
    "museum",
    "aquarium",
    "school",
    "zoo",
    "playground",
    "library",
    "pool",
    "station",
    "ferris",
    "football",
    "market",
    "circus",
    "theater",
    "fireStation",
    "postOffice",
  ],
};

export function publicBuildingsFor(city: CitySubject, badgesEarned: number): string[] {
  return PUBLIC_ORDER[city].slice(0, Math.max(0, badgesEarned));
}

// ------------------------------------------------------------------ weeks → wonder pieces

/** A week with at least this many learning days adds one piece (Pha 10 §3). */
export const WONDER_DAYS_PER_WEEK = 4;

/** Pieces per wonder, mirrored from @mtct/city WONDER_PIECES. */
export const WONDER_TOTAL: Record<CitySubject, number> = {
  vmath: 8,
  viet: 6,
  esl: 7,
  enl: 7,
  emath: 7,
  esci: 8,
};

/** Monday (as "YYYY-MM-DD") of the week a Vietnam day key falls in. */
export function mondayOfDayKey(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number) as [number, number, number];
  const t = new Date(Date.UTC(y, m - 1, d));
  const shift = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - shift);
  return t.toISOString().slice(0, 10);
}

export interface WonderProgress {
  pieces: number;
  total: number;
  /** Learning days so far in the current week (0–7) and how many the piece needs. */
  thisWeekDays: number;
  needed: number;
}

/**
 * Pieces never reset: every week that reached 4 learning days counts, however long ago, and a week
 * counts as soon as its fourth day happens (not only when it ends).
 */
export function wonderProgress(
  learningDayKeys: readonly string[],
  total: number,
  todayKey: string,
): WonderProgress {
  const weeks = new Map<string, Set<string>>();
  for (const key of learningDayKeys) {
    const monday = mondayOfDayKey(key);
    let days = weeks.get(monday);
    if (!days) {
      days = new Set();
      weeks.set(monday, days);
    }
    days.add(key);
  }
  let qualified = 0;
  for (const days of weeks.values()) if (days.size >= WONDER_DAYS_PER_WEEK) qualified++;
  return {
    pieces: Math.min(total, qualified),
    total,
    thisWeekDays: weeks.get(mondayOfDayKey(todayKey))?.size ?? 0,
    needed: WONDER_DAYS_PER_WEEK,
  };
}

// ------------------------------------------------------------------ streak → bustle

/** Days learnt (Streak.current never resets) → how busy the streets are. Only ever goes up. */
export function bustleFor(daysLearnt: number): CityView["bustle"] {
  if (daysLearnt >= 14) return 4;
  if (daysLearnt >= 7) return 3;
  if (daysLearnt >= 3) return 2;
  if (daysLearnt >= 1) return 1;
  return 0;
}

// ------------------------------------------------------------------ collectibles, pets

/** Collectible codes (seed) → decoration builders in @mtct/city. Unknown codes become flower beds. */
export const COLLECTIBLE_DECORATION: Record<string, string> = {
  "cay-non": "flowerBed",
  "bong-hoa": "flowerBed",
  "chiec-la": "flowerBed",
  "cay-nam": "bunnyHouse",
  "den-loi": "bench",
  "cau-vong": "rainbow",
  "dam-may": "balloon",
  "ngoi-sao": "statue",
  "mat-trang": "fountain",
  "ngoi-nha": "bunnyHouse",
  "cai-ghe": "bench",
  "cai-o": "iceCream",
  "xe-dap": "kiteStand",
  "o-to": "carousel",
  "tau-hoa": "carousel",
  "ten-lua": "balloon",
  "con-robot": "statue",
  "con-meo": "bunnyHouse",
  "con-cho": "bunnyHouse",
  "con-buom": "kiteStand",
  "con-chim": "kiteStand",
  "gau-bong": "iceCream",
};

export const DECORATION_CODES = [
  "fountain",
  "statue",
  "balloon",
  "iceCream",
  "flowerBed",
  "bench",
  "carousel",
  "rainbow",
  "bunnyHouse",
  "kiteStand",
] as const;

export function decorationFor(collectibleCode: string): string {
  return COLLECTIBLE_DECORATION[collectibleCode] ?? "flowerBed";
}

/** Pet codes (seed) → walking animals the engine draws. */
export const PET_ANIMAL: Record<string, "dog" | "cat" | "bunny" | "duck"> = {
  "meo-con": "cat",
  "cun-con": "dog",
  "vit-con": "duck",
  "ga-con": "duck",
  "buom-nho": "bunny",
  "ech-xanh": "duck",
  "canh-cut": "duck",
  "robot-nho": "dog",
};

export function petFor(petCode: string): "dog" | "cat" | "bunny" | "duck" {
  return PET_ANIMAL[petCode] ?? "dog";
}

// ------------------------------------------------------------------ teacher's homework → town hall

export interface HomeworkSnapshot {
  status: "PENDING" | "IN_PROGRESS" | "DONE" | "SKIPPED";
  optional: boolean;
}

/** No homework for this subject → no order; all required done → the street lights up. */
export function townHallOrderFor(homework: readonly HomeworkSnapshot[]): CityView["townHallOrder"] {
  const required = homework.filter((h) => !h.optional && h.status !== "SKIPPED");
  const counted = required.length > 0 ? required : homework.filter((h) => h.status !== "SKIPPED");
  if (counted.length === 0) return "none";
  return counted.every((h) => h.status === "DONE") ? "done" : "open";
}

// ------------------------------------------------------------------ skill → sign label

const TONE_MARK: Record<string, string> = { HUYEN: "à", SAC: "á", HOI: "ả", NGA: "ã", NANG: "ạ" };

/** A few characters for the building's sign (≤ 5): a letter, a number, an operator or a word. */
export function skillLabel(
  city: CitySubject,
  code: string,
  nameVi: string,
  nameEn: string,
): string {
  const cut = (s: string) => [...s].slice(0, 5).join("");
  if (city === "viet") {
    const am = /^(?:Âm|Vần|Chữ)\s+([^\s,;:()–-]+)/iu.exec(nameVi);
    if (am?.[1]) return cut(am[1].toLowerCase());
    const tone = /DAU_(HUYEN|SAC|HOI|NGA|NANG)/.exec(code);
    if (tone?.[1]) return TONE_MARK[tone[1]] ?? "à";
    return cut((nameVi.split(/\s+/)[0] ?? "Chữ").toLowerCase());
  }
  if (city === "vmath" || city === "emath") {
    const text = `${nameVi} ${nameEn}`.toLowerCase();
    if (/cộng|\badd|plus/.test(text)) return "+";
    if (/trừ|\bsub|minus/.test(text)) return "−";
    if (/so sánh|compar|greater|less/.test(text)) return ">";
    if (/hình|shape|geometr/.test(text)) return "△";
    if (/đo|measur|length|cm\b/.test(text)) return "cm";
    if (/giờ|time|clock/.test(text)) return "⏰";
    const numbers = (nameVi.match(/\d+/g) ?? []).map(Number);
    if (numbers.length) return String(Math.max(...numbers));
    return "123";
  }
  const word = (nameEn.match(/[A-Za-z]+/g) ?? []).find((w) => w.length >= 2) ?? "abc";
  return cut(word.toLowerCase());
}

// ------------------------------------------------------------------ lot order

export interface ActiveSkill {
  skillId: string;
  /** When the skill got its first evidence — decides where a NEW building goes. */
  firstAt: Date;
  /** Curriculum order, to break ties between skills activated together. */
  order: number;
}

/**
 * Append-only: skills already in `stored` keep their place (and their lot) forever; newly active
 * skills join at the end in activation order.
 */
export function mergeSkillOrder(
  stored: readonly string[],
  active: readonly ActiveSkill[],
): string[] {
  const known = new Set(stored);
  const fresh = active
    .filter((s) => !known.has(s.skillId))
    .sort((a, b) => a.firstAt.getTime() - b.firstAt.getTime() || a.order - b.order);
  return [...stored, ...fresh.map((s) => s.skillId)];
}

// ------------------------------------------------------------------ the whole city

export interface CitySkillInput extends ActiveSkill, MasterySnapshot {
  code: string;
  nameVi: string;
  nameEn: string;
  /** Highest 7-day count among error codes that remediate this skill. */
  errorCount7d: number;
  /** A remediation ladder is running for this skill. */
  remediationActive: boolean;
}

export interface CityInput {
  city: CitySubject;
  now: Date;
  todayKey: string;
  skills: readonly CitySkillInput[];
  storedOrder: readonly string[];
  /** Skill codes carrying a station not done yet in this city's session (a star on the roof). */
  missionSkillCodes: readonly string[];
  starsEarned: number;
  plotBuilds: readonly CityPlotBuild[];
  badgesEarned: number;
  learningDayKeys: readonly string[];
  daysLearnt: number;
  collectibleCodes: readonly string[];
  /** Companion first. */
  petCodes: readonly string[];
  homework: readonly HomeworkSnapshot[];
}

export interface CityHud {
  starsEarned: number;
  land: { owned: number; progress: number; nextCost: number };
  wonder: WonderProgress;
  daysLearnt: number;
  unlockedBuilds: string[];
}

export interface CityState {
  view: CityView;
  hud: CityHud;
  /** The order to store back (only ever longer). */
  skillOrder: string[];
}

/** Error counts at or above this put the worker and scaffolding on a building (remediation §). */
export const NEEDS_HELP_ERRORS_7D = 2;

export function needsHelp(
  s: Pick<CitySkillInput, "errorCount7d" | "remediationActive" | "status">,
): boolean {
  return (
    s.remediationActive || s.errorCount7d >= NEEDS_HELP_ERRORS_7D || s.status === "NEEDS_PRACTICE"
  );
}

export function buildCityState(input: CityInput): CityState {
  const skillOrder = mergeSkillOrder(input.storedOrder, input.skills);
  const byId = new Map(input.skills.map((s) => [s.skillId, s]));
  const missions = new Set(input.missionSkillCodes);
  const skills = skillOrder.flatMap((id) => {
    const s = byId.get(id);
    // a skill whose evidence was undone keeps its lot as scaffolding — nothing disappears
    if (!s)
      return [
        {
          skillId: id,
          label: "…",
          level: 0 as BuildingLevel,
          step: 0 as GrowthStep,
          needsHelp: false,
          mission: false,
        },
      ];
    const level = levelFor(s, input.now);
    return [
      {
        skillId: s.skillId,
        label: skillLabel(input.city, s.code, s.nameVi, s.nameEn),
        level,
        step: stepFor(s.mastery, level),
        needsHelp: needsHelp(s),
        mission: missions.has(s.code),
      },
    ];
  });
  const land = landFromStars(input.starsEarned);
  const unlockedBuilds = unlockedPlotBuilds(skills.map((s) => s.level));
  const wonder = wonderProgress(input.learningDayKeys, WONDER_TOTAL[input.city], input.todayKey);
  const view: CityView = {
    subject: input.city,
    skills,
    land: {
      ...land,
      builds: input.plotBuilds.filter((b) => b.plot >= 0 && b.plot < land.owned),
    },
    publicBuildings: publicBuildingsFor(input.city, input.badgesEarned),
    wonder: { pieces: wonder.pieces },
    bustle: bustleFor(input.daysLearnt),
    decorations: input.collectibleCodes.map(decorationFor),
    pets: input.petCodes.map(petFor),
    townHallOrder: townHallOrderFor(input.homework),
  };
  return {
    view,
    hud: {
      starsEarned: input.starsEarned,
      land,
      wonder,
      daysLearnt: input.daysLearnt,
      unlockedBuilds,
    },
    skillOrder,
  };
}

// ------------------------------------------------------------------ what changed since the last visit

export interface CitySeen {
  levels: Record<string, number>;
  owned: number;
  publics: number;
  pieces: number;
  decorations: number;
}

export type CityChange =
  | { type: "newBuilding"; skillId: string; level: BuildingLevel }
  | { type: "levelUp"; skillId: string; from: number; to: BuildingLevel }
  | { type: "plotUnlocked"; plot: number }
  | { type: "publicBuilt"; code: string }
  | { type: "wonderPiece"; pieces: number; complete: boolean }
  | { type: "decoration"; code: string };

export function snapshotOf(view: CityView): CitySeen {
  return {
    levels: Object.fromEntries(view.skills.map((s) => [s.skillId, s.level])),
    owned: view.land.owned,
    publics: view.publicBuildings.length,
    pieces: view.wonder.pieces,
    decorations: view.decorations.length,
  };
}

/**
 * Celebrations owed since `seen` (null = first visit: nothing to celebrate, everything is simply
 * there). Only growth is reported — there is no "lost" event to report.
 */
export function cityChanges(seen: CitySeen | null, view: CityView): CityChange[] {
  if (!seen) return [];
  const out: CityChange[] = [];
  for (const s of view.skills) {
    const before = seen.levels[s.skillId];
    if (before === undefined) out.push({ type: "newBuilding", skillId: s.skillId, level: s.level });
    else if (s.level > before)
      out.push({ type: "levelUp", skillId: s.skillId, from: before, to: s.level });
  }
  for (let p = seen.owned; p < view.land.owned; p++) out.push({ type: "plotUnlocked", plot: p });
  for (const code of view.publicBuildings.slice(seen.publics))
    out.push({ type: "publicBuilt", code });
  if (view.wonder.pieces > seen.pieces) {
    out.push({
      type: "wonderPiece",
      pieces: view.wonder.pieces,
      complete: view.wonder.pieces >= WONDER_TOTAL[view.subject],
    });
  }
  for (const code of view.decorations.slice(seen.decorations))
    out.push({ type: "decoration", code });
  return out;
}
