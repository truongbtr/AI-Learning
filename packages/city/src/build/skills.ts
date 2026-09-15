// One skill = one building that grows with mastery. Level 0 is scaffolding with a waiting worker
// (never broken, never red), 1–3 follow the mastery bands, 4 is the long-term skyscraper.
// Each city speaks its own visual language (Pha 10 §2) but uses the same five steps.

import type { BuildingLevel } from "@mtct/core";
import type { Object3D } from "three";
import { type CityId, lotPalette } from "../palette";
import {
  type Built,
  building,
  construction,
  crane,
  curvedRoof,
  labelBlock,
  plate,
} from "./building";
import { type BuildCtx, css } from "./context";
import { add, box, cbox, cone, cyl, dome, group, pick, quad, rng, sphere, tok, torus } from "./kit";
import { book, flag, flowerBed, gear, lantern, lanternString } from "./props";

type ThemeBuilder = (ctx: BuildCtx, level: BuildingLevel, seed: number, label: string) => Built;

export function skillBuilding(
  ctx: BuildCtx,
  level: BuildingLevel,
  seed: number,
  label: string,
): Built {
  return THEMES[ctx.city.id]({ ...ctx, city: lotPalette(ctx.city, seed) }, level, seed, label);
}

const white = "#ffffff";

/** Tall-building bodies from the approved style board: turquoise glass, cream, blush pink. */
export const TOWER_BODY = [0x8fe6dc, 0xfff0c8, 0xffcfe0] as const;
const TOWER_WINDOW = 0xbdf3ff;

// ------------------------------------------------------------------ Thành Số (vmath)
const vmath: ThemeBuilder = (ctx, level, seed, label) => {
  const C = ctx.city;
  const g = group();
  if (level === 0) {
    const inner = group();
    add(inner, cbox(3.2, 1.1, 3.0, pick(C.walls, 1)), 0, 0.55, 0);
    add(inner, labelBlock(ctx, 0.7, pick(C.blocks, 0), label), -1.9, 0, 1.9);
    add(inner, labelBlock(ctx, 0.6, pick(C.blocks, 1), "+"), -1.1, 0, 2.1);
    return construction(3.2, 3.0, 2.6, inner);
  }
  if (level === 1) {
    const b = building({
      w: 3.2,
      d: 3.0,
      floors: 2,
      wall: pick(C.walls, seed),
      roof: pick(C.roofs, 0),
      trim: C.trim,
      glass: C.glass,
      awning: pick(C.roofs, 2),
    });
    add(g, b.root);
    add(g, labelBlock(ctx, 0.95, pick(C.blocks, seed + 3), label), -0.5, b.top, -0.2);
    return { root: g, top: b.top + 1.1 };
  }
  if (level === 2) {
    let y = 0.18;
    add(g, box(3.8, 0.18, 3.6, 0xf0e8d4), 0, 0.09, 0);
    for (let f = 0; f < 4; f++) {
      const fl = building({
        w: 3.2 - f * 0.12,
        d: 3.0 - f * 0.12,
        floors: 1,
        fh: 1.15,
        wall: pick(C.blocks, f + seed),
        roof: pick(C.roofs, 0),
        roofType: f === 3 ? "flat" : "none",
        trim: C.trim,
        glass: C.glass,
        plinth: 0,
        door: f === 0 ? 0x9a623e : null,
        band: false,
      });
      add(g, fl.root, f % 2 ? 0.1 : -0.1, y, 0);
      y += 1.15;
    }
    add(g, labelBlock(ctx, 1.0, C.b, label, css(C.a)), 0.3, y + 0.3, 0);
    return { root: g, top: y + 1.5 };
  }
  if (level === 3) {
    const b = building({
      w: 3.6,
      d: 3.2,
      floors: 6,
      fh: 1.12,
      wall: pick(C.walls, seed + 1),
      roof: pick(C.roofs, 1),
      trim: C.trim,
      glass: C.glass,
      garden: true,
      shopFloor: C.b,
    });
    add(g, b.root);
    const wing = building({
      w: 2.0,
      d: 2.6,
      floors: 3,
      wall: pick(C.walls, seed),
      roof: pick(C.roofs, 0),
      trim: C.trim,
      glass: C.glass,
      door: null,
    });
    add(g, wing.root, 2.7, 0, 0.1);
    add(g, box(2.0, 1.6, 0.12, C.a), 0, b.top + 1.0, -0.8);
    add(g, plate(ctx, label, C.b, css(C.a), 1.8), 0, b.top + 1.0, -0.73);
    return { root: g, top: b.top + 2.0 };
  }
  // skyscraper: pastel tiers (turquoise / cream / blush, alternating by lot) with light window
  // bands, golden fins and crown — never a dark glass slab (Pha 10b việc 2)
  const fin = C.b;
  const bodies = [TOWER_BODY[seed % 3], TOWER_BODY[(seed + 1) % 3], TOWER_BODY[(seed + 2) % 3]];
  add(g, box(4.6, 0.3, 4.4, 0xf0e8d4), 0, 0.15, 0);
  add(g, cbox(4.0, 1.3, 3.8, pick(C.walls, 2)), 0, 0.95, 0);
  add(g, quad(3.6, 1.0, tok(0xa6eeff, "glass")), 0, 0.9, 1.91);
  let y = 1.6;
  for (const [t, [w, d, n]] of (
    [
      [3.8, 3.6, 7],
      [3.1, 2.9, 4],
      [2.3, 2.1, 2],
    ] as const
  ).entries()) {
    add(g, cbox(w, n, d, bodies[t] as number, 0.2), 0, y + n / 2, 0);
    for (let f = 0; f < n; f++) {
      // one window band per floor on the two faces the camera sees
      add(g, quad(w * 0.82, 0.52, tok(TOWER_WINDOW, "glass")), 0, y + f + 0.5, d / 2 + 0.012);
      add(
        g,
        quad(d * 0.82, 0.52, tok(TOWER_WINDOW, "glass")),
        w / 2 + 0.012,
        y + f + 0.5,
        0,
      ).rotation.y = Math.PI / 2;
    }
    for (let f = 1; f < n; f++) add(g, box(w + 0.06, 0.08, d + 0.06, 0xffffff), 0, y + f, 0);
    for (let i = 1; i < 4; i++)
      add(g, box(0.08, n, 0.08, fin), -w / 2 + (i * w) / 4, y + n / 2, d / 2 + 0.03);
    y += n;
    add(g, box(w + 0.3, 0.22, d + 0.3, fin), 0, y + 0.11, 0);
    y += 0.22;
  }
  add(g, cyl(0.9, 1.1, 0.8, fin, 8), 0, y + 0.4, 0);
  add(g, sphere(0.55, tok(0xffe066, "light"), 8, 6), 0, y + 1.25, 0);
  add(g, cyl(0.05, 0.05, 2.0, 0xffffff, 4), 0, y + 2.6, 0);
  add(g, plate(ctx, label, C.a, "#ffd447", 1.4), 0, 6.2, 1.83);
  return { root: g, top: y + 3.6 };
};

// ------------------------------------------------------------------ Phố Chữ (viet)
const viet: ThemeBuilder = (ctx, level, seed, label) => {
  const C = ctx.city;
  const g = group();
  const letter = (bg: number) => plate(ctx, label, bg, white, 0.9);
  if (level === 0) {
    const inner = group();
    add(inner, cbox(3.2, 1.0, 2.8, pick(C.walls, 0)), 0, 0.5, 0);
    for (let i = 0; i < 3; i++)
      add(inner, box(0.9, 0.18, 0.5, pick(C.roofs, i)), -2.0, 0.1 + i * 0.19, 1.9);
    add(inner, letter(C.b), -1.0, 0.7, 1.45);
    return construction(3.2, 2.8, 2.4, inner);
  }
  if (level === 1) {
    const b = building({
      w: 3.0,
      d: 2.6,
      floors: 1,
      fh: 1.5,
      wall: pick(C.walls, seed),
      roof: pick(C.roofs, 0),
      roofType: "curved",
      trim: C.trim,
      glass: C.glass,
      door: 0xb5552f,
    });
    add(g, b.root);
    add(g, letter(C.b), -0.6, 1.1, 1.33);
    for (const x of [-1.3, 1.3]) add(g, lantern(0xff5a3c, 1.2), x, 0.95, 1.55);
    add(g, flowerBed(1.0, 0.4, seed), 1.0, 0, 1.75);
    return { root: g, top: b.top + 0.4 };
  }
  if (level === 2) {
    const b = building({
      w: 2.6,
      d: 3.0,
      floors: 2,
      fh: 1.3,
      wall: pick(C.walls, seed + 2),
      roof: pick(C.roofs, 1),
      roofType: "curved",
      trim: C.trim,
      glass: C.glass,
      door: 0xb5552f,
    });
    add(g, b.root);
    add(g, box(2.8, 0.1, 0.7, C.trim), 0, 1.5, 1.8);
    add(g, box(2.8, 0.06, 0.06, C.b), 0, 1.98, 2.12);
    for (let i = 0; i < 5; i++) add(g, box(0.05, 0.45, 0.05, C.b), -1.3 + i * 0.65, 1.75, 2.12);
    add(g, flowerBed(0.9, 0.26, seed), -0.4, 1.55, 1.95);
    add(g, letter(C.a), 0.8, 2.5, 1.53);
    add(g, lanternString(2.6, 4, 1.25), 0, 0, 1.9);
    return { root: g, top: b.top + 0.4 };
  }
  if (level === 3) {
    const base = building({
      w: 3.8,
      d: 3.2,
      floors: 2,
      fh: 1.3,
      wall: pick(C.walls, 0),
      roofType: "none",
      trim: C.trim,
      glass: C.glass,
      columns: true,
      band: false,
      door: 0xb5552f,
    });
    add(g, base.root);
    add(g, curvedRoof(4.6, 4.2, 0.7, pick(C.roofs, 0), 0.3, 0.2), 0, base.top - 0.05, 0);
    const up = building({
      w: 2.8,
      d: 2.4,
      floors: 1,
      fh: 1.3,
      wall: pick(C.walls, 4),
      roof: pick(C.roofs, 2),
      roofType: "curved",
      trim: C.trim,
      glass: C.glass,
      plinth: 0,
      door: null,
      flare: 0.5,
    });
    add(g, up.root, 0, base.top + 0.45, 0);
    add(g, letter(C.b), 0, base.top + 1.1, 1.22);
    add(g, lanternString(4.0, 5, 2.75), 0, 0, 2.2);
    return { root: g, top: base.top + up.top + 0.6 };
  }
  let y = 0.3;
  add(g, box(4.8, 0.3, 4.6, 0xf0e8d4), 0, 0.15, 0);
  (
    [
      [3.8, 3.6, 3],
      [3.1, 2.9, 3],
      [2.4, 2.2, 2],
    ] as const
  ).forEach(([w, d, n], i) => {
    const b = building({
      w,
      d,
      floors: n,
      fh: 1.05,
      wall: i % 2 ? pick(C.walls, 1) : pick(C.walls, 4),
      roofType: "none",
      trim: C.trim,
      glass: 0x9fe8ff,
      plinth: 0,
      door: i === 0 ? 0xb5552f : null,
    });
    add(g, b.root, 0, y, 0);
    y += n * 1.05;
    add(g, curvedRoof(w + 0.5, d + 0.5, 0.45, pick(C.roofs, i), 0.35, 0.1), 0, y - 0.02, 0);
    y += 0.3;
  });
  add(g, curvedRoof(2.4, 2.2, 1.2, pick(C.roofs, 0), 0.4, 0.2), 0, y, 0);
  y += 1.2;
  add(g, cyl(0.06, 0.12, 1.2, 0xffd447, 5), 0, y + 0.5, 0);
  add(g, sphere(0.28, tok(0xffe066, "light"), 6, 5), 0, y + 1.2, 0);
  add(g, letter(C.a), 0.9, 2.92, 1.92);
  return { root: g, top: y + 1.6 };
};

// ------------------------------------------------------------------ Bến Cảng Từ (esl)
const esl: ThemeBuilder = (ctx, level, seed, label) => {
  const C = ctx.city;
  const g = group();
  const word = (bg: number) => plate(ctx, label, bg, white, 1.6, true);
  const container = (color: number) => {
    const c = group();
    add(c, box(1.3, 0.62, 0.62, color), 0, 0.31, 0);
    for (let i = 0; i < 4; i++) add(c, box(0.04, 0.56, 0.64, 0xffffff), -0.5 + i * 0.33, 0.31, 0);
    return c;
  };
  if (level === 0) {
    const inner = group();
    add(inner, cbox(3.0, 0.9, 2.8, pick(C.walls, 1)), 0, 0.45, 0);
    add(inner, container(C.b), -1.9, 0, 1.8);
    add(inner, container(C.a), -1.9, 0.62, 1.8);
    return construction(3.0, 2.8, 2.4, inner);
  }
  if (level === 1) {
    const b = building({
      w: 3.4,
      d: 2.6,
      floors: 1,
      fh: 1.6,
      wall: pick(C.walls, seed),
      roof: C.a,
      roofType: "gable",
      trim: C.trim,
      glass: C.glass,
      awning: C.b,
    });
    add(g, b.root);
    add(g, word(C.b), -0.4, 1.3, 1.33);
    for (const [x, z] of [
      [1.9, 1.2],
      [2.2, 0.5],
    ] as const)
      add(g, box(0.5, 0.5, 0.5, 0xc98f5e), x, 0.25, z);
    return { root: g, top: b.top + 0.3 };
  }
  if (level === 2) {
    const b = building({
      w: 3.0,
      d: 3.2,
      floors: 2,
      fh: 1.4,
      wall: pick(C.walls, seed + 1),
      roof: C.b,
      roofType: "flat",
      trim: C.trim,
      glass: C.glass,
      shopFloor: C.a,
    });
    add(g, b.root, -0.5, 0, 0);
    add(g, container(pick(C.blocks, 0)), 1.7, 0, 1.0).rotation.y = Math.PI / 2;
    add(g, container(pick(C.blocks, 1)), 1.7, 0.62, 1.0).rotation.y = Math.PI / 2;
    add(g, container(pick(C.blocks, 2)), 1.7, 0, -0.6).rotation.y = Math.PI / 2;
    add(g, word(C.a), -0.5, b.top - 0.55, 1.62);
    return { root: g, top: b.top + 0.3 };
  }
  if (level === 3) {
    const b = building({
      w: 3.4,
      d: 3.0,
      floors: 4,
      fh: 1.2,
      wall: pick(C.walls, 0),
      roof: C.a,
      roofType: "flat",
      trim: C.a,
      glass: C.glass,
      ac: true,
    });
    add(g, b.root, -0.4, 0, 0);
    const cr = crane(4.5, 3, C.b);
    cr.scale.setScalar(0.8);
    cr.rotation.y = 2.3;
    add(g, cr, 1.8, 0, -1.0);
    add(g, container(pick(C.blocks, 3)), 1.8, 0, 1.2);
    add(g, flag(C.b, 1.6), -0.4, b.top, 0);
    add(g, word(C.b), -0.4, b.top - 0.7, 1.52);
    return { root: g, top: b.top + 1.8 };
  }
  // lighthouse tower with a glowing lamp room
  add(g, cbox(4.4, 0.3, 4.4, 0xf0e8d4), 0, 0.15, 0);
  const b = building({
    w: 3.6,
    d: 3.2,
    floors: 1,
    fh: 1.4,
    wall: 0xffffff,
    roofType: "flat",
    roof: C.a,
    trim: C.a,
    glass: C.glass,
  });
  add(g, b.root);
  let y = b.top;
  for (let i = 0; i < 6; i++) {
    const r = 1.25 - i * 0.08;
    add(g, cyl(r - 0.08, r, 1.5, i % 2 ? C.a : 0xffffff, 10), 0, y + 0.75, 0);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + i;
      const win = quad(0.3, 0.45, tok(C.glass, "glass"));
      win.rotation.y = a;
      add(g, win, Math.sin(a) * (r - 0.02), y + 0.8, Math.cos(a) * (r - 0.02));
    }
    y += 1.5;
  }
  add(g, cyl(1.15, 1.15, 0.15, C.b, 10), 0, y + 0.07, 0);
  add(g, torus(1.0, 0.04, 0xffffff, 3, 10), 0, y + 0.5, 0).rotation.x = Math.PI / 2;
  add(g, cyl(0.62, 0.62, 1.0, tok(0xfff3a0, "light"), 8), 0, y + 0.65, 0);
  add(g, cone(0.9, 0.9, C.b, 8), 0, y + 1.6, 0);
  add(g, word(C.b), 0, 1.0, 1.62);
  return { root: g, top: y + 2.4 };
};

// ------------------------------------------------------------------ Vườn Sách (enl)
const enl: ThemeBuilder = (ctx, level, seed, label) => {
  const C = ctx.city;
  const g = group();
  const word = (bg: number) => plate(ctx, label, bg, white, 1.6, true);
  const hedge = (w: number, d: number) => cbox(w, 0.5, d, tok(0x5fc94a, "solid", true), 0.2);
  if (level === 0) {
    const inner = group();
    add(inner, cbox(3.0, 1.0, 2.8, pick(C.walls, 0)), 0, 0.5, 0);
    for (let i = 0; i < 4; i++)
      add(inner, book(0.9, 0.18, 0.65, pick(C.blocks, i)), -2.0, i * 0.18, 1.9).rotation.y =
        i * 0.3;
    return construction(3.0, 2.8, 2.4, inner);
  }
  if (level === 1) {
    const b = building({
      w: 3.0,
      d: 2.6,
      floors: 1,
      fh: 1.5,
      wall: pick(C.walls, seed),
      roof: pick(C.roofs, 0),
      roofType: "hip",
      trim: C.trim,
      glass: C.glass,
    });
    add(g, b.root);
    add(g, word(C.a), -0.3, 1.2, 1.33);
    add(g, hedge(3.4, 0.4), 0, 0.25, 1.9);
    add(g, flowerBed(0.9, 0.4, seed), -1.6, 0, 1.9);
    return { root: g, top: b.top + 0.3 };
  }
  if (level === 2) {
    const b = building({
      w: 3.2,
      d: 3.0,
      floors: 2,
      fh: 1.3,
      wall: pick(C.walls, seed + 1),
      roof: pick(C.roofs, 1),
      roofType: "flat",
      trim: C.trim,
      glass: C.glass,
    });
    add(g, b.root);
    add(g, dome(1.0, C.a, 10), 0, b.top - 0.1, 0);
    add(g, sphere(0.14, 0xffd447, 5, 4), 0, b.top + 0.95, 0);
    add(g, hedge(0.5, 3.2), 2.0, 0.25, 0);
    add(g, hedge(0.5, 3.2), -2.0, 0.25, 0);
    add(g, word(C.b), 0, 2.3, 1.52);
    return { root: g, top: b.top + 1.3 };
  }
  if (level === 3) {
    const b = building({
      w: 4.2,
      d: 3.2,
      floors: 2,
      fh: 1.35,
      wall: pick(C.walls, 1),
      roof: pick(C.roofs, 0),
      roofType: "flat",
      trim: 0xffffff,
      glass: C.glass,
      columns: true,
      band: false,
      garden: true,
    });
    add(g, b.root);
    add(g, dome(1.2, C.a, 12), 0, b.top - 0.1, -0.3);
    const big = book(1.6, 0.35, 1.2, C.b);
    big.rotation.set(-0.9, 0.4, 0);
    add(g, big, -1.6, b.top + 0.5, 0.6);
    add(g, word(C.a), 0, 2.4, 2.18);
    return { root: g, top: b.top + 1.6 };
  }
  // tower of giant books with a rooftop garden
  let y = 0;
  const r = rng(seed);
  for (let i = 0; i < 10; i++) {
    const h = 0.9 + r() * 0.5;
    const w = 3.8 - i * 0.12;
    const bk = book(w, h, w * 0.75, pick(C.blocks, i + seed));
    bk.rotation.y = (r() - 0.5) * 0.35;
    add(g, bk, 0, y, 0);
    y += h;
  }
  add(g, cyl(1.2, 1.2, 0.2, 0x96e85a, 10), 0, y + 0.1, 0);
  for (let i = 0; i < 4; i++)
    add(
      g,
      sphere(0.35, tok(pick([0x4fc93a, 0xff8fb1], i), "solid", true), 5, 4),
      Math.cos(i * 1.6) * 0.7,
      y + 0.45,
      Math.sin(i * 1.6) * 0.7,
    );
  add(g, word(C.a), 0, 1.2, 1.47);
  return { root: g, top: y + 1.4 };
};

// ------------------------------------------------------------------ Xưởng Máy (emath)
const emath: ThemeBuilder = (ctx, level, seed, label) => {
  const C = ctx.city;
  const g = group();
  const numberPlate = (bg: number) => plate(ctx, label, bg, white, 1.0);
  if (level === 0) {
    const inner = group();
    add(inner, cbox(3.0, 1.0, 2.8, pick(C.walls, 1)), 0, 0.5, 0);
    const gr = gear(0.55, 0.2, C.a);
    gr.rotation.x = -Math.PI / 2;
    add(inner, gr, -1.9, 0.1, 1.8);
    return construction(3.0, 2.8, 2.4, inner);
  }
  if (level === 1) {
    const b = building({
      w: 3.2,
      d: 2.8,
      floors: 1,
      fh: 1.6,
      wall: pick(C.walls, seed),
      roof: C.b,
      roofType: "gable",
      trim: C.trim,
      glass: C.glass,
    });
    add(g, b.root);
    add(g, gear(0.5, 0.15, C.a), -0.9, 1.1, 1.5);
    add(g, numberPlate(C.a), 0.2, 1.1, 1.42);
    return { root: g, top: b.top + 0.3 };
  }
  const sawtooth = (w: number, d: number, y: number, n: number, color: number) => {
    for (let i = 0; i < n; i++) {
      const z = -d / 2 + (i + 0.5) * (d / n);
      const tooth = box(w, 0.8, d / n, color);
      tooth.rotation.x = -0.45;
      add(g, tooth, 0, y + 0.3, z);
      const glassStrip = quad(w - 0.2, 0.5, tok(C.glass, "glass"));
      add(g, glassStrip, 0, y + 0.35, z + d / n / 2 - 0.05);
    }
  };
  if (level === 2) {
    const b = building({
      w: 3.6,
      d: 3.2,
      floors: 1,
      fh: 1.9,
      wall: pick(C.walls, seed + 1),
      roofType: "none",
      trim: C.trim,
      glass: C.glass,
    });
    add(g, b.root);
    sawtooth(3.6, 3.2, b.top, 3, C.b);
    add(g, cyl(0.3, 0.38, 3.2, C.a, 8), 1.5, 1.6, -1.2);
    add(g, box(0.7, 0.2, 0.7, 0xffffff), 1.5, 3.3, -1.2);
    add(g, numberPlate(C.a), -0.8, 1.2, 1.62);
    return { root: g, top: b.top + 2.0 };
  }
  if (level === 3) {
    const b = building({
      w: 3.8,
      d: 3.2,
      floors: 3,
      fh: 1.3,
      wall: pick(C.walls, 0),
      roof: C.b,
      roofType: "flat",
      trim: C.a,
      glass: C.glass,
      ac: true,
    });
    add(g, b.root);
    add(g, gear(1.0, 0.25, C.a, 10), 0, 2.6, 1.72);
    add(g, gear(0.6, 0.25, pick(C.blocks, 2), 8), 1.25, 1.7, 1.72);
    for (const x of [-2.4, 2.4]) add(g, box(0.2, 4.6, 0.2, C.a), x, 2.3, 1.0);
    add(g, box(5.0, 0.3, 0.3, C.a), 0, 4.6, 1.0);
    add(g, cyl(0.28, 0.35, 2.2, 0xdfe6ee, 8), -1.2, b.top + 1.1, -0.8);
    add(g, numberPlate(C.b), -1.1, 1.0, 1.62);
    return { root: g, top: b.top + 2.4 };
  }
  // gear tower
  add(g, box(4.6, 0.3, 4.4, 0xf0e8d4), 0, 0.15, 0);
  const b1 = building({
    w: 3.8,
    d: 3.4,
    floors: 5,
    fh: 1.1,
    wall: pick(C.walls, 1),
    roof: C.b,
    roofType: "none",
    trim: C.a,
    glass: C.glass,
  });
  add(g, b1.root);
  const b2 = building({
    w: 2.8,
    d: 2.6,
    floors: 5,
    fh: 1.1,
    wall: pick(C.walls, 0),
    roofType: "flat",
    roof: C.b,
    trim: C.a,
    glass: C.glass,
    plinth: 0,
    door: null,
  });
  add(g, b2.root, 0, b1.top, 0);
  const crown = gear(1.8, 0.4, C.a, 12);
  add(g, crown, 0, b1.top + b2.top + 1.9, 0);
  add(g, gear(0.9, 0.42, 0xffd447, 8), 0, b1.top + b2.top + 1.9, 0.05);
  add(g, box(0.4, 1.6, 0.4, C.b), 0, b1.top + b2.top + 0.8, 0);
  add(g, numberPlate(C.a), 0, 1.0, 1.72);
  return { root: g, top: b1.top + b2.top + 4.0 };
};

// ------------------------------------------------------------------ Trạm Khám Phá (esci)
const esci: ThemeBuilder = (ctx, level, seed, label) => {
  const C = ctx.city;
  const g = group();
  const word = (bg: number) => plate(ctx, label, bg, white, 1.6, true);
  const telescope = (s = 1): Object3D => {
    const t = group();
    add(t, cyl(0.05 * s, 0.05 * s, 0.8 * s, 0x46607a, 4), 0, 0.4 * s, 0);
    const tube = cyl(0.14 * s, 0.2 * s, 1.2 * s, 0xffffff, 8);
    tube.rotation.z = 0.9;
    add(t, tube, 0.3 * s, 0.95 * s, 0);
    return t;
  };
  if (level === 0) {
    const inner = group();
    add(inner, cbox(3.0, 1.0, 2.8, pick(C.walls, 0)), 0, 0.5, 0);
    add(inner, telescope(), -1.9, 0, 1.8);
    return construction(3.0, 2.8, 2.4, inner);
  }
  if (level === 1) {
    const b = building({
      w: 3.0,
      d: 2.8,
      floors: 1,
      fh: 1.6,
      wall: pick(C.walls, seed),
      roof: C.a,
      roofType: "flat",
      trim: C.trim,
      glass: C.glass,
    });
    add(g, b.root);
    add(g, dome(0.9, C.b, 10), 0.3, b.top - 0.1, -0.2);
    add(g, cyl(0.03, 0.03, 1.2, 0xdfe6ee, 4), -1.0, b.top + 0.6, -0.8);
    add(g, sphere(0.1, tok(0xff8fb1, "light"), 5, 4), -1.0, b.top + 1.25, -0.8);
    add(g, word(C.a), -0.2, 1.2, 1.43);
    return { root: g, top: b.top + 1.2 };
  }
  if (level === 2) {
    add(g, box(3.8, 0.18, 3.8, 0xf0e8d4), 0, 0.09, 0);
    add(g, cyl(1.6, 1.6, 2.4, pick(C.walls, seed + 1), 12), 0, 1.38, 0);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const win = quad(0.5, 0.6, tok(C.glass, "glass"));
      win.rotation.y = a;
      add(g, win, Math.sin(a) * 1.61, 1.5, Math.cos(a) * 1.61);
    }
    add(g, dome(1.6, 0xeef3f8, 12), 0, 2.58, 0);
    add(g, box(0.5, 1.3, 3.25, C.b), 0, 3.0, 0).rotation.x = 0;
    const tube = cyl(0.25, 0.32, 2.0, C.a, 8);
    tube.rotation.x = -0.8;
    add(g, tube, 0, 3.8, 0.8);
    add(g, word(C.a), 0, 0.8, 1.65);
    return { root: g, top: 5.0 };
  }
  if (level === 3) {
    const b = building({
      w: 3.8,
      d: 2.6,
      floors: 3,
      fh: 1.2,
      wall: pick(C.walls, 1),
      roof: C.a,
      roofType: "flat",
      trim: C.trim,
      glass: C.glass,
    });
    add(g, b.root, 0, 0, -0.6);
    add(g, dome(1.3, tok(0xc6f6ff, "glass"), 12), -1.1, 0.18, 1.5);
    for (let i = 0; i < 3; i++)
      add(g, sphere(0.3, tok(0x4fc93a, "solid", true), 5, 4), -1.1 + (i - 1) * 0.5, 0.45, 1.5);
    const dish = dome(0.8, 0xffffff, 10);
    dish.rotation.x = Math.PI * 0.7;
    add(g, dish, 1.0, b.top + 0.9, -0.8);
    add(g, cyl(0.06, 0.06, 0.9, 0xdfe6ee, 4), 1.0, b.top + 0.4, -0.8);
    add(g, word(C.b), 0.4, 2.4, 0.72);
    return { root: g, top: b.top + 1.8 };
  }
  // rocket tower with a launch gantry
  add(g, cbox(4.6, 0.3, 4.6, 0xf0e8d4), 0, 0.15, 0);
  add(g, cyl(1.4, 1.5, 10, 0xffffff, 12), 0, 5.3, 0);
  for (let i = 0; i < 4; i++)
    add(g, cyl(1.42, 1.42, 0.3, i % 2 ? C.b : C.a, 12), 0, 2 + i * 2.2, 0);
  for (let k = 0; k < 5; k++) {
    const win = torus(0.28, 0.06, 0xdfe6ee, 4, 8);
    add(g, win, 0, 3.1 + k * 1.6, 1.43);
    add(g, sphere(0.25, tok(C.glass, "glass"), 6, 4), 0, 3.1 + k * 1.6, 1.36);
  }
  for (let f = 0; f < 3; f++) {
    const fin = box(0.2, 2.4, 1.4, C.a);
    const a = (f / 3) * Math.PI * 2;
    fin.rotation.y = a;
    add(g, fin, Math.sin(a) * 1.8, 1.5, Math.cos(a) * 1.8);
  }
  add(g, cone(1.4, 2.4, C.b, 12), 0, 11.5, 0);
  add(g, sphere(0.25, tok(0xff8fb1, "light"), 5, 4), 0, 12.8, 0);
  for (const x of [2.6, 3.4]) add(g, box(0.15, 9, 0.15, 0x8896a6), x, 4.8, -1.2);
  for (let i = 1; i < 5; i++) add(g, box(1.2, 0.1, 0.15, 0x8896a6), 3.0, i * 2, -1.2);
  add(g, word(C.a), 0, 0.9, 2.3);
  return { root: g, top: 13.4 };
};

const THEMES: Record<CityId, ThemeBuilder> = { vmath, viet, esl, enl, emath, esci };
