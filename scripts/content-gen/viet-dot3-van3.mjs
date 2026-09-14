/**
 * Đợt 3, lô D4 — Tiếng Việt: vần bài 41–44 (ui ưi · ao eo · au âu êu · iu ưu).
 * Cùng quy ước với `viet-dot3-van1.mjs`. Trang sách: 41 tr.94–95 · 42 tr.96–97 · 43 tr.98–99 · 44 tr.100–101.
 * Các vần này ít cặp "gần giống" có nghĩa (ui/ưi, iu/ưu gần như không có cặp thật), nên ô nhiễu chủ yếu
 * là khác âm đầu và khác vần — không bịa tiếng cho đủ cặp.
 *
 *   node scripts/content-gen/viet-dot3-van3.mjs
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

pack(41, "94–95", "ui ưi", "VIET.HV.VAN_UI_UWI", "viet-vanui", {
  note: "Bài 41: ui, ưi. Từ của sách: bùi, mũi, sủi, cửi, gửi, ngửi, dãy núi, bụi cỏ, gửi thư; bài đọc 'Lan gửi thư cho Hà kể về quê Lan…'. Câu nhận biết 'Bà gửi cho Hà túi kẹo' không dùng — vần eo tới bài 42.",
  words: [
    W("núi", "ui", "đồi", null, "túi", "nó", "⛰️", "dãy núi", "garden"),
    W("túi", "ui", "giỏ", null, "núi", "tú", "👜", "cái túi", "robot"),
    W("gửi", "ưi", "nhận", null, "ngửi", "gỡ", "✉️", "gửi thư", "robot"),
    W("mũi", "ui", "tai", null, "cũi", "mũ", "👃", "cái mũi", "garden"),
    W("bụi", "ui", "cỏ", null, "cụi", "bụ", null, null),
    W("cửi", "ưi", "vải", "củi", "gửi", "cử", null, null),
    W("ngửi", "ưi", "nếm", null, "gửi", "ngủ", null, null),
    W("bùi", "ui", "chua", null, "lùi", "bù", null, null),
    W("sủi", "ui", "tan", null, "củi", "sủa", null, null),
    W("vui", "ui", "lo", null, "xui", "vua", null, null),
    W("củi", "ui", "rơm", "cửi", "tủi", "củ", null, null),
    W("lui", "ui", "đi", null, "vui", "lu", null, null),
  ],
  phrases: [
    "dãy núi",
    "bụi cỏ",
    "gửi thư",
    "Lan gửi thư cho Hà",
    "Ở đó có nhà sàn nằm ven đồi",
    "Lan mời Hà lên thăm quê Lan",
  ],
  writeSets: [
    ["dãy núi", "gửi thư"],
    ["bụi cỏ", "túi"],
    ["ngửi", "mũi", "vui"],
  ],
});

pack(42, "96–97", "ao eo", "VIET.HV.VAN_AO_EO", "viet-vanao", {
  note: "Bài 42: ao, eo. Từ của sách: chào, dao, sáo, dẻo, kẹo, ngôi sao, quả táo, cái kẹo, ao bèo; bài đọc 'Trên cây cao, đàn chào mào bay đi, bay lại…'. Câu nhận biết 'Ao thu lạnh lẽo nước trong veo' không dùng — vần anh, ươc, ong chưa học.",
  words: [
    W("sao", "ao", "mây", null, "cao", "sa", "⭐", "ngôi sao", "garden"),
    W("táo", "ao", "lê", null, "sáo", "tá", "🍎", "quả táo", "garden"),
    W("kẹo", "eo", "chè", null, null, "kệ", "🍬", "cái kẹo", "robot"),
    W("mèo", "eo", "chó", null, "bèo", "mè", "🐱", "con mèo", "garden"),
    W("bèo", "eo", "sen", null, "mèo", "bè", null, null),
    W("dao", "ao", "kéo", null, "bao", "da", null, null),
    W("chào", "ao", "tạm", null, "vào", "chà", null, null),
    W("dẻo", "eo", "giòn", null, "kẻo", null, null, null),
    W("mào", "ao", "cổ", null, "nào", "mà", null, null),
    W("cao", "ao", "lùn", null, "sao", "ca", null, null),
    W("véo", "eo", "lăn", null, "kéo", "vé", null, null),
    W("léo", "eo", "tay", null, "khéo", "lá", null, null),
  ],
  phrases: [
    "ngôi sao",
    "quả táo",
    "cái kẹo",
    "ao bèo",
    "Trên cây cao đàn chào mào bay đi bay lại",
    "Chú tha rơm khô về khéo léo làm tổ",
  ],
  writeSets: [
    ["ngôi sao", "ao bèo"],
    ["quả táo", "cái kẹo"],
    ["chào", "mèo", "cao"],
  ],
});

pack(43, "98–99", "au âu êu", "VIET.HV.VAN_AU_AAU_EEU", "viet-vanau", {
  note: "Bài 43: au, âu, êu. Từ của sách: cau, tàu, bậu, gấu, khều, rêu, rau củ, con trâu, chú tễu; bài đọc 'Nhà dì Tư ở quê có cây cau, giàn trầu…'. Ô gần giống là cặp a/â cùng dấu (rau / râu, cau / câu, sâu / sau). Câu nhận biết bỏ 'ríu rít' — vần iu, it chưa học.",
  words: [
    W("trâu", "âu", "bò", null, "sâu", "tre", "🐃", "con trâu", "garden"),
    W("rau", "au", "cá", "râu", "cau", "ra", "🥬", "rau cải", "garden"),
    W("gấu", "âu", "hổ", null, "cấu", "gái", "🐻", "con gấu", "garden"),
    W("cầu", "âu", "phà", null, "đầu", "cà", "🌉", "cây cầu", "robot"),
    W("tàu", "au", "xe", null, "màu", "tò", null, null),
    W("cau", "au", "dừa", "câu", "rau", "ca", null, null),
    W("rêu", "êu", "cỏ", null, "kêu", "ra", null, null),
    W("khều", "êu", "gẩy", null, "lều", null, null, null),
    W("bậu", "âu", "ngồi", null, "đậu", "bộ", null, null),
    W("sâu", "âu", "cạn", "sau", "râu", "sa", null, null),
    W("kêu", "êu", "ca", null, "rêu", "kê", null, null),
    W("hấu", "âu", "lê", null, "gấu", "hái", null, null),
  ],
  phrases: [
    "rau củ",
    "con trâu",
    "chú tễu",
    "Nhà dì Tư ở quê có cây cau",
    "Sau nhà có rau cải rau dền và cả dưa hấu",
    "Gần nhà dì có cây cầu tre nhỏ",
  ],
  writeSets: [
    ["con trâu", "chú tễu"],
    ["rau củ", "cây cau"],
    ["gấu", "kêu", "sâu"],
  ],
});

pack(44, "100–101", "iu ưu", "VIET.HV.VAN_IU_UWU", "viet-vaniu", {
  note: "Bài 44: iu, ưu. Từ của sách: dịu, địu, xíu, hưu, mưu, lựu, cái rìu, cái địu, quả lựu, con cừu; bài đọc 'Bà đã nghỉ hưu… Lời bà dịu êm.' Câu nhận biết bỏ 'luôn' — vần uôn tới bài 68.",
  words: [
    W("rìu", "iu", "dao", null, "dìu", "rì", "🪓", "cái rìu", "robot"),
    W("cừu", "ưu", "dê", null, null, "cừ", "🐑", "con cừu", "garden"),
    W("lựu", "ưu", "táo", null, "tựu", "lạ", null, null),
    W("địu", "iu", "bế", null, "dịu", null, null, null),
    W("hưu", "ưu", "làm", null, "mưu", "hư", null, null),
    W("dịu", "iu", "êm", null, "bịu", "dạ", null, null),
    W("xíu", "iu", "to", null, "níu", "xí", null, null),
    W("mưu", "ưu", "kế", null, "hưu", "mưa", null, null),
    W("cứu", "ưu", "đỡ", null, null, "cứ", null, null),
    W("chịu", "iu", "khó", null, "dịu", "chị", null, null),
    W("níu", "iu", "kéo", null, "xíu", "nó", null, null),
    W("bưu", "ưu", "thư", null, "hưu", "bơ", null, null),
  ],
  phrases: [
    "cái rìu",
    "cái địu",
    "quả lựu",
    "con cừu",
    "Bà đã nghỉ hưu",
    "Lời bà dịu êm",
    "bà hay kể về ngày xưa",
  ],
  writeSets: [
    ["cái rìu", "quả lựu"],
    ["con cừu", "nghỉ hưu"],
    ["dịu", "xíu", "cứu"],
  ],
});
