// Traffic on the road graph — pure, seeded, testable.
//
// Pha 10 drove cars round closed loops, one loop per block, which is why the city looked like a toy
// after a minute: every car went round and round the same square for ever. Pha 12 drives them on
// the real graph (layout.ts): at a junction an agent picks its next road, straight on more often
// than a turn, and only turns back at a dead end.
//
// Everything random here comes from a seed made of (studentId, cityId, the game day), so the same
// evening looks the same after a reload and a test can assert on it.

import type { RoadEdge, RoadGraph, RoadNode } from "../layout";
import type { PathSample } from "./paths";

export type AgentKind = "car" | "bus" | "person" | "pet";

export interface TrafficAgent {
  id: number;
  kind: AgentKind;
  /** Edge the agent is on, and which way it is going along the edge's points. */
  edge: string;
  reversed: boolean;
  /** Distance travelled along the edge. */
  at: number;
  /** World units per second, this agent's own pace. */
  speed: number;
  /** Seconds still to wait (a red light, a bus stop, a person looking at the ducks). */
  waiting: number;
  /** People walk to somewhere and stop when they get there. */
  destination?: string;
  lane: number;
}

export interface TrafficState {
  agents: TrafficAgent[];
  /** Advanced on every step so the stream of random numbers never repeats. */
  tick: number;
}

/** Deterministic 32-bit hash — the only source of randomness in here. */
export function seedOf(parts: (string | number)[]): number {
  let h = 2166136261;
  for (const part of parts) {
    const s = String(part);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 0x9e3779b9;
  }
  return h >>> 0;
}

/** mulberry32: small, fast, and identical on every device. */
export function rngFrom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface TrafficOptions {
  cars: number;
  people: number;
  /** Buses run a fixed route rather than wandering. */
  buses: number;
  /** Agents outside this rectangle are not drawn (the engine passes the camera's view). */
  seed: number;
}

/** How much a direction is preferred at a junction: straight on, gentle turn, sharp turn, back. */
export const TURN_WEIGHTS = { straight: 6, gentle: 3, sharp: 1.2, back: 0.05 } as const;

const dirOf = (edge: RoadEdge, reversed: boolean, atEnd: boolean): number => {
  const pts = reversed ? [...edge.points].reverse() : edge.points;
  const i = atEnd ? pts.length - 1 : 1;
  const a = pts[Math.max(0, i - 1)] as [number, number];
  const b = pts[Math.min(pts.length - 1, i)] as [number, number];
  return Math.atan2(b[1] - a[1], b[0] - a[0]);
};

const angleDiff = (a: number, b: number) =>
  Math.abs(((a - b + Math.PI * 3) % (Math.PI * 2)) - Math.PI);

/**
 * Pick the road an agent takes out of a junction. Straight on is the likeliest; turning back only
 * happens at a dead end, where it is the only choice.
 */
export function chooseNextEdge(
  graph: RoadGraph,
  node: RoadNode,
  cameFrom: string,
  heading: number,
  random: () => number,
): { edge: string; reversed: boolean } | null {
  const options: { edge: string; reversed: boolean; weight: number }[] = [];
  for (const id of node.edges) {
    const edge = graph.edges.get(id);
    if (!edge) continue;
    const reversed = edge.to === node.id;
    const outHeading = dirOf(edge, reversed, false);
    const turn = angleDiff(outHeading, heading);
    let weight: number = TURN_WEIGHTS.back;
    if (id !== cameFrom) {
      weight =
        turn < Math.PI / 6
          ? TURN_WEIGHTS.straight
          : turn < Math.PI / 2
            ? TURN_WEIGHTS.gentle
            : TURN_WEIGHTS.sharp;
    }
    options.push({ edge: id, reversed, weight });
  }
  if (options.length === 0) return null;
  const total = options.reduce((n, o) => n + o.weight, 0);
  let roll = random() * total;
  for (const option of options) {
    roll -= option.weight;
    if (roll <= 0) return { edge: option.edge, reversed: option.reversed };
  }
  const last = options[options.length - 1] as (typeof options)[number];
  return { edge: last.edge, reversed: last.reversed };
}

/** Spread the agents over the graph at the start, deterministically. */
export function spawnTraffic(graph: RoadGraph, opts: TrafficOptions): TrafficState {
  const random = rngFrom(opts.seed);
  const edges = [...graph.edges.values()].filter((e) => e.kind !== "bridge");
  const agents: TrafficAgent[] = [];
  if (edges.length === 0) return { agents, tick: 0 };
  let id = 0;
  const place = (kind: AgentKind, speed: number, lane: number) => {
    const edge = edges[Math.floor(random() * edges.length)] as RoadEdge;
    agents.push({
      id: id++,
      kind,
      edge: edge.id,
      reversed: random() < 0.5,
      at: random() * edge.length,
      // every vehicle has its own pace, ±20%
      speed: speed * (0.8 + random() * 0.4),
      waiting: 0,
      lane,
    });
  };
  for (let i = 0; i < opts.cars; i++) place("car", 7.5, random() < 0.5 ? 1 : -1);
  for (let i = 0; i < opts.buses; i++) place("bus", 5.5, 1);
  for (let i = 0; i < opts.people; i++) place("person", 1.25, random() < 0.5 ? 2.4 : -2.4);
  return { agents, tick: 0 };
}

/**
 * One step of the world. Pure: same state + same dt + same seed → same next state, which is what
 * makes a reload show the same city and a test able to check where anything is.
 */
export function stepTraffic(
  graph: RoadGraph,
  state: TrafficState,
  dt: number,
  seed: number,
): TrafficState {
  const random = rngFrom(seed ^ Math.imul(state.tick + 1, 0x9e3779b1));
  const agents = state.agents.map((agent) => {
    const edge = graph.edges.get(agent.edge);
    if (!edge) return agent;
    if (agent.waiting > 0) return { ...agent, waiting: Math.max(0, agent.waiting - dt) };

    // slow down in a bend: a curve is where a toy city gives itself away
    const bendiness = curvature(edge);
    const speed = agent.speed * (1 - Math.min(0.45, bendiness * 3));
    let at = agent.at + speed * dt;
    let { edge: edgeId, reversed } = agent;
    let waiting = 0;

    let guard = 0;
    while (at >= (graph.edges.get(edgeId)?.length ?? 0) && guard++ < 4) {
      const current = graph.edges.get(edgeId) as RoadEdge;
      at -= current.length;
      const endNodeId = reversed ? current.from : current.to;
      const node = graph.nodes.get(endNodeId);
      if (!node) break;
      const heading = dirOf(current, reversed, true);
      const next = chooseNextEdge(graph, node, edgeId, heading, random);
      if (!next) break;
      edgeId = next.edge;
      reversed = next.reversed;
      // a light at a crossing of the avenue: everyone pauses, nobody is ever stuck
      if (node.light && agent.kind !== "person") waiting = 1.2 + random() * 1.6;
      // a bus stops for its passengers; a person stops to look at whatever is there
      else if (agent.kind === "bus" && random() < 0.4) waiting = 2 + random() * 2;
      else if (agent.kind === "person" && random() < 0.25) waiting = 3 + random() * 4;
    }
    return { ...agent, edge: edgeId, reversed, at, waiting };
  });
  return { agents, tick: state.tick + 1 };
}

const curvature = (edge: RoadEdge): number => {
  const pts = edge.points;
  if (pts.length < 3) return 0;
  const a = pts[0] as [number, number];
  const b = pts[pts.length - 1] as [number, number];
  const straight = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return straight === 0 ? 0 : Math.max(0, edge.length / straight - 1);
};

/** Where an agent is right now, with the heading its model should face. */
export function agentSample(graph: RoadGraph, agent: TrafficAgent): PathSample | null {
  const edge = graph.edges.get(agent.edge);
  if (!edge) return null;
  const pts = agent.reversed ? [...edge.points].reverse() : edge.points;
  let d = Math.max(0, Math.min(agent.at, edge.length));
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1] as [number, number];
    const b = pts[i] as [number, number];
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d <= seg || i === pts.length - 1) {
      const t = seg === 0 ? 0 : Math.min(1, d / seg);
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const nx = seg === 0 ? 0 : -dz / seg;
      const nz = seg === 0 ? 0 : dx / seg;
      const off = agent.lane;
      return {
        x: a[0] + dx * t + nx * off,
        z: a[1] + dz * t + nz * off,
        heading: Math.atan2(-dz, dx),
      };
    }
    d -= seg;
  }
  const last = pts[pts.length - 1] as [number, number];
  return { x: last[0], z: last[1], heading: 0 };
}

/** Is this agent worth drawing? Only what the camera can see, plus a margin to walk in from. */
export function nearCamera(
  sample: PathSample,
  camera: { x: number; z: number; radius: number },
): boolean {
  return Math.hypot(sample.x - camera.x, sample.z - camera.z) <= camera.radius;
}
