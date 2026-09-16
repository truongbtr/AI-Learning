import { describe, expect, it } from "vitest";
import {
  beltRadius,
  buildRoads,
  cellAt,
  cellRole,
  cellsNeeded,
  cellsOnRing,
  districtName,
  indexOfCell,
  LAKE_RADIUS,
  LOCKED_PLOTS_SHOWN,
  layoutCity,
  MIN_CELLS,
  RING_PITCH,
} from "./layout";
import { CITY_IDS } from "./palette";
import { cityWaterways, inLake, inRiver, waterways } from "./waterways";

// The belt suite runs on an invented city: "viet" is the children's own town now and is laid out
// from its plan instead (ADR-23), so it has its own tests further down.
const needs = (skills: number, publics: number, plotsOwned: number, seed = "vmath") => ({
  skills,
  publics,
  plotsOwned,
  seed,
});
const idOf = (skill: number, layout: ReturnType<typeof layoutCity>) =>
  layout.lots.find((l) => l.content.type === "skill" && l.content.skill === skill)?.id;

type Lot = ReturnType<typeof layoutCity>["lots"][number];

/** Is (x, z) inside this lot's rectangle? The rectangle is turned to face the belt. */
function inside(lot: Lot, x: number, z: number): boolean {
  const c = Math.cos(lot.cell.angle);
  const s = Math.sin(lot.cell.angle);
  const dx = x - lot.x;
  const dz = z - lot.z;
  const along = Math.abs(-s * dx + c * dz); // tangential: the lot's width
  const across = Math.abs(c * dx + s * dz); // radial: the lot's depth
  return along < lot.width / 2 && across < lot.depth / 2;
}

/** Separating-axis test between two turned rectangles. */
function overlaps(a: Lot, b: Lot): boolean {
  const axesOf = (lot: Lot) => {
    const c = Math.cos(lot.cell.angle);
    const s = Math.sin(lot.cell.angle);
    return [
      { axis: [c, s] as [number, number], half: lot.depth / 2 },
      { axis: [-s, c] as [number, number], half: lot.width / 2 },
    ];
  };
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  for (const { axis } of [...axesOf(a), ...axesOf(b)]) {
    const project = (lot: Lot) =>
      axesOf(lot).reduce(
        (sum, e) => sum + e.half * Math.abs(e.axis[0] * axis[0] + e.axis[1] * axis[1]),
        0,
      );
    const gap = Math.abs(dx * axis[0] + dz * axis[1]) - project(a) - project(b);
    if (gap > -0.01) return false;
  }
  return true;
}

describe("the belts and their cells (pha 12 việc 1)", () => {
  it("counts cells ring by ring, and can go back from an index to its cell", () => {
    // a belt twice as long holds twice as many houses: the cells are the same width all the way out
    const first = cellsOnRing(1);
    expect(first).toBeGreaterThanOrEqual(12);
    expect(cellsOnRing(3)).toBeGreaterThan(first);
    expect(cellAt(0)).toEqual({ ring: 1, slot: 0 });
    expect(cellAt(first - 1)).toEqual({ ring: 1, slot: first - 1 });
    expect(cellAt(first)).toEqual({ ring: 2, slot: 0 });
    for (const k of [0, 5, 14, 33, 60, 130]) {
      const { ring, slot } = cellAt(k);
      expect(indexOfCell(ring, slot)).toBe(k);
    }
  });

  it("wobbles the belts so no city is a set of perfect circles", () => {
    const angles = Array.from({ length: 24 }, (_, i) => (i / 24) * Math.PI * 2);
    const radii = angles.map((a) => beltRadius("vmath", 2, a));
    const spread = Math.max(...radii) - Math.min(...radii);
    expect(spread).toBeGreaterThan(2);
    expect(spread).toBeLessThan(RING_PITCH * 0.55); // still a belt, not a blob
    // and every city wobbles differently
    expect(radii).not.toEqual(angles.map((a) => beltRadius("esl", 2, a)));
  });

  it("gives a role to a cell from its index alone", () => {
    for (const seed of CITY_IDS) {
      for (const k of [0, 1, 5, 17, 42, 99]) {
        expect(cellRole(seed, k)).toBe(cellRole(seed, k));
      }
    }
  });

  it("builds a small town on day one, with the lake already there", () => {
    const layout = layoutCity(needs(0, 0, 0));
    expect(layout.cells.length).toBeGreaterThanOrEqual(MIN_CELLS);
    expect(layout.rings).toBe(1);
    expect(layout.lake.radius).toBe(LAKE_RADIUS);
    expect(layout.lots.some((l) => l.content.type === "decorHouse")).toBe(true);
    const locked = layout.lots.filter(
      (l) => l.content.type === "plot" && l.content.state === "locked",
    );
    expect(locked).toHaveLength(LOCKED_PLOTS_SHOWN);
  });

  it("gives every skill of the largest subject its own cell", () => {
    const layout = layoutCity(needs(102, 14, 40));
    expect(layout.lots.filter((l) => l.content.type === "skill")).toHaveLength(102);
    expect(layout.lots.filter((l) => l.content.type === "public")).toHaveLength(14);
    expect(
      layout.lots.filter((l) => l.content.type === "plot" && l.content.state === "owned"),
    ).toHaveLength(40);
  });

  it("never moves anything already built when skills, badges or plots are added", () => {
    for (const seed of CITY_IDS) {
      const before = layoutCity(needs(20, 2, 3, seed));
      const after = layoutCity(needs(60, 9, 15, seed));
      for (let s = 0; s < 20; s++) expect(idOf(s, after)).toBe(idOf(s, before));
      const pub = (l: ReturnType<typeof layoutCity>, i: number) =>
        l.lots.find((x) => x.content.type === "public" && x.content.publicIndex === i)?.id;
      for (let i = 0; i < 2; i++) expect(pub(after, i)).toBe(pub(before, i));
      const plot = (l: ReturnType<typeof layoutCity>, i: number) =>
        l.lots.find((x) => x.content.type === "plot" && x.content.plot === i)?.id;
      for (let i = 0; i < 3; i++) expect(plot(after, i)).toBe(plot(before, i));
    }
  });

  it("adding exactly one skill, one badge and one plot moves nothing", () => {
    const before = layoutCity(needs(31, 5, 7));
    const after = layoutCity(needs(32, 6, 8));
    for (let s = 0; s < 31; s++) expect(idOf(s, after)).toBe(idOf(s, before));
    for (const lot of before.lots) {
      const same = after.lots.find((l) => l.id === lot.id);
      if (!same) continue;
      expect(same.x).toBeCloseTo(lot.x, 6);
      expect(same.z).toBeCloseTo(lot.z, 6);
    }
  });

  it("puts no two lots on top of each other", () => {
    const layout = layoutCity(needs(102, 14, 20));
    // a lot is a rectangle turned to face its belt: width runs along the belt, depth across it
    for (let i = 0; i < layout.lots.length; i++) {
      for (let j = i + 1; j < layout.lots.length; j++) {
        const a = layout.lots[i] as (typeof layout.lots)[number];
        const b = layout.lots[j] as (typeof layout.lots)[number];
        if (Math.hypot(a.x - b.x, a.z - b.z) > 30) continue;
        expect(overlaps(a, b)).toBe(false);
      }
    }
  });

  it("keeps every lot out of the lake and off the roads", () => {
    const layout = layoutCity(needs(60, 8, 10));
    for (const lot of layout.lots) {
      expect(inLake(lot.x, lot.z, 1)).toBe(false);
      for (const edge of layout.roads.edges.values()) {
        for (const [x, z] of edge.points) expect(inside(lot, x, z)).toBe(false);
      }
    }
  });

  it("leaves parks, ponds and groves where the avenue and the water cut through", () => {
    const layout = layoutCity(needs(102, 14, 20));
    expect(layout.cells.some((c) => c.role === "park")).toBe(true);
    expect(layout.ponds.length).toBeGreaterThanOrEqual(2);
    expect(layout.groves.length).toBeGreaterThanOrEqual(2);
    // towers only beside the lake
    for (const cell of layout.cells) if (cell.tall) expect(cell.ring).toBe(1);
    expect(layout.cells.filter((c) => c.tall).length).toBeGreaterThanOrEqual(4);
    expect(layout.cells.filter((c) => c.tall).length).toBeLessThanOrEqual(6);
  });

  it("names every belt, differently in every city", () => {
    const layout = layoutCity(needs(102, 14, 20));
    expect(layout.districts).toHaveLength(layout.rings);
    for (const d of layout.districts) expect(d.name.length).toBeGreaterThan(3);
    expect(districtName("vmath", 1)).not.toBe(districtName("esl", 1));
  });

  it("grows only as needed", () => {
    expect(cellsNeeded(needs(0, 0, 0))).toBeGreaterThanOrEqual(MIN_CELLS);
    // the water and the green stretches take cells out of the running, so the town reaches further
    // out than the bare count of skills would suggest
    expect(cellsNeeded(needs(102, 14, 40))).toBeLessThan(320);
    expect(cellsNeeded(needs(10, 1, 1))).toBeLessThan(cellsNeeded(needs(60, 8, 12)));
  });
});

describe("roads as a graph", () => {
  it("joins up: every edge ends at a node that knows about it", () => {
    const roads = buildRoads("vmath", 3);
    expect(roads.edges.size).toBeGreaterThan(20);
    for (const edge of roads.edges.values()) {
      expect(roads.nodes.get(edge.from)?.edges).toContain(edge.id);
      expect(roads.nodes.get(edge.to)?.edges).toContain(edge.id);
      expect(edge.length).toBeGreaterThan(0);
      expect(edge.points.length).toBeGreaterThanOrEqual(2);
    }
    // nothing is stranded
    for (const node of roads.nodes.values()) expect(node.edges.length).toBeGreaterThan(0);
  });

  it("has an avenue running right across the city", () => {
    const roads = buildRoads("esl", 3);
    const avenue = [...roads.edges.values()].filter((e) => e.kind === "avenue");
    expect(avenue.length).toBeGreaterThanOrEqual(4);
    const span = Math.max(...avenue.flatMap((e) => e.points.map(([x, z]) => Math.hypot(x, z))));
    expect(span).toBeGreaterThan(3 * RING_PITCH);
  });

  it("curves: a belt arc is longer than the straight line between its ends", () => {
    const roads = buildRoads("vmath", 3);
    for (const edge of roads.edges.values()) {
      if (edge.kind !== "belt") continue;
      const a = edge.points[0] as [number, number];
      const b = edge.points[edge.points.length - 1] as [number, number];
      expect(edge.length).toBeGreaterThan(Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
  });
});

describe("the river and its harbour (pha 12 việc 2)", () => {
  it("leaves the lake and the town hall alone, and still comes near enough to reach", () => {
    // The owner asked for the invented towns to be allowed a river running through them
    // (16/09). It may cut across the outer belts — it may not cut across the middle.
    for (const seed of CITY_IDS) {
      const w = cityWaterways(seed, 4);
      expect(inRiver(w, 0, 0, LAKE_RADIUS)).toBe(false);
      const nearest = Math.min(...w.river.map(([x, z]) => Math.hypot(x, z)));
      expect(nearest).toBeGreaterThan(2 * RING_PITCH);
    }
  });

  it("never lets a city build a house in its own river", () => {
    for (const seed of CITY_IDS) {
      const layout = layoutCity(needs(102, 14, 40, seed));
      const w = cityWaterways(seed, layout.rings);
      for (const lot of layout.lots) expect(inRiver(w, lot.x, lot.z, 1)).toBe(false);
    }
  });

  it("carries the roads that cross the water on a deck", () => {
    for (const seed of CITY_IDS) {
      const layout = layoutCity(needs(102, 14, 40, seed));
      const decks = [...layout.roads.edges.values()].filter((e) => e.overWater);
      expect(decks.length).toBeGreaterThan(0);
      for (const deck of decks) expect(deck.park).toBeFalsy();
    }
  });

  it("puts the quay on the city's side of the water", () => {
    const w = waterways("esl", 5, 0.4);
    expect(Math.hypot(w.harbour.x, w.harbour.z)).toBeLessThan(
      Math.min(...w.river.map(([x, z]) => Math.hypot(x, z))) + w.style.width,
    );
    expect(w.harbour.big).toBe(true); // Bến Cảng Từ has the big harbour
  });

  it("gives every city its own river, and the boats to go with it", () => {
    const traits = CITY_IDS.map((c) => waterways(c, 4, 0).style.trait);
    expect(new Set(traits).size).toBe(CITY_IDS.length);
    for (const c of CITY_IDS) expect(waterways(c, 4, 0).lanes.length).toBeGreaterThanOrEqual(3);
  });

  it("builds the bridge only once the city has grown out to the bank", () => {
    expect(waterways("viet", 1, 0).bridgeBuilt).toBe(false);
    expect(waterways("viet", 7, 0).bridgeBuilt).toBe(true);
  });
});
