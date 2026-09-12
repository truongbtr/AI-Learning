import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api";
import {
  callerIp,
  INTERNAL_RATE_LIMITS,
  rateLimit,
  requireInternalToken,
  resetRateLimits,
} from "./guard";

/**
 * The lock on the chat door (docs/13 §7.1). A test rather than a comment because the failure mode
 * is silent: a branch that accepted a browser session, or forgot the token when `.env` was empty,
 * would look exactly like a working one from the outside.
 */

const TOKEN = "x".repeat(43);

function request(headers: Record<string, string> = {}): Request {
  return new Request("https://edu.medifa.vn/api/internal/context?student=thy", { headers });
}

describe("requireInternalToken", () => {
  const saved = process.env.INTERNAL_API_TOKEN;
  beforeEach(() => {
    process.env.INTERNAL_API_TOKEN = TOKEN;
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.INTERNAL_API_TOKEN;
    else process.env.INTERNAL_API_TOKEN = saved;
  });

  it("accepts the token from .env", () => {
    expect(() => requireInternalToken(request({ authorization: `Bearer ${TOKEN}` }))).not.toThrow();
  });

  it("refuses with 401 when no token is presented", () => {
    try {
      requireInternalToken(request());
      throw new Error("should have refused");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(401);
    }
  });

  it("refuses a wrong token, and one of the wrong length", () => {
    for (const value of [`Bearer ${"y".repeat(43)}`, "Bearer short", `Basic ${TOKEN}`]) {
      expect(() => requireInternalToken(request({ authorization: value }))).toThrow(ApiError);
    }
  });

  it("answers 503, not 401, when the server has no token configured at all", () => {
    delete process.env.INTERNAL_API_TOKEN;
    try {
      requireInternalToken(request({ authorization: `Bearer ${TOKEN}` }));
      throw new Error("should have refused");
    } catch (err) {
      // A 401 here would send the owner hunting for a typo on the phone instead of in .env.
      expect((err as ApiError).status).toBe(503);
    }
  });
});

describe("rateLimit", () => {
  beforeEach(resetRateLimits);

  it("lets an evening's worth through and then stops", () => {
    const rule = { limit: 3, windowMs: 60_000 };
    expect(rateLimit("k", rule, 1000).ok).toBe(true);
    expect(rateLimit("k", rule, 1100).ok).toBe(true);
    expect(rateLimit("k", rule, 1200).ok).toBe(true);
    const blocked = rateLimit("k", rule, 1300);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("frees up once the window has slid past", () => {
    const rule = { limit: 2, windowMs: 1000 };
    rateLimit("k", rule, 0);
    rateLimit("k", rule, 100);
    expect(rateLimit("k", rule, 500).ok).toBe(false);
    expect(rateLimit("k", rule, 1200).ok).toBe(true);
  });

  it("counts each caller separately", () => {
    const rule = { limit: 1, windowMs: 60_000 };
    expect(rateLimit("a", rule, 0).ok).toBe(true);
    expect(rateLimit("b", rule, 0).ok).toBe(true);
    expect(rateLimit("a", rule, 1).ok).toBe(false);
  });

  it("every internal route has a ceiling", () => {
    for (const route of [
      "/api/internal/context",
      "/api/internal/intake",
      "/api/internal/intake/photo",
      "/api/internal/diary",
    ]) {
      expect(INTERNAL_RATE_LIMITS[route]?.limit).toBeGreaterThan(0);
    }
  });
});

describe("callerIp", () => {
  it("prefers the address Cloudflare puts on the request", () => {
    expect(callerIp(request({ "cf-connecting-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" }))).toBe(
      "1.2.3.4",
    );
    expect(callerIp(request({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" }))).toBe("9.9.9.9");
    expect(callerIp(request())).toBeNull();
  });
});
