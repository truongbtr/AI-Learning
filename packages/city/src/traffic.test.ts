import { describe, expect, it } from "vitest";
import {
  chooseNext,
  hasLights,
  LANE,
  LIGHT_CYCLE,
  lightAt,
  type Mover,
  place,
  rngFrom,
  roadGrid,
  spawn,
  step,
  stepAll,
  stillOnTheRoad,
} from "./engine/traffic";
import { layoutCity, TILE } from "./layout";

const city = (skills: number) =>
  layoutCity({ skills, publics: Math.floor(skills / 8), plotsOwned: Math.floor(skills / 5) });

/** How far a point is from the nearest street centre line of the grid. */
function offRoad(grid: ReturnType<typeof roadGrid>, x: number, z: number): number {
  let best = Number.POSITIVE_INFINITY;
  for (const j of grid.values())
    for (const key of j.links) {
      const k = grid.get(key);
      if (!k) continue;
      const dx = k.x - j.x;
      const dz = k.z - j.z;
      const t = Math.max(0, Math.min(1, ((x - j.x) * dx + (z - j.z) * dz) / (dx * dx + dz * dz)));
      best = Math.min(best, Math.hypot(x - (j.x + dx * t), z - (j.z + dz * t)));
    }
  return best;
}

describe("traffic on the chessboard city", () => {
  it("finds the street lattice in the road tiles, every link going both ways", () => {
    const grid = roadGrid(city(40).roads);
    expect(grid.size).toBeGreaterThan(8);
    for (const j of grid.values()) {
      expect(j.links.length).toBeGreaterThan(0);
      for (const key of j.links) expect(grid.get(key)?.links).toContain(j.key);
    }
  });

  it("goes straight on most often, turns sometimes, and never turns back unless it must", () => {
    const grid = roadGrid(city(102).roads);
    // a crossroads with four ways out
    const cross = [...grid.values()].find((j) => j.links.length === 4);
    expect(cross).toBeDefined();
    if (!cross) return;
    const from = cross.links[0] as string;
    const a = grid.get(from);
    if (!a) return;
    const ahead = `${2 * Number(cross.key.split(",")[0]) - Number(from.split(",")[0])},${
      2 * Number(cross.key.split(",")[1]) - Number(from.split(",")[1])
    }`;
    const random = rngFrom(7);
    const tally = new Map<string, number>();
    for (let i = 0; i < 3000; i++) {
      const next = chooseNext(grid, from, cross.key, "car", random);
      tally.set(next, (tally.get(next) ?? 0) + 1);
    }
    expect(tally.get(from) ?? 0).toBe(0);
    const straight = tally.get(ahead) ?? 0;
    // 6 : 3 : 3 → half straight on
    expect(straight / 3000).toBeGreaterThan(0.44);
    expect(straight / 3000).toBeLessThan(0.56);
    expect(tally.size).toBe(3);
  });

  it("turns round at a dead end", () => {
    const grid = roadGrid(city(0).roads);
    for (const j of grid.values()) {
      if (j.links.length !== 1) continue;
      const only = j.links[0] as string;
      expect(chooseNext(grid, only, j.key, "car", rngFrom(1))).toBe(only);
    }
  });

  it("keeps every car in its lane and every walker on the pavement, for a whole minute", () => {
    const grid = roadGrid(city(60).roads);
    const movers: Mover[] = [
      ...spawn(grid, "car", 12, 11),
      ...spawn(grid, "bus", 2, 12),
      ...spawn(grid, "person", 20, 13),
    ];
    for (let frame = 0; frame < 60 * 30; frame++) {
      for (const m of movers) {
        step(grid, m, 1 / 30);
        const p = place(grid, m);
        const away = offRoad(grid, p.x, p.z);
        // a lane is a fixed distance off the middle; turning right, the curve cuts the corner and
        // runs a little further off both middles than that
        if (m.kind === "person")
          expect(away).toBeLessThanOrEqual(LANE.person + 0.3); // not into a block
        else expect(away).toBeLessThan(TILE / 2); // never up on the pavement
        expect(Number.isFinite(p.heading)).toBe(true);
      }
    }
  });

  it("does not go round one block for ever: a car sees many streets", () => {
    const grid = roadGrid(city(102).roads);
    const [car] = spawn(grid, "car", 1, 5) as [Mover];
    const seen = new Set<string>();
    for (let frame = 0; frame < 60 * 30 * 3; frame++) {
      step(grid, car, 1 / 30);
      seen.add([car.from, car.to].sort().join("|"));
    }
    // a block has four sides; three minutes of driving covers far more than one block
    expect(seen.size).toBeGreaterThan(12);
  });

  it("moves smoothly through a corner: no jump from one frame to the next", () => {
    const grid = roadGrid(city(60).roads);
    for (const m of spawn(grid, "car", 6, 21)) {
      let last = place(grid, m);
      for (let frame = 0; frame < 60 * 30; frame++) {
        step(grid, m, 1 / 30);
        const p = place(grid, m);
        // 5.5 × 1.2 units a second at most, a thirtieth of a second a frame, and a little for curves
        expect(Math.hypot(p.x - last.x, p.z - last.z)).toBeLessThan(0.4);
        last = p;
      }
    }
  });

  it("puts the same town back after a reload, and knows who is still on a real street", () => {
    const grid = roadGrid(city(30).roads);
    const a = spawn(grid, "car", 5, 99);
    const b = spawn(grid, "car", 5, 99);
    for (let i = 0; i < 300; i++) {
      for (const m of a) step(grid, m, 1 / 30);
      for (const m of b) step(grid, m, 1 / 30);
    }
    expect(a.map((m) => place(grid, m))).toEqual(b.map((m) => place(grid, m)));
    for (const m of a) expect(stillOnTheRoad(grid, m)).toBe(true);
    const bigger = roadGrid(city(102).roads);
    for (const m of a) expect(stillOnTheRoad(bigger, m)).toBe(true); // growing keeps old streets
  });

  it("lets people stop to look about, and walk on", () => {
    const grid = roadGrid(city(60).roads);
    const people = spawn(grid, "person", 10, 3);
    let paused = 0;
    for (let frame = 0; frame < 60 * 30 * 2; frame++)
      for (const m of people) {
        step(grid, m, 1 / 30);
        if (m.pause > 0) paused++;
      }
    expect(paused).toBeGreaterThan(0);
    const moving = people.filter((m) => m.pause === 0).length;
    expect(moving).toBeGreaterThan(0);
  });
});

describe("traffic lights", () => {
  it("never shows green both ways, and gives each way its turn", () => {
    for (const key of ["0,0", "6,-12", "-18,24"]) {
      const seen = { x: new Set<string>(), z: new Set<string>() };
      for (let t = 0; t < LIGHT_CYCLE * 2; t += 0.05) {
        const x = lightAt(key, "x", t);
        const z = lightAt(key, "z", t);
        seen.x.add(x);
        seen.z.add(z);
        // at least one way is always red
        expect(x === "red" || z === "red").toBe(true);
      }
      expect([...seen.x].sort()).toEqual(["amber", "green", "red"]);
      expect([...seen.z].sort()).toEqual(["amber", "green", "red"]);
    }
  });

  it("puts lights at a crossroads, not at a T-junction or a bend", () => {
    const grid = roadGrid(city(60).roads);
    for (const j of grid.values()) expect(hasLights(grid, j.key)).toBe(j.links.length === 4);
    expect([...grid.keys()].some((k) => hasLights(grid, k))).toBe(true);
  });

  it("stops a car at a red light and lets it go on green", () => {
    const grid = roadGrid(city(60).roads);
    const lit = [...grid.values()].find((j) => j.links.length === 4) as typeof grid extends Map<
      string,
      infer J
    >
      ? J
      : never;
    const from = lit.links[0] as string;
    const [car] = spawn(grid, "car", 1, 1) as [Mover];
    Object.assign(car, { from, to: lit.key, along: 0, pause: 0 });
    car.prev = "";
    car.next = chooseNext(grid, from, lit.key, "car", car.random);
    const a = grid.get(from);
    const axis = a && Math.abs(lit.x - a.x) > Math.abs(lit.z - a.z) ? "x" : "z";
    // find a moment when this way has just turned red
    let time = 0;
    while (
      !(lightAt(lit.key, axis, time) === "red" && lightAt(lit.key, axis, time - 0.05) !== "red")
    )
      time += 0.05;
    let crossed = false;
    let waited = 0;
    for (let frame = 0; frame < 30 * 20; frame++) {
      const before = car.from;
      stepAll(grid, [car], 1 / 30, time);
      const colour = lightAt(lit.key, axis, time);
      if (before !== car.from) {
        crossed = true;
        // it only went through on green (or on an amber it could not stop for)
        expect(colour).not.toBe("red");
        break;
      }
      if (colour === "red" && car.along > 0.5) waited++;
      time += 1 / 30;
    }
    expect(waited).toBeGreaterThan(30); // it really stood there for a while
    expect(crossed).toBe(true);
  });

  it("keeps a queue: nobody drives into the car in front", () => {
    const grid = roadGrid(city(102).roads);
    const cars = [...spawn(grid, "car", 16, 4), ...spawn(grid, "bus", 3, 8)];
    const gapOf = (a: Mover, b: Mover) => {
      const length = Math.hypot(
        (grid.get(a.to)?.x ?? 0) - (grid.get(a.from)?.x ?? 0),
        (grid.get(a.to)?.z ?? 0) - (grid.get(a.from)?.z ?? 0),
      );
      return Math.abs(a.along - b.along) * length;
    };
    // pairs that start out too close (they were put down that way) are not held against anyone;
    // what must never happen is a gap closing up, or a vehicle turning in on top of another
    const before = new Map<string, number>();
    let time = 0;
    let checked = 0;
    for (let frame = 0; frame < 30 * 90; frame++) {
      const streets = cars.map((c) => `${c.from}>${c.to}`);
      stepAll(grid, cars, 1 / 30, time);
      time += 1 / 30;
      cars.forEach((a, i) => {
        cars.forEach((b, j) => {
          if (i === j || a.from !== b.from || a.to !== b.to || a.along < b.along) return;
          const pair = `${i}:${j}`;
          const gap = gapOf(a, b);
          const was = before.get(pair);
          const turnedIn = streets[j] !== `${b.from}>${b.to}`; // b has just come onto this street
          if ((was !== undefined && was >= 1.2) || turnedIn) {
            expect(gap).toBeGreaterThan(1.2);
            checked++;
          }
          before.set(pair, gap);
        });
      });
    }
    expect(checked).toBeGreaterThan(100);
  });
});
