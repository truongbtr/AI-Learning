/**
 * Năm gói dấu thanh — dấu huyền, sắc, hỏi, nặng, ngã (SGK Tiếng Việt 1 tập một, bài 2–9).
 *
 * Lớp 1B3 đang ở bài 13, nên mọi tiếng in ra cho con đọc chỉ dùng chữ và dấu tới **bài 9**:
 * a b c d đ e ê o ô ơ và đủ năm dấu. Không có tiếng nào bịa — mỗi tiếng nhiễu cũng là tiếng thật
 * (lỗi số 9 của đợt 1: nhiễu "trè", "trỉ" không có nghĩa).
 *
 *   node scripts/content-gen/viet-tones.mjs
 */
import { cap, choicesOf, ex, img, listenPrompt, numberId, writePack } from "./lib.mjs";

const SRC = "SGK Tiếng Việt 1 tập một, bài 2–9 (dấu thanh)";

/** Câu lệnh — sáu biến thể mỗi dạng, để con không gặp một câu mười hai lần một tối. */
const ASK = (t) => [
  `Tiếng nào có ${t}?`,
  `Chọn tiếng mang ${t} nhé!`,
  `Ô nào là tiếng có ${t}?`,
  `Đố con: tiếng nào có ${t}?`,
  `Tìm giúp {ban} tiếng có ${t}.`,
  `Tiếng nào được đánh ${t}?`,
];
const ASK_PIC = [
  "Tranh vẽ gì? Chọn đúng tiếng nhé!",
  "Chọn tiếng gọi tên bức tranh.",
  "Đố con: tranh này là tiếng nào?",
  "Tiếng nào đúng với bức tranh?",
  "Nhìn tranh rồi chọn tiếng đúng.",
  "Bức tranh này đọc là tiếng nào?",
];
const ASK_HARD = (t) => [
  `Trong bốn ô, ô nào mang ${t}?`,
  `Bốn tiếng giống nhau, tiếng nào có ${t}?`,
  `Nhìn kỹ phía trên con chữ: tiếng nào có ${t}?`,
  `Chỉ một ô có ${t}. Ô nào nhỉ?`,
  `Đọc thầm bốn tiếng rồi chọn tiếng có ${t}.`,
  `Tiếng nào đội ${t} trên đầu?`,
];
const LISTEN = [
  "Nghe rồi chọn ô đúng nhé!",
  "{ban} đọc một tiếng, con chọn ô đúng.",
  "Nghe kỹ rồi chỉ vào tiếng con vừa nghe.",
  "Con nghe rồi tìm đúng tiếng nhé!",
  "Lắng nghe, tiếng nào vừa vang lên?",
  "Nghe một lần nữa rồi chọn ô con nghe thấy.",
];
const SORT = (t) => [
  `Xếp mỗi tiếng vào đúng giỏ: có ${t} hay không có.`,
  `Kéo tiếng có ${t} sang giỏ bên trái nhé!`,
  `Chia bốn tiếng thành hai giỏ giúp {ban}.`,
  `Giỏ nào đựng tiếng có ${t}? Kéo vào nhé!`,
  `Phân loại bốn tiếng theo ${t}.`,
  `Tiếng nào có ${t} thì xếp riêng ra.`,
];
const PICK_DRAG = [
  "Kéo tiếng đúng vào ô dưới tranh.",
  "Chọn thẻ đúng rồi thả vào ô trống.",
  "Thẻ nào gọi tên bức tranh? Kéo vào nhé!",
  "Kéo giúp {ban} thẻ đúng vào ô.",
  "Đặt thẻ đúng xuống dưới tranh.",
  "Tìm thẻ hợp với tranh rồi thả vào ô.",
];
const READ = [
  "Con đọc to các tiếng này nhé!",
  "Đọc chậm từng tiếng cho {ban} nghe.",
  "Đọc to câu này nhé!",
  "Con đọc cho cả nhà cùng nghe.",
  "Đọc rõ từng tiếng nhé!",
  "Cùng đọc to nào!",
];
const WRITE = [
  "Viết vào vở:",
  "Con chép vào vở:",
  "Viết lại giúp {ban}:",
  "Chép vào vở nhé:",
  "Viết vào vở rồi chụp cho ba mẹ xem:",
  "Con viết các tiếng này vào vở:",
];

const HINT = (t, shape) => [
  [`${cap(t)} là ${shape}.`, "Nhìn phía trên con chữ xem có nét nào không."],
  ["Đọc thầm từng tiếng, nghe giọng lên hay xuống.", `Tiếng có ${t} nghe khác hẳn tiếng trơn.`],
  ["Tìm nét nhỏ nằm trên con chữ nhé!", `${cap(t)} là ${shape}.`],
  ["So hai ô với nhau xem khác nhau chỗ nào.", "Khác nhau ở cái nét nhỏ phía trên đấy."],
  [`Con nhớ ${t} trông thế nào không? Là ${shape}.`],
  ["Đọc to từng ô lên là nhận ra ngay."],
];
const HINT_LISTEN = (t) => [
  ["Nghe lại một lần nữa, chú ý giọng lên hay xuống."],
  ["Ba ô viết giống nhau, chỉ khác cái nét trên đầu.", `Giọng nào nghe giống ${t} nhất?`],
  ["Nhắm mắt nghe rồi hãy chọn nhé!"],
  ["Đọc thầm từng ô rồi so với tiếng con vừa nghe."],
  ["Nghe kỹ phần cuối của tiếng."],
];
const HINT_SORT = (t) => [
  [`Nhìn phía trên con chữ: có nét thì là ${t}.`],
  ["Đọc to từng thẻ rồi mới xếp nhé!"],
  ["Xếp hai thẻ dễ trước, còn lại xếp sau."],
  ["Thẻ nào trơn, không có nét gì ở trên?"],
];
const HINT_READ = [
  ["Đọc chậm từng tiếng một."],
  ["Đọc thầm một lần rồi mới đọc to."],
  ["Nhớ hạ giọng hoặc lên giọng theo dấu nhé!"],
  ["Ngắt rõ giữa các tiếng."],
];
const HINT_WRITE = [
  ["Viết con chữ trước, đánh dấu thanh sau."],
  ["Dấu thanh đặt trên con chữ nguyên âm."],
  ["Viết chậm, cho chữ đứng thẳng hàng."],
  ["Nhìn mẫu rồi viết theo nhé!"],
];

/**
 * Một gói dấu thanh.
 *
 * `families[i]` = { word, bare, others, pic } — cùng một con chữ, chỉ khác dấu, nên phương án
 * nhiễu luôn là "cùng chữ khác dấu" (sai_dau_thanh) hoặc "quên đánh dấu" (thieu_dau_thanh):
 * đúng hai lỗi thật của trẻ 6 tuổi, không gắn thẻ theo thói quen.
 */
function tonePack(cfg) {
  const { code, prefix, tone, shape, lessonRefs, note, families, phrases, writeSets } = cfg;
  const list = [];
  let n = 0;
  const add = (e) => {
    n += 1;
    list.push(ex({ id: numberId(prefix, n), language: "vi", skillCodes: [code], ...e }));
  };
  const meta = (d) => ({ estSeconds: d, lessonUnitCode: null, sourceRef: SRC });

  const withBare = families.filter((f) => f.bare);
  const withPic = families.filter((f) => f.pic);
  const rich = families.filter((f) => f.others.length >= 3);

  // ① "Tiếng nào có dấu X?" — ba ô cùng con chữ. Ô trơn = quên dấu, ô khác dấu = nhầm dấu.
  withBare.slice(0, 9).forEach((f, i) => {
    const { choices, answerKey } = choicesOf(
      { text: f.word },
      [
        { text: f.bare, errorTag: "thieu_dau_thanh" },
        { text: f.others[0], errorTag: "sai_dau_thanh" },
      ],
      i,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 3),
      targetsError: i % 2 === 0 ? "thieu_dau_thanh" : "sai_dau_thanh",
      // `withBare` guarantees both an untoned and a differently-toned option here.
      scaffold: i < 4 ? "model" : "none",
      prompt: { text: ASK(tone)[i % 6] },
      choices,
      answerKey,
      hints: HINT(tone, shape)[i % 6],
      explanation: `Tiếng "${f.word}" có ${tone} nên đọc là "${f.word}".`,
      meta: meta(20),
    });
  });

  // ② Nhìn tranh chọn tiếng — con phải biết tranh vẽ gì rồi mới chọn được dấu.
  withPic.forEach((f, i) => {
    const wrongs = [f.bare, ...f.others].filter(Boolean).slice(0, 2);
    const { choices, answerKey } = choicesOf(
      { text: f.word },
      wrongs.map((w) => ({
        text: w,
        errorTag: w === f.bare ? "thieu_dau_thanh" : "sai_dau_thanh",
      })),
      i + 1,
    );
    add({
      type: "MCQ",
      difficulty: 2 + (i % 3),
      assetTheme: f.theme ?? "neutral",
      targetsError: "sai_dau_thanh",
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: ASK_PIC[i % 6], image: img(f.pic, f.gloss, null, 1) },
      choices,
      answerKey,
      hints: [`Tranh vẽ ${f.gloss}.`, `Tiếng gọi ${f.gloss} có ${tone}.`],
      explanation: `${cap(f.gloss)} đọc là "${f.word}".`,
      meta: meta(25),
    });
  });

  // ③ Bốn ô cùng chữ, bốn dấu khác nhau — mức khó nhất của kỹ năng này.
  rich.slice(0, 4).forEach((f, i) => {
    const { choices, answerKey } = choicesOf(
      { text: f.word },
      f.others.slice(0, 3).map((w) => ({ text: w, errorTag: "sai_dau_thanh" })),
      i + 2,
    );
    add({
      type: "MCQ",
      difficulty: i < 2 ? 4 : 5,
      targetsError: "sai_dau_thanh",
      prompt: { text: ASK_HARD(tone)[i % 6] },
      choices,
      answerKey,
      hints: HINT(tone, shape)[(i + 3) % 6],
      explanation: `Chỉ "${f.word}" đội ${tone} trên đầu.`,
      meta: meta(30),
    });
  });

  // ④ Nghe tiếng có dấu, chọn ô — chữ viết giống hệt nhau, chỉ tai mới phân biệt được.
  families.slice(0, 8).forEach((f, i) => {
    const wrongs = [f.bare, ...f.others].filter(Boolean).slice(0, 2);
    const { choices, answerKey } = choicesOf(
      { text: f.word },
      wrongs.map((w) => ({
        text: w,
        errorTag: w === f.bare ? "thieu_dau_thanh" : "sai_dau_thanh",
      })),
      i,
    );
    // Only claim to drill the mistake an option can actually record (docs/04 §11.2): a family
    // with no bare form has no "forgot the mark" option to tap.
    const tags = choices.filter((c) => c.errorTag).map((c) => c.errorTag);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 1 + (i % 5),
      targetsError: tags.includes(i % 2 === 0 ? "sai_dau_thanh" : "thieu_dau_thanh")
        ? i % 2 === 0
          ? "sai_dau_thanh"
          : "thieu_dau_thanh"
        : (tags[0] ?? null),
      scaffold: i < 2 ? "model" : "none",
      prompt: { text: listenPrompt(LISTEN, f.word, i) },
      listenTarget: { text: f.word },
      choices,
      answerKey,
      hints: HINT_LISTEN(tone)[i % 5],
      explanation: `Con vừa nghe tiếng "${f.word}".`,
      meta: meta(20),
    });
  });

  // ⑤ Nghe tiếng *trơn*, chọn ô trơn — để con không quen tay cứ chọn ô có dấu.
  withBare.slice(0, 4).forEach((f, i) => {
    const { choices, answerKey } = choicesOf(
      { text: f.bare },
      [{ text: f.word, errorTag: "sai_dau_thanh" }, { text: f.others[0] }].filter((c) => c.text),
      i + 1,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 3 + (i % 3),
      targetsError: "sai_dau_thanh",
      prompt: { text: listenPrompt(LISTEN, f.bare, i + 3) },
      listenTarget: { text: f.bare },
      choices,
      answerKey,
      hints: HINT_LISTEN(tone)[(i + 2) % 5],
      explanation: `Tiếng con nghe là "${f.bare}", không mang dấu nào.`,
      meta: meta(20),
    });
  });

  // ⑥ Xếp bốn thẻ vào hai giỏ. Thẻ trơn kéo nhầm = quên dấu; thẻ khác dấu = nhầm dấu.
  for (let i = 0; i < 4; i++) {
    const a = withBare[i % withBare.length];
    const b = withBare[(i + 3) % withBare.length];
    const cards = [
      { id: `t${i}a`, text: a.word },
      { id: `t${i}b`, text: a.bare, errorTag: "thieu_dau_thanh" },
      { id: `t${i}c`, text: b.word },
      { id: `t${i}d`, text: b.others[0], errorTag: "sai_dau_thanh" },
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 3),
      targetsError: "thieu_dau_thanh",
      prompt: { text: SORT(tone)[i % 6] },
      dragItems: cards,
      dropZones: [
        { id: "co", label: `Có ${tone}`, accepts: cards.map((c) => c.id) },
        { id: "khong", label: `Không có ${tone}`, accepts: cards.map((c) => c.id) },
      ],
      answerKey: { co: [cards[0].id, cards[2].id], khong: [cards[1].id, cards[3].id] },
      hints: HINT_SORT(tone)[i % 4],
      explanation: `"${a.word}" và "${b.word}" có ${tone}.`,
      meta: meta(40),
    });
  }

  // ⑦ Kéo thẻ đúng vào ô dưới tranh — một ô, nên thẻ đúng không mang thẻ lỗi (ADR-15).
  withPic.slice(0, 3).forEach((f, i) => {
    const decoys = [f.bare, ...f.others].filter(Boolean).slice(0, 2);
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 3),
      assetTheme: f.theme ?? "neutral",
      targetsError: "thieu_dau_thanh",
      prompt: { text: PICK_DRAG[i % 6], image: img(f.pic, f.gloss, null, 1) },
      dragItems: [
        { id: "dung", text: f.word },
        ...decoys.map((w, k) => ({
          id: `sai${k}`,
          text: w,
          errorTag: w === f.bare ? "thieu_dau_thanh" : "sai_dau_thanh",
        })),
      ],
      dropZones: [{ id: "o", label: "Ô trống", accepts: ["dung", "sai0", "sai1"] }],
      answerKey: { o: ["dung"] },
      hints: [`Tranh vẽ ${f.gloss}.`, "Đọc to từng thẻ rồi hãy kéo nhé!"],
      explanation: `${cap(f.gloss)} viết là "${f.word}".`,
      meta: meta(35),
    });
  });

  // ⑧ Đọc to — câu ngắn thật, chữ nào cũng nằm trong phạm vi bài 9.
  phrases.forEach((p, i) => {
    const words = p.split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: i < 2 ? 2 : 3 + (i % 3),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: p, words },
      answerKey: { words },
      hints: HINT_READ[i % 4],
      explanation: `Câu này đọc là "${p}".`,
      meta: meta(25),
    });
  });

  // ⑨ Viết vào vở — ba mẹ chụp, hàng chờ AI chấm (docs/13 §3b).
  writeSets.forEach((set, i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 3 + (i % 3),
      prompt: { text: `${WRITE[i % 6]} ${set.join(", ")}.` },
      rubric: {
        criteria: [
          `Viết đủ ${set.join(" ").split(" ").length} tiếng`,
          `${cap(tone)} đặt đúng trên con chữ`,
          "Chữ viết đúng độ cao, đúng nét",
        ],
        sampleAnswers: [set.join(" ")],
      },
      answerKey: null,
      hints: HINT_WRITE[i % 4],
      explanation: `${cap(tone)} đánh trên con chữ nguyên âm.`,
      meta: meta(70),
    });
  });

  writePack(`content/exercises/viet/${code.split(".").slice(1).join(".")}.pack.json`, {
    skillCode: code,
    subject: "VIET",
    generatedBy: "claude-code",
    promptVersion: "exercise-gen-v2",
    lessonRefs,
    note,
    exercises: list,
  });
}

const F = (word, bare, others, pic, gloss, theme) => ({ word, bare, others, pic, gloss, theme });

tonePack({
  code: "VIET.HV.DAU_HUYEN",
  prefix: "viet-huyen",
  tone: "dấu huyền",
  shape: "một nét xiên từ trên xuống, nghiêng sang trái",
  lessonRefs: ["KNTT-TV1-T1-B02", "KNTT-TV1-T1-B09"],
  note: "Dấu huyền học ở bài 2 và được luyện lại tới bài 9 (đủ sáu dấu). Tiếng in ra chỉ dùng chữ a b c d đ e ê o ô ơ.",
  families: [
    F("bà", "ba", ["bá", "bả", "bã"], "👵", "bà", "garden"),
    F("cà", "ca", ["cá", "cả"], "🍆", "quả cà", "garden"),
    F("bò", null, ["bó", "bỏ", "bọ"], "🐄", "con bò", "garden"),
    F("cò", "co", ["có", "cỏ", "cọ"], "🐦", "con cò", "garden"),
    F("đò", "đo", ["đó", "đỏ", "đọ"], "🛶", "con đò", "robot"),
    F("cờ", "cơ", ["cớ", "cỡ"], "🚩", "lá cờ", "robot"),
    F("bờ", "bơ", ["bở", "bỡ", "bợ"], null, null),
    F("bè", null, ["bé", "bẻ", "bẹ"], null, null),
    F("bề", "bê", ["bế", "bể", "bệ"], null, null),
    F("đà", "đa", ["đá", "đã", "đả"], null, null),
    F("đề", "đê", ["đế", "để", "đệ"], null, null),
    F("đồ", "đô", ["đố", "đổ", "đỗ"], null, null),
    F("bồ", "bô", ["bố", "bổ", "bộ"], null, null),
    F("cồ", "cô", ["cố", "cổ", "cỗ"], null, null),
    F("ồ", "ô", ["ố", "ổ"], null, null),
    F("ờ", "ơ", ["ớ", "ở"], null, null),
  ],
  phrases: ["bà bế bé", "bà có cà", "cò có cá", "bò ở bờ cỏ", "bà đò có bé"],
  writeSets: [
    ["bà", "cà", "cò"],
    ["đò", "bờ", "bè"],
    ["bò", "cờ", "đà"],
  ],
});

tonePack({
  code: "VIET.HV.DAU_SAC",
  prefix: "viet-sac",
  tone: "dấu sắc",
  shape: "một nét xiên từ dưới lên, nghiêng sang phải",
  lessonRefs: ["KNTT-TV1-T1-B03", "KNTT-TV1-T1-B09"],
  note: "Dấu sắc học ở bài 3, luyện lại tới bài 9. Mọi tiếng nhiễu đều là tiếng thật cùng con chữ.",
  families: [
    F("cá", "ca", ["cà", "cả", "cạ"], "🐟", "con cá", "garden"),
    F("bó", null, ["bò", "bỏ", "bọ"], "💐", "bó hoa", "garden"),
    F("đá", "đa", ["đà", "đã", "đả"], "🪨", "hòn đá", "robot"),
    F("bé", null, ["bè", "bẻ", "bẹ"], "👶", "em bé", "garden"),
    F("dế", "dê", ["dề", "dễ", "dệ"], "🦗", "con dế", "garden"),
    F("bố", "bô", ["bồ", "bổ", "bộ"], "👨", "bố", "robot"),
    F("có", "co", ["cò", "cỏ", "cọ"], null, null),
    F("đó", "đo", ["đò", "đỏ", "đọ"], null, null),
    F("cố", "cô", ["cồ", "cổ", "cỗ"], null, null),
    F("đố", "đô", ["đồ", "đổ", "đỗ"], null, null),
    F("bá", "ba", ["bà", "bả", "bã"], null, null),
    F("bế", "bê", ["bề", "bể", "bệ"], null, null),
    F("đế", "đê", ["đề", "để", "đệ"], null, null),
    F("cớ", "cơ", ["cờ", "cỡ"], null, null),
    F("ố", "ô", ["ồ", "ổ"], null, null),
    F("ớ", "ơ", ["ờ", "ở"], null, null),
  ],
  phrases: ["bố có cá", "bé bó cỏ", "cá ở bể", "bố đố bé", "dê có cỏ"],
  writeSets: [
    ["cá", "bó", "đá"],
    ["bé", "dế", "bố"],
    ["có", "đó", "cố"],
  ],
});

tonePack({
  code: "VIET.HV.DAU_HOI",
  prefix: "viet-hoi",
  tone: "dấu hỏi",
  shape: "một nét cong như cái móc nhỏ",
  lessonRefs: ["KNTT-TV1-T1-B06", "KNTT-TV1-T1-B09"],
  note: "Dấu hỏi học ở bài 6, luyện lại tới bài 9. Cặp hỏi – ngã có gói riêng (VIET.HV.NHAM_LAN_DAU_HOI_NGA).",
  families: [
    F("cỏ", "co", ["cò", "có", "cọ"], "🌿", "bụi cỏ", "garden"),
    F("đỏ", "đo", ["đò", "đó", "đọ"], "🔴", "màu đỏ", "robot"),
    F("ổ", "ô", ["ồ", "ố"], "🪺", "cái ổ", "garden"),
    F("bỏ", null, ["bò", "bó", "bọ"], null, null),
    F("cổ", "cô", ["cồ", "cố", "cỗ"], null, null),
    F("bổ", "bô", ["bồ", "bố", "bộ"], null, null),
    F("bể", "bê", ["bề", "bế", "bệ"], null, null),
    F("để", "đê", ["đề", "đế", "đệ"], null, null),
    F("đổ", "đô", ["đồ", "đố", "đỗ"], null, null),
    F("cả", "ca", ["cà", "cá", "cạ"], null, null),
    F("bả", "ba", ["bà", "bá", "bã"], null, null),
    F("bẻ", null, ["bè", "bé", "bẹ"], null, null),
    F("ở", "ơ", ["ờ", "ớ"], null, null),
    F("đẻ", "đe", ["đè", "đẽ"], null, null),
    F("dở", "dơ", ["dờ", "dỡ"], null, null),
    F("bở", "bơ", ["bờ", "bợ"], null, null),
  ],
  phrases: ["bò ở bờ cỏ", "cô bẻ cỏ", "bé để đồ", "bà bổ cà", "cá đỏ ở bể"],
  writeSets: [
    ["cỏ", "đỏ", "ổ"],
    ["cổ", "bổ", "bể"],
    ["cả", "để", "ở"],
  ],
});

tonePack({
  code: "VIET.HV.DAU_NANG",
  prefix: "viet-nang",
  tone: "dấu nặng",
  shape: "một chấm nhỏ nằm dưới con chữ",
  lessonRefs: ["KNTT-TV1-T1-B07", "KNTT-TV1-T1-B09"],
  note: "Dấu nặng học ở bài 7, luyện lại tới bài 9. Đây là dấu duy nhất nằm *dưới* con chữ — con hay tìm nhầm ở phía trên.",
  families: [
    F("cọ", "co", ["cò", "có", "cỏ"], "🖌️", "cái cọ", "robot"),
    F("bọ", null, ["bò", "bó", "bỏ"], "🐛", "con bọ", "garden"),
    F("bệ", "bê", ["bề", "bế", "bể"], null, null),
    F("đệ", "đê", ["đề", "đế", "để"], null, null),
    F("bộ", "bô", ["bồ", "bố", "bổ"], null, null),
    F("cộ", "cô", ["cồ", "cố", "cổ"], null, null),
    F("độ", "đô", ["đồ", "đố", "đổ"], null, null),
    F("dạ", "da", ["dã"], null, null),
    F("cạ", "ca", ["cà", "cá", "cả"], null, null),
    F("bạ", "ba", ["bà", "bá", "bả"], null, null),
    F("bẹ", null, ["bè", "bé", "bẻ"], null, null),
    F("đọ", "đo", ["đò", "đó", "đỏ"], null, null),
    F("bợ", "bơ", ["bờ", "bở"], null, null),
    F("ợ", "ơ", ["ờ", "ớ"], null, null),
    F("ộ", "ô", ["ồ", "ố"], null, null),
    F("ẹ", "e", ["è", "é", "ẻ"], null, null),
  ],
  phrases: ["bọ bò ở cỏ", "bé cọ bể", "cô có bộ đồ", "bà đo bộ đồ", "dạ, bé có ạ"],
  writeSets: [
    ["cọ", "bọ", "bệ"],
    ["bộ", "độ", "dạ"],
    ["cạ", "bẹ", "đọ"],
  ],
});

tonePack({
  code: "VIET.HV.DAU_NGA",
  prefix: "viet-nga",
  tone: "dấu ngã",
  shape: "một nét lượn sóng nằm trên con chữ",
  lessonRefs: ["KNTT-TV1-T1-B09"],
  note: "Dấu ngã học ở bài 9 — dấu cuối cùng của sáu dấu. Giọng Bắc phân biệt rõ hỏi – ngã, nên gói này luôn kèm ô dấu hỏi làm nhiễu.",
  families: [
    F("đỗ", "đô", ["đồ", "đố", "đổ"], "🫘", "hạt đỗ", "garden"),
    F("dễ", "dê", ["dề", "dế", "dệ"], null, null),
    F("cỗ", "cô", ["cồ", "cố", "cổ"], null, null),
    F("đã", "đa", ["đà", "đá", "đả"], null, null),
    F("bã", "ba", ["bà", "bá", "bả"], null, null),
    F("cỡ", "cơ", ["cờ", "cớ"], null, null),
    F("dỡ", "dơ", ["dờ", "dở"], null, null),
    F("bỡ", "bơ", ["bờ", "bở"], null, null),
    F("đỡ", "đơ", ["đờ", "đợ"], null, null),
    F("dỗ", "dô", ["dổ", "dộ"], null, null),
    F("đẽ", "đe", ["đè", "đẻ"], null, null),
    F("bẽ", null, ["bè", "bé", "bẻ"], null, null),
    F("dã", "da", ["dạ"], null, null),
    F("ẽ", "e", ["è", "é", "ẻ"], null, null),
    F("ễ", "ê", ["ề", "ế", "ể"], null, null),
    F("ỡ", "ơ", ["ờ", "ớ"], null, null),
  ],
  phrases: ["bà dỗ bé", "bố đỡ bà", "cô có đỗ", "bé đã có bơ", "đỗ đỏ ở bồ", "bố đã dỡ đồ"],
  writeSets: [
    ["đỗ", "dễ", "cỗ"],
    ["đã", "bã", "cỡ"],
    ["dỗ", "đỡ", "dỡ"],
    ["bỡ", "đẽ", "dã"],
  ],
});
