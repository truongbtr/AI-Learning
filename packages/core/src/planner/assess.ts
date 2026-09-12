import type { Subject } from "./types";

/**
 * The first three evenings (docs/04 §10).
 *
 * A child who has never used this has every skill at `NOT_STARTED`, and the planner's whole model
 * — what is weak, what is due for review, what comes next — has nothing to stand on. So the first
 * three sessions are not practice, they are questions: roughly ten each, walking up and down a
 * strand to find out where the child actually is.
 *
 * **Adaptive, one answer at a time.** Right → the next skill up the strand; wrong → back to the
 * prerequisite. Ten questions chosen this way locate a child far better than ten fixed ones, and
 * — the part that matters for a six-year-old — a child who gets one wrong is handed something
 * easier next, not another one of the same.
 *
 * `docs/04` §10 says "3 phiên, mỗi môn ~10 bài", which cannot mean ten each for six subjects in
 * three sessions of ten. Read as: three sessions, ten stations each, two subjects per evening,
 * the six subjects paired so an evening does not jump between languages:
 *
 *   1. Tiếng Việt + Toán (tiếng Việt)   — the two the class spends most of its week on
 *   2. ESL + ENL                        — English, spoken and written
 *   3. English Maths + English Science  — the two taught through English
 *
 * Nothing here touches a database or a clock, so a test can walk a whole assessment and assert the
 * path it took.
 */

/** The six subjects, paired into three evenings. */
export const ASSESSMENT_ROUNDS: readonly (readonly Subject[])[] = [
  ["VIET", "VMATH"],
  ["ESL", "ENL"],
  ["EMATH", "ESCI"],
] as const;

/** Stations per assessment session (docs/04 §10: "mỗi môn ~10 bài"). */
export const ASSESSMENT_SLOTS = 10;
/** Evidence from a diagnostic counts a little less than ordinary practice (docs/04 §10). */
export const ASSESSMENT_WEIGHT = 0.8;
/** Where an adaptive walk starts when nothing else is known: the middle of the five bands. */
export const ASSESSMENT_START_DIFFICULTY = 3;

export interface AssessSkill {
  code: string;
  subject: Subject;
  strand: string;
  /** Teaching order inside the strand — the axis the walk moves along. */
  order: number;
  /** The school week the class is expected to reach this, when the curriculum says. */
  expectedWeek: number | null;
  prerequisites: string[];
  /** How many published exercises exist. A skill with none cannot be asked about. */
  exerciseCount: number;
}

/** Which of the three evenings this is: 0, 1, 2 — then it wraps, which is what `--session` does. */
export function roundSubjects(round: number): readonly Subject[] {
  return ASSESSMENT_ROUNDS[round % ASSESSMENT_ROUNDS.length] as readonly Subject[];
}

const askable = (s: AssessSkill) => s.exerciseCount > 0;

/**
 * Where to start in one strand: the skill the class should be at about now.
 *
 * Starting at the beginning of the strand wastes six of the ten questions proving a child can do
 * what she did in August. Starting at the end starts with failure. `expectedWeek` is the
 * curriculum's own answer to "where should she be", so the walk starts there and moves.
 */
export function startingSkill(
  skills: AssessSkill[],
  strand: string,
  schoolWeek: number,
): AssessSkill | null {
  const inStrand = skills.filter((s) => s.strand === strand && askable(s));
  if (inStrand.length === 0) return null;
  const dated = inStrand.filter((s) => s.expectedWeek !== null);
  if (dated.length === 0)
    // No curriculum weeks on this strand: start a third of the way in — far enough not to insult
    // the child, near enough that a wrong answer still has somewhere to go down to.
    return (
      (inStrand.sort((a, b) => a.order - b.order)[
        Math.floor(inStrand.length / 3)
      ] as AssessSkill) ?? null
    );

  // The last skill the class should already have covered; failing that, the earliest there is.
  const covered = dated
    .filter((s) => (s.expectedWeek as number) <= schoolWeek)
    .sort((a, b) => (b.expectedWeek as number) - (a.expectedWeek as number));
  return (
    covered[0] ??
    dated.sort((a, b) => (a.expectedWeek as number) - (b.expectedWeek as number))[0] ??
    null
  );
}

/** The strands of a subject, in teaching order, so an evening covers a subject's breadth. */
export function strandsOf(skills: AssessSkill[], subject: Subject): string[] {
  const first = new Map<string, number>();
  for (const s of skills.filter((k) => k.subject === subject && askable(k))) {
    const at = first.get(s.strand);
    if (at === undefined || s.order < at) first.set(s.strand, s.order);
  }
  return [...first.entries()].sort((a, b) => a[1] - b[1]).map(([strand]) => strand);
}

export interface AssessmentStep {
  skillCode: string;
  subject: Subject;
  difficulty: number;
  reason: string;
}

/**
 * The opening ten: the subjects of this round, their strands taken in turn, each starting where
 * the class should be. Later stations are replaced as answers come in — see `nextStep`.
 */
export function openingSteps(
  skills: AssessSkill[],
  round: number,
  schoolWeek: number,
  slots = ASSESSMENT_SLOTS,
): AssessmentStep[] {
  const own = roundSubjects(round).filter((subject) =>
    skills.some((s) => s.subject === subject && askable(s)),
  );
  // The evening's own subjects first. If the bank cannot fill ten stations out of them — and in
  // batch one it cannot: English Science has no exercises at all and English Maths has two skills
  // with any — the rest come from the subjects that *do* have questions. Eight more questions
  // about Vietnamese teach the planner more about this child than eight empty stations, and the
  // child never sees a gap. What the bank is missing is recorded by `pnpm content:stats`, not by
  // a short evening.
  const rest = ([...new Set(skills.map((s) => s.subject))] as Subject[]).filter(
    (subject) => !own.includes(subject) && skills.some((s) => s.subject === subject && askable(s)),
  );
  if (own.length === 0 && rest.length === 0) return [];

  /** One strand from each subject in turn, so an evening alternates instead of doing five of one
   * thing and then five of another. */
  const interleave = (subjects: readonly Subject[]) => {
    const queues = subjects.map((subject) =>
      strandsOf(skills, subject).map((strand) => ({ subject, strand })),
    );
    const out: { subject: Subject; strand: string }[] = [];
    for (let i = 0; ; i++) {
      const before = out.length;
      for (const queue of queues)
        if (queue[i]) out.push(queue[i] as { subject: Subject; strand: string });
      if (out.length === before) break;
    }
    return out;
  };
  // The round's own subjects come first and keep the front of the evening; the fallback subjects
  // only ever fill what is left over.
  const order = [...interleave(own), ...interleave(rest)];
  if (order.length === 0) return [];

  const steps: AssessmentStep[] = [];
  const used = new Set<string>();
  // Ten stations out of however many strands the round has. There are usually fewer strands than
  // stations, so a strand comes round again — and when it does it moves one step further along,
  // spreading the opening questions over the strand rather than asking the same one twice.
  for (let i = 0; steps.length < slots && i < slots * 6; i++) {
    const pick = order[i % order.length] as { subject: Subject; strand: string };
    let skill = startingSkill(skills, pick.strand, schoolWeek);
    // Walk up, then down, until something unasked turns up. A strand that is exhausted is skipped.
    for (let step = 0; skill && used.has(skill.code) && step < slots; step++)
      skill = neighbour(skills, skill, 1);
    if (!skill) {
      skill = startingSkill(skills, pick.strand, schoolWeek);
      for (let step = 0; skill && used.has(skill.code) && step < slots; step++)
        skill = neighbour(skills, skill, -1);
    }
    if (!skill || used.has(skill.code)) continue;
    used.add(skill.code);
    steps.push({
      skillCode: skill.code,
      subject: skill.subject,
      difficulty: ASSESSMENT_START_DIFFICULTY,
      reason: `chẩn đoán đầu vào: ${pick.strand}`,
    });
  }
  return steps;
}

/** The next skill along the strand, `direction` steps up (+1) or down (−1). */
export function neighbour(
  skills: AssessSkill[],
  from: AssessSkill,
  direction: 1 | -1,
): AssessSkill | null {
  const line = skills
    .filter((s) => s.strand === from.strand && s.subject === from.subject && askable(s))
    .sort((a, b) => a.order - b.order);
  const at = line.findIndex((s) => s.code === from.code);
  if (at === -1) return null;
  return (line[at + direction] as AssessSkill | undefined) ?? null;
}

export interface NextStepInput {
  skills: AssessSkill[];
  /** The skill just answered. */
  current: AssessSkill;
  correct: boolean;
  /** Difficulty of the station just answered. */
  difficulty: number;
  /** Codes already asked in this session — never ask the same thing twice. */
  asked: Set<string>;
}

/**
 * One answer, one move (docs/04 §10: "đúng → nhảy lên kỹ năng sau trong mạch, sai → lùi về tiên
 * quyết").
 *
 * Wrong goes to a **prerequisite** first and only falls back to the previous skill in the strand
 * when there is no prerequisite to go to: docs/04 §2 is explicit that a skill standing on a shaky
 * prerequisite is the thing worth finding out about, and an assessment exists to find exactly that.
 *
 * Returns null when the strand runs out, and the caller moves to the next strand.
 */
export function nextStep(input: NextStepInput): AssessmentStep | null {
  const { skills, current, correct, asked } = input;
  const byCode = new Map(skills.map((s) => [s.code, s]));

  const candidates: { skill: AssessSkill; reason: string; difficulty: number }[] = [];
  if (correct) {
    const up = neighbour(skills, current, 1);
    if (up)
      candidates.push({
        skill: up,
        reason: `làm được ${current.code} → thử bài sau trong mạch`,
        difficulty: Math.min(5, input.difficulty + 1),
      });
  } else {
    for (const code of current.prerequisites) {
      const prereq = byCode.get(code);
      if (prereq && askable(prereq))
        candidates.push({
          skill: prereq,
          reason: `chưa chắc ${current.code} → lùi về tiên quyết`,
          difficulty: Math.max(1, input.difficulty - 1),
        });
    }
    const down = neighbour(skills, current, -1);
    if (down)
      candidates.push({
        skill: down,
        reason: `chưa chắc ${current.code} → lùi một bậc trong mạch`,
        difficulty: Math.max(1, input.difficulty - 1),
      });
  }

  const pick = candidates.find((c) => !asked.has(c.skill.code));
  if (!pick) return null;
  return {
    skillCode: pick.skill.code,
    subject: pick.skill.subject,
    difficulty: pick.difficulty,
    reason: pick.reason,
  };
}
