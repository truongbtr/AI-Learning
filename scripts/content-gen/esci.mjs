/**
 * English Science — mười gói đầu tiên. Môn này có trong thời khoá biểu 1B3 nhưng ngân hàng bài
 * đang **trống hoàn toàn** (0/47 kỹ năng), nên đây là ưu tiên 2 của đợt 2.
 *
 * Trường chưa đưa sách English Science, nên mỗi bài ghi rõ `sourceRef` là chuẩn nào (NGSS lớp 1,
 * hoặc chủ đề vật liệu của chương trình quốc tế) — đúng như `docs/09` §1 yêu cầu khi chưa có sách.
 * Khi có sách phải rà lại thứ tự chủ đề và từ vựng.
 *
 * Câu lệnh tiếng Anh giữ dưới 8 từ (rubric `docs/10` §6.3) — con mới lớp 1 và đang học tiếng Anh.
 *
 *   node scripts/content-gen/esci.mjs
 */
import { cap, choicesOf, ex, img, listenPrompt, numberId, writePack } from "./lib.mjs";

const PICK = (g) => [
  `Which one is ${g.is}?`,
  `Find ${g.noun}.`,
  `Tap ${g.noun}.`,
  `Which picture shows ${g.noun}?`,
  `Help {ban} find ${g.noun}.`,
  `Only one is ${g.is}. Which one?`,
];
/** Đếm đúng thứ đang học, không đếm hòn đá trong gói "vật sống" (rubric 1). */
const COUNT_CAT = (what) => [
  `Count the ${what}.`,
  `How many ${what}? Tap each one.`,
  `Tap every one. How many ${what}?`,
  `Count them all: ${what}.`,
  `Tap and count the ${what}.`,
  `How many ${what} can you see?`,
];
const LISTEN = [
  "Listen and tap the right picture.",
  "{ban} says a word. Tap it!",
  "Listen carefully, then choose.",
  "What did you hear? Tap it.",
  "Listen again and pick the picture.",
  "Tap the picture you heard.",
];
/** Bài nghe câu lệnh: đề phải mời con *làm theo*, không phải "chọn từ con vừa nghe". */
const LISTEN_CMD = [
  "Listen, then tap the right picture.",
  "{ban} asks you to do something. Listen!",
  "Listen to {ban} and tap one.",
  "Do what you hear!",
  "Listen and tap one picture.",
  "Listen. Which one is it?",
];
const READ = [
  "Read this out loud!",
  "Read it to {ban}.",
  "Your turn to read!",
  "Read slowly and clearly.",
  "Read this sentence out loud.",
  "Let's read together!",
];
const WRITE_HINTS = [
  ["Draw first, then write the word."],
  ["Copy the word letter by letter."],
  ["Say the word out loud before you write."],
  ["Take your time and write neatly."],
];
const LISTEN_HINTS = [
  ["Listen one more time."],
  ["Say the word out loud yourself."],
  ["Close your eyes and listen."],
  ["Listen to the first sound."],
  ["Think about what the word means."],
];
const READ_HINTS = [
  ["Read one word at a time."],
  ["Sound out the hard word first."],
  ["Read it in your head first."],
  ["Take a breath, then read."],
];

/** Một ô lựa chọn: chữ tiếng Anh kèm hình, vì con vừa đọc vừa nhìn tranh. */
const opt = (m, errorTag) => {
  const o = { text: m[0], image: img(m[1], null, m[0]) };
  if (errorTag) o.errorTag = errorTag;
  return o;
};

function sciencePack(cfg) {
  const { code, prefix, src, note, groups, facts, counts, sentences, writes } = cfg;
  const list = [];
  let n = 0;
  const add = (e) => {
    n += 1;
    list.push(ex({ id: numberId(prefix, n), language: "en", skillCodes: [code], ...e }));
  };
  const meta = (s) => ({ estSeconds: s, lessonUnitCode: null, sourceRef: src });
  const [A, B] = groups;

  // ① "Which one is living?" — một ô thuộc nhóm A, hai ô thuộc nhóm B.
  A.members.slice(0, 8).forEach((m, i) => {
    const foils = [B.members[i % B.members.length], B.members[(i + 3) % B.members.length]];
    const { choices, answerKey } = choicesOf(
      opt(m),
      foils.map((f) => opt(f)),
      i,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 3),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      scaffold: i < 4 ? "model" : "none",
      prompt: { text: PICK(A)[i % 6] },
      choices,
      answerKey,
      hints: [`Think: ${cap(A.hint)}.`, `A ${m[0]} is ${A.is}.`],
      explanation: `A ${m[0]} is ${A.is}.`,
      meta: meta(20),
    });
  });

  // ② Ngược lại — hỏi nhóm B, để con không quen tay chọn theo một nhóm.
  B.members.slice(0, 4).forEach((m, i) => {
    const foils = [A.members[i % A.members.length], A.members[(i + 4) % A.members.length]];
    const { choices, answerKey } = choicesOf(
      opt(m),
      foils.map((f) => opt(f)),
      i + 1,
    );
    add({
      type: "MCQ",
      difficulty: 2 + (i % 3),
      prompt: { text: PICK(B)[(i + 2) % 6] },
      choices,
      answerKey,
      hints: [`Think: ${cap(B.hint)}.`, `A ${m[0]} is ${B.is}.`],
      explanation: `A ${m[0]} is ${B.is}.`,
      meta: meta(20),
    });
  });

  // ③ Câu hỏi khái niệm — phần khoa học thật, viết tay từng câu.
  facts.forEach((f, i) => {
    const { choices, answerKey } = choicesOf(
      { text: f.correct },
      f.wrongs.map((w) => (w.tag ? { text: w.t, errorTag: w.tag } : { text: w.t })),
      i,
    );
    add({
      type: "MCQ",
      difficulty: f.d,
      scaffold: i < 2 ? "model" : "none",
      targetsError: f.wrongs.find((w) => w.tag)?.tag ?? null,
      prompt: f.pic ? { text: f.q, image: img(f.pic, null, f.picLabel ?? null) } : { text: f.q },
      choices,
      answerKey,
      hints: f.hints,
      explanation: f.why,
      meta: meta(f.d >= 4 ? 30 : 25),
    });
  });

  // ④a Nghe **câu lệnh phân loại** — đo đúng kỹ năng, không chỉ đo từ vựng (rubric 1).
  [0, 1, 2].forEach((k) => {
    const right = A.members[(k * 2) % A.members.length];
    const foils = [B.members[k % B.members.length], B.members[(k + 4) % B.members.length]];
    const { choices, answerKey } = choicesOf(
      opt(right),
      foils.map((f) => opt(f)),
      k + 1,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 3 + k,
      prompt: { text: listenPrompt(LISTEN_CMD, A.spoken, k) },
      listenTarget: { text: A.spoken },
      choices,
      answerKey,
      hints: [`Remember: ${cap(A.hint)}.`],
      explanation: `A ${right[0]} is ${A.is}.`,
      meta: meta(28),
    });
  });

  // ④b Nghe từ, chọn tranh.
  [...A.members, ...B.members].slice(0, 7).forEach((m, i) => {
    const pool = [...A.members, ...B.members].filter((x) => x[0] !== m[0]);
    const foils = [pool[i % pool.length], pool[(i + 5) % pool.length]];
    const { choices, answerKey } = choicesOf(
      opt(m),
      foils.map((f) => opt(f)),
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
      meta: meta(20),
    });
  });

  // ⑤ Xếp vào hai rổ — việc phân loại, cốt lõi của khoa học lớp 1.
  const SORT_ASK = [
    "Put each one in the right basket.",
    "Sort them into two baskets.",
    "Drag each picture to its basket.",
    "Help {ban} sort these four.",
    "Two go here, two go there. Which is which?",
    "Where does each one belong?",
  ];
  for (let i = 0; i < 5; i++) {
    // Bước nhảy lệch nhau (i và i+3, i và i+2) nên năm bài không bao giờ trùng bộ thẻ.
    const a1 = A.members[i % A.members.length];
    const a2 = A.members[(i + 3) % A.members.length];
    const b1 = B.members[i % B.members.length];
    const b2 = B.members[(i + 2) % B.members.length];
    const cards = [
      { id: "c1", text: a1[0], image: img(a1[1], null, a1[0]) },
      { id: "c2", text: b1[0], image: img(b1[1], null, b1[0]) },
      { id: "c3", text: a2[0], image: img(a2[1], null, a2[0]) },
      { id: "c4", text: b2[0], image: img(b2[1], null, b2[0]) },
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      prompt: { text: SORT_ASK[i % 6] },
      dragItems: cards,
      dropZones: [
        { id: "ga", label: A.label, accepts: ["c1", "c2", "c3", "c4"] },
        { id: "gb", label: B.label, accepts: ["c1", "c2", "c3", "c4"] },
      ],
      answerKey: { ga: ["c1", "c3"], gb: ["c2", "c4"] },
      hints: [`Ask yourself: ${A.hint}.`],
      explanation: `${cap(a1[0])} and ${a2[0]} go in "${A.label}".`,
      meta: meta(45),
    });
  }

  // ⑥ Đếm — vẫn là khoa học (quan sát rồi đếm), và là dạng bài con thích nhất.
  counts.forEach(([word, emoji, howMany, cat = A.countWord], i) => {
    add({
      type: "COUNT_TAP",
      difficulty: 1 + (i % 4),
      assetTheme: i % 2 === 0 ? "garden" : "robot",
      prompt: { text: COUNT_CAT(cat)[i % 6] },
      countTarget: {
        objects: img(emoji, null, word, howMany),
        correctCount: howMany,
        layout: i % 2 === 0 ? "grid" : "line",
      },
      answerKey: howMany,
      hints: [`These are all ${cat}. Touch each one.`],
      explanation: `There are ${howMany} ${word}.`,
      meta: meta(30),
    });
  });

  // ⑦ Đọc to câu khoa học — vừa luyện đọc vừa nhắc lại khái niệm.
  sentences.forEach((s, i) => {
    const words = s.replace(/[.!?]/g, "").split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: 2 + (i % 4),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: s, words },
      answerKey: { words },
      hints: READ_HINTS[i % 4],
      explanation: `This says: "${s}"`,
      meta: meta(30),
    });
  });

  // ⑧ Vẽ và viết — ba mẹ chụp, hàng chờ AI chấm.
  writes.forEach((w, i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 3 + (i % 3),
      prompt: { text: w.q },
      rubric: { criteria: w.criteria, sampleAnswers: w.sample },
      answerKey: null,
      hints: WRITE_HINTS[i % 4],
      explanation: w.why,
      meta: meta(90),
    });
  });

  writePack(`content/exercises/esci/${code.split(".").slice(1).join(".")}.pack.json`, {
    skillCode: code,
    subject: "ESCI",
    generatedBy: "claude-code",
    promptVersion: "exercise-gen-v2",
    lessonRefs: [],
    note,
    exercises: list,
  });
}

const NO_BOOK = "chưa có sách English Science của trường";

// ───────────────────────────────────────────── 1 ─────────────────────────────────────────────
sciencePack({
  code: "ESCI.LS.LIVING_NONLIVING",
  prefix: "esci-living",
  src: `NGSS 1-LS1 / INTL Living things — ${NO_BOOK}`,
  note: "Vật sống – vật không sống. Lỗi kinh điển của trẻ 6 tuổi: 'nó chuyển động nên nó sống' (ô tô, mây) — gói này có hẳn ba câu nhắm vào đó.",
  groups: [
    {
      id: "living",
      is: "living",
      noun: "a living thing",
      countWord: "living things",
      spoken: "Tap something that is living.",
      label: "Living",
      hint: "living things grow, eat and have babies",
      members: [
        ["dog", "🐕"],
        ["tree", "🌳"],
        ["bird", "🐦"],
        ["fish", "🐟"],
        ["flower", "🌸"],
        ["cat", "🐈"],
        ["frog", "🐸"],
        ["butterfly", "🦋"],
      ],
    },
    {
      id: "nonliving",
      is: "not living",
      noun: "something that is not living",
      countWord: "things that are not living",
      spoken: "Tap something that is not living.",
      label: "Not living",
      hint: "it does not grow and does not eat",
      members: [
        ["rock", "🪨"],
        ["car", "🚗"],
        ["chair", "🪑"],
        ["ball", "⚽"],
        ["cup", "☕"],
        ["spoon", "🥄"],
        ["book", "📖"],
        ["key", "🔑"],
      ],
    },
  ],
  facts: [
    {
      q: "Which one grows bigger?",
      correct: "tree",
      wrongs: [{ t: "rock" }, { t: "cup" }],
      hints: ["Only living things grow."],
      why: "A tree grows. A rock stays the same.",
      d: 2,
    },
    {
      q: "A car moves. Is a car living?",
      correct: "No",
      wrongs: [{ t: "Yes" }],
      hints: ["Moving is not enough.", "A car needs a driver."],
      why: "A car moves, but it does not grow or eat.",
      d: 4,
    },
    {
      q: "Which one needs food?",
      correct: "cat",
      wrongs: [{ t: "chair" }, { t: "key" }],
      hints: ["Living things eat."],
      why: "A cat eats. A chair does not.",
      d: 2,
    },
    {
      q: "Which one can have babies?",
      correct: "bird",
      wrongs: [{ t: "ball" }, { t: "book" }],
      hints: ["Only living things have babies."],
      why: "Birds lay eggs and have baby birds.",
      d: 3,
    },
    {
      q: "Is a flower living?",
      correct: "Yes",
      wrongs: [{ t: "No" }],
      hints: ["Plants drink water and grow."],
      why: "Plants are living things too.",
      d: 3,
      pic: "🌸",
      picLabel: "flower",
    },
    {
      q: "Clouds move in the sky. Are they living?",
      correct: "No",
      wrongs: [{ t: "Yes" }],
      hints: ["Do clouds eat or grow babies?"],
      why: "Wind moves the clouds. They are not living.",
      d: 5,
    },
    {
      q: "Which one breathes air?",
      correct: "frog",
      wrongs: [{ t: "rock" }, { t: "spoon" }],
      hints: ["Living things need air."],
      why: "A frog breathes. A rock does not.",
      d: 3,
    },
    {
      q: "Is a wooden chair living?",
      correct: "No",
      wrongs: [{ t: "Yes" }],
      hints: ["The tree was living. The chair is not."],
      why: "Wood came from a tree, but a chair does not grow.",
      d: 5,
    },
  ],
  counts: [
    ["trees", "🌳", 4],
    ["birds", "🐦", 6],
    ["rocks", "🪨", 3, "things that are not living"],
    ["fish", "🐟", 7],
  ],
  sentences: [
    "A dog is living.",
    "A rock is not living.",
    "Living things grow and eat.",
    "Plants are living things.",
  ],
  writes: [
    {
      q: "Draw one living thing. Write its name.",
      criteria: ["Vẽ một vật sống", "Viết đúng tên tiếng Anh", "Chữ rõ ràng"],
      sample: ["dog", "tree"],
      why: "Living things grow, eat and need air.",
    },
    {
      q: "Write two things that are not living.",
      criteria: ["Viết hai vật không sống", "Chính tả đúng"],
      sample: ["rock, car"],
      why: "Not living things do not grow or eat.",
    },
    {
      q: "Draw a tree. Write: A tree is living.",
      criteria: ["Vẽ cái cây", "Chép đúng câu", "Viết hoa đầu câu và dấu chấm"],
      sample: ["A tree is living."],
      why: "A tree grows, so it is living.",
    },
  ],
});

// ───────────────────────────────────────────── 2 ─────────────────────────────────────────────
sciencePack({
  code: "ESCI.INQ.OBSERVE_DESCRIBE",
  prefix: "esci-observe",
  src: `NGSS K-2 Science Practices (observing) — ${NO_BOOK}`,
  note: "Quan sát bằng năm giác quan. Nhóm A là bộ phận dùng để quan sát, nhóm B là vật được quan sát — con hay lẫn 'nhìn bằng mắt' với 'nhìn thấy cái gì'.",
  groups: [
    {
      id: "senses",
      is: "a body part",
      noun: "a body part",
      countWord: "body parts",
      spoken: "Tap a part of your body.",
      label: "Body part",
      hint: "you use it to look, listen, smell, taste or touch",
      members: [
        ["eyes", "👀"],
        ["ears", "👂"],
        ["nose", "👃"],
        ["tongue", "👅"],
        ["hand", "🤚"],
        ["mouth", "👄"],
      ],
    },
    {
      id: "things",
      is: "something to look at",
      noun: "something to look at",
      countWord: "things to observe",
      spoken: "Tap something you can look at.",
      label: "Thing to observe",
      hint: "it is something out in the world, not on your body",
      members: [
        ["leaf", "🍃"],
        ["bell", "🔔"],
        ["lemon", "🍋"],
        ["ice", "🧊"],
        ["flower", "🌸"],
        ["drum", "🥁"],
      ],
    },
  ],
  facts: [
    {
      q: "Which part do you see with?",
      correct: "eyes",
      wrongs: [{ t: "ears" }, { t: "nose" }],
      hints: ["Point to the part you look with."],
      why: "We see with our eyes.",
      d: 1,
    },
    {
      q: "Which part do you hear with?",
      correct: "ears",
      wrongs: [{ t: "eyes" }, { t: "hand" }],
      hints: ["Cover them and sounds get quiet."],
      why: "We hear with our ears.",
      d: 1,
    },
    {
      q: "How does ice feel?",
      correct: "cold",
      wrongs: [{ t: "hot" }, { t: "loud" }],
      hints: ["Think of holding ice."],
      why: "Ice is cold when we touch it.",
      d: 2,
      pic: "🧊",
      picLabel: "ice",
    },
    {
      q: "How does a lemon taste?",
      correct: "sour",
      wrongs: [{ t: "sweet" }, { t: "soft" }],
      hints: ["Your face goes funny when you eat one."],
      why: "A lemon tastes sour.",
      d: 3,
      pic: "🍋",
      picLabel: "lemon",
    },
    {
      q: "Which sense tells you a flower is sweet?",
      correct: "smell",
      wrongs: [{ t: "sight" }, { t: "hearing" }],
      hints: ["Put your nose close to it."],
      why: "We smell a flower with our nose.",
      d: 4,
    },
    {
      q: "You close your eyes. Can you still hear?",
      correct: "Yes",
      wrongs: [{ t: "No" }],
      hints: ["Try it with your ears open."],
      why: "Eyes and ears work on their own.",
      d: 4,
    },
    {
      q: "Which word describes a drum?",
      correct: "loud",
      wrongs: [{ t: "sour" }, { t: "cold" }],
      hints: ["Which sense hears a drum?"],
      why: "A drum makes a loud sound.",
      d: 3,
    },
    {
      q: "Which sense do you use for a rough wall?",
      correct: "touch",
      wrongs: [{ t: "taste" }, { t: "smell" }],
      hints: ["Run your hand along it."],
      why: "We feel rough and smooth by touching.",
      d: 5,
    },
  ],
  counts: [
    ["eyes", "👀", 3, "eyes"],
    ["flowers", "🌸", 5, "flowers to look at"],
    ["bells", "🔔", 4, "bells to listen to"],
    ["lemons", "🍋", 6, "lemons to taste"],
  ],
  sentences: [
    "I see with my eyes.",
    "I hear with my ears.",
    "The ice is cold.",
    "The lemon is sour.",
  ],
  writes: [
    {
      q: "Draw something loud. Write its name.",
      criteria: ["Vẽ vật phát ra tiếng to", "Viết tên tiếng Anh"],
      sample: ["drum", "bell"],
      why: "We hear loud things with our ears.",
    },
    {
      q: "Write: I see with my eyes.",
      criteria: ["Chép đúng cả câu", "Viết hoa chữ I", "Có dấu chấm"],
      sample: ["I see with my eyes."],
      why: "Eyes are for seeing.",
    },
    {
      q: "Draw one cold thing and one hot thing.",
      criteria: ["Vẽ hai vật", "Ghi nhãn cold và hot"],
      sample: ["ice — cold, tea — hot"],
      why: "We feel hot and cold by touching.",
    },
  ],
});

// ───────────────────────────────────────────── 3 ─────────────────────────────────────────────
sciencePack({
  code: "ESCI.LS.NEEDS_OF_LIVING_THINGS",
  prefix: "esci-needs",
  src: `NGSS 1-LS1-1 — ${NO_BOOK}`,
  note: "Nhu cầu của sinh vật: nước, thức ăn, không khí, nơi ở, ánh sáng. Nhóm B cố ý toàn đồ trẻ con thích (đồ chơi, điện thoại) vì đó chính là câu trả lời sai các con hay đưa ra.",
  groups: [
    {
      id: "needs",
      is: "a real need",
      noun: "something living things need",
      countWord: "things living things need",
      spoken: "Tap something a plant really needs.",
      label: "Living things need this",
      hint: "without it, a plant or animal cannot live",
      members: [
        ["water", "💧"],
        ["food", "🍎"],
        ["air", "💨"],
        ["sunlight", "☀️"],
        ["home", "🏠"],
        ["soil", "🪴"],
      ],
    },
    {
      id: "wants",
      is: "just nice to have",
      noun: "something living things do not need",
      countWord: "things nobody needs to live",
      spoken: "Tap something a plant does not need.",
      label: "Nice, but not needed",
      hint: "it is fun, but nothing dies without it",
      members: [
        ["toy", "🧸"],
        ["phone", "📱"],
        ["hat", "🎩"],
        ["car", "🚗"],
        ["balloon", "🎈"],
        ["candy", "🍬"],
      ],
    },
  ],
  facts: [
    {
      q: "What does a plant need to grow?",
      correct: "water",
      wrongs: [{ t: "toy" }, { t: "phone" }],
      hints: ["What do we pour on plants?"],
      why: "Plants need water, sunlight and soil.",
      d: 1,
    },
    {
      q: "What does a fish need most?",
      correct: "water",
      wrongs: [{ t: "hat" }, { t: "candy" }],
      hints: ["Where does a fish live?"],
      why: "A fish lives in water and breathes in water.",
      d: 2,
      pic: "🐟",
      picLabel: "fish",
    },
    {
      q: "Do plants need a toy?",
      correct: "No",
      wrongs: [{ t: "Yes" }],
      hints: ["Plants cannot play."],
      why: "Plants need water, light and air — not toys.",
      d: 2,
    },
    {
      q: "What do animals breathe?",
      correct: "air",
      wrongs: [{ t: "soil" }, { t: "candy" }],
      hints: ["Take a deep breath. What came in?"],
      why: "Animals breathe air.",
      d: 3,
    },
    {
      q: "A plant is in a dark box. What is missing?",
      correct: "sunlight",
      wrongs: [{ t: "water" }, { t: "air" }],
      hints: ["A dark box has no light."],
      why: "Plants need sunlight to make food.",
      d: 5,
    },
    {
      q: "Where does a bird keep its babies?",
      correct: "nest",
      wrongs: [{ t: "car" }, { t: "cup" }],
      hints: ["Look up in a tree."],
      why: "A nest is the bird's home.",
      d: 3,
    },
    {
      q: "Which one is food for a rabbit?",
      correct: "carrot",
      wrongs: [{ t: "balloon" }, { t: "spoon" }],
      hints: ["Rabbits eat plants."],
      why: "Rabbits eat carrots and grass.",
      d: 2,
    },
    {
      q: "You forget to water a plant. What happens?",
      correct: "It dries up",
      wrongs: [{ t: "It grows faster" }, { t: "Nothing changes" }],
      hints: ["Water is a need, not a want."],
      why: "Without water a plant dries up.",
      d: 4,
    },
  ],
  counts: [
    ["apples", "🍎", 5, "apples to eat"],
    ["water drops", "💧", 8, "drops of water"],
    ["houses", "🏠", 3, "homes"],
    ["toys", "🧸", 4, "toys nobody needs to live"],
  ],
  sentences: [
    "Plants need water and light.",
    "Animals need food and air.",
    "A nest is a bird home.",
    "We all need water every day.",
  ],
  writes: [
    {
      q: "Draw a plant. Write what it needs.",
      criteria: ["Vẽ cây", "Ghi ít nhất hai nhu cầu", "Chính tả đúng"],
      sample: ["water, sunlight, soil"],
      why: "Plants need water, sunlight, air and soil.",
    },
    {
      q: "Write three things a dog needs.",
      criteria: ["Viết ba nhu cầu", "Không ghi đồ chơi"],
      sample: ["food, water, home"],
      why: "A dog needs food, water, air and a home.",
    },
    {
      q: "Write: Plants need water.",
      criteria: ["Chép đúng câu", "Viết hoa đầu câu", "Có dấu chấm"],
      sample: ["Plants need water."],
      why: "Water is a need for every plant.",
    },
  ],
});

// ───────────────────────────────────────────── 4 ─────────────────────────────────────────────
sciencePack({
  code: "ESCI.VOC.MATERIALS",
  prefix: "esci-vocmat",
  src: `INTL Materials topic — ${NO_BOOK}`,
  note: "Từ vựng vật liệu. Đây là gói ESCI duy nhất dùng được thẻ lỗi: phương án nhiễu là chính từ đó viết lệch một chữ (metel / plastik) → sai_chinh_ta_tu.",
  groups: [
    {
      id: "materials",
      is: "a material",
      noun: "a material",
      countWord: "materials",
      spoken: "Tap a material.",
      label: "Material",
      hint: "it is what a thing is made of",
      members: [
        ["wood", "🪵"],
        ["metal", "🔩"],
        ["paper", "📄"],
        ["glass", "🥛"],
        ["plastic", "🧴"],
        ["cloth", "🧵"],
      ],
    },
    {
      id: "objects",
      is: "an object",
      noun: "an object, not a material",
      countWord: "objects",
      spoken: "Tap an object, not a material.",
      label: "Object",
      hint: "it is made of something, it is not the stuff itself",
      members: [
        ["spoon", "🥄"],
        ["chair", "🪑"],
        ["book", "📖"],
        ["window", "🪟"],
        ["bottle", "🍶"],
        ["shirt", "👕"],
      ],
    },
  ],
  facts: [
    {
      q: "What is a spoon made of?",
      correct: "metal",
      wrongs: [{ t: "metel", tag: "sai_chinh_ta_tu" }, { t: "paper" }],
      hints: ["It is cold and shiny."],
      why: "Most spoons are made of metal.",
      d: 2,
      pic: "🥄",
      picLabel: "spoon",
    },
    {
      q: "What is a window made of?",
      correct: "glass",
      wrongs: [{ t: "glas", tag: "sai_chinh_ta_tu" }, { t: "wood" }],
      hints: ["You can see right through it."],
      why: "A window is made of glass.",
      d: 2,
      pic: "🪟",
      picLabel: "window",
    },
    {
      q: "What is a book made of?",
      correct: "paper",
      wrongs: [{ t: "papper", tag: "sai_chinh_ta_tu" }, { t: "metal" }],
      hints: ["Think about the pages."],
      why: "Book pages are made of paper.",
      d: 1,
    },
    {
      q: "What is a shirt made of?",
      correct: "cloth",
      wrongs: [{ t: "clot", tag: "sai_chinh_ta_tu" }, { t: "glass" }],
      hints: ["It is soft and you can fold it."],
      why: "A shirt is made of cloth.",
      d: 3,
    },
    {
      q: "What is a plastic bottle made of?",
      correct: "plastic",
      wrongs: [{ t: "plastik", tag: "sai_chinh_ta_tu" }, { t: "wood" }],
      hints: ["It is light and it bends."],
      why: "Bottles are often made of plastic.",
      d: 3,
    },
    {
      q: "A table comes from a tree. What is it made of?",
      correct: "wood",
      wrongs: [{ t: "wud", tag: "sai_chinh_ta_tu" }, { t: "cloth" }],
      hints: ["Trees give us this."],
      why: "Wood comes from trees.",
      d: 4,
    },
    {
      q: "Which one is a material, not a thing?",
      correct: "metal",
      wrongs: [{ t: "chair" }, { t: "bottle" }],
      hints: ["A material is what a thing is made of."],
      why: "Metal is a material. A chair is a thing.",
      d: 5,
    },
    {
      q: "Which word names a material?",
      correct: "glass",
      wrongs: [{ t: "window" }, { t: "book" }],
      hints: ["A window is made of it."],
      why: "Glass is the material. A window is the object.",
      d: 5,
    },
  ],
  counts: [
    ["spoons", "🥄", 4, "metal spoons"],
    ["books", "📖", 5, "paper books"],
    ["bottles", "🍶", 7, "plastic bottles"],
    ["shirts", "👕", 3, "cloth shirts"],
  ],
  sentences: [
    "A spoon is made of metal.",
    "A window is made of glass.",
    "Wood comes from trees.",
    "My shirt is made of cloth.",
  ],
  writes: [
    {
      q: "Write three materials you can see now.",
      criteria: ["Viết ba vật liệu", "Chính tả đúng"],
      sample: ["wood, glass, plastic"],
      why: "Wood, metal, glass, paper, plastic and cloth are materials.",
    },
    {
      q: "Draw a spoon. Write: metal.",
      criteria: ["Vẽ cái thìa", "Viết đúng chữ metal"],
      sample: ["metal"],
      why: "A spoon is made of metal.",
    },
    {
      q: "Write: A window is made of glass.",
      criteria: ["Chép đúng câu", "Viết hoa đầu câu", "Có dấu chấm"],
      sample: ["A window is made of glass."],
      why: "Glass lets light through, so we use it for windows.",
    },
  ],
});

// ───────────────────────────────────────────── 5 ─────────────────────────────────────────────
sciencePack({
  code: "ESCI.PS.MATERIALS_PROPERTIES",
  prefix: "esci-props",
  src: `INTL Materials topic (properties) — ${NO_BOOK}`,
  note: "Tính chất vật liệu: cứng – mềm, nhám – nhẵn, thấm nước – không thấm. Lỗi hay gặp: nhầm 'cứng' với 'nặng', và nhầm vật với vật liệu.",
  groups: [
    {
      id: "hard",
      is: "hard",
      noun: "a hard thing",
      countWord: "hard things",
      spoken: "Tap something hard.",
      label: "Hard",
      hint: "you cannot squeeze it with your fingers",
      members: [
        ["rock", "🪨"],
        ["coin", "🪙"],
        ["brick", "🧱"],
        ["key", "🔑"],
        ["glass", "🥛"],
        ["nail", "🔩"],
      ],
    },
    {
      id: "soft",
      is: "soft",
      noun: "a soft thing",
      countWord: "soft things",
      spoken: "Tap something soft.",
      label: "Soft",
      hint: "it squeezes or bends easily",
      members: [
        ["pillow", "🛏️"],
        ["teddy", "🧸"],
        ["sponge", "🧽"],
        ["cloth", "🧵"],
        ["bread", "🍞"],
        ["wool", "🧶"],
      ],
    },
  ],
  facts: [
    {
      q: "Which one is soft?",
      correct: "pillow",
      wrongs: [{ t: "rock" }, { t: "coin" }],
      hints: ["Which one can you squeeze?"],
      why: "A pillow is soft. A rock is hard.",
      d: 1,
    },
    {
      q: "A raincoat must be…",
      correct: "waterproof",
      wrongs: [{ t: "soft" }, { t: "heavy" }],
      hints: ["Rain must stay outside."],
      why: "Waterproof means water cannot go through.",
      d: 4,
    },
    {
      q: "Which one is rough?",
      correct: "brick",
      wrongs: [{ t: "glass" }, { t: "sponge" }],
      hints: ["Rub your hand on it."],
      why: "A brick feels rough. Glass feels smooth.",
      d: 3,
    },
    {
      q: "A big pillow is heavy. Is it hard?",
      correct: "No",
      wrongs: [{ t: "Yes" }],
      hints: ["Heavy and hard are not the same."],
      why: "Heavy is about weight. Hard is about squeezing.",
      d: 5,
    },
    {
      q: "Which one bends easily?",
      correct: "cloth",
      wrongs: [{ t: "brick" }, { t: "coin" }],
      hints: ["Which one can you fold?"],
      why: "Cloth is bendy. A brick is stiff.",
      d: 2,
    },
    {
      q: "Paper gets wet in rain. Is paper waterproof?",
      correct: "No",
      wrongs: [{ t: "Yes" }],
      hints: ["Think about paper in a puddle."],
      why: "Water goes through paper, so it is not waterproof.",
      d: 4,
    },
    {
      q: "Which is best for a window?",
      correct: "glass",
      wrongs: [{ t: "wool" }, { t: "bread" }],
      hints: ["You must see through it."],
      why: "Glass is hard and you can see through it.",
      d: 3,
    },
    {
      q: "Which is best for a teddy bear?",
      correct: "wool",
      wrongs: [{ t: "nail" }, { t: "brick" }],
      hints: ["A teddy must be nice to hug."],
      why: "Wool is soft, so it is good for a teddy.",
      d: 2,
    },
  ],
  counts: [
    ["coins", "🪙", 6, "hard coins"],
    ["bricks", "🧱", 4, "rough bricks"],
    ["sponges", "🧽", 3, "soft sponges"],
    ["teddies", "🧸", 5, "soft teddies"],
  ],
  sentences: [
    "A rock is hard.",
    "A pillow is soft.",
    "Glass is smooth and hard.",
    "A raincoat keeps the rain out.",
  ],
  writes: [
    {
      q: "Draw one hard thing and one soft thing.",
      criteria: ["Vẽ hai vật", "Ghi nhãn hard và soft"],
      sample: ["rock — hard, pillow — soft"],
      why: "Hard things do not squeeze. Soft things do.",
    },
    {
      q: "Write two soft things at home.",
      criteria: ["Viết hai vật mềm", "Chính tả đúng"],
      sample: ["pillow, teddy"],
      why: "Soft things bend or squeeze easily.",
    },
    {
      q: "Write: A rock is hard.",
      criteria: ["Chép đúng câu", "Viết hoa đầu câu", "Có dấu chấm"],
      sample: ["A rock is hard."],
      why: "You cannot squeeze a rock.",
    },
  ],
});

// ───────────────────────────────────────────── 6 ─────────────────────────────────────────────
sciencePack({
  code: "ESCI.INQ.PREDICT",
  prefix: "esci-predict",
  src: `NGSS K-2 Science Practices (predicting) — ${NO_BOOK}`,
  note: "Dự đoán trước khi thử. Nhóm A là việc sẽ xảy ra, nhóm B là việc không xảy ra — con phải nghĩ trước chứ không phải nhớ lại.",
  groups: [
    {
      id: "will",
      is: "something that will happen",
      noun: "something that will happen",
      countWord: "things that will happen",
      spoken: "Tap what will really happen.",
      label: "This will happen",
      hint: "think about what you have seen before",
      members: [
        ["it falls", "⬇️"],
        ["it melts", "💧"],
        ["it grows", "🌱"],
        ["it floats", "🛶"],
        ["it breaks", "💥"],
        ["it gets wet", "🌧️"],
      ],
    },
    {
      id: "wont",
      is: "something that will not happen",
      noun: "something that will not happen",
      countWord: "things that will not happen",
      spoken: "Tap what will never happen.",
      label: "This will not happen",
      hint: "it never happens in real life",
      members: [
        ["it flies away", "🕊️"],
        ["it sings", "🎵"],
        ["it talks", "💬"],
        ["it turns gold", "🪙"],
        ["it walks", "🦶"],
        ["it laughs", "😄"],
      ],
    },
  ],
  facts: [
    {
      q: "You drop a ball. What will happen?",
      correct: "It falls down",
      wrongs: [{ t: "It flies up" }, { t: "It stays still" }],
      hints: ["Try it with your hand."],
      why: "Things fall down when we let go.",
      d: 1,
    },
    {
      q: "Ice sits in the sun. What will happen?",
      correct: "It melts",
      wrongs: [{ t: "It grows" }, { t: "It sings" }],
      hints: ["The sun is warm."],
      why: "Warm sun melts ice into water.",
      d: 2,
      pic: "🧊",
      picLabel: "ice",
    },
    {
      q: "You water a seed every day. What happens?",
      correct: "It grows",
      wrongs: [{ t: "It melts" }, { t: "It flies" }],
      hints: ["Seeds need water and light."],
      why: "A watered seed grows into a plant.",
      d: 2,
    },
    {
      q: "You blow on a paper boat. What happens?",
      correct: "It moves",
      wrongs: [{ t: "It sinks" }, { t: "It talks" }],
      hints: ["Your breath is like wind."],
      why: "Moving air pushes the boat.",
      d: 3,
    },
    {
      q: "You drop a glass cup. What might happen?",
      correct: "It breaks",
      wrongs: [{ t: "It bounces high" }, { t: "It melts" }],
      hints: ["Glass is hard but not bendy."],
      why: "Glass breaks when it hits the floor.",
      d: 3,
    },
    {
      q: "A good guess before you try is called a…",
      correct: "prediction",
      wrongs: [{ t: "picture" }, { t: "puzzle" }],
      hints: ["Scientists make one before every test."],
      why: "A prediction is what you think will happen.",
      d: 5,
    },
    {
      q: "Your prediction was wrong. Is that bad?",
      correct: "No",
      wrongs: [{ t: "Yes" }],
      hints: ["Scientists learn from every try."],
      why: "A wrong guess teaches us something new.",
      d: 4,
    },
    {
      q: "You put a paper towel in water. What happens?",
      correct: "It gets wet",
      wrongs: [{ t: "It stays dry" }, { t: "It turns gold" }],
      hints: ["Water goes through paper."],
      why: "Paper soaks up water.",
      d: 4,
    },
  ],
  counts: [
    ["seeds", "🌱", 5, "seeds that will grow"],
    ["boats", "🛶", 3, "boats that will float"],
    ["ice cubes", "🧊", 6, "ice cubes that will melt"],
    ["rain drops", "🌧️", 4, "drops that will fall"],
  ],
  sentences: [
    "I think the ball will fall.",
    "The ice will melt in the sun.",
    "The seed will grow into a plant.",
    "Let us try and see!",
  ],
  writes: [
    {
      q: "Draw ice in the sun. Write what happens.",
      criteria: ["Vẽ viên đá dưới nắng", "Viết dự đoán bằng tiếng Anh"],
      sample: ["It melts."],
      why: "Warm sun melts ice.",
    },
    {
      q: "Write: I think it will float.",
      criteria: ["Chép đúng câu", "Viết hoa chữ I", "Có dấu chấm"],
      sample: ["I think it will float."],
      why: "That sentence is a prediction.",
    },
    {
      q: "Draw a seed today and the plant later.",
      criteria: ["Vẽ hai bức: hạt và cây", "Ghi nhãn before và after"],
      sample: ["before — seed, after — plant"],
      why: "A seed grows when it gets water and light.",
    },
  ],
});

// ───────────────────────────────────────────── 7 ─────────────────────────────────────────────
sciencePack({
  code: "ESCI.PS.FLOAT_SINK",
  prefix: "esci-float",
  src: `INTL Materials topic (floating and sinking) — ${NO_BOOK}`,
  note: "Nổi và chìm. Nhiều bé nghĩ 'to thì chìm' — nên nhóm nổi cố ý có cả thuyền và quả bóng to, nhóm chìm có cả đồng xu bé tí.",
  groups: [
    {
      id: "float",
      is: "something that floats",
      noun: "a thing that floats",
      countWord: "things that float",
      spoken: "Tap something that floats.",
      label: "It floats",
      hint: "it stays on top of the water",
      members: [
        ["leaf", "🍃"],
        ["boat", "🛶"],
        ["ball", "⚽"],
        ["duck", "🦆"],
        ["bottle", "🍶"],
        ["wood", "🪵"],
      ],
    },
    {
      id: "sink",
      is: "something that sinks",
      noun: "a thing that sinks",
      countWord: "things that sink",
      spoken: "Tap something that sinks.",
      label: "It sinks",
      hint: "it goes down to the bottom",
      members: [
        ["rock", "🪨"],
        ["key", "🔑"],
        ["coin", "🪙"],
        ["spoon", "🥄"],
        ["nail", "🔩"],
        ["scissors", "✂️"],
      ],
    },
  ],
  facts: [
    {
      q: "Does a rock float or sink?",
      correct: "It sinks",
      wrongs: [{ t: "It floats" }],
      hints: ["Drop one in a bowl of water."],
      why: "A rock goes to the bottom. It sinks.",
      d: 1,
      pic: "🪨",
      picLabel: "rock",
    },
    {
      q: "Does a leaf float or sink?",
      correct: "It floats",
      wrongs: [{ t: "It sinks" }],
      hints: ["Look at leaves on a pond."],
      why: "A leaf stays on top. It floats.",
      d: 1,
    },
    {
      q: "A big boat is heavy. Does it sink?",
      correct: "No",
      wrongs: [{ t: "Yes" }],
      hints: ["Big does not mean sinking."],
      why: "Boats are made to float, even big ones.",
      d: 5,
    },
    {
      q: "A tiny coin is small. Does it float?",
      correct: "No",
      wrongs: [{ t: "Yes" }],
      hints: ["Small does not mean floating."],
      why: "Metal coins sink, even small ones.",
      d: 5,
    },
    {
      q: "Which one floats?",
      correct: "wood",
      wrongs: [{ t: "nail" }, { t: "spoon" }],
      hints: ["Think about wood in a river."],
      why: "Wood floats. Metal sinks.",
      d: 2,
    },
    {
      q: "An empty bottle with the lid on will…",
      correct: "float",
      wrongs: [{ t: "sink" }, { t: "melt" }],
      hints: ["What is inside the bottle? Air."],
      why: "The air inside keeps the bottle on top.",
      d: 4,
    },
    {
      q: "You fill the bottle with water. Now it will…",
      correct: "sink",
      wrongs: [{ t: "float" }, { t: "fly" }],
      hints: ["The air is gone now."],
      why: "A full bottle has no air, so it sinks.",
      d: 4,
    },
    {
      q: "Which one sinks?",
      correct: "key",
      wrongs: [{ t: "duck" }, { t: "leaf" }],
      hints: ["Which one is metal?"],
      why: "A metal key sinks to the bottom.",
      d: 3,
    },
  ],
  counts: [
    ["leaves", "🍃", 5, "things that float"],
    ["boats", "🛶", 3, "things that float"],
    ["coins", "🪙", 7, "things that sink"],
    ["ducks", "🦆", 4, "things that float"],
  ],
  sentences: [
    "The leaf floats on the water.",
    "The rock sinks to the bottom.",
    "Big boats can float.",
    "Let us test it in water!",
  ],
  writes: [
    {
      q: "Draw two things that float.",
      criteria: ["Vẽ hai vật nổi", "Ghi tên tiếng Anh"],
      sample: ["leaf, boat"],
      why: "Light things and things full of air float.",
    },
    {
      q: "Write: The rock sinks.",
      criteria: ["Chép đúng câu", "Viết hoa đầu câu", "Có dấu chấm"],
      sample: ["The rock sinks."],
      why: "A rock goes down to the bottom.",
    },
    {
      q: "Test a spoon in water. Draw what happened.",
      criteria: ["Vẽ kết quả thật", "Ghi float hoặc sink"],
      sample: ["sink"],
      why: "A metal spoon sinks.",
    },
  ],
});

// ───────────────────────────────────────────── 8 ─────────────────────────────────────────────
sciencePack({
  code: "ESCI.INQ.SORT_CLASSIFY",
  prefix: "esci-sort",
  src: `NGSS K-2 Science Practices (classifying) — ${NO_BOOK}`,
  note: "Phân loại theo một tiêu chí. Bài khó nhất của gói là khi hai tiêu chí cùng đúng — con phải đọc kỹ đề mới biết xếp theo tiêu chí nào.",
  groups: [
    {
      id: "animals",
      is: "an animal",
      noun: "an animal",
      countWord: "animals",
      spoken: "Tap an animal.",
      label: "Animals",
      hint: "it can move by itself and it eats",
      members: [
        ["dog", "🐕"],
        ["bird", "🐦"],
        ["fish", "🐟"],
        ["bee", "🐝"],
        ["cow", "🐄"],
        ["frog", "🐸"],
      ],
    },
    {
      id: "plants",
      is: "a plant",
      noun: "a plant",
      countWord: "plants",
      spoken: "Tap a plant.",
      label: "Plants",
      hint: "it stays in one place and grows from a seed",
      members: [
        ["tree", "🌳"],
        ["flower", "🌸"],
        ["grass", "🌿"],
        ["cactus", "🌵"],
        ["leaf", "🍃"],
        ["seedling", "🌱"],
      ],
    },
  ],
  facts: [
    {
      q: "Which one does not belong: dog, cat, tree?",
      correct: "tree",
      wrongs: [{ t: "dog" }, { t: "cat" }],
      hints: ["Two of them are animals."],
      why: "A tree is a plant. The others are animals.",
      d: 2,
    },
    {
      q: "Which one does not belong: red, blue, big?",
      correct: "big",
      wrongs: [{ t: "red" }, { t: "blue" }],
      hints: ["Two of them are colours."],
      why: "Big is a size, not a colour.",
      d: 3,
    },
    {
      q: "How can you sort these buttons?",
      correct: "By colour",
      wrongs: [{ t: "By name" }, { t: "By age" }],
      hints: ["What can you see about a button?"],
      why: "We sort by things we can see: colour, size, shape.",
      d: 4,
    },
    {
      q: "Which one does not belong: ball, orange, box?",
      correct: "box",
      wrongs: [{ t: "ball" }, { t: "orange" }],
      hints: ["Two of them are round."],
      why: "A box has corners. The others are round.",
      d: 3,
    },
    {
      q: "A red ball and a red car. What is the same?",
      correct: "colour",
      wrongs: [{ t: "shape" }, { t: "size" }],
      hints: ["Look at the word 'red'."],
      why: "They are both red, so the colour is the same.",
      d: 2,
    },
    {
      q: "Sort by shape: where does a wheel go?",
      correct: "Round things",
      wrongs: [{ t: "Square things" }, { t: "Red things" }],
      hints: ["Draw a wheel in the air."],
      why: "A wheel is round.",
      d: 1,
    },
    {
      q: "Which group has only living things?",
      correct: "dog, tree, bee",
      wrongs: [{ t: "dog, rock, bee" }, { t: "car, tree, cup" }],
      hints: ["Check every one in the group."],
      why: "A dog, a tree and a bee all grow and need food.",
      d: 5,
    },
    {
      q: "Why do scientists sort things into groups?",
      correct: "To find patterns",
      wrongs: [{ t: "To make a mess" }, { t: "To hide them" }],
      hints: ["Groups make things easier to see."],
      why: "Sorting helps us see what is the same and what is different.",
      d: 5,
    },
  ],
  counts: [
    ["bees", "🐝", 6, "animals"],
    ["flowers", "🌸", 4, "plants"],
    ["trees", "🌳", 5, "plants"],
    ["frogs", "🐸", 3, "animals"],
  ],
  sentences: [
    "A dog is an animal.",
    "A tree is a plant.",
    "These two are both red.",
    "I can sort by colour or size.",
  ],
  writes: [
    {
      q: "Draw three animals in one box.",
      criteria: ["Vẽ ba con vật", "Ghi tên từng con"],
      sample: ["dog, bird, fish"],
      why: "Animals move by themselves and eat food.",
    },
    {
      q: "Write two plants you can see outside.",
      criteria: ["Viết hai loài thực vật", "Chính tả đúng"],
      sample: ["tree, grass"],
      why: "Plants grow in one place from a seed.",
    },
    {
      q: "Sort your toys by colour. Draw two groups.",
      criteria: ["Vẽ hai nhóm", "Ghi tên màu của từng nhóm"],
      sample: ["red group, blue group"],
      why: "Colour is one way to sort things.",
    },
  ],
});

// ───────────────────────────────────────────── 9 ─────────────────────────────────────────────
sciencePack({
  code: "ESCI.PS.LIGHT_SEE",
  prefix: "esci-lightsee",
  src: `NGSS 1-PS4-2 — ${NO_BOOK}`,
  note: "Cần ánh sáng để nhìn thấy. Hai lỗi kinh điển nằm hẳn trong bài: nghĩ mắt tự phát sáng, và coi mặt trăng là nguồn sáng.",
  groups: [
    {
      id: "sources",
      is: "a light source",
      noun: "a light source",
      countWord: "lights",
      spoken: "Tap something that makes light.",
      label: "It makes light",
      hint: "it makes its own light",
      members: [
        ["sun", "☀️"],
        ["lamp", "💡"],
        ["candle", "🕯️"],
        ["torch", "🔦"],
        ["fire", "🔥"],
        ["star", "⭐"],
      ],
    },
    {
      id: "not",
      is: "not a light source",
      noun: "something with no light of its own",
      countWord: "things that make no light",
      spoken: "Tap something that makes no light.",
      label: "No light of its own",
      hint: "we only see it when light shines on it",
      members: [
        ["moon", "🌙"],
        ["mirror", "🪞"],
        ["book", "📖"],
        ["rock", "🪨"],
        ["chair", "🪑"],
        ["apple", "🍎"],
      ],
    },
  ],
  facts: [
    {
      q: "Can you see a toy in a dark box?",
      correct: "No",
      wrongs: [{ t: "Yes" }],
      hints: ["Is there any light inside?"],
      why: "We need light to see anything.",
      d: 2,
    },
    {
      q: "Which one makes its own light?",
      correct: "lamp",
      wrongs: [{ t: "mirror" }, { t: "book" }],
      hints: ["Which one do you switch on?"],
      why: "A lamp makes light. A mirror only bounces it.",
      d: 2,
    },
    {
      q: "Does the moon make its own light?",
      correct: "No",
      wrongs: [{ t: "Yes" }],
      hints: ["Where does moonlight come from?"],
      why: "Sunlight shines on the moon, so we can see it.",
      d: 5,
    },
    {
      q: "Do your eyes send out light?",
      correct: "No",
      wrongs: [{ t: "Yes" }],
      hints: ["Try seeing in a dark room."],
      why: "Eyes catch light. They do not make it.",
      d: 5,
    },
    {
      q: "You open the curtain. Now you can…",
      correct: "see better",
      wrongs: [{ t: "hear better" }, { t: "see less" }],
      hints: ["More light comes in."],
      why: "More light means we can see more.",
      d: 3,
    },
    {
      q: "Which gives us light in the day?",
      correct: "sun",
      wrongs: [{ t: "moon" }, { t: "rock" }],
      hints: ["Look up in the daytime."],
      why: "The sun is our biggest light source.",
      d: 1,
    },
    {
      q: "A candle goes out. What happens?",
      correct: "The room gets dark",
      wrongs: [{ t: "The room gets bright" }, { t: "Nothing changes" }],
      hints: ["The light is gone now."],
      why: "No light source means no light to see by.",
      d: 4,
    },
    {
      q: "Why can you see this book?",
      correct: "Light shines on it",
      wrongs: [{ t: "The book makes light" }, { t: "My eyes make light" }],
      hints: ["The book does not glow."],
      why: "Light bounces off the book into your eyes.",
      d: 4,
    },
  ],
  counts: [
    ["candles", "🕯️", 5, "lights"],
    ["stars", "⭐", 8, "lights"],
    ["lamps", "💡", 3, "lights"],
    ["apples", "🍎", 4, "things that make no light"],
  ],
  sentences: [
    "The sun gives us light.",
    "We need light to see.",
    "A lamp makes its own light.",
    "The moon has no light of its own.",
  ],
  writes: [
    {
      q: "Draw two things that make light.",
      criteria: ["Vẽ hai nguồn sáng", "Ghi tên tiếng Anh"],
      sample: ["sun, lamp"],
      why: "The sun, lamps, candles and fire make light.",
    },
    {
      q: "Write: We need light to see.",
      criteria: ["Chép đúng câu", "Viết hoa đầu câu", "Có dấu chấm"],
      sample: ["We need light to see."],
      why: "In the dark we cannot see anything.",
    },
    {
      q: "Draw a dark room and a bright room.",
      criteria: ["Vẽ hai căn phòng", "Ghi nhãn dark và bright"],
      sample: ["dark room, bright room"],
      why: "Light lets our eyes see what is there.",
    },
  ],
});

// ──────────────────────────────────────────── 10 ─────────────────────────────────────────────
sciencePack({
  code: "ESCI.PS.LIGHT_MATERIALS",
  prefix: "esci-lightmat",
  src: `NGSS 1-PS4-3 — ${NO_BOOK}`,
  note: "Ánh sáng đi qua vật liệu và bóng. Ba nhóm thật ra là ba mức (trong suốt – mờ – chắn sáng); gói này dùng hai nhóm đối lập rõ nhất rồi để mức 'mờ' cho câu hỏi khái niệm.",
  groups: [
    {
      id: "clear",
      is: "clear",
      noun: "a clear thing",
      countWord: "clear things",
      spoken: "Tap something you can see through.",
      label: "Light goes through",
      hint: "you can see right through it",
      members: [
        ["window", "🪟"],
        ["glass", "🥛"],
        ["water", "💧"],
        ["bottle", "🍶"],
        ["ice", "🧊"],
        ["bubble", "🫧"],
      ],
    },
    {
      id: "blocks",
      is: "not clear",
      noun: "something that blocks light",
      countWord: "things that block light",
      spoken: "Tap something that blocks light.",
      label: "Light is blocked",
      hint: "light cannot get through it at all",
      members: [
        ["door", "🚪"],
        ["book", "📖"],
        ["wall", "🧱"],
        ["wood", "🪵"],
        ["box", "📦"],
        ["shoe", "👟"],
      ],
    },
  ],
  facts: [
    {
      q: "Can you see through a window?",
      correct: "Yes",
      wrongs: [{ t: "No" }],
      hints: ["Look outside right now."],
      why: "Glass is clear, so light goes through.",
      d: 1,
    },
    {
      q: "Which one makes a dark shadow?",
      correct: "book",
      wrongs: [{ t: "window" }, { t: "water" }],
      hints: ["Which one blocks all the light?"],
      why: "A book blocks light, so the shadow is dark.",
      d: 3,
    },
    {
      q: "Thin paper lets some light through. It is…",
      correct: "a bit clear",
      wrongs: [{ t: "fully clear" }, { t: "fully dark" }],
      hints: ["Hold paper up to a lamp."],
      why: "Some light gets through, but you cannot see shapes.",
      d: 5,
    },
    {
      q: "What makes a shadow?",
      correct: "Something blocking light",
      wrongs: [{ t: "A dark colour" }, { t: "A cold place" }],
      hints: ["Stand in the sun and look down."],
      why: "A shadow is where light cannot reach.",
      d: 4,
    },
    {
      q: "Is a shadow the same colour as the thing?",
      correct: "No",
      wrongs: [{ t: "Yes" }],
      hints: ["Look at a red ball's shadow."],
      why: "Shadows are always dark, whatever the colour.",
      d: 5,
    },
    {
      q: "You close the door. The light…",
      correct: "stops",
      wrongs: [{ t: "gets brighter" }, { t: "turns blue" }],
      hints: ["A door is not clear."],
      why: "A door blocks the light.",
      d: 2,
    },
    {
      q: "Which one would you use for a window?",
      correct: "glass",
      wrongs: [{ t: "wood" }, { t: "brick" }],
      hints: ["You want to see outside."],
      why: "Glass is clear, so we use it for windows.",
      d: 3,
    },
    {
      q: "Your shadow is long in the evening. Why?",
      correct: "The sun is low",
      wrongs: [{ t: "You grew taller" }, { t: "The sun is gone" }],
      hints: ["Watch where the sun is."],
      why: "A low sun makes long shadows.",
      d: 5,
    },
  ],
  counts: [
    ["bottles", "🍶", 4, "clear bottles"],
    ["books", "📖", 6, "things that block light"],
    ["bubbles", "🫧", 7, "clear bubbles"],
    ["boxes", "📦", 3, "things that block light"],
  ],
  sentences: [
    "Light goes through glass.",
    "A wall blocks the light.",
    "A shadow is dark.",
    "I can see through the window.",
  ],
  writes: [
    {
      q: "Draw your shadow outside. Write: shadow.",
      criteria: ["Vẽ bóng của mình", "Viết đúng chữ shadow"],
      sample: ["shadow"],
      why: "A shadow appears where your body blocks the light.",
    },
    {
      q: "Write two things light goes through.",
      criteria: ["Viết hai vật trong suốt", "Chính tả đúng"],
      sample: ["glass, water"],
      why: "Clear materials let light pass.",
    },
    {
      q: "Write: A wall blocks the light.",
      criteria: ["Chép đúng câu", "Viết hoa đầu câu", "Có dấu chấm"],
      sample: ["A wall blocks the light."],
      why: "Light cannot go through a wall, so we get a shadow.",
    },
  ],
});
