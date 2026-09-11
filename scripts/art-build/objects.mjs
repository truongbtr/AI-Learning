/**
 * The object library exercises draw from (`ImageRef.kind = "asset"`).
 *
 * Everything here is something the phase-2 bank already asks for — apples to count, a cow whose
 * name carries âm o, the family of Global Stage Unit 1 — plus the props the two worlds need.
 * Each object is drawn inside a 100 × 100 box, sits on a soft shadow, and must still read at 64 px.
 */
import {
  ball,
  blob,
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
  star,
} from "./lib.mjs";

const C = {
  apple: "#E8604C",
  orange: "#FFA33C",
  banana: "#FFD447",
  melon: "#7BC67E",
  grape: "#A87BD6",
  leaf: "#7BC67E",
  stem: "#8A6B3C",
  wood: "#C08A4E",
  water: "#5BC0E8",
  fish: "#FF8C42",
  cow: "#E9E9F0",
  cowSpot: "#4A4A57",
  goat: "#C9A88A",
  tiger: "#FFA33C",
  owl: "#A87BD6",
  bird: "#5BC0E8",
  bee: "#FFD447",
  bug: "#E8604C",
  butterfly: "#C77DFF",
  dog: "#C08A4E",
  cat: "#8A8A99",
  monkey: "#A9764E",
  penguin: "#3C4A5A",
  elephant: "#9FB3C8",
  frog: "#7BC67E",
  duck: "#FFD447",
  skin: "#F6C9A0",
  hair: "#4A3A2E",
  hairGrey: "#C9C9D2",
  shirtA: "#2F80ED",
  shirtB: "#E85D9C",
  shirtC: "#7BC67E",
  shirtD: "#FF8C42",
  paper: "#FFF4DE",
  pencil: "#FFC21A",
  metal: "#C9D6E6",
  rocket: "#DDE6F1",
  car: "#2F80ED",
  ball: "#FFFFFF",
  cube: "#FF8C42",
  candy: "#E85D9C",
  cake: "#FFD9E6",
  bread: "#E0A45E",
  cheese: "#FFD447",
  egg: "#FFF4DE",
  milk: "#FFFFFF",
  house: "#F49AC1",
  tree: "#5FA968",
  flower: "#F49AC1",
  cloud: "#FFFFFF",
  moon: "#FFE896",
  umbrella: "#E85D9C",
  lamp: "#FFD447",
  bed: "#8FB8E8",
  chair: "#C08A4E",
  shirt: "#5BC0E8",
  shoe: "#4A4A57",
  hat: "#FF8C42",
  cup: "#5BC0E8",
  plate: "#FFFFFF",
  spoon: "#C9D6E6",
  gear: "#C9D6E6",
  drum: "#E8604C",
  kite: "#7C5CFF",
  train: "#2F80ED",
  bike: "#34C759",
  book: "#7C5CFF",
  bag: "#E8604C",
  chest: "#C08A4E",
};

/** A simple standing person: head, body, arms. Used for the family set. */
function person({ hair = C.hair, shirt = C.shirtA, skin = C.skin, beard = false, tall = 1 } = {}) {
  const headY = 40 - 10 * tall;
  return (
    dropShadow(50, 92, 26) +
    // legs
    rect(38, 66, 10, 22, 5, shade(shirt)) +
    rect(52, 66, 10, 22, 5, shade(shirt)) +
    // body
    path(`M50 40c-14 0-22 10-22 22v10h44V62c0-12-8-22-22-22Z`, shirt) +
    path(`M50 40c14 0 22 10 22 22v10H50Z`, shade(shirt)) +
    // arms
    rect(20, 44, 10, 26, 5, shirt) +
    rect(70, 44, 10, 26, 5, shade(shirt)) +
    // head
    circle(50, headY + 8, 19, skin) +
    path(`M50 ${headY - 11}a19 19 0 0 1 19 19h-38a19 19 0 0 1 19-19Z`, hair) +
    (beard ? path(`M34 ${headY + 12}a16 12 0 0 0 32 0Z`, hair, { "fill-opacity": 0.85 }) : "") +
    eye(43, headY + 6, 4) +
    eye(57, headY + 6, 4) +
    path(`M44 ${headY + 16}a7 5 0 0 0 12 0Z`, "#C4665A")
  );
}

/** A four-legged animal seen from the side. */
function beast({ body, spot, ear = "round", tail = true, muzzle = true } = {}) {
  return (
    dropShadow(50, 88, 32) +
    rect(26, 44, 48, 30, 15, body) +
    path(`M50 44h24a15 15 0 0 1 15 15v15H50Z`, shade(body)) +
    rect(30, 70, 9, 16, 4, shade(body)) +
    rect(44, 70, 9, 16, 4, body) +
    rect(58, 70, 9, 16, 4, shade(body)) +
    (tail ? path(`M74 50c10-4 14-12 12-20-8 2-12 8-12 20Z`, shade(body)) : "") +
    circle(30, 38, 17, body) +
    (ear === "round"
      ? circle(20, 26, 8, shade(body)) + circle(40, 26, 8, shade(body))
      : path(`M18 30 14 14l14 8Z`, shade(body)) + path(`M42 30 46 14 32 22Z`, shade(body))) +
    (muzzle ? ellipse(26, 44, 11, 8, light(body)) : "") +
    circle(22, 42, 3, P.ink) +
    eye(26, 34, 4.5) +
    eye(38, 34, 4.5) +
    (spot ? circle(56, 52, 9, spot) + circle(66, 64, 6, spot) : "")
  );
}

/** Every entry: key, Vietnamese label, English label, category, tags, drawing. */
export const OBJECTS = [
  // ---------------------------------------------------------------- fruit & food
  {
    key: "qua-tao",
    vi: "quả táo",
    en: "apple",
    cat: "food",
    draw: () =>
      dropShadow(50, 88, 28) +
      ball(50, 56, 30, C.apple) +
      rect(47, 20, 6, 14, 3, C.stem) +
      leaf(56, 26, 24, C.leaf, 35),
  },
  {
    key: "qua-cam",
    vi: "quả cam",
    en: "orange",
    cat: "food",
    draw: () =>
      dropShadow(50, 88, 28) +
      ball(50, 56, 30, C.orange) +
      rect(47, 22, 6, 10, 3, C.stem) +
      leaf(55, 26, 20, C.leaf, 30),
  },
  {
    key: "qua-chuoi",
    vi: "quả chuối",
    en: "banana",
    cat: "food",
    draw: () =>
      dropShadow(50, 86, 30) +
      path(`M18 40c0 30 20 44 46 44 14 0 22-6 22-6-18-2-34-14-40-30-4-10-4-16-4-16Z`, C.banana) +
      path(`M18 40c0 30 20 44 46 44-16-10-24-24-26-44Z`, light(C.banana)) +
      rect(14, 30, 10, 14, 5, C.stem),
  },
  {
    key: "qua-dua-hau",
    vi: "quả dưa hấu",
    en: "watermelon",
    cat: "food",
    draw: () =>
      dropShadow(50, 88, 30) +
      path(`M14 68a36 36 0 0 1 72 0Z`, C.melon) +
      path(`M20 68a30 30 0 0 1 60 0Z`, "#F86B7E") +
      circle(42, 56, 3, P.ink) +
      circle(58, 58, 3, P.ink) +
      circle(50, 46, 3, P.ink),
  },
  {
    key: "qua-ca",
    vi: "quả cà",
    en: "aubergine",
    cat: "food",
    draw: () =>
      dropShadow(50, 88, 24) +
      path(`M50 30c18 0 28 14 28 28s-12 26-28 26-28-10-28-26 10-28 28-28Z`, C.grape) +
      path(`M50 30c18 0 28 14 28 28s-12 26-28 26Z`, shade(C.grape)) +
      leaf(44, 32, 20, C.leaf, -25) +
      leaf(56, 32, 20, C.leaf, 25),
  },
  {
    key: "qua-bi",
    vi: "quả bí",
    en: "pumpkin",
    cat: "food",
    draw: () =>
      dropShadow(50, 88, 30) +
      ellipse(50, 58, 34, 28, C.orange) +
      ellipse(50, 58, 12, 28, light(C.orange)) +
      ellipse(72, 58, 10, 26, shade(C.orange)) +
      rect(46, 24, 8, 12, 4, C.stem),
  },
  {
    key: "banh-mi",
    vi: "ổ bánh mì",
    en: "bread",
    cat: "food",
    draw: () =>
      dropShadow(50, 84, 32) +
      blob(16, 40, 68, 40, 18, C.bread) +
      line(34, 52, 44, 46, shade(C.bread), 4) +
      line(50, 54, 60, 48, shade(C.bread), 4),
  },
  {
    key: "mieng-pho-mai",
    vi: "miếng phô mai",
    en: "cheese",
    cat: "food",
    draw: () =>
      dropShadow(50, 84, 32) +
      path(`M16 72V46l34-18 34 18v26Z`, C.cheese) +
      path(`M50 28l34 18v26H50Z`, shade(C.cheese)) +
      circle(36, 58, 5, light(C.cheese)) +
      circle(60, 62, 4, "#E8B92E"),
  },
  {
    key: "qua-trung",
    vi: "quả trứng",
    en: "egg",
    cat: "food",
    draw: () =>
      dropShadow(50, 88, 22) +
      path(`M50 22c14 0 24 22 24 38a24 24 0 0 1-48 0c0-16 10-38 24-38Z`, C.egg) +
      path(`M50 22c14 0 24 22 24 38a24 24 0 0 1-24 24Z`, shade(C.egg)),
  },
  {
    key: "cai-keo",
    vi: "cái kẹo",
    en: "candy",
    cat: "food",
    draw: () =>
      dropShadow(50, 84, 26) +
      path(`M22 50 10 36v28Z`, C.candy) +
      path(`M78 50 90 36v28Z`, shade(C.candy)) +
      ellipse(50, 50, 28, 18, C.candy) +
      ellipse(44, 46, 10, 6, light(C.candy)),
  },
  {
    key: "ly-sua",
    vi: "li sữa",
    en: "glass of milk",
    cat: "food",
    draw: () =>
      dropShadow(50, 88, 22) +
      path(`M28 26h44l-6 56a8 8 0 0 1-8 6H42a8 8 0 0 1-8-6Z`, "#E8F0F8") +
      path(`M50 26h22l-6 56a8 8 0 0 1-8 6h-8Z`, "#CFE0EE") +
      path(`M31 40h38l-1 12H32Z`, C.milk),
  },
  {
    key: "bat-che",
    vi: "bát chè",
    en: "bowl of sweet soup",
    cat: "food",
    draw: () =>
      dropShadow(50, 86, 30) +
      path(`M18 48h64c0 20-14 32-32 32S18 68 18 48Z`, C.cup) +
      path(`M50 48h32c0 20-14 32-32 32Z`, shade(C.cup)) +
      ellipse(50, 48, 32, 8, light(C.cup)) +
      ellipse(50, 46, 24, 5, "#C08A4E"),
  },
  // ---------------------------------------------------------------- animals
  {
    key: "con-ca",
    vi: "con cá",
    en: "fish",
    cat: "animal",
    draw: () =>
      dropShadow(50, 86, 28) +
      path(`M76 50c0-14-14-26-30-26S18 36 18 50s12 26 28 26 30-12 30-26Z`, C.fish) +
      path(
        `M76 50c0 14-14 26-30 26 10-8 14-16 14-26s-4-18-14-26c16 0 30 12 30 26Z`,
        shade(C.fish),
      ) +
      path(`M76 50 92 34v32Z`, shade(C.fish)) +
      circle(32, 44, 5, P.white) +
      circle(31, 44, 3, P.ink),
  },
  {
    key: "con-bo",
    vi: "con bò",
    en: "cow",
    cat: "animal",
    draw: () =>
      beast({ body: C.cow, spot: C.cowSpot, ear: "round" }) +
      // horns, so it reads as a cow and not a big dog
      path(`M18 24c-6-6-6-12-2-16 4 4 6 10 2 16Z`, "#CBB79A") +
      path(`M42 24c6-6 6-12 2-16-4 4-6 10-2 16Z`, "#B9A487"),
  },
  {
    key: "con-de",
    vi: "con dê",
    en: "goat",
    cat: "animal",
    draw: () => beast({ body: C.goat, ear: "point" }),
  },
  {
    key: "con-cho",
    vi: "con chó",
    en: "dog",
    cat: "animal",
    draw: () => beast({ body: C.dog, ear: "round" }),
  },
  {
    key: "con-meo",
    vi: "con mèo",
    en: "cat",
    cat: "animal",
    draw: () => beast({ body: C.cat, ear: "point" }),
  },
  {
    key: "con-ho",
    vi: "con hổ",
    en: "tiger",
    cat: "animal",
    draw: () =>
      beast({ body: C.tiger, ear: "round" }) +
      line(46, 46, 46, 60, shade(C.tiger), 5) +
      line(58, 46, 58, 62, shade(C.tiger), 5),
  },
  {
    key: "con-khi",
    vi: "con khỉ",
    en: "monkey",
    cat: "animal",
    draw: () =>
      dropShadow(50, 90, 26) +
      path(`M74 62c8-4 12-12 10-20-8 0-12 8-12 18Z`, shade(C.monkey)) +
      ellipse(50, 62, 24, 24, C.monkey) +
      ellipse(50, 66, 15, 16, light(C.monkey)) +
      circle(50, 34, 20, C.monkey) +
      circle(28, 32, 8, shade(C.monkey)) +
      circle(72, 32, 8, shade(C.monkey)) +
      ellipse(50, 40, 14, 11, light(C.monkey)) +
      eye(44, 30, 5) +
      eye(56, 30, 5) +
      circle(47, 40, 2, P.ink) +
      circle(53, 40, 2, P.ink),
  },
  {
    key: "con-chim",
    vi: "con chim",
    en: "bird",
    cat: "animal",
    draw: () =>
      dropShadow(50, 86, 22) +
      ellipse(50, 54, 26, 22, C.bird) +
      path(`M50 32a26 22 0 0 1 26 22c0 12-12 22-26 22Z`, shade(C.bird)) +
      path(`M30 52c-10 2-16 8-18 16 10 0 16-6 18-16Z`, shade(C.bird)) +
      circle(60, 44, 5, P.white) +
      circle(61, 44, 3, P.ink) +
      path(`M74 48 88 52 74 56Z`, C.orange) +
      line(46, 76, 44, 88, C.orange, 4) +
      line(56, 76, 58, 88, C.orange, 4),
  },
  {
    key: "con-vit",
    vi: "con vịt",
    en: "duck",
    cat: "animal",
    draw: () =>
      dropShadow(50, 86, 26) +
      ellipse(46, 60, 28, 20, C.duck) +
      path(`M46 40a28 20 0 0 1 28 20c0 10-12 20-28 20Z`, shade(C.duck)) +
      circle(66, 36, 15, C.duck) +
      path(`M78 36 94 40 78 46Z`, C.orange) +
      circle(70, 32, 4.5, P.white) +
      circle(71, 32, 2.6, P.ink),
  },
  {
    key: "con-ong",
    vi: "con ong",
    en: "bee",
    cat: "animal",
    draw: () =>
      dropShadow(50, 86, 22) +
      ellipse(30, 40, 16, 12, "#E8F4FF", { "fill-opacity": 0.85 }) +
      ellipse(70, 40, 16, 12, "#E8F4FF", { "fill-opacity": 0.85 }) +
      ellipse(50, 56, 26, 20, C.bee) +
      path(`M42 38c4 24 4 24 0 36`, "none", { stroke: P.ink, "stroke-width": 7 }) +
      path(`M58 38c4 24 4 24 0 36`, "none", { stroke: P.ink, "stroke-width": 7 }) +
      circle(44, 50, 4, P.white) +
      circle(45, 50, 2.4, P.ink),
  },
  {
    key: "con-bo-rua",
    vi: "con bọ rùa",
    en: "ladybird",
    cat: "animal",
    draw: () =>
      dropShadow(50, 86, 26) +
      circle(50, 56, 28, C.bug) +
      path(`M50 28a28 28 0 0 1 0 56Z`, shade(C.bug)) +
      rect(47, 28, 6, 56, 3, P.ink) +
      circle(38, 48, 5, P.ink) +
      circle(62, 52, 5, P.ink) +
      circle(44, 66, 4, P.ink) +
      path(`M50 28a28 28 0 0 1 18 7H32a28 28 0 0 1 18-7Z`, P.ink),
  },
  {
    key: "con-buom",
    vi: "con bướm",
    en: "butterfly",
    cat: "animal",
    draw: () =>
      dropShadow(50, 86, 24) +
      path(`M48 54C34 30 10 30 12 48c2 14 20 20 36 10Z`, C.butterfly) +
      path(`M52 54C66 30 90 30 88 48c-2 14-20 20-36 10Z`, shade(C.butterfly)) +
      path(`M48 56C36 78 16 80 20 66c4-10 18-14 28-8Z`, light(C.butterfly)) +
      path(`M52 56c12 22 32 24 28 10-4-10-18-14-28-8Z`, C.butterfly) +
      rect(47, 40, 6, 40, 3, P.ink),
  },
  {
    key: "con-cu",
    vi: "con cú",
    en: "owl",
    cat: "animal",
    draw: () =>
      dropShadow(50, 88, 26) +
      ellipse(50, 56, 28, 32, C.owl) +
      ellipse(50, 62, 18, 22, "#F4E6FF") +
      path(`M26 36c-4-10 0-18 8-20 2 8 0 14-8 20Z`, shade(C.owl)) +
      path(`M74 36c4-10 0-18-8-20-2 8 0 14 8 20Z`, shade(C.owl)) +
      circle(40, 44, 12, P.white) +
      circle(60, 44, 12, P.white) +
      circle(41, 45, 6, P.ink) +
      circle(59, 45, 6, P.ink) +
      path(`M50 56 44 48h12Z`, C.orange) +
      rect(40, 84, 8, 6, 3, C.orange) +
      rect(52, 84, 8, 6, 3, C.orange),
  },
  {
    key: "con-ga",
    vi: "con gà",
    en: "hen",
    cat: "animal",
    draw: () =>
      dropShadow(50, 88, 24) +
      ellipse(48, 60, 26, 22, P.white) +
      path(`M48 38a26 22 0 0 1 26 22c0 12-12 22-26 22Z`, "#E4E4EC") +
      circle(64, 38, 14, P.white) +
      path(`M58 24c2-8 10-8 12 0 4-6 10-2 8 6Z`, C.apple) +
      path(`M76 40 90 44 76 48Z`, C.orange) +
      circle(68, 34, 4, P.ink) +
      line(44, 80, 42, 90, C.orange, 4) +
      line(54, 80, 56, 90, C.orange, 4),
  },
  {
    key: "con-ech",
    vi: "con ếch",
    en: "frog",
    cat: "animal",
    draw: () =>
      dropShadow(50, 86, 28) +
      ellipse(50, 62, 32, 24, C.frog) +
      ellipse(50, 66, 20, 16, light(C.frog)) +
      circle(34, 38, 13, C.frog) +
      circle(66, 38, 13, C.frog) +
      circle(34, 36, 7, P.white) +
      circle(66, 36, 7, P.white) +
      circle(34, 37, 4, P.ink) +
      circle(66, 37, 4, P.ink) +
      path(`M36 68a14 8 0 0 0 28 0`, "none", {
        stroke: shade(C.frog),
        "stroke-width": 4,
        "stroke-linecap": "round",
      }),
  },
  {
    key: "con-voi",
    vi: "con voi",
    en: "elephant",
    cat: "animal",
    draw: () =>
      dropShadow(50, 88, 32) +
      rect(24, 46, 52, 32, 16, C.elephant) +
      rect(50, 46, 26, 32, 16, shade(C.elephant)) +
      rect(30, 72, 12, 14, 5, shade(C.elephant)) +
      rect(56, 72, 12, 14, 5, shade(C.elephant)) +
      circle(32, 42, 18, C.elephant) +
      ellipse(18, 40, 12, 16, shade(C.elephant)) +
      path(`M28 54c-6 10-4 20 4 26 6-6 6-16 2-26Z`, light(C.elephant)) +
      eye(36, 38, 4),
  },
  {
    key: "chim-canh-cut",
    vi: "chim cánh cụt",
    en: "penguin",
    cat: "animal",
    draw: () =>
      dropShadow(50, 90, 26) +
      ellipse(50, 56, 26, 32, C.penguin) +
      ellipse(50, 62, 17, 24, P.white) +
      circle(50, 30, 19, C.penguin) +
      circle(43, 28, 6, P.white) +
      circle(57, 28, 6, P.white) +
      circle(43, 29, 3, P.ink) +
      circle(57, 29, 3, P.ink) +
      path(`M50 38 44 32h12Z`, C.orange) +
      path(`M24 50c-8 6-10 16-4 24 6-4 8-14 4-24Z`, shade(C.penguin)) +
      rect(38, 86, 10, 6, 3, C.orange) +
      rect(52, 86, 10, 6, 3, C.orange),
  },
  // ---------------------------------------------------------------- people (Global Stage U1)
  {
    key: "nguoi-ba",
    vi: "bà",
    en: "grandma",
    cat: "person",
    draw: () => person({ hair: C.hairGrey, shirt: C.shirtB }),
  },
  {
    key: "nguoi-ong",
    vi: "ông",
    en: "grandpa",
    cat: "person",
    draw: () => person({ hair: C.hairGrey, shirt: C.shirtC, beard: true }),
  },
  {
    key: "nguoi-bo",
    vi: "bố",
    en: "dad",
    cat: "person",
    draw: () => person({ hair: C.hair, shirt: C.shirtA }),
  },
  {
    key: "nguoi-me",
    vi: "mẹ",
    en: "mum",
    cat: "person",
    draw: () => person({ hair: "#6B4A2E", shirt: C.shirtB }),
  },
  {
    key: "nguoi-co-giao",
    vi: "cô giáo",
    en: "teacher",
    cat: "person",
    draw: () => person({ hair: "#3A2A1E", shirt: C.shirtD }),
  },
  {
    key: "em-be",
    vi: "em bé",
    en: "baby",
    cat: "person",
    draw: () =>
      g(person({ hair: "#8A6B3C", shirt: C.shirtC, tall: 0.6 }), {
        transform: "translate(0 14) scale(0.86)",
      }),
  },
  // ---------------------------------------------------------------- toys & school
  {
    key: "qua-bong",
    vi: "quả bóng",
    en: "ball",
    cat: "toy",
    draw: () =>
      dropShadow(50, 88, 28) +
      circle(50, 54, 30, C.ball) +
      path(`M50 24a30 30 0 0 1 0 60Z`, "#E4E4EC") +
      path(`M50 34 62 44l-5 15H43l-5-15Z`, P.ink) +
      circle(50, 24, 4, P.ink) +
      circle(78, 54, 4, P.ink),
  },
  {
    key: "khoi-lap-phuong",
    vi: "khối lập phương",
    en: "cube",
    cat: "toy",
    draw: () =>
      dropShadow(50, 88, 28) +
      path(`M20 40 50 24l30 16v32L50 88 20 72Z`, C.cube) +
      path(`M50 40 80 40v32L50 88Z`, shade(C.cube)) +
      path(`M20 40 50 24l30 16-30 16Z`, light(C.cube)),
  },
  {
    key: "o-to",
    vi: "ô tô",
    en: "car",
    cat: "toy",
    draw: () =>
      dropShadow(50, 84, 34) +
      path(`M12 64V52c0-4 4-6 8-6l8-14c2-4 6-6 10-6h20c4 0 8 2 10 6l8 14c4 0 8 2 8 6v12Z`, C.car) +
      path(`M50 26h10c4 0 8 2 10 6l8 14c4 0 8 2 8 6v12H50Z`, shade(C.car)) +
      path(`M34 34h32l6 12H28Z`, "#DCEEFF") +
      circle(30, 66, 10, P.ink) +
      circle(70, 66, 10, P.ink) +
      circle(30, 66, 4, C.metal) +
      circle(70, 66, 4, C.metal),
  },
  {
    key: "ten-lua",
    vi: "tên lửa",
    en: "rocket",
    cat: "toy",
    draw: () =>
      dropShadow(50, 90, 22) +
      path(`M50 10c14 14 20 32 20 50H30c0-18 6-36 20-50Z`, C.rocket) +
      path(`M50 10c-14 14-20 32-20 50h20Z`, P.white) +
      path(`M30 60c-12 4-18 14-18 26l18-8Z`, C.orange) +
      path(`M70 60c12 4 18 14 18 26l-18-8Z`, shade(C.orange)) +
      circle(50, 38, 11, P.robot.primary) +
      circle(47, 35, 5, "#8FC3FF") +
      rect(42, 78, 16, 10, 5, C.metal),
  },
  {
    key: "tau-hoa",
    vi: "tàu hoả",
    en: "train",
    cat: "toy",
    draw: () =>
      dropShadow(50, 84, 34) +
      rect(14, 44, 44, 28, 8, C.train) +
      rect(36, 44, 22, 28, 8, shade(C.train)) +
      rect(58, 34, 28, 38, 8, C.apple) +
      rect(72, 34, 14, 38, 8, shade(C.apple)) +
      rect(64, 42, 14, 14, 5, "#DCEEFF") +
      rect(20, 52, 12, 12, 4, "#DCEEFF") +
      circle(26, 74, 8, P.ink) +
      circle(50, 74, 8, P.ink) +
      circle(74, 74, 8, P.ink) +
      rect(60, 20, 10, 16, 4, C.metal),
  },
  {
    key: "xe-dap",
    vi: "xe đạp",
    en: "bike",
    cat: "toy",
    draw: () =>
      dropShadow(50, 86, 34) +
      circle(26, 64, 18, "none", { stroke: P.ink, "stroke-width": 6 }) +
      circle(74, 64, 18, "none", { stroke: P.ink, "stroke-width": 6 }) +
      path(`M26 64 44 38h20l10 26`, "none", {
        stroke: C.bike,
        "stroke-width": 7,
        fill: "none",
        "stroke-linecap": "round",
      }) +
      path(`M44 38h22`, "none", { stroke: C.bike, "stroke-width": 7, "stroke-linecap": "round" }) +
      rect(38, 30, 16, 6, 3, C.apple),
  },
  {
    key: "con-dieu",
    vi: "con diều",
    en: "kite",
    cat: "toy",
    draw: () =>
      path(`M50 10 82 42 50 74 18 42Z`, C.kite) +
      path(`M50 10 82 42 50 74Z`, shade(C.kite)) +
      line(50, 10, 50, 74, light(C.kite), 3) +
      line(18, 42, 82, 42, light(C.kite), 3) +
      path(`M50 74c6 8-6 12 0 20`, "none", { stroke: P.inkSoft, "stroke-width": 3, fill: "none" }),
  },
  {
    key: "cai-trong",
    vi: "cái trống",
    en: "drum",
    cat: "toy",
    draw: () =>
      dropShadow(50, 88, 30) +
      rect(18, 40, 64, 36, 6, C.drum) +
      rect(50, 40, 32, 36, 6, shade(C.drum)) +
      ellipse(50, 40, 32, 10, P.white) +
      line(24, 46, 76, 70, P.reward, 4) +
      line(76, 46, 24, 70, P.reward, 4),
  },
  {
    key: "gau-bong",
    vi: "gấu bông",
    en: "teddy bear",
    cat: "toy",
    draw: () =>
      dropShadow(50, 90, 28) +
      circle(28, 30, 11, C.monkey) +
      circle(72, 30, 11, C.monkey) +
      circle(50, 36, 22, C.monkey) +
      ellipse(50, 44, 12, 9, light(C.monkey)) +
      eye(42, 32, 4.5) +
      eye(58, 32, 4.5) +
      circle(50, 42, 3.5, P.ink) +
      ellipse(50, 70, 24, 20, C.monkey) +
      ellipse(50, 72, 14, 13, light(C.monkey)) +
      rect(20, 60, 14, 22, 7, shade(C.monkey)) +
      rect(66, 60, 14, 22, 7, shade(C.monkey)),
  },
  {
    key: "cai-bup-be",
    vi: "con búp bê",
    en: "doll",
    cat: "toy",
    draw: () => person({ hair: "#FFD447", shirt: C.shirtB, tall: 0.8 }),
  },
  {
    key: "but-chi",
    vi: "bút chì",
    en: "pencil",
    cat: "school",
    draw: () =>
      dropShadow(50, 90, 20) +
      g(
        rect(-12, -34, 24, 58, 4, C.pencil) +
          rect(0, -34, 12, 58, 4, shade(C.pencil)) +
          path(`M-12 24 0 44 12 24Z`, "#F6C9A0") +
          path(`M-4 38 0 44 4 38Z`, P.ink) +
          rect(-12, -40, 24, 8, 3, C.apple),
        { transform: "translate(50 42) rotate(12)" },
      ),
  },
  {
    key: "quyen-sach",
    vi: "quyển sách",
    en: "book",
    cat: "school",
    draw: () =>
      dropShadow(50, 86, 32) +
      rect(16, 28, 68, 48, 6, C.book) +
      rect(50, 28, 34, 48, 6, shade(C.book)) +
      rect(22, 34, 56, 36, 4, C.paper) +
      rect(48, 34, 4, 36, 2, "#E8DCC4") +
      line(28, 44, 44, 44, "#D9CDB4", 3) +
      line(28, 54, 44, 54, "#D9CDB4", 3) +
      line(56, 44, 72, 44, "#D9CDB4", 3),
  },
  {
    key: "cai-cap",
    vi: "cái cặp",
    en: "backpack",
    cat: "school",
    draw: () =>
      dropShadow(50, 88, 30) +
      path(`M24 40c0-12 12-20 26-20s26 8 26 20v38a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6Z`, C.bag) +
      path(`M50 20c14 0 26 8 26 20v38a6 6 0 0 1-6 6H50Z`, shade(C.bag)) +
      rect(30, 54, 40, 18, 6, light(C.bag)) +
      rect(44, 30, 12, 16, 5, shade(C.bag)),
  },
  {
    key: "cai-ca",
    vi: "cái ca",
    en: "mug",
    cat: "home",
    draw: () =>
      dropShadow(50, 86, 26) +
      rect(24, 36, 44, 44, 8, C.cup) +
      rect(48, 36, 20, 44, 8, shade(C.cup)) +
      path(`M68 46h6a12 12 0 0 1 0 24h-6`, "none", {
        stroke: C.cup,
        "stroke-width": 8,
        fill: "none",
      }) +
      ellipse(46, 36, 22, 6, light(C.cup)),
  },
  {
    key: "cai-o",
    vi: "cái ô",
    en: "umbrella",
    cat: "home",
    draw: () =>
      dropShadow(50, 90, 22) +
      path(`M10 52a40 32 0 0 1 80 0Z`, C.umbrella) +
      path(`M50 20a40 32 0 0 1 40 32H50Z`, shade(C.umbrella)) +
      path(`M10 52a13 10 0 0 0 20 0 13 10 0 0 0 20 0 13 10 0 0 0 20 0 13 10 0 0 0 20 0`, "none", {
        stroke: light(C.umbrella),
        "stroke-width": 3,
        fill: "none",
      }) +
      rect(47, 52, 6, 34, 3, C.wood) +
      path(`M47 86a8 8 0 0 0 14 4`, "none", {
        stroke: C.wood,
        "stroke-width": 6,
        fill: "none",
        "stroke-linecap": "round",
      }),
  },
  {
    key: "cai-den",
    vi: "cái đèn",
    en: "lamp",
    cat: "home",
    draw: () =>
      dropShadow(50, 88, 26) +
      path(`M26 46 38 20h24l12 26Z`, C.lamp) +
      path(`M50 20h12l12 26H50Z`, shade(C.lamp)) +
      rect(46, 46, 8, 32, 4, C.metal) +
      rect(32, 78, 36, 8, 4, C.metal),
  },
  {
    key: "cai-giuong",
    vi: "cái giường",
    en: "bed",
    cat: "home",
    draw: () =>
      dropShadow(50, 86, 36) +
      rect(10, 44, 16, 34, 6, C.wood) +
      rect(76, 50, 14, 28, 6, C.wood) +
      rect(14, 58, 74, 16, 6, C.bed) +
      rect(50, 58, 38, 16, 6, shade(C.bed)) +
      rect(18, 50, 22, 12, 6, P.white),
  },
  {
    key: "cai-ghe",
    vi: "cái ghế",
    en: "chair",
    cat: "home",
    draw: () =>
      dropShadow(50, 88, 26) +
      rect(28, 18, 12, 46, 5, C.chair) +
      rect(28, 56, 46, 10, 5, C.chair) +
      rect(50, 56, 24, 10, 5, shade(C.chair)) +
      rect(30, 66, 8, 20, 4, shade(C.chair)) +
      rect(64, 66, 8, 20, 4, shade(C.chair)) +
      rect(34, 26, 32, 8, 4, light(C.chair)),
  },
  {
    key: "ngoi-nha",
    vi: "ngôi nhà",
    en: "house",
    cat: "place",
    draw: () =>
      dropShadow(50, 88, 34) +
      path(`M10 46 50 16l40 30v34a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4Z`, C.house) +
      path(`M50 16l40 30v34a4 4 0 0 1-4 4H50Z`, shade(C.house)) +
      path(`M6 48 50 14l44 34-4 6-40-30-40 30Z`, C.apple) +
      rect(42, 58, 16, 26, 4, C.wood) +
      rect(20, 54, 14, 14, 4, "#DCEEFF") +
      rect(66, 54, 14, 14, 4, "#DCEEFF"),
  },
  {
    key: "cai-cay",
    vi: "cái cây",
    en: "tree",
    cat: "place",
    draw: () =>
      dropShadow(50, 90, 28) +
      rect(44, 56, 12, 34, 5, C.wood) +
      circle(50, 40, 28, C.tree) +
      circle(32, 48, 18, C.tree) +
      circle(68, 48, 18, shade(C.tree)) +
      circle(42, 32, 10, light(C.tree)),
  },
  {
    key: "bong-hoa",
    vi: "bông hoa",
    en: "flower",
    cat: "place",
    draw: () =>
      dropShadow(50, 90, 20) +
      rect(47, 48, 6, 42, 3, C.tree) +
      leaf(52, 74, 20, C.tree, 60) +
      circle(50, 26, 13, C.flower) +
      circle(30, 40, 13, C.flower) +
      circle(70, 40, 13, C.flower) +
      circle(38, 60, 13, shade(C.flower)) +
      circle(62, 60, 13, shade(C.flower)) +
      circle(50, 44, 13, P.reward),
  },
  {
    key: "chiec-la",
    vi: "chiếc lá",
    en: "leaf",
    cat: "place",
    draw: () =>
      dropShadow(50, 88, 24) + leaf(50, 88, 66, C.tree, 8) + line(50, 86, 50, 34, shade(C.tree), 3),
  },
  {
    key: "ngoi-sao",
    vi: "ngôi sao",
    en: "star",
    cat: "effect",
    draw: () => star(50, 52, 34),
  },
  {
    key: "mat-trang",
    vi: "mặt trăng",
    en: "moon",
    cat: "place",
    draw: () =>
      // crescent: a disc with a second arc sweeping back, so no mask is needed
      path(`M58 12a40 40 0 1 0 24 72 34 34 0 1 1-24-72Z`, C.moon) +
      path(`M58 12a40 40 0 0 1 24 72 34 34 0 0 0-24-72Z`, shade(C.moon)) +
      circle(50, 46, 6, shade(C.moon), { "fill-opacity": 0.45 }) +
      circle(42, 66, 4, shade(C.moon), { "fill-opacity": 0.45 }),
  },
  {
    key: "dam-may",
    vi: "đám mây",
    en: "cloud",
    cat: "place",
    draw: () =>
      ellipse(50, 62, 40, 18, "#DCEEFF") +
      circle(32, 52, 18, "#F4FAFF") +
      circle(54, 44, 24, "#F4FAFF") +
      circle(74, 56, 16, "#E8F3FF") +
      ellipse(50, 66, 38, 10, "#C9E2FA"),
  },
  {
    key: "cai-ho",
    vi: "cái hồ",
    en: "lake",
    cat: "place",
    draw: () =>
      ellipse(50, 60, 42, 24, C.water) +
      ellipse(50, 56, 42, 22, light(C.water)) +
      path(`M20 56a10 6 0 0 0 16 0 10 6 0 0 0 16 0`, "none", {
        stroke: P.white,
        "stroke-width": 3,
        fill: "none",
        "fill-opacity": 0.6,
      }) +
      path(`M50 68a10 6 0 0 0 16 0`, "none", { stroke: P.white, "stroke-width": 3, fill: "none" }),
  },
  // ---------------------------------------------------------------- clothes
  {
    key: "cai-ao",
    vi: "cái áo",
    en: "shirt",
    cat: "clothes",
    draw: () =>
      dropShadow(50, 88, 30) +
      path(
        `M26 26 38 20h24l12 6 12 14-12 10-4-6v40a4 4 0 0 1-4 4H34a4 4 0 0 1-4-4V44l-4 6-12-10Z`,
        C.shirt,
      ) +
      path(`M50 20h12l12 6 12 14-12 10-4-6v40a4 4 0 0 1-4 4H50Z`, shade(C.shirt)) +
      path(`M38 20a12 8 0 0 0 24 0`, "none", {
        stroke: light(C.shirt),
        "stroke-width": 4,
        fill: "none",
      }),
  },
  {
    key: "doi-giay",
    vi: "đôi giày",
    en: "shoes",
    cat: "clothes",
    draw: () =>
      dropShadow(50, 84, 34) +
      path(`M10 60c0-8 6-12 14-12l10 8h12v14H14a4 4 0 0 1-4-4Z`, C.shoe) +
      path(`M52 60c0-8 6-12 14-12l10 8h12v14H56a4 4 0 0 1-4-4Z`, shade(C.shoe)) +
      rect(10, 68, 36, 6, 3, P.white) +
      rect(52, 68, 36, 6, 3, P.white),
  },
  {
    key: "cai-mu",
    vi: "cái mũ",
    en: "hat",
    cat: "clothes",
    draw: () =>
      dropShadow(50, 86, 34) +
      path(`M22 62a28 28 0 0 1 56 0Z`, C.hat) +
      path(`M50 34a28 28 0 0 1 28 28H50Z`, shade(C.hat)) +
      rect(8, 62, 84, 12, 6, C.hat) +
      rect(50, 62, 42, 12, 6, shade(C.hat)) +
      rect(22, 54, 56, 8, 4, P.reward),
  },
  // ---------------------------------------------------------------- robot world props
  {
    key: "banh-rang",
    vi: "bánh răng",
    en: "gear",
    cat: "robot",
    draw: () => {
      let teeth = "";
      for (let i = 0; i < 8; i++)
        teeth += rect(-8, -44, 16, 18, 5, C.metal, { transform: `rotate(${i * 45})` });
      return (
        dropShadow(50, 88, 26) +
        g(
          teeth +
            circle(0, 0, 30, shade(C.metal)) +
            circle(0, 0, 26, C.metal) +
            path(`M-26 0a26 26 0 0 1 26-26 26 26 0 0 1 18 7A22 22 0 0 0-26 0Z`, light(C.metal)) +
            circle(0, 0, 10, "#8FA6BF") +
            circle(0, 0, 6, "#6E8AA8"),
          { transform: "translate(50 50)" },
        )
      );
    },
  },
  {
    key: "con-robot",
    vi: "con rô-bốt",
    en: "robot",
    cat: "robot",
    draw: () =>
      dropShadow(50, 90, 26) +
      rect(30, 48, 40, 34, 12, C.metal) +
      rect(50, 48, 20, 34, 12, shade(C.metal)) +
      rect(38, 56, 24, 16, 6, "#2F80ED") +
      rect(20, 52, 10, 24, 5, C.metal) +
      rect(70, 52, 10, 24, 5, shade(C.metal)) +
      rect(34, 82, 12, 8, 4, "#8FA6BF") +
      rect(54, 82, 12, 8, 4, "#8FA6BF") +
      rect(30, 18, 40, 28, 12, "#DDE6F1") +
      rect(36, 24, 28, 16, 8, "#2B3A4A") +
      circle(44, 32, 4, P.white) +
      circle(56, 32, 4, P.white) +
      rect(47, 8, 6, 12, 3, C.metal) +
      circle(50, 6, 6, P.robot.accent),
  },
  {
    key: "pin-nang-luong",
    vi: "cục pin",
    en: "battery",
    cat: "robot",
    draw: () =>
      dropShadow(50, 88, 24) +
      rect(26, 24, 48, 62, 10, "#7BC67E") +
      rect(50, 24, 24, 62, 10, shade("#7BC67E")) +
      rect(40, 16, 20, 10, 4, C.metal) +
      path(`M52 36 40 58h10l-4 18 16-24H52Z`, P.reward),
  },
  // ---------------------------------------------------------------- garden world props
  {
    key: "cay-nam",
    vi: "cây nấm",
    en: "mushroom",
    cat: "garden",
    draw: () =>
      dropShadow(50, 88, 26) +
      rect(40, 52, 20, 34, 8, "#FFF4DE") +
      path(`M14 54a36 30 0 0 1 72 0Z`, "#E8604C") +
      path(`M50 24a36 30 0 0 1 36 30H50Z`, shade("#E8604C")) +
      circle(34, 40, 7, P.white) +
      circle(62, 44, 5, P.white),
  },
  {
    key: "cau-vong",
    vi: "cầu vồng",
    en: "rainbow",
    cat: "garden",
    draw: () => {
      const cols = ["#E8604C", "#FFA33C", "#FFD447", "#7BC67E", "#5BC0E8", "#7C5CFF"];
      return cols
        .map((c, i) =>
          path(`M${12 + i * 6} 78a${38 - i * 6} ${38 - i * 6} 0 0 1 ${76 - i * 12} 0`, "none", {
            stroke: c,
            "stroke-width": 6,
            fill: "none",
          }),
        )
        .join("");
    },
  },
  {
    key: "ruong-kho-bau",
    vi: "rương kho báu",
    en: "treasure chest",
    cat: "effect",
    draw: () =>
      dropShadow(50, 88, 34) +
      path(`M14 46a36 22 0 0 1 72 0Z`, C.chest) +
      path(`M50 24a36 22 0 0 1 36 22H50Z`, shade(C.chest)) +
      rect(14, 46, 72, 36, 6, C.chest) +
      rect(50, 46, 36, 36, 6, shade(C.chest)) +
      rect(14, 52, 72, 8, 2, P.reward) +
      rect(42, 44, 16, 20, 4, P.reward) +
      circle(50, 56, 4, shade(P.reward)),
  },
];

export function buildObjects(write, svg) {
  const manifest = [];
  for (const o of OBJECTS) {
    const body = o.draw();
    const file = `objects/${o.key}.svg`;
    const res = write(file, svg("0 0 100 100", body, { title: `${o.vi} · ${o.en}` }));
    manifest.push({
      key: o.key,
      labelVi: o.vi,
      labelEn: o.en,
      category: o.cat,
      file: `art/objects/${o.key}.svg`,
      bytes: res.bytes,
      source: "mtct-hand-drawn",
      license: "internal",
    });
  }
  return manifest;
}
