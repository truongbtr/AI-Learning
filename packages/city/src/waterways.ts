// The river, the harbour and the lanes boats move along. Pure geometry, no three.js.
//
// Pha 12: every city gets a river along its edge, there from day one, so the child can see how much
// room is still left to grow into. The city reaches it eventually; then a bridge is built and the
// far bank opens. Each city's river has a character of its own — and it is a parameter, not a
// special case in code (docs/08 pha 12 việc 2).

import { type CityPlan, ECOPARK, HOME_CITY } from "./home-plan";
import { avenueAngle, FIRST_RING, LAKE_RADIUS, RING_PITCH } from "./layout";

export type RiverTrait = "lock" | "paper-boats" | "barges" | "great-harbour" | "quiet" | "rapids";

export interface RiverStyle {
  /** How far out the river runs, counted in belts. */
  ringsOut: number;
  /** How hard it bends (0 = straight). */
  bend: number;
  width: number;
  trait: RiverTrait;
  /** Which boats travel here, in the order they are handed out. */
  boats: ("sail" | "barge" | "fishing" | "paper")[];
}

export const RIVER: Record<string, RiverStyle> = {
  // Thành Số: a straight, orderly river with a lock
  vmath: { ringsOut: 5, bend: 0.12, width: 26, trait: "lock", boats: ["barge", "sail", "fishing"] },
  // Phố Chữ: a wide slow river
  viet: { ringsOut: 5, bend: 0.5, width: 30, trait: "quiet", boats: ["sail", "fishing", "sail"] },
  // Bến Cảng Từ: the biggest harbour of the six (pha 11's words dock here)
  esl: {
    ringsOut: 4.6,
    bend: 0.35,
    width: 38,
    trait: "great-harbour",
    boats: ["sail", "barge", "sail", "fishing"],
  },
  // Vườn Sách: a gentle river with paper boats on it
  enl: {
    ringsOut: 5,
    bend: 0.42,
    width: 24,
    trait: "paper-boats",
    boats: ["paper", "paper", "sail"],
  },
  // Xưởng Máy: barges and a crane
  emath: { ringsOut: 5, bend: 0.2, width: 32, trait: "barges", boats: ["barge", "barge", "sail"] },
  // Trạm Khám Phá: a quick river over rocks
  esci: {
    ringsOut: 5.2,
    bend: 0.6,
    width: 22,
    trait: "rapids",
    boats: ["fishing", "sail", "paper"],
  },
};

export const riverStyle = (seed: string): RiverStyle => RIVER[seed] ?? (RIVER.viet as RiverStyle);

export interface Waterways {
  style: RiverStyle;
  /** Centre line of the river, from one end of the map to the other. */
  river: [number, number][];
  /** Left and right banks, for drawing the water as one ribbon. */
  bankA: [number, number][];
  bankB: [number, number][];
  /** Where the quay is, and which way it looks. */
  harbour: { x: number; z: number; angle: number; big: boolean };
  /** Where the bridge crosses, once the city reaches the river. */
  bridge: { x: number; z: number; angle: number; span: number };
  /** True once the city has grown to the near bank — the bridge and far bank are then built. */
  bridgeBuilt: boolean;
  /** Lanes the boats travel, each an open polyline (they turn around at the ends). */
  lanes: [number, number][][];
  /** Where a fishing boat stops to cast its net (index into `lanes`, distance along it). */
  stops: { lane: number; at: number }[];
  /** The smaller waters of a drawn town: canal fingers and a bay (empty for the invented cities). */
  canals: { points: [number, number][]; width: number }[];
}

/**
 * The river runs diagonally past the city, at an angle that is not the avenue's — two diagonals
 * crossing at a shallow angle look like a mistake, two at a wide one look like a place.
 */
export function riverAngle(seed: string, avenue: number): number {
  const turn = seed.length % 2 === 0 ? 1 : -1;
  return avenue + (Math.PI / 2) * turn + 0.35 * turn;
}

export function waterways(seed: string, rings: number, avenue: number): Waterways {
  const style = riverStyle(seed);
  const a = riverAngle(seed, avenue);
  const out = FIRST_RING + (style.ringsOut - 1) * RING_PITCH;
  // the river's own axis: `a` is the direction it flows, `n` points from the city to the river
  const dir: [number, number] = [Math.cos(a), Math.sin(a)];
  const nrm: [number, number] = [-Math.sin(a), Math.cos(a)];
  // The river is the same river all year: its line must not depend on how far the city has grown,
  // or a cell that is dry in October would be under water in May and the house on it would move.
  // So it runs from end to end of the biggest the town will ever be.
  const reach = FIRST_RING + 11 * RING_PITCH;

  const centre = (t: number): [number, number] => {
    // one bend: the river leans toward the city in the middle and away at the ends
    const k = t / reach;
    const off = out - Math.cos(k * Math.PI * 0.9) * style.bend * RING_PITCH * 1.6;
    return [dir[0] * t + nrm[0] * off, dir[1] * t + nrm[1] * off];
  };
  const river: [number, number][] = [];
  const steps = 24;
  for (let i = 0; i <= steps; i++) river.push(centre(-reach + (2 * reach * i) / steps));

  const bankA: [number, number][] = river.map(([x, z]) => [
    x - nrm[0] * (style.width / 2),
    z - nrm[1] * (style.width / 2),
  ]);
  const bankB: [number, number][] = river.map(([x, z]) => [
    x + nrm[0] * (style.width / 2),
    z + nrm[1] * (style.width / 2),
  ]);

  // the harbour sits where the river comes closest to the middle of the city
  let closest = 0;
  let closestD = Number.POSITIVE_INFINITY;
  river.forEach(([x, z], i) => {
    const d = Math.hypot(x, z);
    if (d < closestD) {
      closestD = d;
      closest = i;
    }
  });
  const quay = river[closest] as [number, number];
  const harbour = {
    x: quay[0] - nrm[0] * (style.width / 2),
    z: quay[1] - nrm[1] * (style.width / 2),
    angle: -a,
    big: style.trait === "great-harbour",
  };

  // the bridge crosses a little downstream of the harbour, where the avenue would meet the water
  const downstream = Math.max(1, Math.round(60 / ((2 * reach) / steps)));
  const bridgeAt = river[Math.min(river.length - 1, closest + downstream)] as [number, number];
  const cityEdge = FIRST_RING + (rings - 1) * RING_PITCH;
  const bridge = {
    x: bridgeAt[0],
    z: bridgeAt[1],
    angle: -a + Math.PI / 2,
    span: style.width + 14,
  };
  const bridgeBuilt = cityEdge + RING_PITCH >= Math.hypot(bridgeAt[0], bridgeAt[1]) - style.width;

  // two lanes down the river, plus a short one into the harbour mouth
  const lane = (offset: number, from: number, to: number): [number, number][] => {
    const pts: [number, number][] = [];
    const n = 10;
    for (let i = 0; i <= n; i++) {
      const t = from + ((to - from) * i) / n;
      const [x, z] = centre(t);
      pts.push([x + nrm[0] * offset, z + nrm[1] * offset]);
    }
    return pts;
  };
  const lanes: [number, number][][] = [
    lane(-style.width * 0.22, -reach * 0.9, reach * 0.9),
    lane(style.width * 0.24, reach * 0.85, -reach * 0.85),
    [
      [harbour.x + nrm[0] * 4, harbour.z + nrm[1] * 4],
      [quay[0], quay[1]],
      [quay[0] + dir[0] * 26, quay[1] + dir[1] * 26],
    ],
  ];
  // a fishing boat stops to cast — the pause is what makes the river look alive rather than looped
  const stops = [
    { lane: 0, at: 0.35 },
    { lane: 1, at: 0.6 },
  ];

  return { style, river, bankA, bankB, harbour, bridge, bridgeBuilt, lanes, stops, canals: [] };
}

const toPoint = (at: [number, number]) => ({ x: at[0], z: at[1] });

/** The normal of a polyline at point `i`, pointing left of the direction of travel. */
function normalAt(points: [number, number][], i: number): [number, number] {
  const a = points[Math.max(0, i - 1)] as [number, number];
  const b = points[Math.min(points.length - 1, i + 1)] as [number, number];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
}

/**
 * The water of a town drawn from a plan (pha 12 viec 7): the river where it really runs, the canal
 * fingers between the island streets, and the harbour and bridge the plan names.
 */
export function planWaterways(plan: CityPlan): Waterways {
  const river = plan.river.points.map(([x, z]) => [x, z] as [number, number]);
  const style: RiverStyle = {
    ringsOut: 5,
    bend: 0.3,
    width: plan.river.width,
    trait: "quiet",
    boats: ["sail", "barge", "fishing"],
  };
  const shift = (side: number, by: number): [number, number][] =>
    river.map((point, i) => {
      const n = normalAt(river, i);
      return [point[0] + n[0] * side * by, point[1] + n[1] * side * by];
    });
  const harbour = { ...toPoint(plan.harbour.at), angle: plan.harbour.angle, big: false };
  const lane = shift(1, plan.river.width * 0.23);
  return {
    style,
    river,
    bankA: shift(-1, plan.river.width / 2),
    bankB: shift(1, plan.river.width / 2),
    harbour,
    bridge: { ...toPoint(plan.bridge.at), angle: plan.bridge.angle, span: plan.bridge.span },
    // the town is already there: the children cross this bridge on the way home from school
    bridgeBuilt: true,
    lanes: [
      lane,
      shift(-1, plan.river.width * 0.23)
        .slice()
        .reverse(),
      [
        [harbour.x, harbour.z],
        [
          harbour.x + Math.cos(plan.harbour.angle) * 30,
          harbour.z + Math.sin(plan.harbour.angle) * 30,
        ],
      ],
    ],
    stops: [
      { lane: 0, at: 0.4 },
      { lane: 1, at: 0.65 },
    ],
    canals: plan.canals.map((c) => ({ points: c.points, width: c.width })),
  };
}

/**
 * The water of a city: the children's own town from its plan, the other five from their seed.
 *
 * One way in, so that everything — the cells the water takes out, the ribbon the scene draws and
 * the blue on the paper map — is talking about the same river. (It was not, for half a day: the
 * scene derived the avenue's bearing from the drawn polyline, which runs the other way round, and
 * drew the river on the opposite side of the town from the one the layout had kept clear.)
 */
export const cityWaterways = (seed: string, rings: number): Waterways =>
  seed === HOME_CITY ? planWaterways(ECOPARK) : waterways(seed, rings, avenueAngle(seed));

/** How far (x, z) is from a polyline — the bit of geometry the water and the roads share. */
export function distanceToPath(points: [number, number][], x: number, z: number): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as [number, number];
    const b = points[i] as [number, number];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const l2 = dx * dx + dz * dz;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2));
    best = Math.min(best, Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t)));
  }
  return best;
}

/** Is (x, z) in the water? Used to keep trees, hills and roads out of the river and its canals. */
export function inRiver(w: Waterways, x: number, z: number, pad = 0): boolean {
  if (distanceToPath(w.river, x, z) <= w.style.width / 2 + pad) return true;
  for (const canal of w.canals)
    if (distanceToPath(canal.points, x, z) <= canal.width / 2 + pad) return true;
  return false;
}

/** Is (x, z) in the central lake? */
export const inLake = (x: number, z: number, pad = 0) => Math.hypot(x, z) <= LAKE_RADIUS + pad;
