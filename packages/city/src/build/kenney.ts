// Runtime access to the baked Kenney blob (content/art/city/kenney.{bin,json}). Each model becomes
// up to two meshes — opaque surfaces and glass (split so windows can glow at night) — with vertex
// colours repainted for the city.

import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  Object3D,
  Uint32BufferAttribute,
} from "three";
import {
  classifyKitColor,
  type KitSpec,
  type RGB,
  recolorKit,
  recolorNature,
  recolorRoad,
} from "../color";
import type { KenneyKey, KenneyManifest } from "../kenney/set";
import { ROAD, WORLD } from "../palette";
import { vertexColorToken } from "./kit";

export type KenneyPaint =
  | { type: "kit"; spec: KitSpec; key: string }
  | { type: "road" }
  | { type: "nature"; leaves: readonly [number, number, number]; key: string }
  | { type: "original" };

export class KenneyLibrary {
  private readonly cache = new Map<
    string,
    { solid: BufferGeometry | null; glass: BufferGeometry | null }
  >();
  private readonly positions: Float32Array;
  private readonly normals: Int8Array;
  private readonly colors: Uint8Array;
  private readonly indices: Uint32Array;

  constructor(
    readonly manifest: KenneyManifest,
    bin: ArrayBuffer,
  ) {
    const { layout, vertices, indices } = manifest;
    this.positions = new Float32Array(bin, layout.positions, vertices * 3);
    this.normals = new Int8Array(bin, layout.normals, vertices * 3);
    this.colors = new Uint8Array(bin, layout.colors, vertices * 3);
    this.indices = new Uint32Array(bin, layout.indices, indices);
  }

  static async load(base: string, fetcher: typeof fetch = fetch): Promise<KenneyLibrary> {
    const [manifest, bin] = await Promise.all([
      fetcher(`${base}/kenney.json`).then((r) => r.json() as Promise<KenneyManifest>),
      fetcher(`${base}/kenney.bin`).then((r) => r.arrayBuffer()),
    ]);
    return new KenneyLibrary(manifest, bin);
  }

  has(key: string): boolean {
    return key in this.manifest.models;
  }

  size(key: KenneyKey): { x: number; y: number; z: number } {
    const b = this.manifest.models[key]?.bbox;
    if (!b) throw new Error(`unknown Kenney model ${key}`);
    return { x: b[3] - b[0], y: b[4] - b[1], z: b[5] - b[2] };
  }

  /** A model as an Object3D (scaled so one Kenney unit = `scale` world units). */
  model(key: KenneyKey, paint: KenneyPaint, scale: number): Object3D {
    const { solid, glass } = this.geometry(key, paint);
    const root = new Object3D();
    if (solid) root.add(new Mesh(solid, vertexColorToken("solid")));
    if (glass) root.add(new Mesh(glass, vertexColorToken("glass")));
    root.scale.setScalar(scale);
    return root;
  }

  private geometry(key: KenneyKey, paint: KenneyPaint) {
    const paintKey =
      paint.type === "kit" || paint.type === "nature" ? `${paint.type}:${paint.key}` : paint.type;
    const cacheKey = `${key}#${paintKey}`;
    const hit = this.cache.get(cacheKey);
    if (hit) return hit;
    const model = this.manifest.models[key];
    if (!model) throw new Error(`unknown Kenney model ${key}`);
    const { vOffset, vCount, iOffset, iCount } = model;
    const isNature = key.startsWith("nature/");
    const glassVertex = new Uint8Array(vCount);
    const color = new Float32Array(vCount * 3);
    for (let v = 0; v < vCount; v++) {
      const o = (vOffset + v) * 3;
      const rgb: RGB = [this.colors[o] ?? 0, this.colors[o + 1] ?? 0, this.colors[o + 2] ?? 0];
      if (!isNature && paint.type !== "road" && classifyKitColor(rgb) === "glass")
        glassVertex[v] = 1;
      let out: RGB = rgb;
      if (paint.type === "kit") out = recolorKit(rgb, paint.spec);
      else if (paint.type === "road") out = recolorRoad(rgb, ROAD.road, ROAD.curb);
      else if (paint.type === "nature") out = recolorNature(rgb, paint.leaves, WORLD.trunk);
      color[v * 3] = srgbToLinear(out[0]);
      color[v * 3 + 1] = srgbToLinear(out[1]);
      color[v * 3 + 2] = srgbToLinear(out[2]);
    }
    const solidIdx: number[] = [];
    const glassIdx: number[] = [];
    for (let i = 0; i < iCount; i += 3) {
      const a = this.indices[iOffset + i] ?? 0;
      const b = this.indices[iOffset + i + 1] ?? 0;
      const c = this.indices[iOffset + i + 2] ?? 0;
      const target = glassVertex[a] && glassVertex[b] && glassVertex[c] ? glassIdx : solidIdx;
      target.push(a, b, c);
    }
    const pos = this.positions.subarray(vOffset * 3, (vOffset + vCount) * 3);
    const nor = new Float32Array(vCount * 3);
    for (let i = 0; i < vCount * 3; i++) nor[i] = (this.normals[vOffset * 3 + i] ?? 0) / 127;
    const make = (idx: number[]) => {
      if (idx.length === 0) return null;
      const g = new BufferGeometry();
      g.setAttribute("position", new Float32BufferAttribute(pos, 3));
      g.setAttribute("normal", new Float32BufferAttribute(nor, 3));
      g.setAttribute("color", new Float32BufferAttribute(color, 3));
      g.setIndex(new Uint32BufferAttribute(idx, 1));
      return g;
    };
    const entry = { solid: make(solidIdx), glass: make(glassIdx) };
    this.cache.set(cacheKey, entry);
    return entry;
  }
}

/** Vertex colours live in linear space in three.js. */
export function srgbToLinear(c8: number): number {
  const c = c8 / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
