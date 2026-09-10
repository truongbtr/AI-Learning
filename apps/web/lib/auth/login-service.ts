import {
  applyFailure,
  applySuccess,
  IP_THROTTLE,
  ipThrottled,
  isLocked,
  lockRemainingSeconds,
  pinToSecret,
} from "@mtct/core";
import { type LoginResult, prisma } from "@mtct/db";
import type { SessionUser } from "@/types/next-auth";
import { verifyAgainstDummy, verifySecret } from "./password";

/**
 * Failure codes (docs/12 §6). INVALID is returned for wrong username AND wrong password/pin
 * so the response never reveals whether an account exists.
 */
export type LoginFailure = "INVALID" | "LOCKED" | "THROTTLED";

export type LoginOutcome = { ok: true; user: SessionUser } | { ok: false; failure: LoginFailure };

interface Meta {
  ip: string;
  userAgent: string;
}

async function audit(
  meta: Meta,
  usernameTried: string,
  result: LoginResult,
  userId: string | null,
): Promise<void> {
  await prisma.loginAudit.create({
    data: {
      userId,
      usernameTried: usernameTried.slice(0, 64),
      ip: meta.ip,
      userAgent: meta.userAgent,
      result,
    },
  });
}

async function ipIsThrottled(meta: Meta): Promise<boolean> {
  const since = new Date(Date.now() - IP_THROTTLE.windowSeconds * 1000);
  // Only failed attempts count: a family device logging in and out is not a brute-force.
  const attempts = await prisma.loginAudit.count({
    where: { ip: meta.ip, at: { gte: since }, result: { not: "OK" } },
  });
  return ipThrottled(attempts);
}

type UserRow = NonNullable<Awaited<ReturnType<typeof loadUser>>>;

function loadUser(where: { username: string } | { id: string }) {
  return prisma.user.findUnique({
    where,
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      avatarKey: true,
      passwordHash: true,
      picturePinHash: true,
      isActive: true,
      mustChangePassword: true,
      failedCount: true,
      lockedUntil: true,
      student: { select: { id: true, nickname: true } },
    },
  });
}

function toSessionUser(u: UserRow): SessionUser {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    avatarKey: u.avatarKey,
    studentId: u.student?.id ?? null,
    nickname: u.student?.nickname ?? null,
    mustChangePassword: u.mustChangePassword,
  };
}

/** Shared tail of both flows once the user row is loaded: active? locked? secret ok? */
async function finishLogin(
  user: UserRow,
  secretOk: () => Promise<boolean>,
  meta: Meta,
  usernameTried: string,
): Promise<LoginOutcome> {
  const now = new Date();
  if (!user.isActive) {
    await audit(meta, usernameTried, "DISABLED", user.id);
    return { ok: false, failure: "INVALID" };
  }
  if (isLocked(user, now)) {
    await audit(meta, usernameTried, "LOCKED", user.id);
    return { ok: false, failure: "LOCKED" };
  }
  if (!(await secretOk())) {
    const next = applyFailure(user, now);
    await prisma.user.update({
      where: { id: user.id },
      data: { failedCount: next.failedCount, lockedUntil: next.lockedUntil },
    });
    await audit(meta, usernameTried, "WRONG_PASSWORD", user.id);
    if (next.lockedUntil) {
      if (user.role === "CHILD") {
        // Tell the parents (docs/12 §6): visible in admin audit; dashboard card comes in phase 5.
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "KID_LOGIN_LOCKED",
            target: user.id,
            detail: { ip: meta.ip },
          },
        });
      }
      return { ok: false, failure: "LOCKED" };
    }
    return { ok: false, failure: "INVALID" };
  }
  const reset = applySuccess();
  await prisma.user.update({
    where: { id: user.id },
    data: { failedCount: reset.failedCount, lockedUntil: reset.lockedUntil, lastLoginAt: now },
  });
  await audit(meta, usernameTried, "OK", user.id);
  return { ok: true, user: toSessionUser(user) };
}

export async function authenticateAdult(input: {
  username: string;
  password: string;
  ip: string;
  userAgent: string;
}): Promise<LoginOutcome> {
  const meta = { ip: input.ip, userAgent: input.userAgent };
  const username = input.username.trim().toLowerCase();
  if (await ipIsThrottled(meta)) {
    await audit(meta, username, "LOCKED", null);
    return { ok: false, failure: "THROTTLED" };
  }
  const user = username ? await loadUser({ username }) : null;
  if (!user || user.role === "CHILD" || !user.passwordHash) {
    await verifyAgainstDummy(input.password); // keep timing similar to a real check
    await audit(meta, username || "(empty)", "NO_SUCH_USER", null);
    return { ok: false, failure: "INVALID" };
  }
  return finishLogin(user, () => verifySecret(user.passwordHash, input.password), meta, username);
}

export async function authenticateKid(input: {
  userId: string;
  pin: string[];
  ip: string;
  userAgent: string;
}): Promise<LoginOutcome> {
  const meta = { ip: input.ip, userAgent: input.userAgent };
  if (await ipIsThrottled(meta)) {
    await audit(meta, input.userId, "LOCKED", null);
    return { ok: false, failure: "THROTTLED" };
  }
  const user = input.userId ? await loadUser({ id: input.userId }) : null;
  if (user?.role !== "CHILD" || !user.picturePinHash) {
    await verifyAgainstDummy(pinToSecret(input.pin));
    await audit(meta, input.userId || "(empty)", "NO_SUCH_USER", null);
    return { ok: false, failure: "INVALID" };
  }
  return finishLogin(
    user,
    () => verifySecret(user.picturePinHash, pinToSecret(input.pin)),
    meta,
    user.username,
  );
}

/** Minutes left for the lock message ("thử lại sau N phút"). */
export async function lockMinutesLeft(userId: string): Promise<number> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedCount: true, lockedUntil: true },
  });
  return u ? Math.ceil(lockRemainingSeconds(u, new Date()) / 60) : 0;
}
