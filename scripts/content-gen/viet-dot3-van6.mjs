/**
 * Đợt 3, lô D7 — Tiếng Việt: vần bài 56–59 (ep êp ip up · anh ênh inh · ach êch ich · ang ăng âng).
 * Cùng quy ước với `viet-dot3-van1.mjs`. Trang sách: 56 tr.124–125 · 57 tr.126–127 · 58 tr.128–129 ·
 * 59 tr.130–131.
 *
 * Với anh/ang, ô "khác vần" cố ý là vần n cuối cùng âm đầu (chanh / chan, làng / làn, kính / kín) —
 * đúng lỗi trẻ đọc sót "nh", "ng" cuối.
 *
 *   node scripts/content-gen/viet-dot3-van6.mjs
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

pack(56, "124–125", "ep êp ip up", "VIET.HV.VAN_EP_EEP_IP_UP", "viet-vanep", {
  note: "Bài 56: ep, êp, ip, up. Từ của sách: kẹp, nếp, xếp, kịp, nhịp, búp, giúp, đôi dép, đầu bếp, bìm bịp, búp sen; bài đọc 'Dịp nghỉ lễ, nhà Hà có chú Tư và cô Lan đến chơi…'. Câu nhận biết không dùng — vần ong chưa học.",
  words: [
    W("dép", "ep", "giày", null, "chép", "dế", "🩴", "đôi dép", "garden"),
    W("bếp", "êp", "nhà", null, "nếp", "bé", "🍳", "nhà bếp", "robot"),
    W("búp", "up", "nụ", null, "súp", "bú", "🪷", "búp sen", "garden"),
    W("nếp", "êp", "tẻ", "nép", "xếp", "nó", null, null),
    W("kẹp", "ep", "ghim", null, "dẹp", "kẹo", null, null),
    W("kịp", "ip", "trễ", null, "nhịp", "kệ", null, null),
    W("giúp", "up", "nhờ", null, "búp", "giá", null, null),
    W("xếp", "êp", "bày", "xép", "nếp", "xé", null, null),
    W("nhịp", "ip", "đều", null, "kịp", "nhẹ", null, null),
    W("chép", "ep", "đọc", null, "dép", "chú", null, null),
    W("súp", "up", "cháo", null, "búp", "số", null, null),
    W("dịp", "ip", "ngày", null, "kịp", "dạ", null, null),
  ],
  phrases: [
    "đôi dép",
    "đầu bếp",
    "bìm bịp",
    "búp sen",
    "Mẹ nấu súp gà cơm nếp và rán cá chép",
    "Hà giúp mẹ sắp xếp bát đĩa",
  ],
  writeSets: [
    ["đôi dép", "búp sen"],
    ["đầu bếp", "bìm bịp"],
    ["giúp", "xếp", "kịp"],
  ],
});

pack(57, "126–127", "anh ênh inh", "VIET.HV.VAN_ANH_EENH_INH", "viet-vananh", {
  note: "Bài 57: anh, ênh, inh. Từ của sách: chanh, mảnh, cạnh, kênh, lệnh, kính, chỉnh, thịnh, quả chanh, bờ kênh, kính râm; bài đọc 'Nhà vịt ở gần một con kênh xinh xinh…'. Ô khác vần là vần n cùng âm đầu (chanh / chan, cạnh / cạn, kính / kín) — lỗi đọc sót nh cuối.",
  words: [
    W("chanh", "anh", "cam", null, "xanh", "chan", "🍋", "quả chanh", "garden"),
    W("kính", "inh", "mũ", null, "tính", "kín", "🕶️", "kính râm", "robot"),
    W("kênh", "ênh", "hồ", null, "bênh", "kê", null, null),
    W("cạnh", "anh", "giữa", null, "mạnh", "cạn", null, null),
    W("mảnh", "anh", "to", null, "cảnh", "mải", null, null),
    W("lệnh", "ênh", "xin", null, "bệnh", "lệ", null, null),
    W("xinh", "inh", "xấu", null, "tinh", "xin", null, null),
    W("nhanh", "anh", "chậm", null, "xanh", "nha", null, null),
    W("chỉnh", "inh", "sửa", null, "tỉnh", "chỉ", null, null),
    W("thịnh", "inh", "nghèo", null, "định", "thị", null, null),
    W("cánh", "anh", "lá", null, "nhánh", "cán", null, null),
    W("tính", "inh", "đếm", null, "kính", "tín", null, null),
  ],
  phrases: [
    "quả chanh",
    "bờ kênh",
    "kính râm",
    "Nhà vịt ở gần một con kênh xinh xinh",
    "bố mẹ cho vịt con ra kênh tập bơi",
    "Mới tập mà vịt con đã bơi rất nhanh",
  ],
  writeSets: [
    ["quả chanh", "bờ kênh"],
    ["kính râm", "xinh xinh"],
    ["nhanh", "cạnh", "lệnh"],
  ],
});

pack(58, "128–129", "ach êch ich", "VIET.HV.VAN_ACH_EECH_ICH", "viet-vanach", {
  note: "Bài 58: ach, êch, ich. Từ của sách: vách, tách, sạch, chếch, lệch, bích, xích, kịch, sách vở, chênh lệch, tờ lịch; câu 'Ếch con thích đọc sách'; bài thơ 'Ếch cốm'. 'ếch' không có âm đầu nên chỉ có trong câu đọc, câu viết.",
  words: [
    W("sách", "ach", "vở", null, "cách", "sáo", "📕", "quyển sách", "robot"),
    W("lịch", "ich", "sổ", null, "kịch", "lạ", "📅", "tờ lịch", "robot"),
    W("tách", "ach", "chén", null, "vách", "tá", "☕", "cái tách", "robot"),
    W("lệch", "êch", "ngay", null, "chệch", "lệ", null, null),
    W("sạch", "ach", "bẩn", null, "mạch", "sợ", null, null),
    W("xích", "ich", "dây", null, "thích", "xé", null, null),
    W("kịch", "ich", "phim", null, "lịch", "kệ", null, null),
    W("thích", "ich", "ghét", null, "xích", "thế", null, null),
    W("vách", "ach", "mái", null, "tách", "vá", null, null),
    W("chếch", "êch", "ngay", null, "mếch", "chế", null, null),
    W("bích", "ich", "đỏ", null, "tích", "bí", null, null),
    W("nghịch", "ich", "lành", null, "kịch", "nghệ", null, null),
  ],
  phrases: [
    "sách vở",
    "chênh lệch",
    "tờ lịch",
    "Ếch con thích đọc sách",
    "Tinh nghịch nấp bờ ao",
    "Mải rình bắt cào cào",
  ],
  writeSets: [["sách vở", "tờ lịch"], ["chênh lệch"], ["ếch", "thích", "sạch"]],
});

pack(59, "130–131", "ang ăng âng", "VIET.HV.VAN_ANG_AWNG_AANG", "viet-vanang", {
  note: "Bài 59: ang, ăng, âng. Từ của sách: làng, rạng, sáng, bằng, rặng, tầng, vâng, cá vàng, măng tre, nhà tầng; câu 'Vầng trăng sáng lấp ló sau rặng tre'; bài thơ 'Mèo con đi học'. Ô gần giống: a/ă/â cùng dấu (vàng / vầng, rặng / rạng, vâng / vang); ô khác vần là vần n (làng / làn, trăng / trăn).",
  words: [
    W("vàng", "ang", "đỏ", "vầng", "làng", "vàn", "🐠", "cá vàng", "garden"),
    W("tầng", "âng", "lầu", null, "vầng", "tìm", "🏢", "nhà tầng", "robot"),
    W("trăng", "ăng", "sao", null, "măng", "trăn", "🌙", "vầng trăng", "garden"),
    W("măng", "ăng", "rau", null, "trăng", "mây", null, null),
    W("làng", "ang", "phố", null, "hàng", "làn", null, null),
    W("sáng", "ang", "tối", null, "tráng", "sáo", null, null),
    W("bằng", "ăng", "gỗ", "bàng", "hằng", "bà", null, null),
    W("rặng", "ăng", "cây", "rạng", "nặng", "rạ", null, null),
    W("vâng", "âng", "dạ", "vang", "tâng", "vô", null, null),
    W("nắng", "ăng", "mưa", null, "trắng", "nấu", null, null),
    W("chang", "ang", "oi", null, "mang", "chan", null, null),
    W("mang", "ang", "xách", null, "chang", "may", null, null),
  ],
  phrases: [
    "cá vàng",
    "măng tre",
    "nhà tầng",
    "Vầng trăng sáng lấp ló sau rặng tre",
    "Hôm nay trời nắng chang chang",
    "Chỉ mang một cái bút chì",
  ],
  writeSets: [
    ["cá vàng", "măng tre"],
    ["nhà tầng", "vầng trăng"],
    ["nắng", "làng", "vâng"],
  ],
});
