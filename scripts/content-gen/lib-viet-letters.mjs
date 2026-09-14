/**
 * Bốn gói học vần còn trống của tuần 2–3: âm ô (bài 7), âm ơ (bài 9), âm i–k (bài 11),
 * âm h–l (bài 12). Lớp 1B3 đang ở bài 13–14, nên đây là những âm con vừa học xong.
 *
 * Hai chỗ đợt 1 vấp, gói này tránh bằng cấu trúc dữ liệu chứ không bằng lời nhắc:
 *  - mỗi tiếng có `without` — một tiếng thật **không chứa** âm đang hỏi, để câu "Tiếng nào có
 *    âm ô?" chỉ có một đáp án (lỗi #2 của đợt 1);
 *  - mỗi phương án nhiễu là **tiếng thật**, mang đúng mã lỗi của việc trẻ vừa làm: nhìn nhầm
 *    con chữ gần giống (o/ô/ơ) là `nham_chu_gan_giong`, đọc nhầm âm đầu là `nham_am_dau`,
 *    đọc nhầm vần là `doc_nham_van` (lỗi #8 và #9 của đợt 1).
 *
 * Dùng chung cho `viet-letters.mjs` (bài 7–12) và `viet-letters-2.mjs` (bài 16–24).
 */
import { cap, choicesOf, ex, img, listenPrompt, numberId, writePack } from "./lib.mjs";
import { hasUnit } from "./vn-units.mjs";

const ASK = (a) => [
  `Tiếng nào có ${a}?`,
  `Chọn tiếng có ${a} nhé!`,
  `Ô nào chứa ${a}?`,
  `Đố con: tiếng nào có ${a}?`,
  `Tìm giúp {ban} tiếng có ${a}.`,
  `Trong ba ô, ô nào có ${a}?`,
];
const ASK_PIC = [
  "Tranh vẽ gì? Chọn tiếng đúng nhé!",
  "Chọn tiếng gọi tên bức tranh.",
  "Đố con: tranh này là tiếng nào?",
  "Tiếng nào hợp với bức tranh?",
  "Nhìn tranh rồi chọn tiếng.",
  "Bức tranh này đọc là tiếng nào?",
];
const ASK_HARD = (a) => [
  `Bốn ô trông rất giống nhau. Ô nào có ${a}?`,
  `Nhìn thật kỹ: tiếng nào có ${a}?`,
  `Chỉ một ô có ${a}. Con tìm ra không?`,
  `Đọc thầm bốn tiếng rồi chọn tiếng có ${a}.`,
  `Đố khó nhé: ô nào có ${a}?`,
  `Bốn tiếng này khác nhau một chút thôi. Ô nào có ${a}?`,
];
const LISTEN = [
  "Nghe rồi chọn ô đúng nhé!",
  "{ban} đọc một tiếng, con chọn ô đúng.",
  "Nghe kỹ rồi chỉ vào tiếng con vừa nghe.",
  "Con nghe rồi tìm đúng tiếng nhé!",
  "Lắng nghe, tiếng nào vừa vang lên?",
  "Nghe lần nữa rồi chọn ô con nghe thấy.",
];
const SORT = (a) => [
  `Xếp mỗi tiếng vào đúng giỏ: có ${a} hay không có.`,
  `Kéo tiếng có ${a} sang một bên nhé!`,
  `Chia bốn tiếng thành hai giỏ giúp {ban}.`,
  `Giỏ nào đựng tiếng có ${a}?`,
  `Phân loại bốn tiếng theo ${a}.`,
  `Tiếng nào có ${a} thì để riêng ra.`,
];
const PICK_DRAG = [
  "Kéo tiếng đúng vào ô dưới tranh.",
  "Chọn thẻ đúng rồi thả vào ô trống.",
  "Thẻ nào gọi tên bức tranh? Kéo vào nhé!",
  "Kéo giúp {ban} thẻ đúng vào ô.",
  "Đặt thẻ đúng xuống dưới tranh.",
  "Tìm thẻ hợp với tranh rồi thả vào ô.",
];
const READ = [
  "Con đọc to các tiếng này nhé!",
  "Đọc chậm từng tiếng cho {ban} nghe.",
  "Đọc to câu này nhé!",
  "Con đọc cho cả nhà cùng nghe.",
  "Đọc rõ từng tiếng nhé!",
  "Cùng đọc to nào!",
];
const WRITE = [
  "Viết vào vở:",
  "Con chép vào vở:",
  "Viết lại giúp {ban}:",
  "Chép vào vở nhé:",
  "Viết vào vở rồi chụp cho ba mẹ xem:",
  "Con viết các tiếng này vào vở:",
];

const HINT_FIND = (a) => [
  [`Đọc thầm từng ô, ô nào nghe thấy ${a}?`],
  ["Nhìn từng con chữ một từ trái sang phải.", `Chỉ một ô có ${a} thôi.`],
  [`Con nhớ ${a} viết thế nào không?`],
  ["Đánh vần từng ô lên là ra ngay."],
  ["So hai ô giống nhau nhất xem khác chỗ nào."],
  [`Tìm con chữ của ${a} trong từng ô nhé!`],
];
const HINT_LISTEN = [
  ["Nghe lại một lần nữa nhé!"],
  ["Các ô viết gần giống nhau, nghe kỹ phần giữa."],
  ["Nhắm mắt nghe rồi hãy chọn."],
  ["Đọc thầm từng ô rồi so với tiếng vừa nghe."],
  ["Chú ý âm đầu của tiếng con nghe."],
];
const HINT_SORT = (a) => [
  [`Đọc to từng thẻ, thẻ nào có ${a} thì xếp riêng.`],
  ["Xếp hai thẻ dễ trước, còn lại xếp sau."],
  ["Nhìn từng con chữ trên thẻ nhé!"],
  ["Đánh vần thẻ rồi mới kéo."],
];
const HINT_READ = [
  ["Đọc chậm từng tiếng một."],
  ["Đọc thầm một lần rồi mới đọc to."],
  ["Đánh vần tiếng nào khó rồi đọc trơn lại."],
  ["Ngắt rõ giữa các tiếng."],
];
const HINT_WRITE = [
  ["Viết chậm, đúng độ cao từng con chữ."],
  ["Nhớ đánh dấu thanh sau khi viết xong con chữ."],
  ["Nhìn mẫu rồi viết theo nhé!"],
  ["Viết xong đọc lại xem có đúng tiếng không."],
];

/** Một phương án nhiễu kèm mã lỗi — null khi không có tiếng thật nào hợp. */
const tagged = (text, errorTag) => (text ? { text, errorTag } : null);

/**
 * Một gói "âm X".
 *
 * `words[i]` = { w, letter, without, near, onset, rime, pic, gloss }
 *  - `w`       tiếng có âm đang dạy
 *  - `without` tiếng thật **không** chứa âm đó — nhờ nó câu hỏi mới có đúng một đáp án
 *  - `near`    tiếng chỉ khác `w` một con chữ gần giống (o/ô/ơ, e/ê, d/đ) → nham_chu_gan_giong
 *  - `onset`   tiếng cùng vần khác âm đầu → nham_am_dau
 *  - `rime`    tiếng cùng âm đầu khác vần → doc_nham_van
 */
export function letterPack(cfg) {
  const { code, prefix, letterLabel, lessonRefs, note, src, words, phrases, writeSets } = cfg;
  const unit = cfg.lessonUnitCode ?? null;
  /** Mã lỗi của ô "gần giống": mặc định là nhìn nhầm con chữ, gói m/n hay ch/tr khai mã riêng. */
  const nt = (word) => word.nearTag ?? "nham_chu_gan_giong";
  const list = [];
  let n = 0;
  const add = (e) => {
    n += 1;
    list.push(ex({ id: numberId(prefix, n), language: "vi", skillCodes: [code], ...e }));
  };
  const meta = (d) => ({ estSeconds: d, lessonUnitCode: unit, sourceRef: src });
  const label = (word) => letterLabel(word.letter);

  const withPic = words.filter((w) => w.pic);
  const withNear = words.filter((w) => w.near);
  const withOnset = words.filter((w) => w.onset);

  /**
   * Ô nhiễu có mã lỗi **mà không chứa âm đang hỏi** — chỉ những ô này dùng được cho câu "Tiếng nào
   * có âm X?". Trong gói âm h, `hò` giống `hồ` nhất nhưng cũng có âm h: đưa nó vào thì câu hỏi có
   * hai đáp án (31 bài của đợt 2 đã mắc đúng lỗi này, `audit-has-letter.mjs`).
   */
  const lackingTagged = (word) =>
    [
      tagged(word.near, nt(word)),
      tagged(word.onset, "nham_am_dau"),
      tagged(word.rime, "doc_nham_van"),
    ].filter((c) => c && !hasUnit(c.text, word.letter));
  /** Tiếng `without` của các từ khác — ô nhiễu không mã, chắc chắn không chứa âm đang hỏi. */
  const fillers = (word) =>
    words
      .filter((o) => o !== word)
      .map((o) => o.without)
      .filter((t) => t && t !== word.without && !hasUnit(t, word.letter));
  for (const w of words)
    if (!hasUnit(w.w, w.letter) || (w.without && hasUnit(w.without, w.letter)))
      console.warn(`  ⚠ ${code}: dữ liệu của "${w.w}" không khớp âm ${w.letter}`);
  const askable = words.filter((w) => lackingTagged(w).length > 0);

  // ① "Tiếng nào có âm ô?" — một ô đúng, một ô nhiễu có mã lỗi, một ô hoàn toàn khác.
  askable.slice(0, 10).forEach((word, i) => {
    const tag = lackingTagged(word).find((c) => c.text !== word.without);
    const wrongs = [tag ?? lackingTagged(word)[0], { text: word.without }].filter(
      (c, k, all) => all.findIndex((x) => x.text === c.text) === k,
    );
    const { choices, answerKey } = choicesOf({ text: word.w }, wrongs, i);
    add({
      type: "MCQ",
      difficulty: 1 + (i % 3),
      targetsError: choices.find((c) => c.errorTag)?.errorTag ?? null,
      scaffold: i < 4 ? "model" : "none",
      prompt: { text: ASK(label(word))[i % 6] },
      choices,
      answerKey,
      hints: HINT_FIND(label(word))[i % 6],
      explanation: `Tiếng "${word.w}" có ${label(word)}.`,
      meta: meta(20),
    });
  });

  // ② Nhìn tranh chọn tiếng.
  withPic.forEach((word, i) => {
    const wrongs = [
      tagged(word.near, nt(word)) ?? tagged(word.rime, "doc_nham_van"),
      tagged(word.onset, "nham_am_dau") ?? { text: word.without },
    ].filter(Boolean);
    const { choices, answerKey } = choicesOf({ text: word.w }, wrongs, i + 1);
    add({
      type: "MCQ",
      difficulty: 2 + (i % 3),
      assetTheme: word.theme ?? "neutral",
      targetsError: choices.find((c) => c.errorTag)?.errorTag ?? null,
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: ASK_PIC[i % 6], image: img(word.pic, word.gloss, null, 1) },
      choices,
      answerKey,
      hints: [`Tranh vẽ ${word.gloss}.`, `Tiếng gọi ${word.gloss} có ${label(word)}.`],
      explanation: `${cap(word.gloss)} đọc là "${word.w}".`,
      meta: meta(25),
    });
  });

  // ③ Bốn ô gần giống nhau — mức khó nhất, đúng cái trẻ hay nhìn lướt rồi chọn bừa.
  [
    ...askable.filter((w) => lackingTagged(w).length >= 2),
    ...askable.filter((w) => lackingTagged(w).length === 1),
  ]
    .slice(0, 4)
    .forEach((word, i) => {
      const seen = new Set([word.w]);
      const wrongs = [];
      for (const c of [...lackingTagged(word), ...fillers(word).map((text) => ({ text }))]) {
        if (seen.has(c.text) || wrongs.length === 3) continue;
        seen.add(c.text);
        wrongs.push(c);
      }
      const { choices, answerKey } = choicesOf({ text: word.w }, wrongs, i + 2);
      add({
        type: "MCQ",
        difficulty: i < 2 ? 4 : 5,
        targetsError: wrongs[0].errorTag,
        prompt: { text: ASK_HARD(label(word))[i % 6] },
        choices,
        answerKey,
        hints: HINT_FIND(label(word))[(i + 3) % 6],
        explanation: `Chỉ "${word.w}" có ${label(word)}.`,
        meta: meta(30),
      });
    });

  // ④ Nghe tiếng, chọn ô — ô nhiễu cùng vần khác âm đầu, đúng lỗi nghe sót âm đầu.
  words.slice(0, 9).forEach((word, i) => {
    const wrongs = [
      tagged(word.onset, "nham_am_dau") ?? tagged(word.near, nt(word)),
      tagged(word.rime, "doc_nham_van") ?? { text: word.without },
    ].filter(Boolean);
    const { choices, answerKey } = choicesOf({ text: word.w }, wrongs, i);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 1 + (i % 5),
      targetsError: choices.find((c) => c.errorTag)?.errorTag ?? null,
      scaffold: i < 2 ? "model" : "none",
      prompt: { text: listenPrompt(LISTEN, word.w, i) },
      listenTarget: { text: word.w },
      choices,
      answerKey,
      hints: HINT_LISTEN[i % 5],
      explanation: `Con vừa nghe tiếng "${word.w}".`,
      meta: meta(20),
    });
  });

  // ⑤ Nghe tiếng *gần giống*, chọn ô — để con thật sự nghe chứ không đoán theo bài đang học.
  withNear.slice(0, 4).forEach((word, i) => {
    const { choices, answerKey } = choicesOf(
      { text: word.near },
      [{ text: word.w, errorTag: nt(word) }, { text: word.without }],
      i + 1,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 3 + (i % 3),
      targetsError: nt(word),
      prompt: { text: listenPrompt(LISTEN, word.near, i + 2) },
      listenTarget: { text: word.near },
      choices,
      answerKey,
      hints: HINT_LISTEN[(i + 1) % 5],
      explanation: `Tiếng con nghe là "${word.near}".`,
      meta: meta(20),
    });
  });

  // ⑥ Xếp bốn thẻ vào hai giỏ.
  for (let i = 0; i < 4; i++) {
    const a = words[i % words.length];
    // Cùng âm với `a`: gói hai âm (i–k, h–l) từng xếp "kẻ" vào giỏ "có âm i".
    const same = words.filter((w) => w !== a && w.letter === a.letter);
    const b = same[(i + 3) % same.length];
    const decoy = lackingTagged(b)[0] ?? { text: b.without };
    const cards = [
      { id: `s${i}a`, text: a.w },
      { id: `s${i}b`, text: a.without },
      { id: `s${i}c`, text: b.w },
      { id: `s${i}d`, text: decoy.text, errorTag: decoy.errorTag },
    ];
    // Giỏ tính theo âm thật của từng thẻ, không suy từ vị trí thẻ.
    const inCo = cards.filter((c) => hasUnit(c.text, a.letter)).map((c) => c.id);
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 3),
      targetsError: decoy.errorTag ?? null,
      prompt: { text: SORT(letterLabel(a.letter))[i % 6] },
      dragItems: cards.map((c) => (c.errorTag ? c : { id: c.id, text: c.text })),
      dropZones: [
        { id: "co", label: `Có ${letterLabel(a.letter)}`, accepts: cards.map((c) => c.id) },
        { id: "khong", label: "Không có", accepts: cards.map((c) => c.id) },
      ],
      answerKey: {
        co: inCo,
        khong: cards.map((c) => c.id).filter((id) => !inCo.includes(id)),
      },
      hints: HINT_SORT(letterLabel(a.letter))[i % 4],
      explanation: `"${a.w}" và "${b.w}" có ${letterLabel(a.letter)}.`,
      meta: meta(40),
    });
  }

  // ⑦ Kéo thẻ đúng vào ô dưới tranh — một ô, nên thẻ đúng không mang mã lỗi (ADR-15).
  withPic.slice(0, 3).forEach((word, i) => {
    const decoys = [
      tagged(word.near, nt(word)) ?? tagged(word.rime, "doc_nham_van"),
      tagged(word.onset, "nham_am_dau") ?? { text: word.without },
    ].filter(Boolean);
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 3),
      assetTheme: word.theme ?? "neutral",
      targetsError: decoys.find((d) => d.errorTag)?.errorTag ?? null,
      prompt: { text: PICK_DRAG[i % 6], image: img(word.pic, word.gloss, null, 1) },
      dragItems: [
        { id: "dung", text: word.w },
        ...decoys.map((d, k) => ({ id: `sai${k}`, text: d.text, errorTag: d.errorTag })),
      ],
      dropZones: [
        { id: "o", label: "Ô trống", accepts: ["dung", ...decoys.map((_, k) => `sai${k}`)] },
      ],
      answerKey: { o: ["dung"] },
      hints: [`Tranh vẽ ${word.gloss}.`, "Đọc to từng thẻ rồi hãy kéo nhé!"],
      explanation: `${cap(word.gloss)} viết là "${word.w}".`,
      meta: meta(35),
    });
  });

  // ⑧ Đọc to.
  phrases.forEach((p, i) => {
    const ws = p.split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: i < 2 ? 2 : 3 + (i % 3),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: p, words: ws },
      answerKey: { words: ws },
      hints: HINT_READ[i % 4],
      explanation: `Câu này đọc là "${p}".`,
      meta: meta(25),
    });
  });

  // ⑨ Viết vào vở.
  writeSets.forEach((set, i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 3 + (i % 3),
      prompt: { text: `${WRITE[i % 6]} ${set.join(", ")}.` },
      rubric: {
        criteria: [
          `Viết đủ ${set.join(" ").split(" ").length} tiếng`,
          "Con chữ đúng nét, đúng độ cao",
          "Dấu thanh đặt đúng chỗ",
        ],
        sampleAnswers: [set.join(" ")],
      },
      answerKey: null,
      hints: HINT_WRITE[i % 4],
      explanation: "Viết xong con đọc lại một lượt nhé!",
      meta: meta(70),
    });
  });

  writePack(`content/exercises/viet/${code.split(".").slice(1).join(".")}.pack.json`, {
    skillCode: code,
    subject: "VIET",
    generatedBy: "claude-code",
    promptVersion: "exercise-gen-v2",
    lessonRefs,
    note,
    exercises: list,
  });

  if (withOnset.length < 4)
    console.warn(`  ⚠ ${code}: chỉ ${withOnset.length} tiếng có âm đầu thay được`);
}

export const W = (w, letter, without, near, onset, rime, pic, gloss, theme) => ({
  w,
  letter,
  without,
  near,
  onset,
  rime,
  pic,
  gloss,
  theme,
});
