import { timingSafeEqual } from "node:crypto";
import { ApiError } from "@/lib/api";
import { requireRole } from "@/lib/auth/session";

/**
 * Internal-only endpoints (docs/08 pha 1 việc 3): the caller is either an ADMIN session or the
 * worker presenting `Authorization: Bearer $INTERNAL_API_TOKEN`. CHILD and PARENT are always
 * refused. The token is optional — with no token in `.env` only ADMIN can call, and nothing in
 * the app stops working (NFR-09: the system runs without any API key).
 */
export type InternalCaller = { kind: "admin"; userId: string } | { kind: "worker" };

function tokenMatches(presented: string, expected: string): boolean {
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function requireInternalCaller(request: Request): Promise<InternalCaller> {
  const expected = process.env.INTERNAL_API_TOKEN?.trim();
  const presented = bearerToken(request);
  if (expected && presented && tokenMatches(presented, expected)) return { kind: "worker" };
  if (presented && !expected) {
    throw new ApiError(401, "Máy chủ chưa cấu hình INTERNAL_API_TOKEN");
  }
  const user = await requireRole("ADMIN"); // 401 when signed out, 403 for PARENT/CHILD
  return { kind: "admin", userId: user.id };
}
