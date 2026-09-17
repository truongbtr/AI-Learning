import type { MathModel } from "@mtct/content";

/**
 * The maths models of MATH NOTES, drawn from data (pha 13): ten-frames, ten-rods and cubes, bead
 * strings, number lines with hops, number bonds, dot cards, the 1–20 chart and a single counter.
 *
 * Plain SVG, no client state, so a test can render it to HTML and the same picture appears in the
 * child's exercise, in the parent preview and in /dev/kit. Colours follow the kid palette: blue and
 * amber counters, green rods, never red (docs/06 §1). Text inside a model is drawn large enough to
 * stay at 22 px or more at the sizes the exercise frame uses.
 */

const INK = "#2B2B3A";
const LINE = "#8A7F6A";
const CELL = "#FFFFFF";
const DARK = "#2F80ED";
const LIGHT = "#FFC247";
const LIGHT_EDGE = "#E09A00";
const ROD = "#34C759";
const ROD_EDGE = "#1E9E45";
const CUBE = "#FF9F1C";
const CUBE_EDGE = "#D97A00";
const HOP = "#9B51E0";
const ASK = "#FFF3C4";
const FONT = "Nunito, 'Baloo 2', system-ui, sans-serif";

export type ModelLayout = "wide" | "tall";

interface Drawn {
  w: number;
  h: number;
  body: React.ReactNode;
}

/** A short English description, for screen readers and the test. */
export function modelLabel(m: MathModel): string {
  switch (m.kind) {
    case "tenFrame": {
      const total = m.dots.reduce((a, d) => a + d.count, 0);
      const parts = m.dots.length > 1 ? ` (${m.dots.map((d) => d.count).join(" and ")})` : "";
      return `${m.frames === 2 ? "two ten-frames" : "a ten-frame"} with ${total} dots${parts}`;
    }
    case "tensOnes": {
      const unit = m.style === "beads" ? "bead string" : "ten-rod";
      const rods = m.tens === 0 ? "" : `${m.tens} ${unit}${m.tens > 1 ? "s" : ""}`;
      const loose = `${m.ones} ${m.style === "beads" ? "beads" : "cubes"}`;
      return [rods, m.ones > 0 || !rods ? loose : ""].filter(Boolean).join(" and ");
    }
    case "numberLine":
      return `a number line from ${m.from} to ${m.to}${m.hops ? `, ${m.hops.count} jumps from ${m.hops.start}` : ""}`;
    case "numberBond": {
      const s = (x: number | null) => (x == null ? "?" : String(x));
      return `a number bond: ${s(m.whole)} is ${s(m.parts[0])} and ${s(m.parts[1])}`;
    }
    case "dotCards":
      return `dot cards: ${m.cards.join(" and ")}`;
    case "numberChart":
      return `a number chart from ${m.from} to ${m.to}`;
    case "counter":
      return "a counter";
  }
}

/** Tone of each filled cell, in fill order. */
export function tenFrameTones(m: Extract<MathModel, { kind: "tenFrame" }>): ("dark" | "light")[] {
  return m.dots.flatMap((d) => Array.from({ length: d.count }, () => d.tone ?? "dark"));
}

function dot(cx: number, cy: number, r: number, tone: "dark" | "light", key: string) {
  return (
    <circle
      key={key}
      cx={cx}
      cy={cy}
      r={r}
      fill={tone === "dark" ? DARK : LIGHT}
      stroke={tone === "dark" ? "#1C5FB8" : LIGHT_EDGE}
      strokeWidth={3}
      data-dot={tone}
    />
  );
}

/**
 * One or two ten-frames. `wide` is the usual 5 × 2 frame, frames side by side; `tall` is the book's
 * page: 2 columns × 5 rows, filled down the first column, frames side by side — narrow enough for
 * three answers in one row.
 */
function tenFrame(m: Extract<MathModel, { kind: "tenFrame" }>, layout: ModelLayout): Drawn {
  const cell = 64;
  const gap = 32;
  const pad = 8;
  const cols = layout === "wide" ? 5 : 2;
  const rows = layout === "wide" ? 2 : 5;
  const fw = cols * cell;
  const fh = rows * cell;
  const tones = tenFrameTones(m);
  const body: React.ReactNode[] = [];
  for (let f = 0; f < m.frames; f++) {
    const x0 = pad + f * (fw + gap);
    body.push(
      <rect
        key={`frame-${f}`}
        x={x0}
        y={pad}
        width={fw}
        height={fh}
        rx={10}
        fill={CELL}
        stroke={INK}
        strokeWidth={4}
      />,
    );
    for (let i = 0; i < 10; i++) {
      const c = layout === "wide" ? i % 5 : Math.floor(i / 5);
      const r = layout === "wide" ? Math.floor(i / 5) : i % 5;
      const x = x0 + c * cell;
      const y = pad + r * cell;
      if (c > 0 && r === 0)
        body.push(
          <line
            key={`v-${f}-${c}`}
            x1={x}
            y1={pad}
            x2={x}
            y2={pad + fh}
            stroke={LINE}
            strokeWidth={2}
          />,
        );
      if (r > 0 && c === 0)
        body.push(
          <line
            key={`h-${f}-${r}`}
            x1={x0}
            y1={y}
            x2={x0 + fw}
            y2={y}
            stroke={LINE}
            strokeWidth={2}
          />,
        );
      const tone = tones[f * 10 + i];
      if (tone) body.push(dot(x + cell / 2, y + cell / 2, 22, tone, `dot-${f}-${i}`));
    }
  }
  return { w: pad * 2 + m.frames * fw + (m.frames - 1) * gap, h: pad * 2 + fh, body };
}

/** Ten-rods (or strings of ten beads) standing up, loose cubes in columns of five beside them. */
function tensOnes(m: Extract<MathModel, { kind: "tensOnes" }>): Drawn {
  const unit = 30;
  const pad = 8;
  const rodGap = 18;
  const beads = m.style === "beads";
  const body: React.ReactNode[] = [];
  const tallest = 10 * unit;
  for (let t = 0; t < m.tens; t++) {
    const x = pad + t * (unit + rodGap);
    if (beads)
      body.push(
        <line
          key={`wire-${t}`}
          x1={x + unit / 2}
          y1={pad - 4}
          x2={x + unit / 2}
          y2={pad + m.rodSize * unit + 4}
          stroke={INK}
          strokeWidth={3}
        />,
      );
    for (let k = 0; k < m.rodSize; k++) {
      const y = pad + tallest - (k + 1) * unit; // stand on the same floor as the loose cubes
      body.push(
        beads ? (
          <circle
            key={`bead-${t}-${k}`}
            cx={x + unit / 2}
            cy={y + unit / 2}
            r={unit / 2 - 1}
            fill={k < 5 ? DARK : "#7FB2F5"}
            stroke="#1C5FB8"
            strokeWidth={2}
          />
        ) : (
          <rect
            key={`rod-${t}-${k}`}
            x={x}
            y={y}
            width={unit}
            height={unit}
            fill={ROD}
            stroke={ROD_EDGE}
            strokeWidth={2.5}
            data-cube="rod"
          />
        ),
      );
    }
  }
  const x1 = pad + m.tens * (unit + rodGap) + (m.tens > 0 ? 10 : 0);
  for (let i = 0; i < m.ones; i++) {
    const col = Math.floor(i / 5);
    const row = i % 5;
    const x = x1 + col * (unit + 6);
    const y = pad + tallest - (row + 1) * (unit + 6);
    body.push(
      beads ? (
        <circle
          key={`loose-${i}`}
          cx={x + unit / 2}
          cy={y + unit / 2}
          r={unit / 2 - 1}
          fill={LIGHT}
          stroke={LIGHT_EDGE}
          strokeWidth={2}
        />
      ) : (
        <rect
          key={`loose-${i}`}
          x={x}
          y={y}
          width={unit}
          height={unit}
          rx={4}
          fill={CUBE}
          stroke={CUBE_EDGE}
          strokeWidth={2.5}
          data-cube="one"
        />
      ),
    );
  }
  const cols = Math.ceil(m.ones / 5);
  const w = x1 + cols * (unit + 6) + pad;
  return { w: Math.max(w, 2 * pad + unit), h: tallest + 2 * pad, body };
}

/** A number line with an arrow at each end, sparse labels, "?" boxes, dots and hops. */
function numberLine(m: Extract<MathModel, { kind: "numberLine" }>): Drawn {
  const step = 60;
  const padX = 48;
  const lineY = m.hops ? 104 : 40;
  const font = 44;
  const count = m.to - m.from;
  const w = padX * 2 + count * step;
  const h = lineY + 24 + font + 16;
  const xOf = (n: number) => padX + (n - m.from) * step;
  const labels = new Set(m.labels ?? Array.from({ length: count + 1 }, (_, i) => m.from + i));
  const hidden = new Set(m.hidden);
  const body: React.ReactNode[] = [
    <line key="axis" x1={12} y1={lineY} x2={w - 12} y2={lineY} stroke={INK} strokeWidth={4} />,
    <path key="arrow-l" d={`M4 ${lineY} l18 -12 v24 z`} fill={INK} />,
    <path key="arrow-r" d={`M${w - 4} ${lineY} l-18 -12 v24 z`} fill={INK} />,
  ];
  for (let n = m.from; n <= m.to; n++) {
    const x = xOf(n);
    body.push(
      <line
        key={`tick-${n}`}
        x1={x}
        y1={lineY - 14}
        x2={x}
        y2={lineY + 14}
        stroke={INK}
        strokeWidth={3}
      />,
    );
    const ty = lineY + 24 + font * 0.85;
    if (hidden.has(n))
      body.push(
        <g key={`ask-${n}`} data-hidden={n}>
          <rect
            x={x - 22}
            y={lineY + 20}
            width={44}
            height={font + 8}
            rx={8}
            fill={ASK}
            stroke={LIGHT_EDGE}
            strokeWidth={2}
          />
          <text
            x={x}
            y={ty}
            textAnchor="middle"
            fontSize={font - 4}
            fontWeight={800}
            fill={INK}
            fontFamily={FONT}
          >
            ?
          </text>
        </g>,
      );
    else if (labels.has(n))
      body.push(
        <text
          key={`n-${n}`}
          x={x}
          y={ty}
          textAnchor="middle"
          fontSize={n >= 10 ? font - 4 : font}
          fontWeight={800}
          fill={INK}
          fontFamily={FONT}
        >
          {n}
        </text>,
      );
  }
  if (m.hops) {
    for (let k = 0; k < m.hops.count; k++) {
      const a = xOf(m.hops.start + k);
      const b = xOf(m.hops.start + k + 1);
      const mid = (a + b) / 2;
      body.push(
        <g key={`hop-${k}`} data-hop={k}>
          <path
            d={`M${a} ${lineY - 8} Q${mid} ${lineY - 80} ${b - 4} ${lineY - 10}`}
            fill="none"
            stroke={HOP}
            strokeWidth={4}
          />
          <path d={`M${b - 2} ${lineY - 8} l-14 -4 l6 -12 z`} fill={HOP} />
        </g>,
      );
    }
  }
  for (const n of [...m.marks, ...(m.hops ? [m.hops.start] : [])])
    body.push(dot(xOf(n), lineY, 13, "dark", `mark-${n}`));
  return { w, h, body };
}

function numberBond(m: Extract<MathModel, { kind: "numberBond" }>): Drawn {
  const r = 58;
  const font = 56;
  const w = 380;
  const h = 330;
  const whole = { x: w / 2, y: 8 + r };
  const parts = [
    { x: 8 + r, y: h - 8 - r },
    { x: w - 8 - r, y: h - 8 - r },
  ];
  const circle = (x: number, y: number, v: number | null, key: string, big: boolean) => (
    <g key={key} data-bond={key}>
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={v == null ? ASK : big ? "#EAF2FE" : CELL}
        stroke={INK}
        strokeWidth={4}
      />
      <text
        x={x}
        y={y + font * 0.35}
        textAnchor="middle"
        fontSize={font}
        fontWeight={800}
        fill={INK}
        fontFamily={FONT}
      >
        {v == null ? "?" : v}
      </text>
    </g>
  );
  return {
    w,
    h,
    body: [
      ...(["a", "b"] as const).map((side) => {
        const p = parts[side === "a" ? 0 : 1] as { x: number; y: number };
        return (
          <line
            key={`link-${side}`}
            x1={whole.x}
            y1={whole.y}
            x2={p.x}
            y2={p.y}
            stroke={INK}
            strokeWidth={4}
          />
        );
      }),
      circle(whole.x, whole.y, m.whole, "whole", true),
      circle(parts[0]!.x, parts[0]!.y, m.parts[0], "part-a", false),
      circle(parts[1]!.x, parts[1]!.y, m.parts[1], "part-b", false),
    ],
  };
}

/** Dice-like layouts for 1–6, two rows of five for 7–10. */
function pipPositions(n: number): [number, number][] {
  const c = 0.5;
  const lo = 0.24;
  const hi = 0.76;
  const table: Record<number, [number, number][]> = {
    0: [],
    1: [[c, c]],
    2: [
      [lo, lo],
      [hi, hi],
    ],
    3: [
      [lo, lo],
      [c, c],
      [hi, hi],
    ],
    4: [
      [lo, lo],
      [hi, lo],
      [lo, hi],
      [hi, hi],
    ],
    5: [
      [lo, lo],
      [hi, lo],
      [c, c],
      [lo, hi],
      [hi, hi],
    ],
    6: [
      [lo, lo],
      [hi, lo],
      [lo, c],
      [hi, c],
      [lo, hi],
      [hi, hi],
    ],
  };
  if (table[n]) return table[n] as [number, number][];
  return Array.from({ length: n }, (_, i) => [0.14 + (i % 5) * 0.18, i < 5 ? 0.33 : 0.67]);
}

function dotCards(m: Extract<MathModel, { kind: "dotCards" }>): Drawn {
  const side = 150;
  const gap = 28;
  const pad = 8;
  const body: React.ReactNode[] = [];
  for (let k = 0; k < m.cards.length; k++) {
    const n = m.cards[k] as number;
    const x0 = pad + k * (side + gap);
    body.push(
      <g key={`card-${k}`} data-card={n}>
        <rect
          x={x0}
          y={pad}
          width={side}
          height={side}
          rx={22}
          fill={CELL}
          stroke={INK}
          strokeWidth={4}
        />
        {pipPositions(n).map(([px, py], i) =>
          dot(x0 + px * side, pad + py * side, n > 6 ? 11 : 15, "dark", `pip-${k}-${i}`),
        )}
      </g>,
    );
  }
  return {
    w: pad * 2 + m.cards.length * side + (m.cards.length - 1) * gap,
    h: side + pad * 2,
    body,
  };
}

function numberChart(m: Extract<MathModel, { kind: "numberChart" }>): Drawn {
  const cell = 60;
  const pad = 8;
  const font = 30;
  const first = Math.floor((m.from - 1) / 10) * 10 + 1;
  const rows = Math.ceil((m.to - first + 1) / 10);
  const hidden = new Set(m.hidden);
  const marked = new Set(m.marked);
  const body: React.ReactNode[] = [];
  for (let n = first; n < first + rows * 10; n++) {
    const i = n - first;
    const x = pad + (i % 10) * cell;
    const y = pad + Math.floor(i / 10) * cell;
    const inRange = n >= m.from && n <= m.to;
    body.push(
      <g key={`cell-${n}`} data-cell={n}>
        <rect
          x={x}
          y={y}
          width={cell}
          height={cell}
          fill={hidden.has(n) ? ASK : CELL}
          stroke={INK}
          strokeWidth={2.5}
        />
        {inRange ? (
          <text
            x={x + cell / 2}
            y={y + cell / 2 + font * 0.36}
            textAnchor="middle"
            fontSize={font}
            fontWeight={800}
            fill={INK}
            fontFamily={FONT}
          >
            {hidden.has(n) ? "?" : n}
          </text>
        ) : null}
        {marked.has(n) ? (
          <circle
            cx={x + cell / 2}
            cy={y + cell / 2}
            r={cell / 2 - 5}
            fill="none"
            stroke={DARK}
            strokeWidth={4}
          />
        ) : null}
      </g>,
    );
  }
  return { w: pad * 2 + 10 * cell, h: pad * 2 + rows * cell, body };
}

function counter(m: Extract<MathModel, { kind: "counter" }>): Drawn {
  return { w: 64, h: 64, body: dot(32, 32, 26, m.tone ?? "dark", "counter") };
}

function draw(m: MathModel, layout: ModelLayout): Drawn {
  switch (m.kind) {
    case "tenFrame":
      return tenFrame(m, layout);
    case "tensOnes":
      return tensOnes(m);
    case "numberLine":
      return numberLine(m);
    case "numberBond":
      return numberBond(m);
    case "dotCards":
      return dotCards(m);
    case "numberChart":
      return numberChart(m);
    case "counter":
      return counter(m);
  }
}

/**
 * How tall a model is drawn for a picture slot of `size` px (208 in the question, 128 on an answer
 * card). A number line keeps its own height: its numbers must stay readable (≥ 22 px) even on a
 * short screen, and it is wide rather than tall anyway.
 */
export function modelHeight(m: MathModel, size: number, layout: ModelLayout): number {
  const d = draw(m, layout);
  switch (m.kind) {
    case "numberLine":
      return Math.round(d.h * 0.8);
    case "tenFrame":
      // on an answer card the frames stand up and must still show every empty cell clearly
      return Math.round(size * (layout === "tall" ? 1.9 : 0.75));
    case "tensOnes":
      // a child counts the cubes of a rod (9 or 10?): on an answer card they need the room
      return Math.round(size * (layout === "tall" ? 1.9 : 1.2));
    case "numberBond":
      return Math.round(size * 1.25);
    case "numberChart":
      return Math.round(Math.max(size * 0.75, d.h * 0.75));
    case "counter":
      return Math.round(size * 0.55);
    default:
      return Math.round(size * 0.75);
  }
}

export function MathModelPicture({
  model,
  size,
  layout = "wide",
  className = "",
  alt,
}: {
  model: MathModel;
  size: number;
  layout?: ModelLayout;
  className?: string;
  alt?: string;
}) {
  const d = draw(model, layout);
  const height = modelHeight(model, size, layout);
  const width = Math.round((d.w / d.h) * height);
  return (
    <svg
      viewBox={`0 0 ${d.w} ${d.h}`}
      width={width}
      height={height}
      className={`block ${className}`}
      style={{ maxWidth: "100%", height: "auto" }}
      role="img"
      aria-label={alt ?? modelLabel(model)}
      data-testid="math-model"
      data-model={model.kind}
    >
      {d.body}
    </svg>
  );
}
