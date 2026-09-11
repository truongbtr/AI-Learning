/**
 * The two companions, each in the nine states docs/06 §1.7 requires:
 * idle · greet · talk · think · cheer · encourage · celebrate · sleep · listen.
 *
 * One rig per character, nine poses on top of it. Every moving part keeps its own `id`
 * (head, eye-l, eye-r, mouth, arm-l, arm-r, antenna, body, shadow) so Framer Motion can breathe,
 * blink and wave without the SVG being redrawn — see STYLE.md §6.
 */
import {
  circle,
  ellipse,
  eye,
  g,
  light,
  PALETTE as P,
  path,
  rect,
  shade,
  sparkle,
  star,
} from "./lib.mjs";

const STATES = [
  "idle",
  "greet",
  "talk",
  "think",
  "cheer",
  "encourage",
  "celebrate",
  "sleep",
  "listen",
];

/** Zzz for the sleeping pose. */
const zzz = (x, y) =>
  g(
    `<text x="0" y="0" font-family="Nunito, sans-serif" font-size="26" font-weight="800" fill="${P.inkSoft}">z</text>` +
      `<text x="20" y="-20" font-family="Nunito, sans-serif" font-size="34" font-weight="800" fill="${P.inkSoft}">z</text>` +
      `<text x="46" y="-46" font-family="Nunito, sans-serif" font-size="44" font-weight="800" fill="${P.inkSoft}">z</text>`,
    { id: "zzz", transform: `translate(${x} ${y})`, "fill-opacity": 0.75 },
  );

/** The little arc of sound a listening character hears. */
const soundWaves = (x, y, colour) =>
  g(
    [14, 26, 38]
      .map(
        (r, i) =>
          `<path d="M0 ${-r} a ${r} ${r} 0 0 1 0 ${r * 2}" fill="none" stroke="${colour}" stroke-width="5" stroke-linecap="round" opacity="${0.9 - i * 0.22}"/>`,
      )
      .join(""),
    { id: "waves", transform: `translate(${x} ${y})` },
  );

/** Confetti around the character — the mascot sits at 0,0 so these are centred on it. */
const confettiBits = (colours) =>
  g(
    colours
      .concat(colours)
      .map((c, i) => {
        const x = -140 + ((i * 71) % 280);
        const y = -170 + ((i * 53) % 230);
        const r = (i * 47) % 360;
        return `<rect x="${x}" y="${y}" width="11" height="16" rx="5" fill="${c}" transform="rotate(${r} ${x + 5} ${y + 8})"/>`;
      })
      .join(""),
    { id: "confetti" },
  );

// ------------------------------------------------------------------ robot
const R = {
  metal: "#C9D6E6",
  metalLight: "#DDE6F1",
  metalDark: "#A9BDD3",
  face: "#2B3A4A",
  screen: "#7FD3FF",
  chest: "#2F80ED",
  bulb: "#FF8C42",
};

function robot(state) {
  const asleep = state === "sleep";
  const looking = { think: [-5, 2], listen: [4, -2], encourage: [0, 3] }[state] ?? [0, 0];
  const eyeR = state === "cheer" || state === "celebrate" ? 17 : 15;
  const mouth = {
    idle: `M-14 -2a14 10 0 0 0 28 0Z`,
    greet: `M-18 -4a18 14 0 0 0 36 0Z`,
    talk: `M-13 -6a13 16 0 0 0 26 0Z`,
    think: `M-12 2h20`,
    cheer: `M-20 -6a20 18 0 0 0 40 0Z`,
    encourage: `M-16 -2a16 10 0 0 0 32 0Z`,
    celebrate: `M-22 -8a22 20 0 0 0 44 0Z`,
    sleep: `M-10 0a10 8 0 0 0 20 0Z`,
    listen: `M-10 -2a10 8 0 0 0 20 0Z`,
  }[state];

  // arms: [left transform, right transform]
  const arms = {
    idle: ["", ""],
    greet: ["translate(-58 26) rotate(152)", ""],
    talk: ["", "translate(62 34) rotate(-18)"],
    think: ["", "translate(52 20) rotate(-108)"],
    cheer: ["translate(-58 20) rotate(168)", "translate(58 20) rotate(-168)"],
    encourage: ["", "translate(58 30) rotate(-56)"],
    celebrate: ["translate(-58 18) rotate(176)", "translate(58 18) rotate(-176)"],
    sleep: ["", ""],
    listen: ["", "translate(56 24) rotate(-96)"],
  }[state];

  // A raised arm is drawn after the head, or the head hides the hand.
  const raisedL = Boolean(arms[0]);
  const raisedR = Boolean(arms[1]);
  const armL = raisedL
    ? g(rect(-14, -10, 28, 86, 14, R.metal) + circle(0, 82, 19, R.metalLight), {
        id: "arm-l",
        transform: arms[0],
      })
    : g(rect(-90, 28, 28, 72, 14, R.metal) + circle(-76, 104, 19, R.metalLight), { id: "arm-l" });
  const armR = raisedR
    ? g(rect(-14, -10, 28, 86, 14, shade(R.metal)) + circle(0, 82, 19, R.metal), {
        id: "arm-r",
        transform: arms[1],
      })
    : g(rect(62, 28, 28, 72, 14, shade(R.metal)) + circle(76, 104, 19, R.metal), { id: "arm-r" });

  const bodyTilt = { cheer: -4, celebrate: 5, think: -3 }[state] ?? 0;
  const headTilt = { think: -8, listen: 10, encourage: 6, sleep: 12, greet: -4 }[state] ?? 0;

  return (
    (state === "celebrate"
      ? confettiBits(["#FFD447", "#FF8C42", "#2F80ED", "#7BC67E", "#E85D9C", "#7C5CFF"])
      : "") +
    g(ellipse(0, 168, 78, 17, "#8A6B3C", { "fill-opacity": 0.22 }), { id: "shadow" }) +
    g(
      // legs
      rect(-44, 108, 32, 54, 15, R.metalDark) +
        rect(12, 108, 32, 54, 15, R.metalDark) +
        rect(-52, 148, 48, 20, 10, "#6E8AA8") +
        rect(4, 148, 48, 20, 10, "#6E8AA8") +
        (raisedL ? "" : armL) +
        // body
        g(
          rect(-64, 14, 128, 108, 36, R.metal) +
            path(`M0 14h28a36 36 0 0 1 36 36v36a36 36 0 0 1-36 36H0Z`, shade(R.metal)) +
            rect(-40, 42, 80, 54, 18, R.chest) +
            rect(-32, 50, 64, 16, 8, light(R.chest)) +
            circle(-16, 80, 7, P.reward) +
            circle(4, 80, 7, R.bulb) +
            circle(24, 80, 7, "#7BC67E"),
          { id: "body" },
        ) +
        (raisedR ? "" : armR) +
        // head
        g(
          g(
            rect(-5, -98, 10, 26, 5, R.metalDark) +
              circle(0, -104, 13, R.bulb) +
              circle(-4, -108, 5, light(R.bulb)),
            {
              id: "antenna",
            },
          ) +
            rect(-74, -74, 148, 100, 34, R.metalLight) +
            path(`M0 -74h40a34 34 0 0 1 34 34v32a34 34 0 0 1-34 34H0Z`, shade(R.metalLight)) +
            rect(-60, -60, 120, 70, 24, R.face) +
            g(eye(-25, -28, eyeR, { look: looking, closed: asleep, pupil: P.white }), {
              id: "eye-l",
            }) +
            g(eye(25, -28, eyeR, { look: looking, closed: asleep, pupil: P.white }), {
              id: "eye-r",
            }) +
            (state === "think" ? path(`M-60 -28h120`, "none", { stroke: "none" }) : "") +
            path(mouth, state === "think" ? "none" : R.screen, {
              id: "mouth",
              stroke: state === "think" ? R.screen : undefined,
              "stroke-width": state === "think" ? 5 : undefined,
              "stroke-linecap": "round",
            }) +
            rect(-86, -42, 16, 36, 8, R.metalDark) +
            rect(70, -42, 16, 36, 8, R.metalDark),
          { id: "head", transform: `rotate(${headTilt} 0 -24)` },
        ) +
        (raisedL ? armL : "") +
        (raisedR ? armR : ""),
      { transform: `rotate(${bodyTilt} 0 120)` },
    ) +
    (asleep ? zzz(70, -70) : "") +
    (state === "listen" ? soundWaves(96, -30, R.chest) : "") +
    (state === "cheer" ? g(star(-96, -54, 20) + star(104, -30, 15), { id: "sparks" }) : "") +
    (state === "think"
      ? g(sparkle(96, -92, 14, R.screen) + circle(78, -58, 7, R.screen, { "fill-opacity": 0.5 }), {
          id: "sparks",
        })
      : "")
  );
}

// ------------------------------------------------------------------ owl
const O = {
  body: "#A87BD6",
  bodyDark: "#8E63BE",
  belly: "#F4E6FF",
  beak: "#FF8C42",
  foot: "#FF8C42",
};

function owl(state) {
  const asleep = state === "sleep";
  const looking = { think: [-6, 2], listen: [5, -2], encourage: [0, 3] }[state] ?? [0, 0];
  const eyeR = state === "cheer" || state === "celebrate" ? 36 : 34;
  const headTilt = { think: -10, listen: 12, encourage: 7, sleep: 14, greet: -5 }[state] ?? 0;
  const bodyTilt = { cheer: -4, celebrate: 5 }[state] ?? 0;

  // wings: default tucked; raised or pointing depending on the state
  const wing = (side, transform) =>
    g(
      path(
        side < 0
          ? `M0 0c-18 26-16 62 6 84 14-18 18-54 12-84Z`
          : `M0 0c18 26 16 62-6 84-14-18-18-54-12-84Z`,
        O.bodyDark,
      ),
      { id: side < 0 ? "arm-l" : "arm-r", transform },
    );
  const wings = {
    idle: [wing(-1, "translate(-78 6)"), wing(1, "translate(78 6)")],
    greet: [wing(-1, "translate(-78 6) rotate(-42)"), wing(1, "translate(78 6)")],
    talk: [wing(-1, "translate(-78 6)"), wing(1, "translate(78 6) rotate(18)")],
    think: [wing(-1, "translate(-78 6)"), wing(1, "translate(64 -10) rotate(122)")],
    cheer: [wing(-1, "translate(-78 0) rotate(-58)"), wing(1, "translate(78 0) rotate(58)")],
    encourage: [wing(-1, "translate(-78 6)"), wing(1, "translate(74 0) rotate(46)")],
    celebrate: [wing(-1, "translate(-78 -4) rotate(-70)"), wing(1, "translate(78 -4) rotate(70)")],
    sleep: [wing(-1, "translate(-78 10)"), wing(1, "translate(78 10)")],
    listen: [wing(-1, "translate(-78 6)"), wing(1, "translate(70 -6) rotate(104)")],
  }[state];

  const mouthOpen = { talk: 16, cheer: 22, celebrate: 26, greet: 12 }[state] ?? 0;

  return (
    (state === "celebrate"
      ? confettiBits(["#FFD447", "#E85D9C", "#7C5CFF", "#7BC67E", "#5BC0E8", "#FF8C42"])
      : "") +
    g(ellipse(0, 150, 72, 16, "#8A6B3C", { "fill-opacity": 0.22 }), { id: "shadow" }) +
    g(
      // feet
      rect(-28, 116, 15, 28, 7, O.foot) +
        rect(13, 116, 15, 28, 7, O.foot) +
        rect(-44, 138, 44, 13, 6, O.foot) +
        rect(0, 138, 44, 13, 6, O.foot) +
        // body, then both wings in front of it so a raised wing is never swallowed
        g(
          ellipse(0, 34, 86, 92, O.body) +
            ellipse(-26, 20, 56, 74, light(O.body)) +
            ellipse(0, 56, 56, 62, O.belly),
          { id: "body" },
        ) +
        wings[0] +
        wings[1] +
        // head
        g(
          path(`M-58 -58c-8-22-2-40 14-48 6 16 4 34-14 48Z`, O.bodyDark) +
            path(`M58 -58c8-22 2-40-14-48-6 16-4 34 14 48Z`, O.bodyDark) +
            g(eye(-33, -18, eyeR, { look: looking, closed: asleep, pupilR: eyeR * 0.46 }), {
              id: "eye-l",
            }) +
            g(eye(33, -18, eyeR, { look: looking, closed: asleep, pupilR: eyeR * 0.46 }), {
              id: "eye-r",
            }) +
            (mouthOpen
              ? g(
                  ellipse(0, 6 + mouthOpen / 2, 15, mouthOpen, "#C4665A") +
                    path(`M0 6 -16-10h32Z`, O.beak),
                  {
                    id: "mouth",
                  },
                )
              : g(path(`M0 6 -16-10h32Z`, O.beak) + path(`M0 6 -16-10h16Z`, light(O.beak)), {
                  id: "mouth",
                })),
          { id: "head", transform: `rotate(${headTilt} 0 -10)` },
        ),
      { transform: `rotate(${bodyTilt} 0 120)` },
    ) +
    (asleep ? zzz(76, -80) : "") +
    (state === "listen" ? soundWaves(104, -20, "#C77DFF") : "") +
    (state === "cheer" ? g(star(-104, -60, 20) + star(108, -34, 15), { id: "sparks" }) : "") +
    (state === "think"
      ? g(sparkle(100, -96, 14, "#C77DFF") + circle(82, -64, 7, "#C77DFF", { "fill-opacity": 0.5 }))
      : "")
  );
}

export function buildMascots(write, svg) {
  const out = [];
  const cast = [
    { key: "robot", draw: robot, vi: "Rô-bốt" },
    { key: "cu", draw: owl, vi: "bạn Cú" },
  ];
  for (const c of cast)
    for (const state of STATES) {
      const body = g(c.draw(state), { transform: "translate(160 150)" });
      const file = `mascots/${c.key}/${state}.svg`;
      const res = write(file, svg("0 0 320 340", body, { title: `${c.vi} — ${state}` }));
      out.push({ file: `art/${file}`, bytes: res.bytes, kind: "mascot" });
    }
  return out;
}

export { STATES as MASCOT_STATES };
