/** Đợt 4 (pha 6d, việc 3) — đồ dùng học tập & hình khối theo ESL VOC.SCHOOL_OBJECTS / VOC.SHAPES. */
import { ball, circle, dropShadow, ellipse, g, light, line, path, rect, shade } from "./lib.mjs";

const C = {
  computerFrame: "#4F8FE0",
  computerScreen: "#BFE3FF",
  computerStand: "#8A93A6",
  crayon: "#FF7A59",
  crayonTip: "#FFD9C7",
  crayonBand: "#FFF3E6",
  brushWood: "#C08A4E",
  brushMetal: "#C9D6E6",
  brushHead: "#4CB8B0",
  metal: "#B9C4D6",
  penBody: "#7C5CFF",
  penCap: "#FF8C42",
  penNib: "#DCEEFF",
  ruler: "#FFC94D",
  scissorsBlade: "#C9D6E6",
  scissorsHandleA: "#FF8C42",
  scissorsHandleB: "#5BC0E8",
  glueBody: "#8E7CFF",
  glueCap: "#5BC0E8",
  glueLabel: "#FFF8EC",
  eraserA: "#F49AC1",
  eraserB: "#5BC0E8",
  notebookCover: "#5FBF75",
  notebookPage: "#FFF8EC",
  notebookLine: "#E8DCC4",
  calcBody: "#2F80ED",
  calcScreen: "#BFE3FF",
  calcKey: "#FFD447",
  globeOcean: "#4FA8E0",
  globeLand: "#7BC67E",
  globeStand: "#A9BDD3",
  shapeCircle: "#FF8C42",
  shapeDiamond: "#7C5CFF",
  shapeHeart: "#E85D9C",
  shapeOval: "#4FB8B0",
  shapeRect: "#4CAF7D",
  shapeSquare: "#2F80ED",
  shapeTriangle: "#F5A623",
};

export const OBJECTS_SCHOOL_SHAPES = [
  // ---------------------------------------------------------- A. đồ dùng học tập (VOC.SCHOOL_OBJECTS)
  {
    key: "may-tinh-ban",
    vi: "máy vi tính",
    en: "computer",
    cat: "school",
    draw: () =>
      dropShadow(50, 90, 30) +
      rect(18, 14, 64, 48, 8, C.computerFrame) +
      rect(50, 14, 32, 48, 8, shade(C.computerFrame)) +
      rect(26, 22, 48, 32, 5, C.computerScreen) +
      rect(30, 26, 14, 8, 3, light(C.computerFrame), { "fill-opacity": 0.6 }) +
      rect(44, 62, 12, 10, 4, C.computerStand) +
      rect(24, 72, 52, 8, 4, shade(C.computerStand)),
  },
  {
    key: "but-sap-mau",
    vi: "bút sáp màu",
    en: "crayon",
    cat: "school",
    draw: () =>
      dropShadow(50, 92, 20) +
      g(
        rect(-13, -32, 26, 54, 6, C.crayon) +
          rect(0, -32, 13, 54, 6, shade(C.crayon)) +
          path(`M-13 20C-13 30 -6 38 0 38C6 38 13 30 13 20Z`, C.crayonTip) +
          rect(-13, -6, 26, 10, 3, C.crayonBand),
        { transform: "translate(50 46) rotate(14)" },
      ),
  },
  {
    key: "co-ve",
    vi: "cọ vẽ",
    en: "paintbrush",
    cat: "school",
    draw: () =>
      dropShadow(50, 92, 20) +
      g(
        rect(-6, -6, 12, 58, 5, C.brushWood) +
          rect(0, -6, 6, 58, 5, shade(C.brushWood)) +
          rect(-7, -32, 14, 14, 4, C.brushMetal) +
          rect(0, -32, 7, 14, 4, shade(C.brushMetal)) +
          ellipse(0, -42, 13, 18, C.brushHead) +
          ellipse(4, -36, 8, 12, shade(C.brushHead)) +
          circle(-5, -50, 4, light(C.brushHead), { "fill-opacity": 0.85 }),
        { transform: "translate(50 50) rotate(-8)" },
      ),
  },
  {
    key: "ghim-giay",
    vi: "ghim kẹp giấy",
    en: "paper clip",
    cat: "school",
    draw: () =>
      dropShadow(50, 90, 22) +
      rect(26, 14, 34, 68, 17, "none", { stroke: C.metal, "stroke-width": 7 }) +
      rect(34, 14, 26, 50, 13, "none", { stroke: shade(C.metal), "stroke-width": 6 }) +
      line(32, 20, 44, 17, light(C.metal), 3),
  },
  {
    key: "cay-but-muc",
    vi: "cây bút mực",
    en: "pen",
    cat: "school",
    draw: () =>
      dropShadow(50, 92, 18) +
      g(
        rect(-7, -36, 14, 62, 6, C.penBody) +
          rect(0, -36, 7, 62, 6, shade(C.penBody)) +
          rect(-7, -14, 3, 18, 1.5, light(C.penBody)) +
          rect(-8, -40, 16, 14, 6, C.penCap) +
          path(`M-5 24C-5 32 -2 38 0 38C2 38 5 32 5 24Z`, C.penNib),
        { transform: "translate(50 48) rotate(9)" },
      ),
  },
  {
    key: "thuoc-ke",
    vi: "cây thước kẻ",
    en: "ruler",
    cat: "school",
    draw: () =>
      dropShadow(50, 94, 36, 8) +
      rect(8, 44, 84, 16, 6, C.ruler) +
      rect(50, 44, 42, 16, 6, shade(C.ruler)) +
      rect(14, 47, 18, 4, 2, light(C.ruler)) +
      line(24, 44, 24, 52, shade(C.ruler), 2) +
      line(40, 44, 40, 52, shade(C.ruler), 2) +
      line(56, 44, 56, 52, shade(C.ruler), 2) +
      line(72, 44, 72, 52, shade(C.ruler), 2),
  },
  {
    key: "keo-cat",
    vi: "cái kéo",
    en: "scissors",
    cat: "school",
    draw: () =>
      dropShadow(50, 92, 26) +
      g(rect(-4, -40, 8, 42, 4, C.scissorsBlade), { transform: "translate(46 46) rotate(-18)" }) +
      g(rect(-4, -40, 8, 42, 4, shade(C.scissorsBlade)), {
        transform: "translate(54 46) rotate(18)",
      }) +
      circle(50, 46, 5, shade(C.scissorsBlade)) +
      circle(38, 76, 13, "none", { stroke: C.scissorsHandleA, "stroke-width": 8 }) +
      circle(62, 76, 13, "none", { stroke: C.scissorsHandleB, "stroke-width": 8 }),
  },
  {
    key: "keo-dan",
    vi: "keo dán",
    en: "glue stick",
    cat: "school",
    draw: () =>
      dropShadow(50, 92, 18) +
      rect(34, 32, 32, 48, 10, C.glueBody) +
      rect(50, 32, 16, 48, 10, shade(C.glueBody)) +
      rect(34, 50, 32, 12, 4, C.glueLabel) +
      rect(32, 14, 36, 20, 9, C.glueCap) +
      rect(50, 14, 18, 20, 9, shade(C.glueCap)),
  },
  {
    key: "cuc-tay",
    vi: "cục tẩy",
    en: "eraser",
    cat: "school",
    draw: () =>
      dropShadow(50, 88, 22) +
      rect(24, 38, 52, 28, 8, C.eraserA) +
      rect(50, 38, 26, 28, 8, C.eraserB) +
      rect(28, 42, 16, 6, 3, light(C.eraserA), { "fill-opacity": 0.8 }),
  },
  {
    key: "quyen-vo",
    vi: "quyển vở",
    en: "notebook",
    cat: "school",
    draw: () =>
      dropShadow(50, 86, 32) +
      rect(16, 26, 68, 50, 6, C.notebookCover) +
      rect(50, 26, 34, 50, 6, shade(C.notebookCover)) +
      rect(22, 32, 56, 38, 4, C.notebookPage) +
      line(28, 42, 72, 42, C.notebookLine, 3) +
      line(28, 52, 72, 52, C.notebookLine, 3) +
      line(28, 62, 72, 62, C.notebookLine, 3),
  },
  {
    key: "may-tinh-cam-tay",
    vi: "máy tính cầm tay",
    en: "calculator",
    cat: "school",
    draw: () =>
      dropShadow(50, 92, 26) +
      rect(24, 14, 52, 70, 8, C.calcBody) +
      rect(50, 14, 26, 70, 8, shade(C.calcBody)) +
      rect(30, 22, 40, 16, 4, C.calcScreen) +
      rect(30, 46, 10, 10, 3, C.calcKey) +
      rect(45, 46, 10, 10, 3, C.calcKey) +
      rect(30, 60, 10, 10, 3, C.calcKey) +
      rect(45, 60, 10, 10, 3, C.calcKey),
  },
  {
    key: "qua-dia-cau",
    vi: "quả địa cầu",
    en: "globe",
    cat: "school",
    draw: () =>
      dropShadow(50, 92, 24) +
      rect(38, 82, 24, 8, 4, C.globeStand) +
      rect(46, 66, 8, 18, 3, C.globeStand) +
      ball(50, 50, 32, C.globeOcean) +
      circle(40, 42, 9, C.globeLand, { "fill-opacity": 0.92 }) +
      circle(62, 50, 8, C.globeLand, { "fill-opacity": 0.92 }) +
      circle(46, 66, 7, shade(C.globeLand), { "fill-opacity": 0.92 }),
  },
  // -------------------------------------------------------------------- B. hình khối cơ bản (VOC.SHAPES)
  {
    key: "hinh-tron",
    vi: "hình tròn",
    en: "circle",
    cat: "shape",
    draw: () => dropShadow(50, 90, 34) + ball(50, 50, 36, C.shapeCircle),
  },
  {
    key: "hinh-kim-cuong",
    vi: "hình thoi",
    en: "diamond",
    cat: "shape",
    draw: () =>
      dropShadow(50, 92, 32) +
      path(
        `M43.1 21.3Q50 14 56.9 21.3L77.1 42.7Q84 50 77.1 57.3L56.9 78.7Q50 86 43.1 78.7L22.9 57.3Q16 50 22.9 42.7Z`,
        C.shapeDiamond,
      ) +
      path(`M50 50L77.1 42.7Q84 50 77.1 57.3L56.9 78.7Q50 86 43.1 78.7Z`, shade(C.shapeDiamond)) +
      circle(36, 32, 7, light(C.shapeDiamond), { "fill-opacity": 0.85 }),
  },
  {
    key: "hinh-trai-tim",
    vi: "hình trái tim",
    en: "heart",
    cat: "shape",
    draw: () =>
      dropShadow(50, 92, 30) +
      path(
        `M50 84C22 62 12 42 12 27C12 12 26 5 38 12C44 16 48 22 50 28C52 22 56 16 62 12C74 5 88 12 88 27C88 42 78 62 50 84Z`,
        C.shapeHeart,
      ) +
      path(`M50 28C52 22 56 16 62 12C74 5 88 12 88 27C88 42 78 62 50 84Z`, shade(C.shapeHeart)) +
      circle(30, 26, 7, light(C.shapeHeart), { "fill-opacity": 0.85 }),
  },
  {
    key: "hinh-oval",
    vi: "hình oval",
    en: "oval",
    cat: "shape",
    draw: () =>
      dropShadow(50, 90, 34, 9) +
      ellipse(50, 50, 36, 24, C.shapeOval) +
      ellipse(58, 58, 20, 13, shade(C.shapeOval)) +
      circle(36, 38, 7, light(C.shapeOval), { "fill-opacity": 0.85 }),
  },
  {
    key: "hinh-chu-nhat",
    vi: "hình chữ nhật",
    en: "rectangle",
    cat: "shape",
    draw: () =>
      dropShadow(50, 90, 36, 8) +
      rect(12, 32, 76, 36, 10, C.shapeRect) +
      rect(50, 32, 38, 36, 10, shade(C.shapeRect)) +
      rect(18, 38, 20, 8, 4, light(C.shapeRect), { "fill-opacity": 0.8 }),
  },
  {
    key: "hinh-vuong-don",
    vi: "hình vuông",
    en: "square",
    cat: "shape",
    draw: () =>
      dropShadow(50, 90, 30) +
      rect(20, 20, 60, 60, 10, C.shapeSquare) +
      rect(50, 20, 30, 60, 10, shade(C.shapeSquare)) +
      rect(26, 26, 20, 10, 4, light(C.shapeSquare), { "fill-opacity": 0.8 }),
  },
  {
    key: "hinh-tam-giac-don",
    vi: "hình tam giác",
    en: "triangle",
    cat: "shape",
    draw: () =>
      dropShadow(50, 92, 32) +
      path(
        `M46.72 22.18Q50 16 53.28 22.18L80.72 73.82Q84 80 77 80L23 80Q16 80 19.28 73.82Z`,
        C.shapeTriangle,
      ) +
      path(`M50 55L80.72 73.82Q84 80 77 80L50 80Z`, shade(C.shapeTriangle)) +
      circle(40, 38, 7, light(C.shapeTriangle), { "fill-opacity": 0.85 }),
  },
];
