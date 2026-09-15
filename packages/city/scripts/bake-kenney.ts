/**
 * Bake the curated Kenney models into one compact vertex-coloured blob.
 *
 *   pnpm --filter @mtct/city bake:kenney
 *
 * Kenney city kits colour every face by sampling a 512² swatch atlas (colormap.png); the nature kit
 * uses flat material colours. We sample the colour once per vertex here, so the running app needs no
 * textures at all: every static surface shares one vertex-colour material and merges into a handful
 * of draw calls. Per-city repainting then only rewrites vertex colours (src/color.ts).
 *
 * Input:  content/art/kenney/<kit>/…glb  (gitignored, download per content/art/kenney/README.md)
 * Output: content/art/city/kenney.bin + kenney.json  (committed, served by art:sync)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { Matrix3, Matrix4, Quaternion, Vector3 } from "three";
import {
  allKenneyKeys,
  KENNEY_KITS,
  type KenneyKit,
  type KenneyManifest,
  type KenneyModel,
} from "../src/kenney/set";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../..");
const kenneyRoot = join(repo, "content/art/kenney");
const outDir = join(repo, "content/art/city");

interface Gltf {
  scene?: number;
  scenes: { nodes: number[] }[];
  nodes: {
    mesh?: number;
    children?: number[];
    matrix?: number[];
    translation?: number[];
    rotation?: number[];
    scale?: number[];
  }[];
  meshes: {
    primitives: { attributes: Record<string, number>; indices?: number; material?: number }[];
  }[];
  accessors: {
    bufferView: number;
    byteOffset?: number;
    componentType: number;
    count: number;
    type: string;
    normalized?: boolean;
  }[];
  bufferViews: { byteOffset?: number; byteLength: number; byteStride?: number }[];
  materials?: {
    pbrMetallicRoughness?: {
      baseColorFactor?: number[];
      baseColorTexture?: { index: number };
    };
  }[];
  textures?: { source: number }[];
  images?: { uri?: string }[];
}

const COMPONENTS: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const BYTES: Record<number, number> = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };

function readAccessor(gltf: Gltf, bin: Buffer, index: number): number[] {
  const acc = gltf.accessors[index];
  if (!acc) throw new Error(`accessor ${index} missing`);
  const view = gltf.bufferViews[acc.bufferView];
  if (!view) throw new Error(`bufferView ${acc.bufferView} missing`);
  const comps = COMPONENTS[acc.type] ?? 1;
  const size = BYTES[acc.componentType] ?? 4;
  const stride = view.byteStride ?? comps * size;
  const base = (view.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const out: number[] = [];
  for (let i = 0; i < acc.count; i++) {
    for (let c = 0; c < comps; c++) {
      const o = base + i * stride + c * size;
      let v: number;
      switch (acc.componentType) {
        case 5126:
          v = bin.readFloatLE(o);
          break;
        case 5125:
          v = bin.readUInt32LE(o);
          break;
        case 5123:
          v = bin.readUInt16LE(o);
          if (acc.normalized) v /= 65535;
          break;
        case 5121:
          v = bin.readUInt8(o);
          if (acc.normalized) v /= 255;
          break;
        case 5122:
          v = bin.readInt16LE(o);
          if (acc.normalized) v = Math.max(v / 32767, -1);
          break;
        default:
          v = bin.readInt8(o);
          if (acc.normalized) v = Math.max(v / 127, -1);
      }
      out.push(v);
    }
  }
  return out;
}

function linearToSrgb(c: number): number {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, v)) * 255);
}

interface Atlas {
  width: number;
  height: number;
  data: Buffer;
}
const atlasCache = new Map<string, Atlas>();
async function loadAtlas(path: string): Promise<Atlas> {
  const hit = atlasCache.get(path);
  if (hit) return hit;
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const atlas = { width: info.width, height: info.height, data };
  atlasCache.set(path, atlas);
  return atlas;
}

function sample(atlas: Atlas, u: number, v: number): [number, number, number] {
  const wrap = (x: number) => x - Math.floor(x);
  const x = Math.min(atlas.width - 1, Math.floor(wrap(u) * atlas.width));
  const y = Math.min(atlas.height - 1, Math.floor(wrap(v) * atlas.height));
  const o = (y * atlas.width + x) * 4;
  return [atlas.data[o] ?? 0, atlas.data[o + 1] ?? 0, atlas.data[o + 2] ?? 0];
}

interface Baked {
  positions: number[];
  normals: number[];
  colors: number[];
  indices: number[];
}

async function bakeModel(kit: KenneyKit, name: string): Promise<Baked> {
  const file = join(kenneyRoot, KENNEY_KITS[kit], `${name}.glb`);
  if (!existsSync(file))
    throw new Error(`missing ${file} — download the kits (content/art/kenney/README.md)`);
  const buf = readFileSync(file);
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8")) as Gltf;
  const binStart = 20 + jsonLen + 8;
  const bin = buf.subarray(binStart);
  const out: Baked = { positions: [], normals: [], colors: [], indices: [] };

  const visit = async (nodeIndex: number, parent: Matrix4) => {
    const node = gltf.nodes[nodeIndex];
    if (!node) return;
    const local = new Matrix4();
    if (node.matrix) local.fromArray(node.matrix);
    else {
      const t = node.translation ?? [0, 0, 0];
      const r = node.rotation ?? [0, 0, 0, 1];
      const s = node.scale ?? [1, 1, 1];
      local.compose(
        new Vector3(t[0], t[1], t[2]),
        new Quaternion(r[0], r[1], r[2], r[3]),
        new Vector3(s[0], s[1], s[2]),
      );
    }
    const world = parent.clone().multiply(local);
    const normalMatrix = new Matrix3().getNormalMatrix(world);
    if (node.mesh !== undefined) {
      const mesh = gltf.meshes[node.mesh];
      for (const prim of mesh?.primitives ?? []) {
        const pos = readAccessor(gltf, bin, prim.attributes.POSITION as number);
        const nor =
          prim.attributes.NORMAL !== undefined
            ? readAccessor(gltf, bin, prim.attributes.NORMAL)
            : null;
        const uv =
          prim.attributes.TEXCOORD_0 !== undefined
            ? readAccessor(gltf, bin, prim.attributes.TEXCOORD_0)
            : null;
        const material = gltf.materials?.[prim.material ?? -1]?.pbrMetallicRoughness;
        const factor = material?.baseColorFactor ?? [1, 1, 1, 1];
        const texIndex = material?.baseColorTexture?.index;
        let atlas: Atlas | null = null;
        if (texIndex !== undefined) {
          const source = gltf.textures?.[texIndex]?.source ?? -1;
          const uri = gltf.images?.[source]?.uri;
          if (uri) atlas = await loadAtlas(join(dirname(file), decodeURIComponent(uri)));
        }
        const base = out.positions.length / 3;
        const count = pos.length / 3;
        const p = new Vector3();
        const n = new Vector3();
        for (let i = 0; i < count; i++) {
          p.set(pos[i * 3] ?? 0, pos[i * 3 + 1] ?? 0, pos[i * 3 + 2] ?? 0).applyMatrix4(world);
          out.positions.push(p.x, p.y, p.z);
          if (nor) n.set(nor[i * 3] ?? 0, nor[i * 3 + 1] ?? 1, nor[i * 3 + 2] ?? 0);
          else n.set(0, 1, 0);
          n.applyMatrix3(normalMatrix).normalize();
          out.normals.push(n.x, n.y, n.z);
          let rgb: [number, number, number];
          if (atlas && uv) rgb = sample(atlas, uv[i * 2] ?? 0, uv[i * 2 + 1] ?? 0);
          else rgb = [255, 255, 255];
          // baseColorFactor is linear; the atlas is sRGB — multiply in sRGB after converting
          out.colors.push(
            Math.round((rgb[0] * linearToSrgb(factor[0] ?? 1)) / 255),
            Math.round((rgb[1] * linearToSrgb(factor[1] ?? 1)) / 255),
            Math.round((rgb[2] * linearToSrgb(factor[2] ?? 1)) / 255),
          );
        }
        const idx =
          prim.indices !== undefined
            ? readAccessor(gltf, bin, prim.indices)
            : [...Array(count).keys()];
        for (const i of idx) out.indices.push(base + i);
      }
    }
    for (const child of node.children ?? []) await visit(child, world);
  };
  const scene = gltf.scenes[gltf.scene ?? 0];
  for (const root of scene?.nodes ?? []) await visit(root, new Matrix4());
  return out;
}

async function main() {
  const models: Record<string, KenneyModel> = {};
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  for (const key of allKenneyKeys()) {
    const [kit, name] = key.split("/") as [KenneyKit, string];
    const baked = await bakeModel(kit, name);
    const vOffset = positions.length / 3;
    const iOffset = indices.length;
    const bbox: KenneyModel["bbox"] = [
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ];
    for (let i = 0; i < baked.positions.length; i += 3) {
      for (let c = 0; c < 3; c++) {
        const v = baked.positions[i + c] ?? 0;
        bbox[c] = Math.min(bbox[c] as number, v);
        bbox[c + 3] = Math.max(bbox[c + 3] as number, v);
      }
    }
    positions.push(...baked.positions);
    normals.push(...baked.normals);
    colors.push(...baked.colors);
    // indices stay model-local so the runtime can copy a model without rebasing
    indices.push(...baked.indices);
    models[key] = {
      vOffset,
      vCount: baked.positions.length / 3,
      iOffset,
      iCount: baked.indices.length,
      bbox: bbox.map((v) => Math.round(v * 1000) / 1000) as KenneyModel["bbox"],
    };
  }
  const vertices = positions.length / 3;
  const posBytes = new Float32Array(positions);
  const norBytes = new Int8Array(normals.map((v) => Math.round(v * 127)));
  const colBytes = new Uint8Array(colors);
  const idxBytes = new Uint32Array(indices);
  // pad each section to a 4-byte boundary so typed-array views line up in the browser
  const pad = (n: number) => (4 - (n % 4)) % 4;
  const sections = [posBytes, norBytes, colBytes, idxBytes];
  const layout = { positions: 0, normals: 0, colors: 0, indices: 0 };
  let offset = 0;
  const parts: Buffer[] = [];
  sections.forEach((s, i) => {
    const key = (["positions", "normals", "colors", "indices"] as const)[i] as keyof typeof layout;
    layout[key] = offset;
    const b = Buffer.from(s.buffer, s.byteOffset, s.byteLength);
    parts.push(b, Buffer.alloc(pad(b.length)));
    offset += b.length + pad(b.length);
  });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "kenney.bin"), Buffer.concat(parts));
  const manifest: KenneyManifest = {
    version: 1,
    vertices,
    indices: indices.length,
    layout,
    models,
  };
  writeFileSync(join(outDir, "kenney.json"), `${JSON.stringify(manifest, null, 1)}\n`);
  console.log(
    `kenney: ${Object.keys(models).length} models, ${vertices} vertices, ${indices.length / 3} triangles, ${(offset / 1024).toFixed(0)} KB`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
