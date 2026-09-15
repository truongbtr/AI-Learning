// A session's exercises → the 3–4 stations of a city (Pha 10 bổ sung §2). Pure.
//
// Inside a city the child sees only a few stars, never a list of twelve: the exercises are grouped
// by skill into stations, each station is one building with a star on its roof, and a station is
// done when all of its exercises are. The teacher's homework is not a station: it waits in the
// town hall.

export interface StationInputItem {
  order: number;
  skillCode: string;
  homework?: boolean;
  /** Missing exercise (the planner found none): not playable, not counted. */
  missing?: boolean;
  done: boolean;
}

export interface CityStation {
  /** 0-based, in play order. */
  index: number;
  /** The building the star sits on. */
  skillCode: string;
  /** Exercise orders in the session, ascending. */
  orders: number[];
  done: boolean;
}

export interface StationPlan {
  stations: CityStation[];
  /** Homework orders (town hall scroll), ascending. */
  homework: number[];
}

/** Exercises a station aims for. */
export const STATION_SIZE = 3;
export const MAX_STATIONS = 4;

export function stationCount(exercises: number): number {
  if (exercises <= 0) return 0;
  return Math.max(1, Math.min(MAX_STATIONS, Math.round(exercises / STATION_SIZE)));
}

interface Group {
  skillCode: string;
  orders: number[];
}

export function planStations(items: readonly StationInputItem[]): StationPlan {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const homework = sorted.filter((i) => i.homework).map((i) => i.order);
  const practice = sorted.filter((i) => !i.homework && !i.missing && i.skillCode);
  const count = stationCount(practice.length);
  if (count === 0) return { stations: [], homework };
  const doneOrders = new Set(practice.filter((i) => i.done).map((i) => i.order));

  // one group per skill, in order of first appearance
  const bySkill = new Map<string, Group>();
  for (const item of practice) {
    const g = bySkill.get(item.skillCode) ?? { skillCode: item.skillCode, orders: [] };
    g.orders.push(item.order);
    bySkill.set(item.skillCode, g);
  }
  let groups = [...bySkill.values()];

  // fewer skills than stations: split the biggest skill so every station has work
  while (groups.length < count) {
    const biggest = groups.reduce((a, b) => (b.orders.length > a.orders.length ? b : a));
    if (biggest.orders.length < 2) break;
    const half = Math.ceil(biggest.orders.length / 2);
    groups = groups.flatMap((g) =>
      g === biggest
        ? [
            { skillCode: g.skillCode, orders: g.orders.slice(0, half) },
            { skillCode: g.skillCode, orders: g.orders.slice(half) },
          ]
        : [g],
    );
  }

  // the biggest groups become the stations (ties: the one played first); the rest join the
  // station with the fewest exercises, so stations stay even
  const ranked = groups
    .map((g, i) => ({ g, i }))
    .sort((a, b) => b.g.orders.length - a.g.orders.length || a.i - b.i);
  const seeds = ranked
    .slice(0, count)
    .map(({ g }) => ({ skillCode: g.skillCode, orders: [...g.orders] }));
  for (const { g } of ranked.slice(count)) {
    const target = seeds.reduce((a, b) => (b.orders.length < a.orders.length ? b : a));
    target.orders.push(...g.orders);
  }

  const stations = seeds
    .map((s) => ({ ...s, orders: s.orders.sort((a, b) => a - b) }))
    .sort((a, b) => (a.orders[0] ?? 0) - (b.orders[0] ?? 0))
    .map((s, index) => ({
      index,
      skillCode: s.skillCode,
      orders: s.orders,
      done: s.orders.every((o) => doneOrders.has(o)),
    }));
  return { stations, homework };
}

/** The station to play next: the first not done. */
export function nextStation(plan: StationPlan): CityStation | null {
  return plan.stations.find((s) => !s.done) ?? null;
}
