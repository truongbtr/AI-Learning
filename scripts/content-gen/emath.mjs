/**
 * English Maths — sáu gói của tuần 1–12: cộng và trừ trong phạm vi 5 và 10, so sánh số, tia số
 * tới 20, số thứ tự first–tenth (ưu tiên 3 của đợt 2).
 *
 * Toán là môn validator soi thẻ lỗi chặt nhất: mọi bài MCQ/LISTEN_CHOOSE phải có ít nhất một ô
 * sai mang mã lỗi **đúng nghĩa** (`docs/04` §11.2). Nên ở đây phương án nhiễu không viết tay mà
 * **tính ra từ đáp án**: thiếu 1 là `dem_thieu_1`, thừa 1 là `dem_thua_1`, làm ngược phép tính là
 * `nham_cong_tru`, chép lại một số có sẵn trong đề là `lap_lai_tong`. Sai thẻ là không thể.
 *
 *   node scripts/content-gen/emath.mjs
 */
import { choicesOf, ex, img, listenPrompt, numberId, writePack } from "./lib.mjs";

const EN = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

const LISTEN = [
  "Listen and tap the answer.",
  "{ban} says a sum. Tap the answer!",
  "Listen carefully, then choose.",
  "What is the answer? Tap it.",
  "Listen again and pick a number.",
  "Tap the number you worked out.",
];
const READ = [
  "Read this out loud!",
  "Read it to {ban}.",
  "Your turn to read!",
  "Read slowly and clearly.",
  "Read this number sentence.",
  "Let's read together!",
];
const COUNT = [
  "Tap to count them all.",
  "How many? Tap each one.",
  "Count with {ban}!",
  "Tap every picture to count.",
  "Count them one by one.",
  "How many can you count?",
];
const DRAG = [
  "Drag the answer into the box.",
  "Which card fits? Drag it in.",
  "Put the right number in.",
  "Help {ban} fill the box.",
  "Find the answer card.",
  "Drag the number that fits.",
];
const LISTEN_HINTS = [
  ["Listen one more time."],
  ["Say the numbers out loud yourself."],
  ["Use your fingers to help."],
  ["Start from the bigger number."],
  ["Count on, one at a time."],
];
const READ_HINTS = [
  ["Read one word at a time."],
  ["Say each number clearly."],
  ["Read it in your head first."],
  ["Take a breath, then read."],
];

/**
 * Ba ô số quanh một đáp án. Thẻ lỗi tính ra từ chính con số, nên nó luôn nói đúng việc con làm:
 *  - `dem_thieu_1` / `dem_thua_1`: đếm hụt hoặc đếm dư một;
 *  - `nham_cong_tru`: làm ngược phép tính (cộng thành trừ);
 *  - `lap_lai_tong`: chép lại một số có sẵn trong đề, chưa tính gì cả.
 */
function numberChoices(answer, kinds, given, slot) {
  const wrongs = [];
  for (const kind of kinds) {
    let v = null;
    if (kind === "dem_thieu_1") v = answer - 1;
    else if (kind === "dem_thua_1") v = answer + 1;
    else if (kind === "nham_cong_tru") v = given.opposite;
    else if (kind === "lap_lai_tong") v = given.repeat;
    if (v == null || v < 0 || v === answer) continue;
    if (wrongs.some((w) => w.text === String(v))) continue;
    wrongs.push({ text: String(v), errorTag: kind });
    if (wrongs.length === 2) break;
  }
  if (wrongs.length === 0) wrongs.push({ text: String(answer + 1), errorTag: "dem_thua_1" });
  return choicesOf({ text: String(answer) }, wrongs, slot);
}

function packOf(code, note, _src, list) {
  writePack(`content/exercises/emath/${code.split(".").slice(1).join(".")}.pack.json`, {
    skillCode: code,
    subject: "EMATH",
    generatedBy: "claude-code",
    promptVersion: "exercise-gen-v2",
    lessonRefs: [],
    note,
    exercises: list,
  });
}

const NO_BOOK = "chưa có giáo trình English Maths của trường";

// ═══════════════════════════════════════════════════════════════════════════════════════════
// Cộng / trừ — hai gói phạm vi 5, hai gói phạm vi 10
// ═══════════════════════════════════════════════════════════════════════════════════════════
function arithmeticPack(cfg) {
  const { code, prefix, src, note, op, facts, stories, counts, reads, writes } = cfg;
  const sign = op === "+" ? "+" : "-";
  const verb = op === "+" ? "plus" : "minus";
  const list = [];
  let n = 0;
  const add = (e) => {
    n += 1;
    list.push(ex({ id: numberId(prefix, n), language: "en", skillCodes: [code], ...e }));
  };
  const meta = (s) => ({ estSeconds: s, lessonUnitCode: null, sourceRef: src });
  const solve = ([a, b]) => (op === "+" ? a + b : a - b);
  const opposite = ([a, b]) => (op === "+" ? a - b : a + b);

  // ① Phép tính viết bằng số — dạng con gặp trên phiếu bài tập của trường.
  facts.forEach((f, i) => {
    const [a, b] = f;
    const answer = solve(f);
    const kinds =
      i % 3 === 0
        ? ["nham_cong_tru", "dem_thieu_1"]
        : i % 3 === 1
          ? ["dem_thieu_1", "dem_thua_1"]
          : ["dem_thua_1", "lap_lai_tong"];
    const { choices, answerKey } = numberChoices(
      answer,
      kinds,
      { opposite: opposite(f), repeat: a },
      i,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      scaffold: i < 5 ? "model" : "none",
      targetsError: choices.find((c) => c.errorTag)?.errorTag ?? null,
      prompt: { text: `${a} ${sign} ${b} = ?` },
      choices,
      answerKey,
      hints: [
        op === "+" ? `Start at ${a} and count on ${b}.` : `Start at ${a} and count back ${b}.`,
        "Use your fingers if you like.",
      ],
      explanation: `${a} ${verb} ${b} is ${answer}.`,
      meta: meta(25),
    });
  });

  // ② Bài toán lời văn — con phải đọc hiểu rồi mới biết cộng hay trừ.
  stories.forEach((s, i) => {
    const answer = solve(s.nums);
    const kinds = i % 2 === 0 ? ["nham_cong_tru", "dem_thua_1"] : ["dem_thieu_1", "lap_lai_tong"];
    const { choices, answerKey } = numberChoices(
      answer,
      kinds,
      { opposite: opposite(s.nums), repeat: s.nums[0] },
      i + 1,
    );
    add({
      type: "MCQ",
      difficulty: 2 + (i % 4),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      targetsError: choices.find((c) => c.errorTag)?.errorTag ?? null,
      prompt: { text: s.text, image: img(s.emoji, null, s.label, s.nums[0]) },
      choices,
      answerKey,
      hints: [s.hint, "Draw the pictures if it helps."],
      explanation: `${s.nums[0]} ${verb} ${s.nums[1]} is ${answer}.`,
      meta: meta(35),
    });
  });

  // ③ Nghe phép tính, chọn đáp án — không có gì để nhìn, phải tính trong đầu.
  facts.slice(0, 7).forEach((f, i) => {
    const [a, b] = f;
    const answer = solve(f);
    const spoken = `${EN[a]} ${verb} ${EN[b]}`;
    const { choices, answerKey } = numberChoices(
      answer,
      ["lap_lai_tong", "dem_thieu_1", "dem_thua_1"],
      { opposite: opposite(f), repeat: a },
      i,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 1 + (i % 5),
      scaffold: i < 2 ? "model" : "none",
      targetsError: choices.find((c) => c.errorTag)?.errorTag ?? null,
      prompt: { text: listenPrompt(LISTEN, spoken, i) },
      listenTarget: { text: spoken },
      choices,
      answerKey,
      hints: LISTEN_HINTS[i % 5],
      explanation: `${a} ${verb} ${b} is ${answer}.`,
      meta: meta(25),
    });
  });

  // ④ Kéo thẻ số vào ô trống.
  facts.slice(2, 9).forEach((f, i) => {
    const [a, b] = f;
    const answer = solve(f);
    const decoys = [
      { id: "x1", text: String(answer - 1), errorTag: "dem_thieu_1" },
      { id: "x2", text: String(answer + 1), errorTag: "dem_thua_1" },
    ].filter((d) => Number(d.text) >= 0 && Number(d.text) !== answer);
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      targetsError: "dem_thieu_1",
      prompt: { text: `${a} ${sign} ${b} = ?  ${DRAG[i % 6]}` },
      dragItems: [{ id: "ok", text: String(answer) }, ...decoys],
      dropZones: [{ id: "box", label: "Answer", accepts: ["ok", ...decoys.map((d) => d.id)] }],
      answerKey: { box: ["ok"] },
      hints: [op === "+" ? `Count on ${b} from ${a}.` : `Count back ${b} from ${a}.`],
      explanation: `${a} ${verb} ${b} is ${answer}.`,
      meta: meta(35),
    });
  });

  // ⑤ Đếm — nền của mọi phép tính ở lớp 1.
  counts.forEach(([word, emoji, howMany], i) => {
    add({
      type: "COUNT_TAP",
      difficulty: 1 + (i % 4),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      prompt: { text: COUNT[i % 6] },
      countTarget: {
        objects: img(emoji, null, word, howMany),
        correctCount: howMany,
        layout: i % 2 === 0 ? "grid" : "line",
      },
      answerKey: howMany,
      hints: ["Touch each one as you say the number."],
      explanation: `There are ${howMany} ${word}.`,
      meta: meta(30),
    });
  });

  // ⑥ Đọc to câu phép tính — nói được thì nhớ được.
  reads.forEach((r, i) => {
    const words = r.replace(/[.!?]/g, "").split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: 2 + (i % 4),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: r, words },
      answerKey: { words },
      hints: READ_HINTS[i % 4],
      explanation: `This says: "${r}"`,
      meta: meta(25),
    });
  });

  // ⑦ Viết phép tính vào vở — đúng dạng phiếu bài tập của trường, ba mẹ chụp lại.
  writes.forEach((w, i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 3 + (i % 3),
      // Đề tiếng Anh phải dưới 12 từ, nên mỗi bài một phép tính; đáp án nằm ở rubric.
      prompt: { text: `Write in your book: ${w[0]} ${sign} ${w[1]} = ?` },
      rubric: {
        criteria: ["Chép lại đúng phép tính", "Kết quả đúng", "Chữ số viết đúng chiều"],
        sampleAnswers: [`${w[0]} ${sign} ${w[1]} = ${w[2]}`],
      },
      answerKey: null,
      hints: [
        ["Work one line at a time."],
        ["Check with your fingers."],
        ["Write the numbers neatly."],
      ][i % 3],
      explanation: "Check each line again before you take the photo.",
      meta: meta(80),
    });
  });

  packOf(code, note, src, list);
}

arithmeticPack({
  code: "EMATH.OA.ADD_WITHIN_5",
  writes: [
    [2, 3, 5],
    [4, 1, 5],
    [3, 1, 4],
  ],
  prefix: "emath-add5",
  op: "+",
  src: `CCSS 1.OA.C.6 (add within 5) — ${NO_BOOK}`,
  note: 'Cộng trong phạm vi 5. Mọi phương án nhiễu tính ra từ đáp án nên thẻ lỗi luôn đúng nghĩa; bài lời văn dùng đúng lối nói của phiếu tiếng Anh ("How many in all?").',
  facts: [
    [1, 1],
    [1, 2],
    [2, 1],
    [1, 3],
    [3, 1],
    [2, 2],
    [2, 3],
    [3, 2],
    [4, 1],
    [1, 4],
    [3, 0],
    [0, 4],
  ],
  stories: [
    {
      text: "Two birds sit. Three more come. How many in all?",
      nums: [2, 3],
      emoji: "🐦",
      label: "birds",
      hint: "Count the birds that are there, then count on.",
    },
    {
      text: "One cat. Two more come. How many in all?",
      nums: [1, 2],
      emoji: "🐈",
      label: "cats",
      hint: "Start at one and count on two.",
    },
    {
      text: "Three apples. One more. How many in all?",
      nums: [3, 1],
      emoji: "🍎",
      label: "apples",
      hint: "One more than three is the next number.",
    },
    {
      text: "Two stars. Two more come. How many in all?",
      nums: [2, 2],
      emoji: "⭐",
      label: "stars",
      hint: "Two and two is a double.",
    },
    {
      text: "Four fish. One more comes. How many in all?",
      nums: [4, 1],
      emoji: "🐟",
      label: "fish",
      hint: "The number after four.",
    },
    {
      text: "Three flowers. Two more come. How many in all?",
      nums: [3, 2],
      emoji: "🌸",
      label: "flowers",
      hint: "Count on two from three.",
    },
  ],
  counts: [
    ["apples", "🍎", 4],
    ["stars", "⭐", 5],
    ["cats", "🐈", 3],
    ["birds", "🐦", 2],
    ["fish", "🐟", 5],
  ],
  reads: [
    "Two plus three is five.",
    "One plus one is two.",
    "Three plus two is five.",
    "Four plus one is five.",
    "Two plus two is four.",
  ],
});

arithmeticPack({
  code: "EMATH.OA.SUB_WITHIN_5",
  writes: [
    [5, 2, 3],
    [4, 3, 1],
    [5, 4, 1],
  ],
  prefix: "emath-sub5",
  op: "-",
  src: `CCSS 1.OA.C.6 (subtract within 5) — ${NO_BOOK}`,
  note: "Trừ trong phạm vi 5. Ô nhiễu `nham_cong_tru` là kết quả của phép cộng — đúng lỗi trẻ 6 tuổi hay mắc khi nhìn lướt dấu.",
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
    [5, 0],
    [3, 3],
  ],
  stories: [
    {
      text: "Five apples. He eats two. How many are left?",
      nums: [5, 2],
      emoji: "🍎",
      label: "apples",
      hint: "Take away two and count what is left.",
    },
    {
      text: "Four birds. One flies away. How many are left?",
      nums: [4, 1],
      emoji: "🐦",
      label: "birds",
      hint: "One less than four.",
    },
    {
      text: "Three cakes. She eats one. How many are left?",
      nums: [3, 1],
      emoji: "🍰",
      label: "cakes",
      hint: "Count back one from three.",
    },
    {
      text: "Five stars. Three go out. How many are left?",
      nums: [5, 3],
      emoji: "⭐",
      label: "stars",
      hint: "Count back three from five.",
    },
    {
      text: "Four fish. Two swim away. How many are left?",
      nums: [4, 2],
      emoji: "🐟",
      label: "fish",
      hint: "Take away two from four.",
    },
    {
      text: "Five balls. He gives one away. How many are left?",
      nums: [5, 1],
      emoji: "⚽",
      label: "balls",
      hint: "One less than five.",
    },
  ],
  counts: [
    ["cakes", "🍰", 3],
    ["balls", "⚽", 5],
    ["birds", "🐦", 4],
    ["stars", "⭐", 2],
    ["apples", "🍎", 5],
  ],
  reads: [
    "Five minus two is three.",
    "Four minus one is three.",
    "Three minus three is zero.",
    "Five minus four is one.",
    "Four minus two is two.",
  ],
});

arithmeticPack({
  code: "EMATH.OA.SUB_WITHIN_10",
  writes: [
    [10, 4, 6],
    [9, 7, 2],
    [8, 6, 2],
  ],
  prefix: "emath-sub10",
  op: "-",
  src: `CCSS 1.OA.C.6 (subtract within 10) — ${NO_BOOK}`,
  note: "Trừ trong phạm vi 10, nối tiếp gói cộng trong phạm vi 10 của đợt 1. Có bài trừ 0 để dùng được thẻ `quen_so_0`.",
  facts: [
    [6, 1],
    [7, 2],
    [8, 3],
    [9, 4],
    [10, 5],
    [7, 5],
    [8, 6],
    [9, 7],
    [10, 8],
    [6, 4],
    [10, 0],
    [9, 9],
  ],
  stories: [
    {
      text: "Ten sweets. She eats four. How many are left?",
      nums: [10, 4],
      emoji: "🍬",
      label: "sweets",
      hint: "Count back four from ten.",
    },
    {
      text: "Eight bees. Three fly away. How many are left?",
      nums: [8, 3],
      emoji: "🐝",
      label: "bees",
      hint: "Take away three from eight.",
    },
    {
      text: "Nine books. He takes two. How many are left?",
      nums: [9, 2],
      emoji: "📖",
      label: "books",
      hint: "Nine take away two.",
    },
    {
      text: "Seven eggs. Two break. How many are left?",
      nums: [7, 2],
      emoji: "🥚",
      label: "eggs",
      hint: "Count back two from seven.",
    },
    {
      text: "Ten leaves. Six blow away. How many are left?",
      nums: [10, 6],
      emoji: "🍃",
      label: "leaves",
      hint: "Ten take away six.",
    },
    {
      text: "Six cars. One drives off. How many are left?",
      nums: [6, 1],
      emoji: "🚗",
      label: "cars",
      hint: "One less than six.",
    },
  ],
  counts: [
    ["bees", "🐝", 8],
    ["eggs", "🥚", 6],
    ["books", "📖", 9],
    ["leaves", "🍃", 7],
    ["cars", "🚗", 10],
  ],
  reads: [
    "Ten minus four is six.",
    "Eight minus three is five.",
    "Nine minus seven is two.",
    "Seven minus two is five.",
    "Ten minus zero is ten.",
  ],
});

// ═══════════════════════════════════════════════════════════════════════════════════════════
// So sánh số tới 10
// ═══════════════════════════════════════════════════════════════════════════════════════════
{
  const code = "EMATH.NBT.COMPARE_1_10";
  const src = `CCSS 1.NBT.B.3 (compare within 10) — ${NO_BOOK}`;
  const list = [];
  let n = 0;
  const add = (e) => {
    n += 1;
    list.push(ex({ id: numberId("emath-comp", n), language: "en", skillCodes: [code], ...e }));
  };
  const meta = (s) => ({ estSeconds: s, lessonUnitCode: null, sourceRef: src });
  const PAIRS = [
    [7, 4],
    [3, 8],
    [9, 6],
    [2, 5],
    [10, 7],
    [4, 9],
    [6, 3],
    [1, 8],
    [5, 10],
    [8, 2],
    [6, 6],
    [3, 3],
  ];

  // ① "Which is greater?" — ô sai là số bé hơn, tức con so ngược.
  PAIRS.filter(([a, b]) => a !== b).forEach(([a, b], i) => {
    const bigger = Math.max(a, b);
    const smaller = Math.min(a, b);
    const askGreater = i % 2 === 0;
    const answer = askGreater ? bigger : smaller;
    const wrong = askGreater ? smaller : bigger;
    const { choices, answerKey } = choicesOf(
      { text: String(answer) },
      [{ text: String(wrong), errorTag: "so_sanh_nguoc" }],
      i,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 4),
      scaffold: i < 6 ? "model" : "none",
      targetsError: "so_sanh_nguoc",
      prompt: { text: `Which is ${askGreater ? "greater" : "less"}: ${a} or ${b}?` },
      choices,
      answerKey,
      hints: [
        "Count up: the one you say later is greater.",
        askGreater ? "Greater means more." : "Less means fewer.",
      ],
      explanation: `${answer} is ${askGreater ? "greater" : "less"} than ${wrong}.`,
      meta: meta(22),
    });
  });

  // ② Chọn dấu < > = — ô sai là dấu ngược lại, đúng mã `nham_dau_lon_be`.
  PAIRS.forEach(([a, b], i) => {
    const right = a > b ? ">" : a < b ? "<" : "=";
    const wrong = right === ">" ? "<" : right === "<" ? ">" : "<";
    const { choices, answerKey } = choicesOf(
      { text: right },
      [{ text: wrong, errorTag: "nham_dau_lon_be" }, { text: right === "=" ? ">" : "=" }],
      i + 1,
    );
    add({
      type: "MCQ",
      difficulty: 2 + (i % 4),
      targetsError: "nham_dau_lon_be",
      prompt: { text: `Put the right sign: ${a} ? ${b}` },
      choices,
      answerKey,
      hints: [
        "The open mouth always eats the bigger number.",
        "Same number on both sides means equal.",
      ],
      explanation: `${a} ${right} ${b}.`,
      meta: meta(28),
    });
  });

  // ③ Nghe hai số, chọn số lớn hơn.
  PAIRS.filter(([a, b]) => a !== b)
    .slice(0, 6)
    .forEach(([a, b], i) => {
      const spoken = `${EN[a]} and ${EN[b]}. Which is greater?`;
      const bigger = Math.max(a, b);
      const smaller = Math.min(a, b);
      const { choices, answerKey } = choicesOf(
        { text: String(bigger) },
        [{ text: String(smaller), errorTag: "so_sanh_nguoc" }],
        i,
      );
      add({
        type: "LISTEN_CHOOSE",
        difficulty: 2 + (i % 4),
        targetsError: "so_sanh_nguoc",
        prompt: { text: listenPrompt(LISTEN, spoken, i) },
        listenTarget: { text: spoken },
        choices,
        answerKey,
        hints: LISTEN_HINTS[i % 5],
        explanation: `${bigger} is greater than ${smaller}.`,
        meta: meta(25),
      });
    });

  // ④ Kéo số vào rổ "more than 5" / "less than 5".
  const SORT_SETS = [
    [6, 1, 9, 3],
    [7, 2, 10, 4],
    [8, 3, 6, 1],
    [9, 4, 7, 2],
    [10, 2, 8, 4],
  ];
  SORT_SETS.forEach(([big, small, big2, small2], i) => {
    const cards = [
      { id: "a", text: String(big) },
      { id: "b", text: String(small) },
      { id: "c", text: String(big2) },
      { id: "d", text: String(small2) },
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      prompt: { text: "Sort the numbers: more than 5 or less than 5?" },
      dragItems: cards,
      dropZones: [
        { id: "more", label: "More than 5", accepts: ["a", "b", "c", "d"] },
        { id: "less", label: "Less than 5", accepts: ["a", "b", "c", "d"] },
      ],
      answerKey: { more: ["a", "c"], less: ["b", "d"] },
      hints: ["Say the numbers in order and find five."],
      explanation: `${big} and ${big2} are more than 5.`,
      meta: meta(40),
    });
  });

  // ⑤ Đếm rồi so — con phải đếm đúng trước khi so đúng.
  [
    ["apples", "🍎", 7],
    ["bees", "🐝", 4],
    ["stars", "⭐", 9],
    ["cars", "🚗", 6],
  ].forEach(([word, emoji, howMany], i) => {
    add({
      type: "COUNT_TAP",
      difficulty: 1 + (i % 4),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      prompt: { text: COUNT[i % 6] },
      countTarget: {
        objects: img(emoji, null, word, howMany),
        correctCount: howMany,
        layout: i % 2 === 0 ? "grid" : "line",
      },
      answerKey: howMany,
      hints: ["Touch each one as you say the number."],
      explanation: `There are ${howMany} ${word}.`,
      meta: meta(30),
    });
  });

  // ⑥ Đọc to câu so sánh.
  [
    "Seven is greater than four.",
    "Three is less than eight.",
    "Six is equal to six.",
    "Ten is greater than seven.",
  ].forEach((r, i) => {
    const words = r.replace(/\./g, "").split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: 2 + (i % 4),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: r, words },
      answerKey: { words },
      hints: READ_HINTS[i % 4],
      explanation: `This says: "${r}"`,
      meta: meta(25),
    });
  });

  packOf(
    code,
    "So sánh số tới 10: greater / less / equal và ba dấu < > =. Ô nhiễu của bài chọn dấu luôn là dấu ngược lại, nên thẻ `nham_dau_lon_be` nói đúng việc con làm.",
    src,
    list,
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// Tia số tới 20
// ═══════════════════════════════════════════════════════════════════════════════════════════
{
  const code = "EMATH.NBT.NUMBER_LINE_TO_20";
  const src = `CCSS 1.NBT.A.1 (number line to 20) — ${NO_BOOK}`;
  const list = [];
  let n = 0;
  const add = (e) => {
    n += 1;
    list.push(ex({ id: numberId("emath-line", n), language: "en", skillCodes: [code], ...e }));
  };
  const meta = (s) => ({ estSeconds: s, lessonUnitCode: null, sourceRef: src });
  const SPOTS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 6, 8, 9];

  // ① Số liền sau / liền trước — có chữ "comes after" nên mã `nham_thu_tu_so` hợp lệ.
  SPOTS.forEach((v, i) => {
    const after = i % 2 === 0;
    const answer = after ? v + 1 : v - 1;
    const swapped = Number([...String(answer)].reverse().join(""));
    // Lệch một bậc so với **đáp án** — không phải so với số in trong đề.
    const wrongs = [{ text: String(answer - 1), errorTag: "dem_thieu_1" }];
    if (answer + 1 <= 20) wrongs.push({ text: String(answer + 1), errorTag: "dem_thua_1" });
    // Ở hai đầu tia số không có ô "thừa 1"; thêm một ô nhiễu thật để bài vẫn có ba lựa chọn.
    else if (answer - 2 >= 0) wrongs.push({ text: String(answer - 2) });
    if (swapped !== answer && swapped <= 20 && swapped >= 10 && i % 3 === 0)
      wrongs.splice(1, 1, { text: String(swapped), errorTag: "nham_thu_tu_so" });
    const { choices, answerKey } = choicesOf({ text: String(answer) }, wrongs, i);
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      scaffold: i < 6 ? "model" : "none",
      targetsError: choices.find((c) => c.errorTag)?.errorTag ?? null,
      prompt: { text: `Which number comes ${after ? "after" : "before"} ${v}?` },
      choices,
      answerKey,
      hints: [
        after ? "Count on one from there." : "Count back one from there.",
        "Walk along the number line with your finger.",
      ],
      explanation: `${answer} comes ${after ? "after" : "before"} ${v}.`,
      meta: meta(25),
    });
  });

  // ② Số còn thiếu ở giữa.
  [
    [9, 11],
    [12, 14],
    [15, 17],
    [17, 19],
    [4, 6],
    [7, 9],
    [18, 20],
    [10, 12],
  ].forEach(([a, b], i) => {
    const answer = a + 1;
    const { choices, answerKey } = numberChoices(
      answer,
      ["dem_thieu_1", "dem_thua_1"],
      { opposite: null, repeat: a },
      i + 1,
    );
    add({
      type: "MCQ",
      difficulty: 2 + (i % 4),
      targetsError: "dem_thieu_1",
      prompt: { text: `${a}, ?, ${b}. Which number is missing?` },
      choices,
      answerKey,
      hints: ["Count on from the first number.", "It sits right in the middle."],
      explanation: `${a}, ${answer}, ${b}.`,
      meta: meta(28),
    });
  });

  // ③ Nghe số, chọn số liền sau.
  [10, 12, 14, 16, 18, 5].forEach((v, i) => {
    const spoken = `What comes after ${EN[v] ?? v}?`;
    const { choices, answerKey } = numberChoices(
      v + 1,
      ["dem_thieu_1", "dem_thua_1"],
      { opposite: null, repeat: v },
      i,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 2 + (i % 4),
      targetsError: "dem_thieu_1",
      prompt: { text: listenPrompt(LISTEN, spoken, i) },
      listenTarget: { text: spoken },
      choices,
      answerKey,
      hints: LISTEN_HINTS[i % 5],
      explanation: `${v + 1} comes after ${v}.`,
      meta: meta(25),
    });
  });

  // ④ Xếp ba số theo thứ tự.
  [
    [11, 12, 13],
    [14, 15, 16],
    [17, 18, 19],
    [18, 19, 20],
    [7, 8, 9],
  ].forEach((row, i) => {
    const cards = [
      { id: "p1", text: String(row[2]) },
      { id: "p2", text: String(row[0]) },
      { id: "p3", text: String(row[1]) },
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 3 + (i % 3),
      prompt: { text: "Put the three numbers in order, small to big." },
      dragItems: cards,
      dropZones: [
        { id: "s1", label: "First", accepts: ["p1", "p2", "p3"] },
        { id: "s2", label: "Next", accepts: ["p1", "p2", "p3"] },
        { id: "s3", label: "Last", accepts: ["p1", "p2", "p3"] },
      ],
      answerKey: { s1: ["p2"], s2: ["p3"], s3: ["p1"] },
      hints: ["Say the numbers out loud in counting order."],
      explanation: `${row[0]}, ${row[1]}, ${row[2]}.`,
      meta: meta(45),
    });
  });

  // ⑤ Đếm tới hai mươi.
  [
    ["balloons", "🎈", 12],
    ["stars", "⭐", 15],
    ["bees", "🐝", 11],
    ["leaves", "🍃", 18],
  ].forEach(([word, emoji, howMany], i) => {
    add({
      type: "COUNT_TAP",
      difficulty: 2 + (i % 4),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      prompt: { text: COUNT[i % 6] },
      countTarget: {
        objects: img(emoji, null, word, howMany),
        correctCount: howMany,
        layout: i % 2 === 0 ? "grid" : "line",
      },
      answerKey: howMany,
      hints: ["Count in groups of five to keep your place."],
      explanation: `There are ${howMany} ${word}.`,
      meta: meta(40),
    });
  });

  // ⑥ Đọc to dãy số.
  [
    "Eleven twelve thirteen fourteen fifteen.",
    "Sixteen seventeen eighteen nineteen twenty.",
    "Ten eleven twelve thirteen.",
    "Seventeen comes after sixteen.",
    "Twelve comes before thirteen.",
    "Nineteen twenty. That is the end!",
  ].forEach((r, i) => {
    const words = r.replace(/\./g, "").split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: 2 + (i % 4),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: r, words },
      answerKey: { words },
      hints: READ_HINTS[i % 4],
      explanation: `This says: "${r}"`,
      meta: meta(30),
    });
  });

  packOf(
    code,
    "Tia số tới 20: liền trước, liền sau, số còn thiếu, xếp thứ tự. Bài số hai chữ số có ô nhiễu đảo chữ số (14 → 41) mang mã `nham_thu_tu_so`.",
    src,
    list,
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// Số thứ tự first – tenth
// ═══════════════════════════════════════════════════════════════════════════════════════════
{
  const code = "EMATH.NBT.ORDINAL_NUMBERS";
  const src = `CCSS 1.NBT / INTL ordinal numbers — ${NO_BOOK}`;
  const list = [];
  let n = 0;
  const add = (e) => {
    n += 1;
    list.push(ex({ id: numberId("emath-ord", n), language: "en", skillCodes: [code], ...e }));
  };
  const meta = (s) => ({ estSeconds: s, lessonUnitCode: null, sourceRef: src });
  const ORD = [
    "first",
    "second",
    "third",
    "fourth",
    "fifth",
    "sixth",
    "seventh",
    "eighth",
    "ninth",
    "tenth",
  ];
  const QUEUE = [
    ["cat", "🐈"],
    ["dog", "🐕"],
    ["bird", "🐦"],
    ["frog", "🐸"],
    ["bee", "🐝"],
    ["duck", "🦆"],
    ["fish", "🐟"],
    ["cow", "🐄"],
  ];

  // ① "Who is third in line?" — ô sai là con đứng ngay cạnh, đúng lỗi đếm lệch một chỗ.
  QUEUE.forEach(([animal, emoji], i) => {
    const next = QUEUE[(i + 1) % QUEUE.length];
    const prev = QUEUE[(i + QUEUE.length - 1) % QUEUE.length];
    const { choices, answerKey } = choicesOf(
      { text: animal, image: img(emoji, null, animal) },
      [
        { text: next[0], image: img(next[1], null, next[0]), errorTag: "nham_thu_tu_so" },
        { text: prev[0], image: img(prev[1], null, prev[0]) },
      ],
      i,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      scaffold: i < 6 ? "model" : "none",
      targetsError: "nham_thu_tu_so",
      prompt: { text: `Who is ${ORD[i]} in the line?` },
      choices,
      answerKey,
      hints: ["Point and count from the front.", "The front one is first."],
      explanation: `The ${animal} is ${ORD[i]}.`,
      meta: meta(25),
    });
  });

  // ② Ngược lại: cho vị trí, hỏi tên thứ tự.
  ORD.forEach((word, i) => {
    const wrong = ORD[(i + 1) % ORD.length];
    const other = ORD[(i + 3) % ORD.length];
    const { choices, answerKey } = choicesOf(
      { text: word },
      [{ text: wrong, errorTag: "nham_thu_tu_so" }, { text: other }],
      i + 1,
    );
    add({
      type: "MCQ",
      difficulty: 2 + (i % 4),
      targetsError: "nham_thu_tu_so",
      prompt: { text: `Which word means number ${i + 1} in a line?` },
      choices,
      answerKey,
      hints: ["Count out loud: first, second, third…", "Match the counting word to the place."],
      explanation: `Number ${i + 1} in a line is ${word}.`,
      meta: meta(28),
    });
  });

  // ③ Nghe thứ tự, chọn con vật.
  QUEUE.slice(0, 6).forEach(([animal, emoji], i) => {
    const next = QUEUE[(i + 2) % QUEUE.length];
    const spoken = `Who is ${ORD[i]}?`;
    const { choices, answerKey } = choicesOf(
      { text: animal, image: img(emoji, null, animal) },
      [{ text: next[0], image: img(next[1], null, next[0]), errorTag: "nham_thu_tu_so" }],
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
      hints: LISTEN_HINTS[i % 5],
      explanation: `The ${animal} is ${ORD[i]} in the line.`,
      meta: meta(25),
    });
  });

  // ④ Xếp ba bạn vào đúng chỗ.
  [0, 1, 2, 3, 4, 5].forEach((start, i) => {
    const three = [QUEUE[start], QUEUE[start + 1], QUEUE[start + 2]];
    const cards = [
      { id: "q1", text: three[2][0], image: img(three[2][1], null, three[2][0]) },
      { id: "q2", text: three[0][0], image: img(three[0][1], null, three[0][0]) },
      { id: "q3", text: three[1][0], image: img(three[1][1], null, three[1][0]) },
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      // Đề chỉ cho **hai** vị trí; con phải suy ra con ở giữa. Kể cả ba thì con chỉ chép lại.
      prompt: {
        text: `The ${three[0][0]} is first. The ${three[2][0]} is third. Fill the line.`,
      },
      dragItems: cards,
      dropZones: [
        { id: "z1", label: "First", accepts: ["q1", "q2", "q3"] },
        { id: "z2", label: "Second", accepts: ["q1", "q2", "q3"] },
        { id: "z3", label: "Third", accepts: ["q1", "q2", "q3"] },
      ],
      answerKey: { z1: ["q2"], z2: ["q3"], z3: ["q1"] },
      hints: ["Put the two you know first.", "Only one animal is left for the middle."],
      explanation: `${three[0][0]} is first, ${three[1][0]} is second, ${three[2][0]} is third.`,
      meta: meta(45),
    });
  });

  // ⑤ Đếm cả hàng trước khi nói ai đứng thứ mấy.
  [
    ["ducks", "🦆", 5],
    ["frogs", "🐸", 7],
    ["bees", "🐝", 6],
    ["dogs", "🐕", 4],
  ].forEach(([word, emoji, howMany], i) => {
    add({
      type: "COUNT_TAP",
      difficulty: 1 + (i % 4),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      prompt: { text: COUNT[i % 6] },
      countTarget: {
        objects: img(emoji, null, word, howMany),
        correctCount: howMany,
        layout: "line",
      },
      answerKey: howMany,
      hints: ["Start at the front of the line."],
      explanation: `There are ${howMany} ${word} in the line.`,
      meta: meta(30),
    });
  });

  // ⑥ Đọc to.
  [
    "First second third fourth fifth.",
    "The cat is first in line.",
    "Sixth seventh eighth ninth tenth.",
    "The duck is second.",
    "The bird is third in line.",
    "I am fourth. You are fifth.",
  ].forEach((r, i) => {
    const words = r.replace(/\./g, "").split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: 2 + (i % 4),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: r, words },
      answerKey: { words },
      hints: READ_HINTS[i % 4],
      explanation: `This says: "${r}"`,
      meta: meta(28),
    });
  });

  packOf(
    code,
    "Số thứ tự first–tenth theo hàng con vật. Ô nhiễu luôn là con đứng ngay cạnh — đúng lỗi đếm lệch một chỗ, mang mã `nham_thu_tu_so`.",
    src,
    list,
  );
}
