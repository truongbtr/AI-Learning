/**
 * Cloud neural TTS configuration (ADR-6, ADR-11 phuong an (c), NFR-04).
 *
 * Stock provider voices only — the project never clones a real child's voice (that is biometric
 * data and must not sit on a third party's servers, ADR-11). Vietnamese defaults to the northern
 * female neural voice the textbook audio uses; English to a young female voice. Both are read a
 * little slower than default (TTS_RATE, ~0.9) so a 6-year-old can follow.
 *
 * Pure functions: no fs, no network, no Next — so both the web app and the content importer can
 * use them and the unit tests need no keys.
 */
export type TtsProviderName = "webspeech" | "azure" | "google";

export type TtsLang = "vi" | "en";

export interface TtsConfig {
  provider: TtsProviderName;
  apiKey: string;
  /** Azure region (e.g. southeastasia). Ignored by Google. */
  region: string;
  /** Concrete provider voice per language. */
  voices: Record<TtsLang, string>;
  /** Slower than default so the words are easy to follow. */
  rate: number;
}

/** Provider defaults; TTS_VOICE_VI / TTS_VOICE_EN override them. */
export const STOCK_VOICES: Record<"azure" | "google", Record<TtsLang, string>> = {
  azure: {
    vi: "vi-VN-HoaiMyNeural", // nu mien Bac, giong sach giao khoa
    en: "en-US-AnaNeural", // giong be gai, hop voi tre 6 tuoi
  },
  google: {
    vi: "vi-VN-Neural2-A",
    en: "en-US-Neural2-F",
  },
};

export const DEFAULT_TTS_RATE = 0.9;

export function langBase(lang: string): TtsLang {
  return lang.toLowerCase().startsWith("en") ? "en" : "vi";
}

export function ttsConfigFromEnv(env: Record<string, string | undefined> = process.env): TtsConfig {
  const raw = (env.TTS_PROVIDER ?? "webspeech").trim().toLowerCase();
  const provider: TtsProviderName =
    raw === "azure" || raw === "google" ? raw : ("webspeech" as const);
  const stock = provider === "webspeech" ? { vi: "", en: "" } : STOCK_VOICES[provider];
  const rate = Number(env.TTS_RATE ?? DEFAULT_TTS_RATE);
  return {
    provider,
    apiKey: (env.TTS_API_KEY ?? "").trim(),
    region: (env.TTS_REGION ?? "southeastasia").trim(),
    voices: {
      vi: (env.TTS_VOICE_VI ?? "").trim() || stock.vi,
      en: (env.TTS_VOICE_EN ?? "").trim() || stock.en,
    },
    rate: Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_TTS_RATE,
  };
}

/** True only when a paid provider *and* a key are configured. No key → Web Speech fallback. */
export function cloudTtsEnabled(cfg: TtsConfig): boolean {
  return cfg.provider !== "webspeech" && cfg.apiKey.length > 0;
}

export function resolveVoice(cfg: TtsConfig, lang: string): string | null {
  return cfg.voices[langBase(lang)] || null;
}

/** Full BCP-47 tag the providers expect. */
export function localeFor(lang: string): string {
  return langBase(lang) === "en" ? "en-US" : "vi-VN";
}

function escapeXml(s: string): string {
  return s.replace(
    /[<>&'"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] ?? c,
  );
}

/** Azure SSML with the kid reading rate. Exported for tests. */
export function buildAzureSsml(text: string, lang: string, voice: string, cfg: TtsConfig): string {
  const locale = localeFor(lang);
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}">` +
    `<voice name="${voice}"><prosody rate="${cfg.rate}">${escapeXml(text)}</prosody></voice></speak>`
  );
}

/** Google audioConfig derived from the same config. Exported for tests. */
export function googleAudioConfig(cfg: TtsConfig) {
  return { audioEncoding: "MP3", speakingRate: cfg.rate };
}
