import type { PrismaClient } from "../../generated/client";

/**
 * Clearing out the child profiles the end-to-end suites left behind (docs/08 pha 5 việc 0.2).
 *
 * Four acceptance runs of phases 0–4 created a fresh family each time, and the dev database ended
 * up with fifty `Student` rows where there should be two. The list is unusable, and worse, a real
 * mistake is easy to make while staring at forty rows called "Mai Thy".
 *
 * The rule is deliberately timid, because the thing being deleted is a child's learning record:
 *
 *   1. `thy` and `thanh` are never candidates, whatever else is true of them;
 *   2. a candidate must match a slug pattern an e2e suite actually generates **and** have a
 *      disabled account — a real profile a parent switched off is not junk;
 *   3. a candidate that carries any learning data at all — `Evidence` (a photo of schoolwork most
 *      of all), a `Session`, an `Attempt`, an intake job, homework — is **kept and reported**,
 *      never deleted. Data that exists was produced by something, and finding out what it was is
 *      cheaper than getting it back.
 *
 * Deleting the `User` rather than the `Student` is deliberate too: the login has to go with the
 * profile, or `/admin/users` stays as unreadable as the dashboard was.
 */

/** Home slugs of the two real children. Never candidates. */
export const PROTECTED_SLUGS = ["thy", "thanh"] as const;

/**
 * Slugs the test suites generate: `p1kid-<5>` (phase 1), `thy-<5>` / `thanh-<5>` (phases 3–4 seed
 * a whole family), `e2e-<anything>`, and `test-<name>-<id>` / `itest-<name>-<id>` from
 * `createTempStudent` in the database integration tests — that last one turns up whenever a run is
 * interrupted before its `afterAll` gets to tidy up. A slug outside these is reported, never
 * deleted.
 */
const TEST_SLUG_PATTERNS = [
  /^p1kid-[a-z0-9]{4,8}$/,
  /^(thy|thanh)-[a-z0-9]{4,8}$/,
  /^e2e-/,
  /^i?test-[a-z0-9-]+$/,
];

/** Parent accounts the same suites create beside each family. Only removed with an extra flag. */
const TEST_PARENT_USERNAME = /^(me|ba)-[a-z0-9]{4,8}$/;

export function looksLikeTestSlug(slug: string): boolean {
  if ((PROTECTED_SLUGS as readonly string[]).includes(slug)) return false;
  return TEST_SLUG_PATTERNS.some((re) => re.test(slug));
}

export function looksLikeTestParent(username: string): boolean {
  return TEST_PARENT_USERNAME.test(username);
}

/** What a profile carries. Every count is a reason to keep it. */
export interface StudentDataCounts {
  evidence: number;
  intakePhotoEvidence: number;
  sessions: number;
  attempts: number;
  intakeJobs: number;
  homeworks: number;
  conversations: number;
}

export type Verdict = "DELETE" | "KEEP_HAS_DATA" | "KEEP_PROTECTED" | "KEEP_UNRECOGNISED";

export interface StudentAudit {
  studentId: string;
  userId: string;
  slug: string;
  nickname: string;
  isActive: boolean;
  counts: StudentDataCounts;
  verdict: Verdict;
  /** Vietnamese, for the console and the report. */
  why: string;
}

export function totalData(counts: StudentDataCounts): number {
  return (
    counts.evidence +
    counts.sessions +
    counts.attempts +
    counts.intakeJobs +
    counts.homeworks +
    counts.conversations
  );
}

/**
 * The whole decision, as a pure function so a test can put a photo of schoolwork on a junk-named
 * profile and prove it survives.
 */
export function classify(input: { slug: string; isActive: boolean; counts: StudentDataCounts }): {
  verdict: Verdict;
  why: string;
} {
  if ((PROTECTED_SLUGS as readonly string[]).includes(input.slug))
    return { verdict: "KEEP_PROTECTED", why: "hồ sơ thật của con — không bao giờ xoá" };
  if (!looksLikeTestSlug(input.slug))
    return { verdict: "KEEP_UNRECOGNISED", why: "slug không khớp mẫu do e2e sinh ra" };
  if (input.isActive)
    return { verdict: "KEEP_UNRECOGNISED", why: "tài khoản đang bật — có thể là hồ sơ thật" };
  if (totalData(input.counts) > 0) {
    const c = input.counts;
    const parts: string[] = [];
    if (c.intakePhotoEvidence > 0) parts.push(`${c.intakePhotoEvidence} bằng chứng từ ảnh bài vở`);
    const otherEvidence = c.evidence - c.intakePhotoEvidence;
    if (otherEvidence > 0) parts.push(`${otherEvidence} bằng chứng khác`);
    if (c.sessions > 0) parts.push(`${c.sessions} phiên`);
    if (c.attempts > 0) parts.push(`${c.attempts} lượt làm bài`);
    if (c.intakeJobs > 0) parts.push(`${c.intakeJobs} lô ảnh`);
    if (c.homeworks > 0) parts.push(`${c.homeworks} bài cô giao`);
    if (c.conversations > 0) parts.push(`${c.conversations} hội thoại`);
    return { verdict: "KEEP_HAS_DATA", why: `có dữ liệu thật: ${parts.join(" · ")}` };
  }
  return { verdict: "DELETE", why: "hồ sơ rỗng do e2e tạo" };
}

async function countsFor(db: PrismaClient, studentId: string): Promise<StudentDataCounts> {
  const [evidence, intakePhotoEvidence, sessions, attempts, intakeJobs, homeworks, conversations] =
    await Promise.all([
      db.evidence.count({ where: { studentId } }),
      db.evidence.count({ where: { studentId, source: "INTAKE_PHOTO" } }),
      db.session.count({ where: { studentId } }),
      db.attempt.count({ where: { session: { studentId } } }),
      db.intakeJob.count({ where: { studentId } }),
      db.homework.count({ where: { studentId } }),
      db.conversation.count({ where: { studentId } }),
    ]);
  return {
    evidence,
    intakePhotoEvidence,
    sessions,
    attempts,
    intakeJobs,
    homeworks,
    conversations,
  };
}

export interface AuditResult {
  audits: StudentAudit[];
  /** Inactive e2e parent accounts left with no children once the deletions are done. */
  orphanParents: { userId: string; username: string }[];
}

export async function auditStudents(db: PrismaClient): Promise<AuditResult> {
  const students = await db.student.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      userId: true,
      slug: true,
      nickname: true,
      user: { select: { isActive: true } },
    },
  });

  const audits: StudentAudit[] = [];
  for (const s of students) {
    const counts = await countsFor(db, s.id);
    const { verdict, why } = classify({ slug: s.slug, isActive: s.user.isActive, counts });
    audits.push({
      studentId: s.id,
      userId: s.userId,
      slug: s.slug,
      nickname: s.nickname,
      isActive: s.user.isActive,
      counts,
      verdict,
      why,
    });
  }

  // Which e2e parents would be left pointing at nothing. Reported whether or not they are removed.
  const deleting = new Set(audits.filter((a) => a.verdict === "DELETE").map((a) => a.studentId));
  const parents = await db.user.findMany({
    where: { role: "PARENT", isActive: false },
    select: { id: true, username: true, guardianOf: { select: { studentId: true } } },
  });
  const orphanParents = parents
    .filter(
      (p) =>
        TEST_PARENT_USERNAME.test(p.username) &&
        p.guardianOf.every((g) => deleting.has(g.studentId)),
    )
    .map((p) => ({ userId: p.id, username: p.username }));

  return { audits, orphanParents };
}

export interface CleanResult extends AuditResult {
  deletedStudents: number;
  deletedParents: number;
}

/**
 * Removes the empty e2e profiles. Nothing happens unless `apply` is true — the CLI's default is a
 * dry run, and it stays that way however the function is called.
 */
export async function cleanTestStudents(
  db: PrismaClient,
  opts: { apply?: boolean; withOrphanParents?: boolean } = {},
): Promise<CleanResult> {
  const audit = await auditStudents(db);
  if (!opts.apply) return { ...audit, deletedStudents: 0, deletedParents: 0 };

  const userIds = audit.audits.filter((a) => a.verdict === "DELETE").map((a) => a.userId);
  // Deleting the user cascades to the Student row, the guardian links and the trusted devices.
  const students = userIds.length
    ? await db.user.deleteMany({ where: { id: { in: userIds } } })
    : { count: 0 };
  const parents =
    opts.withOrphanParents && audit.orphanParents.length
      ? await db.user.deleteMany({
          where: { id: { in: audit.orphanParents.map((p) => p.userId) } },
        })
      : { count: 0 };

  return { ...audit, deletedStudents: students.count, deletedParents: parents.count };
}
