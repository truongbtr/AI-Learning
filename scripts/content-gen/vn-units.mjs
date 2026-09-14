/**
 * Âm và vần của một tiếng Việt — đủ để trả lời "tiếng này có âm X không?" theo **âm**, không theo
 * con chữ: `giò` có âm gi chứ không có âm g, `nghé` có âm ngh chứ không có âm ng.
 */
const TONES = /[̣̀́̃̉]/gu;
const DIGRAPHS = ["ngh", "ng", "nh", "ch", "gh", "gi", "kh", "ph", "qu", "th", "tr"];
const CONSONANT = /^[bcdđghklmnprstvx]$/;

/** Bỏ dấu thanh, giữ ă â ê ô ơ ư. */
export const bare = (s) => s.toLowerCase().normalize("NFD").replace(TONES, "").normalize("NFC");

/** Âm đầu + vần ("nghé" → ngh + e, "gì" → g + i). */
export function splitSyllable(syllable) {
  const b = bare(syllable);
  const d = DIGRAPHS.find((x) => b.startsWith(x));
  if (d) {
    if (d === "gi" && b.length === 2) return { onset: "g", rime: "i" };
    return { onset: d, rime: b.slice(d.length) };
  }
  const m = /^[bcdđghklmnprstvx]/.exec(b);
  return m ? { onset: m[0], rime: b.slice(1) } : { onset: "", rime: b };
}

/** Có tiếng nào trong `text` chứa âm/vần `unit` không. */
export function hasUnit(text, unit) {
  const u = unit.toLowerCase();
  return text
    .split(/[^\p{L}]+/u)
    .filter(Boolean)
    .some((w) => {
      const { onset, rime } = splitSyllable(w);
      if (DIGRAPHS.includes(u) || CONSONANT.test(u)) return onset === u;
      return rime === u || (u.length === 1 && [...rime].includes(u)) || rime.includes(u);
    });
}
