// What the GPU is asked to draw for one camera — the iPad budget check (≤ 150 draw calls, ≤ 80k
// triangles) runs this in unit tests without a GPU, and the bench prints it next to real fps.
//
// Pha 12: a chunk is drawn at one of three detail levels, chosen by how far it is from the camera
// (ADR-23), so this counts the level a frame would really use rather than everything baked.

import { Frustum, Matrix4, type PerspectiveCamera, Vector3 } from "three";
import type { BakeResult, DetailLevel } from "../build/bake";
import { chunkCentre, levelFor } from "../scene/build-city";

export const IPAD_BUDGET = { drawCalls: 150, triangles: 80_000 } as const;

export interface Budget {
  drawCalls: number;
  triangles: number;
  chunks: number;
  /** How many chunks were drawn at each level — the LOD ladder, visible in the bench. */
  levels: Record<DetailLevel, number>;
}

/** Instanced agents: one draw call per archetype in use, triangles × visible count. */
export interface AgentLoad {
  drawCalls: number;
  triangles: number;
}

const tmp = new Vector3();

export function visibleBudget(
  baked: BakeResult,
  camera: PerspectiveCamera,
  agents: AgentLoad,
): Budget {
  camera.updateMatrixWorld();
  const frustum = new Frustum().setFromProjectionMatrix(
    new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
  );
  let drawCalls = 1; // sky
  let triangles = 0;
  const chunks = new Set<string>();
  const levels: Record<DetailLevel, number> = { near: 0, mid: 0, far: 0 };
  const seen = new Set<string>();
  for (const m of baked.meshes) {
    const sphere = m.geometry.boundingSphere;
    if (sphere && !frustum.intersectsSphere(sphere)) continue;
    // clouds and outlines have no chunk of their own to step down
    const centre = chunkCentre(m.chunk);
    tmp.set(centre.x, 0, centre.z);
    const wanted = m.kind === "cloud" ? "near" : levelFor(camera.position.distanceTo(tmp));
    if (m.level !== wanted) continue;
    drawCalls++;
    triangles += m.triangles;
    chunks.add(m.chunk);
    if (!seen.has(m.chunk)) {
      seen.add(m.chunk);
      levels[m.level]++;
    }
  }
  if (baked.lines) drawCalls++;
  return {
    drawCalls: drawCalls + agents.drawCalls,
    triangles: triangles + agents.triangles,
    chunks: chunks.size,
    levels,
  };
}
