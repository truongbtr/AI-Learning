/**
 * The reward effects: the star that flies to the pocket, the confetti piece, the chest that opens
 * at the end of a session, the sparkle, the badge frame and the big gold star of §1.8c.
 * All of them are animated by Framer Motion, so each is a single tidy shape with an `id`.
 */
import { circle, dropShadow, g, PALETTE as P, path, rect, shade, sparkle, star } from "./lib.mjs";

const CHEST = "#C08A4E";

const EFFECTS = [
  {
    key: "star",
    vi: "ngôi sao thưởng",
    box: "0 0 100 100",
    draw: () => star(50, 50, 46),
  },
  {
    key: "star-gold-big",
    vi: "sao vàng lớn",
    box: "0 0 200 200",
    draw: () =>
      circle(100, 100, 92, "#FFF3DF") +
      g(
        [0, 45, 90, 135]
          .map((a) => rect(-6, -96, 12, 34, 6, P.reward, { transform: `rotate(${a})` }))
          .join(""),
        { id: "rays", transform: "translate(100 100)", "fill-opacity": 0.7 },
      ) +
      star(100, 100, 74) +
      sparkle(46, 46, 16, P.white) +
      sparkle(154, 62, 12, P.white),
  },
  {
    key: "sparkle",
    vi: "lấp lánh",
    box: "0 0 100 100",
    draw: () => sparkle(50, 50, 46, P.white, 1),
  },
  {
    key: "confetti",
    vi: "mảnh pháo giấy",
    box: "0 0 40 60",
    draw: () => rect(4, 4, 32, 52, 12, P.reward) + rect(20, 4, 16, 52, 12, shade(P.reward)),
  },
  {
    key: "chest-closed",
    vi: "rương đóng",
    box: "0 0 200 160",
    draw: () =>
      dropShadow(100, 146, 78) +
      path(`M20 72a80 46 0 0 1 160 0Z`, CHEST) +
      path(`M100 26a80 46 0 0 1 80 46h-80Z`, shade(CHEST)) +
      rect(20, 72, 160, 62, 14, CHEST) +
      rect(100, 72, 80, 62, 14, shade(CHEST)) +
      rect(20, 78, 160, 16, 4, P.reward) +
      rect(86, 66, 28, 36, 8, P.reward) +
      circle(100, 86, 7, shade(P.reward)),
  },
  {
    key: "chest-open",
    vi: "rương mở",
    box: "0 0 200 200",
    draw: () =>
      dropShadow(100, 186, 78) +
      g(
        path(`M20 60a80 46 0 0 1 160 0Z`, CHEST) +
          path(`M100 14a80 46 0 0 1 80 46h-80Z`, shade(CHEST)) +
          rect(20, 44, 160, 16, 4, P.reward),
        {
          id: "lid",
          transform: "rotate(-22 20 60)",
        },
      ) +
      rect(20, 112, 160, 62, 14, CHEST) +
      rect(100, 112, 80, 62, 14, shade(CHEST)) +
      rect(20, 118, 160, 16, 4, P.reward) +
      g(star(70, 100, 26) + star(120, 92, 20) + star(150, 108, 15) + sparkle(44, 84, 14, P.white), {
        id: "treasure",
      }),
  },
  {
    key: "badge-frame",
    vi: "khung huy hiệu",
    box: "0 0 140 160",
    draw: () =>
      path(`M70 8 128 38v52c0 30-24 52-58 62-34-10-58-32-58-62V38Z`, P.reward) +
      path(`M70 8 128 38v52c0 30-24 52-58 62Z`, shade(P.reward)) +
      path(`M70 22 116 46v44c0 24-20 42-46 50-26-8-46-26-46-50V46Z`, "#FFF3DF") +
      rect(44, 138, 16, 22, 4, "#E85D9C") +
      rect(80, 138, 16, 22, 4, "#E85D9C"),
  },
  {
    key: "streak-flame",
    vi: "ngọn lửa chuỗi ngày",
    box: "0 0 100 120",
    draw: () =>
      path(`M50 8c26 26 38 46 38 66a38 38 0 0 1-76 0C12 54 24 34 50 8Z`, "#FF8C42") +
      path(`M50 8c26 26 38 46 38 66a38 38 0 0 1-38 38Z`, shade("#FF8C42")) +
      path(`M50 46c12 14 18 24 18 34a18 18 0 0 1-36 0c0-10 6-20 18-34Z`, P.reward),
  },
  {
    key: "egg",
    vi: "quả trứng",
    box: "0 0 120 160",
    draw: () =>
      dropShadow(60, 150, 44) +
      path(`M60 10c28 0 46 44 46 74a46 46 0 0 1-92 0c0-30 18-74 46-74Z`, "#FFF4DE") +
      path(`M60 10c28 0 46 44 46 74a46 46 0 0 1-46 46Z`, "#EFE3CC") +
      circle(42, 70, 10, "#F49AC1", { "fill-opacity": 0.8 }) +
      circle(74, 92, 8, "#7BC67E", { "fill-opacity": 0.8 }) +
      circle(56, 110, 6, "#5BC0E8", { "fill-opacity": 0.8 }),
  },
  {
    key: "egg-cracked",
    vi: "quả trứng đã nứt",
    box: "0 0 120 160",
    draw: () =>
      dropShadow(60, 150, 44) +
      path(`M60 10c28 0 46 44 46 74a46 46 0 0 1-92 0c0-30 18-74 46-74Z`, "#FFF4DE") +
      path(`M60 10c28 0 46 44 46 74a46 46 0 0 1-46 46Z`, "#EFE3CC") +
      path(`M14 84 34 72l14 16 16-18 14 18 14-14 4 10`, "none", {
        stroke: "#C9B99A",
        "stroke-width": 6,
        fill: "none",
        "stroke-linejoin": "round",
      }) +
      sparkle(96, 44, 14, P.reward),
  },
  {
    key: "certificate",
    vi: "giấy chứng nhận",
    box: "0 0 200 150",
    draw: () =>
      dropShadow(100, 142, 80) +
      rect(10, 10, 180, 124, 14, P.white) +
      rect(20, 20, 160, 104, 10, "#FFF8EC") +
      rect(20, 20, 160, 104, 10, "none", { stroke: P.reward, "stroke-width": 5 }) +
      rect(46, 44, 108, 8, 4, "#E8DCC4") +
      rect(46, 62, 84, 8, 4, "#E8DCC4") +
      rect(46, 80, 96, 8, 4, "#E8DCC4") +
      circle(156, 100, 20, P.reward) +
      star(156, 100, 12, "#FFB020") +
      path(`M148 118 142 142l14-8 14 8-6-24Z`, "#E85D9C"),
  },
];

export function buildEffects(write, svg) {
  const out = [];
  for (const e of EFFECTS) {
    const file = `effects/${e.key}.svg`;
    const res = write(file, svg(e.box, e.draw(), { title: e.vi }));
    out.push({ file: `art/${file}`, bytes: res.bytes, kind: "effect", key: e.key, labelVi: e.vi });
  }
  return out;
}

export const EFFECT_KEYS = EFFECTS.map((e) => e.key);
