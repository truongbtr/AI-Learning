// Town hall, city gate, badge-unlocked public buildings, what a kid can build on a bought plot,
// and collectible decorations. Codes here are the contract with việc 3 (badge → public building,
// collectible → decoration, kid's plot choice).

import { CylinderGeometry, Mesh, type Object3D } from "three";
import type { KenneyKey } from "../kenney/set";
import { TILE } from "../layout";
import { WORLD } from "../palette";
import { type Built, building, curvedRoof, labelBlock, plate } from "./building";
import { type BuildCtx, css } from "./context";
import {
  add,
  anchor,
  box,
  cbox,
  cone,
  cyl,
  dome,
  group,
  pick,
  quad,
  sphere,
  tok,
  torus,
} from "./kit";
import {
  balloon,
  bench,
  boat,
  bunny,
  bus,
  duck,
  flag,
  flowerBed,
  fountain,
  iceCreamCart,
  lampPost,
  lanternString,
  person,
  statue,
  trainCar,
  tree,
} from "./props";

const kid = (c: number) => person(c, { h: 0.7 });

// ------------------------------------------------------------------ town hall & gate
export function townHall(ctx: BuildCtx, order: "none" | "open" | "done"): Built {
  const C = ctx.city;
  const g = group();
  const b = building({
    w: 6.0,
    d: 3.8,
    floors: 2,
    fh: 1.4,
    wall: 0xfffaf0,
    roof: C.a,
    trim: 0xffffff,
    glass: C.glass,
    columns: true,
    band: false,
  });
  add(g, b.root);
  const top = b.top;
  add(g, cbox(1.4, 3.0, 1.4, 0xfffaf0), 0, top + 1.5, 0);
  const face = cyl(0.46, 0.46, 0.08, 0xffffff, 12);
  face.rotation.x = Math.PI / 2;
  add(g, face, 0, top + 2.4, 0.72);
  add(g, box(0.07, 0.32, 0.03, 0x1f3a5f), 0, top + 2.52, 0.77);
  add(g, box(0.24, 0.07, 0.03, 0x1f3a5f), 0.1, top + 2.4, 0.77);
  const cap = cone(1.1, 0.9, C.a, 4);
  cap.rotation.y = Math.PI / 4;
  add(g, cap, 0, top + 3.45, 0);
  add(g, sphere(0.16, tok(0xffe066, "light"), 6, 4), 0, top + 4.0, 0);
  add(g, plate(ctx, "TOÀ THỊ CHÍNH", 0xffffff, css(C.a), 3.6, true), 0, top - 0.55, 1.96);
  add(g, flag(C.a, 3.0), -3.4, 0, 2.6);
  add(g, flag(C.b, 3.0), 3.4, 0, 2.6);
  // order board (đơn của Toà Thị Chính) — the UI bubble anchors to it
  const board = group();
  for (const x of [-0.7, 0.7]) add(board, cyl(0.06, 0.06, 1.8, 0x9a623e, 4), x, 0.9, 0);
  add(board, box(1.8, 1.2, 0.12, 0xc98f5e), 0, 1.35, 0);
  add(
    board,
    quad(
      1.5,
      0.95,
      order === "none" ? 0xf6ead0 : tok(0xfffaf0, order === "done" ? "light" : "solid"),
    ),
    0,
    1.35,
    0.07,
  );
  board.rotation.y = -0.35;
  add(g, board, 2.3, 0, 3.8);
  anchor(g, "townHall:order", 2.3, 3.2, 3.8);
  if (order === "done") add(g, lanternString(6, 9, 3.0), 0, 0, 2.9);
  return { root: g, top: top + 4.2 };
}

export function cityGate(ctx: BuildCtx, width = 4.6): Object3D {
  const C = ctx.city;
  const g = group();
  const h = 4.6;
  const viet = C.id === "viet";
  for (const s of [-1, 1]) {
    add(g, box(0.9, 0.5, 0.9, 0xfff6e4), (s * width) / 2, 0.25, 0);
    add(g, cbox(0.6, h, 0.6, viet ? 0xe76f51 : C.a), (s * width) / 2, h / 2 + 0.3, 0);
    if (viet) add(g, curvedRoof(1.0, 1.0, 0.45, 0x5c7a8a, 0.25, 0.2), (s * width) / 2, h + 0.3, 0);
    else
      add(
        g,
        labelBlock(ctx, 0.9, pick(C.blocks, s < 0 ? 0 : 2), s < 0 ? "A" : "1"),
        (s * width) / 2,
        h + 0.3,
        0,
      );
  }
  add(g, box(width + 1.2, 0.3, 0.7, viet ? 0xe76f51 : C.a), 0, h - 0.1, 0);
  add(g, box(width * 0.84, 1.2, 0.2, viet ? 0xffc93c : C.b), 0, h + 0.75, 0);
  add(g, plate(ctx, C.name.toUpperCase(), 0xfffaf0, C.ink, width * 0.78, true), 0, h + 0.75, 0.12);
  if (viet) add(g, curvedRoof(width * 0.9, 1.2, 0.8, 0xe76f51, 0.45, 0.3), 0, h + 1.35, 0);
  return g;
}

// ------------------------------------------------------------------ public buildings (badges)
type PublicBuilder = (ctx: BuildCtx) => Built;

const school: PublicBuilder = (ctx) => {
  const C = ctx.city;
  const g = group();
  const b = building({
    w: 6.4,
    d: 3.0,
    floors: 2,
    fh: 1.3,
    wall: 0xfff1d6,
    roof: C.a,
    roofType: "hip",
    trim: 0xffffff,
    glass: C.glass,
  });
  add(g, b.root, 0, 0, -0.6);
  add(g, plate(ctx, "TRƯỜNG HỌC", 0xffffff, C.ink, 3.2, true), 0, 2.2, 0.92);
  add(g, box(7.4, 0.05, 2.2, 0xffc7a0), 0, 0.03, 2.3);
  add(g, flag(0xffd447, 3.4), -3.0, 0, 1.8);
  add(g, bus(0xffc93c), 1.6, 0.03, 2.4);
  for (const [x, z, c] of [
    [-1.2, 2.0, 0xff6f61],
    [-0.5, 2.5, 0x5e93d6],
  ] as const)
    add(g, kid(c), x, 0.06, z);
  return { root: g, top: b.top + 0.3 };
};

const library: PublicBuilder = (ctx) => {
  const g = group();
  const b = building({
    w: 5.0,
    d: 3.0,
    floors: 2,
    fh: 1.35,
    wall: 0xf1e9ff,
    roof: 0x8e7cc3,
    roofType: "flat",
    trim: 0xffffff,
    glass: ctx.city.glass,
    columns: true,
    band: false,
  });
  add(g, b.root, 0, 0, -0.6);
  add(g, dome(1.2, 0x8e7cc3, 10), 0, b.top - 0.1, -0.6);
  add(g, plate(ctx, "THƯ VIỆN", 0x8e7cc3, "#ffffff", 3.0, true), 0, 2.2, 1.46);
  return { root: g, top: b.top + 1.3 };
};

const playground: PublicBuilder = () => {
  const g = group();
  add(g, box(9, 0.06, 5.6, 0xffb98a), 0, 0.03, 0);
  add(g, box(1.4, 0.12, 1.4, 0xffd447), -2.8, 1.6, -1.0);
  for (const [x, z] of [
    [-3.4, -1.6],
    [-2.2, -1.6],
    [-3.4, -0.4],
    [-2.2, -0.4],
  ] as const)
    add(g, cyl(0.07, 0.07, 2.8, 0x5e93d6, 4), x, 1.4, z);
  const roof = cone(1.1, 0.9, 0xff6f61, 4);
  roof.rotation.y = Math.PI / 4;
  add(g, roof, -2.8, 3.2, -1.0);
  const slide = box(0.8, 0.08, 2.8, 0x6fcf5a);
  slide.rotation.x = 0.55;
  add(g, slide, -2.8, 0.85, 1.0);
  add(g, box(3.2, 0.12, 0.12, 0xff6f61), 1.8, 2.2, -1.4);
  for (const x of [0.3, 3.3]) add(g, box(0.1, 2.3, 0.1, 0xff6f61), x, 1.1, -1.4);
  for (const x of [1.1, 2.5]) add(g, box(0.6, 0.08, 0.3, 0xffd447), x, 0.8, -1.4);
  const ss = box(2.4, 0.1, 0.3, 0xb283e0);
  ss.rotation.z = 0.2;
  add(g, ss, 2.0, 0.55, 1.2);
  add(g, cone(0.3, 0.45, 0x5e93d6, 4), 2.0, 0.25, 1.2);
  add(g, box(1.8, 0.24, 1.8, 0xffffff), -0.6, 0.12, 1.4);
  add(g, box(1.5, 0.08, 1.5, WORLD.sand), -0.6, 0.26, 1.4);
  for (const [x, z, c] of [
    [1.0, 0.1, 0xff6f61],
    [2.8, 0.4, 0x5e93d6],
    [-0.4, 1.4, 0xffd447],
  ] as const)
    add(g, kid(c), x, 0.06, z);
  return { root: g, top: 3.8 };
};

const pool: PublicBuilder = () => {
  const g = group();
  add(g, box(9, 0.2, 5.4, 0xffffff), 0, 0.1, 0);
  add(g, box(7.4, 0.06, 3.8, tok(0x5fd3f7, "water")), 0, 0.22, 0);
  for (let i = 1; i < 4; i++)
    add(g, box(7.2, 0.02, 0.06, i % 2 ? 0xff6f61 : 0xffd447), 0, 0.26, -1.9 + i * 0.95);
  for (const [x, c] of [
    [-3.0, 0xff8fb1],
    [-1.6, 0xffd447],
  ] as const) {
    add(g, cone(0.9, 0.35, c, 8), x, 1.6, 2.4);
    add(g, cyl(0.03, 0.03, 1.5, 0xffffff, 4), x, 0.9, 2.4);
  }
  const ring = torus(0.35, 0.12, 0xff6f61, 4, 10);
  ring.rotation.x = Math.PI / 2;
  add(g, ring, 1.2, 0.3, 0.5);
  const slide = box(0.6, 0.08, 2.2, 0x5e93d6);
  slide.rotation.x = -0.5;
  add(g, slide, 3.6, 0.8, -1.2);
  return { root: g, top: 2.2 };
};

const football: PublicBuilder = () => {
  const g = group();
  add(g, box(9.4, 0.06, 5.6, 0x55c83c), 0, 0.03, 0);
  for (let i = 0; i < 6; i++)
    add(
      g,
      box(9.4 / 6, 0.01, 5.5, i % 2 ? 0x5fd446 : 0x4fbf38),
      -4.7 + (i + 0.5) * (9.4 / 6),
      0.065,
      0,
    );
  const line = 0xffffff;
  add(g, box(8.6, 0.02, 0.08, line), 0, 0.08, -2.5);
  add(g, box(8.6, 0.02, 0.08, line), 0, 0.08, 2.5);
  for (const x of [-4.3, 0, 4.3]) add(g, box(0.08, 0.02, 5.0, line), x, 0.08, 0);
  for (const s of [-1, 1]) {
    add(g, box(0.08, 0.9, 1.7, line), s * 4.3, 0.45, 0);
    add(g, box(0.1, 0.9, 0.1, line), s * 4.3, 0.45, -0.85);
    add(g, box(0.1, 0.9, 0.1, line), s * 4.3, 0.45, 0.85);
  }
  add(g, sphere(0.16, 0xffffff, 6, 4), 1.2, 0.2, 0.4);
  for (const [x, z, c] of [
    [-2, -1, 0xff6f61],
    [-1, 1.2, 0xff6f61],
    [2, -0.4, 0x5e93d6],
    [2.8, 1.0, 0x5e93d6],
  ] as const)
    add(g, kid(c), x, 0.06, z);
  return { root: g, top: 1.4 };
};

function stripedCylinder(
  r: number,
  h: number,
  colors: [number, number],
  seg = 12,
  open = false,
): Object3D {
  const g = group();
  for (let i = 0; i < seg; i++) {
    const geo = new CylinderGeometry(
      r,
      r,
      h,
      1,
      1,
      open,
      (i / seg) * Math.PI * 2,
      (Math.PI * 2) / seg,
    );
    g.add(new Mesh(geo, tok(i % 2 ? colors[1] : colors[0])));
  }
  return g;
}

const circus: PublicBuilder = () => {
  const g = group();
  add(g, stripedCylinder(3, 1.8, [0xff6f61, 0xffffff], 12), 0, 0.9, 0);
  for (let i = 0; i < 12; i++) {
    const geo = new CylinderGeometry(0, 3.4, 2.6, 1, 1, false, (i / 12) * Math.PI * 2, Math.PI / 6);
    add(g, new Mesh(geo, tok(i % 2 ? 0xff6f61 : 0xffd447)), 0, 3.1, 0);
  }
  add(g, flag(0x5e93d6, 1.2), 0, 4.3, 0);
  add(g, quad(1.2, 1.3, 0x5e2a4a), 0, 0.65, 3.02);
  return { root: g, top: 5.6 };
};

const zoo: PublicBuilder = (ctx) => {
  const g = group();
  add(g, box(9, 0.06, 5.4, 0xbdeb7a), 0, 0.03, 0);
  for (const z of [-2.6, 2.6]) add(g, box(9, 0.5, 0.06, 0xa8703f), 0, 0.35, z);
  for (const x of [-4.5, 4.5]) add(g, box(0.06, 0.5, 5.2, 0xa8703f), x, 0.35, 0);
  const y = 0xffc93c;
  const gir = group();
  add(gir, cbox(1.1, 0.6, 0.5, y, 0.1), 0, 1.3, 0);
  for (const [x, z] of [
    [-0.4, 0.18],
    [0.4, 0.18],
    [-0.4, -0.18],
    [0.4, -0.18],
  ] as const)
    add(gir, box(0.12, 1.0, 0.12, y), x, 0.5, z);
  const neck = box(0.22, 1.5, 0.22, y);
  neck.rotation.z = -0.35;
  add(gir, neck, 0.62, 2.1, 0);
  add(gir, cbox(0.5, 0.28, 0.28, y, 0.06), 0.98, 2.85, 0);
  for (const [x, yy] of [
    [-0.2, 1.45],
    [0.25, 1.35],
  ] as const)
    add(gir, box(0.18, 0.04, 0.52, 0xc47a2a), x, yy, 0);
  add(g, gir, -2.0, 0.06, 0);
  const el = group();
  const grey = 0xa9b8d0;
  add(el, cbox(1.5, 1.0, 0.9, grey, 0.25), 0, 1.0, 0);
  for (const [x, z] of [
    [-0.5, 0.3],
    [0.5, 0.3],
    [-0.5, -0.3],
    [0.5, -0.3],
  ] as const)
    add(el, cyl(0.17, 0.17, 0.6, grey, 6), x, 0.3, z);
  add(el, sphere(0.45, grey, 7, 5), 0.85, 1.2, 0);
  const trunk = cyl(0.08, 0.12, 0.8, grey, 5);
  trunk.rotation.z = 0.3;
  add(el, trunk, 1.25, 0.8, 0);
  for (const z of [-0.45, 0.45]) add(el, box(0.08, 0.6, 0.5, 0xc4d0e2), 0.7, 1.25, z);
  add(g, el, 1.4, 0.06, 0.6);
  add(g, tree(ctx, 11, 1.1), -3.6, 0, 1.8);
  add(g, tree(ctx, 12, 1.1), 3.6, 0, -1.8);
  return { root: g, top: 3.4 };
};

const station: PublicBuilder = (ctx) => {
  const C = ctx.city;
  const g = group();
  const b = building({
    w: 5.4,
    d: 2.4,
    floors: 1,
    fh: 1.8,
    wall: 0xfff1d6,
    roof: C.a,
    roofType: "gable",
    trim: 0xffffff,
    glass: C.glass,
  });
  add(g, b.root, 0, 0, -1.2);
  add(g, plate(ctx, "GA TÀU", C.b, C.ink, 2.4, true), 0, 1.5, 0.02);
  add(g, box(9, 0.3, 1.4, 0xe6dccb), 0, 0.15, 0.9);
  add(g, box(9, 0.08, 1.6, 0xd8cdb8), 0, 0.04, 2.2);
  for (const z of [1.8, 2.6]) add(g, box(9, 0.08, 0.08, 0x8a96a8), 0, 0.14, z);
  [0xff6f61, 0xffd447, 0x5e93d6].forEach((c, i) => {
    add(g, trainCar(c, i === 0), 2.8 - i * 2.8, 0.1, 2.2);
  });
  return { root: g, top: 3.4 };
};

const ferris: PublicBuilder = () => {
  const g = group();
  const R = 3.2;
  const wheelG = group();
  add(wheelG, torus(R, 0.1, 0xff8fb1, 4, 24));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const sp = box(R, 0.06, 0.06, 0xffffff);
    sp.rotation.z = a;
    add(wheelG, sp, (Math.cos(a) * R) / 2, (Math.sin(a) * R) / 2, 0);
    add(
      wheelG,
      cbox(0.5, 0.5, 0.5, pick([0xff6f61, 0xffd447, 0x5e93d6, 0x6fcf5a], i), 0.12),
      Math.cos(a) * R,
      Math.sin(a) * R - 0.3,
      0.1,
    );
  }
  add(g, wheelG, 0, R + 1.0, 0);
  for (const s of [-1, 1]) {
    const leg = box(0.15, R + 1.4, 0.15, 0xffffff);
    leg.rotation.z = s * 0.3;
    add(g, leg, s * 0.6, (R + 1.0) / 2, -0.35);
  }
  g.rotation.y = Math.PI / 2;
  const holder = group();
  holder.add(g);
  return { root: holder, top: 2 * R + 1.4 };
};

const market: PublicBuilder = () => {
  const g = group();
  const cols = [0xe76f51, 0x6fae5a, 0xffc93c, 0x5fb8e8];
  cols.forEach((c1, i) => {
    const st = group();
    add(st, box(1.8, 0.7, 1.0, 0xc98f5e), 0, 0.35, 0);
    for (const [dx, dz] of [
      [-0.8, -0.45],
      [0.8, -0.45],
      [-0.8, 0.45],
      [0.8, 0.45],
    ] as const)
      add(st, box(0.06, 1.6, 0.06, 0xffffff), dx, 0.8, dz);
    for (let k = 0; k < 4; k++)
      add(st, box(0.45, 0.06, 1.3, k % 2 ? 0xffffff : c1), -0.68 + k * 0.45, 1.65, 0);
    for (let k = 0; k < 5; k++)
      add(
        st,
        sphere(0.11, pick([0xff7043, 0xffd447, 0x6fcf5a, 0xff8fb1], k + i), 5, 4),
        -0.6 + k * 0.3,
        0.8,
        0.1,
      );
    add(g, st, -3.3 + i * 2.2, 0, -0.4);
  });
  for (const [x, z, c] of [
    [-2, 1.2, 0xff6f61],
    [1.4, 1.6, 0x5e93d6],
  ] as const)
    add(g, person(c), x, 0, z);
  return { root: g, top: 2.4 };
};

const fireStation: PublicBuilder = (ctx) => {
  const g = group();
  const b = building({
    w: 5.6,
    d: 3.0,
    floors: 2,
    fh: 1.4,
    wall: 0xff8a5c,
    roof: 0xffffff,
    roofType: "flat",
    trim: 0xffffff,
    glass: ctx.city.glass,
    door: null,
  });
  add(g, b.root, 0, 0, -0.6);
  for (const x of [-1.4, 1.4]) add(g, quad(2.0, 1.2, 0xfff1d6), x, 0.78, 0.92);
  add(g, plate(ctx, "CỨU HOẢ", 0xffffff, "#e76f51", 2.6, true), 0, 2.2, 0.93);
  const truck = group();
  add(truck, cbox(3.0, 1.0, 1.2, 0xff6f61, 0.2), 0, 0.7, 0);
  add(truck, box(2.6, 0.12, 0.3, 0xdfe6ee), -0.2, 1.3, 0);
  add(truck, box(0.8, 0.5, 1.0, tok(0xaee8ff, "glass")), 1.2, 1.1, 0);
  add(g, truck, 1.4, 0.03, 2.2);
  return { root: g, top: b.top + 0.3 };
};

const postOffice: PublicBuilder = (ctx) => {
  const g = group();
  const b = building({
    w: 4.6,
    d: 3.0,
    floors: 1,
    fh: 1.9,
    wall: 0xfff1a8,
    roof: 0x5e93d6,
    roofType: "gable",
    trim: 0xffffff,
    glass: ctx.city.glass,
  });
  add(g, b.root, 0, 0, -0.6);
  add(g, plate(ctx, "BƯU ĐIỆN", 0x5e93d6, "#ffffff", 2.6, true), 0, 1.7, 0.92);
  const box1 = group();
  add(box1, cbox(0.6, 1.0, 0.5, 0xffd447, 0.12), 0, 0.5, 0);
  add(box1, dome(0.3, 0xffd447, 8), 0, 1.0, 0);
  add(g, box1, -2.6, 0, 1.8);
  return { root: g, top: b.top + 0.3 };
};

const museum: PublicBuilder = (ctx) => {
  const g = group();
  const b = building({
    w: 6.0,
    d: 3.2,
    floors: 2,
    fh: 1.5,
    wall: 0xfbf3e2,
    roof: 0xe9dcc0,
    roofType: "flat",
    trim: 0xffffff,
    glass: ctx.city.glass,
    columns: true,
    band: false,
  });
  add(g, b.root, 0, 0, -0.8);
  const roof = cone(3.6, 1.2, 0xe9dcc0, 4);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1, 1, 0.55);
  add(g, roof, 0, b.top + 0.55, -0.5);
  add(g, plate(ctx, "BẢO TÀNG", 0xffffff, ctx.city.ink, 3.0, true), 0, b.top - 0.3, 1.36);
  const dino = group();
  add(dino, cbox(1.4, 0.6, 0.5, 0x6fcf5a, 0.15), 0, 1.1, 0);
  const neck = box(0.25, 1.2, 0.25, 0x6fcf5a);
  neck.rotation.z = -0.5;
  add(dino, neck, 0.8, 1.7, 0);
  add(dino, cbox(0.5, 0.3, 0.3, 0x6fcf5a, 0.08), 1.2, 2.25, 0);
  for (const x of [-0.4, 0.4]) add(dino, box(0.18, 0.8, 0.4, 0x6fcf5a), x, 0.4, 0);
  add(g, dino, 2.8, 0.06, 1.8);
  return { root: g, top: b.top + 1.6 };
};

const theater: PublicBuilder = (ctx) => {
  const g = group();
  const b = building({
    w: 5.4,
    d: 3.4,
    floors: 2,
    fh: 1.5,
    wall: 0xb283e0,
    roof: 0xffd447,
    roofType: "flat",
    trim: 0xffd447,
    glass: ctx.city.glass,
  });
  add(g, b.root, 0, 0, -0.6);
  add(g, dome(1.6, 0xffd447, 12), 0, b.top - 0.1, -0.6);
  add(g, box(4.6, 0.8, 0.2, 0xffffff), 0, 2.4, 1.2);
  add(g, plate(ctx, "NHÀ HÁT", 0xffffff, "#8e5cc7", 2.6, true), 0, 2.4, 1.31);
  for (let i = 0; i < 9; i++)
    add(g, sphere(0.1, tok(0xfff3a0, "light"), 4, 3), -2.2 + i * 0.55, 2.9, 1.25);
  return { root: g, top: b.top + 1.8 };
};

const aquarium: PublicBuilder = (ctx) => {
  const g = group();
  add(g, cbox(5.8, 2.2, 3.0, 0x5fb8e8, 0.4), 0, 1.1, -0.6);
  add(g, dome(1.8, tok(0xa6eeff, "glass"), 12), 0, 2.1, -0.6);
  add(g, plate(ctx, "THUỶ CUNG", 0xffffff, "#1f7a70", 2.6, true), 0, 1.4, 0.92);
  const fish = group();
  add(fish, sphere(0.5, 0xff9f43, 6, 4), 0, 0, 0).scale.set(1.4, 1, 0.5);
  add(fish, cone(0.35, 0.5, 0xff9f43, 4), -0.8, 0, 0).rotation.z = Math.PI / 2;
  add(g, fish, 0, 4.5, -0.6);
  add(g, boat(0x2a9d8f), 2.8, 0.2, 2.2);
  return { root: g, top: 5.2 };
};

export const PUBLIC_BUILDINGS: Record<string, { nameVi: string; build: PublicBuilder }> = {
  school: { nameVi: "Trường học", build: school },
  library: { nameVi: "Thư viện", build: library },
  playground: { nameVi: "Sân chơi", build: playground },
  pool: { nameVi: "Bể bơi", build: pool },
  football: { nameVi: "Sân bóng", build: football },
  circus: { nameVi: "Rạp xiếc", build: circus },
  zoo: { nameVi: "Vườn thú", build: zoo },
  station: { nameVi: "Ga tàu", build: station },
  ferris: { nameVi: "Vòng quay", build: ferris },
  market: { nameVi: "Chợ", build: market },
  fireStation: { nameVi: "Trạm cứu hoả", build: fireStation },
  postOffice: { nameVi: "Bưu điện", build: postOffice },
  museum: { nameVi: "Bảo tàng", build: museum },
  theater: { nameVi: "Nhà hát", build: theater },
  aquarium: { nameVi: "Thuỷ cung", build: aquarium },
};

// ------------------------------------------------------------------ kid's plots
type PlotBuilder = (ctx: BuildCtx, seed: number) => Built;

const kenneyOn = (
  ctx: BuildCtx,
  key: KenneyKey,
  variant: number,
  scale = TILE * 1.25,
): Object3D => {
  const spec = pick(ctx.city.kit, variant);
  return ctx.lib.model(
    key,
    { type: "kit", spec, key: `${ctx.city.id}${variant % ctx.city.kit.length}` },
    scale,
  );
};

export const PLOT_CATALOGUE: Record<string, { nameVi: string; build: PlotBuilder }> = {
  house: {
    nameVi: "Nhà xinh",
    build: (ctx, seed) => {
      const g = group();
      add(
        g,
        kenneyOn(
          ctx,
          pick(
            [
              "suburban/building-type-a",
              "suburban/building-type-o",
              "suburban/building-type-c",
            ] as const,
            seed,
          ),
          seed,
        ),
      );
      add(g, flowerBed(1.2, 0.4, seed), 1.6, 0, 2.2);
      return { root: g, top: 4 };
    },
  },
  shop: {
    nameVi: "Cửa hàng",
    build: (ctx, seed) => ({
      root: kenneyOn(
        ctx,
        pick(["commercial/building-a", "commercial/building-c"] as const, seed),
        seed,
      ),
      top: 5,
    }),
  },
  tower: {
    nameVi: "Toà nhà cao",
    build: (ctx, seed) => ({
      root: kenneyOn(
        ctx,
        pick(
          ["commercial/building-skyscraper-a", "commercial/building-skyscraper-e"] as const,
          seed,
        ),
        seed,
        TILE * 1.2,
      ),
      top: 16,
    }),
  },
  garden: {
    nameVi: "Vườn hoa",
    build: (ctx, seed) => {
      const g = group();
      add(g, box(5.8, 0.08, 5.8, 0x96e85a), 0, 0.04, 0);
      add(g, flowerBed(2.2, 0.8, seed), -1.2, 0, 1.4);
      add(g, flowerBed(2.2, 0.8, seed + 1), 1.2, 0, -1.4);
      add(g, tree(ctx, seed, 1.1, ctx.city.id === "viet"), -1.6, 0, -1.6);
      add(g, bench(), 1.4, 0, 1.4);
      return { root: g, top: 3 };
    },
  },
  pond: {
    nameVi: "Ao vịt",
    build: (ctx, seed) => {
      const g = group();
      add(g, cyl(2.6, 2.8, 0.14, 0xe8dcc4, 12), 0, 0.07, 0);
      add(g, cyl(2.3, 2.3, 0.06, tok(WORLD.water, "water"), 12), 0, 0.15, 0);
      add(g, duck(), -0.6, 0.12, 0.4);
      add(g, duck(), 0.8, 0.12, -0.5).rotation.y = 2;
      add(g, tree(ctx, seed, 1.0), 2.4, 0, -2.2);
      return { root: g, top: 2 };
    },
  },
  windmill: {
    nameVi: "Cối xay gió",
    build: (ctx, seed) => ({
      root: kenneyOn(ctx, "industrial/windmill", seed, TILE * 1.4),
      top: 8,
    }),
  },
  miniPark: {
    nameVi: "Công viên nhỏ",
    build: (ctx, seed) => {
      const g = group();
      add(g, box(5.8, 0.08, 5.8, 0xa8ec6a), 0, 0.04, 0);
      add(g, fountain(1.2), 0, 0.06, 0);
      for (const [x, z] of [
        [-2, -2],
        [2, 2],
      ] as const)
        add(g, tree(ctx, seed + x, 1.0), x, 0, z);
      add(g, lampPost(), 2, 0, -2);
      return { root: g, top: 3 };
    },
  },
  treehouse: {
    nameVi: "Nhà trên cây",
    build: (ctx) => {
      const g = group();
      add(g, cyl(0.4, 0.6, 3.2, 0x9a6a45, 7), 0, 1.6, 0);
      for (let i = 0; i < 5; i++)
        add(
          g,
          sphere(1.1, tok(pick(WORLD.leaves, i), "solid", true), 5, 4),
          Math.cos(i * 1.3) * 1.1,
          4.2 + (i % 2) * 0.4,
          Math.sin(i * 1.3) * 1.1,
        );
      const house = building({
        w: 1.8,
        d: 1.6,
        floors: 1,
        fh: 1.1,
        wall: 0xffd98a,
        roof: ctx.city.a,
        roofType: "hip",
        trim: 0xffffff,
        glass: ctx.city.glass,
        plinth: 0.1,
      });
      add(g, house.root, 0.4, 2.6, 0.6);
      add(g, box(0.1, 2.6, 0.5, 0xc98f5e), 1.4, 1.3, 1.4).rotation.z = 0.2;
      return { root: g, top: 6 };
    },
  },
  bakery: {
    nameVi: "Tiệm bánh",
    build: (ctx) => {
      const g = group();
      const b = building({
        w: 3.4,
        d: 3.0,
        floors: 1,
        fh: 1.8,
        wall: 0xffe6f0,
        roof: 0xff8fb1,
        roofType: "gable",
        trim: 0xffffff,
        glass: ctx.city.glass,
        shopFloor: 0xff8fb1,
      });
      add(g, b.root);
      const cake = group();
      add(cake, cyl(0.5, 0.5, 0.35, 0xfff1d6, 10), 0, 0.18, 0);
      add(cake, cyl(0.38, 0.38, 0.3, 0xff8fb1, 10), 0, 0.5, 0);
      add(cake, sphere(0.1, tok(0xff5a3c, "light"), 4, 3), 0, 0.72, 0);
      add(g, cake, 0, b.top + 0.1, 0);
      return { root: g, top: b.top + 1 };
    },
  },
  lighthouse: {
    nameVi: "Tháp canh nhỏ",
    build: (ctx) => {
      const g = group();
      for (let i = 0; i < 4; i++)
        add(
          g,
          cyl(0.8 - i * 0.08, 0.88 - i * 0.08, 1.2, i % 2 ? ctx.city.a : 0xffffff, 8),
          0,
          0.6 + i * 1.2,
          0,
        );
      add(g, cyl(0.5, 0.5, 0.7, tok(0xfff3a0, "light"), 8), 0, 5.15, 0);
      add(g, cone(0.7, 0.7, ctx.city.b, 8), 0, 5.85, 0);
      return { root: g, top: 6.6 };
    },
  },
};

// ------------------------------------------------------------------ decorations (collectibles)
export const DECORATIONS: Record<
  string,
  { nameVi: string; build: (ctx: BuildCtx, seed: number) => Object3D }
> = {
  fountain: { nameVi: "Đài phun nước", build: () => fountain(1.3) },
  statue: { nameVi: "Tượng vàng", build: () => statue(0xffd447) },
  balloon: {
    nameVi: "Khinh khí cầu",
    build: (ctx, seed) => {
      const g = group();
      add(g, balloon(pick(ctx.city.blocks, seed), 0xffffff), 0, 7 + (seed % 3), 0);
      return g;
    },
  },
  iceCream: { nameVi: "Xe kem", build: () => iceCreamCart() },
  flowerBed: { nameVi: "Bồn hoa", build: (_ctx, seed) => flowerBed(1.8, 0.8, seed) },
  bench: {
    nameVi: "Ghế đá và đèn",
    build: () => {
      const g = group();
      add(g, bench());
      add(g, lampPost(), 0.9, 0, -0.3);
      return g;
    },
  },
  carousel: {
    nameVi: "Vòng ngựa gỗ",
    build: () => {
      const g = group();
      add(g, cyl(1.3, 1.3, 0.2, 0xffffff, 12), 0, 0.1, 0);
      add(g, cyl(0.12, 0.12, 2.2, 0xffd447, 6), 0, 1.2, 0);
      add(g, cone(1.5, 0.7, 0xff8fb1, 12), 0, 2.55, 0);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        add(g, cyl(0.03, 0.03, 1.9, 0xffffff, 3), Math.cos(a), 1.2, Math.sin(a));
        add(
          g,
          cbox(0.5, 0.3, 0.2, pick([0xff6f61, 0x5e93d6, 0xffd447], i), 0.06),
          Math.cos(a),
          0.9,
          Math.sin(a),
        ).rotation.y = -a;
      }
      return g;
    },
  },
  rainbow: {
    nameVi: "Cổng cầu vồng",
    build: () => {
      const g = group();
      [0xff6f61, 0xff9f43, 0xffd447, 0x6fcf5a, 0x5e93d6, 0xb283e0].forEach((c, i) => {
        const arc = new Mesh(
          new CylinderGeometry(
            2.2 - i * 0.18,
            2.2 - i * 0.18,
            0.3,
            14,
            1,
            true,
            -Math.PI / 2,
            Math.PI,
          ),
          tok(c),
        );
        arc.rotation.set(Math.PI / 2, 0, Math.PI / 2);
        add(g, arc, 0, 0.1, 0);
      });
      return g;
    },
  },
  bunnyHouse: {
    nameVi: "Chuồng thỏ",
    build: () => {
      const g = group();
      add(g, box(1.4, 0.9, 1.0, 0xffe0b8), 0, 0.45, 0);
      add(g, cone(1.1, 0.6, 0xff8fb1, 4), 0, 1.2, 0).rotation.y = Math.PI / 4;
      add(g, bunny(), 1.1, 0, 0.5);
      return g;
    },
  },
  kiteStand: {
    nameVi: "Diều",
    build: (ctx, seed) => {
      const g = group();
      add(g, cyl(0.02, 0.02, 5, 0xffffff, 3), 0, 2.5, 0).rotation.z = 0.35;
      const kite = cone(0.7, 0.2, pick(ctx.city.blocks, seed), 4);
      kite.rotation.set(Math.PI / 2, 0, 0.3);
      add(g, kite, 0.9, 5.0, 0);
      add(g, person(pick(ctx.city.blocks, seed + 1), { h: 0.7 }), 0, 0, 0);
      return g;
    },
  },
};
