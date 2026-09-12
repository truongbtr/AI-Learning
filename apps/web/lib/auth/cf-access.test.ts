import { describe, expect, it } from "vitest";
import { accessConfigFromEnv, needsAccess } from "./cf-access";

describe("which areas Cloudflare Access guards (docs/08 pha 8 việc 1)", () => {
  it("guards the two adult areas", () => {
    for (const path of [
      "/parent",
      "/parent/",
      "/parent/abc/skills",
      "/admin",
      "/admin/users",
      "/api/admin/users",
      "/dev/kit",
    ])
      expect(needsAccess(path), path).toBe(true);
  });

  /**
   * The one that matters most. A six-year-old cannot read an email for a one-time code, so putting
   * Access in front of `/kid` would mean a parent sitting down every evening — the exact thing the
   * project exists to avoid. If this test ever goes red, the children are locked out of their own
   * app and nobody will find out until 19:30 on a school night.
   */
  it("never guards the child's area, its API, the login page or the health check", () => {
    for (const path of [
      "/kid",
      "/kid/home",
      "/kid/quest/3",
      "/api/kid/home",
      "/api/sessions",
      "/api/tts",
      "/api/files/abc",
      "/login",
      "/change-password",
      "/api/health",
      "/",
    ])
      expect(needsAccess(path), path).toBe(false);
  });

  it("is not fooled by a path that merely starts with the same letters", () => {
    expect(needsAccess("/parenting")).toBe(false);
    expect(needsAccess("/administrator")).toBe(false);
    expect(needsAccess("/developer")).toBe(false);
  });

  it("stays off until both settings are present", () => {
    expect(accessConfigFromEnv({} as NodeJS.ProcessEnv)).toBeNull();
    expect(accessConfigFromEnv({ CF_ACCESS_TEAM_DOMAIN: "x.cloudflareaccess.com" } as never)).toBe(
      null,
    );
    expect(accessConfigFromEnv({ CF_ACCESS_AUD: "abc" } as never)).toBeNull();
    expect(
      accessConfigFromEnv({ CF_ACCESS_TEAM_DOMAIN: " ", CF_ACCESS_AUD: "abc" } as never),
    ).toBeNull();
  });

  it("accepts the team domain however it was pasted", () => {
    const expected = { teamDomain: "giadinh.cloudflareaccess.com", audience: "abc123" };
    for (const value of [
      "giadinh.cloudflareaccess.com",
      "https://giadinh.cloudflareaccess.com",
      "  https://giadinh.cloudflareaccess.com  ",
    ])
      expect(
        accessConfigFromEnv({ CF_ACCESS_TEAM_DOMAIN: value, CF_ACCESS_AUD: "abc123" } as never),
      ).toEqual(expected);
  });
});
