/**
 * Pha 6c, lô A6 — Tiếng Việt: 16 bài vần trống của tuần 13–16 (bài 61–79, trang 134–171), đúng nội
 * dung đã quét từ sách: ong/ông/ung/ưng (61) · iêc/iên/iêp (62) · iêng/iêm/yên (63) · iêt/iêu/yêu (64)
 * · uôi/uôm (66) · uôc/uôt (67) · uôn/uông (68) · ươi/ươu (69) · ươc/ươt (71) · ươm/ươp (72) ·
 * ươn/ương (73) · oa/oe (74) · oan/oăn/oat/oăt (76) · oai/uê/uy (77) · uân/uât (78) · uyên/uyêt (79).
 *
 * Cùng quy ước với viet-dot3-van1..6.mjs (letterPack). Để tránh lỗi ghép âm đầu/vần sai (mã lỗi phải
 * đúng nghĩa theo packages/content/src/error-semantics.ts), `onset`/`rime` của mỗi từ được suy ra
 * **tự động** bằng `splitSyllable` thay vì gõ tay: onset-partner = từ khác trong cùng bài có cùng
 * vần khác âm đầu; rime-partner = từ khác cùng âm đầu khác vần, hoặc một từ nền an toàn (âm đơn giản
 * đã học từ trước bài 60) khi bài chỉ có một âm đầu. `without` luôn là "và" (âm "a" đơn giản, chắc
 * chắn không chứa vần đang học, không vi phạm tieng-viet-progression.ts).
 *
 *   node scripts/content-gen/viet-dot4-van.mjs
 */
import { letterPack, W } from "./lib-viet-letters.mjs";
import { bare, splitSyllable } from "./vn-units.mjs";

/**
 * Tách âm đầu/vần **giữ nguyên dấu thanh** — đúng như `onsetRime()` trong error-semantics.ts dùng để
 * chấm mã nham_am_dau_viet/doc_nham_van. Khác với `splitSyllable` (vn-units.mjs, bỏ dấu) dùng cho việc
 * "tiếng này có vần X không". Hai tiếng chỉ được coi là "cùng vần khác âm đầu" khi vần **kể cả dấu**
 * giống hệt nhau (kiến/điện khác dấu sắc/nặng nên KHÔNG phải một cặp nham_am_dau_viet hợp lệ).
 */
const ONSETS = ["ngh", "ng", "nh", "ch", "gh", "gi", "kh", "ph", "qu", "th", "tr"];
function onsetRimeToned(syllable) {
  const s = syllable.toLowerCase();
  const b = bare(s);
  const multi = ONSETS.find((o) => b.startsWith(o));
  const len = multi ? multi.length : /^[a-zăâêôơưđ]/.test(b) && !/^[aăâeêioôơuưy]/.test(b) ? 1 : 0;
  return { onset: s.slice(0, len), rime: s.slice(len) };
}

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

/** Âm đầu → một tiếng thật, an toàn (âm đơn giản đã học trước bài 60), dùng khi bài chỉ có 1 âm đầu. */
const SAFE_RIME = {
  "": "ơi",
  b: "ba",
  c: "ca",
  ch: "cha",
  d: "da",
  đ: "đi",
  g: "gà",
  gi: "già",
  h: "hồ",
  k: "kia",
  kh: "kho",
  l: "la",
  m: "ma",
  n: "na",
  ng: "ngô",
  ngh: "nghe",
  nh: "nhà",
  ph: "phở",
  qu: "qua",
  r: "ra",
  s: "sa",
  t: "ta",
  th: "tha",
  tr: "tra",
  v: "va",
  x: "xa",
};

/**
 * entries: [w, vầnNhãn, pic?, gloss?, theme?][]. Tự tính onset/rime bằng splitSyllable nên luôn
 * đúng mã lỗi (nham_am_dau_viet cần cùng vần khác âm đầu; doc_nham_van cần cùng âm đầu khác vần).
 */
function autoWords(entries) {
  const parsed = entries.map(([w, letter, pic, gloss, theme]) => {
    const toned = onsetRimeToned(w);
    const bareOnset = splitSyllable(w).onset;
    return {
      w,
      letter,
      onset: toned.onset,
      rime: toned.rime,
      bareOnset,
      pic: pic ?? null,
      gloss: gloss ?? null,
      theme: theme ?? null,
    };
  });
  return parsed.map((word) => {
    // nham_am_dau_viet đòi vần *kể cả dấu* giống hệt, âm đầu khác — chỉ ghép khi tìm được, không đoán.
    const onsetPartner = parsed.find(
      (o) => o !== word && o.rime === word.rime && o.onset !== word.onset,
    );
    // doc_nham_van đòi âm đầu (không dấu) giống, vần khác — dùng bareOnset vì onsetRimeToned tách âm
    // đầu không phụ thuộc dấu thanh (dấu nằm ở nguyên âm), nên so bareOnset là đủ và an toàn hơn.
    const rimePartner = parsed.find(
      (o) => o !== word && o.bareOnset === word.bareOnset && o.rime !== word.rime,
    );
    const rimeFallback = SAFE_RIME[word.bareOnset] ?? "ơi";
    return W(
      word.w,
      word.letter,
      "và",
      null,
      onsetPartner ? onsetPartner.w : null,
      rimePartner ? rimePartner.w : rimeFallback,
      word.pic,
      word.gloss,
      word.theme,
    );
  });
}
/** Gán `near` (nham_chu_gan_giong) cho các từ có cặp thật sự chỉ khác 1 chữ cùng họ (o/ô/ơ, u/ư, a/ă/â). */
function withNear(words, pairs) {
  const byWord = new Map(words.map((w) => [w.w, w]));
  for (const [target, near] of pairs) {
    const w = byWord.get(target);
    if (w) w.near = near;
  }
  return words;
}

// ─────────────────────────────────────────────────────── bài 61: ong ông ung ưng ──────────────
{
  const words = autoWords([
    ["trong", "ong"],
    ["dòng", "ong"],
    ["võng", "ong"],
    ["bổng", "ông"],
    ["cộng", "ông"],
    ["sông", "ông"],
    ["thúng", "ung", "🧺", "cái thúng", "garden"],
    ["vũng", "ung"],
    ["đụng", "ung"],
    ["mừng", "ưng"],
    ["chưng", "ưng", "🎍", "bánh chưng", "robot"],
    ["sừng", "ưng"],
  ]);
  withNear(words, [
    ["trong", "trông"],
    ["bổng", "bóng"],
  ]);
  pack(61, "134–135", "ong ông ung ưng", "VIET.HV.VAN_ONG_OONG_UNG_UWNG", "viet-vanong", {
    note: "Bài 61: ong, ông, ung, ưng. Từ của sách: chong chóng, bông súng, bánh chưng, dòng, võng, bổng, cộng, thúng, vũng, đụng. Ô 'gần giống' dùng đúng cặp o/ô (trong/trông) và u/ư (mừng/mường) theo mã nham_chu_gan_giong; onset/rime suy tự động nên luôn đúng nghĩa.",
    words,
    phrases: [
      "chong chóng",
      "bông súng",
      "bánh chưng",
      "Nam theo mẹ đi chợ",
      "Chợ đông vui và bán đủ thứ",
      "Nam thích lắm",
    ],
    writeSets: [["chong chóng", "bông súng"], ["bánh chưng"], ["dòng", "võng", "thúng"]],
  });
}

// ─────────────────────────────────────────────────────── bài 62: iêc iên iêp ──────────────────
{
  const words = autoWords([
    ["biếc", "iêc"],
    ["xiếc", "iêc"],
    ["tiệc", "iêc"],
    ["thiếc", "iêc"],
    ["điện", "iên", "💡", "bóng điện", "robot"],
    ["kiến", "iên", "🐜", "con kiến", "garden"],
    ["thiện", "iên"],
    ["biển", "iên", "🌊", "bờ biển", "garden"],
    ["điệp", "iêp"],
    ["thiếp", "iêp", "💌", "tấm thiếp", "robot"],
    ["diệp", "iêp"],
  ]);
  pack(62, "136–137", "iêc iên iêp", "VIET.HV.VAN_IEEC_IEEN_IEEP", "viet-vaniec", {
    note: "Bài 62: iêc, iên, iêp. Từ của sách: xanh biếc, bờ biển, sò điệp, thiếc, tiệc, xiếc, điện, kiến, thiện, diệp, thiếp. Ba vần chỉ khác phụ âm cuối (c/n/p) nên không có ô 'gần giống'; onset/rime suy tự động từ chính các từ trong bài.",
    words,
    phrases: [
      "xanh biếc",
      "bờ biển",
      "sò điệp",
      "Vịnh Hạ Long là một kì quan thiên nhiên",
      "Nơi đây có những hòn đảo lớn nhỏ",
      "Du khách thích đến đây ngắm cảnh",
    ],
    writeSets: [["xanh biếc", "bờ biển"], ["sò điệp"], ["điện", "kiến", "thiếc"]],
  });
}

// ─────────────────────────────────────────────────────── bài 63: iêng iêm yên ─────────────────
{
  const words = autoWords([
    ["riêng", "iêng", "🍈", "sầu riêng", "garden"],
    ["liệng", "iêng"],
    ["kiễng", "iêng"],
    ["kiếm", "iêm", "🐟", "cá kiếm", "garden"],
    ["diễm", "iêm"],
    ["kiểm", "iêm"],
    ["chiêm", "iêm"],
    ["yến", "yên", "🐦", "tổ yến", "robot"],
    ["yên", "yên"],
  ]);
  pack(63, "138–139", "iêng iêm yên", "VIET.HV.VAN_IEENG_IEEM_YEEN", "viet-vanieng", {
    note: "Bài 63: iêng, iêm, yên. Từ của sách: sầu riêng, cá kiếm, tổ yến, kiễng, liệng, riềng, diễm, kiểm, xiêm. Không có ô 'gần giống' (khác phụ âm cuối); onset/rime suy tự động. 'yên/yến' chỉ khác dấu thanh nên không dùng làm cặp âm đầu/vần của nhau.",
    words,
    phrases: [
      "sầu riêng",
      "cá kiếm",
      "tổ yến",
      "Hà theo bố đến sân chim",
      "Hà chăm chú nhìn những đàn cò trắng",
      "Trông thật yên bình",
    ],
    writeSets: [["sầu riêng", "cá kiếm"], ["tổ yến"], ["riêng", "kiếm", "yên"]],
  });
}

// ─────────────────────────────────────────────────────── bài 64: iêt iêu yêu ──────────────────
{
  const words = autoWords([
    ["biết", "iêt"],
    ["viết", "iêt", "✏️", "cây viết", "robot"],
    ["nhiệt", "iêt", "🌡️", "nhiệt kế", "robot"],
    ["diều", "iêu", "🪁", "con diều", "garden"],
    ["kiểu", "iêu"],
    ["chiều", "iêu"],
    ["diễu", "iêu"],
    ["yêu", "yêu"],
    ["yếu", "yêu"],
  ]);
  pack(64, "140–141", "iêt iêu yêu", "VIET.HV.VAN_IEET_IEEU_YEEU", "viet-vaniet", {
    note: "Bài 64: iêt, iêu, yêu. Từ của sách: nhiệt kế, con diều, yêu chiều, chiết, viết, việt, chiều, diễu, kiểu. Không có ô 'gần giống'; onset/rime suy tự động. 'yêu/yếu' chỉ khác dấu thanh nên không dùng làm cặp của nhau.",
    words,
    phrases: [
      "nhiệt kế",
      "con diều",
      "yêu chiều",
      "Bố cho Nam và em chơi thả diều",
      "Nam biết cách vừa chạy vừa kéo căng dây",
      "Hai anh em thích thú ngắm nhìn",
    ],
    writeSets: [["nhiệt kế", "con diều"], ["yêu chiều"], ["biết", "viết", "yêu"]],
  });
}

// ─────────────────────────────────────────────────────── bài 66: uôi uôm ──────────────────────
{
  const words = autoWords([
    ["suối", "uôi", "🏞️", "con suối", "garden"],
    ["muối", "uôi"],
    ["buổi", "uôi"],
    ["tuổi", "uôi"],
    ["nguội", "uôi"],
    ["muỗm", "uôm", "🥭", "quả muỗm", "garden"],
    ["buồm", "uôm", "⛵", "cánh buồm", "robot"],
    ["nhuộm", "uôm"],
    ["nhuốm", "uôm"],
  ]);
  pack(66, "144–145", "uôi uôm", "VIET.HV.VAN_UOOI_UOOM", "viet-vanuoi", {
    note: "Bài 66: uôi, uôm. Từ của sách: con suối, buổi sáng, quả muỗm, muối, buồm, muỗi, nguội, nhuốm, tuổi, nhuộm. Không có ô 'gần giống' (khác phụ âm cuối); onset/rime suy tự động.",
    words,
    phrases: [
      "con suối",
      "buổi sáng",
      "quả muỗm",
      "Buổi sớm mai ông mặt trời nhô lên từ biển",
      "Mặt biển sáng lấp lánh",
      "Xa xa là những cánh buồm căng gió",
    ],
    writeSets: [["con suối", "buổi sáng"], ["quả muỗm"], ["muối", "buồm", "tuổi"]],
  });
}

// ─────────────────────────────────────────────────────── bài 67: uôc uôt ──────────────────────
{
  const words = autoWords([
    ["đuốc", "uôc", "🔥", "ngọn đuốc", "robot"],
    ["cuốc", "uôc"],
    ["thuộc", "uôc"],
    ["ruốc", "uôc"],
    ["thuốc", "uôc", "💊", "viên thuốc", "robot"],
    ["chuột", "uôt", "🐭", "con chuột", "garden"],
    ["buốt", "uôt"],
    ["muốt", "uôt"],
    ["ruột", "uôt"],
    ["tuột", "uôt"],
  ]);
  pack(67, "146–147", "uôc uôt", "VIET.HV.VAN_UOOC_UOOT", "viet-vanuoc", {
    note: "Bài 67: uôc, uôt. Từ của sách: ngọn đuốc, viên thuốc, con chuột, cuốc, buốt, luộc, muốt, ruốc, ruột, thuộc, tuột. Không có ô 'gần giống'; onset/rime suy tự động.",
    words,
    phrases: [
      "ngọn đuốc",
      "viên thuốc",
      "con chuột",
      "Mẹ cho Hà đi công viên",
      "Cô bé rất thích thú và háo hức",
      "Mẹ còn vuốt tóc và buộc nơ cho Hà",
    ],
    writeSets: [["ngọn đuốc", "viên thuốc"], ["con chuột"], ["cuốc", "thuộc", "buốt"]],
  });
}

// ─────────────────────────────────────────────────────── bài 68: uôn uông ─────────────────────
{
  const words = autoWords([
    ["cuộn", "uôn", "🧵", "cuộn chỉ", "robot"],
    ["muốn", "uôn"],
    ["khuôn", "uôn"],
    ["muộn", "uôn"],
    ["nguồn", "uôn"],
    ["chuồng", "uông"],
    ["buồng", "uông", "🍌", "buồng chuối", "garden"],
    ["chuông", "uông", "🔔", "quả chuông", "robot"],
    ["vuông", "uông"],
    ["luống", "uông"],
  ]);
  pack(68, "148–149", "uôn uông", "VIET.HV.VAN_UOON_UOONG", "viet-vanuon", {
    note: "Bài 68: uôn, uông. Từ của sách: cuộn chỉ, buồng chuối, quả chuông, khuôn, buồng, muốn, luống, muộn, thuổng, nguồn, vuông. Không có ô 'gần giống'; onset/rime suy tự động.",
    words,
    phrases: [
      "cuộn chỉ",
      "buồng chuối",
      "quả chuông",
      "Trời sắp mưa",
      "Chuồn chuồn bay thấp",
      "Bầu trời trong xanh, không khí mát mẻ",
    ],
    writeSets: [["cuộn chỉ", "buồng chuối"], ["quả chuông"], ["muốn", "khuôn", "vuông"]],
  });
}

// ─────────────────────────────────────────────────────── bài 69: ươi ươu ──────────────────────
{
  const words = autoWords([
    ["cười", "ươi", "😊", "tươi cười", "garden"],
    ["bưởi", "ươi", "🍈", "quả bưởi", "garden"],
    ["lưới", "ươi"],
    ["người", "ươi"],
    ["mười", "ươi"],
    ["hươu", "ươu"],
    ["khướu", "ươu"],
    ["bướu", "ươu"],
    ["rượu", "ươu"],
  ]);
  pack(69, "150–151", "ươi ươu", "VIET.HV.VAN_UOWI_UOWU", "viet-vanuoi2", {
    note: "Bài 69: ươi, ươu. Từ của sách: tươi cười, quả bưởi, ốc bươu, bưởi, bướu, cười, hươu, lưới, khướu, mười, rượu. Không có ô 'gần giống'; onset/rime suy tự động.",
    words,
    phrases: [
      "tươi cười",
      "quả bưởi",
      "ốc bươu",
      "Lạc đà là con vật đặc biệt",
      "Nó có cái bướu to trên lưng",
      "Lạc đà giúp con người băng qua sa mạc",
    ],
    writeSets: [["tươi cười", "quả bưởi"], ["ốc bươu"], ["cười", "hươu", "người"]],
  });
}

// ─────────────────────────────────────────────────────── bài 71: ươc ươt ──────────────────────
{
  const words = autoWords([
    ["thước", "ươc", "📏", "thước kẻ", "robot"],
    ["nước", "ươc"],
    ["được", "ươc"],
    ["bước", "ươc"],
    ["ngược", "ươc"],
    ["lướt", "ươt", "🏄", "lướt ván", "robot"],
    ["mượt", "ươt"],
    ["mướt", "ươt"],
    ["lượt", "ươt"],
  ]);
  pack(71, "154–155", "ươc ươt", "VIET.HV.VAN_UOWC_UOWT", "viet-vanuoc2", {
    note: "Bài 71: ươc, ươt. Từ của sách: thước kẻ, dược sĩ, lướt ván, bước, lướt, lược, lượt, ngược, mướt, nước, mượt. Không có ô 'gần giống'; onset/rime suy tự động.",
    words,
    phrases: [
      "thước kẻ",
      "dược sĩ",
      "lướt ván",
      "Lúc học hát, Nam ước làm ca sĩ",
      "Nam ước là người lái tàu",
      "Nam tự hỏi bao giờ mình mới lớn",
    ],
    writeSets: [["thước kẻ", "dược sĩ"], ["lướt ván"], ["nước", "được", "bước"]],
  });
}

// ─────────────────────────────────────────────────────── bài 72: ươm ươp ──────────────────────
{
  const words = autoWords([
    ["bướm", "ươm", "🦋", "con bướm", "garden"],
    ["gươm", "ươm"],
    ["lượm", "ươm"],
    ["chườm", "ươm"],
    ["mướp", "ươp", "🥒", "giàn mướp", "garden"],
    ["ướp", "ươp"],
    ["nượp", "ươp"],
  ]);
  pack(72, "156–157", "ươm ươp", "VIET.HV.VAN_UOWM_UOWP", "viet-vanuom", {
    note: "Bài 72: ươm, ươp. Từ của sách: con bướm, nườm nượp, giàn mướp, chườm, lượm, đượm, gươm, ướm, ướp. Không có ô 'gần giống'; onset/rime suy tự động.",
    words,
    phrases: [
      "con bướm",
      "nườm nượp",
      "giàn mướp",
      "Nắng vàng ươm như mật trải khắp sân",
      "Chú mèo mướp thảnh thơi nằm sưởi nắng",
      "Sưởi nắng giúp mèo dẻo dai hơn",
    ],
    writeSets: [["con bướm", "nườm nượp"], ["giàn mướp"], ["gươm", "lượm", "ướp"]],
  });
}

// ─────────────────────────────────────────────────────── bài 73: ươn ương ─────────────────────
{
  const words = autoWords([
    ["vườn", "ươn", "🌳", "khu vườn", "garden"],
    ["lươn", "ươn"],
    ["rướn", "ươn"],
    ["vượn", "ươn"],
    ["sườn", "ươn"],
    ["sương", "ương", "💧", "hạt sương", "garden"],
    ["hướng", "ương"],
    ["đường", "ương", "🛤️", "con đường", "garden"],
    ["phượng", "ương"],
    ["tưởng", "ương"],
  ]);
  pack(73, "158–159", "ươn ương", "VIET.HV.VAN_UOWN_UOWNG", "viet-vanuon2", {
    note: "Bài 73: ươn, ương. Từ của sách: khu vườn, hạt sương, con đường, lươn, hướng, rướn, phượng, sườn, sương, vượn, tưởng. Không có ô 'gần giống'; onset/rime suy tự động.",
    words,
    phrases: [
      "khu vườn",
      "hạt sương",
      "con đường",
      "Buổi sáng, tiếng gà gọi mặt trời thức dậy",
      "Nắng xua tan màn sương",
      "Em tới lớp, mẹ đi làm",
    ],
    writeSets: [["khu vườn", "hạt sương"], ["con đường"], ["lươn", "hướng", "sườn"]],
  });
}

// ─────────────────────────────────────────────────────── bài 74: oa oe ────────────────────────
{
  const words = autoWords([
    ["hoa", "oa", "🌹", "đoá hoa", "garden"],
    ["hoà", "oa"],
    ["toả", "oa"],
    ["xoá", "oa"],
    ["loa", "oa"],
    ["xoè", "oe", "👗", "váy xoè", "robot"],
    ["loe", "oe"],
    ["choè", "oe", "🐦", "chích choè", "garden"],
    ["khoẻ", "oe"],
    ["loé", "oe"],
  ]);
  pack(74, "160–161", "oa oe", "VIET.HV.VAN_OA_OE", "viet-vanoa", {
    note: "Bài 74: oa, oe. Từ của sách: đoá hoa, váy xoè, chích choè, hoà, khoẻ, loa, loe, toả, loé, xoá, xoè. Không có cặp 'gần giống' (a/e khác họ); onset/rime suy tự động.",
    words,
    phrases: [
      "đoá hoa",
      "váy xoè",
      "chích choè",
      "Tết đến, hoa đào khoe sắc hồng tươi",
      "Hoa mai vàng nở rộ",
      "Những sắc hoa làm đẹp thêm cho cuộc sống",
    ],
    writeSets: [["đoá hoa", "váy xoè"], ["chích choè"], ["hoa", "hoà", "khoẻ"]],
  });
}

// ─────────────────────────────────────────────── bài 76: oan oăn oat oăt ──────────────────────
{
  const words = autoWords([
    ["khoan", "oan"],
    ["toán", "oan"],
    ["xoan", "oan", "🌸", "hoa xoan", "garden"],
    ["ngoan", "oan"],
    ["xoăn", "oăn", "💇", "tóc xoăn", "robot"],
    ["ngoằn", "oăn"],
    ["hoạt", "oat", "🎬", "hoạt hình", "robot"],
    ["khoát", "oat"],
    ["hoắt", "oăt", "✏️", "nhọn hoắt", "robot"],
    ["choắt", "oăt"],
    ["thoăn", "oăn"],
  ]);
  withNear(words, [
    ["khoan", "khoăn"],
    ["toán", "toăn"],
    ["hoạt", "hoặt"],
    ["khoát", "khoắt"],
  ]);
  pack(76, "164–165", "oan oăn oat oăt", "VIET.HV.VAN_OAN_OAWN_OAT_OAWT", "viet-vanoan", {
    note: "Bài 76: oan, oăn, oat, oăt. Từ của sách: hoa xoan, tóc xoăn, hoạt hình, nhọn hoắt, toán, hoạt, khoát, ngoằn, choắt, thoăn. Ô 'gần giống' dùng đúng cặp a/ă (khoan/khoăn) theo mã nham_chu_gan_giong; onset/rime suy tự động.",
    words,
    phrases: [
      "hoa xoan",
      "tóc xoăn",
      "hoạt hình",
      "nhọn hoắt",
      "Trong vườn, cây xoan và cây khế đã trổ hoa",
      "Chúng thoăn thoắt nhảy từ cành này sang cành khác",
    ],
    writeSets: [
      ["hoa xoan", "tóc xoăn"],
      ["hoạt hình", "nhọn hoắt"],
      ["toán", "ngoan", "khoát"],
    ],
  });
}

// ─────────────────────────────────────────────────────── bài 77: oai uê uy ────────────────────
{
  const words = autoWords([
    ["khoai", "oai", "🍠", "khoai sọ", "garden"],
    ["ngoài", "oai"],
    ["ngoại", "oai"],
    ["tuế", "uê", "🌿", "vạn tuế", "garden"],
    ["huệ", "uê"],
    ["thuế", "uê"],
    ["thuỷ", "uy", "🚢", "tàu thuỷ", "robot"],
    ["huy", "uy"],
    ["luỹ", "uy"],
  ]);
  pack(77, "166–167", "oai uê uy", "VIET.HV.VAN_OAI_UEE_UY", "viet-vanoai", {
    note: "Bài 77: oai, uê, uy. Từ của sách: khoai sọ, vạn tuế, tàu thuỷ, ngoái, thuế, luỹ, ngoại, tuế, thuỷ. Không có cặp 'gần giống' đơn giản; onset/rime suy tự động.",
    words,
    phrases: [
      "khoai sọ",
      "vạn tuế",
      "tàu thuỷ",
      "Ngày nghỉ, Hà thoải mái vui đùa",
      "Hà thì thầm với cây xoài",
      "Em cùng gió nô giỡn bên những bông huệ trắng",
    ],
    writeSets: [["khoai sọ", "vạn tuế"], ["tàu thuỷ"], ["ngoài", "huệ", "thuỷ"]],
  });
}

// ─────────────────────────────────────────────────────── bài 78: uân uât ──────────────────────
{
  const words = autoWords([
    ["xuân", "uân", "🌸", "mùa xuân", "garden"],
    ["tuần", "uân", "🚓", "tuần tra", "robot"],
    ["chuẩn", "uân"],
    ["huân", "uân"],
    ["thuật", "uât", "🥋", "võ thuật", "robot"],
    ["luật", "uât"],
    ["xuất", "uât"],
    ["khuất", "uât"],
  ]);
  pack(78, "168–169", "uân uât", "VIET.HV.VAN_UAAN_UAAT", "viet-vanuan", {
    note: "Bài 78: uân, uât. Từ của sách: tuần tra, mùa xuân, võ thuật, chuẩn, khuất, huân, luật, khuân, xuất. Không có ô 'gần giống'; onset/rime suy tự động.",
    words,
    phrases: [
      "tuần tra",
      "mùa xuân",
      "võ thuật",
      "Gần Tết, bố và Hà đi chợ hoa mua đào và quất",
      "Cây quất xum xuê, quả vàng óng",
      "Cả nhà cùng vui đón xuân",
    ],
    writeSets: [["tuần tra", "mùa xuân"], ["võ thuật"], ["xuân", "chuẩn", "luật"]],
  });
}

// ─────────────────────────────────────────────────────── bài 79: uyên uyêt ────────────────────
{
  const words = autoWords([
    ["thuyền", "uyên", "⛵", "con thuyền", "garden"],
    ["chuyến", "uyên"],
    ["luyện", "uyên"],
    ["truyện", "uyên"],
    ["duyệt", "uyêt"],
    ["tuyệt", "uyêt", "👍", "tuyệt vời", "robot"],
    ["khuyết", "uyêt", "🌙", "trăng khuyết", "garden"],
    ["tuyết", "uyêt"],
  ]);
  pack(79, "170–171", "uyên uyêt", "VIET.HV.VAN_UYEEN_UYEET", "viet-vanuyen", {
    note: "Bài 79: uyên, uyêt. Từ của sách: con thuyền, trăng khuyết, truyền thuyết, chuyến, duyệt, luyện, tuyết, truyện, tuyệt. Không có ô 'gần giống'; onset/rime suy tự động.",
    words,
    phrases: [
      "con thuyền",
      "trăng khuyết",
      "truyền thuyết",
      "Sân nhà em sáng quá nhờ ánh trăng sáng ngời",
      "Trăng tròn như cái đĩa",
      "Em đi trăng theo bước",
    ],
    writeSets: [["con thuyền", "trăng khuyết"], ["truyền thuyết"], ["luyện", "tuyệt", "tuyết"]],
  });
}
