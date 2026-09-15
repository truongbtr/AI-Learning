// Ground curvature (approved in việc 1): flat inside `start`, then y −= k·d². Patched into the vertex
// shaders of every city material — including shadow depth — and mirrored on the CPU for bounding
// spheres, so frustum culling keeps the far hills that bend down into view.

import { Box3, type BufferGeometry, type Material, Sphere, Vector2, Vector3 } from "three";

export const CURVE_K = 0.0055;

export interface CurveUniforms {
  curveCenter: { value: Vector2 };
  curveStart: { value: number };
  curveK: { value: number };
  /** "Growing from the ground" (việc 4): centre and half-size (x,z) of one lot, and growth 0…1+. */
  riseCenter: { value: Vector2 };
  riseHalf: { value: Vector2 };
  riseProgress: { value: number };
}

export function createCurveUniforms(): CurveUniforms {
  return {
    curveCenter: { value: new Vector2() },
    curveStart: { value: 60 },
    curveK: { value: CURVE_K },
    riseCenter: { value: new Vector2() },
    riseHalf: { value: new Vector2(0, 0) },
    riseProgress: { value: 1 },
  };
}

/** Height of lot pads: anything above it on the rising lot scales up from here. */
export const RISE_BASE = 0.16;

const CURVE_FN = /* glsl */ `
uniform vec2 curveCenter;
uniform float curveStart;
uniform float curveK;
uniform vec2 riseCenter;
uniform vec2 riseHalf;
uniform float riseProgress;
vec4 curveWorld(vec4 w) {
  if (abs(w.x - riseCenter.x) < riseHalf.x && abs(w.z - riseCenter.y) < riseHalf.y && w.y > ${RISE_BASE.toFixed(2)}) {
    w.y = ${RISE_BASE.toFixed(2)} + (w.y - ${RISE_BASE.toFixed(2)}) * riseProgress;
  }
  float d = max(0.0, length(w.xz - curveCenter) - curveStart);
  w.y -= curveK * d * d;
  return w;
}
`;

const PROJECT = /* glsl */ `
vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = viewMatrix * curveWorld( modelMatrix * mvPosition );
gl_Position = projectionMatrix * mvPosition;
`;

const WORLDPOS = /* glsl */ `
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
  vec4 worldPosition = vec4( transformed, 1.0 );
  #ifdef USE_INSTANCING
    worldPosition = instanceMatrix * worldPosition;
  #endif
  worldPosition = curveWorld( modelMatrix * worldPosition );
#endif
`;

/** Make a material bend with the world. `extra` lets callers add their own shader tweaks. */
export function bend<T extends Material>(
  material: T,
  uniforms: CurveUniforms,
  extra?: (shader: {
    vertexShader: string;
    fragmentShader: string;
    uniforms: Record<string, unknown>;
  }) => void,
): T {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${CURVE_FN}`)
      .replace("#include <project_vertex>", PROJECT)
      .replace("#include <worldpos_vertex>", WORLDPOS);
    extra?.(shader);
  };
  material.customProgramCacheKey = () => `curve|${material.type}|${extra ? "x" : ""}`;
  return material;
}

/** Bounding sphere of a geometry as the shader will draw it. */
export function curvedBoundingSphere(
  geometry: BufferGeometry,
  center: Vector2,
  start: number,
  k = CURVE_K,
): Sphere {
  const pos = geometry.getAttribute("position");
  const box = new Box3();
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const d = Math.max(0, Math.hypot(v.x - center.x, v.z - center.y) - start);
    v.y -= k * d * d;
    box.expandByPoint(v);
  }
  return box.getBoundingSphere(new Sphere());
}
