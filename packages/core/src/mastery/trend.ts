import { DAY_MS } from "./constants";

export interface MasteryPoint {
  at: Date;
  masteryBefore: number;
  masteryAfter: number;
}

/**
 * trend14d = mastery now - mastery 14 days ago, reconstructed from MasteryHistory points
 * (any order). Baseline = masteryAfter of the last point at or before the cutoff; if none,
 * the masteryBefore of the first point inside the window. No history -> 0.
 */
export function computeTrend14d(points: MasteryPoint[], masteryNow: number, now: Date): number {
  if (points.length === 0) return 0;
  const cutoff = now.getTime() - 14 * DAY_MS;
  const sorted = [...points].sort((a, b) => a.at.getTime() - b.at.getTime());
  let baseline: number | null = null;
  for (const p of sorted) {
    if (p.at.getTime() <= cutoff) baseline = p.masteryAfter;
  }
  if (baseline === null) {
    const first = sorted.find((p) => p.at.getTime() > cutoff);
    baseline = first ? first.masteryBefore : masteryNow;
  }
  return Math.round((masteryNow - baseline) * 10) / 10;
}
