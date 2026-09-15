/** Đợt 4 (pha 6d, việc 3) — đồ chơi & sân chơi theo ESL VOC.TOYS / VOC.PLAYGROUND. */
import {
  ball,
  circle,
  dropShadow,
  ellipse,
  eye,
  g,
  leaf,
  light,
  line,
  PALETTE as P,
  path,
  rect,
  shade,
} from "./lib.mjs";

const C = {
  dino: "#6EBF7B",
  dinoBelly: "#D9F0D2",
  scooter: "#2F80ED",
  scooterAccent: "#FFD447",
  skate: "#FF8C42",
  wheel: "#6B6B7B",
  controller: "#7C5CFF",
  btnA: "#FFD447",
  btnB: "#34C759",
  btnC: "#FF8C42",
  blockA: "#FF8C42",
  blockB: "#5BC0E8",
  blockC: "#7BC67E",
  yoyo: "#E85D9C",
  rope: "#5BC0E8",
  ropeHandle: "#FF8C42",
  balloon: "#C77DFF",
  dice: "#FFFFFF",
  abacusFrame: "#C08A4E",
  abacusPanel: "#FFF4DE",
  beadA: "#E85D9C",
  beadB: "#5BC0E8",
  beadC: "#FFD447",
  sandFrame: "#C08A4E",
  sand: "#FFE9B3",
  seesawPlank: "#5BC0E8",
  seesawBase: "#C08A4E",
  ladder: "#C9D6E6",
  slide: "#FF8C42",
  swingFrame: "#C08A4E",
  swingSeat: "#FFD447",
};

export const OBJECTS_TOYS_PLAYGROUND = [
  // ---------------------------------------------------------------- Phần A: đồ chơi (VOC.TOYS)
  {
    key: "khung-long",
    vi: "con khủng long",
    en: "dinosaur",
    cat: "toy",
    draw: () =>
      dropShadow(50, 92, 30) +
      path(`M18 76Q8 74 8 62Q16 66 28 62Z`, shade(C.dino)) +
      rect(28, 70, 16, 22, 8, shade(C.dino)) +
      rect(50, 70, 16, 22, 8, shade(C.dino)) +
      ellipse(48, 54, 26, 24, C.dino) +
      ellipse(44, 66, 15, 10, C.dinoBelly) +
      path(`M58 40Q72 18 82 14Q86 24 74 34Q65 44 58 48Z`, C.dino) +
      circle(80, 16, 12, C.dino) +
      leaf(52, 44, 12, shade(C.dino), 20) +
      leaf(60, 34, 11, shade(C.dino), 35) +
      leaf(68, 24, 10, shade(C.dino), 50) +
      ellipse(40, 46, 9, 6, light(C.dino), { "fill-opacity": 0.85 }) +
      eye(84, 14, 3.4),
  },
  {
    key: "xe-truot-scooter",
    vi: "xe trượt scooter",
    en: "scooter",
    cat: "toy",
    draw: () =>
      dropShadow(50, 92, 30) +
      rect(58, 16, 8, 54, 4, C.scooter) +
      rect(62, 16, 4, 54, 4, shade(C.scooter)) +
      rect(40, 12, 34, 8, 4, C.scooter) +
      circle(40, 16, 6, C.scooterAccent) +
      circle(74, 16, 6, C.scooterAccent) +
      path(`M18 78 62 70 66 80 20 88Z`, C.scooter) +
      path(`M62 70 66 80 40 84Z`, shade(C.scooter)) +
      circle(26, 88, 8, C.wheel) +
      circle(58, 80, 8, C.wheel) +
      circle(26, 88, 3, light(C.wheel)) +
      circle(58, 80, 3, light(C.wheel)),
  },
  {
    key: "van-truot",
    vi: "ván trượt",
    en: "skateboard",
    cat: "toy",
    draw: () =>
      dropShadow(50, 88, 34) +
      rect(10, 48, 80, 14, 7, C.skate) +
      rect(50, 48, 40, 14, 7, shade(C.skate)) +
      rect(16, 50, 22, 4, 2, light(C.skate), { "fill-opacity": 0.8 }) +
      circle(22, 68, 6, C.wheel) +
      circle(36, 68, 6, C.wheel) +
      circle(64, 68, 6, C.wheel) +
      circle(78, 68, 6, C.wheel),
  },
  {
    key: "may-choi-dien-tu",
    vi: "máy chơi điện tử",
    en: "video game controller",
    cat: "toy",
    draw: () =>
      dropShadow(50, 88, 32) +
      rect(24, 34, 52, 30, 15, C.controller) +
      rect(50, 34, 26, 30, 15, shade(C.controller)) +
      circle(26, 62, 14, C.controller) +
      circle(74, 62, 14, C.controller) +
      circle(26, 66, 5, shade(C.controller)) +
      circle(74, 66, 5, shade(C.controller)) +
      rect(32, 44, 5, 14, 2.5, light(C.controller)) +
      rect(36, 48, 14, 5, 2.5, light(C.controller)) +
      circle(66, 44, 4.5, C.btnA) +
      circle(74, 50, 4.5, C.btnB) +
      circle(70, 58, 4.5, C.btnC),
  },
  {
    key: "khoi-xep-hinh",
    vi: "khối xếp hình",
    en: "building blocks",
    cat: "toy",
    draw: () =>
      dropShadow(50, 90, 32) +
      rect(16, 56, 28, 28, 6, C.blockA) +
      rect(34, 56, 10, 28, 6, shade(C.blockA)) +
      rect(56, 56, 28, 28, 6, C.blockB) +
      rect(74, 56, 10, 28, 6, shade(C.blockB)) +
      rect(34, 28, 32, 30, 6, C.blockC) +
      rect(52, 28, 14, 30, 6, shade(C.blockC)) +
      rect(40, 34, 12, 8, 4, light(C.blockC), { "fill-opacity": 0.85 }),
  },
  {
    key: "con-quay-yoyo",
    vi: "con quay yoyo",
    en: "yo-yo",
    cat: "toy",
    draw: () =>
      dropShadow(50, 92, 24) +
      circle(50, 30, 20, C.yoyo) +
      circle(42, 24, 6, light(C.yoyo), { "fill-opacity": 0.85 }) +
      rect(44, 30, 12, 40, 5, shade(C.yoyo)) +
      circle(50, 70, 20, C.yoyo) +
      circle(42, 64, 6, light(C.yoyo), { "fill-opacity": 0.85 }) +
      line(58, 14, 70, 4, P.inkSoft, 3),
  },
  {
    key: "day-nhay",
    vi: "dây nhảy",
    en: "jump rope",
    cat: "toy",
    draw: () =>
      dropShadow(50, 92, 30) +
      path(`M22 20Q10 60 50 82Q90 60 78 20`, "none", {
        stroke: C.rope,
        "stroke-width": 8,
        fill: "none",
        "stroke-linecap": "round",
      }) +
      path(`M22 20Q10 60 50 82Q90 60 78 20`, "none", {
        stroke: light(C.rope),
        "stroke-width": 3,
        fill: "none",
        "stroke-linecap": "round",
        "stroke-opacity": 0.6,
      }) +
      circle(22, 16, 9, C.ropeHandle) +
      circle(78, 16, 9, C.ropeHandle) +
      rect(19, 8, 6, 16, 3, shade(C.ropeHandle)) +
      rect(75, 8, 6, 16, 3, shade(C.ropeHandle)),
  },
  {
    key: "bong-bay",
    vi: "bóng bay",
    en: "balloon",
    cat: "toy",
    draw: () =>
      dropShadow(50, 92, 18) +
      ball(50, 42, 28, C.balloon) +
      path(`M44 68 50 78 56 68Z`, shade(C.balloon)) +
      path(`M50 80Q56 88 50 92Q44 88 50 80`, "none", {
        stroke: P.inkSoft,
        "stroke-width": 2.5,
        fill: "none",
      }),
  },
  {
    key: "xuc-xac",
    vi: "xúc xắc",
    en: "dice",
    cat: "toy",
    draw: () =>
      dropShadow(50, 90, 28) +
      rect(20, 20, 60, 60, 14, C.dice) +
      rect(50, 20, 30, 60, 14, shade(C.dice)) +
      rect(26, 26, 20, 14, 6, light(C.dice), { "fill-opacity": 0.7 }) +
      circle(32, 32, 5, P.ink) +
      circle(68, 32, 5, P.ink) +
      circle(50, 50, 5, P.ink) +
      circle(32, 68, 5, P.ink) +
      circle(68, 68, 5, P.ink),
  },
  {
    key: "ban-tinh",
    vi: "bàn tính",
    en: "abacus",
    cat: "toy",
    draw: () =>
      dropShadow(50, 92, 30) +
      rect(14, 14, 72, 72, 10, C.abacusFrame) +
      rect(50, 14, 36, 72, 10, shade(C.abacusFrame)) +
      rect(22, 22, 56, 56, 6, C.abacusPanel) +
      line(22, 40, 78, 40, C.abacusFrame, 3) +
      line(22, 64, 78, 64, C.abacusFrame, 3) +
      circle(34, 40, 6, C.beadA) +
      circle(50, 40, 6, C.beadB) +
      circle(66, 40, 6, C.beadC) +
      circle(34, 64, 6, C.beadB) +
      circle(50, 64, 6, C.beadC) +
      circle(66, 64, 6, C.beadA),
  },
  // ---------------------------------------------------------------- Phần B: sân chơi (VOC.PLAYGROUND)
  {
    key: "ho-cat",
    vi: "hố cát",
    en: "sandbox",
    cat: "place",
    draw: () =>
      dropShadow(50, 90, 34) +
      rect(12, 40, 76, 44, 10, C.sandFrame) +
      rect(50, 40, 38, 44, 10, shade(C.sandFrame)) +
      rect(20, 46, 60, 30, 8, C.sand) +
      ellipse(50, 60, 26, 12, light(C.sand), { "fill-opacity": 0.8 }) +
      rect(20, 46, 60, 6, 4, shade(C.sand), { "fill-opacity": 0.5 }),
  },
  {
    key: "bap-benh",
    vi: "bập bênh",
    en: "seesaw",
    cat: "place",
    draw: () =>
      dropShadow(50, 92, 32) +
      path(`M40 90h20l-4-34h-12Z`, C.seesawBase) +
      path(`M50 56h6l4 34h-10Z`, shade(C.seesawBase)) +
      g(rect(-38, -6, 76, 12, 6, C.seesawPlank) + rect(0, -6, 38, 12, 6, shade(C.seesawPlank)), {
        transform: "translate(50 56) rotate(-18)",
      }) +
      circle(15, 68, 6, C.seesawBase) +
      circle(85, 40, 6, C.seesawBase),
  },
  {
    key: "cau-truot",
    vi: "cầu trượt",
    en: "slide",
    cat: "place",
    draw: () =>
      dropShadow(50, 92, 34) +
      rect(20, 26, 26, 10, 5, C.ladder) +
      line(26, 36, 26, 88, C.ladder, 6) +
      line(40, 36, 40, 88, C.ladder, 6) +
      line(24, 54, 42, 54, C.ladder, 4) +
      line(24, 72, 42, 72, C.ladder, 4) +
      g(rect(-8, -32, 16, 64, 8, C.slide) + rect(0, -32, 8, 64, 8, shade(C.slide)), {
        transform: "translate(62 54) rotate(28)",
      }) +
      ellipse(80, 86, 14, 7, C.slide) +
      ellipse(80, 89, 14, 4, shade(C.slide), { "fill-opacity": 0.7 }),
  },
  {
    key: "xich-du",
    vi: "xích đu",
    en: "swing",
    cat: "place",
    draw: () =>
      dropShadow(50, 92, 30) +
      path(`M20 88 46 16h8L34 88Z`, C.swingFrame) +
      path(`M80 88 54 16h-8l30 72Z`, shade(C.swingFrame)) +
      rect(44, 14, 12, 8, 4, shade(C.swingFrame)) +
      line(46, 22, 38, 70, C.swingFrame, 3) +
      line(54, 22, 62, 70, C.swingFrame, 3) +
      rect(34, 70, 32, 10, 5, C.swingSeat) +
      rect(50, 70, 16, 10, 5, shade(C.swingSeat)),
  },
];
