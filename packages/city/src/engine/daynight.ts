// Game clock → light in the city. Pure: hour in, colours and factors out. Night is friendly deep
// blue with warm windows and street lights — never dark or scary.

export interface Lighting {
  skyTop: number;
  skyHorizon: number;
  sunColor: number;
  sunIntensity: number;
  /** Direction the light comes FROM (unit-ish), relative to the city centre. */
  sunDir: [number, number, number];
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  fill: number;
  /** 0 = lamps off … 1 = lamps fully on. */
  lights: number;
  /** 0 = daylight windows … 1 = warm lit windows. */
  windows: number;
}

interface Key {
  h: number;
  l: Lighting;
}

const DAY: Lighting = {
  skyTop: 0x3fa9f5,
  skyHorizon: 0xd2f3ff,
  sunColor: 0xfff1d8,
  sunIntensity: 2.0,
  sunDir: [-26, 56, 54],
  hemiSky: 0xeef8ff,
  hemiGround: 0xf6ead0,
  hemiIntensity: 1.3,
  fill: 0.8,
  lights: 0,
  windows: 0,
};
const GOLDEN: Lighting = {
  skyTop: 0x6f8fe8,
  skyHorizon: 0xffd6a0,
  sunColor: 0xffc38a,
  sunIntensity: 1.7,
  sunDir: [-60, 26, 40],
  hemiSky: 0xffe6c8,
  hemiGround: 0xf2d8b8,
  hemiIntensity: 1.1,
  fill: 0.6,
  lights: 0.35,
  windows: 0.25,
};
const DUSK: Lighting = {
  skyTop: 0x4a4fa8,
  skyHorizon: 0xff9f8a,
  sunColor: 0xffa27a,
  sunIntensity: 0.9,
  sunDir: [-70, 12, 30],
  hemiSky: 0xc8b8ff,
  hemiGround: 0xd8b8a8,
  hemiIntensity: 0.85,
  fill: 0.45,
  lights: 0.85,
  windows: 0.8,
};
const NIGHT: Lighting = {
  skyTop: 0x1f2f6e,
  skyHorizon: 0x4f6fb8,
  sunColor: 0xbfd4ff,
  sunIntensity: 0.55,
  sunDir: [30, 50, 40],
  hemiSky: 0x9fb4ff,
  hemiGround: 0x6f7fb0,
  hemiIntensity: 1.0,
  fill: 0.35,
  lights: 1,
  windows: 1,
};
const DAWN: Lighting = {
  ...GOLDEN,
  skyHorizon: 0xffc8b0,
  sunDir: [60, 20, 40],
  lights: 0.5,
  windows: 0.4,
};

const KEYS: Key[] = [
  { h: 0, l: NIGHT },
  { h: 5, l: NIGHT },
  { h: 6, l: DAWN },
  { h: 7.5, l: DAY },
  { h: 16, l: DAY },
  { h: 17.3, l: GOLDEN },
  { h: 18.3, l: DUSK },
  { h: 19.3, l: NIGHT },
  { h: 24, l: NIGHT },
];

const mixHex = (a: number, b: number, t: number) => {
  const ch = (s: number) => {
    const x = (a >> s) & 255;
    const y = (b >> s) & 255;
    return Math.round(x + (y - x) * t) << s;
  };
  return ch(16) | ch(8) | ch(0);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function lightingAt(hour: number): Lighting {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < KEYS.length - 2 && (KEYS[i + 1] as Key).h <= h) i++;
  const a = KEYS[i] as Key;
  const b = KEYS[i + 1] as Key;
  const t = b.h === a.h ? 0 : (h - a.h) / (b.h - a.h);
  const s = t * t * (3 - 2 * t);
  return {
    skyTop: mixHex(a.l.skyTop, b.l.skyTop, s),
    skyHorizon: mixHex(a.l.skyHorizon, b.l.skyHorizon, s),
    sunColor: mixHex(a.l.sunColor, b.l.sunColor, s),
    sunIntensity: mix(a.l.sunIntensity, b.l.sunIntensity, s),
    sunDir: [
      mix(a.l.sunDir[0], b.l.sunDir[0], s),
      mix(a.l.sunDir[1], b.l.sunDir[1], s),
      mix(a.l.sunDir[2], b.l.sunDir[2], s),
    ],
    hemiSky: mixHex(a.l.hemiSky, b.l.hemiSky, s),
    hemiGround: mixHex(a.l.hemiGround, b.l.hemiGround, s),
    hemiIntensity: mix(a.l.hemiIntensity, b.l.hemiIntensity, s),
    fill: mix(a.l.fill, b.l.fill, s),
    lights: mix(a.l.lights, b.l.lights, s),
    windows: mix(a.l.windows, b.l.windows, s),
  };
}

/** One game day lasts this long in real time (owner, pha 11: 24 minutes = one day). */
export const GAME_DAY_MS = 24 * 60 * 1000;

/** The city wakes up with the child: a session opens in the morning, never at dusk. */
export const DAY_START_HOUR = 8;

/**
 * How the game day is spent. Real time runs at an even pace; the *hours* do not. A 24-minute day
 * built out of 24 equal hours would put a child through six minutes of night every session, which
 * is how pha 10b's clock went from "always dark" to "dark four minutes out of ten".
 *
 * So the curve lingers on daylight and hurries through the night: a 12–15 minute evening runs from
 * morning to the golden hour, and a child who plays a whole day sees roughly two and a half
 * minutes of dark. The hours keep climbing past 24 (the caller wraps) so dawn interpolates the
 * short way round instead of racing backwards through the afternoon.
 */
const PHASES: { at: number; hour: number }[] = [
  { at: 0, hour: DAY_START_HOUR }, // morning
  { at: 0.55, hour: 16 }, // afternoon — 55% of the day is plain daylight
  { at: 0.75, hour: 18.3 }, // the golden hour
  { at: 0.85, hour: 19.6 }, // dusk, lamps coming on
  { at: 0.95, hour: 29.5 }, // night, hurried through (= 5:30 the next morning)
  { at: 1, hour: 24 + DAY_START_HOUR }, // dawn, back where we started
];

/** Where in the game day a moment falls, 0 ≤ p < 1. */
function phaseAt(nowMs: number, anchorMs: number, dayMs: number): number {
  const day = Math.max(1, dayMs);
  const since = nowMs - anchorMs;
  return (((since % day) + day) % day) / day;
}

export interface GameClock {
  /** Real milliseconds for one game day. */
  dayMs?: number;
  /**
   * The moment the day starts at `DAY_START_HOUR` — the child's session start, so the sky is the
   * same on every screen and after a reload, and every session opens in the morning.
   */
  anchorMs?: number;
}

/**
 * The hour in the game (0–24). Anchored to when the child sat down rather than to the wall clock:
 * they play at 18–21h, and the city they build should not be permanently at dusk.
 */
export function gameHour(nowMs: number, clock: GameClock = {}): number {
  const p = phaseAt(nowMs, clock.anchorMs ?? 0, clock.dayMs ?? GAME_DAY_MS);
  let i = 0;
  while (i < PHASES.length - 2 && (PHASES[i + 1] as { at: number }).at <= p) i++;
  const a = PHASES[i] as { at: number; hour: number };
  const b = PHASES[i + 1] as { at: number; hour: number };
  const t = b.at === a.at ? 0 : (p - a.at) / (b.at - a.at);
  return (a.hour + (b.hour - a.hour) * t) % 24;
}
