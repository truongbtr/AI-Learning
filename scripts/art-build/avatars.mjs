/**
 * Avatars: the face a child picks for the login card and for the little figure that walks the
 * quest map. Head and shoulders only, same chibi proportions as the mascots, drawn inside a
 * circle so they sit in a badge without cropping.
 */
import { circle, eye, light, path, rect, shade } from "./lib.mjs";

const FACES = [
  {
    key: "avatar-01",
    vi: "Bạn tóc nơ",
    skin: "#F6C9A0",
    hair: "#3A2A1E",
    shirt: "#E85D9C",
    style: "bun",
    bow: true,
  },
  {
    key: "avatar-02",
    vi: "Bạn tóc ngắn",
    skin: "#F1BE92",
    hair: "#2B2B3A",
    shirt: "#2F80ED",
    style: "short",
  },
  {
    key: "avatar-03",
    vi: "Bạn buộc tóc",
    skin: "#FAD7B4",
    hair: "#6B4A2E",
    shirt: "#7BC67E",
    style: "tails",
  },
  {
    key: "avatar-04",
    vi: "Bạn mũ lưỡi trai",
    skin: "#E0A877",
    hair: "#1F1A16",
    shirt: "#FF8C42",
    style: "cap",
  },
  {
    key: "avatar-05",
    vi: "Bạn kính tròn",
    skin: "#F6C9A0",
    hair: "#4A3A2E",
    shirt: "#7C5CFF",
    style: "glasses",
  },
  {
    key: "avatar-06",
    vi: "Bạn tóc xoăn",
    skin: "#C98A5E",
    hair: "#241C16",
    shirt: "#34C759",
    style: "curly",
  },
  {
    key: "avatar-07",
    vi: "Bạn mũ len",
    skin: "#F1BE92",
    hair: "#3A2A1E",
    shirt: "#5BC0E8",
    style: "beanie",
  },
  {
    key: "avatar-08",
    vi: "Bạn tóc dài",
    skin: "#FAD7B4",
    hair: "#5A3A2A",
    shirt: "#FFB020",
    style: "long",
  },
];

function hairFor(style, hair) {
  switch (style) {
    case "bun":
      return (
        circle(50, 12, 14, hair) + path(`M50 14a30 30 0 0 1 30 30H20a30 30 0 0 1 30-30Z`, hair)
      );
    case "short":
      return path(
        `M50 14a30 30 0 0 1 30 30v4c-6-10-16-14-30-14s-24 4-30 14v-4a30 30 0 0 1 30-30Z`,
        hair,
      );
    case "tails":
      return (
        path(`M50 14a30 30 0 0 1 30 30H20a30 30 0 0 1 30-30Z`, hair) +
        circle(14, 52, 13, hair) +
        circle(86, 52, 13, hair)
      );
    case "cap":
      return (
        path(`M50 12a30 26 0 0 1 30 26H20a30 26 0 0 1 30-26Z`, "#2F80ED") +
        path(`M78 36h18a8 8 0 0 1 0 12H78Z`, shade("#2F80ED")) +
        circle(50, 12, 6, light("#2F80ED"))
      );
    case "glasses":
      return path(`M50 14a30 30 0 0 1 30 30H20a30 30 0 0 1 30-30Z`, hair);
    case "curly":
      return (
        circle(26, 28, 14, hair) +
        circle(50, 18, 16, hair) +
        circle(74, 28, 14, hair) +
        circle(18, 46, 11, hair) +
        circle(82, 46, 11, hair)
      );
    case "beanie":
      return (
        path(`M50 10a30 24 0 0 1 30 24H20a30 24 0 0 1 30-24Z`, "#E85D9C") +
        rect(18, 32, 64, 12, 6, shade("#E85D9C")) +
        circle(50, 8, 8, light("#E85D9C"))
      );
    default:
      return path(
        `M50 14a30 30 0 0 1 30 30v30h-10V52c0-10-8-14-20-14s-20 4-20 14v22H20V44a30 30 0 0 1 30-30Z`,
        hair,
      );
  }
}

function avatar(f) {
  return (
    circle(50, 50, 50, "#FFF3DF") +
    circle(50, 52, 44, light("#FFF3DF")) +
    // shoulders
    path(`M50 74c-18 0-30 10-34 24h68c-4-14-16-24-34-24Z`, f.shirt) +
    path(`M50 74c18 0 30 10 34 24H50Z`, shade(f.shirt)) +
    // face
    circle(50, 48, 28, f.skin) +
    path(`M50 20a28 28 0 0 1 0 56Z`, shade(f.skin), { "fill-opacity": 0.35 }) +
    hairFor(f.style, f.hair) +
    eye(40, 48, 6) +
    eye(60, 48, 6) +
    (f.style === "glasses"
      ? circle(40, 48, 12, "none", { stroke: "#2B2B3A", "stroke-width": 3 }) +
        circle(60, 48, 12, "none", { stroke: "#2B2B3A", "stroke-width": 3 }) +
        path(`M52 48h-4`, "none", { stroke: "#2B2B3A", "stroke-width": 3 })
      : "") +
    path(`M42 60a10 7 0 0 0 16 0Z`, "#C4665A") +
    circle(30, 56, 6, "#F49AC1", { "fill-opacity": 0.5 }) +
    circle(70, 56, 6, "#F49AC1", { "fill-opacity": 0.5 }) +
    (f.bow ? path(`M22 26 8 18v16Z`, "#E85D9C") + circle(24, 26, 6, shade("#E85D9C")) : "")
  );
}

export function buildAvatars(write, svg) {
  const out = [];
  for (const f of FACES) {
    const file = `avatars/${f.key}.svg`;
    const res = write(file, svg("0 0 100 100", avatar(f), { title: f.vi }));
    out.push({ file: `art/${file}`, bytes: res.bytes, kind: "avatar", labelVi: f.vi, key: f.key });
  }
  return out;
}

export const AVATAR_KEYS = FACES.map((f) => f.key);
