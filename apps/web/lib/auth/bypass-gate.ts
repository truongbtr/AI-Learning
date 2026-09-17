import { activeBypass, type BypassState, prisma } from "@mtct/db";
import type { SessionUser } from "@/types/next-auth";

/**
 * "Tắt đăng nhập" as the app sees it (docs/12 §7).
 *
 * The switch lives in the database so it can be flipped while testing without a deploy, but the
 * proxy asks on every request, so the answer is cached for {@link TTL_MS}: turning it off takes at
 * most ten seconds to bite, which is the same feel as the 30 s account re-check in auth.ts.
 *
 * An anonymous visitor becomes a real ADMIN account — never a synthetic one — so every role and
 * student check downstream is the check it always was.
 */
const TTL_MS = 10_000;

let cached: { at: number; state: BypassState } | null = null;

/** Drop the cache after flipping the switch, so the banner is right on the next paint. */
export function forgetBypass(): void {
  cached = null;
}

export async function bypassState(): Promise<BypassState> {
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) return cached.state;
  try {
    const state = await activeBypass(prisma);
    cached = { at: now, state };
    return state;
  } catch (error) {
    // A database that cannot answer means the door stays shut.
    console.warn("[auth] không đọc được công tắc tắt đăng nhập", error);
    return { on: false, reason: "off", row: null };
  }
}

/** The session an anonymous visitor gets while login is off, or null when it is on. */
export async function bypassUser(): Promise<SessionUser | null> {
  const state = await bypassState();
  if (!state.on) return null;
  return {
    id: state.user.id,
    username: state.user.username,
    displayName: state.user.displayName,
    role: state.user.role,
    avatarKey: state.user.avatarKey,
    studentId: null,
    nickname: null,
    // Not a real sign-in, so do not push the tester through the change-password gate.
    mustChangePassword: false,
  };
}
