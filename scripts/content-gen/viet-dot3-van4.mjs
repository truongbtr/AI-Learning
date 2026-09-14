/**
 * Đợt 3, lô D5 — Tiếng Việt: vần bài 46–49 (ac ăc âc · oc ôc uc ưc · at ăt ât · ot ôt ơt).
 * Cùng quy ước với `viet-dot3-van1.mjs`. Trang sách: 46 tr.104–105 · 47 tr.106–107 · 48 tr.108–109 ·
 * 49 tr.110–111.
 *
 *   node scripts/content-gen/viet-dot3-van4.mjs
 */
import { letterPack, W } from "./lib-viet-letters.mjs";

const van = (l) => `vần ${l}`;
const pack = (n, pages, title, code, prefix, rest) =>
  letterPack({
    code,
    prefix,
    letterLabel: van,
    lessonRefs: [`KNTT-TV1-T1-B${n}`],
    lessonUnitCode: `KNTT-TV1-T1-B${n}`,
    src: `SGK Tiếng Việt 1 tập một, Bài ${n} tr.${pages} (${title})`,
    ...rest,
  });

pack(46, "104–105", "ac ăc âc", "VIET.HV.VAN_AC_AWC_AAC", "viet-vanac", {
  note: "Bài 46: ac, ăc, âc. Từ của sách: lạc, nhạc, mặc, nhắc, gấc, giấc, bác sĩ, mắc áo, quả gấc; bài đọc 'Nếu lên Tây Bắc, bạn hãy đến Sa Pa…'. Câu nhận biết 'Tây Bắc có ruộng bậc thang' không dùng — vần uông, ang, ươc chưa học. Ô gần giống: nhắc / nhấc, tắc / tấc.",
  words: [
    W("bác", "ac", "cô", null, "các", "bé", "🧑‍⚕️", "bác sĩ", "robot"),
    W("lạc", "ac", "đỗ", null, "hạc", "lạ", "🥜", "củ lạc", "garden"),
    W("nhạc", "ac", "ca", null, "lạc", null, "🎵", "bản nhạc", "robot"),
    W("mắc", "ăc", "treo", null, "bắc", "má", null, null),
    W("gấc", "âc", "cam", null, "bấc", "gái", null, null),
    W("mặc", "ăc", "cởi", null, "sặc", "mẹ", null, null),
    W("nhắc", "ăc", "nhớ", "nhấc", "bắc", null, null, null),
    W("giấc", "âc", "ngủ", null, "tấc", "giá", null, null),
    W("thác", "ac", "hồ", null, "các", "thế", null, null),
    W("bậc", "âc", "thềm", null, null, "bộ", null, null),
    W("tắc", "ăc", "trôi", "tấc", "sắc", "tá", null, null),
    W("bạc", "ac", "chì", null, "lạc", "bộ", null, null),
  ],
  phrases: [
    "bác sĩ",
    "mắc áo",
    "quả gấc",
    "Nếu lên Tây Bắc bạn hãy đến Sa Pa",
    "Sa Pa có Thác Bạc có Cầu Mây",
    "Vào mùa hè mỗi ngày ở đây như có bốn mùa",
  ],
  writeSets: [
    ["bác sĩ", "mắc áo"],
    ["quả gấc", "Tây Bắc"],
    ["nhạc", "giấc", "thác"],
  ],
});

pack(47, "106–107", "oc ôc uc ưc", "VIET.HV.VAN_OC_OOC_UC_UWC", "viet-vanoc", {
  note: "Bài 47: oc, ôc, uc, ưc. Từ của sách: học, sóc, cốc, lộc, chục, cúc, đức, mực, con sóc, cái cốc, máy xúc, con mực; bài đọc 'Đi học về, Hà thấy mấy khóm cúc đã nở rực rỡ…'. Ô gần giống: o/ô (sóc / sốc, lộc / lọc) và u/ư (mực / mục, đức / đúc).",
  words: [
    W("sóc", "oc", "khỉ", "sốc", "cóc", null, "🐿️", "con sóc", "garden"),
    W("cốc", "ôc", "chén", "cóc", "gốc", "cố", "🥛", "cái cốc", "robot"),
    W("mực", "ưc", "tôm", "mục", "lực", "mạ", "🦑", "con mực", "garden"),
    W("cúc", "uc", "sen", null, "xúc", "cú", "🌼", "hoa cúc", "garden"),
    W("xúc", "uc", "đào", "xức", "cúc", "xé", null, null),
    W("học", "oc", "chơi", "hộc", "bọc", "họ", null, null),
    W("lộc", "ôc", "lá", "lọc", "hộc", "lộ", null, null),
    W("chục", "uc", "trăm", "chực", "lục", null, null, null),
    W("đức", "ưc", "tài", "đúc", "sức", "đá", null, null),
    W("góc", "oc", "giữa", "gốc", "móc", null, null, null),
    W("rực", "ưc", "tối", null, "lực", "rạ", null, null),
    W("khóc", "oc", "vui", null, "móc", "khó", null, null),
  ],
  phrases: [
    "con sóc",
    "cái cốc",
    "máy xúc",
    "con mực",
    "Đi học về Hà thấy mấy khóm cúc đã nở rực rỡ",
    "Mẹ tấm tắc khen Hà khéo tay",
  ],
  writeSets: [
    ["con sóc", "máy xúc"],
    ["cái cốc", "con mực"],
    ["học", "cúc", "rực"],
  ],
});

pack(48, "108–109", "at ăt ât", "VIET.HV.VAN_AT_AWT_AAT", "viet-vanat", {
  note: "Bài 48: at, ăt, ât. Từ của sách: bát, lạt, sắt, gặt, đất, gật, bãi cát, mặt trời, bật lửa; bài đọc 'Hè đến, nhà Nam đi nghỉ mát ở Cát Bà…'. Câu nhận biết bỏ 'nhịp' — vần ip tới bài 56. Ô gần giống là cặp a/ă/â cùng dấu (cát / cắt, mặt / mật, đất / đắt).",
  words: [
    W("cát", "at", "sỏi", "cắt", "mát", "cá", "🏖️", "bãi cát", "garden"),
    W("mặt", "ăt", "tay", "mật", "gặt", "mẹ", "☀️", "mặt trời", "garden"),
    W("bát", "at", "đũa", "bắt", "hát", "bé", "🥣", "cái bát", "robot"),
    W("hát", "at", "múa", "hắt", "bát", "há", "🎤", "ca hát", "robot"),
    W("đất", "ât", "cỏ", "đắt", "mất", "đá", null, null),
    W("gặt", "ăt", "cày", "gật", "mặt", null, null, null),
    W("sắt", "ăt", "gỗ", null, "cắt", "sứ", null, null),
    W("tất", "ât", "giày", "tắt", "mất", "tá", null, null),
    W("gật", "ât", "lắc", "gặt", "vật", null, null, null),
    W("lạt", "at", "dây", null, "nhạt", "lạ", null, null),
    W("rất", "ât", "hơi", null, "mất", "rá", null, null),
    W("bật", "ât", "tắt", "bặt", "vật", "bộ", null, null),
  ],
  phrases: [
    "bãi cát",
    "mặt trời",
    "bật lửa",
    "nhà Nam đi nghỉ mát ở Cát Bà",
    "Mẹ và Nam bỏ áo bơi vào ba lô",
    "Nam rất vui khi đi chơi xa với cả nhà",
  ],
  writeSets: [
    ["bãi cát", "mặt trời"],
    ["bật lửa", "cái bát"],
    ["hát", "đất", "gặt"],
  ],
});

pack(49, "110–111", "ot ôt ơt", "VIET.HV.VAN_OT_OOT_OWT", "viet-vanot", {
  note: "Bài 49: ot, ôt, ơt. Từ của sách: ngọt, vót, cột, tốt, thớt, vợt, quả nhót, lá lốt, quả ớt; bài đọc 'Sớm nay thức dậy, Nam chợt thấy một chú chim sâu…'. 'ớt' không có âm đầu nên không làm được câu hỏi có ô nhiễu đúng nghĩa — chỉ có trong câu đọc, câu viết. Ô gần giống: o/ô/ơ (vợt / vọt, một / mọt, thớt / thốt).",
  words: [
    W("rốt", "ôt", "cải", "rớt", "tốt", "rá", "🥕", "củ cà rốt", "garden"),
    W("vợt", "ơt", "cầu", "vọt", null, "vị", "🏸", "cái vợt", "robot"),
    W("hót", "ot", "kêu", "hốt", "sót", "há", "🐦", "chim hót", "garden"),
    W("nhót", "ot", "mận", "nhốt", "hót", null, null, null),
    W("lốt", "ôt", "lá", "lót", "tốt", null, null, null),
    W("ngọt", "ot", "chua", "ngột", "sọt", "ngọ", null, null),
    W("cột", "ôt", "kèo", null, "một", "cụ", null, null),
    W("tốt", "ôt", "xấu", null, "lốt", "tá", null, null),
    W("thớt", "ơt", "dao", "thốt", "hớt", null, null, null),
    W("một", "ôt", "hai", "mọt", "cột", "mẹ", null, null),
    W("chợt", "ơt", "vẫn", null, "nhợt", "chợ", null, null),
    W("vót", "ot", "cưa", null, "hót", "vé", null, null),
  ],
  phrases: [
    "quả nhót",
    "lá lốt",
    "quả ớt",
    "Nam chợt thấy một chú chim sâu",
    "Chim hớn hở như chào Nam",
    "Nó nhảy nhót một hồi rồi bay qua bay lại",
  ],
  writeSets: [
    ["lá lốt", "quả ớt"],
    ["quả nhót", "cà rốt"],
    ["ngọt", "tốt", "vợt"],
  ],
});
