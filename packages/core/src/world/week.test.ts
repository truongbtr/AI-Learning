import { describe, expect, it } from "vitest";
import {
  EGG_DAYS_TO_HATCH,
  PICTURE_PIECES,
  PICTURE_THEMES,
  pictureByNumber,
  pictureForWeek,
  WEEKLY_EVENTS,
  weekIndex,
  weeklyEvent,
  weekStartOf,
} from "./week";

describe("the week the world is wearing", () => {
  it("starts the week on Monday", () => {
    expect(weekStartOf(new Date("2026-09-13T22:00:00")).getDay()).toBe(1); // a Sunday
    expect(weekStartOf(new Date("2026-09-07T06:00:00")).getDate()).toBe(7);
  });

  it("rotates the event and the picture every week", () => {
    const first = weeklyEvent(new Date("2026-09-09T12:00:00"));
    const second = weeklyEvent(new Date("2026-09-16T12:00:00"));
    expect(first.code).not.toBe(second.code);
    expect(WEEKLY_EVENTS.map((e) => e.code)).toContain(first.code);
  });

  // A session finished before the epoch week (a back-dated import, a clock that is behind) used to
  // index the rotation with a negative number and hand back `undefined`.
  it("still has an event and a picture for dates before the first school week", () => {
    const beforeTheEpoch = new Date("2026-08-20T12:00:00");
    expect(weekIndex(beforeTheEpoch)).toBeLessThan(0);
    expect(weeklyEvent(beforeTheEpoch)?.code).toBeTruthy();
    expect(pictureForWeek(beforeTheEpoch)?.imageKey).toBeTruthy();
  });

  it("numbers pictures from the child's first one", () => {
    expect(pictureByNumber(0)).toEqual(PICTURE_THEMES[0]);
    expect(pictureByNumber(PICTURE_THEMES.length)).toEqual(PICTURE_THEMES[0]);
    expect(pictureByNumber(-1)).toEqual(PICTURE_THEMES[PICTURE_THEMES.length - 1]);
  });

  it("keeps the numbers ADR-16 chose", () => {
    expect(EGG_DAYS_TO_HATCH).toBe(4);
    expect(PICTURE_PIECES).toBe(6);
  });
});
