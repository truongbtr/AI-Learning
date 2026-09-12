import { describe, expect, it } from "vitest";
import { AZURE_F0_MONTHLY_CHARS, summariseTtsUsage, type TtsUsage, usageMonth } from "./tts-usage";

/**
 * The only paid service left in the running system (ADR-9, ADR-10 took the LLM calls out). The
 * owner replaced the "AI ≤ 6 USD/month" target of docs/08 with "stay inside the free Azure tier",
 * so what this has to get right is the boundary of that tier and which side of it we are on.
 */
describe("what the cloud voice has cost this month (docs/08 pha 8, tiêu chí 5)", () => {
  const at = new Date("2026-09-12T21:00:00+07:00");

  it("counts the month in Vietnam time, not UTC", () => {
    // 30/09 at 23:00 at home is still September; in UTC it is already the 30th at 16:00, and on
    // 01/10 at 00:30 at home UTC still says September. The bill runs on the family's calendar.
    expect(usageMonth(new Date("2026-09-30T23:00:00+07:00"))).toBe("2026-09");
    expect(usageMonth(new Date("2026-10-01T00:30:00+07:00"))).toBe("2026-10");
  });

  it("reports zero for a month nothing was spoken in", () => {
    const s = summariseTtsUsage({}, at);
    expect(s.chars).toBe(0);
    expect(s.level).toBe("ok");
    expect(s.limit).toBe(AZURE_F0_MONTHLY_CHARS);
  });

  it("warns at 80% and only calls it over past the free tier", () => {
    const usage = (chars: number): TtsUsage => ({
      "2026-09": { chars, calls: 1, provider: "azure" },
    });
    expect(summariseTtsUsage(usage(399_999), at).level).toBe("ok");
    expect(summariseTtsUsage(usage(400_000), at).level).toBe("warn");
    expect(summariseTtsUsage(usage(499_999), at).level).toBe("warn");
    expect(summariseTtsUsage(usage(500_000), at).level).toBe("over");
  });

  it("shows the last six months, newest first", () => {
    const usage: TtsUsage = {};
    for (const m of ["04", "05", "06", "07", "08", "09", "10"])
      usage[`2026-${m}`] = { chars: Number(m) * 1000, calls: 1, provider: "azure" };
    const s = summariseTtsUsage(usage, at);
    expect(s.months).toHaveLength(6);
    expect(s.months[0]?.month).toBe("2026-10");
    expect(s.months.at(-1)?.month).toBe("2026-05");
  });

  it("ignores other months when reporting this one", () => {
    const s = summariseTtsUsage(
      {
        "2026-08": { chars: 490_000, calls: 900, provider: "azure" },
        "2026-09": { chars: 1_200, calls: 3, provider: "azure" },
      },
      at,
    );
    expect(s.chars).toBe(1_200);
    expect(s.level).toBe("ok");
  });
});
