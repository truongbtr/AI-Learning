/**
 * Đợt 3, lô D3 — Tiếng Việt: vần bài 36–39 (om ôm ơm · em êm im um · ai ay ây · oi ôi ơi).
 * Cùng quy ước với `viet-dot3-van1.mjs`. Trang sách: 36 tr.84–85 · 37 tr.86–87 · 38 tr.88–89 · 39 tr.90–91.
 *
 *   node scripts/content-gen/viet-dot3-van2.mjs
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

pack(36, "84–85", "om ôm ơm", "VIET.HV.VAN_OM_OOM_OWM", "viet-vanom", {
  note: "Bài 36: om, ôm, ơm. Từ của sách: khóm, vòm, nộm, tôm, bờm, rơm, đom đóm, chó đốm, mâm cơm; bài đọc 'Hôm qua, cô Mơ ở xóm Hạ…'. Câu nhận biết 'Hương cốm thơm thôn xóm' không dùng — vần ương tới bài 73. Ô gần giống là cặp o/ô/ơ (đóm / đốm, rơm / rôm).",
  words: [
    W("đốm", "ôm", "chó", "đóm", "cốm", "đố", "🐕", "chó đốm", "garden"),
    W("cơm", "ơm", "cá", null, "thơm", "cơ", "🍚", "mâm cơm", "garden"),
    W("tôm", "ôm", "cá", null, "hôm", "tô", "🦐", "con tôm", "garden"),
    W("đóm", "om", "dế", "đốm", "khóm", "đá", null, null),
    W("xóm", "om", "phố", null, "khóm", "xó", null, null),
    W("rơm", "ơm", "rạ", "rôm", "thơm", "ra", null, null),
    W("vòm", "om", "cửa", null, "chòm", "vò", null, null),
    W("nộm", "ôm", "bún", null, null, "nụ", null, null),
    W("bờm", "ơm", "vó", null, null, "bờ", null, null),
    W("thơm", "ơm", "chua", null, "cơm", "thơ", null, null),
    W("hôm", "ôm", "qua", null, "tôm", "hô", null, null),
    W("chòm", "om", "lá", "chồm", "vòm", "chè", null, null),
  ],
  phrases: [
    "đom đóm",
    "chó đốm",
    "mâm cơm",
    "cô Mơ ở xóm Hạ",
    "Cô cho Hà giỏ cam",
    "Mẹ khen và thơm lên má Hà",
  ],
  writeSets: [
    ["đom đóm", "chó đốm"],
    ["mâm cơm", "tôm"],
    ["xóm", "rơm", "thơm"],
  ],
});

pack(37, "86–87", "em êm im um", "VIET.HV.VAN_EM_EEM_IM_UM", "viet-vanem", {
  note: "Bài 37: em, êm, im, um. Từ của sách: kem, mềm, nếm, tím, chụm, tem thư, thềm nhà, tủm tỉm; bài đọc 'Chim ri cần cù tìm cỏ khô về làm tổ…'. Ô gần giống là cặp e/ê cùng dấu (tem / têm, đêm / đem, nếm / ném).",
  words: [
    W("kem", "em", "chè", null, "tem", null, "🍦", "que kem", "garden"),
    W("tím", "im", "đỏ", null, null, "tí", "🟪", "màu tím", "robot"),
    W("chim", "im", "cá", null, "tim", "chi", "🐦", "con chim", "garden"),
    W("đêm", "êm", "sớm", "đem", "thêm", "đê", "🌙", "ban đêm", "robot"),
    W("tem", "em", "thư", "têm", "kem", "ta", null, null),
    W("thềm", "êm", "nhà", "thèm", "mềm", "thề", null, null),
    W("nếm", "êm", "ăn", "ném", "đếm", "nó", null, null),
    W("tủm", "um", "hé", null, null, "tủ", null, null),
    W("chụm", "um", "xa", null, "tụm", null, null, null),
    W("mềm", "êm", "thô", null, "thềm", "mè", null, null),
    W("tìm", "im", "mò", null, "chìm", "tì", null, null),
    W("túm", "um", "nắm", null, "cúm", "tú", null, null),
  ],
  phrases: [
    "tem thư",
    "thềm nhà",
    "tủm tỉm",
    "Đêm qua nó bị ốm",
    "Chim ri cần cù tìm cỏ khô",
    "đem cho nó túm rơm",
  ],
  writeSets: [
    ["tem thư", "thềm nhà"],
    ["tủm tỉm", "chim"],
    ["đêm", "kem", "tìm"],
  ],
});

pack(38, "88–89", "ai ay ây", "VIET.HV.VAN_AI_AY_AAY", "viet-vanai", {
  note: "Bài 38: ai, ay, ây. Từ của sách: bài, lái, nảy, tay, đậy, chùm vải, máy cày, đám mây; câu 'Hai bạn thi nhảy dây'. Ô gần giống: i/y (hai / hay, tai / tay) và a/â (tay / tây, máy / mấy) — đúng hai chỗ con hay nhìn nhầm.",
  words: [
    W("máy", "ay", "xe", "mấy", "cháy", "má", "🚜", "máy cày", "robot"),
    W("mây", "ây", "gió", "may", "cây", "mơ", "☁️", "đám mây", "garden"),
    W("hai", "ai", "ba", "hay", "mai", "hè", "2️⃣", "số hai", "robot"),
    W("tay", "ay", "chân", "tây", "bay", "ta", "✋", "bàn tay", "garden"),
    W("vải", "ai", "cam", "vảy", "cải", "vả", null, null),
    W("dây", "ây", "nơ", "day", "cây", "dê", null, null),
    W("bài", "ai", "vở", "bày", "tài", "bà", null, null),
    W("lái", "ai", "đi", "láy", "hái", "lá", null, null),
    W("nảy", "ay", "lăn", null, "chảy", "nở", null, null),
    W("đậy", "ây", "mở", null, "dậy", "độ", null, null),
    W("gai", "ai", "lá", "gay", "tai", "ga", null, null),
    W("thấy", "ây", "nghe", null, "mấy", "thế", null, null),
  ],
  phrases: [
    "chùm vải",
    "máy cày",
    "đám mây",
    "Hai bạn thi nhảy dây",
    "Nai con nhìn thấy con gì bé nhỏ",
    "Nó chạy về nhà",
  ],
  writeSets: [
    ["chùm vải", "đám mây"],
    ["máy cày", "nhảy dây"],
    ["hai", "tay", "thấy"],
  ],
});

pack(39, "90–91", "oi ôi ơi", "VIET.HV.VAN_OI_OOI_OWI", "viet-vanoi", {
  note: "Bài 39: oi, ôi, ơi. Từ của sách: chòi, hỏi, mỗi, xôi, đợi, mới, chim bói cá, thổi còi, đồ chơi; câu 'Voi con mời bạn đi xem hội'. Ô gần giống là cặp o/ô/ơ cùng dấu (voi / vơi, đợi / đội, mới / mối).",
  words: [
    W("voi", "oi", "hổ", "vơi", "coi", "vo", "🐘", "con voi", "garden"),
    W("chơi", "ơi", "nghỉ", null, "bơi", null, "🧸", "đồ chơi", "robot"),
    W("còi", "oi", "kèn", null, "đòi", "cò", null, null),
    W("xôi", "ôi", "cơm", "xơi", "nôi", "xô", null, null),
    W("hỏi", "oi", "kể", "hổi", "gỏi", null, null, null),
    W("mỗi", "ôi", "hai", null, "lỗi", "mũ", null, null),
    W("đợi", "ơi", "chờ", "đội", "gợi", null, null, null),
    W("mới", "ơi", "cũ", "mối", "tới", "má", null, null),
    W("chòi", "oi", "nhà", "chồi", "còi", "chè", null, null),
    W("thổi", "ôi", "ca", null, "nổi", "thả", null, null),
    W("hội", "ôi", "chợ", "hợi", "vội", "hộ", null, null),
    W("mời", "ơi", "gọi", "mồi", "rời", "mờ", null, null),
  ],
  phrases: [
    "chim bói cá",
    "thổi còi",
    "đồ chơi",
    "Voi con mời bạn đi xem hội",
    "Mẹ ơi",
    "Mẹ ôm Hà rồi nói",
  ],
  writeSets: [["thổi còi", "đồ chơi"], ["chim bói cá"], ["voi", "mời", "hội"]],
});
