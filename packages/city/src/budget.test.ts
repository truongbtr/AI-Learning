import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PerspectiveCamera } from "three";
import { describe, expect, it } from "vitest";
import { KenneyLibrary } from "./build/kenney";
import { SignAtlas } from "./build/signs";
import { buildAgentTemplates, maxAgentLoad } from "./engine/agents";
import { IPAD_BUDGET, visibleBudget } from "./engine/budget";
import { applyCamera, CAMERA } from "./engine/camera";
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
const agents = maxAgentLoad(buildAgentTemplates());

// iPad landscape and portrait; the camera is clamped, so these corners are the worst views.
const ASPECTS = [2360 / 1640, 1640 / 2360];

describe("iPad budget (ADR-20): ≤ 150 draw calls, ≤ 80k triangles in any allowed view", () => {
  for (const city of CITY_IDS) {
    it(`${city} at its largest (every skill built, 14 public buildings, 10 plots)`, () => {
      const built = buildCity(sampleView(city, "full"), lib, new SignAtlas());
      const { panBounds: b } = built.composition;
      const cam = new PerspectiveCamera();
      let worst = { drawCalls: 0, triangles: 0 };
      for (const aspect of ASPECTS) {
        for (const x of [b.minX, 0, b.maxX]) {
          for (const z of [b.minZ, 0, b.maxZ]) {
            for (const dist of [CAMERA.defaultDist, CAMERA.maxDist]) {
              applyCamera(cam, { x, z, dist }, aspect);
              const load = visibleBudget(built.baked, cam, agents);
              worst = {
                drawCalls: Math.max(worst.drawCalls, load.drawCalls),
                triangles: Math.max(worst.triangles, load.triangles),
              };
            }
          }
        }
      }
      expect(worst.drawCalls).toBeLessThanOrEqual(IPAD_BUDGET.drawCalls);
      expect(worst.triangles).toBeLessThanOrEqual(IPAD_BUDGET.triangles);
    });
  }

  it("agents stay small", () => {
    expect(agents.triangles).toBeLessThan(8000);
  });
});
