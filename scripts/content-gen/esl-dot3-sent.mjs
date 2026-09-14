/**
 * Đợt 3, lô C3 — ESL: mẫu câu, nghe hiểu, nói, ngữ pháp (15 kỹ năng).
 *
 * Mọi câu hỏi và ô sai viết tay. Ba luật giữ "một đáp án":
 *  - không bao giờ đặt hai cách nói cùng đúng cạnh nhau (It's / It is, color / colour);
 *  - khi đúng–sai phụ thuộc điều tranh emoji không vẽ được (gần/xa, trên/dưới, con thích gì),
 *    câu hỏi kèm dữ kiện tiếng Việt trong ngoặc;
 *  - ô "trả lời được một câu hỏi khác" chỉ dùng khi câu hỏi nêu rõ đang hỏi gì.
 *
 * Mã lỗi chỉ gắn khi đúng nghĩa theo `error-semantics.ts`: nham_am_is_are (đổi am/is/are),
 * nham_this_that, doc_bo_tu_tieng_anh (ô ngắn hơn vì rơi một từ), thieu_s_so_nhieu (chỉ khác -s,
 * không có dấu chấm cuối), sai_chinh_ta_tu (-ing viết sai). Ô "chỉ nghe nửa đầu câu" không mang mã: chua_nghe_het_de là mã hành vi, validator không cho gắn lên ô.
 *
 *   node scripts/content-gen/esl-dot3-sent.mjs
 */
import { sentencePack } from "./lib-en.mjs";

const base = { dir: "esl", subject: "ESL" };
const P = (e, w) => ({ e, w });
const w = (list) => list.map((x) => (Array.isArray(x) ? x : [x]));
const I = (q, right, wrongs, d, extra = {}) => ({
  q,
  right,
  wrongs: w(wrongs),
  d,
  hint: extra.hint ?? "Read every choice before you tap.",
  ...extra,
});
const L = (say, right, wrongs, d, extra = {}) => ({ say, right, wrongs: w(wrongs), d, ...extra });
const GS = (unit, what) =>
  `Global Stage 1 Language Book ${unit} — ${what} (bảng chương trình) — chưa chụp trang sách`;
const LIS =
  "Kỹ năng nghe CCSS SL.1.2, dùng từ vựng Global Stage 1 Language Review–Unit 4 — sách chưa có bài nghe tương ứng";
const IS = "nham_am_is_are";
const TT = "nham_this_that";
const DROP = "doc_bo_tu_tieng_anh";

// ─────────────────────────────────────────────────────────────── chào hỏi ────────────────────
sentencePack({
  ...base,
  code: "ESL.VOC.GREETINGS",
  prefix: "esl-greet",
  src: GS("Unit 1 Meet My Family tr.10", "nói: giới thiệu bản thân"),
  note: "Chào hỏi, hỏi tên, hỏi tuổi. Ô nhiễu là câu trả lời cho câu hỏi khác (con hay trả lời 'I'm six' khi được hỏi tên) và câu rơi mất một từ ('My name Sam').",
  items: [
    I("Someone says hello to you. What do you say?", "Hello!", ["Goodbye!", "Thank you!"], 1),
    I("It is time to go home. What do you say?", "Goodbye!", ["Hello!", "Good morning!"], 1),
    I("What's your name?", "I'm Sam.", ["I'm six.", "I'm fine."], 2, {
      hint: "The question asks for a name.",
    }),
    I("How old are you?", "I'm six.", ["I'm Sam.", "I'm fine."], 2, {
      hint: "The question asks for a number.",
    }),
    I("How are you?", "I'm fine, thank you.", ["I'm six.", "My name is Sam."], 2, {
      hint: "The question asks how you feel.",
    }),
    I(
      "Which answer is right? What's your name?",
      "My name is Sam.",
      [["My name Sam.", DROP], "Name is my Sam."],
      3,
    ),
    I(
      "Choose the right sentence.",
      "I am six years old.",
      [["I six years old.", DROP], "I am six year old."],
      3,
    ),
    I("It is morning at school. What do you say?", "Good morning!", ["Good night!", "Goodbye!"], 3),
    I(
      'A new friend says "Nice to meet you!" You say:',
      "Nice to meet you, too!",
      ["Goodbye!", "I'm six."],
      4,
    ),
    I(
      "Which question asks how old you are?",
      "How old are you?",
      ["What's your name?", "How are you?"],
      4,
    ),
    I(
      "Which question asks your name?",
      "What's your name?",
      ["How old are you?", "How are you?"],
      4,
    ),
    I("Tom says \"I'm seven.\" Seven is Tom's…", "age", ["name", "class"], 5, {
      hint: "Seven is a number.",
    }),
  ],
  listens: [
    L("What's your name?", "I'm Sam.", ["I'm six.", "Goodbye!"], 1),
    L("How old are you?", "I'm six.", ["I'm Sam.", "Hello!"], 1),
    L("Hello! I'm Ben.", "Hello, Ben!", ["Goodbye, Ben!", "I'm six."], 2),
    L("Goodbye! See you tomorrow.", "Bye! See you!", ["Hello!", "Nice to meet you!"], 2),
    L("How are you today?", "I'm fine, thank you.", ["I'm seven.", "My name is Sam."], 3),
    L(
      "Good morning, class!",
      "Good morning, teacher!",
      ["Good night, teacher!", "Goodbye, teacher!"],
      3,
    ),
    L("I'm Lily. What's your name?", "My name is Sam.", ["I'm seven years old.", "Yes, it is."], 4),
    L("This is my friend, Nam.", "Nice to meet you, Nam!", ["Goodbye, Nam!", "I'm fine, Nam."], 5),
  ],
  listenPrompts: [
    "Listen. What do you say back?",
    "{ban} talks to you. Tap your answer.",
    "Listen, then pick the best answer.",
    "What is a good reply? Tap it.",
    "Listen carefully, then answer.",
    "Listen again and choose a reply.",
  ],
  builds: [
    "My name is Sam.",
    "I am six years old.",
    "Nice to meet you.",
    "How old are you?",
    "What is your name?",
  ],
  sorts: [
    {
      q: "Hello words or goodbye words? Sort them.",
      zones: ["Hello", "Goodbye"],
      a: ["Hi!", "Good morning!"],
      b: ["Bye!", "See you!"],
      d: 2,
    },
    {
      q: "Is it a question or an answer?",
      zones: ["Question", "Answer"],
      a: ["How old are you?", "What's your name?"],
      b: ["I'm six.", "I'm Sam."],
      d: 3,
    },
  ],
  reads: [
    "Hello! My name is Sam.",
    "I am six years old.",
    "How are you?",
    "I'm fine, thank you.",
    "Goodbye! See you tomorrow.",
  ],
  writes: [
    ["Write how old you are: I am ___ years old.", "I am six years old."],
    ["Draw you and a friend. Write: Hello!", "Hello!"],
    ["Write a question for a new friend.", "How old are you?"],
  ],
});

// ─────────────────────────────────────────────────────────── mệnh lệnh trong lớp ─────────────
sentencePack({
  ...base,
  code: "ESL.VOC.CLASSROOM_COMMANDS",
  prefix: "esl-command",
  src: GS("Language Review", "Imperatives"),
  note: "Mệnh lệnh trong lớp. Emoji không vẽ được 'đứng lên' hay 'gấp sách' rõ ràng, nên câu hỏi dùng nghĩa tiếng Việt; ô nhiễu là mệnh lệnh ngược nghĩa (open/close, stand up/sit down) — đúng chỗ con hay nhầm.",
  items: [
    I("Which command means 'Đứng lên'?", "Stand up.", ["Sit down.", "Be quiet."], 1),
    I("Which command means 'Ngồi xuống'?", "Sit down.", ["Stand up.", "Look."], 1),
    I(
      "Which command means 'Mở sách ra'?",
      "Open your book.",
      ["Close your book.", "Raise your hand."],
      2,
    ),
    I("Which command means 'Gấp sách lại'?", "Close your book.", ["Open your book.", "Listen."], 2),
    I("Which command means 'Giơ tay'?", "Raise your hand.", ["Clap your hands.", "Sit down."], 2),
    I("Which command means 'Trật tự'?", "Be quiet.", ["Stand up.", "Look."], 3),
    I("Which command means 'Hãy nghe'?", "Listen.", ["Look.", "Line up."], 3),
    I("Which command means 'Hãy nhìn'?", "Look.", ["Listen.", "Stand up."], 3),
    I(
      "It is too noisy. What does the teacher say?",
      "Be quiet, please.",
      ["Stand up, please.", "Open your book, please."],
      4,
    ),
    I(
      "You want to speak in class. What do you do?",
      "Raise your hand.",
      ["Close your book.", "Line up."],
      4,
    ),
    I(
      "Story time! Your book is closed. Teacher says…",
      "Open your book.",
      ["Close your book.", "Line up."],
      5,
    ),
    I(
      "The bell rings. Time to go out. Teacher says…",
      "Line up, please.",
      ["Sit down, please.", "Open your book, please."],
      5,
    ),
  ],
  listenPrompts: [
    "Listen. What does it mean?",
    "{ban} gives a command. Tap its meaning.",
    "What should you do? Tap it.",
    "Listen carefully, then choose.",
    "Listen again, then choose.",
    "Listen and pick the meaning.",
  ],
  listens: [
    L("Sit down, please.", "Ngồi xuống", ["Đứng lên", "Trật tự"], 1),
    L("Stand up.", "Đứng lên", ["Ngồi xuống", "Nhìn"], 1),
    L("Open your book.", "Mở sách", ["Gấp sách", "Giơ tay"], 2),
    L("Close your book.", "Gấp sách", ["Mở sách", "Nghe"], 2),
    L("Raise your hand.", "Giơ tay", ["Vỗ tay", "Xếp hàng"], 3),
    L("Be quiet.", "Trật tự", ["Nghe", "Đứng lên"], 3),
    L("Line up at the door.", "Xếp hàng ở cửa", ["Ngồi ở cửa", "Mở cửa"], 4),
    L("Put your pencil down.", "Đặt bút chì xuống", ["Cầm bút chì lên", "Mở hộp bút"], 5),
  ],
  builds: [
    "Open your book.",
    "Please sit down.",
    "Raise your hand.",
    "Be quiet please.",
    "Close the door please.",
  ],
  sorts: [
    {
      q: "Up or down? Sort the commands.",
      zones: ["Go up", "Go down"],
      a: ["Stand up.", "Raise your hand."],
      b: ["Sit down.", "Put your hand down."],
      d: 3,
    },
    {
      q: "Eyes or ears? Sort the commands.",
      zones: ["Use your eyes", "Use your ears"],
      a: ["Look at the board.", "Read the book."],
      b: ["Listen to the song.", "Listen to me."],
      d: 4,
    },
  ],
  reads: [
    "Stand up, please.",
    "Sit down, please.",
    "Open your book.",
    "Raise your hand.",
    "Be quiet, please.",
  ],
  writes: [
    ["Write: Open your book.", "Open your book."],
    ["Draw a child with a hand up. Write the command.", "Raise your hand."],
    ["Write two commands your teacher says.", "Sit down. Be quiet."],
  ],
});

// ─────────────────────────────────────────────────────────── nghe lệnh ngắn ──────────────────
sentencePack({
  ...base,
  code: "ESL.LIS.SHORT_INSTRUCTION",
  prefix: "esl-instruct",
  src: LIS,
  note: "Nghe lệnh 3–6 từ rồi làm. Ô tranh cho lệnh về cơ thể, đồ vật; ô nghĩa tiếng Việt cho lệnh về vị trí (emoji không vẽ được trên/dưới). Lệnh 'A, not B' đặt B làm ô nhiễu (con chỉ nghe nửa câu) — không gắn mã vì chua_nghe_het_de là mã hành vi.",
  items: [
    I(
      "Which instruction matches the picture?",
      "Clap your hands.",
      ["Touch your nose.", "Stand up."],
      1,
      { pic: "👏" },
    ),
    I(
      "Which instruction matches the picture?",
      "Wave your hand.",
      ["Clap your hands.", "Sit down."],
      1,
      { pic: "👋" },
    ),
    I(
      "What is the child doing? Pick the instruction.",
      "Raise your hand.",
      ["Touch your toes.", "Close your book."],
      2,
      { pic: "🙋" },
    ),
    I(
      "Which instruction matches the picture?",
      "Be quiet.",
      ["Sing a song.", "Open your mouth."],
      2,
      { pic: "🤫" },
    ),
    I(
      "Which instruction matches the picture?",
      "Touch your nose.",
      ["Touch your ears.", "Touch your eyes."],
      3,
      { pic: "👃" },
    ),
    I(
      "Which instruction matches the picture?",
      "Open your book.",
      ["Close your book.", "Draw a star."],
      3,
      { pic: "📖" },
    ),
    I(
      "Which instruction matches the picture?",
      "Pick up your pencil.",
      ["Pick up your ruler.", "Pick up your bag."],
      4,
      { pic: "✏️" },
    ),
    I(
      "What is the child doing? Pick the instruction.",
      "Stand up.",
      ["Sit down.", "Lie down."],
      5,
      { pic: "🧍" },
    ),
  ],
  listenPrompts: [
    "Listen to the whole instruction.",
    "{ban} gives an instruction. Tap it!",
    "What should you do? Tap it.",
    "Listen carefully, then choose.",
    "Listen again, then choose.",
    "Listen and pick the right one.",
  ],
  listens: [
    L("Touch your nose.", P("👃", "nose"), [P("👂", "ears"), P("👀", "eyes")], 1),
    L("Clap your hands.", P("👏", "clap"), [P("👋", "wave"), P("🦶", "foot")], 1),
    L("Touch your ears.", P("👂", "ears"), [P("👃", "nose"), P("👀", "eyes")], 1),
    L(
      "Point to the red apple.",
      P("🍎", "red apple"),
      [P("🍏", "green apple"), P("🍌", "banana")],
      2,
    ),
    L("Show me your feet.", P("🦶", "feet"), [P("🦵", "leg"), P("✋", "hand")], 2),
    L("Pick up the pencil.", P("✏️", "pencil"), [P("🖊️", "pen"), P("📏", "ruler")], 2),
    L("Find the red car.", P("🚗", "red car"), [P("🚙", "blue car"), P("🚌", "bus")], 3),
    L(
      "Put the ball in the box.",
      "Bỏ quả bóng vào hộp",
      ["Đặt quả bóng lên hộp", "Đặt quả bóng dưới hộp"],
      3,
    ),
    L("Put the book on the desk.", "Đặt sách lên bàn", ["Đặt sách dưới bàn", "Bỏ sách vào cặp"], 3),
    L("Point to the fish, not the cat.", P("🐟", "fish"), [P("🐈", "cat"), P("🐦", "bird")], 4),
    L("Show me the book, not the pen.", P("📕", "book"), [P("🖊️", "pen"), P("✏️", "pencil")], 4),
    L(
      "Put your bag under the chair.",
      "Để cặp dưới ghế",
      ["Để cặp trên ghế", "Để cặp cạnh ghế"],
      4,
    ),
    L("Clap two times.", "Vỗ tay hai lần", ["Vỗ tay ba lần", "Giậm chân hai lần"], 4),
    L("Take the ruler, not the pencil.", P("📏", "ruler"), [P("✏️", "pencil"), P("📕", "book")], 5),
    L(
      "Stand up and turn around.",
      "Đứng lên rồi quay một vòng",
      ["Đứng lên", "Ngồi xuống rồi quay một vòng"],
      5,
    ),
    L("Jump three times.", "Nhảy ba lần", ["Nhảy hai lần", "Chạy ba lần"], 5),
    L(
      "Touch your head, then your toes.",
      "Chạm đầu rồi chạm ngón chân",
      ["Chạm đầu", "Chạm mũi rồi chạm tai"],
      5,
    ),
  ],
  places: [
    {
      q: "Put the apple in the basket.",
      items: [
        ["apple", "🍎"],
        ["banana", "🍌"],
      ],
      zones: [["basket", "🧺"]],
      key: { 0: [0] },
      d: 1,
      why: "The apple goes in the basket.",
    },
    {
      q: "Put the pencil in the bag.",
      items: [
        ["pencil", "✏️"],
        ["ruler", "📏"],
      ],
      zones: [["bag", "🎒"]],
      key: { 0: [0] },
      d: 2,
      why: "The pencil goes in the bag.",
    },
    {
      q: "Bone to the dog, fish to the cat.",
      items: [
        ["bone", "🦴"],
        ["fish", "🐟"],
      ],
      zones: [
        ["dog", "🐕"],
        ["cat", "🐈"],
      ],
      key: { 0: [0], 1: [1] },
      d: 3,
      why: "The dog gets the bone and the cat gets the fish.",
    },
    {
      q: "Put the red ball in the box.",
      items: [
        ["red ball", "🔴"],
        ["blue ball", "🔵"],
      ],
      zones: [["box", "📦"]],
      key: { 0: [0] },
      d: 3,
      why: "Only the red ball goes in the box.",
    },
    {
      q: "Carrot to the rabbit, banana to the monkey.",
      items: [
        ["carrot", "🥕"],
        ["banana", "🍌"],
      ],
      zones: [
        ["rabbit", "🐇"],
        ["monkey", "🐒"],
      ],
      key: { 0: [0], 1: [1] },
      d: 4,
      why: "The rabbit gets the carrot and the monkey gets the banana.",
    },
    {
      q: "Book on the desk. Bag on the chair.",
      items: [
        ["book", "📕"],
        ["bag", "🎒"],
      ],
      zones: [["desk"], ["chair", "🪑"]],
      key: { 0: [0], 1: [1] },
      d: 5,
      why: "The book goes on the desk and the bag on the chair.",
    },
  ],
  reads: ["Touch your nose.", "Clap your hands two times.", "Put the ball in the box."],
  writes: [
    [
      "Draw a blue star and a red heart.",
      "blue star, red heart",
      ["Vẽ đúng hình ngôi sao và trái tim", "Tô đúng màu: sao xanh, tim đỏ"],
    ],
    [
      "Draw a cat under a table.",
      "cat under table",
      ["Vẽ con mèo và cái bàn", "Con mèo ở dưới bàn"],
    ],
  ],
});

// ─────────────────────────────────────────────────────────── nghe hội thoại ──────────────────
sentencePack({
  ...base,
  code: "ESL.LIS.SHORT_DIALOGUE",
  prefix: "esl-dialog",
  src: LIS,
  note: "Nghe hội thoại 2–4 lượt rồi trả lời câu hỏi in trên màn hình (câu hỏi in ra không lộ đáp án). Ô chứa thứ được nhắc ở nửa đầu hội thoại là nhiễu có chủ đích (không gắn mã: chua_nghe_het_de là mã hành vi).",
  items: [
    I('"What\'s this?" "It\'s a ___."', "kite", ["bike", "cake"], 1, { pic: "🪁" }),
    I('"What\'s your name?" Which answer fits?', "I'm Lily.", ["I'm six.", "I'm fine."], 1),
    I('"How are you?" Which answer fits?', "I'm fine, thanks.", ["I'm a robot.", "It's blue."], 2),
    I(
      '"Is it a dog?" Look at the picture. Answer:',
      "No, it isn't.",
      ["Yes, it is.", "It's a dog."],
      3,
      { pic: "🐈" },
    ),
    I('"Can you jump?" Which answer is right?', "Yes, I can.", ["Yes, I can't.", "Yes, I do."], 3),
    I(
      '"Do you like apples?" You like apples. You say:',
      "Yes, I do.",
      ["No, I don't.", "Yes, I am."],
      3,
    ),
    I(
      '"Where is the ball?" (Quả bóng ở trong hộp.)',
      "It's in the box.",
      ["It's on the box.", "It's a box."],
      4,
    ),
    I(
      '"What colour is your bag?" Which answer fits?',
      "It's pink.",
      ["It's a bag.", "Yes, it is."],
      4,
    ),
    I('"How many pens?" Which answer fits?', "Two pens.", ["Blue pens.", "Yes, pens."], 5),
    I('"Who is she?" Which answer fits?', "She is my sister.", ["She is six.", "It is my bag."], 5),
  ],
  listens: [
    L("What's this? It's a robot.", P("🤖", "robot"), [P("🚂", "train"), P("🪁", "kite")], 1, {
      q: "What is it?",
    }),
    L("What colour is it? It's green.", P("🟩", "green"), [P("🟦", "blue"), P("🟥", "red")], 1, {
      q: "Which colour?",
    }),
    L("Is it a cat? No, it's a dog.", P("🐕", "dog"), [P("🐈", "cat"), P("🐇", "rabbit")], 2, {
      q: "What animal is it?",
    }),
    L("How many apples? Three apples.", "3", ["2", "4"], 2, { q: "How many?" }),
    L("Tom: I have a cat. Anna: I have a dog.", "Anna", ["Tom", "Sam"], 3, { q: "Who has a dog?" }),
    L(
      "Do you like milk? No, I don't. I like juice.",
      P("🧃", "juice"),
      [P("🥛", "milk"), P("🍎", "apple")],
      3,
      { q: "What does the child like?" },
    ),
    L("Where is my ball? It's under the bed.", "dưới giường", ["trên giường", "trong hộp"], 3, {
      q: "Where is the ball?",
    }),
    L("Is the robot big? No, it's small.", "No, it's small.", ["Yes, it is.", "It's a robot."], 4, {
      q: "Is the robot big?",
    }),
    L("Can you swim? Yes, I can. Can you fly? No, I can't.", "swim", ["fly", "climb"], 4, {
      q: "What can the child do?",
    }),
    L("Ben: How old are you, Mai? Mai: I'm seven.", "7", ["6", "8"], 4, { q: "How old is Mai?" }),
    L("Where's the cat? It's on the chair.", "trên ghế", ["dưới ghế", "cạnh ghế"], 4, {
      q: "Where is the cat?",
    }),
    L(
      "What's in your bag? A book and a pen.",
      "a book and a pen",
      ["a book", "a pen and a ruler"],
      5,
      { q: "What is in the bag?" },
    ),
    L("Is it hot today? Yes, it's very hot.", P("☀️", "hot"), [P("❄️", "cold"), P("🌧️", "rainy")], 5, {
      q: "What is the weather like?",
    }),
    L("Lily: My kite is red. Sam: My kite is blue.", "blue", ["red", "green"], 5, {
      q: "What colour is Sam's kite?",
    }),
  ],
  builds: ["What is this?", "It is a robot.", "Is it big?"],
  sorts: [
    {
      q: "Question or answer? Sort them.",
      zones: ["Question", "Answer"],
      a: ["What's this?", "Is it big?"],
      b: ["It's a robot.", "No, it's small."],
      d: 2,
    },
    {
      q: "Match: which cards are questions?",
      zones: ["Question", "Answer"],
      a: ["Where is my ball?", "Can you swim?"],
      b: ["It's under the bed.", "Yes, I can."],
      d: 4,
    },
  ],
  reads: [
    "What's this? It's a robot.",
    "Is it big? No, it's small.",
    "Where is my ball? It's under the bed.",
    "Can you swim? Yes, I can.",
  ],
  writes: [
    ["What colour is your bag? Write the answer.", "It's blue."],
    ["Draw a toy. Write: What's this? It's a ___.", "What's this? It's a car."],
  ],
});

// ─────────────────────────────────────────────────────────── bài hát, chant ──────────────────
sentencePack({
  ...base,
  code: "ESL.LIS.SONG_CHANT",
  prefix: "esl-song",
  src: `${LIS}; bài hát dân gian tiếng Anh (Head Shoulders Knees and Toes, Twinkle Twinkle, The Wheels on the Bus…)`,
  note: "Nghe một câu bài hát/chant quen thuộc (đồng dao dân gian, không bản quyền) rồi chọn từ còn thiếu. Ô nhiễu cùng vần hoặc cùng nhóm nghĩa — con hay 'hát theo nhạc mà không hiểu từ'.",
  items: [
    I("Head, shoulders, knees and ___", "toes", ["shoes", "nose"], 1),
    I("Twinkle, twinkle, little ___", "star", ["car", "sun"], 2),
    I("Clap, clap, clap your ___", "hands", ["feet", "nose"], 2),
    I("Stamp, stamp, stamp your ___", "feet", ["hands", "ears"], 3),
    I("Old MacDonald had a farm. E-I-E-I-___", "O", ["A", "U"], 3),
    I("The wheels on the bus go round and ___", "round", ["square", "up"], 4),
    I("Rain, rain, go away. Come again another ___", "day", ["way", "night"], 5),
    I("Humpty Dumpty sat on a ___", "wall", ["ball", "chair"], 5),
  ],
  listenPrompts: [
    "Listen to the song. What comes next?",
    "{ban} sings. Tap the next word!",
    "What is the missing word? Tap it.",
    "Listen and finish the song.",
    "Sing along. Which word comes next?",
    "Listen again. Tap the next word.",
  ],
  listens: [
    L("Head, shoulders, knees and", "toes", ["nose", "hands"], 1),
    L("Twinkle, twinkle, little", "star", ["car", "moon"], 1),
    L("A, B, C, D, E, F,", "G", ["H", "J"], 2),
    L("The wheels on the bus go round and", "round", ["up", "down"], 2),
    L("Row, row, row your", "boat", ["bike", "goat"], 2),
    L("If you're happy and you know it, clap your", "hands", ["feet", "head"], 3),
    L("Old MacDonald had a", "farm", ["car", "dog"], 3),
    L("Baa, baa, black", "sheep", ["ship", "cat"], 3),
    L("How I wonder what you", "are", ["is", "star"], 3),
    L("Monday, Tuesday,", "Wednesday", ["Thursday", "Sunday"], 4),
    L("Eyes and ears and mouth and", "nose", ["toes", "knees"], 4),
    L("Up above the world so", "high", ["sky", "low"], 4),
    L("One, two, buckle my", "shoe", ["hat", "bag"], 5),
    L("Rain, rain, go", "away", ["today", "again"], 5),
  ],
  builds: [
    "Head shoulders knees and toes.",
    "Clap your hands.",
    "How I wonder what you are.",
    "Old MacDonald had a farm.",
  ],
  sorts: [
    {
      q: "Body words or not? Sort the song words.",
      zones: ["Body", "Not body"],
      a: ["knees", "toes"],
      b: ["star", "bus"],
      d: 2,
    },
    {
      q: "Sky or bus? Sort the song words.",
      zones: ["In the sky", "On the bus"],
      a: ["star", "moon"],
      b: ["wheels", "wipers"],
      d: 4,
    },
  ],
  reads: [
    "Head, shoulders, knees and toes.",
    "Twinkle, twinkle, little star.",
    "The wheels on the bus go round and round.",
    "If you're happy and you know it, clap your hands.",
    "Rain, rain, go away.",
  ],
  writes: [
    ["Draw a little star. Write: little star.", "little star"],
    ["Write the missing word: clap your ___.", "hands"],
  ],
});

// ─────────────────────────────────────────────────────────── tự giới thiệu ───────────────────
sentencePack({
  ...base,
  code: "ESL.SPK.INTRODUCE_SELF",
  prefix: "esl-intro",
  src: GS("Unit 1 Meet My Family tr.10", "nói: giới thiệu bản thân và gia đình"),
  note: "Tự giới thiệu 2–3 câu. Kỹ năng nói được luyện qua đọc to (8 bài) và xếp câu; trắc nghiệm hỏi câu nào nói tên / tuổi / sở thích và câu nào đúng ngữ pháp (I six → doc_bo_tu_tieng_anh, I is → nham_am_is_are). Tên trong bài là tên chung (Sam, Lily), không phải tên của con.",
  items: [
    I("Which sentence tells your name?", "My name is Sam.", ["I am six.", "I like robots."], 1),
    I(
      "Which sentence tells how old you are?",
      "I am six years old.",
      ["My name is Sam.", "I like cats."],
      1,
    ),
    I("Start your talk. What do you say first?", "Hello!", ["Goodbye!", "Thank you!"], 2),
    I(
      "Which sentence tells what you like?",
      "I like robots.",
      ["I am six.", "I'm in class 1B."],
      2,
    ),
    I(
      "Which sentence is right?",
      "I am six.",
      [
        ["I six.", DROP],
        ["I is six.", IS],
      ],
      2,
    ),
    I(
      "Which sentence is right?",
      "My name is Sam.",
      [
        ["My name Sam.", DROP],
        ["My name are Sam.", IS],
      ],
      3,
    ),
    I(
      "Which sentence is right?",
      "I like dogs",
      [["I like dog", "thieu_s_so_nhieu"], "I likes dogs"],
      3,
    ),
    I("End your talk. What do you say?", "Thank you!", ["Hello!", "How old are you?"], 3),
    I(
      "Which sentence is about you, not a friend?",
      "I am in class 1B.",
      ["He is in class 1B.", "She is in class 1B."],
      4,
    ),
    I("Which sentence tells your class?", "I'm in class 1B.", ["I'm six.", "I like red."], 4),
    I(
      "Which is a good way to start?",
      "Hi! I'm Sam. I'm six.",
      ["Hi! You're Sam. You're six.", "Bye! I'm Sam."],
      5,
    ),
    I(
      "Which sentence tells your favourite colour?",
      "My favourite colour is blue.",
      ["I have a blue bag.", "I am blue."],
      5,
    ),
  ],
  listens: [
    L("Hi! I'm Ben. I'm seven. I like trains.", "7", ["6", "8"], 1, { q: "How old is Ben?" }),
    L(
      "Hi! I'm Ben. I'm seven. I like trains.",
      P("🚂", "trains"),
      [P("🚲", "bikes"), P("🪁", "kites")],
      2,
      { q: "What does Ben like?" },
    ),
    L("Hello! My name is Lily. I'm six. I like cats.", "Lily", ["Lucy", "Kitty"], 2, {
      q: "What is her name?",
    }),
    L(
      "Hi! I'm Nam. I'm in class 1B. I like football.",
      P("⚽", "football"),
      [P("🏀", "basketball"), P("🎸", "guitar")],
      3,
      { q: "What does Nam like?" },
    ),
    L(
      "Hello! I'm Mia. I'm seven years old. I like pink.",
      P("🩷", "pink"),
      [P("🟥", "red"), P("🟪", "purple")],
      4,
      { q: "What colour does Mia like?" },
    ),
    L("Hi, I'm Tom. I'm six. I have a dog.", P("🐕", "dog"), [P("🐈", "cat"), P("🐟", "fish")], 5, {
      q: "What pet does Tom have?",
    }),
  ],
  builds: [
    "My name is Sam.",
    "I am six years old.",
    "I like red kites.",
    "I am in class 1B.",
    "Hello everyone.",
  ],
  sorts: [
    {
      q: "About me or about a friend? Sort them.",
      zones: ["About me", "About a friend"],
      a: ["I am six.", "I like cats."],
      b: ["He is seven.", "She likes dogs."],
      d: 3,
    },
  ],
  reads: [
    "Hello! My name is Sam.",
    "I am six years old.",
    "I am in class 1B.",
    "I like robots.",
    "My favourite colour is blue.",
    "I have a cat.",
    "Hi! I'm Lily. I'm six.",
    "Thank you for listening.",
  ],
  writes: [
    ["Write: I am ___ years old.", "I am six years old."],
    ["Draw something you like. Write: I like ___.", "I like kites."],
    ["Write two sentences about you.", "I am six. I like cats."],
  ],
});

// ─────────────────────────────────────────────────────────── trả lời Yes/No ──────────────────
sentencePack({
  ...base,
  code: "ESL.SPK.ANSWER_YES_NO",
  prefix: "esl-yesno",
  src: `${GS("Language Review + Unit 1–3", "Be, Can, Like")}; CCSS SL.1.1`,
  note: "Trả lời Is it…? / Do you…? / Can you…? / Are you…? bằng câu ngắn đúng. Dữ kiện (con thích gì, biết làm gì) cho trong ngoặc tiếng Việt để chỉ một câu đúng. Ô nhiễu là trợ động từ nhầm (Yes, it is cho câu Do you) — lỗi thường gặp ghi trong bản đồ kỹ năng.",
  items: [
    I("Is it a cat?", "Yes, it is.", ["No, it isn't.", "Yes, I do."], 1, { pic: "🐈" }),
    I("Is it a cat?", "No, it isn't.", ["Yes, it is.", "No, I don't."], 1, { pic: "🐕" }),
    I("Do you like ice cream? (Con thích.)", "Yes, I do.", ["Yes, it is.", "No, I don't."], 2),
    I("Do you like snakes? (Con không thích.)", "No, I don't.", ["No, it isn't.", "Yes, I do."], 2),
    I("Can you swim? (Con biết bơi.)", "Yes, I can.", ["Yes, I do.", "No, I can't."], 3),
    I("Can you fly? (Con không bay được.)", "No, I can't.", ["Yes, I can't.", "No, I don't."], 3),
    I("Is it red?", "Yes, it is.", ["Yes, it's.", "No, it isn't."], 3, { pic: "🍎" }),
    I("Is it red?", "No, it isn't.", ["Yes, it is.", "No, it not."], 4, { pic: "🍌" }),
    I("Have you got a pen? (Con có bút.)", "Yes, I have.", ["Yes, I am.", "No, I haven't."], 4),
    I("Are you six? (Con sáu tuổi.)", "Yes, I am.", ["Yes, I do.", ["Yes, I is.", IS]], 4),
    I(
      "Do you like apples? Which answer is right?",
      "Yes, I do.",
      ["Yes, I like.", "Yes, I am."],
      4,
    ),
    I("Is your bag blue? (Cặp con màu đỏ.)", "No, it isn't.", ["Yes, it is.", "No, I don't."], 5),
    I("Do you have a sister? (Con có em gái.)", "Yes, I do.", ["Yes, I am.", "Yes, it is."], 5),
    I("Is it a bird? Look carefully.", "No, it's a fish.", ["Yes, it is.", "No, it's a bird."], 5, {
      pic: "🐟",
    }),
  ],
  listens: [
    L("Do you have a cat?", "Yes, I do.", ["Yes, it is.", "No, I don't."], 1, {
      q: "Listen. (Con có một con mèo.)",
    }),
    L("Is it a dog?", "Yes, it is.", ["Yes, I do.", "No, it isn't."], 1, {
      q: "Listen. (Tranh là một con chó.)",
    }),
    L("Can you ride a bike?", "Yes, I can.", ["Yes, I do.", "No, I can't."], 2, {
      q: "Listen. (Con biết đi xe đạp.)",
    }),
    L("Do you like carrots?", "No, I don't.", ["No, it isn't.", "Yes, I do."], 2, {
      q: "Listen. (Con không thích cà rốt.)",
    }),
    L("Are you seven?", "No, I'm not.", ["Yes, I am.", "No, I don't."], 3, {
      q: "Listen. (Con sáu tuổi.)",
    }),
    L("Is the sky blue?", "Yes, it is.", ["Yes, I am.", "No, it isn't."], 3, {
      q: "Listen. (Hôm nay trời xanh.)",
    }),
    L("Can a fish walk?", "No, it can't.", ["Yes, it can.", "No, I don't."], 4, {
      q: "Listen, then answer.",
    }),
    L("Is it raining?", "No, it isn't.", ["Yes, it is.", "No, I can't."], 5, {
      q: "Listen. (Trời đang nắng.)",
    }),
  ],
  builds: ["Yes, I can.", "No, I don't.", "Yes, it is.", "No, it isn't."],
  sorts: [
    {
      q: "Yes answers or no answers? Sort them.",
      zones: ["Yes", "No"],
      a: ["Yes, it is.", "Yes, I can."],
      b: ["No, it isn't.", "No, I can't."],
      d: 2,
    },
    {
      q: "Which question do they answer? Sort.",
      zones: ["Do you…?", "Can you…?"],
      a: ["Yes, I do.", "No, I don't."],
      b: ["Yes, I can.", "No, I can't."],
      d: 3,
    },
  ],
  reads: [
    "Is it a cat? Yes, it is.",
    "Do you like milk? No, I don't.",
    "Can you swim? Yes, I can.",
    "Are you six? Yes, I am.",
    "Is it red? No, it isn't.",
  ],
  writes: [
    ["Can you swim? Write your answer.", "Yes, I can."],
    ["Do you like apples? Write your answer.", "Yes, I do."],
  ],
});

// ─────────────────────────────────────────────────────────── trả lời Wh- ─────────────────────
sentencePack({
  ...base,
  code: "ESL.SPK.ANSWER_WH",
  prefix: "esl-whans",
  src: `${GS("Unit 1–2", "How many…? / What…?")}; CCSS SL.1.1`,
  note: "Trả lời What / Where / How many / Who bằng câu ngắn. Ô nhiễu: trả lời yes/no cho câu Wh-, rơi 'a' (It's robot → doc_bo_tu_tieng_anh), thiếu -s (Three cat → thieu_s_so_nhieu, không chấm cuối), nhầm he/she.",
  items: [
    I("What's this?", "It's a robot.", [["It's robot.", DROP], "Yes, it is."], 1, { pic: "🤖" }),
    I("What colour is it?", "It's blue.", ["Yes, it is.", "It's a bag."], 1, { pic: "🟦" }),
    I("What's your name?", "My name is Sam.", ["Yes, I am.", "I'm six."], 1),
    I("How many cats?", "Three cats", [["Three cat", "thieu_s_so_nhieu"], "Yes, cats"], 2, {
      pic: ["🐈", 3],
    }),
    I("How old are you? (Con sáu tuổi.)", "I'm six.", ["I'm fine.", "Yes, I am."], 2),
    I(
      "Where's the ball? (Ở dưới bàn.)",
      "It's under the table.",
      ["It's on the table.", "It's a ball."],
      3,
    ),
    I("Who is she? (Đó là mẹ của con.)", "She is my mom.", ["He is my mom.", "She is six."], 3),
    I("What is it?", "It's an apple.", ["It's a apple.", "It's a banana."], 4, { pic: "🍎" }),
    I(
      "Where's the cat? (Ở trên ghế.)",
      "It's on the chair.",
      ["It's under the chair.", "It's a chair."],
      4,
    ),
    I("How many stars?", "Five stars", [["Five star", "thieu_s_so_nhieu"], "Yellow stars"], 4, {
      pic: ["⭐", 5],
    }),
    I("What can you do? (Con biết bơi.)", "I can swim.", ["Yes, I can.", "I swim can."], 5),
    I("Who is he? (Đó là bố của con.)", "He is my dad.", ["She is my dad.", "Yes, he is."], 5),
  ],
  listens: [
    L("What colour is your bag?", "It's pink.", ["Yes, it is.", "It's a bag."], 1, {
      q: "Listen. (Cặp của con màu hồng.)",
    }),
    L("What's this?", "It's a ball.", ["Yes, it is.", "It's a bag."], 1, {
      q: "Listen. (Tranh là quả bóng.)",
    }),
    L("How many brothers do you have?", "Two brothers.", ["Yes, I do.", "Two sisters."], 2, {
      q: "Listen. (Con có hai anh trai.)",
    }),
    L("Where is your pencil?", "It's in my bag.", ["It's on my bag.", "It's a pencil."], 2, {
      q: "Listen. (Bút chì ở trong cặp.)",
    }),
    L("Who is this?", "This is my grandma.", ["This is my grandpa.", "This is my bag."], 3, {
      q: "Listen. (Đó là bà của con.)",
    }),
    L("What do you like?", "I like ice cream.", ["Yes, I like.", "I'm ice cream."], 3, {
      q: "Listen. (Con thích kem.)",
    }),
    L("How old is your sister?", "She is four.", ["He is four.", "She is my sister."], 4, {
      q: "Listen. (Em gái con bốn tuổi.)",
    }),
    L("Where is the dog?", "It's behind the tree.", ["It's in the tree.", "It's a tree."], 5, {
      q: "Listen. (Con chó ở sau cái cây.)",
    }),
  ],
  builds: [
    "It is under the table.",
    "My name is Sam.",
    "I have two brothers.",
    "She is my mom.",
    "It is a red ball.",
  ],
  sorts: [
    {
      q: "Which question does each answer fit?",
      zones: ["What?", "How many?"],
      a: ["It's a kite.", "It's a robot."],
      b: ["Two kites.", "Five robots."],
      d: 3,
    },
    {
      q: "Where or who? Sort the answers.",
      zones: ["Where?", "Who?"],
      a: ["It's on the desk.", "It's in the box."],
      b: ["She is my mom.", "He is my dad."],
      d: 4,
    },
  ],
  counts: [
    ["cats", "🐈", 3, "How many cats? Tap and count."],
    ["stars", "⭐", 5, "How many stars? Tap each one."],
  ],
  reads: [
    "What colour is it? It's blue.",
    "How many cats? Three cats.",
    "Where's the ball? It's under the table.",
    "Who is he? He is my dad.",
  ],
  writes: [
    ["What colour is your bag? Write the answer.", "It's blue."],
    ["How many pencils do you have? Write it.", "Three pencils."],
  ],
});

// ─────────────────────────────────────────────────────────── tả tranh ────────────────────────
sentencePack({
  ...base,
  code: "ESL.SPK.DESCRIBE_PICTURE",
  prefix: "esl-describe",
  src: GS("Unit 4 Animals Are Awesome tr.48", "nói: thuyết trình bằng tranh"),
  note: "Nhìn tranh, chọn câu tả đúng. Ô nhiễu đổi đúng một chi tiết (màu, to/nhỏ, he/she, số lượng) để chỉ một câu khớp tranh.",
  items: [
    I(
      "Look at the picture. Which sentence is true?",
      "This is a dog.",
      ["This is a cat.", "These are cats."],
      1,
      { pic: "🐕" },
    ),
    I(
      "Which sentence tells about the picture?",
      "It's a red apple.",
      ["It's a green apple.", "It's a red car."],
      1,
      { pic: "🍎" },
    ),
    I("Which sentence is true?", "It's a balloon.", ["It's a ball.", "They are kites."], 2, {
      pic: "🎈",
    }),
    I(
      "Which sentence is true?",
      "There are two cats.",
      ["There is one cat.", "There are three cats."],
      2,
      { pic: ["🐈", 2] },
    ),
    I(
      "Choose the best sentence.",
      "The elephant is big.",
      ["The elephant is small.", "The mouse is big."],
      2,
      { pic: "🐘" },
    ),
    I("Which sentence is true?", "She is a girl.", ["He is a girl.", "She is a dog."], 3, {
      pic: "👧",
    }),
    I("Which sentence is true?", "He is a boy.", ["She is a boy.", "He is a cat."], 3, {
      pic: "👦",
    }),
    I(
      "What is happening? Choose a sentence.",
      "The child is swimming.",
      ["The child is sleeping.", "The child is eating."],
      3,
      { pic: "🏊" },
    ),
    I(
      "Which sentence is true?",
      "There are three flowers.",
      ["There is one flower.", "There are two flowers."],
      4,
      { pic: ["🌸", 3] },
    ),
    I(
      "Choose the best sentence.",
      "The turtle is slow.",
      ["The turtle is fast.", "The rabbit is slow."],
      4,
      { pic: "🐢" },
    ),
    I(
      "Which sentence tells about the picture?",
      "It is raining.",
      ["It is sunny.", "It is snowing."],
      5,
      { pic: "🌧️" },
    ),
    I(
      "Choose the best sentence.",
      "The giraffe is tall.",
      ["The giraffe is short.", "The zebra is tall."],
      5,
      { pic: "🦒" },
    ),
  ],
  listenPrompts: [
    "Listen. Which picture is it?",
    "{ban} describes a picture. Tap it!",
    "Listen and find the picture.",
    "Which picture matches? Tap it.",
    "Listen carefully, then choose.",
    "Listen again and pick the picture.",
  ],
  listens: [
    L("It's a big elephant.", P("🐘", "elephant"), [P("🐭", "mouse"), P("🐕", "dog")], 1),
    L("She is sleeping.", P("😴", "sleeping"), [P("🏃", "running"), P("💃", "dancing")], 2),
    L("The frog is green.", P("🐸", "frog"), [P("🐷", "pig"), P("🐤", "chick")], 2),
    L("It is sunny today.", P("☀️", "sunny"), [P("🌧️", "rainy"), P("❄️", "snowy")], 3),
    L(
      "The boy is reading a book.",
      P("📖", "reading"),
      [P("⚽", "football"), P("🎨", "painting")],
      4,
    ),
    L("It's a small, brown mouse.", P("🐁", "mouse"), [P("🐘", "elephant"), P("🐻", "bear")], 5),
    L("The bird can fly.", P("🐦", "bird"), [P("🐟", "fish"), P("🐢", "turtle")], 3),
  ],
  builds: [
    "This is my dog.",
    "The cat is black.",
    "She is my sister.",
    "It is a big tree.",
    "The girl is happy.",
  ],
  sorts: [
    {
      q: "Big or small? Sort the animals.",
      zones: ["Big", "Small"],
      a: ["elephant", "whale"],
      b: ["ant", "mouse"],
      d: 2,
    },
    {
      q: "He or she? Sort the words.",
      zones: ["He", "She"],
      a: ["boy", "dad"],
      b: ["girl", "mom"],
      d: 3,
    },
  ],
  reads: [
    "This is a dog. It's brown.",
    "The turtle is slow.",
    "The elephant is big.",
    "She is my mom. She's kind.",
    "There are two cats.",
    "The boy is swimming.",
  ],
  writes: [
    ["Draw your family. Write one sentence.", "This is my mom."],
    ["Draw a pet. Write: It is ___.", "It is a cat."],
    ["Look out of the window. Write one sentence.", "I see a tree."],
  ],
});

// ─────────────────────────────────────────────────────────── đặt câu hỏi ─────────────────────
sentencePack({
  ...base,
  code: "ESL.SPK.ASK_QUESTIONS",
  prefix: "esl-ask",
  src: `${GS("Unit 1–2", "How many…? / What…?")}; CCSS SL.1.1c`,
  note: "Tự đặt câu hỏi. Trắc nghiệm: tình huống → chọn câu hỏi; nghe câu trả lời → chọn câu hỏi hợp. Ô nhiễu: câu kể lên giọng, rơi 'is' (What this? → doc_bo_tu_tieng_anh), sai trật tự từ.",
  items: [
    I(
      "You want to know her name. What do you ask?",
      "What's your name?",
      ["How old are you?", "Where is it?"],
      1,
    ),
    I(
      "You want to know his age. What do you ask?",
      "How old are you?",
      ["What's your name?", "What colour is it?"],
      1,
    ),
    I("You don't know what it is. Ask!", "What's this?", ["Who is this?", "How many?"], 2, {
      pic: "🎁",
    }),
    I(
      "You want to know the colour. Ask!",
      "What colour is it?",
      ["What is it?", "Where is it?"],
      2,
      { pic: "🎈" },
    ),
    I(
      "You want to count them. Ask!",
      "How many apples?",
      ["What colour are the apples?", "Where are the apples?"],
      2,
      { pic: ["🍎", 4] },
    ),
    I("Which one is a question?", "Is it a cat?", ["It is a cat.", "It a cat is."], 3),
    I("Which question is right?", "What is this?", ["What this is?", ["What this?", DROP]], 3),
    I("You see a new girl. Ask her name.", "What's your name?", ["How are you?", "Who is he?"], 3),
    I("Ask if it is a dog.", "Is it a dog?", ["It is a dog.", "Is dog it?"], 3),
    I(
      "Which question is right?",
      "Where is my bag?",
      [["Where my bag?", DROP], "My bag is where?"],
      4,
    ),
    I(
      "You can't find your pen. Ask your friend.",
      "Where is my pen?",
      ["What colour is my pen?", "How many pens?"],
      4,
    ),
    I(
      "Ask your friend to play.",
      "Can you play with me?",
      ["You play with me.", "Can you with me play?"],
      4,
    ),
    I(
      "Ask about a friend's pet.",
      "Do you have a pet?",
      ["You have a pet.", "Do you a pet have?"],
      5,
    ),
    I("Which question is right?", "Can you swim?", ["You can swim?", "Can swim you?"], 5),
  ],
  listenPrompts: [
    "Which question goes with this answer?",
    "Listen to the answer. Pick the question.",
    "What was the question? Tap it.",
    "{ban} answers. What did you ask?",
    "Listen, then find the question.",
    "Listen again. Tap the question.",
  ],
  listens: [
    L("It's a robot.", "What's this?", ["How old are you?", "Where is it?"], 1),
    L("I'm six.", "How old are you?", ["What's your name?", "What colour is it?"], 1),
    L("It's under the bed.", "Where is the ball?", ["What is the ball?", "How many balls?"], 2),
    L("Three dogs.", "How many dogs?", ["What colour are the dogs?", "Where are the dogs?"], 2),
    L("It's green.", "What colour is it?", ["What is it?", "How old is it?"], 3),
    L("Yes, I can.", "Can you jump?", ["Do you like jam?", "What can you do?"], 3),
    L("She is my sister.", "Who is she?", ["Where is she?", "How old is she?"], 4),
    L("No, I don't.", "Do you like snakes?", ["Can you fly?", "Is it a snake?"], 5),
  ],
  builds: [
    "What is your name?",
    "How old are you?",
    "Where is my bag?",
    "Can you swim?",
    "What colour is it?",
  ],
  sorts: [
    {
      q: "Question or not a question? Sort them.",
      zones: ["Question", "Not a question"],
      a: ["Is it red?", "Can you jump?"],
      b: ["It is red.", "I can jump."],
      d: 3,
    },
    {
      q: "Find the questions. Sort the cards.",
      zones: ["Question", "Not a question"],
      a: ["Where is Tom?", "How many cats?"],
      b: ["Tom is here.", "Three cats."],
      d: 4,
    },
  ],
  reads: ["What's your name?", "How old are you?", "What colour is it?", "Where is my pen?"],
  writes: [
    ["Write a question to ask your friend.", "What's your name?"],
    ["Draw a toy. Write: What's this?", "What's this?"],
  ],
});

// ─────────────────────────────────────────────────────────── is / are ────────────────────────
sentencePack({
  ...base,
  code: "ESL.GR.IS_ARE",
  prefix: "esl-isare",
  src: GS("Unit 1 Meet My Family tr.10", "Simple Present Be"),
  note: "is với một, are với nhiều. Mọi ô am/is/are sai mang nham_am_is_are. Câu 'They are cat' không có dấu chấm cuối để mã thieu_s_so_nhieu so khớp đúng.",
  items: [
    I(
      "The cat ___ black.",
      "is",
      [
        ["are", IS],
        ["am", IS],
      ],
      1,
      { pic: "🐈" },
    ),
    I(
      "The dogs ___ big.",
      "are",
      [
        ["is", IS],
        ["am", IS],
      ],
      1,
      { pic: ["🐕", 2] },
    ),
    I(
      "It ___ a pen.",
      "is",
      [
        ["are", IS],
        ["am", IS],
      ],
      1,
    ),
    I(
      "They ___ my friends.",
      "are",
      [
        ["is", IS],
        ["am", IS],
      ],
      2,
    ),
    I(
      "These ___ apples.",
      "are",
      [
        ["is", IS],
        ["am", IS],
      ],
      2,
    ),
    I(
      "My mom ___ kind.",
      "is",
      [
        ["are", IS],
        ["am", IS],
      ],
      2,
    ),
    I(
      "Which sentence is right?",
      "They are cats",
      [
        ["They are cat", "thieu_s_so_nhieu"],
        ["They is cats", IS],
      ],
      3,
    ),
    I(
      "Which sentence is right?",
      "The bird is small",
      [["The bird are small", IS], "The birds is small"],
      3,
    ),
    I(
      "Two pens ___ on the desk.",
      "are",
      [
        ["is", IS],
        ["am", IS],
      ],
      3,
    ),
    I(
      "Which sentence is right?",
      "The apples are red",
      [["The apples is red", IS], "The apple are red"],
      4,
    ),
    I(
      "My shoes ___ new.",
      "are",
      [
        ["is", IS],
        ["am", IS],
      ],
      4,
    ),
    I(
      "Grandpa and grandma ___ old.",
      "are",
      [
        ["is", IS],
        ["am", IS],
      ],
      5,
    ),
    I(
      "The baby ___ cute.",
      "is",
      [
        ["are", IS],
        ["am", IS],
      ],
      5,
    ),
  ],
  listens: [
    L("The cat is sleeping.", "one cat", ["two cats"], 1, { q: "One cat or more?" }),
    L("It is a kite.", "is", [["are", IS]], 1, { q: "Which word did you hear: is or are?" }),
    L("The dogs are big.", "more than one dog", ["one dog"], 2, { q: "One dog or more?" }),
    L("They are my pencils.", "are", [["is", IS]], 2, { q: "Which word did you hear: is or are?" }),
    L("These are my shoes.", "many things", ["one thing"], 3, { q: "One thing or many things?" }),
    L("The book is on the desk.", "one thing", ["many things"], 3, {
      q: "One thing or many things?",
    }),
    L("My friends are funny.", "are", [["is", IS]], 4, {
      q: "Which word did you hear: is or are?",
    }),
    L("The elephant is big.", "one elephant", ["many elephants"], 5, {
      q: "One elephant or more?",
    }),
  ],
  builds: [
    "The cat is black.",
    "They are my friends.",
    "It is a pen.",
    "The apples are red.",
    "My mom is kind.",
  ],
  sorts: [
    {
      q: "is or are? Sort them.",
      zones: ["is", "are"],
      a: ["the cat", "my mom"],
      b: ["the cats", "my friends"],
      d: 2,
    },
    {
      q: "Which word goes with each card?",
      zones: ["is", "are"],
      a: ["a pen", "the baby"],
      b: ["two pens", "the babies"],
      d: 3,
    },
    {
      q: "Sort the cards: is or are?",
      zones: ["is", "are"],
      a: ["this book", "my bag"],
      b: ["these books", "my shoes"],
      d: 4,
    },
  ],
  reads: ["The cat is black.", "The dogs are big.", "It is a red pen.", "They are my friends."],
  writes: [
    ["Write: The apples are red.", "The apples are red."],
    ["Draw two cats. Write: They are cats.", "They are cats."],
  ],
});

// ─────────────────────────────────────────────────────────── this / that ─────────────────────
sentencePack({
  ...base,
  code: "ESL.GR.THIS_THAT",
  prefix: "esl-thisthat",
  src: GS("Unit 3 Play With Me tr.36", "This / That / These / Those"),
  note: "Gần/xa và một/nhiều. Emoji không vẽ được khoảng cách, nên câu hỏi ghi dữ kiện trong ngoặc tiếng Việt. Ô sai mang nham_this_that; ô nghe chọn 'gần, một' là chữ Việt nên không mang mã.",
  items: [
    I(
      "___ is my brother. (Bạn đứng sát cạnh con.)",
      "This",
      [
        ["These", TT],
        ["Those", TT],
      ],
      1,
    ),
    I(
      "___ is my pen. (Cây bút trong tay con.)",
      "This",
      [
        ["That", TT],
        ["These", TT],
      ],
      1,
    ),
    I(
      "___ is a kite. (Con diều trên trời, rất xa.)",
      "That",
      [
        ["This", TT],
        ["Those", TT],
      ],
      1,
    ),
    I(
      "___ are my shoes. (Đôi giày con đang cầm.)",
      "These",
      [
        ["This", TT],
        ["Those", TT],
      ],
      2,
    ),
    I(
      "___ are birds. (Những con chim ở xa.)",
      "Those",
      [
        ["That", TT],
        ["These", TT],
      ],
      2,
    ),
    I(
      "Which word is for one thing near you?",
      "this",
      [
        ["these", TT],
        ["those", TT],
      ],
      2,
    ),
    I(
      "Which word is for many things far away?",
      "those",
      [
        ["that", TT],
        ["these", TT],
      ],
      3,
    ),
    I(
      "Which is right? (Nhiều quả táo gần con.)",
      "These are apples.",
      [
        ["This are apples.", TT],
        ["Those are apples.", TT],
      ],
      3,
    ),
    I(
      "Which is right? (Một con mèo ở xa.)",
      "That is a cat.",
      [
        ["Those is a cat.", TT],
        ["This is a cat.", TT],
      ],
      3,
    ),
    I(
      "___ robots are mine. (Những con robot trên bàn con.)",
      "These",
      [
        ["This", TT],
        ["Those", TT],
      ],
      4,
    ),
    I(
      "Look at ___ big plane! (Máy bay trên trời.)",
      "that",
      [
        ["this", TT],
        ["these", TT],
      ],
      4,
    ),
    I(
      "Is ___ your bag? (Cái cặp ở xa, bên cửa.)",
      "that",
      [
        ["this", TT],
        ["those", TT],
      ],
      5,
    ),
    I(
      "Are ___ your crayons? (Hộp bút sáp ngay trước mặt con.)",
      "these",
      [
        ["this", TT],
        ["that", TT],
      ],
      5,
    ),
  ],
  listenPrompts: [
    "Listen. Near or far? One or many?",
    "{ban} says a sentence. Near or far?",
    "Listen, then choose: near or far?",
    "One or many? Near or far? Tap it.",
    "Listen carefully, then choose.",
    "Listen again and choose.",
  ],
  listens: [
    L("This is my book.", "gần, một", ["xa, một", "gần, nhiều"], 1),
    L("That is a tree.", "xa, một", ["gần, một", "xa, nhiều"], 1),
    L("These are my toys.", "gần, nhiều", ["gần, một", "xa, nhiều"], 2),
    L("Those are stars.", "xa, nhiều", ["xa, một", "gần, nhiều"], 2),
    L("Is this your hat?", "gần, một", ["xa, một", "gần, nhiều"], 3),
    L("Look at those clouds.", "xa, nhiều", ["gần, nhiều", "xa, một"], 3),
    L("That dog is big.", "xa, một", ["gần, một", "xa, nhiều"], 4),
    L("These cookies are yummy.", "gần, nhiều", ["xa, nhiều", "gần, một"], 5),
  ],
  builds: [
    "This is my pen.",
    "That is a big tree.",
    "These are my shoes.",
    "Those are birds.",
    "Is that your bag?",
  ],
  sorts: [
    {
      q: "One thing or many things? Sort them.",
      zones: ["One thing", "Many things"],
      a: ["this", "that"],
      b: ["these", "those"],
      d: 2,
    },
    {
      q: "Near or far? Sort the words.",
      zones: ["Near", "Far"],
      a: ["this", "these"],
      b: ["that", "those"],
      d: 3,
    },
    {
      q: "Near or far? Sort the cards.",
      zones: ["Near", "Far"],
      a: ["this book", "these toys"],
      b: ["that star", "those clouds"],
      d: 4,
    },
  ],
  reads: ["This is my pen.", "That is a kite.", "These are my shoes.", "Those are birds."],
  writes: [
    ["Hold a pencil. Write: This is my pencil.", "This is my pencil."],
    ["Look out of the window. Write: That is a ___.", "That is a tree."],
  ],
});

// ─────────────────────────────────────────────────────────── What's this? It's a/an ───────────
sentencePack({
  ...base,
  code: "ESL.GR.WHAT_IS_THIS_IT_IS",
  prefix: "esl-whatthis",
  src: GS("Unit 2 This Is Delicious tr.22", "What …?; a / an theo mô tả kỹ năng"),
  note: "What's this? – It's a/an… Ô nhiễu: rơi mạo từ (It's bag → doc_bo_tu_tieng_anh), a trước nguyên âm (a apple — không có mã a/an trong bộ mã nên để trống). Không đặt 'It's the apple' (cũng đúng ngữ pháp) hay 'It's ice cream' (danh từ không đếm được).",
  items: [
    I("What's this? It's ___ apple.", "an", ["a", "is"], 1, { pic: "🍎" }),
    I("What's this? It's ___ egg.", "an", ["a", "are"], 1, { pic: "🥚" }),
    I("What's this? It's ___ ruler.", "a", ["an", "is"], 1, { pic: "📏" }),
    I("It's ___ orange.", "an", ["a", "am"], 2, { pic: "🍊" }),
    I("What's this? It's ___ elephant.", "an", ["a", "is"], 2, { pic: "🐘" }),
    I("What's this?", "It's a bag.", [["It's bag.", DROP], "It's an bag."], 2, { pic: "🎒" }),
    I("What's this?", "It's an owl.", ["It's a owl.", ["It's owl.", DROP]], 3, { pic: "🦉" }),
    I("What's this?", "It's a fish.", ["It's an fish.", "Yes, it is."], 3, { pic: "🐟" }),
    I("What's this?", "It's an umbrella.", ["It's a umbrella.", ["It's umbrella.", DROP]], 4, {
      pic: "☂️",
    }),
    I("What's this?", "It's a banana.", ["It's an banana.", "They're bananas."], 4, { pic: "🍌" }),
    I("What's this?", "It's an octopus.", ["It's a octopus.", "It's a fish."], 4, { pic: "🐙" }),
    I("Which question asks about a thing?", "What's this?", ["Who's this?", "How old are you?"], 5),
    I("What's this?", "It's an ant.", ["It's a ant.", "It's a pen."], 5, { pic: "🐜" }),
  ],
  listens: [
    L("It's an egg.", P("🥚", "egg"), [P("🍎", "apple"), P("🐘", "elephant")], 1, {
      q: "Listen. Which picture?",
    }),
    L("It's a ruler.", P("📏", "ruler"), [P("✏️", "pencil"), P("📕", "book")], 1, {
      q: "Listen. Which picture?",
    }),
    L("It's an orange.", P("🍊", "orange"), [P("🍋", "lemon"), P("🍎", "apple")], 2, {
      q: "Listen. Which picture?",
    }),
    L("It's an umbrella.", P("☂️", "umbrella"), [P("🧥", "coat"), P("🎩", "hat")], 2, {
      q: "Listen. Which picture?",
    }),
    L("What's this? It's a kite.", P("🪁", "kite"), [P("🚲", "bike"), P("🎈", "balloon")], 3, {
      q: "What is it?",
    }),
    L("an apple", "an", ["a"], 3, { q: "Did you hear a or an?" }),
    L("a banana", "a", ["an"], 4, { q: "Did you hear a or an?" }),
    L("an octopus", "an", ["a"], 5, { q: "Did you hear a or an?" }),
  ],
  builds: [
    "What is this?",
    "It is an apple.",
    "It is a red pen.",
    "What is that?",
    "It is an egg.",
  ],
  sorts: [
    {
      q: "a or an? Sort the words.",
      zones: ["a", "an"],
      a: ["pen", "bag"],
      b: ["apple", "egg"],
      d: 2,
    },
    {
      q: "Which words take an? Sort them.",
      zones: ["a", "an"],
      a: ["dog", "ruler"],
      b: ["owl", "orange"],
      d: 3,
    },
    {
      q: "Put each word with a or an.",
      zones: ["a", "an"],
      a: ["banana", "kite"],
      b: ["umbrella", "elephant"],
      d: 4,
    },
  ],
  reads: [
    "What's this? It's a pen.",
    "What's this? It's an apple.",
    "It's an elephant.",
    "It's a big red ball.",
  ],
  writes: [
    ["Draw an apple. Write: It's an apple.", "It's an apple."],
    ["Write a or an: ___ egg, ___ bag.", "an egg, a bag"],
  ],
});

// ─────────────────────────────────────────────────────────── can / can't ─────────────────────
sentencePack({
  ...base,
  code: "ESL.GR.CAN_CANT",
  prefix: "esl-can",
  src: GS("Unit 3 Play With Me tr.36", "Modal Can"),
  note: "can / can't chỉ khả năng. Tranh con vật chọn loại mà câu đúng không cãi được (cá không đi, voi không bay; không dùng 'chim biết bơi' vì vịt cũng là chim). Ô nhiễu: I can to swim, He cans, Yes, I can't.",
  items: [
    I("Which sentence is true?", "It can fly.", ["It can't fly.", "It can read."], 1, {
      pic: "🐦",
    }),
    I("Which sentence is true?", "It can swim.", ["It can fly.", "It can run."], 1, { pic: "🐟" }),
    I("Which sentence is true?", "It can't walk.", ["It can walk.", "It can't swim."], 2, {
      pic: "🐟",
    }),
    I("Which sentence is true?", "It can't fly.", ["It can fly.", "It can't walk."], 2, {
      pic: "🐢",
    }),
    I("Which sentence is right?", "I can swim.", ["I can to swim.", "I cans swim."], 2),
    I("Which sentence is right?", "He can dance.", ["He cans dance.", "He can dances."], 3),
    I("Can you jump? (Con nhảy được.)", "Yes, I can.", ["Yes, I can't.", "Yes, I do."], 3),
    I("Can you fly? (Con không bay được.)", "No, I can't.", ["No, I can.", "Yes, I can't."], 3),
    I("Monkeys ___ climb.", "can", ["can't", "cans"], 4, { pic: "🐒" }),
    I("Elephants ___ fly.", "can't", ["can", "cans"], 4, { pic: "🐘" }),
    I("Penguins ___ swim, but they ___ fly.", "can / can't", ["can't / can", "can / can"], 5, {
      pic: "🐧",
    }),
    I("A kangaroo ___ jump.", "can", ["can't", "cans"], 5, { pic: "🦘" }),
  ],
  listens: [
    L("I can swim.", "Tớ biết bơi.", ["Tớ không biết bơi.", "Tớ biết bay."], 1, {
      q: "Listen. What does it mean?",
    }),
    L("I can't fly.", "Tớ không bay được.", ["Tớ bay được.", "Tớ không bơi được."], 1, {
      q: "Listen. What does it mean?",
    }),
    L(
      "She can dance.",
      "Bạn ấy biết nhảy múa.",
      ["Bạn ấy không biết nhảy múa.", "Bạn ấy biết hát."],
      2,
      { q: "Listen. What does it mean?" },
    ),
    L(
      "He can't ride a bike.",
      "Bạn ấy không biết đi xe đạp.",
      ["Bạn ấy biết đi xe đạp.", "Bạn ấy không biết bơi."],
      2,
      { q: "Listen. What does it mean?" },
    ),
    L(
      "Can you sing?",
      "Con có biết hát không?",
      ["Con có thích hát không?", "Con hát được mấy bài?"],
      3,
      { q: "What does the question ask?" },
    ),
    L("Birds can fly, but fish can't.", P("🐟", "fish"), [P("🐦", "bird"), P("🐝", "bee")], 4, {
      q: "Who can't fly?",
    }),
    L("My dog can run fast.", "chạy nhanh", ["bơi", "bay"], 4, { q: "What can the dog do?" }),
    L("I can climb, but I can't swim.", "bơi", ["leo trèo", "chạy"], 5, {
      q: "What can't the child do?",
    }),
  ],
  builds: ["I can swim.", "She can't fly.", "Can you jump?", "Yes, I can.", "Birds can fly."],
  sorts: [
    {
      q: "Can it fly? Sort them.",
      zones: ["Can fly", "Can't fly"],
      a: ["bird", "bee"],
      b: ["dog", "fish"],
      d: 2,
    },
    {
      q: "Can it climb a tree? Sort them.",
      zones: ["Can climb", "Can't climb"],
      a: ["monkey", "cat"],
      b: ["fish", "elephant"],
      d: 3,
    },
    {
      q: "Can it jump? Sort them.",
      zones: ["Can jump", "Can't jump"],
      a: ["frog", "kangaroo"],
      b: ["snail", "turtle"],
      d: 4,
    },
  ],
  reads: [
    "I can swim.",
    "I can't fly.",
    "Can you jump? Yes, I can.",
    "A bird can fly.",
    "A fish can't walk.",
  ],
  writes: [
    ["Write one thing you can do.", "I can jump."],
    ["Write one thing you can't do.", "I can't fly."],
  ],
});

// ─────────────────────────────────────────────────────────── hiện tại tiếp diễn ──────────────
sentencePack({
  ...base,
  code: "ESL.GR.PRESENT_PROGRESSIVE",
  prefix: "esl-preprog",
  src: GS("Unit 4 Animals Are Awesome tr.48", "Present Progressive; viết: chính tả -ing"),
  note: "be + V-ing. Ô nhiễu đúng ba lỗi của bản đồ kỹ năng: quên to be (The frog jumping → doc_bo_tu_tieng_anh), quên -ing (is jump), viết sai -ing (swiming, runing → sai_chinh_ta_tu); am/is/are nhầm → nham_am_is_are.",
  items: [
    I(
      "The tiger ___ sleeping.",
      "is",
      [
        ["are", IS],
        ["am", IS],
      ],
      1,
      { pic: "🐅" },
    ),
    I(
      "Which sentence is right?",
      "The frog is jumping.",
      [["The frog jumping.", DROP], "The frog is jump."],
      2,
      { pic: "🐸" },
    ),
    I("The parrot is ___. (ăn)", "eating", [["eatting", "sai_chinh_ta_tu"], "eat"], 2),
    I(
      "The zebras ___ eating grass.",
      "are",
      [
        ["is", IS],
        ["am", IS],
      ],
      2,
    ),
    I(
      "The hippo is ___ in the river. (bơi)",
      "swimming",
      [["swiming", "sai_chinh_ta_tu"], "swim"],
      3,
    ),
    I("The children are ___. (chạy)", "running", [["runing", "sai_chinh_ta_tu"], "run"], 3),
    I(
      "What is the elephant doing? (uống nước)",
      "It is drinking.",
      [["It drinking.", DROP], "It is drink."],
      3,
    ),
    I(
      "Is the frog jumping? (Có, nó đang nhảy.)",
      "Yes, it is.",
      ["Yes, it does.", "No, it isn't."],
      4,
    ),
    I(
      "Is the giraffe sleeping? (Không, nó đang ăn.)",
      "No, it isn't.",
      ["Yes, it is.", "No, it doesn't."],
      4,
    ),
    I(
      "Which sentence is right?",
      "The penguins are swimming.",
      [["The penguins is swimming.", IS], "The penguins are swim."],
      4,
    ),
    I(
      "The crocodile is ___ in the water. (trốn)",
      "hiding",
      [["hideing", "sai_chinh_ta_tu"], "hide"],
      5,
    ),
    I(
      "What are the monkeys doing? (leo cây)",
      "They are climbing.",
      [
        ["They climbing.", DROP],
        ["They is climbing.", IS],
      ],
      5,
    ),
  ],
  listenPrompts: [
    "Listen. What is happening? Tap it.",
    "{ban} says a sentence. Tap the picture!",
    "Listen and find the action.",
    "Which picture matches? Tap it.",
    "Listen carefully, then choose.",
    "Listen again and pick one.",
  ],
  listens: [
    L("She is swimming.", P("🏊", "swimming"), [P("🏃", "running"), P("😴", "sleeping")], 1),
    L("He is sleeping.", P("😴", "sleeping"), [P("🏊", "swimming"), P("💃", "dancing")], 1),
    L("They are dancing.", P("💃", "dancing"), [P("🧗", "climbing"), P("🎤", "singing")], 2),
    L("The boy is reading.", P("📖", "reading"), [P("✍️", "writing"), P("🎨", "painting")], 2),
    L("The girl is singing.", P("🎤", "singing"), [P("💃", "dancing"), P("📖", "reading")], 3),
    L("The man is climbing.", P("🧗", "climbing"), [P("🚶", "walking"), P("🏊", "swimming")], 3),
    L("What is the tiger doing? It is eating.", "ăn", ["ngủ", "chạy"], 4, {
      q: "What is the tiger doing?",
    }),
    L("Is the hippo swimming? No, it is sleeping.", "ngủ", ["bơi", "ăn"], 5, {
      q: "What is the hippo doing?",
    }),
  ],
  builds: [
    "The tiger is sleeping.",
    "The frogs are jumping.",
    "What is the hippo doing?",
    "Is the zebra eating?",
    "The parrot is flying.",
  ],
  sorts: [
    {
      q: "One animal or many? Sort the sentences.",
      zones: ["One animal", "Many animals"],
      a: ["The tiger is sleeping.", "The frog is jumping."],
      b: ["The zebras are eating.", "The birds are flying."],
      d: 3,
    },
    {
      q: "Double the last letter, or just add -ing?",
      zones: ["Double it", "Just add -ing"],
      a: ["running", "swimming"],
      b: ["eating", "jumping"],
      d: 5,
      hint: "run → running, eat → eating.",
    },
  ],
  reads: [
    "The tiger is sleeping.",
    "The frog is jumping.",
    "The elephants are drinking.",
    "What is the hippo doing?",
    "The parrot is flying.",
  ],
  writes: [
    ["Draw an animal. Write what it is doing.", "The cat is sleeping."],
    ["Write: The frog is jumping.", "The frog is jumping."],
    ["Add -ing: run, swim, eat.", "running, swimming, eating"],
  ],
});
