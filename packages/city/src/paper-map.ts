// The paper map (pha 12 việc 5): what the child sees when they pull the camera all the way out.
//
// It is not the 3D city seen from higher up — it is a drawing of it, the way a town hands you a
// paper map at the gate: water blue, parks green, roads white, every district named, and a light
// on the places where tonight's work is waiting. A whole year of building fits on one screen, which
// is the only way a six-year-old ever sees what they have made.
//
// Pure data: no three.js, no canvas. The web draws it (components/kid/city/paper-map.tsx).

import type { CityView } from "@mtct/core";
import { type CityLayout, layoutCity, needsOf } from "./layout";
import { cityWaterways, type Waterways } from "./waterways";

export interface PaperMap {
  /** Half-width of the drawing in world units; the view is [-extent, extent] on both axes. */
  extent: number;
  water: {
    lake: [number, number][];
    river: [number, number][];
    riverWidth: number;
    /** The canals of a town drawn from a plan; empty for the invented cities. */
    canals: { points: [number, number][]; width: number }[];
    ponds: { x: number; z: number; radius: number }[];
  };
  green: { x: number; z: number; radius: number }[];
  roads: { points: [number, number][]; width: number; kind: string }[];
  districts: { name: string; x: number; z: number; radius: number }[];
  /**
   * Buildings as short strips along their belt — a printed map draws a terrace as a block, not as a
   * dot, and a field of identical dots is unpleasant to look at (owner, 16/09).
   */
  blocks: { from: [number, number]; to: [number, number]; built: boolean; tall: boolean }[];
  /** Tonight's missions — the lights on the map. */
  missions: { x: number; z: number; label: string }[];
  landmarks: {
    townHall: { x: number; z: number };
    wonder: { x: number; z: number };
    harbour: { x: number; z: number };
    bridge: { x: number; z: number } | null;
  };
}

export function paperMap(view: CityView, layout?: CityLayout, water?: Waterways): PaperMap {
  const l = layout ?? layoutCity(needsOf(view));
  const w = water ?? cityWaterways(view.subject, l.rings);

  const missions: PaperMap["missions"] = [];
  for (const lot of l.lots) {
    if (lot.content.type !== "skill") continue;
    const skill = view.skills[lot.content.skill];
    if (skill?.mission) missions.push({ x: lot.x, z: lot.z, label: skill.label });
  }

  return {
    extent: l.bounds.maxX,
    water: {
      lake: l.lake.points,
      river: w.river,
      riverWidth: w.style.width,
      canals: w.canals,
      ponds: l.ponds,
    },
    green: l.groves,
    roads: [...l.roads.edges.values()].map((e) => ({
      points: e.points,
      width: e.width,
      kind: e.park ? "path" : e.kind,
    })),
    districts: l.districts.map((d) => ({
      name: d.name,
      x: d.sign.x,
      z: d.sign.z,
      radius: d.radius,
    })),
    blocks: l.lots.map((lot) => {
      // along the belt: the cell's tangential direction
      const tx = -Math.sin(lot.cell.angle);
      const tz = Math.cos(lot.cell.angle);
      const half = lot.width / 2;
      return {
        from: [lot.x - tx * half, lot.z - tz * half] as [number, number],
        to: [lot.x + tx * half, lot.z + tz * half] as [number, number],
        built:
          lot.content.type === "skill"
            ? (view.skills[lot.content.skill]?.level ?? 0) > 0
            : lot.content.type === "public" || lot.content.type === "plot",
        tall: lot.cell.tall,
      };
    }),
    missions,
    landmarks: {
      townHall: { x: l.townHall.x, z: l.townHall.z },
      wonder: l.wonder,
      harbour: { x: w.harbour.x, z: w.harbour.z },
      bridge: w.bridgeBuilt ? { x: w.bridge.x, z: w.bridge.z } : null,
    },
  };
}

/**
 * Which district a point on the paper map belongs to — for "tap a district, fly there".
 *
 * The nearest sign wins. It used to be the nearest belt by radius, which is only right for a town
 * built in rings; the children's own town is not, and tapping Aqua Bay flew them to Park River.
 */
export function districtAt(
  map: PaperMap,
  x: number,
  z: number,
): PaperMap["districts"][number] | null {
  let best: PaperMap["districts"][number] | null = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const d of map.districts) {
    const distance = Math.hypot(x - d.x, z - d.z);
    if (distance < bestD) {
      bestD = distance;
      best = d;
    }
  }
  return best;
}
