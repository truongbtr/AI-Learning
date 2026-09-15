import { hexToRgb, hslToRgb, type KitSpec, rgbToHex, rgbToHsl } from "./color";

export const CITY_IDS = ["viet", "vmath", "esl", "enl", "emath", "esci"] as const;
export type CityId = (typeof CITY_IDS)[number];

/** Shared world colours — brighter than 3d-proto (~+15% saturation), approved in Pha 10 việc 1. */
export const WORLD = {
  grass: 0x79dc48,
  grassDark: 0x62cc3c,
  lawn: 0x96e85a,
  path: 0xfff0c9,
  plaza: 0xfbeed2,
  water: 0x3fc3f2,
  sand: 0xffe39a,
  skyTop: 0x3fa9f5,
  skyHorizon: 0xd2f3ff,
  hill: [0x6fd244, 0x5cc53f, 0x86e052] as const,
  mountain: [0x9ad7c4, 0x8fd0b0] as const,
  road: 0xb9b3a8,
  curb: 0xfff3dd,
  leaves: [0x3fb83a, 0x4fc93a, 0x8ee64f] as const,
  blossom: [0xff8fbf, 0xff9ec7, 0xffc2dd] as const,
  trunk: 0xa8703f,
  skin: 0xffd1a8,
} as const;

export interface CityPalette {
  id: CityId;
  name: string;
  /** Two signature colours from the approved city table (Pha 10 §2). */
  a: number;
  b: number;
  walls: readonly number[];
  roofs: readonly number[];
  trim: number;
  glass: number;
  blocks: readonly number[];
  /** Four repaint variants for Kenney decor houses in this city. */
  kit: readonly KitSpec[];
  /** Colour used for signs' text. */
  ink: string;
  wonder: string;
}

export const CITY: Record<CityId, CityPalette> = {
  viet: {
    id: "viet",
    name: "Phố Chữ",
    a: 0xe76f51,
    b: 0x6fae5a,
    walls: [0xffd98a, 0xfff1d6, 0xffc9a3, 0xc9eeaa, 0xffe6a8],
    roofs: [0xe76f51, 0xd9573d, 0xf28a5b],
    trim: 0xfff6e2,
    glass: 0x9fe2f2,
    blocks: [0xe76f51, 0x6fae5a, 0xffc93c, 0x5fb8e8, 0xff8fb1],
    kit: [
      { wall: 0xffd98a, trim: 0xfff6e2, roof: 0xd9573d, glass: 0x9fe2f2, accent: 0xe76f51 },
      { wall: 0xfff1d6, trim: 0xffd98a, roof: 0x8a5a44, glass: 0x9fe2f2, accent: 0x6fae5a },
      { wall: 0xffc9a3, trim: 0xfff6e2, roof: 0xe76f51, glass: 0xa6eeff, accent: 0xffc93c },
      { wall: 0xc9eeaa, trim: 0xfff6e2, roof: 0x5f8f4a, glass: 0x9fe2f2, accent: 0xe76f51 },
    ],
    ink: "#c2432f",
    wonder: "Chùa Một Cột",
  },
  vmath: {
    id: "vmath",
    name: "Thành Số",
    a: 0x5e93d6,
    b: 0xffd447,
    walls: [0xffd447, 0x8fc0ff, 0xffffff, 0xffa95e, 0xa8ecff, 0xc6f07a],
    roofs: [0x3f7de0, 0xffbf1f, 0xff7a4d, 0x22b8a5],
    trim: 0xfff6dd,
    glass: 0x7fdcff,
    blocks: [0xff6f61, 0xffd447, 0x5ec96b, 0x5e93d6, 0xb283e0, 0xff9f43],
    kit: [
      { wall: 0xffe27a, trim: 0xfff6dd, roof: 0x3f6fc0, glass: 0x7fdcff, accent: 0x5ec96b },
      { wall: 0xa8d2ff, trim: 0xffffff, roof: 0x2f5fb3, glass: 0x8feaff, accent: 0xffc21a },
      { wall: 0xffffff, trim: 0xffd447, roof: 0x5e93d6, glass: 0x7fdcff, accent: 0xff7a4d },
      { wall: 0xffb77a, trim: 0xfff6dd, roof: 0x3f6fc0, glass: 0x8feaff, accent: 0x22b8a5 },
    ],
    ink: "#2f5fb3",
    wonder: "Kim tự tháp",
  },
  esl: {
    id: "esl",
    name: "Bến Cảng Từ",
    a: 0x2a9d8f,
    b: 0xf4a261,
    walls: [0xffffff, 0x8fe0d4, 0xffc48a, 0xfff1d6],
    roofs: [0x2a9d8f, 0xf4a261, 0x2f6f8f],
    trim: 0xffffff,
    glass: 0x8ee8ff,
    blocks: [0x2a9d8f, 0xf4a261, 0xffd447, 0xe76f51, 0x5fb8e8],
    kit: [
      { wall: 0xffffff, trim: 0x8fe0d4, roof: 0x2a9d8f, glass: 0x8ee8ff, accent: 0xf4a261 },
      { wall: 0xffd6a8, trim: 0xffffff, roof: 0x2f6f8f, glass: 0x8ee8ff, accent: 0x2a9d8f },
      { wall: 0x9fe6dc, trim: 0xffffff, roof: 0xf4a261, glass: 0xa6eeff, accent: 0xffd447 },
      { wall: 0xfff1d6, trim: 0xf4a261, roof: 0x2a9d8f, glass: 0x8ee8ff, accent: 0xe76f51 },
    ],
    ink: "#1f7a70",
    wonder: "Tượng Nữ thần Tự do",
  },
  enl: {
    id: "enl",
    name: "Vườn Sách",
    a: 0x8e7cc3,
    b: 0x9bd07e,
    walls: [0xebe2ff, 0xfff8ff, 0xd8cbf7, 0xe6f5d6],
    roofs: [0x8e7cc3, 0x6f5bb0, 0x7fbf5f],
    trim: 0xffffff,
    glass: 0xb5ebff,
    blocks: [0x8e7cc3, 0x9bd07e, 0xffd447, 0xff8fb1, 0x5fb8e8],
    kit: [
      { wall: 0xf1e9ff, trim: 0xffffff, roof: 0x8e7cc3, glass: 0xb5ebff, accent: 0x9bd07e },
      { wall: 0xe6f5d6, trim: 0xffffff, roof: 0x6f5bb0, glass: 0xb5ebff, accent: 0xff8fb1 },
      { wall: 0xffffff, trim: 0xd8cbf7, roof: 0x7fbf5f, glass: 0xb5ebff, accent: 0x8e7cc3 },
      { wall: 0xffe6f0, trim: 0xffffff, roof: 0x8e7cc3, glass: 0xb5ebff, accent: 0xffd447 },
    ],
    ink: "#6f5bb0",
    wonder: "Đền Parthenon",
  },
  emath: {
    id: "emath",
    name: "Xưởng Máy",
    a: 0xe9954a,
    b: 0x8896a6,
    walls: [0xffb877, 0xdfe6ee, 0xb3c0ce, 0xffe0b8],
    roofs: [0x5d6b7d, 0xe9954a, 0x3f7de0],
    trim: 0xf3f6fa,
    glass: 0x8fdcff,
    blocks: [0xe9954a, 0x8896a6, 0xffd447, 0x5e93d6, 0x5ec96b],
    kit: [
      { wall: 0xffc48a, trim: 0xf3f6fa, roof: 0x5d6b7d, glass: 0x8fdcff, accent: 0xe9954a },
      { wall: 0xdfe6ee, trim: 0xe9954a, roof: 0x5d6b7d, glass: 0x8fdcff, accent: 0xffd447 },
      { wall: 0xffffff, trim: 0x8896a6, roof: 0xe9954a, glass: 0x8fdcff, accent: 0x5e93d6 },
      { wall: 0xffe0b8, trim: 0xf3f6fa, roof: 0x8896a6, glass: 0x8fdcff, accent: 0xe9954a },
    ],
    ink: "#b8641f",
    wonder: "Tháp Eiffel",
  },
  esci: {
    id: "esci",
    name: "Trạm Khám Phá",
    a: 0x47b8c4,
    b: 0xb283e0,
    walls: [0xd2f6fb, 0xffffff, 0xe2cdf7, 0xf0fbff],
    roofs: [0x2fb0be, 0x9a6ae0, 0x5e93d6],
    trim: 0xffffff,
    glass: 0xc6f6ff,
    blocks: [0x47b8c4, 0xb283e0, 0xffd447, 0xff8fb1, 0x5ec96b],
    kit: [
      { wall: 0xffffff, trim: 0xd2f6fb, roof: 0x2fb0be, glass: 0xc6f6ff, accent: 0xb283e0 },
      { wall: 0xe2cdf7, trim: 0xffffff, roof: 0x9a6ae0, glass: 0xc6f6ff, accent: 0x47b8c4 },
      { wall: 0xd2f6fb, trim: 0xffffff, roof: 0x5e93d6, glass: 0xc6f6ff, accent: 0xffd447 },
      { wall: 0xf0fbff, trim: 0xb283e0, roof: 0x2fb0be, glass: 0xc6f6ff, accent: 0xff8fb1 },
    ],
    ink: "#2a8a95",
    wonder: "Vạn Lý Trường Thành",
  },
};

export const ROAD = { road: WORLD.road, curb: WORLD.curb } as const;

/** Colours every city shares, mixed into each city's own two-colour palette (Pha 10 bổ sung §6). */
export const COMMON_ROOFS = [0xff7a5c, 0x3fa7d6, 0xffbe2e, 0x2bb3a3, 0x8e6fd8] as const;
export const COMMON_WALLS = [0xfff4dc, 0xffffff, 0xffd9b8, 0xd8f3dc, 0xdcecff, 0xffe9a8] as const;
/** Odd list lengths: picks by a fixed index and by the seed both walk every colour. */
export const LOT_ROOF_COLOURS = 5;
export const LOT_WALL_COLOURS = 7;

const uniq = (xs: readonly number[]) => [...new Set(xs)];

/**
 * Pha 10 việc 1 (style board) lifted colour saturation by ×1.18; building colours go through the
 * same lift so the engine matches the approved board.
 */
export const STYLE_SATURATION = 1.18;
export function styleColour(hex: number): number {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb(h, Math.min(1, s * STYLE_SATURATION), l));
}
const rotate = <T>(xs: readonly T[], by: number) => xs.map((_, i) => xs[(i + by) % xs.length] as T);

/**
 * The palette one building is painted with: the city's roofs and walls, its two signature colours
 * and the shared colours, turned by the lot's seed. Neighbouring lots therefore never share a roof
 * and a street shows at least three roof colours and four wall colours.
 */
export function lotPalette(city: CityPalette, seed: number): CityPalette {
  const roofs = uniq([...city.roofs, city.a, city.b, ...COMMON_ROOFS]).slice(0, LOT_ROOF_COLOURS);
  const walls = uniq([...city.walls, ...COMMON_WALLS]).slice(0, LOT_WALL_COLOURS);
  return {
    ...city,
    roofs: rotate(roofs, seed).map(styleColour),
    walls: rotate(walls, seed).map(styleColour),
    blocks: city.blocks.map(styleColour),
  };
}
