import type { PrismaClient, Subject } from "../../generated/client";

/**
 * What tonight's paste actually bought (docs/08 pha 5 việc 6).
 *
 * Pasting the class diary takes twenty seconds and pays twice: it steers tonight's Daily Quest
 * onto what the class did this morning (docs/11 §6.1), and it puts the right skill codes in front
 * of whoever reads a photo of schoolwork later — the phase-4 eval found that full-text search
 * alone gets the skill right a third of the time, and that the diary rescued most of the misses
 * (`docs/eval/intake-v1.md` §2, the "vở Tiếng Việt bài 13" case).
 *
 * A habit only survives if the reward is visible, so this is the payload the dashboard shows the
 * moment the paste lands: this is what the class did, and this is what your child practises
 * tonight because of it.
 */

const DAY_MS = 86_400_000;
/** How far back a lesson still counts as "what we are doing now" (docs/11 §6.1, planner §4). */
export const LESSON_WINDOW_DAYS = 3;

export interface TonightSkill {
  code: string;
  nameVi: string;
  subject: Subject;
  /** This child's standing on it right now, so the parent can see why it is worth an evening. */
  mastery: number;
  status: string;
  isNew: boolean;
}

export interface TonightForChild {
  studentId: string;
  nickname: string;
  skills: TonightSkill[];
  /** Tasks the teacher set that become stations at the head of the quest (FR-LRN-07). */
  homework: { id: string; text: string; taskType: string; inApp: boolean }[];
}

export interface DiaryTonight {
  date: string;
  diaryId: string | null;
  confirmedAt: Date | null;
  lessons: {
    subjectLabel: string;
    subject: Subject | null;
    lessonRefText: string;
    pages: number[];
    skillCodes: string[];
  }[];
  children: TonightForChild[];
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

/** Task types that become a station in the child's world rather than a tick-box (docs/11 §6.2). */
const IN_APP_TASKS = new Set(["READ_ALOUD", "VIDEO_SUBMIT"]);

/**
 * Today's diary and what it means for each child a parent can see. `studentIds` scopes it to the
 * children of the caller — the class diary is shared, the consequences are per child.
 */
export async function diaryTonight(
  db: PrismaClient,
  opts: { className: string; studentIds: string[]; date?: Date },
): Promise<DiaryTonight> {
  const date = startOfUtcDay(opts.date ?? new Date());
  const diary = await db.classDiary.findUnique({
    where: { className_date: { className: opts.className, date } },
    select: {
      id: true,
      confirmedAt: true,
      lessons: {
        select: {
          subjectLabel: true,
          subject: true,
          lessonRefText: true,
          pages: true,
          skillCodes: true,
        },
      },
    },
  });

  // The planner looks three days back, not just at today, so this is the honest set (docs/11 §6.1).
  const window = await db.diaryLesson.findMany({
    where: {
      diary: {
        className: opts.className,
        date: { gte: new Date(date.getTime() - LESSON_WINDOW_DAYS * DAY_MS), lte: date },
      },
    },
    select: { skillCodes: true },
  });
  const codes = [...new Set(window.flatMap((l) => l.skillCodes))];
  const todayCodes = new Set(diary?.lessons.flatMap((l) => l.skillCodes) ?? []);

  const skills = codes.length
    ? await db.skill.findMany({
        where: { code: { in: codes } },
        select: { id: true, code: true, nameVi: true, subject: true },
      })
    : [];

  const students = await db.student.findMany({
    where: { id: { in: opts.studentIds } },
    orderBy: { createdAt: "asc" },
    select: { id: true, nickname: true },
  });

  const children: TonightForChild[] = [];
  for (const student of students) {
    const masteries = skills.length
      ? await db.skillMastery.findMany({
          where: { studentId: student.id, skillId: { in: skills.map((s) => s.id) } },
          select: { skillId: true, mastery: true, status: true, evidenceCount: true },
        })
      : [];
    const byId = new Map(masteries.map((m) => [m.skillId, m]));
    const homework = diary
      ? await db.homework.findMany({
          where: { diaryId: diary.id, studentId: student.id },
          orderBy: [{ optional: "asc" }, { createdAt: "asc" }],
          select: { id: true, text: true, taskType: true },
        })
      : [];

    children.push({
      studentId: student.id,
      nickname: student.nickname,
      // Today's lesson first: that is the half a parent came to see.
      skills: skills
        .map((s) => {
          const m = byId.get(s.id);
          return {
            code: s.code,
            nameVi: s.nameVi,
            subject: s.subject,
            mastery: Math.round(m?.mastery ?? 0),
            status: m?.status ?? "NOT_STARTED",
            isNew: (m?.evidenceCount ?? 0) === 0,
          };
        })
        .sort((a, b) => {
          const today = (s: TonightSkill) => (todayCodes.has(s.code) ? 0 : 1);
          return today(a) - today(b) || a.mastery - b.mastery;
        }),
      homework: homework.map((h) => ({
        id: h.id,
        text: h.text,
        taskType: h.taskType,
        inApp: IN_APP_TASKS.has(h.taskType),
      })),
    });
  }

  return {
    date: date.toISOString().slice(0, 10),
    diaryId: diary?.id ?? null,
    confirmedAt: diary?.confirmedAt ?? null,
    lessons: diary?.lessons ?? [],
    children,
  };
}

/**
 * Whether tonight's nudge is due (docs/08 pha 5 việc 6: remind once, never nag, never at the
 * weekend). Pure, so the rule is testable rather than buried in a component.
 */
export function shouldNudgeForDiary(input: {
  hasDiaryToday: boolean;
  /** 0 = Sunday … 6 = Saturday, in the family's own timezone. */
  weekday: number;
  /** Local hour; before school is out there is nothing to paste yet. */
  hour: number;
  /** The date string the parent already dismissed the nudge for, if any. */
  dismissedFor?: string | null;
  today: string;
}): boolean {
  if (input.hasDiaryToday) return false;
  // No class on Saturday or Sunday, so no post to paste and no reason to ask.
  if (input.weekday === 0 || input.weekday === 6) return false;
  if (input.hour < 16) return false;
  return input.dismissedFor !== input.today;
}
