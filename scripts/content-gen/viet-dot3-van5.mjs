/**
 * Đợt 3, lô D6 — Tiếng Việt: vần bài 51–54 (et êt it · ut ưt · ap ăp âp · op ôp ơp).
 * Cùng quy ước với `viet-dot3-van1.mjs`. Trang sách: 51 tr.114–115 · 52 tr.116–117 · 53 tr.118–119 ·
 * 54 tr.120–121.
 *
 * Vần ap/op cần chữ p đứng một mình. Bảng tiến trình chữ trong `tieng-viet-progression.ts` ghi bài 26
 * chỉ dạy "ph", nên mọi tiếng có p cuối bị chặn — trong khi SGK tr.64 in "p – ph". Đợt 3 sửa bảng đó
 * (thêm "p" vào bài 26, có test) để các gói này nạp được.
 *
 *   node scripts/content-gen/viet-dot3-van5.mjs
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

pack(51, "114–115", "et êt it", "VIET.HV.VAN_ET_EET_IT", "viet-vanet", {
  note: "Bài 51: et, êt, it. Từ của sách: két, sét, vẹt, dệt, nết, tết, lít, mít, vịt, con vẹt, bồ kết, quả mít; bài đọc 'Tết đến thật gần. Cái rét vẫn đậm…'. Câu nhận biết không dùng — vần ông, uyên chưa học. Ô gần giống là cặp e/ê cùng dấu (vẹt / vệt, rét / rết, dệt / dẹt).",
  words: [
    W("vẹt", "et", "sáo", "vệt", "mẹt", "vẹo", "🦜", "con vẹt", "garden"),
    W("vịt", "it", "gà", null, "thịt", "vị", "🦆", "con vịt", "garden"),
    W("mít", "it", "na", null, "hít", "mí", null, null),
    W("kết", "êt", "gội", "két", "hết", "kế", null, null),
    W("tết", "êt", "hè", "tét", "hết", "tế", null, null),
    W("rét", "et", "nực", "rết", "hét", null, null, null),
    W("dệt", "êt", "may", "dẹt", "mệt", null, null, null),
    W("nết", "êt", "tài", "nét", "tết", "nó", null, null),
    W("chít", "it", "thưa", null, "mít", "chí", null, null),
    W("lít", "it", "cân", null, "hít", "lá", null, null),
    W("sét", "et", "mưa", null, "két", "số", null, null),
    W("hết", "êt", "còn", "hét", "kết", "hố", null, null),
  ],
  phrases: [
    "con vẹt",
    "bồ kết",
    "quả mít",
    "Tết đến thật gần",
    "Cái rét vẫn đậm",
    "Mấy cây đào đã chi chít lộc non",
  ],
  writeSets: [
    ["con vẹt", "quả mít"],
    ["bồ kết", "ngày tết"],
    ["vịt", "rét", "dệt"],
  ],
});

pack(52, "116–117", "ut ưt", "VIET.HV.VAN_UT_UWT", "viet-vanut", {
  note: "Bài 52: ut, ưt. Từ của sách: bụt, hụt, lụt, sụt, dứt, mứt, nứt, sứt, bút chì, mứt dừa, nứt nẻ; bài đọc 'Trận đấu thật gay cấn…'. Câu đọc bỏ chữ số '7' (bộ chấm đọc so từng tiếng). Ô gần giống là cặp u/ư cùng dấu (mứt / mút, sút / sứt, bút / bứt).",
  words: [
    W("bút", "ut", "vở", "bứt", "hút", "bú", "✏️", "bút chì", "robot"),
    W("sút", "ut", "đá", "sứt", "hút", "số", "⚽", "cú sút", "robot"),
    W("mứt", "ưt", "kẹo", "mút", "nứt", null, null, null),
    W("nứt", "ưt", "vỡ", "nút", "sứt", "nó", null, null),
    W("lụt", "ut", "khô", null, "bụt", "lạ", null, null),
    W("hụt", "ut", "đủ", null, "sụt", "họ", null, null),
    W("dứt", "ưt", "nối", null, "bứt", "dế", null, null),
    W("phút", "ut", "giờ", null, "hút", "phố", null, null),
    W("bụt", "ut", "ma", null, "lụt", "bụ", null, null),
    W("sứt", "ưt", "mẻ", "sút", "nứt", "sứ", null, null),
    W("bứt", "ưt", "cắt", "bút", "dứt", null, null, null),
    W("hút", "ut", "thổi", null, "bút", "hú", null, null),
  ],
  phrases: [
    "bút chì",
    "mứt dừa",
    "nứt nẻ",
    "Trận đấu thật gay cấn",
    "cầu thủ sút xa",
    "Khán giả hò reo nhảy múa",
  ],
  writeSets: [
    ["bút chì", "mứt dừa"],
    ["nứt nẻ", "cú sút"],
    ["phút", "lụt", "hút"],
  ],
});

pack(53, "118–119", "ap ăp âp", "VIET.HV.VAN_AP_AWP_AAP", "viet-vanap", {
  note: "Bài 53: ap, ăp, âp. Từ của sách: rạp, sạp, tháp, bắp, cặp, gặp, đập, mập, nấp, xe đạp, cặp da, cá mập; câu 'Khắp phố tấp nập'. 'đến lớp' bỏ khỏi câu đọc — vần ơp là bài 54. Ô gần giống là cặp a/ă/â cùng dấu (đạp / đập, gặp / gập, nấp / nắp).",
  words: [
    W("đạp", "ap", "lái", "đập", "sạp", "độ", "🚲", "xe đạp", "robot"),
    W("cặp", "ăp", "túi", "cập", "gặp", "cụ", "💼", "cặp da", "robot"),
    W("mập", "âp", "gầy", null, "đập", "mẹ", "🦈", "cá mập", "garden"),
    W("bắp", "ăp", "lạc", null, "sắp", "bé", "🌽", "bắp ngô", "garden"),
    W("tháp", "ap", "cầu", "thắp", "sáp", "thế", null, null),
    W("gặp", "ăp", "chào", "gập", "cặp", "gọi", null, null),
    W("nấp", "âp", "tìm", "nắp", "tấp", "nó", null, null),
    W("rạp", "ap", "phố", "rập", "sạp", "rạ", null, null),
    W("sạp", "ap", "chợ", "sập", "rạp", "sợ", null, null),
    W("khắp", "ăp", "gần", null, "sắp", "khá", null, null),
    W("hấp", "âp", "rán", null, "tấp", "hái", null, null),
    W("đập", "âp", "xây", "đạp", "tập", "độ", null, null),
  ],
  phrases: ["xe đạp", "cặp da", "cá mập", "Mẹ đạp xe đưa Hà", "Khắp phố tấp nập", "đầy ắp sắc màu"],
  writeSets: [
    ["xe đạp", "cá mập"],
    ["cặp da", "tấp nập"],
    ["gặp", "nấp", "khắp"],
  ],
});

pack(54, "120–121", "op ôp ơp", "VIET.HV.VAN_OP_OOP_OWP", "viet-vanop", {
  note: "Bài 54: op, ôp, ơp. Từ của sách: cọp, góp, họp, hộp, tốp, xốp, hợp, lớp, lợp, con cọp, lốp xe, tia chớp; bài đọc 'Mưa rào lộp độp. Họ nhà nhái tụ họp thi hát…'. Câu nhận biết không dùng — vần êch, iêng chưa học. Ô gần giống là cặp o/ô/ơ cùng dấu (họp / hộp, lốp / lớp, chớp / chộp).",
  words: [
    W("cọp", "op", "voi", "cộp", "họp", "cọ", "🐅", "con cọp", "garden"),
    W("lốp", "ôp", "xe", "lớp", "tốp", "lá", "🛞", "lốp xe", "robot"),
    W("chớp", "ơp", "sét", "chộp", "lớp", "chớ", "⚡", "tia chớp", "garden"),
    W("hộp", "ôp", "túi", "họp", "lộp", "hộ", "📦", "cái hộp", "robot"),
    W("họp", "op", "chơi", "hộp", "cọp", "họ", null, null),
    W("góp", "op", "chia", "gộp", "cóp", null, null, null),
    W("xốp", "ôp", "rắn", null, "tốp", "xứ", null, null),
    W("lớp", "ơp", "nhà", "lốp", "chớp", "lá", null, null),
    W("đớp", "ơp", "nhai", null, "chớp", "đá", null, null),
    W("hợp", "ơp", "tan", "hộp", "lợp", "hạ", null, null),
    W("tốp", "ôp", "đàn", null, "xốp", "tá", null, null),
    W("lợp", "ơp", "xây", "lộp", "hợp", "lạ", null, null),
  ],
  phrases: [
    "con cọp",
    "lốp xe",
    "tia chớp",
    "Mưa rào lộp độp",
    "Họ nhà nhái tụ họp thi hát",
    "Đàn cá cờ lóp ngóp bơi đến",
  ],
  writeSets: [
    ["lốp xe", "tia chớp"],
    ["con cọp", "cái hộp"],
    ["họp", "lớp", "góp"],
  ],
});
