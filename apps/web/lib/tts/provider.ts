/**
 * Cloud neural TTS adapters (ADR-6, docs/02 §1 "TTS"): Azure (vi-VN-HoaiMyNeural) and Google
 * (vi-VN-Neural2-A). Both are northern Vietnamese female voices; a raised pitch + slower rate
 * makes them sound younger for the kid screens. Selected by TTS_PROVIDER; no SDK, plain fetch.
 *
 * No provider offers a native Vietnamese child voice — for the fixed mascot lines the docs
 * (06 §1.8) prefer real recordings, see `content/art/audio/README.md`.
 */
export type TtsProviderName = "webspeech" | "azure" | "google";

export interface TtsConfig {
  provider: TtsProviderName;
  apiKey: string;
  /** Azure region (e.g. southeastasia). Ignored by Google. */
  region: string;
  /** Voice per language; defaults below. */
  voices: Record<string, string>;
  /** Kid-friendly prosody. */
  pitchPercent: number; // e.g. +12 → "+12%"
  rate: number; // 0.9 = a bit slower
}

const DEFAULT_VOICES: Record<TtsProviderName, Record<string, string>> = {
  webspeech: {},
  azure: { vi: "vi-VN-HoaiMyNeural", en: "en-US-AnaNeural" }, // Ana = child voice (English only)
  google: { vi: "vi-VN-Neural2-A", en: "en-US-Neural2-F" },
};

export function ttsConfigFromEnv(env: Record<string, string | undefined> = process.env): TtsConfig {
  const provider = (env.TTS_PROVIDER ?? "webspeech") as TtsProviderName;
  const voices = { ...(DEFAULT_VOICES[provider] ?? {}) };
  if (env.TTS_VOICE_VI) voices.vi = env.TTS_VOICE_VI;
  if (env.TTS_VOICE_EN) voices.en = env.TTS_VOICE_EN;
  return {
    provider,
    apiKey: env.TTS_API_KEY ?? "",
    region: env.TTS_REGION ?? "southeastasia",
    voices,
    pitchPercent: Number(env.TTS_PITCH_PERCENT ?? 12),
    rate: Number(env.TTS_RATE ?? 0.9),
  };
}

export function cloudTtsEnabled(cfg: TtsConfig): boolean {
  return cfg.provider !== "webspeech" && cfg.apiKey.length > 0;
}

function langBase(lang: string): string {
  return lang.toLowerCase().split(/[-_]/)[0] ?? "vi";
}

function escapeXml(s: string): string {
  return s.replace(
    /[<>&'"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] ?? c,
  );
}

/** Azure SSML with kid prosody. Exported for tests. */
export function buildAzureSsml(text: string, lang: string, voice: string, cfg: TtsConfig): string {
  const pitch = `${cfg.pitchPercent >= 0 ? "+" : ""}${cfg.pitchPercent}%`;
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">` +
    `<voice name="${voice}"><prosody pitch="${pitch}" rate="${cfg.rate}">${escapeXml(text)}</prosody></voice></speak>`
  );
}

/** Google speakingRate/pitch (semitones) derived from the same config. Exported for tests. */
export function googleAudioConfig(cfg: TtsConfig) {
  // ~12% higher pitch ≈ +2 semitones (12 semitones = 100% higher).
  const semitones = Math.round(Math.log2(1 + cfg.pitchPercent / 100) * 12 * 10) / 10;
  return { audioEncoding: "MP3", speakingRate: cfg.rate, pitch: semitones };
}

/** Returns MP3 bytes, or throws with the provider's status text. */
export async function synthesizeWithProvider(
  text: string,
  lang: string,
  cfg: TtsConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<Uint8Array> {
  const voice = cfg.voices[langBase(lang)];
  if (!voice) throw new Error(`No ${cfg.provider} voice configured for ${lang}`);

  if (cfg.provider === "azure") {
    const res = await fetchImpl(
      `https://${cfg.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": cfg.apiKey,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
          "User-Agent": "mtct-learning",
        },
        body: buildAzureSsml(text, lang, voice, cfg),
      },
    );
    if (!res.ok) throw new Error(`Azure TTS ${res.status}: ${await res.text()}`);
    return new Uint8Array(await res.arrayBuffer());
  }

  if (cfg.provider === "google") {
    const res = await fetchImpl(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(cfg.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: lang, name: voice },
          audioConfig: googleAudioConfig(cfg),
        }),
      },
    );
    if (!res.ok) throw new Error(`Google TTS ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as { audioContent: string };
    return new Uint8Array(Buffer.from(body.audioContent, "base64"));
  }

  throw new Error(`Unsupported TTS provider: ${cfg.provider}`);
}
