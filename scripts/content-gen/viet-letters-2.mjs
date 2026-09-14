/**
 * Học vần bài 16–24 — thứ lớp 1B3 học trong tuần 4–5 (nhật ký lớp ngày 12/09 ghi bài 13, tuần này
 * lớp sang bài 14–19). Mười một gói: bảy gói âm, hai gói vần, hai gói phân biệt dễ nhầm.
 *
 * Từ ngữ lấy **đúng trang sách** (ảnh trang SGK Tiếng Việt 1 tập một, trang sách = ảnh PDF − 1):
 *   bài 16 tr.44–45 · 17 tr.46–47 · 18 tr.48–49 · 19 tr.50–51 · 21 tr.54–55 · 22 tr.56–57 ·
 *   23 tr.58–59 · 24 tr.60–61.
 * Câu đọc to là câu mục "4 Đọc" của từng bài ("Mẹ nhờ Hà bê ghế nhỏ", "Nghé đã no cỏ"…), bỏ dấu
 * phẩy vì bộ chấm đọc so từng tiếng.
 *
 * Khuôn `letterPack` dùng chung với bài 7–12, đã sửa lỗi "ô nhiễu cũng chứa âm đang hỏi"
 * (`audit-has-letter.mjs`).
 *
 *   node scripts/content-gen/viet-letters-2.mjs
 */
import { letterPack, W } from "./lib-viet-letters.mjs";
import { pairPack } from "./lib-viet-pairs.mjs";

const am = (l) => `âm ${l}`;
const van = (l) => `vần ${l}`;
/** Ô "gần giống" mang mã riêng thay cho nhìn nhầm con chữ. */
const Wt = (tag, ...args) => ({ ...W(...args), nearTag: tag });
const src = (n, pages, title) => `SGK Tiếng Việt 1 tập một, Bài ${n} tr.${pages} (${title})`;

letterPack({
  code: "VIET.HV.AM_M_N",
  prefix: "viet-ammn",
  letterLabel: am,
  lessonRefs: ["KNTT-TV1-T1-B16"],
  lessonUnitCode: "KNTT-TV1-T1-B16",
  src: src(16, "44–45", "M m, N n"),
  note: "Bài 16: M m, N n. Từ của sách: má, mẹ, mỡ, na, nề, nở, cá mè, lá me, nơ đỏ, ca nô. Câu 'Mẹ mua nơ cho Hà' không dùng được — vần ua tới bài 24 mới học.",
  words: [
    W("mẹ", "m", "bà", null, "bẹ", "má", "👩", "mẹ", "garden"),
    W("nơ", "n", "cá", "nô", "bơ", "na", "🎀", "cái nơ", "garden"),
    W("me", "m", "bi", "mê", "đe", "mơ", "🌿", "lá me", "garden"),
    W("mò", "m", "hồ", "mờ", "bò", "mà", null, null),
    W("nở", "n", "cỏ", "nổ", "bở", "nỉ", null, null),
    W("nề", "n", "lá", "nè", "lề", "no", null, null),
    W("má", "m", "cô", null, "cá", "mẹ", null, null),
    W("mỡ", "m", "dê", null, "đỡ", "mũ", null, null),
    W("nô", "n", "hè", "nơ", "cô", "no", "🚤", "ca nô", "robot"),
    W("mũ", "m", "cá", null, "lũ", "mỡ", "🧢", "cái mũ", "robot"),
    W("nổ", "n", "bé", "nở", "cổ", "nỉ", null, null),
    W("na", "n", "bé", null, "ca", "nơ", null, null),
  ],
  phrases: ["Bố mẹ cho Hà đi ca nô", "cá mè", "nơ đỏ", "mẹ có nơ đỏ", "Mẹ bế bé ở bờ hồ"],
  writeSets: [
    ["mẹ", "nơ", "me"],
    ["cá mè", "nơ đỏ", "ca nô"],
    ["mũ", "mỡ", "nở"],
  ],
});

letterPack({
  code: "VIET.HV.AM_G_GI",
  prefix: "viet-amggi",
  letterLabel: am,
  lessonRefs: ["KNTT-TV1-T1-B17"],
  lessonUnitCode: "KNTT-TV1-T1-B17",
  src: src(17, "46–47", "G g, Gi gi"),
  note: "Bài 17: G g, Gi gi. Cặp nhiễu chính là g ↔ gi (gà / già, gỗ / giỗ, gò / giò): cùng vần, khác âm đầu, nên mã là nham_am_dau. 'giò' có âm gi chứ không có âm g.",
  words: [
    Wt("nham_am_dau", "gà", "g", "bò", "già", "cà", "gỗ", "🐔", "con gà", "garden"),
    Wt("nham_am_dau", "già", "gi", "bé", "gà", "bà", "giò", "👴", "cụ già", "garden"),
    Wt("nham_am_dau", "gỗ", "g", "lá", "giỗ", "đỗ", "gà", "🪵", "đồ gỗ", "robot"),
    W("giỏ", "gi", "cá", null, "đỏ", "giá", "🧺", "cái giỏ", "garden"),
    W("gió", "gi", "hè", null, "có", "giá", "🌬️", "cơn gió", "garden"),
    W("giá", "gi", "bò", null, "cá", "giò", "🌱", "giá đỗ", "garden"),
    Wt("nham_am_dau", "gò", "g", "kể", "giò", "cò", "gà", null, null),
    W("gụ", "g", "hổ", null, "cụ", "gõ", null, null),
    Wt("nham_am_dau", "giỗ", "gi", "bé", "gỗ", "đỗ", "giò", null, null),
    W("ga", "g", "lê", null, "ca", "gô", null, null),
    Wt("nham_am_dau", "giò", "gi", "cá", "gò", "cò", "già", null, null),
    W("gõ", "g", "dê", null, "mõ", "gà", null, null),
  ],
  phrases: ["Bà che gió cho ba chú gà", "gà gô", "đồ gỗ", "giá đỗ", "Cụ già có giỏ gà"],
  writeSets: [
    ["gà gô", "giá đỗ"],
    ["giỏ", "gió", "gỗ"],
    ["cụ già", "đồ gỗ"],
  ],
});

letterPack({
  code: "VIET.HV.AM_GH_NH",
  prefix: "viet-amghnh",
  letterLabel: am,
  lessonRefs: ["KNTT-TV1-T1-B18"],
  lessonUnitCode: "KNTT-TV1-T1-B18",
  src: src(18, "48–49", "Gh gh, Nh nh"),
  note: "Bài 18: Gh gh, Nh nh. Từ của sách: ghẹ, ghế, ghi, nhà, nhẹ, nhỏ, ghế đá, ghẹ đỏ, nhà gỗ, lá nho. Quy tắc gh/g có gói riêng (VIET.HV.NHAM_LAN_NG_NGH_G_GH).",
  words: [
    W("ghế", "gh", "bà", null, "kế", "ghẹ", "🪑", "cái ghế", "robot"),
    W("ghẹ", "gh", "cá", null, "bẹ", "ghế", "🦀", "con ghẹ", "garden"),
    W("nhà", "nh", "cô", null, "bà", "nhỏ", "🏠", "ngôi nhà", "robot"),
    W("nho", "nh", "bé", "nhô", "lo", "nhà", "🍇", "chùm nho", "garden"),
    W("nhỏ", "nh", "hồ", null, "đỏ", "nhà", null, null),
    W("ghi", "gh", "cá", null, "đi", "ghế", null, null),
    W("nhẹ", "nh", "cô", null, "mẹ", "nhà", null, null),
    W("nhờ", "nh", "bé", null, "bờ", "nhà", null, null),
    W("ghé", "gh", "cô", null, "bé", "ghi", null, null),
    W("nhớ", "nh", "cá", null, "cớ", "nho", null, null),
    W("nhổ", "nh", "bà", null, "cổ", "nhà", null, null),
    W("nhè", "nh", "cá", null, "bè", "nhà", null, null),
  ],
  phrases: ["Mẹ nhờ Hà bê ghế nhỏ", "ghế đá", "ghẹ đỏ", "nhà gỗ", "lá nho"],
  writeSets: [
    ["ghế", "ghẹ", "ghi"],
    ["nhà", "nho", "nhỏ"],
    ["ghế đá", "lá nho"],
  ],
});

letterPack({
  code: "VIET.HV.AM_NG_NGH",
  prefix: "viet-amngngh",
  letterLabel: am,
  lessonRefs: ["KNTT-TV1-T1-B19"],
  lessonUnitCode: "KNTT-TV1-T1-B19",
  src: src(19, "50–51", "Ng ng, Ngh ngh"),
  note: "Bài 19: Ng ng, Ngh ngh. 'nghé' có âm ngh chứ không có âm ng — bộ soát âm đọc theo âm, không theo con chữ, nên câu 'Tiếng nào có âm ng?' không bao giờ nhận 'nghé'.",
  words: [
    W("ngõ", "ng", "bà", null, "gõ", "ngã", null, null),
    W("nghé", "ngh", "cá", null, "ghé", "nghe", "🐃", "con nghé", "garden"),
    W("ngủ", "ng", "bé", null, "củ", "ngõ", "😴", "bé ngủ", "garden"),
    W("nghệ", "ngh", "cá", null, "bệ", "nghe", null, null),
    W("ngã", "ng", "hồ", null, "đã", "ngõ", null, null),
    W("nghe", "ngh", "cô", null, "ghe", "nghé", null, null),
    W("nghỉ", "ngh", "bà", null, "chỉ", "nghe", null, null),
    W("ngà", "ng", "bé", null, "gà", "ngõ", null, null),
    W("nghĩ", "ngh", "cá", null, "kĩ", "nghé", null, null),
    W("ngô", "ng", "bé", "ngơ", "cô", "ngà", "🌽", "bắp ngô", "garden"),
    W("ngơ", "ng", "lá", "ngô", "bơ", "ngủ", null, null),
    W("nghề", "ngh", "lá", null, "bề", "nghé", null, null),
  ],
  phrases: ["Nghé đã no cỏ", "Nghé ngủ ở bờ đê", "ngã ba", "ngõ nhỏ", "củ nghệ", "nghỉ hè"],
  writeSets: [
    ["ngõ", "ngủ", "ngô"],
    ["nghé", "nghe", "nghỉ"],
    ["ngã ba", "củ nghệ"],
  ],
});

letterPack({
  code: "VIET.HV.AM_R_S",
  prefix: "viet-amrs",
  letterLabel: am,
  lessonRefs: ["KNTT-TV1-T1-B21"],
  lessonUnitCode: "KNTT-TV1-T1-B21",
  src: src(21, "54–55", "R r, S s"),
  note: "Bài 21: R r, S s. Từ của sách: ra, rạ, rế, rổ, sẻ, sả, sẽ, sò, rổ rá, cá rô, su su, chữ số. 'Bầy sẻ non ríu rít' không dùng được — vần on, iu, it chưa học.",
  words: [
    W("rổ", "r", "bà", null, "cổ", "rá", "🧺", "cái rổ", "garden"),
    W("rô", "r", "cá", null, "cô", "ra", "🐟", "cá rô", "garden"),
    W("su", "s", "bé", null, "cu", "sò", null, null),
    W("số", "s", "hè", null, "cố", "sẽ", "🔢", "chữ số", "robot"),
    W("sò", "s", "cá", null, "cò", "sả", "🐚", "con sò", "garden"),
    W("rá", "r", "hồ", null, "cá", "rổ", null, null),
    W("rế", "r", "cô", null, "kế", "rạ", null, null),
    W("sả", "s", "lê", null, "cả", "sò", null, null),
    W("sẽ", "s", "bò", null, "đẽ", "số", null, null),
    W("rạ", "r", "bé", null, "mạ", "rế", null, null),
    W("rễ", "r", "cá", null, "dễ", "rá", null, null),
    W("sổ", "s", "nhà", null, "cổ", "số", null, null),
  ],
  phrases: ["Chợ có cả rổ rá", "rổ rá", "cá rô", "su su", "Bé có chữ số"],
  writeSets: [
    ["rổ rá", "su su"],
    ["rá", "rế", "sò"],
    ["cá rô", "chữ số"],
  ],
});

letterPack({
  code: "VIET.HV.AM_T_TR",
  prefix: "viet-amttr",
  letterLabel: am,
  lessonRefs: ["KNTT-TV1-T1-B22"],
  lessonUnitCode: "KNTT-TV1-T1-B22",
  src: src(22, "56–57", "T t, Tr tr"),
  note: "Bài 22: T t, Tr tr. Ô gần giống của tiếng có tr là tiếng ch cùng vần (tre / che, trà / chà) — tiếng thật, mang mã nham_ch_tr.",
  words: [
    W("tô", "t", "bà", null, "cô", "tá", null, null),
    Wt("nham_ch_tr", "tre", "tr", "cá", "che", "đe", "trê", "🎋", "cây tre", "garden"),
    W("tử", "t", "bé", null, "cử", "tủ", "🦁", "sư tử", "garden"),
    Wt("nham_ch_tr", "trê", "tr", "cô", "chê", "bê", "trò", "🐟", "cá trê", "garden"),
    W("tủ", "t", "hè", null, "củ", "tá", "🗄️", "cái tủ", "robot"),
    Wt("nham_ch_tr", "trò", "tr", "bé", "chò", "bò", "trê", null, null),
    W("tá", "t", "hồ", null, "cá", "tô", null, null),
    W("trổ", "tr", "bà", null, "cổ", "trò", null, null),
    W("tạ", "t", "cô", null, "mạ", "tủ", null, null),
    Wt("nham_ch_tr", "trí", "tr", "cá", "chí", "bí", "trò", null, null),
    W("tẻ", "t", "lá", null, "bẻ", "tô", null, null),
    Wt("nham_ch_tr", "trà", "tr", "bé", "chà", "cà", "trê", "🍵", "trà", "garden"),
  ],
  phrases: ["Hà tả hồ cá", "Hồ to có cá trê", "ô tô", "sư tử", "tre ngà"],
  writeSets: [
    ["ô tô", "cá trê"],
    ["tô", "tủ", "tá"],
    ["tre", "trê", "trò"],
  ],
});

letterPack({
  code: "VIET.HV.AM_TH",
  prefix: "viet-amth",
  letterLabel: am,
  lessonRefs: ["KNTT-TV1-T1-B23"],
  lessonUnitCode: "KNTT-TV1-T1-B23",
  src: src(23, "58–59", "Th th, ia"),
  note: "Bài 23: Th th. Từ của sách: thẻ, thọ, thơ, thủ đô, lá thư, thìa đĩa. Ô nhiễu 'hư' cho 'thư' đúng lỗi nghe sót chữ t đầu.",
  words: [
    W("thỏ", "th", "bà", null, "cỏ", "thơ", "🐇", "con thỏ", "garden"),
    W("thư", "th", "cá", null, "hư", "thơ", "✉️", "lá thư", "robot"),
    W("thìa", "th", "bé", null, "chìa", "thì", "🥄", "cái thìa", "garden"),
    W("thẻ", "th", "cô", null, "bẻ", "thỏ", null, null),
    W("thọ", "th", "hè", null, "họ", "thẻ", null, null),
    W("thơ", "th", "cá", "thô", "bơ", "thư", null, null),
    W("thủ", "th", "bé", null, "củ", "thỏ", null, null),
    W("thả", "th", "hồ", null, "cả", "thỏ", null, null),
    W("thi", "th", "bò", null, "đi", "thơ", null, null),
    W("thợ", "th", "lá", null, "mợ", "thọ", null, null),
    W("thề", "th", "cá", null, "bề", "thỏ", null, null),
    W("thu", "th", "bé", null, "cu", "thơ", null, null),
  ],
  phrases: ["Bé chia thìa chia đĩa cho cả nhà", "thủ đô", "lá thư", "thìa đĩa", "Thỏ có cỏ"],
  writeSets: [
    ["thỏ", "thư", "thìa"],
    ["thủ đô", "lá thư"],
    ["thẻ", "thọ", "thơ"],
  ],
});

letterPack({
  code: "VIET.HV.VAN_IA",
  prefix: "viet-vania",
  letterLabel: van,
  lessonRefs: ["KNTT-TV1-T1-B23"],
  lessonUnitCode: "KNTT-TV1-T1-B23",
  src: src(23, "58–59", "Th th, ia"),
  note: "Bài 23: vần ia. Từ của sách: đĩa, mía, thìa, chia, lá tía tô. Câu hỏi 'có vần ia' chỉ dùng ô nhiễu cùng âm đầu khác vần (thìa / thì) — tiếng cùng vần khác âm đầu cũng có ia nên bị loại.",
  words: [
    W("thìa", "ia", "cá", null, "chìa", "thì", "🥄", "cái thìa", "garden"),
    W("đĩa", "ia", "bé", null, "dĩa", "đá", "🍽️", "cái đĩa", "robot"),
    W("mía", "ia", "hồ", null, "tía", "mí", null, null),
    W("chia", "ia", "cô", null, "kia", "chè", null, null),
    W("tía", "ia", "lá", null, "mía", "tá", "🌿", "lá tía tô", "garden"),
    W("kìa", "ia", "bà", null, "lìa", "kì", null, null),
    W("bia", "ia", "hè", null, "chia", "bi", null, null),
    W("chìa", "ia", "cá", null, "thìa", "chì", null, null),
    W("lìa", "ia", "bé", null, "kìa", "lì", null, null),
    W("tỉa", "ia", "cô", null, "đỉa", "tủ", null, null),
    W("rìa", "ia", "bò", null, "kìa", "rổ", null, null),
    W("dĩa", "ia", "hồ", null, "đĩa", "dì", null, null),
  ],
  phrases: [
    "Bé chia thìa chia đĩa cho cả nhà",
    "thìa đĩa",
    "lá tía tô",
    "Thìa đĩa to cho bố mẹ",
    "Thìa đĩa nhỏ cho bé",
  ],
  writeSets: [
    ["chia", "thìa", "đĩa"],
    ["mía", "tía", "kìa"],
    ["thìa đĩa", "lá tía tô"],
  ],
});

letterPack({
  code: "VIET.HV.VAN_UA_UWA",
  prefix: "viet-vanua",
  letterLabel: van,
  lessonRefs: ["KNTT-TV1-T1-B24"],
  lessonUnitCode: "KNTT-TV1-T1-B24",
  src: src(24, "60–61", "ua, ưa"),
  note: "Bài 24: ua, ưa. Cặp gần giống cua / cưa, mua / mưa, chua / chưa, lúa / lứa đều là tiếng thật, chỉ khác u và ư — đúng mã nham_chu_gan_giong.",
  words: [
    W("cua", "ua", "cá", "cưa", "mua", "cô", "🦀", "con cua", "garden"),
    W("mưa", "ưa", "bé", "mua", "dưa", "mơ", "🌧️", "trời mưa", "garden"),
    W("rùa", "ua", "hồ", null, "mùa", "rổ", "🐢", "con rùa", "garden"),
    W("dứa", "ưa", "lá", null, "sứa", "dế", "🍍", "quả dứa", "garden"),
    W("cửa", "ưa", "bà", "của", "sửa", "cổ", "🚪", "cái cửa", "robot"),
    W("đũa", "ua", "cô", null, null, "đủ", "🥢", "đôi đũa", "robot"),
    W("sữa", "ưa", "bé", null, "bữa", "số", "🥛", "hộp sữa", "robot"),
    W("chua", "ua", "hè", "chưa", "cua", "chè", "🍅", "cà chua", "garden"),
    W("múa", "ua", "cá", null, "lúa", "mũ", null, null),
    W("dưa", "ưa", "bò", null, "cưa", "dê", null, null),
    W("mua", "ua", "bé", "mưa", "cua", "mẹ", null, null),
    W("lúa", "ua", "cô", "lứa", "múa", "lá", null, null),
  ],
  phrases: ["Mẹ đi chợ mua cá mua cua", "Mẹ mua cả sữa chua dưa lê", "cà chua", "cửa sổ", "múa ô"],
  writeSets: [
    ["cua", "rùa", "đũa"],
    ["cửa", "dứa", "sữa"],
    ["cà chua", "dưa lê"],
  ],
});

// ═══════════════════════════════════════════════════════════════════════════════════════════
// Hai gói phân biệt dễ nhầm
// ═══════════════════════════════════════════════════════════════════════════════════════════
const CHTR = (right, wrong, pic, gloss) => [right, wrong, "nham_ch_tr", pic, gloss, "tr", "ch"];
const TRCH = (right, wrong, pic, gloss) => [right, wrong, "nham_ch_tr", pic, gloss, "ch", "tr"];

pairPack({
  code: "VIET.HV.NHAM_LAN_CH_TR",
  prefix: "viet-chtr",
  lessonRefs: ["KNTT-TV1-T1-B14", "KNTT-TV1-T1-B22"],
  unit: "KNTT-TV1-T1-B22",
  source: "SGK Tiếng Việt 1 tập một, Bài 14 tr.40 và Bài 22 tr.56 (ch, tr)",
  note: "Phân biệt ch và tr. Mọi cặp đều là hai tiếng thật cùng vần (tre / che, trà / chà, chợ / trợ) — không có tiếng bịa như đợt 1 từng mắc (lỗi #9).",
  spelling: false,
  pairs: [
    CHTR("tre", "che", "🎋", "cây tre"),
    CHTR("trà", "chà", "🍵", "chén trà"),
    TRCH("chị", "trị", "👧", "chị"),
    CHTR("trí", "chí", null, null),
    TRCH("chợ", "trợ", "🏪", "cái chợ"),
    CHTR("trê", "chê", "🐟", "cá trê"),
    TRCH("chì", "trì", "✏️", "bút chì"),
    CHTR("trò", "chò", null, null),
    TRCH("chở", "trở", null, null),
    CHTR("trú", "chú", null, null),
    TRCH("chữ", "trữ", "🔤", "chữ cái"),
    CHTR("trẻ", "chẻ", "👶", "trẻ nhỏ"),
    TRCH("chả", "trả", null, null),
  ],
  sorts: [
    ["Có âm ch", "Có âm tr", ["che", "chợ"], ["tre", "trò"], "nham_ch_tr"],
    ["Có âm tr", "Có âm ch", ["trà", "trí"], ["chà", "chị"], "nham_ch_tr"],
    ["Có âm ch", "Có âm tr", ["chì", "chữ"], ["trê", "trẻ"], "nham_ch_tr"],
    ["Có âm tr", "Có âm ch", ["trú", "trở"], ["chú", "chở"], "nham_ch_tr"],
  ],
  sortHint: "Đọc to từng thẻ, nghe âm đầu là ch hay tr.",
  phrases: ["Hà tô tre", "Chị có chè", "Bà đi chợ", "trẻ nhỏ đi trú"],
  writeSets: [
    ["tre", "che", "trà"],
    ["chợ", "chị", "chữ"],
    ["trê", "trò", "trẻ"],
  ],
  rubricRule: "Viết đúng ch hay tr",
});

const NGH = (right, wrong, pic, gloss) => [right, wrong, "nham_ng_ngh", pic, gloss];
const GH = (right, wrong, pic, gloss) => [right, wrong, "nham_g_gh", pic, gloss];

pairPack({
  code: "VIET.HV.NHAM_LAN_NG_NGH_G_GH",
  prefix: "viet-ngngh",
  lessonRefs: ["KNTT-TV1-T1-B17", "KNTT-TV1-T1-B18", "KNTT-TV1-T1-B19"],
  unit: "KNTT-TV1-T1-B19",
  source: "SGK Tiếng Việt 1 tập một, Bài 17–19 tr.46–51 (g, gh, ng, ngh)",
  note: "Quy tắc chính tả: ngh và gh chỉ đứng trước e, ê, i; còn lại viết ng và g. Ô sai là lỗi chính tả thật của trẻ ('ngé', 'gế', 'ghà') — gói này tồn tại để con nhận ra chúng.",
  spelling: true,
  pairs: [
    NGH("nghé", "ngé", "🐃", "con nghé"),
    NGH("ngõ", "nghõ", null, null),
    GH("ghế", "gế", "🪑", "cái ghế"),
    GH("gà", "ghà", "🐔", "con gà"),
    NGH("nghe", "nge", null, null),
    NGH("ngủ", "nghủ", null, null),
    GH("ghẹ", "gẹ", "🦀", "con ghẹ"),
    GH("gỗ", "ghỗ", null, null),
    NGH("nghỉ", "ngỉ", null, null),
    NGH("ngô", "nghô", "🌽", "bắp ngô"),
    GH("ghé", "gé", null, null),
    GH("gò", "ghò", null, null),
    NGH("nghệ", "ngệ", null, null),
    NGH("ngà", "nghà", null, null),
  ],
  sorts: [
    ["Viết ngh", "Viết ng", ["nghé", "nghe"], ["ngõ", "ngủ"], "nham_ng_ngh"],
    ["Viết gh", "Viết g", ["ghế", "ghẹ"], ["gà", "gỗ"], "nham_g_gh"],
    ["Viết ng", "Viết ngh", ["ngô", "ngà"], ["nghỉ", "nghệ"], "nham_ng_ngh"],
    ["Viết g", "Viết gh", ["gò", "ga"], ["ghé", "ghi"], "nham_g_gh"],
    ["Viết ngh", "Viết ng", ["nghĩ", "nghề"], ["ngã", "ngơ"], "nham_ng_ngh"],
  ],
  sortHint: "Nhìn chữ đứng sau: e, ê, i thì viết ngh hoặc gh.",
  ruleHints: [
    ["Nhìn con chữ đứng sau âm đầu.", "Trước e, ê, i thì viết ngh hoặc gh."],
    ["Có chữ e, ê hay i ngay sau không?"],
    ["Nhớ luật: ngh, gh đi với e, ê, i."],
  ],
  why: (right) =>
    /^(ngh|gh)/.test(right)
      ? "Đứng trước e, ê, i nên viết thêm h."
      : "Không đứng trước e, ê, i nên không viết h.",
  phrases: ["Nghé ngủ ở bờ đê", "Mẹ nhờ Hà bê ghế nhỏ", "ngõ nhỏ", "ghế gỗ", "nghỉ hè"],
  writeSets: [
    ["nghé", "ngõ", "ngủ"],
    ["ghế", "gà", "gỗ"],
    ["nghe", "ghi", "ngô"],
  ],
  rubricRule: "Viết đúng ng/ngh, g/gh theo luật",
});
