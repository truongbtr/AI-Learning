// City camera: fixed city-builder angle, pan and zoom only, always inside the city. Pure maths so
// the limits (which also bound the iPad budget) are testable.

import { type PerspectiveCamera, Vector3 } from "three";

export const CAMERA = {
  fov: 32,
  yawDeg: 45,
  pitchDeg: 27,
  /** Closest zoom (a few buildings fill the screen). */
  minDist: 48,
  /** Farthest zoom — also the worst case for the triangle budget. */
  maxDist: 124,
  defaultDist: 104,
} as const;

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
