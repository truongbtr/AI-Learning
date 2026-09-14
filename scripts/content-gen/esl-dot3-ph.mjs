/**
 * Đợt 3, lô C2 — ESL: chữ cái, âm đầu, từ cùng vần, magic e, nghe từ–chọn tranh, nghe số/chữ.
 *
 * Luật một đáp án cho từng dạng:
 *  - chữ cái: hỏi "just before / just after" (chứ không "before", vì Q cũng đứng trước S);
 *  - âm đầu: tranh có đúng một tên thông dụng, không đặt c cạnh k (cùng âm /k/);
 *  - vần: đúng một ô có hai chữ cuối trùng với từ gốc; ô nhiễu cùng chữ đầu (con hay chọn theo chữ đầu);
 *  - magic e: ô nhiễu là chính từ đó bỏ e (kit / kite) — lỗi đọc ngắn con hay mắc;
 *  - nghe–chọn tranh: ba tranh tên gần giống nhau (ship / sheep / shop), mỗi tranh một tên.
 *
 *   node scripts/content-gen/esl-dot3-ph.mjs
 */
import { choicesOf, img, listenPrompt, mkPack } from "./lib.mjs";
import { LISTEN, READ, sentencePack } from "./lib-en.mjs";

const LIT_R =
  "Global Stage 1 Literacy Book, Phonics Review (GS1-LIT.R, bảng chương trình) — chưa chụp trang sách";
const LIT_U1 =
  "Global Stage 1 Literacy Book Unit 1–3: long o / long e / long a (GS1-LIT.U1–U3, bảng chương trình) — chưa chụp trang sách";
const base = { dir: "esl", subject: "ESL" };
const T = (t, tag) => (tag ? [t, tag] : [t]);

// ─────────────────────────────────────────────────────────────── tên chữ cái ─────────────────
sentencePack({
  ...base,
  code: "ESL.PH.ALPHABET_NAMES",
  prefix: "esl-abcname",
  src: LIT_R,
  note: "Tên 26 chữ cái, chữ hoa – chữ thường, thứ tự ABC. Ô nhiễu là chữ con hay nhầm: b/d/p/q, e/i (tên Việt), g/j, y/i. Hỏi 'just before/after' để chỉ một chữ đúng.",
  items: [
    {
      q: "Find the small letter for B.",
      right: "b",
      wrongs: [T("d"), T("p")],
      d: 1,
      hint: "The small b has its bump on the right.",
    },
    {
      q: "Find the small letter for D.",
      right: "d",
      wrongs: [T("b"), T("q")],
      d: 1,
      hint: "The small d has its bump on the left.",
    },
    {
      q: "Find the big letter for g.",
      right: "G",
      wrongs: [T("Q"), T("C")],
      d: 2,
      hint: "Say the name: gee.",
    },
    {
      q: "Find the big letter for e.",
      right: "E",
      wrongs: [T("I"), T("F")],
      d: 2,
      hint: "In English, E is called 'ee'.",
    },
    {
      q: "Which letter comes just after C?",
      right: "D",
      wrongs: [T("B"), T("G")],
      d: 2,
      hint: "Sing: A, B, C, …",
    },
    {
      q: "Which letter is missing? A, B, _, D",
      right: "C",
      wrongs: [T("E"), T("G")],
      d: 2,
      hint: "Sing the ABC song slowly.",
    },
    {
      q: "Which letter comes just after J?",
      right: "K",
      wrongs: [T("I"), T("H")],
      d: 3,
      hint: "Sing: H, I, J, …",
    },
    {
      q: "Which letter comes just before N?",
      right: "M",
      wrongs: [T("O"), T("W")],
      d: 3,
      hint: "Sing: K, L, …, N.",
    },
    {
      q: "Which letter comes just before S?",
      right: "R",
      wrongs: [T("T"), T("U")],
      d: 3,
      hint: "Sing: P, Q, …, S.",
    },
    {
      q: "Which letter is missing? L, _, N, O",
      right: "M",
      wrongs: [T("W"), T("K")],
      d: 4,
      hint: "L, M, N, O, P.",
    },
    {
      q: "Find the small letter for Q.",
      right: "q",
      wrongs: [T("p"), T("g")],
      d: 4,
      hint: "The small q has a tail on the right.",
    },
    {
      q: "Which letter is missing? W, X, _, Z",
      right: "Y",
      wrongs: [T("V"), T("I")],
      d: 4,
      hint: "The last four letters: W, X, Y, Z.",
    },
    {
      q: "Find the big letter for y.",
      right: "Y",
      wrongs: [T("V"), T("I")],
      d: 5,
      hint: "Y is called 'why'.",
    },
    {
      q: "How many letters are in the English alphabet?",
      right: "26",
      wrongs: [T("29"), T("24")],
      d: 5,
      hint: "Vietnamese has 29 letters. English has fewer.",
      why: "The English alphabet has 26 letters.",
    },
  ],
  listenPrompts: [
    "Listen. Tap the letter you hear.",
    "{ban} says a letter. Tap it!",
    "Which letter did you hear?",
    "Listen carefully, then tap the letter.",
    "Hear the letter name. Tap it.",
    "Listen again and pick the letter.",
  ],
  listens: [
    { say: "The letter J.", right: "J", wrongs: [T("G"), T("Y")], d: 1 },
    { say: "The letter E.", right: "E", wrongs: [T("I"), T("A")], d: 1 },
    { say: "The letter I.", right: "I", wrongs: [T("E"), T("Y")], d: 2 },
    { say: "The letter A.", right: "A", wrongs: [T("E"), T("H")], d: 2 },
    { say: "The letter G.", right: "G", wrongs: [T("J"), T("Z")], d: 3 },
    { say: "The letter Y.", right: "Y", wrongs: [T("I"), T("W")], d: 3 },
    { say: "The letter H.", right: "H", wrongs: [T("A"), T("K")], d: 4 },
    { say: "The letter R.", right: "R", wrongs: [T("A"), T("O")], d: 4 },
    { say: "The letter W.", right: "W", wrongs: [T("V"), T("U")], d: 5 },
    { say: "The letter V.", right: "V", wrongs: [T("B"), T("W")], d: 5 },
  ],
  sorts: [
    {
      q: "Big letters or small letters? Sort them.",
      zones: ["Big letters", "Small letters"],
      a: ["B", "D"],
      b: ["d", "b"],
      d: 1,
      hint: "Big letters are tall.",
    },
    {
      q: "Sort the big and small letters.",
      zones: ["Big letters", "Small letters"],
      a: ["P", "Q"],
      b: ["q", "p"],
      d: 2,
      hint: "Big letters are tall.",
    },
    {
      q: "Put each letter in its basket.",
      zones: ["Big letters", "Small letters"],
      a: ["M", "W"],
      b: ["w", "m"],
      d: 3,
      hint: "Big letters are tall.",
    },
    {
      q: "Before M or after M? Sort them.",
      zones: ["Before M", "After M"],
      a: ["C", "H"],
      b: ["R", "W"],
      d: 4,
      hint: "Sing the ABC song and stop at M.",
    },
    {
      q: "Which letters come before K?",
      zones: ["Before K", "After K"],
      a: ["B", "F"],
      b: ["P", "T"],
      d: 5,
      hint: "Sing the ABC song and stop at K.",
    },
  ],
  reads: ["A B C D E F G", "H I J K L M N O P", "Q R S T U V", "W X Y Z", "a b c d e f g"],
  writes: [
    [
      "Write the small letters a to j.",
      "a b c d e f g h i j",
      ["Đủ 10 chữ, đúng thứ tự", "Chữ thường, không viết hoa", "b và d không bị ngược"],
    ],
    [
      "Write the big letters A to J.",
      "A B C D E F G H I J",
      ["Đủ 10 chữ, đúng thứ tự", "Chữ in hoa", "Chữ rõ ràng"],
    ],
    ["Write the missing letters: A, _, C, _, E.", "B, D", ["Điền đúng B và D", "Chữ rõ ràng"]],
  ],
});

// ─────────────────────────────────────────────────────────────── âm đầu ──────────────────────
const firstSound = (pic, word, right, wrongs, d, i) => ({
  q: [
    "What sound does it start with?",
    "Tap the first sound.",
    "Which letter starts this word?",
    "Say it. What is the first sound?",
  ][i % 4],
  pic,
  picLabel: word,
  right,
  wrongs: wrongs.map((w) => [w, "nham_am_dau"]),
  d,
  hint: [
    `Say "${word}" slowly. Listen to the start.`,
    "Put your hand on your mouth as you say it.",
  ],
  why: `"${word}" starts with ${right}.`,
});
sentencePack({
  ...base,
  code: "ESL.PH.INITIAL_SOUND_ID",
  prefix: "esl-initial",
  src: LIT_R,
  note: "Âm đầu của từ. Ô nhiễu (nham_am_dau): chữ cuối của từ (con chọn theo chữ cuối) và âm gần (p/b, t/d, f/v, g/k, s/z). Không đặt c cạnh k vì cùng âm /k/. Tranh chọn loại chỉ có một tên thông dụng.",
  items: [
    ["🐟", "fish", "f", ["v", "h"], 1],
    ["🐻", "bear", "b", ["p", "r"], 1],
    ["🐕", "dog", "d", ["t", "g"], 2],
    ["☀️", "sun", "s", ["z", "n"], 2],
    ["🌙", "moon", "m", ["n", "w"], 2],
    ["🐷", "pig", "p", ["b", "g"], 3],
    ["🦁", "lion", "l", ["r", "n"], 3],
    ["🐯", "tiger", "t", ["d", "r"], 3],
    ["🎸", "guitar", "g", ["k", "r"], 4],
    ["🦊", "fox", "f", ["v", "x"], 4],
    ["🦓", "zebra", "z", ["s", "a"], 4],
    ["🍉", "watermelon", "w", ["v", "n"], 5],
    ["🦆", "duck", "d", ["b", "k"], 5],
    ["🥛", "milk", "m", ["n", "k"], 5],
  ].map(([p, w, r, ws, d], i) => firstSound(p, w, r, ws, d, i)),
  listenPrompts: [
    "Listen. What sound does it start with?",
    "{ban} says a word. Tap its first sound.",
    "Hear the word. Which letter starts it?",
    "Listen for the first sound. Tap it.",
    "What is the first sound you hear?",
    "Listen again. Tap the starting letter.",
  ],
  listens: [
    ["bag", "b", ["d", "g"], 1],
    ["cup", "c", ["g", "p"], 1],
    ["hen", "h", ["n", "e"], 2],
    ["leg", "l", ["g", "r"], 2],
    ["net", "n", ["m", "t"], 3],
    ["top", "t", ["d", "p"], 3],
    ["van", "v", ["f", "n"], 4],
    ["jam", "j", ["g", "m"], 5],
  ].map(([say, right, ws, d]) => ({
    say,
    right,
    wrongs: ws.map((w) => [w, "nham_am_dau"]),
    d,
    why: `"${say}" starts with ${right}.`,
  })),
  sorts: [
    {
      q: "Sort by the first sound.",
      zones: ["Starts with b", "Starts with m"],
      a: ["bag", "bus"],
      b: ["map", "mop"],
      d: 2,
      hint: "Say each word. Listen to the start.",
    },
    {
      q: "Which basket? Listen to the first sound.",
      zones: ["Starts with s", "Starts with t"],
      a: ["sun", "sit"],
      b: ["ten", "top"],
      d: 2,
      hint: "Say each word. Listen to the start.",
    },
    {
      q: "Sort the words by their first sound.",
      zones: ["Starts with p", "Starts with d"],
      a: ["pen", "pig"],
      b: ["dog", "duck"],
      d: 3,
      hint: "p and d sound different. Say them.",
    },
    {
      q: "First sound h or f? Sort them.",
      zones: ["Starts with h", "Starts with f"],
      a: ["hat", "hen"],
      b: ["fish", "fan"],
      d: 4,
      hint: "Say each word. Listen to the start.",
    },
    {
      q: "Put each word in the right basket.",
      zones: ["Starts with r", "Starts with l"],
      a: ["red", "run"],
      b: ["leg", "log"],
      d: 5,
      hint: "r and l are tricky. Say them slowly.",
    },
  ],
  reads: [
    "Big bears bounce.",
    "Six silly snakes.",
    "My mom makes muffins.",
    "Ten tall tigers.",
    "Fat fish flip.",
  ],
  writes: [
    ["Draw two things that start with s. Label them.", "sun, sock"],
    ["Ball, bed, bus. Write their first letter.", "b"],
    ["Draw something that starts with m. Label it.", "moon"],
  ],
});

// ─────────────────────────────────────────────────────────────── cùng vần ────────────────────
const rhymeTag = (ws) => ws.map((w) => [w, "doc_nham_van"]);
sentencePack({
  ...base,
  code: "ESL.PH.RHYMING_CVC",
  prefix: "esl-rhymecvc",
  src: LIT_R,
  note: "Từ cùng vần (word families). Mỗi câu đúng một ô có hai chữ cuối trùng từ gốc; ô nhiễu (doc_nham_van) cố ý cùng chữ đầu với từ gốc — lỗi 'chọn cùng chữ đầu thay vì cùng vần'.",
  items: [
    ["cat", "hat", ["cup", "can"], 1],
    ["dog", "log", ["dig", "cat"], 1],
    ["bug", "hug", ["bus", "big"], 2],
    ["pen", "ten", ["pet", "pin"], 2],
    ["pig", "wig", ["pin", "peg"], 2],
    ["hot", "pot", ["hat", "hop"], 3],
    ["sun", "run", ["sit", "sad"], 3],
    ["map", "cap", ["mat", "mop"], 3],
    ["bed", "red", ["bad", "bet"], 4],
    ["fox", "box", ["fan", "fix"], 4],
    ["hen", "men", ["hat", "hem"], 5],
    ["mug", "rug", ["mud", "map"], 5],
    ["wet", "net", ["web", "wig"], 4],
    ["tub", "cub", ["tap", "ten"], 5],
  ].map(([base, right, ws, d], i) => ({
    q: [
      `Which word rhymes with "${base}"?`,
      `Find a rhyme for "${base}".`,
      `Tap the word that rhymes with "${base}".`,
    ][i % 3],
    right,
    wrongs: rhymeTag(ws),
    d,
    hint: ["Listen to the end of the word.", `${base} … ${right}: same ending!`].slice(0, 1),
    why: `"${base}" and "${right}" rhyme.`,
  })),
  listenPrompts: [
    "Listen. Which word rhymes with it?",
    "{ban} says a word. Tap a rhyme!",
    "Hear the word. Find its rhyming friend.",
    "Listen, then tap the word that rhymes.",
    "Which word sounds the same at the end?",
    "Listen again. Tap the rhyme.",
  ],
  listens: [
    ["hat", "bat", ["hot", "him"], 1],
    ["log", "fog", ["leg", "lip"], 1],
    ["run", "bun", ["ram", "rug"], 2],
    ["ten", "hen", ["tan", "tip"], 2],
    ["big", "dig", ["bag", "bus"], 3],
    ["mop", "top", ["map", "mug"], 3],
    ["nut", "hut", ["net", "nap"], 4],
    ["wet", "jet", ["wig", "win"], 5],
  ].map(([say, right, ws, d]) => ({
    say,
    right,
    wrongs: rhymeTag(ws),
    d,
    why: `"${say}" and "${right}" rhyme.`,
  })),
  sorts: [
    {
      q: "Sort the words into word families.",
      zones: ["-at words", "-og words"],
      a: ["cat", "bat"],
      b: ["dog", "log"],
      d: 1,
      hint: "Look at the last two letters.",
    },
    {
      q: "Which family? Drag each word.",
      zones: ["-en words", "-ug words"],
      a: ["pen", "hen"],
      b: ["bug", "rug"],
      d: 2,
      hint: "Look at the last two letters.",
    },
    {
      q: "Put each word in its family.",
      zones: ["-ip words", "-op words"],
      a: ["lip", "zip"],
      b: ["top", "mop"],
      d: 3,
      hint: "Say the words. Listen to the end.",
    },
    {
      q: "Sort by the ending sound.",
      zones: ["-an words", "-et words"],
      a: ["fan", "man"],
      b: ["net", "pet"],
      d: 4,
      hint: "Say the words. Listen to the end.",
    },
    {
      q: "Help {ban} sort the rhyming words.",
      zones: ["-it words", "-un words"],
      a: ["sit", "hit"],
      b: ["sun", "fun"],
      d: 5,
      hint: "Say the words. Listen to the end.",
    },
  ],
  reads: [
    "A fat cat sat on a mat.",
    "The dog sat on a log.",
    "A bug in a rug.",
    "Ten hens in a pen.",
    "The fox is in the box.",
  ],
  writes: [
    ["Write two words that rhyme with cat.", "hat, bat"],
    ["Draw a dog on a log. Write both words.", "dog, log"],
    ["Write a word that rhymes with sun.", "run"],
  ],
});

// ─────────────────────────────────────────────────────────────── magic e ─────────────────────
sentencePack({
  ...base,
  code: "ESL.PH.MAGIC_E",
  prefix: "esl-magice",
  src: LIT_U1,
  note: "Magic e làm nguyên âm dài (Literacy Book Unit 1–3 dạy long o, long e, long a). Ô nhiễu chính là từ bỏ e (kit / kite) mang sai_chinh_ta_tu — lỗi đọc nguyên âm ngắn; ô còn lại là một từ magic e khác, không khớp tranh.",
  items: [
    ["🪁", "kite", "bike"],
    ["🎂", "cake", "lake"],
    ["🦴", "bone", "cone"],
    ["5️⃣", "five", "nine"],
    ["🧊", "cube", "tube"],
    ["🌹", "rose", "nose"],
    ["🏠", "home", "hole"],
    ["🐍", "snake", "skate"],
    ["🚲", "bike", "kite"],
    ["✈️", "plane", "plate"],
    ["🎵", "note", "nose"],
    ["⛸️", "skate", "snake"],
  ]
    .map(([pic, w, other], i) => ({
      q: [
        "What is this?",
        "Tap the word for the picture.",
        "Which word matches?",
        "Find the right word.",
        "Pick the word you see.",
        "Name the picture.",
      ][i % 6],
      pic,
      picLabel: w,
      right: w,
      wrongs: [[w.slice(0, -1), "sai_chinh_ta_tu"], [other]],
      d: 1 + Math.floor(i / 2.5),
      hint: ["Magic e makes the vowel say its name.", "Look at the end of each word."],
      why: `The picture is "${w}". The e is silent.`,
    }))
    .concat([
      {
        q: "Which word has a long a sound?",
        right: "cape",
        wrongs: [["cap", "sai_chinh_ta_tu"], ["cat"]],
        d: 3,
        hint: "Long a says its name: ay.",
        why: 'In "cape" the magic e makes a say its name.',
      },
      {
        q: "Which word has a long i sound?",
        right: "pine",
        wrongs: [["pin", "sai_chinh_ta_tu"], ["pig"]],
        d: 4,
        hint: "Long i says its name: eye.",
        why: 'In "pine" the magic e makes i say its name.',
      },
      {
        q: "Which word has a long o sound?",
        right: "hope",
        wrongs: [["hop", "sai_chinh_ta_tu"], ["hot"]],
        d: 5,
        hint: "Long o says its name: oh.",
        why: 'In "hope" the magic e makes o say its name.',
      },
    ]),
  listens: [
    ["kite", "kid"],
    ["tube", "tap"],
    ["cape", "cop"],
    ["hope", "hip"],
    ["bite", "bat"],
    ["note", "net"],
    ["pine", "pan"],
    ["cute", "cat"],
  ].map(([w, other], i) => ({
    say: w,
    right: w,
    wrongs: [[w.slice(0, -1), "sai_chinh_ta_tu"], [other]],
    d: 1 + Math.floor(i / 2),
    why: `You heard "${w}" — a long vowel.`,
  })),
  sorts: [
    {
      q: "Short vowel or magic e? Sort them.",
      zones: ["Short vowel", "Magic e"],
      a: ["cap", "kit"],
      b: ["cape", "kite"],
      d: 2,
      hint: "Is there an e at the end?",
    },
    {
      q: "Drag each word to its basket.",
      zones: ["Short vowel", "Magic e"],
      a: ["hop", "tub"],
      b: ["hope", "tube"],
      d: 3,
      hint: "Is there an e at the end?",
    },
    {
      q: "Which words have magic e?",
      zones: ["Short vowel", "Magic e"],
      a: ["pin", "not"],
      b: ["pine", "note"],
      d: 3,
      hint: "Is there an e at the end?",
    },
    {
      q: "Sort the short and long words.",
      zones: ["Short vowel", "Magic e"],
      a: ["bit", "cub"],
      b: ["bite", "cube"],
      d: 4,
      hint: "Read each word out loud.",
    },
    {
      q: "Help {ban} sort these words.",
      zones: ["Short vowel", "Magic e"],
      a: ["mad", "rob"],
      b: ["made", "robe"],
      d: 5,
      hint: "Read each word out loud.",
    },
  ],
  reads: [
    "I like my kite.",
    "The cake is on a plate.",
    "Five white bikes.",
    "A rose for home.",
    "The snake can hide.",
  ],
  writes: [
    ["Add magic e to cap. Write the new word.", "cape"],
    ["Write two words: kit and kite.", "kit, kite"],
    ["Draw a cake. Write: cake.", "cake"],
  ],
});

// ─────────────────────────────────────────────────────── nghe số và chữ cái ──────────────────
sentencePack({
  ...base,
  code: "ESL.LIS.NUMBERS_LETTERS_DICTATION",
  prefix: "esl-dictate",
  src: "Global Stage 1 Language Book, Language Review + Literacy Phonics Review (bảng chương trình) — chưa chụp trang sách",
  note: "Nghe số 11–20 và nghe đánh vần từ CVC. Ô nhiễu số: -teen/-ty (13/30) và số một chữ số — không có mã lỗi tiếng Anh cho số nên để trống mã. Ô nhiễu đánh vần: đổi một chữ (sai_chinh_ta_tu / nham_nguyen_am_ngan / nham_am_dau).",
  items: [
    {
      q: "Which number is fifteen?",
      right: "15",
      wrongs: [["50"], ["5"]],
      d: 1,
      hint: "-teen numbers are between 10 and 20.",
    },
    {
      q: "Which number is thirteen?",
      right: "13",
      wrongs: [["30"], ["31"]],
      d: 2,
      hint: "-teen numbers are between 10 and 20.",
    },
    {
      q: "Which number is twelve?",
      right: "12",
      wrongs: [["20"], ["2"]],
      d: 2,
      hint: "Twelve comes after eleven.",
    },
    {
      q: "Which number is eighteen?",
      right: "18",
      wrongs: [["80"], ["8"]],
      d: 3,
      hint: "-teen numbers are between 10 and 20.",
    },
    {
      q: "Which word is 14?",
      right: "fourteen",
      wrongs: [["forty"], ["four"]],
      d: 3,
      hint: "14 is more than 10 and less than 20.",
    },
    {
      q: "Which word is 20?",
      right: "twenty",
      wrongs: [["twelve"], ["two"]],
      d: 3,
      hint: "20 is two tens.",
    },
    {
      q: "Which number is nineteen?",
      right: "19",
      wrongs: [["90"], ["9"]],
      d: 4,
      hint: "-teen numbers are between 10 and 20.",
    },
    {
      q: "Which word is 16?",
      right: "sixteen",
      wrongs: [["sixty"], ["six"]],
      d: 5,
      hint: "16 is more than 10 and less than 20.",
    },
    {
      q: "Which word is 11?",
      right: "eleven",
      wrongs: [["seven"], ["one"]],
      d: 4,
      hint: "11 comes after ten.",
    },
    {
      q: "Which word is spelled b-a-g?",
      right: "bag",
      wrongs: [["bad", "sai_chinh_ta_tu"], ["dog"]],
      d: 4,
      hint: "Read each letter, then blend.",
    },
    {
      q: "Which word is spelled p-e-n?",
      right: "pen",
      wrongs: [
        ["pin", "nham_nguyen_am_ngan"],
        ["hen", "nham_am_dau"],
      ],
      d: 5,
      hint: "Read each letter, then blend.",
    },
    {
      q: "Which word is spelled s-u-n?",
      right: "sun",
      wrongs: [
        ["son", "nham_nguyen_am_ngan"],
        ["bun", "nham_am_dau"],
      ],
      d: 5,
      hint: "Read each letter, then blend.",
    },
  ],
  listens: [
    { say: "fourteen", right: "14", wrongs: [["40"], ["4"]], d: 1 },
    { say: "sixteen", right: "16", wrongs: [["60"], ["6"]], d: 1 },
    { say: "nineteen", right: "19", wrongs: [["90"], ["9"]], d: 2 },
    { say: "seventeen", right: "17", wrongs: [["70"], ["7"]], d: 2 },
    { say: "thirteen", right: "13", wrongs: [["30"], ["3"]], d: 3 },
    { say: "The letter G.", right: "G", wrongs: [["J"], ["Z"]], d: 3 },
    { say: "The letter E.", right: "E", wrongs: [["I"], ["A"]], d: 4 },
    {
      say: "b, e, d.",
      right: "bed",
      wrongs: [
        ["bad", "nham_nguyen_am_ngan"],
        ["red", "nham_am_dau"],
      ],
      d: 4,
    },
    {
      say: "c, u, p.",
      right: "cup",
      wrongs: [
        ["cap", "nham_nguyen_am_ngan"],
        ["pup", "nham_am_dau"],
      ],
      d: 5,
    },
    {
      say: "h, a, t.",
      right: "hat",
      wrongs: [
        ["hot", "nham_nguyen_am_ngan"],
        ["cat", "nham_am_dau"],
      ],
      d: 5,
    },
  ],
  sorts: [
    {
      q: "Sort the number words.",
      zones: ["-teen", "-ty"],
      a: ["thirteen", "fifteen"],
      b: ["thirty", "fifty"],
      d: 3,
      hint: "Look at the end of each word.",
    },
    {
      q: "Which ones end in -teen?",
      zones: ["-teen", "-ty"],
      a: ["fourteen", "sixteen"],
      b: ["forty", "sixty"],
      d: 4,
      hint: "Look at the end of each word.",
    },
    {
      q: "Put each number word in its basket.",
      zones: ["-teen", "-ty"],
      a: ["seventeen", "eighteen"],
      b: ["seventy", "eighty"],
      d: 5,
      hint: "Look at the end of each word.",
    },
  ],
  counts: [
    ["stars", "⭐", 12, "Count the stars. Tap each one."],
    ["balls", "⚽", 15, "How many balls? Tap and count."],
  ],
  reads: [
    "eleven, twelve, thirteen",
    "fourteen, fifteen, sixteen",
    "seventeen, eighteen, nineteen, twenty",
    "b, a, g, bag",
    "c, a, t, cat",
  ],
  writes: [
    ["Write the numbers 11 to 15.", "11 12 13 14 15"],
    ["Write as numbers: sixteen, twenty.", "16, 20"],
    ["Spell it: d-o-g. Write the word.", "dog"],
  ],
});

// ─────────────────────────────────────────────────────── nghe từ, chọn tranh ─────────────────
{
  const P = mkPack({
    ...base,
    language: "en",
    code: "ESL.LIS.WORD_PICTURE",
    prefix: "esl-wordpic",
    src: "Global Stage 1 Language Book, từ vựng Language Review + Unit 1–3 (bảng chương trình) — chưa chụp trang sách",
    note: "Nghe một từ, chạm tranh. Ba tranh mỗi câu có tên nghe gần giống (ship / sheep / shop); ô chỉ khác nguyên âm ngắn mang nham_nguyen_am_ngan, chỉ khác âm đầu mang nham_am_dau. Mỗi tranh có đúng một tên.",
  });
  const add = P.add;
  // [từ, emoji, mã lỗi khi là ô nhiễu so với từ đầu của bộ]
  const SETS = [
    [
      ["ship", "🚢"],
      ["shop", "🏪", "nham_nguyen_am_ngan"],
      ["sheep", "🐑"],
    ],
    [
      ["hat", "🎩"],
      ["cat", "🐈", "nham_am_dau"],
      ["bat", "🦇", "nham_am_dau"],
    ],
    [
      ["pen", "🖊️"],
      ["pin", "📌", "nham_nguyen_am_ngan"],
      ["pan", "🍳", "nham_nguyen_am_ngan"],
    ],
    [
      ["bag", "👜"],
      ["bat", "🦇"],
      ["bed", "🛏️"],
    ],
    [
      ["cup", "☕"],
      ["cap", "🧢", "nham_nguyen_am_ngan"],
      ["pup", "🐶", "nham_am_dau"],
    ],
    [
      ["fan", "🪭"],
      ["van", "🚐", "nham_am_dau"],
      ["pan", "🍳", "nham_am_dau"],
    ],
    [
      ["red", "🟥"],
      ["bed", "🛏️", "nham_am_dau"],
      ["ring", "💍"],
    ],
    [
      ["dog", "🐕"],
      ["log", "🪵", "nham_am_dau"],
      ["duck", "🦆"],
    ],
    [
      ["bee", "🐝"],
      ["key", "🔑", "nham_am_dau"],
      ["tree", "🌳"],
    ],
    [
      ["moon", "🌙"],
      ["spoon", "🥄"],
      ["mouse", "🐁"],
    ],
    [
      ["goat", "🐐"],
      ["coat", "🧥", "nham_am_dau"],
      ["boat", "⛵", "nham_am_dau"],
    ],
    [
      ["train", "🚂"],
      ["rain", "🌧️"],
      ["chain", "⛓️"],
    ],
    [
      ["fish", "🐟"],
      ["dish", "🍽️", "nham_am_dau"],
      ["fist", "✊"],
    ],
    [
      ["mouse", "🐁"],
      ["house", "🏠", "nham_am_dau"],
      ["horse", "🐴"],
    ],
    [
      ["bike", "🚲"],
      ["kite", "🪁", "nham_am_dau"],
      ["book", "📕"],
    ],
    [
      ["sock", "🧦"],
      ["rock", "🪨", "nham_am_dau"],
      ["clock", "🕐"],
    ],
    [
      ["pear", "🍐"],
      ["bear", "🐻", "nham_am_dau"],
      ["chair", "🪑"],
    ],
    [
      ["star", "⭐"],
      ["car", "🚗"],
      ["jar", "🫙"],
    ],
    [
      ["nose", "👃"],
      ["rose", "🌹", "nham_am_dau"],
      ["bone", "🦴"],
    ],
    [
      ["sheep", "🐑"],
      ["ship", "🚢"],
      ["shop", "🏪"],
    ],
  ];
  const choice = ([w, e, tag]) => ({ image: img(e, null, w), ...(tag ? { errorTag: tag } : {}) });
  SETS.forEach(([target, ...others], i) => {
    const { choices, answerKey } = choicesOf(choice(target.slice(0, 2)), others.map(choice), i);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 1 + (i % 5),
      scaffold: i < 5 ? "model" : "none",
      targetsError: others.find((o) => o[2])?.[2] ?? null,
      prompt: { text: listenPrompt(LISTEN, target[0], i) },
      listenTarget: { text: target[0] },
      choices,
      answerKey,
      hints: [
        ["Listen to the whole word."],
        ["Listen to the middle sound."],
        ["Listen to the first sound."],
        ["Close your eyes and listen again."],
      ][i % 4],
      explanation: `You heard "${target[0]}".`,
      meta: { estSeconds: 20 },
    });
  });
  SETS.slice(0, 8).forEach(([target, ...others], i) => {
    const { choices, answerKey } = choicesOf(choice(target.slice(0, 2)), others.map(choice), i + 1);
    add({
      type: "MCQ",
      difficulty: 1 + ((i + 2) % 5),
      targetsError: others.find((o) => o[2])?.[2] ?? null,
      prompt: {
        text: [
          `Tap the picture: ${target[0]}.`,
          `Find the ${target[0]}.`,
          `Where is the ${target[0]}?`,
          `Show {ban} the ${target[0]}.`,
        ][i % 4],
      },
      choices,
      answerKey,
      hints: ["Listen to the word, then look at each picture."],
      explanation: `The ${target[0]} is ${target[1]}.`,
      meta: { estSeconds: 20 },
    });
  });
  [
    [0, 2],
    [1, 1],
    [4, 1],
    [10, 1],
    [13, 1],
    [16, 1],
  ].forEach(([s, k], i) => {
    const a = SETS[s][0];
    const b = SETS[s][k];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      prompt: {
        text: [
          "Drag each word under its picture.",
          "These words sound alike. Match them.",
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
      hints: ["Say both words. Listen for the difference."],
      explanation: `${a[1]} is "${a[0]}" and ${b[1]} is "${b[0]}".`,
      meta: { estSeconds: 35 },
    });
  });
  ["ship, sheep, shop", "hat, cat, bat", "coat, goat, boat", "mouse, house, horse"].forEach(
    (r, i) => {
      const words = r.replace(/,/g, "").split(" ");
      add({
        type: "READ_ALOUD",
        difficulty: 2 + (i % 3),
        scaffold: i === 0 ? "model" : "none",
        prompt: { text: READ[i % 6] },
        readTarget: { text: r, words },
        answerKey: { words },
        hints: ["Say each word clearly. They sound alike!"],
        explanation: `These words sound alike: ${r}.`,
      });
    },
  );
  [
    ["Draw a ship and a sheep. Label them.", "ship, sheep"],
    ["Draw a goat in a coat. Label them.", "goat, coat"],
  ].forEach(([q, sample], i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 4 + i,
      prompt: { text: q },
      rubric: {
        criteria: ["Vẽ đúng hai thứ", "Ghi đúng tên dưới mỗi tranh", "Chữ rõ ràng"],
        sampleAnswers: [sample],
      },
      answerKey: null,
      hints: ["Say the words before you write."],
      explanation: `For example: ${sample}`,
      meta: { estSeconds: 90 },
    });
  });
  P.save();
}
