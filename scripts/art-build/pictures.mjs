/**
 * The six weekly pictures (docs/06 §1.8c item 2): one per week, six pieces each, a piece a day.
 *
 * Same hand-drawn rules as everything else in STYLE.md — no outlines, three tones per shape, light
 * from the top left. A picture is 1200 × 800 and is cut into a 3 × 2 grid by the component, so
 * nothing important is drawn on the seams at x = 400/800 and y = 400.
 */
import {
  ball,
  blob,
  circle,
  ellipse,
  g,
  leaf,
  PALETTE as P,
  path,
  rect,
  shade,
  sparkle,
  star,
} from "./lib.mjs";

const W = 1200;
const H = 800;

const sky = (id, top, bottom) =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
  `<stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>` +
  rect(0, 0, W, H, 0, `url(#${id})`);

const ground = (y, colour, dark) =>
  rect(0, y, W, H - y, 0, dark) + path(`M0 ${y}h${W}v34a1800 1800 0 0 1-${W} 0Z`, colour);

const cloud = (x, y, s, tint = "#FFFFFF") =>
  g(ellipse(0, 8, 74, 32, shade(tint)) + circle(-30, -4, 30, tint) + circle(8, -16, 38, tint), {
    transform: `translate(${x} ${y}) scale(${s})`,
    opacity: 0.9,
  });

const flower = (x, y, colour, s = 1) =>
  g(
    path(`M0 46v-40`, "none", { stroke: P.garden.grassDark, "stroke-width": 8 }) +
      leaf(-16, 20, 26, P.garden.grass, -30) +
      [0, 72, 144, 216, 288]
        .map((a) => ellipse(0, -26, 16, 24, colour, { transform: `rotate(${a} 0 0)` }))
        .join("") +
      circle(0, 0, 15, P.reward),
    { transform: `translate(${x} ${y}) scale(${s})` },
  );

const tree = (x, y, s = 1) =>
  g(
    rect(-14, -70, 28, 140, 12, "#B98A5A") +
      ball(-46, -110, 56, P.garden.grass) +
      ball(40, -120, 60, P.garden.grass) +
      ball(-2, -160, 66, P.robot.grass),
    { transform: `translate(${x} ${y}) scale(${s})` },
  );

const fish = (x, y, colour, s = 1) =>
  g(
    ellipse(0, 0, 46, 30, colour) +
      path("M40 0l38-26v52Z", shade(colour)) +
      circle(-18, -8, 7, P.white) +
      circle(-18, -8, 4, P.ink),
    { transform: `translate(${x} ${y}) scale(${s})` },
  );

const building = (x, y, w, h, colour) =>
  g(
    rect(0, -h, w, h, 16, colour) +
      path(`M0 ${-h}h${w * 0.42}v${h}H0Z`, shade(colour), { opacity: 0.35 }) +
      Array.from({ length: Math.floor(h / 70) }, (_, r) =>
        Array.from({ length: Math.max(1, Math.floor(w / 56)) }, (_, c) =>
          rect(16 + c * 56, -h + 28 + r * 70, 30, 34, 8, P.reward, { opacity: 0.85 }),
        ).join(""),
      ).join(""),
    { transform: `translate(${x} ${y})` },
  );

const lantern = (x, y, colour, s = 1) =>
  g(
    path("M0 -60v18", "none", { stroke: "#C08A3E", "stroke-width": 6 }) +
      ellipse(0, 0, 38, 46, colour) +
      ellipse(-12, -10, 12, 20, "#FFFFFF", { opacity: 0.35 }) +
      rect(-16, -48, 32, 12, 6, "#C08A3E") +
      rect(-16, 36, 32, 12, 6, "#C08A3E") +
      path("M0 48v26", "none", { stroke: "#E05A5A", "stroke-width": 6 }),
    { transform: `translate(${x} ${y}) scale(${s})` },
  );

const SCENES = {
  "vuon-hoa": () =>
    sky("s1", P.garden.skyTop, P.garden.skyBottom) +
    ball(1030, 150, 72, P.reward) +
    cloud(230, 150, 1) +
    cloud(880, 96, 0.8) +
    path(`M0 470c180-70 300 26 470-10 190-40 300 44 730-30V${H}H0Z`, P.garden.hillFar) +
    ground(600, P.garden.grass, P.garden.grassDark) +
    tree(180, 640, 0.9) +
    flower(430, 660, P.garden.petal) +
    flower(560, 690, "#FFB0D6", 1.15) +
    flower(700, 650, P.garden.magic, 0.9) +
    flower(860, 700, P.reward) +
    sparkle(980, 520, 16, P.white) +
    sparkle(320, 430, 12, P.white),

  "thanh-pho": () =>
    sky("s2", "#2B3A64", "#5A76B8") +
    ball(980, 140, 58, "#FFF3C4") +
    [star(180, 120, 10), star(420, 90, 8), star(720, 150, 9), star(1120, 250, 8)].join("") +
    path(`M0 520c200-40 320 20 520-12 210-34 320 30 680-18V${H}H0Z`, "#3D5289") +
    building(120, 640, 150, 260, P.robot.building) +
    building(320, 640, 190, 350, P.robot.buildingDark) +
    building(560, 640, 160, 220, P.robot.buildingLight) +
    building(770, 640, 200, 300, P.robot.building) +
    building(1010, 640, 130, 190, P.robot.buildingDark) +
    ground(640, P.robot.ground, P.robot.groundDark) +
    blob(520, 690, 120, 70, 26, P.robot.metal) +
    circle(560, 700, 18, P.robot.accent),

  "bien-xanh": () =>
    sky("s3", "#BFF0FF", "#3FA9D6") +
    ball(1050, 130, 64, P.reward) +
    fish(300, 420, P.robot.accent, 1.1) +
    fish(640, 300, "#FF8FB1") +
    fish(840, 470, P.reward, 0.9) +
    fish(460, 560, "#7BE0C6", 1.2) +
    [sparkle(220, 250, 12), sparkle(900, 210, 14), sparkle(520, 180, 10)].join("") +
    ground(690, "#F3E0B8", "#DCC49A") +
    ellipse(200, 720, 70, 26, "#EFD3A4") +
    [0, 1, 2].map((i) => leaf(980 + i * 40, 700, 90, "#3FA36B", -30 + i * 30)).join(""),

  "rung-cay": () =>
    sky("s4", "#E6F6E1", "#BFE6C8") +
    cloud(300, 130, 0.9) +
    cloud(880, 170, 0.7) +
    path(`M0 480c210-60 330 20 520-14 200-36 330 34 680-24V${H}H0Z`, "#8FD0A0") +
    ground(620, P.robot.grass, P.robot.grassDark) +
    tree(180, 620, 1.05) +
    tree(980, 640, 0.95) +
    tree(620, 600, 0.8) +
    g(
      ellipse(0, 0, 40, 30, "#C98A5B") + circle(-14, -12, 10, P.white) + circle(-14, -12, 5, P.ink),
      {
        transform: "translate(430 690)",
      },
    ) +
    sparkle(760, 420, 14, P.white),

  "bau-troi": () =>
    sky("s5", "#1F2A52", "#4C5BA6") +
    ball(260, 180, 70, "#FFF6D0") +
    [
      star(560, 140, 16),
      star(760, 230, 12),
      star(980, 130, 14),
      star(1080, 330, 10),
      star(420, 330, 11),
      star(160, 420, 9),
      star(880, 430, 12),
    ].join("") +
    path(`M0 560c220-50 340 24 540-8 206-32 330 38 660-20V${H}H0Z`, "#33407A") +
    ground(660, "#3E4C8C", "#2E3A6E") +
    [220, 520, 820].map((x) => tree(x, 690, 0.6)).join(""),

  "ngay-hoi": () =>
    sky("s6", "#3A2B52", "#7A4F86") +
    ball(1020, 150, 60, "#FFF3C4") +
    lantern(220, 220, "#E0554F", 1.1) +
    lantern(430, 160, P.reward) +
    lantern(640, 230, "#E0554F", 0.9) +
    lantern(860, 170, "#F08A3C", 1.05) +
    path(`M0 540c200-44 330 20 520-10 200-32 330 34 680-22V${H}H0Z`, "#5B3F72") +
    ground(650, "#7A5A47", "#5E4536") +
    [sparkle(320, 430, 12), sparkle(760, 460, 14), sparkle(1080, 390, 10)].join(""),
};

export function buildPictures(write, svg) {
  const out = [];
  for (const [theme, draw] of Object.entries(SCENES)) {
    const file = `pictures/${theme}.svg`;
    const { bytes } = write(file, svg(`0 0 ${W} ${H}`, draw(), { title: theme }));
    out.push({ file: `art/${file}`, bytes, kind: "picture" });
  }
  return out;
}
