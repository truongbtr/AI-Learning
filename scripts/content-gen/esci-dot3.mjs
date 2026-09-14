/**
 * Đợt 3, lô F1 — English Science: 7 kỹ năng tuần 2–12 còn trống (âm thanh, ánh sáng–tín hiệu,
 * đẩy–kéo, nam châm, nóng–lạnh, đặt câu hỏi khoa học).
 *
 * Trường chưa đưa sách English Science, nên nguồn là chuẩn NGSS ghi trong bản đồ kỹ năng — ghi thẳng
 * vào `sourceRef`, không giả vờ bám sách. Khoa học lớp 1 không có mã lỗi trong bộ mã (validator chỉ
 * cảnh báo), nên lỗi thường gặp của từng kỹ năng nằm ở **ô nhiễu** chứ không ở mã: loud ↔ high,
 * "nam châm hút mọi kim loại", "áo len tạo ra nhiệt", "vật tự chuyển động".
 *
 * Một đáp án: câu nào có thể hiểu hai cách với trẻ 6 tuổi thì bỏ (không hỏi "turn the TV down" vì
 * "lower" cũng đúng theo nghĩa âm lượng; không dùng chìa khoá vì chìa thường bằng đồng).
 *
 *   node scripts/content-gen/esci-dot3.mjs
 */
import { sentencePack } from "./lib-en.mjs";

const base = { dir: "esci", subject: "ESCI" };
const P = (e, w) => ({ e, w });
const w = (list) => list.map((x) => (Array.isArray(x) ? x : [x]));
const I = (q, right, wrongs, d, extra = {}) => ({
  q,
  right,
  wrongs: w(wrongs),
  d,
  hint: extra.hint ?? "Think about what you see and hear every day.",
  ...extra,
});
const L = (say, right, wrongs, d, extra = {}) => ({ say, right, wrongs: w(wrongs), d, ...extra });
const NGSS = (std, topic) => `NGSS ${std} (${topic}) — chưa có sách English Science của trường`;

// ─────────────────────────────────────────────────────────── âm thanh do rung động ───────────
sentencePack({
  ...base,
  code: "ESCI.PS.SOUND_VIBRATION",
  prefix: "esci-vibrate",
  src: NGSS("1-PS4-1", "sound and vibration"),
  note: "Vật rung tạo ra âm; hết rung thì hết âm. Ô nhiễu nhắm hai lỗi: 'chỉ loa mới phát ra âm' và không nối rung động với âm (chọn 'nó sáng lên', 'nó tan ra').",
  items: [
    I("You hit a drum. What does the drum skin do?", "It shakes.", ["It melts.", "It glows."], 1, {
      pic: "🥁",
    }),
    I(
      "Which one is vibrating to make a sound?",
      P("🔔", "ringing bell"),
      [P("🪨", "rock"), P("📕", "closed book")],
      1,
    ),
    I("Sounds come from things that…", "vibrate (shake fast)", ["sleep", "melt"], 2),
    I(
      "Touch your throat and hum. What do you feel?",
      "a buzzing shake",
      ["cold water", "nothing at all"],
      2,
    ),
    I(
      "You pluck a guitar string. What happens?",
      "It shakes and makes a sound.",
      ["It stays still.", "It gets longer."],
      2,
      { pic: "🎸" },
    ),
    I("Which word means 'shake fast'?", "vibrate", ["vanish", "valley"], 2),
    I(
      "You stop the shaking. What happens to the sound?",
      "The sound stops.",
      ["It gets louder.", "It turns into light."],
      3,
    ),
    I(
      "You hold a ringing bell tight. What happens?",
      "The ringing stops.",
      ["It rings louder.", "It flies away."],
      3,
    ),
    I(
      "You pluck a rubber band. What do you see?",
      "It shakes fast.",
      ["It changes colour.", "It disappears."],
      3,
    ),
    I(
      "Rice on a drum jumps when you hit it. Why?",
      "The drum is shaking.",
      ["The rice is alive.", "The rice is hot."],
      4,
    ),
    I(
      "Which sentence is true?",
      "Many things make sound when they shake.",
      ["Only speakers make sound.", "Sound comes from light."],
      4,
    ),
    I(
      "Why does the bell ring?",
      "It shakes when you hit it.",
      ["It is shiny.", "It is round."],
      4,
      { pic: "🔔" },
    ),
    I(
      "A bee buzzes. What makes the buzz?",
      "Its wings shake fast.",
      ["Its eyes are big.", "It is yellow."],
      5,
      { pic: "🐝" },
    ),
    I("Put your hand on a speaker playing music. You feel…", "shaking", ["cold", "wet"], 5),
    I(
      "You talk. What shakes inside your throat?",
      "your voice box",
      ["your teeth", "your hair"],
      5,
    ),
  ],
  listens: [
    L("drum", P("🥁", "drum"), [P("🎸", "guitar"), P("🔔", "bell")], 1),
    L("bell", P("🔔", "bell"), [P("🥁", "drum"), P("🎺", "trumpet")], 1),
    L("guitar", P("🎸", "guitar"), [P("🎻", "violin"), P("🥁", "drum")], 2),
    L("trumpet", P("🎺", "trumpet"), [P("🎸", "guitar"), P("🔔", "bell")], 2),
    L(
      "Hum and touch your throat.",
      "Ngân nga và chạm vào cổ",
      ["Hát to và vỗ tay", "Chạm vào tai"],
      2,
      { q: "Listen. What should you do?" },
    ),
    L("violin", P("🎻", "violin"), [P("🎺", "trumpet"), P("🥁", "drum")], 3),
    L(
      "When the string stops shaking, the sound stops.",
      "The string stops shaking.",
      ["The string gets longer.", "The room gets dark."],
      4,
      { q: "What makes the sound stop?" },
    ),
    L(
      "Put rice on a drum. Hit it. The rice jumps.",
      "The drum shakes.",
      ["The rice is hungry.", "The drum is cold."],
      5,
      { q: "Why does the rice jump?" },
    ),
  ],
  sorts: [
    {
      q: "Does it make a sound when you play it?",
      zones: ["Makes music", "Silent"],
      a: ["drum", "bell"],
      b: ["pillow", "sock"],
      d: 2,
    },
    {
      q: "Shaking or still? Sort them.",
      zones: ["Shaking", "Still"],
      a: ["a ringing bell", "a buzzing bee"],
      b: ["a sleeping cat", "a closed book"],
      d: 3,
    },
    {
      q: "Pluck it or hit it? Sort the instruments.",
      zones: ["Pluck it", "Hit it"],
      a: ["guitar", "harp"],
      b: ["drum", "xylophone"],
      d: 4,
    },
  ],
  reads: [
    "Sound comes from vibration.",
    "The drum skin shakes.",
    "I hum and feel my throat.",
    "When the shaking stops, the sound stops.",
    "Vibrate means shake fast.",
    "A guitar string shakes to make music.",
  ],
  writes: [
    ["Draw a drum. Write: vibrate.", "a drum, vibrate", ["Vẽ cái trống", "Viết đúng từ vibrate"]],
    [
      "Hum and touch your throat. Draw what you feel.",
      "a buzzing throat",
      ["Vẽ cổ họng có vạch rung", "Có ghi chú ngắn"],
    ],
    ["Draw two things that make sound.", "bell, drum", ["Vẽ đủ hai vật", "Hai vật đều phát ra âm"]],
  ],
});

// ─────────────────────────────────────────────────────────── to–nhỏ, cao–trầm ────────────────
sentencePack({
  ...base,
  code: "ESCI.PS.LOUD_SOFT_HIGH_LOW",
  prefix: "esci-loudhigh",
  src: NGSS("1-PS4-1", "loud / soft, high / low"),
  note: "Độ to (loud/soft) khác độ cao (high/low). Ô nhiễu đặt 'high' cạnh 'loud', 'low' cạnh 'soft' — đúng lỗi nhầm của bản đồ kỹ năng. Giọng đọc máy không đổi được độ cao, nên bài nghe hỏi bằng từ và câu, không phát tiếng cao/thấp.",
  items: [
    I("A lion roars. Is it loud or soft?", "loud", ["soft", "high"], 1, { pic: "🦁" }),
    I("You whisper to a friend. Loud or soft?", "soft", ["loud"], 1, { pic: "🤫" }),
    I(
      "Which one is loud?",
      P("🚒", "fire truck siren"),
      [P("🐱", "sleeping kitten"), P("🍃", "falling leaf")],
      1,
    ),
    I("A mouse squeaks. Is it high or low?", "high", ["low"], 2, { pic: "🐭" }),
    I("A bear growls. Is it high or low?", "low", ["high"], 2, { pic: "🐻" }),
    I(
      "Which one is soft (quiet)?",
      P("🍃", "falling leaf"),
      [P("🥁", "big drum"), P("🚒", "fire truck")],
      2,
    ),
    I("You blow a trumpet hard. The sound is…", "loud", ["soft"], 2, { pic: "🎺" }),
    I(
      "Which one makes a high sound?",
      P("🐦", "little bird"),
      [P("🐻", "bear"), P("🐄", "cow")],
      3,
    ),
    I(
      "Which one makes a low sound?",
      P("🐄", "cow"),
      [P("🐦", "little bird"), P("🐭", "mouse")],
      3,
    ),
    I("Loud means…", "a big sound", ["a high sound", "a quiet sound"], 3),
    I(
      "Which is the softest?",
      P("🐜", "ant walking"),
      [P("🐕", "dog barking"), P("⛈️", "thunder")],
      3,
    ),
    I(
      "A short string and a long string. Which sounds higher?",
      "the short string",
      ["the long string", "they are the same"],
      4,
    ),
    I("You hit a drum harder. The sound gets…", "louder", ["higher", "softer"], 4),
    I("You cover your ears. Sounds seem…", "softer", ["higher", "louder"], 4),
    I(
      "A big bell and a tiny bell. Which sounds lower?",
      "the big bell",
      ["the tiny bell", "they are the same"],
      5,
    ),
    I("Which word tells how loud a sound is?", "soft", ["high", "low"], 5),
  ],
  listenPrompts: [
    "Listen. What does it mean?",
    "{ban} says a word. Tap its meaning.",
    "Listen, then choose.",
    "What did you hear? Tap it.",
    "Listen carefully, then choose.",
    "Listen again and pick one.",
  ],
  listens: [
    L("loud", "to", ["nhỏ", "cao"], 1),
    L("soft", "nhỏ, khẽ", ["to", "trầm"], 1),
    L("high", "cao, thanh", ["trầm", "to"], 2),
    L("low", "trầm", ["cao", "nhỏ"], 2),
    L("The mouse makes a high squeak.", P("🐭", "mouse"), [P("🐻", "bear"), P("🦁", "lion")], 3, {
      q: "Which animal is it?",
    }),
    L("The lion roars very loudly.", P("🦁", "lion"), [P("🐭", "mouse"), P("🐟", "fish")], 3, {
      q: "Which animal is it?",
    }),
    L("Shh! Please use a soft voice.", "nói khẽ", ["nói to", "hét lên"], 4, {
      q: "How should you talk?",
    }),
    L("Big drums make low sounds.", "low", ["high"], 5, { q: "What sound does a big drum make?" }),
  ],
  sorts: [
    {
      q: "Loud or soft? Sort the sounds.",
      zones: ["Loud", "Soft"],
      a: ["thunder", "a siren"],
      b: ["a whisper", "a ticking clock"],
      d: 2,
    },
    {
      q: "High or low? Sort the sounds.",
      zones: ["High", "Low"],
      a: ["bird song", "a whistle"],
      b: ["a cow's moo", "a big drum"],
      d: 3,
    },
    {
      q: "Sort the sounds: loud or soft?",
      zones: ["Loud", "Soft"],
      a: ["a lion's roar", "fireworks"],
      b: ["a cat's purr", "a leaf falling"],
      d: 4,
    },
  ],
  reads: [
    "The lion is loud.",
    "A whisper is soft.",
    "A bird sings a high song.",
    "A cow makes a low moo.",
    "Loud is not the same as high.",
    "A big drum makes a low sound.",
  ],
  writes: [
    [
      "Draw something loud and something soft.",
      "thunder, a whisper",
      ["Vẽ đủ hai vật", "Một vật to, một vật nhỏ", "Có ghi loud / soft"],
    ],
    [
      "Draw an animal with a high sound.",
      "a bird",
      ["Vẽ con vật kêu cao (chim, chuột…)", "Có ghi tên con vật"],
    ],
  ],
});

// ─────────────────────────────────────────────────────────── tín hiệu ánh sáng, âm thanh ──────
sentencePack({
  ...base,
  code: "ESCI.PS.COMMUNICATE_LIGHT_SOUND",
  prefix: "esci-signal",
  src: NGSS("1-PS4-4", "communicating with light and sound"),
  note: "Dùng ánh sáng và âm thanh để báo tin từ xa. Ô nhiễu là cách không dùng ánh sáng hay âm (thì thầm, trốn im lặng), đúng lỗi 'chọn cách không truyền được tín hiệu'.",
  items: [
    I("The light is red. What does it tell cars?", "Stop.", ["Go.", "Sing."], 1, { pic: "🚦" }),
    I("What does a green traffic light tell you?", "Go.", ["Stop.", "Sleep."], 1, { pic: "🚦" }),
    I(
      "A ship at night wants to send a message. It can…",
      "flash a light",
      ["stay dark and quiet", "paint the boat"],
      2,
    ),
    I(
      "Why does a fire truck use a loud siren?",
      "To tell cars to move away.",
      ["To play music.", "To wake up the fish."],
      2,
      { pic: "🚒" },
    ),
    I(
      "Which one sends a signal with light?",
      P("🔦", "flashlight"),
      [P("🥁", "drum"), P("🔔", "bell")],
      2,
    ),
    I(
      "Which one sends a signal with sound?",
      P("🔔", "bell"),
      [P("🔦", "flashlight"), P("🚦", "traffic light")],
      2,
    ),
    I("A signal is…", "a way to send a message", ["a kind of food", "a big animal"], 3),
    I(
      "A car horn beeps at you. What does it say?",
      "Watch out!",
      ["Good night!", "I am hungry!"],
      3,
    ),
    I(
      "An ambulance needs to get past. It uses…",
      "a siren",
      ["a quiet voice", "a small sticker"],
      3,
    ),
    I("Why do bikes have a bell?", "To warn people.", ["To go faster.", "To carry food."], 3),
    I(
      "You are lost in the woods at night. Best signal?",
      "Blow a whistle and shine a flashlight.",
      ["Whisper very softly.", "Hide and stay quiet."],
      4,
    ),
    I(
      "Your friend is far away and can't hear you. You can…",
      "wave a bright flag",
      ["whisper", "close your eyes"],
      4,
    ),
    I("Which one is NOT a signal?", "a sleeping cat", ["a traffic light", "a fire alarm"], 4),
    I("Which signal works in the dark?", "a flashing light", ["a thumbs-up", "a smile"], 5),
    I("Which signal works when you cannot see?", "a loud whistle", ["a waving flag", "a smile"], 5),
  ],
  listens: [
    L("flashlight", P("🔦", "flashlight"), [P("🚦", "traffic light"), P("🔔", "bell")], 1),
    L("bell", P("🔔", "bell"), [P("🔦", "flashlight"), P("🚦", "traffic light")], 1),
    L("siren", P("🚨", "siren"), [P("🔦", "flashlight"), P("📕", "book")], 2),
    L("traffic light", P("🚦", "traffic light"), [P("🚨", "siren"), P("🔦", "flashlight")], 2),
    L("Red means stop. Green means go.", "Go", ["Stop", "Wait"], 3, { q: "What does green mean?" }),
    L(
      "The fire truck turns on its siren and its lights.",
      "sound and light",
      ["only sound", "only light"],
      4,
      { q: "What does the fire truck use?" },
    ),
    L("Flash the light three times if you need help.", "3", ["1", "2"], 4, {
      q: "How many flashes mean help?",
    }),
    L(
      "At night, the ship flashes a light to say hello.",
      P("🔦", "light"),
      [P("🥁", "drum"), P("📕", "book")],
      5,
      { q: "How does the ship say hello?" },
    ),
  ],
  sorts: [
    {
      q: "Light signal or sound signal? Sort them.",
      zones: ["Light signal", "Sound signal"],
      a: ["traffic light", "flashlight"],
      b: ["bell", "car horn"],
      d: 2,
    },
    {
      q: "Sort the signals: light or sound?",
      zones: ["Light signal", "Sound signal"],
      a: ["flashing lights", "lighthouse"],
      b: ["siren", "whistle"],
      d: 3,
    },
    {
      q: "Do we see it or hear it?",
      zones: ["We see it", "We hear it"],
      a: ["a waving flag", "a flashing light"],
      b: ["clapping", "a drum beat"],
      d: 4,
    },
  ],
  reads: [
    "A signal sends a message.",
    "A red light means stop.",
    "The siren is loud.",
    "Flash the light to say hello.",
    "We can use light and sound.",
    "Green light means go.",
  ],
  writes: [
    [
      "Draw a traffic light. Colour red, yellow, green.",
      "traffic light",
      ["Vẽ đèn giao thông", "Tô đúng thứ tự đỏ, vàng, xanh"],
    ],
    [
      "Draw one light signal and one sound signal.",
      "flashlight, bell",
      ["Một tín hiệu ánh sáng", "Một tín hiệu âm thanh"],
    ],
    [
      "Make a signal with a friend. Draw it.",
      "two claps = come here",
      ["Vẽ tín hiệu", "Ghi tín hiệu đó nghĩa là gì"],
    ],
  ],
});

// ─────────────────────────────────────────────────────────── đẩy và kéo ──────────────────────
sentencePack({
  ...base,
  code: "ESCI.PS.PUSH_PULL",
  prefix: "esci-pushpull",
  src: NGSS("K-PS2-1", "pushes and pulls"),
  note: "Đẩy làm vật đi ra xa, kéo làm vật lại gần; đẩy mạnh đi xa hơn. Ô nhiễu nhắm hai lỗi: nhầm push/pull và 'vật tự chuyển động'. Việc chọn có một cách làm duy nhất (mở ngăn kéo = kéo, đá bóng = đẩy).",
  items: [
    I("Opening a drawer is a…", "pull", ["push"], 1),
    I("Kicking a ball is a…", "push", ["pull"], 1),
    I("You move a shopping cart from behind. Push or pull?", "push", ["pull"], 2, { pic: "🛒" }),
    I("You fly a kite on a string. You…", "pull the string", ["push the string"], 2, { pic: "🪁" }),
    I("Closing a door away from you is a…", "push", ["pull"], 2),
    I("You open a door toward you. Push or pull?", "pull", ["push"], 2, { pic: "🚪" }),
    I(
      "Which one needs a pull?",
      P("🎣", "reeling in a fishing rod"),
      [P("⚽", "kicking a ball"), P("🛒", "pushing a cart")],
      2,
    ),
    I("The dog runs ahead on its leash. It…", "pulls you", ["pushes you"], 3, { pic: "🐕" }),
    I(
      "A ball rolls toward you. How can you stop it?",
      "push against it",
      ["look at it", "sing to it"],
      3,
    ),
    I("A toy car will not move by itself. It needs…", "a push or a pull", ["a nap", "a colour"], 3),
    I(
      "Which one needs a push?",
      P("🛒", "moving a shopping cart"),
      [P("🪁", "flying a kite"), P("🎣", "reeling in a fish")],
      3,
    ),
    I("You push a swing gently, then hard. Hard makes it go…", "higher", ["lower", "the same"], 4),
    I("Which push makes a ball roll farther?", "a strong push", ["a tiny push", "no push"], 4),
    I("Pulling a wagon makes it move…", "toward you", ["away from you"], 4),
    I(
      "Nobody touches the box. Will it move?",
      "No, it needs a push or a pull.",
      ["Yes, it moves by itself."],
      4,
    ),
    I(
      "You push a rolling ball from the side. It…",
      "changes direction",
      ["turns into a cube", "gets bigger"],
      5,
    ),
  ],
  listens: [
    L("push", "đẩy", ["kéo"], 1),
    L("pull", "kéo", ["đẩy"], 1),
    L("Pull the rope.", "Kéo sợi dây", ["Đẩy sợi dây", "Cắt sợi dây"], 2, {
      q: "Listen. What do you do?",
    }),
    L("Push the swing.", "Đẩy cái xích đu", ["Kéo cái xích đu", "Ngồi lên xích đu"], 2, {
      q: "Listen. What do you do?",
    }),
    L("Kick the ball hard.", "push", ["pull"], 3, { q: "Listen. Is it a push or a pull?" }),
    L("Open the drawer.", "pull", ["push"], 3, { q: "Listen. Is it a push or a pull?" }),
    L("A strong push makes the car go far.", "a strong push", ["a soft push", "no push"], 4, {
      q: "What makes the car go far?",
    }),
    L("Pull the wagon toward you.", "toward you", ["away from you"], 5, {
      q: "Where does the wagon go?",
    }),
  ],
  sorts: [
    {
      q: "Push or pull? Sort them.",
      zones: ["Push", "Pull"],
      a: ["kick a ball", "close a drawer"],
      b: ["open a drawer", "fly a kite"],
      d: 2,
    },
    {
      q: "Sort the actions: push or pull?",
      zones: ["Push", "Pull"],
      a: ["press a button", "throw a ball"],
      b: ["pick an apple", "tug a rope"],
      d: 3,
    },
    {
      q: "Is it a push or a pull? Sort.",
      zones: ["Push", "Pull"],
      a: ["shut a door", "shove a box"],
      b: ["open a fridge", "zip up a coat"],
      d: 4,
    },
  ],
  places: [
    {
      q: "Push moves away. Pull comes closer. Sort the pictures.",
      items: [
        ["kick", "⚽"],
        ["kite string", "🪁"],
        ["shopping cart", "🛒"],
        ["fishing rod", "🎣"],
      ],
      zones: [["Push"], ["Pull"]],
      key: { 0: [0, 2], 1: [1, 3] },
      d: 3,
      hint: "Does it go away from you or come to you?",
      why: "Kicking and moving a cart are pushes; a kite string and a fishing rod are pulls.",
    },
  ],
  reads: [
    "Push the swing.",
    "Pull the rope.",
    "A push moves things away.",
    "A pull moves things closer.",
    "A strong push makes it go far.",
  ],
  writes: [
    [
      "Draw one push and one pull at home.",
      "push a door, pull a drawer",
      ["Vẽ một việc đẩy", "Vẽ một việc kéo", "Có ghi push / pull"],
    ],
    ["Write: push, pull.", "push, pull", ["Viết đúng hai từ", "Chữ rõ ràng"]],
  ],
});

// ─────────────────────────────────────────────────────────── nam châm ────────────────────────
sentencePack({
  ...base,
  code: "ESCI.PS.MAGNETS",
  prefix: "esci-magnet",
  src: "Chuẩn quốc tế INTL.FORCES (Cambridge Primary Science stage 1–2: magnets) — chưa có sách English Science của trường",
  note: "Nam châm hút sắt, thép; không hút nhựa, gỗ, giấy, nhôm. Ô nhiễu nhắm hai lỗi: 'hút mọi kim loại' và 'hút giấy'. Không dùng chìa khoá hay đồng xu làm ví dụ bị hút — thường làm bằng đồng/nhôm, câu sẽ có hai cách hiểu.",
  items: [
    I("What is this?", "a magnet", ["a spoon", "a hook"], 1, { pic: "🧲" }),
    I(
      "Which one does a magnet pull?",
      P("📎", "paper clip"),
      [P("📄", "paper"), P("🧸", "teddy bear")],
      1,
    ),
    I(
      "Which one does a magnet pull?",
      P("🔩", "steel bolt"),
      [P("🪵", "wood"), P("🧽", "sponge")],
      1,
    ),
    I(
      "Which one will NOT stick to a magnet?",
      P("🪵", "wooden block"),
      [P("📎", "paper clip"), P("🔩", "steel bolt")],
      2,
    ),
    I("A magnet pulls things made of…", "iron", ["paper", "plastic"], 2),
    I("Does a magnet pull a plastic spoon?", "No", ["Yes"], 2),
    I("Does a magnet pull a paper cup?", "No", ["Yes"], 3),
    I("Which job can a magnet do?", "pick up pins", ["pick up rice", "pick up water"], 3),
    I(
      "Which one sticks to a magnet?",
      P("🥫", "steel food can"),
      [P("🥤", "paper cup"), P("🧃", "juice box")],
      3,
    ),
    I("Do magnets pull ALL metals?", "No, only some metals.", ["Yes, every metal."], 4),
    I(
      "Where is a bar magnet strongest?",
      "at its ends",
      ["in the middle", "the same everywhere"],
      4,
    ),
    I("A fridge magnet sticks to the fridge door. The door is…", "metal", ["wood", "glass"], 4),
    I(
      "You drop pins in sand. What helps pick them up?",
      "a magnet",
      ["a sponge", "a spoon of water"],
      4,
    ),
    I("A ball of kitchen foil. Will a magnet pull it?", "No", ["Yes"], 5, {
      why: "Kitchen foil is aluminium. Magnets do not pull aluminium.",
    }),
    I("A magnet can pull a paper clip through…", "a sheet of paper", ["a brick wall"], 5),
    I("Which word means 'hút' for magnets?", "attract", ["melt", "float"], 5),
  ],
  listens: [
    L("magnet", P("🧲", "magnet"), [P("📎", "paper clip"), P("🪵", "wood")], 1),
    L("paper clip", P("📎", "paper clip"), [P("🧲", "magnet"), P("📄", "paper")], 1),
    L(
      "The magnet picks up the paper clip.",
      P("📎", "paper clip"),
      [P("📄", "paper"), P("🖍️", "crayon")],
      2,
      { q: "What does the magnet pick up?" },
    ),
    L("bolt", P("🔩", "bolt"), [P("🪵", "wood"), P("🧽", "sponge")], 2),
    L("Magnets do not pull wood.", "wood", ["iron", "steel"], 3, {
      q: "What does a magnet NOT pull?",
    }),
    L("Some metals stick to a magnet, but not all.", "No", ["Yes"], 4, {
      q: "Do all metals stick to a magnet?",
    }),
    L("The spoon did not stick to the magnet.", "No", ["Yes"], 4, { q: "Did the spoon stick?" }),
    L(
      "Hold the magnet near the pins. They jump to it.",
      "They move to the magnet.",
      ["They melt.", "They fly away."],
      5,
      { q: "What happens to the pins?" },
    ),
  ],
  sorts: [
    {
      q: "Does a magnet pull it? Sort.",
      zones: ["Magnet pulls it", "Magnet does not"],
      a: ["paper clip", "steel spoon"],
      b: ["plastic cup", "eraser"],
      d: 2,
    },
    {
      q: "Sort: magnetic or not magnetic?",
      zones: ["Magnet pulls it", "Magnet does not"],
      a: ["iron nail", "safety pin"],
      b: ["wooden stick", "paper"],
      d: 3,
    },
    {
      q: "Which ones will stick? Sort them.",
      zones: ["Magnet pulls it", "Magnet does not"],
      a: ["steel can", "fridge door"],
      b: ["glass jar", "rubber ball"],
      d: 4,
    },
  ],
  places: [
    {
      q: "Drag the things a magnet picks up onto the magnet.",
      items: [
        ["paper clip", "📎"],
        ["crayon", "🖍️"],
        ["steel bolt", "🔩"],
        ["leaf", "🍃"],
      ],
      zones: [["magnet", "🧲"]],
      key: { 0: [0, 2] },
      d: 3,
      hint: "Magnets pull iron and steel.",
      why: "The paper clip and the steel bolt stick. The crayon and the leaf do not.",
    },
  ],
  reads: [
    "A magnet pulls iron.",
    "The paper clip sticks.",
    "Wood does not stick.",
    "Not all metals stick.",
    "Magnets attract steel.",
  ],
  writes: [
    [
      "Test three things at home with a magnet. Draw them.",
      "clip yes, spoon yes, cup no",
      ["Vẽ đủ ba vật", "Ghi hút / không hút cho từng vật"],
    ],
    [
      "Draw a magnet picking up paper clips.",
      "magnet and clips",
      ["Vẽ nam châm", "Kẹp giấy dính vào nam châm"],
    ],
  ],
});

// ─────────────────────────────────────────────────────────── nóng – lạnh ─────────────────────
sentencePack({
  ...base,
  code: "ESCI.PS.HOT_COLD_TEMPERATURE",
  prefix: "esci-hotcold",
  src: "Chuẩn quốc tế INTL.MATERIALS (hot and cold, thermometers) — chưa có sách English Science của trường",
  note: "Nóng – lạnh, nhiệt kế, đá tan. Ô nhiễu nhắm hai lỗi của bản đồ kỹ năng: 'cột nhiệt kế cao là lạnh' và 'áo len tạo ra nhiệt' (áo giữ hơi ấm của cơ thể).",
  items: [
    I("Which is colder?", P("🧊", "ice"), [P("🍲", "hot soup"), P("☕", "hot tea")], 1),
    I("Which is hotter?", P("🔥", "fire"), [P("🧊", "ice"), P("⛄", "snowman")], 1),
    I(
      "What does a thermometer measure?",
      "how hot or cold it is",
      ["how long it is", "how heavy it is"],
      2,
    ),
    I("What is this?", "a thermometer", ["a ruler", "a pencil"], 2, { pic: "🌡️" }),
    I(
      "You leave ice in the sun. What happens?",
      "It melts.",
      ["It gets bigger.", "It turns into a stone."],
      2,
    ),
    I("Which one feels warm?", P("☀️", "sunshine"), [P("🧊", "ice cube"), P("❄️", "snowflake")], 2),
    I("Which drink is cold?", "iced water", ["hot cocoa", "hot tea"], 2),
    I("The red line in a thermometer goes up. It is getting…", "hotter", ["colder"], 3),
    I("The red line goes down. It is getting…", "colder", ["hotter"], 3),
    I(
      "Which place is the coldest?",
      P("🏔️", "snowy mountain"),
      [P("🏖️", "beach"), P("🏜️", "desert")],
      3,
    ),
    I("Water in the freezer turns into…", "ice", ["steam", "juice"], 3),
    I(
      "What is the safest way to try hot soup?",
      "Let it cool, then taste a little.",
      ["Drink it fast.", "Put your hand in it."],
      4,
    ),
    I("On a hot day, the thermometer line is…", "high", ["low"], 4),
    I("A cup of hot tea sits for an hour. It gets…", "cooler", ["hotter"], 4),
    I(
      "Why do we wear a sweater in winter?",
      "It keeps our body warmth in.",
      ["It makes heat like a heater.", "It makes us colder."],
      5,
      { why: "A sweater does not make heat. It keeps the warmth of your body close to you." },
    ),
    I("Chocolate in a hot hand will…", "melt", ["freeze", "grow"], 5),
  ],
  listens: [
    L("hot", "nóng", ["lạnh", "ướt"], 1),
    L("cold", "lạnh", ["nóng", "khô"], 1),
    L("thermometer", P("🌡️", "thermometer"), [P("📏", "ruler"), P("⏰", "clock")], 2),
    L("ice", P("🧊", "ice"), [P("🔥", "fire"), P("💧", "water")], 2),
    L("The snow melts in the warm sun.", "It melts.", ["It grows.", "It gets colder."], 3, {
      q: "What happens to the snow?",
    }),
    L("The thermometer goes up on a hot day.", "up", ["down"], 4, {
      q: "Where does the line go on a hot day?",
    }),
    L(
      "Put the ice cream in the freezer, or it will melt.",
      "vào ngăn đá",
      ["ra nắng", "vào lò nướng"],
      4,
      { q: "Where should the ice cream go?" },
    ),
    L("A sweater keeps you warm, but it does not make heat.", "No", ["Yes"], 5, {
      q: "Does a sweater make heat?",
    }),
  ],
  sorts: [
    {
      q: "Hot or cold? Sort them.",
      zones: ["Hot", "Cold"],
      a: ["fire", "hot soup"],
      b: ["ice", "snow"],
      d: 1,
    },
    {
      q: "Sort the things: hot or cold?",
      zones: ["Hot", "Cold"],
      a: ["the sun", "an oven"],
      b: ["a freezer", "ice cream"],
      d: 3,
    },
    {
      q: "Which ones are hot? Sort them.",
      zones: ["Hot", "Cold"],
      a: ["hot cocoa", "a campfire"],
      b: ["an icicle", "a snowball"],
      d: 4,
    },
  ],
  reads: [
    "Ice is cold.",
    "Fire is hot.",
    "A thermometer tells how hot it is.",
    "Ice melts in the sun.",
    "The red line goes up when it is hot.",
    "A sweater keeps my body warm.",
  ],
  writes: [
    [
      "Draw something hot and something cold.",
      "fire, ice",
      ["Vẽ đủ hai vật", "Một vật nóng, một vật lạnh", "Có ghi hot / cold"],
    ],
    [
      "Draw a thermometer on a hot day.",
      "a thermometer with a high line",
      ["Vẽ nhiệt kế", "Vạch đỏ lên cao"],
    ],
  ],
});

// ─────────────────────────────────────────────────────────── đặt câu hỏi khoa học ────────────
sentencePack({
  ...base,
  code: "ESCI.INQ.ASK_QUESTIONS",
  prefix: "esci-askq",
  src: NGSS("SEP.1", "asking questions"),
  note: "Chọn câu hỏi thử được và đúng chủ đề ('Which ball bounces higher?'). Ô nhiễu nhắm hai lỗi của bản đồ kỹ năng: câu hỏi không thử được (ý thích: 'Is red the best colour?') và câu hỏi ngoài chủ đề.",
  items: [
    I("Which one is a question?", "Why is the sky blue?", ["The sky is blue.", "Blue sky."], 1),
    I("Which is a question word?", "why", ["blue", "run"], 1),
    I(
      "Which is a question about plants?",
      "Why do plants need water?",
      ["What is your name?", "Can I have a cookie?"],
      1,
      { pic: "🌱" },
    ),
    I(
      "Which question can we test with balls?",
      "Which ball bounces higher?",
      ["Is my ball happy?", "Do you like balls?"],
      2,
      { pic: "⚽" },
    ),
    I(
      "Which is a science question?",
      "What happens if we put ice in the sun?",
      ["Do you like pink?", "Where is my bag?"],
      2,
    ),
    I(
      "We are learning about magnets. Which question fits?",
      "What things stick to a magnet?",
      ["What is for lunch?", "Who is the tallest?"],
      2,
    ),
    I(
      "You find a feather. Which question is about it?",
      "Is it light or heavy?",
      ["Where is my lunch?", "Can I watch TV?"],
      2,
    ),
    I(
      "You see a snail. Which question helps you learn?",
      "What does a snail eat?",
      ["Is the snail sad?", "Snail."],
      3,
    ),
    I(
      "Which question starts with 'what happens if'?",
      "What happens if we mix red and blue paint?",
      ["Red and blue are colours.", "I like painting."],
      3,
    ),
    I(
      "We want to test sinking. Which question?",
      "Does a coin sink or float?",
      ["Is a coin pretty?", "How old is the coin?"],
      3,
    ),
    I(
      "Which question can you answer by testing?",
      "Does a toy car go faster down a steep ramp?",
      ["Is red the best colour?", "Are dogs nicer than cats?"],
      4,
    ),
    I(
      "Which question uses 'which… more'?",
      "Which cup holds more water?",
      ["Is this a cup?", "Do you like cups?"],
      4,
    ),
    I(
      "A good science question is one we can…",
      "find out by looking or testing",
      ["only guess", "never answer"],
      5,
    ),
    I(
      "Which question is NOT about light?",
      "What do cats eat?",
      ["Why is it dark at night?", "Can light go through glass?"],
      5,
    ),
  ],
  listenPrompts: [
    "Listen. Is it a science question?",
    "{ban} asks a question. Can we test it?",
    "Listen to the question, then choose.",
    "Is this a science question? Tap it.",
    "Listen carefully, then choose.",
    "Listen again and choose.",
  ],
  listens: [
    L("Which ball rolls farther?", "science question", ["not a science question"], 1),
    L("Do you like my shoes?", "not a science question", ["science question"], 1),
    L(
      "What happens if we put a plant in the dark?",
      "science question",
      ["not a science question"],
      2,
    ),
    L("What is your favourite food?", "not a science question", ["science question"], 2),
    L("Why does ice melt?", "science question", ["not a science question"], 3),
    L("Can I play now?", "not a science question", ["science question"], 3),
    L("Which paper towel soaks up more water?", "science question", ["not a science question"], 4),
    L("Is purple prettier than green?", "not a science question", ["science question"], 5),
  ],
  builds: [
    "Why do plants need water?",
    "Which ball bounces higher?",
    "What do snails eat?",
    "Does a coin sink?",
  ],
  sorts: [
    {
      q: "Question or not a question? Sort.",
      zones: ["Question", "Not a question"],
      a: ["Why is the sea salty?", "How do birds fly?"],
      b: ["Birds can fly.", "The sea is big."],
      d: 1,
    },
    {
      q: "Science question or not? Sort them.",
      zones: ["Science question", "Not science"],
      a: ["Why do leaves fall?", "What do fish eat?"],
      b: ["Can I go out?", "Where is my pen?"],
      d: 2,
    },
    {
      q: "Can we test it? Sort the questions.",
      zones: ["We can test it", "We can't test it"],
      a: ["Which ball bounces higher?", "Does salt melt ice faster?"],
      b: ["Is blue the best colour?", "Is my teddy happy?"],
      d: 3,
    },
  ],
  reads: [
    "I wonder why the sky is blue.",
    "What happens if we add water?",
    "Which ball bounces higher?",
    "Scientists ask questions.",
  ],
  writes: [
    [
      "Look at a plant. Write one question about it.",
      "Why are leaves green?",
      ["Viết đúng một câu hỏi", "Câu hỏi về cái cây", "Có dấu hỏi cuối câu"],
    ],
    [
      "Draw something you wonder about. Write your question.",
      "Why does the moon change?",
      ["Có tranh", "Có một câu hỏi có dấu ?"],
    ],
  ],
});
