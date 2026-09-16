// Traffic on the chessboard city: cars, buses and people wander the road grid instead of each
// circling one block for ever (owner, 16/09: "xe ô tô vẫn đang chạy vòng tròn … người cũng đi vòng
// tròn"). Pure: no three.js, so it is tested like the layout.
//
// The roads of the grid city are rings of tiles around every block (layout.ts), so the network is a
// lattice: a junction every BLOCK_PITCH tiles, a straight street between two neighbouring
// junctions. A mover goes junction to junction; at each one it picks the next street — straight
// ahead most of the time, a turn now and then, back the way it came only at a dead end (a person
// may also just turn round, and stops to look about). Corners are driven as curves, not as a snap
// of the heading. The choices come from a seeded random stream, so a reload shows the same town.

import { BLOCK_PITCH, TILE, tileToWorld } from "../layout";

export interface Junction {
  key: string;
  x: number;
  z: number;
  /** Keys of the junctions one street away. */
  links: string[];
}

export type RoadGrid = Map<string, Junction>;

/** The street lattice hidden in the set of road tiles. */
export function roadGrid(roads: ReadonlySet<string>): RoadGrid {
  const grid: RoadGrid = new Map();
  const isJunction = (tx: number, tz: number) =>
    tx % BLOCK_PITCH === 0 && tz % BLOCK_PITCH === 0 && roads.has(`${tx},${tz}`);
  for (const key of roads) {
    const [tx, tz] = key.split(",").map(Number) as [number, number];
    if (!isJunction(tx, tz)) continue;
    const links: string[] = [];
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      let whole = true;
      for (let step = 1; step <= BLOCK_PITCH && whole; step++)
        whole = roads.has(`${tx + dx * step},${tz + dz * step}`);
      if (whole) links.push(`${tx + dx * BLOCK_PITCH},${tz + dz * BLOCK_PITCH}`);
    }
    grid.set(key, { key, x: tileToWorld(tx), z: tileToWorld(tz), links });
  }
  return grid;
}

/** A small deterministic random stream (mulberry32). */
export function rngFrom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type MoverKind = "car" | "bus" | "person";

export interface Mover {
  kind: MoverKind;
  /** The junction before `from`, so the curve out of `from` matches the curve into it. */
  prev: string;
  /** The street it is on: from junction → to junction, and how far along (0…1). */
  from: string;
  to: string;
  along: number;
  /** The street it will take at `to` — chosen on entering, so the corner can be curved. */
  next: string;
  /** World units per second. */
  speed: number;
  /** Seconds left standing still (people stop to look about). */
  pause: number;
  random: () => number;
}

/** How far a mover keeps to the right of the street's middle. */
export const LANE = { car: TILE * 0.22, bus: TILE * 0.22, person: TILE * 0.62 } as const;
/**
 * How much of each street end is spent going round the corner. A car turning right cuts the
 * corner by a quarter of this, so a vehicle takes it tight (a wide curve put its bumper over the
 * kerb); someone on foot swings round the pavement corner.
 */
const CORNER = { car: TILE * 0.6, bus: TILE * 0.6, person: TILE * 0.9 } as const;

/** Straight on 6, a turn 3, back only when there is no other way (people: now and then). */
export function chooseNext(
  grid: RoadGrid,
  from: string,
  at: string,
  kind: MoverKind,
  random: () => number,
): string {
  const here = grid.get(at);
  if (!here || here.links.length === 0) return from;
  const a = grid.get(from);
  const dirIn = a ? [Math.sign(here.x - a.x), Math.sign(here.z - a.z)] : [0, 0];
  const options = here.links.map((key) => {
    const b = grid.get(key) as Junction;
    const dir = [Math.sign(b.x - here.x), Math.sign(b.z - here.z)];
    const dot =
      (dirIn[0] as number) * (dir[0] as number) + (dirIn[1] as number) * (dir[1] as number);
    const weight = dot > 0 ? 6 : dot === 0 ? 3 : kind === "person" ? 0.4 : 0;
    return { key, weight };
  });
  const total = options.reduce((sum, o) => sum + o.weight, 0);
  if (total === 0) return from; // a dead end: turn round
  let pick = random() * total;
  for (const o of options) {
    pick -= o.weight;
    if (pick < 0) return o.key;
  }
  return (options[options.length - 1] as { key: string }).key;
}

const SPEED = { car: 5.5, bus: 4, person: 1.1 } as const;

/** Put `count` movers of a kind on the grid, spread over its streets. */
export function spawn(grid: RoadGrid, kind: MoverKind, count: number, seed: number): Mover[] {
  const streets: [string, string][] = [];
  for (const j of grid.values()) for (const l of j.links) streets.push([j.key, l]);
  if (streets.length === 0) return [];
  const out: Mover[] = [];
  for (let i = 0; i < count; i++) {
    const random = rngFrom(seed + i * 7919);
    const [from, to] = streets[Math.floor(random() * streets.length)] as [string, string];
    out.push({
      kind,
      prev: behind(grid, from, to),
      from,
      to,
      along: random(),
      next: chooseNext(grid, from, to, kind, random),
      speed: SPEED[kind] * (0.8 + random() * 0.4),
      pause: 0,
      random,
    });
  }
  return out;
}

/** Keep a mover whose street still exists after the city grew; put the others somewhere new. */
export function stillOnTheRoad(grid: RoadGrid, m: Mover): boolean {
  return (
    (grid.get(m.from)?.links.includes(m.to) ?? false) &&
    (grid.get(m.to)?.links.includes(m.next) ?? false)
  );
}

/** Move one mover on; `limit` is how far along its street it may go this frame (a red light, a queue). */
export function step(grid: RoadGrid, m: Mover, dt: number, limit = Number.POSITIVE_INFINITY): void {
  if (m.pause > 0) {
    m.pause = Math.max(0, m.pause - dt);
    return;
  }
  const a = grid.get(m.from);
  const b = grid.get(m.to);
  if (!a || !b) return;
  const length = Math.hypot(b.x - a.x, b.z - a.z) || 1;
  // never backwards: a queue that closes up behind a stopped car only holds it where it is
  m.along = Math.max(m.along, Math.min(m.along + (m.speed * dt) / length, limit));
  while (m.along >= 1) {
    m.along -= 1;
    m.prev = m.from;
    m.from = m.to;
    m.to = m.next;
    m.next = chooseNext(grid, m.from, m.to, m.kind, m.random);
    // someone on foot stops at one corner in five, for a moment, before going on
    if (m.kind === "person" && m.random() < 0.2) {
      m.pause = 1 + m.random() * 2.5;
      m.along = 0;
      break;
    }
  }
}

export interface Placement {
  x: number;
  z: number;
  /** rotation.y for a model that faces +x */
  heading: number;
}

/** A point on a street, kept to the right of its middle. */
function onStreet(
  a: Junction,
  b: Junction,
  distance: number,
  lane: number,
): { x: number; z: number; dx: number; dz: number } {
  const length = Math.hypot(b.x - a.x, b.z - a.z) || 1;
  const dx = (b.x - a.x) / length;
  const dz = (b.z - a.z) / length;
  // the right-hand side of the direction of travel, seen from above with z pointing south
  return { x: a.x + dx * distance - dz * lane, z: a.z + dz * distance + dx * lane, dx, dz };
}

const headingOf = (dx: number, dz: number) => Math.atan2(-dz, dx);

/** Where a mover is, and which way it faces — curving through the corner at either end. */
export function place(grid: RoadGrid, m: Mover): Placement {
  const a = grid.get(m.from);
  const b = grid.get(m.to);
  if (!a || !b) return { x: 0, z: 0, heading: 0 };
  const lane = LANE[m.kind];
  const length = Math.hypot(b.x - a.x, b.z - a.z) || 1;
  const d = m.along * length;
  const corner = Math.min(CORNER[m.kind], length / 3);

  if (d > length - corner) {
    // coming into the junction: curve from this street onto the next one
    const c = grid.get(m.next) ?? a;
    return curve(a, b, c, lane, corner, (d - (length - corner)) / corner / 2);
  }
  if (d < corner) {
    // leaving the junction: the second half of the curve that brought it here
    const prev = grid.get(m.prev) ?? straightBehind(a, b);
    return curve(prev, a, b, lane, corner, 0.5 + d / corner / 2);
  }
  const p = onStreet(a, b, d, lane);
  return { x: p.x, z: p.z, heading: headingOf(p.dx, p.dz) };
}

/** A junction-shaped point straight behind `a`, for a mover that has only just been put down. */
function straightBehind(a: Junction, b: Junction): Junction {
  return { key: "", x: a.x - (b.x - a.x), z: a.z - (b.z - a.z), links: [] };
}

/** The key of the junction straight behind `from` (it may not exist: then the curve is made up). */
function behind(grid: RoadGrid, from: string, to: string): string {
  const [fx, fz] = from.split(",").map(Number) as [number, number];
  const [tx, tz] = to.split(",").map(Number) as [number, number];
  const key = `${2 * fx - tx},${2 * fz - tz}`;
  return grid.has(key) ? key : "";
}

/**
 * A quadratic curve through the junction `mid`, from `corner` before it on the street from `from`
 * to `corner` after it on the street to `to`, both kept to the right. `t` runs 0…1 over the curve.
 */
function curve(
  from: Junction,
  mid: Junction,
  to: Junction,
  lane: number,
  corner: number,
  t: number,
): Placement {
  const inLength = Math.hypot(mid.x - from.x, mid.z - from.z) || 1;
  const p0 = onStreet(from, mid, inLength - corner, lane);
  const p2 = onStreet(mid, to, corner, lane);
  // the control point: where the two lanes would meet
  const inDir = [(mid.x - from.x) / inLength, (mid.z - from.z) / inLength] as const;
  const outLength = Math.hypot(to.x - mid.x, to.z - mid.z) || 1;
  const outDir = [(to.x - mid.x) / outLength, (to.z - mid.z) / outLength] as const;
  const straight = Math.abs(inDir[0] * outDir[0] + inDir[1] * outDir[1]) > 0.99;
  const p1 = straight
    ? { x: (p0.x + p2.x) / 2, z: (p0.z + p2.z) / 2 }
    : {
        x: mid.x - inDir[1] * lane - outDir[1] * lane,
        z: mid.z + inDir[0] * lane + outDir[0] * lane,
      };
  const u = Math.min(1, Math.max(0, t));
  const x = (1 - u) * (1 - u) * p0.x + 2 * (1 - u) * u * p1.x + u * u * p2.x;
  const z = (1 - u) * (1 - u) * p0.z + 2 * (1 - u) * u * p1.z + u * u * p2.z;
  const tx = 2 * (1 - u) * (p1.x - p0.x) + 2 * u * (p2.x - p1.x);
  const tz = 2 * (1 - u) * (p1.z - p0.z) + 2 * u * (p2.z - p1.z);
  return { x, z, heading: headingOf(tx, tz) };
}

// ---------------------------------------------------------------------------------------------
// Traffic lights (owner, 16/09: "ngã tư làm thêm đèn xanh đèn đỏ")
// ---------------------------------------------------------------------------------------------

export type LightColour = "green" | "amber" | "red";

/** Seconds for one full turn of a junction's lights. */
export const LIGHT_CYCLE = 13;

/**
 * Lights at a crossroads, where four streets meet ("ngã tư"). A T-junction, a bend or a dead end
 * has none: a light on every corner of a toy town is clutter, and a car that stops at every one of
 * them never gets anywhere.
 */
export const hasLights = (grid: RoadGrid, key: string): boolean =>
  (grid.get(key)?.links.length ?? 0) === 4;

/**
 * What a junction shows to traffic running along x (east–west) or along z (north–south).
 * Half a second of red both ways between the two, so nobody meets in the middle. Each junction
 * starts its cycle at its own moment, so the town does not blink in step.
 */
export function lightAt(key: string, axis: "x" | "z", time: number): LightColour {
  const offset = ((seedOf(key) % 1000) / 1000) * LIGHT_CYCLE;
  const t = (((time + offset) % LIGHT_CYCLE) + LIGHT_CYCLE) % LIGHT_CYCLE;
  if (axis === "x") return t < 0.5 ? "red" : t < 5.5 ? "green" : t < 7 ? "amber" : "red";
  return t < 7.5 ? "red" : t < 11.5 ? "green" : "amber";
}

/** Where a vehicle waits: this far before the curve into the junction. */
const STOP_GAP = TILE * 0.35;
/** Bumper to bumper, a car and a half apart. */
const QUEUE_GAP = 2.4;

const streetLength = (grid: RoadGrid, from: string, to: string) => {
  const a = grid.get(from);
  const b = grid.get(to);
  return a && b ? Math.hypot(b.x - a.x, b.z - a.z) || 1 : 1;
};

/**
 * One frame for everyone: vehicles stop at a red light (and at amber, if there is still room to),
 * and wait behind the vehicle in front of them; people walk on.
 */
export function stepAll(grid: RoadGrid, movers: Mover[], dt: number, time: number): void {
  for (const m of movers) {
    let limit = Number.POSITIVE_INFINITY;
    if (m.kind !== "person") {
      const length = streetLength(grid, m.from, m.to);
      const corner = Math.min(CORNER[m.kind], length / 3);
      const stopAt = (length - corner - STOP_GAP) / length;
      if (m.along <= stopAt && hasLights(grid, m.to)) {
        const a = grid.get(m.from) as Junction;
        const b = grid.get(m.to) as Junction;
        const light = lightAt(m.to, Math.abs(b.x - a.x) > Math.abs(b.z - a.z) ? "x" : "z", time);
        const room = (stopAt - m.along) * length;
        if (light === "red" || (light === "amber" && room > 1.5)) limit = stopAt;
      }
      const nextLength = streetLength(grid, m.to, m.next);
      for (const o of movers) {
        if (o === m || o.kind === "person") continue;
        if (o.from === m.from && o.to === m.to && o.along > m.along)
          limit = Math.min(limit, o.along - QUEUE_GAP / length);
        // just round the corner, on the street it is about to take: do not come out on top of it
        if (o.from === m.to && o.to === m.next) {
          const ahead = o.along * nextLength;
          if (ahead < QUEUE_GAP) limit = Math.min(limit, 1 - (QUEUE_GAP - ahead) / length);
        }
      }
    }
    step(grid, m, dt, limit);
  }
}
