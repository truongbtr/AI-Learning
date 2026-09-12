import { afterAll, describe, expect, it } from "vitest";
import { dayKey, vnDayDate } from "./update";

/**
 * The guard for the bug ADR-18 records at the end: `Session.date`, `Streak.lastActiveDate` and
 * `EggProgress.startedOn` are `@db.Date` columns that were being written with **local** midnight.
 * Prisma serialises a `Date` through UTC, so at UTC+7 every evening session was filed under the
 * day before — and nobody saw it, because the read did the same wrong conversion back.
 *
 * It only shows up when the machine's zone differs from the family's. So both zones are exercised
 * here, in one run: Node re-reads `process.env.TZ` on every `Date` operation, so setting it is
 * enough to make `new Date(...)` behave as it would on a server in London.
 *
 * 21:00 Vietnam is the hour that matters — that is when the children actually sit down, and it is
 * 14:00 UTC, i.e. the same instant lands on two different calendar days depending on who is asked.
 */

const ORIGINAL_TZ = process.env.TZ;
afterAll(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = ORIGINAL_TZ;
});

/** 21:00 on Friday 11/09/2026 at home. */
const NINE_PM_VN = new Date("2026-09-11T21:00:00+07:00");
/** 00:30 on Saturday 12/09 at home — past midnight, still the same UTC day. */
const HALF_PAST_MIDNIGHT_VN = new Date("2026-09-12T00:30:00+07:00");

for (const tz of ["UTC", "Asia/Ho_Chi_Minh"] as const) {
  describe(`the calendar day of a session, on a machine running in ${tz}`, () => {
    const inZone = <T>(fn: () => T): T => {
      process.env.TZ = tz;
      try {
        return fn();
      } finally {
        process.env.TZ = ORIGINAL_TZ ?? "UTC";
      }
    };

    it("files 21:00 Vietnam under that same day", () => {
      expect(inZone(() => dayKey(NINE_PM_VN))).toBe("2026-09-11");
      expect(inZone(() => vnDayDate(NINE_PM_VN).toISOString())).toBe("2026-09-11T00:00:00.000Z");
    });

    it("files 00:30 Vietnam under the new day, not the one that just ended", () => {
      expect(inZone(() => dayKey(HALF_PAST_MIDNIGHT_VN))).toBe("2026-09-12");
      expect(inZone(() => vnDayDate(HALF_PAST_MIDNIGHT_VN).toISOString())).toBe(
        "2026-09-12T00:00:00.000Z",
      );
    });

    it("stores a value Postgres reads back as the Vietnam day, not local midnight", () => {
      // What a `@db.Date` column receives: Prisma takes the UTC parts. Local midnight would have
      // given 2026-09-11T17:00:00Z under UTC+7 — the 11th, for a session on the 11th, by luck;
      // and under UTC it would have given the 11th for the 00:30 case, which is the actual bug.
      const stored = inZone(() => vnDayDate(HALF_PAST_MIDNIGHT_VN));
      expect(stored.getUTCHours()).toBe(0);
      expect(stored.toISOString().slice(0, 10)).toBe("2026-09-12");
    });
  });
}

describe("the two zones agree", () => {
  const dayIn = (tz: string, at: Date) => {
    process.env.TZ = tz;
    const out = { key: dayKey(at), date: vnDayDate(at).toISOString() };
    process.env.TZ = ORIGINAL_TZ ?? "UTC";
    return out;
  };

  it.each([
    ["21:00", NINE_PM_VN],
    ["00:30", HALF_PAST_MIDNIGHT_VN],
    ["07:00", new Date("2026-09-11T07:00:00+07:00")],
    ["23:59", new Date("2026-09-11T23:59:00+07:00")],
  ])("gives the same day for %s whatever zone the server runs in", (_label, at) => {
    expect(dayIn("UTC", at)).toEqual(dayIn("Asia/Ho_Chi_Minh", at));
  });

  it("would have failed on the old implementation", () => {
    // The code this replaced, kept as the negative control: a session at 21:00 on the 11th came
    // out as the 10th once Prisma serialised it through UTC.
    const localMidnight = (at: Date) => {
      const d = new Date(at);
      d.setHours(0, 0, 0, 0);
      return d;
    };
    process.env.TZ = "Asia/Ho_Chi_Minh";
    const old = localMidnight(NINE_PM_VN).toISOString().slice(0, 10);
    process.env.TZ = ORIGINAL_TZ ?? "UTC";
    expect(old).toBe("2026-09-10");
    expect(vnDayDate(NINE_PM_VN).toISOString().slice(0, 10)).toBe("2026-09-11");
  });
});
