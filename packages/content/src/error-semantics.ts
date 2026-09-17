/**
 * "Does this error code actually describe this wrong answer?" (docs/04 §11.1–11.2).
 *
 * A diagnostic distractor is only worth anything if the code means what the child did. Phase 2
 * tagged by habit rather than by meaning: in "2 và mấy thì được 8?" the option **8** was tagged
 * `quen_so_0`, but a child who picks the total is *repeating a number from the question*
 * (`lap_lai_tong`), not getting zero wrong. Each rule below states what the code claims and
 * refuses a tag that cannot possibly be that mistake.
 *
 * Rules only speak up when they are sure. Anything they cannot judge (an image-only choice, a
 * prompt with no numbers in it) passes — a validator that cries wolf gets switched off.
 */

export interface TaggedChoice {
  /** What the child tapped, as text; null for an image-only or audio-only option. */
  distractor: string | null;
  /** The right answer, as text; null when it is an image or a number the client never sees. */
  correct: string | null;
  code: string;
}

export interface ExerciseContext {
  type: string;
  language: "vi" | "en";
  subject: string;
  /** The instruction, read aloud. */
  prompt: string;
  /** What is spoken in a LISTEN_CHOOSE — part of the question even though it is never printed. */
  listenTarget?: string | null;
}

/** Codes that describe *behaviour*, not knowledge — they can never label a wrong option. */
const BEHAVIOURAL = new Set(["doan_bua", "bo_trong", "chua_nghe_het_de", "met_cuoi_phien"]);

/** Codes about handwriting: only a written/traced answer, or a single-glyph option, can show them. */
const HANDWRITING = new Set([
  "viet_nguoc_chu",
  "viet_thieu_net",
  "viet_sai_do_cao",
  "viet_khong_noi_net",
  "viet_nguoc_so",
]);

/** code -> the letters it says the child swapped. */
const LETTER_PAIRS: Record<string, string[]> = {
  nham_b_d: ["b", "d"],
  nham_p_q: ["p", "q"],
  nham_s_x: ["s", "x"],
  nham_ch_tr: ["ch", "tr"],
  nham_ng_ngh: ["ng", "ngh"],
  nham_g_gh: ["g", "gh"],
  nham_c_k_q: ["c", "k", "qu"],
};

/** code -> the English words it says the child swapped. */
const WORD_PAIRS: Record<string, string[]> = {
  nham_have_has: ["have", "has"],
  nham_am_is_are: ["am", "is", "are"],
  nham_this_that: ["this", "that", "these", "those"],
};

/** Vowels that differ by one small mark — the ă/â/ê/ô/ơ/ư family, plus the round pair a/o. */
const NEAR_LETTERS: string[][] = [
  ["a", "ă", "â"],
  ["o", "ô", "ơ"],
  ["e", "ê"],
  ["u", "ư"],
  ["a", "o"],
  ["i", "y"],
  ["d", "đ"],
];

const TONE_MARKS = /[\u0300\u0301\u0303\u0309\u0323]/gu;

function lower(s: string): string {
  return s.trim().toLowerCase();
}
/** Strip tone marks, keep ă/â/ê/ô/ơ/ư. */
export function stripTones(s: string): string {
  return lower(s).normalize("NFD").replace(TONE_MARKS, "").normalize("NFC");
}
function tonesOf(s: string): string[] {
  return lower(s).normalize("NFD").match(TONE_MARKS) ?? [];
}
function words(s: string): string[] {
  return s.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}
function numbersIn(s: string): number[] {
  return (s.match(/\d+/g) ?? []).map(Number);
}
function asNumber(s: string | null): number | null {
  if (s == null) return null;
  const t = s.trim();
  return /^-?\d+$/.test(t) ? Number(t) : null;
}
function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) (dp[0] as number[])[j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      (dp[i] as number[])[j] = Math.min(
        (dp[i - 1] as number[])[j]! + 1,
        (dp[i] as number[])[j - 1]! + 1,
        (dp[i - 1] as number[])[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return (dp[a.length] as number[])[b.length]!;
}

const DIGRAPHS = ["ngh", "ng", "nh", "ch", "gh", "gi", "kh", "ph", "qu", "th", "tr"];
/** One letter of the alphabet — "a", "ư", "ch" — as opposed to a syllable like "dà". */
function isOneGlyph(text: string): boolean {
  const bare = stripTones(text.trim()).toLowerCase();
  return [...bare].length === 1 || DIGRAPHS.includes(bare);
}

/** Every string you get by replacing one member of `pair` with another, anywhere in `text`. */
function swapVariants(text: string, pair: string[]): Set<string> {
  const out = new Set<string>();
  const src = lower(text);
  for (const from of pair)
    for (const to of pair) {
      if (from === to) continue;
      for (let i = 0; i <= src.length - from.length; i++) {
        if (src.startsWith(from, i)) out.add(src.slice(0, i) + to + src.slice(i + from.length));
      }
    }
  return out;
}

/** Rough onset/rime split of one Vietnamese syllable (tones kept on the rime). */
function onsetRime(syllable: string): { onset: string; rime: string } {
  const s = lower(syllable);
  const bare = stripTones(s);
  const onsets = ["ngh", "ng", "nh", "ch", "gh", "gi", "kh", "ph", "qu", "th", "tr"];
  const multi = onsets.find((o) => bare.startsWith(o));
  const len = multi
    ? multi.length
    : /^[a-zăâêôơưđ]/.test(bare) && !/^[aăâeêioôơuưy]/.test(bare)
      ? 1
      : 0;
  return { onset: bare.slice(0, len), rime: s.slice(len) };
}

const ZERO_HINTS =
  /\b0\b|không\s+(cho|có|thêm|bớt|lấy|còn|ăn)|chưa\s+có|không\s+\w+\s+nào|hết\s+cả|zero|no\s+more|none/iu;
const COMPARE_HINTS =
  /[<>=]|lớn hơn|bé hơn|nhiều hơn|ít hơn|bằng nhau|so sánh|bigger|smaller|greater|less|more than|fewer|farther|has more\b|equal to/iu;
const ORDER_HINTS =
  /liền (trước|sau)|đếm (tiếp|lùi)|sau số|trước số|thứ tự|order|comes (after|before)/iu;

const VI_NUMBER_WORDS: Record<string, number> = {
  không: 0,
  một: 1,
  hai: 2,
  ba: 3,
  bốn: 4,
  năm: 5,
  sáu: 6,
  bảy: 7,
  tám: 8,
  chín: 9,
  mười: 10,
};
const EN_NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};

/** Numbers the question shows or says, in digits or in words. */
export function numbersOfQuestion(ctx: ExerciseContext): Set<number> {
  const text = `${ctx.prompt} ${ctx.listenTarget ?? ""}`;
  const out = new Set<number>(numbersIn(text));
  for (const w of words(lower(text))) {
    const vi = VI_NUMBER_WORDS[w];
    if (vi != null) out.add(vi);
    const en = EN_NUMBER_WORDS[w];
    if (en != null) out.add(en);
  }
  return out;
}

/** Result of `a + b` / `a - b` read out of the prompt, and of the opposite operation. */
function arithmetic(ctx: ExerciseContext): { same: number; opposite: number } | null {
  const m =
    /(\d+)\s*([+\-−])\s*(\d+)/.exec(ctx.prompt) ??
    /(\d+)\s*([+\-−])\s*(\d+)/.exec(ctx.listenTarget ?? "");
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[3]);
    const plus = m[2] === "+";
    return { same: plus ? a + b : a - b, opposite: plus ? a - b : a + b };
  }
  const nums = [...numbersOfQuestion(ctx)];
  if (nums.length !== 2) return null;
  const text = `${ctx.prompt} ${ctx.listenTarget ?? ""}`.toLowerCase();
  const add = /thêm|tất cả|gộp|bay tới|đỗ thêm|sáng thêm|altogether|in all|more come/u.test(text);
  const sub = /bớt|còn lại|cho bạn|ăn mất|rụng|bay đi|left|take away|eat/u.test(text);
  if (!add && !sub) return null;
  const [a, b] = nums.sort((x, y) => y - x) as [number, number];
  return add ? { same: a + b, opposite: a - b } : { same: a - b, opposite: a + b };
}

/**
 * Returns the reason the tag cannot be right, or null when it is plausible.
 * `correct`/`distractor` are the option texts; either may be null (image-only options).
 */
export function explainErrorTagMismatch(choice: TaggedChoice, ctx: ExerciseContext): string | null {
  const { code } = choice;
  const distractor = choice.distractor?.trim() ?? null;
  const correct = choice.correct?.trim() ?? null;

  if (BEHAVIOURAL.has(code))
    return `"${code}" is a behavioural code (how the child answered, not what they think) — it can never label an option`;

  if (HANDWRITING.has(code)) {
    const single = distractor == null || isOneGlyph(distractor);
    const written = ctx.type === "TRACE" || ctx.type === "WRITE_PHOTO";
    if (!written && !single)
      return `"${code}" is about handwriting; on a "${distractor}" option the child is reading, not writing`;
    return null;
  }

  const dNum = asNumber(distractor);
  const cNum = asNumber(correct);
  const bothNumbers = dNum != null && cNum != null;

  switch (code) {
    case "lap_lai_tong": {
      if (dNum == null) return null;
      const given = numbersOfQuestion(ctx);
      if (given.size === 0) return null;
      if (!given.has(dNum))
        return `"lap_lai_tong" means the child repeated a number from the question, but ${dNum} is not one of {${[...given].join(", ")}}`;
      return null;
    }
    case "dem_thieu_1":
      if (bothNumbers && dNum !== cNum - 1)
        return `"dem_thieu_1" means one short of ${cNum}, but the option is ${dNum}`;
      return null;
    case "dem_thua_1":
      if (bothNumbers && dNum !== cNum + 1)
        return `"dem_thua_1" means one too many (${cNum! + 1}), but the option is ${dNum}`;
      return null;
    case "dem_lai_tu_dau":
      if (bothNumbers && dNum <= cNum)
        return `"dem_lai_tu_dau" means the child counted some things twice, so the option must be more than ${cNum}, not ${dNum}`;
      return null;
    case "nham_thu_tu_so": {
      if (!bothNumbers) return null;
      const reversed = Number([...String(cNum)].reverse().join(""));
      if (dNum !== reversed && !ORDER_HINTS.test(`${ctx.prompt} ${ctx.listenTarget ?? ""}`))
        return `"nham_thu_tu_so" means the digits were swapped (${cNum} → ${reversed}) or the order was misread; ${dNum} is neither`;
      return null;
    }
    case "quen_so_0": {
      const text = `${ctx.prompt} ${ctx.listenTarget ?? ""}`;
      if (!ZERO_HINTS.test(text) && !numbersOfQuestion(ctx).has(0))
        return `"quen_so_0" is about adding or subtracting 0, but this question has no 0 in it`;
      return null;
    }
    case "nham_cong_tru": {
      const ops = arithmetic(ctx);
      if (ops == null || dNum == null) return null;
      if (dNum !== ops.opposite)
        return `"nham_cong_tru" means the opposite operation (${ops.opposite}), but the option is ${dNum}`;
      return null;
    }
    case "sai_hang_chuc_don_vi":
      if (bothNumbers && cNum < 10 && dNum < 10)
        return `"sai_hang_chuc_don_vi" needs tens and units; both ${cNum} and ${dNum} are single digits`;
      return null;
    // Pha 13 (MATH NOTES): the four traps the book sets on purpose.
    case "chuc_khong_du_10":
      // a "ten" that is really nine can only make the number look smaller
      if (bothNumbers && dNum >= cNum)
        return `"chuc_khong_du_10" means a ten counted as fewer than 10, so the option must be less than ${cNum}, not ${dNum}`;
      return null;
    case "nham_so_teen": {
      const text = `${ctx.prompt} ${ctx.listenTarget ?? ""}`;
      if (!/\bteen/i.test(text))
        return `"nham_so_teen" belongs on a teen-number question; this one never says "teen"`;
      if (dNum != null && dNum !== 10 && dNum !== 20)
        return `"nham_so_teen" is taking 10 or 20 for a teen number; the option is ${dNum}`;
      return null;
    }
    case "sai_quy_luat_dem": {
      const text = `${ctx.prompt} ${ctx.listenTarget ?? ""}`;
      if (!/\b(next|after|before|missing|step|comes|count)/i.test(text))
        return `"sai_quy_luat_dem" belongs on a "what comes next" question; nothing here asks for the next numbers`;
      return null;
    }
    case "nho_sai_doubles": {
      const text = `${ctx.prompt} ${ctx.listenTarget ?? ""} ${distractor ?? ""}`;
      if (!/double/i.test(text) && !/\b(\d+)\s*\+\s*\1\b/.test(text))
        return `"nho_sai_doubles" belongs on a doubles question; there is no a + a here`;
      const m = /\b(\d+)\s*\+\s*\1\s*=\s*(\d+)/.exec(distractor ?? "");
      if (m && Number(m[1]) * 2 === Number(m[2]))
        return `"nho_sai_doubles" means a wrong doubles fact, but "${distractor}" is right`;
      return null;
    }
    case "khong_hieu_de_loi_van":
      if (words(ctx.prompt).length < 6 && !ctx.listenTarget)
        return `"khong_hieu_de_loi_van" belongs on a word problem; this prompt is ${words(ctx.prompt).length} words`;
      return null;
    case "so_sanh_nguoc":
    case "nham_dau_lon_be": {
      const text = `${ctx.prompt} ${ctx.listenTarget ?? ""} ${correct ?? ""} ${distractor ?? ""}`;
      if (!COMPARE_HINTS.test(text))
        return `"${code}" belongs on a comparison question; nothing here compares two things`;
      if (code === "nham_dau_lon_be" && distractor != null && !/^[<>=]$/.test(distractor))
        return `"nham_dau_lon_be" is about choosing the wrong sign; the option is "${distractor}", not < > or =`;
      return null;
    }
    case "thieu_dau_thanh": {
      if (distractor == null || correct == null) return null;
      const cTones = tonesOf(correct);
      const dTones = tonesOf(distractor);
      if (stripTones(distractor) !== stripTones(correct))
        return `"thieu_dau_thanh" means the same letters without the tone mark; "${distractor}" and "${correct}" are not the same letters`;
      if (cTones.length === 0 && dTones.length > 0)
        return `"thieu_dau_thanh" means a *missing* tone, but "${distractor}" has one and "${correct}" has none — that is "sai_dau_thanh"`;
      if (dTones.length >= cTones.length && cTones.length > 0)
        return `"${distractor}" does not drop the tone of "${correct}"`;
      return null;
    }
    case "sai_dau_thanh":
    case "nham_hoi_nga": {
      if (distractor == null || correct == null) return null;
      if (stripTones(distractor) !== stripTones(correct))
        return `"${code}" means the same syllable with a different tone; "${distractor}" changes the letters of "${correct}" too`;
      if (code === "nham_hoi_nga") {
        const pair = new Set([...tonesOf(correct), ...tonesOf(distractor)]);
        if (!(pair.has("\u0309") && pair.has("\u0303")))
          return `"nham_hoi_nga" is the hỏi/ngã pair; "${correct}" vs "${distractor}" is a different tone mix-up`;
      }
      return null;
    }
    case "nham_chu_gan_giong": {
      if (distractor == null || correct == null) return null;
      const c = stripTones(correct);
      const d = stripTones(distractor);
      if (c === d) return null;
      if (c.length !== d.length)
        return `"nham_chu_gan_giong" means one letter swapped for its look-alike; "${distractor}" is not the same length as "${correct}"`;
      const diff = [...c].map((ch, i) => [ch, d[i] as string]).filter(([x, y]) => x !== y);
      if (diff.length !== 1)
        return `"nham_chu_gan_giong" means exactly one look-alike letter changed; "${distractor}" differs from "${correct}" in ${diff.length} places`;
      const [x, y] = diff[0] as [string, string];
      if (!NEAR_LETTERS.some((fam) => fam.includes(x) && fam.includes(y)))
        return `"${x}" and "${y}" are not look-alike letters (a/ă/â, o/ô/ơ, e/ê, u/ư, a/o)`;
      return null;
    }
    // English and Vietnamese each have their own wrong-first-sound code (owner, 17/09/2026)
    case "nham_am_dau": {
      if (ctx.language !== "en")
        return `"nham_am_dau" is the English code; a Vietnamese âm đầu mix-up is "nham_am_dau_viet"`;
      if (distractor == null || correct == null) return null;
      if (words(correct).length !== 1 || words(distractor).length !== 1) return null;
      if (correct[0]?.toLowerCase() === distractor[0]?.toLowerCase())
        return `"nham_am_dau" is a wrong first sound, but "${distractor}" starts like "${correct}"`;
      return null;
    }
    case "nham_am_dau_viet": {
      if (ctx.language === "en")
        return `"nham_am_dau_viet" is the Vietnamese code; an English first-sound mix-up is "nham_am_dau"`;
      if (distractor == null || correct == null) return null;
      if (words(correct).length !== 1 || words(distractor).length !== 1) return null;
      const c = onsetRime(correct);
      const d = onsetRime(distractor);
      if (c.onset === d.onset)
        return `"nham_am_dau_viet" is a wrong first sound, but "${distractor}" has the same âm đầu as "${correct}"`;
      if (c.rime !== d.rime)
        return `"nham_am_dau_viet" changes only the first sound; "${distractor}" also changes the vần of "${correct}"`;
      return null;
    }
    case "doc_nham_van": {
      if (distractor == null || correct == null) return null;
      if (words(correct).length !== 1 || words(distractor).length !== 1) return null;
      // English: the code covers a rhyme miss, where the two words differ from the start
      if (ctx.language === "en") {
        const tail = (w: string) => lower(w).slice(-2);
        if (tail(correct) === tail(distractor))
          return `"doc_nham_van" is a wrong rime, but "${distractor}" rhymes with "${correct}"`;
        return null;
      }
      const c = onsetRime(correct);
      const d = onsetRime(distractor);
      if (c.rime === d.rime)
        return `"doc_nham_van" is a wrong vần, but "${distractor}" has the same vần as "${correct}"`;
      if (c.onset !== d.onset)
        return `"doc_nham_van" changes only the vần; "${distractor}" also changes the âm đầu of "${correct}"`;
      return null;
    }
    case "doc_bo_tieng":
    case "doc_bo_tu_tieng_anh":
      if (
        distractor != null &&
        correct != null &&
        words(distractor).length >= words(correct).length
      )
        return `"${code}" means a word was dropped, but "${distractor}" is not shorter than "${correct}"`;
      return null;
    case "doc_them_tieng":
      if (
        distractor != null &&
        correct != null &&
        words(distractor).length <= words(correct).length
      )
        return `"doc_them_tieng" means an extra syllable, but "${distractor}" is not longer than "${correct}"`;
      return null;
    case "thieu_s_so_nhieu": {
      if (distractor == null || correct == null) return null;
      const a = lower(correct);
      const b = lower(distractor);
      if (!(a === `${b}s` || b === `${a}s` || a === `${b}es` || b === `${a}es`))
        return `"thieu_s_so_nhieu" is a missing plural -s; "${distractor}" is not "${correct}" with or without -s`;
      return null;
    }
    case "nham_nguyen_am_ngan": {
      if (distractor == null || correct == null) return null;
      const a = lower(correct);
      const b = lower(distractor);
      if (a.length !== b.length || editDistance(a, b) !== 1)
        return `"nham_nguyen_am_ngan" is one vowel swapped; "${distractor}" and "${correct}" differ by more`;
      return null;
    }
    case "sai_chinh_ta_tu": {
      if (distractor == null || correct == null) return null;
      const dist = editDistance(lower(correct), lower(distractor));
      if (dist === 0 || dist > 2)
        return `"sai_chinh_ta_tu" is a near-miss spelling; "${distractor}" is ${dist} edits from "${correct}"`;
      return null;
    }
    default: {
      const letters = LETTER_PAIRS[code];
      if (letters && distractor != null && correct != null) {
        if (!swapVariants(correct, letters).has(lower(distractor)))
          return `"${code}" means ${letters.join("/")} were swapped; "${distractor}" is not "${correct}" with that swap`;
        return null;
      }
      const enWords = WORD_PAIRS[code];
      if (enWords && distractor != null && correct != null) {
        const swapped = swapVariants(correct, enWords);
        if (!swapped.has(lower(distractor)) && !enWords.includes(lower(distractor)))
          return `"${code}" means ${enWords.join("/")} were swapped; "${distractor}" is not that swap of "${correct}"`;
        return null;
      }
      return null;
    }
  }
}
