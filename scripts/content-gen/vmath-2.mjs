/**
 * Toán 1 — ba gói của bài 1–6 còn trống: thứ tự số (liền trước, liền sau), đọc và viết số 0–10,
 * các số từ 1 đến 10 tổng hợp. Lớp đang ở bài 2–3 (nhật ký 12/09 ghi "Các số 6, 7, 8, 9, 10"), bài
 * 4–6 là hai tuần tới.
 *
 * Dạng bài lấy từ SGK Toán 1 tập một: đoàn tàu số "2 3 4 / 3 ? 5" (tr.40), bể cá "có bao nhiêu con
 * cá?" (tr.38), điền dấu ">; <; =" (tr.29, tr.42). Trang sách = ảnh PDF − 1.
 *
 * Nhiễu tính ra từ đáp án như gói English Maths, nên thẻ lỗi không thể gắn sai.
 * Gói hình phẳng (bài 7) **chưa soạn**: bộ mã lỗi không có mã nào cho "gọi nhầm tên hình", mà Toán
 * bắt buộc mọi câu trắc nghiệm có ô nhiễu mang mã — bịa mã là gắn thẻ theo thói quen.
 *
 *   node scripts/content-gen/vmath-2.mjs
 */
import { choicesOf, ex, img, listenPrompt, numberId, writePack } from "./lib.mjs";

const VI = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười"];
const LISTEN = [
  "Nghe rồi chọn số đúng nhé!",
  "{ban} đọc một số, con chọn ô đúng.",
  "Nghe kỹ rồi chỉ vào số con vừa nghe.",
  "Con nghe rồi tìm đúng số nhé!",
  "Lắng nghe rồi chọn ô đúng.",
  "Nghe lần nữa rồi chọn số.",
];
const READ = [
  "Con đọc to các số này nhé!",
  "Đọc chậm từng số cho {ban} nghe.",
  "Đọc to dãy số này nhé!",
  "Con đọc cho cả nhà cùng nghe.",
  "Đọc rõ từng số nhé!",
  "Cùng đọc to nào!",
];
const HINT_LISTEN = [
  ["Nghe lại một lần nữa nhé!"],
  ["Đếm trên ngón tay tới số con nghe."],
  ["Nhắm mắt nghe rồi hãy chọn."],
  ["Nghe cả phần cuối của số."],
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
];

/** Ô nhiễu quanh một đáp án số, mã lỗi tính từ chính con số. */
function around(answer, kinds, given, slot) {
  const wrongs = [];
  for (const k of kinds) {
    const v =
      k === "dem_thieu_1"
        ? answer - 1
        : k === "dem_thua_1"
          ? answer + 1
          : k === "lap_lai_tong"
            ? given.repeat
            : k === "nham_thu_tu_so"
              ? given.order
              : null;
    if (v == null || v < 0 || v > 10 || v === answer || wrongs.some((w) => w.text === String(v)))
      continue;
    wrongs.push({ text: String(v), errorTag: k });
    if (wrongs.length === 2) break;
  }
  if (wrongs.length === 0)
    wrongs.push({
      text: String(answer === 0 ? 1 : answer - 1),
      errorTag: answer === 0 ? "dem_thua_1" : "dem_thieu_1",
    });
  return choicesOf({ text: String(answer) }, wrongs, slot);
}

function packOf(code, lessonRefs, note, list) {
  writePack(`content/exercises/vmath/${code.split(".").slice(1).join(".")}.pack.json`, {
    skillCode: code,
    subject: "VMATH",
    generatedBy: "claude-code",
    promptVersion: "exercise-gen-v2",
    lessonRefs,
    note,
    exercises: list,
  });
}

function maker(prefix, code, unit, source) {
  const list = [];
  let n = 0;
  return {
    list,
    meta: (s) => ({ estSeconds: s, lessonUnitCode: unit, sourceRef: source }),
    add: (e) => {
      n += 1;
      list.push(ex({ id: numberId(prefix, n), language: "vi", skillCodes: [code], ...e }));
    },
  };
}

// ═══════════════════════════════════════════════════════════════════ 1. Thứ tự số ═══════════
{
  const code = "VMATH.SO.THU_TU_SO";
  const { list, add, meta } = maker(
    "vmath-thutu",
    code,
    "KNTT-T1-B06",
    "SGK Toán 1 tập một, Bài 6 tr.40 (đoàn tàu số) và Bài 4 tr.24",
  );

  // ① Số liền sau / liền trước — ô nhiễu là số ở phía bên kia (nhầm thứ tự) và số lệch hai bậc.
  [3, 5, 7, 2, 8, 6, 4, 9, 1, 5, 6, 2].forEach((v, i) => {
    const after = i % 2 === 0;
    const answer = after ? v + 1 : v - 1;
    const other = after ? v - 1 : v + 1;
    const { choices, answerKey } = around(
      answer,
      ["nham_thu_tu_so", after ? "dem_thua_1" : "dem_thieu_1"],
      { order: other },
      i,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 4),
      scaffold: i < 6 ? "model" : "none",
      targetsError: "nham_thu_tu_so",
      prompt: {
        text: after
          ? [
              `Số liền sau của ${v} là số nào?`,
              `Đếm tiếp sau ${v} là số mấy?`,
              `Sau số ${v} là số nào nhỉ?`,
            ][i % 3]
          : [
              `Số liền trước của ${v} là số nào?`,
              `Số đứng liền trước ${v} là số mấy?`,
              `Trước số ${v} là số nào nhỉ?`,
            ][i % 3],
      },
      choices,
      answerKey,
      hints: [
        after ? `Đếm tiếp từ ${v} thêm một số.` : `Đếm lùi từ ${v} một số.`,
        "Liền sau thì lớn hơn một, liền trước thì bé hơn một.",
      ],
      explanation: after
        ? `Số liền sau của ${v} là ${answer}.`
        : `Số liền trước của ${v} là ${answer}.`,
      meta: meta(22),
    });
  });

  // ② Đoàn tàu thiếu một toa — đúng bài 1 trang 40.
  [
    [3, 5],
    [4, 6],
    [7, 9],
    [8, 10],
    [0, 2],
    [5, 7],
    [1, 3],
    [6, 8],
  ].forEach(([a, b], i) => {
    const answer = a + 1;
    const { choices, answerKey } = around(
      answer,
      ["lap_lai_tong", "dem_thua_1"],
      { repeat: a },
      i + 1,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      assetTheme: i % 2 === 0 ? "robot" : "garden",
      targetsError: "lap_lai_tong",
      prompt: {
        text: `Đoàn tàu số: ${a}, ?, ${b}. Toa ở giữa là số mấy?`,
        image: img("🚂", "đoàn tàu"),
      },
      choices,
      answerKey,
      hints: [`Đếm từ ${a} tới ${b}.`, "Số ở giữa đứng ngay sau số đầu."],
      explanation: `${a}, ${answer}, ${b}.`,
      meta: meta(28),
    });
  });

  // ③ Nghe số, chọn số liền sau.
  [2, 4, 5, 7, 8, 9].forEach((v, i) => {
    const spoken = `số liền sau của ${VI[v]}`;
    const { choices, answerKey } = around(
      v + 1,
      ["nham_thu_tu_so", "dem_thua_1"],
      { order: v - 1 },
      i,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 2 + (i % 4),
      targetsError: "nham_thu_tu_so",
      prompt: { text: listenPrompt(LISTEN, spoken, i) },
      listenTarget: { text: spoken },
      choices,
      answerKey,
      hints: HINT_LISTEN[i % 4],
      explanation: `Số liền sau của ${v} là ${v + 1}.`,
      meta: meta(25),
    });
  });

  // ④ Xếp ba số từ bé đến lớn.
  [
    [2, 5, 8],
    [1, 4, 6],
    [3, 7, 9],
    [0, 5, 10],
    [4, 6, 7],
    [2, 3, 9],
  ].forEach((row, i) => {
    const cards = [
      { id: "s1", text: String(row[2]) },
      { id: "s2", text: String(row[0]) },
      { id: "s3", text: String(row[1]) },
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      prompt: {
        text: [
          "Xếp các số theo thứ tự từ bé đến lớn.",
          "Kéo ba số vào ô, số bé nhất đứng đầu.",
          "Ai bé nhất đứng trước nhé!",
        ][i % 3],
      },
      dragItems: cards,
      dropZones: [
        { id: "o1", label: "Thứ nhất", accepts: ["s1", "s2", "s3"] },
        { id: "o2", label: "Thứ hai", accepts: ["s1", "s2", "s3"] },
        { id: "o3", label: "Thứ ba", accepts: ["s1", "s2", "s3"] },
      ],
      answerKey: { o1: ["s2"], o2: ["s3"], o3: ["s1"] },
      hints: ["Tìm số bé nhất trước, rồi số lớn nhất."],
      explanation: `${row[0]}, ${row[1]}, ${row[2]}.`,
      meta: meta(40),
    });
  });

  // ⑤ Số nào lớn hơn cả trong ba số — ô nhiễu là số bé nhất (so ngược).
  [
    [4, 7, 2],
    [9, 3, 6],
    [5, 8, 1],
    [6, 10, 7],
  ].forEach((row, i) => {
    const max = Math.max(...row);
    const min = Math.min(...row);
    const mid = row.find((x) => x !== max && x !== min);
    const { choices, answerKey } = choicesOf(
      { text: String(max) },
      [{ text: String(min), errorTag: "so_sanh_nguoc" }, { text: String(mid) }],
      i,
    );
    add({
      type: "MCQ",
      difficulty: 3 + (i % 3),
      targetsError: "so_sanh_nguoc",
      prompt: { text: `Trong ba số ${row.join(", ")}, số nào lớn hơn cả?` },
      choices,
      answerKey,
      hints: ["Đếm lần lượt, số nào đếm tới sau cùng thì lớn nhất."],
      explanation: `${max} lớn hơn cả.`,
      meta: meta(28),
    });
  });

  // ⑥ Đọc to dãy số, ⑦ viết vào vở.
  [
    "một hai ba bốn năm",
    "sáu bảy tám chín mười",
    "mười chín tám bảy sáu",
    "năm bốn ba hai một không",
  ].forEach((r, i) => {
    const words = r.split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: i < 2 ? 2 : 4,
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: r, words },
      answerKey: { words },
      hints: [i < 2 ? "Đếm xuôi từng số một." : "Đếm lùi, chậm thôi nhé!"],
      explanation: `Dãy số đọc là "${r}".`,
      meta: meta(25),
    });
  });
  [
    ["2, 3, 4", "Viết số liền sau của 2 và của 3"],
    ["7, 8, 9", "Viết số còn thiếu: 7, …, 9"],
    ["10, 9, 8", "Viết ba số đếm lùi từ 10"],
  ].forEach(([sample, text], i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 3 + i,
      prompt: { text: `${text} vào vở nhé!` },
      rubric: {
        criteria: ["Viết đúng các số", "Đúng thứ tự", "Chữ số viết đúng chiều"],
        sampleAnswers: [sample],
      },
      answerKey: null,
      hints: ["Đếm thành tiếng rồi mới viết."],
      explanation: `Đáp án: ${sample}.`,
      meta: meta(60),
    });
  });

  packOf(
    code,
    ["KNTT-T1-B04", "KNTT-T1-B06"],
    "Thứ tự số: liền trước, liền sau, số còn thiếu, xếp bé → lớn. Ô nhiễu 'nhầm liền trước với liền sau' mang mã nham_thu_tu_so; chép lại số có sẵn trên đoàn tàu mang mã lap_lai_tong.",
    list,
  );
}

// ═══════════════════════════════════════════════════════════ 2. Đọc và viết số 0–10 ═══════════
{
  const code = "VMATH.SO.DOC_VIET_SO_0_10";
  const { list, add, meta } = maker(
    "vmath-docviet",
    code,
    "KNTT-T1-B02",
    "SGK Toán 1 tập một, Bài 1 tr.8 và Bài 2 tr.14",
  );

  // ① Số đọc là gì — ô nhiễu là tên số bên cạnh.
  [0, 3, 5, 7, 9, 10, 4, 6, 8, 2].forEach((v, i) => {
    const wrongs = [];
    if (v > 0) wrongs.push({ text: VI[v - 1], errorTag: "dem_thieu_1" });
    if (v < 10) wrongs.push({ text: VI[v + 1], errorTag: "dem_thua_1" });
    const { choices, answerKey } = choicesOf({ text: VI[v] }, wrongs.slice(0, 2), i);
    add({
      type: "MCQ",
      difficulty: 1 + (i % 4),
      scaffold: i < 6 ? "model" : "none",
      targetsError: wrongs[0].errorTag,
      prompt: {
        text: [
          `Số ${v} đọc là gì?`,
          `Đố con: số ${v} đọc thế nào?`,
          `Chọn cách đọc đúng của số ${v}.`,
        ][i % 3],
      },
      choices,
      answerKey,
      hints: ["Đếm từ không tới số đó nhé.", "Đọc to từng số trên ngón tay."],
      explanation: `Số ${v} đọc là "${VI[v]}".`,
      meta: meta(20),
    });
  });

  // ② Nghe tên số, chọn chữ số. 6 và 9 là cặp trẻ hay viết/đọc ngược.
  [6, 9, 3, 8, 1, 7, 5, 2].forEach((v, i) => {
    const flip = v === 6 ? 9 : v === 9 ? 6 : null;
    const wrongs = flip
      ? [
          { text: String(flip), errorTag: "viet_nguoc_so" },
          { text: String(v - 1), errorTag: "dem_thieu_1" },
        ]
      : [
          { text: String(v + 1), errorTag: "dem_thua_1" },
          { text: String(v - 1), errorTag: "dem_thieu_1" },
        ];
    const { choices, answerKey } = choicesOf({ text: String(v) }, wrongs, i);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 1 + (i % 5),
      scaffold: i < 2 ? "model" : "none",
      targetsError: wrongs[0].errorTag,
      prompt: { text: listenPrompt(LISTEN, VI[v], i) },
      listenTarget: { text: VI[v] },
      choices,
      answerKey,
      hints: HINT_LISTEN[i % 4],
      explanation: `"${VI[v]}" viết là số ${v}.`,
      meta: meta(20),
    });
  });

  // ③ Viết số theo tên — "Tám viết là số nào?"
  [8, 4, 10, 0, 6, 9].forEach((v, i) => {
    const { choices, answerKey } = around(v, ["dem_thieu_1", "dem_thua_1"], {}, i + 2);
    add({
      type: "MCQ",
      difficulty: 2 + (i % 4),
      targetsError: choices.find((c) => c.errorTag)?.errorTag ?? null,
      prompt: { text: `Số "${VI[v]}" viết là số nào?` },
      choices,
      answerKey,
      hints: ["Đếm trên ngón tay tới số đó."],
      explanation: `"${VI[v]}" viết là ${v}.`,
      meta: meta(22),
    });
  });

  // ④ Nối chữ số với tên số.
  [
    [2, 7],
    [4, 9],
    [0, 5],
    [3, 8],
    [1, 6],
    [6, 10],
  ].forEach(([a, b], i) => {
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      prompt: {
        text: [
          "Kéo mỗi tên số về đúng chữ số.",
          "Nối tên số với số của nó nhé!",
          "Tên số nào về ô nào?",
        ][i % 3],
      },
      dragItems: [
        { id: "t1", text: VI[b] },
        { id: "t2", text: VI[a] },
      ],
      dropZones: [
        { id: "n1", label: String(a), accepts: ["t1", "t2"] },
        { id: "n2", label: String(b), accepts: ["t1", "t2"] },
      ],
      answerKey: { n1: ["t2"], n2: ["t1"] },
      hints: ["Đọc to từng thẻ rồi hãy kéo."],
      explanation: `${a} là "${VI[a]}", ${b} là "${VI[b]}".`,
      meta: meta(35),
    });
  });

  // ⑤ Đếm rồi viết — số lượng thật trên tranh, như bài bể cá trang 38.
  [3, 7, 5, 9, 6].forEach((v, i) => {
    const [emoji, label] = THINGS[i];
    add({
      type: "COUNT_TAP",
      difficulty: 1 + (i % 5),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      prompt: { text: `Chạm để đếm ${label} nhé!` },
      countTarget: {
        objects: img(emoji, label, null, v),
        correctCount: v,
        layout: i % 2 === 0 ? "grid" : "line",
      },
      answerKey: v,
      hints: ["Chạm từng cái và đếm to lên."],
      explanation: `Có ${VI[v]} ${label}.`,
      meta: meta(30),
    });
  });

  // ⑥ Đọc to, ⑦ viết vào vở.
  ["không một hai", "ba bốn năm sáu", "bảy tám chín mười", "mười chín tám"].forEach((r, i) => {
    const words = r.split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: 2 + (i % 3),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: r, words },
      answerKey: { words },
      hints: ["Đọc rõ từng số."],
      explanation: `Đọc là "${r}".`,
      meta: meta(22),
    });
  });
  [
    ["0 1 2 3 4 5", "Viết các số từ 0 đến 5"],
    ["6 7 8 9 10", "Viết các số từ 6 đến 10"],
    ["7 9", "Viết số bảy và số chín"],
  ].forEach(([sample, text], i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 3 + i,
      prompt: { text: `${text} vào vở nhé!` },
      rubric: {
        criteria: ["Viết đủ các số", "Chữ số viết đúng chiều, không ngược", "Đúng độ cao ô li"],
        sampleAnswers: [sample],
      },
      answerKey: null,
      hints: ["Nhìn mẫu số trong sách rồi viết theo."],
      explanation: `Đáp án: ${sample}.`,
      meta: meta(70),
    });
  });

  packOf(
    code,
    ["KNTT-T1-B01", "KNTT-T1-B02"],
    "Đọc và viết số 0–10. Cặp 6 / 9 là cặp trẻ hay xoay ngược nên có mã viet_nguoc_so; các ô còn lại lệch một bậc (dem_thieu_1, dem_thua_1).",
    list,
  );
}

// ══════════════════════════════════════════════════════ 3. Các số từ 1 đến 10 (tổng hợp) ═════
{
  const code = "VMATH.SO.SO_1_10";
  const { list, add, meta } = maker(
    "vmath-so110",
    code,
    "KNTT-T1-B06",
    "SGK Toán 1 tập một, Bài 6 Luyện tập chung tr.38–45",
  );

  // ① Bể cá có bao nhiêu con — trang 38.
  [3, 5, 1, 6, 2, 4, 8, 7, 9, 10].forEach((v, i) => {
    const [emoji, label] = THINGS[i % THINGS.length];
    const { choices, answerKey } = around(v, ["dem_thieu_1", "dem_thua_1"], {}, i);
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      scaffold: i < 6 ? "model" : "none",
      targetsError: "dem_thieu_1",
      prompt: {
        text: [`Có bao nhiêu ${label}?`, `Đếm xem có mấy ${label} nhé!`, `Tranh có mấy ${label}?`][
          i % 3
        ],
        image: img(emoji, label, null, v),
      },
      choices,
      answerKey,
      hints: ["Chạm từng cái khi đếm để không sót."],
      explanation: `Có ${v} ${label}.`,
      meta: meta(25),
    });
  });

  // ② Điền dấu > < = — trang 42.
  [
    [1, 2],
    [6, 5],
    [4, 4],
    [8, 7],
    [10, 5],
    [2, 3],
    [9, 9],
    [3, 7],
  ].forEach(([a, b], i) => {
    const right = a > b ? ">" : a < b ? "<" : "=";
    const wrong = right === ">" ? "<" : right === "<" ? ">" : "<";
    const { choices, answerKey } = choicesOf(
      { text: right },
      [{ text: wrong, errorTag: "nham_dau_lon_be" }, { text: right === "=" ? ">" : "=" }],
      i,
    );
    add({
      type: "MCQ",
      difficulty: 2 + (i % 4),
      targetsError: "nham_dau_lon_be",
      prompt: { text: `Điền dấu thích hợp: ${a} ? ${b}` },
      choices,
      answerKey,
      hints: ["Miệng dấu luôn há về phía số lớn hơn.", "Hai số bằng nhau thì dùng dấu bằng."],
      explanation: `${a} ${right} ${b}.`,
      meta: meta(25),
    });
  });

  // ③ Mấy và mấy — ô nhiễu là chép lại số trong đề.
  [
    [2, 5],
    [3, 7],
    [4, 6],
    [1, 8],
    [5, 10],
    [6, 9],
  ].forEach(([part, whole], i) => {
    const answer = whole - part;
    const { choices, answerKey } = around(
      answer,
      ["lap_lai_tong", "dem_thieu_1"],
      { repeat: whole },
      i,
    );
    add({
      type: "MCQ",
      difficulty: 3 + (i % 3),
      targetsError: "lap_lai_tong",
      prompt: { text: `${part} và mấy được ${whole}?` },
      choices,
      answerKey,
      hints: [`Đếm tiếp từ ${part} tới ${whole}.`],
      explanation: `${part} và ${answer} được ${whole}.`,
      meta: meta(28),
    });
  });

  // ④ Nghe số, chọn số.
  [4, 7, 10, 2, 9, 5].forEach((v, i) => {
    const { choices, answerKey } = around(v, ["dem_thua_1", "dem_thieu_1"], {}, i + 1);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 1 + (i % 4),
      targetsError: choices.find((c) => c.errorTag)?.errorTag ?? null,
      prompt: { text: listenPrompt(LISTEN, VI[v], i) },
      listenTarget: { text: VI[v] },
      choices,
      answerKey,
      hints: HINT_LISTEN[i % 4],
      explanation: `Con vừa nghe số ${v}.`,
      meta: meta(20),
    });
  });

  // ⑤ Kéo số vào đúng giỏ: bé hơn 5 / lớn hơn 5.
  [
    [2, 8, 4, 9],
    [1, 6, 3, 10],
    [0, 7, 4, 6],
    [3, 9, 2, 8],
  ].forEach(([s1, b1, s2, b2], i) => {
    const cards = [
      { id: "c1", text: String(s1) },
      { id: "c2", text: String(b1) },
      { id: "c3", text: String(s2) },
      { id: "c4", text: String(b2) },
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      prompt: {
        text: ["Xếp số vào giỏ: bé hơn 5 hay lớn hơn 5.", "Số nào bé hơn 5, số nào lớn hơn 5?"][
          i % 2
        ],
      },
      dragItems: cards,
      dropZones: [
        { id: "be", label: "Bé hơn 5", accepts: ["c1", "c2", "c3", "c4"] },
        { id: "lon", label: "Lớn hơn 5", accepts: ["c1", "c2", "c3", "c4"] },
      ],
      answerKey: { be: ["c1", "c3"], lon: ["c2", "c4"] },
      hints: ["Đếm tới 5 rồi xem số đứng trước hay sau."],
      explanation: `${s1} và ${s2} bé hơn 5.`,
      meta: meta(40),
    });
  });

  // ⑥ Đếm, ⑦ đọc to, ⑧ viết.
  [6, 4, 9, 7].forEach((v, i) => {
    const [emoji, label] = THINGS[(i + 3) % THINGS.length];
    add({
      type: "COUNT_TAP",
      difficulty: 1 + i,
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      prompt: { text: `Trong bể có mấy ${label}? Chạm để đếm.` },
      countTarget: { objects: img(emoji, label, null, v), correctCount: v, layout: "grid" },
      answerKey: v,
      hints: ["Đếm theo hàng từ trái sang phải."],
      explanation: `Có ${v} ${label}.`,
      meta: meta(30),
    });
  });
  ["sáu lớn hơn năm", "hai bé hơn ba", "bốn bằng bốn", "ba và hai được năm"].forEach((r, i) => {
    const words = r.split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: 2 + (i % 3),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[(i + 2) % 6] },
      readTarget: { text: r, words },
      answerKey: { words },
      hints: ["Đọc chậm, rõ từng tiếng."],
      explanation: `Câu này đọc là "${r}".`,
      meta: meta(22),
    });
  });
  [
    ["6 > 5", "Viết dấu thích hợp: 6 … 5"],
    ["3 và 4 được 7", "Viết: 3 và … được 7"],
    ["8 9 10", "Viết ba số liền nhau bắt đầu từ 8"],
  ].forEach(([sample, text], i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 3 + i,
      prompt: { text: `${text} vào vở nhé!` },
      rubric: { criteria: ["Điền đúng", "Chữ số viết đúng chiều"], sampleAnswers: [sample] },
      answerKey: null,
      hints: ["Đọc to đề rồi mới viết."],
      explanation: `Đáp án: ${sample}.`,
      meta: meta(60),
    });
  });

  packOf(
    code,
    ["KNTT-T1-B06", "KNTT-T1-B17"],
    "Các số từ 1 đến 10 — tổng hợp theo Luyện tập chung bài 6: đếm bể cá, điền dấu, mấy và mấy, bé hơn / lớn hơn 5.",
    list,
  );
}
