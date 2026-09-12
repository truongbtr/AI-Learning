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
 *   node scripts/content-gen/viet-letters.mjs
 */
import { cap, choicesOf, ex, img, listenPrompt, numberId, writePack } from "./lib.mjs";

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
function letterPack(cfg) {
  const { code, prefix, letterLabel, lessonRefs, note, src, words, phrases, writeSets } = cfg;
  const list = [];
  let n = 0;
  const add = (e) => {
    n += 1;
    list.push(ex({ id: numberId(prefix, n), language: "vi", skillCodes: [code], ...e }));
  };
  const meta = (d) => ({ estSeconds: d, lessonUnitCode: null, sourceRef: src });
  const label = (word) => letterLabel(word.letter);

  const withPic = words.filter((w) => w.pic);
  const withNear = words.filter((w) => w.near);
  const withOnset = words.filter((w) => w.onset);

  // ① "Tiếng nào có âm ô?" — một ô đúng, một ô nhìn nhầm con chữ, một ô hoàn toàn khác.
  words.slice(0, 10).forEach((word, i) => {
    const wrongs = [
      tagged(word.near, "nham_chu_gan_giong") ?? tagged(word.onset, "nham_am_dau"),
      { text: word.without },
    ].filter(Boolean);
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
      tagged(word.near, "nham_chu_gan_giong") ?? tagged(word.rime, "doc_nham_van"),
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
  withNear
    .filter((w) => w.onset && w.rime)
    .slice(0, 4)
    .forEach((word, i) => {
      const { choices, answerKey } = choicesOf(
        { text: word.w },
        [
          { text: word.near, errorTag: "nham_chu_gan_giong" },
          { text: word.onset, errorTag: "nham_am_dau" },
          { text: word.rime, errorTag: "doc_nham_van" },
        ],
        i + 2,
      );
      add({
        type: "MCQ",
        difficulty: i < 2 ? 4 : 5,
        targetsError: "nham_chu_gan_giong",
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
      tagged(word.onset, "nham_am_dau") ?? tagged(word.near, "nham_chu_gan_giong"),
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
      [{ text: word.w, errorTag: "nham_chu_gan_giong" }, { text: word.without }],
      i + 1,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 3 + (i % 3),
      targetsError: "nham_chu_gan_giong",
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
    const b = words[(i + 4) % words.length];
    const cards = [
      { id: `s${i}a`, text: a.w },
      { id: `s${i}b`, text: a.without },
      { id: `s${i}c`, text: b.w },
      {
        id: `s${i}d`,
        text: b.near ?? b.without,
        errorTag: b.near ? "nham_chu_gan_giong" : undefined,
      },
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 3),
      targetsError: b.near ? "nham_chu_gan_giong" : null,
      prompt: { text: SORT(letterLabel(a.letter))[i % 6] },
      dragItems: cards.map((c) => (c.errorTag ? c : { id: c.id, text: c.text })),
      dropZones: [
        { id: "co", label: `Có ${letterLabel(a.letter)}`, accepts: cards.map((c) => c.id) },
        { id: "khong", label: "Không có", accepts: cards.map((c) => c.id) },
      ],
      answerKey: { co: [cards[0].id, cards[2].id], khong: [cards[1].id, cards[3].id] },
      hints: HINT_SORT(letterLabel(a.letter))[i % 4],
      explanation: `"${a.w}" và "${b.w}" có âm đang học.`,
      meta: meta(40),
    });
  }

  // ⑦ Kéo thẻ đúng vào ô dưới tranh — một ô, nên thẻ đúng không mang mã lỗi (ADR-15).
  withPic.slice(0, 3).forEach((word, i) => {
    const decoys = [
      tagged(word.near, "nham_chu_gan_giong") ?? tagged(word.rime, "doc_nham_van"),
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
          `Viết đủ ${set.length} tiếng`,
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

const W = (w, letter, without, near, onset, rime, pic, gloss, theme) => ({
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

letterPack({
  code: "VIET.HV.AM_OO",
  prefix: "viet-amoo",
  letterLabel: () => "âm ô",
  lessonRefs: ["KNTT-TV1-T1-B07"],
  src: "SGK Tiếng Việt 1 tập một, Bài 7 tr.26 (Ô ô, dấu nặng)",
  note: "Bài 7: Ô ô. Tới bài 7 lớp mới học a b c e ê o ô và bốn dấu huyền – sắc – hỏi – nặng, nên mọi tiếng in ra chỉ dùng chừng ấy chữ; dấu ngã (bài 9) không xuất hiện.",
  words: [
    W("cô", "ô", "ba", "co", "bô", "cà", "👩", "cô giáo", "garden"),
    W("bố", "ô", "cà", "bó", "cố", "bá", "👨", "bố", "robot"),
    W("ô", "ô", "ba", "o", null, null, "☂️", "cái ô", "garden"),
    W("ổ", "ô", "bé", null, "bổ", null, "🪺", "cái ổ", "garden"),
    W("cổ", "ô", "bé", "cỏ", "bổ", "cả", null, null),
    W("cố", "ô", "bà", "có", "bố", "cá", null, null),
    W("bổ", "ô", "cò", "bỏ", "cổ", "bả", null, null),
    W("bộ", "ô", "ca", "bọ", "cộ", "bạ", null, null),
    W("bồ", "ô", "cá", "bò", "cồ", "bà", null, null),
    W("cồ", "ô", "be", "cò", "bồ", "cà", null, null),
    W("cộ", "ô", "bé", "cọ", "bộ", "cạ", null, null),
    W("ố", "ô", "ba", "ó", "bố", null, null, null),
  ],
  phrases: ["cô bế bé", "bố có ô", "bà bổ cà", "cô có cá", "bố ở bể cá"],
  writeSets: [
    ["cô", "bố", "ô"],
    ["ổ", "cổ", "bổ"],
    ["bộ", "bồ", "cố"],
  ],
});

letterPack({
  code: "VIET.HV.AM_OW",
  prefix: "viet-amow",
  letterLabel: () => "âm ơ",
  lessonRefs: ["KNTT-TV1-T1-B09"],
  src: "SGK Tiếng Việt 1 tập một, Bài 9 tr.30 (Ơ ơ, dấu ngã)",
  note: "Bài 9: Ơ ơ và dấu ngã — bài cuối cùng bổ sung dấu, nên từ đây đủ sáu dấu. Nhiễu chính là ba con chữ o – ô – ơ nhìn gần giống nhau.",
  words: [
    W("bơ", "ơ", "cá", "bô", "cơ", "bò", "🥑", "quả bơ", "garden"),
    W("cờ", "ơ", "bé", "cồ", "bờ", "cò", "🚩", "lá cờ", "robot"),
    W("bờ", "ơ", "cá", "bồ", "cờ", "bò", null, null),
    W("cơ", "ơ", "bà", "cô", "bơ", "co", null, null),
    W("cớ", "ơ", "bé", "cố", "bớ", "có", null, null),
    W("cỡ", "ơ", "bà", "cỗ", "dỡ", "cõ", null, null),
    W("đỡ", "ơ", "ca", "đỗ", "bỡ", "đã", null, null),
    W("đờ", "ơ", "cá", "đồ", "bờ", "đò", null, null),
    W("đợ", "ơ", "bé", "độ", "bợ", "đọ", null, null),
    W("bợ", "ơ", "cà", "bộ", "đợ", "bọ", null, null),
    W("bở", "ơ", "cò", "bổ", "dở", "bỏ", null, null),
    W("dở", "ơ", "ba", "dỗ", "bở", "dò", null, null),
    W("dơ", "ơ", "bé", "do", "bơ", "da", null, null),
    W("ở", "ơ", "bà", "ổ", "bở", null, null, null),
  ],
  phrases: ["bé có bơ", "cờ đỏ", "bố đỡ bà", "cô ở bờ đê", "bà dỗ bé"],
  writeSets: [
    ["bơ", "cờ", "bờ"],
    ["cơ", "ở", "đỡ"],
    ["dơ", "bở", "cỡ"],
  ],
});

letterPack({
  code: "VIET.HV.AM_I_K",
  prefix: "viet-amik",
  letterLabel: (l) => (l === "i" ? "âm i" : "âm k"),
  lessonRefs: ["KNTT-TV1-T1-B11"],
  src: "SGK Tiếng Việt 1 tập một, Bài 11 tr.34 (I i, K k)",
  note: "Bài 11: I i, K k. Chữ k chỉ đứng trước i, e, ê — mọi tiếng có k trong gói này đều theo đúng quy tắc đó (quy tắc c/k/q có gói riêng).",
  words: [
    W("bi", "i", "ba", null, "đi", "bà", "🔵", "viên bi", "robot"),
    W("bí", "i", "bà", null, "kí", "bá", "🎃", "quả bí", "garden"),
    W("đi", "i", "đa", null, "bi", "đa", "🚶", "đi bộ", "robot"),
    W("dì", "i", "da", null, "kì", "dà", "👩", "dì", "garden"),
    W("kẻ", "k", "bà", null, "bẻ", "kè", "📏", "kẻ ô", "robot"),
    W("kể", "k", "ba", null, "bể", "kê", null, null),
    W("kê", "k", "cà", null, "bê", "kì", null, null),
    W("kế", "k", "cỏ", null, "bế", "kí", null, null),
    W("kì", "k", "bà", null, "dì", "kê", null, null),
    W("kí", "k", "cá", null, "bí", "kê", null, null),
    W("bì", "i", "bà", null, "dì", "bà", null, null),
    W("bị", "i", "bạ", null, "dị", "bạ", null, null),
  ],
  phrases: ["bé đi bộ", "dì kể bé", "bi đỏ", "cô kẻ ô", "bé có bí đỏ", "dì đi đò"],
  writeSets: [
    ["bi", "bí", "đi"],
    ["kẻ", "kể", "kê"],
    ["dì", "kì", "kí"],
    ["bì", "bị", "kế"],
  ],
});

letterPack({
  code: "VIET.HV.AM_H_L",
  prefix: "viet-amhl",
  letterLabel: (l) => (l === "h" ? "âm h" : "âm l"),
  lessonRefs: ["KNTT-TV1-T1-B12"],
  src: "SGK Tiếng Việt 1 tập một, Bài 12 tr.36 (H h, L l)",
  note: "Bài 12: H h, L l. Tới đây lớp đã có 14 con chữ, nên câu đọc to bắt đầu dài ra được — 'hổ ở bờ hồ' là câu thật của bài.",
  words: [
    W("hồ", "h", "ba", "hò", "bồ", "hà", "🏞️", "cái hồ", "garden"),
    W("hổ", "h", "cá", "hỏ", "bổ", "hả", "🐯", "con hổ", "garden"),
    W("lá", "l", "bà", null, "cá", "lò", "🍃", "chiếc lá", "garden"),
    W("lê", "l", "bí", "le", "bê", "lò", "🍐", "quả lê", "garden"),
    W("lọ", "l", "bà", "lợ", "họ", "lá", "🏺", "cái lọ", "robot"),
    W("li", "l", "bà", null, "bi", "lê", "🥛", "cái li", "robot"),
    W("hè", "h", "cá", "hè", "bè", "hà", null, null),
    W("hẹ", "h", "cà", "hệ", "bẹ", "hạ", null, null),
    W("hộ", "h", "bà", "hợ", "bộ", "hạ", null, null),
    W("lò", "l", "bé", "lờ", "bò", "lê", null, null),
    W("lỗ", "l", "ba", "lỡ", "bỗ", "lã", null, null),
    W("lễ", "l", "cá", "lẽ", "bễ", "lã", null, null),
    W("lạ", "l", "bé", "lợ", "hạ", "lọ", null, null),
    W("hà", "h", "bé", "hờ", "là", "hè", null, null),
  ],
  phrases: ["hổ ở bờ hồ", "bé có li", "lá đỏ", "dì hé lọ", "bé lễ độ"],
  writeSets: [
    ["hồ", "hổ", "hè"],
    ["lá", "lê", "lọ"],
    ["li", "lò", "lỗ"],
  ],
});
