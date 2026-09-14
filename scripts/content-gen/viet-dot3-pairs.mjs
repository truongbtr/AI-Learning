/**
 * Đợt 3, lô D8 — Tiếng Việt: bốn kỹ năng "phân biệt chữ dễ nhầm" (s/x, c/k/q, p/q, hỏi/ngã).
 *
 *  - s/x (bài 21, 27): cặp tiếng thật cùng vần (sẻ / xẻ, xô / sô) — khuôn `pairPack`.
 *  - c/k/q (bài 3, 11, 26): quy tắc chính tả; ô sai là cách viết sai đúng quy tắc (ká, cê, kả).
 *  - p/q (bài 26): chữ gương ở mức con chữ (p / q, mã nham_p_q) và âm đầu ph / qu ở mức tiếng
 *    (phà / quà, mã nham_am_dau). Không in "qhà": chữ q đứng một mình chưa học.
 *  - hỏi/ngã: bản đồ kỹ năng chỉ ghi bài 6, 9 — tới bài 9 lớp mới có 11 chữ, không đủ cặp tiếng thật.
 *    Đợt 3 mở `lessonRef` tới bài 19 (lớp đang học bài 14–19) để có mũ / mủ, nghỉ / nghĩ, cũ / củ.
 *
 *   node scripts/content-gen/viet-dot3-pairs.mjs
 */
import { situationPack } from "./lib-vi.mjs";
import { pairPack } from "./lib-viet-pairs.mjs";

const SX = (r, w, pic = null, gloss = null) => [r, w, "nham_s_x", pic, gloss, "s", "x"];
const XS = (r, w, pic = null, gloss = null) => [r, w, "nham_s_x", pic, gloss, "x", "s"];

pairPack({
  code: "VIET.HV.NHAM_LAN_S_X",
  prefix: "viet-sx",
  lessonRefs: ["KNTT-TV1-T1-B21", "KNTT-TV1-T1-B27"],
  unit: "KNTT-TV1-T1-B27",
  source: "SGK Tiếng Việt 1 tập một, Bài 21 tr.54–55 (R r, S s) và Bài 27 tr.66–67 (V v, X x)",
  note: "Phân biệt s và x. Mọi cặp là hai tiếng thật cùng vần, cùng dấu (sẻ / xẻ, sổ / xổ, xô / sô, xưa / sưa) — con chọn nhầm là nhầm âm đầu, mã nham_s_x.",
  spelling: false,
  pairs: [
    XS("xa", "sa"),
    SX("sẻ", "xẻ", "🐦", "chim sẻ"),
    SX("sổ", "xổ", "📒", "quyển sổ"),
    SX("sứ", "xứ"),
    XS("xả", "sả"),
    XS("xô", "sô", "🪣", "cái xô"),
    XS("xu", "su", "🪙", "đồng xu"),
    XS("xơ", "sơ"),
    SX("sà", "xà"),
    XS("xưa", "sưa"),
    SX("sử", "xử"),
    SX("sả", "xả", "🌿", "cây sả"),
  ],
  sorts: [
    ["Có âm s", "Có âm x", ["sẻ", "sổ"], ["xa", "xô"], "nham_s_x"],
    ["Có âm x", "Có âm s", ["xu", "xả"], ["sứ", "sà"], "nham_s_x"],
    ["Có âm s", "Có âm x", ["sử", "sa"], ["xơ", "xưa"], "nham_s_x"],
    ["Có âm x", "Có âm s", ["xẻ", "xứ"], ["sả", "su"], "nham_s_x"],
  ],
  sortHint: "Nhìn chữ đầu của thẻ: s hay x?",
  rubricRule: "Viết đúng s, x",
  phrases: ["bà xẻ gỗ", "xe lu", "thị xã", "Quê Hà là xứ sở của dừa", "Nhà bà ở xa"],
  writeSets: [
    ["chim sẻ", "xe lu"],
    ["xứ sở", "quả su su"],
    ["sổ", "xô", "xa"],
  ],
});

const ckWhy = (w) =>
  w.startsWith("qu")
    ? "q luôn đi với u thành qu."
    : w.startsWith("k")
      ? "k đứng trước e, ê, i."
      : "c đứng trước a, o, ô, ơ, u, ư.";
const CK = (r, w, pic = null, gloss = null) => [r, w, "nham_c_k_q", pic, gloss];

pairPack({
  code: "VIET.HV.NHAM_LAN_C_K_Q",
  prefix: "viet-ckq",
  lessonRefs: ["KNTT-TV1-T1-B03", "KNTT-TV1-T1-B11", "KNTT-TV1-T1-B26"],
  unit: "KNTT-TV1-T1-B26",
  source:
    "SGK Tiếng Việt 1 tập một, Bài 3 (C c), Bài 11 (I i, K k), Bài 26 tr.64–65 (Qu qu); Bài 29 tr.70 (Luyện tập chính tả c/k)",
  note: "Quy tắc c / k / q: k trước e, ê, i; c trước a, o, ô, ơ, u, ư; q luôn đi với u. Ô sai là cách viết phạm đúng quy tắc (ká, cẻ, kả, cê) — không dùng 'kê' làm ô sai của 'quê' vì kê cũng là tiếng đúng.",
  spelling: true,
  ruleHints: [
    ["k đứng trước e, ê, i."],
    ["c đứng trước a, o, ô, ơ, u, ư."],
    ["q luôn đi với u thành qu."],
  ],
  why: ckWhy,
  pairs: [
    CK("cá", "ká", "🐟", "con cá"),
    CK("kẻ", "cẻ"),
    CK("cô", "kô"),
    CK("kí", "cí"),
    CK("cỏ", "kỏ", "🌿", "cỏ"),
    CK("kê", "cê"),
    CK("cà", "kà", "🍆", "quả cà"),
    CK("cờ", "kờ", "🚩", "lá cờ"),
    CK("kể", "cể"),
    CK("cua", "kua", "🦀", "con cua"),
    CK("quả", "kả"),
    CK("quê", "cê"),
    CK("kì", "cì"),
    CK("cú", "kú", "🦉", "con cú"),
  ],
  sorts: [
    ["Viết với c", "Viết với k", ["cá", "cô"], ["kẻ", "kê"], "nham_c_k_q"],
    ["Viết với k", "Viết với c", ["kí", "kể"], ["cỏ", "cà"], "nham_c_k_q"],
    ["Viết với c", "Viết với qu", ["cờ", "cua"], ["quả", "quê"], "nham_c_k_q"],
    ["Viết với qu", "Viết với k", ["quà", "quạ"], ["kì", "kẻ"], "nham_c_k_q"],
  ],
  sortHint: "Nhìn con chữ đứng ngay sau c, k: e, ê, i thì viết k.",
  rubricRule: "Viết đúng c, k, qu",
  phrases: ["cá cờ", "cô kể", "quả khế", "kì cọ", "Bà kể cho bé nghe"],
  writeSets: [
    ["cá", "kẻ", "quả"],
    ["cờ", "kê", "quê"],
    ["cua", "kì", "cô"],
  ],
});

const PQ = "nham_p_q";
const AD = "nham_am_dau";
situationPack({
  code: "VIET.HV.NHAM_LAN_P_Q",
  prefix: "viet-pq",
  unit: "KNTT-TV1-T1-B26",
  lessonRefs: ["KNTT-TV1-T1-B26"],
  src: "SGK Tiếng Việt 1 tập một, Bài 26 tr.64–65 (p – ph, qu)",
  note: "Phân biệt p và q. Mức con chữ: p / q là chữ gương, ô nhiễu mang nham_p_q. Mức tiếng: ph / qu cùng vần cùng dấu (phà / quà, phê / quê, phả / quả), ô nhiễu mang nham_am_dau. Không in 'qhà' hay 'pu': chữ q đứng một mình và vần uê chưa học.",
  items: [
    {
      q: "Chữ nào là chữ p?",
      right: "p",
      wrongs: [["q", PQ], ["b"]],
      d: 1,
      hint: "Chữ p có đuôi dài, bụng quay sang phải.",
    },
    {
      q: "Chữ nào là chữ q?",
      right: "q",
      wrongs: [["p", PQ], ["d"]],
      d: 1,
      hint: "Chữ q có bụng quay sang trái.",
    },
    {
      q: "Tìm giúp {ban} chữ p nhé!",
      right: "p",
      wrongs: [["q", PQ], ["d"]],
      d: 2,
      hint: "Bụng chữ p ở bên phải cái đuôi.",
    },
    {
      q: "Tìm giúp {ban} chữ q nhé!",
      right: "q",
      wrongs: [["p", PQ], ["b"]],
      d: 2,
      hint: "Bụng chữ q ở bên trái cái đuôi.",
    },
    {
      q: "Chữ P viết thường là chữ nào?",
      right: "p",
      wrongs: [["q", PQ], ["g"]],
      d: 3,
      hint: "P hoa và p thường đều có bụng bên phải.",
    },
    {
      q: "Chữ Q viết thường là chữ nào?",
      right: "q",
      wrongs: [["p", PQ], ["g"]],
      d: 3,
      hint: "q thường có bụng bên trái.",
    },
    {
      q: "Ô nào là chữ đứng đầu tiếng phà?",
      right: "p",
      wrongs: [["q", PQ], ["b"]],
      d: 4,
      hint: "phà viết bằng p và h.",
    },
    {
      q: "Ô nào là chữ đứng đầu tiếng quà?",
      right: "q",
      wrongs: [["p", PQ], ["g"]],
      d: 4,
      hint: "quà viết bằng q và u.",
    },
    {
      q: "Tiếng nào có âm ph?",
      right: "phà",
      wrongs: [["quà", AD], ["bà"]],
      d: 1,
      hint: "ph đọc là phờ.",
    },
    {
      q: "Tiếng nào có âm qu?",
      right: "quà",
      wrongs: [["phà", AD], ["cà"]],
      d: 2,
      hint: "qu đọc là quờ.",
    },
    {
      q: "Chọn tiếng có âm qu nhé!",
      right: "quê",
      wrongs: [["phê", AD], ["bê"]],
      d: 2,
      hint: "Nhìn hai con chữ đầu: q và u.",
    },
    {
      q: "Chọn tiếng có âm ph nhé!",
      right: "phả",
      wrongs: [["quả", AD], ["cả"]],
      d: 3,
      hint: "Nhìn hai con chữ đầu: p và h.",
    },
    {
      q: "Đố con: tiếng nào có âm qu?",
      right: "quế",
      wrongs: [["phế", AD], ["dế"]],
      d: 3,
      hint: "q luôn đi với u.",
    },
    {
      q: "Tranh vẽ gì? Chọn tiếng đúng nhé!",
      right: "phà",
      wrongs: [["quà", AD]],
      pic: "⛴️",
      picLabel: "bến phà",
      d: 3,
      hint: "Tranh vẽ chiếc phà chở xe qua sông.",
    },
    {
      q: "Tranh vẽ gì? Chọn tiếng đúng nhé!",
      right: "quà",
      wrongs: [["phà", AD]],
      pic: "🎁",
      picLabel: "gói quà",
      d: 4,
      hint: "Tranh vẽ một gói quà.",
    },
    {
      q: "Tranh vẽ gì? Chọn tiếng đúng nhé!",
      right: "quê",
      wrongs: [["phê", AD]],
      pic: "🏡",
      picLabel: "quê nhà",
      d: 4,
      hint: "Tranh vẽ ngôi nhà ở quê.",
    },
    {
      q: "Tranh vẽ gì? Chọn tiếng đúng nhé!",
      right: "phở",
      wrongs: [["bở", AD]],
      pic: "🍜",
      picLabel: "bát phở",
      d: 5,
      hint: "Tranh vẽ bát phở.",
    },
    {
      q: "Tìm giúp {ban} tiếng có âm ph.",
      right: "phí",
      wrongs: [["bí", AD], ["quạ"]],
      d: 5,
      hint: "Tìm tiếng bắt đầu bằng p và h.",
    },
  ],
  listens: [
    { say: "phà", right: "phà", wrongs: [["quà", AD]], d: 1 },
    { say: "quà", right: "quà", wrongs: [["phà", AD]], d: 1 },
    { say: "quê", right: "quê", wrongs: [["phê", AD]], d: 2 },
    { say: "quả", right: "quả", wrongs: [["phả", AD]], d: 2 },
    { say: "phở", right: "phở", wrongs: [["bở", AD]], d: 3 },
    { say: "phố", right: "phố", wrongs: [["bố", AD]], d: 3 },
    { say: "quạ", right: "quạ", wrongs: [["tạ", AD]], d: 4 },
    { say: "quế", right: "quế", wrongs: [["phế", AD]], d: 5 },
  ],
  sorts: [
    {
      q: "Xếp mỗi tiếng vào đúng giỏ nhé!",
      zones: ["Có âm ph", "Có âm qu"],
      a: ["phà", "phố"],
      b: ["quà", "quê"],
      tag: AD,
      d: 2,
      hint: "Nhìn hai con chữ đầu của thẻ.",
    },
    {
      q: "Chia các tiếng thành hai giỏ giúp {ban}.",
      zones: ["Có âm ph", "Có âm qu"],
      a: ["phở", "phí"],
      b: ["quả", "quạ"],
      tag: AD,
      d: 3,
      hint: "ph có chữ p, qu có chữ q.",
    },
    {
      q: "Tiếng nào có chữ p, tiếng nào có chữ q?",
      zones: ["Có chữ p", "Có chữ q"],
      a: ["pha", "phế"],
      b: ["quế", "que"],
      tag: AD,
      d: 4,
      hint: "Bụng chữ p bên phải, bụng chữ q bên trái.",
    },
  ],
  reads: ["pha trà", "quả khế", "phố cổ", "quê nhà", "Bà cho bé quà quê"],
  writes: [
    ["Viết vào vở mỗi chữ một dòng: p, q, ph, qu.", "p q ph qu"],
    ["Viết vào vở: pha trà, quả khế.", "pha trà, quả khế"],
    ["Viết vào vở: phố cổ, quê nhà.", "phố cổ, quê nhà"],
  ],
});

const HN = "nham_hoi_nga";
// [tiếng dấu hỏi, tiếng dấu ngã]
const PAIRS = [
  ["mủ", "mũ"],
  ["nghỉ", "nghĩ"],
  ["ngả", "ngã"],
  ["mở", "mỡ"],
  ["giả", "giã"],
  ["củ", "cũ"],
  ["lẻ", "lẽ"],
  ["kỉ", "kĩ"],
  ["đổ", "đỗ"],
  ["cổ", "cỗ"],
  ["bả", "bã"],
  ["ngỏ", "ngõ"],
  ["mẻ", "mẽ"],
  ["kẻ", "kẽ"],
];
const FILL = ["bé", "cá", "nhà", "lá", "mẹ", "cô", "gà"];
const ASK_HOI = [
  "Tiếng nào có dấu hỏi?",
  "Chọn tiếng mang dấu hỏi nhé!",
  "Đố con: ô nào có dấu hỏi?",
];
const ASK_NGA = [
  "Tiếng nào có dấu ngã?",
  "Chọn tiếng mang dấu ngã nhé!",
  "Đố con: ô nào có dấu ngã?",
];
situationPack({
  code: "VIET.HV.NHAM_LAN_DAU_HOI_NGA",
  prefix: "viet-hoinga",
  unit: "KNTT-TV1-T1-B09",
  lessonRefs: ["KNTT-TV1-T1-B06", "KNTT-TV1-T1-B09", "KNTT-TV1-T1-B19"],
  src: "SGK Tiếng Việt 1 tập một, Bài 6 (dấu hỏi) và Bài 9 (dấu ngã); tiếng lấy trong phạm vi chữ đã học tới Bài 19",
  note: "Phân biệt dấu hỏi và dấu ngã. Mỗi cặp là hai tiếng thật chỉ khác dấu (mũ / mủ, nghỉ / nghĩ, cũ / củ) — ô nhiễu mang nham_hoi_nga; ô thứ ba không có dấu hỏi lẫn ngã nên câu 'có dấu X' chỉ có một ô đúng. lessonRef mở tới bài 19 để có đủ cặp tiếng thật.",
  items: [
    ...PAIRS.map(([hoi, nga], i) => {
      const askNga = i % 2 === 0;
      return {
        q: (askNga ? ASK_NGA : ASK_HOI)[i % 3],
        right: askNga ? nga : hoi,
        wrongs: [[askNga ? hoi : nga, HN], [FILL[i % FILL.length]]],
        d: 1 + (i % 5),
        hint: askNga ? "Dấu ngã như sợi dây lượn sóng." : "Dấu hỏi như cái móc câu.",
        why: `"${askNga ? nga : hoi}" có dấu ${askNga ? "ngã" : "hỏi"}.`,
      };
    }),
    {
      q: "Tranh vẽ gì? Chọn tiếng đúng nhé!",
      right: "mũ",
      wrongs: [["mủ", HN]],
      pic: "🧢",
      picLabel: "cái mũ",
      d: 3,
      hint: "Tranh vẽ cái mũ.",
      why: "Cái mũ viết là mũ, dấu ngã.",
    },
    {
      q: "Tranh vẽ gì? Chọn tiếng đúng nhé!",
      right: "củ",
      wrongs: [["cũ", HN]],
      pic: "🥕",
      picLabel: "củ cà rốt",
      d: 4,
      hint: "Tranh vẽ một củ cà rốt.",
      why: "Củ cà rốt viết là củ, dấu hỏi.",
    },
  ],
  listenPrompts: [
    "Nghe rồi chọn ô đúng nhé!",
    "{ban} đọc một tiếng, con chọn ô đúng.",
    "Nghe kỹ dấu thanh rồi chọn.",
    "Con nghe rồi tìm đúng tiếng nhé!",
    "Lắng nghe: giọng đi lên nhẹ hay gãy?",
    "Nghe lần nữa rồi chọn ô con nghe thấy.",
  ],
  listens: PAIRS.slice(0, 10).map(([hoi, nga], i) => {
    const say = i % 2 === 0 ? hoi : nga;
    return { say, right: say, wrongs: [[say === hoi ? nga : hoi, HN]], d: 1 + (i % 5) };
  }),
  sorts: [
    {
      q: "Xếp tiếng vào giỏ dấu hỏi, dấu ngã.",
      zones: ["Dấu hỏi", "Dấu ngã"],
      a: ["mủ", "củ"],
      b: ["mũ", "cũ"],
      tag: HN,
      d: 2,
      hint: "Dấu hỏi như móc câu, dấu ngã như lượn sóng.",
    },
    {
      q: "Chia các tiếng thành hai giỏ giúp {ban}.",
      zones: ["Dấu hỏi", "Dấu ngã"],
      a: ["nghỉ", "mở"],
      b: ["nghĩ", "mỡ"],
      tag: HN,
      d: 3,
    },
    {
      q: "Tiếng nào về giỏ dấu ngã?",
      zones: ["Dấu ngã", "Dấu hỏi"],
      a: ["ngõ", "đỗ"],
      b: ["ngỏ", "đổ"],
      tag: HN,
      d: 4,
    },
    {
      q: "Kéo mỗi tiếng về đúng giỏ dấu thanh.",
      zones: ["Dấu ngã", "Dấu hỏi"],
      a: ["giã", "kĩ"],
      b: ["giả", "kỉ"],
      tag: HN,
      d: 5,
    },
  ],
  reads: ["mũ đỏ", "đồ cũ", "nghỉ hè", "ngõ nhỏ", "Bé nghĩ kĩ", "mỡ gà"],
  writes: [
    ["Viết vào vở: cái mũ, đồ cũ, nghỉ hè.", "cái mũ, đồ cũ, nghỉ hè"],
    ["Viết vào vở: củ cà, ngõ nhỏ.", "củ cà, ngõ nhỏ"],
    ["Viết vào vở: Bé nghĩ kĩ.", "Bé nghĩ kĩ."],
  ],
});
