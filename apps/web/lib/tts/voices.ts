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

/** Prosody for a younger-sounding read: slightly higher pitch, calmer rate (kid screens). */
export const KID_PROSODY = { rate: 0.92, pitch: 1.2 } as const;

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

export type VoicePersona = "boy" | "girl";

/**
 * Which cloned child voice speaks on a screen (context rule, docs/06 §1.7 mascot voice):
 * a girl's screens are voiced by the girl voice, a boy's by the boy voice — decided from the
 * child's avatar first, then the mascot (owl → girl, robot → boy). Adults/unknown → girl.
 */
export function personaFor(
  student: { avatarKey?: string | null; mascot?: string | null } | null,
): VoicePersona {
  const avatar = (student?.avatarKey ?? "").toLowerCase();
  if (avatar.startsWith("boy")) return "boy";
  if (avatar.startsWith("girl")) return "girl";
  if ((student?.mascot ?? "").toUpperCase() === "ROBOT") return "boy";
  return "girl";
}
