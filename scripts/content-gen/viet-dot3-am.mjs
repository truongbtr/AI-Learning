/**
 * Đợt 3, lô D1 — Tiếng Việt: âm ph–qu (bài 26), v–x (bài 27), y (bài 28).
 *
 * Từ ngữ lấy đúng trang sách (SGK Tiếng Việt 1 tập một, bản chụp trang, ảnh = trang + 1):
 *   bài 26 tr.64–65 · bài 27 tr.66–67 · bài 28 tr.68–69.
 * Câu "Cả nhà từ phố về thăm quê" không dùng làm câu đọc được — vần ăm tới bài 34 mới học.
 *
 * Âm y chỉ đứng sau qu hoặc đứng một mình trong sách lớp 1 (sách viết "kĩ", "lí"), nên gói y chỉ có
 * năm tiếng quy/quỳ/quý/quỹ/quỵ; ô nhiễu là tiếng cùng âm qu khác vần (quê, quà, que — doc_nham_van),
 * và gói bù bằng câu đọc, câu viết.
 *
 *   node scripts/content-gen/viet-dot3-am.mjs
 */
import { letterPack, W } from "./lib-viet-letters.mjs";

const am = (l) => `âm ${l}`;
const src = (n, pages, title) => `SGK Tiếng Việt 1 tập một, Bài ${n} tr.${pages} (${title})`;

letterPack({
  code: "VIET.HV.AM_PH_QU",
  prefix: "viet-amphqu",
  letterLabel: am,
  lessonRefs: ["KNTT-TV1-T1-B26"],
  lessonUnitCode: "KNTT-TV1-T1-B26",
  src: src(26, "64–65", "Ph ph, Qu qu"),
  note: "Bài 26: Ph ph, Qu qu. Từ của sách: phà, phí, phở, quạ, quê, quế, pha trà, phố cổ, quê nhà, quả khế; câu đọc 'Bà cho bé quà quê', 'Bố đưa bà đi phố cổ'. Ô nhiễu: cùng vần khác âm đầu (phố / bố — nham_am_dau_viet), cùng âm đầu khác vần (phố / phở — doc_nham_van).",
  words: [
    W("phố", "ph", "cổ", null, "bố", "phở", "🏙️", "phố cổ", "robot"),
    W("quê", "qu", "nhà", null, "kê", "quế", "🏡", "quê nhà", "garden"),
    W("phà", "ph", "ghe", null, "cà", "phê", "⛴️", "bến phà", "robot"),
    W("quà", "qu", "bi", null, "cà", "quê", "🎁", "gói quà", "robot"),
    W("phở", "ph", "chè", null, "bở", "phố", "🍜", "bát phở", "garden"),
    W("quả", "qu", "lê", null, "cả", "quế", null, null),
    W("quạ", "qu", "gà", null, "tạ", "quê", null, null),
    W("phí", "ph", "cá", null, "bí", "phố", null, null),
    W("quế", "qu", "sả", null, "dế", "quả", null, null),
    W("pha", "ph", "trà", null, "ca", "phở", null, null),
    W("phì", "ph", "lê", null, "bì", "phà", null, null),
    W("que", "qu", "tre", "quê", "me", null, null, null),
  ],
  phrases: ["pha trà", "phố cổ", "quê nhà", "quả khế", "Bà cho bé quà quê", "Bố đưa bà đi phố cổ"],
  writeSets: [
    ["pha trà", "quê nhà"],
    ["phố cổ", "quả khế"],
    ["phở", "quà", "quê"],
  ],
});

letterPack({
  code: "VIET.HV.AM_V_X",
  prefix: "viet-amvx",
  letterLabel: am,
  lessonRefs: ["KNTT-TV1-T1-B27"],
  lessonUnitCode: "KNTT-TV1-T1-B27",
  src: src(27, "66–67", "V v, X x"),
  note: "Bài 27: V v, X x. Từ của sách: võ, vở, vua, xỉa, xứ, xưa, vở vẽ, vỉa hè, xe lu, thị xã; câu đọc 'Quê Hà là xứ sở của dừa'. Câu nhận biết 'Hà vẽ xe đạp' không dùng — vần ap tới bài 53.",
  words: [
    W("vẽ", "v", "bé", null, "kẽ", "vở", "🎨", "bức vẽ", "garden"),
    W("xe", "x", "bò", null, "che", "xa", "🚲", "xe đạp", "robot"),
    W("vở", "v", "cờ", null, "bở", "vẽ", "📒", "quyển vở", "robot"),
    W("vua", "v", "quà", null, "cua", "võ", "👑", "nhà vua", "garden"),
    W("xứ", "x", "quê", null, "sứ", "xưa", null, null),
    W("xã", "x", "phố", null, "giã", "xẻ", null, null),
    W("võ", "v", "hè", null, "gõ", "vẽ", null, null),
    W("xưa", "x", "nhà", null, "thưa", "xa", null, null),
    W("vỉa", "v", "hè", null, "tỉa", "vở", null, null),
    W("xa", "x", "gà", null, "ca", "xe", null, null),
    W("ve", "v", "bò", null, "xe", "vo", null, null),
    W("xẻ", "x", "cưa", null, "kẻ", "xả", null, null),
  ],
  phrases: ["vở vẽ", "vỉa hè", "xe lu", "thị xã", "Quê Hà là xứ sở của dừa"],
  writeSets: [
    ["vở vẽ", "xe lu"],
    ["vỉa hè", "thị xã"],
    ["vẽ", "xa", "vua"],
  ],
});

letterPack({
  code: "VIET.HV.AM_Y",
  prefix: "viet-amy",
  letterLabel: am,
  lessonRefs: ["KNTT-TV1-T1-B28"],
  lessonUnitCode: "KNTT-TV1-T1-B28",
  src: src(28, "68–69", "Y y"),
  note: "Bài 28: Y y. Từ của sách: quy, quỳ, quý, quỹ, quỵ, ý, y tá, dã quỳ, đá quý; câu đọc 'Hà chú ý nghe dì kể'. Sách lớp 1 chỉ để y sau qu hoặc đứng một mình, nên ô nhiễu là tiếng qu khác vần (quê, quà, que, quạ, quế — doc_nham_van); bù số bài bằng đọc to và viết.",
  words: [
    W("quý", "y", "cá", null, null, "quế", "💎", "đá quý", "robot"),
    W("quỳ", "y", "cỏ", null, null, "quà", "🌼", "hoa dã quỳ", "garden"),
    W("quỹ", "y", "sổ", null, null, "quê", null, null),
    W("quy", "y", "củ", null, null, "que", null, null),
    W("quỵ", "y", "ngã", null, null, "quạ", null, null),
  ],
  phrases: [
    "y tá",
    "dã quỳ",
    "đá quý",
    "Hà chú ý nghe dì kể",
    "Mẹ Hà là y tá",
    "quà quý",
    "Dì Kha là y tá",
    "Bố có quỹ nhỏ",
    "Bé chú ý nghe bà kể",
  ],
  writeSets: [["y tá", "đá quý"], ["quý", "quỳ", "quỹ"], ["dã quỳ"], ["chú ý"], ["Hà chú ý nghe"]],
});
