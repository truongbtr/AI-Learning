import { describe, expect, it } from "vitest";
import { buildSchoolWeeks, parseIsoDate } from "./school-weeks";

describe("school weeks (docs/05 §5)", () => {
  const weeks = buildSchoolWeeks(parseIsoDate("2026-09-08"));

  it("builds 35 weeks, 18 in term 1", () => {
    expect(weeks).toHaveLength(35);
    expect(weeks.filter((w) => w.term === 1)).toHaveLength(18);
    expect(weeks.filter((w) => w.term === 2)).toHaveLength(17);
  });

  it("week 1 starts Tuesday 08/09/2026 and ends Sunday 13/09/2026", () => {
    expect(weeks[0]!.dateFrom.toISOString().slice(0, 10)).toBe("2026-09-08");
    expect(weeks[0]!.dateTo.toISOString().slice(0, 10)).toBe("2026-09-13");
  });

  it("later weeks run Monday -> Sunday without gaps", () => {
    for (let i = 1; i < weeks.length; i++) {
      const prev = weeks[i - 1]!;
      const cur = weeks[i]!;
      expect(cur.dateFrom.getTime() - prev.dateTo.getTime()).toBe(86_400_000);
      expect(cur.dateFrom.getUTCDay()).toBe(1);
      expect(cur.dateTo.getUTCDay()).toBe(0);
    }
  });

  it("rejects bad dates", () => {
    expect(() => parseIsoDate("2026/09/08")).toThrow();
  });
});
