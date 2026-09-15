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
  /** Closed loops along road lane centres (world x,z). */
  carLoops: [number, number][][];
  /** Closed loops along sidewalks. */
  walkLoops: [number, number][][];
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
  // gate stub toward the camera side
  const gateTx = BLOCK_PITCH;
  const gateTz = layout.tiles.maxZ;
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
  for (const [tx, tz] of [
    [0, 0],
    [6, 0],
    [0, 6],
    [6, 6],
  ] as const) {
    add(
      root,
      ctx.lib.model("roads/traffic-light", roadPaint, TILE),
      tileToWorld(tx) - TILE * 0.45,
      0.1,
      tileToWorld(tz) - TILE * 0.45,
    );
  }
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
  if (c.type === "decorHouse" && c.variant % 4 !== 2) {
    // Filler lots (skills not started yet) are the city's cheapest part: one in four is a detailed
    // Kenney house (≈ 600 visible triangles), half are Kenney low-detail blocks (≈ 90), the rest gardens.
    const detailed = [
      "suburban/building-type-a",
      "commercial/building-c",
      "suburban/building-type-o",
      "suburban/building-type-k",
    ] as const;
    const low = [
      "commercial/low-detail-building-a",
      "commercial/low-detail-building-wide-a",
      "commercial/low-detail-building-c",
      "commercial/low-detail-building-h",
    ] as const;
    const key = c.variant % 4 === 0 ? pick(detailed, c.variant / 4) : pick(low, c.variant);
    const spec = pick(ctx.city.kit, c.variant);
    const m = ctx.lib.model(
      key,
      { type: "kit", spec, key: `${ctx.city.id}${c.variant % ctx.city.kit.length}` },
      TILE * (c.variant % 4 === 0 ? 1.25 : 1.6),
    );
    add(g, m, 0, 0, 0).rotation.y = c.variant % 2 ? 0 : Math.PI / 2;
    if (c.variant % 4 !== 0)
      add(g, tree(ctx, c.variant * 3, 0.9), lot.width * 0.3, 0, lot.depth * 0.3);
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

function planAgents(
  layout: CityLayout,
  view: CityView,
  water: [number, number, number, number],
): AgentPlan {
  const lane = TILE * 0.22;
  const carLoops: [number, number][][] = [];
  const walkLoops: [number, number][][] = [];
  for (const b of layout.blocks) {
    const half = (BLOCK_PITCH / 2) * TILE;
    const o = half - lane; // clockwise lane on the block's ring road
    carLoops.push([
      [b.x - o, b.z - o],
      [b.x + o, b.z - o],
      [b.x + o, b.z + o],
      [b.x - o, b.z + o],
    ]);
    const s = half - TILE * 0.62;
    walkLoops.push([
      [b.x - s, b.z + s],
      [b.x + s, b.z + s],
      [b.x + s, b.z - s],
      [b.x - s, b.z - s],
    ]);
  }
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
    carLoops,
    walkLoops,
    boatLines,
    cars: 4 + view.bustle * 4,
    people: 8 + view.bustle * 6,
    boats: 1 + Math.min(view.bustle, 3),
    pets,
  };
}
