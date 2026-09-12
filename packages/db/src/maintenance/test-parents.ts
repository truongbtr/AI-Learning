import type { PrismaClient } from "../../generated/client";
import { looksLikeTestParent, PROTECTED_SLUGS } from "./test-students";

/**
 * The fifteen `me-*` accounts the e2e suites left behind (docs/08 pha 8 việc 0.2).
 *
 * Phase 5 removed the empty child profiles those suites created; the parent logins beside them
 * stayed, because deleting them was out of that phase's scope. Now the site is about to be open on
 * the internet, and every account that exists is an account somebody could log into. Fifteen
 * logins nobody owns is fifteen more chances for a password to be the weak one.
 *
 * The rule mirrors `test-students.ts` and errs the same way — towards keeping:
 *
 *   1. a candidate must match the username pattern the suites generate **and** be disabled;
 *   2. an account still linked to **any** surviving child is kept, and one linked to Mai Thy or
 *      Chí Thanh is kept and called out by name — that is the parent's real login, whatever the
 *      username looks like;
 *   3. `ADMIN` is never a candidate.
 *
 * Deleting the `User` cascades the `StudentGuardian` rows with it; no child profile is touched.
 */

export type ParentVerdict =
  | "DELETE"
  | "KEEP_LINKED_REAL"
  | "KEEP_HAS_CHILDREN"
  | "KEEP_UNRECOGNISED";

export interface ParentChildLink {
  studentId: string;
  slug: string;
  nickname: string;
  /** `thy` or `thanh` — the two real profiles. */
  isProtected: boolean;
}

export interface ParentAudit {
  userId: string;
  username: string;
  displayName: string;
  role: string;
  isActive: boolean;
  children: ParentChildLink[];
  verdict: ParentVerdict;
  /** Vietnamese, for the console and the report. */
  why: string;
}

/** The whole decision, pure, so a test can hang a real child off a junk-named account. */
export function classifyParent(input: {
  username: string;
  role: string;
  isActive: boolean;
  children: ParentChildLink[];
}): { verdict: ParentVerdict; why: string } {
  if (input.role !== "PARENT")
    return { verdict: "KEEP_UNRECOGNISED", why: `vai trò ${input.role} — chỉ xét PARENT` };

  const real = input.children.filter((c) => c.isProtected);
  if (real.length > 0)
    return {
      verdict: "KEEP_LINKED_REAL",
      why: `GIỮ — còn nối tới hồ sơ thật: ${real.map((c) => c.nickname).join(", ")}`,
    };
  if (input.children.length > 0)
    return {
      verdict: "KEEP_HAS_CHILDREN",
      why: `còn nối tới ${input.children.length} hồ sơ (${input.children.map((c) => c.slug).join(", ")})`,
    };
  if (!looksLikeTestParent(input.username))
    return { verdict: "KEEP_UNRECOGNISED", why: "tên đăng nhập không khớp mẫu do e2e sinh ra" };
  if (input.isActive)
    return { verdict: "KEEP_UNRECOGNISED", why: "tài khoản đang bật — có thể là người thật" };
  return { verdict: "DELETE", why: "tài khoản e2e đã tắt, không còn con nào" };
}

export interface ParentAuditResult {
  audits: ParentAudit[];
}

export async function auditTestParents(db: PrismaClient): Promise<ParentAuditResult> {
  const users = await db.user.findMany({
    where: { role: "PARENT" },
    orderBy: { username: "asc" },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
      guardianOf: {
        select: { student: { select: { id: true, slug: true, nickname: true } } },
      },
    },
  });

  const audits = users.map((u) => {
    const children: ParentChildLink[] = u.guardianOf.map((g) => ({
      studentId: g.student.id,
      slug: g.student.slug,
      nickname: g.student.nickname,
      isProtected: (PROTECTED_SLUGS as readonly string[]).includes(g.student.slug),
    }));
    const { verdict, why } = classifyParent({
      username: u.username,
      role: u.role,
      isActive: u.isActive,
      children,
    });
    return {
      userId: u.id,
      username: u.username,
      displayName: u.displayName,
      role: u.role,
      isActive: u.isActive,
      children,
      verdict,
      why,
    };
  });

  return { audits };
}

export interface CleanParentResult extends ParentAuditResult {
  deleted: number;
}

/** Nothing happens unless `apply` is true, however this is called. */
export async function cleanTestParents(
  db: PrismaClient,
  opts: { apply?: boolean } = {},
): Promise<CleanParentResult> {
  const audit = await auditTestParents(db);
  if (!opts.apply) return { ...audit, deleted: 0 };

  const ids = audit.audits.filter((a) => a.verdict === "DELETE").map((a) => a.userId);
  const result = ids.length
    ? await db.user.deleteMany({ where: { id: { in: ids } } })
    : { count: 0 };
  return { ...audit, deleted: result.count };
}
