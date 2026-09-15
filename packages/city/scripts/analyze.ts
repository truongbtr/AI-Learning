// Where do the triangles go? pnpm --filter @mtct/city exec tsx scripts/analyze.ts viet full
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Mesh, type Object3D, PerspectiveCamera } from "three";
import { bake } from "../src/build/bake";
import { KenneyLibrary } from "../src/build/kenney";
import { SignAtlas } from "../src/build/signs";
import { visibleBudget } from "../src/engine/budget";
import { applyCamera, CAMERA, toCameraDir } from "../src/engine/camera";
import type { KenneyManifest } from "../src/kenney/set";
import type { CityId } from "../src/palette";
import { type SampleSize, sampleView } from "../src/sample";
import { buildCity } from "../src/scene/build-city";

const here = dirname(fileURLToPath(import.meta.url));
const art = resolve(here, "../../../content/art/city");
const manifest = JSON.parse(readFileSync(join(art, "kenney.json"), "utf8")) as KenneyManifest;
const buf = readFileSync(join(art, "kenney.bin"));
const lib = new KenneyLibrary(
  manifest,
  buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
);
const city = (process.argv[2] ?? "viet") as CityId;
const size = (process.argv[3] ?? "full") as SampleSize;
const built = buildCity(sampleView(city, size), lib, new SignAtlas());
const tris = (o: Object3D) => {
  let t = 0;
  o.traverse((m) => {
    if (m instanceof Mesh)
      t +=
        (m.geometry.index ? m.geometry.index.count : m.geometry.getAttribute("position").count) / 3;
  });
  return t;
};
const byKind: Record<string, number> = {};
for (const m of built.baked.meshes) byKind[m.kind] = (byKind[m.kind] ?? 0) + m.triangles;
console.log(
  "total",
  built.baked.meshes.reduce((s, m) => s + m.triangles, 0),
  "meshes",
  built.baked.meshes.length,
  byKind,
);
const cats: Record<string, number> = {};
for (const child of built.composition.root.children) {
  const name = (child.userData.cat as string) ?? child.type;
  cats[name] =
    (cats[name] ?? 0) +
    bake(child, 1e6, { toCamera: toCameraDir() }).meshes.reduce((s, m) => s + m.triangles, 0);
  void tris;
}
console.log(
  Object.entries(cats)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}:${v}`)
    .join("  "),
);
const cam = new PerspectiveCamera();
for (const [label, x, z, dist] of [
  ["default", 0, 0, CAMERA.defaultDist],
  ["far", 0, 0, CAMERA.maxDist],
  ["corner", built.composition.panBounds.maxX, built.composition.panBounds.maxZ, CAMERA.maxDist],
  ["farCorner", built.composition.panBounds.minX, built.composition.panBounds.minZ, CAMERA.maxDist],
] as const) {
  applyCamera(cam, { x, z, dist }, 1180 / 820);
  console.log(label, visibleBudget(built.baked, cam, { drawCalls: 10, triangles: 6000 }));
}
