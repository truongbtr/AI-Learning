/**
 * Drawing library for content/art/*.svg — the rules of STYLE.md as code.
 *
 * Every asset in content/art/ is written by scripts/art-build/build.mjs. Hand-editing the SVGs is
 * allowed for a one-off tweak, but the next build overwrites it: change the generator (and
 * STYLE.md first, if the rule itself is changing).
 *
 * The style in three lines: no black outlines; every shape gets a base colour, a shade at the
 * bottom right and a highlight at the top left because the light comes from the top left; shadows
 * are soft ellipses, never blur filters (an iPad renders those slowly and inconsistently).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const ART_ROOT = join(process.cwd(), "content", "art");

// ----------------------------------------------------------------- colour
/** #rrggbb -> {r,g,b} */
function rgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16),
  };
}
const hex2 = (n) =>
  Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, "0");

/** Mixes towards black (amount < 0) or white (amount > 0), in percent. */
export function tone(hex, amount) {
  const { r, g, b } = rgb(hex);
  const t = amount > 0 ? 255 : 0;
  const k = Math.abs(amount) / 100;
  return `#${hex2(r + (t - r) * k)}${hex2(g + (t - g) * k)}${hex2(b + (t - b) * k)}`;
}
export const shade = (hex) => tone(hex, -12);
export const light = (hex) => tone(hex, 10);

export const PALETTE = {
  cream: "#FFF8EC",
  ink: "#2B2B3A",
  inkSoft: "#6B6B7B",
  reward: "#FFD447",
  correct: "#34C759",
  near: "#FFB020",
  white: "#FFFFFF",
  // Thành phố Robot
  robot: {
    primary: "#2F80ED",
    accent: "#FF8C42",
    skyTop: "#DCEEFF",
    skyBottom: "#B9DCFF",
    hillFar: "#BBD6F2",
    hillNear: "#A9C6E8",
    building: "#6E9AD6",
    buildingLight: "#8FB8E8",
    buildingDark: "#4E79B8",
    metal: "#C9D6E6",
    metalDark: "#A9BDD3",
    ground: "#F2E2C6",
    groundDark: "#E3CFA8",
    grass: "#7BC67E",
    grassDark: "#5FA968",
  },
  // Vườn Kỳ Diệu
  garden: {
    primary: "#E85D9C",
    accent: "#7C5CFF",
    skyTop: "#FFE9F3",
    skyBottom: "#FFD3E6",
    hillFar: "#F6C9DF",
    hillNear: "#EFB3D0",
    petal: "#F49AC1",
    petalDeep: "#D9749F",
    magic: "#C77DFF",
    ground: "#F6E6CF",
    groundDark: "#E7D2AE",
    grass: "#7BC67E",
    grassDark: "#5FA968",
  },
};

// ----------------------------------------------------------------- shapes
const attrs = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");

export const g = (inner, o = {}) => `<g ${attrs(o)}>${inner}</g>`;
export const rect = (x, y, w, h, r, fill, o = {}) =>
  `<rect ${attrs({ x, y, width: w, height: h, rx: r, fill, ...o })}/>`;
export const circle = (cx, cy, r, fill, o = {}) => `<circle ${attrs({ cx, cy, r, fill, ...o })}/>`;
export const ellipse = (cx, cy, rx, ry, fill, o = {}) =>
  `<ellipse ${attrs({ cx, cy, rx, ry, fill, ...o })}/>`;
export const path = (d, fill, o = {}) => `<path ${attrs({ d, fill, ...o })}/>`;
export const line = (x1, y1, x2, y2, stroke, width, o = {}) =>
  `<line ${attrs({ x1, y1, x2, y2, stroke, "stroke-width": width, "stroke-linecap": "round", ...o })}/>`;

/** The soft ellipse every object sits on (STYLE.md §2 rule 4). */
export const dropShadow = (cx, cy, rx, ry = rx * 0.24, colour = "#8A6B3C") =>
  ellipse(cx, cy, rx, ry, colour, { "fill-opacity": 0.22 });

/** A rounded body with its shade and highlight — the workhorse of every object. */
export function blob(x, y, w, h, r, colour, opts = {}) {
  const { highlight = true, shadeSide = true } = opts;
  let out = rect(x, y, w, h, r, colour);
  if (shadeSide) out += clipRight(x, y, w, h, r, shade(colour));
  if (highlight)
    out += rect(
      x + w * 0.08,
      y + h * 0.08,
      w * 0.26,
      h * 0.2,
      Math.min(r, h * 0.1),
      light(colour),
      { "fill-opacity": 0.9 },
    );
  return out;
}
function clipRight(x, y, w, h, r, colour) {
  // right-hand third of a rounded rect, as a path so no clipPath is needed
  const x0 = x + w * 0.62;
  const x1 = x + w;
  return path(
    `M${x0} ${y}H${x1 - r}a${r} ${r} 0 0 1 ${r} ${r}V${y + h - r}a${r} ${r} 0 0 1 ${-r} ${r}H${x0}Z`,
    colour,
  );
}

/** A ball with a highlight — fruit, heads, planets. */
export function ball(cx, cy, r, colour, opts = {}) {
  const { highlightR = r * 0.3 } = opts;
  return (
    circle(cx, cy, r, colour) +
    path(
      `M${cx - r} ${cy}a${r} ${r} 0 0 0 ${r} ${r} ${r} ${r} 0 0 0 ${r} ${-r}A${r} ${r} 0 0 1 ${cx - r} ${cy}Z`,
      shade(colour),
    ) +
    circle(cx - r * 0.35, cy - r * 0.35, highlightR, light(colour), { "fill-opacity": 0.85 })
  );
}

/** Eyes used by every character: white, pupil, spark. */
export function eye(cx, cy, r, opts = {}) {
  const { pupil = PALETTE.ink, look = [0, 0], closed = false, pupilR = r * 0.46 } = opts;
  if (closed)
    return path(`M${cx - r} ${cy}q${r} ${r * 0.8} ${r * 2} 0`, "none", {
      stroke: pupil,
      "stroke-width": Math.max(3, r * 0.28),
      "stroke-linecap": "round",
    });
  return (
    circle(cx, cy, r, PALETTE.white) +
    circle(cx + look[0], cy + look[1], pupilR, pupil) +
    circle(cx + look[0] - pupilR * 0.4, cy + look[1] - pupilR * 0.5, pupilR * 0.4, PALETTE.white)
  );
}

/** Sparkle: a four-pointed star for magic, shine and "well done". */
export function sparkle(cx, cy, r, colour = PALETTE.white, opacity = 0.95) {
  const k = r * 0.28;
  return path(
    `M${cx} ${cy - r}C${cx + k} ${cy - k} ${cx + k} ${cy - k} ${cx + r} ${cy}` +
      `C${cx + k} ${cy + k} ${cx + k} ${cy + k} ${cx} ${cy + r}` +
      `C${cx - k} ${cy + k} ${cx - k} ${cy + k} ${cx - r} ${cy}` +
      `C${cx - k} ${cy - k} ${cx - k} ${cy - k} ${cx} ${cy - r}Z`,
    colour,
    { "fill-opacity": opacity },
  );
}

/** Five-pointed reward star. */
export function star(cx, cy, r, colour = PALETTE.reward) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.44;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return (
    path(`M${pts.join("L")}Z`, colour) +
    path(`M${pts.slice(0, 6).join("L")}L${cx} ${cy + r * 0.62}Z`, shade(colour)) +
    circle(cx - r * 0.26, cy - r * 0.26, r * 0.15, light(colour))
  );
}

/** A leaf, used by plants, fruit and trees. */
export function leaf(cx, cy, len, colour, rotate = 0) {
  const w = len * 0.52;
  return g(
    path(
      `M0 0C${w} ${-len * 0.32} ${w} ${-len * 0.72} 0 ${-len}C${-w} ${-len * 0.72} ${-w} ${-len * 0.32} 0 0Z`,
      colour,
    ) + path(`M0 0C${w} ${-len * 0.32} ${w} ${-len * 0.72} 0 ${-len}Z`, shade(colour)),
    { transform: `translate(${cx} ${cy}) rotate(${rotate})` },
  );
}

// ----------------------------------------------------------------- files
export function svg(viewBox, body, opts = {}) {
  const { width, height, title } = opts;
  const [, , w, h] = viewBox.split(" ").map(Number);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width ?? w}" height="${height ?? h}">` +
    (title ? `<title>${title}</title>` : "") +
    body +
    "</svg>\n"
  );
}

export function write(relPath, content) {
  const full = join(ART_ROOT, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, "utf8");
  return { path: relPath, bytes: Buffer.byteLength(content) };
}
