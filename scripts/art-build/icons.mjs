/**
 * The icon two six-year-olds tap on an iPad home screen (docs/08 pha 8 việc 1).
 *
 * It is drawn, not cropped out of a mascot: at 60 px on a busy home screen a mascot's face turns
 * into a smudge, and the children have to find this one among thirty others without reading. So:
 * one high-contrast shape — a star on the sunrise sky both worlds share — with nothing small in
 * it. The star is the currency of the whole app (docs/06 §1.8c) and both children already know it.
 *
 * Three sizes, all PNG. iOS ignores SVG for `apple-touch-icon`, and a maskable Android icon has to
 * survive being cut into a circle, which means the interesting part stays inside the middle 80%.
 *
 * `any` icons keep a rounded card with margin — that is what Android draws when it does not mask.
 * `maskable` fills the square edge to edge, so the launcher's own crop never eats a corner.
 */
import { light, PALETTE, shade, svg, tone } from "./lib.mjs";

const BG_TOP = "#FFE3B0";
const BG_BOTTOM = "#FFC46B";

/** A five-pointed star, points up, centred on (cx, cy) with outer radius r. */
function starPath(cx, cy, r, inner = 0.42) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(
      `${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`,
    );
  }
  return `M${pts.join("L")}Z`;
}

/**
 * @param {number} size    viewBox size
 * @param {boolean} maskable  fill the square (launcher crops), or leave a rounded card with margin
 */
export function iconSvg(size, maskable) {
  const s = size;
  // A maskable icon must keep everything important inside the middle 80% (the "safe zone").
  const pad = maskable ? 0 : s * 0.06;
  const cardR = maskable ? 0 : s * 0.22;
  const cx = s / 2;
  const cy = s / 2;
  const starR = maskable ? s * 0.3 : s * 0.32;

  let body = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${BG_TOP}"/><stop offset="1" stop-color="${BG_BOTTOM}"/>
  </linearGradient></defs>`;

  // The card. Rounded, never a hard corner (STYLE.md §2 rule 3).
  body += `<rect x="${pad}" y="${pad}" width="${s - pad * 2}" height="${s - pad * 2}" rx="${cardR}" fill="url(#sky)"/>`;

  // A hill at the bottom, so the icon reads as "somewhere", not as a flat swatch.
  const hillY = s - pad - (s - pad * 2) * 0.2;
  body += `<path d="M${pad} ${hillY} Q ${s * 0.3} ${hillY - s * 0.1} ${s * 0.55} ${hillY - s * 0.02}
    T ${s - pad} ${hillY - s * 0.05} L ${s - pad} ${s - pad} L ${pad} ${s - pad} Z"
    fill="${PALETTE.robot.grass}"/>`;
  body += `<path d="M${pad} ${s - pad - (s - pad * 2) * 0.07} L ${s - pad} ${s - pad - (s - pad * 2) * 0.09}
    L ${s - pad} ${s - pad} L ${pad} ${s - pad} Z" fill="${PALETTE.robot.grassDark}"/>`;

  // The star: soft shadow first (an ellipse, never a blur — STYLE.md §2 rule 4), then the shape.
  body += `<ellipse cx="${cx}" cy="${cy + starR * 0.92}" rx="${starR * 0.78}" ry="${starR * 0.18}"
    fill="${tone(PALETTE.reward, -40)}" fill-opacity="0.16"/>`;
  body += `<path d="${starPath(cx, cy - s * 0.02, starR)}" fill="${shade(PALETTE.reward)}"/>`;
  body += `<path d="${starPath(cx, cy - s * 0.03, starR * 0.94)}" fill="${PALETTE.reward}"/>`;
  // Highlight: a soft wedge on the upper-left, because the light comes from there (STYLE.md §2
  // rule 2). Not a smaller star — that reads as a ring at 60 px, which is the size that matters.
  body += `<ellipse cx="${cx - starR * 0.26}" cy="${cy - starR * 0.42}" rx="${starR * 0.28}"
    ry="${starR * 0.17}" fill="${light(PALETTE.reward)}" fill-opacity="0.75"
    transform="rotate(-28 ${cx - starR * 0.26} ${cy - starR * 0.42})"/>`;

  // `&` escaped: this SVG is parsed by a real XML parser on the way to PNG, not just by a browser.
  return svg(`0 0 ${s} ${s}`, body, { title: "Học cùng Mai Thy &amp; Chí Thanh" });
}

/**
 * Writes the SVG sources under content/art/icons/. The PNGs are rasterised by
 * `scripts/art-icons.mjs`, which needs sharp and so is kept out of the pure-drawing build.
 */
export function buildIcons(write) {
  return [
    { ...write("icons/icon.svg", iconSvg(512, false)), kind: "icon" },
    { ...write("icons/icon-maskable.svg", iconSvg(512, true)), kind: "icon" },
  ];
}
