/**
 * Cloud neural TTS configuration (ADR-6, ADR-11 phuong an (c) + the Azure addendum, NFR-04).
 *
 * Stock provider voices only — the project never clones a real child's voice (that is biometric
 * data and must not sit on a third party's servers, ADR-11).
 *
 * The voices are settled: the project owner listened to six samples on 11/09/2026 and chose
 *   - Vietnamese `vi-VN-HoaiMyNeural` **at its own speed and pitch** — no <prosody> at all.
 *     The slowed-down and raised-pitch samples were listened to and rejected; do not add them back.
 *   - English `en-US-AnaNeural` wrapped in <prosody rate="-10%">, which TTS_RATE sets.
 * So TTS_RATE applies to English only. Vbee and Google stay as optional providers.
 *
 * Pure functions: no fs, no network, no Next — so both the web app and the content importer can
 * use them and the unit tests need no keys.
 */
export type TtsProviderName = "webspeech" | "vbee" | "azure" | "google";

export type TtsLang = "vi" | "en";

export interface TtsConfig {
  provider: TtsProviderName;
  apiKey: string;
  /** Vbee `App-Id` header. Ignored by the others. */
  appId: string;
  /** Azure region (eastasia — the owner's F0 resource). Ignored by the others. */
  region: string;
  /** Concrete provider voice per language. */
  voices: Record<TtsLang, string>;
  /**
   * Reading speed for **English only**, as Azure writes it: "-10%" (or "0.9" for the providers
   * that take a multiplier). Empty string = the voice's own speed. Vietnamese never uses it.
   */
  rate: string;
}

/**
 * Provider defaults; TTS_VOICE_VI / TTS_VOICE_EN override them.
 *
 * The Vbee code below is the northern female voice most of their samples use — confirm it for the
 * account in use with `pnpm tts:voices` (GET https://vbee.vn/api/public/v1/voices?language_code=vi-VN)
 * and set TTS_VOICE_VI, because voice codes differ per plan.
 */
export const STOCK_VOICES: Record<"vbee" | "azure" | "google", Record<TtsLang, string>> = {
  vbee: {
    vi: "hn_female_ngochuyen_full_48k-fhg",
    en: "", // Vbee is used for Vietnamese; English falls back to Web Speech unless set.
  },
  azure: {
    vi: "vi-VN-HoaiMyNeural", // nu mien Bac
    en: "en-US-AnaNeural", // giong be gai, hop voi tre 6 tuoi
  },
  google: {
    vi: "vi-VN-Neural2-A",
    en: "en-US-Neural2-F",
  },
};

/** English only — the Vietnamese voice is left alone (ADR-11 addendum). */
export const DEFAULT_TTS_RATE = "-10%";
export const DEFAULT_TTS_REGION = "eastasia";
export const VBEE_TTS_URL = "https://api.vbee.vn/v1/tts";
export const VBEE_VOICES_URL = "https://vbee.vn/api/public/v1/voices";

export function azureTtsUrl(region: string): string {
  return `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
}
export function azureVoicesUrl(region: string): string {
  return `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;
}

/**
 * `rate` as a plain multiplier, for the providers that want a number.
 * "-10%" -> 0.9 · "+20%" -> 1.2 · "0.9" -> 0.9 · "" -> 1.
 */
export function speedMultiplier(rate: string): number {
  const text = rate.trim();
  if (!text) return 1;
  const percent = /^([+-]?\d+(?:\.\d+)?)%$/.exec(text);
  if (percent) return 1 + Number(percent[1]) / 100;
  const n = Number(text);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function langBase(lang: string): TtsLang {
  return lang.toLowerCase().startsWith("en") ? "en" : "vi";
}

export function ttsConfigFromEnv(env: Record<string, string | undefined> = process.env): TtsConfig {
  // Azure is the default vendor (ADR-11 addendum). With no key it still falls back to Web Speech,
  // so an empty .env runs the whole app.
  const raw = (env.TTS_PROVIDER ?? "azure").trim().toLowerCase();
  const provider: TtsProviderName =
    raw === "vbee" || raw === "azure" || raw === "google" || raw === "webspeech"
      ? raw
      : ("webspeech" as const);
  const stock = provider === "webspeech" ? { vi: "", en: "" } : STOCK_VOICES[provider];
  return {
    provider,
    apiKey: (env.TTS_API_KEY ?? "").trim(),
    appId: (env.TTS_APP_ID ?? "").trim(),
    region: (env.TTS_REGION ?? DEFAULT_TTS_REGION).trim(),
    voices: {
      vi: (env.TTS_VOICE_VI ?? "").trim() || stock.vi,
      en: (env.TTS_VOICE_EN ?? "").trim() || stock.en,
    },
    rate: (env.TTS_RATE ?? DEFAULT_TTS_RATE).trim(),
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

/**
 * Azure SSML. English is slowed by `rate`; **Vietnamese is never wrapped in <prosody>** — the
 * owner listened to the slowed and pitched-up HoaiMy samples and picked the plain one (ADR-11).
 * Exported for tests.
 */
export function buildAzureSsml(text: string, lang: string, voice: string, cfg: TtsConfig): string {
  const locale = localeFor(lang);
  const body =
    langBase(lang) === "en" && cfg.rate
      ? `<prosody rate="${escapeXml(cfg.rate)}">${escapeXml(text)}</prosody>`
      : escapeXml(text);
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}">` +
    `<voice name="${voice}">${body}</voice></speak>`
  );
}

/** Google audioConfig derived from the same config. Exported for tests. */
export function googleAudioConfig(cfg: TtsConfig, lang = "en") {
  return {
    audioEncoding: "MP3",
    speakingRate: langBase(lang) === "en" ? speedMultiplier(cfg.rate) : 1,
  };
}

/** Vbee request body. `speed` is clamped to the range the API accepts. Exported for tests. */
export function vbeeBody(text: string, voice: string, cfg: TtsConfig, lang = "vi") {
  const speed = langBase(lang) === "en" ? speedMultiplier(cfg.rate) : 1;
  return {
    text,
    voice_code: voice,
    speed: Math.min(1.9, Math.max(0.25, speed)),
    audio_type: "mp3",
    // Synchronous: the sentences here are short, so waiting for the link is simpler than polling.
    callback_url: "",
  };
}
