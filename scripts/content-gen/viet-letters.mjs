/**
 * Bốn gói học vần còn trống của tuần 2–3: âm ô (bài 7), âm ơ (bài 9), âm i–k (bài 11),
 * âm h–l (bài 12). Lớp 1B3 đang ở bài 13–14, nên đây là những âm con vừa học xong.
 *
 * Hai chỗ đợt 1 vấp, gói này tránh bằng cấu trúc dữ liệu chứ không bằng lời nhắc:
 *  - mỗi tiếng có `without` — một tiếng thật **không chứa** âm đang hỏi, để câu "Tiếng nào có
 *    âm ô?" chỉ có một đáp án (lỗi #2 của đợt 1);
 *  - mỗi phương án nhiễu là **tiếng thật**, mang đúng mã lỗi của việc trẻ vừa làm: nhìn nhầm
 *    con chữ gần giống (o/ô/ơ) là `nham_chu_gan_giong`, đọc nhầm âm đầu là `nham_am_dau_viet`,
 *    đọc nhầm vần là `doc_nham_van` (lỗi #8 và #9 của đợt 1).
 *
 *   node scripts/content-gen/viet-letters.mjs
 */
import { letterPack, W } from "./lib-viet-letters.mjs";

letterPack({
  code: "VIET.HV.AM_OO",
  prefix: "viet-amoo",
  letterLabel: () => "âm ô",
  lessonRefs: ["KNTT-TV1-T1-B07"],
  src: "SGK Tiếng Việt 1 tập một, Bài 7 tr.26 (Ô ô, dấu nặng)",
  note: "Bài 7: Ô ô. Tới bài 7 lớp mới học a b c e ê o ô và bốn dấu huyền – sắc – hỏi – nặng, nên mọi tiếng in ra chỉ dùng chừng ấy chữ; dấu ngã (bài 9) không xuất hiện.",
  words: [
    W("cô", "ô", "ba", "co", "bô", "cà", "👩", "cô giáo", "garden"),
    W("bố", "ô", "cà", "bó", "cố", "bá", "👨", "bố", "robot"),
    W("ô", "ô", "ba", "o", null, null, "☂️", "cái ô", "garden"),
    W("ổ", "ô", "bé", null, "bổ", null, "🪺", "cái ổ", "garden"),
    W("cổ", "ô", "bé", "cỏ", "bổ", "cả", null, null),
    W("cố", "ô", "bà", "có", "bố", "cá", null, null),
    W("bổ", "ô", "cò", "bỏ", "cổ", "bả", null, null),
    W("bộ", "ô", "ca", "bọ", "cộ", "bạ", null, null),
    W("bồ", "ô", "cá", "bò", "cồ", "bà", null, null),
    W("cồ", "ô", "be", "cò", "bồ", "cà", null, null),
    W("cộ", "ô", "bé", "cọ", "bộ", "cạ", null, null),
    W("ố", "ô", "ba", "ó", "bố", null, null, null),
  ],
  phrases: ["cô bế bé", "bố có ô", "bà bổ cà", "cô có cá", "bố ở bể cá"],
  writeSets: [
    ["cô", "bố", "ô"],
    ["ổ", "cổ", "bổ"],
    ["bộ", "bồ", "cố"],
  ],
});

letterPack({
  code: "VIET.HV.AM_OW",
  prefix: "viet-amow",
  letterLabel: () => "âm ơ",
  lessonRefs: ["KNTT-TV1-T1-B09"],
  src: "SGK Tiếng Việt 1 tập một, Bài 9 tr.30 (Ơ ơ, dấu ngã)",
  note: "Bài 9: Ơ ơ và dấu ngã — bài cuối cùng bổ sung dấu, nên từ đây đủ sáu dấu. Nhiễu chính là ba con chữ o – ô – ơ nhìn gần giống nhau.",
  words: [
    W("bơ", "ơ", "cá", "bô", "cơ", "bò", "🥑", "quả bơ", "garden"),
    W("cờ", "ơ", "bé", "cồ", "bờ", "cò", "🚩", "lá cờ", "robot"),
    W("bờ", "ơ", "cá", "bồ", "cờ", "bò", null, null),
    W("cơ", "ơ", "bà", "cô", "bơ", "co", null, null),
    W("cớ", "ơ", "bé", "cố", "bớ", "có", null, null),
    W("cỡ", "ơ", "bà", "cỗ", "dỡ", "cõ", null, null),
    W("đỡ", "ơ", "ca", "đỗ", "bỡ", "đã", null, null),
    W("đờ", "ơ", "cá", "đồ", "bờ", "đò", null, null),
    W("đợ", "ơ", "bé", "độ", "bợ", "đọ", null, null),
    W("bợ", "ơ", "cà", "bộ", "đợ", "bọ", null, null),
    W("bở", "ơ", "cò", "bổ", "dở", "bỏ", null, null),
    W("dở", "ơ", "ba", "dỗ", "bở", "dò", null, null),
    W("dơ", "ơ", "bé", "do", "bơ", "da", null, null),
    W("ở", "ơ", "bà", "ổ", "bở", null, null, null),
  ],
  phrases: ["bé có bơ", "cờ đỏ", "bố đỡ bà", "cô ở bờ đê", "bà dỗ bé"],
  writeSets: [
    ["bơ", "cờ", "bờ"],
    ["cơ", "ở", "đỡ"],
    ["dơ", "bở", "cỡ"],
  ],
});

letterPack({
  code: "VIET.HV.AM_I_K",
  prefix: "viet-amik",
  letterLabel: (l) => (l === "i" ? "âm i" : "âm k"),
  lessonRefs: ["KNTT-TV1-T1-B11"],
  src: "SGK Tiếng Việt 1 tập một, Bài 11 tr.34 (I i, K k)",
  note: "Bài 11: I i, K k. Chữ k chỉ đứng trước i, e, ê — mọi tiếng có k trong gói này đều theo đúng quy tắc đó (quy tắc c/k/q có gói riêng).",
  words: [
    W("bi", "i", "ba", null, "đi", "bà", "🔵", "viên bi", "robot"),
    W("bí", "i", "bà", null, "kí", "bá", "🎃", "quả bí", "garden"),
    W("đi", "i", "đa", null, "bi", "đo", "🚶", "đi bộ", "robot"),
    W("dì", "i", "da", null, "kì", "dà", "👩", "dì", "garden"),
    W("kẻ", "k", "bà", null, "bẻ", "kè", "📏", "kẻ ô", "robot"),
    W("kể", "k", "ba", null, "bể", "kê", null, null),
    W("kê", "k", "cà", null, "bê", "kì", null, null),
    W("kế", "k", "cỏ", null, "bế", "kí", null, null),
    W("kì", "k", "bà", null, "dì", "kê", null, null),
    W("kí", "k", "cá", null, "bí", "kê", null, null),
    W("bì", "i", "bà", null, "dì", "bà", null, null),
    W("bị", "i", "bạ", null, "dị", "bạ", null, null),
  ],
  phrases: ["bé đi bộ", "dì kể bé", "bi đỏ", "cô kẻ ô", "bé có bí đỏ", "dì đi đò"],
  writeSets: [
    ["bi", "bí", "đi"],
    ["kẻ", "kể", "kê"],
    ["dì", "kì", "kí"],
    ["bì", "bị", "kế"],
  ],
});

letterPack({
  code: "VIET.HV.AM_H_L",
  prefix: "viet-amhl",
  letterLabel: (l) => (l === "h" ? "âm h" : "âm l"),
  lessonRefs: ["KNTT-TV1-T1-B12"],
  src: "SGK Tiếng Việt 1 tập một, Bài 12 tr.36 (H h, L l)",
  note: "Bài 12: H h, L l. Tới đây lớp đã có 14 con chữ, nên câu đọc to bắt đầu dài ra được — 'hổ ở bờ hồ' là câu thật của bài.",
  words: [
    W("hồ", "h", "ba", "hò", "bồ", "hà", "🏞️", "cái hồ", "garden"),
    W("hổ", "h", "cá", "hỏ", "bổ", "hả", "🐯", "con hổ", "garden"),
    W("lá", "l", "bà", null, "cá", "lò", "🍃", "chiếc lá", "garden"),
    W("lê", "l", "bí", "le", "bê", "lò", "🍐", "quả lê", "garden"),
    W("lọ", "l", "bà", "lợ", "họ", "lá", "🏺", "cái lọ", "robot"),
    W("li", "l", "bà", null, "bi", "lê", "🥛", "cái li", "robot"),
    W("hè", "h", "cá", "hè", "bè", "hà", null, null),
    W("hẹ", "h", "cà", "hệ", "bẹ", "hạ", null, null),
    W("hộ", "h", "bà", "hợ", "bộ", "hạ", null, null),
    W("lò", "l", "bé", "lờ", "bò", "lê", null, null),
    W("lỗ", "l", "ba", "lỡ", "bỗ", "lã", null, null),
    W("lễ", "l", "cá", "lẽ", "bễ", "lã", null, null),
    W("lạ", "l", "bé", "lợ", "hạ", "lọ", null, null),
    W("hà", "h", "bé", "hờ", "là", "hè", null, null),
  ],
  phrases: ["hổ ở bờ hồ", "bé có li", "lá đỏ", "dì hé lọ", "bé lễ độ"],
  writeSets: [
    ["hồ", "hổ", "hè"],
    ["lá", "lê", "lọ"],
    ["li", "lò", "lỗ"],
  ],
});
