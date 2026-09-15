import type {
  DiaryHomeworkRead,
  DiaryLessonRead,
  DiaryParseResult,
  DiarySubject,
} from "@mtct/core";
import { fold, parseClassDiary } from "@mtct/core";
import type { Prisma, PrismaClient, Subject } from "../../generated/client";
import { searchSkills } from "../skills/search";

/**
 * Storing what the class diary said (docs/11 §4, FR-INT-06).
 *
 * Three things happen here and nowhere else:
 *  1. a lesson line is matched to a `LessonUnit` we already know, so tonight's quest can aim at
 *     exactly the lesson the class had this morning;
 *  2. one piece of homework becomes **one `Homework` row per child** — the diary belongs to class
 *     1B3, but Mai Thy reading 5/5 and Chí Thanh reading 2/5 are different facts;
 *  3. lines the pattern reader could not place go to the AI queue as `DIARY_HARD`, so nothing the
 *     teacher wrote is quietly dropped.
 *
 * Re-pasting the same day updates that day instead of adding another (FR-INT-06).
 */

type Db = PrismaClient;

export interface SaveDiaryInput {
  className: string;
  date: Date;
  rawText: string;
  sourceIntakeId?: string | null;
  /** Children the homework is for; default: every active child of that class. */
  studentIds?: string[];
  createdById?: string | null;
}

export interface SaveDiaryResult {
  diaryId: string;
  lessons: number;
  homework: number;
  homeworkPerStudent: number;
  reminders: number;
  unmatched: string[];
  queuedForReading: boolean;
  confidence: number;
  parsed: DiaryParseResult;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

/** Lesson codes follow docs/09: KNTT-TV1-T1-B13, KNTT-T1-B02. */
function unitCodeGuess(subject: DiarySubject | null, lessonNumber: number | null): string | null {
  if (lessonNumber === null) return null;
  if (subject === "VIET") return `KNTT-TV1-T1-B${lessonNumber}`;
  if (subject === "VMATH") return `KNTT-T1-B${String(lessonNumber).padStart(2, "0")}`;
  return null;
}

/** The `LessonUnit` a diary line is about: by code first, then by title. */
async function matchUnit(
  db: Db,
  lesson: DiaryLessonRead,
): Promise<{ id: string; code: string } | null> {
  const code = unitCodeGuess(lesson.subject, lesson.lessonNumber);
  if (code) {
    const byCode = await db.lessonUnit.findUnique({
      where: { code },
      select: { id: true, code: true },
    });
    if (byCode) return byCode;
  }
  if (!lesson.subject) return null;
  // Fall back to the title: "Các số 6,7,8,9,10 (Tiếp)" is a real unit name with no number in it.
  const title = lesson.lessonRefText.replace(/\(ti[eế]p\)/i, "").trim();
  if (title.length < 4) return null;
  const candidates = await db.lessonUnit.findMany({
    where: { material: { subject: lesson.subject as Subject } },
    select: { id: true, code: true, title: true },
    take: 400,
  });
  const wanted = fold(title);
  const exact = candidates.find((c) => fold(c.title) === wanted);
  if (exact) return { id: exact.id, code: exact.code };
  const contains = candidates.find(
    (c) => fold(c.title).includes(wanted) || wanted.includes(fold(c.title)),
  );
  return contains ? { id: contains.id, code: contains.code } : null;
}

/** Skills for a lesson: the unit's own skills, else a full-text search over what was written. */
async function skillsFor(
  db: Db,
  lesson: DiaryLessonRead,
  unitId: string | null,
): Promise<string[]> {
  if (unitId) {
    const links = await db.lessonUnitSkill.findMany({
      where: { unitId },
      select: { skill: { select: { code: true } } },
    });
    if (links.length > 0) return links.map((l) => l.skill.code);
  }
  const query = [lesson.lessonRefText, lesson.contentNote].filter(Boolean).join(" ");
  if (!query.trim()) return [];
  const hits = await searchSkills(db, query, {
    subject: (lesson.subject as Subject | null) ?? null,
    limit: 4,
  });
  return hits.map((h) => h.code);
}

export async function saveClassDiary(db: Db, input: SaveDiaryInput): Promise<SaveDiaryResult> {
  const parsed = parseClassDiary(input.rawText);
  const date = startOfUtcDay(input.date);

  const diary = await db.classDiary.upsert({
    where: { className_date: { className: input.className, date } },
    create: {
      className: input.className,
      date,
      rawText: input.rawText,
      sourceIntakeId: input.sourceIntakeId ?? null,
      parsedAt: new Date(),
      confidence: parsed.confidence,
      unmatched: parsed.unmatched,
    },
    update: {
      rawText: input.rawText,
      sourceIntakeId: input.sourceIntakeId ?? undefined,
      parsedAt: new Date(),
      confidence: parsed.confidence,
      unmatched: parsed.unmatched,
      confirmedAt: null,
      confirmedById: null,
    },
  });

  // Rebuilt from the text every time, so correcting a paste corrects the day.
  await db.diaryLesson.deleteMany({ where: { diaryId: diary.id } });
  for (const lesson of parsed.taught) {
    const unit = await matchUnit(db, lesson);
    const skillCodes = await skillsFor(db, lesson, unit?.id ?? null);
    await db.diaryLesson.create({
      data: {
        diaryId: diary.id,
        subject: (lesson.subject as Subject | null) ?? null,
        subjectLabel: lesson.subjectLabel,
        lessonRefText: lesson.lessonRefText,
        lessonUnitId: unit?.id ?? null,
        unit: lesson.unit,
        lesson: lesson.lesson,
        pages: lesson.pages,
        contentNote: lesson.contentNote,
        skillCodes,
      },
    });
  }

  const studentIds = input.studentIds ?? (await studentsOfClass(db, input.className));
  const homeworkCount = await saveHomework(db, diary.id, date, parsed.homework, studentIds);

  await db.classReminder.deleteMany({ where: { diaryId: diary.id } });
  for (const reminder of parsed.reminders) {
    await db.classReminder.create({
      data: {
        diaryId: diary.id,
        kind: reminder.kind,
        text: reminder.text,
        forDate: reminder.forTomorrow ? new Date(date.getTime() + 86_400_000) : date,
      },
    });
  }

  const queuedForReading = await queueUnmatched(db, diary.id, input, parsed);

  return {
    diaryId: diary.id,
    lessons: parsed.taught.length,
    homework: parsed.homework.length,
    homeworkPerStudent: homeworkCount,
    reminders: parsed.reminders.length,
    unmatched: parsed.unmatched,
    queuedForReading,
    confidence: parsed.confidence,
    parsed,
  };
}

async function studentsOfClass(db: Db, className: string): Promise<string[]> {
  const rows = await db.student.findMany({
    where: { className, user: { isActive: true } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/**
 * One row per child per task (docs/11 §4). Tasks already marked done keep their progress when the
 * parent re-pastes the post — a child who has read 3 of 5 must not lose those three.
 */
async function saveHomework(
  db: Db,
  diaryId: string,
  date: Date,
  tasks: DiaryHomeworkRead[],
  studentIds: string[],
): Promise<number> {
  const existing = await db.homework.findMany({ where: { diaryId } });
  const keep = new Map(existing.map((h) => [`${h.studentId}::${h.text}`, h]));
  let written = 0;

  for (const task of tasks) {
    const skillCodes = await homeworkSkills(db, task);
    for (const studentId of studentIds) {
      const already = keep.get(`${studentId}::${task.text}`);
      const data = {
        diaryId,
        studentId,
        subject: (task.subject as Subject | null) ?? null,
        taskType: task.taskType,
        text: task.text,
        repeatCount: task.repeatCount,
        pages: task.pages,
        skillCodes,
        optional: task.optional,
        dueDate: new Date(date.getTime() + 86_400_000),
        submitTo: task.submitTo,
      };
      if (already) {
        await db.homework.update({ where: { id: already.id }, data });
        keep.delete(`${studentId}::${task.text}`);
      } else {
        await db.homework.create({ data });
      }
      written++;
    }
  }
  // Tasks that disappeared from a corrected paste, and that nobody has started.
  for (const [, stale] of keep) {
    if (stale.status === "PENDING" && stale.progress === 0) {
      await db.homework.delete({ where: { id: stale.id } });
    }
  }
  return written;
}

async function homeworkSkills(db: Db, task: DiaryHomeworkRead): Promise<string[]> {
  const code = unitCodeGuess(task.subject, task.lessonNumber);
  if (code) {
    const unit = await db.lessonUnit.findUnique({
      where: { code },
      select: { skills: { select: { skill: { select: { code: true } } } } },
    });
    if (unit && unit.skills.length > 0) return unit.skills.map((s) => s.skill.code);
  }
  if (!task.subject) return [];
  const hits = await searchSkills(db, task.text, { subject: task.subject as Subject, limit: 3 });
  return hits.map((h) => h.code);
}

/** Lines no pattern explained → the AI queue, so Claude Code reads them in the next batch. */
async function queueUnmatched(
  db: Db,
  diaryId: string,
  input: SaveDiaryInput,
  parsed: DiaryParseResult,
): Promise<boolean> {
  if (parsed.unmatched.length === 0) return false;
  const already = await db.inboxItem.findFirst({
    where: { kind: "DIARY_HARD", payload: { path: ["diaryId"], equals: diaryId } },
    select: { id: true, status: true },
  });
  if (already) return false;
  await db.inboxItem.create({
    data: {
      kind: "DIARY_HARD",
      payload: {
        diaryId,
        className: input.className,
        date: input.date.toISOString().slice(0, 10),
        text: `${parsed.unmatched.join("\n")}\n\n--- toàn bộ bài đăng ---\n${input.rawText}`,
        alreadyRead: {
          taught: parsed.taught.length,
          homework: parsed.homework.length,
          reminders: parsed.reminders.length,
        },
      } as Prisma.InputJsonValue,
    },
  });
  return true;
}

/** A parent tapped "đúng rồi" on what the pattern reader made of the post (FR-INT-06). */
export async function confirmClassDiary(
  db: Db,
  diaryId: string,
  userId: string,
  at = new Date(),
): Promise<void> {
  await db.classDiary.update({
    where: { id: diaryId },
    data: { confirmedAt: at, confirmedById: userId },
  });
}
