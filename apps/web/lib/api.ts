import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { z } from "zod";

/** Thrown by auth/authz helpers; converted to a JSON response by `handle()`. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorResponse(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status });
}

/** Wraps a route handler: ApiError → status, ZodError → 400, anything else → 500 (logged). */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) return errorResponse(err.status, err.message, err.details);
      if (err instanceof z.ZodError)
        return errorResponse(400, "Dữ liệu không hợp lệ", z.treeifyError(err));
      console.error("[api]", err);
      return errorResponse(500, "Lỗi máy chủ");
    }
  };
}

/** Parses a JSON body with a Zod schema; invalid JSON → 400. */
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, "Body phải là JSON");
  }
  return schema.parse(raw);
}
