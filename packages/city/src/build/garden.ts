// The garden round a house: a front yard, a path out to the lane, and a little planting
// (owner, 16/09: "Mỗi nhà có thêm đường đi vào, sân, tiểu cảnh cho đẹp").
//
// Every house in the grid city faces south (+z, the camera side): its door is on that face. A lot
// is 2×2 tiles; what is left round the building differs a great deal from one city and one level
// to the next (a first house is 3.4 wide, some fourth-level ones fill the lot), so everything here
// is placed from the building's real footprint, never from fixed numbers. Houses on the street
// side of a block have pedestrians walking along their outer edge: nothing taller than paving goes
// in that strip.

import type { Object3D } from "three";
import { WORLD } from "../palette";
import { add, box, cbox, cone, group, pick, quad, rng } from "./kit";
import { bush } from "./props";

/** Half a lot, in world units (a lot is two tiles of 3.2). */
export const LOT_HALF = 3.2;
/** The strip along a street side where people walk. */
const WALK_BAND = 0.62;
const PAVING = 0xf3e6cc;
const EDGING = 0xd9c9a8;

export interface Footprint {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Which sides of the lot are on a street (−1 / +1), the others face the block's own lane. */
export interface StreetSides {
  x: -1 | 1;
  z: -1 | 1;
}

export interface Garden {
  root: Object3D;
  /** What went in, for tests and for the budget. */
  parts: ("yard" | "path" | "hedge" | "bushes" | "flowers")[];
}

/**
 * A flower bed at a garden's price: a raised bed and three flowers. The town's big beds
 * (props.flowerBed) plant a flower every fifth of a square unit, which is eighty triangles a bed —
 * a hundred houses of those is more than the budget has room for (ADR-20: Phố Chữ at its largest
 * was already within 1% of it).
 */
function gardenBed(w: number, d: number, seed: number): Object3D {
  const g = group();
  const r = rng(seed);
  add(g, box(w, 0.22, d, 0xc98f5e), 0, 0.11, 0);
  const colours = [0xff6fa5, 0xffd447, 0xffffff, 0xb283e0, 0xff8f4a];
  for (let i = 0; i < 3; i++) {
    const flower = cone(0.14, 0.2, pick(colours, Math.floor(r() * colours.length)), 4);
    flower.rotation.x = Math.PI;
    add(g, flower, (r() - 0.5) * (w - 0.3), 0.34, (i - 1) * (d / 3.2));
  }
  return g;
}

/**
 * Paving laid flat: two triangles. A thin box costs six, and its edges are never seen from the
 * city camera.
 */
function paving(w: number, d: number, colour: number): Object3D {
  const p = quad(w, d, colour);
  p.rotation.x = -Math.PI / 2;
  return planted(p);
}

/** `add` sets the position, and a bush keeps its own lift above the ground in its position. */
function planted(obj: Object3D): Object3D {
  const holder = group();
  holder.add(obj);
  return holder;
}

/** Keep something of half-size `half` out of the walking strip on the street sides. */
function clampOffStreet(v: number, half: number, street: -1 | 1): number {
  const limit = LOT_HALF - WALK_BAND - half;
  return street > 0 ? Math.min(v, limit) : Math.max(v, -limit);
}

export function lotGarden(f: Footprint, seed: number, street: StreetSides): Garden {
  const g = group();
  const parts: Garden["parts"] = [];
  const r = rng(seed * 7 + 13);
  const width = f.maxX - f.minX;
  const centreX = (f.minX + f.maxX) / 2;

  // ---------------------------------------------------------------- the front: yard and path
  const front = LOT_HALF - f.maxZ;
  let pathFrom = f.maxZ;
  if (front >= 0.35) {
    // a strip too short for a path is paved as part of the yard
    const depth = front - 0.95 < 0.35 ? front : 0.95;
    // as wide as the house and a little more, but never past the lot (some houses overhang it)
    const left = Math.max(f.minX - 0.2, -LOT_HALF + 0.1);
    const right = Math.min(f.maxX + 0.2, LOT_HALF - 0.1);
    const yardWidth = right - left;
    const yardX = (left + right) / 2;
    add(g, paving(yardWidth, depth, PAVING), yardX, 0.15, f.maxZ + depth / 2);
    // a thin edging, so the yard reads as built rather than as a patch of sand
    add(g, paving(yardWidth, 0.08, EDGING), yardX, 0.16, f.maxZ + depth - 0.04);
    parts.push("yard");
    pathFrom = f.maxZ + depth;
  }
  if (LOT_HALF - pathFrom > 0.05) {
    // the door of a `building()` house is right of centre; a Kenney house's is near the middle,
    // and the yard spans the whole front either way
    const doorX = Math.max(-LOT_HALF + 0.5, Math.min(LOT_HALF - 0.5, centreX + (width / 2) * 0.45));
    const length = LOT_HALF - pathFrom;
    add(g, paving(0.8, length, PAVING), doorX, 0.15, pathFrom + length / 2);
    parts.push("path");
  }

  // ---------------------------------------------------------------- the sides
  const sides = [
    { side: -1 as const, band: f.minX + LOT_HALF, centre: (f.minX - LOT_HALF) / 2 },
    { side: 1 as const, band: LOT_HALF - f.maxX, centre: (f.maxX + LOT_HALF) / 2 },
  ];
  const length = Math.max(0.8, Math.min(f.maxZ - f.minZ, LOT_HALF * 2 - 1.4));
  const midZ = (f.minZ + Math.min(f.maxZ, LOT_HALF - 0.7)) / 2;
  const choices = ["hedge", "bushes", "flowers"] as const;
  const first = Math.floor(r() * 3);
  // one planting per lot: the camera looks from the south-east, so the east side is the one that
  // is seen; the west side mostly hides behind the house (and every triangle counts, ADR-20)
  let plantedOne = false;
  [sides[1], sides[0]].forEach((s_, i) => {
    const { side, band, centre } = s_ as (typeof sides)[number];
    if (plantedOne || band < 0.7) return;
    const kind = choices[(first + i) % 3] as (typeof choices)[number];
    const onStreet = street.x === side;
    const bedWidth = Math.min(0.9, band - 0.15);
    const half = kind === "hedge" ? 0.25 : kind === "bushes" ? 0.35 : bedWidth / 2;
    const x = onStreet ? clampOffStreet(centre, half, side) : centre;
    // no room once the walking strip is taken out
    if (onStreet && Math.abs(x) + half > LOT_HALF - WALK_BAND + 0.01) return;
    if (side < 0 ? x - half < -LOT_HALF : x + half > LOT_HALF) return;
    if (side < 0 ? x + half > f.minX : x - half < f.maxX) return;
    if (kind === "flowers") {
      add(g, gardenBed(bedWidth, Math.min(length, 2.4), seed + i), x, 0.1, midZ);
      parts.push("flowers");
      plantedOne = true;
    } else if (kind === "hedge") {
      add(
        g,
        cbox(0.5, 0.55, Math.min(length, 2.6), WORLD.leaves[2] ?? 0x3fae3a, 0.12),
        x,
        0.4,
        midZ,
      );
      parts.push("hedge");
      plantedOne = true;
    } else {
      const n = 2;
      for (let k = 0; k < n; k++) {
        const z = midZ + (k - (n - 1) / 2) * (length / n);
        const leaves = WORLD.leaves[(k + seed) % WORLD.leaves.length];
        add(g, planted(bush(leaves, 0.9 + r() * 0.3)), x, 0.1, z);
      }
      parts.push("bushes");
      plantedOne = true;
    }
  });

  return { root: g, parts };
}

/**
 * The lane through the middle of a block, east to west. The houses on the north half of a block
 * face it (their doors are on the south face), so it is how they get out.
 */
export function blockLane(length: number, seed: number): Object3D {
  const g = group();
  add(g, paving(length, 1.7, PAVING), 0, 0.15, 0);
  for (const z of [-0.9, 0.9]) add(g, paving(length, 0.08, EDGING), 0, 0.16, z);
  // one planter along it, off the middle where the child's decorations stand
  const r = rng(seed);
  const p = group();
  add(p, box(0.7, 0.3, 0.5, 0xc98f5e), 0, 0.3, 0);
  add(p, planted(bush(WORLD.leaves[Math.floor(r() * WORLD.leaves.length)], 0.8)), 0, 0.4, 0);
  add(g, p, (r() < 0.5 ? -1 : 1) * length * 0.3, 0, 0);
  return g;
}
