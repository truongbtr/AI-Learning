// Merge a builder scene graph into a few big meshes: one per (chunk × material group). This is what
// keeps a whole city inside the iPad budget (docs/adr/ADR-20): draw calls scale with the number of
// chunks on screen, not with the number of windows, trees and lamps.
//
// Two savings rely on the city camera never rotating (CAMERA.yawDeg / pitchDeg are constants):
//  • solid, glass, light and water share ONE material — the surface is a per-vertex `surf` value;
//  • triangles facing away from the camera (back walls, undersides) are dropped at bake time.

import {
  Box3,
  type BufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  LineSegments,
  Matrix3,
  Mesh,
  type Object3D,
  Uint32BufferAttribute,
  Vector3,
} from "three";
import { srgbToLinear } from "./kenney";
import { type SurfaceKind, tokenOf } from "./kit";

/** Draw-call groups: opaque = solid + glass + light + water. */
export type MaterialGroup = "opaque" | "sign" | "ghost" | "cloud";

export const SURF: Record<SurfaceKind, number> = {
  solid: 0,
  glass: 1,
  light: 2,
  water: 3,
  sign: 0,
  ghost: 0,
  cloud: 0,
};

const groupOf = (kind: SurfaceKind): MaterialGroup =>
  kind === "sign" ? "sign" : kind === "ghost" ? "ghost" : kind === "cloud" ? "cloud" : "opaque";

/**
 * Detail levels (pha 12 việc 5). The cost of a frame has to follow the SCREEN, not the size of the
 * city, so a chunk far from the camera is drawn with less in it:
 *
 *   near — everything, as pha 10 baked it;
 *   mid  — the small stuff dropped (windows, trims, benches, single flowers): about a fifth of the
 *          triangles, and at 120 units away nobody can tell;
 *   far  — the block as its silhouette: one box per big part, which still reads as a skyline.
 */
export type DetailLevel = "near" | "mid" | "far";

export interface BakedMesh {
  chunk: string;
  kind: MaterialGroup;
  level: DetailLevel;
  geometry: BufferGeometry;
  triangles: number;
}

export interface BakeResult {
  meshes: BakedMesh[];
  /** Ghost-piece outlines (wonders), merged into one line set. */
  lines: BufferGeometry | null;
  anchors: Map<string, Vector3>;
}

export interface BakeOptions {
  /** Fold everything into one mesh (instanced agents). */
  single?: boolean;
  /**
   * Unit vector from the scene toward the camera. Triangles whose normal points away by more than
   * `cullThreshold` are dropped. Omit for objects seen from any side (agents).
   */
  toCamera?: Vector3;
  cullThreshold?: number;
  /** Which detail level to bake (default "near"). */
  level?: DetailLevel;
}

/** A part smaller than this across is not baked into the mid level. */
const MID_MIN_SIZE = 2.2;
/** A part smaller than this across leaves no silhouette at all. */
const FAR_MIN_SIZE = 3.4;

export const chunkKey = (x: number, z: number, size: number) =>
  `${Math.floor(x / size)},${Math.floor(z / size)}`;

const tmpBox = new Box3();
const tmpV = new Vector3();
const tmpSize = new Vector3();

export function bake(root: Object3D, chunkSize: number, options: BakeOptions = {}): BakeResult {
  root.updateMatrixWorld(true);
  const buckets = new Map<string, Mesh[]>();
  const anchors = new Map<string, Vector3>();
  const linePositions: number[] = [];

  root.traverse((obj) => {
    const anchorId = obj.userData.anchor as string | undefined;
    if (anchorId) anchors.set(anchorId, obj.getWorldPosition(new Vector3()));
    if (obj instanceof LineSegments) {
      const pos = obj.geometry.getAttribute("position");
      for (let i = 0; i < pos.count; i++) {
        tmpV.fromBufferAttribute(pos, i).applyMatrix4(obj.matrixWorld);
        linePositions.push(tmpV.x, tmpV.y, tmpV.z);
      }
      return;
    }
    if (!(obj instanceof Mesh)) return;
    const g = obj.geometry as BufferGeometry;
    if (!g.boundingBox) g.computeBoundingBox();
    tmpBox.copy(g.boundingBox as Box3).applyMatrix4(obj.matrixWorld);
    tmpBox.getCenter(tmpV);
    const level = options.level ?? "near";
    if (level !== "near") {
      tmpBox.getSize(tmpSize);
      const across = Math.max(tmpSize.x, tmpSize.z, tmpSize.y);
      if (across < (level === "mid" ? MID_MIN_SIZE : FAR_MIN_SIZE)) return;
    }
    const group = options.single ? "opaque" : groupOf(tokenOf(obj.material).kind);
    const key = `${options.single ? "0,0" : chunkKey(tmpV.x, tmpV.z, chunkSize)}|${group}`;
    let list = buckets.get(key);
    if (!list) {
      list = [];
      buckets.set(key, list);
    }
    list.push(obj);
  });

  const meshes: BakedMesh[] = [];
  for (const [key, items] of buckets) {
    const [chunk, kind] = key.split("|") as [string, MaterialGroup];
    const cull = kind === "cloud" ? undefined : options.toCamera;
    const level = options.level ?? "near";
    const geometry =
      level === "far"
        ? silhouette(items)
        : merge(items, kind === "sign", cull, options.cullThreshold ?? -0.3);
    const triangles = (geometry.index?.count ?? 0) / 3;
    if (triangles > 0) meshes.push({ chunk, kind, level, geometry, triangles });
  }
  let lines: BufferGeometry | null = null;
  if (linePositions.length) {
    lines = new BufferGeometry();
    lines.setAttribute("position", new Float32BufferAttribute(linePositions, 3));
    lines.computeBoundingSphere();
  }
  return { meshes, lines, anchors };
}

function merge(
  items: Mesh[],
  withUv: boolean,
  toCamera: Vector3 | undefined,
  threshold: number,
): BufferGeometry {
  let vTotal = 0;
  let iTotal = 0;
  for (const mesh of items) {
    const g = mesh.geometry as BufferGeometry;
    const flat = tokenOf(mesh.material).flat;
    const count = g.getAttribute("position").count;
    const idx = g.index ? g.index.count : count;
    vTotal += flat ? idx : count;
    iTotal += idx;
  }
  const position = new Float32Array(vTotal * 3);
  const normal = new Float32Array(vTotal * 3);
  const color = new Float32Array(vTotal * 3);
  const surf = new Float32Array(vTotal);
  const uv = withUv ? new Float32Array(vTotal * 2) : null;
  const index = new Uint32Array(iTotal);
  let vo = 0;
  let io = 0;
  const p = new Vector3();
  const n = new Vector3();
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const e1 = new Vector3();
  const e2 = new Vector3();
  const normalMatrix = new Matrix3();
  const facesCamera = (pa: Vector3, pb: Vector3, pc: Vector3) => {
    if (!toCamera) return true;
    e1.subVectors(pb, pa);
    e2.subVectors(pc, pa);
    const fn = e1.cross(e2);
    const len = fn.length();
    if (len < 1e-9) return false;
    return fn.dot(toCamera) / len >= threshold;
  };

  for (const mesh of items) {
    const g = mesh.geometry as BufferGeometry;
    const token = tokenOf(mesh.material);
    const s = SURF[token.kind];
    const m = mesh.matrixWorld;
    normalMatrix.getNormalMatrix(m);
    const flipped = m.determinant() < 0;
    const pos = g.getAttribute("position") as BufferAttribute;
    const nor = g.getAttribute("normal") as BufferAttribute | undefined;
    const col = token.vertexColors
      ? (g.getAttribute("color") as BufferAttribute | undefined)
      : undefined;
    const tex = withUv ? (g.getAttribute("uv") as BufferAttribute | undefined) : undefined;
    const lin = [
      srgbToLinear((token.color >> 16) & 255),
      srgbToLinear((token.color >> 8) & 255),
      srgbToLinear(token.color & 255),
    ];
    const srcIndex = g.index;
    const idxCount = srcIndex ? srcIndex.count : pos.count;
    const at = (i: number) => (srcIndex ? srcIndex.getX(i) : i);

    if (token.flat) {
      // unshare vertices so every face gets its own normal (faceted leaves/rocks)
      for (let i = 0; i < idxCount; i += 3) {
        const tri = [at(i), at(i + 1), at(i + 2)];
        if (flipped) tri.reverse();
        a.fromBufferAttribute(pos, tri[0] as number).applyMatrix4(m);
        b.fromBufferAttribute(pos, tri[1] as number).applyMatrix4(m);
        c.fromBufferAttribute(pos, tri[2] as number).applyMatrix4(m);
        if (!facesCamera(a, b, c)) continue;
        n.subVectors(b, a).cross(p.subVectors(c, a)).normalize();
        tri.forEach((src, j) => {
          const v = vo + j;
          const w = j === 0 ? a : j === 1 ? b : c;
          position.set([w.x, w.y, w.z], v * 3);
          normal.set([n.x, n.y, n.z], v * 3);
          if (col) color.set([col.getX(src), col.getY(src), col.getZ(src)], v * 3);
          else color.set(lin, v * 3);
          surf[v] = s;
          if (uv && tex) uv.set([tex.getX(src), tex.getY(src)], v * 2);
          index[io + j] = v;
        });
        vo += 3;
        io += 3;
      }
      continue;
    }

    for (let v = 0; v < pos.count; v++) {
      p.fromBufferAttribute(pos, v).applyMatrix4(m);
      position.set([p.x, p.y, p.z], (vo + v) * 3);
      if (nor) n.fromBufferAttribute(nor, v).applyMatrix3(normalMatrix).normalize();
      else n.set(0, 1, 0);
      normal.set([n.x, n.y, n.z], (vo + v) * 3);
      if (col) color.set([col.getX(v), col.getY(v), col.getZ(v)], (vo + v) * 3);
      else color.set(lin, (vo + v) * 3);
      surf[vo + v] = s;
      if (uv && tex) uv.set([tex.getX(v), tex.getY(v)], (vo + v) * 2);
    }
    for (let i = 0; i < idxCount; i += 3) {
      const i0 = vo + at(i);
      const i1 = vo + (flipped ? at(i + 2) : at(i + 1));
      const i2 = vo + (flipped ? at(i + 1) : at(i + 2));
      if (toCamera) {
        a.fromArray(position, i0 * 3);
        b.fromArray(position, i1 * 3);
        c.fromArray(position, i2 * 3);
        if (!facesCamera(a, b, c)) continue;
      }
      index[io] = i0;
      index[io + 1] = i1;
      index[io + 2] = i2;
      io += 3;
    }
    vo += pos.count;
  }

  const out = new BufferGeometry();
  out.setAttribute("position", new Float32BufferAttribute(position.subarray(0, vo * 3), 3));
  out.setAttribute("normal", new Float32BufferAttribute(normal.subarray(0, vo * 3), 3));
  out.setAttribute("color", new Float32BufferAttribute(color.subarray(0, vo * 3), 3));
  out.setAttribute("surf", new Float32BufferAttribute(surf.subarray(0, vo), 1));
  if (uv) out.setAttribute("uv", new Float32BufferAttribute(uv.subarray(0, vo * 2), 2));
  out.setIndex(new Uint32BufferAttribute(index.subarray(0, io), 1));
  out.computeBoundingSphere();
  out.computeBoundingBox();
  return out;
}

/**
 * The "far" level: every part that is big enough becomes its own box, in its own colour. From two
 * hundred units away a district is a skyline and a few roofs, and that is all the eye is getting
 * anyway — but it costs twelve triangles a building instead of six hundred.
 */
function silhouette(items: Mesh[]): BufferGeometry {
  const position: number[] = [];
  const normal: number[] = [];
  const color: number[] = [];
  const surf: number[] = [];
  const index: number[] = [];
  const box = new Box3();
  const size = new Vector3();
  const centre = new Vector3();
  for (const mesh of items) {
    const g = mesh.geometry as BufferGeometry;
    if (!g.boundingBox) g.computeBoundingBox();
    box.copy(g.boundingBox as Box3).applyMatrix4(mesh.matrixWorld);
    box.getSize(size);
    box.getCenter(centre);
    if (Math.max(size.x, size.y, size.z) < FAR_MIN_SIZE) continue;
    const token = tokenOf(mesh.material);
    const lin = [
      srgbToLinear((token.color >> 16) & 255),
      srgbToLinear((token.color >> 8) & 255),
      srgbToLinear(token.color & 255),
    ];
    const base = position.length / 3;
    const hx = size.x / 2;
    const hy = size.y / 2;
    const hz = size.z / 2;
    // only the three faces the fixed camera can see: top, +x and +z
    const corners: [number, number, number][] = [
      [-hx, hy, -hz],
      [hx, hy, -hz],
      [hx, hy, hz],
      [-hx, hy, hz],
      [-hx, -hy, hz],
      [hx, -hy, hz],
      [hx, -hy, -hz],
    ];
    for (const [x, y, z] of corners) {
      position.push(centre.x + x, Math.max(0, centre.y + y), centre.z + z);
      normal.push(0, 1, 0);
      color.push(lin[0] as number, lin[1] as number, lin[2] as number);
      surf.push(SURF[token.kind]);
    }
    // top
    index.push(base, base + 1, base + 2, base, base + 2, base + 3);
    // +z wall
    index.push(base + 3, base + 2, base + 5, base + 3, base + 5, base + 4);
    // +x wall
    index.push(base + 2, base + 1, base + 6, base + 2, base + 6, base + 5);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(position, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normal, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(color, 3));
  geometry.setAttribute("surf", new Float32BufferAttribute(surf, 1));
  geometry.setIndex(new Uint32BufferAttribute(index, 1));
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  return geometry;
}
