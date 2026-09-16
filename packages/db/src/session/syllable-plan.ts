import { type SyllableGameId, stationGames, unlockedGames, vnDayDate } from "@mtct/core";
import type { PrismaClient } from "../../generated/client";
import { syllableStats } from "../syllable/service";
import type { PickedSlot } from "./plan";

type Db = PrismaClient;

const DAY_MS = 24 * 60 * 60 * 1000;

/** docs/08 pha 12: at most two syllable stations an evening. */
export const MAX_SYLLABLE_STATIONS = 2;
/**
 * A station is two rounds of about 45 seconds; an exercise is about 25. So a station stands in for
 * four exercise slots, and those slots leave the plan — the evening must not get longer (docs/08
 * pha 12: 5–10 minutes of spelling, inside the session the child already has).
 */
export const SYLLABLE_STATION_SLOTS = 4;
/** Slot kinds a game may replace. Review and the teacher's homework keep their exercises. */
const REPLACEABLE = new Set(["focus", "new"]);

export interface SyllableStationSlot {
  /** The two games of the station, different from each other. */
  games: SyllableGameId[];
  /** Skills whose syllables the station leans on: its own and the slots it replaced. */
  skills: string[];
}

/**
 * Turns VIET.HV.* practice into Xưởng Tiếng stations (pha 12, ADR-24).
 *
 * The first spelling slot of the evening becomes a station and takes up to three more spelling
 * slots with it; when there are not enough, the last replaceable slots of the evening make room
 * instead, so the session keeps its length. Review, remediation, warm-up, homework and the finish
 * are never touched — the old multiple-choice exercises stay there.
 */
export async function syllableStations(
  db: Db,
  studentId: string,
  slots: PickedSlot[],
  date: Date,
): Promise<{ slots: PickedSlot[]; log: string[] }> {
  const isCandidate = (s: PickedSlot) =>
    s.skillCode.startsWith("VIET.HV.") && REPLACEABLE.has(s.kind) && !s.homework && !s.vocab;
  const candidates = slots.filter(isCandidate);
  if (candidates.length === 0) return { slots, log: [] };
  if ((await db.syllable.count({ where: { isActive: true } })) === 0) return { slots, log: [] };

  const open = unlockedGames(await syllableStats(db, studentId, date));
  const dayNumber = Math.floor(vnDayDate(date).getTime() / DAY_MS);
  const removed = new Set<number>();
  const stations = new Map<number, SyllableStationSlot>();
  const log: string[] = [];

  for (const lead of candidates) {
    if (stations.size >= MAX_SYLLABLE_STATIONS) break;
    if (removed.has(lead.order)) continue;
    const absorbed = candidates
      .filter((c) => c !== lead && !removed.has(c.order) && !stations.has(c.order))
      .slice(0, SYLLABLE_STATION_SLOTS - 1);
    for (const a of absorbed) removed.add(a.order);
    // still short: the evening's last replaceable slots make room, whatever their subject
    let short = SYLLABLE_STATION_SLOTS - 1 - absorbed.length;
    const trimmed: string[] = [];
    for (const s of [...slots].reverse()) {
      if (short <= 0) break;
      if (s === lead || removed.has(s.order) || stations.has(s.order)) continue;
      if (!REPLACEABLE.has(s.kind) || s.homework || s.vocab) continue;
      if (candidates.includes(s)) continue; // a later spelling slot may lead the second station
      removed.add(s.order);
      trimmed.push(s.skillCode);
      short--;
    }
    const games = stationGames(open, dayNumber, stations.size);
    stations.set(lead.order, {
      games,
      skills: [...new Set([lead.skillCode, ...absorbed.map((a) => a.skillCode)])],
    });
    log.push(
      `xưởng tiếng: trạm ${stations.size} (${games.join(" + ")}) thay ${1 + absorbed.length} bài học vần` +
        (trimmed.length ? `, nhường chỗ ${trimmed.length} bài (${trimmed.join(", ")})` : ""),
    );
  }

  const out = slots
    .filter((s) => !removed.has(s.order))
    .map((s) => {
      const station = stations.get(s.order);
      if (!station) return s;
      return {
        ...s,
        exerciseId: null,
        stableId: undefined,
        missing: undefined,
        syllable: station,
      };
    });
  return { slots: out, log };
}
