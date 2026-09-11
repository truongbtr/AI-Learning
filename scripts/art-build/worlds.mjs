/**
 * The worlds, three layers deep (STYLE.md §5): sky · mid · fore, same 1600 × 1000 viewBox so they
 * stack exactly, each moving at its own speed for the parallax.
 *
 * The rectangle (400,180)–(1200,700) is the safe area: the question and the answers live there, so
 * nothing eye-catching is drawn inside it. Scenery goes to the sides and along the bottom.
 */
import {
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

const W = 1600;
const H = 1000;
const GROUND_Y = 790;

// ------------------------------------------------------------------ shared pieces
const skyGradient = (id, top, bottom) =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
  `<stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>`;

const cloud = (x, y, s, tint = "#DCEEFF") =>
  g(
    ellipse(0, 10, 96, 42, tint) +
      circle(-40, -4, 40, P.white) +
      circle(10, -20, 50, P.white) +
      circle(56, 0, 36, P.white) +
      ellipse(0, 36, 92, 20, tint),
    { transform: `translate(${x} ${y}) scale(${s})` },
  );

const hills = (yFar, far, near) =>
  path(`M0 ${yFar}c220-96 340-16 500-64 176-52 274 42 450 8 154-30 292 38 650-46V${H}H0Z`, far) +
  path(
    `M0 ${yFar + 70}c260-70 416 12 588-28 190-44 322 50 500 18 136-24 256 18 512-32V${H}H0Z`,
    near,
  );

const groundStrip = (colour, colourDark, topLight) =>
  rect(0, GROUND_Y, W, H - GROUND_Y, 0, colourDark) +
  path(`M0 ${GROUND_Y}h${W}v40a2600 2600 0 0 1-${W} 0Z`, colour) +
  path(`M0 ${GROUND_Y}h${W}v14a2600 2600 0 0 1-${W} 0Z`, topLight);

const grassTuft = (x, y, s, colour, dark) =>
  g(
    path(`M0 0c10 16 10 30 0 40-12-12-12-26 0-40Z`, colour) +
      path(`M16 4c12 12 14 26 4 36-14-10-16-24-4-36Z`, dark) +
      path(`M-16 6c-12 12-14 24-4 34 14-10 16-22 4-34Z`, dark),
    { transform: `translate(${x} ${y}) scale(${s})` },
  );

const grassRow = (colour, dark, xs) =>
  g(xs.map(([x, s]) => grassTuft(x, GROUND_Y + 18, s, colour, dark)).join(""), { id: "grass" });

const sun = (x, y, r) =>
  g(circle(x, y, r, "#FFD447") + circle(x - r * 0.26, y - r * 0.26, r * 0.66, "#FFE896"), {
    id: "sun",
  });

const gear = (x, y, s, colour, dark) => {
  let teeth = "";
  for (let i = 0; i < 8; i++)
    teeth += rect(-11, -62, 22, 26, 7, dark, { transform: `rotate(${i * 45})` });
  return g(
    teeth + circle(0, 0, 44, colour) + circle(0, 0, 16, dark) + circle(0, 0, 9, shade(dark)),
    { transform: `translate(${x} ${y}) scale(${s})` },
  );
};

const window4 = (x, y, w, h, lit, dark) =>
  rect(x, y, w, h, 14, lit) + rect(x + w * 0.52, y, w * 0.48, h, 14, dark);

// ------------------------------------------------------------------ robot city
const R = P.robot;

function robotSky(extra = "") {
  return (
    skyGradient("sky", R.skyTop, R.skyBottom) +
    rect(0, 0, W, H, 0, "url(#sky)") +
    sun(1410, 150, 78) +
    g(
      cloud(250, 190, 1.1) + cloud(700, 120, 0.72) + cloud(1180, 240, 0.85) + cloud(1520, 400, 0.6),
      {
        id: "clouds",
      },
    ) +
    hills(560, R.hillFar, R.hillNear) +
    extra
  );
}

function robotFore(props = "") {
  return (
    groundStrip(R.ground, R.groundDark, "#F8EFDD") +
    grassRow(R.grass, R.grassDark, [
      [80, 1.1],
      [300, 0.8],
      [1180, 0.9],
      [1420, 1.15],
      [1530, 0.7],
    ]) +
    props +
    g(sparkle(230, 300, 16) + sparkle(1330, 250, 12) + sparkle(120, 540, 10), {
      id: "sparkles",
      "fill-opacity": 0.85,
    })
  );
}

/** A block of the city: body, roof, windows, door. */
function building(x, y, w, h, opts = {}) {
  const { colour = R.building, roof = R.buildingDark, door = true } = opts;
  let out =
    rect(x, y, w, h, 30, colour) +
    path(
      `M${x + w * 0.55} ${y}h${w * 0.45 - 30}a30 30 0 0 1 30 30v${h - 60}a30 30 0 0 1-30 30h-${w * 0.45 - 30}Z`,
      shade(colour),
    ) +
    path(`M${x} ${y + 30}a30 30 0 0 1 30-30h${w - 60}a30 30 0 0 1 30 30v22H${x}Z`, roof);
  const cols = Math.max(2, Math.floor(w / 120));
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < cols; c++)
      out += window4(
        x + 34 + c * ((w - 68) / cols),
        y + 92 + r * 96,
        56,
        56,
        (r + c) % 2 ? "#DCEEFF" : P.reward,
        "#BBD6F2",
      );
  if (door)
    out +=
      rect(x + w / 2 - 46, y + h - 120, 92, 120, 22, R.buildingDark) +
      rect(x + w / 2 - 32, y + h - 104, 64, 104, 16, "#DCEEFF");
  return out;
}

const ZONES_ROBOT = {
  "xuong-so": {
    vi: "Xưởng Số",
    mid: () =>
      building(90, 430, 300, 360) +
      // chimney with smoke
      rect(150, 330, 58, 110, 16, R.metalDark) +
      rect(138, 312, 82, 30, 14, R.metal) +
      g(
        circle(178, 270, 22, P.white, { "fill-opacity": 0.9 }) +
          circle(210, 218, 30, P.white, { "fill-opacity": 0.8 }) +
          circle(176, 158, 20, P.white, { "fill-opacity": 0.6 }),
        { id: "smoke" },
      ) +
      g(gear(372, 402, 1, R.metal, R.metalDark) + gear(452, 470, 0.6, R.metal, R.metalDark), {
        id: "gears",
      }) +
      // number pylon on the right
      building(1240, 470, 280, 320, { colour: R.buildingLight }) +
      rect(1300, 372, 160, 100, 26, R.metal) +
      `<text x="1380" y="446" text-anchor="middle" font-family="Nunito, sans-serif" font-size="76" font-weight="800" fill="${R.primary}">123</text>` +
      // conveyor
      rect(1160, 700, 420, 40, 18, R.metalDark) +
      circle(1200, 720, 26, R.metal) +
      circle(1300, 720, 26, R.metal) +
      circle(1400, 720, 26, R.metal),
    fore: () =>
      gear(190, 880, 0.9, R.metal, R.metalDark) +
      gear(1500, 900, 1.2, R.metal, R.metalDark) +
      circle(1360, 880, 16, R.metalDark) +
      circle(1392, 906, 11, R.metalDark),
  },
  "thap-chu": {
    vi: "Tháp Chữ",
    mid: () => {
      let blocks = "";
      const letters = ["A", "B", "C"];
      for (let i = 0; i < 3; i++)
        blocks +=
          rect(150, 690 - i * 110, 200 - i * 20, 100, 26, i % 2 ? R.buildingLight : R.primary) +
          `<text x="${250 - i * 10}" y="${758 - i * 110}" text-anchor="middle" font-family="Nunito, sans-serif" font-size="64" font-weight="800" fill="${P.white}">${letters[i]}</text>`;
      return (
        blocks +
        building(1230, 360, 300, 430, { colour: R.buildingLight }) +
        rect(1330, 250, 100, 120, 30, R.metal) +
        path(`M1380 190 1330 260h100Z`, R.accent) +
        // a big open book on a plinth
        rect(1180, 720, 400, 70, 20, R.metalDark) +
        path(`M1240 720c40-40 100-40 140 0 40-40 100-40 140 0Z`, P.white) +
        path(`M1380 720c40-40 100-40 140 0Z`, "#E8EEF6")
      );
    },
    fore: () =>
      rect(70, 840, 150, 60, 18, R.primary) +
      `<text x="145" y="884" text-anchor="middle" font-family="Nunito, sans-serif" font-size="44" font-weight="800" fill="${P.white}">a b</text>` +
      circle(1480, 880, 18, R.metalDark),
  },
  "tram-khong-gian": {
    vi: "Trạm Không Gian",
    mid: () =>
      // dome
      path(`M90 790V620a170 170 0 0 1 340 0v170Z`, R.metal) +
      path(`M260 450a170 170 0 0 1 170 170v170H260Z`, R.metalDark) +
      rect(180, 610, 160, 110, 30, "#DCEEFF") +
      rect(260, 610, 80, 110, 30, "#BBD6F2") +
      // launch pad + rocket
      rect(1180, 700, 340, 90, 24, R.metalDark) +
      g(
        path(`M0-230c46 46 68 104 68 164H-68c0-60 22-118 68-164Z`, "#F3F7FC") +
          path(`M0-230c-46 46-68 104-68 164H0Z`, P.white) +
          path(`M-68-66c-38 14-60 50-60 92l60-24Z`, R.accent) +
          path(`M68-66c38 14 60 50 60 92l-60-24Z`, shade(R.accent)) +
          circle(0, -140, 36, R.primary) +
          circle(-10, -152, 16, "#8FC3FF") +
          rect(-28, -14, 56, 36, 14, R.metal),
        { id: "rocket", transform: "translate(1350 700)" },
      ) +
      // satellite in the sky corner
      g(
        rect(-60, -14, 120, 28, 12, R.metal) +
          rect(-16, -40, 32, 80, 10, R.primary) +
          circle(0, 0, 18, P.reward),
        { id: "satellite", transform: "translate(1460 280) rotate(-18)" },
      ),
    fore: () =>
      circle(120, 900, 40, R.metalDark, { "fill-opacity": 0.5 }) +
      circle(240, 930, 26, R.metalDark, { "fill-opacity": 0.45 }) +
      star(1520, 860, 26) +
      star(60, 840, 18),
  },
  "ben-tau-tieng-anh": {
    vi: "Bến Tàu Tiếng Anh",
    mid: () =>
      // water
      rect(0, 640, W, 150, 0, "#5BC0E8") +
      path(`M0 640h${W}v26a1600 1600 0 0 1-${W} 0Z`, "#8AD4F0") +
      // boat on the left
      g(
        path(`M-150 40h300l-40 70h-220Z`, R.accent) +
          path(`M0 40h150l-40 70H0Z`, shade(R.accent)) +
          rect(-30, -110, 16, 150, 8, R.metalDark) +
          path(`M-14-104 110 0H-14Z`, P.white) +
          path(`M-30-104-120 0h90Z`, "#DCEEFF"),
        { id: "boat", transform: "translate(230 620)" },
      ) +
      // containers stacked right
      rect(1180, 610, 180, 90, 18, R.primary) +
      rect(1380, 610, 180, 90, 18, R.accent) +
      rect(1280, 510, 180, 90, 18, "#7BC67E") +
      // lighthouse
      rect(1460, 300, 90, 220, 24, P.white) +
      rect(1460, 340, 90, 40, 0, R.accent) +
      rect(1460, 430, 90, 40, 0, R.accent) +
      circle(1505, 290, 40, P.reward),
    fore: () =>
      rect(0, 800, W, 26, 12, "#C08A4E") +
      rect(120, 826, 26, 90, 8, "#A9764E") +
      rect(1420, 826, 26, 90, 8, "#A9764E") +
      circle(300, 880, 22, P.white, { "fill-opacity": 0.6 }) +
      circle(1180, 910, 16, P.white, { "fill-opacity": 0.5 }),
  },
};

// ------------------------------------------------------------------ magic garden
const G = P.garden;

function gardenSky(extra = "") {
  return (
    skyGradient("sky", G.skyTop, G.skyBottom) +
    rect(0, 0, W, H, 0, "url(#sky)") +
    sun(1400, 160, 74) +
    g(
      cloud(230, 200, 1.05, "#FFD9EA") +
        cloud(760, 130, 0.7, "#FFD9EA") +
        cloud(1230, 250, 0.8, "#FFD9EA"),
      {
        id: "clouds",
      },
    ) +
    hills(560, G.hillFar, G.hillNear) +
    g(
      sparkle(320, 330, 18, P.white) +
        sparkle(1280, 300, 14, P.white) +
        sparkle(880, 150, 12, P.white),
      {
        id: "sparkles",
      },
    ) +
    extra
  );
}

const flower = (x, y, s, petal, centre = P.reward) =>
  g(
    rect(-7, 0, 14, 120, 7, G.grassDark) +
      leaf(8, 78, 44, G.grass, 62) +
      leaf(-8, 96, 38, G.grassDark, -62) +
      circle(0, -34, 30, petal) +
      circle(-44, -6, 30, petal) +
      circle(44, -6, 30, petal) +
      circle(-27, 42, 30, shade(petal)) +
      circle(27, 42, 30, shade(petal)) +
      circle(0, 0, 28, centre),
    { transform: `translate(${x} ${y}) scale(${s})` },
  );

const ZONES_GARDEN = {
  "vuon-so": {
    vi: "Vườn Số",
    mid: () =>
      // arch on the left
      path(`M110 790V560a150 150 0 0 1 300 0v230h-60V560a90 90 0 0 0-180 0v230Z`, G.magic) +
      path(`M260 410a150 150 0 0 1 150 150v230h-60V560a90 90 0 0 0-90-90Z`, shade(G.magic)) +
      circle(180, 500, 22, G.petal) +
      circle(340, 500, 22, G.petal) +
      // pond on the right
      ellipse(1370, 720, 230, 86, "#8AD4F0") +
      ellipse(1370, 706, 230, 80, "#A8E2F6") +
      path(`M1240 700a40 14 0 0 0 62 0 40 14 0 0 0 62 0`, "none", {
        stroke: P.white,
        "stroke-width": 8,
        fill: "none",
        "stroke-linecap": "round",
      }) +
      // little castle behind the pond
      rect(1180, 470, 90, 220, 20, P.white) +
      rect(1300, 420, 120, 270, 22, "#FFF0F7") +
      rect(1450, 500, 90, 190, 20, P.white) +
      path(`M1180 470 1225 400l45 70Z`, G.primary) +
      path(`M1300 420 1360 340l60 80Z`, G.primary) +
      path(`M1450 500 1495 430l45 70Z`, G.primary) +
      // numbered stepping stones (this is the number garden)
      [1, 2, 3].map((_n, i) => ellipse(520 + i * 130, 770, 52, 20, "#E7D2AE")).join("") +
      [1, 2, 3]
        .map(
          (n, i) =>
            `<text x="${520 + i * 130}" y="${780}" text-anchor="middle" font-family="Nunito, sans-serif" font-size="34" font-weight="800" fill="${G.primary}">${n}</text>`,
        )
        .join(""),
    fore: () =>
      flower(150, 830, 0.85, G.petal) +
      flower(300, 870, 0.6, G.magic) +
      flower(1490, 840, 0.9, G.petal) +
      flower(1330, 890, 0.55, G.magic) +
      g(sparkle(420, 640, 14, P.white) + sparkle(1200, 600, 12, P.white), { id: "sparkles" }),
  },
};

// ------------------------------------------------------------------ build
export function buildWorlds(write, svg) {
  const out = [];
  const emit = (world, zone, layer, body, title) => {
    const file = `worlds/${world}/${zone}-${layer}.svg`;
    const res = write(file, svg(`0 0 ${W} ${H}`, body, { title }));
    out.push({ file: `art/${file}`, bytes: res.bytes, kind: "world" });
  };

  for (const [zone, def] of Object.entries(ZONES_ROBOT)) {
    emit(
      "robot",
      zone,
      "sky",
      g(robotSky(), { id: "layer-sky" }),
      `Thành phố Robot — ${def.vi} — trời`,
    );
    emit(
      "robot",
      zone,
      "mid",
      g(def.mid(), { id: "layer-mid" }),
      `Thành phố Robot — ${def.vi} — công trình`,
    );
    emit(
      "robot",
      zone,
      "fore",
      g(robotFore(def.fore()), { id: "layer-fore" }),
      `Thành phố Robot — ${def.vi} — tiền cảnh`,
    );
  }
  for (const [zone, def] of Object.entries(ZONES_GARDEN)) {
    emit(
      "garden",
      zone,
      "sky",
      g(gardenSky(), { id: "layer-sky" }),
      `Vườn Kỳ Diệu — ${def.vi} — trời`,
    );
    emit(
      "garden",
      zone,
      "mid",
      g(def.mid(), { id: "layer-mid" }),
      `Vườn Kỳ Diệu — ${def.vi} — công trình`,
    );
    emit(
      "garden",
      zone,
      "fore",
      g(
        groundStrip(G.ground, G.groundDark, "#FCF3E4") +
          grassRow(G.grass, G.grassDark, [
            [90, 1],
            [380, 0.7],
            [1150, 0.8],
            [1560, 1.1],
          ]) +
          def.fore(),
        { id: "layer-fore" },
      ),
      `Vườn Kỳ Diệu — ${def.vi} — tiền cảnh`,
    );
  }
  return out;
}

export const ZONE_LIST = [
  ...Object.keys(ZONES_ROBOT).map((z) => `robot/${z}`),
  ...Object.keys(ZONES_GARDEN).map((z) => `garden/${z}`),
];
