import { describe, expect, it } from "vitest";
import {
  blocksNeeded,
  LOCKED_PLOTS_SHOWN,
  layoutCity,
  MIN_BLOCKS,
  roadTile,
  slotRoles,
  spiralBlocks,
  TILE,
  WONDER_BLOCK,
} from "./layout";

const idOf = (skill: number, layout: ReturnType<typeof layoutCity>) =>
  layout.lots.find((l) => l.content.type === "skill" && l.content.skill === skill)?.id;

describe("spiralBlocks", () => {
  it("never returns the centre or the wonder block and has no duplicates", () => {
    const blocks = spiralBlocks(80);
    const keys = blocks.map((b) => `${b.bx},${b.bz}`);
    expect(new Set(keys).size).toBe(80);
    expect(keys).not.toContain("0,0");
    expect(keys).not.toContain(`${WONDER_BLOCK.bx},${WONDER_BLOCK.bz}`);
  });

  it("is a prefix-stable sequence", () => {
    expect(spiralBlocks(10)).toEqual(spiralBlocks(30).slice(0, 10));
  });
});

describe("layoutCity", () => {
  it("builds a small town on day one", () => {
    const layout = layoutCity({ skills: 0, publics: 0, plotsOwned: 0 });
    expect(layout.blocks.filter((b) => b.kind === "lots")).toHaveLength(MIN_BLOCKS);
    expect(layout.lots.some((l) => l.content.type === "decorHouse")).toBe(true);
    const locked = layout.lots.filter(
      (l) => l.content.type === "plot" && l.content.state === "locked",
    );
    expect(locked).toHaveLength(LOCKED_PLOTS_SHOWN);
  });

  it("gives every skill its own lot, even for the largest subject (102 skills)", () => {
    const layout = layoutCity({ skills: 102, publics: 14, plotsOwned: 40 });
    const skillLots = layout.lots.filter((l) => l.content.type === "skill");
    expect(skillLots).toHaveLength(102);
    expect(layout.lots.filter((l) => l.content.type === "public")).toHaveLength(14);
    expect(
      layout.lots.filter((l) => l.content.type === "plot" && l.content.state === "owned"),
    ).toHaveLength(40);
  });

  it("never moves an existing building when skills, badges or plots are added", () => {
    const before = layoutCity({ skills: 20, publics: 2, plotsOwned: 3 });
    const after = layoutCity({ skills: 60, publics: 9, plotsOwned: 15 });
    for (let s = 0; s < 20; s++) expect(idOf(s, after)).toBe(idOf(s, before));
    const pub = (l: ReturnType<typeof layoutCity>, i: number) =>
      l.lots.find((x) => x.content.type === "public" && x.content.publicIndex === i)?.id;
    for (let i = 0; i < 2; i++) expect(pub(after, i)).toBe(pub(before, i));
    const plot = (l: ReturnType<typeof layoutCity>, i: number) =>
      l.lots.find((x) => x.content.type === "plot" && x.content.plot === i)?.id;
    for (let i = 0; i < 3; i++) expect(plot(after, i)).toBe(plot(before, i));
  });

  it("puts no two lots on top of each other", () => {
    const layout = layoutCity({ skills: 102, publics: 14, plotsOwned: 20 });
    const rects = layout.lots.map((l) => [
      l.x - l.width / 2,
      l.x + l.width / 2,
      l.z - l.depth / 2,
      l.z + l.depth / 2,
    ]);
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i] as number[];
        const b = rects[j] as number[];
        const overlap =
          Math.min(a[1] as number, b[1] as number) - Math.max(a[0] as number, b[0] as number) >
            0.01 &&
          Math.min(a[3] as number, b[3] as number) - Math.max(a[2] as number, b[2] as number) >
            0.01;
        expect(overlap).toBe(false);
      }
    }
  });

  it("keeps every lot off the roads", () => {
    const layout = layoutCity({ skills: 40, publics: 5, plotsOwned: 4 });
    for (const lot of layout.lots) {
      for (const key of layout.roads) {
        const [tx, tz] = key.split(",").map(Number) as [number, number];
        const rx = (tx - 3) * TILE;
        const rz = (tz - 3) * TILE;
        const inside = Math.abs(rx - lot.x) < lot.width / 2 && Math.abs(rz - lot.z) < lot.depth / 2;
        expect(inside).toBe(false);
      }
    }
  });

  it("grows only as needed", () => {
    expect(blocksNeeded({ skills: 17, publics: 0, plotsOwned: 0 })).toBeGreaterThanOrEqual(
      MIN_BLOCKS,
    );
    // the largest subject still fits inside the third ring (7×7 blocks minus centre and wonder)
    expect(blocksNeeded({ skills: 102, publics: 14, plotsOwned: 0 })).toBeLessThanOrEqual(47);
  });

  it("assigns slot roles from the block index alone", () => {
    expect(slotRoles(0)).toEqual({ 0: "skill", 1: "skill", 2: "skill", 3: "skill" });
    expect(slotRoles(1)).toEqual({ 0: "public", 1: "public", 2: "skill", 3: "plot" });
  });
});

describe("roadTile", () => {
  it("picks straight, T, cross and end tiles from neighbours", () => {
    const roads = new Set(["0,0", "1,0", "2,0", "1,1", "1,-1", "3,5", "4,5", "4,6"]);
    expect(roadTile(roads, 1, 0).key).toBe("road-crossroad");
    expect(roadTile(roads, 0, 0)).toEqual({ key: "road-end", rot: 0 });
    expect(roadTile(new Set(["0,0", "1,0", "2,0"]), 1, 0)).toEqual({
      key: "road-straight",
      rot: 0,
    });
    expect(roadTile(new Set(["0,0", "0,1", "0,2"]), 0, 1)).toEqual({
      key: "road-straight",
      rot: Math.PI / 2,
    });
    expect(roadTile(new Set(["0,0", "1,0", "2,0", "1,1"]), 1, 0)).toEqual({
      key: "road-intersection",
      rot: 0,
    });
  });
});
