import { prisma } from "@mtct/db";
import { ApiError, errorResponse } from "@/lib/api";

/**
 * The door Claude chat comes in through (docs/13 §7.1, §7.5).
 *
 * Three rules, and they are the whole security model of this branch:
 *
 *   1. **The token, and only the token.** No cookie, no Cloudflare Access assertion, no ADMIN
 *      session — a phone on mobile data cannot produce any of those, and accepting a session here
 *      would mean a browser tab left open on the kitchen iPad could write evidence.
 *   2. **A rate limit.** The owner sends a handful of photos an evening. Anything in the hundreds is
 *      either a loop or somebody else, and either way it should stop before it reaches the database.
 *   3. **Every call is written down**, refusals included, and shown on `/admin/inbox`. A door nobody
 *      can see through is a door nobody can close.
 *
 * What this branch may do is fixed by what it calls, not by a permission flag: write learning
 * evidence and a class diary. It never touches `User`, never reads `.env`, never deletes anything.
 */

export type InternalRoute =
  | "/api/internal/context"
  | "/api/internal/intake"
  | "/api/internal/intake/photo"
  | "/api/internal/diary";

/** `Authorization: Bearer <token>` — defined here so this file pulls in no session machinery. */
export function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

/** Requires `Authorization: Bearer $INTERNAL_API_TOKEN`. No session is ever accepted here. */
export function requireInternalToken(request: Request): void {
  const expected = process.env.INTERNAL_API_TOKEN?.trim();
  if (!expected)
    throw new ApiError(
      503,
      "Máy chủ chưa có INTERNAL_API_TOKEN — đặt trong .env rồi khởi động lại (docs/VAN-HANH.md §9)",
    );
  const presented = bearerToken(request);
  if (!presented || !timingSafeEqualString(presented, expected))
    throw new ApiError(401, "Cần Authorization: Bearer <INTERNAL_API_TOKEN>");
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Rate limit
// ─────────────────────────────────────────────────────────────────────────────────────────────────

export interface RateLimitRule {
  /** How many calls. */
  limit: number;
  /** Over how many milliseconds. */
  windowMs: number;
}

/**
 * An evening is maybe 10 photos and 3 readings. These ceilings are ten times that, which leaves the
 * owner unaware they exist and still stops a loop inside a minute.
 */
export const INTERNAL_RATE_LIMITS: Record<string, RateLimitRule> = {
  "/api/internal/context": { limit: 60, windowMs: 60_000 },
  "/api/internal/intake": { limit: 30, windowMs: 60_000 },
  "/api/internal/intake/photo": { limit: 60, windowMs: 60_000 },
  "/api/internal/diary": { limit: 20, windowMs: 60_000 },
};

interface Bucket {
  hits: number[];
}
const buckets = new Map<string, Bucket>();

export interface RateLimitVerdict {
  ok: boolean;
  remaining: number;
  /** Seconds until the window frees up, for `Retry-After`. */
  retryAfter: number;
}

/**
 * A sliding window in memory. One process serves this house (docs/02 §2), so a shared store would
 * be a dependency bought with nothing: a restart forgetting the last minute of counting is not a
 * risk worth a Redis.
 */
export function rateLimit(key: string, rule: RateLimitRule, now = Date.now()): RateLimitVerdict {
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((at) => now - at < rule.windowMs);
  if (bucket.hits.length >= rule.limit) {
    const oldest = bucket.hits[0] as number;
    buckets.set(key, bucket);
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((rule.windowMs - (now - oldest)) / 1000)),
    };
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, remaining: rule.limit - bucket.hits.length, retryAfter: 0 };
}

/** Tests only: forget every window. */
export function resetRateLimits(): void {
  buckets.clear();
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Logging
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** Cloudflare puts the real caller here; the socket address is the tunnel itself. */
export function callerIp(request: Request): string | null {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}

export interface InternalCallLog {
  route: InternalRoute;
  method: string;
  status: number;
  studentId?: string | null;
  batchId?: string | null;
  ip?: string | null;
  bytes?: number;
  ms?: number;
  /** One Vietnamese line for `/admin/inbox`: what was written, or why it was refused. */
  note?: string | null;
  error?: string | null;
}

/** Never throws: a log that can fail a request would be worse than no log. */
export async function logInternalCall(entry: InternalCallLog): Promise<void> {
  try {
    await prisma.internalApiCall.create({
      data: {
        route: entry.route,
        method: entry.method,
        status: entry.status,
        studentId: entry.studentId ?? null,
        batchId: entry.batchId ?? null,
        ip: entry.ip ?? null,
        bytes: entry.bytes ?? 0,
        ms: entry.ms ?? 0,
        note: entry.note?.slice(0, 400) ?? null,
        error: entry.error?.slice(0, 400) ?? null,
      },
    });
  } catch (err) {
    console.error("[internal] không ghi được log lời gọi", err);
  }
}

/**
 * Wraps one internal handler: token, rate limit, the log, and a JSON error for anything thrown.
 *
 * The handler returns the response plus the one line the log should carry, because only the handler
 * knows what actually happened — "đã ghi 12 câu của Thy" is worth a hundred rows of status codes.
 */
export function internalHandler(
  route: InternalRoute,
  fn: (request: Request) => Promise<{
    response: Response;
    note?: string;
    studentId?: string | null;
    batchId?: string | null;
  }>,
) {
  return async (request: Request): Promise<Response> => {
    const started = Date.now();
    const ip = callerIp(request);
    const bytes = Number(request.headers.get("content-length") ?? 0);
    const base = { route, method: request.method, ip, bytes };
    try {
      requireInternalToken(request);
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 401;
      const message = err instanceof Error ? err.message : "Không xác thực được";
      await logInternalCall({ ...base, status, ms: Date.now() - started, error: message });
      return errorResponse(status, message);
    }

    const rule = INTERNAL_RATE_LIMITS[route] ?? { limit: 60, windowMs: 60_000 };
    const verdict = rateLimit(`${route}:${ip ?? "local"}`, rule);
    if (!verdict.ok) {
      await logInternalCall({
        ...base,
        status: 429,
        ms: Date.now() - started,
        error: `quá ${rule.limit} lời gọi / ${Math.round(rule.windowMs / 1000)} giây`,
      });
      return errorResponse(429, `Gọi nhiều quá, thử lại sau ${verdict.retryAfter} giây`, {
        retryAfter: verdict.retryAfter,
      });
    }

    try {
      const out = await fn(request);
      await logInternalCall({
        ...base,
        status: out.response.status,
        ms: Date.now() - started,
        studentId: out.studentId ?? null,
        batchId: out.batchId ?? null,
        note: out.note ?? null,
      });
      return out.response;
    } catch (err) {
      if (err instanceof ApiError) {
        await logInternalCall({
          ...base,
          status: err.status,
          ms: Date.now() - started,
          error: err.message,
        });
        return errorResponse(err.status, err.message, err.details);
      }
      console.error("[internal]", err);
      const message = err instanceof Error ? err.message : "Lỗi máy chủ";
      await logInternalCall({ ...base, status: 500, ms: Date.now() - started, error: message });
      return errorResponse(500, "Lỗi máy chủ");
    }
  };
}
