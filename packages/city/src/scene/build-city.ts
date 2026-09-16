// Pipeline shared by the browser engine, tests and the bench: view → composition → baked chunks.

import type { CityView } from "@mtct/core";
import { Vector2 } from "three";
import { type BakeResult, bake } from "../build/bake";
import type { BuildCtx } from "../build/context";
import type { KenneyLibrary } from "../build/kenney";
import type { SignAtlas } from "../build/signs";
import { toCameraDir } from "../engine/camera";
import { CURVE_K, curvedBoundingSphere } from "../engine/curve";
import { CITY } from "../palette";
import { type Composition, composeCity } from "./compose";

/** The bake grid of pha 12: 60 × 60 world units, one draw call each (ADR-23). */
export const CHUNK_SIZE = 60;

export interface BuiltCity {
  composition: Composition;
  baked: BakeResult;
  center: Vector2;
}

/** Distance from the camera at which a chunk drops to the next detail level (ADR-23). */
export const LOD_DISTANCE = { mid: 100, far: 190 } as const;

/** Which level a chunk should be drawn at, from how far away its middle is. */
export function levelFor(distance: number): "near" | "mid" | "far" {
  if (distance > LOD_DISTANCE.far) return "far";
  if (distance > LOD_DISTANCE.mid) return "mid";
  return "near";
}

/** The middle of a chunk, from its key. */
export function chunkCentre(key: string, size = CHUNK_SIZE): { x: number; z: number } {
  const [cx, cz] = key.split(",").map(Number) as [number, number];
  return { x: (cx + 0.5) * size, z: (cz + 0.5) * size };
}

export function buildCity(view: CityView, lib: KenneyLibrary, atlas: SignAtlas): BuiltCity {
  const ctx: BuildCtx = { city: CITY[view.subject], lib, atlas };
  const composition = composeCity(ctx, view);
  const toCamera = toCameraDir();
  // three bakes of the same city: the frame picks one per chunk (pha 12 việc 5)
  const near = bake(composition.root, CHUNK_SIZE, { toCamera });
  const mid = bake(composition.root, CHUNK_SIZE, { toCamera, level: "mid" });
  const far = bake(composition.root, CHUNK_SIZE, { toCamera, level: "far" });
  const baked = {
    ...near,
    meshes: [...near.meshes, ...mid.meshes, ...far.meshes],
  };
  const b = composition.layout.bounds;
  const center = new Vector2((b.minX + b.maxX) / 2, (b.minZ + b.maxZ) / 2);
  for (const m of baked.meshes) {
    if (m.kind === "cloud") continue; // clouds do not bend
    m.geometry.boundingSphere = curvedBoundingSphere(
      m.geometry,
      center,
      composition.curveStart,
      CURVE_K,
    );
  }
  return { composition, baked, center };
}
