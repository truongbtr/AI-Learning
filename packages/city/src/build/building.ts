// Parametric building parts shared by every theme: bodies with window panels, roofs (flat, hip,
// gable, Vietnamese curved tile roof), scaffolding, cranes, sign blocks.

import { BufferGeometry, Float32BufferAttribute, Mesh, type Object3D, Shape } from "three";
import { type BuildCtx, css } from "./context";
import { add, box, cbox, cone, cyl, extrude, group, quad, sphere, tok } from "./kit";
import { person, worker } from "./props";
import { sign } from "./signs";

export type RoofType = "flat" | "hip" | "gable" | "curved" | "none";

export interface BuildingOpts {
  w?: number;
  d?: number;
  floors?: number;
  fh?: number;
  wall: number;
  trim?: number;
  roof?: number;
  roofType?: RoofType;
  glass?: number;
  band?: boolean;
  plinth?: number;
  door?: number | null;
  awning?: number;
  shopFloor?: number;
  columns?: boolean;
  garden?: boolean;
  ac?: boolean;
  flare?: number;
  /** Window columns per metre (default ≈ 1 per 1.05 m). */
  windowPitch?: number;
}

export interface Built {
  root: Object3D;
  /** Height of the highest point, for mission bubbles. */
  top: number;
}

/** Window panel: glass on a trim frame (4 triangles), or bare glass on tall buildings (2). */
function windowPanel(
  parent: Object3D,
  x: number,
  y: number,
  z: number,
  rotY: number,
  glass: number,
  trim: number,
  framed = true,
  w = 0.62,
  h = 0.66,
) {
  if (framed) {
    const frame = quad(w + 0.12, h + 0.12, trim);
    frame.rotation.y = rotY;
    add(parent, frame, x, y, z);
  }
  const pane = quad(w, h, tok(glass, "glass"));
  pane.rotation.y = rotY;
  const off = 0.012;
  add(parent, pane, x + Math.sin(rotY) * off, y, z + Math.cos(rotY) * off);
}

export function building(o: BuildingOpts): Built {
  const g = group();
  const w = o.w ?? 3;
  const d = o.d ?? 3;
  const floors = o.floors ?? 2;
  const fh = o.fh ?? 1.15;
  const trim = o.trim ?? 0xfff4d8;
  const glass = o.glass ?? 0x7fdcff;
  const roof = o.roof ?? 0xe76f51;
  const roofType = o.roofType ?? "flat";
  const H = floors * fh;
  const plinth = o.plinth ?? 0.18;
  if (plinth > 0.01) add(g, box(w + 0.35, plinth, d + 0.35, 0xf0e8d4), 0, plinth / 2, 0);
  add(g, cbox(w, H, d, o.wall, 0.14), 0, plinth + H / 2, 0);
  const pitch = o.windowPitch ?? 1.05;
  for (let f = 0; f < floors; f++) {
    const y0 = plinth + f * fh;
    if (o.band !== false && f > 0) add(g, box(w + 0.1, 0.08, d + 0.1, trim), 0, y0, 0);
    if (o.shopFloor !== undefined && f === 0) continue;
    const nx = Math.max(1, Math.round(w / pitch));
    const nz = Math.max(1, Math.round(d / pitch));
    const wy = y0 + fh * 0.55;
    for (let i = 0; i < nx; i++) {
      const x = -w / 2 + (i + 0.5) * (w / nx);
      if (f === 0 && o.door !== null && i === nx - 1) continue;
      // only the camera-facing sides: the city camera never rotates (bake drops back faces anyway)
      windowPanel(g, x, wy, d / 2 + 0.01, 0, glass, trim, floors <= 3);
    }
    for (let i = 0; i < nz; i++) {
      const z = -d / 2 + (i + 0.5) * (d / nz);
      windowPanel(g, w / 2 + 0.01, wy, z, Math.PI / 2, glass, trim, floors <= 3);
    }
  }
  if (o.door !== null) {
    const doorX = w / 2 - Math.min(0.8, w / 4);
    add(g, quad(0.7, 0.95, o.door ?? 0x9a623e), doorX, plinth + 0.48, d / 2 + 0.015);
    if (o.awning !== undefined)
      add(g, box(1.1, 0.08, 0.6, o.awning), doorX, plinth + 1.05, d / 2 + 0.3);
  }
  if (o.shopFloor !== undefined) {
    add(g, quad(w - 0.3, fh * 0.72, tok(0xa6eeff, "glass")), 0, plinth + fh * 0.45, d / 2 + 0.015);
    const n = Math.max(2, Math.round(w / 1.1));
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + (i + 0.5) * (w / n);
      const a = box(w / n - 0.06, 0.06, 0.7, i % 2 ? 0xffffff : o.shopFloor);
      a.rotation.x = 0.28;
      add(g, a, x, plinth + fh * 0.98, d / 2 + 0.36);
    }
  }
  let top = plinth + H;
  if (roofType === "flat") {
    add(g, box(w + 0.2, 0.16, d + 0.2, trim), 0, top + 0.08, 0);
    add(g, box(w - 0.5, 0.06, d - 0.5, roof), 0, top + 0.19, 0);
    if (o.ac) add(g, box(0.5, 0.35, 0.5, 0xe2e2e2), -w / 2 + 0.6, top + 0.38, -d / 2 + 0.6);
    if (o.garden) {
      add(g, box(w - 0.9, 0.14, d - 0.9, 0x96e85a), 0, top + 0.28, 0);
      for (const [dx, dz] of [
        [-0.5, -0.4],
        [0.6, 0.3],
      ] as const)
        add(g, sphere(0.25, tok(0x4fc93a, "solid", true), 5, 4), dx, top + 0.45, dz);
    }
    top += 0.3;
  } else if (roofType === "hip") {
    const hh = Math.min(w, d) * 0.42;
    const m = cone(Math.max(w, d) * 0.78, hh, roof, 4);
    m.rotation.y = Math.PI / 4;
    m.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
    add(g, m, 0, top + hh / 2 - 0.02, 0);
    add(g, box(w + 0.25, 0.1, d + 0.25, trim), 0, top + 0.03, 0);
    top += hh;
  } else if (roofType === "curved") {
    const hh = Math.min(w, d) * 0.42;
    add(g, curvedRoof(w, d, hh, roof, o.flare ?? 0.4), 0, top - 0.02, 0);
    top += hh + 0.3;
  } else if (roofType === "gable") {
    const hh = d * 0.38;
    const shape = new Shape();
    shape.moveTo(-d / 2 - 0.25, 0);
    shape.lineTo(d / 2 + 0.25, 0);
    shape.lineTo(0, hh);
    shape.closePath();
    const m = extrude(shape, w + 0.4, roof, `gable${d}`);
    m.rotation.y = Math.PI / 2;
    add(g, m, -(w + 0.4) / 2, top - 0.02, 0);
    top += hh;
  }
  if (o.columns) {
    const n = Math.max(2, Math.round(w / 1.2));
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + (i + 0.5) * (w / n);
      add(g, cyl(0.16, 0.18, H, 0xfffaf0, 6), x, plinth + H / 2, d / 2 + 0.55);
    }
    add(g, box(w + 0.4, 0.22, 1.2, 0xfffaf0), 0, plinth + H + 0.05, d / 2 + 0.3);
  }
  return { root: g, top };
}

/** Vietnamese hip roof: four concave slopes, upturned eave corners, ridge beam with curls. */
export function curvedRoof(
  w: number,
  d: number,
  h: number,
  color: number,
  flare = 0.35,
  overhang = 0.35,
): Object3D {
  const W = w + 2 * overhang;
  const D = d + 2 * overhang;
  const alongX = W >= D;
  const R = Math.abs(W - D);
  const c: [number, number][] = [
    [-W / 2, D / 2],
    [W / 2, D / 2],
    [W / 2, -D / 2],
    [-W / 2, -D / 2],
  ];
  const top = (p: [number, number]): [number, number] =>
    alongX ? [(Math.sign(p[0]) * R) / 2, 0] : [0, (Math.sign(p[1]) * R) / 2];
  const nu = 4;
  const nv = 2;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let f = 0; f < 4; f++) {
    const A = c[f] as [number, number];
    const B = c[(f + 1) % 4] as [number, number];
    const TA = top(A);
    const TB = top(B);
    const base = pos.length / 3;
    for (let j = 0; j <= nv; j++) {
      const v = j / nv;
      const yv = h * v ** 1.7;
      for (let i = 0; i <= nu; i++) {
        const u = i / nu;
        const bx = A[0] + (B[0] - A[0]) * u;
        const bz = A[1] + (B[1] - A[1]) * u;
        const tx = TA[0] + (TB[0] - TA[0]) * u;
        const tz = TA[1] + (TB[1] - TA[1]) * u;
        const curl = flare * Math.abs(u * 2 - 1) ** 5 * (1 - v) ** 2.2;
        pos.push(bx + (tx - bx) * v, yv + curl, bz + (tz - bz) * v);
      }
    }
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const a = base + j * (nu + 1) + i;
        const b = a + 1;
        const cc = a + nu + 1;
        const dd = cc + 1;
        // outward winding (faces go counter-clockwise around the roof seen from above)
        idx.push(a, b, cc, b, dd, cc);
      }
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const g = group();
  g.add(new Mesh(geo, tok(color)));
  add(g, box(Math.max(R, 0.1) + 0.3, 0.14, 0.2, 0xfff0d0), 0, h + 0.03, 0).rotation.y = alongX
    ? 0
    : Math.PI / 2;
  for (const s of [-1, 1]) {
    const curlCone = cone(0.1, 0.4, 0xfff0d0, 4);
    if (alongX) curlCone.rotation.z = -s * 0.9;
    else curlCone.rotation.x = s * 0.9;
    add(g, curlCone, alongX ? (s * R) / 2 : 0, h + 0.2, alongX ? 0 : (s * R) / 2);
  }
  return g;
}

export function scaffold(w: number, d: number, h: number): Object3D {
  const g = group();
  const wood = 0xd49a5a;
  const levels = Math.max(2, Math.round(h / 1.3));
  for (const [x, z] of [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [-w / 2, d / 2],
    [w / 2, d / 2],
  ] as const)
    add(g, box(0.1, h, 0.1, wood), x, h / 2, z);
  for (let l = 1; l <= levels; l++) {
    const y = (l / levels) * h - 0.05;
    add(g, box(w + 0.1, 0.08, 0.08, wood), 0, y, d / 2);
    add(g, box(w + 0.1, 0.08, 0.08, wood), 0, y, -d / 2);
    add(g, box(0.08, 0.08, d + 0.1, wood), w / 2, y, 0);
    add(g, box(0.08, 0.08, d + 0.1, wood), -w / 2, y, 0);
    add(g, box(w + 0.2, 0.05, 0.42, 0xf2d29b), 0, y + 0.07, d / 2 + 0.2);
  }
  const step = h / levels;
  const brace = box(Math.hypot(w / 2, step), 0.06, 0.06, wood);
  brace.rotation.z = Math.atan2(step, w / 2);
  add(g, brace, -w / 4, step / 2, d / 2 + 0.02);
  return g;
}

export function crane(h = 6, arm = 4, color = 0xffc21a): Object3D {
  const g = group();
  add(g, box(0.7, 0.3, 0.7, 0x8a96a8), 0, 0.15, 0);
  add(g, box(0.4, h, 0.4, color), 0, h / 2 + 0.3, 0);
  for (let i = 1; i < Math.floor(h / 0.9); i++)
    add(g, box(0.46, 0.06, 0.46, 0xfff0b0), 0, 0.3 + i * 0.9, 0);
  add(g, box(arm + 1.2, 0.22, 0.3, color), arm / 2 - 0.6, h + 0.4, 0);
  add(g, box(0.7, 0.5, 0.5, 0x8a96a8), -1.0, h + 0.2, 0);
  add(g, box(0.5, 0.45, 0.5, tok(0x9fe2ff, "glass")), 0.2, h + 0.05, 0.35);
  add(g, box(0.03, 1.8, 0.03, 0x333333), arm - 0.3, h - 0.5, 0);
  return g;
}

/** Ground pad + scaffold + a worker waiting — how every not-yet-steady skill looks. */
export function construction(w: number, d: number, h: number, inner: Object3D | null): Built {
  const g = group();
  add(g, box(w + 1.4, 0.12, d + 1.4, 0xf2dca8), 0, 0.06, 0);
  if (inner) add(g, inner, 0, 0.12, 0);
  add(g, scaffold(w + 0.4, d + 0.4, h), 0, 0.12, 0);
  const wk = worker();
  wk.rotation.y = 0.6;
  add(g, wk, w / 2 + 0.3, 0.12, d / 2 + 0.7);
  for (const [x, z] of [
    [w / 2 + 0.6, -d / 2 - 0.5],
    [-w / 2 - 0.6, -d / 2 - 0.5],
  ] as const)
    add(g, cone(0.14, 0.4, 0xff9a2e, 5), x, 0.32, z);
  return { root: g, top: h + 0.4 };
}

/** Cube with a label on its two camera-facing sides (Thành Số blocks, gate blocks). */
export function labelBlock(
  ctx: BuildCtx,
  size: number,
  color: number,
  label: string,
  fg = "#ffffff",
): Object3D {
  const g = group();
  add(g, cbox(size, size, size, color, size * 0.14), 0, size / 2, 0);
  const style = { bg: null, fg, stroke: "rgba(0,0,0,0.15)" };
  const front = sign(ctx.atlas, label, style, size * 0.8);
  add(g, front, 0, size / 2, size / 2 + 0.01);
  const side = sign(ctx.atlas, label, style, size * 0.8);
  side.rotation.y = Math.PI / 2;
  add(g, side, size / 2 + 0.01, size / 2, 0);
  return g;
}

/** Rounded sign plate with text, facing +z. */
export function plate(
  ctx: BuildCtx,
  text: string,
  bg: number,
  fg: string,
  width: number,
  wide = false,
): Object3D {
  return sign(ctx.atlas, text, { bg: css(bg), fg, wide }, width);
}

export { person, worker };
