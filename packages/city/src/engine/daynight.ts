// Real clock → light in the city. Pure: hour in, colours and factors out. Night is friendly deep
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
