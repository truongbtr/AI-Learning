/**
 * Đợt 3, lô C1 — ESL: 7 chủ đề từ vựng + 5 bộ CVC nguyên âm ngắn.
 *
 * Từ vựng lấy đúng danh sách của Global Stage 1 (docs/09 §4b.1: Language Review = School Supplies,
 * Colors, Shapes, Animals, Parts of the Body; Unit 3 = Toys, Action Verbs 1) cộng vài từ trong mô tả
 * kỹ năng. Chưa chụp trang sách nên `sourceRef` ghi rõ là bảng chương trình.
 *
 * Tranh emoji chọn sao cho **không tranh nào gọi được bằng hai từ trong cùng bộ** (bỏ notebook vì
 * 📓 cũng là "book", bỏ parrot vì 🦜 cũng là "bird", bỏ dad vì 👨 cũng là "man").
 *
 * CVC không có COUNT_TAP: đợt 2 đã thấy đếm trong gói ngữ âm đo kỹ năng đếm chứ không đo âm
 * (bằng chứng `viet-bd-0049`, xem `retire-count-tap-phonics.mjs`).
 *
 *   node scripts/content-gen/esl-dot3-vocab.mjs
 */
import { phonicsPack, vocabPack } from "./lib-en.mjs";

const LB_R =
  "Global Stage 1 Language Book, Language Review (GS1-LB.R, bảng chương trình) — chưa chụp trang sách";
const LB_U3 =
  "Global Stage 1 Language Book Unit 3 Play With Me tr.36 (GS1-LB.U3, bảng chương trình) — chưa chụp trang sách";
const LB_U1 =
  "Global Stage 1 Language Book Unit 1 (GS1-LB.U1, bảng chương trình) + Language Review Animals — chưa chụp trang sách";
const LIT_R =
  "Global Stage 1 Literacy Book, Phonics Review (GS1-LIT.R, bảng chương trình) — chưa chụp trang sách";
const base = { dir: "esl", subject: "ESL" };

vocabPack({
  ...base,
  code: "ESL.VOC.COLORS",
  prefix: "esl-color",
  src: LB_R,
  noun: "color",
  note: "Mười màu của Language Review. Tranh là ô vuông màu nên không có vật nào gợi sang từ khác. Sách dạy cả color / colour — cả hai đều đúng.",
  words: [
    ["red", "🟥"],
    ["blue", "🟦"],
    ["yellow", "🟨"],
    ["green", "🟩"],
    ["orange", "🟧"],
    ["purple", "🟪"],
    ["pink", "🩷"],
    ["brown", "🟫"],
    ["black", "⬛"],
    ["white", "⬜"],
  ],
  counts: [
    ["green apples", "🍏", 4],
    ["red hearts", "❤️", 3],
    ["yellow stars", "⭐", 5],
    ["blue cars", "🚙", 2],
  ],
  sentences: [
    "It is red.",
    "The sky is blue.",
    "I like green.",
    "My bag is pink.",
    "The sun is yellow.",
  ],
  writes: [
    ["Draw a red apple. Write: red.", "red"],
    ["Color a star yellow. Write the color.", "yellow"],
    ["What is your favorite color? Write it.", "blue"],
  ],
});

vocabPack({
  ...base,
  code: "ESL.VOC.SCHOOL_OBJECTS",
  prefix: "esl-school",
  src: LB_R,
  noun: "school thing",
  note: "School Supplies của Language Review. Không có 'notebook' vì tranh 📓 cũng gọi được là 'book'. Sách dạy backpack / rucksack — cả hai đều đúng.",
  words: [
    ["book", "📕"],
    ["pen", "🖊️"],
    ["pencil", "✏️"],
    ["ruler", "📏"],
    ["crayon", "🖍️"],
    ["backpack", "🎒"],
    ["scissors", "✂️"],
    ["chair", "🪑"],
    ["paintbrush", "🖌️"],
    ["paper clip", "📎"],
    ["computer", "💻"],
  ],
  counts: [
    ["pencils", "✏️", 5],
    ["books", "📕", 3],
    ["rulers", "📏", 4],
    ["crayons", "🖍️", 6],
  ],
  sentences: ["It is a pen.", "This is my book.", "I have a ruler.", "My pencil is red."],
  writes: [
    ["Draw your pencil. Write: pencil.", "pencil"],
    ["Write: It is a book.", "It is a book."],
    ["Draw two things in your backpack. Label them.", "book, pen"],
  ],
});

vocabPack({
  ...base,
  code: "ESL.VOC.BODY",
  prefix: "esl-body",
  src: LB_R,
  noun: "body part",
  note: "Parts of the Body của Language Review. Ô nhiễu của mỗi tranh là bộ phận khác trong bộ; cặp chân–bàn chân (🦵/🦶) được giữ vì đó chính là chỗ con hay nhầm.",
  words: [
    ["eyes", "👀"],
    ["ear", "👂"],
    ["nose", "👃"],
    ["mouth", "👄"],
    ["hand", "✋"],
    ["foot", "🦶"],
    ["leg", "🦵"],
    ["arm", "💪"],
    ["tooth", "🦷"],
    ["face", "🙂"],
    ["tongue", "👅"],
  ],
  counts: [
    ["noses", "👃", 3],
    ["ears", "👂", 4],
    ["feet", "🦶", 6],
    ["teeth", "🦷", 5],
  ],
  sentences: ["Touch your nose.", "I have two eyes.", "Clap your hands.", "This is my arm."],
  writes: [
    ["Draw a face. Label: eyes, nose, mouth.", "eyes, nose, mouth"],
    ["Write: I have two hands.", "I have two hands."],
    ["Trace your hand. Write: hand.", "hand"],
  ],
});

vocabPack({
  ...base,
  code: "ESL.VOC.ANIMALS_PETS",
  prefix: "esl-pets",
  src: LB_U1,
  noun: "pet",
  note: "Vật nuôi trong nhà. Không có parrot (🦜 cũng là 'bird'), không có puppy/kitten (cũng là dog/cat).",
  words: [
    ["dog", "🐕"],
    ["cat", "🐈"],
    ["fish", "🐟"],
    ["bird", "🐦"],
    ["rabbit", "🐇"],
    ["hamster", "🐹"],
    ["turtle", "🐢"],
    ["mouse", "🐁"],
    ["snake", "🐍"],
    ["lizard", "🦎"],
  ],
  counts: [
    ["cats", "🐈", 3],
    ["fish", "🐟", 5],
    ["birds", "🐦", 4],
    ["rabbits", "🐇", 2],
  ],
  sentences: ["I have a cat.", "The dog is big.", "My fish is orange.", "I like rabbits."],
  writes: [
    ["Draw your favorite pet. Write its name.", "dog"],
    ["Write: I have a turtle.", "I have a turtle."],
    ["Draw a bird and a fish. Label them.", "bird, fish"],
  ],
});

vocabPack({
  ...base,
  code: "ESL.VOC.TOYS",
  prefix: "esl-toys",
  src: LB_U3,
  noun: "toy",
  note: "Toys của Unit 3 (video game, train, bike, kite, dinosaur, skateboard, robot, teddy bear, scooter, drum) thêm ball, car của mô tả kỹ năng.",
  words: [
    ["video game", "🎮"],
    ["train", "🚂"],
    ["bike", "🚲"],
    ["kite", "🪁"],
    ["dinosaur", "🦕"],
    ["skateboard", "🛹"],
    ["robot", "🤖"],
    ["teddy bear", "🧸"],
    ["scooter", "🛴"],
    ["drum", "🥁"],
    ["ball", "⚽"],
    ["car", "🚗"],
  ],
  counts: [
    ["kites", "🪁", 3],
    ["balls", "⚽", 5],
    ["robots", "🤖", 4],
    ["drums", "🥁", 2],
  ],
  sentences: ["This is my robot.", "I have a red kite.", "My bike is fast.", "I like the train."],
  writes: [
    ["Draw your favorite toy. Write its name.", "robot"],
    ["Write: This is my teddy bear.", "This is my teddy bear."],
    ["Draw a kite and a ball. Label them.", "kite, ball"],
  ],
});

vocabPack({
  ...base,
  code: "ESL.VOC.ACTIONS_VERBS",
  prefix: "esl-verbs",
  src: LB_U3,
  noun: "action",
  note: "Action Verbs 1 của Unit 3 (walk, ride a bike, climb, dance, run, sing…) thêm swim, read, write, sleep, paint. Không dùng throw/catch/fly vì emoji không vẽ rõ.",
  words: [
    ["walk", "🚶"],
    ["ride a bike", "🚴"],
    ["climb", "🧗"],
    ["dance", "💃"],
    ["run", "🏃"],
    ["sing", "🎤"],
    ["swim", "🏊"],
    ["read", "📖"],
    ["write", "✍️"],
    ["sleep", "😴"],
    ["paint", "🎨"],
  ],
  counts: [
    ["runners", "🏃", 3],
    ["dancers", "💃", 4],
    ["swimmers", "🏊", 5],
    ["climbers", "🧗", 2],
  ],
  sentences: ["I can run.", "I can swim.", "We sing and dance.", "I read a book."],
  writes: [
    ["Draw you. What can you do? Write one word.", "swim"],
    ["Write: I can climb.", "I can climb."],
    ["Draw a friend running. Write: run.", "run"],
  ],
});

vocabPack({
  ...base,
  code: "ESL.VOC.SHAPES",
  prefix: "esl-shapes",
  src: LB_R,
  noun: "shape",
  note: "Shapes của Language Review. Hình vuông và hình chữ nhật đều có (con hay nhầm), vẽ khác hẳn tỉ lệ.",
  words: [
    ["circle", "🔴"],
    ["square", "🟩"],
    ["triangle", "🔺"],
    ["rectangle", "▬"],
    ["star", "⭐"],
    ["heart", "❤️"],
    ["diamond", "🔶"],
    ["oval", "🥚"],
  ],
  counts: [
    ["stars", "⭐", 5],
    ["hearts", "❤️", 3],
    ["triangles", "🔺", 4],
    ["circles", "🔴", 6],
  ],
  sentences: [
    "It is a circle.",
    "I see a star.",
    "The door is a rectangle.",
    "I draw a heart.",
    "A square has four sides.",
  ],
  writes: [
    ["Draw a circle and a square. Label them.", "circle, square"],
    ["Write: It is a triangle.", "It is a triangle."],
    ["Draw a house with shapes. Label two.", "square, triangle"],
  ],
});

// ─────────────────────────────────────────────────────────────── CVC nguyên âm ngắn ──────────
// [word, emoji, đổi nguyên âm (nham_nguyen_am_ngan), đổi âm đầu (nham_am_dau), viết lệch (sai_chinh_ta_tu)]
const cvc = (vowel, prefix, words, others, rows, writes) =>
  phonicsPack({
    ...base,
    code: `ESL.PH.CVC_SHORT_${vowel.toUpperCase()}`,
    prefix,
    src: LIT_R,
    vowel,
    words,
    others,
    rows,
    writes,
    note: `Từ CVC có ${vowel} ngắn. Ô nhiễu: đổi nguyên âm (nham_nguyen_am_ngan), đổi âm đầu (nham_am_dau), viết lệch một chữ (sai_chinh_ta_tu). Mọi từ đều có tranh, nên ô nhiễu là từ thật cũng không khớp tranh. Câu 'từ nào có ${vowel} ngắn' lấy ô nhiễu từ bộ nguyên âm khác. Không có COUNT_TAP.`,
  });

cvc(
  "a",
  "esl-shorta",
  [
    ["cat", "🐈", "cut", "hat", "kat"],
    ["hat", "🎩", "hit", "mat", "hatt"],
    ["map", "🗺️", "mop", "cap", "mapp"],
    ["bag", "👜", "big", "rag", "bagg"],
    ["pan", "🍳", "pen", "fan", "pann"],
    ["van", "🚐", "vin", "can", "vann"],
    ["bat", "🦇", "bit", "rat", "batt"],
    ["rat", "🐀", "rot", "hat", "ratt"],
    ["fan", "🪭", "fin", "man", "fann"],
    ["cap", "🧢", "cup", "map", "kap"],
  ],
  ["pen", "dog", "sun", "pig", "bed", "fox", "cup", "sit"],
  [
    "cat, hat, bat",
    "A cat has a hat.",
    "The bag is on the map.",
    "A rat ran.",
    "Dad has a van.",
    "I can nap.",
  ],
  [
    ["Write three words: cat, hat, bat.", "cat, hat, bat"],
    ["Draw a cap. Write: cap.", "cap"],
    ["Write: A cat has a hat.", "A cat has a hat."],
  ],
);

cvc(
  "e",
  "esl-shorte",
  [
    ["pen", "🖊️", "pin", "hen", "pem"],
    ["bed", "🛏️", "bad", "red", "bedd"],
    ["hen", "🐔", "hin", "ten", "henn"],
    ["net", "🥅", "nut", "pet", "nett"],
    ["leg", "🦵", "log", "peg", "legg"],
    ["ten", "🔟", "tin", "hen", "tenn"],
    ["red", "🟥", "rid", "bed", "redd"],
    ["web", "🕸️", "wib", "deb", "webb"],
    ["jet", "✈️", "jot", "get", "jett"],
    ["gem", "💎", "gum", "hem", "jem"],
  ],
  ["cat", "pig", "dog", "sun", "map", "fox", "bus", "lid"],
  [
    "pen, hen, ten",
    "The hen is red.",
    "Ten men get wet.",
    "A pen is on the bed.",
    "Get the net.",
    "My leg is in bed.",
  ],
  [
    ["Write three words: pen, hen, ten.", "pen, hen, ten"],
    ["Draw a bed. Write: bed.", "bed"],
    ["Write: The hen is red.", "The hen is red."],
  ],
);

cvc(
  "i",
  "esl-shorti",
  [
    ["pig", "🐖", "peg", "big", "pigg"],
    ["six", "6️⃣", "sax", "fix", "sixx"],
    ["pin", "📌", "pen", "bin", "pinn"],
    ["lip", "👄", "lap", "hip", "lipp"],
    ["zip", "🤐", "zap", "hip", "zipp"],
    ["bin", "🗑️", "ban", "pin", "binn"],
    ["dig", "⛏️", "dog", "big", "digg"],
    ["win", "🏆", "wan", "fin", "winn"],
    ["kid", "🧒", "kad", "lid", "kidd"],
  ],
  ["cat", "bed", "dog", "sun", "hat", "pot", "cup", "hen"],
  [
    "pig, big, dig",
    "The pig is big.",
    "Sit on the lid.",
    "Six kids win.",
    "A pin is in the bin.",
    "I can dig.",
  ],
  [
    ["Write three words: pig, big, dig.", "pig, big, dig"],
    ["Draw six dots. Write: six.", "six"],
    ["Write: The pig is big.", "The pig is big."],
  ],
);

cvc(
  "o",
  "esl-shorto",
  [
    ["dog", "🐕", "dig", "log", "dogg"],
    ["box", "📦", "bax", "fox", "boks"],
    ["fox", "🦊", "fix", "box", "foks"],
    ["pot", "🍲", "pet", "hot", "pott"],
    ["mop", "🧹", "map", "top", "mopp"],
    ["log", "🪵", "leg", "dog", "logg"],
    ["rod", "🎣", "red", "nod", "rodd"],
    ["fog", "🌫️", "fig", "hog", "fogg"],
    ["dot", "⚫", "dit", "hot", "dott"],
  ],
  ["cat", "pen", "pig", "sun", "bed", "map", "bus", "lip"],
  [
    "dog, log, fog",
    "The dog is on a log.",
    "A fox is in the box.",
    "The pot is hot.",
    "Mom has a mop.",
    "Hop, hop, hop!",
  ],
  [
    ["Write three words: dog, log, fog.", "dog, log, fog"],
    ["Draw a box. Write: box.", "box"],
    ["Write: The dog is on a log.", "The dog is on a log."],
  ],
);

cvc(
  "u",
  "esl-shortu",
  [
    ["sun", "☀️", "sin", "bun", "sunn"],
    ["bus", "🚌", "bas", "hus", "buss"],
    ["cup", "☕", "cap", "pup", "cupp"],
    ["bug", "🐛", "bag", "hug", "bugg"],
    ["nut", "🥜", "net", "cut", "nutt"],
    ["hut", "🛖", "hat", "nut", "hutt"],
    ["tub", "🛁", "tab", "cub", "tubb"],
    ["hug", "🫂", "hag", "bug", "hugg"],
    ["run", "🏃", "ran", "sun", "runn"],
    ["pup", "🐶", "pap", "cup", "pupp"],
  ],
  ["cat", "pen", "pig", "dog", "bed", "map", "fox", "lid"],
  [
    "sun, bun, run",
    "The bug is in the cup.",
    "Run to the bus.",
    "A pup in a tub.",
    "Hug the pup.",
    "The sun is up.",
  ],
  [
    ["Write three words: sun, bun, run.", "sun, bun, run"],
    ["Draw a bus. Write: bus.", "bus"],
    ["Write: The bug is in the cup.", "The bug is in the cup."],
  ],
);
