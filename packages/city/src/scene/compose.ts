// Turn a CityView into the static scene graph (to be baked) plus plans for moving things.
//
// Pha 12: the city is polar (layout.ts). Roads are ribbons trailed along curves instead of Kenney
// tiles on a grid, the lake is in the middle from day one, the river runs past the edge with its
// harbour, and the fan-shaped cells hold the buildings. What a cell is for never changes; only its
// shape did.

import type { CityView } from "@mtct/core";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  type Object3D,
  PlaneGeometry,
  Uint32BufferAttribute,
} from "three";
import { plate, scaffold, worker } from "../build/building";
import { cityGate, DECORATIONS, PLOT_CATALOGUE, PUBLIC_BUILDINGS, townHall } from "../build/civic";
import type { BuildCtx } from "../build/context";
import { add, anchor, box, cyl, group, pick, rng, tok } from "../build/kit";
import {
  balloon,
  bench,
  boat,
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
import { type CityLayout, type LayoutLot, layoutCity, needsOf, TILE } from "../layout";
import { WORLD } from "../palette";
import { cityWaterways, inRiver, type Waterways } from "../waterways";

export interface AgentPlan {
  /** Boat lanes on the river (open polylines — boats turn at the ends). */
  boatLines: [number, number][][];
  cars: number;
  people: number;
  buses: number;
  boats: number;
  pets: { code: string; x: number; z: number }[];
}

export interface Composition {
  root: Object3D;
  layout: CityLayout;
  water: Waterways;
  agents: AgentPlan;
  /** Radius (from the city centre) where the ground starts to bend away. */
  curveStart: number;
  /** Camera may pan inside this rectangle. */
  panBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

/** Height added per growth step, as a share of the building (≈ one floor of a level-2 house). */
export const GROWTH_PER_STEP = 0.14;

const hash = (s: string) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

/**
 * A strip of ground laid along a curve: the road surface, its verge, a riverbank. Two triangles per
 * segment, one mesh for the whole run, so a belt road costs the same as a straight one.
 */
export function ribbon(
  points: [number, number][],
  width: number,
  color: number,
  kind: Parameters<typeof tok>[1] = "solid",
): Mesh {
  const position: number[] = [];
  const index: number[] = [];
  const half = width / 2;
  for (let i = 0; i < points.length; i++) {
    const a = points[Math.max(0, i - 1)] as [number, number];
    const b = points[Math.min(points.length - 1, i + 1)] as [number, number];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    const nx = (-dz / l) * half;
    const nz = (dx / l) * half;
    const p = points[i] as [number, number];
    position.push(p[0] - nx, 0, p[1] - nz, p[0] + nx, 0, p[1] + nz);
    if (i > 0) {
      const v = i * 2;
      index.push(v - 2, v - 1, v, v - 1, v + 1, v);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(position, 3));
  geometry.setAttribute(
    "normal",
    new Float32BufferAttribute(
      position.map((_, i) => (i % 3 === 1 ? 1 : 0)),
      3,
    ),
  );
  geometry.setIndex(new Uint32BufferAttribute(index, 1));
  return new Mesh(geometry, tok(color, kind));
}

/** A flat polygon (the lake, a pond, a cell's lawn) as a fan of triangles. */
export function polygon(
  points: [number, number][],
  color: number,
  kind: Parameters<typeof tok>[1] = "solid",
): Mesh {
  const position: number[] = [];
  const index: number[] = [];
  let cx = 0;
  let cz = 0;
  for (const [x, z] of points) {
    cx += x / points.length;
    cz += z / points.length;
  }
  position.push(cx, 0, cz);
  for (const [x, z] of points) position.push(x, 0, z);
  // Wound so the face looks UP, whichever way round the caller listed its points. A fan wound the
  // other way faces the ground, and the bake drops it as a back face — which is how the lake spent
  // an afternoon invisible.
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i] as [number, number];
    const b = points[(i + 1) % points.length] as [number, number];
    area += a[0] * b[1] - b[0] * a[1];
  }
  for (let i = 0; i < points.length; i++) {
    const next = 1 + ((i + 1) % points.length);
    if (area > 0) index.push(0, next, 1 + i);
    else index.push(0, 1 + i, next);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(position, 3));
  geometry.setAttribute(
    "normal",
    new Float32BufferAttribute(
      position.map((_, i) => (i % 3 === 1 ? 1 : 0)),
      3,
    ),
  );
  geometry.setIndex(new Uint32BufferAttribute(index, 1));
  return new Mesh(geometry, tok(color, kind));
}

const circlePoints = (x: number, z: number, radius: number, segments = 16): [number, number][] =>
  Array.from({ length: segments }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    return [x + Math.cos(a) * radius, z + Math.sin(a) * radius] as [number, number];
  });

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
  const seed = view.subject;
  const water = cityWaterways(seed, layout.rings);
  const reach = layout.bounds.maxX;

  // ---------------------------------------------------------------- ground
  const margin = 80;
  const gx0 = -reach - margin;
  const gx1 = reach + margin;
  const chunk = 8 * TILE;
  for (let x = gx0; x < gx1; x += chunk) {
    for (let z = gx0; z < gx1; z += chunk) {
      const plane = new Mesh(new PlaneGeometry(chunk, chunk, 1, 1), tok(WORLD.grass));
      plane.rotation.x = -Math.PI / 2;
      add(root, plane, x + chunk / 2, 0, z + chunk / 2);
    }
  }

  cat = "water";
  // ---------------------------------------------------------------- the lake in the middle
  {
    // a beach all the way round, whatever shape the lake is: push every point out from its middle
    const shore = layout.lake.points.map(([x, z]) => {
      const dx = x - layout.lake.x;
      const dz = z - layout.lake.z;
      const d = Math.hypot(dx, dz) || 1;
      return [x + (dx / d) * 3, z + (dz / d) * 3] as [number, number];
    });
    add(root, polygon(shore, WORLD.sand), 0, 0.02, 0);
    add(root, polygon(layout.lake.points, WORLD.water, "water"), 0, 0.06, 0);
  }
  // ---------------------------------------------------------------- the river, and the canals off it
  {
    const bank = ribbon(water.river, water.style.width + 9, WORLD.sand);
    add(root, bank, 0, 0.02, 0);
    add(root, ribbon(water.river, water.style.width, WORLD.water, "water"), 0, 0.06, 0);
    for (const canal of water.canals) {
      add(root, ribbon(canal.points, canal.width + 5, WORLD.sand), 0, 0.02, 0);
      add(root, ribbon(canal.points, canal.width, WORLD.water, "water"), 0, 0.06, 0);
    }
  }
  // small ponds between the belts
  for (const pond of layout.ponds) {
    add(root, polygon(circlePoints(pond.x, pond.z, pond.radius + 1.4, 14), WORLD.sand), 0, 0.03, 0);
    add(
      root,
      polygon(circlePoints(pond.x, pond.z, pond.radius, 14), WORLD.water, "water"),
      0,
      0.07,
      0,
    );
  }

  cat = "roads";
  // ---------------------------------------------------------------- roads, trailed along the curves
  for (const edge of layout.roads.edges.values()) {
    if (edge.park) {
      // through a park: a sand-coloured footpath, so the belt is not one unbroken ring of tarmac
      add(root, ribbon(edge.points, edge.width, WORLD.path), 0, 0.11, 0);
      continue;
    }
    if (edge.overWater) {
      // over the water: a deck with a rail down each side, lifted clear of the river
      add(root, ribbon(edge.points, edge.width + 1.6, 0xb9b3a8), 0, 0.5, 0);
      for (const side of [-1, 1])
        add(
          root,
          ribbon(railLine(edge.points, side * (edge.width / 2 + 0.6)), 0.5, 0xfff3dd),
          0,
          1.1,
          0,
        );
      continue;
    }
    add(root, ribbon(edge.points, edge.width + 2.6, WORLD.path), 0, 0.1, 0); // verge
    add(root, ribbon(edge.points, edge.width, 0xb9b3a8), 0, 0.12, 0); // tarmac
    if (edge.kind === "avenue") {
      // a painted middle line, which is what tells a six-year-old this is the big road
      add(root, ribbon(edge.points, 0.5, 0xfff3dd), 0, 0.14, 0);
    }
  }
  cat = "lamps";
  let lamp = 0;
  for (const node of layout.roads.nodes.values()) {
    if (node.light) {
      add(
        root,
        ctx.lib.model("roads/traffic-light", { type: "road" }, TILE),
        node.x + 3,
        0.12,
        node.z + 3,
      );
    } else if (lamp++ % 3 === 0) {
      add(root, lampPost(), node.x + 2.4, 0.12, node.z + 2.4);
    }
  }

  cat = "cells";
  // ---------------------------------------------------------------- the fan of cells
  for (const cell of layout.cells) {
    const lawn =
      cell.role === "park"
        ? 0x9be36a
        : cell.role === "grove"
          ? 0x86de52
          : cell.role === "pond"
            ? WORLD.grass
            : 0x8fe25a;
    add(root, polygon(cell.corners, lawn), 0, 0.04, 0);
    if (cell.role === "park") {
      add(root, flowerBed(2.6, 1.0, cell.index), cell.x, 0.06, cell.z);
      add(root, bench(), cell.x + 2.6, 0.06, cell.z - 1.6);
      add(root, tree(ctx, cell.index * 5, 1.15, C.id === "viet"), cell.x - 3, 0.05, cell.z + 2);
    }
    if (cell.role === "grove") {
      for (let i = 0; i < 6; i++) {
        add(
          root,
          forestTree(ctx, cell.index * 31 + i, 1.05 + (i % 3) * 0.2, C.id === "viet" && i === 2),
          cell.x + (r() - 0.5) * cell.width,
          0,
          cell.z + (r() - 0.5) * cell.depth,
        );
      }
    }
  }

  cat = "townhall";
  // ---------------------------------------------------------------- the town hall, on its headland
  {
    const th = townHall(ctx, view.townHallOrder);
    const hx = layout.townHall.x;
    const hz = layout.townHall.z;
    // the headland itself: a small tongue of paving poking into the lake, never a lid on it
    add(root, polygon(circlePoints(hx, hz, 7, 16), WORLD.plaza), 0, 0.08, 0);
    const hall = add(root, th.root, hx, 0.1, hz);
    hall.rotation.y = layout.townHall.facing;
    add(root, fountain(1.4), hx - 4.2, 0.1, hz + 3.4);
    add(root, bench(), hx + 2.8, 0.1, hz + 3.6);
    add(root, flowerBed(2.4, 0.8, 5), hx + 4.4, 0.1, hz - 2.6);
    add(root, cityGate(ctx), hx * 1.5, 0.1, hz * 1.5);
  }

  cat = "wonder";
  {
    const w = wonder(C.id, view.wonder.pieces);
    add(root, polygon(circlePoints(layout.wonder.x, layout.wonder.z, 9, 16), 0xf6e7c3), 0, 0.07, 0);
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

  cat = "lots";
  // ---------------------------------------------------------------- lots
  for (const lot of layout.lots) {
    cat = `lot:${lot.content.type}`;
    const built = add(root, buildLot(ctx, view, lot), lot.x, 0.1, lot.z);
    built.rotation.y = lot.facing;
  }

  cat = "signs";
  // ---------------------------------------------------------------- one sign per district
  for (const district of layout.districts) {
    const post = group();
    add(post, cyl(0.13, 0.13, 2.6, 0x9a623e, 5), 0, 1.3, 0);
    const sign = plate(ctx, district.name, C.a, "#ffffff", 2.4, false);
    add(post, sign, 0, 2.7, 0.06);
    add(root, post, district.sign.x, 0.1, district.sign.z).rotation.y = district.sign.angle;
  }

  cat = "harbour";
  // ---------------------------------------------------------------- the harbour, and the bridge
  add(root, harbour(ctx, water), 0, 0.02, 0);
  if (water.bridgeBuilt) add(root, bridge(water), 0, 0.02, 0);

  cat = "decorations";
  view.decorations.forEach((code, i) => {
    const spot = layout.decorSpots[i];
    const deco = DECORATIONS[code];
    if (!spot || !deco) return;
    add(root, deco.build(ctx, i), spot.x, 0.12, spot.z);
  });

  cat = "forest";
  // ---------------------------------------------------------------- the country outside the city
  const outer = layout.edge;
  const free = (x: number, z: number) =>
    !inRiver(water, x, z, 5) &&
    Math.hypot(x - layout.lake.x, z - layout.lake.z) > layout.lake.radius + 3 &&
    Math.hypot(x, z) > outer + 3;
  // the country around the city: enough to read as forest, not enough to cost a frame
  for (let i = 0; i < 160; i++) {
    const a = r() * Math.PI * 2;
    const rad = outer + 6 + r() * 70;
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad;
    if (!free(x, z)) continue;
    add(
      root,
      forestTree(ctx, Math.floor(r() * 1e6), 1.0 + r() * 0.5, C.id === "viet" && r() < 0.06),
      x,
      0,
      z,
    );
  }
  const curveStart = outer + 54;
  cat = "hills";
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2 + r() * 0.2;
    const rad = curveStart + 20 + r() * 26;
    const hx = Math.cos(a) * rad;
    const hz = Math.sin(a) * rad;
    if (inRiver(water, hx, hz, 14)) continue;
    add(root, hill(16 + r() * 14, 5 + r() * 7, pick(WORLD.hill, i)), hx, 0, hz);
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rad = curveStart + 62 + r() * 24;
    add(
      root,
      hill(24 + r() * 16, 22 + r() * 18, pick(WORLD.mountain, i)),
      Math.cos(a) * rad,
      0,
      Math.sin(a) * rad,
    );
  }
  cat = "clouds";
  for (let i = 0; i < 11; i++) {
    const a = -3.75 + i * 0.2 + r() * 0.05;
    const rad = curveStart + 50 + r() * 60;
    add(root, cloud(2.6 + r() * 2.6, i + 3), Math.cos(a) * rad, 11 - r() * 6, Math.sin(a) * rad);
  }
  if (view.bustle >= 2) {
    add(root, balloon(C.a, C.b), -outer * 0.4, 22, -outer * 0.6);
    if (view.bustle >= 3) add(root, balloon(C.b, 0xffffff), outer * 0.5, 26, -outer * 0.9);
  }

  const pan = outer + 22;
  return {
    root,
    layout,
    water,
    agents: planAgents(layout, view, water),
    curveStart,
    panBounds: { minX: -pan, maxX: pan, minZ: -pan, maxZ: pan },
  };
}

/**
 * The quay: a wooden pier out over the water, bollards, a harbour office with a light, crates, and
 * a crane where the river carries cargo. Bến Cảng Từ (English) gets the big one — pha 11's words
 * dock here.
 */
function harbour(ctx: BuildCtx, w: Waterways): Object3D {
  const g = group();
  const h = w.harbour;
  const deck = group();
  const deckLength = h.big ? 26 : 18;
  add(deck, box(deckLength, 0.4, 9, 0xc9a227), 0, 0.2, 0);
  for (let i = 0; i < (h.big ? 7 : 5); i++) {
    add(
      deck,
      cyl(0.28, 0.28, 1.4, 0x8a5a33, 6),
      -deckLength / 2 + 2 + i * (deckLength / (h.big ? 7 : 5)),
      -0.4,
      3.4,
    );
    add(
      deck,
      cyl(0.28, 0.28, 1.4, 0x8a5a33, 6),
      -deckLength / 2 + 2 + i * (deckLength / (h.big ? 7 : 5)),
      -0.4,
      -3.4,
    );
  }
  // bollards
  for (const x of [-deckLength / 3, 0, deckLength / 3]) {
    add(deck, cyl(0.34, 0.4, 0.9, 0x5f6470, 8), x, 0.6, 3.6);
  }
  // harbour office with a light on top
  const office = group();
  add(office, box(5.2, 3.4, 4.4, 0xfff3dd), 0, 1.7, 0);
  add(office, box(5.6, 0.5, 4.8, ctx.city.a), 0, 3.6, 0);
  add(office, cyl(0.5, 0.5, 1.2, 0xfffaf0, 8), 0, 4.3, 0);
  add(office, cyl(0.62, 0.62, 0.7, 0xffd447, 8), 0, 5.1, 0).userData.surf = "light";
  add(deck, office, -deckLength / 2 + 3.6, 0.4, 0);
  // crates, and a crane where the barges are
  for (let i = 0; i < (h.big ? 6 : 3); i++) {
    add(
      deck,
      box(1.6, 1.6, 1.6, pick([0xe07a5f, 0x81b29a, 0xf2cc8f], i)),
      deckLength / 2 - 3 - i * 2.2,
      1.2,
      i % 2 ? 1.6 : -1.6,
    );
  }
  if (w.style.trait === "barges" || h.big) {
    const crane = group();
    add(crane, cyl(0.5, 0.6, 6.5, 0xe0a458, 8), 0, 3.2, 0);
    add(crane, box(9, 0.5, 0.7, 0xe0a458), 3.2, 6.4, 0);
    add(crane, cyl(0.08, 0.08, 2.4, 0x5f6470, 5), 7.2, 5.2, 0);
    add(crane, box(1.3, 1.1, 1.3, 0x8a5a33), 7.2, 3.7, 0);
    add(deck, crane, deckLength / 2 - 6, 0.4, -2.4);
  }
  // a couple of boats tied up
  add(deck, boat(ctx.city.b), deckLength / 2 - 4, -0.5, 6.4).rotation.y = 0.15;
  if (h.big) add(deck, boat(0xe07a5f), -deckLength / 2 + 6, -0.5, -6.6).rotation.y = Math.PI - 0.1;
  add(g, deck, h.x, 0.1, h.z).rotation.y = h.angle;
  return g;
}

/** The bridge over the river, once the city has grown out to the bank. */
/** A line running alongside a road, for the rails of a bridge deck. */
function railLine(points: [number, number][], offset: number): [number, number][] {
  return points.map((point, i) => {
    const a = points[Math.max(0, i - 1)] as [number, number];
    const b = points[Math.min(points.length - 1, i + 1)] as [number, number];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [
      point[0] - ((b[1] - a[1]) / len) * offset,
      point[1] + ((b[0] - a[0]) / len) * offset,
    ] as [number, number];
  });
}

function bridge(w: Waterways): Object3D {
  const g = group();
  const b = w.bridge;
  const deck = group();
  add(deck, box(b.span, 0.6, 9, 0xb9b3a8), 0, 1.6, 0);
  add(deck, box(b.span, 0.5, 0.4, 0xfff3dd), 0, 2.1, 4.2);
  add(deck, box(b.span, 0.5, 0.4, 0xfff3dd), 0, 2.1, -4.2);
  for (const x of [-b.span / 3, b.span / 3]) {
    add(deck, cyl(0.7, 0.9, 1.8, 0x8a8f9a, 8), x, 0.7, 3.2);
    add(deck, cyl(0.7, 0.9, 1.8, 0x8a8f9a, 8), x, 0.7, -3.2);
  }
  add(g, deck, b.x, 0.1, b.z).rotation.y = b.angle;
  return g;
}

/**
 * What moves, and how much of it. The vehicles themselves wander the road graph (engine/traffic.ts);
 * this only says how many there are and where the boats go.
 */
function planAgents(layout: CityLayout, view: CityView, water: Waterways): AgentPlan {
  const pets = view.pets.map((code, i) => {
    const lot = layout.lots[(i * 7 + 3) % Math.max(1, layout.lots.length)];
    return { code, x: lot?.x ?? 0, z: (lot?.z ?? 0) + 4 };
  });
  return {
    boatLines: water.lanes,
    cars: 4 + view.bustle * 4,
    buses: 1 + Math.min(2, view.bustle),
    people: 8 + view.bustle * 6,
    // Bến Cảng Từ: a boat for every English word the child keeps, on top of the usual traffic.
    boats: Math.max(1 + Math.min(view.bustle, 3), view.harbourBoats ?? 0),
    pets,
  };
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
  // Beside the lake, and only there, the city is allowed to go tall: four to six towers in two
  // arcs, exactly as in the place the children live (pha 12 việc 1, reference 02).
  if (lot.cell.tall && (c.type === "decorHouse" || c.type === "garden")) {
    const towers = [
      "commercial/building-skyscraper-a",
      "commercial/building-skyscraper-c",
      "commercial/building-skyscraper-e",
    ] as const;
    const variant = c.type === "decorHouse" ? c.variant : c.variant + 1;
    const m = ctx.lib.model(
      pick(towers, variant),
      { type: "kit", spec: pick(ctx.city.kit, variant), key: `${ctx.city.id}-tower${variant % 3}` },
      TILE * 1.5,
    );
    add(g, m, 0, 0, 0);
    add(g, tree(ctx, variant * 5, 0.7), lot.depth * 0.36, 0, lot.width * 0.36);
    return g;
  }

  if (c.type === "decorHouse" && c.variant % 3 === 0) {
    // A TERRACE, not a villa. Seen from above, the streets the children know are ribbons of narrow
    // houses side by side along the curve, all facing the same way, all with the same roof — that
    // rhythm is most of what makes a satellite photo of their town look like their town (pha 12,
    // reference 03). Three narrow houses cost about what one detached one did.
    const detailed = [
      "suburban/building-type-a",
      "suburban/building-type-o",
      "suburban/building-type-k",
      "commercial/building-c",
    ] as const;
    const key = pick(detailed, c.variant / 3);
    const spec = pick(ctx.city.kit, c.variant);
    const count = lot.width > 7 ? 3 : 2;
    const step = lot.width / count;
    for (let i = 0; i < count; i++) {
      const m = ctx.lib.model(
        key,
        { type: "kit", spec, key: `${ctx.city.id}${c.variant % ctx.city.kit.length}` },
        TILE * 0.92,
      );
      // side by side along the belt (the lot's own +z is tangential once it is turned)
      add(g, m, 0, 0, -lot.width / 2 + step * (i + 0.5));
    }
    add(g, tree(ctx, c.variant * 3, 0.8), lot.depth * 0.34, 0, lot.width * 0.42);
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
