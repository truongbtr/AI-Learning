/**
 * Pha 6c, lô A5 — Toán 1 (VMATH): 7 kỹ năng trống của tuần 13–18, đúng trang sách Kết Nối Tri Thức
 * tập một đã quét: bài 11 tr.68–79 (trừ trong phạm vi 10, số 0 trong phép trừ), bài 12 tr.80–85
 * (bảng cộng/bảng trừ), bài 13 tr.86–91 (luyện tập chung — tính nhẩm), bài 14 tr.92–95 (khối lập
 * phương/khối hộp chữ nhật), bài 15 tr.96–99 (vị trí trên-dưới-trái-phải-trước-sau-ở giữa).
 *
 * VMATH là môn bắt buộc mọi câu MCQ/LISTEN_CHOOSE có ô nhiễu mang mã lỗi đúng nghĩa (docs/04 §11.2),
 * không có ngoại lệ theo mạch. Hai mạch hình học (khối, vị trí) không có mã lỗi khớp với "gọi nhầm
 * khối"/"nhầm trái-phải": theo đúng cách VMATH/EMATH các đợt trước đã làm — nhận dạng/gọi tên đi
 * bằng kéo-thả (không cần mã), còn MCQ/LISTEN_CHOOSE hỏi thứ đếm được (số mặt, số đỉnh) hoặc là bài
 * toán cộng/trừ có bối cảnh vị trí (đáp số thật, hụt/dư một hoặc làm ngược phép tính nói đúng lỗi).
 *
 *   node scripts/content-gen/vmath-dot4.mjs
 */
import { choicesOf, ex, img, listenPrompt, mkPack, numberId } from "./lib.mjs";

const LISTEN = [
  "Nghe rồi chọn số đúng nhé!",
  "{ban} đọc, con chọn ô đúng.",
  "Nghe kỹ rồi chọn nhé!",
  "Con nghe rồi tìm số đúng.",
  "Lắng nghe rồi chọn ô đúng.",
  "Nghe lần nữa rồi chọn.",
];
const READ = [
  "Con đọc to nhé!",
  "Đọc chậm cho {ban} nghe.",
  "Đọc to phép tính này nhé!",
  "Con đọc cho cả nhà nghe.",
  "Đọc rõ từng tiếng nhé!",
  "Cùng đọc to nào!",
];

function around(answer, kinds, given, slot, max = 10) {
  const wrongs = [];
  for (const k of kinds) {
    const v = {
      dem_thieu_1: answer - 1,
      dem_thua_1: answer + 1,
      nham_cong_tru: given.opposite,
      lap_lai_tong: given.repeat,
      quen_so_0: given.zero ?? 0,
    }[k];
    if (v == null || v < 0 || v > max || v === answer || wrongs.some((w) => w.text === String(v)))
      continue;
    wrongs.push({ text: String(v), errorTag: k });
    if (wrongs.length === 2) break;
  }
  if (!wrongs.length) wrongs.push({ text: String(answer + 1), errorTag: "dem_thua_1" });
  return choicesOf({ text: String(answer) }, wrongs, slot);
}
const tagOf = (choices) => choices.find((c) => c.errorTag)?.errorTag ?? null;
const pack = (code, prefix, unit, lessonRefs, src, note) =>
  mkPack({
    dir: "vmath",
    subject: "VMATH",
    language: "vi",
    code,
    prefix,
    unit,
    lessonRefs,
    src,
    note,
  });

function readWrite(add, reads, writes) {
  reads.forEach((r, i) => {
    const words = r.split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: 1 + (i % 4),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: r, words },
      answerKey: { words },
      hints: [["Đọc chậm từng tiếng."], ["Đọc rõ từng số."]][i % 2],
      explanation: `Đọc là "${r}".`,
    });
  });
  writes.forEach(([q, sample, crit], i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 3 + (i % 3),
      prompt: { text: q },
      rubric: {
        criteria: crit ?? ["Làm đúng yêu cầu", "Chữ số viết đúng chiều"],
        sampleAnswers: [sample],
      },
      answerKey: null,
      hints: ["Làm từng bước, chậm thôi nhé!"],
      explanation: `Đáp án: ${sample}.`,
      meta: { estSeconds: 70 },
    });
  });
}
function counts(add, list, prompt) {
  list.forEach(([emoji, label, n], i) => {
    add({
      type: "COUNT_TAP",
      difficulty: 1 + (i % 4),
      prompt: { text: prompt(label, i) },
      countTarget: {
        objects: img(emoji, label, null, n),
        correctCount: n,
        layout: i % 2 === 0 ? "grid" : "line",
      },
      answerKey: n,
      hints: ["Chạm từng cái và đếm to lên."],
      explanation: `Có ${n} ${label}.`,
    });
  });
}
function dragSort(add, { q, zones, a, b, tag, d, hint }, i) {
  const cards = [
    ...a.map((t, k) => ({ id: `a${k}`, text: t, ...(tag ? { errorTag: tag } : {}) })),
    ...b.map((t, k) => ({ id: `b${k}`, text: t, ...(tag ? { errorTag: tag } : {}) })),
  ];
  add({
    type: "DRAG_DROP",
    difficulty: d ?? 2 + (i % 4),
    targetsError: tag ?? null,
    prompt: { text: q },
    dragItems: cards,
    dropZones: [
      { id: "za", label: zones[0], accepts: cards.map((c) => c.id) },
      { id: "zb", label: zones[1], accepts: cards.map((c) => c.id) },
    ],
    answerKey: { za: a.map((_, k) => `a${k}`), zb: b.map((_, k) => `b${k}`) },
    hints: [hint ?? "Đọc từng thẻ rồi mới kéo nhé!"],
    explanation: `${a.join(", ")} thuộc "${zones[0]}"; ${b.join(", ")} thuộc "${zones[1]}".`,
    meta: { estSeconds: 45 },
  });
}
function dragMatch(add, { q, items, zoneLabels, key, d, hint, why }) {
  const cards = items.map((t, k) => ({
    id: `c${k}`,
    ...(typeof t === "string" ? { text: t } : { image: img(t[0], t[1] ?? null, null) }),
  }));
  add({
    type: "DRAG_DROP",
    difficulty: d ?? 3,
    prompt: { text: q },
    dragItems: cards,
    dropZones: zoneLabels.map((label, z) => ({
      id: `z${z}`,
      label,
      accepts: cards.map((c) => c.id),
    })),
    answerKey: Object.fromEntries(
      zoneLabels.map((_, z) => [`z${z}`, (key[z] ?? []).map((k) => `c${k}`)]),
    ),
    hints: [hint ?? "Nghĩ kỹ rồi mới kéo nhé!"],
    explanation: why ?? "",
    meta: { estSeconds: 45 },
  });
}

// ═══════════════════════════════════════════════ 1. Trừ đi 0 và trừ hết ═══════════════════════
{
  const P = pack(
    "VMATH.SO.TRU_VE_0",
    "vmath-truve0",
    "KNTT-T1-B11",
    ["KNTT-T1-B11"],
    "SGK Toán 1 tập một, Bài 11 tr.74 — Số 0 trong phép trừ",
    "a - 0 = a và a - a = 0. Ô nhiễu: quen_so_0 (7-0=0, 4-4=4) — đề luôn có số 0 hoặc cụm 'ăn/vớt/lấy hết cả' để mã hợp lệ.",
  );
  const add = P.add;
  [3, 5, 6, 7, 8, 9, 10, 4, 2].forEach((a, i) => {
    const { choices, answerKey } = around(a, ["quen_so_0", "dem_thieu_1"], { zero: 0 }, i, 10);
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      scaffold: i < 6 ? "model" : "none",
      targetsError: tagOf(choices),
      prompt: { text: `Bể có ${a} con cá. Không vớt con nào. ${a} - 0 = ?` },
      choices,
      answerKey,
      hints: ["Không lấy đi con nào thì vẫn còn nguyên."],
      explanation: `${a} - 0 = ${a}. Trừ đi 0 thì giữ nguyên.`,
    });
  });
  [3, 4, 5, 6, 7, 8, 9, 10, 2].forEach((a, i) => {
    const { choices, answerKey } = around(
      0,
      ["lap_lai_tong", "dem_thua_1"],
      { repeat: a },
      i + 1,
      10,
    );
    add({
      type: "MCQ",
      difficulty: 1 + ((i + 2) % 5),
      targetsError: tagOf(choices),
      prompt: { text: `Bể có ${a} con cá. Vớt hết cả ${a} con. Còn mấy con?` },
      choices,
      answerKey,
      hints: ["Vớt hết cả thì bể không còn con nào."],
      explanation: `${a} - ${a} = 0. Trừ hết thì còn 0.`,
    });
  });
  add({
    type: "MCQ",
    difficulty: 3,
    targetsError: "quen_so_0",
    prompt: { text: "Câu nào đúng: 6 - 0 = 6 hay 6 - 0 = 0?" },
    choices: [
      { id: "a", text: "6 - 0 = 6" },
      { id: "b", text: "6 - 0 = 0", errorTag: "quen_so_0" },
    ],
    answerKey: "a",
    hints: ["Trừ đi 0 thì không mất gì cả."],
    explanation: "6 - 0 = 6, vì không lấy đi con nào.",
  });
  add({
    type: "MCQ",
    difficulty: 3,
    targetsError: "lap_lai_tong",
    prompt: { text: "Câu nào đúng: 9 - 9 = 0 hay 9 - 9 = 9?" },
    choices: [
      { id: "a", text: "9 - 9 = 0" },
      { id: "b", text: "9 - 9 = 9", errorTag: "lap_lai_tong" },
    ],
    answerKey: "a",
    hints: ["Lấy hết cả thì không còn gì."],
    explanation: "9 - 9 = 0, vì lấy đi hết cả 9.",
  });
  P.list.push(
    ...[
      [4, "quen_so_0"],
      [8, "quen_so_0"],
    ].map(([a, tag], i) => {
      const spoken = `${a} trừ 0 bằng mấy`;
      const { choices, answerKey } = around(a, [tag, "dem_thieu_1"], { zero: 0 }, i + 2, 10);
      return ex({
        id: numberId("vmath-truve0", 100 + i),
        language: "vi",
        skillCodes: ["VMATH.SO.TRU_VE_0"],
        type: "LISTEN_CHOOSE",
        difficulty: 2,
        targetsError: tagOf(choices),
        prompt: { text: listenPrompt(LISTEN, spoken, i) },
        listenTarget: { text: spoken },
        choices,
        answerKey,
        hints: [["Nghe lại một lần nữa nhé!"]][0],
        explanation: `${a} - 0 = ${a}.`,
        meta: {
          estSeconds: 25,
          lessonUnitCode: "KNTT-T1-B11",
          sourceRef: "SGK Toán 1 tập một, Bài 11 tr.74",
        },
      });
    }),
  );
  [5, 6, 7, 10].forEach((a, i) => {
    const spoken = `${a} trừ ${a} bằng mấy`;
    const { choices, answerKey } = around(0, ["lap_lai_tong"], { repeat: a }, i + 4, 10);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 3,
      targetsError: tagOf(choices),
      prompt: { text: listenPrompt(LISTEN, spoken, i) },
      listenTarget: { text: spoken },
      choices,
      answerKey,
      hints: ["Trừ hết cả thì còn 0."],
      explanation: `${a} - ${a} = 0.`,
    });
  });
  dragSort(
    add,
    {
      q: "Xếp mỗi phép tính vào đúng giỏ: kết quả bằng số ban đầu, hay kết quả bằng 0?",
      zones: ["Bằng số ban đầu (trừ 0)", "Bằng 0 (trừ hết)"],
      a: ["7 - 0", "5 - 0", "9 - 0"],
      b: ["7 - 7", "5 - 5", "9 - 9"],
      d: 3,
      hint: "Trừ 0 thì giữ nguyên; trừ hết thì còn 0.",
    },
    0,
  );
  dragMatch(add, {
    q: "Nối mỗi phép tính với đáp số đúng.",
    items: ["6 - 0", "6 - 6", "8 - 0", "8 - 8"],
    zoneLabels: ["6", "0", "8", "0 "],
    key: { 0: [0], 1: [1], 2: [2], 3: [3] },
    d: 4,
    hint: "Trừ 0 giữ nguyên, trừ hết còn 0.",
    why: "6-0=6, 6-6=0, 8-0=8, 8-8=0.",
  });
  counts(
    add,
    [
      ["🐟", "con cá", 4],
      ["🐟", "con cá", 7],
    ],
    (l, i) => [`Có mấy ${l} trước khi vớt?`][0],
  );
  readWrite(
    add,
    ["bảy trừ không bằng bảy", "chín trừ chín bằng không", "sáu trừ không bằng sáu"],
    [
      ["Viết phép tính: 8 trừ 0.", "8 - 0 = 8"],
      ["Viết phép tính: 5 trừ 5.", "5 - 5 = 0"],
    ],
  );
  P.save();
}

// ═══════════════════════════════════════════════ 2. Bài toán "bớt" ════════════════════════════
{
  const P = pack(
    "VMATH.GT.BAI_TOAN_BOT",
    "vmath-baitoanbot",
    "KNTT-T1-B11",
    ["KNTT-T1-B11", "KNTT-T1-B32"],
    "SGK Toán 1 tập một, Bài 11 tr.68–71 — Bớt đi còn lại mấy",
    "Bài toán bớt đi (rụng, bay mất, ăn mất): còn lại = bớt bằng phép trừ. Ô nhiễu: nham_cong_tru (cộng thay vì trừ), lap_lai_tong (chép lại số trong đề), hụt/dư một.",
  );
  const add = P.add;
  const situations = [
    ["Trên cây có 8 quả cam. Rụng 3 quả. Còn mấy quả?", 8, 3, 5],
    ["Có 6 quả bóng bay. Bay mất 2 quả. Còn mấy quả?", 6, 2, 4],
    ["Có 9 con gà. Bán đi 4 con. Còn mấy con?", 9, 4, 5],
    ["Có 7 quyển vở. Cho bạn 2 quyển. Còn mấy quyển?", 7, 2, 5],
    ["Có 10 quả trứng. Đã nở 6 quả. Còn mấy quả chưa nở?", 10, 6, 4],
    ["Có 5 con cá. Vớt ra 2 con. Còn mấy con?", 5, 2, 3],
    ["Có 8 cây nến đang cháy. Tắt mất 5 cây. Còn mấy cây?", 8, 5, 3],
    ["Có 9 bông hoa. Cắt đi 3 bông. Còn mấy bông?", 9, 3, 6],
    ["Có 6 bạn thỏ. Chạy đi 4 bạn. Còn mấy bạn?", 6, 4, 2],
    ["Có 10 con vịt. Bơi đi 7 con. Còn mấy con?", 10, 7, 3],
    ["Có 7 quả bưởi. Rụng 2 quả. Còn mấy quả?", 7, 2, 5],
    ["Có 9 chiếc lá. Rụng hết 9 chiếc. Còn mấy chiếc?", 9, 9, 0],
    ["Có 8 quả chuối. Ăn mất 3 quả. Còn mấy quả?", 8, 3, 5],
    ["Có 6 chiếc bút. Mất 1 chiếc. Còn mấy chiếc?", 6, 1, 5],
    ["Có 9 viên bi. Cho bạn 6 viên. Còn mấy viên?", 9, 6, 3],
    ["Có 7 chiếc lá vàng. Rụng 4 chiếc. Còn mấy chiếc?", 7, 4, 3],
    ["Có 10 quả bóng. Vỡ mất 4 quả. Còn mấy quả?", 10, 4, 6],
    ["Có 5 con bướm. Bay đi 3 con. Còn mấy con?", 5, 3, 2],
  ];
  situations.forEach(([q, a, b, ans], i) => {
    const { choices, answerKey } = around(
      ans,
      ["lap_lai_tong", "nham_cong_tru", "dem_thieu_1"],
      { repeat: a, opposite: a + b },
      i,
      10,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      scaffold: i < 6 ? "model" : "none",
      targetsError: tagOf(choices),
      prompt: { text: q },
      choices,
      answerKey,
      hints: ["'Còn mấy' nghĩa là làm phép trừ.", `${a} bớt ${b}.`],
      explanation: `${a} - ${b} = ${ans}.`,
    });
  });
  add({
    type: "MCQ",
    difficulty: 4,
    targetsError: "nham_cong_tru",
    prompt: { text: "'Rụng mất, bay mất, bớt đi' là dấu hiệu của phép tính nào?" },
    choices: [
      { id: "a", text: "phép trừ" },
      { id: "b", text: "phép cộng", errorTag: "nham_cong_tru" },
    ],
    answerKey: "a",
    hints: ["Bớt đi là mất bớt, dùng phép trừ."],
    explanation: "Các từ 'rụng, bay mất, bớt đi' đều là dấu hiệu phép trừ.",
  });
  situations.slice(0, 9).forEach(([q, a, b, ans], i) => {
    const { choices, answerKey } = around(
      ans,
      ["lap_lai_tong", "dem_thua_1"],
      { repeat: a },
      i + 1,
      10,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 2 + (i % 3),
      targetsError: tagOf(choices),
      prompt: { text: listenPrompt(LISTEN, q, i) },
      listenTarget: { text: q },
      choices,
      answerKey,
      hints: ["Nghe lại rồi làm phép trừ."],
      explanation: `${a} - ${b} = ${ans}.`,
    });
  });
  dragMatch(add, {
    q: "Nối mỗi tình huống với phép tính đúng.",
    items: ["Trên cây có 8 quả, rụng 3 quả", "Có 6 quả bóng, bay mất 2 quả"],
    zoneLabels: ["8 - 3 = 5", "6 - 2 = 4"],
    key: { 0: [0], 1: [1] },
    d: 3,
    hint: "Bớt đi là trừ.",
    why: "8-3=5 và 6-2=4.",
  });
  dragMatch(add, {
    q: "Nối mỗi tình huống với phép tính đúng.",
    items: ["Có 9 con gà, bán đi 4 con", "Có 10 quả trứng, đã nở 6 quả"],
    zoneLabels: ["9 - 4 = 5", "10 - 6 = 4"],
    key: { 0: [0], 1: [1] },
    d: 4,
    hint: "Bớt đi là trừ.",
    why: "9-4=5 và 10-6=4.",
  });
  dragMatch(add, {
    q: "Nối mỗi tình huống với phép tính đúng.",
    items: ["Có 8 quả chuối, ăn mất 3 quả", "Có 10 quả bóng, vỡ mất 4 quả"],
    zoneLabels: ["8 - 3 = 5", "10 - 4 = 6"],
    key: { 0: [0], 1: [1] },
    d: 3,
    hint: "Bớt đi là trừ.",
    why: "8-3=5 và 10-4=6.",
  });
  readWrite(
    add,
    ["có tám quả cam rụng ba quả còn năm quả", "có chín con gà bán đi bốn con còn năm con"],
    [
      ["Đặt một bài toán bớt rồi viết phép tính.", "Có 7 quả, ăn 2 quả. 7 - 2 = 5"],
      ["Đặt một bài toán bớt khác rồi viết phép tính.", "Có 9 viên bi, cho 3 viên. 9 - 3 = 6"],
    ],
  );
  P.save();
}

// ═══════════════════════════════════════ 3. Bảng cộng, bảng trừ trong phạm vi 10 ═══════════════
{
  const P = pack(
    "VMATH.SO.BANG_CONG_TRU_10",
    "vmath-bangcongtru",
    "KNTT-T1-B12",
    ["KNTT-T1-B12", "KNTT-T1-B13", "KNTT-T1-B18"],
    "SGK Toán 1 tập một, Bài 12 tr.80–85 — Bảng cộng, bảng trừ trong phạm vi 10",
    "Thuộc bảng cộng/trừ trong 10 và thấy mối liên hệ 3+4=7 thì 7-4=3. Ô nhiễu: hụt/dư một, nham_cong_tru, lap_lai_tong.",
  );
  const add = P.add;
  const facts = [
    [1, 9, 10],
    [2, 8, 10],
    [3, 7, 10],
    [4, 6, 10],
    [5, 5, 10],
    [6, 4, 10],
    [7, 3, 10],
    [1, 6, 7],
    [2, 6, 8],
    [3, 6, 9],
    [4, 5, 9],
    [3, 4, 7],
    [2, 4, 6],
  ];
  facts.forEach(([a, b, sum], i) => {
    const { choices, answerKey } = around(sum, ["dem_thieu_1", "dem_thua_1"], {}, i, 10);
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      scaffold: i < 6 ? "model" : "none",
      targetsError: tagOf(choices),
      prompt: { text: `${a} + ${b} = ?` },
      choices,
      answerKey,
      hints: ["Đếm tiếp từ số lớn hơn."],
      explanation: `${a} + ${b} = ${sum}.`,
    });
  });
  facts.slice(0, 7).forEach(([a, b, sum], i) => {
    const { choices, answerKey } = around(
      a,
      ["dem_thua_1", "nham_cong_tru"],
      { opposite: sum + b },
      i + 1,
      10,
    );
    add({
      type: "MCQ",
      difficulty: 3 + (i % 2),
      targetsError: tagOf(choices),
      prompt: { text: `Biết ${a} + ${b} = ${sum}. Vậy ${sum} - ${b} = ?` },
      choices,
      answerKey,
      hints: [`${sum} - ${b}`, "Dùng lại phép cộng đã biết."],
      explanation: `${sum} - ${b} = ${a}, vì ${a} + ${b} = ${sum}.`,
    });
  });
  facts.slice(0, 6).forEach(([a, b, sum], i) => {
    const spoken = `${a} cộng ${b} bằng mấy`;
    const { choices, answerKey } = around(sum, ["dem_thieu_1", "dem_thua_1"], {}, i + 1, 10);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 2 + (i % 3),
      targetsError: tagOf(choices),
      prompt: { text: listenPrompt(LISTEN, spoken, i) },
      listenTarget: { text: spoken },
      choices,
      answerKey,
      hints: ["Nghe lại rồi tính."],
      explanation: `${a} + ${b} = ${sum}.`,
    });
  });
  facts.slice(7).forEach(([a, b, sum], i) => {
    const spoken = `${sum} trừ ${b} bằng mấy`;
    const { choices, answerKey } = around(a, ["dem_thieu_1", "dem_thua_1"], {}, i + 3, 10);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 3,
      targetsError: tagOf(choices),
      prompt: { text: listenPrompt(LISTEN, spoken, i) },
      listenTarget: { text: spoken },
      choices,
      answerKey,
      hints: ["Nghe lại rồi tính."],
      explanation: `${sum} - ${b} = ${a}.`,
    });
  });
  dragMatch(add, {
    q: "Điền số còn thiếu vào bảng cộng.",
    items: ["6 + 2", "7 + 1", "4 + 3"],
    zoneLabels: ["8", "8 ", "7"],
    key: { 0: [0], 1: [1], 2: [2] },
    d: 3,
    hint: "Cộng hai số lại.",
    why: "6+2=8, 7+1=8, 4+3=7.",
  });
  dragMatch(add, {
    q: "Điền số còn thiếu vào bảng trừ.",
    items: ["8 - 3", "8 - 5", "9 - 6"],
    zoneLabels: ["5", "3", "3 "],
    key: { 0: [0], 1: [1], 2: [2] },
    d: 4,
    hint: "Dùng bảng cộng để tính trừ.",
    why: "8-3=5, 8-5=3, 9-6=3.",
  });
  dragSort(
    add,
    {
      q: "Xếp mỗi phép tính vào đúng giỏ theo kết quả.",
      zones: ["Bằng 10", "Không bằng 10"],
      a: ["6 + 4", "3 + 7", "8 + 2"],
      b: ["6 + 3", "3 + 4"],
      d: 3,
      hint: "Tính từng phép rồi so với 10.",
    },
    0,
  );
  counts(
    add,
    [
      ["🔴", "chấm đỏ", 6],
      ["🔵", "chấm xanh", 8],
    ],
    (l) => `Đếm số ${l} rồi ghi lại.`,
  );
  readWrite(
    add,
    ["ba cộng bốn bằng bảy", "tám trừ ba bằng năm"],
    [
      ["Viết phép cộng có kết quả bằng 9.", "5 + 4 = 9"],
      ["Viết phép trừ có kết quả bằng 4.", "9 - 5 = 4"],
    ],
  );
  P.save();
}

// ═══════════════════════════════ 4. Viết phép tính thích hợp cho tình huống ════════════════════
{
  const P = pack(
    "VMATH.GT.VIET_PHEP_TINH_TU_TINH_HUONG",
    "vmath-viettinhhuong",
    "KNTT-T1-B12",
    ["KNTT-T1-B12", "KNTT-T1-B13"],
    "SGK Toán 1 tập một, Bài 12–13 tr.80, 88 — Viết phép tính thích hợp cho tình huống",
    "Từ tình huống ngắn (không tranh) chọn đúng phép tính, không chỉ đúng đáp số. Ô nhiễu: nham_cong_tru (chọn ngược dấu), nham_thu_tu_so (đảo số bị trừ/số trừ), lap_lai_tong.",
  );
  const add = P.add;
  const cases = [
    [
      "Có 6 bạn đang chơi. 2 bạn về trước. Còn mấy bạn?",
      "6 - 2 = 4",
      ["6 + 2 = 8", "2 - 6 = 4"],
      2,
    ],
    [
      "Có 4 quả táo. Mẹ mua thêm 3 quả. Có tất cả mấy quả?",
      "4 + 3 = 7",
      ["4 - 3 = 1", "3 - 4 = 1"],
      2,
    ],
    ["Có 9 chiếc kẹo. Cho em 5 chiếc. Còn mấy chiếc?", "9 - 5 = 4", ["9 + 5 = 14", "5 - 9 = 4"], 3],
    [
      "Có 3 con chó. Có thêm 5 con chó nữa đến. Có tất cả mấy con?",
      "3 + 5 = 8",
      ["3 - 5 = 2", "5 - 3 = 2"],
      3,
    ],
    [
      "Có 8 bạn trên xe buýt. 3 bạn xuống xe. Còn mấy bạn?",
      "8 - 3 = 5",
      ["8 + 3 = 11", "3 - 8 = 5"],
      3,
    ],
    [
      "Có 2 con mèo. Có thêm 6 con mèo nữa. Có tất cả mấy con?",
      "2 + 6 = 8",
      ["2 - 6 = 4", "6 - 2 = 4"],
      3,
    ],
    ["Có 10 quả bóng. Cho bạn 4 quả. Còn mấy quả?", "10 - 4 = 6", ["10 + 4 = 14", "4 - 10 = 6"], 4],
    [
      "Có 5 bạn nữ và 4 bạn nam đang chơi. Có tất cả mấy bạn?",
      "5 + 4 = 9",
      ["5 - 4 = 1", "4 - 5 = 1"],
      4,
    ],
    ["Có 7 quả cam. Ăn mất 3 quả. Còn mấy quả?", "7 - 3 = 4", ["7 + 3 = 10", "3 - 7 = 4"], 3],
    [
      "Có 4 con chim. Thêm 4 con chim nữa bay đến. Có tất cả mấy con?",
      "4 + 4 = 8",
      ["4 - 4 = 0", "4 - 4 = 4"],
      4,
    ],
    [
      "Có 9 quyển sách. Mượn đi 2 quyển. Còn mấy quyển?",
      "9 - 2 = 7",
      ["9 + 2 = 11", "2 - 9 = 7"],
      4,
    ],
    [
      "Có 6 bông hoa đỏ và 3 bông hoa vàng. Có tất cả mấy bông?",
      "6 + 3 = 9",
      ["6 - 3 = 3", "3 - 6 = 3"],
      4,
    ],
    ["Có 10 bạn. 7 bạn đã về nhà. Còn mấy bạn?", "10 - 7 = 3", ["10 + 7 = 17", "7 - 10 = 3"], 5],
    [
      "Có 8 chiếc thuyền. Thêm 2 chiếc nữa hạ thuỷ. Có tất cả mấy chiếc?",
      "8 + 2 = 10",
      ["8 - 2 = 6", "2 - 8 = 6"],
      5,
    ],
    ["Có 9 quả trứng. Vỡ mất 6 quả. Còn mấy quả?", "9 - 6 = 3", ["9 + 6 = 15", "6 - 9 = 3"], 5],
    [
      "Có 3 bạn nam, thêm 7 bạn nữ đến chơi cùng. Có tất cả mấy bạn?",
      "3 + 7 = 10",
      ["3 - 7 = 4", "7 - 3 = 4"],
      5,
    ],
  ];
  cases.forEach(([q, right, wrongs, d], i) => {
    const tags =
      i % 2 === 0 ? ["nham_cong_tru", "nham_thu_tu_so"] : ["nham_thu_tu_so", "nham_cong_tru"];
    add({
      type: "MCQ",
      difficulty: d,
      scaffold: i < 6 ? "model" : "none",
      targetsError: tags[0],
      prompt: { text: q },
      choices: [
        { id: "a", text: right },
        { id: "b", text: wrongs[0], errorTag: tags[0] },
        { id: "c", text: wrongs[1], errorTag: tags[1] },
      ],
      answerKey: "a",
      hints: ["Đọc kỹ: thêm vào là cộng, bớt đi là trừ."],
      explanation: `Phép tính đúng: ${right}.`,
    });
  });
  cases.forEach(([q, right, wrongs, d], i) => {
    add({
      type: "LISTEN_CHOOSE",
      difficulty: d,
      targetsError: i % 2 === 0 ? "nham_cong_tru" : "nham_thu_tu_so",
      prompt: { text: listenPrompt(LISTEN, q, i) },
      listenTarget: { text: q },
      choices: [
        { id: "a", text: right },
        { id: "b", text: wrongs[0], errorTag: i % 2 === 0 ? "nham_cong_tru" : "nham_thu_tu_so" },
        { id: "c", text: wrongs[1] },
      ],
      answerKey: "a",
      hints: ["Nghe lại rồi nghĩ: thêm hay bớt?"],
      explanation: `Phép tính đúng: ${right}.`,
    });
  });
  dragMatch(add, {
    q: "Nối mỗi tình huống với phép tính đúng.",
    items: ["6 bạn, 2 bạn về trước", "4 quả táo, mua thêm 3 quả"],
    zoneLabels: ["6 - 2 = 4", "4 + 3 = 7"],
    key: { 0: [0], 1: [1] },
    d: 3,
    hint: "Về trước là bớt (trừ); mua thêm là thêm vào (cộng).",
    why: "6-2=4 và 4+3=7.",
  });
  dragMatch(add, {
    q: "Nối mỗi tình huống với phép tính đúng.",
    items: ["9 chiếc kẹo, cho em 5 chiếc", "3 con chó, thêm 5 con nữa"],
    zoneLabels: ["9 - 5 = 4", "3 + 5 = 8"],
    key: { 0: [0], 1: [1] },
    d: 4,
    hint: "Cho đi là bớt; thêm đến là cộng.",
    why: "9-5=4 và 3+5=8.",
  });
  readWrite(
    add,
    ["sáu bạn hai bạn về trước còn bốn bạn"],
    [
      ["Đặt một tình huống rồi viết phép tính cộng.", "Có 3 xe, thêm 4 xe. 3 + 4 = 7"],
      ["Đặt một tình huống rồi viết phép tính trừ.", "Có 8 bút, cho 3 cái. 8 - 3 = 5"],
    ],
  );
  P.save();
}

// ═══════════════════════════════════════ 5. Tính nhẩm nhanh trong phạm vi 10 ═══════════════════
{
  const P = pack(
    "VMATH.SO.TINH_NHAM_PV_10",
    "vmath-tinhnham",
    "KNTT-T1-B13",
    ["KNTT-T1-B12"],
    "SGK Toán 1 tập một, Bài 13 tr.86–91 — Luyện tập chung (tính nhẩm nhanh)",
    "Nói ngay kết quả cộng/trừ trong 10, không đếm ngón tay. Ô nhiễu: hụt/dư một (đặc biệt cặp gần nhau như 6+3/6+4), nham_cong_tru.",
  );
  const add = P.add;
  const quick = [
    ["8 - 5", 3],
    ["4 + 4", 8],
    ["6 + 3", 9],
    ["9 - 6", 3],
    ["7 - 4", 3],
    ["5 + 2", 7],
    ["10 - 7", 3],
    ["3 + 6", 9],
    ["8 - 2", 6],
    ["6 - 4", 2],
    ["7 + 2", 9],
    ["9 - 3", 6],
    ["4 + 5", 9],
    ["10 - 6", 4],
    ["9 + 1", 10],
    ["10 - 9", 1],
    ["5 + 5", 10],
    ["8 + 1", 9],
    ["7 - 1", 6],
    ["6 + 2", 8],
    ["9 - 4", 5],
    ["3 + 5", 8],
  ];
  quick.forEach(([expr, ans], i) => {
    const isAdd = expr.includes("+");
    const [a, b] = expr.split(isAdd ? " + " : " - ").map(Number);
    const kinds =
      i % 3 === 0
        ? ["dem_thieu_1", "dem_thua_1"]
        : isAdd
          ? ["dem_thua_1", "nham_cong_tru"]
          : ["dem_thieu_1", "nham_cong_tru"];
    const { choices, answerKey } = around(ans, kinds, { opposite: isAdd ? a - b : a + b }, i, 10);
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      scaffold: i < 6 ? "model" : "none",
      targetsError: tagOf(choices),
      prompt: { text: `${expr} = ?` },
      choices,
      answerKey,
      hints: ["Trả lời thật nhanh, không đếm ngón tay."],
      explanation: `${expr} = ${ans}.`,
    });
  });
  quick.forEach(([expr, ans], i) => {
    const spoken = expr.replace("+", "cộng").replace("-", "trừ") + " bằng mấy";
    const { choices, answerKey } = around(ans, ["dem_thieu_1", "dem_thua_1"], {}, i + 1, 10);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 2 + (i % 3),
      targetsError: tagOf(choices),
      prompt: { text: listenPrompt(LISTEN, spoken, i) },
      listenTarget: { text: spoken },
      choices,
      answerKey,
      hints: ["Nghe rồi trả lời thật nhanh."],
      explanation: `${expr} = ${ans}.`,
    });
  });
  dragSort(
    add,
    {
      q: "Xếp các phép tính vào đúng giỏ theo kết quả.",
      zones: ["Bằng 9", "Không bằng 9"],
      a: ["6 + 3", "3 + 6", "7 + 2"],
      b: ["6 + 4", "8 - 2"],
      d: 3,
      hint: "Tính nhanh rồi so với 9.",
    },
    0,
  );
  dragMatch(add, {
    q: "Nối mỗi phép tính với đáp số đúng.",
    items: ["8 - 5", "9 - 6", "10 - 7"],
    zoneLabels: ["3", "3 ", "3  "],
    key: { 0: [0], 1: [1], 2: [2] },
    d: 4,
    hint: "Ba phép tính này đều bằng 3.",
    why: "8-5=3, 9-6=3, 10-7=3.",
  });
  readWrite(
    add,
    ["tám trừ năm bằng ba", "sáu cộng ba bằng chín"],
    [["Viết 3 phép tính có kết quả bằng 6.", "10-4=6, 2+4=6, 9-3=6"]],
  );
  P.save();
}

// ═══════════════════════════════ 6. Khối lập phương, khối hộp chữ nhật ═════════════════════════
{
  const P = pack(
    "VMATH.HH.KHOI_HOP_KHOI_LAP_PHUONG",
    "vmath-khoihopklp",
    "KNTT-T1-B14",
    ["KNTT-T1-B14", "KNTT-T1-B16", "KNTT-T1-B19"],
    "SGK Toán 1 tập một, Bài 14 tr.92–95 — Khối lập phương, khối hộp chữ nhật",
    "Không có mã lỗi cho 'gọi nhầm tên khối', nên MCQ/LISTEN_CHOOSE chỉ hỏi số mặt/số khối đếm được (dem_thieu_1/dem_thua_1), còn gọi tên khối đi bằng kéo-thả.",
  );
  const add = P.add;
  const faceFacts = [
    ["Khối lập phương có mấy mặt?", 6],
    ["Khối hộp chữ nhật có mấy mặt?", 6],
    ["Khối lập phương có mấy đỉnh (góc)?", 8],
    ["Khối hộp chữ nhật có mấy đỉnh (góc)?", 8],
  ];
  faceFacts.forEach(([q, ans], i) => {
    const { choices, answerKey } = around(ans, ["dem_thieu_1", "dem_thua_1"], {}, i, 10);
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      scaffold: i < 6 ? "model" : "none",
      targetsError: tagOf(choices),
      prompt: { text: q },
      choices,
      answerKey,
      hints: ["Đếm từng mặt xung quanh khối."],
      explanation: `Đáp án: ${ans}.`,
    });
  });
  faceFacts.forEach(([q, ans], i) => {
    const spoken = q.replace("?", "");
    const { choices, answerKey } = around(ans, ["dem_thieu_1", "dem_thua_1"], {}, i, 10);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 2 + (i % 3),
      targetsError: tagOf(choices),
      prompt: { text: listenPrompt(LISTEN, spoken, i) },
      listenTarget: { text: spoken },
      choices,
      answerKey,
      hints: ["Nghe lại rồi đếm."],
      explanation: `Đáp án: ${ans}.`,
    });
  });
  const countFacts = [
    ["Ngôi nhà bạn Mai xếp có mấy khối lập phương ở hàng dưới cùng?", 5],
    ["Ngôi nhà bạn Mai xếp có mấy khối hộp chữ nhật màu đỏ?", 2],
    ["Chữ H được xếp từ mấy khối lập phương nhỏ?", 7],
    ["Chữ T được xếp từ mấy khối lập phương nhỏ?", 5],
    ["Chữ C được xếp từ mấy khối lập phương nhỏ?", 5],
    ["Xếp một khối lập phương lớn cần mấy khối lập phương nhỏ (2×2×2)?", 8],
    ["Có mấy khối lập phương màu vàng ở nền nhà bạn Mai xếp?", 3],
    ["Có mấy khối lập phương màu xanh dương ở nền nhà bạn Mai xếp?", 2],
    ["Xúc xắc có mấy chấm ở mặt trước trong hình?", 5],
    ["Xúc xắc có mấy chấm ở mặt trên trong hình?", 2],
  ];
  countFacts.forEach(([q, ans], i) => {
    const { choices, answerKey } = around(ans, ["dem_thieu_1", "dem_thua_1"], {}, i + 2, 10);
    add({
      type: "MCQ",
      difficulty: 1 + ((i + 2) % 5),
      scaffold: i < 4 ? "model" : "none",
      targetsError: tagOf(choices),
      prompt: { text: q },
      choices,
      answerKey,
      hints: ["Đếm từng khối một, đừng đếm sót."],
      explanation: `Đáp án: ${ans}.`,
    });
  });
  countFacts.forEach(([q, ans], i) => {
    const spoken = q.replace("?", "");
    const { choices, answerKey } = around(ans, ["dem_thieu_1", "dem_thua_1"], {}, i + 3, 10);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 3,
      targetsError: tagOf(choices),
      prompt: { text: listenPrompt(LISTEN, spoken, i) },
      listenTarget: { text: spoken },
      choices,
      answerKey,
      hints: ["Nghe lại rồi đếm."],
      explanation: `Đáp án: ${ans}.`,
    });
  });
  dragMatch(add, {
    q: "Kéo mỗi đồ vật vào đúng tên khối.",
    items: [
      ["🎲", "xúc xắc"],
      ["📦", "hộp bánh quy"],
      ["🧊", "khối Rubik"],
    ],
    zoneLabels: ["Khối lập phương", "Khối hộp chữ nhật"],
    key: { 0: [0, 2], 1: [1] },
    d: 2,
    hint: "Khối lập phương có các mặt vuông bằng nhau.",
    why: "Xúc xắc và Rubik là khối lập phương; hộp bánh quy là khối hộp chữ nhật.",
  });
  dragSort(
    add,
    {
      q: "Xếp các hình khối vào đúng giỏ.",
      zones: ["Khối lập phương", "Khối hộp chữ nhật"],
      a: ["hình A (vuông đều)", "hình C (vuông đều, lớn hơn)"],
      b: ["hình B (chữ nhật đứng)", "hình G (nằm ngang, dài)"],
      d: 3,
      hint: "Khối lập phương có ba chiều bằng nhau.",
    },
    0,
  );
  counts(
    add,
    [
      ["📦", "khối hộp chữ nhật", 2],
      ["🎲", "khối lập phương", 5],
    ],
    (l) => `Đếm số ${l}.`,
  );
  readWrite(
    add,
    ["khối lập phương có sáu mặt bằng nhau", "khối hộp chữ nhật có sáu mặt"],
    [
      ["Tìm và vẽ một đồ vật ở nhà có dạng khối lập phương.", "viên xúc xắc"],
      ["Tìm và vẽ một đồ vật ở nhà có dạng khối hộp chữ nhật.", "hộp bánh quy"],
    ],
  );
  P.save();
}

// ═══════════════════ 7. Vị trí: trên-dưới, trái-phải, trước-sau, ở giữa ════════════════════════
{
  const P = pack(
    "VMATH.HH.VI_TRI_TREN_DUOI_TRAI_PHAI",
    "vmath-vitri",
    "KNTT-T1-B15",
    ["KNTT-T1-B15", "KNTT-T1-B16"],
    "SGK Toán 1 tập một, Bài 15 tr.96–99 — Vị trí trên-dưới, trái-phải, trước-sau, ở giữa",
    "Không có mã lỗi cho 'nhầm trái/phải/trước/sau'. Theo cách EMATH.G.POSITION_WORDS đã làm: MCQ/LISTEN_CHOOSE là bài toán cộng/trừ có bối cảnh vị trí (đáp số thật); gọi đúng vị trí trong tranh đi bằng kéo-thả.",
  );
  const add = P.add;
  const situations = [
    ["Hàng trước có 3 bạn xem phim, hàng sau có 7 bạn. Có tất cả mấy bạn?", 3, 7, 10, "cộng"],
    ["Có 2 viên gạch ở hàng trên cùng, 3 viên ở hàng giữa. Hai hàng có mấy viên?", 2, 3, 5, "cộng"],
    ["Toa tàu có 4 toa, 2 toa ở trước bị tháo ra. Còn mấy toa?", 4, 2, 2, "trừ"],
    ["Có 5 khối ở bên trái, 3 khối ở bên phải. Có tất cả mấy khối?", 5, 3, 8, "cộng"],
    ["Có 8 con vịt bơi dưới ao, 3 con lên bờ trước. Còn mấy con dưới ao?", 8, 3, 5, "trừ"],
    ["Có 6 bạn đứng trước, 4 bạn đứng sau. Có tất cả mấy bạn?", 6, 4, 10, "cộng"],
    ["Hàng dưới cùng có 4 viên gạch. Bớt đi 2 viên. Còn mấy viên?", 4, 2, 2, "trừ"],
    ["Có 7 bạn ngồi bên trái bàn, 2 bạn rời đi. Còn mấy bạn bên trái?", 7, 2, 5, "trừ"],
    ["Có 4 quyển sách xếp trên kệ trên, 5 quyển ở kệ dưới. Có tất cả mấy quyển?", 4, 5, 9, "cộng"],
    ["Có 9 bạn đứng phía trước cửa. 4 bạn đi vào trong. Còn mấy bạn phía trước?", 9, 4, 5, "trừ"],
    ["Có 3 quả táo bên phải đĩa, 6 quả bên trái đĩa. Có tất cả mấy quả?", 3, 6, 9, "cộng"],
    [
      "Có 10 bạn xếp hàng, 6 bạn ở phía sau bước lên trước. Còn mấy bạn ở phía sau?",
      10,
      6,
      4,
      "trừ",
    ],
    [
      "Có 5 chậu hoa ở trên bậc thang, 4 chậu ở dưới bậc thang. Có tất cả mấy chậu?",
      5,
      4,
      9,
      "cộng",
    ],
    ["Có 8 xe ở bên trái sân, 3 xe rời đi. Còn mấy xe bên trái?", 8, 3, 5, "trừ"],
  ];
  situations.forEach(([q, a, b, ans, op], i) => {
    const isAdd = op === "cộng";
    const { choices, answerKey } = around(
      ans,
      ["dem_thieu_1", "nham_cong_tru"],
      { opposite: isAdd ? Math.abs(a - b) : a + b },
      i,
      12,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      scaffold: i < 6 ? "model" : "none",
      targetsError: tagOf(choices),
      prompt: { text: q },
      choices,
      answerKey,
      hints: [isAdd ? "Có tất cả nghĩa là cộng." : "Còn lại nghĩa là trừ."],
      explanation: `${a} ${isAdd ? "+" : "-"} ${b} = ${ans}.`,
    });
  });
  situations.forEach(([q, a, b, ans, op], i) => {
    const isAdd = op === "cộng";
    const { choices, answerKey } = around(ans, ["dem_thieu_1", "dem_thua_1"], {}, i + 1, 12);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 2 + (i % 3),
      targetsError: tagOf(choices),
      prompt: { text: listenPrompt(LISTEN, q, i) },
      listenTarget: { text: q },
      choices,
      answerKey,
      hints: ["Nghe lại rồi tính."],
      explanation: `${a} ${isAdd ? "+" : "-"} ${b} = ${ans}.`,
    });
  });
  dragMatch(add, {
    q: "Kéo mỗi con vật vào đúng vị trí trong hình (thỏ nâu, thỏ khoang, thỏ xám đứng cạnh cà rốt).",
    items: ["thỏ nâu", "thỏ khoang", "thỏ xám"],
    zoneLabels: ["trước (gần cà rốt nhất)", "ở giữa", "sau (xa cà rốt nhất)"],
    key: { 0: [0], 1: [1], 2: [2] },
    d: 2,
    hint: "Con nào gần cà rốt nhất đứng trước.",
    why: "Thỏ nâu trước, thỏ khoang giữa, thỏ xám sau.",
  });
  dragMatch(add, {
    q: "Kéo mỗi đèn giao thông vào đúng vị trí (trên cùng, giữa, dưới cùng).",
    items: [
      ["🔴", "đèn đỏ"],
      ["🟡", "đèn vàng"],
      ["🟢", "đèn xanh"],
    ],
    zoneLabels: ["Trên cùng", "Ở giữa", "Dưới cùng"],
    key: { 0: [0], 1: [1], 2: [2] },
    d: 2,
    hint: "Đèn đỏ luôn ở trên cùng.",
    why: "Đỏ trên cùng, vàng giữa, xanh dưới cùng.",
  });
  dragSort(
    add,
    {
      q: "Xếp các hình vào đúng giỏ: bên trái, hay bên phải con thỏ?",
      zones: ["Bên trái", "Bên phải"],
      a: ["con thỏ (hồng)"],
      b: ["con rùa (mai xanh)"],
      d: 1,
      hint: "Thỏ đứng bên trái, rùa đứng bên phải.",
    },
    0,
  );
  counts(
    add,
    [
      ["🐦", "con chim đậu", 6],
      ["🐦", "con chim bay đi", 2],
    ],
    (l) => `Đếm số ${l}.`,
  );
  readWrite(
    add,
    ["thỏ nâu đứng trước thỏ khoang", "đèn đỏ ở trên cùng đèn xanh ở dưới cùng"],
    [
      [
        "Vẽ ba đồ vật: một cái ở trên, một cái ở dưới, một cái ở giữa.",
        "sách trên, dép dưới, hộp bút giữa",
      ],
      ["Vẽ hai bạn: một bạn bên trái, một bạn bên phải.", "Mai bên trái, Nam bên phải"],
    ],
  );
  P.save();
}
