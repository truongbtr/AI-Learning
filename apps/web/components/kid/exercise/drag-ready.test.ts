import { describe, expect, it } from "vitest";
import { dragReady } from "./drag-ready";

describe('"Xong!" in a drag exercise', () => {
  const items = ["k1", "k2", "d1"];

  it("stays dim while a basket that wants two cards holds one", () => {
    const zones = [{ id: "gio", expect: 2 }];
    expect(dragReady(zones, items, { k1: "gio" })).toBe(false);
    expect(dragReady(zones, items, { k1: "gio", k2: "gio" })).toBe(true);
  });

  it("lights up with the distractor still in the tray", () => {
    // "Kéo chữ ch vào giỏ": kh and tr stay behind, and the child is finished
    expect(dragReady([{ id: "gio", expect: 1 }], items, { k1: "gio" })).toBe(true);
  });

  it("lights up once the tray is empty, wherever the cards went", () => {
    expect(
      dragReady(
        [
          { id: "a", expect: 2 },
          { id: "b", expect: 1 },
        ],
        items,
        {
          k1: "a",
          k2: "a",
          d1: "a",
        },
      ),
    ).toBe(true);
  });

  it("wants every basket filled, not just one of them", () => {
    const zones = [
      { id: "a", expect: 1 },
      { id: "b", expect: 1 },
    ];
    expect(dragReady(zones, items, { k1: "a" })).toBe(false);
    expect(dragReady(zones, items, { k1: "a", k2: "b" })).toBe(true);
  });

  it("falls back to one card per basket for a spec from before pha 11", () => {
    expect(dragReady([{ id: "gio" }], items, { k1: "gio" })).toBe(true);
  });
});
