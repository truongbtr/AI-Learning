/**
 * "Tắt đăng nhập" — a switch in the database that lets a browser reach /admin without logging in
 * (owner, 18/09/2026: khi test thì tắt đăng nhập đi vào thẳng trang admin).
 *
 * This is a real hole in the front door of a site that is open to the internet, so the switch is
 * built to close itself:
 *  - it always carries an expiry (default {@link DEFAULT_HOURS} h, never more than {@link MAX_HOURS} h);
 *    past it, the row still says `enabled` but {@link activeBypass} reports "hết hạn" and nobody gets in;
 *  - it borrows a real, active ADMIN account, so every role and student check downstream is the
 *    same check as always — nothing gets a magic identity;
 *  - turning it on or off writes an AuditLog line, and every adult page shows a banner while it is on.
 *
 * It is stored in `Setting` (key {@link AUTH_BYPASS_KEY}) so it can be flipped without a deploy, and
 * `scripts/auth-bypass.mjs` can flip it from the server when the login page itself is the problem.
 */
import type { PrismaClient, Role } from "../../generated/client";

type Db = PrismaClient;

export const AUTH_BYPASS_KEY = "auth.bypass";
export const DEFAULT_HOURS = 8;
export const MAX_HOURS = 24 * 7;

/** What the Setting row holds. `until` is an ISO string so the JSON column stays readable. */
export interface AuthBypassRow {
  enabled: boolean;
  /** The ADMIN account every anonymous visitor becomes. */
  userId: string;
  until: string;
  note: string;
  setBy: string | null;
  setAt: string;
}

export interface BypassUser {
  id: string;
  username: string;
  displayName: string;
  role: Role;
  avatarKey: string | null;
  mustChangePassword: boolean;
}

export type BypassState =
  | { on: false; reason: "off" | "expired" | "no-user"; row: AuthBypassRow | null }
  | { on: true; row: AuthBypassRow; until: Date; user: BypassUser };

function parseRow(value: unknown): AuthBypassRow | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.userId !== "string" || typeof v.until !== "string") return null;
  return {
    enabled: v.enabled === true,
    userId: v.userId,
    until: v.until,
    note: typeof v.note === "string" ? v.note : "",
    setBy: typeof v.setBy === "string" ? v.setBy : null,
    setAt: typeof v.setAt === "string" ? v.setAt : new Date(0).toISOString(),
  };
}

/** Pure half: is this row still letting people in at `now`? */
export function bypassStatus(
  row: AuthBypassRow | null,
  now: Date,
): { open: boolean; reason: "off" | "expired" | "open"; until: Date | null } {
  if (!row?.enabled) return { open: false, reason: "off", until: null };
  const until = new Date(row.until);
  if (Number.isNaN(until.getTime()) || until.getTime() <= now.getTime())
    return { open: false, reason: "expired", until: Number.isNaN(until.getTime()) ? null : until };
  return { open: true, reason: "open", until };
}

/** Hours to an expiry date, clamped to something that cannot be left open for a month. */
export function bypassUntil(hours: number | undefined, now: Date): Date {
  const h = Math.min(
    MAX_HOURS,
    Math.max(0.25, Number.isFinite(hours) ? Number(hours) : DEFAULT_HOURS),
  );
  return new Date(now.getTime() + h * 3_600_000);
}

/** Read the row as stored, without deciding anything. */
export async function readAuthBypass(db: Db): Promise<AuthBypassRow | null> {
  const row = await db.setting.findUnique({ where: { key: AUTH_BYPASS_KEY } });
  return parseRow(row?.value);
}

/**
 * The one question the app asks: "is login off right now, and who does an anonymous visitor become?"
 * Returns the borrowed account only when the switch is on, unexpired, and that account is still an
 * active ADMIN — a disabled account closes the door by itself.
 */
export async function activeBypass(db: Db, now = new Date()): Promise<BypassState> {
  const row = await readAuthBypass(db);
  const status = bypassStatus(row, now);
  if (!status.open || !row) return { on: false, reason: status.reason as "off" | "expired", row };
  const user = await db.user.findUnique({
    where: { id: row.userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      avatarKey: true,
      mustChangePassword: true,
      isActive: true,
    },
  });
  if (!user?.isActive || user.role !== "ADMIN") return { on: false, reason: "no-user", row };
  const { isActive: _drop, ...rest } = user;
  return { on: true, row, until: status.until as Date, user: rest };
}

export interface SetBypassInput {
  enabled: boolean;
  /** Which ADMIN to borrow; defaults to the oldest active ADMIN. */
  userId?: string;
  hours?: number;
  note?: string;
  /** Who flipped it, for the audit line. */
  byUserId?: string | null;
}

/** Turn the switch on or off, and leave a trace of who did it. */
export async function setAuthBypass(
  db: Db,
  input: SetBypassInput,
  now = new Date(),
): Promise<BypassState> {
  const previous = await readAuthBypass(db);

  if (!input.enabled) {
    const row: AuthBypassRow = {
      enabled: false,
      userId: previous?.userId ?? "",
      until: new Date(0).toISOString(),
      note: input.note ?? "",
      setBy: input.byUserId ?? null,
      setAt: now.toISOString(),
    };
    await db.setting.upsert({
      where: { key: AUTH_BYPASS_KEY },
      create: { key: AUTH_BYPASS_KEY, value: { ...row } },
      update: { value: { ...row } },
    });
    await db.auditLog.create({
      data: {
        userId: input.byUserId ?? null,
        action: "auth.bypass.off",
        target: AUTH_BYPASS_KEY,
        detail: { note: row.note },
      },
    });
    return { on: false, reason: "off", row };
  }

  const admin = input.userId
    ? await db.user.findUnique({
        where: { id: input.userId },
        select: { id: true, role: true, isActive: true },
      })
    : await db.user.findFirst({
        where: { role: "ADMIN", isActive: true },
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, isActive: true },
      });
  if (!admin?.isActive || admin.role !== "ADMIN")
    throw new Error("Cần một tài khoản ADMIN đang hoạt động để tắt đăng nhập");

  const until = bypassUntil(input.hours, now);
  const row: AuthBypassRow = {
    enabled: true,
    userId: admin.id,
    until: until.toISOString(),
    note: input.note ?? "",
    setBy: input.byUserId ?? null,
    setAt: now.toISOString(),
  };
  await db.setting.upsert({
    where: { key: AUTH_BYPASS_KEY },
    create: { key: AUTH_BYPASS_KEY, value: { ...row } },
    update: { value: { ...row } },
  });
  await db.auditLog.create({
    data: {
      userId: input.byUserId ?? null,
      action: "auth.bypass.on",
      target: AUTH_BYPASS_KEY,
      detail: { until: row.until, asUserId: admin.id, note: row.note },
    },
  });
  return await activeBypass(db, now);
}
