/** Đợt 4 (pha 6d, việc 3) — con vật theo đúng từ vựng ESL VOC.ANIMALS_FARM / VOC.ANIMALS_PETS. */
import {
  ball,
  circle,
  dropShadow,
  ellipse,
  eye,
  light,
  line,
  PALETTE as P,
  path,
  rect,
  shade,
  star,
} from "./lib.mjs";

const C = {
  giraffe: "#F0C868",
  giraffeSpot: "#C4823C",
  giraffeHorn: "#B8935C",
  horse: "#B87D4E",
  horseMane: "#6B4530",
  lion: "#F0A94E",
  lionMane: "#D9822E",
  lionMuzzle: "#FCE8C2",
  pig: "#F5A8BE",
  pigSnout: "#E37F9E",
  sheep: "#FFF6EA",
  sheepFace: "#8A6A54",
  sheepLeg: "#D9CBB0",
  zebra: "#E8E6EA",
  zebraStripe: "#5C5866",
  hamster: "#E0A868",
  hamsterCheek: "#F2C896",
  lizard: "#6BC46B",
  mouse: "#C9C9D2",
  mouseEar: "#F0B8C6",
  rabbit: "#FCEFEA",
  rabbitInner: "#F0A8BE",
  snake: "#5FBF72",
  snakeDot: "#3E8F55",
  turtle: "#6BB873",
  turtleShell: "#5FA968",
  bear: "#A9764E",
  bearMuzzle: "#E0C39A",
  fox: "#F5893C",
  foxWhite: "#FFF6EA",
  deer: "#C9A47E",
  deerSpot: "#F5E6D0",
  deerAntler: "#8A6449",
  squirrel: "#B8865A",
  squirrelBelly: "#EAD3B0",
  chick: "#FFD966",
  chickBeak: "#F5893C",
  whale: "#5B9BD6",
  whaleBelly: "#CFE6F5",
  dolphin: "#8FAEC9",
  dolphinBelly: "#E4EEF5",
  octopus: "#C77DD1",
  crab: "#E8724C",
  crabClaw: "#F29B78",
  starfish: "#F2966B",
  shark: "#93A9B8",
  sharkBelly: "#E4ECF0",
  ant: "#6B5240",
  spider: "#5A4A6B",
  snail: "#C9A06C",
  snailBody: "#8FCB8F",
  worm: "#F49AC1",
};

/** A four-legged animal seen from the side — the shared skeleton for most mammals here. */
function quad({
  body,
  ear = "round",
  tail = true,
  muzzle,
  earColor,
  behindHead = "",
  onTop = "",
} = {}) {
  const mz = muzzle ?? light(body);
  const ec = earColor ?? shade(body);
  return (
    dropShadow(50, 88, 32) +
    behindHead +
    rect(26, 44, 48, 30, 15, body) +
    path(`M50 44h24a15 15 0 0 1 15 15v15H50Z`, shade(body)) +
    rect(30, 70, 9, 16, 4, shade(body)) +
    rect(44, 70, 9, 16, 4, body) +
    rect(58, 70, 9, 16, 4, shade(body)) +
    (tail ? path(`M74 50c10-4 14-12 12-20-8 2-12 8-12 20Z`, shade(body)) : "") +
    circle(30, 38, 17, body) +
    (ear === "round"
      ? circle(20, 26, 8, ec) + circle(40, 26, 8, ec)
      : path(`M18 30 14 14l14 8Z`, ec) + path(`M42 30 46 14 32 22Z`, ec)) +
    ellipse(26, 44, 11, 8, mz) +
    circle(22, 42, 3, P.ink) +
    eye(26, 34, 4.5) +
    eye(38, 34, 4.5) +
    onTop
  );
}

export const OBJECTS_ANIMALS = [
  {
    key: "con-huou-cao-co",
    vi: "hươu cao cổ",
    en: "giraffe",
    cat: "animal",
    draw: () =>
      dropShadow(50, 92, 26) +
      rect(40, 30, 14, 44, 7, C.giraffe) +
      path(`M40 30h14a7 7 0 0 1 7 7v8H40Z`, shade(C.giraffe)) +
      rect(30, 68, 10, 20, 5, shade(C.giraffe)) +
      rect(56, 68, 10, 20, 5, C.giraffe) +
      circle(47, 20, 14, C.giraffe) +
      path(`M47 20a14 14 0 0 1 14 14H47Z`, shade(C.giraffe)) +
      path(`M40 10c-2-6 2-10 6-8 1 4-1 7-6 8Z`, C.giraffeHorn) +
      path(`M54 10c2-6-2-10-6-8-1 4 1 7 6 8Z`, C.giraffeHorn) +
      circle(41, 40, 3.5, C.giraffeSpot) +
      circle(54, 54, 4.5, C.giraffeSpot) +
      circle(45, 74, 4, C.giraffeSpot) +
      eye(42, 18, 3.4) +
      eye(53, 18, 3.4),
  },
  {
    key: "con-ngua",
    vi: "con ngựa",
    en: "horse",
    cat: "animal",
    draw: () =>
      quad({
        body: C.horse,
        ear: "point",
        tail: false,
        onTop:
          path(`M74 34c10 2 16 12 12 26-8-4-13-14-12-26Z`, shade(C.horse)) +
          path(`M18 22c2 8 8 13 16 14-2-8 0-14 4-20-8 0-16 2-20 6Z`, C.horseMane),
      }),
  },
  {
    key: "con-su-tu",
    vi: "con sư tử",
    en: "lion",
    cat: "animal",
    draw: () =>
      quad({
        body: C.lion,
        ear: "round",
        muzzle: C.lionMuzzle,
        behindHead: ball(30, 38, 23, C.lionMane),
      }),
  },
  {
    key: "con-lon",
    vi: "con lợn",
    en: "pig",
    cat: "animal",
    draw: () =>
      quad({
        body: C.pig,
        ear: "round",
        muzzle: C.pigSnout,
      }),
  },
  {
    key: "con-cuu",
    vi: "con cừu",
    en: "sheep",
    cat: "animal",
    draw: () =>
      dropShadow(50, 88, 28) +
      ellipse(52, 62, 30, 22, C.sheep) +
      path(`M52 40a30 22 0 0 1 0 44Z`, shade(C.sheep)) +
      circle(34, 46, 16, C.sheep) +
      circle(56, 40, 17, C.sheep) +
      circle(72, 50, 13, C.sheep) +
      rect(36, 76, 8, 14, 4, C.sheepLeg) +
      rect(62, 76, 8, 14, 4, shade(C.sheepLeg)) +
      circle(22, 46, 13, C.sheepFace) +
      circle(12, 40, 6, shade(C.sheepFace)) +
      eye(19, 44, 3.6),
  },
  {
    key: "con-ngua-van",
    vi: "ngựa vằn",
    en: "zebra",
    cat: "animal",
    draw: () =>
      quad({
        body: C.zebra,
        ear: "point",
        onTop:
          line(34, 46, 34, 60, C.zebraStripe, 4) +
          line(44, 44, 44, 62, C.zebraStripe, 4) +
          line(56, 46, 56, 64, C.zebraStripe, 4) +
          line(66, 52, 66, 68, C.zebraStripe, 4) +
          path(`M18 24c2 4 6 6 10 6`, "none", {
            stroke: C.zebraStripe,
            "stroke-width": 3,
            "stroke-linecap": "round",
          }),
      }),
  },
  {
    key: "con-chuot-hamster",
    vi: "chuột hamster",
    en: "hamster",
    cat: "animal",
    draw: () =>
      dropShadow(50, 88, 24) +
      ellipse(50, 62, 26, 22, C.hamster) +
      path(`M50 40a26 22 0 0 1 0 44Z`, shade(C.hamster)) +
      circle(50, 38, 20, C.hamster) +
      circle(34, 26, 8, shade(C.hamster)) +
      circle(66, 26, 8, shade(C.hamster)) +
      circle(36, 44, 9, C.hamsterCheek) +
      circle(64, 44, 9, C.hamsterCheek) +
      eye(40, 36, 4.2) +
      eye(60, 36, 4.2) +
      circle(50, 42, 2.4, "#C4665A"),
  },
  {
    key: "con-than-lan",
    vi: "con thằn lằn",
    en: "lizard",
    cat: "animal",
    draw: () =>
      dropShadow(50, 86, 28) +
      path(`M30 64c0-16 14-26 30-26s30 10 30 22-14 22-30 22-30-6-30-18Z`, C.lizard) +
      path(`M60 38c16 0 30 10 30 22s-14 22-30 22Z`, shade(C.lizard)) +
      path(`M84 50c10 2 16 10 14 20-8-2-14-10-14-20Z`, shade(C.lizard)) +
      circle(26, 56, 15, C.lizard) +
      ellipse(26, 60, 8, 5, light(C.lizard)) +
      rect(34, 76, 7, 10, 3, shade(C.lizard)) +
      rect(56, 78, 7, 10, 3, C.lizard) +
      eye(22, 52, 4.5),
  },
  {
    key: "con-chuot",
    vi: "con chuột",
    en: "mouse",
    cat: "animal",
    draw: () =>
      dropShadow(50, 88, 22) +
      ellipse(52, 62, 22, 20, C.mouse) +
      path(`M52 42a22 20 0 0 1 0 40Z`, shade(C.mouse)) +
      circle(38, 40, 16, C.mouse) +
      circle(24, 24, 9, C.mouseEar) +
      circle(46, 22, 9, C.mouseEar) +
      eye(32, 40, 3.8) +
      path(`M74 66c10 4 16 12 14 22`, "none", {
        stroke: shade(C.mouse),
        "stroke-width": 3,
        "stroke-linecap": "round",
      }),
  },
  {
    key: "con-tho",
    vi: "con thỏ",
    en: "rabbit",
    cat: "animal",
    draw: () =>
      dropShadow(50, 90, 24) +
      ellipse(50, 64, 24, 22, C.rabbit) +
      path(`M50 42a24 22 0 0 1 0 44Z`, shade(C.rabbit)) +
      circle(50, 40, 17, C.rabbit) +
      path(`M40 26c-4-16 2-28 8-26 2 10 0 18-8 26Z`, C.rabbit) +
      path(`M60 26c4-16-2-28-8-26-2 10 0 18 8 26Z`, C.rabbit) +
      path(`M40 26c-2-12 1-22 5-24 1 8 0 15-5 24Z`, C.rabbitInner) +
      path(`M60 26c2-12-1-22-5-24-1 8 0 15 5 24Z`, C.rabbitInner) +
      eye(44, 38, 4) +
      eye(56, 38, 4) +
      circle(74, 66, 8, light(C.rabbit)),
  },
  {
    key: "con-ran",
    vi: "con rắn",
    en: "snake",
    cat: "animal",
    draw: () => {
      const d = "M20 78C10 60 30 55 35 40C40 25 20 20 25 8";
      return (
        dropShadow(30, 84, 26, 7) +
        path(d, "none", { stroke: shade(C.snake), "stroke-width": 20, "stroke-linecap": "round" }) +
        path(d, "none", { stroke: C.snake, "stroke-width": 15, "stroke-linecap": "round" }) +
        circle(30, 58, 3.2, C.snakeDot) +
        circle(22, 70, 3.2, C.snakeDot) +
        circle(30, 30, 3.2, C.snakeDot) +
        circle(25, 8, 10, light(C.snake)) +
        eye(21, 6, 3)
      );
    },
  },
  {
    key: "con-rua",
    vi: "con rùa",
    en: "turtle",
    cat: "animal",
    draw: () =>
      dropShadow(50, 90, 30) +
      ellipse(52, 58, 32, 26, C.turtleShell) +
      path(`M52 32a32 26 0 0 1 32 26c0 14-14 26-32 26Z`, shade(C.turtleShell)) +
      ellipse(52, 56, 18, 14, light(C.turtleShell)) +
      line(40, 48, 52, 56, shade(C.turtleShell), 2.5) +
      line(64, 48, 52, 56, shade(C.turtleShell), 2.5) +
      line(52, 56, 52, 72, shade(C.turtleShell), 2.5) +
      circle(20, 50, 13, C.turtle) +
      rect(30, 78, 10, 8, 4, shade(C.turtle)) +
      rect(64, 78, 10, 8, 4, C.turtle) +
      eye(16, 47, 3.8),
  },
  {
    key: "con-gau",
    vi: "con gấu",
    en: "bear",
    cat: "animal",
    draw: () => quad({ body: C.bear, ear: "round", muzzle: C.bearMuzzle }),
  },
  {
    key: "con-cao",
    vi: "con cáo",
    en: "fox",
    cat: "animal",
    draw: () =>
      quad({
        body: C.fox,
        ear: "point",
        muzzle: C.foxWhite,
        onTop: ellipse(84, 34, 6, 5, C.foxWhite),
      }),
  },
  {
    key: "con-huou",
    vi: "con hươu",
    en: "deer",
    cat: "animal",
    draw: () =>
      quad({
        body: C.deer,
        ear: "round",
        onTop:
          path(`M20 22c-4-10-1-16 5-17 1 7-1 12-5 17Z`, C.deerAntler) +
          path(`M40 22c4-10 1-16-5-17-1 7 1 12 5 17Z`, C.deerAntler) +
          circle(56, 52, 4, C.deerSpot) +
          circle(64, 62, 4, C.deerSpot) +
          circle(48, 66, 3.5, C.deerSpot),
      }),
  },
  {
    key: "con-soc",
    vi: "con sóc",
    en: "squirrel",
    cat: "animal",
    draw: () =>
      dropShadow(50, 90, 22) +
      ellipse(46, 68, 16, 18, C.squirrel) +
      path(`M46 50a16 18 0 0 1 16 18c0 10-8 18-16 18Z`, shade(C.squirrel)) +
      circle(40, 42, 13, C.squirrel) +
      circle(30, 30, 6, shade(C.squirrel)) +
      circle(48, 28, 6, shade(C.squirrel)) +
      path(`M60 30c14-6 24 2 22 16-4 14-16 20-28 16 10-8 14-18 6-32Z`, C.squirrel) +
      path(`M60 30c14-6 24 2 22 16-4 10-12 16-20 16 6-10 6-22-2-32Z`, shade(C.squirrel)) +
      ellipse(40, 68, 8, 10, C.squirrelBelly) +
      eye(34, 40, 4) +
      eye(46, 38, 4),
  },
  {
    key: "ga-con",
    vi: "gà con",
    en: "chick",
    cat: "animal",
    draw: () =>
      dropShadow(50, 82, 20) +
      ball(50, 54, 26, C.chick) +
      path(`M70 52 84 56 70 60Z`, C.chickBeak) +
      eye(42, 46, 4.5) +
      path(`M30 60c-6 6-6 14 0 20 4-8 4-14 0-20Z`, shade(C.chick)),
  },
  {
    key: "con-ca-voi",
    vi: "cá voi",
    en: "whale",
    cat: "animal",
    draw: () =>
      dropShadow(50, 90, 34) +
      path(`M10 60c0-20 20-32 46-32s44 12 44 30-18 26-44 26S10 78 10 60Z`, C.whale) +
      path(`M56 28c26 0 44 12 44 30s-18 26-44 26Z`, shade(C.whale)) +
      ellipse(40, 70, 26, 12, C.whaleBelly) +
      path(`M94 56 108 46 100 62Z`, shade(C.whale)) +
      path(`M50 26c2-10 8-14 10-10 2 6-2 10-10 10Z`, "#BEE6F5") +
      eye(28, 52, 5),
  },
  {
    key: "ca-heo",
    vi: "cá heo",
    en: "dolphin",
    cat: "animal",
    draw: () =>
      dropShadow(50, 90, 30) +
      path(
        `M12 66c4-24 26-40 52-38 20 2 32 14 30 26-2 10-14 16-30 14C40 66 22 78 12 66Z`,
        C.dolphin,
      ) +
      path(`M64 28c20 2 32 14 30 26-2 10-14 16-30 14 10-10 12-26 0-40Z`, shade(C.dolphin)) +
      ellipse(36, 62, 18, 8, C.dolphinBelly) +
      path(`M56 30c2-10 10-14 14-10-2 8-8 12-14 10Z`, shade(C.dolphin)) +
      path(`M12 66c-8 2-14 8-14 16 8-2 14-8 14-16Z`, C.dolphin) +
      eye(70, 42, 4),
  },
  {
    key: "bach-tuoc",
    vi: "bạch tuộc",
    en: "octopus",
    cat: "animal",
    draw: () =>
      dropShadow(50, 88, 30) +
      circle(50, 46, 26, C.octopus) +
      path(`M50 20a26 26 0 0 1 26 26H50Z`, shade(C.octopus)) +
      eye(40, 42, 5) +
      eye(60, 42, 5) +
      path(`M28 60c-4 10 0 20 8 22 2-10 0-18-8-22Z`, C.octopus) +
      path(`M40 66c-2 10 2 18 10 20 0-10-2-16-10-20Z`, shade(C.octopus)) +
      path(`M60 66c2 10-2 18-10 20 0-10 2-16 10-20Z`, C.octopus) +
      path(`M72 60c4 10 0 20-8 22-2-10 0-18 8-22Z`, shade(C.octopus)),
  },
  {
    key: "con-cua",
    vi: "con cua",
    en: "crab",
    cat: "animal",
    draw: () =>
      dropShadow(50, 84, 28) +
      ellipse(50, 58, 28, 20, C.crab) +
      path(`M50 38a28 20 0 0 1 28 20c0 8-6 14-14 16 4-12 0-24-14-36Z`, shade(C.crab)) +
      path(`M18 46c-10-6-18-2-18 8s10 12 18 6c-4-6-4-10 0-14Z`, C.crabClaw) +
      path(`M82 46c10-6 18-2 18 8s-10 12-18 6c4-6 4-10 0-14Z`, C.crabClaw) +
      line(34, 74, 28, 84, shade(C.crab), 4) +
      line(66, 74, 72, 84, shade(C.crab), 4) +
      eye(38, 46, 5) +
      eye(62, 46, 5),
  },
  {
    key: "sao-bien",
    vi: "sao biển",
    en: "starfish",
    cat: "animal",
    draw: () =>
      dropShadow(50, 90, 26) +
      star(50, 54, 34, C.starfish) +
      circle(50, 44, 3, light(C.starfish)) +
      circle(38, 58, 3, light(C.starfish)) +
      circle(62, 58, 3, light(C.starfish)),
  },
  {
    key: "ca-map",
    vi: "cá mập",
    en: "shark",
    cat: "animal",
    draw: () =>
      dropShadow(50, 88, 32) +
      path(`M8 62c0-16 20-28 46-28s44 14 44 26-16 22-44 22S8 78 8 62Z`, C.shark) +
      path(`M54 34c28 0 44 14 44 26s-16 22-44 22c8-16 8-32 0-48Z`, shade(C.shark)) +
      ellipse(40, 70, 22, 10, C.sharkBelly) +
      path(`M40 30c4-14 12-18 14-14-2 8-6 12-14 14Z`, C.shark) +
      path(`M96 58 108 50 100 66Z`, shade(C.shark)) +
      path(`M14 66c6 2 12 0 14-4-6-2-12-2-14 4Z`, P.white) +
      eye(24, 52, 4.5),
  },
  {
    key: "con-kien",
    vi: "con kiến",
    en: "ant",
    cat: "animal",
    draw: () =>
      dropShadow(50, 86, 24) +
      circle(30, 60, 12, C.ant) +
      circle(50, 54, 10, shade(C.ant)) +
      circle(68, 48, 13, C.ant) +
      line(38, 58, 30, 74, shade(C.ant), 3) +
      line(48, 58, 44, 76, shade(C.ant), 3) +
      line(58, 54, 60, 76, shade(C.ant), 3) +
      line(24, 52, 12, 44, shade(C.ant), 3) +
      eye(72, 44, 3.5),
  },
  {
    key: "con-nhen",
    vi: "con nhện",
    en: "spider",
    cat: "animal",
    draw: () =>
      dropShadow(50, 86, 26) +
      circle(50, 56, 22, C.spider) +
      path(`M50 34a22 22 0 0 1 22 22H50Z`, shade(C.spider)) +
      line(40, 36, 30, 20, shade(C.spider), 3) +
      line(32, 46, 14, 34, shade(C.spider), 4) +
      line(30, 56, 10, 54, shade(C.spider), 4) +
      line(32, 66, 14, 78, shade(C.spider), 4) +
      line(60, 36, 70, 20, shade(C.spider), 3) +
      line(68, 46, 86, 34, shade(C.spider), 4) +
      line(70, 56, 90, 54, shade(C.spider), 4) +
      line(68, 66, 86, 78, shade(C.spider), 4) +
      eye(42, 50, 4) +
      eye(58, 50, 4),
  },
  {
    key: "con-oc-sen",
    vi: "ốc sên",
    en: "snail",
    cat: "animal",
    draw: () =>
      dropShadow(50, 88, 28) +
      path(`M20 70c0-16 30-30 46-14-10 2-16 10-14 18 8-6 14-2 12 6-14 6-30-2-44-10Z`, C.snailBody) +
      circle(56, 50, 22, C.snail) +
      path(`M56 28a22 22 0 0 1 22 22 22 22 0 0 1-22 22Z`, shade(C.snail)) +
      circle(56, 50, 12, light(C.snail)) +
      circle(56, 50, 5, shade(C.snail)) +
      line(24, 58, 14, 46, shade(C.snailBody), 3) +
      circle(14, 44, 3, C.snailBody),
  },
  {
    key: "con-sau",
    vi: "con sâu",
    en: "worm",
    cat: "animal",
    draw: () =>
      dropShadow(50, 86, 30) +
      ellipse(24, 66, 12, 11, C.worm) +
      ellipse(40, 54, 12, 11, shade(C.worm)) +
      ellipse(56, 60, 12, 11, C.worm) +
      ellipse(70, 46, 12, 11, shade(C.worm)) +
      ellipse(80, 58, 11, 10, C.worm) +
      eye(22, 60, 3.5),
  },
];
