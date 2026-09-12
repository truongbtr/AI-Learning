import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * The second lock on `/parent` and `/admin` (docs/02 §6, docs/12 §6, docs/08 pha 8 việc 1).
 *
 * Cloudflare Access sits in front of those two areas and asks for a one-time code by email before
 * the request ever reaches the house. That alone is a login screen on Cloudflare's side, though —
 * it does not stop anyone who finds another way to the origin. So the origin checks too: Access
 * signs a JWT and puts it in `Cf-Access-Jwt-Assertion`, and this verifies the signature, the
 * issuer and the audience against Cloudflare's published keys.
 *
 * **The child's area is deliberately not behind any of this.** A six-year-old cannot read an email
 * for a one-time code; asking her to would mean asking a parent to sit down every single evening,
 * which is the one thing this whole project exists to avoid. `/kid` is protected by the four-picture
 * code, the two-hour session, the lockout and the trusted-device check (docs/12 §6) — the locks a
 * six-year-old can actually work.
 *
 * Unconfigured, this does nothing at all: on the LAN, and in dev, there is no Access in front and
 * demanding its header would lock the family out of their own machine.
 */

export interface AccessConfig {
  /** e.g. `giadinh.cloudflareaccess.com` — Zero Trust → Settings → Custom Pages → team domain. */
  teamDomain: string;
  /** The Application Audience (AUD) tag of the Access application. */
  audience: string;
}

export function accessConfigFromEnv(env = process.env): AccessConfig | null {
  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN?.trim().replace(/^https?:\/\//, "");
  const audience = env.CF_ACCESS_AUD?.trim();
  if (!teamDomain || !audience) return null;
  return { teamDomain, audience };
}

/** The areas Access guards. Everything else — `/kid` above all — is reachable without it. */
const GUARDED = ["/parent", "/admin", "/dev", "/api/admin"];

export function needsAccess(pathname: string): boolean {
  return GUARDED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Cached per team domain: `createRemoteJWKSet` re-fetches only when it meets an unknown key id. */
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwksFor(teamDomain: string) {
  let jwks = jwksCache.get(teamDomain);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
    jwksCache.set(teamDomain, jwks);
  }
  return jwks;
}

export interface AccessResult {
  ok: boolean;
  /** The email Access authenticated, when it succeeded — written to the log, never trusted as a role. */
  email?: string;
  reason?: string;
}

/**
 * Cloudflare sends the assertion as a header and, for browser navigation, also as a cookie. Both
 * are read: a PWA on an iPad navigating from the home screen carries the cookie.
 */
export function accessTokenFrom(req: {
  headers: { get(name: string): string | null };
  cookies?: { get(name: string): { value: string } | undefined };
}): string | null {
  const header = req.headers.get("cf-access-jwt-assertion");
  if (header) return header;
  const cookie = req.cookies?.get("CF_Authorization")?.value;
  return cookie ?? null;
}

export async function verifyAccess(token: string, config: AccessConfig): Promise<AccessResult> {
  try {
    const { payload } = await jwtVerify(token, jwksFor(config.teamDomain), {
      issuer: `https://${config.teamDomain}`,
      audience: config.audience,
    });
    return { ok: true, email: typeof payload.email === "string" ? payload.email : undefined };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "token không hợp lệ" };
  }
}

/**
 * What a blocked request is told. Deliberately terse and in Vietnamese: whoever sees this is
 * either the owner on a device that has not been through Access yet, or somebody who should not
 * be here. Neither needs detail.
 */
export const ACCESS_DENIED_HTML = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><title>Cần đăng nhập Cloudflare Access</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui,sans-serif;margin:0;display:grid;place-items:center;min-height:100dvh;
background:#f6f8fb;color:#1f2933}main{max-width:30rem;padding:2rem;text-align:center}
h1{font-size:1.25rem}p{line-height:1.6}code{background:#e4e9f0;padding:.1em .4em;border-radius:.25em}</style>
</head><body><main>
<h1>Khu vực này cần qua Cloudflare Access</h1>
<p>Trang của ba mẹ và trang quản trị được khoá thêm một lớp nữa. Hãy mở đúng địa chỉ công khai của
web (không phải địa chỉ trong nhà) và nhập mã một lần gửi về email.</p>
<p>Phần của con ở <code>/kid</code> vẫn vào bình thường.</p>
</main></body></html>`;
