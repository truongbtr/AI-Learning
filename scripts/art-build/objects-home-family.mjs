/**
 * Đợt 4 (pha 6d, việc 3) — nội thất & gia đình theo ESL VOC.BEDROOM_FURNITURE và chủ đề gia đình.
 *
 * Không import được `person()` từ objects.mjs (hàm nội bộ, không export) — nên `familyPerson()`
 * dưới đây là một bản viết lại rút gọn của cùng dáng người chibi (đầu to, thân nhỏ, tay ngắn,
 * tỷ lệ và vị trí mắt/miệng giống hệt `person()`), chỉ thêm tuỳ chọn tóc dài cho các vai nữ.
 */
import { blob, circle, dropShadow, ellipse, eye, g, light, path, rect, shade } from "./lib.mjs";

const C = {
  skin: "#F6C9A0",
  hairBoy: "#4A3A2E",
  hairGirl: "#3A2A1E",
  hairAunt: "#6B4A2E",
  hairUncle: "#2B2320",
  mouth: "#C4665A",
  wood: "#C08A4E",
  deskTop: "#E0A45E",
  closet: "#6E9AD6",
  closetDoor: "#8FB8E8",
  knob: "#FFD447",
  frame: "#FF8C42",
  frameArt: "#FFD447",
  hill: "#7BC67E",
  sky: "#DCEEFF",
  rug: "#F49AC1",
  rugBand: "#7C5CFF",
  table: "#C08A4E",
  tableTop: "#E0A45E",
  sofaBody: "#5BC0E8",
  sofaCushion: "#8FD8F0",
  tv: "#3A3A4A",
  tvScreen: "#2F80ED",
  mirrorFrame: "#FFD447",
  mirrorGlass: "#DCEEFF",
  windowFrame: "#FFFFFF",
  windowGlass: "#DCEEFF",
  curtain: "#E85D9C",
  door: "#C08A4E",
};

/** Same chibi proportions as objects.mjs `person()` (2.2-head figure), plus optional long hair. */
function familyPerson({
  hair,
  shirt,
  skin = C.skin,
  beard = false,
  tall = 1,
  longHair = false,
} = {}) {
  const headY = 40 - 10 * tall;
  let out =
    dropShadow(50, 92, 26) +
    rect(38, 66, 10, 22, 5, shade(shirt)) +
    rect(52, 66, 10, 22, 5, shade(shirt)) +
    path(`M50 40c-14 0-22 10-22 22v10h44V62c0-12-8-22-22-22Z`, shirt) +
    path(`M50 40c14 0 22 10 22 22v10H50Z`, shade(shirt)) +
    rect(20, 44, 10, 26, 5, shirt) +
    rect(70, 44, 10, 26, 5, shade(shirt)) +
    circle(50, headY + 8, 19, skin);
  if (longHair)
    out +=
      path(`M31 ${headY + 3}c-7 11-7 25 0 35h8c-4-11-4-24 0-35Z`, hair) +
      path(`M69 ${headY + 3}c7 11 7 25 0 35h-8c4-11 4-24 0-35Z`, shade(hair));
  out +=
    path(`M50 ${headY - 11}a19 19 0 0 1 19 19h-38a19 19 0 0 1 19-19Z`, hair) +
    (beard ? path(`M34 ${headY + 12}a16 12 0 0 0 32 0Z`, hair, { "fill-opacity": 0.85 }) : "") +
    eye(43, headY + 6, 4) +
    eye(57, headY + 6, 4) +
    path(`M44 ${headY + 16}a7 5 0 0 0 12 0Z`, C.mouth);
  return out;
}

export const OBJECTS_HOME_FAMILY = [
  // ---------------------------------------------------------------- A: bedroom furniture (ESL)
  {
    key: "tu-quan-ao",
    vi: "tủ quần áo",
    en: "closet",
    cat: "home",
    draw: () =>
      dropShadow(50, 92, 30) +
      blob(22, 12, 56, 78, 8, C.closet) +
      rect(49, 16, 2, 70, 1, shade(C.closet)) +
      rect(28, 20, 18, 5, 2, C.closetDoor, { "fill-opacity": 0.6 }) +
      circle(43, 54, 3, C.knob) +
      circle(57, 54, 3, shade(C.knob)),
  },
  {
    key: "ban-hoc",
    vi: "cái bàn học",
    en: "desk",
    cat: "home",
    draw: () =>
      dropShadow(50, 92, 34) +
      rect(28, 52, 4, 30, 2, C.wood, { "fill-opacity": 0.7 }) +
      rect(68, 52, 4, 30, 2, shade(C.wood), { "fill-opacity": 0.7 }) +
      rect(20, 54, 6, 32, 3, C.wood) +
      rect(74, 54, 6, 32, 3, shade(C.wood)) +
      rect(14, 40, 72, 12, 5, C.deskTop) +
      rect(50, 40, 36, 12, 5, shade(C.deskTop)) +
      rect(32, 52, 16, 12, 3, shade(C.wood)) +
      circle(40, 58, 2, C.knob),
  },
  {
    key: "khung-anh",
    vi: "khung ảnh",
    en: "picture",
    cat: "home",
    draw: () =>
      dropShadow(50, 92, 30) +
      blob(18, 14, 64, 72, 10, C.frame) +
      rect(28, 24, 44, 52, 6, C.sky) +
      circle(60, 38, 8, C.frameArt) +
      path(`M28 68c8-9 18-9 26-1 8-8 18-8 26 1v8H28Z`, C.hill),
  },
  {
    key: "tham-trai-san",
    vi: "tấm thảm",
    en: "rug",
    cat: "home",
    draw: () =>
      dropShadow(50, 90, 38, 9) +
      ellipse(50, 76, 40, 18, C.rug) +
      ellipse(50, 76, 28, 12, C.rugBand) +
      ellipse(50, 76, 16, 7, light(C.rug)) +
      ellipse(38, 68, 6, 3, light(C.rug), { "fill-opacity": 0.6 }),
  },
  {
    key: "cai-ban",
    vi: "cái bàn",
    en: "table",
    cat: "home",
    draw: () =>
      dropShadow(50, 92, 36) +
      rect(30, 58, 8, 28, 3, C.table) +
      rect(62, 58, 8, 28, 3, shade(C.table)) +
      ellipse(50, 56, 38, 14, C.tableTop) +
      ellipse(50, 52, 38, 14, light(C.tableTop), { "fill-opacity": 0.5 }),
  },
  // ---------------------------------------------------------------- B: other home furniture
  {
    key: "ghe-sofa",
    vi: "ghế sofa",
    en: "sofa",
    cat: "home",
    draw: () =>
      dropShadow(50, 92, 40, 10) +
      rect(16, 24, 68, 30, 10, shade(C.sofaBody)) +
      rect(8, 42, 14, 42, 8, C.sofaBody) +
      rect(78, 42, 14, 42, 8, C.sofaBody) +
      rect(14, 48, 72, 30, 10, C.sofaBody) +
      rect(20, 50, 28, 22, 8, C.sofaCushion) +
      rect(52, 50, 28, 22, 8, light(C.sofaCushion)),
  },
  {
    key: "cai-tivi",
    vi: "cái ti vi",
    en: "TV",
    cat: "home",
    draw: () =>
      dropShadow(50, 92, 30, 7) +
      rect(14, 22, 72, 44, 8, C.tv) +
      rect(50, 22, 36, 44, 8, shade(C.tv)) +
      rect(20, 28, 60, 32, 4, C.tvScreen) +
      rect(44, 66, 12, 10, 3, C.tv) +
      rect(30, 76, 40, 6, 3, shade(C.tv)),
  },
  {
    key: "guong-soi",
    vi: "cái gương",
    en: "mirror",
    cat: "home",
    draw: () =>
      dropShadow(50, 92, 26, 7) +
      ellipse(50, 46, 30, 38, C.mirrorFrame) +
      ellipse(50, 46, 22, 30, C.mirrorGlass) +
      ellipse(42, 34, 7, 11, light(C.mirrorGlass), { "fill-opacity": 0.7 }) +
      rect(46, 82, 8, 10, 3, shade(C.mirrorFrame)),
  },
  {
    key: "cua-so",
    vi: "cửa sổ",
    en: "window",
    cat: "home",
    draw: () =>
      dropShadow(50, 92, 34, 8) +
      path(`M18 14c-10 4-14 20-10 40h10Z`, C.curtain) +
      path(`M82 14c10 4 14 20 10 40H82Z`, shade(C.curtain)) +
      rect(18, 14, 64, 64, 8, C.windowFrame) +
      rect(24, 20, 52, 52, 4, C.windowGlass) +
      rect(48, 20, 4, 52, 0, C.windowFrame) +
      rect(24, 44, 52, 4, 0, C.windowFrame),
  },
  {
    key: "cua-ra-vao",
    vi: "cửa ra vào",
    en: "door",
    cat: "home",
    draw: () =>
      dropShadow(50, 92, 30, 7) +
      path(`M22 90V38a28 28 0 0 1 56 0v52Z`, C.door) +
      path(`M50 10a28 28 0 0 1 28 28v52H50Z`, shade(C.door)) +
      rect(30, 46, 16, 24, 4, light(C.door), { "fill-opacity": 0.5 }) +
      rect(54, 46, 16, 24, 4, shade(C.door), { "fill-opacity": 0.4 }) +
      circle(66, 66, 4, C.knob),
  },
  // ---------------------------------------------------------------- C: extended family
  {
    key: "anh-trai",
    vi: "anh trai",
    en: "brother",
    cat: "person",
    draw: () =>
      g(familyPerson({ hair: C.hairBoy, shirt: "#7BC67E", tall: 0.85 }), {
        transform: "translate(0 9) scale(0.9)",
      }),
  },
  {
    key: "chi-gai",
    vi: "chị gái",
    en: "sister",
    cat: "person",
    draw: () =>
      g(familyPerson({ hair: C.hairGirl, shirt: "#7C5CFF", tall: 0.85, longHair: true }), {
        transform: "translate(0 9) scale(0.9)",
      }),
  },
  {
    key: "co-di",
    vi: "cô",
    en: "aunt",
    cat: "person",
    draw: () => familyPerson({ hair: C.hairAunt, shirt: "#5BC0E8", tall: 1, longHair: true }),
  },
  {
    key: "chu-bac",
    vi: "chú",
    en: "uncle",
    cat: "person",
    draw: () => familyPerson({ hair: C.hairUncle, shirt: "#FF8C42", tall: 1, beard: true }),
  },
];
