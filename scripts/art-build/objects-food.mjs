/** Đợt 4 (pha 6d, việc 3) — trái cây & món ăn theo đúng từ vựng ESL VOC.FRUITS / VOC.FOOD. */
import { ball, circle, dropShadow, ellipse, leaf, light, line, path, rect, shade } from "./lib.mjs";

const C = {
  cherry: "#D6483F",
  coconut: "#B98A5E",
  coconutDot: "#7A5A3A",
  grape: "#8B5FBF",
  leaf: "#7BC67E",
  leafDark: "#5FA968",
  stem: "#8A6B3C",
  lemon: "#F2C94C",
  mango: "#FF9F45",
  mangoBlush: "#F2704A",
  peach: "#FFB199",
  pear: "#C6D66B",
  strawberry: "#E8544F",
  seed: "#F2C94C",
  broccoliStem: "#A8D48A",
  broccoliHead: "#4F9A5C",
  carrot: "#FF9540",
  bowlBlue: "#DCEEFF",
  bowlBlueDark: "#B9DCFF",
  milk: "#FFFDF6",
  loopA: "#FF9540",
  loopB: "#5BC0E8",
  loopC: "#F2C94C",
  chicken: "#C98A4E",
  bone: "#FFF4DE",
  onion: "#C9A0D9",
  plateWhite: "#FFFDF6",
  pastaBase: "#F2C94C",
  sauce: "#E8604C",
  potato: "#C9A06C",
  rice: "#FFFDF6",
  tomatoRed: "#E8544F",
  soup: "#FFB74D",
  steam: "#E6D8C3",
  cone: "#C98A4E",
  iceCream: "#F49AC1",
  crust: "#F2C94C",
  cheese: "#FFD447",
  pepperoni: "#D6483F",
  bunTop: "#E0A45E",
  bunBottom: "#D9924E",
  lettuce: "#7BC67E",
  patty: "#8A5A3C",
  cheeseSlice: "#FFD447",
  donutBase: "#C98A5E",
  sprinkleA: "#E85D9C",
  sprinkleB: "#5BC0E8",
  wrapper: "#F49AC1",
  frosting: "#FFE3EF",
  cherryTop: "#D6483F",
};

/** Every entry: key, Vietnamese label, English label, category, drawing. */
export const OBJECTS_FOOD = [
  {
    key: "qua-anh-dao",
    vi: "quả anh đào",
    en: "cherries",
    cat: "food",
    draw: () =>
      dropShadow(50, 90, 26) +
      line(50, 18, 38, 46, C.stem, 3) +
      line(50, 18, 64, 44, C.stem, 3) +
      leaf(52, 18, 16, C.leaf, -20) +
      ball(38, 60, 17, C.cherry) +
      ball(64, 58, 18, C.cherry),
  },
  {
    key: "qua-dua",
    vi: "quả dừa",
    en: "coconut",
    cat: "food",
    draw: () =>
      dropShadow(50, 90, 30) +
      ellipse(50, 58, 32, 30, C.coconut) +
      path(`M50 28c17 0 32 13 32 30a32 30 0 0 1-32 30Z`, shade(C.coconut)) +
      ellipse(38, 40, 10, 7, light(C.coconut), { "fill-opacity": 0.85 }) +
      circle(42, 32, 3, C.coconutDot) +
      circle(50, 28, 3, C.coconutDot) +
      circle(58, 32, 3, C.coconutDot),
  },
  {
    key: "chum-nho",
    vi: "chùm nho",
    en: "grapes",
    cat: "food",
    draw: () =>
      dropShadow(50, 90, 28) +
      leaf(50, 26, 18, C.leaf, 0) +
      line(50, 26, 50, 36, C.stem, 3) +
      ball(36, 42, 12, C.grape) +
      ball(50, 40, 12, C.grape) +
      ball(64, 42, 12, C.grape) +
      ball(43, 62, 12, C.grape) +
      ball(57, 62, 12, C.grape),
  },
  {
    key: "qua-chanh",
    vi: "quả chanh",
    en: "lemon",
    cat: "food",
    draw: () =>
      dropShadow(50, 90, 28) +
      path(`M50 24c16 0 26 16 26 34s-10 34-26 34-26-16-26-34 10-34 26-34Z`, C.lemon) +
      path(`M50 24c16 0 26 16 26 34s-10 34-26 34Z`, shade(C.lemon)) +
      ellipse(40, 46, 10, 14, light(C.lemon), { "fill-opacity": 0.85 }) +
      ellipse(50, 25, 4, 3, shade(C.lemon)) +
      ellipse(50, 91, 4, 3, shade(C.lemon)),
  },
  {
    key: "qua-xoai",
    vi: "quả xoài",
    en: "mango",
    cat: "food",
    draw: () =>
      dropShadow(50, 90, 26) +
      path(`M46 22c18-4 30 8 28 26-2 20-14 38-30 42-14-4-22-18-22-34 0-16 8-30 24-34Z`, C.mango) +
      path(`M46 22c18-4 30 8 28 26-2 20-14 38-30 42Z`, shade(C.mango)) +
      ellipse(38, 42, 9, 13, light(C.mango), { "fill-opacity": 0.8 }) +
      path(`M64 30c8 6 12 16 10 28-6-4-10-16-10-28Z`, C.mangoBlush) +
      rect(43, 18, 6, 8, 3, C.stem),
  },
  {
    key: "qua-dao",
    vi: "quả đào",
    en: "peach",
    cat: "food",
    draw: () =>
      dropShadow(50, 88, 28) +
      ball(50, 56, 30, C.peach) +
      path(`M50 30v52`, "none", {
        stroke: shade(C.peach),
        "stroke-width": 3,
        "stroke-linecap": "round",
        "stroke-opacity": 0.55,
      }) +
      rect(47, 20, 6, 10, 3, C.stem) +
      leaf(56, 24, 18, C.leaf, 25),
  },
  {
    key: "qua-le",
    vi: "quả lê",
    en: "pear",
    cat: "food",
    draw: () =>
      dropShadow(50, 92, 28) +
      ball(50, 44, 13, C.pear) +
      ball(50, 68, 26, C.pear) +
      rect(47, 18, 6, 10, 3, C.stem) +
      leaf(58, 22, 16, C.leaf, 30),
  },
  {
    key: "qua-dau-tay",
    vi: "quả dâu tây",
    en: "strawberry",
    cat: "food",
    draw: () =>
      dropShadow(50, 90, 26) +
      path(
        `M50 32c-15 0-25 11-25 24 0 15 25 32 25 32s25-17 25-32c0-13-10-24-25-24Z`,
        C.strawberry,
      ) +
      path(`M50 32c15 0 25 11 25 24 0 15-25 32-25 32Z`, shade(C.strawberry)) +
      circle(42, 54, 2.2, C.seed) +
      circle(56, 50, 2.2, C.seed) +
      circle(48, 68, 2.2, C.seed) +
      circle(60, 64, 2.2, C.seed) +
      leaf(50, 30, 14, C.leaf, 0) +
      leaf(41, 32, 12, C.leaf, -35) +
      leaf(59, 32, 12, C.leaf, 35),
  },
  {
    key: "sup-lo-xanh",
    vi: "súp lơ xanh",
    en: "broccoli",
    cat: "food",
    draw: () =>
      dropShadow(50, 90, 26) +
      rect(42, 62, 16, 26, 6, C.broccoliStem) +
      circle(40, 50, 16, C.broccoliHead) +
      circle(58, 48, 17, shade(C.broccoliHead)) +
      circle(50, 36, 15, C.broccoliHead) +
      circle(64, 58, 12, C.broccoliHead) +
      circle(36, 62, 11, shade(C.broccoliHead)) +
      circle(46, 44, 5, light(C.broccoliHead), { "fill-opacity": 0.7 }),
  },
  {
    key: "cu-ca-rot",
    vi: "củ cà rốt",
    en: "carrot",
    cat: "food",
    draw: () =>
      dropShadow(50, 90, 24) +
      path(`M50 34c10 0 14 10 10 24-4 16-8 28-10 34-2-6-6-18-10-34-4-14 0-24 10-24Z`, C.carrot) +
      path(`M50 34c10 0 14 10 10 24-4 16-8 28-10 34Z`, shade(C.carrot)) +
      line(44, 42, 44, 68, light(C.carrot), 2, { "stroke-opacity": 0.6 }) +
      leaf(46, 32, 20, C.leafDark, -20) +
      leaf(50, 28, 22, C.leafDark, 0) +
      leaf(54, 32, 20, C.leafDark, 20),
  },
  {
    key: "bat-ngu-coc",
    vi: "bát ngũ cốc",
    en: "cereal",
    cat: "food",
    draw: () =>
      dropShadow(50, 88, 30) +
      path(`M18 50h64c0 20-14 32-32 32S18 70 18 50Z`, C.bowlBlue) +
      path(`M50 50h32c0 20-14 32-32 32Z`, C.bowlBlueDark) +
      ellipse(50, 50, 32, 8, C.milk) +
      circle(38, 49, 3.5, C.loopA) +
      circle(48, 46, 3.5, C.loopB) +
      circle(60, 48, 3.5, C.loopC) +
      circle(54, 52, 3.5, C.loopA),
  },
  {
    key: "dui-ga",
    vi: "đùi gà",
    en: "chicken drumstick",
    cat: "food",
    draw: () =>
      dropShadow(50, 90, 26) +
      path(`M42 30c14-6 26 4 26 20 0 18-14 34-30 40-6-10-10-20-6-32 2-8 4-16 10-28Z`, C.chicken) +
      path(`M42 30c14-6 26 4 26 20 0 18-14 34-30 40Z`, shade(C.chicken)) +
      ellipse(50, 42, 10, 7, light(C.chicken), { "fill-opacity": 0.8 }) +
      rect(28, 74, 8, 16, 4, C.bone) +
      circle(26, 90, 6, C.bone) +
      circle(36, 90, 6, C.bone),
  },
  {
    key: "cu-hanh",
    vi: "củ hành",
    en: "onion",
    cat: "food",
    draw: () =>
      dropShadow(50, 88, 26) +
      ball(50, 58, 28, C.onion) +
      path(`M30 50a20 26 0 0 1 40 0`, "none", {
        stroke: shade(C.onion),
        "stroke-width": 2.5,
        "stroke-opacity": 0.55,
      }) +
      path(`M28 62a22 22 0 0 1 44 0`, "none", {
        stroke: shade(C.onion),
        "stroke-width": 2.5,
        "stroke-opacity": 0.55,
      }) +
      path(`M46 30c-4-6-2-10 4-10`, "none", {
        stroke: C.leafDark,
        "stroke-width": 3,
        "stroke-linecap": "round",
      }),
  },
  {
    key: "mon-mi-y",
    vi: "mì Ý",
    en: "pasta",
    cat: "food",
    draw: () =>
      dropShadow(50, 88, 30) +
      ellipse(50, 66, 34, 14, C.plateWhite) +
      ellipse(50, 62, 30, 12, C.pastaBase) +
      path(`M28 58q6-8 14 0t14 0t14 0`, "none", {
        stroke: shade(C.pastaBase),
        "stroke-width": 3,
        "stroke-linecap": "round",
      }) +
      path(`M30 66q6-8 14 0t14 0t14 0`, "none", {
        stroke: light(C.pastaBase),
        "stroke-width": 3,
        "stroke-linecap": "round",
      }) +
      circle(42, 56, 3, C.sauce) +
      circle(58, 60, 3, C.sauce) +
      circle(50, 50, 2.5, C.sauce),
  },
  {
    key: "cu-khoai-tay",
    vi: "củ khoai tây",
    en: "potato",
    cat: "food",
    draw: () =>
      dropShadow(50, 88, 28) +
      ellipse(50, 58, 30, 24, C.potato) +
      path(`M50 34a30 24 0 0 1 30 24 30 24 0 0 1-30 24Z`, shade(C.potato)) +
      ellipse(38, 48, 9, 6, light(C.potato), { "fill-opacity": 0.8 }) +
      circle(44, 62, 2, shade(C.potato)) +
      circle(58, 54, 2, shade(C.potato)) +
      circle(56, 68, 2, shade(C.potato)),
  },
  {
    key: "bat-com",
    vi: "bát cơm",
    en: "rice",
    cat: "food",
    draw: () =>
      dropShadow(50, 88, 30) +
      path(`M18 54h64c0 20-14 32-32 32S18 74 18 54Z`, C.bowlBlue) +
      path(`M50 54h32c0 20-14 32-32 32Z`, C.bowlBlueDark) +
      path(`M28 52a22 14 0 0 1 44 0Z`, C.rice) +
      ellipse(40, 46, 7, 4, light(C.rice), { "fill-opacity": 0.9 }),
  },
  {
    key: "dia-salad",
    vi: "đĩa rau trộn",
    en: "salad",
    cat: "food",
    draw: () =>
      dropShadow(50, 88, 32) +
      ellipse(50, 64, 36, 14, C.plateWhite) +
      ellipse(50, 60, 30, 11, "#EAF2FB") +
      path(`M30 54q10-10 20 0t20 0`, C.leaf) +
      path(`M34 60q8-8 16 0t16 0`, shade(C.leaf)) +
      circle(40, 56, 3, C.tomatoRed) +
      circle(58, 58, 3, C.tomatoRed),
  },
  {
    key: "bat-sup",
    vi: "bát súp",
    en: "soup",
    cat: "food",
    draw: () =>
      dropShadow(50, 88, 30) +
      path(`M18 52h64c0 20-14 32-32 32S18 72 18 52Z`, C.bowlBlue) +
      path(`M50 52h32c0 20-14 32-32 32Z`, C.bowlBlueDark) +
      ellipse(50, 52, 32, 8, C.soup) +
      path(`M40 34q-4-8 2-14`, "none", {
        stroke: C.steam,
        "stroke-width": 3,
        "stroke-linecap": "round",
        "stroke-opacity": 0.7,
      }) +
      path(`M56 34q-4-8 2-14`, "none", {
        stroke: C.steam,
        "stroke-width": 3,
        "stroke-linecap": "round",
        "stroke-opacity": 0.7,
      }),
  },
  {
    key: "qua-ca-chua",
    vi: "quả cà chua",
    en: "tomato",
    cat: "food",
    draw: () =>
      dropShadow(50, 88, 28) +
      ball(50, 58, 28, C.tomatoRed) +
      leaf(44, 32, 10, C.leafDark, -30) +
      leaf(50, 28, 10, C.leafDark, 0) +
      leaf(56, 32, 10, C.leafDark, 30),
  },
  {
    key: "kem-ong",
    vi: "kem ốc quế",
    en: "ice cream",
    cat: "food",
    draw: () =>
      dropShadow(50, 90, 22) +
      path(`M38 48h24l-10 40a2 2 0 0 1-4 0Z`, C.cone) +
      path(`M50 48h12l-10 40a2 2 0 0 1-2 0Z`, shade(C.cone)) +
      line(41, 54, 47, 84, light(C.cone), 1.5, { "stroke-opacity": 0.5 }) +
      line(50, 54, 53, 86, light(C.cone), 1.5, { "stroke-opacity": 0.5 }) +
      ball(50, 34, 22, C.iceCream),
  },
  {
    key: "banh-pizza",
    vi: "bánh pizza",
    en: "pizza",
    cat: "food",
    draw: () =>
      dropShadow(50, 90, 30) +
      path(`M50 18 94 86H6Z`, C.crust) +
      path(`M6 86H94l-4 6H10Z`, shade(C.crust)) +
      path(`M50 30 84 82H16Z`, C.cheese) +
      circle(44, 58, 5, C.pepperoni) +
      circle(60, 66, 5, C.pepperoni) +
      circle(50, 74, 4, C.pepperoni),
  },
  {
    key: "banh-hamburger",
    vi: "bánh hamburger",
    en: "hamburger",
    cat: "food",
    draw: () =>
      dropShadow(50, 92, 32) +
      path(`M18 52a32 18 0 0 1 64 0Z`, C.bunTop) +
      rect(16, 52, 68, 8, 4, C.lettuce) +
      rect(16, 60, 68, 10, 5, C.patty) +
      rect(16, 70, 68, 8, 4, C.cheeseSlice) +
      rect(16, 78, 68, 10, 5, C.bunBottom) +
      circle(34, 40, 2, light(C.bunTop)) +
      circle(46, 36, 2, light(C.bunTop)) +
      circle(58, 40, 2, light(C.bunTop)),
  },
  {
    key: "banh-vong",
    vi: "bánh vòng",
    en: "donut",
    cat: "food",
    draw: () =>
      dropShadow(50, 92, 28) +
      path(
        `M50 28a28 28 0 1 0 0 56 28 28 0 1 0 0-56ZM50 45a11 11 0 1 1 0 22 11 11 0 1 1 0-22Z`,
        C.donutBase,
        { "fill-rule": "evenodd" },
      ) +
      circle(36, 42, 9, light(C.donutBase), { "fill-opacity": 0.55 }) +
      circle(64, 70, 9, shade(C.donutBase), { "fill-opacity": 0.45 }) +
      circle(38, 38, 2, C.sprinkleA) +
      circle(48, 32, 2, C.sprinkleB) +
      circle(60, 36, 2, C.sprinkleA) +
      circle(66, 50, 2, C.sprinkleB) +
      circle(36, 60, 2, C.sprinkleA),
  },
  {
    key: "banh-cupcake",
    vi: "bánh cupcake",
    en: "cupcake",
    cat: "food",
    draw: () =>
      dropShadow(50, 92, 26) +
      path(`M28 58 34 88h32l6-30Z`, C.wrapper) +
      path(`M50 58 34 88h16Z`, shade(C.wrapper)) +
      line(38, 62, 40, 86, shade(C.wrapper), 3) +
      line(50, 60, 50, 88, light(C.wrapper), 3) +
      line(62, 62, 60, 86, shade(C.wrapper), 3) +
      path(`M26 58c0-10 8-16 24-16s24 6 24 16c0 6-8 10-24 10s-24-4-24-10Z`, C.frosting) +
      circle(50, 36, 9, C.frosting) +
      circle(46, 32, 3, C.cherryTop),
  },
];
