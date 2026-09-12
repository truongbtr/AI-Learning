/**
 * `pnpm art:build` — writes every file under content/art/ from the generators next to this file,
 * then the manifest that `pnpm art:check` measures.
 *
 * Run it from the repo root. Editing an SVG by hand works for a quick look, but the next build
 * overwrites it: change the generator (and STYLE.md first, when the rule itself changes).
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildAudio } from "./audio.mjs";
import { buildAvatars } from "./avatars.mjs";
import { buildEffects } from "./effects.mjs";
import { buildIcons } from "./icons.mjs";
import { ART_ROOT, svg, write } from "./lib.mjs";
import { buildMascots } from "./mascots.mjs";
import { buildObjects } from "./objects.mjs";
import { buildPictures } from "./pictures.mjs";
import { buildGardenFrame, buildSheet } from "./sheet.mjs";
import { buildWorlds } from "./worlds.mjs";

const objects = buildObjects(write, svg);
const mascots = buildMascots(write, svg);
const worlds = buildWorlds(write, svg);
const avatars = buildAvatars(write, svg);
const effects = buildEffects(write, svg);
const pictures = buildPictures(write, svg);
const icons = buildIcons(write);
const audio = buildAudio(write);

writeFileSync(
  join(ART_ROOT, "objects", "manifest.json"),
  `${JSON.stringify(
    {
      $comment:
        "Sinh bởi scripts/art-build/build.mjs — đừng sửa tay. Bài luyện trỏ tới vật thể bằng ImageRef.kind='asset', value=key.",
      source: "mtct-hand-drawn",
      license: "internal",
      objects,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

const all = [
  ...objects,
  ...mascots,
  ...worlds,
  ...avatars,
  ...effects,
  ...pictures,
  ...icons,
  ...audio,
];
writeFileSync(
  join(ART_ROOT, "manifest.json"),
  `${JSON.stringify(
    {
      $comment: "Kiểm kê toàn bộ content/art/ — sinh bởi scripts/art-build/build.mjs.",
      builtAt: new Date().toISOString().slice(0, 10),
      counts: {
        objects: objects.length,
        mascots: mascots.length,
        worlds: worlds.length,
        avatars: avatars.length,
        effects: effects.length,
        pictures: pictures.length,
        icons: icons.length,
        audio: audio.length,
      },
      files: all.map((f) => ({ file: f.file ?? f.path, bytes: f.bytes, kind: f.kind ?? "object" })),
    },
    null,
    2,
  )}\n`,
  "utf8",
);

buildGardenFrame();
buildSheet();

const total = all.reduce((n, f) => n + f.bytes, 0);
console.log(
  `art: ${objects.length} objects · ${mascots.length} mascot states · ${worlds.length} world layers · ` +
    `${avatars.length} avatars · ${effects.length} effects · ${pictures.length} pictures · ${audio.length} sounds — ${(total / 1024).toFixed(0)} KB`,
);
