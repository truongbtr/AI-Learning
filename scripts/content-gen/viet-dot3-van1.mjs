/**
 * Đợt 3, lô D2 — Tiếng Việt: vần bài 31–34 (an ăn ân · on ôn ơn · en ên in un · am ăm âm).
 *
 * Tiếng đúng lấy từ trang sách (mục 2 Đọc, tranh, câu nhận biết, bài đọc). Ô nhiễu là tiếng thật và
 * chỉ dùng chữ, vần đã học tới bài đó (validator `tieng-viet-progression`):
 *  - `near`  khác một dấu phụ trong cùng nhóm vần (bạn / bận) → nham_chu_gan_giong;
 *  - `onset` cùng vần khác âm đầu (bạn / nạn) → nham_am_dau_viet;
 *  - `rime`  cùng âm đầu khác vần (bạn / bọ) → doc_nham_van.
 * Câu đọc là câu sách có đủ chữ đã học; câu có vần chưa học (ơi, ây, au) thì cắt bớt.
 *
 *   node scripts/content-gen/viet-dot3-van1.mjs
 */
import { letterPack, W } from "./lib-viet-letters.mjs";

const van = (l) => `vần ${l}`;
const src = (n, pages, title) => `SGK Tiếng Việt 1 tập một, Bài ${n} tr.${pages} (${title})`;
const pack = (n, pages, title, code, prefix, rest) =>
  letterPack({
    code,
    prefix,
    letterLabel: van,
    lessonRefs: [`KNTT-TV1-T1-B${n}`],
    lessonUnitCode: `KNTT-TV1-T1-B${n}`,
    src: src(n, pages, title),
    ...rest,
  });

pack(31, "74–75", "an ăn ân", "VIET.HV.VAN_AN_AWN_AAN", "viet-vanan", {
  note: "Bài 31: an, ăn, ân. Từ của sách: bạn, bản, nhãn, gắn, lặn, bận, gần, bạn thân, khăn rằn, quả mận; bài đọc 'Đàn gà cứ tha thẩn gần chân mẹ…'. Ô gần giống là cặp a/ă/â cùng dấu (bạn / bận, chân / chăn).",
  words: [
    W("bạn", "an", "bè", "bận", "nạn", "bọ", "👭", "đôi bạn thân", "garden"),
    W("khăn", "ăn", "mũ", null, "săn", "khô", "🧣", "chiếc khăn", "robot"),
    W("chân", "ân", "cổ", "chăn", "sân", "chè", "🦶", "bàn chân", "garden"),
    W("gần", "ân", "xa", "gàn", "cần", "gà", null, null),
    W("bản", "an", "nhà", "bẩn", "cản", "bả", null, null),
    W("nhãn", "an", "na", "nhẵn", "giãn", "nhã", null, null),
    W("gắn", "ăn", "lá", null, "cắn", null, null, null),
    W("lặn", "ăn", "ngã", "lận", "mặn", "lạ", null, null),
    W("bận", "ân", "nghỉ", "bạn", "cận", "bộ", null, null),
    W("thẩn", "ân", "đi", null, "vẩn", "thả", null, null),
    W("rằn", "ăn", "kẻ", "rần", "cằn", "rà", null, null),
    W("sân", "ân", "nhà", "săn", "cân", "sa", null, null),
  ],
  phrases: [
    "bạn thân",
    "khăn rằn",
    "quả mận",
    "Đàn gà cứ tha thẩn gần chân mẹ",
    "Đã có mẹ che chắn",
    "cả đàn chả sợ gì lũ quạ dữ",
  ],
  writeSets: [
    ["bạn thân", "khăn rằn"],
    ["quả mận", "gần", "chân"],
    ["bận", "lặn", "sân"],
  ],
});

pack(32, "76–77", "on ôn ơn", "VIET.HV.VAN_ON_OON_OWN", "viet-vanon", {
  note: "Bài 32: on, ôn, ơn. Từ của sách: giòn, ngon, bốn, nhộn, gợn, lớn, nón lá, con chồn, sơn ca; bài đọc 'Bốn chú lợn con'. Câu nhận biết 'Mẹ ơi, con đã lớn khôn' chỉ dùng nửa sau — vần ơi tới bài 39.",
  words: [
    W("nón", "on", "mũ", null, "bón", "ná", "👒", "chiếc nón lá", "garden"),
    W("sơn", "ơn", "ca", null, "trơn", "sa", "🐦", "chim sơn ca", "garden"),
    W("bốn", "ôn", "ba", "bón", "tốn", "bố", "4️⃣", "số bốn", "robot"),
    W("lợn", "ơn", "gà", "lộn", "gợn", "lạ", "🐷", "con lợn", "garden"),
    W("con", "on", "mẹ", "côn", "non", "ca", null, null),
    W("chồn", "ôn", "hổ", null, "cồn", "chờ", null, null),
    W("lớn", "ơn", "bé", null, "hớn", "lá", null, null),
    W("ngon", "on", "chua", "ngôn", "lon", null, null, null),
    W("giòn", "on", "bở", null, "hòn", "giò", null, null),
    W("nhộn", "ôn", "lì", "nhọn", "lộn", null, null, null),
    W("gợn", "ơn", "hồ", "gọn", "lợn", "gỡ", null, null),
    W("khôn", "ôn", "bé", null, "hôn", "khô", null, null),
  ],
  phrases: [
    "nón lá",
    "con chồn",
    "sơn ca",
    "con đã lớn khôn",
    "Bốn chú lợn con",
    "Nhởn nhơ nô giỡn",
    "Là to tròn thế",
  ],
  writeSets: [
    ["nón lá", "sơn ca"],
    ["con chồn", "bốn"],
    ["lớn khôn", "ngon"],
  ],
});

pack(33, "78–79", "en ên in un", "VIET.HV.VAN_EN_EEN_IN_UN", "viet-vanen", {
  note: "Bài 33: en, ên, in, un. Từ của sách: khèn, sen, nến, chín, mịn, cún, vun, ngọn nến, đèn pin, cún con; câu đố 'Ăn cua ăn cá, nhìn qua ngỡ rùa'. Câu nhận biết bỏ 'thấy', 'tàu' — vần ây, au chưa học. Ô gần giống là cặp e/ê cùng dấu (sen / sên, nến / nén).",
  words: [
    W("sen", "en", "cỏ", "sên", "ven", "sa", "🪷", "hoa sen", "garden"),
    W("nến", "ên", "đá", "nén", "bến", "nó", "🕯️", "ngọn nến", "robot"),
    W("cún", "un", "gà", null, "bún", "cá", "🐶", "cún con", "garden"),
    W("pin", "in", "bàn", null, "xin", null, "🔦", "đèn pin", "robot"),
    W("mèn", "en", "dế", "mền", "đèn", "mè", null, null),
    W("chín", "in", "non", null, "kín", "chí", null, null),
    W("vun", "un", "lá", null, "run", "vô", null, null),
    W("trên", "ên", "gần", null, "lên", "tre", null, null),
    W("nhìn", "in", "nghe", null, null, "nhì", null, null),
    W("đèn", "en", "nến", "đền", "kèn", "đè", null, null),
    W("tên", "ên", "họ", null, "bên", "tê", null, null),
    W("mịn", "in", "thô", null, "vịn", null, null, null),
  ],
  phrases: [
    "ngọn nến",
    "đèn pin",
    "cún con",
    "Cún con nhìn dế mèn",
    "Ăn cua ăn cá",
    "nhìn qua ngỡ rùa",
  ],
  writeSets: [
    ["đèn pin", "nến"],
    ["cún con", "hoa sen"],
    ["nhìn", "trên", "chín"],
  ],
});

pack(34, "80–81", "am ăm âm", "VIET.HV.VAN_AM_AWM_AAM", "viet-vanam", {
  note: "Bài 34: am, ăm, âm. Từ của sách: cam, khám, cằm, đậm, nhẩm, quả cam, tăm tre, củ sâm; bài đọc 'Mùa hè, ve râm ran, sen nở thắm. Lũ trẻ nô đùa trên thảm cỏ ven hồ.' Ô gần giống là cặp a/ă/â cùng dấu (cam / câm, tấm / tắm).",
  words: [
    W("cam", "am", "lê", "câm", "nam", "ca", "🍊", "quả cam", "garden"),
    W("khám", "am", "chữa", null, "cám", "khá", "🩺", "khám bệnh", "robot"),
    W("tăm", "ăm", "đũa", "tâm", "năm", "ta", null, null),
    W("sâm", "âm", "củ", "săm", "mâm", "sa", null, null),
    W("cằm", "ăm", "má", "cầm", "nằm", "cà", null, null),
    W("đậm", "âm", "nhẹ", null, "dậm", "độ", null, null),
    W("nhẩm", "âm", "ghi", "nhảm", "tẩm", "nhả", null, null),
    W("ngắm", "ăm", "nghe", "ngấm", "nắm", "ngó", null, null),
    W("tấm", "âm", "lá", "tắm", "cấm", "tá", null, null),
    W("làm", "am", "nghỉ", "lầm", "hàm", "là", null, null),
    W("râm", "âm", "mưa", null, "mâm", "ra", null, null),
    W("thắm", "ăm", "xa", "thấm", "cắm", null, null, null),
  ],
  phrases: [
    "quả cam",
    "tăm tre",
    "củ sâm",
    "ve râm ran",
    "sen nở thắm",
    "Lũ trẻ nô đùa trên thảm cỏ ven hồ",
  ],
  writeSets: [
    ["tăm tre", "củ sâm"],
    ["quả cam", "sen nở thắm"],
    ["làm", "ngắm", "cằm"],
  ],
});
