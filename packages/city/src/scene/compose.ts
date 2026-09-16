// Turn a CityView into the static scene graph (to be baked) plus plans for moving things.

import type { CityView } from "@mtct/core";
import { Mesh, type Object3D, PlaneGeometry } from "three";
import { plate, scaffold, worker } from "../build/building";
import { cityGate, DECORATIONS, PLOT_CATALOGUE, PUBLIC_BUILDINGS, townHall } from "../build/civic";
import type { BuildCtx } from "../build/context";
import { add, anchor, box, cyl, group, pick, rng, tok } from "../build/kit";
import {
  balloon,
  bench,
  cloud,
  flowerBed,
  forestTree,
  fountain,
  hill,
  lampPost,
  palm,
  tree,
} from "../build/props";
import { skillBuilding } from "../build/skills";
import { wonder } from "../build/wonders";
import { hasLights, roadGrid } from "../engine/traffic";
import type { KenneyKey } from "../kenney/set";
import {
  BLOCK_PITCH,
  type CityLayout,
  type LayoutLot,
  layoutCity,
  needsOf,
  roadTile,
  TILE,
  tileToWorld,
} from "../layout";
import { WORLD } from "../palette";

export type WaterKind = "river" | "sea" | "lake";

/** Where each city's water sits relative to the built area (+x is right of the default camera). */
export const CITY_WATER: Record<
  CityView["subject"],
  { kind: WaterKind; side: "east" | "west" | "north" }
> = {
  vmath: { kind: "river", side: "east" },
  viet: { kind: "lake", side: "west" },
  esl: { kind: "sea", side: "east" },
  enl: { kind: "river", side: "west" },
  emath: { kind: "river", side: "north" },
  esci: { kind: "lake", side: "east" },
};

export interface AgentPlan {
  /** The traffic lights: one at every crossroads (engine/traffic.ts). */
  lights: { key: string; x: number; z: number }[];
  /** Seeds the traffic, so a reload shows the same town on the same day. */
  seed: string;
  /** Back-and-forth lines on the water. */
  boatLines: [number, number][][];
  cars: number;
  people: number;
  boats: number;
  pets: { code: string; x: number; z: number }[];
}

export interface Composition {
  root: Object3D;
  layout: CityLayout;
  agents: AgentPlan;
  /** Radius (from the city centre) where the ground starts to bend away. */
  curveStart: number;
  /** Camera may pan inside this rectangle. */
  panBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

/** Height added per growth step, as a share of the building (≈ one floor of a level-2 house). */
export const GROWTH_PER_STEP = 0.14;

const hash = (s: string) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

export function composeCity(ctx: BuildCtx, view: CityView): Composition {
  const layout = layoutCity(needsOf(view));
  const root = group();
  let cat = "ground";
  const baseAdd = root.add.bind(root);
  root.add = (...objs: Object3D[]) => {
    for (const o of objs) o.userData.cat ??= cat;
    return baseAdd(...objs);
  };
  const r = rng(hash(view.subject));
  const C = ctx.city;
  const { bounds } = layout;
  const water = CITY_WATER[view.subject];

  // ---------------------------------------------------------------- ground
  const margin = 70;
  const gx0 = bounds.minX - margin;
  const gx1 = bounds.maxX + margin;
  const gz0 = bounds.minZ - margin;
  const gz1 = bounds.maxZ + margin;
  const chunk = 8 * TILE;
  for (let x = gx0; x < gx1; x += chunk) {
    for (let z = gz0; z < gz1; z += chunk) {
      const inside =
        x >= bounds.minX - chunk &&
        x + chunk <= bounds.maxX + chunk &&
        z >= bounds.minZ - chunk &&
        z + chunk <= bounds.maxZ + chunk;
      const seg = inside ? 1 : 4;
      const plane = new Mesh(new PlaneGeometry(chunk, chunk, seg, seg), tok(WORLD.grass));
      plane.rotation.x = -Math.PI / 2;
      add(root, plane, x + chunk / 2, 0, z + chunk / 2);
    }
  }

  cat = "water";
  // ---------------------------------------------------------------- water body beside the city
  const waterRect = waterRectFor(water, bounds);
  {
    const [x0, z0, x1, z1] = waterRect;
    const sx = Math.max(1, Math.round((x1 - x0) / (TILE * 1.5)));
    const sz = Math.max(1, Math.round((z1 - z0) / (TILE * 1.5)));
    const sand = new Mesh(new PlaneGeometry(x1 - x0 + 5, z1 - z0 + 5, sx, sz), tok(WORLD.sand));
    sand.rotation.x = -Math.PI / 2;
    add(root, sand, (x0 + x1) / 2, 0.02, (z0 + z1) / 2);
    const w = new Mesh(new PlaneGeometry(x1 - x0, z1 - z0, sx, sz), tok(WORLD.water, "water"));
    w.rotation.x = -Math.PI / 2;
    add(root, w, (x0 + x1) / 2, 0.06, (z0 + z1) / 2);
  }

  cat = "blocks";
  // ---------------------------------------------------------------- blocks
  const lawnColor = 0x8fe25a;
  for (const b of layout.blocks) {
    const pad = 5 * TILE;
    const color = b.kind === "townhall" ? WORLD.plaza : b.kind === "wonder" ? 0xf6e7c3 : lawnColor;
    add(root, box(pad, 0.1, pad, color), b.x, 0.05, b.z);
    if (b.kind === "lots") {
      add(root, box(pad, 0.02, 0.9, WORLD.path), b.x, 0.11, b.z);
      add(root, box(0.9, 0.02, pad, WORLD.path), b.x, 0.11, b.z);
      for (const [dx, dz] of [
        [-1, -1],
        [1, 1],
      ] as const) {
        add(
          root,
          tree(ctx, b.index * 7 + dx * 3 + dz, 0.85, C.id === "viet" && r() < 0.35),
          b.x + dx * 0.25 * TILE,
          0,
          b.z + dz * 2.35 * TILE,
        );
      }
    }
  }

  // empty cells of the block grid (outer ring not filled yet): a small grove, so the edge of the
  // city meets the forest and water without a bare lawn
  {
    const used = new Set(layout.blocks.map((b) => `${b.bx},${b.bz}`));
    const bxs = layout.blocks.map((b) => b.bx);
    const bzs = layout.blocks.map((b) => b.bz);
    for (let bx = Math.min(...bxs); bx <= Math.max(...bxs); bx++) {
      for (let bz = Math.min(...bzs); bz <= Math.max(...bzs); bz++) {
        if (used.has(`${bx},${bz}`)) continue;
        const x = bx * BLOCK_PITCH * TILE;
        const z = bz * BLOCK_PITCH * TILE;
        add(root, box(5 * TILE + 3, 0.06, 5 * TILE + 3, 0x86de52), x, 0.03, z);
        for (let i = 0; i < 5; i++)
          add(
            root,
            forestTree(ctx, bx * 31 + bz * 17 + i, 1.1 + (i % 3) * 0.2, C.id === "viet" && i === 2),
            x + (r() - 0.5) * 13,
            0,
            z + (r() - 0.5) * 13,
          );
        add(root, flowerBed(2.2, 1.0, bx * 7 + bz), x + 3, 0.03, z - 3);
      }
    }
  }

  cat = "townhall";
  // town hall block: hall, fountain, flower beds, benches
  {
    const th = townHall(ctx, view.townHallOrder);
    add(root, th.root, 0, 0.1, -1.6);
    add(root, fountain(1.4), -4.6, 0.1, 4.6);
    add(root, flowerBed(2.4, 0.8, 5), 4.8, 0.1, 5.8);
    add(root, flowerBed(2.4, 0.8, 6), -4.8, 0.1, -6.4).rotation.y = Math.PI / 2;
    add(root, bench(), -2.4, 0.1, 6.6);
    add(root, bench(), 1.0, 0.1, 6.6);
  }

  cat = "wonder";
  // wonder block
  {
    const w = wonder(C.id, view.wonder.pieces);
    add(root, w.root, layout.wonder.x, 0.1, layout.wonder.z);
    for (const [dx, dz] of [
      [-6.5, 6.5],
      [6.5, 6.5],
      [6.5, -6.5],
    ] as const) {
      const p =
        view.subject === "vmath" || view.subject === "esl"
          ? palm(ctx, 1.1)
          : tree(ctx, dx * dz, 1.1, C.id === "viet");
      add(root, p, layout.wonder.x + dx, 0.1, layout.wonder.z + dz);
    }
  }

  cat = "roads";
  // ---------------------------------------------------------------- roads (straight runs stretch one Kenney tile)
  const roadPaint = { type: "road" } as const;
  const placed = new Set<string>();
  const cells = [...layout.roads].map((k) => k.split(",").map(Number) as [number, number]);
  // gate stub toward the camera side, on the town's southern edge wherever that is today
  const gateTz = layout.tiles.maxZ;
  const gateTx = gateColumn(layout.roads, gateTz);
  for (let i = 1; i <= 3; i++) layout.roads.add(`${gateTx},${gateTz + i}`);
  cells.push([gateTx, gateTz + 1], [gateTx, gateTz + 2], [gateTx, gateTz + 3]);
  const kind = (tx: number, tz: number) => roadTile(layout.roads, tx, tz);
  for (const [tx, tz] of cells) {
    const key = `${tx},${tz}`;
    if (placed.has(key)) continue;
    const t = kind(tx, tz);
    if (t.key !== "road-straight") {
      placed.add(key);
      add(
        root,
        ctx.lib.model(`roads/${t.key}` as KenneyKey, roadPaint, TILE),
        tileToWorld(tx),
        0.12,
        tileToWorld(tz),
      ).rotation.y = t.rot;
      continue;
    }
    const alongX = t.rot === 0;
    let a = alongX ? tx : tz;
    let bEnd = a;
    const at = (v: number) => (alongX ? [v, tz] : [tx, v]) as [number, number];
    while (
      layout.roads.has(at(a - 1).join(",")) &&
      kind(...at(a - 1)).key === "road-straight" &&
      !placed.has(at(a - 1).join(","))
    )
      a--;
    while (
      layout.roads.has(at(bEnd + 1).join(",")) &&
      kind(...at(bEnd + 1)).key === "road-straight" &&
      !placed.has(at(bEnd + 1).join(","))
    )
      bEnd++;
    for (let v = a; v <= bEnd; v++) placed.add(at(v).join(","));
    const len = bEnd - a + 1;
    const mid = (a + bEnd) / 2;
    const m = ctx.lib.model("roads/road-straight", roadPaint, TILE);
    m.scale.x = TILE * len;
    m.rotation.y = alongX ? 0 : Math.PI / 2;
    add(
      root,
      m,
      alongX ? tileToWorld(mid) : tileToWorld(tx),
      0.12,
      alongX ? tileToWorld(tz) : tileToWorld(mid),
    );
  }
  cat = "lamps";
  // one lamp at each crossing corner, traffic lights around the town hall
  for (const [tx, tz] of cells) {
    const t = kind(tx, tz);
    if ((t.key === "road-crossroad" || t.key === "road-intersection") && (tx + tz) % 12 === 0) {
      add(
        root,
        lampPost(),
        tileToWorld(tx) + TILE * 0.55,
        0.1,
        tileToWorld(tz) + TILE * 0.55,
      ).rotation.y = Math.PI;
    }
  }
  // a working traffic light at every crossroads: the pole is built here, the lamps change colour
  // in the engine (they are instanced, so they can)
  for (const light of trafficLights(layout)) add(root, lightPole(), light.x, 0.1, light.z);
  add(root, cityGate(ctx), tileToWorld(gateTx), 0.1, tileToWorld(gateTz + 2));

  cat = "lots";
  // ---------------------------------------------------------------- lots
  for (const lot of layout.lots) {
    cat = `lot:${lot.content.type}`;
    add(root, buildLot(ctx, view, lot), lot.x, 0.1, lot.z);
  }

  cat = "decorations";
  // decorations on block crossings
  view.decorations.forEach((code, i) => {
    const spot = layout.decorSpots[i];
    const deco = DECORATIONS[code];
    if (!spot || !deco) return;
    add(root, deco.build(ctx, i), spot.x, 0.12, spot.z);
  });

  cat = "forest";
  // ---------------------------------------------------------------- scenery ring
  const inWater = (x: number, z: number, pad = 4) =>
    x > waterRect[0] - pad &&
    x < waterRect[2] + pad &&
    z > waterRect[1] - pad &&
    z < waterRect[3] + pad;
  const band = (x0: number, z0: number, x1: number, z1: number, step: number) => {
    for (let x = x0; x <= x1; x += step) {
      for (let z = z0; z <= z1; z += step) {
        const jx = x + (r() - 0.5) * step * 0.6;
        const jz = z + (r() - 0.5) * step * 0.6;
        if (inWater(jx, jz)) continue;
        add(
          root,
          forestTree(ctx, Math.floor(r() * 1e6), 1.0 + r() * 0.5, C.id === "viet" && r() < 0.06),
          jx,
          0,
          jz,
        );
      }
    }
  };
  const fb = 3.5 * TILE;
  const step = TILE * 1.4;
  band(bounds.minX - fb, bounds.minZ - fb, bounds.maxX + fb, bounds.minZ - TILE * 0.8, step);
  band(bounds.minX - fb, bounds.maxZ + TILE * 3.6, bounds.maxX + fb, bounds.maxZ + fb, step);
  band(bounds.minX - fb, bounds.minZ, bounds.minX - TILE * 0.8, bounds.maxZ + TILE * 3, step);
  band(bounds.maxX + TILE * 0.8, bounds.minZ, bounds.maxX + fb, bounds.maxZ + TILE * 3, step);

  const cx = (bounds.minX + bounds.maxX) / 2;
  const cz = (bounds.minZ + bounds.maxZ) / 2;
  const radius = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) / 2;
  const curveStart = radius * Math.SQRT2 + fb * 0.6;
  cat = "hills";
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const rad = curveStart + 22 + r() * 26;
    const hx = cx + Math.cos(a) * rad;
    const hz = cz + Math.sin(a) * rad;
    if (inWater(hx, hz, 12)) continue;
    add(root, hill(16 + r() * 14, 5 + r() * 7, pick(WORLD.hill, i)), hx, 0, hz);
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rad = curveStart + 62 + r() * 24;
    add(
      root,
      hill(24 + r() * 16, 22 + r() * 18, pick(WORLD.mountain, i)),
      cx + Math.cos(a) * rad,
      0,
      cz + Math.sin(a) * rad,
    );
  }
  cat = "clouds";
  // clouds float over the far half of the sky (the camera looks toward −x, −z)
  for (let i = 0; i < 11; i++) {
    const a = -3.75 + i * 0.2 + r() * 0.05;
    const rad = curveStart + 50 + r() * 60;
    add(
      root,
      cloud(2.6 + r() * 2.6, i + 3),
      cx + Math.cos(a) * rad,
      11 - (rad - curveStart - 50) * 0.3 - r() * 6,
      cz + Math.sin(a) * rad,
    );
  }
  if (view.bustle >= 2) {
    add(root, balloon(C.a, C.b), cx - radius * 0.4, 22, cz - radius * 0.6);
    if (view.bustle >= 3)
      add(root, balloon(C.b, 0xffffff), cx + radius * 0.5, 26, cz - radius * 0.9);
  }

  // ---------------------------------------------------------------- moving things
  const agents = planAgents(layout, view, waterRect);
  return {
    root,
    layout,
    agents,
    curveStart,
    panBounds: {
      minX: bounds.minX,
      maxX: bounds.maxX,
      minZ: bounds.minZ,
      maxZ: bounds.maxZ + TILE * 3,
    },
  };
}

function waterRectFor(
  water: (typeof CITY_WATER)[keyof typeof CITY_WATER],
  b: CityLayout["bounds"],
): [number, number, number, number] {
  const width = water.kind === "sea" ? 9 * TILE : water.kind === "lake" ? 6 * TILE : 3 * TILE;
  const gap = 1.2 * TILE;
  const extra = water.kind === "river" ? 60 : 10;
  if (water.side === "east")
    return [b.maxX + gap, b.minZ - extra, b.maxX + gap + width, b.maxZ + extra];
  if (water.side === "west")
    return [b.minX - gap - width, b.minZ - extra * 0.3, b.minX - gap, b.maxZ + extra * 0.3];
  return [b.minX - extra, b.minZ - gap - width, b.maxX + extra, b.minZ - gap];
}

function buildLot(ctx: BuildCtx, view: CityView, lot: LayoutLot): Object3D {
  const g = group();
  const c = lot.content;
  if (c.type === "skill") {
    const s = view.skills[c.skill];
    if (!s) return g;
    if (s.level === 0 && !s.needsHelp) {
      // not built yet: a tidy sprout plot, never a building site (Pha 10b việc 1)
      const top = sproutPlot(ctx, g, s.label, c.skill + 1);
      anchor(g, `skill:${s.skillId}`, 0, top + 1.2, 0);
      return g;
    }
    const b = skillBuilding(ctx, s.level, c.skill + 1, s.label);
    // growth inside a level: each step makes the building a floor taller (Pha 10 bổ sung §3)
    const stretch = 1 + GROWTH_PER_STEP * (s.step ?? 0);
    b.root.scale.y = stretch;
    add(g, b.root);
    let top = b.top * stretch;
    if (s.needsHelp && s.level > 0) {
      add(g, scaffold(4.0, 3.8, Math.min(b.top, 4.2)), 0, 0.1, 0);
      const wk = worker();
      wk.rotation.y = 0.6;
      add(g, wk, 2.2, 0.1, 2.4);
      top = Math.max(top, 4.4);
    }
    anchor(g, `skill:${s.skillId}`, 0, top + 1.2, 0);
    return g;
  }
  if (c.type === "public") {
    const code = view.publicBuildings[c.publicIndex];
    const builder = code ? PUBLIC_BUILDINGS[code] : undefined;
    if (builder) {
      const b = builder.build(ctx);
      add(g, b.root);
      anchor(g, `public:${code}`, 0, b.top + 1, 0);
      return g;
    }
  }
  if (c.type === "plot") {
    if (c.state === "owned") {
      const choice = view.land.builds.find((x) => x.plot === c.plot);
      const entry = choice ? PLOT_CATALOGUE[choice.build] : undefined;
      if (entry) add(g, entry.build(ctx, c.plot + 1).root);
      else openPlot(ctx, g);
    } else {
      lockedPlot(ctx, g, c.plot === view.land.owned ? view.land.nextCost : null);
    }
    anchor(g, `plot:${c.plot}`, 0, 2.6, 0);
    return g;
  }
  if (c.type === "decorHouse" && c.variant % 4 === 0) {
    // Filler lots (skills not started yet): one in four is a small detailed Kenney house
    // (≈ 600 visible triangles), the rest are gardens. The tall low-detail blocks read as
    // unfinished boxes on a young city, so they are no longer used here (Pha 10b việc 1).
    const detailed = [
      "suburban/building-type-a",
      "suburban/building-type-o",
      "suburban/building-type-k",
      "commercial/building-c",
    ] as const;
    const key = pick(detailed, c.variant / 4);
    const spec = pick(ctx.city.kit, c.variant);
    const m = ctx.lib.model(
      key,
      { type: "kit", spec, key: `${ctx.city.id}${c.variant % ctx.city.kit.length}` },
      TILE * 1.25,
    );
    add(g, m, 0, 0, 0).rotation.y = c.variant % 8 ? 0 : Math.PI / 2;
    add(g, tree(ctx, c.variant * 3, 0.8), lot.width * 0.32, 0, lot.depth * 0.3);
    return g;
  }
  // garden
  add(g, box(lot.width - 0.6, 0.06, lot.depth - 0.6, 0xa8ec6a), 0, 0.03, 0);
  add(
    g,
    tree(ctx, c.type === "garden" ? c.variant * 13 : 3, 1.1, ctx.city.id === "viet"),
    -lot.width * 0.22,
    0,
    -lot.depth * 0.2,
  );
  add(g, flowerBed(1.6, 0.6, lot.x), lot.width * 0.15, 0.03, lot.depth * 0.2);
  add(g, bench(), lot.width * 0.2, 0.03, -lot.depth * 0.18);
  return g;
}

/**
 * "Mầm nhà": a skill the child has not built yet. A fresh green lot with a low white fence, one
 * sapling and a small name sign — it reads as "still to build", not as something broken.
 * Returns the height of the tallest thing, for the star above it.
 */
export function sproutPlot(ctx: BuildCtx, g: Object3D, label: string, seed: number): number {
  const w = 4.4;
  const d = 4.2;
  add(g, box(w, 0.1, d, 0x9fe86a), 0, 0.05, 0);
  add(g, box(w - 1.2, 0.04, d - 1.2, 0x8fdc5c), 0, 0.12, 0);
  const fence = 0xfffaf0;
  const h = 0.36;
  for (const [x, z, len, alongX] of [
    [0, -d / 2, w, true],
    [0, d / 2, w, true],
    [-w / 2, 0, d, false],
    [w / 2, 0, d, false],
  ] as const) {
    add(g, box(alongX ? len : 0.07, 0.07, alongX ? 0.07 : len, fence), x, h, z);
  }
  for (const [x, z] of [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [-w / 2, d / 2],
    [w / 2, d / 2],
  ] as const)
    add(g, box(0.12, h + 0.12, 0.12, fence), x, (h + 0.12) / 2, z);
  add(g, tree(ctx, seed * 11 + 3, 0.45, ctx.city.id === "viet" && seed % 3 === 0), -0.7, 0.1, -0.4);
  // the name sign on a short post, facing the camera
  add(g, cyl(0.05, 0.05, 1.0, 0x9a623e, 4), 1.2, 0.5, 1.2);
  const sign = plate(ctx, label, ctx.city.a, "#ffffff", 0.9);
  add(g, sign, 1.2, 1.1, 1.25).rotation.y = Math.PI / 4;
  return 1.6;
}

function openPlot(ctx: BuildCtx, g: Object3D) {
  add(g, box(5.6, 0.1, 5.6, WORLD.path), 0, 0.05, 0);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    add(g, box(0.5, 0.04, 0.2, 0xffd447), Math.cos(a) * 1.9, 0.12, Math.sin(a) * 1.9).rotation.y =
      -a;
  }
  const plus = plate(ctx, "+", 0xffd447, "#ffffff", 1.2);
  plus.rotation.x = -Math.PI / 2;
  add(g, plus, 0, 0.14, 0);
}

function lockedPlot(ctx: BuildCtx, g: Object3D, cost: number | null) {
  add(g, box(5.6, 0.08, 5.6, 0x9ee07a), 0, 0.04, 0);
  const n = 6;
  for (let i = 0; i <= n; i++) {
    const t = -2.8 + (i * 5.6) / n;
    for (const [x, z] of [
      [t, -2.8],
      [t, 2.8],
      [-2.8, t],
      [2.8, t],
    ] as const)
      add(g, cyl(0.05, 0.05, 0.4, 0xffffff, 4), x, 0.25, z);
  }
  add(g, cyl(0.07, 0.07, 1.6, 0x9a623e, 4), 0, 0.8, 0);
  add(
    g,
    plate(ctx, cost !== null ? `${cost}★` : "★", 0xfffaf0, "#f2a100", 1.6, false),
    0,
    1.9,
    0.05,
  );
}

/**
 * Which street the city gate stands at the end of. The edge moves out as the town grows, and the
 * gate moves with it. The first blocks of a new ring go in on the camera side, so for a while the
 * old spot (one block east of the middle) had no street under it and the gate stood in the grass
 * with its road going nowhere (owner, 16/09). Nearest street to that spot on the edge row instead.
 */
export function gateColumn(roads: ReadonlySet<string>, edgeTz: number): number {
  for (let step = 0; step < 64; step++) {
    // BLOCK_PITCH, 0, 2·P, −P, 3·P, −2·P …
    const offset = step % 2 === 0 ? step / 2 : -(step + 1) / 2;
    const tx = BLOCK_PITCH * (1 + offset);
    if (roads.has(`${tx},${edgeTz}`)) return tx;
  }
  return BLOCK_PITCH;
}

/**
 * Where the lights stand: on the pavement corner of the crossroads that faces the camera, so the
 * pole is seen across the open road and not hidden behind a block.
 */
export function trafficLights(layout: CityLayout): { key: string; x: number; z: number }[] {
  const grid = roadGrid(layout.roads);
  return [...grid.values()]
    .filter((j) => hasLights(grid, j.key))
    .map((j) => ({ key: j.key, x: j.x + LIGHT_OFFSET, z: j.z + LIGHT_OFFSET }));
}

/** From the crossroads' middle to the pole, on both axes (the corner nearer the camera). */
const LIGHT_OFFSET = -TILE * 0.62;
/** The lamp faces, relative to the pole's foot: +x shows the east–west way, +z the north–south. */
export const LAMP_FACES = {
  x: { dx: 0.19, dz: 0 },
  z: { dx: 0, dz: 0.19 },
  heights: { red: 3.0, amber: 2.68, green: 2.36 },
} as const;

function lightPole(): Object3D {
  const g = group();
  add(g, cyl(0.07, 0.09, 2.2, 0x46607a, 6), 0, 1.1, 0);
  add(g, box(0.36, 1.08, 0.36, 0x2b2f3a), 0, 2.68, 0);
  // little hoods over the lamps, on the two faces the camera sees
  for (const y of [3.0, 2.68, 2.36]) {
    add(g, box(0.06, 0.04, 0.3, 0x2b2f3a), 0.21, y + 0.15, 0);
    add(g, box(0.3, 0.04, 0.06, 0x2b2f3a), 0, y + 0.15, 0.21);
  }
  return g;
}

function planAgents(
  layout: CityLayout,
  view: CityView,
  water: [number, number, number, number],
): AgentPlan {
  const [x0, z0, x1, z1] = water;
  const boatLines: [number, number][][] =
    x1 - x0 > z1 - z0
      ? [
          [
            [x0 + 6, (z0 + z1) / 2 - 1.5],
            [x1 - 6, (z0 + z1) / 2 - 1.5],
          ],
          [
            [x1 - 12, (z0 + z1) / 2 + 2],
            [x0 + 12, (z0 + z1) / 2 + 2],
          ],
        ]
      : [
          [
            [(x0 + x1) / 2 - 1.5, z0 + 6],
            [(x0 + x1) / 2 - 1.5, z1 - 6],
          ],
          [
            [(x0 + x1) / 2 + 2, z1 - 12],
            [(x0 + x1) / 2 + 2, z0 + 12],
          ],
        ];
  const pets = view.pets.map((code, i) => ({ code, x: -3 + i * 1.5, z: 5.5 }));
  return {
    lights: trafficLights(layout),
    seed: `${view.subject}:${new Date().toISOString().slice(0, 10)}`,
    boatLines,
    cars: 4 + view.bustle * 4,
    people: 8 + view.bustle * 6,
    // Bến Cảng Từ: a boat for every English word the child keeps, on top of the usual traffic.
    boats: Math.max(1 + Math.min(view.bustle, 3), view.harbourBoats ?? 0),
    pets,
  };
}
