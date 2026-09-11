/**
 * Web Speech voice selection (ADR-6 fallback). Pure functions so they can be unit-tested.
 *
 * Why: browsers happily read Vietnamese text with an English voice when no vi-VN voice is
 * installed — that is the "foreigner reading Vietnamese" effect. We only speak when a real
 * voice for the language exists, and we prefer the natural (neural) Microsoft voices.
 */
export interface VoiceLike {
  name: string;
  lang: string;
  localService?: boolean;
}

/** Preferred vi-VN voices, best first (northern Vietnamese, natural where available). */
const VI_PREFERENCE = [
  "HoaiMy", // Microsoft HoaiMy Online (Natural) — nữ miền Bắc, Edge
  "NamMinh", // Microsoft NamMinh Online (Natural) — nam miền Bắc, Edge
  "Google Tiếng Việt", // Chrome on some platforms
  "Microsoft An", // Windows offline voice (Ngôn ngữ Tiếng Việt đã cài)
  "Linh", // Apple
];

/** Prosody for the on-device fallback: same slow, gentle read as TTS_RATE (ADR-11). */
export const KID_PROSODY = { rate: 0.9, pitch: 1.15 } as const;

function langBase(lang: string): string {
  return lang.toLowerCase().split(/[-_]/)[0] ?? "";
}

/**
 * Picks the best voice for `lang` or returns null when the browser has none for that language.
 * Callers must not speak with a null result (that would use the wrong-language default voice).
 */
export function pickVoice(voices: readonly VoiceLike[], lang: string): VoiceLike | null {
  const base = langBase(lang);
  const candidates = voices.filter((v) => langBase(v.lang) === base);
  if (candidates.length === 0) return null;
  if (base === "vi") {
    for (const needle of VI_PREFERENCE) {
      const hit = candidates.find((v) => v.name.toLowerCase().includes(needle.toLowerCase()));
      if (hit) return hit;
    }
  }
  // Prefer "Natural"/"Neural" voices, then online voices, then anything.
  return (
    candidates.find((v) => /natural|neural/i.test(v.name)) ??
    candidates.find((v) => v.localService === false) ??
    candidates[0] ??
    null
  );
}
