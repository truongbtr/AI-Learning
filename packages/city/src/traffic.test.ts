import { describe, expect, it } from "vitest";
import {
  agentSample,
  chooseNextEdge,
  rngFrom,
  seedOf,
  spawnTraffic,
  stepTraffic,
  TURN_WEIGHTS,
} from "./engine/traffic";
import { buildRoads } from "./layout";

const graph = buildRoads("viet", 3);

describe("traffic on the road graph (pha 12 việc 3)", () => {
  it("never leaves the roads, however long it runs", () => {
    let state = spawnTraffic(graph, {
      cars: 14,
      buses: 3,
      people: 20,
      seed: seedOf(["thy", "viet", 0]),
    });
    for (let step = 0; step < 200; step++) {
      state = stepTraffic(graph, state, 0.1, 1234);
      for (const agent of state.agents) {
        const edge = graph.edges.get(agent.edge);
        expect(edge).toBeDefined();
        expect(agent.at).toBeLessThanOrEqual((edge?.length ?? 0) + 0.001);
        const at = agentSample(graph, agent);
        expect(at).not.toBeNull();
        expect(Number.isFinite(at?.x ?? Number.NaN)).toBe(true);
      }
    }
  });

  it("gives the same city to the same seed, and a different one to another", () => {
    const a = spawnTraffic(graph, { cars: 8, buses: 1, people: 8, seed: 42 });
    const b = spawnTraffic(graph, { cars: 8, buses: 1, people: 8, seed: 42 });
    const c = spawnTraffic(graph, { cars: 8, buses: 1, people: 8, seed: 43 });
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).not.toEqual(JSON.stringify(c));

    let x = a;
    let y = b;
    for (let i = 0; i < 40; i++) {
      x = stepTraffic(graph, x, 0.12, 7);
      y = stepTraffic(graph, y, 0.12, 7);
    }
    expect(x).toEqual(y);
  });

  it("prefers going straight on, and turns back only at a dead end", () => {
    const junction = [...graph.nodes.values()].find((n) => n.edges.length >= 3);
    if (!junction) throw new Error("no junction in the graph");
    const cameFrom = junction.edges[0] as string;
    const counts = new Map<string, number>();
    const random = rngFrom(99);
    for (let i = 0; i < 4000; i++) {
      const next = chooseNextEdge(graph, junction, cameFrom, 0, random);
      if (!next) continue;
      counts.set(next.edge, (counts.get(next.edge) ?? 0) + 1);
    }
    // the road it came in by is all but never chosen again
    const back = counts.get(cameFrom) ?? 0;
    expect(back / 4000).toBeLessThan(0.05);
    // and every other road out is used
    expect(counts.size).toBeGreaterThanOrEqual(junction.edges.length - 1);
  });

  it("takes the only way out of a dead end", () => {
    const lonely = {
      nodes: new Map([
        ["a", { id: "a", x: 0, z: 0, edges: ["e"], light: false }],
        ["b", { id: "b", x: 10, z: 0, edges: ["e"], light: false }],
      ]),
      edges: new Map([
        [
          "e",
          {
            id: "e",
            from: "a",
            to: "b",
            points: [
              [0, 0],
              [10, 0],
            ] as [number, number][],
            kind: "belt" as const,
            length: 10,
            width: 6,
          },
        ],
      ]),
    };
    const node = lonely.nodes.get("b");
    if (!node) throw new Error("missing node");
    const next = chooseNextEdge(lonely, node, "e", 0, rngFrom(3));
    expect(next?.edge).toBe("e");
  });

  it("weights straight above a gentle turn above a sharp one", () => {
    expect(TURN_WEIGHTS.straight).toBeGreaterThan(TURN_WEIGHTS.gentle);
    expect(TURN_WEIGHTS.gentle).toBeGreaterThan(TURN_WEIGHTS.sharp);
    expect(TURN_WEIGHTS.sharp).toBeGreaterThan(TURN_WEIGHTS.back);
  });

  it("holds an agent at a light instead of teleporting it", () => {
    let state = spawnTraffic(graph, { cars: 20, buses: 2, people: 0, seed: 5 });
    let sawWait = false;
    for (let i = 0; i < 300; i++) {
      state = stepTraffic(graph, state, 0.2, 11);
      if (state.agents.some((a) => a.waiting > 0)) sawWait = true;
    }
    expect(sawWait).toBe(true);
  });
});
