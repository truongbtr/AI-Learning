import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  Object3D,
  PlaneGeometry,
  Vector2,
  Vector3,
} from "three";
import { describe, expect, it } from "vitest";
import { bake } from "./build/bake";
import { DECORATIONS, PLOT_CATALOGUE, PUBLIC_BUILDINGS } from "./build/civic";
import { KenneyLibrary } from "./build/kenney";
import { box, tok } from "./build/kit";
import { SignAtlas } from "./build/signs";
import { WONDER_PIECES, wonder } from "./build/wonders";
import { hexToRgb, rgbToHsl } from "./color";
import { CAMERA, clampState, panDelta, toCameraDir } from "./engine/camera";
import { CURVE_K, curvedBoundingSphere } from "./engine/curve";
import { DAY_START_HOUR, GAME_DAY_MS, gameHour, lightingAt } from "./engine/daynight";
import { pathLength, sampleAt } from "./engine/paths";
import type { KenneyManifest } from "./kenney/set";
import { CITY_IDS } from "./palette";
import { sampleView } from "./sample";
import { buildCity } from "./scene/build-city";

const art = resolve(dirname(fileURLToPath(import.meta.url)), "../../../content/art/city");
const manifest = JSON.parse(readFileSync(join(art, "kenney.json"), "utf8")) as KenneyManifest;
const buf = readFileSync(join(art, "kenney.bin"));
const lib = new KenneyLibrary(
  manifest,
  buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
);

describe("day and night", () => {
  it("is bright blue at noon and friendly deep blue — never black — at night", () => {
    const noon = lightingAt(12);
    const night = lightingAt(22);
    expect(noon.lights).toBe(0);
    expect(night.lights).toBe(1);
    expect(night.windows).toBe(1);
    expect(rgbToHsl(hexToRgb(night.skyTop))[2]).toBeGreaterThan(0.2);
    expect(night.hemiIntensity).toBeGreaterThanOrEqual(0.9);
  });

  it("changes smoothly and wraps around midnight", () => {
    for (let h = 0; h < 24; h += 0.25) {
      const a = lightingAt(h);
      const b = lightingAt(h + 0.25);
      expect(Math.abs(a.lights - b.lights)).toBeLessThan(0.3);
      expect(Math.abs(a.sunIntensity - b.sunIntensity)).toBeLessThan(0.4);
    }
    expect(lightingAt(24)).toEqual(lightingAt(0));
    expect(lightingAt(-1)).toEqual(lightingAt(23));
  });
});

describe("paths", () => {
  const square: [number, number][] = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ];
  it("wraps closed loops", () => {
    expect(pathLength(square, true)).toBe(40);
    const p = sampleAt(square, true, 45);
    expect(p.x).toBeCloseTo(5);
    expect(p.z).toBeCloseTo(0);
  });

  it("ping-pongs open lines and turns around", () => {
    const line: [number, number][] = [
      [0, 0],
      [10, 0],
    ];
    const out = sampleAt(line, false, 5);
    const back = sampleAt(line, false, 15);
    expect(out.x).toBeCloseTo(5);
    expect(back.x).toBeCloseTo(5);
    expect(Math.abs(out.heading - back.heading)).toBeCloseTo(Math.PI);
  });
});

describe("camera", () => {
  it("stays inside the city and inside the zoom range", () => {
    const b = { minX: -50, maxX: 50, minZ: -40, maxZ: 60 };
    expect(clampState({ x: 999, z: -999, dist: 5 }, b)).toEqual({
      x: 50,
      z: -40,
      dist: CAMERA.minDist,
    });
    expect(clampState({ x: 0, z: 0, dist: 1e6 }, b).dist).toBe(CAMERA.maxDist);
  });

  it("drags the ground under the finger (drag right → city moves right → camera moves left)", () => {
    const d = panDelta({ x: 0, z: 0, dist: 100 }, 100, 0, 800);
    const right = new Vector3(Math.cos(Math.PI / 4), 0, -Math.sin(Math.PI / 4));
    expect(d.x * right.x + d.z * right.z).toBeLessThan(0);
  });
});

describe("bake", () => {
  it("drops faces the fixed camera can never see and keeps the rest", () => {
    const root = new Object3D();
    root.add(box(1, 1, 1, 0xffffff));
    const culled = bake(root, 100, { toCamera: toCameraDir() }).meshes[0];
    const full = bake(root, 100).meshes[0];
    expect(full?.triangles).toBe(12);
    // top, +x and +z faces stay; bottom, −x and −z go
    expect(culled?.triangles).toBe(6);
  });

  it("splits a city into chunks and merges glass with solid into one opaque mesh per chunk", () => {
    const root = new Object3D();
    const a = box(1, 1, 1, 0xffffff);
    const b = box(1, 1, 1, tok(0x88ccff, "glass"));
    const far = box(1, 1, 1, 0xffffff);
    b.position.x = 2;
    far.position.x = 500;
    root.add(a, b, far);
    const res = bake(root, 50);
    expect(res.meshes).toHaveLength(2);
    const surf = res.meshes.find((m) => m.chunk === "0,0")?.geometry.getAttribute("surf");
    expect(new Set(Array.from(surf?.array ?? []))).toEqual(new Set([0, 1]));
  });

  it("collects anchors in world space", () => {
    const root = new Object3D();
    const g = new Object3D();
    g.position.set(10, 0, 5);
    const w = wonder("vmath", 3).root;
    g.add(w);
    root.add(g);
    const res = bake(root, 50);
    const anchor = res.anchors.get("wonder");
    expect(anchor?.x).toBeCloseTo(10);
    expect(anchor?.y).toBeGreaterThan(5);
  });
});

describe("curvature", () => {
  it("expands bounding spheres downward for ground bent away beyond the start radius", () => {
    const plane = new PlaneGeometry(200, 10, 20, 1);
    plane.rotateX(-Math.PI / 2);
    const flat = new BufferGeometry().copy(plane);
    flat.computeBoundingSphere();
    const bent = curvedBoundingSphere(plane, new Vector2(0, 0), 20, CURVE_K);
    expect(bent.center.y).toBeLessThan((flat.boundingSphere?.center.y ?? 0) - 1);
  });
});

describe("signs", () => {
  it("reuses cells for identical text and allocates new ones for new text", () => {
    const atlas = new SignAtlas();
    const style = { bg: "#fff", fg: "#000" };
    const a = atlas.cell("ă", style);
    expect(atlas.cell("ă", style)).toBe(a);
    const b = atlas.cell("â", style);
    expect(b.u0).not.toBe(a.u0);
    expect(a.u1).toBeGreaterThan(a.u0);
    expect(a.v1).toBeGreaterThan(a.v0);
  });
});

describe("catalogues (contract with việc 3)", () => {
  it("has at least 12 public buildings, and plot builds and decorations to choose from", () => {
    expect(Object.keys(PUBLIC_BUILDINGS).length).toBeGreaterThanOrEqual(12);
    expect(Object.keys(PLOT_CATALOGUE).length).toBeGreaterThanOrEqual(8);
    expect(Object.keys(DECORATIONS).length).toBeGreaterThanOrEqual(8);
  });

  it("builds every wonder at every stage without throwing, 6–8 pieces each", () => {
    for (const id of CITY_IDS) {
      expect(WONDER_PIECES[id]).toBeGreaterThanOrEqual(6);
      expect(WONDER_PIECES[id]).toBeLessThanOrEqual(8);
      for (let p = 0; p <= WONDER_PIECES[id]; p++) expect(() => wonder(id, p)).not.toThrow();
    }
  });

  it("puts an anchor on every skill so the UI can place mission bubbles", () => {
    const view = sampleView("esl", "mid");
    const built = buildCity(view, lib, new SignAtlas());
    for (const s of view.skills) expect(built.baked.anchors.has(`skill:${s.skillId}`)).toBe(true);
    expect(built.baked.anchors.has("townHall:order")).toBe(true);
  });
});

describe("no error-red anywhere in the city palette (06 §1.1)", () => {
  it("keeps sign ink and signature colours off pure alarm red", () => {
    for (const id of CITY_IDS) {
      const view = sampleView(id, "day1");
      const built = buildCity(view, lib, new SignAtlas());
      let alarm = 0;
      for (const m of built.baked.meshes) {
        const col = m.geometry.getAttribute("color");
        for (let i = 0; i < col.count; i += 7) {
          const r = col.getX(i);
          const g = col.getY(i);
          const b = col.getZ(i);
          if (r > 0.75 && g < 0.08 && b < 0.08) alarm++;
        }
      }
      expect(alarm).toBe(0);
    }
  });
});

// keep unused helpers referenced for type-only imports in some toolchains
void Mesh;
void Float32BufferAttribute;

describe("game clock (pha 11: 24 real minutes = one game day, opening in the morning)", () => {
  const start = 1_800_000_000_000;
  const at = (minutes: number) => gameHour(start + minutes * 60_000, { anchorMs: start });

  it("opens the session in the morning, wherever the wall clock is", () => {
    expect(GAME_DAY_MS).toBe(24 * 60 * 1000);
    expect(at(0)).toBe(DAY_START_HOUR);
    // and a day later it is morning again
    expect(at(24)).toBeCloseTo(DAY_START_HOUR, 5);
  });

  it("spends the evening a child actually plays in daylight", () => {
    // a 12–15 minute session: morning through afternoon into the golden hour, never night
    for (const minute of [0, 3, 6, 9, 12, 15]) {
      const h = at(minute);
      expect(h).toBeGreaterThanOrEqual(DAY_START_HOUR);
      expect(h).toBeLessThan(18);
    }
    expect(at(18)).toBeGreaterThan(16); // the golden hour arrives late in the day
  });

  it("hurries through the dark: about a tenth of the day, not four tenths", () => {
    let dark = 0;
    const steps = 2400;
    for (let i = 0; i < steps; i++) {
      const h = gameHour(start + (i / steps) * GAME_DAY_MS, { anchorMs: start });
      if (h >= 19.3 || h < 5.5) dark++;
    }
    expect(dark / steps).toBeLessThan(0.15);
    expect(dark / steps).toBeGreaterThan(0.02); // there is still a night to light the windows for
  });

  it("stays within 0–24 for any clock, and honours a custom day length", () => {
    for (const t of [0, 1, 123_456_789, 1_799_999_999_999]) {
      const h = gameHour(t);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(24);
    }
    // half a one-minute day is the golden hour, not noon: the curve is not linear in hours
    expect(gameHour(30_000, { dayMs: 60_000 })).toBeGreaterThan(14);
    expect(gameHour(30_000, { dayMs: 60_000 })).toBeLessThan(18);
  });

  it("does not jump when the child reloads: the same anchor gives the same sky", () => {
    const a = gameHour(start + 7 * 60_000, { anchorMs: start });
    const b = gameHour(start + 7 * 60_000, { anchorMs: start });
    expect(a).toBe(b);
  });
});
