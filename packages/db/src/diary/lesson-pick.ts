/**
 * "Hôm nay lớp học bài nào?" — the parent says it in one tap (docs/11 §4, FR-INT-06).
 *
 * The class diary is the only thing that tells the planner what the class did today, and it is
 * filled by pasting the teacher's Edi Parent post. But the post does not mention every subject:
 * three weeks of posts named Tiếng Việt, ESL and Toán and never once English Maths, so that subject
 * ran on `expectedWeek` alone (owner, 18/09/2026). Picking the lesson from a list writes the same
 * `DiaryLesson` a pasted post would, with its unit and its skills, so nothing downstream changes.
 *
 * A row a parent picked is marked `PARENT` and survives a later paste of the teacher's post, which
 * rebuilds only the `POST` rows.
 */
import { vnDayDate } from "@mtct/core";
import type { PrismaClient, Subject } from "../../generated/client";

type Db = PrismaClient;

export interface LessonChoice {
  code: string;
  title: string;
  /** Book pages, for the parent to recognise the lesson they are looking at. */
  pageFrom: number | null;
  pageTo: number | null;
  weekFrom: number | null;
  topic: string | null;
}

export interface CurrentLesson {
  subject: Subject;
  code: string | null;
  title: string | null;
  /** The day the class was on it, as recorded. */
  date: Date;
  source: "POST" | "PARENT";
}

/** Every lesson of a subject, in book order, for the picker. */
export async function lessonChoices(db: Db, subject: Subject): Promise<LessonChoice[]> {
  const units = await db.lessonUnit.findMany({
    where: { subject },
    orderBy: [{ weekFrom: "asc" }, { pageFrom: "asc" }, { code: "asc" }],
    select: { code: true, title: true, pageFrom: true, pageTo: true, weekFrom: true },
  });
  return units.map((u) => ({ ...u, topic: null }));
}

/** What the class was last recorded on, per subject — what the picker opens at. */
export async function currentLessons(db: Db, className: string): Promise<CurrentLesson[]> {
  const rows = await db.diaryLesson.findMany({
    where: { diary: { className }, lessonUnitId: { not: null }, subject: { not: null } },
    orderBy: { diary: { date: "desc" } },
    take: 60,
    select: {
      subject: true,
      source: true,
      diary: { select: { date: true } },
      lessonUnit: { select: { code: true, title: true } },
    },
  });
  const seen = new Map<Subject, CurrentLesson>();
  for (const row of rows) {
    const subject = row.subject as Subject;
    if (seen.has(subject)) continue;
    seen.set(subject, {
      subject,
      code: row.lessonUnit?.code ?? null,
      title: row.lessonUnit?.title ?? null,
      date: row.diary.date,
      source: row.source,
    });
  }
  return [...seen.values()];
}

/** The lesson after `code` in book order — the "sang bài kế tiếp" button. */
export async function nextLessonAfter(
  db: Db,
  subject: Subject,
  code: string,
): Promise<LessonChoice | null> {
  const all = await lessonChoices(db, subject);
  const at = all.findIndex((u) => u.code === code);
  return at >= 0 ? (all[at + 1] ?? null) : null;
}

export interface SetLessonInput {
  className: string;
  subject: Subject;
  unitCode: string;
  /** Defaults to today in Vietnam. */
  date?: Date;
}

export interface SetLessonResult {
  diaryId: string;
  code: string;
  title: string;
  skillCodes: string[];
  date: Date;
}

/**
 * Records that the class is on this lesson today. Writes the same shape the diary reader writes —
 * unit, subject, the unit's skills — so tonight's session treats it exactly like a teacher's post.
 */
export async function setTodaysLesson(db: Db, input: SetLessonInput): Promise<SetLessonResult> {
  const date = vnDayDate(input.date ?? new Date());
  const unit = await db.lessonUnit.findUnique({
    where: { code: input.unitCode },
    select: {
      id: true,
      code: true,
      title: true,
      subject: true,
      pageFrom: true,
      pageTo: true,
      skills: { select: { skill: { select: { code: true } } } },
    },
  });
  if (!unit) throw new Error(`Không có bài "${input.unitCode}"`);
  if (unit.subject !== input.subject)
    throw new Error(`Bài "${input.unitCode}" không thuộc môn ${input.subject}`);

  const diary = await db.classDiary.upsert({
    where: { className_date: { className: input.className, date } },
    create: { className: input.className, date, rawText: "", confidence: 1 },
    update: {},
    select: { id: true },
  });

  // One lesson per subject per day from this door: picking again replaces the earlier pick.
  await db.diaryLesson.deleteMany({
    where: { diaryId: diary.id, subject: input.subject, source: "PARENT" },
  });
  const skillCodes = unit.skills.map((s) => s.skill.code);
  await db.diaryLesson.create({
    data: {
      diaryId: diary.id,
      subject: input.subject,
      subjectLabel: SUBJECT_LABEL[input.subject] ?? input.subject,
      lessonRefText: unit.title,
      lessonUnitId: unit.id,
      pages: [unit.pageFrom, unit.pageTo].filter((p): p is number => p != null),
      contentNote: "Ba mẹ chọn trên /parent/diary",
      skillCodes,
      source: "PARENT",
    },
  });

  return { diaryId: diary.id, code: unit.code, title: unit.title, skillCodes, date };
}

const SUBJECT_LABEL: Record<string, string> = {
  VIET: "Tiếng Việt",
  VMATH: "Toán",
  ESL: "ESL",
  ENL: "ENL",
  EMATH: "English Maths",
  ESCI: "English Science",
};
