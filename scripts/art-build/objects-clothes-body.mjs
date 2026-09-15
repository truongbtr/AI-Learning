/**
 * Đợt 4 (pha 6d, việc 3) — quần áo & bộ phận cơ thể theo ESL VOC.CLOTHES / VOC.BODY.
 *
 * Từ vựng khớp `content/exercises/esl/VOC.CLOTHES.pack.json` (boots, glasses, jacket, pants,
 * shorts, skirt, sneakers, sweater — cộng hai cái đã có sẵn trong objects.mjs: cai-ao/doi-giay/
 * cai-mu) và `VOC.BODY.pack.json` (arm, ear, eyes, face, foot, hand, leg, mouth, nose, tooth,
 * tongue, hair, head — cộng knee/elbow/finger để bài luyện có thêm lựa chọn nhiễu).
 */
import {
  ball,
  blob,
  circle,
  dropShadow,
  ellipse,
  eye,
  g,
  light,
  line,
  PALETTE as P,
  path,
  rect,
  shade,
} from "./lib.mjs";

const C = {
  boot: "#7C5CFF",
  lens: "#5BC0E8",
  frame: "#5A5A68",
  jacket: "#2F80ED",
  zip: "#FFD447",
  pants: "#4E79B8",
  shorts: "#FF8C42",
  skirt: "#E85D9C",
  sneaker: "#34C759",
  sweater: "#E8604C",
  skin: "#F6C9A0",
  hair: "#4A3A2E",
  lip: "#D9749F",
  tongue: "#E8607A",
};

export const OBJECTS_CLOTHES_BODY = [
  // ---------------------------------------------------------------- clothes (VOC.CLOTHES)
  {
    key: "doi-ung",
    vi: "đôi ủng",
    en: "boots",
    cat: "clothes",
    draw: () =>
      dropShadow(50, 90, 34) +
      blob(10, 18, 22, 42, 9, C.boot) +
      path(`M8 54c0-6 4-10 10-10h14v18H12a4 4 0 0 1-4-4Z`, C.boot) +
      rect(6, 66, 30, 10, 5, P.white) +
      rect(58, 18, 22, 42, 9, shade(C.boot)) +
      path(`M56 54c0-6 4-10 10-10h14v18H60a4 4 0 0 1-4-4Z`, shade(C.boot)) +
      rect(54, 66, 30, 10, 5, P.white),
  },
  {
    key: "cai-kinh",
    vi: "cái kính",
    en: "glasses",
    cat: "clothes",
    draw: () =>
      dropShadow(50, 80, 28, 7) +
      circle(32, 48, 17, C.lens) +
      circle(32, 48, 17, "none", { stroke: C.frame, "stroke-width": 4 }) +
      circle(68, 48, 17, C.lens) +
      circle(68, 48, 17, "none", { stroke: C.frame, "stroke-width": 4 }) +
      path(`M49 46q7-6 14 0`, "none", {
        stroke: C.frame,
        "stroke-width": 4,
        "stroke-linecap": "round",
      }) +
      line(15, 42, 22, 36, C.frame, 4) +
      line(78, 42, 85, 36, C.frame, 4),
  },
  {
    key: "ao-khoac",
    vi: "áo khoác",
    en: "jacket",
    cat: "clothes",
    draw: () =>
      dropShadow(50, 90, 32) +
      path(
        `M24 26 36 18h28l12 8 14 16-13 11-5-7v46a4 4 0 0 1-4 4H32a4 4 0 0 1-4-4V56l-5 7-13-11Z`,
        C.jacket,
      ) +
      path(`M50 18h14l12 8 14 16-13 11-5-7v46a4 4 0 0 1-4 4H50Z`, shade(C.jacket)) +
      path(`M36 18a14 9 0 0 0 28 0`, "none", {
        stroke: light(C.jacket),
        "stroke-width": 4,
        fill: "none",
      }) +
      line(50, 30, 50, 84, C.zip, 3),
  },
  {
    key: "cai-quan",
    vi: "cái quần",
    en: "pants",
    cat: "clothes",
    draw: () =>
      dropShadow(50, 92, 30) +
      rect(28, 16, 44, 16, 8, C.pants) +
      rect(30, 30, 17, 54, 8, C.pants) +
      rect(53, 30, 17, 54, 8, shade(C.pants)) +
      rect(30, 30, 8, 20, 6, light(C.pants), { "fill-opacity": 0.7 }),
  },
  {
    key: "quan-short",
    vi: "quần short",
    en: "shorts",
    cat: "clothes",
    draw: () =>
      dropShadow(50, 78, 32) +
      rect(26, 20, 48, 16, 8, C.shorts) +
      path(`M28 36h20v28a6 6 0 0 1-6 6h-8a6 6 0 0 1-6-6Z`, C.shorts) +
      path(`M52 36h20v28a6 6 0 0 1-6 6h-8a6 6 0 0 1-6-6Z`, shade(C.shorts)) +
      rect(26, 20, 10, 16, 6, light(C.shorts), { "fill-opacity": 0.7 }),
  },
  {
    key: "vay",
    vi: "cái váy",
    en: "skirt",
    cat: "clothes",
    draw: () =>
      dropShadow(50, 88, 34) +
      rect(34, 18, 32, 14, 7, C.skirt) +
      path(`M32 30h36l14 46a6 6 0 0 1-6 8H24a6 6 0 0 1-6-8Z`, C.skirt) +
      path(`M50 30h18l14 46a6 6 0 0 1-6 8H50Z`, shade(C.skirt)) +
      path(`M34 18a16 7 0 0 0 32 0`, "none", {
        stroke: light(C.skirt),
        "stroke-width": 3,
        fill: "none",
      }),
  },
  {
    key: "giay-the-thao",
    vi: "giày thể thao",
    en: "sneakers",
    cat: "clothes",
    draw: () =>
      dropShadow(50, 84, 34) +
      path(`M10 58c0-8 6-12 14-12l10 8h12v14H14a4 4 0 0 1-4-4Z`, C.sneaker) +
      path(`M52 58c0-8 6-12 14-12l10 8h12v14H56a4 4 0 0 1-4-4Z`, shade(C.sneaker)) +
      rect(10, 66, 36, 9, 4, P.white) +
      rect(52, 66, 36, 9, 4, P.white),
  },
  {
    key: "ao-len",
    vi: "áo len",
    en: "sweater",
    cat: "clothes",
    draw: () =>
      dropShadow(50, 90, 34) +
      path(
        `M22 30 36 20h28l14 10 12 16-13 10-5-6v44a5 5 0 0 1-5 5H35a5 5 0 0 1-5-5V60l-5 6-13-10Z`,
        C.sweater,
      ) +
      path(`M50 20h14l14 10 12 16-13 10-5-6v44a5 5 0 0 1-5 5H50Z`, shade(C.sweater)) +
      circle(50, 28, 9, light(C.sweater)) +
      rect(30, 48, 40, 6, 3, light(C.sweater), { "fill-opacity": 0.85 }) +
      rect(30, 60, 40, 6, 3, light(C.sweater), { "fill-opacity": 0.85 }),
  },
  // ---------------------------------------------------------------- body parts (VOC.BODY)
  {
    key: "canh-tay",
    vi: "cánh tay",
    en: "arm",
    cat: "body",
    draw: () =>
      dropShadow(56, 90, 24, 6) +
      g(
        rect(-11, -40, 22, 80, 11, C.skin) +
          rect(0, -40, 11, 80, 11, shade(C.skin)) +
          circle(-4, -32, 5, light(C.skin), { "fill-opacity": 0.8 }),
        { transform: "translate(50 50) rotate(12)" },
      ),
  },
  {
    key: "tai",
    vi: "cái tai",
    en: "ear",
    cat: "body",
    draw: () =>
      dropShadow(50, 84, 20, 6) +
      g(
        ellipse(0, 0, 18, 26, C.skin) +
          ellipse(3, 4, 8, 15, shade(C.skin)) +
          circle(-5, -12, 4, light(C.skin), { "fill-opacity": 0.8 }),
        { transform: "translate(50 46) rotate(12)" },
      ),
  },
  {
    key: "mat",
    vi: "đôi mắt",
    en: "eyes",
    cat: "body",
    draw: () => dropShadow(50, 78, 30, 8) + eye(35, 50, 15) + eye(65, 50, 15),
  },
  {
    key: "khuon-mat",
    vi: "khuôn mặt",
    en: "face",
    cat: "body",
    draw: () =>
      dropShadow(50, 90, 32, 8) +
      ball(50, 50, 34, C.skin) +
      eye(38, 46, 6) +
      eye(62, 46, 6) +
      path(`M38 64q12 12 24 0`, "none", {
        stroke: C.lip,
        "stroke-width": 4,
        "stroke-linecap": "round",
        fill: "none",
      }),
  },
  {
    key: "ban-chan",
    vi: "bàn chân",
    en: "foot",
    cat: "body",
    draw: () =>
      dropShadow(50, 92, 34, 9) +
      ellipse(46, 60, 30, 20, C.skin) +
      ellipse(50, 66, 30, 16, shade(C.skin)) +
      circle(74, 40, 6, C.skin) +
      circle(82, 42, 5.5, C.skin) +
      circle(89, 46, 5, C.skin) +
      circle(94, 51, 4.5, C.skin) +
      circle(97, 57, 4, C.skin),
  },
  {
    key: "ban-tay",
    vi: "bàn tay",
    en: "hand",
    cat: "body",
    draw: () =>
      dropShadow(50, 88, 28, 8) +
      circle(50, 58, 26, C.skin) +
      path(`M50 32a26 26 0 0 1 26 26H50Z`, shade(C.skin)) +
      g(rect(-5, -34, 10, 26, 5, C.skin) + rect(0, -34, 5, 26, 5, shade(C.skin)), {
        transform: "translate(30 58) rotate(-20)",
      }) +
      g(rect(-5, -36, 10, 28, 5, C.skin) + rect(0, -36, 5, 28, 5, shade(C.skin)), {
        transform: "translate(42 40) rotate(-8)",
      }) +
      g(
        rect(-5, -38, 10, 30, 5, C.skin) +
          rect(0, -38, 5, 30, 5, light(C.skin), { "fill-opacity": 0.5 }),
        {
          transform: "translate(56 36)",
        },
      ) +
      g(rect(-5, -36, 10, 28, 5, shade(C.skin)), { transform: "translate(70 40) rotate(8)" }) +
      g(rect(-5, -30, 10, 22, 5, shade(C.skin)), { transform: "translate(80 54) rotate(20)" }),
  },
  {
    key: "chan",
    vi: "cái chân",
    en: "leg",
    cat: "body",
    draw: () =>
      dropShadow(50, 92, 22, 6) +
      g(
        rect(-13, -46, 26, 92, 13, C.skin) +
          rect(0, -46, 13, 92, 13, shade(C.skin)) +
          circle(-5, -38, 6, light(C.skin), { "fill-opacity": 0.8 }),
        { transform: "translate(50 50) rotate(6)" },
      ),
  },
  {
    key: "mieng",
    vi: "cái miệng",
    en: "mouth",
    cat: "body",
    draw: () =>
      dropShadow(50, 76, 30, 8) +
      path(`M18 26q32 44 64 0`, "none", {
        stroke: shade(C.lip),
        "stroke-width": 14,
        "stroke-linecap": "round",
        fill: "none",
      }) +
      path(`M18 22q32 40 64 0`, "none", {
        stroke: C.lip,
        "stroke-width": 10,
        "stroke-linecap": "round",
        fill: "none",
      }) +
      path(`M26 18q24 24 48 0`, "none", {
        stroke: light(C.lip),
        "stroke-width": 4,
        "stroke-linecap": "round",
        fill: "none",
        "stroke-opacity": 0.6,
      }),
  },
  {
    key: "mui",
    vi: "cái mũi",
    en: "nose",
    cat: "body",
    draw: () =>
      dropShadow(50, 80, 20, 5) +
      path(`M50 20c10 16 16 28 16 38a16 16 0 0 1-32 0c0-10 6-22 16-38Z`, C.skin) +
      path(
        `M50 20c10 16 16 28 16 38a16 16 0 0 1-8 14c4-6 6-13 6-20 0-10-6-22-14-32Z`,
        shade(C.skin),
      ) +
      circle(40, 66, 3.5, shade(C.skin), { "fill-opacity": 0.6 }) +
      circle(60, 66, 3.5, shade(C.skin), { "fill-opacity": 0.6 }) +
      circle(42, 34, 4, light(C.skin), { "fill-opacity": 0.8 }),
  },
  {
    key: "rang",
    vi: "hàm răng",
    en: "tooth",
    cat: "body",
    draw: () => {
      let teeth = "";
      for (let row = 0; row < 2; row++)
        for (let col = 0; col < 4; col++)
          teeth += rect(14 + col * 19, 28 + row * 24, 16, 20, 5, row === 0 ? P.white : "#ECEFF4");
      return dropShadow(50, 86, 34, 8) + teeth;
    },
  },
  {
    key: "luoi",
    vi: "cái lưỡi",
    en: "tongue",
    cat: "body",
    draw: () =>
      dropShadow(50, 88, 24, 6) +
      ellipse(50, 54, 20, 30, C.tongue) +
      ellipse(56, 66, 14, 20, shade(C.tongue), { "fill-opacity": 0.5 }) +
      circle(42, 30, 8, light(C.tongue), { "fill-opacity": 0.6 }),
  },
  {
    key: "mai-toc",
    vi: "mái tóc",
    en: "hair",
    cat: "body",
    draw: () =>
      dropShadow(50, 86, 34, 9) +
      ellipse(50, 56, 36, 22, C.hair) +
      circle(28, 42, 20, C.hair) +
      circle(50, 32, 24, C.hair) +
      circle(72, 42, 20, C.hair) +
      circle(38, 34, 10, light(C.hair), { "fill-opacity": 0.5 }) +
      ellipse(50, 64, 34, 12, shade(C.hair)),
  },
  {
    key: "dau",
    vi: "cái đầu",
    en: "head",
    cat: "body",
    draw: () =>
      dropShadow(50, 92, 32, 8) +
      ball(50, 58, 30, C.skin) +
      circle(28, 26, 16, C.hair) +
      circle(50, 18, 18, C.hair) +
      circle(72, 26, 16, C.hair) +
      eye(38, 58, 6) +
      eye(62, 58, 6) +
      path(`M38 76q12 10 24 0`, "none", {
        stroke: C.lip,
        "stroke-width": 4,
        "stroke-linecap": "round",
        fill: "none",
      }),
  },
  {
    key: "dau-goi",
    vi: "đầu gối",
    en: "knee",
    cat: "body",
    draw: () =>
      dropShadow(50, 84, 26, 7) +
      ball(50, 52, 28, C.skin) +
      path(`M30 52q20 14 40 0`, "none", {
        stroke: shade(C.skin),
        "stroke-width": 3,
        fill: "none",
        "stroke-opacity": 0.6,
      }),
  },
  {
    key: "khuyu-tay",
    vi: "khuỷu tay",
    en: "elbow",
    cat: "body",
    draw: () =>
      dropShadow(50, 82, 22, 6) +
      ellipse(50, 52, 24, 20, C.skin) +
      ellipse(46, 46, 16, 12, light(C.skin), { "fill-opacity": 0.5 }) +
      ellipse(56, 60, 14, 8, shade(C.skin), { "fill-opacity": 0.4 }) +
      path(`M32 52q18 10 36 0`, "none", {
        stroke: shade(C.skin),
        "stroke-width": 3,
        fill: "none",
        "stroke-opacity": 0.6,
      }),
  },
  {
    key: "ngon-tay",
    vi: "ngón tay",
    en: "finger",
    cat: "body",
    draw: () =>
      dropShadow(50, 92, 14, 4) +
      rect(38, 14, 24, 74, 12, C.skin) +
      rect(50, 14, 12, 74, 12, shade(C.skin)) +
      rect(41, 20, 18, 12, 6, light(C.skin), { "fill-opacity": 0.8 }) +
      rect(41, 20, 18, 4, 2, "#FFFFFF", { "fill-opacity": 0.7 }),
  },
];
