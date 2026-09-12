/**
 * Sáu gói tiếng Anh: ba gói của đúng bài lớp học hôm nay (nhật ký 10–12/09 ghi
 * "Unit 1 – Lesson 16 – Unit Review" và gắn NUMBERS_1_20, SPELL_CVC, ANIMALS_FARM), một gói
 * ngữ pháp Unit 1 của Global Stage (How many…? – There are…), và hai gói Phonics Review của
 * Literacy Book (ghép âm, tách âm).
 *
 * `standardRef` theo `docs/09` §4b: `GS1-LB.*` cho ESL, `GS1-LIT.*` cho ENL. Bảng chương trình
 * đã có, nhưng **trang sách thì chưa** — nên `sourceRef` nói rõ gói dựng từ bảng scope and
 * sequence, phải rà lại khi chụp được trang sách (docs/09 §4b.4).
 *
 *   node scripts/content-gen/esl-enl.mjs
 */
import { choicesOf, ex, img, listenPrompt, numberId, writePack } from "./lib.mjs";

const LISTEN = [
  "Listen and tap the right one.",
  "{ban} says a word. Tap it!",
  "Listen carefully, then choose.",
  "What did you hear? Tap it.",
  "Listen again and pick one.",
  "Tap what you heard.",
];
const READ = [
  "Read this out loud!",
  "Read it to {ban}.",
  "Your turn to read!",
  "Read slowly and clearly.",
  "Read this line out loud.",
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
const LISTEN_HINTS = [
  ["Listen one more time."],
  ["Say the word out loud yourself."],
  ["Close your eyes and listen."],
  ["Listen to the first sound."],
  ["Listen to the middle sound."],
];
const READ_HINTS = [
  ["Read one word at a time."],
  ["Sound out the hard word first."],
  ["Read it in your head first."],
  ["Take a breath, then read."],
];
const WRITE_HINTS = [
  ["Say the word before you write it."],
  ["Copy it letter by letter."],
  ["Leave a finger space between words."],
  ["Check your letters after you write."],
];

const NUM = [
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

const packOf = (subject, code, note, list) =>
  writePack(
    `content/exercises/${subject.toLowerCase()}/${code.split(".").slice(1).join(".")}.pack.json`,
    {
      skillCode: code,
      subject,
      generatedBy: "claude-code",
      promptVersion: "exercise-gen-v2",
      lessonRefs: [],
      note,
      exercises: list,
    },
  );

const maker = (prefix, code, src) => {
  const list = [];
  let n = 0;
  return {
    list,
    meta: (s) => ({ estSeconds: s, lessonUnitCode: null, sourceRef: src }),
    add: (e) => {
      n += 1;
      list.push(ex({ id: numberId(prefix, n), language: "en", skillCodes: [code], ...e }));
    },
  };
};

// ═══════════════════════════════════════════════════ 1. Số đếm 1–20 ═══════════════════════════
{
  const code = "ESL.VOC.NUMBERS_1_20";
  const src =
    "Global Stage 1 Language Book, Language Review (scope and sequence) — chưa chụp trang sách";
  const { list, add, meta } = maker("esl-num", code, src);
  const THINGS = [
    ["apples", "🍎"],
    ["stars", "⭐"],
    ["cats", "🐈"],
    ["balloons", "🎈"],
    ["fish", "🐟"],
    ["bees", "🐝"],
    ["books", "📖"],
    ["cars", "🚗"],
  ];

  // ① Đếm tranh rồi chọn **chữ số**. Ô sai lệch đúng một đơn vị — lỗi đếm hụt, đếm dư.
  [3, 5, 7, 9, 11, 13, 15, 17, 19, 20].forEach((v, i) => {
    const [word, emoji] = THINGS[i % THINGS.length];
    const { choices, answerKey } = choicesOf(
      { text: String(v) },
      [
        { text: String(v - 1), errorTag: "dem_thieu_1" },
        { text: String(v + 1), errorTag: "dem_thua_1" },
      ].filter((c) => Number(c.text) >= 0 && Number(c.text) <= 20),
      i,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      scaffold: i < 6 ? "model" : "none",
      targetsError: choices.find((c) => c.errorTag)?.errorTag ?? null,
      prompt: { text: `How many ${word}?`, image: img(emoji, null, word, v) },
      choices,
      answerKey,
      hints: ["Touch each one as you count.", "Count in fives to keep your place."],
      explanation: `There are ${v} ${word}.`,
      meta: meta(28),
    });
  });

  // ② Chữ số ↔ chữ viết. Teen và unit là chỗ con hay lẫn nhất, nên đó là ô nhiễu.
  [4, 6, 8, 12, 14, 16, 18, 20].forEach((v, i) => {
    const confuse = v >= 13 && v <= 19 ? v - 10 : v + 10;
    const other = v === 20 ? 12 : v + 1;
    const { choices, answerKey } = choicesOf(
      { text: NUM[v] },
      [{ text: NUM[confuse] ?? NUM[3] }, { text: NUM[other] ?? NUM[2] }],
      i + 1,
    );
    add({
      type: "MCQ",
      difficulty: 2 + (i % 4),
      prompt: { text: `Which word means ${v}?` },
      choices,
      answerKey,
      hints: ["Say the number out loud first.", "Teen words end in -teen."],
      explanation: `${v} is "${NUM[v]}".`,
      meta: meta(25),
    });
  });

  // ③ Nghe số, chọn chữ số.
  [2, 7, 11, 13, 15, 18, 20].forEach((v, i) => {
    const near = v >= 13 && v <= 19 ? v - 10 : v + 1;
    const { choices, answerKey } = choicesOf(
      { text: String(v) },
      [{ text: String(near) }, { text: String(v === 20 ? 12 : v + 2) }],
      i,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 1 + (i % 5),
      scaffold: i < 2 ? "model" : "none",
      prompt: { text: listenPrompt(LISTEN, NUM[v], i) },
      listenTarget: { text: NUM[v] },
      choices,
      answerKey,
      hints: LISTEN_HINTS[i % 5],
      explanation: `You heard "${NUM[v]}" — that is ${v}.`,
      meta: meta(22),
    });
  });

  // ④ Nối chữ số với chữ viết.
  [
    [5, 15],
    [6, 16],
    [7, 17],
    [8, 18],
    [9, 19],
    [10, 20],
  ].forEach(([a, b], i) => {
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      prompt: { text: "Drag each word under its number." },
      dragItems: [
        { id: "w1", text: NUM[a] },
        { id: "w2", text: NUM[b] },
      ],
      dropZones: [
        { id: "n1", label: String(a), accepts: ["w1", "w2"] },
        { id: "n2", label: String(b), accepts: ["w1", "w2"] },
      ],
      answerKey: { n1: ["w1"], n2: ["w2"] },
      hints: ["Say both words out loud first.", "The longer word is the teen one."],
      explanation: `${a} is "${NUM[a]}" and ${b} is "${NUM[b]}".`,
      meta: meta(35),
    });
  });

  // ⑤ Đếm.
  [
    ["balloons", "🎈", 12],
    ["stars", "⭐", 16],
    ["bees", "🐝", 14],
    ["apples", "🍎", 9],
    ["books", "📖", 20],
  ].forEach(([word, emoji, howMany], i) => {
    add({
      type: "COUNT_TAP",
      difficulty: 1 + (i % 5),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      prompt: { text: COUNT[i % 6] },
      countTarget: {
        objects: img(emoji, null, word, howMany),
        correctCount: howMany,
        layout: i % 2 === 0 ? "grid" : "line",
      },
      answerKey: howMany,
      hints: ["Count in groups of five."],
      explanation: `There are ${howMany} ${word}.`,
      meta: meta(35),
    });
  });

  // ⑥ Đọc to dãy số.
  [
    "One two three four five.",
    "Six seven eight nine ten.",
    "Eleven twelve thirteen fourteen.",
    "Fifteen sixteen seventeen eighteen.",
    "Nineteen twenty. All done!",
  ].forEach((r, i) => {
    const words = r.replace(/[.!]/g, "").split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: 1 + (i % 5),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: r, words },
      answerKey: { words },
      hints: READ_HINTS[i % 4],
      explanation: `This says: "${r}"`,
      meta: meta(28),
    });
  });

  // ⑦ Viết số bằng chữ.
  [
    [11, 12],
    [13, 14],
    [15, 16],
    [17, 18],
  ].forEach(([a, b], i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 3 + (i % 3),
      prompt: { text: `Write these numbers in words: ${a}, ${b}.` },
      rubric: {
        criteria: ["Viết đủ hai số bằng chữ", "Chính tả đúng", "Chữ rõ ràng"],
        sampleAnswers: [`${NUM[a]}, ${NUM[b]}`],
      },
      answerKey: null,
      hints: WRITE_HINTS[i % 4],
      explanation: `${a} is "${NUM[a]}" and ${b} is "${NUM[b]}".`,
      meta: meta(80),
    });
  });

  packOf(
    "ESL",
    code,
    "Số đếm 1–20 — kỹ năng nhật ký lớp gắn cho buổi Unit 1 Review hôm nay. Cặp teen/unit (13–3, 15–5) là ô nhiễu chính vì đó là chỗ tai người Việt hay lẫn.",
    list,
  );
}

// ═══════════════════════════════════════════ 2. Đánh vần từ CVC ════════════════════════════════
{
  const code = "ESL.PH.SPELL_CVC";
  const src =
    "Global Stage 1 Literacy Book, Phonics Review (scope and sequence) — chưa chụp trang sách";
  const { list, add, meta } = maker("esl-cvc", code, src);
  /** [từ, tranh, sai chính tả 1 chữ, đổi nguyên âm, đổi phụ âm đầu] */
  const CVC = [
    ["cat", "🐈", "kat", "cot", "bat"],
    ["dog", "🐕", "dag", "dig", "log"],
    ["pig", "🐖", "pigg", "peg", "big"],
    ["hen", "🐔", "henn", "hon", "pen"],
    ["bus", "🚌", "buss", "bas", "pus"],
    ["sun", "☀️", "sunn", "sin", "run"],
    ["cup", "☕", "kup", "cap", "pup"],
    ["box", "📦", "boks", "bax", "fox"],
    ["bed", "🛏️", "bedd", "bad", "red"],
    ["net", "🥅", "nett", "not", "pet"],
    ["map", "🗺️", "mapp", "mop", "cap"],
    ["hat", "🎩", "hatt", "hot", "bat"],
  ];

  // ① Nhìn tranh chọn cách viết đúng. Hai ô sai mang đúng hai lỗi khác nhau.
  CVC.forEach(([w, emoji, misspelt, vowel], i) => {
    const { choices, answerKey } = choicesOf(
      { text: w },
      [
        { text: misspelt, errorTag: "sai_chinh_ta_tu" },
        { text: vowel, errorTag: "nham_nguyen_am_ngan" },
      ],
      i,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      scaffold: i < 6 ? "model" : "none",
      targetsError: i % 2 === 0 ? "sai_chinh_ta_tu" : "nham_nguyen_am_ngan",
      prompt: { text: "Which one spells the picture?", image: img(emoji, null, w, 1) },
      choices,
      answerKey,
      hints: ["Sound it out: first, middle, last.", "Listen to the middle sound."],
      explanation: `The picture is a ${w}.`,
      meta: meta(25),
    });
  });

  // ② Nghe từ, chọn cách viết — ô nhiễu đổi nguyên âm giữa hoặc phụ âm đầu.
  CVC.forEach(([w, , , vowel, onset], i) => {
    const { choices, answerKey } = choicesOf(
      { text: w },
      [
        { text: vowel, errorTag: "nham_nguyen_am_ngan" },
        { text: onset, errorTag: "nham_am_dau" },
      ],
      i + 1,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 2 + (i % 4),
      targetsError: "nham_nguyen_am_ngan",
      prompt: { text: listenPrompt(LISTEN, w, i) },
      listenTarget: { text: w },
      choices,
      answerKey,
      hints: LISTEN_HINTS[i % 5],
      explanation: `You heard "${w}".`,
      meta: meta(25),
    });
  });

  // ③ Xếp ba chữ cái thành từ — chính là "Look and unscramble" trên phiếu của trường.
  CVC.slice(0, 8).forEach(([w, emoji], i) => {
    const [c1, c2, c3] = [...w];
    const cards = [
      { id: "l2", text: c2 },
      { id: "l3", text: c3 },
      { id: "l1", text: c1 },
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      prompt: { text: "Put the letters in order.", image: img(emoji, null, w, 1) },
      dragItems: cards,
      dropZones: [
        { id: "s1", label: "First letter", accepts: ["l1", "l2", "l3"] },
        { id: "s2", label: "Middle letter", accepts: ["l1", "l2", "l3"] },
        { id: "s3", label: "Last letter", accepts: ["l1", "l2", "l3"] },
      ],
      answerKey: { s1: ["l1"], s2: ["l2"], s3: ["l3"] },
      hints: ["Say the word slowly and listen to each sound."],
      explanation: `The word is "${w}".`,
      meta: meta(40),
    });
  });

  // ⑤ Đọc to hàng từ cùng vần.
  ["cat hat bat", "pig big dig", "sun run bun", "bed red net", "box fox top"].forEach((r, i) => {
    const words = r.split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: 2 + (i % 4),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: r, words },
      answerKey: { words },
      hints: READ_HINTS[i % 4],
      explanation: `These words rhyme: "${r}".`,
      meta: meta(28),
    });
  });

  // ⑥ Viết từ dưới tranh.
  [
    ["cat", "dog"],
    ["pig", "hen"],
    ["sun", "bus"],
    ["cup", "box"],
  ].forEach((pair, i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 2 + (i % 4),
      prompt: { text: `Write these words: ${pair.join(", ")}.` },
      rubric: {
        criteria: ["Viết đủ hai từ", "Đúng ba chữ cái mỗi từ", "Chữ rõ ràng"],
        sampleAnswers: [pair.join(" ")],
      },
      answerKey: null,
      hints: WRITE_HINTS[i % 4],
      explanation: "Say each sound as you write its letter.",
      meta: meta(70),
    });
  });

  packOf(
    "ESL",
    code,
    "Đánh vần và xếp chữ thành từ CVC — dạng 'Look and unscramble' của phiếu bài tập GS1. Nhiễu chia hai loại rõ: viết lệch một chữ (sai_chinh_ta_tu) và đổi nguyên âm giữa (nham_nguyen_am_ngan).",
    list,
  );
}

// ═══════════════════════════════════════ 3. Con vật nông trại & sở thú ═════════════════════════
{
  const code = "ESL.VOC.ANIMALS_FARM";
  const src = "Global Stage 1 Language Book Unit 4 (GS1-LB.U4) — chưa chụp trang sách";
  const { list, add, meta } = maker("esl-animal", code, src);
  const FARM = [
    ["cow", "🐄"],
    ["pig", "🐖"],
    ["hen", "🐔"],
    ["duck", "🦆"],
    ["sheep", "🐑"],
    ["horse", "🐴"],
    ["goat", "🐐"],
    ["cat", "🐈"],
  ];
  const WILD = [
    ["lion", "🦁"],
    ["tiger", "🐅"],
    ["elephant", "🐘"],
    ["monkey", "🐒"],
    ["giraffe", "🦒"],
    ["zebra", "🦓"],
    ["penguin", "🐧"],
    ["frog", "🐸"],
  ];
  const pic = (m) => ({ text: m[0], image: img(m[1], null, m[0]) });

  // ① Nhìn tranh chọn tên.
  [...FARM, ...WILD].slice(0, 12).forEach((m, i) => {
    const pool = [...FARM, ...WILD].filter((x) => x[0] !== m[0]);
    const { choices, answerKey } = choicesOf(
      { text: m[0] },
      [{ text: pool[i % pool.length][0] }, { text: pool[(i + 6) % pool.length][0] }],
      i,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      scaffold: i < 6 ? "model" : "none",
      prompt: { text: "What animal is this?", image: img(m[1], null, m[0], 1) },
      choices,
      answerKey,
      hints: ["Say the animal name out loud.", "Think about where it lives."],
      explanation: `This is a ${m[0]}.`,
      meta: meta(22),
    });
  });

  // ② Nghe tên, chọn tranh.
  [...FARM, ...WILD].slice(0, 8).forEach((m, i) => {
    const pool = [...FARM, ...WILD].filter((x) => x[0] !== m[0]);
    const { choices, answerKey } = choicesOf(
      pic(m),
      [pic(pool[(i + 2) % pool.length]), pic(pool[(i + 9) % pool.length])],
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
      hints: LISTEN_HINTS[i % 5],
      explanation: `You heard "${m[0]}".`,
      meta: meta(22),
    });
  });

  // ③ Xếp vào chuồng trại hay sở thú.
  for (let i = 0; i < 6; i++) {
    const f1 = FARM[i % FARM.length];
    const f2 = FARM[(i + 3) % FARM.length];
    const w1 = WILD[i % WILD.length];
    const w2 = WILD[(i + 2) % WILD.length];
    const cards = [
      { id: "a1", text: f1[0], image: img(f1[1], null, f1[0]) },
      { id: "b1", text: w1[0], image: img(w1[1], null, w1[0]) },
      { id: "a2", text: f2[0], image: img(f2[1], null, f2[0]) },
      { id: "b2", text: w2[0], image: img(w2[1], null, w2[0]) },
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      prompt: { text: "Farm or zoo? Drag each animal home." },
      dragItems: cards,
      dropZones: [
        { id: "farm", label: "Farm", accepts: ["a1", "b1", "a2", "b2"] },
        { id: "zoo", label: "Zoo", accepts: ["a1", "b1", "a2", "b2"] },
      ],
      answerKey: { farm: ["a1", "a2"], zoo: ["b1", "b2"] },
      hints: ["Farm animals live with people."],
      explanation: `${f1[0]} and ${f2[0]} live on a farm.`,
      meta: meta(40),
    });
  }

  // ④ Đếm con vật.
  [
    ["ducks", "🦆", 6],
    ["cows", "🐄", 4],
    ["monkeys", "🐒", 7],
    ["hens", "🐔", 9],
    ["frogs", "🐸", 5],
  ].forEach(([word, emoji, howMany], i) => {
    add({
      type: "COUNT_TAP",
      difficulty: 1 + (i % 5),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      prompt: { text: COUNT[i % 6] },
      countTarget: {
        objects: img(emoji, null, word, howMany),
        correctCount: howMany,
        layout: i % 2 === 0 ? "grid" : "line",
      },
      answerKey: howMany,
      hints: ["Touch each animal as you count."],
      explanation: `There are ${howMany} ${word}.`,
      meta: meta(30),
    });
  });

  // ⑤ Đọc to câu về con vật.
  [
    "The cow is big.",
    "I can see a duck.",
    "The monkey can climb.",
    "Look at the tall giraffe.",
    "The frog can jump high.",
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

  // ⑥ Viết tên con vật.
  [
    ["cow", "pig"],
    ["hen", "duck"],
    ["lion", "tiger"],
    ["zebra", "frog"],
  ].forEach((pair, i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 2 + (i % 4),
      prompt: { text: `Draw and label: ${pair.join(", ")}.` },
      rubric: {
        criteria: ["Vẽ hai con vật", "Ghi đúng tên tiếng Anh", "Chữ rõ ràng"],
        sampleAnswers: [pair.join(", ")],
      },
      answerKey: null,
      hints: WRITE_HINTS[i % 4],
      explanation: "Say each animal name before you write it.",
      meta: meta(80),
    });
  });

  packOf(
    "ESL",
    code,
    "Con vật nông trại và sở thú theo Unit 4 Global Stage. Nhóm sở thú giữ đúng danh sách của sách (penguin, giraffe, zebra…) để khi lớp học tới unit đó là con đã quen mặt chữ.",
    list,
  );
}

// ═══════════════════════════════════ 4. How many…? – There are… ════════════════════════════════
{
  const code = "ESL.GR.HOW_MANY";
  const src = "Global Stage 1 Language Book Unit 1 (GS1-LB.U1) — chưa chụp trang sách";
  const { list, add, meta } = maker("esl-howmany", code, src);
  /** [số ít, số nhiều, tranh] */
  const NOUNS = [
    ["pen", "pens", "🖊️"],
    ["cat", "cats", "🐈"],
    ["book", "books", "📖"],
    ["apple", "apples", "🍎"],
    ["star", "stars", "⭐"],
    ["car", "cars", "🚗"],
    ["duck", "ducks", "🦆"],
    ["bee", "bees", "🐝"],
  ];

  // ① Câu trả lời đầy đủ. Hai ô sai là **hai lỗi ngữ pháp thật**: is/are, và quên -s số nhiều.
  NOUNS.forEach(([one, many, emoji], i) => {
    const v = 3 + (i % 6);
    // Không có dấu chấm cuối: mã `thieu_s_so_nhieu` so khớp cả chuỗi, một dấu chấm là hỏng.
    const right = `There are ${NUM[v]} ${many}`;
    const { choices, answerKey } = choicesOf(
      { text: right },
      [
        { text: `There is ${NUM[v]} ${many}`, errorTag: "nham_am_is_are" },
        { text: `There are ${NUM[v]} ${one}`, errorTag: "thieu_s_so_nhieu" },
      ],
      i,
    );
    add({
      type: "MCQ",
      difficulty: 2 + (i % 4),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      scaffold: i < 6 ? "model" : "none",
      targetsError: i % 2 === 0 ? "nham_am_is_are" : "thieu_s_so_nhieu",
      prompt: { text: `How many ${many}?`, image: img(emoji, null, many, v) },
      choices,
      answerKey,
      hints: ["Count first, then say the whole sentence.", "More than one needs 'are' and an -s."],
      explanation: `${right}.`,
      meta: meta(35),
    });
  });

  // ② Chỉ chọn is hay are.
  NOUNS.forEach(([one, many, emoji], i) => {
    const single = i % 2 === 0;
    const right = single ? "is" : "are";
    const { choices, answerKey } = choicesOf(
      { text: right },
      [{ text: single ? "are" : "is", errorTag: "nham_am_is_are" }],
      i + 1,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 4),
      targetsError: "nham_am_is_are",
      prompt: {
        text: `There ___ ${single ? `one ${one}` : `four ${many}`}.`,
        image: img(emoji, null, single ? one : many, single ? 1 : 4),
      },
      choices,
      answerKey,
      hints: ["One thing takes 'is'.", "More than one takes 'are'."],
      explanation: `There ${right} ${single ? `one ${one}` : `four ${many}`}.`,
      meta: meta(25),
    });
  });

  // ③ Nghe câu hỏi, chọn số.
  NOUNS.forEach(([, many], i) => {
    const v = 2 + i;
    const spoken = `How many ${many}? Count them.`;
    const { choices, answerKey } = choicesOf(
      { text: String(v) },
      [
        { text: String(v - 1), errorTag: "dem_thieu_1" },
        { text: String(v + 1), errorTag: "dem_thua_1" },
      ],
      i,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 2 + (i % 4),
      targetsError: "dem_thieu_1",
      prompt: { text: listenPrompt(LISTEN, spoken, i), image: img(NOUNS[i][2], null, many, v) },
      listenTarget: { text: spoken },
      choices,
      answerKey,
      hints: LISTEN_HINTS[i % 5],
      explanation: `There are ${v} ${many}.`,
      meta: meta(30),
    });
  });

  // ④ Dựng câu trả lời bằng thẻ.
  NOUNS.forEach(([one, many, emoji], i) => {
    const v = 2 + i;
    add({
      type: "DRAG_DROP",
      difficulty: 3 + (i % 3),
      prompt: { text: "Build the answer: There ___ ___ ___.", image: img(emoji, null, many, v) },
      dragItems: [
        { id: "v1", text: "are" },
        { id: "v2", text: "is", errorTag: "nham_am_is_are" },
        { id: "n1", text: NUM[v] },
        { id: "n2", text: many },
        { id: "n3", text: one, errorTag: "thieu_s_so_nhieu" },
      ],
      dropZones: [
        { id: "z1", label: "verb", accepts: ["v1", "v2"] },
        { id: "z2", label: "how many", accepts: ["n1"] },
        { id: "z3", label: "thing", accepts: ["n2", "n3"] },
      ],
      answerKey: { z1: ["v1"], z2: ["n1"], z3: ["n2"] },
      hints: ["Count first, then pick the verb.", "More than one needs the -s word."],
      explanation: `There are ${NUM[v]} ${many}.`,
      meta: meta(45),
    });
  });

  // ⑤ Đếm rồi mới trả lời được.
  [
    ["pens", "🖊️", 5],
    ["apples", "🍎", 8],
    ["stars", "⭐", 6],
    ["bees", "🐝", 7],
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
      hints: ["Touch each one as you count."],
      explanation: `There are ${howMany} ${word}.`,
      meta: meta(30),
    });
  });

  // ⑥ Đọc to câu trả lời đầy đủ.
  [
    "There are five pens.",
    "There is one cat.",
    "There are three books.",
    "How many apples are there?",
    "There are seven stars.",
  ].forEach((r, i) => {
    const words = r.replace(/[.?]/g, "").split(" ");
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
    "ESL",
    code,
    "How many…? – There are… của Unit 1 Global Stage. Đây là gói hiếm hoi dùng được thẻ lỗi ngữ pháp thật: 'There is five pens' là nham_am_is_are, 'There are five pen' là thieu_s_so_nhieu.",
    list,
  );
}

// ══════════════════════════════════════ 5. Ghép âm thành từ ════════════════════════════════════
{
  const code = "ENL.RF.BLEND_PHONEMES";
  const src = "Global Stage 1 Literacy Book, Phonics Review (GS1-LIT.R) — chưa chụp trang sách";
  const { list, add, meta } = maker("enl-blend", code, src);
  /** [từ, tranh, cùng âm đầu khác vần, khác âm đầu cùng vần] */
  const WORDS = [
    ["cat", "🐈", "cap", "bat"],
    ["dog", "🐕", "dot", "log"],
    ["pig", "🐖", "pin", "big"],
    ["sun", "☀️", "sub", "run"],
    ["bed", "🛏️", "bet", "red"],
    ["cup", "☕", "cut", "pup"],
    ["hat", "🎩", "ham", "bat"],
    ["bus", "🚌", "but", "pus"],
    ["net", "🥅", "neck", "pet"],
    ["map", "🗺️", "mat", "cap"],
  ];

  // ① Nghe ba âm rời, chọn từ ghép được. Hai ô sai: nghe sót vần, nghe sót âm đầu.
  WORDS.forEach(([w, , sameOnset, sameRime], i) => {
    const { choices, answerKey } = choicesOf(
      { text: w },
      [
        { text: sameOnset, errorTag: "doc_nham_van" },
        { text: sameRime, errorTag: "nham_am_dau" },
      ],
      i,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 1 + (i % 5),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      scaffold: i < 3 ? "model" : "none",
      targetsError: i % 2 === 0 ? "doc_nham_van" : "nham_am_dau",
      prompt: { text: listenPrompt(LISTEN, [...w].join(" "), i) },
      listenTarget: { text: [...w].join(" ") },
      choices,
      answerKey,
      hints: ["Say the sounds fast, one after the other."],
      explanation: `Those sounds make "${w}".`,
      meta: meta(25),
    });
  });

  // ② Ba âm viết ra, ghép lại thành từ nào?
  WORDS.forEach(([w, , sameOnset, sameRime], i) => {
    const { choices, answerKey } = choicesOf(
      { text: w },
      [
        { text: sameRime, errorTag: "nham_am_dau" },
        { text: sameOnset, errorTag: "doc_nham_van" },
      ],
      i + 1,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      scaffold: i < 3 ? "model" : "none",
      targetsError: "nham_am_dau",
      prompt: { text: `${[...w].join(" - ")}. Which word is it?` },
      choices,
      answerKey,
      hints: ["Blend them: say it faster each time.", "Start with the first sound."],
      explanation: `${[...w].join(" - ")} makes "${w}".`,
      meta: meta(25),
    });
  });

  // ③ Kéo ba âm về đúng chỗ.
  WORDS.slice(0, 8).forEach(([w, emoji], i) => {
    const [c1, c2, c3] = [...w];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      prompt: { text: "Blend the sounds. Put them in order.", image: img(emoji, null, w, 1) },
      dragItems: [
        { id: "s2", text: c2 },
        { id: "s1", text: c1 },
        { id: "s3", text: c3 },
      ],
      dropZones: [
        { id: "z1", label: "First sound", accepts: ["s1", "s2", "s3"] },
        { id: "z2", label: "Middle sound", accepts: ["s1", "s2", "s3"] },
        { id: "z3", label: "Last sound", accepts: ["s1", "s2", "s3"] },
      ],
      answerKey: { z1: ["s1"], z2: ["s2"], z3: ["s3"] },
      hints: ["Say the word slowly and stretch each sound."],
      explanation: `${[...w].join(" - ")} makes "${w}".`,
      meta: meta(40),
    });
  });

  // ⑤ Đọc to từ đã ghép.
  [
    "cat dog pig",
    "sun bed cup",
    "hat bus net",
    "map log run",
    "big red pet",
    "cap dot pin",
    "bat bun cut",
    "log mat sit",
    "pen tip nut",
    "cut hop rib",
    "sun sat sit",
    "map mop mud",
  ].forEach((r, i) => {
    const words = r.split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: 2 + (i % 4),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: r, words },
      answerKey: { words },
      hints: READ_HINTS[i % 4],
      explanation: `Blend each one: "${r}".`,
      meta: meta(28),
    });
  });

  packOf(
    "ENL",
    code,
    "Ghép âm thành từ (Phonics Review). Hai ô nhiễu tách bạch: cùng âm đầu khác vần là doc_nham_van, cùng vần khác âm đầu là nham_am_dau — nên bảng lỗi nói được con nghe sót ở đầu hay ở cuối.",
    list,
  );
}

// ══════════════════════════════════════ 6. Tách âm trong từ ════════════════════════════════════
{
  const code = "ENL.RF.ISOLATE_SOUNDS";
  const src = "Global Stage 1 Literacy Book, Phonics Review (GS1-LIT.R) — chưa chụp trang sách";
  const { list, add, meta } = maker("enl-isolate", code, src);
  const WORDS = [
    ["sun", "☀️"],
    ["cat", "🐈"],
    ["pig", "🐖"],
    ["bed", "🛏️"],
    ["map", "🗺️"],
    ["dog", "🐕"],
    ["cup", "☕"],
    ["hen", "🐔"],
    ["bus", "🚌"],
    ["net", "🥅"],
  ];
  const SPOT = ["first", "last", "middle"];

  // ① Âm đầu / âm cuối / âm giữa — ô sai là một âm khác *có thật trong từ đó*, nên con phải
  //    nghe đúng vị trí chứ không phải loại trừ.
  [...WORDS, ...WORDS.slice(0, 5)].forEach(([w, emoji], i) => {
    const letters = [...w];
    // Vòng hai hỏi lại năm từ đầu ở một vị trí âm khác, nên không bài nào trùng bài nào.
    const which = SPOT[(i < WORDS.length ? i : i + 1) % 3];
    const idx = which === "first" ? 0 : which === "middle" ? 1 : 2;
    const others = letters.filter((_, k) => k !== idx);
    const { choices, answerKey } = choicesOf(
      { text: letters[idx] },
      [
        { text: others[0], errorTag: which === "first" ? "doc_nham_van" : "nham_am_dau" },
        { text: others[1] },
      ],
      i,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      scaffold: i < 6 ? "model" : "none",
      prompt: { text: `What is the ${which} sound in "${w}"?`, image: img(emoji, null, w, 1) },
      choices,
      answerKey,
      hints: [`Say "${w}" slowly and stretch it out.`, `Listen to the ${which} part.`],
      explanation: `The ${which} sound in "${w}" is "${letters[idx]}".`,
      meta: meta(25),
    });
  });

  // ② Nghe từ, chọn **âm đầu** — đề phải nói rõ là chọn âm, không phải chọn từ.
  const ASK_FIRST = [
    "Listen. Which sound does it start with?",
    "Listen, then tap the first sound.",
    "{ban} says a word. Tap its first sound!",
    "Which letter does the word begin with?",
    "Listen and tap the sound you hear first.",
    "Tap the first sound of the word.",
  ];
  WORDS.forEach(([w], i) => {
    const letters = [...w];
    const { choices, answerKey } = choicesOf(
      { text: letters[0] },
      [{ text: letters[2] }, { text: letters[1] }],
      i,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 2 + (i % 4),
      scaffold: i < 2 ? "model" : "none",
      prompt: { text: listenPrompt(ASK_FIRST, w, i) },
      listenTarget: { text: w },
      choices,
      answerKey,
      hints: LISTEN_HINTS[i % 5],
      explanation: `"${w}" starts with "${letters[0]}".`,
      meta: meta(25),
    });
  });

  // ③ Xếp từ theo âm đầu.
  [
    ["s", ["sun", "sit"], ["map", "mat"], "m"],
    ["c", ["cat", "cup"], ["bed", "bus"], "b"],
    ["p", ["pig", "pen"], ["dog", "den"], "d"],
    ["h", ["hen", "hat"], ["net", "nut"], "n"],
    ["b", ["bed", "bus"], ["cat", "cup"], "c"],
    ["m", ["map", "mat"], ["sun", "sit"], "s"],
  ].forEach(([l1, g1, g2, l2], i) => {
    const cards = [
      { id: "x1", text: g1[0] },
      { id: "y1", text: g2[0] },
      { id: "x2", text: g1[1] },
      { id: "y2", text: g2[1] },
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      prompt: { text: `Sort the words by their first sound.` },
      dragItems: cards,
      dropZones: [
        { id: "g1", label: `Starts with ${l1}`, accepts: ["x1", "y1", "x2", "y2"] },
        { id: "g2", label: `Starts with ${l2}`, accepts: ["x1", "y1", "x2", "y2"] },
      ],
      answerKey: { g1: ["x1", "x2"], g2: ["y1", "y2"] },
      hints: ["Say each word and listen to the very first bit."],
      explanation: `${g1[0]} and ${g1[1]} start with "${l1}".`,
      meta: meta(40),
    });
  });

  // ⑤ Đọc to.
  [
    "sun sit sat",
    "map mat mud",
    "cat cup cot",
    "bed bus big",
    "hen hat hop",
    "net nut nap",
    "dog dig den",
    "sit sat set",
    "bat bit but",
  ].forEach((r, i) => {
    const words = r.split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: 2 + (i % 4),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: r, words },
      answerKey: { words },
      hints: READ_HINTS[i % 4],
      explanation: `All three start with the same sound: "${r}".`,
      meta: meta(28),
    });
  });

  packOf(
    "ENL",
    code,
    "Tách âm đầu, âm giữa, âm cuối (Phonics Review). Ô nhiễu luôn là một âm **có thật trong chính từ đó**, nên con phải nghe đúng vị trí chứ không loại trừ được.",
    list,
  );
}
