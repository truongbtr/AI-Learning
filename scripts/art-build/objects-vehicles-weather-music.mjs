/** Đợt 4 (pha 6d, việc 3) — phương tiện, thời tiết, nhạc cụ, và vật thể đếm cho Toán. */
import {
  ball,
  circle,
  dropShadow,
  ellipse,
  g,
  light,
  line,
  PALETTE as P,
  path,
  rect,
  shade,
} from "./lib.mjs";

const C = {
  bus: "#5BC0E8",
  boatHull: "#C08A4E",
  sail: "#FFF8EC",
  mast: "#8A6B3C",
  plane: "#DCEEFF",
  planeAccent: "#FF8C42",
  moto: "#E85D9C",
  truckCab: "#2F80ED",
  truckBed: "#FFA33C",
  heli: "#7C5CFF",
  ship: "#2F80ED",
  funnel: "#FF8C42",
  sun: "#FFD447",
  sunRay: "#FFA33C",
  rainCloud: "#A9BDD3",
  raindrop: "#5BC0E8",
  snow: "#DCEEFF",
  snowShade: "#B9DCFF",
  guitarBody: "#C08A4E",
  guitarNeck: "#8A6B3C",
  piano: "#5A5A6B",
  trumpet: "#FFD447",
  tambo: "#E8934A",
  jingle: "#FFE896",
  tenFrame: "#7C5CFF",
  dot: "#E85D9C",
  clockFace: "#FFF8EC",
  clockRim: "#5BC0E8",
  calHeader: "#E85D9C",
  calBody: "#FFF8EC",
  coin: "#FFD447",
  scaleStand: "#A9764E",
  scalePan: "#C9D6E6",
};

/** A small teardrop, used by the rain cloud. */
function raindrop(cx, cy, r, colour) {
  return g(
    path(
      `M0 ${-r * 1.6}c${r} ${r * 1.1} ${r} ${r * 1.9} 0 ${r * 1.9}c${-r} 0 ${-r} ${-r * 0.8} 0 ${-r * 1.9}Z`,
      colour,
    ) + circle(-r * 0.22, r * 0.3, r * 0.3, light(colour), { "fill-opacity": 0.7 }),
    { transform: `translate(${cx} ${cy})` },
  );
}

/** One arm of the snowflake: a thick rounded line with a small round tip at each end. */
function snowArm(cx, cy, angleDeg, len, colour) {
  const rad = (Math.PI / 180) * angleDeg;
  const dx = len * Math.cos(rad);
  const dy = len * Math.sin(rad);
  const x1 = cx - dx;
  const y1 = cy - dy;
  const x2 = cx + dx;
  const y2 = cy + dy;
  return (
    line(x1, y1, x2, y2, colour, 6) +
    circle(x1, y1, 4, colour) +
    circle(x2, y2, 4, colour) +
    // little side ticks, a third of the way out from centre on each half
    line(
      cx - dx * 0.55,
      cy - dy * 0.55,
      cx - dx * 0.75 + dy * 0.18,
      cy - dy * 0.75 - dx * 0.18,
      colour,
      3,
    ) +
    line(
      cx + dx * 0.55,
      cy + dy * 0.55,
      cx + dx * 0.75 - dy * 0.18,
      cy + dy * 0.75 + dx * 0.18,
      colour,
      3,
    )
  );
}

export const OBJECTS_VEHICLES_WEATHER_MUSIC = [
  // ---------------------------------------------------------------- phương tiện giao thông
  {
    key: "xe-buyt",
    vi: "xe buýt",
    en: "bus",
    cat: "toy",
    draw: () =>
      dropShadow(50, 90, 36) +
      rect(8, 34, 84, 36, 12, C.bus) +
      rect(50, 34, 42, 36, 12, shade(C.bus)) +
      rect(14, 40, 13, 14, 4, "#DCEEFF") +
      rect(31, 40, 13, 14, 4, "#DCEEFF") +
      rect(48, 40, 13, 14, 4, "#DCEEFF") +
      rect(65, 40, 13, 14, 4, light(C.bus)) +
      circle(26, 72, 9, P.ink) +
      circle(70, 72, 9, P.ink) +
      circle(26, 72, 3.5, "#C9D6E6") +
      circle(70, 72, 3.5, "#C9D6E6"),
  },
  {
    key: "chiec-thuyen",
    vi: "chiếc thuyền",
    en: "boat",
    cat: "toy",
    draw: () =>
      dropShadow(50, 88, 34) +
      path(`M14 66c0-4 4-6 8-6h56c4 0 8 2 8 6l-6 14a8 8 0 0 1-8 6H28a8 8 0 0 1-8-6Z`, C.boatHull) +
      path(`M50 60h28c4 0 8 2 8 6l-6 14a8 8 0 0 1-8 6H50Z`, shade(C.boatHull)) +
      rect(46, 16, 4, 44, 2, C.mast) +
      path(`M50 18 76 54a4 4 0 0 1-4 6H50Z`, C.sail) +
      path(`M50 34 68 54a4 4 0 0 1-4 6H50Z`, shade(C.sail)),
  },
  {
    key: "may-bay",
    vi: "máy bay",
    en: "airplane",
    cat: "toy",
    draw: () =>
      dropShadow(50, 90, 30) +
      ellipse(48, 50, 34, 12, C.plane) +
      path(`M14 50a34 12 0 0 0 68 0Z`, shade(C.plane)) +
      ellipse(22, 46, 8, 5, light(C.plane), { "fill-opacity": 0.85 }) +
      path(`M44 44 18 26c-3-2-1-6 3-5l30 14Z`, C.planeAccent) +
      path(`M44 58 18 76c-3 2-1 6 3 5l30-14Z`, shade(C.planeAccent)) +
      path(`M76 42 90 30c3-2 6 1 4 4l-12 14Z`, C.planeAccent) +
      circle(56, 48, 4, "#DCEEFF") +
      circle(68, 50, 4, "#DCEEFF"),
  },
  {
    key: "xe-may",
    vi: "xe máy",
    en: "motorbike",
    cat: "toy",
    draw: () =>
      dropShadow(50, 90, 34) +
      circle(26, 68, 15, "none", { stroke: P.ink, "stroke-width": 6 }) +
      circle(74, 68, 15, "none", { stroke: P.ink, "stroke-width": 6 }) +
      circle(26, 68, 4, "#C9D6E6") +
      circle(74, 68, 4, "#C9D6E6") +
      path(`M26 68 40 44h22l10 8h6l-4 16Z`, C.moto) +
      rect(44, 38, 20, 8, 4, shade(C.moto)) +
      path(`M70 50c6-4 12-4 14 2`, "none", {
        stroke: C.moto,
        "stroke-width": 5,
        fill: "none",
        "stroke-linecap": "round",
      }) +
      circle(72, 52, 4, "#FFD447"),
  },
  {
    key: "xe-tai",
    vi: "xe tải",
    en: "truck",
    cat: "toy",
    draw: () =>
      dropShadow(50, 90, 36) +
      rect(10, 36, 50, 32, 8, C.truckBed) +
      rect(38, 36, 22, 32, 8, shade(C.truckBed)) +
      rect(60, 44, 26, 24, 8, C.truckCab) +
      rect(76, 44, 10, 24, 8, shade(C.truckCab)) +
      rect(64, 48, 14, 10, 3, "#DCEEFF") +
      circle(26, 74, 9, P.ink) +
      circle(60, 74, 9, P.ink) +
      circle(80, 74, 9, P.ink) +
      circle(26, 74, 3.5, "#C9D6E6"),
  },
  {
    key: "truc-thang",
    vi: "trực thăng",
    en: "helicopter",
    cat: "toy",
    draw: () =>
      dropShadow(50, 90, 26) +
      ellipse(46, 58, 26, 18, C.heli) +
      path(`M20 58a26 18 0 0 0 52 0Z`, shade(C.heli)) +
      ellipse(38, 54, 12, 9, "#DCEEFF") +
      rect(70, 54, 24, 6, 3, C.heli) +
      path(`M92 54 100 52c2 0 2 4 0 5l-8 3Z`, shade(C.heli)) +
      line(18, 26, 78, 26, P.inkSoft, 3) +
      rect(44, 30, 4, 14, 2, P.inkSoft) +
      line(30, 78, 62, 78, C.scaleStand, 4),
  },
  {
    key: "tau-thuy",
    vi: "tàu thuỷ",
    en: "ship",
    cat: "toy",
    draw: () =>
      dropShadow(50, 92, 38) +
      path(`M8 66c0-4 3-6 7-6h70c4 0 7 2 7 6l-8 14a10 10 0 0 1-9 7H25a10 10 0 0 1-9-7Z`, C.ship) +
      path(`M50 60h35c4 0 7 2 7 6l-8 14a10 10 0 0 1-9 7H50Z`, shade(C.ship)) +
      rect(20, 50, 60, 12, 6, "#DCEEFF") +
      rect(38, 26, 10, 26, 4, C.funnel) +
      ellipse(43, 26, 5, 3, shade(C.funnel)) +
      rect(56, 32, 8, 20, 4, shade(C.funnel)) +
      circle(30, 70, 4, "#DCEEFF") +
      circle(50, 70, 4, "#DCEEFF"),
  },
  // ---------------------------------------------------------------- thời tiết & bầu trời
  {
    key: "mat-troi",
    vi: "mặt trời",
    en: "sun",
    cat: "place",
    draw: () => {
      const rays = [0, 60, 120, 180, 240, 300]
        .map((a) =>
          g(rect(-4, -42, 8, 14, 4, C.sunRay), { transform: `translate(50 50) rotate(${a})` }),
        )
        .join("");
      return dropShadow(50, 88, 24) + rays + ball(50, 50, 24, C.sun);
    },
  },
  {
    key: "may-mua",
    vi: "mây mưa",
    en: "rain cloud",
    cat: "place",
    draw: () =>
      dropShadow(50, 92, 34) +
      ellipse(50, 42, 36, 16, C.rainCloud) +
      circle(32, 34, 15, light(C.rainCloud)) +
      circle(54, 28, 19, light(C.rainCloud)) +
      circle(72, 38, 13, C.rainCloud) +
      path(`M16 42a36 16 0 0 0 68 0Z`, shade(C.rainCloud)) +
      raindrop(30, 66, 5, C.raindrop) +
      raindrop(50, 76, 5, C.raindrop) +
      raindrop(70, 66, 5, C.raindrop),
  },
  {
    key: "bong-tuyet",
    vi: "bông tuyết",
    en: "snowflake",
    cat: "place",
    draw: () =>
      dropShadow(50, 90, 22) +
      snowArm(50, 50, 0, 32, C.snow) +
      snowArm(50, 50, 60, 32, "#EAF5FF") +
      snowArm(50, 50, 120, 32, C.snow) +
      circle(50, 50, 7, P.white) +
      circle(50, 50, 4, C.snowShade, { "fill-opacity": 0.6 }),
  },
  // ---------------------------------------------------------------- nhạc cụ
  {
    key: "dan-guitar",
    vi: "đàn guitar",
    en: "guitar",
    cat: "toy",
    draw: () =>
      dropShadow(42, 92, 26) +
      ellipse(44, 66, 20, 18, C.guitarBody) +
      ellipse(40, 42, 14, 13, C.guitarBody) +
      path(`M44 48a20 18 0 0 1 20 18 20 18 0 0 1-8 15Z`, shade(C.guitarBody)) +
      circle(44, 66, 7, P.ink) +
      rect(37, 6, 7, 40, 3, C.guitarNeck) +
      rect(33, 2, 15, 8, 3, shade(C.guitarNeck)) +
      line(40, 10, 40, 84, "#FFF4DE", 1.5) +
      line(44, 10, 44, 84, "#FFF4DE", 1.5),
  },
  {
    key: "dan-piano",
    vi: "đàn piano",
    en: "piano",
    cat: "toy",
    draw: () => {
      const whiteLines = [1, 2, 3, 4, 5]
        .map((i) => line(16 + i * 12, 58, 16 + i * 12, 78, "#D8D8E2", 2))
        .join("");
      const blackKeys = [0, 2, 3].map((i) => rect(20 + i * 12, 58, 6, 12, 2, "#4A4A57")).join("");
      return (
        dropShadow(50, 90, 34) +
        rect(14, 20, 72, 38, 10, C.piano) +
        rect(50, 20, 36, 38, 10, shade(C.piano)) +
        rect(20, 24, 20, 8, 4, light(C.piano), { "fill-opacity": 0.8 }) +
        rect(14, 58, 72, 20, 6, "#F4F4FA") +
        whiteLines +
        blackKeys
      );
    },
  },
  {
    key: "ken-trumpet",
    vi: "kèn trumpet",
    en: "trumpet",
    cat: "toy",
    draw: () =>
      dropShadow(50, 92, 26) +
      path(`M22 74c14-2 22-12 18-24s6-18 20-20`, "none", {
        stroke: C.trumpet,
        "stroke-width": 11,
        "stroke-linecap": "round",
        fill: "none",
      }) +
      path(`M22 74c14-2 22-12 18-24s6-18 20-20`, "none", {
        stroke: light(C.trumpet),
        "stroke-width": 3,
        "stroke-linecap": "round",
        fill: "none",
      }) +
      ellipse(66, 26, 13, 10, C.trumpet) +
      path(`M66 16a13 10 0 0 1 0 20Z`, shade(C.trumpet)) +
      ellipse(61, 21, 5, 4, light(C.trumpet), { "fill-opacity": 0.85 }) +
      rect(40, 50, 6, 14, 3, shade(C.trumpet)) +
      rect(48, 46, 6, 14, 3, shade(C.trumpet)) +
      rect(56, 42, 6, 14, 3, shade(C.trumpet)) +
      circle(20, 76, 4, "#C9D6E6"),
  },
  {
    key: "trong-lac",
    vi: "trống lắc",
    en: "tambourine",
    cat: "toy",
    draw: () => {
      const jingles = [0, 90, 180, 270]
        .map((a) => {
          const r = 32;
          const x = 50 + r * Math.cos((a * Math.PI) / 180);
          const y = 52 + r * Math.sin((a * Math.PI) / 180);
          return circle(x, y, 5, C.jingle) + circle(x, y, 2, shade(C.jingle));
        })
        .join("");
      return (
        dropShadow(50, 90, 34) +
        circle(50, 52, 32, C.tambo) +
        circle(50, 52, 24, "#FFF4DE") +
        path(`M26 52a24 24 0 0 0 48 0Z`, shade("#FFF4DE")) +
        circle(50, 52, 32, "none", { stroke: light(C.tambo), "stroke-width": 3 }) +
        jingles
      );
    },
  },
  {
    key: "dan-xylophone",
    vi: "đàn xylophone",
    en: "xylophone",
    cat: "toy",
    draw: () => {
      const barColors = ["#E8604C", "#FFA33C", "#FFD447", "#7BC67E", "#5BC0E8", "#7C5CFF"];
      const bars = barColors
        .map((c, i) => {
          const y = 18 + i * 10.5;
          const w = 70 - i * 8;
          const x = 50 - w / 2;
          return rect(x, y, w, 8, 4, c) + rect(x, y, w, 3, 3, light(c), { "fill-opacity": 0.75 });
        })
        .join("");
      return dropShadow(50, 92, 36) + rect(14, 80, 72, 8, 4, "#C08A4E") + bars;
    },
  },
  // ---------------------------------------------------------------- vật thể đếm cho Toán
  {
    key: "the-muoi-o",
    vi: "thẻ mười ô",
    en: "ten frame",
    cat: "toy",
    draw: () => {
      const cols = [21.2, 35.6, 50, 64.4, 78.8];
      const dividers =
        cols
          .slice(1)
          .map((x) => line(x, 34, x, 66, shade(C.tenFrame), 2))
          .join("") + line(14, 50, 86, 50, shade(C.tenFrame), 2);
      const dots = [0, 1, 2]
        .flatMap((i) => [circle(cols[i], 42, 5, C.dot), circle(cols[i], 58, 5, C.dot)])
        .join("");
      return (
        dropShadow(50, 90, 36) +
        rect(10, 30, 80, 40, 10, C.tenFrame) +
        rect(14, 34, 72, 32, 8, "#FFF8EC") +
        dividers +
        dots
      );
    },
  },
  {
    key: "dong-ho",
    vi: "đồng hồ",
    en: "clock",
    cat: "toy",
    draw: () =>
      dropShadow(50, 90, 30) +
      circle(50, 50, 30, C.clockRim) +
      circle(50, 50, 25, C.clockFace) +
      circle(50, 50, 25, "none", { stroke: light(C.clockRim), "stroke-width": 2 }) +
      line(50, 28, 50, 22, shade(C.clockRim), 3) +
      line(72, 50, 78, 50, shade(C.clockRim), 3) +
      line(50, 72, 50, 78, shade(C.clockRim), 3) +
      line(28, 50, 22, 50, shade(C.clockRim), 3) +
      line(50, 50, 50, 30, P.ink, 4) +
      line(50, 50, 65, 50, P.ink, 4) +
      circle(50, 50, 4, P.ink),
  },
  {
    key: "lich",
    vi: "tờ lịch",
    en: "calendar",
    cat: "toy",
    draw: () => {
      const gx = [26, 42, 58];
      const gy = [48, 62, 76];
      const grid = gx
        .flatMap((x, ix) =>
          gy.map((y, iy) => rect(x, y, 12, 12, 3, ix === 1 && iy === 1 ? C.dot : "#F0E6D2")),
        )
        .join("");
      return (
        dropShadow(50, 92, 34) +
        rect(16, 18, 68, 66, 10, C.calBody) +
        rect(16, 18, 68, 22, 10, C.calHeader) +
        circle(32, 18, 3, "#DCEEFF") +
        circle(50, 18, 3, "#DCEEFF") +
        circle(68, 18, 3, "#DCEEFF") +
        grid
      );
    },
  },
  {
    key: "dong-xu",
    vi: "đồng xu",
    en: "coin",
    cat: "toy",
    draw: () =>
      dropShadow(50, 90, 28) +
      ball(50, 50, 28, C.coin) +
      circle(50, 50, 18, "none", { stroke: light(C.coin), "stroke-width": 3 }) +
      circle(50, 50, 10, shade(C.coin), { "fill-opacity": 0.5 }),
  },
  {
    key: "can-thang-bang",
    vi: "cân thăng bằng",
    en: "balance scale",
    cat: "toy",
    draw: () =>
      dropShadow(50, 92, 30) +
      rect(40, 80, 20, 8, 4, C.scaleStand) +
      rect(46, 30, 8, 52, 4, C.scaleStand) +
      rect(50, 30, 4, 52, 4, shade(C.scaleStand)) +
      rect(16, 26, 68, 6, 3, C.scaleStand) +
      circle(50, 29, 6, shade(C.scaleStand)) +
      line(22, 32, 22, 56, P.inkSoft, 2) +
      line(78, 32, 78, 56, P.inkSoft, 2) +
      ellipse(22, 58, 16, 7, C.scalePan) +
      ellipse(22, 60, 16, 4, shade(C.scalePan)) +
      ellipse(78, 58, 16, 7, C.scalePan) +
      ellipse(78, 60, 16, 4, shade(C.scalePan)),
  },
];
