// City layout — pure, deterministic, no three.js.
//
// Pha 12 replaced the square grid of pha 10. Everything met everything else at a right angle, and
// six cities of right angles look like one city. The children live in Ecopark (Văn Giang), so the
// shape they know is a different one: a lake in the middle, roads that curve around it in belts,
// houses in fans between the belts, one long diagonal avenue, and a river along the edge. We borrow
// the GEOMETRY only — no real map, no real names.
//
// The city is polar:
//   • ring r (1, 2, 3 …) sits at radius r × RING_PITCH, wobbled by a deterministic noise so it is a
//     belt and not a perfect circle;
//   • ring r is cut into CELLS(r) = 8 + 6r trapezoid cells between two belts and two spokes;
//   • cell k (counted ring by ring, slot by slot) always means the same place, for ever.
//
// STABILITY RULE (unchanged from pha 10, only the mapping is new): a cell's ROLE depends on its
// index k and on the city id, never on how many skills, badges or plots exist. A new skill fills
// the next free cell of its role and nothing that is already built ever moves.

import type { CityView } from "@mtct/core";
import { ECOPARK, HOME_CITY } from "./home-plan";
import { layoutFromPlan } from "./layout-plan";
import { inRiver, type Waterways, waterways } from "./waterways";

/** Kept from pha 10: props, roads and lots are all measured in these. */
export const TILE = 3.2;
/** Distance between two belts, in world units. */
export const RING_PITCH = 26;
/**
 * Half-depth of the band a ring's cells occupy. The rest of the pitch is road and verge — and there
 * has to be enough of it for a spoke to swing from one belt's cell boundary to the next one's
 * without cutting through a garden on the way.
 */
export const RING_BAND = 10;
/**
 * The lake in the middle, there from day one. The first belt road runs along its shore, which is
 * the shape the children know: the water is the middle of the town, not a puddle behind it.
 */
export const LAKE_RADIUS = 14;
/**
 * Radius of the FIRST belt. It is further out than one pitch so the lake, its beach and the first
 * ring road all fit inside it; the belts after it are one pitch apart.
 */
export const FIRST_RING = 34;
/**
 * Cells on ring r. Not a fixed count per belt but a fixed WIDTH per cell: a belt twice as long gets
 * twice as many houses, so the terraces stay the same size all the way out. The first draft used
 * "8 + 6r" and the outer belts came out as wide green bands with a house every thirty metres —
 * nothing like the rows in the photographs (pha 12, reference 03).
 */
export const CELL_WIDTH = 13.5;
export const cellsOnRing = (r: number) =>
  Math.max(12, Math.round((2 * Math.PI * (FIRST_RING + (r - 1) * RING_PITCH)) / CELL_WIDTH));
/**
 * Cells on day one: the town hall on its peninsula, a piece of the first belt, and a great deal of
 * grass, forest and water waiting (docs/08 pha 12 việc 1).
 */
export const MIN_CELLS = 6;
/** Widest a building's footprint may be, whatever the cell around it measures. */
export const LOT_MAX = 8.5;
/** Plots shown behind a fence ahead of what the kid owns (it carries the star cost, "70★"). */
export const LOCKED_PLOTS_SHOWN = 1;
/** Where the wonder stands: a fixed cell, never handed to a skill. */
export const WONDER_CELL = { ring: 2, slot: 4 } as const;

export type CellRole = "skill" | "public" | "plot" | "park" | "pond" | "grove";
export type LotRole = "skill" | "public" | "plot";

export type LotContent =
  | { type: "skill"; skill: number }
  | { type: "public"; publicIndex: number }
  | { type: "plot"; plot: number; state: "owned" | "locked" }
  | { type: "decorHouse"; variant: number }
  | { type: "garden"; variant: number };

export interface LayoutCell {
  /** Global index — the only thing a role depends on. */
  index: number;
  ring: number;
  slot: number;
  /** Cell centre in world units. */
  x: number;
  z: number;
  /** Radius and angle of the centre (the polar pair the geometry came from). */
  radius: number;
  angle: number;
  /** Footprint of the buildable middle of the cell (world units). */
  width: number;
  depth: number;
  role: CellRole;
  /** The two belt-side corners, inner then outer, for drawing the trapezoid. */
  corners: [number, number][];
  /** Near the lake, where the city is allowed to go tall. */
  tall: boolean;
}

export interface LayoutLot {
  /** Stable id: `r<ring>s<slot>` — it survives every later growth. */
  id: string;
  cell: LayoutCell;
  role: LotRole;
  x: number;
  z: number;
  width: number;
  depth: number;
  /** Rotation so the building faces the belt road (radians, model faces +x). */
  facing: number;
  content: LotContent;
}

/** A road is a curved polyline between two junctions. */
export interface RoadEdge {
  id: string;
  from: string;
  to: string;
  points: [number, number][];
  kind: "belt" | "spoke" | "avenue" | "bridge";
  /** Metres of tarmac, precomputed for the traffic. */
  length: number;
  /** Lane width (avenues are wider). */
  width: number;
  /**
   * The stretch runs through a park rather than between houses: drawn as a footpath, and the ring
   * stops reading as a closed loop of tarmac (pha 12, after the owner's note on 16/09).
   */
  park?: boolean;
  /** The stretch crosses the water: it is carried on a deck, with rails and piers. */
  overWater?: boolean;
}

export interface RoadNode {
  id: string;
  x: number;
  z: number;
  /** Edge ids meeting here. */
  edges: string[];
  /** A junction big enough for a traffic light (an avenue crossing a belt). */
  light: boolean;
}

export interface RoadGraph {
  nodes: Map<string, RoadNode>;
  edges: Map<string, RoadEdge>;
}

export interface District {
  ring: number;
  /** Vietnamese name shown on the sign at the entrance and on the paper map. */
  name: string;
  /** Where the sign stands. */
  sign: { x: number; z: number; angle: number };
  radius: number;
}

export interface CityLayout {
  cells: LayoutCell[];
  lots: LayoutLot[];
  roads: RoadGraph;
  districts: District[];
  /** How many belts exist in this city right now. */
  rings: number;
  /** How far out the town reaches: the countryside and the forest start here. */
  edge: number;
  /** The diagonal avenue, as one polyline across the whole city. */
  avenue: [number, number][];
  lake: { x: number; z: number; radius: number; points: [number, number][] };
  /** Small ponds and groves that break up the belts. */
  ponds: { x: number; z: number; radius: number }[];
  groves: { x: number; z: number; radius: number }[];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  townHall: { x: number; z: number; facing: number };
  wonder: { x: number; z: number };
  decorSpots: { x: number; z: number }[];
}

// ---------------------------------------------------------------------------------------------
// Deterministic noise — the belts must wobble the same way for ever, on every device.
// ---------------------------------------------------------------------------------------------

const hashString = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/**
 * How far belt `ring` bulges in or out at this angle.
 *
 * One shape for the whole town, growing with the belt, rather than a fresh wiggle per ring: two
 * neighbouring belts then stay roughly the same distance apart (there has to be room for a road
 * between them), while the town as a whole is clearly not drawn with a compass.
 */
export function beltWobble(seed: string, ring: number, angle: number): number {
  const h = hashString(`${seed}:shape`);
  const p1 = ((h & 1023) / 1023) * Math.PI * 2;
  const p2 = (((h >> 10) & 1023) / 1023) * Math.PI * 2;
  const lobes = 2 + (h % 2);
  const shape = Math.sin(angle * lobes + p1) * 0.62 + Math.sin(angle * (lobes + 2) + p2) * 0.38;
  return shape * (3.6 + 0.9 * Math.max(0, ring));
}

/**
 * Where belt `ring` is centred. Not on the lake: each belt drifts a little further off, in a
 * direction of its own, so the town is a set of overlapping loops rather than a dartboard. Perfect
 * concentric circles were the first thing the owner disliked about the drawing, and they were right
 * — no real town is laid out with a compass.
 */
export function ringCentre(seed: string, ring: number): [number, number] {
  if (ring <= 0) return [0, 0];
  // one direction for the whole town, a little further each belt: the loops lean the same way, the
  // way a town spreads along a road rather than growing evenly in every direction
  const h = hashString(`${seed}:drift`);
  const angle = ((h & 4095) / 4095) * Math.PI * 2 + ring * 0.12;
  const drift = 1.6 * ring;
  return [Math.cos(angle) * drift, Math.sin(angle) * drift];
}

/** A point on belt `ring`, measured from that belt's own centre. */
export function ringPoint(
  seed: string,
  ring: number,
  angle: number,
  radius: number,
): [number, number] {
  const [cx, cz] = ringCentre(seed, ring);
  return [cx + Math.cos(angle) * radius, cz + Math.sin(angle) * radius];
}

/** Radius of belt `ring` at `angle`, wobble included. */
export const beltRadius = (seed: string, ring: number, angle: number): number =>
  FIRST_RING + (ring - 1) * RING_PITCH + beltWobble(seed, ring, angle);

/** The angle a cell's centre sits at. Ring phases are offset so spokes do not line up. */
export function cellAngle(ring: number, slot: number): number {
  const n = cellsOnRing(ring);
  return ((slot + 0.5) / n) * Math.PI * 2 + ring * 0.31;
}

/** (ring, slot) of the cell with global index k — ring by ring, slot by slot. */
export function cellAt(index: number): { ring: number; slot: number } {
  let k = index;
  let ring = 1;
  while (k >= cellsOnRing(ring)) {
    k -= cellsOnRing(ring);
    ring++;
  }
  return { ring, slot: k };
}

/** Global index of (ring, slot) — the inverse of `cellAt`. */
export function indexOfCell(ring: number, slot: number): number {
  let index = 0;
  for (let r = 1; r < ring; r++) index += cellsOnRing(r);
  return index + slot;
}

// ---------------------------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------------------------

/**
 * What a cell is for, from its index alone (plus the fixed geometry of the city, which is a
 * function of the city id). One in twelve is a public building, one in four a plot of land, the
 * rest are skills — with the cells the avenue, the ponds and the groves take out of the running.
 */
export function cellRole(seed: string, index: number): CellRole {
  const { ring, slot } = cellAt(index);
  if (ring === WONDER_CELL.ring && slot === WONDER_CELL.slot) return "park"; // the wonder's cell
  if (onAvenue(seed, ring, slot)) return "park";
  if (inCityRiver(seed, ring, slot)) return "pond"; // the water was here first
  const gap = sectorGap(seed, ring, slot);
  if (gap) return gap;
  if (index % 12 === 5) return "public";
  if (index % 4 === 3) return "plot";
  return "skill";
}

/**
 * The city's own river, as fixed geometry: the same line whatever the child has learnt, so a cell
 * that is water stays water for ever. Some cities have it along the edge, some have it running
 * right through the middle (owner, 16/09: the invented towns may have a river through them).
 */
export function cityRiver(seed: string): Waterways {
  return waterways(seed, 1, avenueAngle(seed));
}

/** Is this cell in the river? Then it is water, not a building plot. */
function inCityRiver(seed: string, ring: number, slot: number): boolean {
  const [x, z] = cellCentre(seed, ring, slot);
  return inRiver(cityRiver(seed), x, z, cellHalfWidth(seed, ring, slot) + RING_BAND);
}

/** The avenue runs at a fixed bearing for each city and eats the cells it crosses. */
export function avenueAngle(seed: string): number {
  return ((hashString(`${seed}:avenue`) % 360) / 360) * Math.PI * 2;
}

/**
 * How far the avenue passes from the middle. It is a chord, not a diameter: a straight road through
 * the centre would run across the lake, and a city built around water keeps its big road along the
 * shore.
 */
export const AVENUE_OFFSET = LAKE_RADIUS + 9;

/** The avenue as a line: a point on it, and the two unit vectors along and across it. */
export function avenueLine(seed: string): {
  base: [number, number];
  dir: [number, number];
  normal: [number, number];
} {
  const a = avenueAngle(seed);
  const dir: [number, number] = [Math.cos(a), Math.sin(a)];
  const normal: [number, number] = [-Math.sin(a), Math.cos(a)];
  return { base: [normal[0] * AVENUE_OFFSET, normal[1] * AVENUE_OFFSET], dir, normal };
}

/** Distance from a point to the avenue's centre line. */
export function distanceToAvenue(seed: string, x: number, z: number): number {
  const { normal } = avenueLine(seed);
  return Math.abs(x * normal[0] + z * normal[1] - AVENUE_OFFSET);
}

function onAvenue(seed: string, ring: number, slot: number): boolean {
  const angle = cellAngle(ring, slot);
  const radius = beltRadius(seed, ring, angle);
  const half = cellHalfWidth(seed, ring, slot);
  return (
    distanceToAvenue(seed, Math.cos(angle) * radius, Math.sin(angle) * radius) <
    AVENUE_WIDTH / 2 + half + 2
  );
}

/**
 * Half the width of a cell — half the distance to its nearest neighbour on the belt, less the
 * verge. Measured rather than assumed, because the belts wobble and two neighbours are never
 * exactly the same distance apart.
 */
export function cellHalfWidth(seed: string, ring: number, slot: number): number {
  const n = cellsOnRing(ring);
  const here = cellCentre(seed, ring, slot);
  let nearest = Number.POSITIVE_INFINITY;
  for (const other of [(slot + 1) % n, (slot - 1 + n) % n]) {
    const p = cellCentre(seed, ring, other);
    nearest = Math.min(nearest, Math.hypot(p[0] - here[0], p[1] - here[1]));
  }
  return Math.min(nearest * 0.44, 5.5);
}

export function cellCentre(seed: string, ring: number, slot: number): [number, number] {
  const angle = cellAngle(ring, slot);
  return ringPoint(seed, ring, angle, beltRadius(seed, ring, angle));
}

/**
 * Belts are not closed loops of houses. Each one is broken by two long stretches of park, water and
 * woodland — that is what stops the town reading as a dartboard, and it is what the photographs
 * show: the built parts are ARCS between green, not rings around a centre (owner, 16/09).
 *
 * The gaps are a function of (city, ring) only, so they never move.
 */
function sectorGap(seed: string, ring: number, slot: number): "pond" | "grove" | null {
  const n = cellsOnRing(ring);
  const h = hashString(`${seed}:gap:${ring}`);
  const gaps = [
    { start: h % n, length: Math.max(3, Math.round(n * 0.14)) },
    {
      start: (Math.floor(n * 0.45) + ((h >> 8) % Math.max(1, Math.floor(n * 0.2)))) % n,
      length: Math.max(2, Math.round(n * 0.1)),
    },
  ];
  for (const [i, gap] of gaps.entries()) {
    const offset = (slot - gap.start + n) % n;
    if (offset >= gap.length) continue;
    // water in the middle of the gap, trees around it — a park with a pond in it
    const middle = Math.floor(gap.length / 2);
    if (i === 0 && (offset === middle || offset === middle - 1)) return "pond";
    return "grove";
  }
  return null;
}

/** Two arcs of the first belt, beside the lake, where towers are allowed. */
function isTall(seed: string, ring: number, slot: number): boolean {
  if (ring !== 1) return false;
  const n = cellsOnRing(1);
  const h = hashString(`${seed}:towers`) % n;
  return slot === h || slot === (h + 1) % n || slot === (h + 6) % n || slot === (h + 7) % n;
}

export interface LayoutNeeds {
  skills: number;
  publics: number;
  plotsOwned: number;
  /** City id — the belts, the avenue and the ponds are drawn from it. */
  seed: string;
}

export function needsOf(
  view: Pick<CityView, "skills" | "publicBuildings" | "land" | "subject">,
): LayoutNeeds {
  return {
    skills: view.skills.length,
    publics: view.publicBuildings.length,
    plotsOwned: view.land.owned,
    seed: view.subject,
  };
}

/** How many cells are needed so every role has room (plus the locked plot on show). */
export function cellsNeeded(needs: LayoutNeeds): number {
  let skills = 0;
  let publics = 0;
  let plots = 0;
  let k = 0;
  const plotsWanted = needs.plotsOwned + LOCKED_PLOTS_SHOWN;
  while (skills < needs.skills || publics < needs.publics || plots < plotsWanted || k < MIN_CELLS) {
    const role = cellRole(needs.seed, k);
    if (role === "skill") skills++;
    else if (role === "public") publics++;
    else if (role === "plot") plots++;
    k++;
    if (k > 4000) break; // a city that big cannot happen; never loop for ever
  }
  // finish the belt: half a belt of houses and half a belt of grass looks broken
  const { ring } = cellAt(k - 1);
  return Math.min(indexOfCell(ring + 1, 0), Math.max(k, MIN_CELLS));
}

// ---------------------------------------------------------------------------------------------
// District names — one per belt, different in every city, and never a brand.
// ---------------------------------------------------------------------------------------------

const DISTRICT_NAMES: Record<string, string[]> = {
  viet: ["Khu Bến Cũ", "Đồi Hoa", "Vườn Thiên Nga", "Phố Lồng Đèn", "Bãi Sếu", "Rừng Thơ"],
  vmath: ["Khu Số Một", "Đồi Bảy", "Vườn Chục", "Phố Cân Bằng", "Bãi Vuông", "Rừng Số"],
  esl: ["Bến Thuyền Giấy", "Đồi Chào", "Vườn Bảng Chữ", "Phố Cầu Vồng", "Bãi Sóng", "Rừng Từ"],
  enl: [
    "Khu Trang Sách",
    "Đồi Kể Chuyện",
    "Vườn Vần Điệu",
    "Phố Đèn Đọc",
    "Bãi Cát Trắng",
    "Rừng Truyện",
  ],
  emath: ["Khu Bánh Răng", "Đồi Ống Khói", "Vườn Con Lăn", "Phố Thước Kẻ", "Bãi Sắt", "Rừng Máy"],
  esci: ["Khu Kính Lúp", "Đồi Sao", "Vườn Hạt Mầm", "Phố Mây Mưa", "Bãi Đá", "Rừng Khám Phá"],
};

export function districtName(seed: string, ring: number): string {
  const list = DISTRICT_NAMES[seed] ?? DISTRICT_NAMES.viet ?? [];
  return list[(ring - 1) % list.length] ?? `Khu ${ring}`;
}

// ---------------------------------------------------------------------------------------------
// Roads
// ---------------------------------------------------------------------------------------------

export const BELT_WIDTH = 6.2;
export const SPOKE_WIDTH = 5.0;
export const AVENUE_WIDTH = 9.0;
/** One spoke every this many cells of a belt. */
const SPOKE_EVERY = 3;

const nodeId = (ring: number, slot: number) => `n${ring}_${slot}`;
const len = (pts: [number, number][]) => {
  let d = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1] as [number, number];
    const b = pts[i] as [number, number];
    d += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return d;
};

/** The belt road of a ring sits just inside its cells. */
const beltRoadRadius = (seed: string, ring: number, angle: number) =>
  beltRadius(seed, ring, angle) - RING_BAND - BELT_WIDTH / 2;

function beltPoint(seed: string, ring: number, angle: number): [number, number] {
  return ringPoint(seed, ring, angle, beltRoadRadius(seed, ring, angle));
}

/**
 * The road network as a graph: belts cut into arcs by their spokes, spokes between neighbouring
 * belts, and the avenue crossing the lot. Traffic (engine/traffic.ts) walks exactly this.
 */
export function buildRoads(seed: string, rings: number): RoadGraph {
  const nodes = new Map<string, RoadNode>();
  const edges = new Map<string, RoadEdge>();
  const addNode = (id: string, x: number, z: number, light = false) => {
    const existing = nodes.get(id);
    if (existing) return existing;
    const node: RoadNode = { id, x, z, edges: [], light };
    nodes.set(id, node);
    return node;
  };
  const addEdge = (edge: RoadEdge) => {
    edges.set(edge.id, edge);
    nodes.get(edge.from)?.edges.push(edge.id);
    nodes.get(edge.to)?.edges.push(edge.id);
  };

  const line = avenueLine(seed);
  /** Where the avenue crosses belt `ring` — two angles, one each side of the lake. */
  const avenueCrossings = (ring: number): { angle: number; t: number }[] => {
    const out: { angle: number; t: number }[] = [];
    const reach = FIRST_RING + (rings + 2) * RING_PITCH;
    const [cx, cz] = ringCentre(seed, ring);
    let previous: number | null = null;
    const steps = 400;
    for (let i = 0; i <= steps; i++) {
      const t = -reach + (2 * reach * i) / steps;
      const x = line.base[0] + line.dir[0] * t;
      const z = line.base[1] + line.dir[1] * t;
      // angle and distance measured from THIS belt's centre, which is not the lake's
      const angle = Math.atan2(z - cz, x - cx);
      const diff = Math.hypot(x - cx, z - cz) - beltRoadRadius(seed, ring, angle);
      if (previous !== null && previous < 0 !== diff < 0) out.push({ angle, t });
      previous = diff;
    }
    return out;
  };

  /** Junction angles of a belt: evenly spaced, plus wherever the avenue cuts through. */
  const beltJunctions = (ring: number): { angle: number; avenue: boolean }[] => {
    const n = cellsOnRing(ring);
    const spokes = Math.max(4, Math.round(n / SPOKE_EVERY));
    const list: { angle: number; avenue: boolean }[] = [];
    for (let j = 0; j < spokes; j++) {
      // on a cell BOUNDARY, never in the middle of one: a junction inside a cell would put its
      // spoke through somebody's garden
      const boundary = Math.round((j * n) / spokes) % n;
      list.push({ angle: (boundary / n) * Math.PI * 2 + ring * 0.31, avenue: false });
    }
    for (const crossing of avenueCrossings(ring)) {
      list.push({
        angle: ((crossing.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2),
        avenue: true,
      });
    }
    list.sort((a, b) => norm(a.angle) - norm(b.angle));
    // drop an even junction that lands on top of an avenue crossing
    return list.filter((item, i) => {
      if (item.avenue) return true;
      const next = list[(i + 1) % list.length];
      const prev = list[(i - 1 + list.length) % list.length];
      const close = (other?: { angle: number; avenue: boolean }) =>
        other?.avenue && Math.abs(norm(other.angle) - norm(item.angle)) < 0.18;
      return !close(next) && !close(prev);
    });
  };

  const junctionsByRing = new Map<number, { angle: number; avenue: boolean }[]>();
  for (let ring = 1; ring <= rings; ring++) junctionsByRing.set(ring, beltJunctions(ring));

  // every junction of every belt first: an edge added before its far node exists would never be
  // listed on that node, and the traffic would drive into a junction it cannot leave
  for (let ring = 1; ring <= rings; ring++) {
    const list = junctionsByRing.get(ring) as { angle: number; avenue: boolean }[];
    list.forEach((j, i) => {
      const p = beltPoint(seed, ring, j.angle);
      addNode(nodeId(ring, i), p[0], p[1], j.avenue);
    });
  }

  for (let ring = 1; ring <= rings; ring++) {
    const list = junctionsByRing.get(ring) as { angle: number; avenue: boolean }[];
    // belt arcs between neighbouring junctions
    for (let i = 0; i < list.length; i++) {
      const a0 = (list[i] as { angle: number }).angle;
      const next = (i + 1) % list.length;
      let a1 = (list[next] as { angle: number }).angle;
      if (a1 <= a0) a1 += Math.PI * 2;
      const steps = Math.max(3, Math.round(((a1 - a0) / (Math.PI * 2)) * 48));
      const points: [number, number][] = [];
      for (let s = 0; s <= steps; s++)
        points.push(beltPoint(seed, ring, a0 + ((a1 - a0) * s) / steps));
      // is the middle of this arc in one of the belt's green stretches?
      const midSlot =
        Math.round((((a0 + a1) / 2 - ring * 0.31) / (Math.PI * 2)) * cellsOnRing(ring)) %
        cellsOnRing(ring);
      const throughPark = cellRole(
        seed,
        indexOfCell(ring, (midSlot + cellsOnRing(ring)) % cellsOnRing(ring)),
      );
      const park = throughPark === "grove" || throughPark === "pond" || throughPark === "park";
      addEdge({
        id: `b${ring}_${i}`,
        from: nodeId(ring, i),
        to: nodeId(ring, next),
        points,
        kind: "belt",
        length: len(points),
        width: park ? 3.4 : BELT_WIDTH,
        park,
      });
    }
    // spokes out to the next belt, leaning into both ends so nothing is a straight radius
    if (ring < rings) {
      const outer = junctionsByRing.get(ring + 1) as { angle: number }[];
      list.forEach((j, i) => {
        if (j.avenue) return; // the avenue is its own road; it needs no spoke of its own
        if (i % 2 === 1) return; // every other junction has a spoke; the rest stay quiet corners
        let best = 0;
        let bestD = Number.POSITIVE_INFINITY;
        outer.forEach((o, oi) => {
          const d = Math.abs(((o.angle - j.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
          if (d < bestD) {
            bestD = d;
            best = oi;
          }
        });
        const aOut = (outer[best] as { angle: number }).angle;
        // A spoke leaves along its own cell boundary, swings across in the gap between the two
        // belts — where nobody lives — and arrives along the next boundary. Turning earlier would
        // take it through the fan of cells it is supposed to run beside.
        const delta = ((aOut - j.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        const clearIn = beltRadius(seed, ring, j.angle) + RING_BAND + 1;
        const clearOut = beltRadius(seed, ring + 1, aOut) - RING_BAND - 1;
        const radIn = beltRoadRadius(seed, ring, j.angle);
        const radOut = beltRoadRadius(seed, ring + 1, aOut);
        const steps = 8;
        const points: [number, number][] = [];
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const rad = radIn + (radOut - radIn) * t;
          const u =
            clearOut <= clearIn
              ? t
              : Math.max(0, Math.min(1, (rad - clearIn) / (clearOut - clearIn)));
          const angle = j.angle + delta * smooth(u);
          // the spoke leaves one belt and arrives at the next, and the two have different centres
          const [ix, iz] = ringPoint(seed, ring, angle, rad);
          const [ox, oz] = ringPoint(seed, ring + 1, angle, rad);
          points.push([ix + (ox - ix) * t, iz + (oz - iz) * t]);
        }
        addEdge({
          id: `s${ring}_${i}`,
          from: nodeId(ring, i),
          to: nodeId(ring + 1, best),
          points,
          kind: "spoke",
          length: len(points),
          width: SPOKE_WIDTH,
        });
      });
    }
  }

  // the avenue: one straight run past the lake, through every belt junction it created
  const stops: { id: string; t: number }[] = [];
  for (let ring = 1; ring <= rings; ring++) {
    const list = junctionsByRing.get(ring) as { angle: number; avenue: boolean }[];
    const crossings = avenueCrossings(ring);
    crossings.forEach((crossing) => {
      const at = list.findIndex(
        (j) => j.avenue && Math.abs(norm(j.angle) - norm(crossing.angle)) < 1e-6,
      );
      if (at >= 0) stops.push({ id: nodeId(ring, at), t: crossing.t });
    });
  }
  const reach = FIRST_RING + (rings - 1) * RING_PITCH + RING_BAND + 10;
  const endA = { id: "av-out0", t: -reach };
  const endB = { id: "av-out1", t: reach };
  for (const end of [endA, endB]) {
    addNode(end.id, line.base[0] + line.dir[0] * end.t, line.base[1] + line.dir[1] * end.t);
  }
  const ordered = [endA, ...stops, endB].sort((a, b) => a.t - b.t);
  for (let i = 1; i < ordered.length; i++) {
    const from = ordered[i - 1] as { id: string; t: number };
    const to = ordered[i] as { id: string; t: number };
    if (from.id === to.id) continue;
    const at = (t: number): [number, number] => [
      line.base[0] + line.dir[0] * t,
      line.base[1] + line.dir[1] * t,
    ];
    const a = nodes.get(from.id);
    const b = nodes.get(to.id);
    const points: [number, number][] = [
      a ? [a.x, a.z] : at(from.t),
      at((from.t + to.t) / 2),
      b ? [b.x, b.z] : at(to.t),
    ];
    addEdge({
      id: `av${i}`,
      from: from.id,
      to: to.id,
      points,
      kind: "avenue",
      length: len(points),
      width: AVENUE_WIDTH,
    });
  }
  bridgeTheWater(cityRiver(seed), edges);
  return { nodes, edges };
}

/**
 * A road that crosses the water gets a deck rather than tarmac laid on the river. The belts of a
 * grown city do reach the far bank, and a footpath drawn straight across the water was the first
 * thing that looked wrong when the town outgrew its river.
 */
export function bridgeTheWater(water: Waterways, edges: Map<string, RoadEdge>): void {
  for (const edge of edges.values()) {
    // the middle of the stretch, not merely an end dipping into a canal: a whole street raised on
    // a deck because its last house stands by the water would be a strange thing to look at
    const middle = edge.points[Math.floor(edge.points.length / 2)] as [number, number];
    if (!inRiver(water, middle[0], middle[1], 2)) continue;
    edge.overWater = true;
    edge.park = false;
    edge.width = Math.max(edge.width, BELT_WIDTH);
  }
}

const norm = (a: number) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

const smooth = (t: number) => t * t * (3 - 2 * t);

// ---------------------------------------------------------------------------------------------
// The layout itself
// ---------------------------------------------------------------------------------------------

export function layoutCity(needs: LayoutNeeds): CityLayout {
  // One city is the children's own town, drawn from its real plan (home-plan.ts, ADR-23).
  if (needs.seed === HOME_CITY) return layoutFromPlan(ECOPARK, needs);
  return layoutBelts(needs);
}

function layoutBelts(needs: LayoutNeeds): CityLayout {
  const seed = needs.seed;
  const count = cellsNeeded(needs);
  const rings = cellAt(count - 1).ring;

  const cells: LayoutCell[] = [];
  for (let index = 0; index < count; index++) {
    const { ring, slot } = cellAt(index);
    const angle = cellAngle(ring, slot);
    const radius = beltRadius(seed, ring, angle);
    const n = cellsOnRing(ring);
    const span = (Math.PI * 2) / n;
    // measured, not assumed: the belts wobble, so two neighbours are never the same distance apart
    const width = cellHalfWidth(seed, ring, slot) * 2;
    const depth = Math.min(RING_BAND * 1.1, 11);
    const corners: [number, number][] = [
      ringPoint(seed, ring, angle - span / 2, radius - RING_BAND),
      ringPoint(seed, ring, angle + span / 2, radius - RING_BAND),
      ringPoint(seed, ring, angle + span / 2, radius + RING_BAND),
      ringPoint(seed, ring, angle - span / 2, radius + RING_BAND),
    ];
    const [cellX, cellZ] = ringPoint(seed, ring, angle, radius);
    cells.push({
      index,
      ring,
      slot,
      x: cellX,
      z: cellZ,
      radius,
      angle,
      width,
      depth,
      role: cellRole(seed, index),
      corners,
      tall: isTall(seed, ring, slot),
    });
  }

  // contents, in index order — this is what keeps every building where it was
  const lots: LayoutLot[] = [];
  let skill = 0;
  let publicIndex = 0;
  let plot = 0;
  let filler = 0;
  for (const cell of cells) {
    if (cell.role === "park" || cell.role === "pond" || cell.role === "grove") continue;
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
    // The lot is the building's footprint, not the whole cell: a fan cell is wide at the back and
    // narrow at the front, and a building that filled it would clip its neighbour's corner. The
    // rest of the cell is lawn, hedge and trees.
    const side = Math.min(cell.width, cell.depth, LOT_MAX);
    lots.push({
      id: `r${cell.ring}s${cell.slot}`,
      cell,
      role: cell.role as LotRole,
      x: cell.x,
      z: cell.z,
      width: side,
      depth: side,
      // face the belt road, which is on the inner side
      facing: -cell.angle + Math.PI / 2,
      content,
    });
  }

  const roads = buildRoads(seed, rings);

  const districts: District[] = [];
  for (let ring = 1; ring <= rings; ring++) {
    // spread the signs around the town rather than stacking them all on one side
    const angle = avenueAngle(seed) + 0.9 + ring * ((Math.PI * 2) / 5);
    const radius = beltRadius(seed, ring, angle) - RING_BAND - BELT_WIDTH;
    districts.push({
      ring,
      name: districtName(seed, ring),
      sign: {
        x: ringPoint(seed, ring, angle, radius)[0],
        z: ringPoint(seed, ring, angle, radius)[1],
        angle: -angle,
      },
      radius: ring * RING_PITCH,
    });
  }

  const lakePoints: [number, number][] = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const rad = LAKE_RADIUS + beltWobble(`${seed}:lake`, 0, a) * 0.32;
    lakePoints.push([Math.cos(a) * rad, Math.sin(a) * rad]);
  }

  const ponds = cells
    .filter((c) => c.role === "pond")
    .map((c) => ({ x: c.x, z: c.z, radius: Math.min(c.width, c.depth) * 0.62 }));
  const groves = cells
    .filter((c) => c.role === "grove")
    .map((c) => ({ x: c.x, z: c.z, radius: Math.min(c.width, c.depth) * 0.7 }));

  const reach = FIRST_RING + (rings - 1) * RING_PITCH + RING_BAND + 8;
  const avenue: [number, number][] = [];
  {
    const a = avenueAngle(seed);
    for (let t = -reach; t <= reach; t += reach / 8)
      avenue.push([Math.cos(a) * t, Math.sin(a) * t]);
  }

  // the town hall stands on a peninsula poking into the lake, looking back at the city
  const hallAngle = avenueAngle(seed) + Math.PI / 2;
  // on the shore, on a tongue of land poking into the water — not in the middle of the lake
  const townHall = {
    x: Math.cos(hallAngle) * (LAKE_RADIUS + 1.5),
    z: Math.sin(hallAngle) * (LAKE_RADIUS + 1.5),
    facing: -hallAngle + Math.PI,
  };

  const wonderAngle = cellAngle(WONDER_CELL.ring, WONDER_CELL.slot);
  const [wonderX, wonderZ] = ringPoint(
    seed,
    WONDER_CELL.ring,
    wonderAngle,
    beltRadius(seed, WONDER_CELL.ring, wonderAngle),
  );
  const wonder = { x: wonderX, z: wonderZ };

  const decorSpots = cells
    .filter((c) => c.role === "park" || c.role === "grove")
    .map((c) => ({ x: c.x, z: c.z }));

  return {
    cells,
    lots,
    roads,
    districts,
    rings,
    edge: FIRST_RING + (rings - 1) * RING_PITCH + RING_BAND,
    avenue,
    lake: { x: 0, z: 0, radius: LAKE_RADIUS, points: lakePoints },
    ponds,
    groves,
    bounds: { minX: -reach, maxX: reach, minZ: -reach, maxZ: reach },
    townHall,
    wonder,
    decorSpots,
  };
}

/** Points along a road edge, for drawing the ribbon and for the traffic. */
export function edgePoints(edge: RoadEdge, reversed: boolean): [number, number][] {
  return reversed ? [...edge.points].reverse() : edge.points;
}
