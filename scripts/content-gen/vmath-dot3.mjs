/**
 * Đợt 3, lô B — Toán 1: chín kỹ năng tuần 1–12 còn trống.
 *
 *  - đếm thuộc lòng 1–10 (tiết học đầu tiên), nhận biết nhanh số lượng 1–5 (bài 1)
 *  - cộng trong phạm vi 5, cộng với 0 (bài 10), trừ trong phạm vi 5 (bài 11), bài toán "thêm"
 *  - ba kỹ năng hình (bài 7–9): hình vuông / tròn / tam giác / chữ nhật, lắp ghép, hình trong đồ vật
 *
 * Toán bắt mọi câu trắc nghiệm có ô nhiễu mang mã lỗi. Bộ mã không có mã "gọi nhầm tên hình", nên
 * **nhận dạng hình** đi bằng kéo-thả (không cần mã) và câu trắc nghiệm hình học hỏi thứ đếm được:
 * mấy cạnh, mấy góc, mấy que tính, mấy hình — nơi `dem_thieu_1` / `dem_thua_1` nói đúng lỗi trẻ làm.
 *
 *   node scripts/content-gen/vmath-dot3.mjs
 */
import { at, choicesOf, img, listenPrompt, mkPack } from "./lib.mjs";

const VI = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười"];
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
const THINGS = [
  ["🐟", "con cá"],
  ["🍎", "quả táo"],
  ["⭐", "ngôi sao"],
  ["🐝", "con ong"],
  ["🌸", "bông hoa"],
  ["🚗", "ô tô"],
  ["🐞", "con bọ rùa"],
  ["🎈", "quả bóng bay"],
  ["🐥", "con gà con"],
  ["🍓", "quả dâu"],
];

/** Ô số quanh đáp án; mã lỗi tính ra từ con số nên không gắn sai được. */
function around(answer, kinds, given, slot, max = 10) {
  const wrongs = [];
  for (const k of kinds) {
    const v = {
      dem_thieu_1: answer - 1,
      dem_thua_1: answer + 1,
      nham_cong_tru: given.opposite,
      lap_lai_tong: given.repeat,
      quen_so_0: 0,
      nham_thu_tu_so: given.order,
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
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      prompt: { text: prompt(label, i) },
      countTarget: {
        objects: img(emoji, label, null, n),
        correctCount: n,
        layout: i % 2 === 0 ? "grid" : "line",
      },
      answerKey: n,
      hints: ["Chạm từng cái và đếm to lên."],
      explanation: `Có ${VI[n] ?? n} ${label}.`,
    });
  });
}

// ───────────────────────────────────────────────────────── 1. Đếm thuộc lòng 1–10 ──────────
{
  const P = pack(
    "VMATH.SO.DEM_DEN_10_THUOC_LONG",
    "vmath-demlong",
    "KNTT-T1-B00",
    ["KNTT-T1-B00"],
    "SGK Toán 1 tập một, Tiết học đầu tiên tr.6–7",
    "Đếm xuôi 1–10 và đếm lùi. Ô nhiễu 'nói nhầm thứ tự' mang mã nham_thu_tu_so (đề có 'đếm tiếp'/'liền sau').",
  );
  const add = P.add;
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 2, 6, 8].forEach((v, i) => {
    const { choices, answerKey } = around(
      v + 1,
      ["nham_thu_tu_so", "dem_thua_1"],
      { order: v - 1 },
      i,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 3),
      scaffold: i < 6 ? "model" : "none",
      targetsError: "nham_thu_tu_so",
      prompt: {
        text: [
          `Đếm tiếp: ${v}, rồi đến số mấy?`,
          `Sau số ${v}, đếm tiếp là số nào?`,
          `Đếm tiếp sau ${v} nhé: số mấy?`,
        ][i % 3],
      },
      choices,
      answerKey,
      hints: ["Đếm to từ 1 lên nhé.", "Số tiếp theo lớn hơn một."],
      explanation: `Đếm tiếp sau ${v} là ${v + 1}.`,
    });
  });
  [10, 9, 8, 7, 6, 5].forEach((v, i) => {
    const { choices, answerKey } = around(
      v - 1,
      ["nham_thu_tu_so", "dem_thieu_1"],
      { order: v + 1 > 10 ? null : v + 1 },
      i + 1,
    );
    add({
      type: "MCQ",
      difficulty: 3 + (i % 3),
      targetsError: tagOf(choices),
      prompt: {
        text: [`Đếm lùi: ${v}, rồi đến số mấy?`, `Đếm lùi từ ${v}, số tiếp là số nào?`][i % 2],
      },
      choices,
      answerKey,
      hints: ["Đếm lùi là đếm ngược lại.", "Số tiếp theo bé hơn một."],
      explanation: `Đếm lùi sau ${v} là ${v - 1}.`,
    });
  });
  [2, 4, 5, 6, 8, 9].forEach((v, i) => {
    const spoken = `đếm tiếp sau số ${VI[v]}`;
    const { choices, answerKey } = around(
      v + 1,
      ["nham_thu_tu_so", "dem_thua_1"],
      { order: v - 1 },
      i,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 1 + (i % 4),
      targetsError: "nham_thu_tu_so",
      prompt: { text: listenPrompt(LISTEN, spoken, i) },
      listenTarget: { text: spoken },
      choices,
      answerKey,
      hints: [["Nghe lại rồi đếm to lên."], ["Đếm trên ngón tay nhé."]][i % 2],
      explanation: `Sau ${v} là ${v + 1}.`,
    });
  });
  [
    [1, 2, 3],
    [4, 5, 6],
    [6, 7, 8],
    [8, 9, 10],
    [3, 4, 5],
  ].forEach((row, i) => {
    const cards = [
      { id: "s1", text: String(row[2]) },
      { id: "s2", text: String(row[0]) },
      { id: "s3", text: String(row[1]) },
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 1 + (i % 4),
      prompt: {
        text: [
          "Xếp các số theo thứ tự đếm nhé!",
          "Kéo số vào ô, đếm từ bé đến lớn.",
          "Đếm xuôi: số nào đứng trước?",
        ][i % 3],
      },
      dragItems: cards,
      dropZones: [
        { id: "o1", label: "Thứ nhất", accepts: ["s1", "s2", "s3"] },
        { id: "o2", label: "Thứ hai", accepts: ["s1", "s2", "s3"] },
        { id: "o3", label: "Thứ ba", accepts: ["s1", "s2", "s3"] },
      ],
      answerKey: { o1: ["s2"], o2: ["s3"], o3: ["s1"] },
      hints: ["Đếm to từ số bé nhất."],
      explanation: `${row.join(", ")}.`,
      meta: { estSeconds: 40 },
    });
  });
  counts(
    add,
    [
      ["🐟", "con cá", 6],
      ["⭐", "ngôi sao", 9],
      ["🌸", "bông hoa", 7],
      ["🐝", "con ong", 10],
    ],
    (l, i) => [`Chạm và đếm to số ${l} nhé!`, `Đếm xem có mấy ${l}.`][i % 2],
  );
  readWrite(
    add,
    ["một hai ba bốn năm", "sáu bảy tám chín mười", "ba bốn năm sáu bảy", "năm bốn ba hai một"],
    [
      ["Viết các số từ 1 đến 10 vào vở nhé!", "1 2 3 4 5 6 7 8 9 10"],
      ["Viết các số đếm lùi từ 10 đến 6 nhé!", "10 9 8 7 6"],
      ["Viết số còn thiếu: 3, 4, …, 6 vào vở.", "5"],
    ],
  );
  P.save();
}

// ──────────────────────────────────────────────── 2. Nhận biết nhanh số lượng 1–5 ──────────
{
  const P = pack(
    "VMATH.SO.NHAN_BIET_SO_LUONG_1_5",
    "vmath-soluong",
    "KNTT-T1-B01",
    ["KNTT-T1-B01"],
    "SGK Toán 1 tập một, Bài 1 tr.8–13",
    "Nhìn nhanh số lượng 1–5 không cần đếm từng cái.",
  );
  const add = P.add;
  [1, 2, 3, 4, 5, 2, 4, 3, 5, 1, 4, 5].forEach((v, i) => {
    const [emoji, label] = at(THINGS, i);
    const { choices, answerKey } = around(v, ["dem_thieu_1", "dem_thua_1"], {}, i, 6);
    add({
      type: "MCQ",
      difficulty: 1 + (i % 4),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      scaffold: i < 6 ? "model" : "none",
      targetsError: tagOf(choices),
      prompt: {
        text: [`Có mấy ${label}?`, `Nhìn nhanh: có mấy ${label}?`, `Tranh có bao nhiêu ${label}?`][
          i % 3
        ],
        image: img(emoji, label, null, v),
      },
      choices,
      answerKey,
      hints: ["Nhìn cả nhóm, đừng đếm lâu nhé.", "Hai và hai là bốn."],
      explanation: `Có ${VI[v]} ${label}.`,
    });
  });
  [1, 3, 5, 2, 4, 3, 5].forEach((v, i) => {
    const [emoji, label] = at(THINGS, i + 3);
    const { choices, answerKey } = around(v, ["dem_thua_1", "dem_thieu_1"], {}, i + 1, 6);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 2 + (i % 4),
      targetsError: tagOf(choices),
      prompt: { text: listenPrompt(LISTEN, VI[v], i), image: img(emoji, label, null, v) },
      listenTarget: { text: `Có mấy ${label}?` },
      choices,
      answerKey,
      hints: [["Nhìn tranh, nghe câu hỏi rồi chọn."], ["Nhìn nhanh cả nhóm nhé."]][i % 2],
      explanation: `Có ${VI[v]} ${label}.`,
    });
  });
  [
    [2, 4],
    [1, 3],
    [3, 5],
    [4, 2],
    [5, 1],
    [2, 3],
  ].forEach(([a, b], i) => {
    const [e1, l1] = at(THINGS, i);
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      prompt: {
        text: [
          "Kéo số đúng vào mỗi tranh nhé!",
          "Tranh nào có mấy? Kéo số vào.",
          "Nối số với tranh.",
        ][i % 3],
      },
      dragItems: [
        { id: "n1", text: String(b) },
        { id: "n2", text: String(a) },
      ],
      dropZones: [
        { id: "t1", label: "Tranh 1", image: img(e1, l1, null, a), accepts: ["n1", "n2"] },
        { id: "t2", label: "Tranh 2", image: img(e1, l1, null, b), accepts: ["n1", "n2"] },
      ],
      answerKey: { t1: ["n2"], t2: ["n1"] },
      hints: ["Nhìn nhanh từng tranh."],
      explanation: `Tranh 1 có ${a}, tranh 2 có ${b}.`,
      meta: { estSeconds: 35 },
    });
  });
  counts(
    add,
    [
      ["🍎", "quả táo", 3],
      ["🐥", "con gà con", 5],
      ["🎈", "quả bóng bay", 4],
      ["🐞", "con bọ rùa", 2],
    ],
    (l) => `Chạm để đếm ${l} nhé!`,
  );
  readWrite(
    add,
    ["một quả táo", "hai con cá", "ba ngôi sao", "bốn bông hoa", "năm con ong"],
    [
      ["Vẽ 3 quả táo rồi viết số 3.", "3"],
      ["Vẽ 5 ngôi sao rồi viết số 5.", "5"],
      ["Viết các số 1, 2, 3, 4, 5 vào vở.", "1 2 3 4 5"],
    ],
  );
  P.save();
}

// ──────────────────────────────────────────────────── 3–5. Cộng / cộng với 0 / trừ ───────────
function arithmetic({
  code,
  prefix,
  unit,
  src,
  note,
  op,
  facts,
  stories,
  extraTag,
  reads,
  writes,
}) {
  const P = pack(code, prefix, unit, [unit], src, note);
  const add = P.add;
  const solve = ([a, b]) => (op === "+" ? a + b : a - b);
  const opp = ([a, b]) => (op === "+" ? a - b : a + b);
  const sign = op;
  const word = op === "+" ? "cộng" : "trừ";
  facts.forEach((f, i) => {
    const ans = solve(f);
    const kinds =
      f.includes(0) && extraTag
        ? [extraTag, "dem_thua_1"]
        : [
            ["nham_cong_tru", "dem_thieu_1"],
            ["dem_thua_1", "lap_lai_tong"],
            ["dem_thieu_1", "dem_thua_1"],
          ][i % 3];
    const { choices, answerKey } = around(ans, kinds, { opposite: opp(f), repeat: f[0] }, i, 10);
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      scaffold: i < 6 ? "model" : "none",
      targetsError: tagOf(choices),
      prompt: {
        text: [
          `${f[0]} ${sign} ${f[1]} = ?`,
          `Tính: ${f[0]} ${sign} ${f[1]} = ?`,
          `Con tính giúp {ban}: ${f[0]} ${sign} ${f[1]} = ?`,
        ][i % 3],
      },
      choices,
      answerKey,
      hints: [
        op === "+" ? `Đếm tiếp từ ${f[0]} thêm ${f[1]}.` : `Có ${f[0]}, bớt đi ${f[1]}.`,
        "Dùng ngón tay nếu cần nhé.",
      ],
      explanation: `${f[0]} ${word} ${f[1]} bằng ${ans}.`,
    });
  });
  stories.forEach(([text, nums, emoji, label], i) => {
    const ans = solve(nums);
    const { choices, answerKey } = around(
      ans,
      nums.includes(0) && extraTag
        ? [extraTag, "dem_thua_1"]
        : i % 2 === 0
          ? ["nham_cong_tru", "dem_thua_1"]
          : ["lap_lai_tong", "dem_thieu_1"],
      { opposite: opp(nums), repeat: nums[0] },
      i + 1,
      10,
    );
    add({
      type: "MCQ",
      difficulty: 2 + (i % 4),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      targetsError: tagOf(choices),
      prompt: { text, image: img(emoji, label, null, nums[0]) },
      choices,
      answerKey,
      hints: ["Đọc kỹ: thêm vào hay bớt đi?", "Vẽ ra giấy nếu cần."],
      explanation: `${nums[0]} ${word} ${nums[1]} bằng ${ans}.`,
    });
  });
  facts.slice(0, 7).forEach((f, i) => {
    const ans = solve(f);
    const spoken = `${VI[f[0]]} ${word} ${VI[f[1]]}`;
    const { choices, answerKey } = around(
      ans,
      f.includes(0) && extraTag
        ? [extraTag, "dem_thua_1"]
        : ["lap_lai_tong", "dem_thieu_1", "dem_thua_1"],
      { repeat: f[0] },
      i,
      10,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 1 + (i % 5),
      targetsError: tagOf(choices),
      prompt: { text: listenPrompt(LISTEN, spoken, i) },
      listenTarget: { text: spoken },
      choices,
      answerKey,
      hints: [["Nghe lại rồi tính nhé."], ["Đếm trên ngón tay."]][i % 2],
      explanation: `${spoken} bằng ${VI[ans]}.`,
    });
  });
  facts.slice(1, 7).forEach((f, i) => {
    const ans = solve(f);
    const o = opp(f);
    const decoys = [
      { id: "x1", text: String(ans + 1), errorTag: "dem_thua_1" },
      ...(o >= 0 && o !== ans && o !== ans + 1
        ? [{ id: "x2", text: String(o), errorTag: "nham_cong_tru" }]
        : []),
    ];
    const uniq = decoys;
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      targetsError: "dem_thua_1",
      prompt: {
        text: `${f[0]} ${sign} ${f[1]} = ? ${["Kéo kết quả vào ô.", "Thẻ nào đúng? Kéo vào nhé!", "Điền số vào ô trống."][i % 3]}`,
      },
      dragItems: [{ id: "ok", text: String(ans) }, ...uniq],
      dropZones: [{ id: "o", label: "Kết quả", accepts: ["ok", ...uniq.map((d) => d.id)] }],
      answerKey: { o: ["ok"] },
      hints: ["Tính xong rồi mới kéo."],
      explanation: `${f[0]} ${sign} ${f[1]} = ${ans}.`,
      meta: { estSeconds: 35 },
    });
  });
  counts(
    add,
    stories
      .slice(0, 4)
      .map(([, nums, emoji, label]) => [emoji, label, op === "+" ? solve(nums) : nums[0]]),
    (l) => (op === "+" ? `Gộp lại rồi chạm đếm tất cả ${l}.` : `Chạm đếm số ${l} lúc đầu nhé.`),
  );
  readWrite(add, reads, writes);
  P.save();
}

arithmetic({
  code: "VMATH.SO.CONG_PV_5",
  prefix: "vmath-cong5",
  unit: "KNTT-T1-B10",
  op: "+",
  src: "SGK Toán 1 tập một, Bài 10 Phép cộng trong phạm vi 10 tr.56–67 (phần phạm vi 5)",
  note: "Cộng trong phạm vi 5 theo bài 10: gộp hai nhóm, đếm tiếp. Nhiễu tính từ đáp án.",
  facts: [
    [1, 1],
    [1, 2],
    [2, 1],
    [2, 2],
    [1, 3],
    [3, 1],
    [2, 3],
    [3, 2],
    [1, 4],
    [4, 1],
    [0, 3],
    [5, 0],
  ],
  stories: [
    ["Có 2 con cá, thêm 1 con. Có tất cả mấy con?", [2, 1], "🐟", "con cá"],
    ["Có 3 bông hoa, thêm 2 bông. Tất cả mấy bông?", [3, 2], "🌸", "bông hoa"],
    ["Có 1 quả táo, thêm 3 quả. Có tất cả mấy quả?", [1, 3], "🍎", "quả táo"],
    ["Có 2 con ong, 2 con bay tới. Có tất cả mấy con?", [2, 2], "🐝", "con ong"],
    ["Có 4 ngôi sao, thêm 1 ngôi sao. Tất cả mấy ngôi sao?", [4, 1], "⭐", "ngôi sao"],
    ["Có 3 ô tô, 1 ô tô đỗ thêm. Có tất cả mấy ô tô?", [3, 1], "🚗", "ô tô"],
  ],
  reads: [
    "hai cộng ba bằng năm",
    "một cộng bốn bằng năm",
    "hai cộng hai bằng bốn",
    "ba cộng một bằng bốn",
  ],
  writes: [
    ["Viết phép tính: 2 + 3 = … vào vở.", "2 + 3 = 5"],
    ["Viết phép tính: 4 + 1 = … vào vở.", "4 + 1 = 5"],
    ["Vẽ 2 quả táo và 2 quả táo, viết phép cộng.", "2 + 2 = 4"],
  ],
});
arithmetic({
  code: "VMATH.SO.CONG_VOI_0",
  prefix: "vmath-cong0",
  unit: "KNTT-T1-B10",
  op: "+",
  extraTag: "quen_so_0",
  src: "SGK Toán 1 tập một, Bài 10 tr.56–67 (cộng với 0)",
  note: "Cộng với 0: số nào cộng 0 cũng bằng chính nó. Ô '0' mang mã quen_so_0 — con nghĩ cộng với không thì ra không.",
  facts: [
    [3, 0],
    [0, 4],
    [5, 0],
    [0, 2],
    [7, 0],
    [0, 6],
    [1, 0],
    [0, 8],
    [9, 0],
    [0, 5],
    [0, 0],
    [10, 0],
  ],
  stories: [
    ["Có 4 quả táo, không thêm quả nào. Có tất cả mấy quả?", [4, 0], "🍎", "quả táo"],
    ["Có 3 con cá, không có con nào bơi tới. Có mấy con cá?", [3, 0], "🐟", "con cá"],
    ["Có 5 bông hoa, không thêm bông nào. Tất cả mấy bông?", [5, 0], "🌸", "bông hoa"],
    ["Có 2 ô tô, không có ô tô nào đỗ thêm. Có mấy ô tô?", [2, 0], "🚗", "ô tô"],
    ["Có 6 con ong, không thêm con nào. Có tất cả mấy con?", [6, 0], "🐝", "con ong"],
    ["Có 7 ngôi sao, không thêm ngôi sao nào. Có mấy ngôi sao?", [7, 0], "⭐", "ngôi sao"],
  ],
  reads: [
    "ba cộng không bằng ba",
    "không cộng năm bằng năm",
    "bảy cộng không bằng bảy",
    "không cộng không bằng không",
  ],
  writes: [
    ["Viết phép tính: 6 + 0 = … vào vở.", "6 + 0 = 6"],
    ["Viết phép tính: 0 + 9 = … vào vở.", "0 + 9 = 9"],
    ["Viết hai phép cộng với 0 mà con thích.", "4 + 0 = 4, 0 + 2 = 2"],
  ],
});
arithmetic({
  code: "VMATH.SO.TRU_PV_5",
  prefix: "vmath-tru5",
  unit: "KNTT-T1-B11",
  op: "-",
  src: "SGK Toán 1 tập một, Bài 11 Phép trừ trong phạm vi 10 tr.68–79 (phần phạm vi 5)",
  note: "Trừ trong phạm vi 5 theo bài 11: bớt đi, còn lại. Ô 'nham_cong_tru' là kết quả phép cộng.",
  facts: [
    [2, 1],
    [3, 1],
    [3, 2],
    [4, 1],
    [4, 2],
    [4, 3],
    [5, 1],
    [5, 2],
    [5, 3],
    [5, 4],
    [4, 4],
    [5, 0],
  ],
  stories: [
    ["Có 5 quả táo, ăn mất 2 quả. Còn lại mấy quả?", [5, 2], "🍎", "quả táo"],
    ["Có 4 con chim, 1 con bay đi. Còn lại mấy con?", [4, 1], "🐦", "con chim"],
    ["Có 3 quả bóng, 1 quả bay đi. Còn lại mấy quả?", [3, 1], "🎈", "quả bóng bay"],
    ["Có 5 con cá, 3 con bơi đi. Còn lại mấy con?", [5, 3], "🐟", "con cá"],
    ["Có 4 bông hoa, bớt 2 bông. Còn lại mấy bông?", [4, 2], "🌸", "bông hoa"],
    ["Có 5 ngôi sao, 4 ngôi sao tắt. Còn lại mấy ngôi sao?", [5, 4], "⭐", "ngôi sao"],
  ],
  reads: [
    "năm trừ hai bằng ba",
    "bốn trừ một bằng ba",
    "ba trừ hai bằng một",
    "năm trừ năm bằng không",
  ],
  writes: [
    ["Viết phép tính: 5 - 2 = … vào vở.", "5 - 2 = 3"],
    ["Viết phép tính: 4 - 3 = … vào vở.", "4 - 3 = 1"],
    ["Vẽ 5 quả táo, gạch 1 quả, viết phép trừ.", "5 - 1 = 4"],
  ],
});

// ─────────────────────────────────────────────────────────────── 6. Bài toán "thêm" ─────────
{
  const P = pack(
    "VMATH.GT.BAI_TOAN_THEM",
    "vmath-toanthem",
    "KNTT-T1-B10",
    ["KNTT-T1-B10", "KNTT-T1-B18", "KNTT-T1-B30"],
    "SGK Toán 1 tập một, Bài 10 tr.56 và Bài 18 (bài toán có lời văn dạng thêm)",
    "Bài toán 'thêm': đọc đề, chọn phép cộng, tính. Ô 'làm phép trừ' mang nham_cong_tru, ô 'chép lại số trong đề' mang lap_lai_tong.",
  );
  const add = P.add;
  const S = [
    ["Lan có 3 cái kẹo, mẹ cho thêm 2 cái. Lan có tất cả mấy cái kẹo?", [3, 2], "🍬", "cái kẹo"],
    ["Trên cây có 4 con chim, 3 con bay tới. Có tất cả mấy con chim?", [4, 3], "🐦", "con chim"],
    ["Bể có 5 con cá, thả thêm 4 con. Bể có tất cả mấy con cá?", [5, 4], "🐟", "con cá"],
    ["Có 6 quả bóng, mua thêm 2 quả. Có tất cả mấy quả bóng?", [6, 2], "⚽", "quả bóng"],
    ["Vườn có 2 cây cam, trồng thêm 5 cây. Có tất cả mấy cây?", [2, 5], "🌳", "cây cam"],
    ["Nam có 7 viên bi, được cho thêm 1 viên. Nam có tất cả mấy viên?", [7, 1], "🔵", "viên bi"],
    ["Có 3 bạn đang chơi, 3 bạn nữa đến chơi. Có tất cả mấy bạn?", [3, 3], "🧒", "bạn"],
    ["Lọ có 4 bông hoa, cắm thêm 4 bông. Lọ có tất cả mấy bông?", [4, 4], "🌸", "bông hoa"],
    ["Có 5 con gà, 5 con gà nữa chạy tới. Có tất cả mấy con gà?", [5, 5], "🐔", "con gà"],
    [
      "Mi có 1 quyển sách, được tặng thêm 6 quyển. Mi có tất cả mấy quyển?",
      [1, 6],
      "📖",
      "quyển sách",
    ],
    ["Có 8 quả táo, hái thêm 2 quả. Có tất cả mấy quả táo?", [8, 2], "🍎", "quả táo"],
    ["Có 2 con vịt, 7 con vịt bơi tới. Có tất cả mấy con vịt?", [2, 7], "🦆", "con vịt"],
  ];
  S.forEach(([text, [a, b], emoji, label], i) => {
    const ans = a + b;
    const kinds = [
      ["nham_cong_tru", "dem_thieu_1"],
      ["lap_lai_tong", "dem_thua_1"],
      ["khong_hieu_de_loi_van", "nham_cong_tru"],
    ][i % 3];
    const wrongs = [];
    for (const k of kinds) {
      const v = {
        nham_cong_tru: Math.abs(a - b),
        dem_thieu_1: ans - 1,
        dem_thua_1: ans + 1,
        lap_lai_tong: a,
        khong_hieu_de_loi_van: b,
      }[k];
      const tag = k === "khong_hieu_de_loi_van" && (v === a || v === b) ? "lap_lai_tong" : k;
      if (v === ans || wrongs.some((w) => w.text === String(v))) continue;
      if (k === "nham_cong_tru" && a < b) continue;
      wrongs.push({ text: String(v), errorTag: tag });
    }
    if (wrongs.length < 2) wrongs.push({ text: String(ans + 1), errorTag: "dem_thua_1" });
    const { choices, answerKey } = choicesOf({ text: String(ans) }, wrongs.slice(0, 2), i);
    add({
      type: "MCQ",
      difficulty: 2 + (i % 4),
      scaffold: i < 6 ? "model" : "none",
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      targetsError: tagOf(choices),
      prompt: { text, image: img(emoji, label, null, a) },
      choices,
      answerKey,
      hints: ["Chữ 'thêm' báo hiệu phép cộng.", `Lấy ${a} cộng ${b}.`],
      explanation: `${a} + ${b} = ${ans}.`,
    });
  });
  S.slice(0, 6).forEach(([, [a, b], , label], i) => {
    const cards = [
      { id: "cong", text: "+" },
      { id: "tru", text: "-", errorTag: "nham_cong_tru" },
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 3),
      targetsError: "nham_cong_tru",
      prompt: { text: `Có ${a} ${label}, thêm ${b} ${label}. Kéo dấu đúng: ${a} ? ${b}` },
      dragItems: cards,
      dropZones: [{ id: "dau", label: "Dấu", accepts: ["cong", "tru"] }],
      answerKey: { dau: ["cong"] },
      hints: ["Thêm vào thì số lượng nhiều lên."],
      explanation: `Thêm vào nên dùng dấu cộng: ${a} + ${b}.`,
      meta: { estSeconds: 40 },
    });
  });
  S.slice(0, 8).forEach(([, [a, b], , label], i) => {
    const spoken = `Có ${VI[a]} ${label}, thêm ${VI[b]} ${label}. Có tất cả mấy ${label}?`;
    const { choices, answerKey } = around(
      a + b,
      ["lap_lai_tong", "dem_thieu_1"],
      { repeat: a },
      i + 1,
      10,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 3 + (i % 3),
      targetsError: tagOf(choices),
      prompt: { text: listenPrompt(LISTEN, spoken, i) },
      listenTarget: { text: spoken },
      choices,
      answerKey,
      hints: [["Nghe lại đề, nhớ hai con số."], ["Thêm vào là cộng."]][i % 2],
      explanation: `${a} + ${b} = ${a + b}.`,
    });
  });
  counts(
    add,
    S.slice(0, 4).map(([, [a, b], emoji, label]) => [emoji, label, a + b]),
    (l) => `Chạm đếm tất cả ${l} sau khi thêm nhé!`,
  );
  readWrite(
    add,
    ["ba cộng hai bằng năm", "bốn thêm ba là bảy", "có tất cả tám quả táo"],
    [
      ["Viết phép tính cho bài: 3 cái kẹo thêm 2 cái.", "3 + 2 = 5"],
      ["Viết phép tính cho bài: 6 quả bóng thêm 2 quả.", "6 + 2 = 8"],
      ["Con tự nghĩ một bài toán thêm, viết phép tính.", "4 + 1 = 5"],
    ],
  );
  P.save();
}

// ──────────────────────────────────────────────────────────────────── 7–9. Hình học ──────────
const SHAPES = [
  ["hình tròn", "🔴", 0, 0],
  ["hình vuông", "🟦", 4, 4],
  ["hình tam giác", "🔺", 3, 3],
  ["hình chữ nhật", "▬", 4, 4],
];
{
  const P = pack(
    "VMATH.HH.HINH_VUONG_TRON_TAM_GIAC_CN",
    "vmath-hinh",
    "KNTT-T1-B07",
    ["KNTT-T1-B07", "KNTT-T1-B09", "KNTT-T1-B19"],
    "SGK Toán 1 tập một, Bài 7 tr.46–49",
    "Nhận dạng hình bằng kéo-thả; câu trắc nghiệm hỏi số cạnh, số góc, số hình — thứ đếm được và có mã lỗi đúng nghĩa.",
  );
  const add = P.add;
  [
    ["🔺", "hình tam giác", 3],
    ["🟦", "hình vuông", 4],
    ["🔴", "hình tròn", 5],
    ["🔺", "hình tam giác", 6],
    ["🟦", "hình vuông", 2],
    ["🔴", "hình tròn", 7],
    ["🔺", "hình tam giác", 4],
    ["🟦", "hình vuông", 5],
  ].forEach(([emoji, name, n], i) => {
    const { choices, answerKey } = around(n, ["dem_thieu_1", "dem_thua_1"], {}, i);
    add({
      type: "MCQ",
      difficulty: 1 + (i % 4),
      scaffold: i < 6 ? "model" : "none",
      targetsError: tagOf(choices),
      prompt: {
        text: [`Có mấy ${name}?`, `Đếm xem có bao nhiêu ${name}.`, `Tranh có mấy ${name}?`][i % 3],
        image: img(emoji, name, null, n),
      },
      choices,
      answerKey,
      hints: ["Chạm từng hình khi đếm."],
      explanation: `Có ${VI[n]} ${name}.`,
    });
  });
  [
    ["hình tam giác", 3, "cạnh"],
    ["hình vuông", 4, "cạnh"],
    ["hình chữ nhật", 4, "cạnh"],
    ["hình tam giác", 3, "góc"],
    ["hình vuông", 4, "góc"],
    ["hình chữ nhật", 4, "góc"],
  ].forEach(([name, n, part], i) => {
    const { choices, answerKey } = around(n, ["dem_thieu_1", "dem_thua_1"], {}, i + 1);
    add({
      type: "MCQ",
      difficulty: 2 + (i % 4),
      targetsError: tagOf(choices),
      prompt: {
        text: [
          `${name[0].toUpperCase()}${name.slice(1)} có mấy ${part}?`,
          `Đếm số ${part} của ${name} nhé.`,
        ][i % 2],
      },
      choices,
      answerKey,
      hints: [`Lấy tay chỉ vào từng ${part} rồi đếm.`],
      explanation: `${name[0].toUpperCase()}${name.slice(1)} có ${VI[n]} ${part}.`,
    });
  });
  {
    const { choices, answerKey } = choicesOf(
      { text: "0" },
      [{ text: "1", errorTag: "dem_thua_1" }, { text: "4" }],
      2,
    );
    add({
      type: "MCQ",
      difficulty: 4,
      targetsError: "dem_thua_1",
      prompt: { text: "Hình tròn có mấy góc?" },
      choices,
      answerKey,
      hints: ["Hình tròn không có chỗ nhọn nào."],
      explanation: "Hình tròn không có góc nào.",
    });
  }
  [
    ["🔺", "hình tam giác", 3],
    ["🟦", "hình vuông", 6],
    ["🔴", "hình tròn", 4],
    ["🔺", "hình tam giác", 5],
    ["🟦", "hình vuông", 3],
    ["🔴", "hình tròn", 6],
  ].forEach(([emoji, name, n], i) => {
    const { choices, answerKey } = around(n, ["dem_thua_1", "dem_thieu_1"], {}, i);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 2 + (i % 4),
      targetsError: tagOf(choices),
      prompt: { text: listenPrompt(LISTEN, name, i), image: img(emoji, name, null, n) },
      listenTarget: { text: `Có mấy ${name}?` },
      choices,
      answerKey,
      hints: [["Nghe câu hỏi rồi đếm hình."], ["Đếm chậm từng hình."]][i % 2],
      explanation: `Có ${VI[n]} ${name}.`,
    });
  });
  [
    [
      ["🔴", "đồng hồ"],
      ["🟦", "khăn tay vuông"],
    ],
    [
      ["🔺", "biển báo"],
      ["🔴", "cái đĩa"],
    ],
    [
      ["🟦", "viên gạch vuông"],
      ["🔺", "miếng bánh tam giác"],
    ],
    [
      ["🔴", "bánh xe"],
      ["🔺", "lá cờ đuôi nheo"],
    ],
    [
      ["🟦", "ô cửa sổ vuông"],
      ["🔴", "quả bóng"],
    ],
  ].forEach(([[e1, l1], [e2, l2]], i) => {
    const name = (e) => SHAPES.find((s) => s[1] === e)[0];
    add({
      type: "DRAG_DROP",
      difficulty: 1 + (i % 4),
      prompt: {
        text: [
          "Kéo mỗi đồ vật về đúng tên hình.",
          "Đồ vật này có dạng hình gì? Kéo vào nhé!",
          "Xếp đồ vật vào đúng ô hình.",
        ][i % 3],
      },
      dragItems: [
        { id: "v1", text: l1, image: img(e1, l1) },
        { id: "v2", text: l2, image: img(e2, l2) },
      ],
      dropZones: [
        { id: "h1", label: name(e1), accepts: ["v1", "v2"] },
        { id: "h2", label: name(e2), accepts: ["v1", "v2"] },
      ],
      answerKey: { h1: ["v1"], h2: ["v2"] },
      hints: ["Nhìn đồ vật có góc nhọn không, có mấy cạnh."],
      explanation: `${l1} có dạng ${name(e1)}, ${l2} có dạng ${name(e2)}.`,
      meta: { estSeconds: 40 },
    });
  });
  counts(
    add,
    [
      ["🔺", "hình tam giác", 5],
      ["🟦", "hình vuông", 4],
      ["🔴", "hình tròn", 6],
      ["🔺", "hình tam giác", 7],
    ],
    (l) => `Chạm để đếm ${l} nhé!`,
  );
  readWrite(
    add,
    ["hình tròn", "hình vuông có bốn cạnh", "hình tam giác có ba cạnh", "hình chữ nhật có bốn góc"],
    [
      ["Vẽ một hình vuông và một hình tròn vào vở.", "hình vuông, hình tròn"],
      ["Vẽ ngôi nhà bằng hình vuông và hình tam giác.", "mái tam giác, thân vuông"],
      ["Tìm 2 đồ vật hình tròn trong nhà, vẽ lại.", "đồng hồ, cái đĩa"],
    ],
  );
  P.save();
}
{
  const P = pack(
    "VMATH.HH.LAP_GHEP_XEP_HINH",
    "vmath-lapghep",
    "KNTT-T1-B08",
    ["KNTT-T1-B08"],
    "SGK Toán 1 tập một, Bài 8 Thực hành lắp ghép, xếp hình tr.50–53",
    "Lắp ghép, xếp hình bằng que tính và miếng ghép. Câu trắc nghiệm hỏi số que, số miếng — đếm được, có mã lỗi.",
  );
  const add = P.add;
  [
    ["Cần mấy que tính để xếp một hình tam giác?", 3],
    ["Cần mấy que tính để xếp một hình vuông?", 4],
    ["Xếp 2 hình tam giác rời nhau cần mấy que tính?", 6],
    ["Xếp 2 hình vuông rời nhau cần mấy que tính?", 8],
    ["Ghép mấy hình vuông nhỏ thì được hình vuông to 2 hàng 2 cột?", 4],
    ["Ghép 2 hình tam giác giống nhau được mấy hình vuông?", 1],
    ["Hình vuông bằng que tính, bỏ đi 1 que. Còn mấy que?", 3],
    ["Một hình tam giác và một hình vuông rời nhau cần mấy que?", 7],
    ["Ghép mấy hình vuông nhỏ thành một hàng dài 3 ô?", 3],
    ["Xếp 3 hình tam giác rời nhau cần mấy que tính?", 9],
    ["Có 5 que tính. Xếp một hình tam giác, còn thừa mấy que?", 2],
    ["Có 7 que tính. Xếp một hình vuông, còn thừa mấy que?", 3],
    ["Hình tam giác bằng que tính, thêm 1 que. Tất cả mấy que?", 4],
  ].forEach(([q, n], i) => {
    const { choices, answerKey } = around(n, ["dem_thieu_1", "dem_thua_1"], {}, i, 12);
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      scaffold: i < 6 ? "model" : "none",
      targetsError: tagOf(choices),
      prompt: { text: q, image: img("🥢", "que tính") },
      choices,
      answerKey,
      hints: ["Mỗi cạnh là một que tính.", "Vẽ ra giấy rồi đếm cạnh."],
      explanation: `Cần ${n}.`,
    });
  });
  [3, 4, 6, 8, 5, 7].forEach((n, i) => {
    const spoken = `Có ${VI[n] ?? n} que tính. Con đếm lại xem có mấy que?`;
    const { choices, answerKey } = around(n, ["dem_thieu_1", "dem_thua_1"], {}, i + 1, 12);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 1 + (i % 4),
      targetsError: tagOf(choices),
      prompt: { text: listenPrompt(LISTEN, spoken, i), image: img("🥢", "que tính", null, n) },
      listenTarget: { text: "Có mấy que tính?" },
      choices,
      answerKey,
      hints: [["Đếm từng que một."], ["Chạm vào từng que khi đếm."]][i % 2],
      explanation: `Có ${VI[n] ?? n} que tính.`,
    });
  });
  [
    ["hình vuông", "🟦", "hình tam giác", "🔺"],
    ["hình tròn", "🔴", "hình vuông", "🟦"],
    ["hình tam giác", "🔺", "hình tròn", "🔴"],
    ["hình vuông", "🟦", "hình tròn", "🔴"],
    ["hình tam giác", "🔺", "hình vuông", "🟦"],
    ["hình tròn", "🔴", "hình tam giác", "🔺"],
  ].forEach(([n1, e1, n2, e2], i) => {
    const cards = [
      { id: "a1", image: img(e1, n1), text: n1 },
      { id: "b1", image: img(e2, n2), text: n2 },
      { id: "a2", image: img(e1, n1, null, 2), text: `2 ${n1}` },
      { id: "b2", image: img(e2, n2, null, 2), text: `2 ${n2}` },
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      prompt: {
        text: [
          "Xếp các miếng ghép vào đúng hộp hình.",
          "Miếng nào về hộp nào? Kéo nhé!",
          "Phân loại miếng ghép theo hình.",
        ][i % 3],
      },
      dragItems: cards,
      dropZones: [
        { id: "h1", label: `Hộp ${n1}`, accepts: ["a1", "b1", "a2", "b2"] },
        { id: "h2", label: `Hộp ${n2}`, accepts: ["a1", "b1", "a2", "b2"] },
      ],
      answerKey: { h1: ["a1", "a2"], h2: ["b1", "b2"] },
      hints: ["Nhìn số góc của miếng ghép."],
      explanation: `Miếng ${n1} về hộp ${n1}.`,
      meta: { estSeconds: 45 },
    });
  });
  counts(
    add,
    [
      ["🥢", "que tính", 6],
      ["🟦", "miếng ghép vuông", 4],
      ["🔺", "miếng ghép tam giác", 5],
      ["🥢", "que tính", 8],
    ],
    (l) => `Chạm đếm ${l} nhé!`,
  );
  readWrite(
    add,
    ["ba que tính xếp hình tam giác", "bốn que tính xếp hình vuông", "ghép hình thành ngôi nhà"],
    [
      ["Dùng que tính xếp một hình tam giác rồi chụp lại.", "hình tam giác 3 que"],
      ["Dùng que tính xếp một hình vuông rồi chụp lại.", "hình vuông 4 que"],
      ["Xếp que tính thành ngôi nhà, đếm số que, chụp lại.", "ngôi nhà 7 que"],
      ["Cắt giấy ghép thành con cá, chụp cho ba mẹ xem.", "con cá bằng hình tam giác"],
    ],
  );
  P.save();
}
{
  const P = pack(
    "VMATH.HH.NHAN_DANG_HINH_THUC_TE",
    "vmath-hinhthucte",
    "KNTT-T1-B09",
    ["KNTT-T1-B09", "KNTT-T1-B16"],
    "SGK Toán 1 tập một, Bài 9 Luyện tập chung tr.54–55",
    "Nhận dạng hình trong đồ vật thật. Trắc nghiệm hỏi số cạnh, số góc của đồ vật; nhận dạng tên hình bằng kéo-thả.",
  );
  const add = P.add;
  const OBJ = [
    ["⚠️", "biển báo nguy hiểm", "hình tam giác", 3],
    ["🕐", "mặt đồng hồ", "hình tròn", 0],
    ["🖼️", "khung tranh", "hình chữ nhật", 4],
    ["🧇", "cái bánh vuông", "hình vuông", 4],
    ["📐", "cái ê ke", "hình tam giác", 3],
    ["🍪", "cái bánh quy", "hình tròn", 0],
    ["📱", "cái điện thoại", "hình chữ nhật", 4],
    ["🔲", "viên gạch hoa", "hình vuông", 4],
    ["🚪", "cánh cửa", "hình chữ nhật", 4],
    ["⚽", "quả bóng", "hình tròn", 0],
    ["✉️", "cái phong bì", "hình chữ nhật", 4],
    ["🚩", "lá cờ đuôi nheo", "hình tam giác", 3],
  ];
  OBJ.filter((o) => o[3] > 0).forEach(([emoji, label, shape, n], i) => {
    const { choices, answerKey } = around(n, ["dem_thieu_1", "dem_thua_1"], {}, i);
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      scaffold: i < 6 ? "model" : "none",
      targetsError: tagOf(choices),
      prompt: {
        text: [
          `${label[0].toUpperCase()}${label.slice(1)} có mấy góc?`,
          `Đếm số cạnh của ${label} nhé.`,
        ][i % 2],
        image: img(emoji, label, null, 1),
      },
      choices,
      answerKey,
      hints: [`${label[0].toUpperCase()}${label.slice(1)} có dạng ${shape}.`],
      explanation: `${label[0].toUpperCase()}${label.slice(1)} có dạng ${shape}, có ${VI[n]} ${i % 2 === 0 ? "góc" : "cạnh"}.`,
    });
  });
  OBJ.filter((o) => o[3] === 0).forEach(([emoji, label], i) => {
    const { choices, answerKey } = choicesOf(
      { text: "0" },
      [{ text: "1", errorTag: "dem_thua_1" }, { text: "4" }],
      i,
    );
    add({
      type: "MCQ",
      difficulty: 3 + i,
      targetsError: "dem_thua_1",
      prompt: {
        text: `${label[0].toUpperCase()}${label.slice(1)} có mấy góc?`,
        image: img(emoji, label, null, 1),
      },
      choices,
      answerKey,
      hints: ["Hình tròn không có chỗ nhọn nào."],
      explanation: `${label[0].toUpperCase()}${label.slice(1)} có dạng hình tròn, không có góc.`,
    });
  });
  OBJ.filter((o) => o[3] > 0)
    .slice(0, 6)
    .forEach(([emoji, label, shape, n], i) => {
      const { choices, answerKey } = around(n, ["dem_thua_1", "dem_thieu_1"], {}, i + 1);
      add({
        type: "LISTEN_CHOOSE",
        difficulty: 2 + (i % 4),
        targetsError: tagOf(choices),
        prompt: { text: listenPrompt(LISTEN, label, i), image: img(emoji, label, null, 1) },
        listenTarget: { text: `Đồ vật này có mấy cạnh?` },
        choices,
        answerKey,
        hints: [["Nghe câu hỏi, chỉ tay vào từng cạnh."], ["Đồ vật có dạng hình gì trước đã."]][
          i % 2
        ],
        explanation: `${label[0].toUpperCase()}${label.slice(1)} có dạng ${shape}, có ${VI[n]} cạnh.`,
      });
    });
  for (let i = 0; i < 8; i++) {
    const a = at(OBJ, i);
    const b = OBJ.find((o, k) => k > i && o[2] !== a[2]) ?? OBJ.find((o) => o[2] !== a[2]);
    add({
      type: "DRAG_DROP",
      difficulty: 1 + (i % 5),
      prompt: {
        text: [
          "Đồ vật này có dạng hình gì? Kéo vào nhé!",
          "Kéo mỗi đồ vật về đúng tên hình.",
          "Xếp đồ vật vào ô hình của nó.",
        ][i % 3],
      },
      dragItems: [
        { id: "v1", text: b[1], image: img(b[0], b[1]) },
        { id: "v2", text: a[1], image: img(a[0], a[1]) },
      ],
      dropZones: [
        { id: "h1", label: a[2], accepts: ["v1", "v2"] },
        { id: "h2", label: b[2], accepts: ["v1", "v2"] },
      ],
      answerKey: { h1: ["v2"], h2: ["v1"] },
      hints: ["Nhìn xem đồ vật có góc không, có mấy cạnh."],
      explanation: `${a[1]} có dạng ${a[2]}, ${b[1]} có dạng ${b[2]}.`,
      meta: { estSeconds: 40 },
    });
  }
  counts(
    add,
    [
      ["🍪", "cái bánh tròn", 5],
      ["🖼️", "khung tranh", 3],
      ["⚠️", "biển báo tam giác", 4],
      ["🔲", "viên gạch vuông", 6],
    ],
    (l) => `Chạm đếm ${l} nhé!`,
  );
  readWrite(
    add,
    [
      "mặt đồng hồ có dạng hình tròn",
      "cánh cửa có dạng hình chữ nhật",
      "biển báo có dạng hình tam giác",
    ],
    [
      ["Tìm một đồ vật hình vuông trong nhà, vẽ lại.", "viên gạch"],
      ["Tìm một đồ vật hình chữ nhật, vẽ và ghi tên.", "quyển sách"],
      ["Vẽ 3 đồ vật hình tròn con thấy hôm nay.", "đồng hồ, bánh xe, cái đĩa"],
    ],
  );
  P.save();
}
