// Moving along polylines — cars on ring roads, people on sidewalks, boats on water. Pure.

export type Pt = readonly [number, number];

export interface PathSample {
  x: number;
  z: number;
  /** Heading in radians for rotation.y (model faces +x). */
  heading: number;
}

export function pathLength(points: readonly Pt[], closed: boolean): number {
  let len = 0;
  const n = points.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = points[i] as Pt;
    const b = points[(i + 1) % n] as Pt;
    len += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return len;
}

/**
 * Position at distance `d` along the path. Closed paths wrap; open paths ping-pong (boats turn
 * around instead of teleporting).
 */
export function sampleAt(points: readonly Pt[], closed: boolean, d: number): PathSample {
  const total = pathLength(points, closed);
  if (total === 0 || points.length < 2) {
    const p = points[0] ?? [0, 0];
    return { x: p[0], z: p[1], heading: 0 };
  }
  let dist: number;
  let reverse = false;
  if (closed) dist = ((d % total) + total) % total;
  else {
    const period = total * 2;
    const m = ((d % period) + period) % period;
    reverse = m > total;
    dist = reverse ? period - m : m;
  }
  const n = points.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = points[i] as Pt;
    const b = points[(i + 1) % n] as Pt;
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (dist <= seg || i === (closed ? n : n - 1) - 1) {
      const t = seg === 0 ? 0 : Math.min(1, dist / seg);
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const heading = Math.atan2(reverse ? dz : -dz, reverse ? -dx : dx);
      return { x: a[0] + dx * t, z: a[1] + dz * t, heading };
    }
    dist -= seg;
  }
  const last = points[n - 1] as Pt;
  return { x: last[0], z: last[1], heading: 0 };
}
