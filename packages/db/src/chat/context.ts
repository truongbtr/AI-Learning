import { vnDayDate } from "@mtct/core";
import type { PrismaClient, Subject } from "../../generated/client";
import { searchSkills } from "../skills/search";

/**
 * `GET /api/internal/context` — what the phone reads **before** it looks at the photo (docs/13 §7.4).
 *
 * This endpoint is the difference between a useful reading and a guess, and the number is measured:
 * the `intake-v1` eval scored 33% when the reader invented skill codes and 77.8% when it chose from
 * a list. So the list is the product here. It is assembled in the order a person would look:
 *
 *   1. what the class actually did in the last three days (the diary),
 *   2. what full-text search turns up for those lesson names,
 *   3. what this child is already working on,
 *   4. the whole error taxonomy, and ten labels a parent has corrected before.
 *
 * Every code handed out is remembered in `ChatContext`, because that is what lets the server tell
 * "a skill we offered" from "a skill something made up" when the result comes back (`validateChatIntake`).
 */

type Db = PrismaClient;

const DAY_MS = 86_400_000;
/** docs/11 §4 — how long a class lesson still counts as "what we did in class". */
const LESSON_WINDOW_DAYS = 3;
const MAX_CANDIDATES = 40;

export interface ChatSkillCandidate {
  code: string;
  nameVi: string;
  subject: Subject;
  strand?: string;
  /** Why it is on the list — the reader is told, so it can disagree with the reason. */
  matchedOn: string;
}

export interface ChatContextResponse {
  contextId: string;
  student: { nickname: string; grade: number; className: string };
  date: string;
  /** What the class did, newest first. */
  recentLessons: {
    date: string;
    subjectLabel: string;
    lessonRefText: string;
    skillCodes: string[];
  }[];
  /** Skills of those lessons — the first place to look. */
  currentSkills: ChatSkillCandidate[];
  /** Everything the reader may choose from, `currentSkills` included. */
  skillCandidates: ChatSkillCandidate[];
  errorCodes: { code: string; nameVi: string }[];
  /** Ten (wrong → corrected) labels a parent has fixed (docs/07 §2.3). */
  parentCorrections: { question: string; from: string[]; to: string[] }[];
  /** The rules, in the response, so a fresh chat session cannot be unaware of them. */
  rules: string[];
  /** What to do with this, in one sentence. */
  expects: string;
}

export interface BuildChatContextOptions {
  /** `thy` | `thanh` — a nickname or a slug, never a full name (docs/00, NFR-06). */
  student: string;
  date?: Date | null;
  subject?: Subject | null;
  /** Extra words to search skills by: a lesson title, the worksheet heading. */
  terms?: string[];
  now?: Date;
}

export async function buildChatContext(
  db: Db,
  opts: BuildChatContextOptions,
): Promise<ChatContextResponse | null> {
  const now = opts.now ?? new Date();
  const key = opts.student.trim().toLowerCase();
  const student = await db.student.findFirst({
    where: {
      isActive: true,
      OR: [{ slug: key }, { nickname: { equals: key, mode: "insensitive" } }],
    },
    select: { id: true, nickname: true, grade: true, className: true },
  });
  if (!student) return null;

  const date = opts.date ?? now;
  const day = vnDayDate(date);

  // ── 1. what the class did ──────────────────────────────────────────────────────────────────
  const diaries = await db.classDiary.findMany({
    where: {
      className: student.className,
      date: { gte: new Date(day.getTime() - LESSON_WINDOW_DAYS * DAY_MS), lte: day },
    },
    orderBy: { date: "desc" },
    include: { lessons: true },
  });
  const recentLessons = diaries.flatMap((d) =>
    d.lessons.map((l) => ({
      date: d.date.toISOString().slice(0, 10),
      subjectLabel: l.subjectLabel,
      lessonRefText: l.lessonRefText,
      skillCodes: l.skillCodes,
    })),
  );

  const lessonCodes = [...new Set(recentLessons.flatMap((l) => l.skillCodes))];
  const currentSkills = await skillsByCode(db, lessonCodes, "bài lớp 3 ngày gần nhất");

  // ── 2. full-text search over the lesson names and anything the caller passed ────────────────
  const terms = [
    ...new Set(
      [...recentLessons.map((l) => l.lessonRefText), ...(opts.terms ?? [])]
        .map((t) => t.trim())
        .filter((t) => t.length > 2),
    ),
  ].slice(0, 6);
  const candidates = new Map<string, ChatSkillCandidate>();
  for (const skill of currentSkills) candidates.set(skill.code, skill);
  for (const term of terms) {
    for (const hit of await searchSkills(db, term, { subject: opts.subject ?? null, limit: 8 }))
      if (!candidates.has(hit.code))
        candidates.set(hit.code, {
          code: hit.code,
          nameVi: hit.nameVi,
          subject: hit.subject,
          strand: hit.strand,
          matchedOn: `tìm theo "${term.slice(0, 40)}"`,
        });
  }

  // ── 3. what this child is already working on ───────────────────────────────────────────────
  const working = await db.skillMastery.findMany({
    where: { studentId: student.id, status: { in: ["LEARNING", "NEEDS_PRACTICE", "SOLID"] } },
    orderBy: { lastEvidenceAt: "desc" },
    take: 24,
    select: {
      status: true,
      skill: { select: { code: true, nameVi: true, subject: true, strand: true } },
    },
  });
  for (const row of working)
    if (!candidates.has(row.skill.code))
      candidates.set(row.skill.code, {
        code: row.skill.code,
        nameVi: row.skill.nameVi,
        subject: row.skill.subject,
        strand: row.skill.strand,
        matchedOn: `con đang học (${row.status})`,
      });

  const skillCandidates = [...candidates.values()].slice(0, MAX_CANDIDATES);

  const errorCodes = (
    await db.errorCode.findMany({
      where: { isActive: true },
      select: { code: true, nameVi: true },
      orderBy: { code: "asc" },
    })
  ).map((c) => ({ code: c.code, nameVi: c.nameVi }));

  const corrections = await db.intakeItem.findMany({
    where: { skillCodesFinal: { isEmpty: false }, editedByParent: true },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: { questionText: true, skillCodes: true, skillCodesFinal: true },
  });

  const context = await db.chatContext.create({
    data: {
      studentId: student.id,
      date: day,
      skillCodes: skillCandidates.map((s) => s.code),
    },
  });

  return {
    contextId: context.id,
    student: { nickname: student.nickname, grade: student.grade, className: student.className },
    date: day.toISOString().slice(0, 10),
    recentLessons,
    currentSkills,
    skillCandidates,
    errorCodes,
    parentCorrections: corrections
      .filter((c) => JSON.stringify(c.skillCodes) !== JSON.stringify(c.skillCodesFinal))
      .map((c) => ({ question: c.questionText, from: c.skillCodes, to: c.skillCodesFinal })),
    rules: [
      "Chỉ dùng mã kỹ năng có trong skillCandidates và mã lỗi có trong errorCodes. Không có thì để rỗng.",
      "Ô trống là BLANK, không bao giờ là INCORRECT. Máy chủ tự suy blankReason theo vị trí ô trống.",
      "Chưa chắc thì hạ confidence xuống dưới 0,6 — lô sẽ được giữ lại cho ba mẹ xem, không bị mất.",
      "Ảnh NAVIO / Kids A-Z: ghi số vào externals, items để rỗng.",
      "Chỉ dùng tên gọi ở nhà (thy, thanh). Không gửi tên đầy đủ, không ngày sinh.",
      `Gửi kèm contextId "${context.id}" khi POST /api/internal/intake.`,
    ],
    expects:
      "Đọc ảnh bài vở rồi POST /api/internal/intake với thân là IntakeExtraction: từng câu, con trả lời gì, đúng / chưa đúng / bỏ trống, mã lỗi và mã kỹ năng lấy từ skillCandidates.",
  };
}

async function skillsByCode(
  db: Db,
  codes: string[],
  matchedOn: string,
): Promise<ChatSkillCandidate[]> {
  if (codes.length === 0) return [];
  const rows = await db.skill.findMany({
    where: { code: { in: codes }, isActive: true },
    select: { code: true, nameVi: true, subject: true, strand: true },
  });
  return rows.map((s) => ({
    code: s.code,
    nameVi: s.nameVi,
    subject: s.subject,
    strand: s.strand,
    matchedOn,
  }));
}
