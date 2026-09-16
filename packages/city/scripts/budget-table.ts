// Prints the worst-case budget table used in ADR-20: pnpm --filter @mtct/city exec tsx scripts/budget-table.ts
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PerspectiveCamera } from "three";
import { KenneyLibrary } from "../src/build/kenney";
import { SignAtlas } from "../src/build/signs";
import { buildAgentTemplates, maxAgentLoad } from "../src/engine/agents";
import { visibleBudget } from "../src/engine/budget";
import { applyCamera, CAMERA } from "../src/engine/camera";
import type { KenneyManifest } from "../src/kenney/set";
import { CITY_IDS } from "../src/palette";
import { sampleView } from "../src/sample";
import { buildCity } from "../src/scene/build-city";

const art = resolve(dirname(fileURLToPath(import.meta.url)), "../../../content/art/city");
const manifest = JSON.parse(readFileSync(join(art, "kenney.json"), "utf8")) as KenneyManifest;
const buf = readFileSync(join(art, "kenney.bin"));
const lib = new KenneyLibrary(
  manifest,
  buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
);
const agents = maxAgentLoad(buildAgentTemplates());
console.log(`agents (max): ${agents.drawCalls} draw calls, ${agents.triangles} triangles`);
console.log(
  "| Cỡ | Thành phố | Draw call xấu nhất | Tam giác xấu nhất | Dựng (ms, Node) |\n|---|---|---|---|---|",
);
for (const size of ["day1", "mid", "full", "endOfYear"] as const) {
  for (const city of CITY_IDS) {
    const t0 = performance.now();
    const built = buildCity(sampleView(city, size), lib, new SignAtlas());
    const ms = performance.now() - t0;
    const b = built.composition.panBounds;
    const cam = new PerspectiveCamera();
    let dc = 0;
    let tri = 0;
    for (const aspect of [2360 / 1640, 1640 / 2360])
      for (const x of [b.minX, 0, b.maxX])
        for (const z of [b.minZ, 0, b.maxZ])
          for (const dist of [CAMERA.defaultDist, CAMERA.maxDist]) {
            applyCamera(cam, { x, z, dist }, aspect);
            const l = visibleBudget(built.baked, cam, agents);
            dc = Math.max(dc, l.drawCalls);
            tri = Math.max(tri, l.triangles);
          }
    console.log(`| ${size} | ${city} | ${dc} | ${tri} | ${ms.toFixed(0)} |`);
  }
}
