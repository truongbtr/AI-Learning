import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contentDir } from "./paths";
import { flattenTimetable, parseTimetable } from "./timetable";

describe("content/timetable/1B3-2026.json (docs/05 §2)", () => {
  const file = parseTimetable(
    JSON.parse(readFileSync(contentDir("timetable", "1B3-2026.json"), "utf8")),
  );

  it("has 30 unique slots with period times", () => {
    const rows = flattenTimetable(file);
    expect(rows).toHaveLength(30);
    expect(rows.every((r) => /^\d{2}:\d{2}$/.test(r.timeFrom))).toBe(true);
  });

  it("matches a few known cells", () => {
    const rows = flattenTimetable(file);
    const find = (weekday: number, period: string) =>
      rows.find((r) => r.weekday === weekday && r.period === period)!;
    expect(find(2, "1-2").subject).toBe("VMATH");
    expect(find(2, "9-10").subject).toBe("ESCI");
    expect(find(5, "3-4").subject).toBe("EMATH");
    expect(find(1, "7-8").isNative).toBe(true);
    expect(find(1, "DATN").timeFrom).toBe("14:05");
  });

  it("rejects duplicates", () => {
    const broken = { ...file, slots: [...file.slots, file.slots[0]] };
    expect(() => parseTimetable(broken)).toThrow(/Duplicate|Expected 30/);
  });
});
