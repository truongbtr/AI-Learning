// Pipeline shared by the browser engine, tests and the bench: view → composition → baked chunks.

import type { CityView } from "@mtct/core";
import { Vector2 } from "three";
import { type BakeResult, bake } from "../build/bake";
import type { BuildCtx } from "../build/context";
import type { KenneyLibrary } from "../build/kenney";
import type { SignAtlas } from "../build/signs";
import { toCameraDir } from "../engine/camera";
import { CURVE_K, curvedBoundingSphere } from "../engine/curve";
import { TILE } from "../layout";
import { CITY } from "../palette";
import { type Composition, composeCity } from "./compose";

export const CHUNK_SIZE = 16 * TILE;

export interface BuiltCity {
  composition: Composition;
  baked: BakeResult;
  center: Vector2;
}

export function buildCity(view: CityView, lib: KenneyLibrary, atlas: SignAtlas): BuiltCity {
  const ctx: BuildCtx = { city: CITY[view.subject], lib, atlas };
  const composition = composeCity(ctx, view);
  const baked = bake(composition.root, CHUNK_SIZE, { toCamera: toCameraDir() });
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
