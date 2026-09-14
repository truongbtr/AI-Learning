/**
 * Khuôn gói tiếng Anh cho đợt 3 (ESL, ENL, English Science/Maths dạng câu).
 *
 * Ba khuôn, mỗi khuôn giữ đúng một luật "một đáp án":
 *  - `vocabPack`   từ vựng: ô nhiễu luôn là **từ khác trong cùng bộ**, không bao giờ trùng nghĩa;
 *  - `phonicsPack` từ CVC: ô nhiễu đổi nguyên âm / âm đầu / chính tả, và câu "từ nào có âm a ngắn"
 *                  chỉ lấy ô nhiễu từ bộ nguyên âm khác;
 *  - `sentencePack` mẫu câu: mỗi câu hỏi viết tay kèm các ô sai viết tay — máy chỉ xếp chỗ.
 *
 * Câu lệnh ≤ 12 từ (validator), cố gắng ≤ 8 (rubric `docs/10` §6.3).
 */
import { at, choicesOf, img, listenPrompt, mkPack } from "./lib.mjs";

export const LISTEN = [
  "Listen and tap the right one.",
  "{ban} says something. Tap it!",
  "Listen carefully, then choose.",
  "What did you hear? Tap it.",
  "Listen again and pick one.",
  "Tap what you heard.",
];
export const READ = [
  "Read this out loud!",
  "Read it to {ban}.",
  "Your turn to read!",
  "Read slowly and clearly.",
  "Read this line out loud.",
  "Let's read together!",
];
const HINTS_L = [
  ["Listen one more time."],
  ["Say it out loud yourself."],
  ["Close your eyes and listen."],
  ["Listen to the whole thing."],
];
const HINTS_R = [
  ["Read one word at a time."],
  ["Read it in your head first."],
  ["Take a breath, then read."],
  ["Point to each word as you read."],
];
const HINTS_W = [
  ["Say it before you write it."],
  ["Copy it letter by letter."],
  ["Leave a finger space between words."],
  ["Check your letters when you finish."],
];

const pic = ([word, emoji]) => ({ image: img(emoji, null, word) });
const EN_WORDS = (s) => s.replace(/[.?!,]/g, "").split(" ");

function readAndWrite(add, sentences, writes, startD = 2) {
  sentences.forEach((r, i) => {
    const words = EN_WORDS(r);
    add({
      type: "READ_ALOUD",
      difficulty: Math.min(5, startD + (i % 4)),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: r, words },
      answerKey: { words },
      hints: HINTS_R[i % 4],
      explanation: `This says: "${r}"`,
    });
  });
  writes.forEach(([q, sample, criteria], i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 3 + (i % 3),
      prompt: { text: q },
      rubric: {
        criteria: criteria ?? [
          "Viết/vẽ đúng yêu cầu của đề",
          "Chính tả tiếng Anh đúng",
          "Chữ rõ ràng",
        ],
        sampleAnswers: [sample],
      },
      answerKey: null,
      hints: HINTS_W[i % 4],
      explanation: `For example: ${sample}`,
      meta: { estSeconds: 90 },
    });
  });
}

/** Xếp câu bằng thẻ — mỗi từ một thẻ, không từ nào lặp (hai thẻ giống nhau là hai đáp án). */
function buildSentence(add, sentence, i, prompts) {
  const words = EN_WORDS(sentence);
  if (new Set(words.map((w) => w.toLowerCase())).size !== words.length)
    throw new Error(`"${sentence}": từ lặp lại, xếp thẻ sẽ có hai đáp án`);
  const order = words
    .map((w, k) => ({ w, k }))
    .sort((a, b) => ((a.k * 7 + i) % words.length) - ((b.k * 7 + i) % words.length));
  const cards = order.map(({ w, k }) => ({ id: `w${k}`, text: w }));
  add({
    type: "DRAG_DROP",
    difficulty: Math.min(5, 2 + Math.floor(words.length / 2) + (i % 2)),
    prompt: { text: prompts[i % prompts.length] },
    dragItems: cards,
    dropZones: words.map((_, k) => ({
      id: `s${k}`,
      label: String(k + 1),
      accepts: cards.map((c) => c.id),
    })),
    answerKey: Object.fromEntries(words.map((_, k) => [`s${k}`, [`w${k}`]])),
    hints: ["Find the word with a capital letter first.", "Say the sentence, then build it."],
    explanation: `The sentence is: "${sentence}"`,
    meta: { estSeconds: 50 },
  });
}
const BUILD = [
  "Put the words in order.",
  "Build the sentence.",
  "Drag the words to make a sentence.",
  "Help {ban} fix the sentence.",
  "Make a sentence with these words.",
  "Order the words, then read it.",
];

// ═══════════════════════════════════════════════════════════════════════════ từ vựng ═══════
/**
 * cfg: { dir, code, subject, prefix, src, note, noun, words: [[word, emoji]], groups?: [[label,
 * [word...]], [label, [word...]]], counts?: [[plural, emoji, n]], sentences, writes }
 */
export function vocabPack(cfg) {
  const { words, noun } = cfg;
  const P = mkPack({ ...cfg, language: "en" });
  const add = P.add;
  const n = words.length;

  words.slice(0, 12).forEach(([w, emoji], i) => {
    const { choices, answerKey } = choicesOf(
      { text: w },
      [{ text: at(words, i + 1)[0] }, { text: at(words, i + Math.ceil(n / 2))[0] }],
      i,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      scaffold: i < 6 ? "model" : "none",
      prompt: {
        text: [
          "What is this?",
          `Name this ${noun}.`,
          "Tap the right word.",
          "What can you see?",
          "Which word matches?",
          "Pick the word for the picture.",
        ][i % 6],
        image: img(emoji, null, w, 1),
      },
      choices,
      answerKey,
      hints: ["Say the word out loud.", `It is a kind of ${noun}.`],
      explanation: `The picture shows: ${w}.`,
      meta: { estSeconds: 20 },
    });
  });
  words.slice(0, 6).forEach((m, i) => {
    const { choices, answerKey } = choicesOf(
      pic(m),
      [pic(at(words, i + 2)), pic(at(words, i + 3 + Math.floor(n / 3)))],
      i + 1,
    );
    add({
      type: "MCQ",
      difficulty: 2 + (i % 4),
      prompt: {
        text: [`Find: ${m[0]}.`, `Tap the picture: ${m[0]}.`, `Which picture is "${m[0]}"?`][i % 3],
      },
      choices,
      answerKey,
      hints: ["Read the word, then look at each picture."],
      explanation: `The picture of "${m[0]}" is ${m[1]}.`,
      meta: { estSeconds: 20 },
    });
  });
  words.slice(Math.max(0, n - 8)).forEach((m, i) => {
    const { choices, answerKey } = choicesOf(
      pic(m),
      [pic(at(words, n - 8 + i + 1)), pic(at(words, n - 8 + i + 4))],
      i,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 1 + (i % 5),
      scaffold: i < 2 ? "model" : "none",
      prompt: { text: listenPrompt(LISTEN, m[0], i) },
      listenTarget: { text: m[0] },
      choices,
      answerKey,
      hints: HINTS_L[i % 4],
      explanation: `You heard "${m[0]}".`,
      meta: { estSeconds: 20 },
    });
  });
  if (cfg.groups) {
    const [[la, A], [lb, B]] = cfg.groups;
    const e = (w) => words.find((x) => x[0] === w)?.[1] ?? "❓";
    for (let i = 0; i < 5; i++) {
      const cards = [
        { id: "a1", text: at(A, i), image: img(e(at(A, i)), null, at(A, i)) },
        { id: "b1", text: at(B, i), image: img(e(at(B, i)), null, at(B, i)) },
        { id: "a2", text: at(A, i + 1), image: img(e(at(A, i + 1)), null, at(A, i + 1)) },
        { id: "b2", text: at(B, i + 2), image: img(e(at(B, i + 2)), null, at(B, i + 2)) },
      ];
      add({
        type: "DRAG_DROP",
        difficulty: 2 + (i % 4),
        prompt: {
          text: [
            "Sort them into two baskets.",
            "Drag each one to its basket.",
            `${la} or ${lb}? Sort them.`,
            "Help {ban} sort these.",
            "Where does each one go?",
          ][i % 5],
        },
        dragItems: cards,
        dropZones: [
          { id: "za", label: la, accepts: ["a1", "b1", "a2", "b2"] },
          { id: "zb", label: lb, accepts: ["a1", "b1", "a2", "b2"] },
        ],
        answerKey: { za: ["a1", "a2"], zb: ["b1", "b2"] },
        hints: [`Think: is it ${la.toLowerCase()} or ${lb.toLowerCase()}?`],
        explanation: `${at(A, i)} and ${at(A, i + 1)} go in "${la}".`,
        meta: { estSeconds: 45 },
      });
    }
  } else {
    for (let i = 0; i < 5; i++) {
      const a = at(words, i * 2);
      const b = at(words, i * 2 + 5);
      add({
        type: "DRAG_DROP",
        difficulty: 2 + (i % 4),
        prompt: {
          text: [
            "Drag each word under its picture.",
            "Match the words and pictures.",
            "Put each word on its picture.",
          ][i % 3],
        },
        dragItems: [
          { id: "w1", text: b[0] },
          { id: "w2", text: a[0] },
        ],
        dropZones: [
          { id: "p1", label: "Picture 1", image: img(a[1], null, a[0]), accepts: ["w1", "w2"] },
          { id: "p2", label: "Picture 2", image: img(b[1], null, b[0]), accepts: ["w1", "w2"] },
        ],
        answerKey: { p1: ["w2"], p2: ["w1"] },
        hints: ["Read both words, then look at the pictures."],
        explanation: `${a[1]} is "${a[0]}" and ${b[1]} is "${b[0]}".`,
        meta: { estSeconds: 35 },
      });
    }
  }
  (cfg.counts ?? []).forEach(([plural, emoji, k], i) => {
    add({
      type: "COUNT_TAP",
      difficulty: 1 + (i % 4),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      prompt: {
        text: [
          `How many ${plural}? Tap each one.`,
          `Count the ${plural}.`,
          `Tap and count the ${plural}.`,
          `How many ${plural} can you see?`,
        ][i % 4],
      },
      countTarget: {
        objects: img(emoji, null, plural, k),
        correctCount: k,
        layout: i % 2 === 0 ? "grid" : "line",
      },
      answerKey: k,
      hints: ["Say the number as you tap."],
      explanation: `There are ${k} ${plural}.`,
      meta: { estSeconds: 30 },
    });
  });
  readAndWrite(add, cfg.sentences, cfg.writes);
  P.save();
}

// ═══════════════════════════════════════════════════════════════════════ ngữ âm CVC ═════════
/**
 * cfg: { dir, code, subject, prefix, src, note, vowel, words: [[word, emoji, vowelSwap, onsetSwap,
 * misspell]], others: [word...] (từ CVC nguyên âm khác, không chứa âm đang học), rows, writes }
 */
export function phonicsPack(cfg) {
  const { words, vowel, others } = cfg;
  const P = mkPack({ ...cfg, language: "en" });
  const add = P.add;

  words.slice(0, 10).forEach(([w, emoji, vs, os, ms], i) => {
    const wrongs = [
      vs && { text: vs, errorTag: "nham_nguyen_am_ngan" },
      i % 2 === 0 && ms
        ? { text: ms, errorTag: "sai_chinh_ta_tu" }
        : os && { text: os, errorTag: "nham_am_dau" },
    ].filter(Boolean);
    const { choices, answerKey } = choicesOf({ text: w }, wrongs, i);
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      scaffold: i < 6 ? "model" : "none",
      targetsError: wrongs[0]?.errorTag ?? null,
      prompt: {
        text: emoji
          ? [
              "Which word matches the picture?",
              "Tap the word for the picture.",
              "What is this? Pick the word.",
            ][i % 3]
          : ["Which one is a real word?", "Tap the word you can read.", "Find the right spelling."][
              i % 3
            ],
        ...(emoji ? { image: img(emoji, null, w, 1) } : {}),
      },
      choices,
      answerKey,
      hints: ["Sound it out: first, middle, last.", `Listen for the short ${vowel} in the middle.`],
      explanation: `The word is "${w}".`,
      meta: { estSeconds: 22 },
    });
  });
  words.slice(0, 8).forEach(([w, , vs, os], i) => {
    const wrongs = [
      vs && { text: vs, errorTag: "nham_nguyen_am_ngan" },
      os && { text: os, errorTag: "nham_am_dau" },
    ].filter(Boolean);
    const { choices, answerKey } = choicesOf({ text: w }, wrongs, i + 1);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 2 + (i % 4),
      targetsError: wrongs[0]?.errorTag ?? null,
      prompt: { text: listenPrompt(LISTEN, w, i) },
      listenTarget: { text: w },
      choices,
      answerKey,
      hints: HINTS_L[i % 4],
      explanation: `You heard "${w}".`,
      meta: { estSeconds: 20 },
    });
  });
  // "Which word has short a?" — ô nhiễu chỉ lấy từ bộ nguyên âm khác nên không thể cũng đúng.
  words.slice(2, 8).forEach(([w], i) => {
    const { choices, answerKey } = choicesOf(
      { text: w },
      [{ text: at(others, i) }, { text: at(others, i + 3) }],
      i + 2,
    );
    add({
      type: "MCQ",
      difficulty: 2 + (i % 4),
      prompt: {
        text: [
          `Which word has the short ${vowel} sound?`,
          `Find the word with short ${vowel}.`,
          `Tap the word with ${vowel} in the middle.`,
        ][i % 3],
      },
      choices,
      answerKey,
      hints: [`Say each word. Which one has ${vowel} in the middle?`],
      explanation: `"${w}" has the short ${vowel} sound.`,
      meta: { estSeconds: 25 },
    });
  });
  words.slice(0, 6).forEach(([w, emoji], i) => {
    const letters = [...w];
    const cards = letters
      .map((l, k) => ({ id: `l${k}`, text: l }))
      .sort((a, b) => ((a.id.charCodeAt(1) * 5 + i) % 3) - ((b.id.charCodeAt(1) * 5 + i) % 3));
    if (new Set(letters).size !== letters.length) return;
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      prompt: {
        text: ["Put the letters in order.", "Build the word.", "Drag the letters to spell it."][
          i % 3
        ],
        ...(emoji ? { image: img(emoji, null, w, 1) } : {}),
      },
      dragItems: cards,
      dropZones: letters.map((_, k) => ({
        id: `z${k}`,
        label: ["First", "Middle", "Last", "Fourth"][k],
        accepts: cards.map((c) => c.id),
      })),
      answerKey: Object.fromEntries(letters.map((_, k) => [`z${k}`, [`l${k}`]])),
      hints: ["Say the word slowly, one sound at a time."],
      explanation: `The word is "${w}".`,
      meta: { estSeconds: 40 },
    });
  });
  readAndWrite(add, cfg.rows, cfg.writes);
  P.save();
}

// ═══════════════════════════════════════════════════════════════════════ mẫu câu ════════════
/**
 * cfg: { dir, code, subject, prefix, src, note, language?,
 *   items:   [{ q, right, wrongs: [[text, tag?]], pic?, d, hint, why }]           → MCQ
 *   listens: [{ say, right, wrongs: [[text, tag?]], d, why }]                     → LISTEN_CHOOSE
 *   builds:  [sentence...]                                                        → DRAG_DROP
 *   sorts?:  [{ q, zones: [labelA, labelB], a: [..], b: [..], d }]                → DRAG_DROP
 *   counts?: [[plural, emoji, n, prompt?]]                                        → COUNT_TAP
 *   reads, writes }
 * Ô lựa chọn là chữ; `pic` là emoji hoặc [emoji, repeat].
 */
export function sentencePack(cfg) {
  const P = mkPack({ language: "en", ...cfg });
  const add = P.add;
  // Ô chữ, hoặc ô tranh khi viết { e: emoji, w: tên }.
  const face = (t) => (typeof t === "object" ? { image: img(t.e, null, t.w) } : { text: t });
  const opt = ([t, tag]) => ({ ...face(t), ...(tag ? { errorTag: tag } : {}) });

  cfg.items.forEach((it, i) => {
    const { choices, answerKey } = choicesOf(face(it.right), it.wrongs.map(opt), i);
    const [emoji, rep] = Array.isArray(it.pic) ? it.pic : [it.pic, 1];
    add({
      type: "MCQ",
      difficulty: it.d ?? 1 + (i % 5),
      scaffold: i < 6 ? "model" : "none",
      targetsError: it.wrongs.find((w) => w[1])?.[1] ?? null,
      prompt: {
        text: it.q,
        ...(emoji ? { image: img(emoji, null, it.picLabel ?? null, rep) } : {}),
      },
      choices,
      answerKey,
      hints: Array.isArray(it.hint) ? it.hint : [it.hint ?? "Read every choice before you tap."],
      explanation: it.why ?? `The answer is: ${it.right.w ?? it.right}`,
    });
  });
  (cfg.listens ?? []).forEach((it, i) => {
    const { choices, answerKey } = choicesOf(face(it.right), it.wrongs.map(opt), i + 1);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: it.d ?? 1 + (i % 5),
      scaffold: i < 2 ? "model" : "none",
      targetsError: it.wrongs.find((w) => w[1])?.[1] ?? null,
      prompt: { text: it.q ?? listenPrompt(cfg.listenPrompts ?? LISTEN, it.say, i) },
      listenTarget: { text: it.say },
      choices,
      answerKey,
      hints: HINTS_L[i % 4],
      explanation: it.why ?? `You heard: "${it.say}"`,
    });
  });
  (cfg.builds ?? []).forEach((s, i) => {
    buildSentence(add, s, i, cfg.buildPrompts ?? BUILD);
  });
  (cfg.sorts ?? []).forEach((s, i) => {
    const cards = [
      ...s.a.map((t, k) => ({ id: `a${k}`, text: t })),
      ...s.b.map((t, k) => ({ id: `b${k}`, text: t })),
    ].sort((x, y) => ((x.id.charCodeAt(1) + i) % 3) - ((y.id.charCodeAt(1) + i) % 3));
    add({
      type: "DRAG_DROP",
      difficulty: s.d ?? 2 + (i % 4),
      prompt: { text: s.q },
      dragItems: cards,
      dropZones: [
        { id: "za", label: s.zones[0], accepts: cards.map((c) => c.id) },
        { id: "zb", label: s.zones[1], accepts: cards.map((c) => c.id) },
      ],
      answerKey: { za: s.a.map((_, k) => `a${k}`), zb: s.b.map((_, k) => `b${k}`) },
      hints: [s.hint ?? "Read each card, then decide."],
      explanation: `${s.a.join(", ")} go in "${s.zones[0]}".`,
      meta: { estSeconds: 45 },
    });
  });
  // Kéo-thả tự do: thẻ (chữ và/hoặc tranh) vào giỏ; thẻ không có trong `key` là thẻ nhiễu nằm lại khay.
  (cfg.places ?? []).forEach((p, i) => {
    // [chữ | null, emoji?, mã lỗi?] — chữ null là thẻ chỉ có tranh (thẻ hình không in tên hình).
    const cards = p.items.map(([t, e, tag], k) => ({
      id: `c${k}`,
      ...(t ? { text: t } : {}),
      ...(e ? { image: img(e, null, t ?? null) } : {}),
      ...(tag ? { errorTag: tag } : {}),
    }));
    add({
      type: "DRAG_DROP",
      difficulty: p.d ?? 2 + (i % 4),
      prompt: { text: p.q },
      dragItems: cards,
      dropZones: p.zones.map(([label, e], z) => ({
        id: `z${z}`,
        label,
        ...(e ? { image: img(e, null, label) } : {}),
        accepts: cards.map((c) => c.id),
      })),
      answerKey: Object.fromEntries(
        p.zones.map((_, z) => [`z${z}`, (p.key[z] ?? []).map((k) => `c${k}`)]),
      ),
      hints: [p.hint ?? "Listen to the whole sentence first."],
      explanation: p.why,
      meta: { estSeconds: 40 },
    });
  });
  (cfg.counts ?? []).forEach(([plural, emoji, k, q], i) => {
    add({
      type: "COUNT_TAP",
      difficulty: 1 + (i % 4),
      prompt: { text: q ?? [`How many ${plural}? Tap each one.`, `Count the ${plural}.`][i % 2] },
      countTarget: {
        objects: img(emoji, null, plural, k),
        correctCount: k,
        layout: i % 2 === 0 ? "grid" : "line",
      },
      answerKey: k,
      hints: ["Say the number as you tap."],
      explanation: `There are ${k} ${plural}.`,
      meta: { estSeconds: 30 },
    });
  });
  readAndWrite(add, cfg.reads ?? [], cfg.writes ?? []);
  P.save();
}
