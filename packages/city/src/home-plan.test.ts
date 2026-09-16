import { describe, expect, it } from "vitest";
import { ECOPARK, HOME_CITY, parallel } from "./home-plan";
import { type CityLayout, layoutCity } from "./layout";
import { inPlanLake, layoutFromPlan } from "./layout-plan";
import { distanceToPath, inRiver, planWaterways } from "./waterways";

const needs = (skills: number, publics: number, plotsOwned: number) => ({
  skills,
  publics,
  plotsOwned,
  seed: HOME_CITY,
});
const home = (skills: number, publics: number, plotsOwned: number) =>
  layoutFromPlan(ECOPARK, needs(skills, publics, plotsOwned));
const idOf = (skill: number, layout: CityLayout) =>
  layout.lots.find((l) => l.content.type === "skill" && l.content.skill === skill)?.id;

type Lot = CityLayout["lots"][number];

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
    if (Math.abs(dx * axis[0] + dz * axis[1]) - project(a) - project(b) > -0.01) return false;
  }
  return true;
}

describe("the children's own town (pha 12 việc 7, ADR-23)", () => {
  it("is the city the subject `viet` opens, laid out from the plan and not from belts", () => {
    const layout = layoutCity(needs(60, 8, 10));
    expect(layout.districts.map((d) => d.name)).toEqual(ECOPARK.districts.map((d) => d.name));
  });

  it("carries the names from the real map", () => {
    const names = home(102, 14, 20).districts.map((d) => d.name);
    for (const real of ["Park River", "The Island", "Ecopark CBD", "Aqua Bay", "Palm Springs"]) {
      expect(names).toContain(real);
    }
  });

  it("has room for every skill of the largest subject, with streets to spare", () => {
    // Tiếng Việt is the biggest map of the six (102 skills) and it lives here
    const layout = home(102, 14, 40);
    expect(layout.lots.filter((l) => l.content.type === "skill")).toHaveLength(102);
    expect(layout.lots.filter((l) => l.content.type === "public")).toHaveLength(14);
    expect(
      layout.lots.filter((l) => l.content.type === "plot" && l.content.state === "owned"),
    ).toHaveLength(40);
    const whole = home(999, 99, 99);
    expect(whole.cells.filter((c) => c.role === "skill").length).toBeGreaterThan(110);
  });

  it("never moves a house that is already built", () => {
    const before = home(20, 2, 3);
    const after = home(102, 14, 40);
    for (let s = 0; s < 20; s++) expect(idOf(s, after)).toBe(idOf(s, before));
    for (const lot of before.lots) {
      const same = after.lots.find((l) => l.id === lot.id);
      if (!same) continue;
      expect(same.x).toBeCloseTo(lot.x, 6);
      expect(same.z).toBeCloseTo(lot.z, 6);
    }
  });

  it("puts no two houses on top of each other", () => {
    const layout = home(102, 14, 40);
    for (let i = 0; i < layout.lots.length; i++) {
      for (let j = i + 1; j < layout.lots.length; j++) {
        const a = layout.lots[i] as Lot;
        const b = layout.lots[j] as Lot;
        if (Math.hypot(a.x - b.x, a.z - b.z) > 30) continue;
        expect(overlaps(a, b)).toBe(false);
      }
    }
  });

  it("builds nothing in the river, the canals, the lakes or the golf course", () => {
    const water = planWaterways(ECOPARK);
    for (const lot of home(102, 14, 40).lots) {
      expect(inRiver(water, lot.x, lot.z, 1)).toBe(false);
      for (const lake of ECOPARK.lakes) expect(inPlanLake(lake, lot.x, lot.z, 1)).toBe(false);
      for (const green of ECOPARK.greens) {
        expect(Math.hypot(lot.x - green.at[0], lot.z - green.at[1])).toBeGreaterThan(
          green.radius - 6,
        );
      }
    }
  });

  it("keeps every house off the roads", () => {
    const layout = home(102, 14, 40);
    for (const lot of layout.lots) {
      for (const road of ECOPARK.roads) {
        expect(distanceToPath(road.points, lot.x, lot.z)).toBeGreaterThan(road.width / 2);
      }
    }
  });

  it("joins its roads up, and carries the ones that cross the water on a deck", () => {
    const { roads } = home(102, 14, 40);
    for (const edge of roads.edges.values()) {
      expect(roads.nodes.get(edge.from)?.edges).toContain(edge.id);
      expect(roads.nodes.get(edge.to)?.edges).toContain(edge.id);
      expect(edge.length).toBeGreaterThan(0);
    }
    for (const node of roads.nodes.values()) expect(node.edges.length).toBeGreaterThan(0);
    expect([...roads.edges.values()].filter((e) => e.overWater).length).toBeGreaterThan(0);
  });

  it("has its river across the north, with the harbour and the bridge on it", () => {
    const water = planWaterways(ECOPARK);
    expect(water.canals.length).toBeGreaterThanOrEqual(4);
    expect(water.bridgeBuilt).toBe(true); // the town is already there
    expect(distanceToPath(water.river, water.harbour.x, water.harbour.z)).toBeLessThan(
      water.style.width,
    );
    // every point of the river is north of the middle of the town
    for (const [, z] of water.river) expect(z).toBeLessThan(0);
  });

  it("draws streets alongside a line, on the side the offset asks for", () => {
    const east: [number, number][] = [
      [0, 0],
      [40, 0],
    ];
    const [south, north] = parallel(east, [12, -12]);
    expect(south?.[0]?.[1]).toBeCloseTo(12, 6);
    expect(north?.[0]?.[1]).toBeCloseTo(-12, 6);
  });
});
