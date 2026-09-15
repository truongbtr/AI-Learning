// What the GPU is asked to draw for one camera — the iPad budget check (≤ 150 draw calls, ≤ 80k
// triangles) runs this in unit tests without a GPU, and the bench prints it next to real fps.

import { Frustum, Matrix4, type PerspectiveCamera } from "three";
import type { BakeResult } from "../build/bake";

export const IPAD_BUDGET = { drawCalls: 150, triangles: 80_000 } as const;

export interface Budget {
  drawCalls: number;
  triangles: number;
  chunks: number;
}

/** Instanced agents: one draw call per archetype in use, triangles × visible count. */
export interface AgentLoad {
  drawCalls: number;
  triangles: number;
}

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
  for (const m of baked.meshes) {
    const sphere = m.geometry.boundingSphere;
    if (sphere && !frustum.intersectsSphere(sphere)) continue;
    drawCalls++;
    triangles += m.triangles;
    chunks.add(m.chunk);
  }
  if (baked.lines) drawCalls++;
  return {
    drawCalls: drawCalls + agents.drawCalls,
    triangles: triangles + agents.triangles,
    chunks: chunks.size,
  };
}
