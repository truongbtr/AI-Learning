/**
 * Two files for looking at the art without starting the app:
 *  - content/art/_contact-sheet.html  every asset on one page (SVG inlined, opens from disk)
 *  - content/art/garden-frame.svg     one composed Vườn Kỳ Diệu scene, the counterpart of
 *                                     style-sheet.svg for the second world
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ART_ROOT, g, PALETTE as P, svg, write } from "./lib.mjs";
import { MASCOT_STATES } from "./mascots.mjs";
import { ZONE_LIST } from "./worlds.mjs";

const read = (p) => readFileSync(join(ART_ROOT, p), "utf8");
const fluid = (s) => s.replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"');
const inner = (s) => s.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

export function buildSheet() {
  const cell = (svgText, label, w, h) =>
    `<div class="cell" style="width:${w}px"><div style="width:${w - 12}px;height:${h}px">${fluid(svgText)}</div><div>${label}</div></div>`;

  let html =
    `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>content/art — kiểm kê</title><style>` +
    `body{font-family:system-ui;background:#FFF8EC;color:#2B2B3A;margin:14px}h1{font-size:19px}h2{font-size:15px;margin:16px 0 6px}` +
    `.row{display:flex;flex-wrap:wrap;gap:6px}.cell{background:#fff;border:1px solid #EFE3CC;border-radius:10px;padding:4px;text-align:center;font-size:10px}` +
    `.stack{position:relative;width:300px;height:188px}.stack>div{position:absolute;inset:0}</style></head><body>` +
    `<h1>content/art — kiểm kê (sinh bởi <code>pnpm art:build</code>)</h1>`;

  for (const who of ["robot", "cu"]) {
    html += `<h2>Mascot — ${who}</h2><div class="row">`;
    for (const s of MASCOT_STATES) html += cell(read(`mascots/${who}/${s}.svg`), s, 120, 128);
    html += "</div>";
  }

  html += `<h2>Thế giới (3 lớp chồng lên nhau)</h2><div class="row">`;
  for (const z of ZONE_LIST) {
    const layers = ["sky", "mid", "fore"]
      .map((l) => `<div>${fluid(read(`worlds/${z}-${l}.svg`))}</div>`)
      .join("");
    html += `<div class="cell"><div class="stack">${layers}</div><div>${z}</div></div>`;
  }
  html += `</div><h2>Avatar</h2><div class="row">`;
  for (const f of readdirSync(join(ART_ROOT, "avatars")))
    html += cell(read(`avatars/${f}`), f.replace(".svg", ""), 92, 92);
  html += `</div><h2>Hiệu ứng</h2><div class="row">`;
  for (const f of readdirSync(join(ART_ROOT, "effects")))
    html += cell(read(`effects/${f}`), f.replace(".svg", ""), 110, 100);
  html += `</div><h2>Vật thể</h2><div class="row">`;
  for (const o of JSON.parse(read("objects/manifest.json")).objects)
    html += cell(read(`objects/${o.key}.svg`), o.labelVi, 88, 84);
  html += `</div><h2>Âm thanh</h2><div class="row">`;
  for (const f of readdirSync(join(ART_ROOT, "audio", "ui")))
    html += `<div class="cell" style="width:150px"><audio controls src="audio/ui/${f}" style="width:140px"></audio><div>${f}</div></div>`;
  html += "</div></body></html>";

  return write("_contact-sheet.html", html);
}

/** One finished Vườn Kỳ Diệu frame: the three layers, bạn Cú greeting, two objects. */
export function buildGardenFrame() {
  const layers = ["sky", "mid", "fore"]
    .map((l) => inner(read(`worlds/garden/vuon-so-${l}.svg`)))
    .join("");
  const owl = inner(read("mascots/cu/greet.svg"));
  const flower = inner(read("objects/bong-hoa.svg"));
  const butterfly = inner(read("objects/con-buom.svg"));
  const body =
    layers +
    g(owl, { transform: "translate(520 300) scale(0.95)" }) +
    // speech bubble
    g(
      `<rect x="-150" y="-70" width="300" height="120" rx="40" fill="#FFFFFF" fill-opacity="0.96"/>` +
        `<path d="M-60 50 -86 100 -12 54Z" fill="#FFFFFF" fill-opacity="0.96"/>` +
        `<text x="0" y="-14" text-anchor="middle" font-family="Nunito, sans-serif" font-size="40" font-weight="800" fill="${P.ink}">Chào Thy!</text>` +
        `<text x="0" y="30" text-anchor="middle" font-family="Nunito, sans-serif" font-size="28" fill="${P.inkSoft}">Vườn hôm nay nở hoa rồi</text>`,
      { transform: "translate(950 250)" },
    ) +
    g(flower, { transform: "translate(1150 560) scale(1.9)" }) +
    g(butterfly, { transform: "translate(880 470) scale(1.2)" });
  return write(
    "garden-frame.svg",
    svg("0 0 1600 1000", body, { title: "Vườn Kỳ Diệu — khu Vườn Số, bạn Cú chào" }),
  );
}
