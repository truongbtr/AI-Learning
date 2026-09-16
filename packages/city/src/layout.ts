// City layout — pure, deterministic, no three.js.
//
// The city is a grid of 5×5-tile blocks separated by 1-tile roads (pitch 6 tiles). Each block holds
// four 2×2-tile lots around a 1-tile garden cross. Block 0 (centre) is the town hall, one fixed
// block holds the wonder, the rest are handed out in a spiral from the centre.
//
// Stability rule: a lot's ROLE depends only on its block's spiral index, never on how many skills,
// badges or plots exist. So a new skill, badge or plot fills the next free lot of its role and no
// building ever moves. Lots of a role that is not in use yet show decor (houses, small gardens).

import type { CityView } from "@mtct/core";

export const TILE = 3.2;
export const BLOCK_PITCH = 6; // tiles: 5 interior + 1 road
export const LOT_TILES = 2;
/**
 * Blocks on day one: a new city is two streets and the town hall, the rest is grass, forest and
 * water waiting for land (Pha 10 bổ sung §5). The city grows with the child.
 */
export const MIN_BLOCKS = 2;
/** Plots shown behind a fence ahead of what the kid owns (it carries the star cost, "70★"). */
export const LOCKED_PLOTS_SHOWN = 1;

export type BlockKind = "townhall" | "wonder" | "lots";
export type LotRole = "skill" | "public" | "plot";
export type LotSlot = 0 | 1 | 2 | 3;

export interface LayoutBlock {
  bx: number;
  bz: number;
  kind: BlockKind;
  /** Spiral index among "lots" blocks (−1 for town hall / wonder). */
  index: number;
  x: number;
  z: number;
}

export type LotContent =
  | { type: "skill"; skill: number }
  | { type: "public"; publicIndex: number }
  | { type: "plot"; plot: number; state: "owned" | "locked" }
  | { type: "decorHouse"; variant: number }
  | { type: "garden"; variant: number };

export interface LayoutLot {
  /** Stable id: `${bx},${bz}:${slot}` (public lots use their first slot). */
  id: string;
  block: LayoutBlock;
  role: LotRole;
  slots: LotSlot[];
  /** World centre of the lot (or half-block for public buildings). */
  x: number;
  z: number;
  /** Footprint in world units (x, z). */
  width: number;
  depth: number;
  content: LotContent;
}

export interface CityLayout {
  blocks: LayoutBlock[];
  lots: LayoutLot[];
  /** Road tiles as "tx,tz" in tile coordinates (tile t centre is at world (t − 3)·TILE). */
  roads: Set<string>;
  /** Tile-space bounds of everything built (roads included). */
  tiles: { minX: number; maxX: number; minZ: number; maxZ: number };
  /** World-space bounds of the built city. */
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  townHall: { x: number; z: number };
  wonder: { x: number; z: number };
  /** Block-centre garden crossings, in spiral order — decorations are placed here. */
  decorSpots: { x: number; z: number }[];
}

export const WONDER_BLOCK = { bx: -1, bz: -1 } as const;

export const tileToWorld = (t: number) => (t - 3) * TILE;
export const blockCenter = (b: number) => b * BLOCK_PITCH * TILE;

const SLOT_OFFSET: Record<LotSlot, [number, number]> = {
  0: [-1.5, -1.5],
  1: [1.5, -1.5],
  2: [-1.5, 1.5],
  3: [1.5, 1.5],
};

/** Roles of the four slots of the lots-block with spiral index k. Pure function of k. */
export function slotRoles(k: number): Record<LotSlot, LotRole> {
  const roles: Record<LotSlot, LotRole> = { 0: "skill", 1: "skill", 2: "skill", 3: "skill" };
  if (k % 3 === 1) {
    roles[0] = "public";
    roles[1] = "public";
  }
  if (k % 2 === 1) roles[3] = "plot";
  return roles;
}

/** Blocks around the centre ordered ring by ring, then by angle — identical for every city. */
export function spiralBlocks(count: number): { bx: number; bz: number }[] {
  const out: { bx: number; bz: number }[] = [];
  for (let ring = 1; out.length < count; ring++) {
    const ringBlocks: { bx: number; bz: number; a: number }[] = [];
    for (let bx = -ring; bx <= ring; bx++) {
      for (let bz = -ring; bz <= ring; bz++) {
        if (Math.max(Math.abs(bx), Math.abs(bz)) !== ring) continue;
        if (bx === WONDER_BLOCK.bx && bz === WONDER_BLOCK.bz) continue;
        // start on the camera side (+x,+z) so early blocks sit in front of the town hall
        const a = (Math.atan2(bz, bx) - Math.PI / 4 + Math.PI * 4) % (Math.PI * 2);
        ringBlocks.push({ bx, bz, a });
      }
    }
    ringBlocks.sort((p, q) => p.a - q.a);
    for (const b of ringBlocks) {
      if (out.length >= count) break;
      out.push({ bx: b.bx, bz: b.bz });
    }
  }
  return out;
}

export interface LayoutNeeds {
  skills: number;
  publics: number;
  plotsOwned: number;
}

export function needsOf(view: Pick<CityView, "skills" | "publicBuildings" | "land">): LayoutNeeds {
  return {
    skills: view.skills.length,
    publics: view.publicBuildings.length,
    plotsOwned: view.land.owned,
  };
}

/** How many lots-blocks are needed so every role has room (plus the locked plots on show). */
export function blocksNeeded(needs: LayoutNeeds): number {
  let skills = 0;
  let publics = 0;
  let plots = 0;
  let k = 0;
  const plotsWanted = needs.plotsOwned + LOCKED_PLOTS_SHOWN;
  while (
    skills < needs.skills ||
    publics < needs.publics ||
    plots < plotsWanted ||
    k < MIN_BLOCKS
  ) {
    const roles = slotRoles(k);
    for (const slot of [0, 1, 2, 3] as LotSlot[]) {
      if (roles[slot] === "skill") skills++;
      if (roles[slot] === "plot") plots++;
    }
    if (roles[0] === "public") publics++;
    k++;
  }
  return k;
}

export function layoutCity(needs: LayoutNeeds): CityLayout {
  const count = blocksNeeded(needs);
  const blocks: LayoutBlock[] = [
    { bx: 0, bz: 0, kind: "townhall", index: -1, x: 0, z: 0 },
    {
      bx: WONDER_BLOCK.bx,
      bz: WONDER_BLOCK.bz,
      kind: "wonder",
      index: -1,
      x: blockCenter(WONDER_BLOCK.bx),
      z: blockCenter(WONDER_BLOCK.bz),
    },
  ];
  spiralBlocks(count).forEach((b, index) => {
    blocks.push({ ...b, kind: "lots", index, x: blockCenter(b.bx), z: blockCenter(b.bz) });
  });

  const lots: LayoutLot[] = [];
  let skill = 0;
  let publicIndex = 0;
  let plot = 0;
  let filler = 0;
  for (const block of blocks) {
    if (block.kind !== "lots") continue;
    const roles = slotRoles(block.index);
    if (roles[0] === "public") {
      const content: LotContent =
        publicIndex < needs.publics
          ? { type: "public", publicIndex }
          : { type: "garden", variant: filler++ };
      publicIndex++;
      lots.push({
        id: `${block.bx},${block.bz}:0`,
        block,
        role: "public",
        slots: [0, 1],
        x: block.x,
        z: block.z - 1.5 * TILE,
        width: 5 * TILE,
        depth: LOT_TILES * TILE,
        content,
      });
    }
    for (const slot of [0, 1, 2, 3] as LotSlot[]) {
      const role = roles[slot];
      if (role === "public") continue;
      let content: LotContent;
      if (role === "skill") {
        content =
          skill < needs.skills
            ? { type: "skill", skill }
            : { type: "decorHouse", variant: filler++ };
        skill++;
      } else {
        if (plot < needs.plotsOwned) content = { type: "plot", plot, state: "owned" };
        else if (plot < needs.plotsOwned + LOCKED_PLOTS_SHOWN)
          content = { type: "plot", plot, state: "locked" };
        else content = { type: "garden", variant: filler++ };
        plot++;
      }
      const [ox, oz] = SLOT_OFFSET[slot];
      lots.push({
        id: `${block.bx},${block.bz}:${slot}`,
        block,
        role,
        slots: [slot],
        x: block.x + ox * TILE,
        z: block.z + oz * TILE,
        width: LOT_TILES * TILE,
        depth: LOT_TILES * TILE,
        content,
      });
    }
  }

  // roads: the ring of tiles around every block
  const roads = new Set<string>();
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  for (const b of blocks) {
    const tx0 = b.bx * BLOCK_PITCH;
    const tz0 = b.bz * BLOCK_PITCH;
    for (let i = 0; i <= BLOCK_PITCH; i++) {
      roads.add(`${tx0 + i},${tz0}`);
      roads.add(`${tx0 + i},${tz0 + BLOCK_PITCH}`);
      roads.add(`${tx0},${tz0 + i}`);
      roads.add(`${tx0 + BLOCK_PITCH},${tz0 + i}`);
    }
    minX = Math.min(minX, tx0);
    maxX = Math.max(maxX, tx0 + BLOCK_PITCH);
    minZ = Math.min(minZ, tz0);
    maxZ = Math.max(maxZ, tz0 + BLOCK_PITCH);
  }

  const decorSpots = blocks.filter((b) => b.kind === "lots").map((b) => ({ x: b.x, z: b.z }));
  const half = TILE / 2;
  return {
    blocks,
    lots,
    roads,
    tiles: { minX, maxX, minZ, maxZ },
    bounds: {
      minX: tileToWorld(minX) - half,
      maxX: tileToWorld(maxX) + half,
      minZ: tileToWorld(minZ) - half,
      maxZ: tileToWorld(maxZ) + half,
    },
    townHall: { x: 0, z: 0 },
    wonder: { x: blockCenter(WONDER_BLOCK.bx), z: blockCenter(WONDER_BLOCK.bz) },
    decorSpots,
  };
}

/** Kenney road tile for a road cell, from its four neighbours (orientation measured in việc 1). */
export function roadTile(
  roads: Set<string>,
  tx: number,
  tz: number,
): {
  key: "road-straight" | "road-crossroad" | "road-intersection" | "road-end" | "road-square";
  rot: number;
} {
  const has = (x: number, z: number) => roads.has(`${x},${z}`);
  const n = has(tx, tz - 1);
  const s = has(tx, tz + 1);
  const e = has(tx + 1, tz);
  const w = has(tx - 1, tz);
  const cnt = Number(n) + Number(s) + Number(e) + Number(w);
  if (cnt === 4) return { key: "road-crossroad", rot: 0 };
  if (cnt === 3)
    return {
      key: "road-intersection",
      rot: !n ? 0 : !e ? -Math.PI / 2 : !s ? Math.PI : Math.PI / 2,
    };
  if (cnt === 2 && ((n && s) || (e && w)))
    return { key: "road-straight", rot: n ? Math.PI / 2 : 0 };
  // an L-corner: the crossroad tile reads fine at our scale and keeps the kit small
  if (cnt === 2) return { key: "road-crossroad", rot: 0 };
  if (cnt === 1)
    return { key: "road-end", rot: e ? 0 : n ? Math.PI / 2 : w ? Math.PI : -Math.PI / 2 };
  return { key: "road-square", rot: 0 };
}
