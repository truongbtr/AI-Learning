// Draw the paper map to an SVG, for the phase report and for looking at it without a browser:
//   pnpm --filter @mtct/city exec tsx scripts/paper-map-svg.ts viet endOfYear
//
// The app draws the same data on a canvas (apps/web/components/kid/city/paper-map.tsx); this is the
// same `paperMap()` output, so what comes out here is what the child sees.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CityId } from "../src/palette";
import { paperMap } from "../src/paper-map";
import type { SampleSize } from "../src/sample";
import { sampleView } from "../src/sample";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../..");
const city = (process.argv[2] ?? "viet") as CityId;
const size = (process.argv[3] ?? "endOfYear") as SampleSize;
const out = resolve(repo, "docs/screens/pha-12", `ban-do-giay-${city}-${size}.svg`);

const map = paperMap(sampleView(city, size));
const W = 1200;
const scale = (W * 0.92) / (map.extent * 2);
const px = (x: number) => (W / 2 + x * scale).toFixed(1);
const pz = (z: number) => (W / 2 + z * scale).toFixed(1);
const path = (points: [number, number][]) =>
  points.map(([x, z], i) => `${i === 0 ? "M" : "L"}${px(x)} ${pz(z)}`).join(" ");

const parts: string[] = [];
parts.push(`<rect width="${W}" height="${W}" fill="#FFF8EC"/>`);
for (const g of map.green)
  parts.push(
    `<circle cx="${px(g.x)}" cy="${pz(g.z)}" r="${((g.radius + 7) * scale).toFixed(1)}" fill="#B7E3A0"/>`,
  );
parts.push(
  `<path d="${path(map.water.river)}" stroke="#6FBEE8" stroke-width="${((map.water.riverWidth + 4) * scale).toFixed(1)}" fill="none" stroke-linejoin="round"/>`,
);
parts.push(
  `<path d="${path(map.water.river)}" stroke="#8FD3F4" stroke-width="${(map.water.riverWidth * scale).toFixed(1)}" fill="none" stroke-linejoin="round"/>`,
);
for (const canal of map.water.canals)
  parts.push(
    `<path d="${path(canal.points)}" stroke="#8FD3F4" stroke-width="${(canal.width * scale).toFixed(1)}" fill="none" stroke-linecap="round"/>`,
  );
parts.push(`<path d="${path(map.water.lake)} Z" fill="#8FD3F4"/>`);
for (const pond of map.water.ponds)
  parts.push(
    `<circle cx="${px(pond.x)}" cy="${pz(pond.z)}" r="${(pond.radius * scale).toFixed(1)}" fill="#8FD3F4"/>`,
  );
for (const road of map.roads)
  parts.push(
    `<path d="${path(road.points)}" stroke="#E4DCCB" stroke-width="${((road.width + 2.5) * scale).toFixed(1)}" fill="none" stroke-linecap="round"/>`,
  );
for (const road of map.roads)
  parts.push(
    `<path d="${path(road.points)}" stroke="${road.kind === "path" ? "#F0E6CE" : "#FFFFFF"}" stroke-width="${(road.width * scale).toFixed(1)}" fill="none" stroke-linecap="round"/>`,
  );
for (const b of map.blocks)
  parts.push(
    `<path d="M${px(b.from[0])} ${pz(b.from[1])} L${px(b.to[0])} ${pz(b.to[1])}" stroke="${b.built ? "#E6B980" : "#DCD3C0"}" stroke-width="${((b.tall ? 7 : 5) * scale).toFixed(1)}" stroke-linecap="round"/>`,
  );
for (const m of map.missions)
  parts.push(`<circle cx="${px(m.x)}" cy="${pz(m.z)}" r="9" fill="#FFD447" opacity="0.8"/>`);
const marks: [string, { x: number; z: number } | null][] = [
  ["🏛️", map.landmarks.townHall],
  ["✨", map.landmarks.wonder],
  ["⚓", map.landmarks.harbour],
  ["🌉", map.landmarks.bridge],
];
for (const [glyph, at] of marks)
  if (at)
    parts.push(
      `<text x="${px(at.x)}" y="${pz(at.z)}" font-size="22" text-anchor="middle" dominant-baseline="middle">${glyph}</text>`,
    );
for (const d of map.districts)
  parts.push(
    `<text x="${px(d.x)}" y="${pz(d.z)}" font-size="17" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#2B2B3A" stroke="#FFF8EC" stroke-width="4" paint-order="stroke">${d.name}</text>`,
  );

mkdirSync(dirname(out), { recursive: true });
writeFileSync(
  out,
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}" viewBox="0 0 ${W} ${W}">\n<title>Bản đồ giấy — ${city}</title>\n${parts.join("\n")}\n</svg>\n`,
  "utf8",
);
console.log(
  `${out.slice(repo.length + 1)} — ${map.districts.length} khu, ${map.blocks.length} công trình, ${map.missions.length} sao tối nay`,
);
