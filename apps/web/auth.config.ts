import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

/** Adults: 30 days when "remember this device" is ticked, else 12 h idle. Kids: 2 h idle (docs/12 §6). */
export const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60;
export const KID_IDLE_MS = 2 * 60 * 60 * 1000;
export const ADULT_IDLE_MS = 12 * 60 * 60 * 1000;

function idleLimitFor(token: JWT): number {
  if (token.role === "CHILD") return KID_IDLE_MS;
  return token.remember ? Number.POSITIVE_INFINITY : ADULT_IDLE_MS;
}

/**
 * Edge-safe part of the Auth.js config (no Prisma): used by proxy.ts for routing decisions
 * and merged into the full config in auth.ts. JWT strategy → httpOnly cookie, no localStorage.
 */
export const authConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SEC },
  pages: { signIn: "/login", error: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      const now = Date.now();
      if (user) {
        // Sign-in: copy the safe user fields into the token.
        token.uid = user.id as string;
        token.username = user.username;
        token.displayName = user.displayName;
        token.role = user.role;
        token.avatarKey = user.avatarKey ?? null;
        token.studentId = user.studentId ?? null;
        token.nickname = user.nickname ?? null;
        token.mustChangePassword = user.mustChangePassword;
        token.remember = Boolean(user.remember);
        token.la = now;
        token.chk = now;
        return token;
      }
      if (trigger === "update" && session && typeof session === "object") {
        const patch = session as Partial<JWT>;
        if (typeof patch.mustChangePassword === "boolean")
          token.mustChangePassword = patch.mustChangePassword;
        if (typeof patch.displayName === "string") token.displayName = patch.displayName;
      }
      // Idle timeout: returning null invalidates the session cookie.
      if (typeof token.la !== "number" || now - token.la > idleLimitFor(token)) return null;
      token.la = now;
      return token;
    },
    session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.uid,
        username: token.username,
        displayName: token.displayName,
        name: token.displayName,
        role: token.role,
        avatarKey: token.avatarKey,
        studentId: token.studentId,
        nickname: token.nickname,
        mustChangePassword: token.mustChangePassword,
      };
      return session;
    },
  },
} satisfies NextAuthConfig;
