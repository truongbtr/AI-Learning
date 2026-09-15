// Pure colour helpers (sRGB bytes ↔ HSL) and the per-city recolour rules for Kenney assets.
// No three.js here so the rules are unit-testable and usable from the bake script.

export type RGB = readonly [number, number, number]; // sRGB 0..255

export function hexToRgb(hex: number): RGB {
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

export function rgbToHex([r, g, b]: RGB): number {
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}

/** h in degrees 0..360, s and l 0..1 — computed in sRGB space like CSS hsl(). */
export function rgbToHsl([r8, g8, b8]: RGB): [number, number, number] {
  const r = r8 / 255;
  const g = g8 / 255;
  const b = b8 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  const hue = (((h % 360) + 360) % 360) / 360;
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return [f(hue + 1 / 3) * 255, f(hue) * 255, f(hue - 1 / 3) * 255];
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** How a Kenney city-kit surface is repainted for one city variant. */
export interface KitSpec {
  wall: number;
  trim: number;
  roof: number;
  glass: number;
  accent: number;
}

export type SurfaceClass = "wall" | "trim" | "roof" | "glass" | "accent" | "other";

/**
 * Kenney city kits paint every surface from a few swatches: near-white walls, mid greys for trims,
 * dark greys for roofs, blues for glass, greens for awnings/roofs. Classify by the original colour.
 */
export function classifyKitColor(rgb: RGB): SurfaceClass {
  const [h, s, l] = rgbToHsl(rgb);
  if (s < 0.3 || (h > 215 && h < 260 && l > 0.78)) {
    if (l > 0.74) return "wall";
    if (l > 0.4) return "trim";
    return "roof";
  }
  if (h > 195 && h < 255) return "glass";
  if (h > 110 && h < 175) return "accent";
  return "other";
}

function paint(target: number, lightnessScale: number): RGB {
  const [h, s, l] = rgbToHsl(hexToRgb(target));
  // shaded reds stay light coral: a dark saturated red reads as an error colour (06 §1.1)
  const floor = h < 18 || h > 340 ? 0.55 : 0.04;
  return hslToRgb(h, Math.min(1, s * 1.05), clamp(l * lightnessScale, floor, 0.97));
}

/** Repaint one Kenney city-kit colour for a city variant, keeping the swatch's shading. */
export function recolorKit(rgb: RGB, spec: KitSpec): RGB {
  const [h, s, l] = rgbToHsl(rgb);
  switch (classifyKitColor(rgb)) {
    case "wall":
      return paint(spec.wall, Math.min(1.08, l / 0.93));
    case "trim":
      return paint(spec.trim, l / 0.6);
    case "roof":
      return paint(spec.roof, 0.75 + l);
    case "glass":
      return paint(spec.glass, l / 0.62);
    case "accent":
      return paint(spec.accent, l / 0.55);
    default:
      // kit reds become warm coral (roof-tile red), never an alarm red (06 §1.1)
      if (h < 18 || h > 340) return hslToRgb(10, Math.min(0.78, s * 1.1), Math.max(0.56, l));
      return hslToRgb(h, Math.min(1, s * 1.18), l);
  }
}

/** Road tiles: light surfaces become the kerb colour, everything else the asphalt colour. */
export function recolorRoad(rgb: RGB, road: number, curb: number): RGB {
  const l = rgbToHsl(rgb)[2];
  if (l > 0.7) return paint(curb, l / 0.85);
  if (l > 0.3) return paint(road, l / 0.45);
  return paint(road, 0.7);
}

/** Nature kit: teal-grey leaves become bright greens (dark/mid/light), bark becomes warm brown. */
export function recolorNature(
  rgb: RGB,
  leaves: readonly [number, number, number],
  trunk: number,
): RGB {
  const [h, s, l] = rgbToHsl(rgb);
  if (h > 90 && h < 190 && s > 0.15) {
    const pick = l < 0.28 ? leaves[0] : l < 0.4 ? leaves[1] : leaves[2];
    return hexToRgb(pick);
  }
  if (h < 45 && s > 0.15 && l < 0.5) return hexToRgb(trunk);
  return hslToRgb(h, Math.min(1, s * 1.3), Math.min(0.9, l * 1.15));
}
