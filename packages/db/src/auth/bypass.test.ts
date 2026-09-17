import { describe, expect, it } from "vitest";
import { type AuthBypassRow, bypassStatus, bypassUntil, MAX_HOURS } from "./bypass";

/** The two decisions that keep the front door from being left open: expiry, and clamped hours. */
const row = (patch: Partial<AuthBypassRow>): AuthBypassRow => ({
  enabled: true,
  userId: "u1",
  until: "2026-09-18T20:00:00.000Z",
  note: "",
  setBy: null,
  setAt: "2026-09-18T12:00:00.000Z",
  ...patch,
});

describe("tắt đăng nhập", () => {
  const now = new Date("2026-09-18T13:00:00.000Z");

  it("is closed when there is no row or the switch is off", () => {
    expect(bypassStatus(null, now).open).toBe(false);
    expect(bypassStatus(row({ enabled: false }), now)).toMatchObject({
      open: false,
      reason: "off",
    });
  });

  it("is open only until the expiry it was given", () => {
    expect(bypassStatus(row({}), now)).toMatchObject({ open: true, reason: "open" });
    const later = new Date("2026-09-18T20:00:01.000Z");
    expect(bypassStatus(row({}), later)).toMatchObject({ open: false, reason: "expired" });
  });

  it("treats an unreadable expiry as closed", () => {
    expect(bypassStatus(row({ until: "hôm nào đó" }), now)).toMatchObject({
      open: false,
      reason: "expired",
    });
  });

  it("never grants more than a week, nor less than a quarter hour", () => {
    expect(bypassUntil(24 * 30, now).getTime()).toBe(now.getTime() + MAX_HOURS * 3_600_000);
    expect(bypassUntil(0, now).getTime()).toBe(now.getTime() + 900_000);
    expect(bypassUntil(undefined, now).getTime()).toBe(now.getTime() + 8 * 3_600_000);
  });
});
