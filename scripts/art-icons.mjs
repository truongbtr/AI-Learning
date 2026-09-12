/**
 * `pnpm art:icons` — rasterises the home-screen icons (docs/08 pha 8 việc 1).
 *
 * Kept out of `pnpm art:build` on purpose: that build is pure string-writing and runs anywhere,
 * while this needs sharp (and therefore libvips). The PNGs are committed under content/art/icons/
 * so a fresh clone can build the web image without it.
 *
 * iOS ignores SVG for `apple-touch-icon` and ignores the manifest's icons entirely, so the 180 px
 * PNG is what the children actually end up tapping on the iPad.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { iconSvg } from "./art-build/icons.mjs";

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require("sharp");
} catch {
  // sharp lives in the worker package; the repo root does not depend on it.
  sharp = require(join(process.cwd(), "apps", "worker", "node_modules", "sharp"));
}

const OUT = join(process.cwd(), "content", "art", "icons");
mkdirSync(OUT, { recursive: true });

/** @type {{name: string, size: number, maskable: boolean}[]} */
const TARGETS = [
  // Android / Chrome install prompt.
  { name: "icon-192.png", size: 192, maskable: false },
  { name: "icon-512.png", size: 512, maskable: false },
  // Cut into a circle or a squircle by the launcher, so it is drawn edge to edge.
  { name: "icon-maskable-512.png", size: 512, maskable: true },
  // iOS home screen. 180 is the size an iPad Pro asks for; everything else downscales from it.
  { name: "apple-touch-icon.png", size: 180, maskable: true },
  // The tab.
  { name: "favicon-32.png", size: 32, maskable: false },
];

const written = [];
for (const target of TARGETS) {
  const source = Buffer.from(iconSvg(512, target.maskable), "utf8");
  const png = await sharp(source, { density: 384 })
    .resize(target.size, target.size, { fit: "cover" })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
  const file = join(OUT, target.name);
  writeFileSync(file, png);
  written.push(`${target.name} ${(png.length / 1024).toFixed(1)} KB`);
}

// The SVG sources too, so the shape is reviewable as text.
writeFileSync(join(OUT, "icon.svg"), iconSvg(512, false), "utf8");
writeFileSync(join(OUT, "icon-maskable.svg"), iconSvg(512, true), "utf8");

console.log(`art:icons — content/art/icons/\n  ${written.join("\n  ")}`);
