import { prisma } from "@mtct/db";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { authenticateAdult, authenticateKid, type LoginFailure } from "./lib/auth/login-service";
import { requestMetaFromHeaders } from "./lib/request-meta";

/** Thrown from `authorize`; `code` travels back to the login form (never reveals which field failed). */
export class LoginError extends CredentialsSignin {
  constructor(public override code: LoginFailure) {
    super(code);
  }
}

const DB_RECHECK_MS = 30_000;

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "adult",
      name: "Ba mẹ đăng nhập",
      credentials: { username: {}, password: {}, remember: {} },
      async authorize(credentials, request) {
        const meta = requestMetaFromHeaders(request.headers);
        const result = await authenticateAdult({
          username: String(credentials?.username ?? ""),
          password: String(credentials?.password ?? ""),
          ...meta,
        });
        if (!result.ok) throw new LoginError(result.failure);
        return {
          ...result.user,
          remember: credentials?.remember === "on" || credentials?.remember === "true",
        };
      },
    }),
    Credentials({
      id: "kid-login",
      name: "Con đăng nhập",
      credentials: { userId: {}, pin: {} },
      async authorize(credentials, request) {
        const meta = requestMetaFromHeaders(request.headers);
        const raw = String(credentials?.pin ?? "");
        const result = await authenticateKid({
          userId: String(credentials?.userId ?? ""),
          pin: raw ? raw.split(",") : [],
          ...meta,
        });
        if (!result.ok) throw new LoginError(result.failure);
        return { ...result.user, remember: false };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params);
      if (!token) return null;
      // Re-check the account every 30 s so "disable" / "reset password" take effect quickly.
      const now = Date.now();
      if (!params.user && now - (token.chk ?? 0) > DB_RECHECK_MS) {
        const user = await prisma.user.findUnique({
          where: { id: token.uid },
          select: { isActive: true, mustChangePassword: true, displayName: true, role: true },
        });
        if (!user?.isActive) return null;
        token.mustChangePassword = user.mustChangePassword;
        token.displayName = user.displayName;
        token.role = user.role;
        token.chk = now;
      }
      return token;
    },
  },
});
