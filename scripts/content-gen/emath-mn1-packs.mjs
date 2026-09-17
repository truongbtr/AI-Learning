/**
 * Pha 13 việc 3 — bài luyện bám MATH NOTES Grade 1 · Volume 1 (EDI-MN1).
 *
 * Năm gói mới (TEEN_NUMBERS, NUMBER_CHART_20, TENS_ONES, PLACE_VALUE_MODELS, COMPARE_TO_20) và
 * 8–12 bài bám sách nối vào bảy gói cũ (id `emath-mn1-…`, chạy lại thì thay đúng phần đó).
 *
 * Quy ước:
 * - độ khó 1–2 giữ đúng số, tên người và câu hỏi của sách (Val/Jean, Pat, Cory, Kelly/Carl…);
 *   độ khó 3–5 là biến thể;
 * - mỗi bài có `meta.lessonUnitCode` và `meta.sourceRef` "EDI-MN1 tr.X";
 * - dạng theo bảng mục 3 của docs/giao-trinh/EDI-MN1-vol1-phan-tich.md: không WRITE_PHOTO, không
 *   tô/vẽ; "vẽ N chấm vào ten-frame" thành kéo đủ N chấm vào khung;
 * - hình trong đề là mô hình của sách (`kind: "model"`, xem packages/content/src/math-model.ts);
 * - nhiễu mang mã lỗi của đúng cái bẫy sách gài (emath-mn1-errors.mjs).
 *
 *   node scripts/content-gen/emath-mn1-packs.mjs
 */
import { readFileSync } from "node:fs";
import { choicesOf, ex, img, mkPack, numberId, rotate, writePack } from "./lib.mjs";

const EN = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
];
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const base = { dir: "emath", subject: "EMATH", language: "en" };
const src = (p) => `EDI-MN1 tr.${p}`;
const U = (u, l) => `EDI-MN1-U${u}-L${l}`;

// ── pictures ──────────────────────────────────────────────────────────────────────────────────
const M = (value, model) => ({ kind: "model", value, model });
/** Ten-frames: one frame up to 10, two above; `light` more dots in the second colour. */
const TF = (dark, light = 0, frames) => {
  const f = frames ?? (dark + light > 10 ? 2 : 1);
  const dots = [{ count: dark, tone: "dark" }];
  if (light > 0) dots.push({ count: light, tone: "light" });
  return M(`tf-${f}-${dark}+${light}`, { kind: "tenFrame", frames: f, dots });
};
const TO = (tens, ones, extra = {}) =>
  M(`to-${tens}-${ones}-${extra.rodSize ?? 10}-${extra.style ?? "cubes"}`, {
    kind: "tensOnes",
    tens,
    ones,
    ...extra,
  });
const NL = (from, to, extra = {}) =>
  M(`nl-${from}-${to}-${JSON.stringify(extra)}`, { kind: "numberLine", from, to, ...extra });
const NB = (whole, a, b) =>
  M(`nb-${whole}-${a}-${b}`, { kind: "numberBond", whole, parts: [a, b] });
const DC = (...cards) => M(`dc-${cards.join("-")}`, { kind: "dotCards", cards });
const NC = (extra = {}) => M(`nc-${JSON.stringify(extra)}`, { kind: "numberChart", ...extra });
const COUNTER = (tone = "dark") => M(`counter-${tone}`, { kind: "counter", tone });

// ── exercise shapes ───────────────────────────────────────────────────────────────────────────
let slot = 0;
/** Multiple choice. `wrong` is [[text, errorTag?], ...]; choice order rotates. */
function mcq(p, o) {
  const correct = o.correctImage ? { image: o.correctImage } : { text: String(o.correct) };
  const wrongs = o.wrong.map(([w, tag]) => {
    const c = typeof w === "object" && w !== null ? { image: w } : { text: String(w) };
    if (tag) c.errorTag = tag;
    return c;
  });
  const { choices, answerKey } = choicesOf(correct, wrongs, slot++);
  p.add({
    type: o.listen ? "LISTEN_CHOOSE" : "MCQ",
    difficulty: o.d,
    targetsError: o.targets ?? null,
    scaffold: o.model ? "model" : "none",
    prompt: { text: o.q, ...(o.image ? { image: o.image } : {}) },
    ...(o.listen ? { listenTarget: { text: o.listen } } : {}),
    choices,
    answerKey,
    hints: o.hints,
    explanation: o.why,
    meta: { lessonUnitCode: o.unit, sourceRef: o.src, estSeconds: o.listen ? 25 : 22 },
    ...(o.skills ? { skillCodes: o.skills } : {}),
  });
}

/** Drag: `zones` is [{id, label?, image?, take: [itemId...]}], `items` is [{id, text?|image?, tag?}]. */
function drag(p, o) {
  const itemIds = o.items.map((i) => i.id);
  p.add({
    type: "DRAG_DROP",
    difficulty: o.d,
    targetsError: o.targets ?? null,
    scaffold: o.model ? "model" : "none",
    prompt: { text: o.q, ...(o.image ? { image: o.image } : {}) },
    dragItems: o.items.map((i) => ({
      id: i.id,
      ...(i.image ? { image: i.image } : { text: String(i.text) }),
      ...(i.tag ? { errorTag: i.tag } : {}),
    })),
    dropZones: o.zones.map((z) => ({
      id: z.id,
      ...(z.label ? { label: z.label } : {}),
      ...(z.image ? { image: z.image } : {}),
      accepts: itemIds,
    })),
    answerKey: Object.fromEntries(o.zones.map((z) => [z.id, z.take])),
    hints: o.hints,
    explanation: o.why,
    meta: { lessonUnitCode: o.unit, sourceRef: o.src, estSeconds: o.secs ?? 40 },
  });
}

/** "Drag N counters into the ten-frame": `have` extra counters stay in the tray. */
function dots(p, o) {
  const total = o.need + o.spare;
  const items = Array.from({ length: total }, (_, i) => ({
    id: `c${i + 1}`,
    image: COUNTER(o.tone ?? "dark"),
    // a spare counter in the frame is one too many
    ...(i >= o.need ? { tag: "dem_thua_1" } : {}),
  }));
  const printed = o.printed ?? [];
  drag(p, {
    ...o,
    targets: o.targets ?? "dem_thua_1",
    items,
    zones: [
      {
        id: "frame",
        image: M(`zone-${o.frames}-${JSON.stringify(printed)}`, {
          kind: "tenFrame",
          frames: o.frames,
          dots: printed,
        }),
        take: items.slice(0, o.need).map((i) => i.id),
      },
    ],
    secs: 50,
  });
}

/** "15 ○ 12": drag one of the three signs into the circle. */
function sign(p, o) {
  const [a, b] = o.pair;
  const right = a > b ? ">" : a < b ? "<" : "=";
  const items = [
    { id: "gt", text: ">" },
    { id: "lt", text: "<" },
    { id: "eq", text: "=" },
  ].map((i) => (i.text === right ? i : { ...i, tag: "nham_dau_lon_be" }));
  drag(p, {
    ...o,
    targets: o.targets ?? "nham_dau_lon_be",
    items,
    zones: [{ id: "sign", label: `${a} ○ ${b}`, take: [items.find((i) => i.text === right).id] }],
    secs: 30,
  });
}

function tap(p, o) {
  p.add({
    type: "COUNT_TAP",
    difficulty: o.d,
    targetsError: null,
    scaffold: "none",
    prompt: { text: o.q },
    countTarget: { objects: img(o.emoji, o.vi, o.en, o.n), correctCount: o.n, layout: "grid" },
    answerKey: o.n,
    hints: o.hints,
    explanation: o.why,
    meta: { lessonUnitCode: o.unit, sourceRef: o.src, estSeconds: 20 + o.n * 2 },
  });
}

function read(p, o) {
  const words = o.text
    .replace(/[.,!?]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  p.add({
    type: "READ_ALOUD",
    difficulty: o.d,
    targetsError: null,
    scaffold: o.model ? "model" : "none",
    prompt: { text: o.q },
    readTarget: { text: o.text, words },
    answerKey: { words },
    hints: o.hints ?? ["Read one word at a time."],
    explanation: `This says: "${o.text}"`,
    meta: { lessonUnitCode: o.unit, sourceRef: o.src, estSeconds: 25 },
  });
}

const LISTEN_Q = [
  "Listen and tap the number.",
  "Listen, then tap the answer.",
  "What did you hear? Tap it.",
  "Listen carefully and pick one.",
  "Hear it, then find it.",
  "Tap what you hear.",
];
const READ_Q = [
  "Read this out loud!",
  "Say it clearly.",
  "Your turn to read!",
  "Read it to {ban}.",
  "Read slowly and clearly.",
];
const TAP_Q = [
  "Tap each one to count.",
  "How many? Tap and count.",
  "Count them all. Tap each one.",
  "Touch each one as you count.",
];
const around = (n, lo = 0, hi = 20) =>
  [
    [n - 1, "dem_thieu_1"],
    [n + 1, "dem_thua_1"],
  ].filter(([v]) => v >= lo && v <= hi);

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 1. TEEN_NUMBERS — Lesson "Numbers 11 to 19" (sách tr.8–10)
// ═══════════════════════════════════════════════════════════════════════════════════════════════
{
  const u = U(3, 2);
  const p = mkPack({
    ...base,
    code: "EMATH.NBT.TEEN_NUMBERS",
    prefix: "emath-teen",
    src: src("8–10"),
    unit: u,
    lessonRefs: [u],
    note: "EDI-MN1 Lesson 'Numbers 11 to 19' (tr.8–10): hai ten-frame, 1 ten and … ones, teen numbers. Bẫy của sách: 10 không phải teen number (nham_so_teen).",
  });
  // Exit Ticket 1 (tr.9): a full frame and 4 → 14; then the other teen numbers
  const HOW = ["How many dots?", "How many dots in all?", "Count the dots. What number?"];
  [14, 17, 13, 18, 11, 16, 19, 12].forEach((n, i) => {
    mcq(p, {
      d: i < 2 ? 1 : i < 5 ? 2 : 3,
      q: rotate(HOW, i),
      image: TF(n),
      correct: n,
      wrong: around(n),
      targets: i % 2 ? "dem_thieu_1" : "dem_thua_1",
      model: i < 3,
      hints: ["The first frame is full: that is 10.", `Count on from 10: 11, 12…`],
      why: `A full frame is 10, and ${n - 10} more makes ${n}.`,
      unit: u,
      src: src(i < 2 ? "9" : "8"),
    });
  });
  // Exit Ticket 2 (tr.9): which ten-frame shows 17? — the book's A 17, B 19, C 15, plus 16
  mcq(p, {
    d: 1,
    q: "Which ten-frame shows 17?",
    correctImage: TF(17),
    correct: "17",
    wrong: [[TF(19)], [TF(15)], [TF(16), "dem_thieu_1"]],
    model: true,
    targets: "dem_thieu_1",
    hints: ["Find the full frame first.", "Then count the dots in the second frame: 7."],
    why: "17 is a full ten-frame and 7 more.",
    unit: u,
    src: src("9"),
  });
  [
    [13, 3],
    [18, 3],
    [12, 4],
    [15, 4],
  ].forEach(([n, d]) => {
    mcq(p, {
      d,
      q: `Which ten-frame shows ${n}?`,
      correctImage: TF(n),
      correct: String(n),
      wrong: [
        [TF(n - 1), "dem_thieu_1"],
        [TF(n + 1), "dem_thua_1"],
      ],
      hints: ["A full frame is 10.", `Look for 10 and ${n - 10} more.`],
      why: `${n} is 10 and ${n - 10} more.`,
      unit: u,
      src: src("9"),
    });
  });
  // Additional Practice 5 (tr.10): circle the teen numbers in 7, 4, 12, 15, 9, 10, 17
  [
    [12, 10, 7, 1],
    [15, 10, 4, 1],
    [17, 20, 9, 2],
    [19, 10, 20, 4],
  ].forEach(([n, a, b, d], i) => {
    mcq(p, {
      d,
      q: rotate(["Which is a teen number?", "Tap the teen number.", "Find the teen number."], i),
      correct: n,
      wrong: [
        [a, a === 10 || a === 20 ? "nham_so_teen" : undefined],
        [b, b === 10 || b === 20 ? "nham_so_teen" : undefined],
      ],
      targets: "nham_so_teen",
      model: i === 0,
      hints: ["A teen number is one ten and some ones.", "10 is one ten and no ones."],
      why: `${n} is a teen number: 1 ten and ${n - 10} ones.`,
      unit: u,
      src: src("10"),
    });
  });
  // Additional Practice 1–2 (tr.10): 10 + 3, 10 + 7; then variants
  [
    [3, 1, "10"],
    [7, 1, "10"],
    [5, 3, "8"],
    [9, 4, "8"],
  ].forEach(([k, d, pg], i) => {
    mcq(p, {
      d,
      q: `What is 10 + ${k}?`,
      image: TF(10, k),
      correct: 10 + k,
      wrong: [...around(10 + k), [10 - k, "nham_cong_tru"]],
      targets: i === 3 ? "nham_cong_tru" : null,
      model: i === 0,
      hints: ["Start at 10 and count on.", `10, then ${k} more.`],
      why: `10 + ${k} = ${10 + k}.`,
      unit: u,
      src: src(pg),
    });
  });
  // Exit Ticket 1 sentence (tr.9): __ ten and __ ones is __
  [
    [4, 2],
    [8, 3],
    [6, 5],
  ].forEach(([k, d]) => {
    mcq(p, {
      d,
      q: `1 ten and ${k} ones is what number?`,
      correct: 10 + k,
      wrong: [[Number(`${k}1`), "nham_thu_tu_so"], ...around(10 + k)],
      targets: "nham_thu_tu_so",
      hints: ["The ten comes first: 1…", `Then the ones: ${k}.`],
      why: `1 ten and ${k} ones is ${10 + k}.`,
      unit: u,
      src: src("9"),
    });
  });
  mcq(p, {
    d: 5,
    q: "10 + ? = 16",
    correct: 6,
    wrong: [
      [5, "dem_thieu_1"],
      [7, "dem_thua_1"],
      [16, "lap_lai_tong"],
    ],
    hints: ["16 is 10 and some ones.", "How many ones are in 16?"],
    why: "16 is 10 and 6, so 10 + 6 = 16.",
    unit: u,
    src: src("8"),
  });
  // Listening
  [14, 17, 13, 18, 11, 19].forEach((n, i) => {
    mcq(p, {
      d: i < 2 ? 1 : i < 4 ? 2 : 3,
      q: rotate(LISTEN_Q, i),
      listen: EN[n],
      correct: n,
      wrong: around(n),
      hints: ["Listen for the '-teen' at the end.", "Tap the number with a 1 in front."],
      why: `You heard "${EN[n]}": ${n}.`,
      unit: u,
      src: src("8"),
    });
  });
  mcq(p, {
    d: 4,
    q: "Listen. Which ten-frames show it?",
    listen: "fifteen",
    correctImage: TF(15),
    correct: "15",
    wrong: [
      [TF(14), "dem_thieu_1"],
      [TF(16), "dem_thua_1"],
    ],
    hints: ["Fifteen is ten and five.", "Find a full frame and 5 more."],
    why: "Fifteen is a full ten-frame and 5 more.",
    unit: u,
    src: src("9"),
  });
  // Exit Ticket 3 (tr.9): draw number 14 → drag 14 dots; Additional Practice 3–4 (tr.10)
  dots(p, {
    d: 2,
    q: "Draw number 14. Drag the dots in.",
    frames: 2,
    need: 14,
    spare: 2,
    model: true,
    hints: ["Fill the first frame: 10.", "Then 4 more in the second frame."],
    why: "14 is a full frame and 4 more.",
    unit: u,
    src: src("9"),
  });
  dots(p, {
    d: 2,
    q: "Show 1 group of ten and 5 ones.",
    frames: 2,
    need: 15,
    spare: 2,
    hints: ["A group of ten fills one frame.", "Then put 5 in the other frame."],
    why: "1 ten and 5 ones is 15.",
    unit: u,
    src: src("10"),
  });
  dots(p, {
    d: 3,
    q: "The first frame is full. Drag dots to show 13.",
    frames: 2,
    printed: [{ count: 10, tone: "dark" }],
    need: 3,
    spare: 3,
    tone: "light",
    hints: ["10 is already there.", "13 is 10 and 3."],
    why: "10 and 3 more is 13.",
    unit: u,
    src: src("10"),
  });
  dots(p, {
    d: 4,
    q: "Show 1 group of ten and 1 one.",
    frames: 2,
    need: 11,
    spare: 3,
    hints: ["Fill one whole frame first.", "Then just one more."],
    why: "1 ten and 1 one is 11.",
    unit: u,
    src: src("10"),
  });
  drag(p, {
    d: 2,
    q: "Is it a teen number? Sort the cards.",
    items: [
      { id: "n12", text: 12 },
      { id: "n15", text: 15 },
      { id: "n17", text: 17 },
      { id: "n7", text: 7 },
      { id: "n10", text: 10, tag: "nham_so_teen" },
      { id: "n4", text: 4 },
    ],
    zones: [
      { id: "teen", label: "Teen numbers", take: ["n12", "n15", "n17"] },
      { id: "not", label: "Not teen", take: ["n7", "n10", "n4"] },
    ],
    targets: "nham_so_teen",
    hints: ["Teen numbers go from 11 to 19.", "10 is not a teen number."],
    why: "12, 15 and 17 are teen numbers; 10 is not.",
    unit: u,
    src: src("10"),
  });
  drag(p, {
    d: 3,
    q: "Match each number to its word.",
    items: [
      { id: "w13", text: "thirteen" },
      { id: "w16", text: "sixteen" },
      { id: "w19", text: "nineteen" },
    ],
    zones: [
      { id: "z13", label: "13", take: ["w13"] },
      { id: "z16", label: "16", take: ["w16"] },
      { id: "z19", label: "19", take: ["w19"] },
    ],
    hints: ["Read the start of each word.", "Six-teen is 16."],
    why: "13 thirteen, 16 sixteen, 19 nineteen.",
    unit: u,
    src: src("8"),
  });
  drag(p, {
    d: 5,
    q: "Put the teen numbers in order.",
    items: [
      { id: "a", text: 14 },
      { id: "b", text: 11 },
      { id: "c", text: 18 },
    ],
    zones: [
      { id: "first", label: "First", take: ["b"] },
      { id: "second", label: "Next", take: ["a"] },
      { id: "third", label: "Last", take: ["c"] },
    ],
    hints: ["Start with the smallest.", "11 comes before 14."],
    why: "11, 14, 18.",
    unit: u,
    src: src("8"),
  });
  // Counting (sách tr.4: count 12 pens)
  [
    ["✏️", "bút chì", "pencils", 12, 1],
    ["🔵", "chấm", "dots", 11, 2],
    ["🎈", "bóng bay", "balloons", 13, 3],
    ["⭐", "ngôi sao", "stars", 14, 4],
    ["🐝", "con ong", "bees", 12, 5],
  ].forEach(([emoji, vi, en, n, d], i) => {
    tap(p, {
      d,
      q: rotate(TAP_Q, i),
      emoji,
      vi,
      en,
      n,
      hints: ["Count to 10 first.", "Then keep going: 11, 12…"],
      why: `There are ${n} ${en}.`,
      unit: u,
      src: src("8"),
    });
  });
  [
    ["Fourteen.", 1],
    ["Ten and four is fourteen.", 2],
    ["One ten and seven ones is seventeen.", 3],
    ["Eleven, twelve, thirteen, fourteen, fifteen.", 4],
    ["Ten is not a teen number.", 5],
  ].forEach(([text, d], i) => {
    read(p, {
      d,
      q: rotate(READ_Q, i),
      text,
      model: i === 1,
      unit: u,
      src: src("8"),
    });
  });
  p.save();
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 2. NUMBER_CHART_20 — "Patterns on a Number Chart to 20" (sách tr.11–13)
// ═══════════════════════════════════════════════════════════════════════════════════════════════
{
  const u = U(3, 3);
  const p = mkPack({
    ...base,
    code: "EMATH.NBT.NUMBER_CHART_20",
    prefix: "emath-chart",
    src: src("11–13"),
    unit: u,
    lessonRefs: [u],
    note: "EDI-MN1 Lesson 'Patterns on a Number Chart to 20' (tr.11–13): quy luật đếm trên bảng 2 × 10 — sang phải thêm 1, xuống dưới thêm 10. Không phải quy luật lặp (G.PATTERNS).",
  });
  // Try This First (tr.11): 2 more than 13
  [
    [13, 2, 1],
    [16, 1, 2],
    [8, 2, 2],
    [17, 2, 3],
    [9, 1, 3],
  ].forEach(([n, k, d], i) => {
    mcq(p, {
      d,
      q: `What number is ${k} more than ${n}?`,
      image: NC({ marked: [n] }),
      correct: n + k,
      wrong: [...around(n + k), [n - k, "nham_cong_tru"]],
      targets: i === 0 ? "dem_thua_1" : null,
      model: i === 0,
      hints: ["Find the number on the chart.", `Move ${k} to the right.`],
      why: `${k} more than ${n} is ${n + k}.`,
      unit: u,
      src: src("11"),
    });
  });
  // Exit Ticket 2 (tr.12): missing numbers in the chart
  [
    [18, 1],
    [9, 2],
    [14, 2],
    [7, 3],
    [20, 3],
    [11, 4],
  ].forEach(([n, d], i) => {
    const wrong = around(n, 1, 20);
    const col = n > 10 ? n - 10 : n + 10;
    wrong.push([col, "sai_hang_chuc_don_vi"]);
    mcq(p, {
      d,
      q: rotate(
        ["Which number is missing?", "What number hides under the ?", "Find the missing number."],
        i,
      ),
      image: NC({ hidden: [n] }),
      correct: n,
      wrong,
      targets: i % 3 === 0 ? "sai_hang_chuc_don_vi" : null,
      model: i === 0,
      hints: ["Look at the numbers before and after it.", "Or look up and down its column."],
      why: `${n - 1}, ${n}, ${n + 1 > 20 ? "" : n + 1} — the missing number is ${n}.`,
      unit: u,
      src: src("12"),
    });
  });
  // Framework (tr.11): the column — 4 is above 14
  [
    ["Which number is below 4?", 4, 14, 5, 1],
    ["Which number is below 7?", 7, 17, 8, 2],
    ["Which number is above 16?", 16, 6, 15, 3],
    ["Which number is above 19?", 19, 9, 18, 4],
  ].forEach(([q, mark, right, row, d], i) => {
    mcq(p, {
      d,
      q,
      image: NC({ marked: [mark] }),
      correct: right,
      wrong: [
        [row, "sai_hang_chuc_don_vi"],
        [right + 1, "dem_thua_1"],
      ],
      targets: "sai_hang_chuc_don_vi",
      model: i === 0,
      hints: ["Stay in the same column.", "Down one row is 10 more; up one row is 10 less."],
      why: `${right} is in the same column as ${mark}.`,
      unit: u,
      src: src("11"),
    });
  });
  // Additional Practice (tr.13): what numbers come next?
  const seq = (n) => [1, 2, 3, 4].map((k) => n + k).join(", ");
  [
    [14, 1],
    [10, 1],
    [8, 2],
    [16, 2],
    [5, 4],
    [11, 5],
  ].forEach(([n, d], i) => {
    const skip = [2, 4, 6].map((k) => n + k).filter((x) => x <= 20);
    const back = [1, 2, 3, 4].map((k) => n - k).filter((x) => x >= 0);
    mcq(p, {
      d,
      q: `What numbers come next after ${n}?`,
      correct: seq(n),
      wrong: [
        [skip.join(", "), "sai_quy_luat_dem"],
        [back.join(", "), "sai_quy_luat_dem"],
      ],
      targets: "sai_quy_luat_dem",
      model: i === 0,
      hints: ["Count on by ones.", `Say ${n}, then the next number.`],
      why: `After ${n} come ${seq(n)}.`,
      unit: u,
      src: src("13"),
    });
  });
  // Exit Ticket 3 (tr.12): chart pieces
  drag(p, {
    d: 1,
    q: "Fill in the missing numbers.",
    image: NC({ hidden: [18, 9] }),
    items: [
      { id: "n18", text: 18 },
      { id: "n9", text: 9 },
      { id: "n19", text: 19, tag: "dem_thua_1" },
    ],
    zones: [
      { id: "a", label: "16 17 ○", take: ["n18"] },
      { id: "b", label: "○ 10 11", take: ["n9"] },
    ],
    model: true,
    hints: ["What comes after 17?", "What comes before 10?"],
    why: "16, 17, 18 and 9, 10, 11.",
    unit: u,
    src: src("12"),
  });
  drag(p, {
    d: 2,
    q: "Fill in the missing numbers.",
    image: NC({ hidden: [7, 19] }),
    items: [
      { id: "n7", text: 7 },
      { id: "n19", text: 19 },
      { id: "n17", text: 17, tag: "sai_hang_chuc_don_vi" },
    ],
    zones: [
      { id: "a", label: "6 ○ 8", take: ["n7"] },
      { id: "b", label: "18 ○ 20", take: ["n19"] },
    ],
    hints: ["What is between 6 and 8?", "What is between 18 and 20?"],
    why: "6, 7, 8 and 18, 19, 20.",
    unit: u,
    src: src("12"),
  });
  drag(p, {
    d: 4,
    q: "Drag the numbers into the chart gaps.",
    image: NC({ hidden: [3, 12, 19] }),
    items: [
      { id: "n3", text: 3 },
      { id: "n12", text: 12 },
      { id: "n19", text: 19 },
      { id: "n13", text: 13, tag: "sai_hang_chuc_don_vi" },
    ],
    zones: [
      { id: "a", label: "2 ○ 4", take: ["n3"] },
      { id: "b", label: "11 ○ 13", take: ["n12"] },
      { id: "c", label: "18 ○ 20", take: ["n19"] },
    ],
    hints: ["Each gap sits between two numbers.", "Count on by one."],
    why: "3, 12 and 19 fill the gaps.",
    unit: u,
    src: src("12"),
  });
  drag(p, {
    d: 3,
    q: "Top row or bottom row?",
    image: NC(),
    items: [
      { id: "n4", text: 4 },
      { id: "n14", text: 14 },
      { id: "n9", text: 9 },
      { id: "n19", text: 19 },
      { id: "n10", text: 10, tag: "nham_so_teen" },
      { id: "n11", text: 11 },
    ],
    zones: [
      { id: "top", label: "1 to 10", take: ["n4", "n9", "n10"] },
      { id: "bottom", label: "11 to 20", take: ["n14", "n19", "n11"] },
    ],
    hints: ["The top row ends at 10.", "The bottom row starts at 11."],
    why: "4, 9 and 10 are on top; 11, 14 and 19 are below.",
    unit: u,
    src: src("11"),
  });
  drag(p, {
    d: 5,
    q: "Put the numbers in counting order.",
    items: [
      { id: "a", text: 17 },
      { id: "b", text: 15 },
      { id: "c", text: 16 },
    ],
    zones: [
      { id: "one", label: "14 ○", take: ["b"] },
      { id: "two", label: "○", take: ["c"] },
      { id: "three", label: "○ 18", take: ["a"] },
    ],
    hints: ["What comes after 14?", "Count on: 15, 16, 17."],
    why: "14, 15, 16, 17, 18.",
    unit: u,
    src: src("13"),
  });
  // listening
  [
    [
      "What comes after sixteen?",
      17,
      [
        [15, "nham_thu_tu_so"],
        [18, "dem_thua_1"],
      ],
      1,
    ],
    [
      "What comes after nine?",
      10,
      [
        [8, "nham_thu_tu_so"],
        [11, "dem_thua_1"],
      ],
      2,
    ],
    [
      "two more than eleven",
      13,
      [
        [12, "dem_thieu_1"],
        [14, "dem_thua_1"],
      ],
      3,
    ],
    [
      "What comes before twenty?",
      19,
      [
        [18, "dem_thieu_1"],
        [20, "lap_lai_tong"],
      ],
      4,
    ],
    [
      "the number below five",
      15,
      [
        [6, "sai_hang_chuc_don_vi"],
        [14, "dem_thieu_1"],
      ],
      5,
    ],
  ].forEach(([listen, n, wrong, d], i) => {
    mcq(p, {
      d,
      q: rotate(LISTEN_Q, i + 1),
      listen,
      image: i === 4 ? NC({ marked: [5] }) : undefined,
      correct: n,
      wrong,
      hints: ["Listen again.", "Use the number chart in your head."],
      why: `The answer is ${n}.`,
      unit: u,
      src: src(i < 2 ? "13" : "11"),
    });
  });
  [
    ["✏️", "bút chì", "pencils", 11, 1],
    ["🍎", "quả táo", "apples", 13, 2],
    ["🐞", "bọ rùa", "ladybugs", 12, 3],
    ["🌸", "bông hoa", "flowers", 14, 4],
    ["⭐", "ngôi sao", "stars", 15, 5],
  ].forEach(([emoji, vi, en, n, d], i) => {
    tap(p, {
      d,
      q: rotate(TAP_Q, i + 1),
      emoji,
      vi,
      en,
      n,
      hints: ["Tap in order, like reading the chart.", "After 10 comes 11."],
      why: `There are ${n} ${en}.`,
      unit: u,
      src: src("13"),
    });
  });
  [
    ["Eleven, twelve, thirteen, fourteen.", 1],
    ["Two more than thirteen is fifteen.", 2],
    ["Fourteen is below four.", 3],
    ["Sixteen, seventeen, eighteen, nineteen, twenty.", 4],
    ["A number chart helps you count.", 5],
  ].forEach(([text, d], i) => {
    read(p, { d, q: rotate(READ_Q, i + 2), text, model: i === 0, unit: u, src: src("11") });
  });
  p.save();
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 3. TENS_ONES — "Understand Tens" (đầu trang Lesson 3-2, sách tr.17–19)
// ═══════════════════════════════════════════════════════════════════════════════════════════════
{
  const u = U(3, 5);
  const p = mkPack({
    ...base,
    code: "EMATH.NBT.TENS_ONES",
    prefix: "emath-tens",
    src: src("17–19"),
    unit: u,
    lessonRefs: [u, U(3, 6)],
    note: "EDI-MN1 'Understand Tens' (đầu trang Lesson 3-2, tr.17–19): 10 ones = 1 ten, 20 ones = 2 tens. Bẫy của sách: nhóm không đủ 10 (chuc_khong_du_10), 25 khối gọi là 2 chục.",
  });
  mcq(p, {
    d: 1,
    q: "How many ones make a ten?",
    image: TO(1, 0),
    correct: 10,
    wrong: [
      [9, "chuc_khong_du_10"],
      [11, "dem_thua_1"],
    ],
    targets: "chuc_khong_du_10",
    model: true,
    hints: ["Count the cubes in the rod.", "One, two, three… up to the top."],
    why: "10 ones make 1 ten.",
    unit: u,
    src: src("17"),
  });
  // Exit Ticket 1 (tr.18): two rods
  mcq(p, {
    d: 1,
    q: "2 tens and 0 ones is what number?",
    image: TO(2, 0),
    correct: 20,
    wrong: [
      [2, "sai_hang_chuc_don_vi"],
      [19, "chuc_khong_du_10"],
    ],
    targets: "sai_hang_chuc_don_vi",
    model: true,
    hints: ["Each rod is 10.", "10, 20."],
    why: "2 tens and 0 ones is 20.",
    unit: u,
    src: src("18"),
  });
  mcq(p, {
    d: 2,
    q: "How many tens do you see?",
    image: TO(2, 0),
    model: true,
    correct: 2,
    wrong: [
      [20, "sai_hang_chuc_don_vi"],
      [1, "dem_thieu_1"],
    ],
    hints: ["A ten is one whole rod.", "Count the rods, not the cubes."],
    why: "There are 2 rods, so 2 tens.",
    unit: u,
    src: src("18"),
  });
  // YES/NO (tr.18): 25 cubes in pairs are not 2 tens
  mcq(p, {
    d: 2,
    q: "Are these cubes 2 tens?",
    image: TO(0, 25),
    correct: "No",
    wrong: [["Yes", "chuc_khong_du_10"]],
    targets: "chuc_khong_du_10",
    hints: ["Count all the cubes.", "2 tens would be 20. Are there 20?"],
    why: "There are 25 cubes, not 20, so they are not 2 tens.",
    unit: u,
    src: src("18"),
  });
  mcq(p, {
    d: 2,
    q: "10 ones make how many tens?",
    image: TO(0, 10),
    correct: 1,
    wrong: [
      [10, "sai_hang_chuc_don_vi"],
      [2, "dem_thua_1"],
    ],
    targets: "sai_hang_chuc_don_vi",
    hints: ["10 ones can make one rod.", "How many rods?"],
    why: "10 ones is the same as 1 ten.",
    unit: u,
    src: src("18"),
  });
  // Additional Practice (tr.19)
  mcq(p, {
    d: 1,
    q: "20 ones make how many tens?",
    image: TO(0, 20),
    correct: 2,
    wrong: [
      [20, "sai_hang_chuc_don_vi"],
      [1, "dem_thieu_1"],
    ],
    hints: ["Make groups of 10.", "10 and 10."],
    why: "20 ones = 2 tens.",
    unit: u,
    src: src("19"),
  });
  mcq(p, {
    d: 2,
    q: "20 children. 10 fit on each bus. How many buses?",
    correct: 2,
    wrong: [
      [20, "lap_lai_tong"],
      [1, "dem_thieu_1"],
    ],
    targets: "lap_lai_tong",
    hints: ["Each bus takes a group of 10.", "10 children, then 10 more."],
    why: "20 children fill 2 buses of 10.",
    unit: u,
    src: src("19"),
  });
  mcq(p, {
    d: 2,
    q: "Which picture shows 1 ten?",
    correctImage: TO(1, 0),
    correct: "10",
    wrong: [
      [TO(1, 0, { rodSize: 9 }), "chuc_khong_du_10"],
      [TO(0, 8), "chuc_khong_du_10"],
    ],
    targets: "chuc_khong_du_10",
    model: true,
    hints: ["A ten has exactly 10 cubes.", "Count each rod."],
    why: "Only the rod with 10 cubes is 1 ten.",
    unit: u,
    src: src("17"),
  });
  // variants
  [
    [16, 3],
    [13, 3],
    [18, 4],
  ].forEach(([n, d]) => {
    mcq(p, {
      d,
      q: `1 ten and ${n - 10} ones is what number?`,
      image: TO(1, n - 10),
      correct: n,
      wrong: [[Number(`${n - 10}1`), "nham_thu_tu_so"], ...around(n)],
      targets: "nham_thu_tu_so",
      hints: ["Say the ten first.", `Ten… and ${n - 10} more.`],
      why: `1 ten and ${n - 10} ones is ${n}.`,
      unit: U(3, 6),
      src: src("20"),
    });
  });
  [
    [17, 3],
    [14, 4],
    [19, 5],
  ].forEach(([n, d]) => {
    mcq(p, {
      d,
      q: `How many tens are in ${n}?`,
      correct: 1,
      wrong: [
        [n, "lap_lai_tong"],
        [2, "dem_thua_1"],
      ],
      hints: [`${n} is a teen number.`, "Every teen number is one ten and some ones."],
      why: `${n} is 1 ten and ${n - 10} ones.`,
      unit: u,
      src: src("20"),
    });
  });
  [
    [17, 4],
    [12, 5],
  ].forEach(([n, d]) => {
    mcq(p, {
      d,
      q: `How many ones are in ${n}?`,
      correct: n - 10,
      wrong: [[n, "lap_lai_tong"], ...around(n - 10, 1)],
      hints: ["Take away the ten.", `${n} is 10 and some more.`],
      why: `${n} is 1 ten and ${n - 10} ones.`,
      unit: u,
      src: src("20"),
    });
  });
  mcq(p, {
    d: 5,
    q: "Count carefully. Is this 1 ten?",
    image: TO(1, 0, { rodSize: 9 }),
    correct: "No",
    wrong: [["Yes", "chuc_khong_du_10"]],
    targets: "chuc_khong_du_10",
    hints: ["Count every cube in the rod.", "A ten needs ten cubes."],
    why: "This rod has only 9 cubes, so it is not a ten.",
    unit: U(3, 6),
    src: src("21"),
  });
  // drags: make a ten, tens and ones cards, matching
  dots(p, {
    d: 1,
    q: "Drag 10 ones to make a ten.",
    frames: 1,
    need: 10,
    spare: 2,
    model: true,
    hints: ["Fill every box of the frame.", "A full frame is 10."],
    why: "10 ones make 1 ten.",
    unit: u,
    src: src("17"),
  });
  dots(p, {
    d: 3,
    q: "Make 2 tens: fill both frames.",
    frames: 2,
    need: 20,
    spare: 2,
    hints: ["Each frame is one ten.", "Fill the first, then the second."],
    why: "Two full frames are 2 tens: 20.",
    unit: u,
    src: src("19"),
  });
  [
    [14, 2],
    [17, 3],
    [20, 4],
  ].forEach(([n, d]) => {
    const t = Math.floor(n / 10);
    const o = n % 10;
    drag(p, {
      d,
      q: `Show ${n}: drag the tens and the ones.`,
      image: TO(t, o),
      items: [
        { id: "t", text: t, tag: "sai_hang_chuc_don_vi" },
        { id: "o", text: o, tag: "sai_hang_chuc_don_vi" },
        { id: "n", text: n, tag: "lap_lai_tong" },
      ],
      zones: [
        { id: "tens", label: "tens", take: ["t"] },
        { id: "ones", label: "ones", take: ["o"] },
      ],
      targets: "sai_hang_chuc_don_vi",
      hints: ["Count the rods for tens.", "Count the loose cubes for ones."],
      why: `${n} is ${t} ten${t > 1 ? "s" : ""} and ${o} ones.`,
      unit: u,
      src: src("18"),
    });
  });
  drag(p, {
    d: 5,
    q: "Match the ones to the tens.",
    items: [
      { id: "one", text: "1 ten" },
      { id: "two", text: "2 tens" },
    ],
    zones: [
      { id: "ten", label: "10 ones", take: ["one"] },
      { id: "twenty", label: "20 ones", take: ["two"] },
    ],
    hints: ["Every 10 ones make 1 ten.", "20 is 10 and 10."],
    why: "10 ones = 1 ten; 20 ones = 2 tens.",
    unit: u,
    src: src("19"),
  });
  // listening
  [
    [
      "two tens",
      20,
      [
        [2, "sai_hang_chuc_don_vi"],
        [19, "chuc_khong_du_10"],
      ],
      2,
    ],
    [
      "ten ones",
      10,
      [
        [1, "sai_hang_chuc_don_vi"],
        [9, "chuc_khong_du_10"],
      ],
      1,
    ],
    [
      "one ten and five ones",
      15,
      [
        [51, "nham_thu_tu_so"],
        [14, "dem_thieu_1"],
      ],
      3,
    ],
    [
      "one ten and nine ones",
      19,
      [
        [91, "nham_thu_tu_so"],
        [20, "dem_thua_1"],
      ],
      4,
    ],
    [
      "one ten and zero ones",
      10,
      [
        [1, "sai_hang_chuc_don_vi"],
        [11, "dem_thua_1"],
      ],
      5,
    ],
  ].forEach(([listen, n, wrong, d], i) => {
    mcq(p, {
      d,
      q: rotate(LISTEN_Q, i + 2),
      listen,
      correct: n,
      wrong,
      hints: ["A ten is 10.", "Put the tens and ones together."],
      why: `${cap(listen)} is ${n}.`,
      unit: u,
      src: src("18"),
    });
  });
  [
    ["✏️", "bút chì", "pencils", 10, 1],
    ["🟦", "khối vuông", "cubes", 10, 2],
    ["🧒", "bạn nhỏ", "children", 10, 3],
    ["🍓", "quả dâu", "strawberries", 12, 4],
    ["🔵", "chấm", "dots", 11, 5],
  ].forEach(([emoji, vi, en, n, d], i) => {
    tap(p, {
      d,
      q: rotate(TAP_Q, i + 2),
      emoji,
      vi,
      en,
      n,
      hints: ["Count carefully, one each.", "Is it a group of ten?"],
      why: `There are ${n} ${en}${n === 10 ? " — that is 1 ten" : ""}.`,
      unit: u,
      src: src("19"),
    });
  });
  [
    ["Ten ones is the same as one ten.", 1],
    ["Two tens and zero ones is twenty.", 2],
    ["One ten and four ones is fourteen.", 3],
    ["Twenty ones make two tens.", 4],
    ["A ten has ten cubes.", 5],
  ].forEach(([text, d], i) => {
    read(p, { d, q: rotate(READ_Q, i + 3), text, model: i === 0, unit: u, src: src("17") });
  });
  p.save();
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 4. PLACE_VALUE_MODELS — "Represent Tens and Ones" (đầu trang Lesson 3-3, sách tr.20–22)
// ═══════════════════════════════════════════════════════════════════════════════════════════════
{
  const u = U(3, 6);
  const p = mkPack({
    ...base,
    code: "EMATH.NBT.PLACE_VALUE_MODELS",
    prefix: "emath-pvm",
    src: src("20–22"),
    unit: u,
    lessonRefs: [u],
    note: "EDI-MN1 'Represent Tens and Ones' (đầu trang Lesson 3-3, tr.20–22): thanh chục + khối rời, chuỗi hạt, ten-frame. Nhiễu của sách: thanh chỉ 9 khối (chuc_khong_du_10), thừa một thanh chục.",
  });
  // Exit Ticket 1 (tr.21): how can you show 13? A 1+3, B 2+3, C 1+6, D a 9-rod + 3
  mcq(p, {
    d: 1,
    q: "How can you show number 13?",
    correctImage: TO(1, 3),
    correct: "13",
    wrong: [
      [TO(2, 3), "sai_hang_chuc_don_vi"],
      [TO(1, 6)],
      [TO(1, 3, { rodSize: 9 }), "chuc_khong_du_10"],
    ],
    targets: "chuc_khong_du_10",
    model: true,
    hints: ["13 is 1 ten and 3 ones.", "Check that the rod has 10 cubes."],
    why: "13 is one full rod of 10 and 3 cubes.",
    unit: u,
    src: src("21"),
  });
  [
    [17, 2],
    [15, 2],
    [11, 3],
    [19, 4],
  ].forEach(([n, d], i) => {
    mcq(p, {
      d,
      q: rotate(
        ["How can you show number {n}?", "Which picture shows {n}?", "Find the model for {n}."],
        i,
      ).replace("{n}", n),
      correctImage: TO(1, n - 10),
      correct: String(n),
      wrong: [
        [TO(1, n - 10, { rodSize: 9 }), "chuc_khong_du_10"],
        [TO(2, n - 10), "sai_hang_chuc_don_vi"],
        [TO(1, n - 11), "dem_thieu_1"],
      ],
      targets: i % 2 ? "sai_hang_chuc_don_vi" : "chuc_khong_du_10",
      hints: [`${n} is 1 ten and ${n - 10} ones.`, "Count the cubes in the rod too."],
      why: `${n} is one rod of 10 and ${n - 10} cubes.`,
      unit: u,
      src: src("21"),
    });
  });
  mcq(p, {
    d: 5,
    q: "Which picture shows 20?",
    correctImage: TO(2, 0),
    correct: "20",
    wrong: [
      [TO(2, 0, { rodSize: 9 }), "chuc_khong_du_10"],
      [TO(1, 9), "dem_thieu_1"],
      [TO(0, 2), "sai_hang_chuc_don_vi"],
    ],
    hints: ["20 is 2 tens.", "Check each rod has 10."],
    why: "20 is two full rods of 10.",
    unit: u,
    src: src("22"),
  });
  // Framework (tr.20) and Exit Ticket 3 (tr.21)
  mcq(p, {
    d: 1,
    q: "What number is this?",
    image: TO(1, 6),
    correct: 16,
    wrong: [[61, "nham_thu_tu_so"], ...around(16)],
    model: true,
    targets: "nham_thu_tu_so",
    hints: ["The rod is 1 ten.", "Count the loose cubes: 6."],
    why: "1 ten and 6 ones is 16.",
    unit: u,
    src: src("20"),
  });
  mcq(p, {
    d: 1,
    q: "How many beads in all?",
    image: TO(1, 7, { style: "beads" }),
    correct: 17,
    wrong: [[71, "nham_thu_tu_so"], ...around(17)],
    model: true,
    hints: ["The string has 10 beads.", "Then count the loose beads."],
    why: "1 ten and 7 ones is 17.",
    unit: u,
    src: src("21"),
  });
  // Additional Practice (tr.22): ten-frames 10 + 3 and 10 + 4
  [
    [3, 2],
    [4, 2],
  ].forEach(([k, d]) => {
    mcq(p, {
      d,
      q: "What number do the ten-frames show?",
      image: TF(10 + k),
      correct: 10 + k,
      wrong: around(10 + k),
      hints: ["A full frame is 1 ten.", `Then ${k} ones.`],
      why: `1 ten and ${k} ones is ${10 + k}.`,
      unit: u,
      src: src("22"),
    });
  });
  [
    [TO(1, 2), 12, 3],
    [TO(1, 8, { style: "beads" }), 18, 3],
    [TO(2, 0), 20, 3],
    [TO(1, 5), 15, 4],
  ].forEach(([image, n, d], i) => {
    mcq(p, {
      d,
      q: rotate(["What number is this?", "How many in all?", "Count the tens and ones."], i + 1),
      image,
      correct: n,
      wrong: [
        ...around(n),
        [
          n % 10 === 0 ? n / 10 : Number(`${n % 10}${Math.floor(n / 10)}`),
          n % 10 === 0 ? "sai_hang_chuc_don_vi" : "nham_thu_tu_so",
        ],
      ],
      hints: ["Count the tens first: 10, 20…", "Then count on the ones."],
      why: `This shows ${n}.`,
      unit: u,
      src: src("22"),
    });
  });
  // the trap turned round: a 9-rod and 9 cubes is 18, not 19
  mcq(p, {
    d: 5,
    q: "Count every cube. What number is this?",
    image: TO(1, 9, { rodSize: 9 }),
    correct: 18,
    wrong: [
      [19, "dem_thua_1"],
      [17, "dem_thieu_1"],
    ],
    targets: "dem_thua_1",
    hints: ["Is the rod really 10?", "Count the rod cubes one by one."],
    why: "The rod has only 9 cubes: 9 and 9 is 18.",
    unit: u,
    src: src("21"),
  });
  // drags
  drag(p, {
    d: 2,
    q: "Match each model to its number.",
    items: [
      { id: "n13", text: 13 },
      { id: "n16", text: 16 },
      { id: "n11", text: 11 },
    ],
    zones: [
      { id: "a", image: TO(1, 3), take: ["n13"] },
      { id: "b", image: TO(1, 6), take: ["n16"] },
      { id: "c", image: TO(1, 1), take: ["n11"] },
    ],
    model: true,
    hints: ["Each rod is 10.", "Count the loose cubes."],
    why: "13, 16 and 11.",
    unit: u,
    src: src("22"),
  });
  drag(p, {
    d: 4,
    q: "Match each model to its number.",
    items: [
      { id: "n14", text: 14 },
      { id: "n20", text: 20 },
      { id: "n17", text: 17 },
      { id: "n12", text: 12, tag: "sai_hang_chuc_don_vi" },
    ],
    zones: [
      { id: "a", image: TO(1, 4, { style: "beads" }), take: ["n14"] },
      { id: "b", image: TO(2, 0), take: ["n20"] },
      { id: "c", image: TO(1, 7), take: ["n17"] },
    ],
    hints: ["Count the tens first.", "Two rods are 20."],
    why: "14, 20 and 17.",
    unit: u,
    src: src("22"),
  });
  dots(p, {
    d: 2,
    q: "Draw 17 with dots: drag them in.",
    frames: 2,
    need: 17,
    spare: 2,
    model: true,
    hints: ["Fill one frame for the ten.", "Then 7 ones."],
    why: "17 is 1 ten and 7 ones.",
    unit: u,
    src: src("21"),
  });
  dots(p, {
    d: 3,
    q: "Show 20: fill the ten-frames.",
    frames: 2,
    need: 20,
    spare: 2,
    hints: ["20 is 2 tens.", "Fill both frames."],
    why: "Two full frames make 20.",
    unit: u,
    src: src("22"),
  });
  dots(p, {
    d: 4,
    q: "One frame is full. Drag dots to show 16.",
    frames: 2,
    printed: [{ count: 10, tone: "dark" }],
    need: 6,
    spare: 2,
    tone: "light",
    hints: ["10 is done.", "16 is 10 and 6."],
    why: "10 and 6 more is 16.",
    unit: u,
    src: src("22"),
  });
  drag(p, {
    d: 5,
    q: "Sort: which models show 15?",
    items: [
      { id: "a", image: TO(1, 5) },
      { id: "b", image: TF(15) },
      { id: "c", image: TO(1, 5, { rodSize: 9 }), tag: "chuc_khong_du_10" },
      { id: "d", image: TO(2, 5), tag: "sai_hang_chuc_don_vi" },
    ],
    zones: [
      { id: "yes", label: "Shows 15", take: ["a", "b"] },
      { id: "no", label: "Not 15", take: ["c", "d"] },
    ],
    targets: "chuc_khong_du_10",
    hints: ["15 is 1 ten and 5 ones.", "Check every ten has 10."],
    why: "A full rod and 5 cubes, or a full frame and 5 dots, show 15.",
    unit: u,
    src: src("21"),
  });
  // listening
  [
    ["one ten and six ones", 16, 2],
    ["one ten and three ones", 13, 3],
    ["two tens", 20, 4],
  ].forEach(([listen, n, d], i) => {
    mcq(p, {
      d,
      q: rotate(
        ["Listen. Tap the model.", "Which model did you hear?", "Listen, then find the model."],
        i,
      ),
      listen,
      correctImage: TO(Math.floor(n / 10), n % 10),
      correct: String(n),
      wrong: [
        [TO(Math.floor(n / 10), n % 10, { rodSize: 9 }), "chuc_khong_du_10"],
        n === 20 ? [TO(0, 2), "sai_hang_chuc_don_vi"] : [TO(1, (n % 10) - 1), "dem_thieu_1"],
      ],
      hints: ["Listen for the tens.", "Then listen for the ones."],
      why: `${cap(listen)} is ${n}.`,
      unit: u,
      src: src("20"),
    });
  });
  [
    ["seventeen", 17, 1],
    ["one ten and eight ones", 18, 5],
  ].forEach(([listen, n, d], i) => {
    mcq(p, {
      d,
      q: rotate(LISTEN_Q, i + 3),
      listen,
      correct: n,
      wrong: [[Number(`${n % 10}1`), "nham_thu_tu_so"], ...around(n)],
      hints: ["Tens come first.", "Say it again in your head."],
      why: `${cap(listen)} is ${n}.`,
      unit: u,
      src: src("21"),
    });
  });
  [
    ["🟦", "khối vuông", "cubes", 13, 1],
    ["🔵", "hạt", "beads", 12, 2],
    ["🟧", "khối vuông", "blocks", 14, 3],
    ["🟡", "hạt", "beads", 11, 4],
    ["⭐", "ngôi sao", "stars", 13, 5],
  ].forEach(([emoji, vi, en, n, d], i) => {
    tap(p, {
      d,
      q: rotate(TAP_Q, i + 3),
      emoji,
      vi,
      en,
      n,
      hints: ["Count 10 first: that is a ten.", "Then count the ones left."],
      why: `${n} is 1 ten and ${n - 10} ones.`,
      unit: u,
      src: src("22"),
    });
  });
  [
    ["One ten and six ones is sixteen.", 1],
    ["One ten, seven ones, seventeen.", 2],
    ["Two tens is twenty.", 3],
    ["This rod has ten cubes.", 4],
    ["One ten and three ones is thirteen.", 5],
  ].forEach(([text, d], i) => {
    read(p, { d, q: rotate(READ_Q, i + 4), text, model: i === 0, unit: u, src: src("20") });
  });
  p.save();
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 5. COMPARE_TO_20 — Lesson 3-6, 3-7, 3-8 (sách tr.23–31)
// ═══════════════════════════════════════════════════════════════════════════════════════════════
{
  const L7 = U(3, 7);
  const L8 = U(3, 8);
  const L9 = U(3, 9);
  const p = mkPack({
    ...base,
    code: "EMATH.NBT.COMPARE_TO_20",
    prefix: "emath-cmp20",
    src: src("23–31"),
    unit: L7,
    lessonRefs: [L7, L8, L9],
    note: "EDI-MN1 Lesson 3-6 Compare Numbers, 3-7 Compare Numbers on a Number Line, 3-8 Use Symbols (tr.23–31). 'Alligator eats the bigger number.' Kéo dấu > < = vào ô tròn giữa hai số.",
  });
  // Lesson 3-6 (tr.23–25)
  mcq(p, {
    d: 1,
    q: "Which is greater: 8 or 12?",
    image: TO(1, 2),
    correct: 12,
    wrong: [[8, "so_sanh_nguoc"]],
    targets: "so_sanh_nguoc",
    model: true,
    hints: ["Count up: the number you say later is greater.", "A ten makes a number bigger."],
    why: "12 is greater than 8.",
    unit: L7,
    src: src("23"),
  });
  mcq(p, {
    d: 1,
    q: "Which sentence is correct?",
    image: TO(1, 2),
    correct: "12 is greater than 9",
    wrong: [["9 is greater than 12", "so_sanh_nguoc"]],
    targets: "so_sanh_nguoc",
    hints: ["12 is 1 ten and 2 ones.", "9 has no ten."],
    why: "12 is greater than 9.",
    unit: L7,
    src: src("24"),
  });
  mcq(p, {
    d: 1,
    q: "Val has 17 beads. Jean has 11 beads. Who has more?",
    correct: "Val",
    wrong: [["Jean", "so_sanh_nguoc"]],
    targets: "so_sanh_nguoc",
    model: true,
    hints: ["Compare 17 and 11.", "Both have 1 ten. Compare the ones: 7 and 1."],
    why: "17 is greater than 11, so Val has more.",
    unit: L7,
    src: src("24"),
  });
  [
    ["True or false: 11 is greater than 12.", "False", "True", "so_sanh_nguoc", 1],
    ["True or false: 13 is greater than 2.", "True", "False", "so_sanh_nguoc", 2],
    ["True or false: 9 is equal to 19.", "False", "True", "sai_hang_chuc_don_vi", 2],
    ["True or false: 15 is equal to 15.", "True", "False", "so_sanh_nguoc", 3],
    ["True or false: 19 is less than 2.", "False", "True", "so_sanh_nguoc", 4],
  ].forEach(([q, right, wrong, tag, d], i) => {
    mcq(p, {
      d,
      q,
      correct: right,
      wrong: [[wrong, tag]],
      model: i === 0,
      hints: ["Compare the tens first.", "Then compare the ones."],
      why: `It is ${right.toLowerCase()}.`,
      unit: L7,
      src: src(i < 3 ? "24" : "25"),
    });
  });
  [
    ["Mia has 14 cards. Tom has 19 cards. Who has more?", "Tom", "Mia", 3],
    ["Ben has 16 shells. Lan has 12 shells. Who has fewer?", "Lan", "Ben", 4],
    ["An has 20 stickers. Bo has 18. Who has fewer?", "Bo", "An", 5],
  ].forEach(([q, right, wrong, d]) => {
    mcq(p, {
      d,
      q,
      correct: right,
      wrong: [[wrong, "so_sanh_nguoc"]],
      targets: "so_sanh_nguoc",
      hints: ["Find the two numbers.", "Fewer means less."],
      why: `${right} is the answer.`,
      unit: L7,
      src: src("25"),
    });
  });
  // Lesson 3-7 (tr.26–28): the number line
  mcq(p, {
    d: 1,
    q: "Which number is farther to the right: 7 or 10?",
    image: NL(0, 20, { labels: [0, 5, 10, 15, 20], marks: [7, 10] }),
    correct: 10,
    wrong: [[7, "so_sanh_nguoc"]],
    model: true,
    hints: ["Numbers grow to the right.", "Find 7 and 10 on the line."],
    why: "10 is farther to the right, so 10 is greater.",
    unit: L8,
    src: src("26"),
  });
  mcq(p, {
    d: 1,
    q: "Which sentence is correct?",
    image: NL(0, 20, { labels: [0, 5, 10, 15, 20], marks: [8, 14] }),
    correct: "14 is greater than 8",
    wrong: [["8 is greater than 14", "so_sanh_nguoc"]],
    targets: "so_sanh_nguoc",
    hints: ["The number to the right is greater.", "14 is to the right of 8."],
    why: "14 is greater than 8.",
    unit: L8,
    src: src("27"),
  });
  [
    ["True or false: 4 is less than 7.", [4, 7], "True", "False", 1],
    ["True or false: 3 is greater than 13.", [3, 13], "False", "True", 2],
    ["True or false: 8 is equal to 9.", [8, 9], "False", "True", 2],
  ].forEach(([q, marks, right, wrong, d]) => {
    mcq(p, {
      d,
      q,
      image: NL(3, 17, { labels: [3, 5, 10, 15, 17], marks }),
      correct: right,
      wrong: [[wrong, "so_sanh_nguoc"]],
      hints: ["Find both numbers on the line.", "Left is less, right is greater."],
      why: `It is ${right.toLowerCase()}.`,
      unit: L8,
      src: src("27"),
    });
  });
  mcq(p, {
    d: 1,
    q: "Pat says that 6 is greater than 11. Do you agree?",
    image: NL(0, 20, { labels: [0, 5, 10, 15, 20], marks: [6, 11] }),
    correct: "No",
    wrong: [["Yes", "so_sanh_nguoc"]],
    targets: "so_sanh_nguoc",
    model: true,
    hints: ["Where is 6? Where is 11?", "11 is to the right."],
    why: "No: 6 is less than 11.",
    unit: L8,
    src: src("27"),
  });
  [
    ["Which is less: 12 or 14?", 12, 14, 2],
    ["Which is less: 18 or 15?", 15, 18, 2],
    ["Jake has 12 cards. Caleb has 18 cards. Who has more?", "Caleb", "Jake", 2],
    ["Which is less: 19 or 9?", 9, 19, 4],
  ].forEach(([q, right, wrong, d], i) => {
    mcq(p, {
      d,
      q,
      image: NL(0, 20, { labels: [0, 5, 10, 15, 20] }),
      correct: right,
      wrong: [[wrong, "so_sanh_nguoc"]],
      targets: i === 3 ? "so_sanh_nguoc" : null,
      hints: ["Find both on the number line.", "The one on the left is less."],
      why: `The answer is ${right}.`,
      unit: L8,
      src: src("28"),
    });
  });
  // Lesson 3-8 (tr.29–31): symbols
  mcq(p, {
    d: 1,
    q: "Which symbol means less than?",
    correct: "<",
    wrong: [
      [">", "nham_dau_lon_be"],
      ["=", "nham_dau_lon_be"],
    ],
    targets: "nham_dau_lon_be",
    model: true,
    hints: ["The alligator eats the bigger number.", "Less than points to the left: <"],
    why: "< means less than.",
    unit: L9,
    src: src("30"),
  });
  mcq(p, {
    d: 1,
    q: "Which symbol would you use between 15 and 12?",
    correct: ">",
    wrong: [
      ["<", "nham_dau_lon_be"],
      ["=", "nham_dau_lon_be"],
    ],
    targets: "nham_dau_lon_be",
    hints: ["Which is bigger, 15 or 12?", "The open mouth faces 15."],
    why: "15 > 12.",
    unit: L9,
    src: src("29"),
  });
  mcq(p, {
    d: 2,
    q: "Which symbol means equal to?",
    correct: "=",
    wrong: [
      [">", "nham_dau_lon_be"],
      ["<", "nham_dau_lon_be"],
    ],
    hints: ["Equal means the same.", "It has two flat lines."],
    why: "= means equal to.",
    unit: L9,
    src: src("31"),
  });
  mcq(p, {
    d: 2,
    q: "Pat writes 8 > 17. Is Pat correct?",
    correct: "No",
    wrong: [["Yes", "so_sanh_nguoc"]],
    targets: "so_sanh_nguoc",
    hints: ["Is 8 greater than 17?", "17 has a ten."],
    why: "No: 8 < 17.",
    unit: L9,
    src: src("31"),
  });
  [
    [16, 13, 3],
    [14, 19, 4],
    [20, 20, 5],
  ].forEach(([a, b, d]) => {
    const right = a > b ? ">" : a < b ? "<" : "=";
    mcq(p, {
      d,
      q: `Which sign goes in ${a} ○ ${b}?`,
      correct: right,
      wrong: [">", "<", "="].filter((s) => s !== right).map((s) => [s, "nham_dau_lon_be"]),
      hints: ["Which number is greater?", "The mouth opens to the greater number."],
      why: `${a} ${right} ${b}.`,
      unit: L9,
      src: src("30"),
    });
  });
  // Drag the sign into the circle (tr.30–31)
  const SIGN_Q = [
    "Drag the right sign.",
    "Which sign fits? Drag it in.",
    "Make it true: drag a sign.",
    "Feed the alligator: drag the sign.",
  ];
  [
    [15, 12, 1, "30"],
    [5, 11, 1, "30"],
    [17, 8, 1, "30"],
    [12, 12, 2, "30"],
    [15, 19, 2, "31"],
    [2, 1, 2, "31"],
    [20, 19, 3, "31"],
    [10, 10, 3, "31"],
    [18, 7, 4, "31"],
  ].forEach(([a, b, d, pg], i) => {
    sign(p, {
      d,
      q: rotate(SIGN_Q, i),
      pair: [a, b],
      model: i < 2,
      hints: ["Which number is greater?", "The open side faces the greater number."],
      why: `${a} ${a > b ? ">" : a < b ? "<" : "="} ${b}.`,
      unit: L9,
      src: src(pg),
    });
  });
  drag(p, {
    d: 3,
    q: "Greater than 15 or less than 15?",
    items: [
      { id: "n19", text: 19 },
      { id: "n12", text: 12 },
      { id: "n17", text: 17 },
      { id: "n9", text: 9 },
    ],
    zones: [
      { id: "more", label: "Greater than 15", take: ["n19", "n17"] },
      { id: "less", label: "Less than 15", take: ["n12", "n9"] },
    ],
    hints: ["Say the numbers in order and find 15.", "After 15 is greater."],
    why: "17 and 19 are greater than 15; 9 and 12 are less.",
    unit: L7,
    src: src("25"),
  });
  drag(p, {
    d: 5,
    q: "Order from least to greatest.",
    image: NL(0, 20, { labels: [0, 5, 10, 15, 20] }),
    items: [
      { id: "a", text: 13 },
      { id: "b", text: 8 },
      { id: "c", text: 18 },
    ],
    zones: [
      { id: "l", label: "Least", take: ["b"] },
      { id: "m", label: "Middle", take: ["a"] },
      { id: "g", label: "Greatest", take: ["c"] },
    ],
    hints: ["Find each on the number line.", "Left to right is least to greatest."],
    why: "8, 13, 18.",
    unit: L8,
    src: src("28"),
  });
  // listening
  [
    ["sixteen or twelve: which is greater?", 16, 12, "so_sanh_nguoc", 2],
    ["nine or fourteen: which is less?", 9, 14, "so_sanh_nguoc", 3],
    ["eleven or seventeen: which is greater?", 17, 11, "so_sanh_nguoc", 4],
  ].forEach(([listen, right, wrong, tag, d], i) => {
    mcq(p, {
      d,
      q: rotate(LISTEN_Q, i + 4),
      listen,
      correct: right,
      wrong: [[wrong, tag]],
      hints: ["Listen for greater or less.", "Compare the two numbers."],
      why: `The answer is ${right}.`,
      unit: L7,
      src: src("24"),
    });
  });
  [
    ["greater than", ">", 1],
    ["less than", "<", 2],
  ].forEach(([listen, right, d], i) => {
    mcq(p, {
      d,
      q: rotate(["Listen. Tap the sign.", "Which sign did you hear?"], i),
      listen,
      correct: right,
      wrong: [">", "<", "="].filter((s) => s !== right).map((s) => [s, "nham_dau_lon_be"]),
      hints: ["The alligator opens to the bigger number.", "Look at which way it points."],
      why: `${right} means ${listen}.`,
      unit: L9,
      src: src("29"),
    });
  });
  // counting the pictures of tr.31 (10 strawberries, 12 apples, 8 bats, 14 sticks)
  [
    ["🍓", "quả dâu", "strawberries", 10, 1],
    ["🍎", "quả táo", "apples", 12, 2],
    ["🏓", "vợt bóng bàn", "bats", 8, 3],
    ["🥢", "que", "sticks", 14, 4],
    ["🐸", "con ếch", "frogs", 11, 5],
  ].forEach(([emoji, vi, en, n, d], i) => {
    tap(p, {
      d,
      q: rotate(TAP_Q, i),
      emoji,
      vi,
      en,
      n,
      hints: ["Count each one once.", "Say the number out loud."],
      why: `There are ${n} ${en}.`,
      unit: L9,
      src: src("31"),
    });
  });
  [
    ["Eighteen is greater than fifteen.", 1],
    ["Fifteen is less than eighteen.", 2],
    ["Twelve is equal to twelve.", 3],
    ["The number to the right is greater.", 4],
    ["The alligator eats the bigger number!", 5],
  ].forEach(([text, d], i) => {
    read(p, {
      d,
      q: rotate(READ_Q, i),
      text,
      model: i === 0,
      unit: i === 3 ? L8 : L7,
      src: src(i === 3 ? "26" : "23"),
    });
  });
  p.save();
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// 6. Additions to existing packs
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** Appends `build(p)`'s exercises to an existing pack, replacing an earlier run of this script. */
function extend(file, prefix, lessonRefs, build) {
  const path = `content/exercises/emath/${file}.pack.json`;
  const pack = JSON.parse(readFileSync(path, "utf8"));
  const list = [];
  let n = 0;
  const p = {
    add(e) {
      n += 1;
      list.push(
        ex({
          id: numberId(prefix, n),
          language: "en",
          skillCodes: [pack.skillCode],
          ...e,
          meta: { estSeconds: 25, ...(e.meta ?? {}) },
        }),
      );
    },
  };
  build(p);
  pack.exercises = [...pack.exercises.filter((e) => !e.id.startsWith(`${prefix}-`)), ...list];
  pack.lessonRefs = [...new Set([...(pack.lessonRefs ?? []), ...lessonRefs])];
  writePack(path, pack);
}

// COUNT_TO_20 — Numbers 1 to 10 (tr.5–7)
extend("NBT.COUNT_TO_20", "emath-mn1-count", [U(3, 1)], (p) => {
  const u = U(3, 1);
  mcq(p, {
    d: 1,
    q: "How many fingers are on one hand?",
    image: img("🖐️", "bàn tay", "hand"),
    correct: 5,
    wrong: around(5),
    hints: ["Hold up one hand.", "Count each finger."],
    why: "One hand has 5 fingers.",
    unit: u,
    src: src("5"),
  });
  [
    ["🔺", "tam giác", "triangles", 3, [2, 4], 1],
    ["❤️", "trái tim", "hearts", 8, [7, 9], 1],
    ["⭐", "ngôi sao", "stars", 5, [6, 4], 2],
  ].forEach(([emoji, vi, en, n, wrong, d], i) => {
    mcq(p, {
      d,
      q: `Circle the correct number. How many ${en}?`,
      image: img(emoji, vi, en, n),
      correct: n,
      wrong: wrong.map((w) => [w, w < n ? "dem_thieu_1" : "dem_thua_1"]),
      targets: i === 1 ? "dem_thieu_1" : null,
      hints: ["Touch each one as you count.", "Say the last number you count."],
      why: `There are ${n} ${en}.`,
      unit: u,
      src: src("6"),
    });
  });
  [
    ["🚗", "ô tô", "cars", 10],
    ["🧸", "gấu bông", "teddy bears", 10],
  ].forEach(([emoji, vi, en, n], i) => {
    tap(p, {
      d: 1,
      q: `How many ${en}? Tap each one.`,
      emoji,
      vi,
      en,
      n,
      hints: ["Two rows of five.", "5 and 5 more."],
      why: `There are ${n} ${en}.`,
      unit: u,
      src: src("6"),
    });
  });
  dots(p, {
    d: 1,
    q: "Draw 7 objects: drag 7 dots in.",
    frames: 1,
    need: 7,
    spare: 3,
    model: true,
    hints: ["Count as you drag.", "Stop at 7."],
    why: "7 dots are 7 objects.",
    unit: u,
    src: src("6"),
  });
  [
    ["🐝", "con ong", "bees", 4, 2, "4 bees. 2 more come. How many bees now?"],
    ["🦋", "con bướm", "butterflies", 3, 2, "3 butterflies. 2 more come. How many now?"],
  ].forEach(([emoji, vi, en, a, b, q]) => {
    mcq(p, {
      d: 2,
      q,
      image: img(emoji, vi, en, a),
      correct: a + b,
      wrong: [...around(a + b), [a - b, "nham_cong_tru"]],
      targets: "dem_thieu_1",
      hints: [`Start with ${a}.`, `Count on ${b} more.`],
      why: `${a} and ${b} more is ${a + b}.`,
      unit: u,
      src: src("7"),
    });
  });
  [
    [[4, 1, 5], 2],
    [[7, 10, 9], 3],
  ].forEach(([nums, d]) => {
    drag(p, {
      d,
      q: "Match each number to its word.",
      items: nums.map((n) => ({ id: `w${n}`, text: EN[n] })),
      zones: nums.map((n) => ({ id: `z${n}`, label: String(n), take: [`w${n}`] })),
      hints: ["Say each number out loud.", "Find the word that sounds the same."],
      why: nums.map((n) => `${n} ${EN[n]}`).join(", "),
      unit: u,
      src: src("7"),
    });
  });
  mcq(p, {
    d: 2,
    q: "Listen and tap the number you hear.",
    listen: "eight",
    correct: 8,
    wrong: around(8),
    hints: ["Listen again.", "Eight comes after seven."],
    why: 'You heard "eight": 8.',
    unit: u,
    src: src("5"),
  });
  read(p, {
    d: 2,
    q: "Count out loud!",
    text: "One, two, three, four, five, six, seven, eight, nine, ten.",
    unit: u,
    src: src("5"),
  });
});

// NUMBER_LINE_TO_20 — Patterns on a Number Line to 20 (tr.14–16) and the compare lesson (tr.26)
extend("NBT.NUMBER_LINE_TO_20", "emath-mn1-line", [U(3, 4), U(3, 8)], (p) => {
  const u = U(3, 4);
  mcq(p, {
    d: 1,
    q: "What number is one step after 7?",
    image: NL(0, 10, { marks: [7] }),
    correct: 8,
    wrong: [
      [7, "lap_lai_tong"],
      [9, "dem_thua_1"],
    ],
    model: true,
    hints: ["Find 7 on the line.", "Take one step to the right."],
    why: "One step after 7 is 8.",
    unit: u,
    src: src("14"),
  });
  [
    [10, 16, 20, 1, "15"],
    [3, 8, 13, 2, "16"],
    [7, 12, 17, 2, "16"],
  ].forEach(([from, shown, to, d, pg], i) => {
    const next = Array.from({ length: to - shown }, (_, k) => shown + k + 1);
    const skip = next.map((_, k) => shown - 8 + 2 * k).filter((x) => x >= 0);
    const back = next.map((_, k) => shown - 1 - k).filter((x) => x >= 0);
    mcq(p, {
      d,
      q: "Which numbers come next?",
      image: NL(from, to, {
        labels: Array.from({ length: shown - from + 1 }, (_, k) => from + k),
        hidden: next,
      }),
      correct: next.join(", "),
      wrong: [
        [skip.join(", "), "sai_quy_luat_dem"],
        [back.join(", "), "sai_quy_luat_dem"],
      ],
      targets: "sai_quy_luat_dem",
      model: i === 0,
      hints: ["The numbers grow by one.", `After ${shown} comes ${shown + 1}.`],
      why: `Next come ${next.join(", ")}.`,
      unit: u,
      src: src(pg),
    });
  });
  [
    [6, 13, [6, 13], 9, 1, "15"],
    [8, 15, [8, 12, 15], 11, 2, "16"],
    [11, 18, [11, 15, 18], 14, 3, "16"],
  ].forEach(([from, to, labels, hide, d, pg]) => {
    mcq(p, {
      d,
      q: "Which number is missing?",
      image: NL(from, to, { labels, hidden: [hide] }),
      correct: hide,
      wrong: around(hide),
      hints: ["Count along the marks.", `Start at ${from}.`],
      why: `The missing number is ${hide}.`,
      unit: u,
      src: src(pg),
    });
  });
  drag(p, {
    d: 2,
    q: "Fill in the missing numbers.",
    image: NL(10, 16, { hidden: [12, 14] }),
    items: [
      { id: "n12", text: 12 },
      { id: "n14", text: 14 },
      { id: "n16", text: 16, tag: "sai_quy_luat_dem" },
    ],
    zones: [
      { id: "a", label: "11 ○ 13", take: ["n12"] },
      { id: "b", label: "13 ○ 15", take: ["n14"] },
    ],
    hints: ["Small to big, left to right.", "Count by ones."],
    why: "11, 12, 13, 14, 15.",
    unit: u,
    src: src("15"),
  });
  mcq(p, {
    d: 2,
    q: "Which number is greater?",
    image: NL(10, 20, { marks: [13, 17] }),
    correct: 17,
    wrong: [[13, "so_sanh_nguoc"]],
    hints: ["The number to the right is greater.", "Which number sits further right?"],
    why: "17 is greater than 13.",
    unit: U(3, 8),
    src: src("26"),
  });
  mcq(p, {
    d: 3,
    q: "Listen and tap the number.",
    listen: "one step after fifteen",
    correct: 16,
    wrong: [
      [15, "lap_lai_tong"],
      [17, "dem_thua_1"],
    ],
    hints: ["Start at 15.", "One step to the right."],
    why: "One step after 15 is 16.",
    unit: u,
    src: src("14"),
  });
  read(p, {
    d: 1,
    q: "Read the rule out loud!",
    text: "Fill in the numbers from small to big, left to right.",
    unit: u,
    src: src("14"),
  });
  read(p, {
    d: 2,
    q: "Say the rule!",
    text: "The number to the right is greater.",
    unit: U(3, 8),
    src: src("26"),
  });
});

// ADD_WITHIN_10 — Relate Counting to Addition (tr.37–39)
extend("OA.ADD_WITHIN_10", "emath-mn1-add", [U(4, 1)], (p) => {
  const u = U(4, 1);
  mcq(p, {
    d: 1,
    q: "What is 8 + 2?",
    correct: 10,
    wrong: [...around(10), [6, "nham_cong_tru"]],
    hints: ["Start at 8.", "Count on 2: 9, 10."],
    why: "8 + 2 = 10.",
    unit: u,
    src: src("37"),
  });
  [
    ["🐸", "con ếch", "frogs", 5, 3, "37", 1],
    ["🐦", "con chim", "birds", 3, 3, "38", 1],
    ["🧢", "cái mũ", "caps", 5, 3, "38", 1],
    ["🪁", "con diều", "kites", 2, 4, "38", 2],
    ["🐄", "con bò", "cows", 7, 2, "39", 2],
    ["🐴", "con ngựa", "horses", 3, 3, "39", 2],
  ].forEach(([emoji, vi, en, a, b, pg, d], i) => {
    mcq(p, {
      d,
      q: `${a} ${en} and ${b} more ${en}. How many in all?`,
      image: img(emoji, vi, en, a + b),
      correct: a + b,
      wrong: [...around(a + b), ...(a !== b ? [[Math.abs(a - b), "nham_cong_tru"]] : [])],
      targets: i === 0 ? "dem_thieu_1" : null,
      model: i < 2,
      hints: ["You can count them all.", `Or add: ${a} + ${b}.`],
      why: `${a} + ${b} = ${a + b} ${en}.`,
      unit: u,
      src: src(pg),
    });
  });
  mcq(p, {
    d: 3,
    q: "What is 6 + 5?",
    correct: 11,
    wrong: [...around(11), [1, "nham_cong_tru"]],
    skills: ["EMATH.OA.ADD_WITHIN_10", "EMATH.OA.ADD_WITHIN_20"],
    hints: ["Start at 6.", "Count on 5 more."],
    why: "6 + 5 = 11.",
    unit: u,
    src: src("39"),
  });
  tap(p, {
    d: 1,
    q: "5 frogs and 3 frogs. Tap to count them all.",
    emoji: "🐸",
    vi: "con ếch",
    en: "frogs",
    n: 8,
    hints: ["Count every frog.", "Five, six, seven…"],
    why: "5 + 3 = 8 frogs.",
    unit: u,
    src: src("37"),
  });
  drag(p, {
    d: 2,
    q: "Match each addition to its sum.",
    items: [
      { id: "s8", text: 8 },
      { id: "s9", text: 9 },
      { id: "s6", text: 6 },
    ],
    zones: [
      { id: "a", label: "5 + 3", take: ["s8"] },
      { id: "b", label: "7 + 2", take: ["s9"] },
      { id: "c", label: "2 + 4", take: ["s6"] },
    ],
    hints: ["Add the two addends.", "Count on from the bigger one."],
    why: "5 + 3 = 8, 7 + 2 = 9, 2 + 4 = 6.",
    unit: u,
    src: src("38"),
  });
  mcq(p, {
    d: 2,
    q: "Listen and tap the sum.",
    listen: "seven plus two",
    correct: 9,
    wrong: [...around(9), [5, "nham_cong_tru"]],
    hints: ["Start at seven.", "Count on two."],
    why: "7 + 2 = 9.",
    unit: u,
    src: src("39"),
  });
  read(p, {
    d: 2,
    q: "Read the big idea!",
    text: "One way to find a sum is to add the addends.",
    unit: u,
    src: src("37"),
  });
});

// NUMBER_BONDS_10 — Ways to make 10 (tr.40–42)
extend("OA.NUMBER_BONDS_10", "emath-mn1-bonds", [U(4, 2)], (p) => {
  const u = U(4, 2);
  mcq(p, {
    d: 1,
    q: "What number goes with 6 to make 10?",
    image: TF(6),
    correct: 4,
    wrong: [...around(4), [16, "nham_cong_tru"]],
    model: true,
    hints: ["Count the empty boxes.", "6 and how many make 10?"],
    why: "6 and 4 make 10.",
    unit: u,
    src: src("40"),
  });
  [
    [5, 1],
    [1, 1],
    [8, 2],
    [7, 2],
    [2, 3],
  ].forEach(([n, d], i) => {
    mcq(p, {
      d,
      q: "How many more to make 10?",
      image: TF(n),
      correct: 10 - n,
      wrong: [...around(10 - n, 0, 10), [10, "lap_lai_tong"]],
      targets: i === 0 ? "lap_lai_tong" : null,
      hints: ["Count the empty boxes.", `${n} and ? make 10.`],
      why: `${n} + ${10 - n} = 10.`,
      unit: u,
      src: src("41"),
    });
  });
  mcq(p, {
    d: 2,
    q: "How many more to make 10?",
    image: TF(10),
    correct: 0,
    wrong: [
      [10, "lap_lai_tong"],
      [1, "dem_thua_1"],
    ],
    targets: "lap_lai_tong",
    hints: ["Is there an empty box?", "The frame is already full."],
    why: "10 + 0 = 10.",
    unit: u,
    src: src("41"),
  });
  dots(p, {
    d: 2,
    q: "Fill the frame. Drag the dots you need.",
    frames: 1,
    printed: [{ count: 4, tone: "dark" }],
    need: 6,
    spare: 2,
    tone: "light",
    model: true,
    hints: ["Count the empty boxes.", "4 and 6 make 10."],
    why: "4 + 6 = 10.",
    unit: u,
    src: src("41"),
  });
  [
    [[0, 1, 2], 2],
    [[3, 4, 5], 3],
  ].forEach(([ks, d]) => {
    drag(p, {
      d,
      q: "Rainbow to 10: match the partners.",
      items: ks.map((k) => ({ id: `p${10 - k}`, text: 10 - k })),
      zones: ks.map((k) => ({ id: `z${k}`, label: `${k} + ○`, take: [`p${10 - k}`] })),
      hints: ["Each pair makes 10.", "Count on to 10."],
      why: ks.map((k) => `${k} + ${10 - k}`).join(", "),
      unit: u,
      src: src("42"),
    });
  });
  mcq(p, {
    d: 3,
    q: "What is the missing part?",
    image: NB(10, 7, null),
    correct: 3,
    wrong: [...around(3), [17, "nham_cong_tru"]],
    hints: ["The parts make the whole: 10.", "7 and what make 10?"],
    why: "7 and 3 make 10.",
    unit: u,
    src: src("40"),
  });
  mcq(p, {
    d: 3,
    q: "Listen and tap the partner.",
    listen: "three and what make ten?",
    correct: 7,
    wrong: [...around(7), [3, "lap_lai_tong"]],
    hints: ["Count on from three to ten.", "Use your fingers."],
    why: "3 and 7 make 10.",
    unit: u,
    src: src("42"),
  });
  read(p, {
    d: 1,
    q: "Say the rainbow!",
    text: "Six and four make ten.",
    unit: u,
    src: src("42"),
  });
});

// COUNT_ON — Count On to Add Using a Number Line (Lesson 4-2, tr.43–45)
extend("OA.COUNT_ON", "emath-mn1-counton", [U(4, 3)], (p) => {
  const u = U(4, 3);
  mcq(p, {
    d: 1,
    q: "Start at 6. Count on 3. What is 6 + 3?",
    image: NL(0, 10, { marks: [6] }),
    correct: 9,
    wrong: [[7], [8, "dem_thieu_1"], [10, "dem_thua_1"]],
    targets: "dem_thua_1",
    model: true,
    hints: ["Do not count the 6.", "Say the next numbers, one jump at a time."],
    why: "From 6, three jumps land on 9.",
    unit: u,
    src: src("44"),
  });
  [
    [5, 2, 0, 10, 1, "44"],
    [9, 3, 0, 20, 1, "43"],
    [8, 6, 0, 20, 2, "44"],
    [8, 1, 0, 10, 2, "45"],
    [7, 5, 0, 20, 3, "45"],
    [6, 1, 0, 10, 3, "45"],
  ].forEach(([a, b, from, to, d, pg], i) => {
    mcq(p, {
      d,
      q: rotate(
        [`What is ${a} + ${b}?`, `${a} + ${b} = ? Count on.`, `Jump on the line. ${a} + ${b} = ?`],
        i,
      ),
      image: NL(from, to, {
        labels: to > 10 ? [0, 5, 10, 15, 20] : undefined,
        hops: { start: a, count: b },
      }),
      correct: a + b,
      wrong: [...around(a + b), ...(a - b > 0 ? [[a - b, "nham_cong_tru"]] : [])],
      targets: i === 1 ? "dem_thua_1" : null,
      model: i === 1,
      hints: [`Start at ${a}.`, `Count ${b} jumps.`],
      why: `${a} + ${b} = ${a + b}.`,
      unit: u,
      src: src(pg),
    });
  });
  mcq(p, {
    d: 2,
    q: "Which expression do the jumps show?",
    image: NL(0, 20, { labels: [0, 5, 10, 15, 20], hops: { start: 9, count: 4 } }),
    correct: "9 + 4",
    wrong: [["4 + 4"], ["9 + 9", "lap_lai_tong"], ["9 + 13", "lap_lai_tong"]],
    hints: ["Where do the jumps start?", "How many jumps?"],
    why: "Start at 9 and jump 4: 9 + 4.",
    unit: u,
    src: src("44"),
  });
  mcq(p, {
    d: 2,
    q: "Cory reads 7 pages, then 3 more. How many pages in all?",
    image: img("📚", "sách", "books"),
    correct: 10,
    wrong: [...around(10), [4, "nham_cong_tru"]],
    hints: ["Start at 7.", "Count on 3."],
    why: "7 + 3 = 10 pages.",
    unit: u,
    src: src("45"),
  });
  drag(p, {
    d: 3,
    q: "Count on from 9 by 3. Drag the numbers you say.",
    items: [
      { id: "n10", text: 10 },
      { id: "n11", text: 11 },
      { id: "n12", text: 12 },
      { id: "n9", text: 9, tag: "dem_thua_1" },
    ],
    zones: [
      { id: "j1", label: "Jump 1", take: ["n10"] },
      { id: "j2", label: "Jump 2", take: ["n11"] },
      { id: "j3", label: "Jump 3", take: ["n12"] },
    ],
    targets: "dem_thua_1",
    hints: ["Do not say 9 again.", "The first jump lands on 10."],
    why: "9… 10, 11, 12.",
    unit: u,
    src: src("43"),
  });
  mcq(p, {
    d: 3,
    q: "Listen, then tap where you stop.",
    listen: "Start at eleven. Count on two.",
    correct: 13,
    wrong: around(13),
    hints: ["Say eleven in your head.", "Then twelve, thirteen."],
    why: "11 + 2 = 13.",
    unit: u,
    src: src("44"),
  });
  read(p, {
    d: 2,
    q: "Read the tip!",
    text: "Counting on is quicker when you start with the greater addend.",
    unit: u,
    src: src("43"),
  });
});

// DOUBLES — Lesson 4-3 (tr.46–48)
extend("OA.DOUBLES", "emath-mn1-doubles", [U(4, 4)], (p) => {
  const u = U(4, 4);
  mcq(p, {
    d: 1,
    q: "What is 7 + 7?",
    correct: 14,
    wrong: around(14),
    hints: ["7 + 7 is two weeks of days.", "Count on 7 from 7."],
    why: "7 + 7 = 14.",
    unit: u,
    src: src("46"),
  });
  mcq(p, {
    d: 1,
    q: "Which doubles fact matches the cards?",
    image: DC(2, 2),
    correct: "2 + 2 = 4",
    wrong: [
      ["2 + 2 = 5", "nho_sai_doubles"],
      ["3 + 3 = 5", "nho_sai_doubles"],
    ],
    targets: "nho_sai_doubles",
    model: true,
    hints: ["Count the dots on one card.", "Then count them all."],
    why: "2 + 2 = 4.",
    unit: u,
    src: src("47"),
  });
  mcq(p, {
    d: 1,
    q: "What is the sum of 5 + 5?",
    image: DC(5, 5),
    correct: 10,
    wrong: [[11, "dem_thua_1"], [9, "dem_thieu_1"], [8]],
    hints: ["Two hands have 5 + 5 fingers.", "Count them all."],
    why: "5 + 5 = 10.",
    unit: u,
    src: src("47"),
  });
  mcq(p, {
    d: 2,
    q: "A box has 8 crackers. How many are in 2 boxes?",
    image: img("🍪", "bánh quy", "crackers", 8),
    correct: 16,
    wrong: [[8, "lap_lai_tong"], ...around(16)],
    targets: "lap_lai_tong",
    hints: ["Two boxes: 8 + 8.", "Double 8."],
    why: "8 + 8 = 16 crackers.",
    unit: u,
    src: src("47"),
  });
  mcq(p, {
    d: 2,
    q: "Which doubles fact matches the cards?",
    image: DC(8, 8),
    correct: "8 + 8 = 16",
    wrong: [["3 + 3 = 5", "nho_sai_doubles"], ["4 + 4 = 8"], ["5 + 5 = 9", "nho_sai_doubles"]],
    targets: "nho_sai_doubles",
    model: true,
    hints: ["How many dots on one card?", "Check that the sum is right."],
    why: "Each card has 8 dots: 8 + 8 = 16.",
    unit: u,
    src: src("47"),
  });
  [
    ["A spider has 4 + 4 legs. How many legs?", "🕷️", "con nhện", "spider", 4, 2],
    ["An egg box has 6 + 6 eggs. How many eggs?", "🥚", "quả trứng", "eggs", 6, 2],
    ["A dog has 2 + 2 legs. How many legs?", "🐶", "con chó", "dog", 2, 3],
    ["Two weeks have 7 + 7 days. How many days?", null, null, null, 7, 4],
  ].forEach(([q, emoji, vi, en, n, d]) => {
    mcq(p, {
      d,
      q,
      ...(emoji ? { image: img(emoji, vi, en) } : {}),
      correct: 2 * n,
      wrong: [[n, "lap_lai_tong"], ...around(2 * n)],
      hints: ["Both addends are the same.", `Double ${n}.`],
      why: `${n} + ${n} = ${2 * n}.`,
      unit: u,
      src: src("46"),
    });
  });
  mcq(p, {
    d: 3,
    q: "Write the doubles fact for the cards.",
    image: DC(6, 6),
    correct: "6 + 6 = 12",
    wrong: [["6 + 6 = 11", "nho_sai_doubles"], ["6 + 5 = 11"]],
    hints: ["Both cards are the same.", "Double 6."],
    why: "6 + 6 = 12.",
    unit: u,
    src: src("48"),
  });
  drag(p, {
    d: 3,
    q: "Match each double to its sum.",
    items: [
      { id: "s14", text: 14 },
      { id: "s4", text: 4 },
      { id: "s12", text: 12 },
      { id: "s13", text: 13, tag: "nho_sai_doubles" },
    ],
    zones: [
      { id: "a", label: "7 + 7", take: ["s14"] },
      { id: "b", label: "2 + 2", take: ["s4"] },
      { id: "c", label: "6 + 6", take: ["s12"] },
    ],
    targets: "nho_sai_doubles",
    hints: ["A doubles sum is always even.", "Double 6 is 12."],
    why: "7 + 7 = 14, 2 + 2 = 4, 6 + 6 = 12.",
    unit: u,
    src: src("48"),
  });
  mcq(p, {
    d: 3,
    q: "Listen and tap the sum.",
    listen: "double nine",
    correct: 18,
    wrong: [...around(18), [9, "lap_lai_tong"]],
    hints: ["Double nine is nine plus nine.", "It is one less than 19."],
    why: "9 + 9 = 18.",
    unit: u,
    src: src("48"),
  });
  read(p, {
    d: 2,
    q: "Read the big idea!",
    text: "When you use doubles, the two addends are the same.",
    unit: u,
    src: src("46"),
  });
});

// MAKE_TEN — Make a 10 to Add (Lesson 4-5, tr.49–51)
extend("OA.MAKE_TEN", "emath-mn1-maketen", [U(4, 5)], (p) => {
  const u = U(4, 5);
  mcq(p, {
    d: 1,
    q: "What number makes 10 with 8?",
    image: TF(8),
    correct: 2,
    wrong: [...around(2), [8, "lap_lai_tong"]],
    model: true,
    hints: ["Count the empty boxes.", "8 and ? make 10."],
    why: "8 + 2 = 10.",
    unit: u,
    src: src("49"),
  });
  [
    [7, 5, "49", 1, true],
    [6, 8, "50", 1, false],
    [9, 3, "50", 2, false],
    [6, 5, "51", 2, false],
    [7, 6, "51", 3, false],
  ].forEach(([a, b, pg, d, model], i) => {
    mcq(p, {
      d,
      q: rotate([`What is ${a} + ${b}?`, `Make a 10. What is ${a} + ${b}?`], i),
      image: TF(a, b, 2),
      correct: a + b,
      // the opposite operation only reads as a mistake when it is a whole number
      wrong: [...around(a + b), ...(a > b ? [[a - b, "nham_cong_tru"]] : [])],
      targets: i === 0 ? "dem_thieu_1" : null,
      model,
      hints: [`Fill the first frame: ${a} and ${10 - a}.`, `Then 10 and ${a + b - 10}.`],
      why: `${a} + ${b} = 10 + ${a + b - 10} = ${a + b}.`,
      unit: u,
      src: src(pg),
    });
  });
  mcq(p, {
    d: 1,
    q: "Split 5 into 3 and 2. What is 7 + 5?",
    image: NB(5, 3, 2),
    correct: 12,
    wrong: [...around(12), [2, "nham_cong_tru"]],
    model: true,
    hints: ["7 + 3 = 10.", "10 + 2 = 12."],
    why: "7 + 5 = 7 + 3 + 2 = 12.",
    unit: u,
    src: src("49"),
  });
  mcq(p, {
    d: 2,
    q: "Split 8 into 1 and 7. What is 9 + 8?",
    image: NB(8, 1, 7),
    correct: 17,
    wrong: [[19], [18, "dem_thua_1"], [16, "dem_thieu_1"]],
    targets: "dem_thua_1",
    hints: ["9 + 1 = 10.", "10 + 7 = ?"],
    why: "9 + 8 = 9 + 1 + 7 = 17.",
    unit: u,
    src: src("50"),
  });
  [
    [9, 6, 1, 5, 3],
    [9, 4, 1, 3, 4],
  ].forEach(([a, b, x, y, d]) => {
    mcq(p, {
      d,
      q: `Split ${b} into ${x} and ${y}. What is ${a} + ${b}?`,
      image: NB(b, x, y),
      correct: a + b,
      wrong: [...around(a + b), [a - b, "nham_cong_tru"]],
      hints: [`${a} + ${x} = 10.`, `10 + ${y} = ?`],
      why: `${a} + ${b} = 10 + ${y} = ${a + b}.`,
      unit: u,
      src: src("51"),
    });
  });
  mcq(p, {
    d: 2,
    q: "Kelly has 8 pencils. Carl has 7. How many in all?",
    image: img("✏️", "bút chì", "pencils", 15),
    correct: 15,
    wrong: [...around(15), [1, "nham_cong_tru"]],
    targets: "nham_cong_tru",
    hints: ["Make a 10: 8 + 2.", "Then 10 + 5."],
    why: "8 + 7 = 8 + 2 + 5 = 15 pencils.",
    unit: u,
    src: src("51"),
  });
  dots(p, {
    d: 2,
    q: "Make a 10: drag light dots to fill the frame.",
    frames: 1,
    printed: [{ count: 7, tone: "dark" }],
    need: 3,
    spare: 2,
    tone: "light",
    model: true,
    hints: ["Count the empty boxes.", "7 and 3 make 10."],
    why: "7 + 3 = 10, and 2 dots are left for the next frame.",
    unit: u,
    src: src("49"),
  });
  mcq(p, {
    d: 4,
    q: "Listen and tap the sum.",
    listen: "eight plus five",
    correct: 13,
    wrong: [...around(13), [3, "nham_cong_tru"]],
    hints: ["Make a 10: eight plus two.", "Then add three more."],
    why: "8 + 5 = 13.",
    unit: u,
    src: src("51"),
  });
  read(p, {
    d: 3,
    q: "Read how to make a 10!",
    text: "Seven plus three is ten. Ten plus two is twelve.",
    unit: u,
    src: src("49"),
  });
});
