/**
 * Ba gói của đúng bài lớp đang học tối nay — nhật ký lớp 10–12/09 ghi "Bài 13: U u – Ư ư" và
 * gắn ba kỹ năng này: đánh vần ghép tiếng, đọc tiếng, đọc từ ngữ. Cả ba đang trống bài.
 *
 * Phạm vi chữ: tới **bài 13**, tức a b c d đ e ê o ô ơ i k h l u ư và đủ sáu dấu thanh. Từ ngữ
 * hai tiếng lấy đúng từ của sách — "đu đủ", "cá cờ", "bí đỏ", "lá cờ".
 *
 *   node scripts/content-gen/viet-doc.mjs
 */
import { cap, choicesOf, ex, img, listenPrompt, numberId, writePack } from "./lib.mjs";
import { bare } from "./vn-units.mjs";

const NEAR = ["aăâ", "oôơ", "eê", "uư", "dđ"];
/** Mã lỗi đúng nghĩa cho một thẻ sai so với thẻ đúng — null khi không có mã nào tả được. */
function tagOf(right, wrong) {
  if (bare(right) === bare(wrong))
    return right.normalize("NFD").length > bare(right).length && bare(wrong) === wrong
      ? "thieu_dau_thanh"
      : "sai_dau_thanh";
  const [a, b] = [bare(right), bare(wrong)];
  if (a.length !== b.length) return null;
  const diff = [...a].map((ch, i) => [ch, b[i]]).filter(([x, y]) => x !== y);
  if (diff.length === 1 && NEAR.some((f) => f.includes(diff[0][0]) && f.includes(diff[0][1])))
    return "nham_chu_gan_giong";
  return null;
}

const REF = ["KNTT-TV1-T1-B13"];
const SRC = "SGK Tiếng Việt 1 tập một, Bài 13 tr.38–39 (U u, Ư ư)";

const LISTEN = [
  "Nghe rồi chọn ô đúng nhé!",
  "{ban} đọc một tiếng, con chọn ô đúng.",
  "Nghe kỹ rồi chỉ vào ô con vừa nghe.",
  "Con nghe rồi tìm đúng ô nhé!",
  "Lắng nghe, con nghe thấy gì nào?",
  "Nghe lần nữa rồi chọn ô đúng.",
];
const READ = [
  "Con đọc to các tiếng này nhé!",
  "Đọc chậm từng tiếng cho {ban} nghe.",
  "Con đọc to cho cả nhà cùng nghe.",
  "Đọc rõ từng tiếng nhé!",
  "Cùng đọc to nào!",
  "Con đọc trơn, đừng đánh vần nhé!",
];
const WRITE = [
  "Viết vào vở:",
  "Con chép vào vở:",
  "Viết lại giúp {ban}:",
  "Chép vào vở nhé:",
  "Viết vào vở rồi chụp cho ba mẹ xem:",
  "Con viết vào vở:",
];
const HINT_LISTEN = [
  ["Nghe lại một lần nữa nhé!"],
  ["Các ô gần giống nhau, nghe kỹ phần đầu."],
  ["Nhắm mắt nghe rồi hãy chọn."],
  ["Đọc thầm từng ô rồi so với tiếng vừa nghe."],
  ["Chú ý dấu thanh của tiếng con nghe."],
];
const HINT_READ = [
  ["Đọc chậm từng tiếng một."],
  ["Đánh vần thầm rồi đọc trơn lại."],
  ["Đọc thầm một lần trước đã."],
  ["Ngắt rõ giữa các tiếng nhé!"],
];
const HINT_WRITE = [
  ["Viết chậm, đúng độ cao từng con chữ."],
  ["Viết con chữ trước, đánh dấu thanh sau."],
  ["Nhìn mẫu rồi viết theo nhé!"],
  ["Viết xong đọc lại xem đã đúng tiếng chưa."],
];

const packOf = (code, note, list) =>
  writePack(`content/exercises/viet/${code.split(".").slice(1).join(".")}.pack.json`, {
    skillCode: code,
    subject: "VIET",
    generatedBy: "claude-code",
    promptVersion: "exercise-gen-v2",
    lessonRefs: REF,
    note,
    exercises: list,
  });

const meta = (s) => ({ estSeconds: s, lessonUnitCode: "KNTT-TV1-T1-B13", sourceRef: SRC });

// ───────────────────────────────────────────────────────────────────────────────
// 1. VIET.HV.DANH_VAN_TIENG — ghép âm đầu + vần + dấu thành tiếng
// ───────────────────────────────────────────────────────────────────────────────
/** [âm đầu, vần, tiếng, tiếng-cùng-vần-khác-âm-đầu, tiếng-cùng-âm-đầu-khác-vần] */
const BLENDS = [
  ["c", "u", "cu", "bu", "co"],
  ["c", "ú", "cú", "bú", "có"],
  ["c", "ủ", "củ", "bủ", "cỏ"],
  ["d", "ù", "dù", "lù", "dò"],
  ["đ", "ủ", "đủ", "hủ", "đỏ"],
  ["h", "ồ", "hồ", "bồ", "hà"],
  ["h", "ổ", "hổ", "bổ", "hè"],
  ["l", "á", "lá", "cá", "lê"],
  ["l", "i", "li", "bi", "lê"],
  ["b", "í", "bí", "lí", "bé"],
  ["c", "á", "cá", "lá", "cò"],
  ["c", "ờ", "cờ", "bờ", "cò"],
  ["d", "ế", "dế", "kế", "dê"],
  ["b", "ê", "bê", "lê", "bà"],
  ["k", "ẻ", "kẻ", "bẻ", "kê"],
  ["h", "è", "hè", "lè", "hà"],
  ["l", "ọ", "lọ", "họ", "lá"],
  ["đ", "ò", "đò", "bò", "đá"],
];
{
  const list = [];
  let n = 0;
  const add = (e) => {
    n += 1;
    list.push(
      ex({
        id: numberId("viet-danhvan", n),
        language: "vi",
        skillCodes: ["VIET.HV.DANH_VAN_TIENG"],
        ...e,
      }),
    );
  };
  const ASK = [
    "Ghép âm đầu với vần được tiếng nào?",
    "Hai phần này ghép lại thành tiếng nào?",
    "Đố con: ghép lại được tiếng gì?",
    "Con ghép giúp {ban} xem ra tiếng nào nhé!",
    "Ghép nhanh nào: ra tiếng nào?",
    "Nối âm đầu và vần lại, được tiếng nào?",
  ];
  // ① Ghép âm đầu + vần. Nhiễu: nhầm âm đầu, nhầm vần — đúng hai lỗi của bước đánh vần.
  BLENDS.slice(0, 12).forEach(([onset, rime, word, byOnset, byRime], i) => {
    const { choices, answerKey } = choicesOf(
      { text: word },
      [
        { text: byOnset, errorTag: "nham_am_dau_viet" },
        { text: byRime, errorTag: "doc_nham_van" },
      ],
      i,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 4),
      targetsError: i % 2 === 0 ? "nham_am_dau_viet" : "doc_nham_van",
      scaffold: i < 4 ? "model" : "none",
      prompt: { text: `${onset} – ${rime}. ${ASK[i % 6]}` },
      choices,
      answerKey,
      hints: [
        `Đọc âm đầu "${onset}" rồi đọc liền vần "${rime}".`,
        "Đọc nhanh dần hai phần lại là ra tiếng.",
      ],
      explanation: `Ghép lại thành tiếng "${word}".`,
      meta: meta(25),
    });
  });

  // ② Ngược lại: cho tiếng, hỏi âm đầu — con phải tách chứ không ghép.
  const ASK_PART = [
    "Tiếng này bắt đầu bằng âm nào?",
    "Âm đầu của tiếng này là gì?",
    "Con nghe thấy âm nào ở đầu tiếng?",
    "Đố con: âm đầu là âm nào?",
    "Tiếng này mở đầu bằng con chữ nào?",
    "Phần đầu của tiếng là âm gì nhỉ?",
  ];
  BLENDS.slice(0, 5).forEach(([onset, _rime, word, byOnset], i) => {
    const other = byOnset[0];
    const { choices, answerKey } = choicesOf(
      { text: onset },
      [{ text: other, errorTag: "nham_am_dau_viet" }, { text: "a" }],
      i + 1,
    );
    add({
      type: "MCQ",
      difficulty: 2 + (i % 3),
      targetsError: "nham_am_dau_viet",
      prompt: { text: `Tiếng "${word}". ${ASK_PART[i % 6]}` },
      choices,
      answerKey,
      hints: ["Đọc chậm tiếng đó ra, phần đầu tiên là âm đầu."],
      explanation: `"${word}" bắt đầu bằng âm ${onset}.`,
      meta: meta(25),
    });
  });

  // ③ Nghe tiếng, chọn ô — nhiễu cùng vần khác âm đầu.
  BLENDS.slice(2, 10).forEach(([_o, _r, word, byOnset, byRime], i) => {
    const { choices, answerKey } = choicesOf(
      { text: word },
      [
        { text: byOnset, errorTag: "nham_am_dau_viet" },
        { text: byRime, errorTag: "doc_nham_van" },
      ],
      i,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 1 + (i % 5),
      targetsError: "nham_am_dau_viet",
      scaffold: i < 2 ? "model" : "none",
      prompt: { text: listenPrompt(LISTEN, word, i) },
      listenTarget: { text: word },
      choices,
      answerKey,
      hints: HINT_LISTEN[i % 5],
      explanation: `Con vừa nghe tiếng "${word}".`,
      meta: meta(20),
    });
  });

  // ④ Kéo âm đầu và vần vào đúng ô — dựng lại tiếng bằng tay.
  const DRAG_ASK = [
    "Kéo âm đầu và vần vào đúng ô nhé!",
    "Dựng lại tiếng: âm đầu ở ô trái, vần ở ô phải.",
    "Con xếp hai mảnh vào đúng ô giúp {ban}.",
    "Mỗi mảnh về một ô nhé!",
    "Ghép tiếng bằng cách kéo hai mảnh vào ô.",
    "Kéo mảnh đúng vào từng ô.",
  ];
  BLENDS.slice(0, 7).forEach(([onset, rime, word, byOnset], i) => {
    const cards = [
      { id: "d1", text: onset },
      { id: "v1", text: rime },
      { id: "d2", text: byOnset[0], errorTag: "nham_am_dau_viet" },
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      targetsError: "nham_am_dau_viet",
      prompt: { text: `Tiếng "${word}". ${DRAG_ASK[i % 6]}` },
      dragItems: cards,
      dropZones: [
        { id: "dau", label: "Âm đầu", accepts: ["d1", "d2"] },
        { id: "van", label: "Vần", accepts: ["v1"] },
      ],
      answerKey: { dau: ["d1"], van: ["v1"] },
      hints: ["Đọc chậm tiếng đó, phần đầu là âm đầu."],
      explanation: `"${word}" gồm âm ${onset} và vần ${rime}.`,
      meta: meta(40),
    });
  });

  // ⑤ Đọc to chuỗi tiếng vừa ghép.
  [
    ["cu", "cú", "củ"],
    ["dù", "đủ", "hủ"],
    ["hồ", "hổ", "hè"],
    ["lá", "li", "lọ"],
    ["bí", "bê", "bà"],
  ].forEach((row, i) => {
    add({
      type: "READ_ALOUD",
      difficulty: 2 + (i % 3),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: row.join(", "), words: row },
      answerKey: { words: row },
      hints: HINT_READ[i % 4],
      explanation: `Ba tiếng này đọc là "${row.join(", ")}".`,
      meta: meta(25),
    });
  });

  // ⑥ Viết lại tiếng vừa ghép.
  [
    ["cú", "củ", "cũ"],
    ["dù", "đủ", "hồ"],
    ["lá", "li", "bí"],
  ].forEach((set, i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 3 + i,
      prompt: { text: `${WRITE[i % 6]} ${set.join(", ")}.` },
      rubric: {
        criteria: ["Viết đủ 3 tiếng", "Ghép đúng âm đầu với vần", "Dấu thanh đặt đúng chỗ"],
        sampleAnswers: [set.join(" ")],
      },
      answerKey: null,
      hints: HINT_WRITE[i % 4],
      explanation: "Viết xong con đánh vần lại một lượt nhé!",
      meta: meta(70),
    });
  });

  packOf(
    "VIET.HV.DANH_VAN_TIENG",
    "Ghép âm đầu + vần + dấu thành tiếng, phạm vi chữ tới bài 13. Nhiễu luôn là tiếng thật: cùng vần khác âm đầu (nham_am_dau_viet) hoặc cùng âm đầu khác vần (doc_nham_van).",
    list,
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// 2. VIET.DOC.DOC_TIENG — đọc trơn từng tiếng
// ───────────────────────────────────────────────────────────────────────────────
/**
 * [tiếng, tranh, nghĩa, tiếng chỉ khác dấu, tiếng gần giống thứ hai, thế giới]
 * Ô nhiễu thứ nhất luôn **cùng con chữ, khác dấu** — nên thẻ lỗi `sai_dau_thanh` nói đúng
 * việc con vừa làm; ô thứ hai chỉ là tiếng thật khác, không gắn thẻ.
 */
const SYLLABLES = [
  ["cú", "🦉", "con cú", "cù", "cu", "garden"],
  ["củ", "🥔", "củ khoai", "cú", "cù", "garden"],
  ["dù", "☂️", "cái dù", "dụ", "dì", "robot"],
  ["hồ", "🏞️", "cái hồ", "hổ", "hò", "garden"],
  ["hổ", "🐯", "con hổ", "hồ", "hộ", "garden"],
  ["lá", "🍃", "chiếc lá", "là", "lả", "garden"],
  ["li", "🥛", "cái li", "lì", "lí", "robot"],
  ["bí", "🎃", "quả bí", "bì", "bỉ", "garden"],
  ["cá", "🐟", "con cá", "cà", "cả", "garden"],
  ["cờ", "🚩", "lá cờ", "cớ", "cỏ", "robot"],
  ["dê", "🐐", "con dê", "dề", "dế", "garden"],
  ["dế", "🦗", "con dế", "dề", "dê", "garden"],
  ["lê", "🍐", "quả lê", "lễ", "lề", "garden"],
  ["lọ", "🏺", "cái lọ", "lò", "lỏ", "robot"],
  ["đò", "🛶", "con đò", "đó", "đỏ", "robot"],
  ["bê", "🐄", "con bê", "bế", "bể", "garden"],
];
{
  const list = [];
  let n = 0;
  const add = (e) => {
    n += 1;
    list.push(
      ex({
        id: numberId("viet-doctieng", n),
        language: "vi",
        skillCodes: ["VIET.DOC.DOC_TIENG"],
        ...e,
      }),
    );
  };
  const ASK_PIC = [
    "Tranh vẽ gì? Chọn tiếng đúng nhé!",
    "Chọn tiếng gọi tên bức tranh.",
    "Đố con: tranh này là tiếng nào?",
    "Tiếng nào hợp với bức tranh?",
    "Nhìn tranh rồi chọn tiếng.",
    "Bức tranh này đọc là tiếng nào?",
  ];

  // ① Nhìn tranh, chọn tiếng — hai ô nhiễu chỉ khác dấu, nên phải đọc thật mới chọn đúng.
  SYLLABLES.slice(0, 10).forEach(([w, pic, gloss, near1, near2, theme], i) => {
    const { choices, answerKey } = choicesOf(
      { text: w },
      [{ text: near1, errorTag: "sai_dau_thanh" }, { text: near2 }],
      i,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 4),
      assetTheme: theme,
      targetsError: "sai_dau_thanh",
      scaffold: i < 4 ? "model" : "none",
      prompt: { text: ASK_PIC[i % 6], image: img(pic, gloss, null, 1) },
      choices,
      answerKey,
      hints: [`Tranh vẽ ${gloss}.`, "Đọc thầm từng ô rồi chọn nhé!"],
      explanation: `${cap(gloss)} đọc là "${w}".`,
      meta: meta(22),
    });
  });

  // ② Nghe tiếng, chọn ô.
  SYLLABLES.slice(4, 12).forEach(([w, , , near1, near2], i) => {
    const { choices, answerKey } = choicesOf(
      { text: w },
      [{ text: near1, errorTag: "sai_dau_thanh" }, { text: near2 }],
      i + 1,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 1 + (i % 5),
      targetsError: "sai_dau_thanh",
      prompt: { text: listenPrompt(LISTEN, w, i) },
      listenTarget: { text: w },
      choices,
      answerKey,
      hints: HINT_LISTEN[i % 5],
      explanation: `Con vừa nghe tiếng "${w}".`,
      meta: meta(20),
    });
  });

  // ③ Kéo tiếng về đúng tranh — hai tranh, hai thẻ, đọc được mới xếp đúng.
  for (let i = 0; i < 6; i++) {
    const [w1, p1, g1] = SYLLABLES[(i * 2) % SYLLABLES.length];
    const [w2, p2, g2] = SYLLABLES[(i * 2 + 3) % SYLLABLES.length];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      prompt: { text: "Kéo mỗi tiếng về đúng tranh của nó nhé!" },
      dragItems: [
        { id: "w1", text: w1 },
        { id: "w2", text: w2 },
      ],
      dropZones: [
        { id: "t1", label: g1, image: img(p1, g1, null, 1), accepts: ["w1", "w2"] },
        { id: "t2", label: g2, image: img(p2, g2, null, 1), accepts: ["w1", "w2"] },
      ],
      answerKey: { t1: ["w1"], t2: ["w2"] },
      hints: ["Đọc to từng thẻ trước rồi mới kéo."],
      explanation: `${cap(g1)} là "${w1}", ${g2} là "${w2}".`,
      meta: meta(40),
    });
  }

  // ④ Đọc to từng hàng tiếng — việc chính của kỹ năng này.
  [
    ["cú", "củ", "cũ"],
    ["dù", "đủ", "hủ"],
    ["hồ", "hổ", "hè"],
    ["lá", "lê", "li"],
    ["bí", "bê", "bò"],
    ["cá", "cà", "cỏ"],
    ["dê", "dế", "dì"],
    ["đò", "đỏ", "đá"],
    ["lọ", "lò", "lỗ"],
    ["cờ", "cô", "cổ"],
    ["kẻ", "kể", "kê"],
    ["bà", "bé", "bơ"],
  ].forEach((row, i) => {
    add({
      type: "READ_ALOUD",
      difficulty: 1 + (i % 5),
      scaffold: i < 2 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: row.join(", "), words: row },
      answerKey: { words: row },
      hints: HINT_READ[i % 4],
      explanation: `Hàng này đọc là "${row.join(", ")}".`,
      meta: meta(25),
    });
  });

  // ⑤ Chép lại tiếng.
  [
    ["cú", "củ", "cũ"],
    ["hồ", "hổ", "lá"],
    ["bí", "li", "dù"],
    ["cá", "cờ", "dế"],
  ].forEach((set, i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 2 + (i % 4),
      prompt: { text: `${WRITE[i % 6]} ${set.join(", ")}.` },
      rubric: {
        criteria: ["Viết đủ 3 tiếng", "Con chữ đúng nét, đúng độ cao", "Dấu thanh đặt đúng chỗ"],
        sampleAnswers: [set.join(" ")],
      },
      answerKey: null,
      hints: HINT_WRITE[i % 4],
      explanation: "Viết xong con đọc lại một lượt nhé!",
      meta: meta(65),
    });
  });

  packOf(
    "VIET.DOC.DOC_TIENG",
    "Đọc trơn từng tiếng trong phạm vi bài 13. Hai ô nhiễu luôn chỉ khác dấu thanh, nên nhìn lướt là chọn nhầm — đúng chỗ con hay vội.",
    list,
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// 3. VIET.DOC.DOC_TU — đọc từ ngữ hai tiếng
// ───────────────────────────────────────────────────────────────────────────────
/**
 * [từ, tranh, nghĩa, từ nhiễu, mã lỗi của từ nhiễu, từ nhiễu thứ hai, thế giới]
 *
 * Từ nhiễu lệch **đúng một chỗ** so với từ đúng, và mã lỗi nói đúng chỗ lệch đó: bỏ quên dấu là
 * `thieu_dau_thanh`, đánh nhầm dấu là `sai_dau_thanh`, nhìn nhầm o/ô/ơ là `nham_chu_gan_giong`.
 * Đợt 1 gắn thẻ theo thói quen ở 471 bài — bảng này buộc phải chọn thẻ cho từng từ một.
 */
const WORDS = [
  ["đu đủ", "🍈", "quả đu đủ", "đu đu", "thieu_dau_thanh", "đa đủ", "garden"],
  ["cá cờ", "🐠", "con cá cờ", "cá cỏ", "nham_chu_gan_giong", "cà cờ", "garden"],
  ["lá cờ", "🚩", "lá cờ", "là cờ", "sai_dau_thanh", "lá cỏ", "robot"],
  ["bí đỏ", "🎃", "quả bí đỏ", "bí đò", "sai_dau_thanh", "bì đỏ", "garden"],
  ["cô bé", "👧", "cô bé", "cô be", "thieu_dau_thanh", "cô bê", "garden"],
  ["hồ cá", "🏞️", "hồ cá", "hổ cá", "sai_dau_thanh", "hồ cà", "garden"],
  ["bể cá", "🐟", "bể cá", "bệ cá", "sai_dau_thanh", "bể cà", "garden"],
  ["bà cụ", "👵", "bà cụ", "bà củ", "sai_dau_thanh", "bá cụ", "garden"],
  ["bó cỏ", "🌿", "bó cỏ", "bò cỏ", "sai_dau_thanh", "bó có", "garden"],
  ["bờ đê", "🏞️", "bờ đê", "bở đê", "sai_dau_thanh", "bô đê", "robot"],
  ["hổ dữ", "🐯", "hổ dữ", "hồ dữ", "sai_dau_thanh", "hổ dừ", "robot"],
  ["đò cũ", "🛶", "con đò cũ", "đó cũ", "sai_dau_thanh", "đò cú", "robot"],
];
{
  const list = [];
  let n = 0;
  const add = (e) => {
    n += 1;
    list.push(
      ex({ id: numberId("viet-doctu", n), language: "vi", skillCodes: ["VIET.DOC.DOC_TU"], ...e }),
    );
  };
  const ASK_PIC = [
    "Tranh vẽ gì? Chọn từ đúng nhé!",
    "Chọn từ gọi tên bức tranh.",
    "Đố con: tranh này là từ nào?",
    "Từ nào hợp với bức tranh?",
    "Nhìn tranh rồi chọn từ.",
    "Bức tranh này đọc là từ nào?",
  ];

  // ① Nhìn tranh chọn từ — hai từ nhiễu chỉ lệch một dấu, phải đọc cả hai tiếng mới chọn đúng.
  WORDS.forEach(([w, pic, gloss, near1, tag1, near2, theme], i) => {
    const { choices, answerKey } = choicesOf(
      { text: w },
      [{ text: near1, errorTag: tag1 }, { text: near2 }],
      i,
    );
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      assetTheme: theme,
      targetsError: tag1,
      scaffold: i < 4 ? "model" : "none",
      prompt: { text: ASK_PIC[i % 6], image: img(pic, gloss, null, 1) },
      choices,
      answerKey,
      hints: [`Tranh vẽ ${gloss}.`, "Đọc cả hai tiếng rồi hãy chọn nhé!"],
      explanation: `${cap(gloss)} đọc là "${w}".`,
      meta: meta(25),
    });
  });

  // ② Nghe từ, chọn ô.
  WORDS.slice(0, 8).forEach(([w, , , near1, tag1, near2], i) => {
    const { choices, answerKey } = choicesOf(
      { text: w },
      [{ text: near1, errorTag: tag1 }, { text: near2 }],
      i + 1,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 1 + (i % 5),
      targetsError: tag1,
      prompt: { text: listenPrompt(LISTEN, w, i) },
      listenTarget: { text: w },
      choices,
      answerKey,
      hints: HINT_LISTEN[i % 5],
      explanation: `Con vừa nghe từ "${w}".`,
      meta: meta(22),
    });
  });

  // ③ Ghép hai tiếng thành từ — kéo tiếng thứ hai vào chỗ trống.
  WORDS.slice(0, 8).forEach(([w, pic, gloss, near1, _tag1, near2], i) => {
    const [first, second] = w.split(" ");
    // Thẻ nhiễu là tiếng thứ hai của một từ nhiễu — nhưng chỉ khi nó **khác** tiếng đúng: từ nhiễu
    // "là cờ" lệch ở tiếng đầu, nên tiếng thứ hai của nó lại chính là "cờ" (3 bài từng có hai thẻ
    // giống hệt nhau). Mã lỗi tính lại theo đúng hai tiếng được so.
    const decoy = [near1, near2].map((x) => x.split(" ")[1]).find((x) => x !== second);
    const tag1 = tagOf(second, decoy);
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      targetsError: tag1,
      prompt: {
        text: `Từ bắt đầu bằng "${first}". Kéo tiếng còn lại vào ô nhé!`,
        image: img(pic, gloss, null, 1),
      },
      dragItems: [
        { id: "dung", text: second },
        tag1 ? { id: "sai", text: decoy, errorTag: tag1 } : { id: "sai", text: decoy },
      ],
      dropZones: [{ id: "o", label: "Tiếng thứ hai", accepts: ["dung", "sai"] }],
      answerKey: { o: ["dung"] },
      hints: [`Tranh vẽ ${gloss}.`, "Đọc thử cả hai cách xem cách nào nghe đúng."],
      explanation: `${cap(gloss)} là "${w}".`,
      meta: meta(35),
    });
  });

  // ④ Đọc to từ ngữ.
  [
    ["đu", "đủ"],
    ["cá", "cờ"],
    ["lá", "cờ"],
    ["bí", "đỏ"],
    ["cô", "bé"],
    ["hồ", "cá"],
    ["bà", "cụ"],
    ["bờ", "đê"],
    ["hổ", "dữ"],
    ["đò", "cũ"],
  ].forEach((pair, i) => {
    add({
      type: "READ_ALOUD",
      difficulty: 1 + (i % 5),
      scaffold: i < 2 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: pair.join(" "), words: pair },
      answerKey: { words: pair },
      hints: HINT_READ[i % 4],
      explanation: `Từ này đọc là "${pair.join(" ")}".`,
      meta: meta(22),
    });
  });

  // ⑤ Chép từ ngữ.
  [
    ["đu đủ", "cá cờ"],
    ["lá cờ", "bí đỏ"],
    ["hồ cá", "bà cụ"],
    ["bờ đê", "đò cũ"],
  ].forEach((set, i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 2 + (i % 4),
      prompt: { text: `${WRITE[i % 6]} ${set.join(", ")}.` },
      rubric: {
        criteria: ["Viết đủ hai từ", "Hai tiếng trong một từ viết cách nhau", "Dấu thanh đúng chỗ"],
        sampleAnswers: [set.join(", ")],
      },
      answerKey: null,
      hints: HINT_WRITE[i % 4],
      explanation: "Viết xong con đọc lại cả từ nhé!",
      meta: meta(70),
    });
  });

  packOf(
    "VIET.DOC.DOC_TU",
    "Từ ngữ hai tiếng của sách: đu đủ, cá cờ, lá cờ, bí đỏ… Phương án nhiễu lệch đúng một dấu hoặc một con chữ, nên con phải đọc cả hai tiếng.",
    list,
  );
}
