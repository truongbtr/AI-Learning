/**
 * ESL — Global Stage 1 Language Book **Unit 2 "This Is Delicious"** (GS1-LB.U2): đồ ăn, hoa quả,
 * I like / I don't like. Lớp xong Unit 1 Review ngày 12/09 (nhật ký lớp), nên Unit 2 là thứ con
 * gặp trong ba tuần tới (`docs/09` §4b.1, tuần dự kiến 4–6).
 *
 * Từ vựng lấy đúng bảng scope and sequence của sách (Food 1: carrots, potatoes, tomatoes, onions,
 * mushrooms, strawberries, watermelons, peaches, coconuts, broccoli · Food 2: rice, salad, cereal,
 * chicken, cheese, soup, pasta, eggs). Chưa chụp trang sách nên mẫu câu phải rà lại khi có
 * (`docs/09` §4b.4).
 *
 *   node scripts/content-gen/esl-unit2.mjs
 */
import { choicesOf, ex, img, listenPrompt, numberId, writePack } from "./lib.mjs";

const SRC =
  "Global Stage 1 Language Book Unit 2 (GS1-LB.U2, scope and sequence) — chưa chụp trang sách";
const LISTEN = [
  "Listen and tap the right picture.",
  "{ban} says a word. Tap it!",
  "Listen carefully, then choose.",
  "What did you hear? Tap it.",
  "Listen again and pick one.",
  "Tap the picture you heard.",
];
const READ = [
  "Read this out loud!",
  "Read it to {ban}.",
  "Your turn to read!",
  "Read slowly and clearly.",
  "Read this sentence out loud.",
  "Let's read together!",
];
const HINTS_L = [
  ["Listen one more time."],
  ["Say the word yourself."],
  ["Close your eyes and listen."],
];
const HINTS_R = [
  ["Read one word at a time."],
  ["Read it in your head first."],
  ["Take a breath, then read."],
];

const maker = (prefix, code) => {
  const list = [];
  let n = 0;
  return {
    list,
    add: (e) => {
      n += 1;
      list.push(
        ex({
          id: numberId(prefix, n),
          language: "en",
          skillCodes: [code],
          ...e,
          meta: { lessonUnitCode: null, sourceRef: SRC, ...e.meta },
        }),
      );
    },
  };
};
const pack = (code, note, list) =>
  writePack(`content/exercises/esl/${code.split(".").slice(1).join(".")}.pack.json`, {
    skillCode: code,
    subject: "ESL",
    generatedBy: "claude-code",
    promptVersion: "exercise-gen-v2",
    lessonRefs: [],
    note,
    exercises: list,
  });
const pic = ([word, emoji]) => ({ image: img(emoji, null, word) });

/** Ba phần đầu chung cho gói từ vựng: nhìn tranh chọn từ, chọn tranh theo từ, nghe chọn tranh. */
function vocabCore(add, words, noun) {
  words.slice(0, 12).forEach(([w, emoji], i) => {
    const f1 = words[(i + 1) % words.length][0];
    const f2 = words[(i + 5) % words.length][0];
    const { choices, answerKey } = choicesOf({ text: w }, [{ text: f1 }, { text: f2 }], i);
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      scaffold: i < 6 ? "model" : "none",
      prompt: {
        text: [
          "What is this?",
          "What food is this?",
          `Name this ${noun}.`,
          "Tap the right word.",
          "What can you see?",
          "Which word matches?",
        ][i % 6],
        image: img(emoji, null, w, 1),
      },
      choices,
      answerKey,
      hints: ["Say the word out loud.", `It is a kind of ${noun}.`],
      explanation: `The picture shows ${w}.`,
      meta: { estSeconds: 20 },
    });
  });
  words.slice(0, 6).forEach((m, i) => {
    const { choices, answerKey } = choicesOf(
      pic(m),
      [pic(words[(i + 2) % words.length]), pic(words[(i + 7) % words.length])],
      i + 1,
    );
    add({
      type: "MCQ",
      difficulty: 2 + (i % 4),
      prompt: {
        text: [`Find the ${m[0]}.`, `Tap the ${m[0]}.`, `Tap the picture: ${m[0]}.`][i % 3],
      },
      choices,
      answerKey,
      hints: ["Read the word, then look at each picture."],
      explanation: `The picture shows ${m[0]}.`,
      meta: { estSeconds: 20 },
    });
  });
  words.slice(4, 12).forEach((m, i) => {
    const { choices, answerKey } = choicesOf(
      pic(m),
      [pic(words[(i + 1) % words.length]), pic(words[(i + 9) % words.length])],
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
      hints: HINTS_L[i % 3],
      explanation: `You heard "${m[0]}".`,
      meta: { estSeconds: 20 },
    });
  });
}

// ═══════════════════════════════════════════════════════════════════ 1. Food ═══════════════
{
  const code = "ESL.VOC.FOOD";
  const { list, add } = maker("esl-food", code);
  const WORDS = [
    ["carrots", "🥕"],
    ["rice", "🍚"],
    ["potatoes", "🥔"],
    ["soup", "🍲"],
    ["tomatoes", "🍅"],
    ["chicken", "🍗"],
    ["onions", "🧅"],
    ["cheese", "🧀"],
    ["mushrooms", "🍄"],
    ["pasta", "🍝"],
    ["broccoli", "🥦"],
    ["eggs", "🥚"],
    ["salad", "🥗"],
    ["cereal", "🥣"],
  ];
  vocabCore(add, WORDS, "food");

  // Xếp rau củ / món ăn khác.
  const VEG = [WORDS[0], WORDS[2], WORDS[4], WORDS[6], WORDS[8], WORDS[10]];
  const MEAL = [WORDS[1], WORDS[3], WORDS[5], WORDS[7], WORDS[9], WORDS[11]];
  for (let i = 0; i < 6; i++) {
    const a = [VEG[i], VEG[(i + 2) % 6]];
    const b = [MEAL[i], MEAL[(i + 3) % 6]];
    const cards = [
      { id: "v1", text: a[0][0], ...pic(a[0]) },
      { id: "m1", text: b[0][0], ...pic(b[0]) },
      { id: "v2", text: a[1][0], ...pic(a[1]) },
      { id: "m2", text: b[1][0], ...pic(b[1]) },
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      prompt: {
        text: [
          "Vegetables or other food? Sort them.",
          "Put the vegetables in the basket.",
          "Help {ban} sort the food.",
        ][i % 3],
      },
      dragItems: cards,
      dropZones: [
        { id: "veg", label: "Vegetables", accepts: ["v1", "m1", "v2", "m2"] },
        { id: "other", label: "Other food", accepts: ["v1", "m1", "v2", "m2"] },
      ],
      answerKey: { veg: ["v1", "v2"], other: ["m1", "m2"] },
      hints: ["Vegetables grow in the garden."],
      explanation: `${a[0][0]} and ${a[1][0]} are vegetables.`,
      meta: { estSeconds: 45 },
    });
  }

  [
    "I like rice.",
    "This is soup.",
    "Carrots are orange.",
    "Eggs for breakfast!",
    "I want pasta for lunch.",
  ].forEach((r, i) => {
    const words = r.replace(/[.!]/g, "").split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: 2 + (i % 4),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: r, words },
      answerKey: { words },
      hints: HINTS_R[i % 3],
      explanation: `This says: "${r}"`,
      meta: { estSeconds: 25 },
    });
  });
  [
    ["Draw your lunch. Label two foods.", "rice, chicken"],
    ["Write three vegetables.", "carrots, onions, potatoes"],
    ["Draw breakfast. Write: eggs.", "eggs"],
  ].forEach(([q, sample], i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 3 + i,
      prompt: { text: q },
      rubric: {
        criteria: ["Vẽ hoặc viết đúng yêu cầu", "Chính tả tiếng Anh đúng"],
        sampleAnswers: [sample],
      },
      answerKey: null,
      hints: ["Say the word before you write it."],
      explanation: "Check the spelling of each word.",
      meta: { estSeconds: 90 },
    });
  });
  pack(
    code,
    "Unit 2 — Food 1 và Food 2 của Global Stage 1. Không có mã lỗi nào tả được 'chưa thuộc từ', nên gói từ vựng này không gắn thẻ (validator chỉ cảnh báo).",
    list,
  );
}

// ═══════════════════════════════════════════════════════════════════ 2. Fruits ═════════════
{
  const code = "ESL.VOC.FRUITS";
  const { list, add } = maker("esl-fruit", code);
  const WORDS = [
    ["strawberries", "🍓"],
    ["watermelons", "🍉"],
    ["peaches", "🍑"],
    ["coconuts", "🥥"],
    ["apples", "🍎"],
    ["bananas", "🍌"],
    ["oranges", "🍊"],
    ["grapes", "🍇"],
    ["pears", "🍐"],
    ["lemons", "🍋"],
    ["mangoes", "🥭"],
    ["cherries", "🍒"],
  ];
  vocabCore(add, WORDS, "fruit");

  // Số ít / số nhiều — mô tả kỹ năng nêu đúng lỗi này; ô nhiễu quên -s mang mã thật.
  const NUM = ["", "one", "two", "three", "four", "five", "six"];
  [
    [3, "apple", "apples", "🍎"],
    [2, "pear", "pears", "🍐"],
    [4, "banana", "bananas", "🍌"],
    [5, "orange", "oranges", "🍊"],
    [6, "lemon", "lemons", "🍋"],
    [2, "grape", "grapes", "🍇"],
  ].forEach(([v, one, many, emoji], i) => {
    const right = `${NUM[v]} ${many}`;
    const { choices, answerKey } = choicesOf(
      { text: right },
      [
        { text: `${NUM[v]} ${one}`, errorTag: "thieu_s_so_nhieu" },
        { text: `${NUM[v + 1] ?? "seven"} ${many}` },
      ],
      i,
    );
    add({
      type: "MCQ",
      difficulty: 2 + (i % 4),
      targetsError: "thieu_s_so_nhieu",
      prompt: {
        text: [
          "How many? Choose the right words.",
          "Count, then pick the words.",
          "What do you see?",
        ][i % 3],
        image: img(emoji, null, many, v),
      },
      choices,
      answerKey,
      hints: ["Count first.", "More than one needs an -s."],
      explanation: `There are ${right}.`,
      meta: { estSeconds: 30 },
    });
  });

  [
    ["peaches", "🍑", 4],
    ["cherries", "🍒", 7],
    ["strawberries", "🍓", 5],
    ["coconuts", "🥥", 3],
  ].forEach(([word, emoji, v], i) => {
    add({
      type: "COUNT_TAP",
      difficulty: 1 + i,
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      prompt: { text: [`How many ${word}? Tap each one.`, `Count the ${word}.`][i % 2] },
      countTarget: {
        objects: img(emoji, null, word, v),
        correctCount: v,
        layout: i % 2 === 0 ? "grid" : "line",
      },
      answerKey: v,
      hints: ["Say the number as you tap."],
      explanation: `There are ${v} ${word}.`,
      meta: { estSeconds: 30 },
    });
  });
  [
    "I like peaches.",
    "Watermelons are big.",
    "Three red cherries.",
    "Coconuts are hard.",
    "Bananas are yellow.",
  ].forEach((r, i) => {
    const words = r.replace(/[.!]/g, "").split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: 1 + (i % 5),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[(i + 1) % 6] },
      readTarget: { text: r, words },
      answerKey: { words },
      hints: HINTS_R[i % 3],
      explanation: `This says: "${r}"`,
      meta: { estSeconds: 25 },
    });
  });
  pack(
    code,
    "Unit 2 — hoa quả (strawberries, watermelons, peaches, coconuts của sách, thêm quả quen thuộc). Bài 'three apple' / 'three apples' mang mã thieu_s_so_nhieu — lỗi mô tả kỹ năng nêu rõ.",
    list,
  );
}

// ═══════════════════════════════════════════════════════════ 3. I like / I don't like ══════
{
  const code = "ESL.GR.LIKE_DONT_LIKE";
  const { list, add } = maker("esl-like", code);
  const FOODS = [
    ["apples", "🍎"],
    ["onions", "🧅"],
    ["rice", "🍚"],
    ["mushrooms", "🍄"],
    ["bananas", "🍌"],
    ["soup", "🍲"],
    ["eggs", "🥚"],
    ["broccoli", "🥦"],
    ["pasta", "🍝"],
    ["carrots", "🥕"],
  ];
  const COUNTABLE = {
    apples: "apple",
    onions: "onion",
    mushrooms: "mushroom",
    bananas: "banana",
    eggs: "egg",
    carrots: "carrot",
  };

  // ① Nhìn mặt cười / mặt nhăn rồi chọn câu.
  FOODS.forEach(([food], i) => {
    const like = i % 2 === 0;
    const right = like ? `I like ${food}` : `I don't like ${food}`;
    const opposite = like ? `I don't like ${food}` : `I like ${food}`;
    const wrongs = [{ text: opposite }];
    if (COUNTABLE[food])
      wrongs.push({
        text: `${like ? "I like" : "I don't like"} ${COUNTABLE[food]}`,
        errorTag: "thieu_s_so_nhieu",
      });
    const { choices, answerKey } = choicesOf({ text: right }, wrongs, i);
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      scaffold: i < 6 ? "model" : "none",
      targetsError: COUNTABLE[food] ? "thieu_s_so_nhieu" : null,
      prompt: {
        text: [
          like ? "Yummy! What does she say?" : "Yuck! What does he say?",
          "Look at the face. Pick the sentence.",
          "Which sentence matches the picture?",
        ][i % 3],
        image: img(like ? "😋" : "😖", null, `${like ? "like" : "don't like"} ${food}`),
      },
      choices,
      answerKey,
      hints: [
        like ? "A happy face means like." : "A sad face means don't like.",
        "More than one needs an -s.",
      ],
      explanation: `${right}.`,
      meta: { estSeconds: 30 },
    });
  });

  // ② Nghe câu, chọn mặt.
  FOODS.slice(0, 8).forEach(([food], i) => {
    const like = i % 2 === 1;
    const spoken = like ? `I like ${food}.` : `I don't like ${food}.`;
    const happy = { image: img("😋", null, "like") };
    const sad = { image: img("😖", null, "don't like") };
    const { choices, answerKey } = choicesOf(like ? happy : sad, [like ? sad : happy], i);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 1 + (i % 4),
      prompt: {
        text: [
          "Listen. Happy face or sad face?",
          "Does {ban} like it? Listen and tap.",
          "Listen, then tap a face.",
        ][i % 3],
      },
      listenTarget: { text: spoken },
      choices,
      answerKey,
      hints: ['Listen for the word "don\'t".'],
      explanation: `You heard "${spoken}"`,
      meta: { estSeconds: 25 },
    });
  });

  // ③ Nghe hỏi "Do you like…?" — chọn câu trả lời đúng mẫu.
  FOODS.forEach(([food], i) => {
    const yes = i % 2 === 0;
    const { choices, answerKey } = choicesOf(
      { text: yes ? "Yes, I do." : "No, I don't." },
      [
        { text: yes ? "Yes, I like." : "No, I not." },
        { text: yes ? "No, I don't." : "Yes, I do." },
      ],
      i,
    );
    add({
      type: "MCQ",
      difficulty: 3 + (i % 3),
      prompt: {
        text: `Do you like ${food}? ${yes ? "You do!" : "You don't!"}`,
        image: img(yes ? "😋" : "😖", null, food),
      },
      choices,
      answerKey,
      hints: ["The short answer is: Yes, I do. / No, I don't."],
      explanation: yes ? "Yes, I do." : "No, I don't.",
      meta: { estSeconds: 30 },
    });
  });

  // ④ Xếp món vào hai giỏ theo lời kể.
  [
    [
      ["rice", "eggs"],
      ["onions", "soup"],
    ],
    [
      ["apples", "pasta"],
      ["broccoli", "mushrooms"],
    ],
    [
      ["bananas", "soup"],
      ["carrots", "rice"],
    ],
    [
      ["mushrooms", "eggs"],
      ["apples", "onions"],
    ],
  ].forEach(([likes, not], i) => {
    const e = (f) => FOODS.find((x) => x[0] === f)[1];
    const cards = [
      { id: "l1", text: likes[0], image: img(e(likes[0]), null, likes[0]) },
      { id: "n1", text: not[0], image: img(e(not[0]), null, not[0]) },
      { id: "l2", text: likes[1], image: img(e(likes[1]), null, likes[1]) },
      { id: "n2", text: not[1], image: img(e(not[1]), null, not[1]) },
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + i,
      prompt: { text: `{ban} likes ${likes[0]} and ${likes[1]}. Sort the food.` },
      dragItems: cards,
      dropZones: [
        { id: "yes", label: "Likes", accepts: ["l1", "n1", "l2", "n2"] },
        { id: "no", label: "Doesn't like", accepts: ["l1", "n1", "l2", "n2"] },
      ],
      answerKey: { yes: ["l1", "l2"], no: ["n1", "n2"] },
      hints: ["Listen again for the two foods {ban} likes."],
      explanation: `{ban} likes ${likes[0]} and ${likes[1]}.`,
      meta: { estSeconds: 45 },
    });
  });

  [
    "I like apples.",
    "I don't like onions.",
    "Do you like pasta?",
    "Yes, I do.",
    "No, I don't.",
  ].forEach((r, i) => {
    const words = r.replace(/[.?,!]/g, "").split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: 1 + (i % 5),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: r, words },
      answerKey: { words },
      hints: HINTS_R[i % 3],
      explanation: `This says: "${r}"`,
      meta: { estSeconds: 25 },
    });
  });
  [
    ["Write: I like ___. Draw the food.", "I like bananas."],
    ["Write: I don't like ___.", "I don't like onions."],
    ["Draw two foods you like. Label them.", "rice, apples"],
  ].forEach(([q, sample], i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 3 + i,
      prompt: { text: q },
      rubric: {
        criteria: [
          "Viết đúng mẫu câu like / don't like",
          "Danh từ số nhiều có -s khi cần",
          "Viết hoa chữ I",
        ],
        sampleAnswers: [sample],
      },
      answerKey: null,
      hints: ["Start with a capital I."],
      explanation: "Check: capital I, and an -s for more than one.",
      meta: { estSeconds: 90 },
    });
  });
  pack(
    code,
    "Unit 2 — I like / I don't like / Do you like…? Ô 'I like apple' mang mã thieu_s_so_nhieu (lỗi mô tả kỹ năng nêu). Lời kể trong bài kéo-thả dùng {ban} thay cho tên người.",
    list,
  );
}
