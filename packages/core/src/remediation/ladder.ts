/**
 * Remediation ladder (docs/04 sec. 11.4): six rungs, each 1-2 sessions; pass -> leave the ladder,
 * fail -> next rung; failing rung 6 hands over to the parents (NEEDS_PARENT).
 */
export type RemediationStatus = "ACTIVE" | "PASSED" | "NEEDS_PARENT";
export type RungResult = "PASSED" | "FAILED";

export const REMEDIATION_RUNGS = 6;
/** A skill under remediation gets at most this many exercises per session. */
export const MAX_REMEDIATION_PER_SESSION = 4;
/** At most two skills under remediation at the same time. */
export const MAX_ACTIVE_TRACKS = 2;
/** Target share of correct answers within a session while remediating. */
export const SESSION_TARGET_ACCURACY = 0.7;
/** count7d of one error code that switches on the ladder (docs/04 sec. 11.3). */
export const ACTIVE_ERROR_COUNT_7D = 2;

export interface RungInfo {
  rung: number;
  key:
    | "CHANGE_CHANNEL"
    | "LOWER_DIFFICULTY"
    | "MODELLED_EXAMPLE"
    | "BACK_TO_PREREQUISITE"
    | "CONTRAST_PAIR"
    | "RECHECK";
  /** Vietnamese label for the parent dashboard */
  labelVi: string;
  /** Planner hint for the exercise picker */
  planner: {
    preferTypes?: string[];
    difficultyDelta?: number;
    maxChoices?: number;
    scaffold?: "model";
    usePrerequisite?: boolean;
    targetsError?: boolean;
    noHints?: boolean;
    independentCount?: number;
    minDaysAfterPrevious?: number;
  };
}

export const RUNGS: readonly RungInfo[] = [
  {
    rung: 1,
    key: "CHANGE_CHANNEL",
    labelVi: "Đổi kênh: nhận biết trước tái tạo",
    planner: { preferTypes: ["LISTEN_CHOOSE", "MCQ", "DRAG_DROP"] },
  },
  {
    rung: 2,
    key: "LOWER_DIFFICULTY",
    labelVi: "Hạ độ khó, ít phương án hơn",
    planner: { difficultyDelta: -1, maxChoices: 2 },
  },
  {
    rung: 3,
    key: "MODELLED_EXAMPLE",
    labelVi: "Mascot làm mẫu rồi con làm bài sinh đôi",
    planner: { scaffold: "model" },
  },
  {
    rung: 4,
    key: "BACK_TO_PREREQUISITE",
    labelVi: "Quay về kỹ năng tiên quyết",
    planner: { usePrerequisite: true },
  },
  {
    rung: 5,
    key: "CONTRAST_PAIR",
    labelVi: "Đối chiếu cặp dễ nhầm cạnh nhau",
    planner: { targetsError: true },
  },
  {
    rung: 6,
    key: "RECHECK",
    labelVi: "Kiểm tra lại sau 2 ngày: 3 bài độc lập",
    planner: { noHints: true, independentCount: 3, minDaysAfterPrevious: 2 },
  },
];

export function rungInfo(rung: number): RungInfo {
  const info = RUNGS[rung - 1];
  if (!info) throw new RangeError(`rung must be 1..${REMEDIATION_RUNGS}, got ${rung}`);
  return info;
}

export interface TrackState {
  rung: number;
  status: RemediationStatus;
}

/**
 * Next state after finishing a rung. Pure. A finished (PASSED / NEEDS_PARENT) track is returned
 * unchanged.
 */
export function nextRung(track: TrackState, result: RungResult): TrackState {
  if (track.status !== "ACTIVE") return track;
  if (result === "PASSED") return { rung: track.rung, status: "PASSED" };
  if (track.rung >= REMEDIATION_RUNGS) return { rung: REMEDIATION_RUNGS, status: "NEEDS_PARENT" };
  return { rung: track.rung + 1, status: "ACTIVE" };
}

/**
 * Rung 4 is skipped when the prerequisite is already solid (there is nothing to go back to);
 * rung 5 is skipped when the skill has no confusable partner.
 */
export function nextApplicableRung(
  track: TrackState,
  result: RungResult,
  ctx: { prerequisiteMastery?: number | null; hasContrastPair?: boolean },
): TrackState {
  let next = nextRung(track, result);
  for (let guard = 0; guard < REMEDIATION_RUNGS && next.status === "ACTIVE"; guard++) {
    const prereqOk = ctx.prerequisiteMastery == null || ctx.prerequisiteMastery >= 60;
    if (next.rung === 4 && prereqOk) {
      next = nextRung(next, "FAILED");
      continue;
    }
    if (next.rung === 5 && ctx.hasContrastPair === false) {
      next = nextRung(next, "FAILED");
      continue;
    }
    break;
  }
  return next;
}

/** docs/04 sec. 11.3 + 11.4 - when a track should be opened for a skill. */
export function shouldStartRemediation(input: {
  status: string;
  errorCount7d?: number;
  hasActiveTrack: boolean;
}): boolean {
  if (input.hasActiveTrack) return false;
  return input.status === "NEEDS_PRACTICE" || (input.errorCount7d ?? 0) >= ACTIVE_ERROR_COUNT_7D;
}
