import { describe, expect, it } from "vitest";
import { nextStation, planStations, type StationInputItem, stationCount } from "./stations";

const items = (codes: string[], done: number[] = []): StationInputItem[] =>
  codes.map((skillCode, i) => ({ order: i + 1, skillCode, done: done.includes(i + 1) }));

describe("stations", () => {
  it("twelve exercises make four stations of three", () => {
    const plan = planStations(items(["a", "a", "a", "b", "b", "c", "c", "d", "e", "f", "g", "h"]));
    expect(plan.stations).toHaveLength(4);
    expect(plan.stations.map((s) => s.orders.length)).toEqual([3, 3, 3, 3]);
    // every exercise is in exactly one station
    expect(plan.stations.flatMap((s) => s.orders).sort((x, y) => x - y)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1),
    );
    expect(plan.stations[0]?.skillCode).toBe("a");
  });

  it("three or four stars for a full city session, fewer only for short ones", () => {
    expect(stationCount(12)).toBe(4);
    expect(stationCount(10)).toBe(3);
    expect(stationCount(9)).toBe(3);
    expect(stationCount(5)).toBe(2);
    expect(stationCount(1)).toBe(1);
    expect(stationCount(0)).toBe(0);
  });

  it("one skill for twelve exercises still gives four stations on that building", () => {
    const plan = planStations(items(Array(12).fill("a")));
    expect(plan.stations).toHaveLength(4);
    expect(new Set(plan.stations.map((s) => s.skillCode))).toEqual(new Set(["a"]));
    expect(plan.stations.every((s) => s.orders.length === 3)).toBe(true);
  });

  it("homework goes to the town hall, missing exercises to nobody", () => {
    const list: StationInputItem[] = [
      { order: 1, skillCode: "", homework: true, done: false },
      { order: 2, skillCode: "a", done: false },
      { order: 3, skillCode: "a", done: false, missing: true },
      { order: 4, skillCode: "b", done: false },
      { order: 5, skillCode: "b", done: false },
    ];
    const plan = planStations(list);
    expect(plan.homework).toEqual([1]);
    expect(plan.stations.flatMap((s) => s.orders)).not.toContain(3);
    expect(plan.stations.flatMap((s) => s.orders)).not.toContain(1);
  });

  it("a station is done only when all its exercises are; the next one is the first left", () => {
    const plan = planStations(items(["a", "a", "a", "b", "b", "b"], [1, 2, 3, 4]));
    expect(plan.stations.map((s) => s.done)).toEqual([true, false]);
    expect(nextStation(plan)?.skillCode).toBe("b");
    expect(nextStation(planStations(items(["a"], [1])))).toBeNull();
  });

  it("is stable: the same session always gives the same stations", () => {
    const codes = ["c", "a", "b", "a", "c", "d", "e", "a", "b", "f", "c", "g"];
    expect(planStations(items(codes))).toEqual(planStations(items(codes)));
  });
});
