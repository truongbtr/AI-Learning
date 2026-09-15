// Small props, people and vehicles. Low-poly on purpose: every triangle here repeats hundreds of
// times across a city.

import { type Object3D, Shape } from "three";
import type { KenneyKey } from "../kenney/set";
import { TILE } from "../layout";
import { WORLD } from "../palette";
import type { BuildCtx } from "./context";
import {
  add,
  box,
  cbox,
  cone,
  cyl,
  extrude,
  group,
  ico,
  pick,
  quad,
  rng,
  sphere,
  tok,
  torus,
} from "./kit";

const TREE_KEYS = [
  "nature/tree_fat",
  "nature/tree_simple",
  "nature/tree_fat",
  "nature/tree_default",
] as const;
/** The two cheapest trees (≈ 50–60 triangles) for the forest ring. */
const FOREST_KEYS = ["nature/tree_fat", "nature/tree_simple"] as const;

export function forestTree(ctx: BuildCtx, seed: number, scale = 1, blossom = false): Object3D {
  const r = rng(seed);
  const key = pick(FOREST_KEYS, Math.floor(r() * 2)) as KenneyKey;
  const t = ctx.lib.model(
    key,
    {
      type: "nature",
      leaves: blossom ? WORLD.blossom : WORLD.leaves,
      key: blossom ? "blossom" : "green",
    },
    TILE * 0.6 * scale,
  );
  t.rotation.y = r() * Math.PI * 2;
  return t;
}

/** Kenney tree, repainted bright. `blossom` gives the pink trees of Phố Chữ. */
export function tree(ctx: BuildCtx, seed: number, scale = 1, blossom = false): Object3D {
  const r = rng(seed);
  const key = pick(TREE_KEYS, Math.floor(r() * TREE_KEYS.length)) as KenneyKey;
  const leaves = blossom ? WORLD.blossom : WORLD.leaves;
  const t = ctx.lib.model(
    key,
    { type: "nature", leaves, key: blossom ? "blossom" : "green" },
    TILE * 0.6 * scale,
  );
  t.rotation.y = r() * Math.PI * 2;
  return t;
}

export function palm(ctx: BuildCtx, scale = 1): Object3D {
  return ctx.lib.model(
    "nature/tree_palmTall",
    { type: "nature", leaves: WORLD.leaves, key: "green" },
    TILE * 0.6 * scale,
  );
}

export function bush(color: number = WORLD.leaves[1], s = 1): Object3D {
  const m = ico(0.35 * s, color);
  m.position.y = 0.28 * s;
  m.scale.y = 0.8;
  return m;
}

export function flowerBed(w: number, d: number, seed = 3): Object3D {
  const g = group();
  const r = rng(seed);
  add(g, box(w, 0.22, d, 0xc98f5e), 0, 0.11, 0);
  add(g, box(w - 0.12, 0.04, d - 0.12, 0x7a5236), 0, 0.23, 0);
  const cols = [0xff6fa5, 0xffd447, 0xffffff, 0xb283e0, 0xff8f4a];
  const n = Math.max(3, Math.floor(w * d * 5));
  for (let i = 0; i < n; i++) {
    const f = cone(0.1, 0.16, pick(cols, i), 4);
    f.rotation.x = Math.PI;
    add(g, f, (r() - 0.5) * (w - 0.2), 0.33, (r() - 0.5) * (d - 0.2));
  }
  return g;
}

export function lampPost(): Object3D {
  const g = group();
  add(g, cyl(0.05, 0.07, 2.2, 0x46607a, 5), 0, 1.1, 0);
  add(g, box(0.5, 0.14, 0.26, 0x46607a), 0.18, 2.25, 0);
  add(g, box(0.36, 0.06, 0.2, tok(0xfff1b8, "light")), 0.18, 2.16, 0);
  return g;
}

export function bench(): Object3D {
  const g = group();
  add(g, box(1.2, 0.08, 0.4, 0xc98f5e), 0, 0.42, 0);
  add(g, box(1.2, 0.3, 0.08, 0xc98f5e), 0, 0.62, -0.18);
  for (const dx of [-0.45, 0.45]) add(g, box(0.08, 0.4, 0.36, 0x46607a), dx, 0.2, 0);
  return g;
}

export function fountain(r = 1.5): Object3D {
  const g = group();
  add(g, cyl(r, r, 0.32, 0xf2e4c2, 14), 0, 0.16, 0);
  add(g, cyl(r - 0.2, r - 0.2, 0.06, tok(WORLD.water, "water"), 14), 0, 0.31, 0);
  add(g, cyl(0.25, 0.35, 0.9, 0xf2e4c2, 8), 0, 0.6, 0);
  add(g, cyl(0.7, 0.5, 0.16, 0xf2e4c2, 10), 0, 1.05, 0);
  add(g, cone(0.3, 1.0, tok(0xc8f2ff, "water"), 6), 0, 1.6, 0);
  return g;
}

export function flag(color: number, h = 2.6): Object3D {
  const g = group();
  add(g, cyl(0.04, 0.05, h, 0xe8ecf2, 5), 0, h / 2, 0);
  add(g, box(0.9, 0.55, 0.04, color), 0.47, h - 0.35, 0);
  return g;
}

export function lantern(color = 0xff5a3c, s = 1): Object3D {
  const g = group();
  add(g, box(0.16 * s, 0.05 * s, 0.16 * s, 0xffc93c), 0, 0.4 * s, 0);
  const body = cyl(0.17 * s, 0.17 * s, 0.3 * s, tok(color, "light"), 6);
  add(g, body, 0, 0.22 * s, 0);
  return g;
}

export function lanternString(
  len: number,
  n: number,
  h: number,
  colors = [0xff5a3c, 0xff7a2e],
): Object3D {
  const g = group();
  const wire = box(len, 0.03, 0.03, 0x5a4636);
  add(g, wire, 0, h, 0);
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + ((i + 0.5) * len) / n;
    const sag = -0.25 * Math.sin(((i + 0.5) / n) * Math.PI);
    add(g, lantern(pick(colors, i)), x, h - 0.5 + sag, 0);
  }
  return g;
}

export function cloud(scale: number, seed: number): Object3D {
  const g = group();
  const r = rng(seed);
  const n = 4 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const s = ico((1.1 + r() * 1.3) * scale, 0xffffff, "cloud");
    s.scale.set(1.2, 0.8, 1);
    add(g, s, (i - n / 2) * 1.6 * scale, r() * 0.8 * scale, (r() - 0.5) * 1.6 * scale);
  }
  g.userData.cloud = true;
  return g;
}

export function hill(radius: number, height: number, color: number): Object3D {
  const m = ico(1, color, "solid", 1);
  m.scale.set(radius, height, radius);
  return m;
}

export function balloon(c1: number, c2: number): Object3D {
  const g = group();
  const env = sphere(1.2, c1, 8, 6);
  env.scale.y = 1.15;
  add(g, env, 0, 1.9, 0);
  for (let i = 0; i < 4; i++) {
    const band = torus(1.2, 0.07, c2, 4, 8);
    band.rotation.y = (i * Math.PI) / 4;
    band.scale.y = 1.15;
    add(g, band, 0, 1.9, 0);
  }
  const neck = cone(0.5, 0.7, c1, 6);
  neck.rotation.x = Math.PI;
  add(g, neck, 0, 0.62, 0);
  add(g, box(0.6, 0.4, 0.6, 0xc98f5e), 0, -0.2, 0);
  return g;
}

export function iceCreamCart(): Object3D {
  const g = group();
  add(g, cbox(1.2, 0.7, 0.7, 0xffffff), 0, 0.6, 0);
  add(g, box(1.24, 0.14, 0.74, 0xff8fb1), 0, 0.3, 0);
  for (const x of [-0.35, 0.35]) {
    const w = cyl(0.2, 0.2, 0.1, 0x2b2b3a, 8);
    w.rotation.x = Math.PI / 2;
    add(g, w, x, 0.2, 0.38);
  }
  add(g, cyl(0.03, 0.03, 1.0, 0xffffff, 4), 0, 1.3, 0);
  add(g, cone(0.85, 0.35, 0xff8fb1, 8), 0, 1.9, 0);
  add(g, sphere(0.14, 0xa8ecff, 6, 4), 0.3, 1.1, 0);
  return g;
}

export function statue(color = 0xffd447): Object3D {
  const g = group();
  add(g, cbox(0.9, 0.8, 0.9, 0xf2e4c2), 0, 0.4, 0);
  const p = person(color, { skin: color, hair: color, h: 1.3 });
  add(g, p, 0, 0.8, 0);
  return g;
}

export interface PersonOpts {
  skin?: number;
  hair?: number;
  hat?: number;
  vest?: number;
  h?: number;
}

export function person(
  shirt: number,
  { skin = WORLD.skin, hair = 0x3b2a20, hat, vest, h = 0.95 }: PersonOpts = {},
): Object3D {
  const g = group();
  const s = h / 0.95;
  add(g, box(0.22 * s, 0.34 * s, 0.12 * s, 0x3a4a6a), 0, 0.17 * s, 0);
  add(g, cyl(0.15 * s, 0.17 * s, 0.42 * s, vest ?? shirt, 6), 0, 0.52 * s, 0);
  add(g, ico(0.16 * s, skin), 0, 0.86 * s, 0);
  if (hat !== undefined) {
    const hh = sphere(0.18 * s, hat, 6, 3);
    hh.scale.y = 0.7;
    add(g, hh, 0, 0.94 * s, 0);
  } else {
    const hr = ico(0.165 * s, hair);
    hr.scale.set(1, 0.6, 1);
    add(g, hr, 0, 0.95 * s, -0.02);
  }
  return g;
}

export function worker(): Object3D {
  const g = person(0xffffff, { hat: 0xffc21a, vest: 0xff8a2a });
  const arm = box(0.07, 0.34, 0.08, 0xff8a2a);
  arm.rotation.z = -2.4;
  add(g, arm, 0.22, 0.86, 0);
  return g;
}

export function dog(color = 0xf2c28a): Object3D {
  const g = group();
  add(g, cbox(0.5, 0.24, 0.24, color, 0.06), 0, 0.3, 0);
  add(g, cbox(0.24, 0.22, 0.22, color, 0.05), 0.3, 0.46, 0);
  add(g, box(0.1, 0.1, 0.14, 0x3b2a20), 0.44, 0.44, 0);
  for (const [x, z] of [
    [-0.18, 0.08],
    [0.18, 0.08],
    [-0.18, -0.08],
    [0.18, -0.08],
  ] as const)
    add(g, box(0.07, 0.2, 0.07, color), x, 0.1, z);
  for (const z of [-0.1, 0.1]) add(g, box(0.06, 0.12, 0.1, 0x9a623e), 0.28, 0.6, z);
  return g;
}

export function cat(color = 0xffb56b): Object3D {
  const g = group();
  add(g, cbox(0.42, 0.2, 0.2, color, 0.05), 0, 0.26, 0);
  add(g, cbox(0.22, 0.2, 0.2, color, 0.05), 0.26, 0.42, 0);
  for (const z of [-0.06, 0.06]) add(g, cone(0.05, 0.12, color, 4), 0.28, 0.58, z);
  for (const x of [-0.14, 0.14]) add(g, box(0.06, 0.18, 0.16, color), x, 0.09, 0);
  const tail = box(0.05, 0.32, 0.05, color);
  tail.rotation.z = 0.4;
  add(g, tail, -0.26, 0.4, 0);
  return g;
}

export function bunny(color = 0xffffff): Object3D {
  const g = group();
  add(g, ico(0.2, color), 0, 0.22, 0);
  add(g, ico(0.13, color), 0.16, 0.4, 0);
  for (const z of [-0.05, 0.05]) add(g, box(0.05, 0.22, 0.08, color), 0.14, 0.6, z);
  add(g, box(0.04, 0.1, 0.05, 0xff8fb1), 0.16, 0.6, 0);
  return g;
}

export function duck(): Object3D {
  const g = group();
  add(g, ico(0.2, 0xffd447), 0, 0.18, 0);
  add(g, ico(0.12, 0xffd447), 0.14, 0.36, 0);
  add(g, cone(0.05, 0.12, 0xff8a2a, 4), 0.27, 0.35, 0).rotation.z = -Math.PI / 2;
  return g;
}

function wheel(r: number, w: number): Object3D {
  const m = cyl(r, r, w, 0x2b2b3a, 5);
  m.rotation.x = Math.PI / 2;
  return m;
}

export function car(color: number): Object3D {
  const g = group();
  add(g, cbox(1.6, 0.5, 0.8, color, 0.14), 0, 0.45, 0);
  add(g, cbox(0.9, 0.42, 0.72, tok(0xaee8ff, "glass"), 0.14), -0.1, 0.88, 0);
  add(g, box(0.92, 0.06, 0.74, color), -0.1, 1.1, 0);
  for (const [x, z] of [
    [-0.5, 0.42],
    [0.5, 0.42],
    [-0.5, -0.42],
    [0.5, -0.42],
  ] as const)
    add(g, wheel(0.2, 0.16), x, 0.2, z);
  return g;
}

export function bus(color: number): Object3D {
  const g = group();
  add(g, cbox(3.4, 1.15, 1.2, color, 0.2), 0, 0.85, 0);
  add(g, box(3.3, 0.1, 1.24, 0xffffff), 0, 0.5, 0);
  for (const z of [0.61, -0.61]) {
    const strip = quad(3.0, 0.5, tok(0xaee8ff, "glass"));
    if (z < 0) strip.rotation.y = Math.PI;
    add(g, strip, -0.1, 1.05, z);
  }
  for (const [dx, dz] of [
    [-1.1, 0.6],
    [1.1, 0.6],
    [-1.1, -0.6],
    [1.1, -0.6],
  ] as const)
    add(g, wheel(0.26, 0.2), dx, 0.28, dz);
  return g;
}

export function boat(color: number): Object3D {
  const g = group();
  add(g, cbox(2.6, 0.5, 1.1, 0xffffff, 0.3), 0, 0.1, 0);
  add(g, box(2.7, 0.12, 1.16, color), 0, 0.3, 0);
  add(g, cbox(1.0, 0.6, 0.8, 0xfff6e4), -0.2, 0.7, 0);
  add(g, box(0.9, 0.2, 0.84, tok(0xaee8ff, "glass")), -0.2, 0.82, 0);
  add(g, cyl(0.04, 0.04, 1.4, 0x9a623e, 4), 0.6, 1.0, 0);
  add(g, box(0.5, 0.3, 0.03, 0xffd447), 0.86, 1.55, 0);
  return g;
}

export function trainCar(color: number, engine: boolean): Object3D {
  const g = group();
  add(g, cbox(2.6, 1.1, 1.2, color, 0.22), 0, 0.85, 0);
  add(g, box(2.64, 0.12, 1.24, 0xffffff), 0, 0.55, 0);
  for (const z of [0.61, -0.61]) {
    const strip = quad(2.2, 0.44, tok(0xaee8ff, "glass"));
    if (z < 0) strip.rotation.y = Math.PI;
    add(g, strip, 0, 1.05, z);
  }
  for (const x of [-0.8, 0.8]) {
    add(g, wheel(0.22, 0.14), x, 0.24, 0.5);
    add(g, wheel(0.22, 0.14), x, 0.24, -0.5);
  }
  if (engine) {
    add(g, cbox(0.8, 0.6, 1.0, tok(0xaee8ff, "glass"), 0.2), 1.2, 1.1, 0);
    add(g, cyl(0.18, 0.22, 0.5, 0x46607a, 6), 0.6, 1.6, 0);
  }
  return g;
}

export function gear(radius: number, thickness: number, color: number, teeth = 8): Object3D {
  const shape = new Shape();
  const inner = radius * 0.78;
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2;
    const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? radius : inner;
    if (i === 0) shape.moveTo(Math.cos(a0) * r, Math.sin(a0) * r);
    else shape.lineTo(Math.cos(a0) * r, Math.sin(a0) * r);
    shape.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
  }
  shape.closePath();
  const m = extrude(shape, thickness, color, `gear${radius}|${teeth}`);
  m.position.z = -thickness / 2;
  const g = group();
  g.add(m);
  add(g, cyl(radius * 0.25, radius * 0.25, thickness * 1.4, 0xffd447, 6), 0, 0, 0).rotation.x =
    Math.PI / 2;
  return g;
}

export function book(w: number, h: number, d: number, cover: number): Object3D {
  const g = group();
  add(g, box(w, h, d, cover), 0, h / 2, 0);
  // pages stick out a little on the camera side so no face is coplanar with the cover
  add(g, box(w * 0.92, h * 0.8, d * 0.92, 0xfffaf0), 0.05 * w, h / 2, 0.05 * d);
  return g;
}
