// City camera: fixed city-builder angle, pan and zoom only, always inside the city. Pure maths so
// the limits (which also bound the iPad budget) are testable.

import { type PerspectiveCamera, Vector3 } from "three";

export const CAMERA = {
  fov: 32,
  yawDeg: 45,
  pitchDeg: 27,
  /** Closest zoom (a few buildings fill the screen). */
  minDist: 48,
  /**
   * Farthest zoom. Pha 12 fixed it from the other end: the widest view a child can reach must
   * touch at most 9 chunks of the bake grid (ADR-23), because that is what keeps the draw calls
   * the same whether the city is three houses or a year's work. Pulling further out hands the
   * child the paper map instead of more geometry.
   */
  maxDist: 108,
  defaultDist: 96,
} as const;

/**
 * The patch of ground the camera sees, as an axis-aligned rectangle. Approximate on purpose: it
 * counts chunks and spawns traffic, it never culls a triangle.
 */
export function groundFootprint(
  s: CameraState,
  aspect: number,
): { minX: number; maxX: number; minZ: number; maxZ: number } {
  const pitch = (CAMERA.pitchDeg * Math.PI) / 180;
  const d = s.dist * (aspect < 1 ? 1.25 : 1);
  const halfHeight = d * Math.tan((CAMERA.fov * Math.PI) / 360);
  const depth = halfHeight / Math.sin(pitch);
  const width = halfHeight * Math.max(aspect, 0.4);
  // the camera looks down the yaw diagonal, so the footprint is a diamond; its bounding box is
  // what the chunk count cares about
  const yaw = (CAMERA.yawDeg * Math.PI) / 180;
  const ex = Math.abs(Math.cos(yaw)) * width + Math.abs(Math.sin(yaw)) * depth;
  const ez = Math.abs(Math.sin(yaw)) * width + Math.abs(Math.cos(yaw)) * depth;
  return { minX: s.x - ex, maxX: s.x + ex, minZ: s.z - ez, maxZ: s.z + ez };
}

/**
 * The four corners of what the camera sees on the ground — the rays through the corners of the
 * screen, met with y = 0. A tilted camera sees a trapezium, not a rectangle, and counting its
 * bounding box would condemn the city to a much closer zoom than it needs.
 */
export function groundQuad(s: CameraState, aspect: number): [number, number][] {
  const yaw = (CAMERA.yawDeg * Math.PI) / 180;
  const pitch = (CAMERA.pitchDeg * Math.PI) / 180;
  const d = s.dist * (aspect < 1 ? 1.25 : 1);
  const eye = new Vector3(
    s.x + Math.sin(yaw) * Math.cos(pitch) * d,
    Math.sin(pitch) * d,
    s.z + Math.cos(yaw) * Math.cos(pitch) * d,
  );
  const forward = new Vector3(s.x - eye.x, -eye.y, s.z - eye.z).normalize();
  const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize();
  const up = new Vector3().crossVectors(right, forward).normalize();
  const tan = Math.tan((CAMERA.fov * Math.PI) / 360);
  const out: [number, number][] = [];
  for (const [sx, sy] of [
    [-1, 1],
    [1, 1],
    [1, -1],
    [-1, -1],
  ] as const) {
    const dir = new Vector3()
      .copy(forward)
      .addScaledVector(right, sx * tan * Math.max(aspect, 0.4))
      .addScaledVector(up, sy * tan)
      .normalize();
    // a ray that points at or above the horizon is stopped at the far plane instead
    const t = dir.y < -1e-4 ? -eye.y / dir.y : 900;
    out.push([eye.x + dir.x * t, eye.z + dir.z * t]);
  }
  return out;
}

/** How many chunks of `size` the view touches — the number ADR-23 caps at 9. */
export function chunksInView(s: CameraState, aspect: number, size: number): number {
  const quad = groundQuad(s, aspect);
  const xs = quad.map((p) => p[0]);
  const zs = quad.map((p) => p[1]);
  const c0 = Math.floor(Math.min(...xs) / size);
  const c1 = Math.floor(Math.max(...xs) / size);
  const r0 = Math.floor(Math.min(...zs) / size);
  const r1 = Math.floor(Math.max(...zs) / size);
  let touched = 0;
  for (let c = c0; c <= c1; c++) {
    for (let r = r0; r <= r1; r++) {
      const cell: [number, number][] = [
        [c * size, r * size],
        [(c + 1) * size, r * size],
        [(c + 1) * size, (r + 1) * size],
        [c * size, (r + 1) * size],
      ];
      if (polygonsOverlap(quad, cell)) touched++;
    }
  }
  return touched;
}

/** Separating-axis test between two convex polygons. */
function polygonsOverlap(a: [number, number][], b: [number, number][]): boolean {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i] as [number, number];
      const q = poly[(i + 1) % poly.length] as [number, number];
      const axis: [number, number] = [-(q[1] - p[1]), q[0] - p[0]];
      const span = (points: [number, number][]) => {
        const values = points.map(([x, z]) => x * axis[0] + z * axis[1]);
        return [Math.min(...values), Math.max(...values)] as const;
      };
      const [aMin, aMax] = span(a);
      const [bMin, bMax] = span(b);
      if (aMax < bMin - 1e-6 || bMax < aMin - 1e-6) return false;
    }
  }
  return true;
}

/** Unit vector from the scene toward the camera — fixed, because the camera never rotates. */
export function toCameraDir(): Vector3 {
  const yaw = (CAMERA.yawDeg * Math.PI) / 180;
  const pitch = (CAMERA.pitchDeg * Math.PI) / 180;
  return new Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch),
  ).normalize();
}

export interface CameraState {
  x: number;
  z: number;
  dist: number;
}

export interface PanBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function clampState(s: CameraState, b: PanBounds): CameraState {
  return {
    x: Math.min(b.maxX, Math.max(b.minX, s.x)),
    z: Math.min(b.maxZ, Math.max(b.minZ, s.z)),
    dist: Math.min(CAMERA.maxDist, Math.max(CAMERA.minDist, s.dist)),
  };
}

export function applyCamera(camera: PerspectiveCamera, s: CameraState, aspect: number): void {
  const yaw = (CAMERA.yawDeg * Math.PI) / 180;
  const pitch = (CAMERA.pitchDeg * Math.PI) / 180;
  camera.fov = CAMERA.fov;
  camera.aspect = aspect;
  // portrait screens see less width: pull back a little so the city still reads
  const d = s.dist * (aspect < 1 ? 1.25 : 1);
  camera.position.set(
    s.x + Math.sin(yaw) * Math.cos(pitch) * d,
    Math.sin(pitch) * d,
    s.z + Math.cos(yaw) * Math.cos(pitch) * d,
  );
  camera.lookAt(s.x, 0, s.z);
  camera.near = 1;
  camera.far = 900;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}

/** World-space ground delta for a screen drag of (dx, dy) pixels. */
export function panDelta(
  s: CameraState,
  dx: number,
  dy: number,
  viewportHeight: number,
): { x: number; z: number } {
  const pitch = (CAMERA.pitchDeg * Math.PI) / 180;
  const worldPerPx = (2 * s.dist * Math.tan((CAMERA.fov * Math.PI) / 360)) / viewportHeight;
  const yaw = (CAMERA.yawDeg * Math.PI) / 180;
  const right = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const forward = new Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const fx = -dx * worldPerPx;
  const fz = (dy * worldPerPx) / Math.sin(pitch);
  return { x: right.x * fx + forward.x * fz, z: right.z * fx + forward.z * fz };
}

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
