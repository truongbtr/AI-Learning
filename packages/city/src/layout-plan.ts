// Laying a city out from a drawn plan (home-plan.ts) instead of from belts and fans.
//
// Same output as `layoutCity`, same stability rule: a cell's role depends on its index and nothing
// else, so a new skill fills the next free cell and nothing that is already built ever moves. What
// changes is where the cells come from — here they are the plots along the real streets of the
// children's own town, in the order the districts are written down.

import type { CityPlan, PlanDistrict } from "./home-plan";
import {
  bridgeTheWater,
  type CellRole,
  type CityLayout,
  type District,
  type LayoutCell,
  type LayoutLot,
  type LayoutNeeds,
  LOCKED_PLOTS_SHOWN,
  LOT_MAX,
  type LotContent,
  type LotRole,
  MIN_CELLS,
  type RoadEdge,
  type RoadGraph,
  type RoadNode,
} from "./layout";
import { distanceToPath, inRiver, planWaterways, type Waterways } from "./waterways";

/** Distance between two front doors along a street. */
const PLOT_PITCH = 11.5;
/** How far a lot's middle sits from the middle of its street. */
const SETBACK = 11;
/** Breathing room between two lots, and between a lot and anything else. */
const CLEAR = 1.2;
/** How wide a district street is. */
const STREET_WIDTH = 5;

const lengthOf = (points: [number, number][]) => {
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as [number, number];
    const b = points[i] as [number, number];
    d += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return d;
};

/** A point and a heading at distance `d` along a polyline. */
function along(points: [number, number][], d: number): { x: number; z: number; heading: number } {
  let left = d;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as [number, number];
    const b = points[i] as [number, number];
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (left <= seg || i === points.length - 1) {
      const t = seg === 0 ? 0 : Math.max(0, Math.min(1, left / seg));
      return {
        x: a[0] + (b[0] - a[0]) * t,
        z: a[1] + (b[1] - a[1]) * t,
        heading: Math.atan2(b[1] - a[1], b[0] - a[0]),
      };
    }
    left -= seg;
  }
  const last = points[points.length - 1] as [number, number];
  return { x: last[0], z: last[1], heading: 0 };
}

/**
 * Every plot of a district, in order: down the street, left side then right side at each stop, so
 * a district fills in from one end the way a street is built.
 */
function plotsOf(district: PlanDistrict, index: number): LayoutCell[] {
  const out: LayoutCell[] = [];
  for (const street of district.streets) {
    const stops = Math.max(1, Math.floor(lengthOf(street) / PLOT_PITCH));
    for (let stop = 0; stop < stops; stop++) {
      out.push(...plotsAt(district, index, out.length, street, stop));
    }
  }
  return out;
}

/** The lots at one stop of one street: one on each side of it, unless the plan says one side only. */
function plotsAt(
  district: PlanDistrict,
  index: number,
  slot: number,
  street: [number, number][],
  stop: number,
): LayoutCell[] {
  const at = along(street, (stop + 0.5) * PLOT_PITCH);
  const nx = -Math.sin(at.heading);
  const nz = Math.cos(at.heading);
  const sides = district.sides === "both" ? [-1, 1] : district.sides === "left" ? [-1] : [1];
  const width = Math.min(LOT_MAX, PLOT_PITCH - 2 * CLEAR - 0.6);
  const depth = district.style === "villa" ? 11 : district.style === "tower" ? 10 : 9;
  const corner = (out: number, along: number, side: number): [number, number] => [
    at.x + nx * (SETBACK + out) * side + Math.cos(at.heading) * along,
    at.z + nz * (SETBACK + out) * side + Math.sin(at.heading) * along,
  ];
  return sides.map((side) => ({
    index: 0, // filled in by the caller, once every district is laid out
    ring: index + 1,
    slot: slot + (side > 0 ? 1 : 0),
    x: at.x + nx * SETBACK * side,
    z: at.z + nz * SETBACK * side,
    radius: Math.hypot(at.x, at.z),
    angle: at.heading + (side > 0 ? Math.PI / 2 : -Math.PI / 2),
    width,
    depth,
    role: "skill" as CellRole,
    corners: [
      corner(-depth / 2, -width / 2, side),
      corner(-depth / 2, width / 2, side),
      corner(depth / 2, width / 2, side),
      corner(depth / 2, -width / 2, side),
    ] as [number, number][],
    tall: district.style === "tower",
  }));
}

/** Is (x, z) in one of the plan's lakes? They are ellipses, so a long lake can lie along a road. */
export function inPlanLake(
  lake: CityPlan["lakes"][number],
  x: number,
  z: number,
  pad = 0,
): boolean {
  const turn = lake.angle ?? 0;
  const dx = x - lake.at[0];
  const dz = z - lake.at[1];
  const ax = dx * Math.cos(turn) + dz * Math.sin(turn);
  const az = -dx * Math.sin(turn) + dz * Math.cos(turn);
  const long = (lake.radius + (lake.wobble ?? 0)) * (lake.long ?? 1) + pad;
  const wide = lake.radius + (lake.wobble ?? 0) + pad;
  return (ax * ax) / (long * long) + (az * az) / (wide * wide) <= 1;
}

/** Two lots as rectangles turned to face their street: do they touch? */
function clash(a: LayoutCell, b: LayoutCell): boolean {
  if (Math.hypot(a.x - b.x, a.z - b.z) > 30) return false;
  const axesOf = (cell: LayoutCell) => {
    const c = Math.cos(cell.angle);
    const s = Math.sin(cell.angle);
    return [
      { axis: [c, s] as [number, number], half: Math.min(cell.depth, LOT_MAX) / 2 + CLEAR },
      { axis: [-s, c] as [number, number], half: Math.min(cell.width, LOT_MAX) / 2 + CLEAR },
    ];
  };
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  for (const { axis } of [...axesOf(a), ...axesOf(b)]) {
    const project = (cell: LayoutCell) =>
      axesOf(cell).reduce(
        (sum, e) => sum + e.half * Math.abs(e.axis[0] * axis[0] + e.axis[1] * axis[1]),
        0,
      );
    if (Math.abs(dx * axis[0] + dz * axis[1]) - project(a) - project(b) > 0) return false;
  }
  return true;
}

/**
 * The plots the town can actually build on: the plan is drawn by eye, so some of what it lays out
 * lands in the canal, under a road, on the golf course, or on top of a neighbour where a street
 * bends. Those are dropped here, once, from the plan alone — never from what the child has learnt —
 * so the order of what is left never changes and nothing already built ever moves.
 */
function refuse(
  plan: CityPlan,
  water: Waterways,
  cell: LayoutCell,
  kept: LayoutCell[],
): "" | "water" | "green" | "road" | "street" | "neighbour" {
  const reach = Math.max(cell.width, cell.depth) / 2;
  if (inRiver(water, cell.x, cell.z, reach)) return "water";
  if (plan.lakes.some((lake) => inPlanLake(lake, cell.x, cell.z, reach))) return "water";
  if (plan.greens.some((g) => Math.hypot(cell.x - g.at[0], cell.z - g.at[1]) < g.radius - 4))
    return "green";
  if (plan.roads.some((r) => distanceToPath(r.points, cell.x, cell.z) < r.width / 2 + reach + 1))
    return "road";
  // a lot stands back from its own street; it must not be standing in anybody else's
  if (
    plan.districts.some((d) =>
      d.streets.some(
        (street) => distanceToPath(street, cell.x, cell.z) < STREET_WIDTH / 2 + cell.depth / 2 + 1,
      ),
    )
  )
    return "street";
  if (kept.some((other) => clash(cell, other))) return "neighbour";
  return "";
}

function buildable(plan: CityPlan, cells: LayoutCell[]): LayoutCell[] {
  const water = planWaterways(plan);
  const kept: LayoutCell[] = [];
  for (const cell of cells) if (!refuse(plan, water, cell, kept)) kept.push(cell);
  return kept;
}

/**
 * District by district: how many plots the plan drew, how many the town can build on, and where
 * the rest went. The plan is drawn by hand, so whoever moves a street next needs to see why their
 * houses disappeared:  pnpm --filter @mtct/city exec tsx scripts/plan-check.ts
 */
export function planReport(plan: CityPlan): string[] {
  const water = planWaterways(plan);
  const kept: LayoutCell[] = [];
  const lost = plan.districts.map(() => new Map<string, number>());
  const drawn = plan.districts.map((district, i) => {
    const cells = plotsOf(district, i);
    for (const cell of cells) {
      const why = refuse(plan, water, cell, kept);
      if (!why) kept.push(cell);
      else lost[i]?.set(why, (lost[i]?.get(why) ?? 0) + 1);
    }
    return cells.length;
  });
  return plan.districts.map((district, i) => {
    const left = kept.filter((c) => c.ring === i + 1).length;
    const why = [...(lost[i] ?? new Map())].map(([k, n]) => `${k} ${n}`).join(", ");
    return `${district.name}: ${left}/${drawn[i]} plots${why ? ` — dropped: ${why}` : ""}`;
  });
}

/** What a cell is for, from its index alone — the same rule the belt cities use. */
export function planCellRole(index: number): CellRole {
  if (index % 12 === 5) return "public";
  if (index % 4 === 3) return "plot";
  return "skill";
}

function planRoads(plan: CityPlan): RoadGraph {
  const nodes = new Map<string, RoadNode>();
  const edges = new Map<string, RoadEdge>();
  const addNode = (id: string, x: number, z: number, light = false) => {
    if (!nodes.has(id)) nodes.set(id, { id, x, z, edges: [], light });
    return nodes.get(id) as RoadNode;
  };
  const addEdge = (edge: RoadEdge) => {
    edges.set(edge.id, edge);
    nodes.get(edge.from)?.edges.push(edge.id);
    nodes.get(edge.to)?.edges.push(edge.id);
  };
  /** Where a junction is: any two roads that pass within this distance share a node. */
  const SNAP = 16;
  const nodeAt = (x: number, z: number, light: boolean): string => {
    for (const node of nodes.values()) {
      if (Math.hypot(node.x - x, node.z - z) < SNAP) {
        if (light) node.light = true;
        return node.id;
      }
    }
    const id = `p${nodes.size}`;
    addNode(id, x, z, light);
    return id;
  };

  const lines: { id: string; points: [number, number][]; width: number; kind: RoadEdge["kind"] }[] =
    [
      ...plan.roads.map((r) => ({ id: r.id, points: r.points, width: r.width, kind: r.kind })),
      // every street of every district is a road too
      ...plan.districts.flatMap((d, i) =>
        d.streets.map((points, s) => ({
          id: `d${i}s${s}`,
          points,
          width: STREET_WIDTH,
          kind: "spoke" as const,
        })),
      ),
    ];

  for (const line of lines) {
    // cut each line at its own points, so a junction can be snapped anywhere along it
    for (let i = 1; i < line.points.length; i++) {
      const a = line.points[i - 1] as [number, number];
      const b = line.points[i] as [number, number];
      const from = nodeAt(a[0], a[1], line.kind === "avenue");
      const to = nodeAt(b[0], b[1], line.kind === "avenue");
      if (from === to) continue;
      const fromNode = nodes.get(from) as RoadNode;
      const toNode = nodes.get(to) as RoadNode;
      const points: [number, number][] = [
        [fromNode.x, fromNode.z],
        [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
        [toNode.x, toNode.z],
      ];
      addEdge({
        id: `${line.id}_${i}`,
        from,
        to,
        points,
        kind: line.kind,
        length: lengthOf(points),
        width: line.width,
      });
    }
  }
  bridgeTheWater(planWaterways(plan), edges);
  return { nodes, edges };
}

/** Every plot the plan draws, in a fixed order: district by district, street by street. */
function drawnPlots(plan: CityPlan): LayoutCell[] {
  const out: LayoutCell[] = [];
  plan.districts.forEach((district, i) => {
    for (const cell of plotsOf(district, i)) out.push(cell);
  });
  return out;
}

/** The same `CityLayout` the rest of the engine expects, built from a drawn plan. */
export function layoutFromPlan(plan: CityPlan, needs: LayoutNeeds): CityLayout {
  const all = buildable(plan, drawnPlots(plan));
  all.forEach((cell, index) => {
    cell.index = index;
    cell.role = planCellRole(index);
  });

  // how many plots this child's city needs today (the rest of the town is there but quiet)
  let skills = 0;
  let publics = 0;
  let plots = 0;
  let used = 0;
  const plotsWanted = needs.plotsOwned + LOCKED_PLOTS_SHOWN;
  for (const cell of all) {
    if (
      skills >= needs.skills &&
      publics >= needs.publics &&
      plots >= plotsWanted &&
      used >= MIN_CELLS
    )
      break;
    if (cell.role === "skill") skills++;
    else if (cell.role === "public") publics++;
    else plots++;
    used++;
  }
  // finish the district rather than stopping halfway down a street
  const lastRing = all[Math.max(0, used - 1)]?.ring ?? 1;
  while (used < all.length && (all[used] as LayoutCell).ring === lastRing) used++;
  const cells = all.slice(0, Math.max(MIN_CELLS, used));

  const lots: LayoutLot[] = [];
  let skill = 0;
  let publicIndex = 0;
  let plot = 0;
  let filler = 0;
  for (const cell of cells) {
    let content: LotContent;
    if (cell.role === "skill") {
      content =
        skill < needs.skills ? { type: "skill", skill } : { type: "decorHouse", variant: filler++ };
      skill++;
    } else if (cell.role === "public") {
      content =
        publicIndex < needs.publics
          ? { type: "public", publicIndex }
          : { type: "garden", variant: filler++ };
      publicIndex++;
    } else {
      if (plot < needs.plotsOwned) content = { type: "plot", plot, state: "owned" };
      else if (plot < needs.plotsOwned + LOCKED_PLOTS_SHOWN)
        content = { type: "plot", plot, state: "locked" };
      else content = { type: "garden", variant: filler++ };
      plot++;
    }
    lots.push({
      id: `d${cell.ring}p${cell.slot}`,
      cell,
      role: cell.role as LotRole,
      x: cell.x,
      z: cell.z,
      width: Math.min(cell.width, LOT_MAX),
      depth: Math.min(cell.depth, LOT_MAX),
      facing: -cell.angle + Math.PI / 2,
      content,
    });
  }

  const districts: District[] = plan.districts.map((d, i) => {
    const sign = d.sign ?? along(d.spine, lengthOf(d.spine) * 0.5);
    const at: [number, number] = Array.isArray(sign) ? sign : [sign.x, sign.z];
    return {
      ring: i + 1,
      name: d.name,
      sign: { x: at[0], z: at[1], angle: 0 },
      radius: Math.hypot(at[0], at[1]),
    };
  });

  const lakePoints = (lake: CityPlan["lakes"][number]): [number, number][] => {
    const long = lake.long ?? 1;
    const turn = lake.angle ?? 0;
    return Array.from({ length: 26 }, (_, i) => {
      const a = (i / 26) * Math.PI * 2;
      const r = lake.radius + Math.sin(a * 3 + lake.at[0]) * (lake.wobble ?? 0);
      // an ellipse, turned: the long lakes of the real town are not ponds
      const ex = Math.cos(a) * r * long;
      const ez = Math.sin(a) * r;
      return [
        lake.at[0] + ex * Math.cos(turn) - ez * Math.sin(turn),
        lake.at[1] + ex * Math.sin(turn) + ez * Math.cos(turn),
      ] as [number, number];
    });
  };

  const main = plan.lakes[0] as CityPlan["lakes"][number];
  return {
    cells,
    lots,
    roads: planRoads(plan),
    districts,
    rings: plan.districts.length,
    // the town is as big as its plan from the first day: the countryside starts past the last house
    edge: cells.reduce((far, c) => Math.max(far, Math.hypot(c.x, c.z)), 0) + 14,
    avenue: (plan.roads.find((r) => r.kind === "avenue")?.points ?? []) as [number, number][],
    lake: {
      x: main.at[0],
      z: main.at[1],
      radius: main.radius,
      points: lakePoints(main),
    },
    ponds: plan.lakes.slice(1).map((l) => ({ x: l.at[0], z: l.at[1], radius: l.radius })),
    groves: plan.greens.map((g) => ({ x: g.at[0], z: g.at[1], radius: g.radius })),
    bounds: {
      minX: -plan.extent,
      maxX: plan.extent,
      minZ: -plan.extent,
      maxZ: plan.extent,
    },
    townHall: { x: plan.townHall.at[0], z: plan.townHall.at[1], facing: plan.townHall.facing },
    wonder: { x: plan.wonder[0], z: plan.wonder[1] },
    decorSpots: plan.greens.map((g) => ({ x: g.at[0], z: g.at[1] })),
  };
}
