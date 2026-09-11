/**
 * The kid design system in one file (docs/06 §1.1 and §1.3).
 *
 * The adult area uses the slate tokens in globals.css; the child's world never touches them.
 * Sizes here are the minimums the design fixes: a tap target of at least 64 px and text of at
 * least 22 px, because the child using this is six and holding an iPad.
 */

export const KID = {
  /** Minimum tap target and minimum readable text — both are checked in the e2e suite. */
  tapMin: 64,
  textMin: 22,
  radius: 24,
  buttonHeight: 84,
  gap: 16,
} as const;

export type KidTheme = "robot" | "garden";

export const THEME = {
  robot: {
    primary: "#2F80ED",
    primarySoft: "#EAF2FE",
    accent: "#FF8C42",
    world: "robot",
    mascot: "robot",
    label: "Thành phố Robot",
  },
  garden: {
    primary: "#E85D9C",
    primarySoft: "#FDEEF5",
    accent: "#7C5CFF",
    world: "garden",
    mascot: "cu",
    label: "Vườn Kỳ Diệu",
  },
} as const;

export const COLOR = {
  cream: "#FFF8EC",
  ink: "#2B2B3A",
  inkSoft: "#6B6B7B",
  reward: "#FFD447",
  correct: "#34C759",
  /** "Almost" — amber, never red: there is no failure colour in this world (docs/06 §1 rule 4). */
  near: "#FFB020",
  white: "#FFFFFF",
} as const;

/** Framer Motion springs, from docs/06 §1.3: buttons squash, scenes glide. */
export const SPRING = {
  press: { type: "spring", stiffness: 400, damping: 15, mass: 0.6 },
  pop: { type: "spring", stiffness: 300, damping: 18 },
  glide: { type: "spring", stiffness: 120, damping: 20 },
  soft: { type: "spring", stiffness: 90, damping: 16 },
} as const;

/** Children appear one after another, not all at once (docs/06 §1.3 "stagger 60 ms"). */
export const STAGGER = {
  container: {
    hidden: {},
    show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
  },
  item: {
    hidden: { opacity: 0, y: 18, scale: 0.94 },
    show: { opacity: 1, y: 0, scale: 1, transition: SPRING.pop },
  },
} as const;

/** The four zones of a world map onto the five subjects the child sees. */
export const ZONE_OF_SUBJECT: Record<string, string> = {
  VMATH: "xuong-so",
  EMATH: "xuong-so",
  VIET: "thap-chu",
  ESL: "ben-tau-tieng-anh",
  ENL: "ben-tau-tieng-anh",
  ESCI: "tram-khong-gian",
};

/** Garden has one zone in phase 3; everything falls back to it (docs/08 pha 3 việc 1). */
export function zoneFor(theme: KidTheme, subject?: string | null): string {
  if (theme === "garden") return "vuon-so";
  return (subject && ZONE_OF_SUBJECT[subject]) || "xuong-so";
}

export const SUBJECT_LABEL: Record<string, string> = {
  VMATH: "Toán",
  VIET: "Tiếng Việt",
  ESL: "Tiếng Anh",
  ENL: "Tiếng Anh (đọc viết)",
  EMATH: "Toán tiếng Anh",
  ESCI: "Khoa học",
};
