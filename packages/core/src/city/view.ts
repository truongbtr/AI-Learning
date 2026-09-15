// Shape of one subject city as the kid UI draws it (Pha 10). Plain data only: the pure functions of
// việc 3 (mastery → level, stars → land, badge → public building, week → wonder piece) produce it,
// and @mtct/city renders it. No three.js, no Prisma.

export type CitySubject = "viet" | "vmath" | "esl" | "enl" | "emath" | "esci";

/** 0 = scaffold (0–39) · 1 (40–59) · 2 (60–84) · 3 (85+) · 4 = skyscraper (MASTERED ≥ 30 days). */
export type BuildingLevel = 0 | 1 | 2 | 3 | 4;

export interface CitySkillBuilding {
  skillId: string;
  /** Short sign on the building: a letter, a number, a word ("ă", "10", "cat"). ≤ 5 chars. */
  label: string;
  level: BuildingLevel;
  /** High ErrorStat → scaffold + waiting worker, tapping starts a TARGETED session. */
  needsHelp: boolean;
  /** Planner has an exercise for this skill today → sparkling mission bubble on the roof. */
  mission: boolean;
}

export interface CityPlotBuild {
  /** Index among the kid's unlocked plots (0 = first plot). */
  plot: number;
  /** Catalogue code of what the kid chose to build (see @mtct/city PLOT_CATALOGUE). */
  build: string;
}

export interface CityView {
  subject: CitySubject;
  /** In activation order — append-only, so a skill keeps its lot forever. */
  skills: CitySkillBuilding[];
  land: {
    /**
     * Plots unlocked by stars EARNED in this subject. Nothing is ever spent (Pha 10 §1.4): a plot
     * opens when the running total passes its threshold, and stays open.
     */
    owned: number;
    /** Stars the next plot needs, counted from the previous threshold (shown on the locked plot). */
    nextCost: number;
    /** Stars already earned toward the next plot (0 … nextCost − 1) — the HUD's land bar. */
    progress: number;
    builds: CityPlotBuild[];
  };
  /** Public buildings unlocked by badges, in unlock order (codes from @mtct/city PUBLIC_BUILDINGS). */
  publicBuildings: string[];
  wonder: { pieces: number };
  /** Streak → bustle: 0 quiet … 4 busiest. Never decreases the city itself. */
  bustle: 0 | 1 | 2 | 3 | 4;
  /** Collectibles placed as decorations (codes from @mtct/city DECORATIONS). */
  decorations: string[];
  /** Pet codes walking in the city. */
  pets: string[];
  /** Today's town-hall order from the teacher's diary: absent, open, or done (whole street lit). */
  townHallOrder: "none" | "open" | "done";
}
