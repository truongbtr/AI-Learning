/**
 * Đợt 3, lô D9 — Tiếng Việt: bảng chữ cái 29 chữ, đọc câu, tô–viết chữ thường, viết chữ số.
 *
 *  - CHU_CAI_29: nhận chữ, thứ tự bảng chữ cái. Ô nhiễu là chữ con hay nhầm (b/d → nham_b_d, p/q →
 *    nham_p_q, ă/â, o/ô/ơ, u/ư, d/đ → nham_chu_gan_giong). Chữ đơn không bị bảng tiến trình chặn.
 *  - DOC_CAU (bài 31): câu đọc là câu mục 4 của bài 16–31 (Bà cho bé quà quê…); nghe câu rồi chọn
 *    câu viết đủ tiếng — ô rơi một tiếng mang doc_bo_tieng, ô thừa một tiếng mang doc_them_tieng.
 *  - TO_CHU_THUONG (bài 1): con chưa đọc được tiếng nào, nên câu hỏi chỉ in chữ đơn (độ cao ô li,
 *    nét khuyết, chữ gương); phần chính là viết vào vở.
 *  - VIET_CHU_SO: nhận và viết mười chữ số; lỗi 6/9, 3/8.
 * Không dùng dạng TRACE: chưa có bài TRACE nào trong kho, chưa kiểm được trình hiển thị.
 *
 *   node scripts/content-gen/viet-dot3-misc.mjs
 */
import { situationPack } from "./lib-vi.mjs";

const BD = "nham_b_d";
const PQ = "nham_p_q";
const GG = "nham_chu_gan_giong";

situationPack({
  code: "VIET.HV.CHU_CAI_29",
  prefix: "viet-chucai",
  unit: null,
  lessonRefs: [],
  src: "SGK Tiếng Việt 1 tập một, bảng chữ cái cuối sách (29 chữ) — chưa gắn bài cụ thể",
  note: "Bảng chữ cái 29 chữ: nhận mặt chữ, chữ hoa – chữ thường, thứ tự. Mỗi câu có một ô nhiễu là chữ gần giống (b/d, p/q, ă/â, o/ô/ơ, u/ư, d/đ). Tên chữ khi nghe đọc theo cách đọc âm của lớp 1 (bờ, dờ, pờ).",
  items: [
    {
      q: "Chữ nào là chữ b?",
      right: "b",
      wrongs: [["d", BD], ["h"]],
      d: 1,
      hint: "Chữ b có bụng bên phải.",
    },
    {
      q: "Chữ nào là chữ d?",
      right: "d",
      wrongs: [
        ["b", BD],
        ["đ", GG],
      ],
      d: 1,
      hint: "Chữ d có bụng bên trái, không có gạch ngang.",
    },
    {
      q: "Chữ nào là chữ ă?",
      right: "ă",
      wrongs: [
        ["â", GG],
        ["a", GG],
      ],
      d: 2,
      hint: "Chữ ă đội cái trăng khuyết.",
    },
    {
      q: "Chữ nào là chữ â?",
      right: "â",
      wrongs: [["ă", GG], ["ê"]],
      d: 2,
      hint: "Chữ â đội cái nón.",
    },
    {
      q: "Chữ nào là chữ ô?",
      right: "ô",
      wrongs: [
        ["ơ", GG],
        ["o", GG],
      ],
      d: 2,
      hint: "Chữ ô đội nón, chữ ơ có râu.",
    },
    {
      q: "Chữ nào là chữ ư?",
      right: "ư",
      wrongs: [["u", GG], ["n"]],
      d: 2,
      hint: "Chữ ư có râu bên phải.",
    },
    {
      q: "Chữ nào là chữ q?",
      right: "q",
      wrongs: [["p", PQ], ["g"]],
      d: 3,
      hint: "Chữ q có bụng bên trái cái đuôi.",
    },
    {
      q: "Chữ nào là chữ đ?",
      right: "đ",
      wrongs: [["d", GG], ["b"]],
      d: 3,
      hint: "Chữ đ có một gạch ngang.",
    },
    {
      q: "Chữ nào đứng ngay sau chữ a?",
      right: "ă",
      wrongs: [["â", GG], ["b"]],
      d: 3,
      hint: "Đọc lại: a, ă, â, b…",
    },
    {
      q: "Chữ nào đứng ngay sau chữ ă?",
      right: "â",
      wrongs: [["a", GG], ["b"]],
      d: 3,
      hint: "Đọc lại: a, ă, â, b…",
    },
    {
      q: "Chữ nào đứng ngay sau chữ o?",
      right: "ô",
      wrongs: [["ơ", GG], ["p"]],
      d: 4,
      hint: "Đọc lại: o, ô, ơ, p…",
    },
    {
      q: "Chữ nào đứng ngay sau chữ ô?",
      right: "ơ",
      wrongs: [["o", GG], ["p"]],
      d: 4,
      hint: "Đọc lại: o, ô, ơ, p…",
    },
    {
      q: "Chữ nào đứng ngay sau chữ e?",
      right: "ê",
      wrongs: [["e", GG], ["g"]],
      d: 4,
      hint: "Đọc lại: e, ê, g, h…",
    },
    {
      q: "Chữ nào đứng ngay sau chữ u?",
      right: "ư",
      wrongs: [["u", GG], ["v"]],
      d: 5,
      hint: "Đọc lại: u, ư, v, x, y.",
    },
    {
      q: "Chữ B viết thường là chữ nào?",
      right: "b",
      wrongs: [["d", BD], ["p"]],
      d: 5,
      hint: "B hoa và b thường đều có bụng bên phải.",
    },
    {
      q: "Chữ nào đứng ngay trước chữ đ?",
      right: "d",
      wrongs: [["b", BD], ["e"]],
      d: 5,
      hint: "Đọc lại: c, d, đ, e…",
    },
  ],
  listenPrompts: [
    "Nghe rồi chọn chữ đúng nhé!",
    "{ban} đọc một chữ, con chọn ô đúng.",
    "Nghe kỹ rồi chỉ vào chữ con vừa nghe.",
    "Con nghe rồi tìm đúng chữ nhé!",
    "Lắng nghe, chữ nào vừa vang lên?",
    "Nghe lần nữa rồi chọn chữ.",
  ],
  listens: [
    { say: "bờ", right: "b", wrongs: [["d", BD], ["h"]], d: 1 },
    {
      say: "dờ",
      right: "d",
      wrongs: [
        ["b", BD],
        ["đ", GG],
      ],
      d: 1,
    },
    { say: "đờ", right: "đ", wrongs: [["d", GG], ["b"]], d: 2 },
    {
      say: "ô",
      right: "ô",
      wrongs: [
        ["o", GG],
        ["ơ", GG],
      ],
      d: 2,
    },
    { say: "ơ", right: "ơ", wrongs: [["ô", GG], ["a"]], d: 3 },
    { say: "ư", right: "ư", wrongs: [["u", GG], ["n"]], d: 3 },
    { say: "pờ", right: "p", wrongs: [["q", PQ], ["b"]], d: 4 },
    { say: "ê", right: "ê", wrongs: [["e", GG], ["â"]], d: 5 },
  ],
  orders: [
    { q: "Xếp các chữ theo thứ tự bảng chữ cái.", steps: ["a", "ă", "â", "b"], d: 1 },
    { q: "Kéo các chữ vào đúng thứ tự nhé!", steps: ["c", "d", "đ", "e"], d: 2 },
    { q: "Xếp giúp {ban} các chữ theo thứ tự.", steps: ["g", "h", "i", "k"], d: 3 },
    { q: "Xếp các chữ theo thứ tự bảng chữ cái.", steps: ["m", "n", "o", "ô"], d: 3 },
    { q: "Kéo các chữ vào đúng thứ tự nhé!", steps: ["p", "q", "r", "s"], d: 4 },
    { q: "Xếp giúp {ban} các chữ cuối bảng.", steps: ["u", "ư", "v", "x"], d: 5 },
  ],
  sorts: [
    {
      q: "Chữ nào có dấu phụ? Xếp vào giỏ.",
      zones: ["Có mũ, móc hoặc râu", "Không có"],
      a: ["ă", "ơ"],
      b: ["a", "o"],
      tag: GG,
      d: 2,
      hint: "Nhìn trên đầu chữ và bên phải chữ.",
    },
    {
      q: "Xếp chữ b và chữ d vào đúng giỏ.",
      zones: ["Chữ b", "Chữ d"],
      a: ["b", "B"],
      b: ["d", "D"],
      tag: BD,
      d: 3,
      hint: "b thường có bụng bên phải, d có bụng bên trái.",
    },
  ],
  reads: ["a ă â b c", "d đ e ê g", "h i k l m", "n o ô ơ p", "q r s t u", "ư v x y"],
  writes: [
    ["Viết vào vở: a, ă, â.", "a ă â", ["Viết đủ 3 chữ", "Dấu phụ đặt đúng chỗ", "Chữ cao 1 ô li"]],
    ["Viết vào vở: o, ô, ơ.", "o ô ơ", ["Viết đủ 3 chữ", "Dấu phụ đặt đúng chỗ", "Chữ cao 1 ô li"]],
  ],
});

const DOC_Q = [
  ["Bà cho bé quà quê. Ai cho bé quà?", "Bà", ["Mẹ", "Bố"]],
  ["Bố đưa bà đi phố cổ. Bố đưa ai đi phố cổ?", "bà", ["bé", "mẹ"]],
  ["Quê Hà là xứ sở của dừa. Quê Hà có nhiều cây gì?", "dừa", ["mía", "chè"]],
  ["Nghỉ hè, bố mẹ cho Hà về quê. Nghỉ hè, Hà đi đâu?", "về quê", ["ra phố", "ra bờ hồ"]],
  ["Mẹ và Hà ghé nhà dì Kha. Mẹ và Hà ghé nhà ai?", "dì Kha", ["bà Kha", "cô Na"]],
  ["Dì kể cho Hà nghe về bà. Dì kể về ai?", "bà", ["bố", "mẹ"]],
  ["Nhà bé ở Thủ đô. Nhà bé ở đâu?", "Thủ đô", ["Phú Thọ", "Sa Pa"]],
  ["Phú Thọ có chè, có cọ. Phú Thọ có gì?", "chè và cọ", ["mía và dừa", "cá và cua"]],
  ["Xa nhà, bé nhớ mẹ. Xa nhà, bé nhớ ai?", "mẹ", ["bà", "bố"]],
  ["Đàn gà cứ tha thẩn gần chân mẹ. Đàn gà ở gần ai?", "gà mẹ", ["lũ quạ", "bé Hà"]],
  ["Cả đàn chả sợ gì lũ quạ dữ. Đàn gà chả sợ con gì?", "lũ quạ", ["gà mẹ", "chú chó"]],
  ["Mẹ bế bé ở bờ hồ. Mẹ bế bé ở đâu?", "bờ hồ", ["nhà bà", "phố cổ"]],
  ["Bà che gió cho ba chú gà. Bà che gió cho ai?", "ba chú gà", ["ba chú chó", "bé Hà"]],
  ["Nghé đã no cỏ. Nghé đã no gì?", "cỏ", ["mía", "chè"]],
];
const BO = "doc_bo_tieng";
const THEM = "doc_them_tieng";
situationPack({
  code: "VIET.DOC.DOC_CAU",
  prefix: "viet-doccau",
  unit: "KNTT-TV1-T1-B31",
  lessonRefs: ["KNTT-TV1-T1-B31"],
  src: "SGK Tiếng Việt 1 tập một, mục 4 Đọc của Bài 16–31 (tr.44–75) và Bài 30 tr.72",
  note: "Đọc trơn câu ngắn của sách (Bà cho bé quà quê; Nhà bé ở Thủ đô; Xa nhà, bé nhớ mẹ…). Hỏi 'ai / ở đâu / cái gì' về đúng câu vừa đọc — ô nhiễu lấy từ câu bên cạnh trong bài để con phải đọc thật. Nghe câu rồi chọn câu viết đủ: ô rơi một tiếng (doc_bo_tieng), ô thừa một tiếng (doc_them_tieng).",
  items: DOC_Q.map(([q, right, wrongs], i) => ({
    q,
    right,
    wrongs: wrongs.map((w) => [w]),
    d: 1 + (i % 5),
    hint: ["Đọc lại câu đầu một lần nữa.", "Tìm trong câu tiếng trả lời cho câu hỏi."],
    why: `Câu viết: "${q.split(". ")[0]}."`,
  })),
  listenPrompts: [
    "Nghe câu rồi chọn câu viết đúng nhé!",
    "{ban} đọc một câu. Ô nào đủ tiếng?",
    "Nghe kỹ từng tiếng rồi chọn.",
    "Con nghe rồi tìm câu viết đủ nhé!",
    "Lắng nghe cả câu rồi mới chọn.",
    "Nghe lần nữa, đếm tiếng rồi chọn.",
  ],
  listens: [
    ["Bà cho bé quà quê.", "Bà cho quà quê.", "Bà cho bé quà ở quê."],
    ["Bố đưa bà đi phố cổ.", "Bố đưa bà phố cổ.", "Bố đưa bà đi ra phố cổ."],
    ["Xa nhà, bé nhớ mẹ.", "Xa nhà, nhớ mẹ.", "Xa nhà, bé cứ nhớ mẹ."],
    ["Nhà bé ở Thủ đô.", "Nhà ở Thủ đô.", "Nhà bé ở tận Thủ đô."],
    ["Phú Thọ có chè, có cọ.", "Phú Thọ có chè, cọ.", "Phú Thọ có chè, có cả cọ."],
    ["Mẹ bế bé ở bờ hồ.", "Mẹ bế bé bờ hồ.", "Mẹ bế bé ở gần bờ hồ."],
    ["Bà che gió cho ba chú gà.", "Bà che gió cho chú gà.", "Bà che gió cho cả ba chú gà."],
    ["Dì kể cho Hà nghe về bà.", "Dì kể Hà nghe về bà.", "Dì kể cho bé Hà nghe về bà."],
  ].map(([say, bo, them], i) => ({
    say,
    right: say,
    wrongs: [
      [bo, BO],
      [them, THEM],
    ],
    d: 1 + (i % 5),
  })),
  orders: [
    {
      q: "Xếp các tiếng thành câu nhé!",
      steps: ["Bà", "cho", "bé", "quà"],
      d: 2,
      hint: "Tiếng viết hoa đứng đầu câu.",
    },
    {
      q: "Kéo tiếng vào đúng chỗ để thành câu.",
      steps: ["Phú", "Thọ", "có", "chè"],
      d: 3,
      hint: "Tên riêng Phú Thọ viết hoa.",
    },
    {
      q: "Xếp các tiếng thành câu giúp {ban}.",
      steps: ["Hà", "chú", "ý", "nghe"],
      d: 4,
      hint: "Tiếng viết hoa đứng đầu câu.",
    },
    {
      q: "Xếp các tiếng thành câu nhé!",
      steps: ["Bé", "nhớ", "bà"],
      d: 2,
      hint: "Tiếng viết hoa đứng đầu câu.",
    },
    {
      q: "Kéo tiếng vào đúng chỗ để thành câu.",
      steps: ["Mẹ", "bế", "bé"],
      d: 1,
      hint: "Tiếng viết hoa đứng đầu câu.",
    },
  ],
  reads: [...DOC_Q.map(([q]) => `${q.split(". ")[0]}.`), "Nhà bé ở Thủ đô. Thủ đô có Bờ Hồ."],
  writes: [
    [
      "Chép vào vở: Bà cho bé quà quê.",
      "Bà cho bé quà quê.",
      ["Chép đủ 5 tiếng", "Viết hoa chữ đầu câu", "Có dấu chấm cuối câu"],
    ],
    [
      "Chép vào vở: Xa nhà, bé nhớ mẹ.",
      "Xa nhà, bé nhớ mẹ.",
      ["Chép đủ 5 tiếng", "Có dấu phẩy và dấu chấm", "Dấu thanh đúng chỗ"],
    ],
  ],
});

const TALL = "Cao 2,5 ô li";
const SHORT = "Cao 1 ô li";
const MIR = "viet_nguoc_chu";
const HANDWRITE = (x) => [
  `Tô rồi viết cho đủ một dòng chữ ${x}.`,
  x,
  [`Viết đúng chữ ${x}, không ngược chiều`, "Đúng độ cao ô li", "Đủ một dòng, cách đều"],
];
situationPack({
  code: "VIET.VIET.TO_CHU_THUONG",
  prefix: "viet-tochu",
  unit: "KNTT-TV1-T1-B01",
  lessonRefs: ["KNTT-TV1-T1-B01"],
  src: "SGK Tiếng Việt 1 tập một, Bài 1 và mục Tô và viết của các bài học âm; độ cao chữ theo mẫu chữ viết tiểu học",
  note: "Tô và viết chữ thường. Bài 1 con chưa đọc được tiếng nào, nên câu hỏi chỉ in chữ đơn: độ cao (a, o, e 1 ô li; b, h, l, k 2,5 ô li), nét khuyết, chữ gương (b/d, p/q — ô nhiễu mang viet_nguoc_chu). Phần chính là 12 bài viết vào vở chấm theo ảnh.",
  items: [
    {
      q: "Chữ nào cao 1 ô li?",
      right: "a",
      wrongs: [["b"], ["h"]],
      d: 1,
      hint: "Chữ thấp nằm gọn trong một ô li.",
    },
    {
      q: "Chữ nào cao 2,5 ô li?",
      right: "b",
      wrongs: [["a"], ["o"]],
      d: 1,
      hint: "Chữ cao có nét khuyết vươn lên trên.",
    },
    {
      q: "Chọn chữ cao 2,5 ô li nhé!",
      right: "h",
      wrongs: [["n"], ["e"]],
      d: 2,
      hint: "Chữ cao có nét khuyết vươn lên trên.",
    },
    {
      q: "Chọn chữ cao 1 ô li nhé!",
      right: "o",
      wrongs: [["l"], ["k"]],
      d: 2,
      hint: "Chữ thấp nằm gọn trong một ô li.",
    },
    {
      q: "Đố con: chữ nào cao 2,5 ô li?",
      right: "l",
      wrongs: [["i"], ["c"]],
      d: 2,
      hint: "Chữ cao có nét khuyết vươn lên trên.",
    },
    {
      q: "Đố con: chữ nào cao 1 ô li?",
      right: "e",
      wrongs: [["b"], ["h"]],
      d: 3,
      hint: "Chữ thấp nằm gọn trong một ô li.",
    },
    {
      q: "Chữ nào là chữ b viết đúng chiều?",
      right: "b",
      wrongs: [["d", MIR], ["p"]],
      d: 3,
      hint: "Bụng chữ b ở bên phải.",
    },
    {
      q: "Chữ nào là chữ d viết đúng chiều?",
      right: "d",
      wrongs: [["b", MIR], ["q"]],
      d: 3,
      hint: "Bụng chữ d ở bên trái.",
    },
    {
      q: "Chữ nào là chữ p viết đúng chiều?",
      right: "p",
      wrongs: [["q", MIR], ["b"]],
      d: 4,
      hint: "Bụng chữ p ở bên phải, đuôi ở dưới.",
    },
    {
      q: "Chữ nào là chữ q viết đúng chiều?",
      right: "q",
      wrongs: [["p", MIR], ["d"]],
      d: 4,
      hint: "Bụng chữ q ở bên trái, đuôi ở dưới.",
    },
    {
      q: "Chữ o viết mấy nét?",
      right: "1",
      wrongs: [["2"], ["3"]],
      d: 4,
      hint: "Chữ o là một nét cong kín.",
    },
    {
      q: "Chữ nào có nét khuyết trên?",
      right: "l",
      wrongs: [["o"], ["c"]],
      d: 5,
      hint: "Nét khuyết trên là vòng vươn lên cao.",
    },
    {
      q: "Chữ nào có nét khuyết dưới?",
      right: "g",
      wrongs: [["a"], ["o"]],
      d: 5,
      hint: "Nét khuyết dưới là vòng thò xuống dưới dòng kẻ.",
    },
    {
      q: "Tìm chữ cao 2,5 ô li nhé!",
      right: "k",
      wrongs: [["m"], ["u"]],
      d: 5,
      hint: "Chữ cao có nét khuyết vươn lên trên.",
    },
  ],
  listenPrompts: [
    "Nghe rồi chọn chữ đúng nhé!",
    "{ban} đọc một chữ, con chọn ô đúng.",
    "Nghe kỹ rồi chỉ vào chữ con vừa nghe.",
    "Con nghe rồi tìm đúng chữ nhé!",
    "Lắng nghe, chữ nào vừa vang lên?",
    "Nghe lần nữa rồi chọn chữ.",
  ],
  listens: [
    { say: "bờ", right: "b", wrongs: [["d", MIR], ["h"]], d: 1 },
    { say: "dờ", right: "d", wrongs: [["b", MIR], ["đ"]], d: 2 },
    { say: "lờ", right: "l", wrongs: [["h"], ["k"]], d: 2 },
    { say: "hờ", right: "h", wrongs: [["k"], ["n"]], d: 3 },
    { say: "o", right: "o", wrongs: [["a"], ["c"]], d: 1 },
    { say: "e", right: "e", wrongs: [["c"], ["a"]], d: 3 },
  ],
  sorts: [
    {
      q: "Chữ thấp hay chữ cao? Xếp vào giỏ.",
      zones: [SHORT, TALL],
      a: ["a", "o"],
      b: ["b", "h"],
      d: 2,
      hint: "Chữ cao có nét vươn lên trên.",
    },
    {
      q: "Xếp các chữ theo độ cao nhé!",
      zones: [SHORT, TALL],
      a: ["e", "c"],
      b: ["l", "k"],
      d: 3,
      hint: "Chữ cao có nét vươn lên trên.",
    },
    {
      q: "Chia các chữ thành hai giỏ giúp {ban}.",
      zones: [SHORT, TALL],
      a: ["m", "n"],
      b: ["b", "l"],
      d: 4,
      hint: "Chữ cao có nét vươn lên trên.",
    },
    {
      q: "Chữ nào có nét khuyết? Xếp vào giỏ.",
      zones: ["Có nét khuyết", "Không có nét khuyết"],
      a: ["l", "h"],
      b: ["o", "a"],
      d: 5,
      hint: "Nét khuyết là cái vòng dài.",
    },
  ],
  reads: ["a b c", "o ô ơ", "e ê"],
  writes: ["a", "o", "c", "e", "b", "h", "l", "k", "d", "đ", "i", "t"].map(HANDWRITE),
});

const VI_NUM = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
const DIGIT = (d) => [
  `Tô rồi viết cho đủ một dòng số ${d}.`,
  String(d),
  [`Viết đúng số ${d}, không ngược chiều`, "Cao đúng 2 ô li", "Đủ một dòng, cách đều"],
];
situationPack({
  code: "VIET.VIET.VIET_CHU_SO",
  prefix: "viet-chuso",
  unit: null,
  lessonRefs: [],
  src: "SGK Tiếng Việt 1 tập một, trang mẫu chữ số (cuối sách) và vở Tập viết 1; chưa gắn bài cụ thể",
  note: "Nhận và viết mười chữ số cao 2 ô li. Ô nhiễu là số con hay lẫn khi viết: 6/9 (lộn ngược), 3/8, 1/7, 2/5. Phần chính là viết vào vở chấm theo ảnh.",
  items: [
    { q: "Số nào là số ba?", right: "3", wrongs: [["8"], ["5"]], d: 1 },
    { q: "Số nào là số sáu?", right: "6", wrongs: [["9"], ["0"]], d: 1 },
    { q: "Số nào là số chín?", right: "9", wrongs: [["6"], ["8"]], d: 2 },
    { q: "Số nào là số bảy?", right: "7", wrongs: [["1"], ["4"]], d: 2 },
    { q: "Số nào là số năm?", right: "5", wrongs: [["2"], ["3"]], d: 2 },
    { q: "Số nào là số hai?", right: "2", wrongs: [["5"], ["7"]], d: 3 },
    { q: "Số nào là số tám?", right: "8", wrongs: [["3"], ["0"]], d: 3 },
    { q: "Số nào là số không?", right: "0", wrongs: [["6"], ["9"]], d: 3 },
    { q: "Số nào là số một?", right: "1", wrongs: [["7"], ["4"]], d: 4 },
    { q: "Số nào là số bốn?", right: "4", wrongs: [["9"], ["1"]], d: 4 },
    {
      q: "Số 6 lộn ngược lại trông giống số mấy?",
      right: "9",
      wrongs: [["8"], ["0"]],
      d: 5,
      hint: "Xoay số 6 xuống dưới lên trên.",
    },
    {
      q: "Chữ số nào chỉ có một nét cong kín?",
      right: "0",
      wrongs: [["1"], ["7"]],
      d: 5,
      hint: "Nét cong kín là vòng tròn khép lại.",
    },
  ].map((it) => ({ hint: "Nhìn kỹ nét của từng số.", ...it })),
  listenPrompts: [
    "Nghe rồi chọn số đúng nhé!",
    "{ban} đọc một số, con chọn ô đúng.",
    "Nghe kỹ rồi chỉ vào số con vừa nghe.",
    "Con nghe rồi tìm đúng số nhé!",
    "Lắng nghe, số nào vừa vang lên?",
    "Nghe lần nữa rồi chọn số.",
  ],
  listens: [
    [7, 1, 4],
    [3, 8, 5],
    [9, 6, 0],
    [6, 9, 8],
    [2, 5, 7],
    [5, 2, 3],
    [8, 3, 0],
    [4, 9, 1],
  ].map(([n, a, b], i) => ({
    say: `số ${VI_NUM[n]}`,
    right: String(n),
    wrongs: [[String(a)], [String(b)]],
    d: 1 + (i % 5),
  })),
  orders: [
    { q: "Xếp các số từ bé đến lớn nhé!", steps: ["0", "1", "2", "3"], d: 1 },
    { q: "Kéo các số vào đúng thứ tự.", steps: ["4", "5", "6", "7"], d: 2 },
    { q: "Xếp giúp {ban} các số từ bé đến lớn.", steps: ["6", "7", "8", "9"], d: 3 },
    { q: "Xếp các số từ bé đến lớn nhé!", steps: ["2", "3", "4", "5"], d: 2 },
  ],
  writes: [
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(DIGIT),
    [
      "Viết vào vở dãy số từ 0 đến 9.",
      "0 1 2 3 4 5 6 7 8 9",
      ["Đủ mười chữ số, đúng thứ tự", "Không số nào viết ngược", "Cao đúng 2 ô li"],
    ],
    [
      "Viết số 6 và số 9, mỗi số một dòng.",
      "6, 9",
      ["Số 6 bụng ở dưới, số 9 bụng ở trên", "Cao đúng 2 ô li"],
    ],
  ],
});
