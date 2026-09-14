/**
 * Đợt 3, lô D11 — Tiếng Việt: chính tả nhìn – viết và nghe – viết (Bài 29 Luyện tập chính tả).
 *
 * Từ ngữ của Bài 29 tr.70–71: c/k (cá cờ, chữ kí), g/gh (gà gô, ghế gỗ), ng/ngh (cá ngừ, củ nghệ); câu
 * chép lấy từ mục 4 Đọc của bài 16–28. Ô sai là lỗi chính tả thật, mã khai tay khi `spellTag` không tả
 * được (nham_ng_ngh, nham_g_gh, nham_c_k_q, nham_s_x, nham_ch_tr, nham_hoi_nga).
 *
 * Nghe – viết: trình hiển thị chỉ phát tiếng ở bài chọn đáp án, nên bài viết vào vở in chữ cho ba mẹ
 * đọc và dặn che chữ; phần "nghe" máy chấm được nằm ở bài nghe rồi chọn cách viết đúng.
 *
 *   node scripts/content-gen/viet-dot3-chinhta.mjs
 */
import { writingPack } from "./lib-vi.mjs";

const NG = "nham_ng_ngh";
const GH = "nham_g_gh";
const CK = "nham_c_k_q";
const SX = "nham_s_x";
const CT = "nham_ch_tr";
const HN = "nham_hoi_nga";
const SRC =
  "SGK Tiếng Việt 1 tập một, Bài 29 tr.70–71 (Luyện tập chính tả); câu chép từ mục 4 Đọc của Bài 16–28";

writingPack({
  code: "VIET.VIET.VIET_CAU_CHINH_TA_NHIN",
  prefix: "viet-chepcau",
  unit: "KNTT-TV1-T1-B29",
  lessonRefs: ["KNTT-TV1-T1-B29"],
  src: SRC,
  note: "Chép câu (nhìn – viết). Bài viết vào vở chấm theo ảnh: đủ tiếng, viết hoa đầu câu, dấu chấm cuối câu, dấu thanh. Trắc nghiệm: chọn bản chép đúng — ô sai là bản quên dấu, nhầm dấu, nhầm ng/ngh, g/gh, c/k, hoặc quên viết hoa / dấu chấm (hai lỗi cuối không có mã).",
  criteria: [
    "Chép đủ tiếng, không bỏ tiếng",
    "Viết hoa chữ đầu câu, có dấu chấm cuối câu",
    "Dấu thanh đúng chỗ",
  ],
  writePrompts: [
    "Nhìn rồi chép vào vở:",
    "Con chép câu này vào vở:",
    "Chép lại giúp {ban}:",
    "Nhìn kỹ rồi chép nhé:",
  ],
  copies: [
    ["Bé Hà có bà."],
    ["Bà cho bé quà quê."],
    ["Nhà bé ở Thủ đô."],
    ["Phú Thọ có chè, có cọ."],
    ["Xa nhà, bé nhớ mẹ."],
    ["Mẹ bế bé ở bờ hồ."],
    ["Bà che gió cho ba chú gà."],
    ["Nghé đã no cỏ."],
    ["Hà chú ý nghe dì kể."],
    ["Quê Hà là xứ sở của dừa."],
    ["ghế gỗ", "củ nghệ"],
    ["cá ngừ", "chữ kí"],
  ],
  words: [
    { w: "Bé Hà có bà.", wrongs: ["Bé Hà co bà.", ["bé Hà có bà.", null]] },
    { w: "Bà cho bé quà quê.", wrongs: ["Bà cho be quà quê.", ["Bà cho bé quà quê", null]] },
    { w: "Nhà bé ở Thủ đô.", wrongs: ["Nhà bé ở Thủ đo.", ["Nhà bé Thủ đô.", null]] },
    {
      w: "Phú Thọ có chè, có cọ.",
      wrongs: ["Phú Thọ có chè, có cỏ.", ["phú thọ có chè, có cọ.", null]],
    },
    { w: "Xa nhà, bé nhớ mẹ.", wrongs: ["Xa nhà, bé nhơ mẹ.", ["Xa nhà bé nhớ mẹ", null]] },
    { w: "Mẹ bế bé ở bờ hồ.", wrongs: ["Mẹ bế bé ở bờ hô.", ["Mẹ bế bé ở bờ.", null]] },
    { w: "Nghé đã no cỏ.", wrongs: [["Ngé đã no cỏ.", NG], "Nghé đã no có."] },
    { w: "Hà chú ý nghe dì kể.", wrongs: [["Hà chú ý nge dì kể.", NG], "Hà chú ý nghe dì kê."] },
    { w: "ghế gỗ", pic: "🪑", gloss: "ghế gỗ", wrongs: [["gế gỗ", GH], "ghế gổ"] },
    { w: "củ nghệ", wrongs: [["củ ngệ", NG], "cũ nghệ"] },
    { w: "chữ kí", pic: "✍️", gloss: "chữ kí", wrongs: [["chữ cí", CK], "chử kí"] },
    { w: "cá ngừ", pic: "🐟", gloss: "cá ngừ", wrongs: [["cá nghừ", NG], "cá ngư"] },
  ],
  builds: [
    ["ngh", "ệ", "nghệ", "ng"],
    ["gh", "ế", "ghế", "g"],
    ["k", "í", "kí", "c"],
    ["ng", "ừ", "ngừ", "ngh"],
    ["c", "ờ", "cờ", "k"],
    ["g", "ô", "gô", "gh"],
  ],
  reads: ["cá cờ", "chữ kí", "gà gô", "ghế gỗ", "cá ngừ", "củ nghệ"],
});

writingPack({
  code: "VIET.VIET.CHINH_TA_NGHE_VIET",
  prefix: "viet-nghevt",
  unit: "KNTT-TV1-T1-B29",
  lessonRefs: ["KNTT-TV1-T1-B29"],
  src: SRC,
  note: "Chính tả nghe – viết. Bài viết vào vở in chữ để ba mẹ đọc cho con viết (dặn che chữ) — trình hiển thị chưa phát tiếng ở dạng viết. Bài nghe rồi chọn cách viết đúng đo phần nghe: ô sai là lỗi theo phát âm (s/x, ch/tr, hỏi/ngã) và theo quy tắc (c/k, g/gh, ng/ngh).",
  criteria: ["Viết đủ tiếng nghe được", "Đúng quy tắc c/k, g/gh, ng/ngh", "Dấu thanh đúng chỗ"],
  writePrompts: [
    "Ba mẹ đọc, con nghe rồi viết (ba mẹ che chữ này):",
    "Nghe ba mẹ đọc rồi viết vào vở, không nhìn chữ:",
    "Ba mẹ đọc chậm hai lần, con viết:",
  ],
  copies: [
    ["cá cờ"],
    ["ghế gỗ"],
    ["củ nghệ"],
    ["cá ngừ"],
    ["chữ kí"],
    ["gà gô"],
    ["nghỉ hè"],
    ["kẻ vở"],
    ["xe lu"],
    ["lá tre"],
    ["Bé nghe bà kể."],
    ["Nhà bà có ghế gỗ."],
  ],
  words: [
    { w: "nghé", pic: "🐃", gloss: "con nghé", wrongs: [["ngé", NG], "nghe"] },
    { w: "ghi", pic: "✍️", gloss: "ghi chép", wrongs: [["gi", GH], "ghì"] },
    {
      w: "kẻ",
      pic: "📏",
      gloss: "kẻ vở",
      wrongs: [
        ["cẻ", CK],
        ["kẽ", HN],
      ],
    },
    { w: "gà gô", pic: "🐦", gloss: "con gà gô", wrongs: [["ghà gô", GH], "gà gồ"] },
    { w: "ngủ", pic: "😴", gloss: "bé ngủ", wrongs: [["nghủ", NG], "ngũ"] },
    { w: "sổ", pic: "📒", gloss: "quyển sổ", wrongs: [["xổ", SX], "sô"] },
    { w: "xe", pic: "🚲", gloss: "xe đạp", wrongs: [["se", SX], "xé"] },
    { w: "chè", pic: "🍵", gloss: "chén chè", wrongs: [["trè", CT], "che"] },
    { w: "tre", pic: "🎋", gloss: "cây tre", wrongs: [["che", CT], "trẻ"] },
    { w: "mũ", pic: "🧢", gloss: "cái mũ", wrongs: [["mủ", HN], "mu"] },
    {
      w: "nghỉ",
      pic: "🛌",
      gloss: "nghỉ ngơi",
      wrongs: [
        ["nghĩ", HN],
        ["ngỉ", NG],
      ],
    },
    {
      w: "củ nghệ",
      pic: "🫚",
      gloss: "củ nghệ",
      wrongs: [
        ["củ ngệ", NG],
        ["cũ nghệ", HN],
      ],
    },
  ],
  builds: [
    ["k", "ẻ", "kẻ", "c"],
    ["s", "ổ", "sổ", "x"],
    ["tr", "e", "tre", "ch"],
    ["ng", "õ", "ngõ", "ngh"],
    ["gh", "i", "ghi", "g"],
    ["x", "e", "xe", "s"],
  ],
  reads: ["nghỉ hè", "ghế gỗ", "kẻ vở", "lá tre"],
});
