/**
 * Cloud neural TTS adapters (ADR-6, docs/02 §1 "TTS"). Selected by TTS_PROVIDER; no SDK, plain fetch.
 *
 * - `elevenlabs`: the family's own cloned child voices (boy + girl, made from the recordings in
 *   "ai voice/" by `pnpm tts:clone`). Multilingual v2 speaks Vietnamese with the cloned timbre.
 * - `azure` / `google`: stock northern-Vietnamese neural voices (HoaiMy/NamMinh, Neural2-A/D),
 *   pitched up a little so they sound younger.
 *
 * Voice *persona* ("boy" | "girl") is chosen by context (see `voices.ts` → `personaFor`) and mapped
 * to a concrete voice id per provider here.
 */
export type TtsProviderName = "webspeech" | "azure" | "google" | "elevenlabs";
export type VoicePersona = "boy" | "girl";

export interface TtsConfig {
  provider: TtsProviderName;
  apiKey: string;
  /** Azure region (e.g. southeastasia). Ignored by the others. */
  region: string;
  /** Concrete voice per persona (and per language for the stock providers). */
  voices: Record<VoicePersona, Record<string, string>>;
  /** Kid-friendly prosody for stock voices (cloned child voices are used as-is). */
  pitchPercent: number;
  rate: number;
  /** ElevenLabs model. */
  model: string;
}

const STOCK_VOICES: Record<"azure" | "google", Record<VoicePersona, Record<string, string>>> = {
  azure: {
    girl: { vi: "vi-VN-HoaiMyNeural", en: "en-US-AnaNeural" }, // Ana = child voice (English)
    boy: { vi: "vi-VN-NamMinhNeural", en: "en-US-AnaNeural" },
  },
  google: {
    girl: { vi: "vi-VN-Neural2-A", en: "en-US-Neural2-F" },
    boy: { vi: "vi-VN-Neural2-D", en: "en-US-Neural2-D" },
  },
};

export function ttsConfigFromEnv(env: Record<string, string | undefined> = process.env): TtsConfig {
  const provider = (env.TTS_PROVIDER ?? "webspeech") as TtsProviderName;
  const voices: TtsConfig["voices"] =
    provider === "azure" || provider === "google"
      ? { girl: { ...STOCK_VOICES[provider].girl }, boy: { ...STOCK_VOICES[provider].boy } }
      : { girl: {}, boy: {} };
  if (provider === "elevenlabs") {
    // One cloned voice speaks every language.
    if (env.TTS_VOICE_GIRL) voices.girl = { vi: env.TTS_VOICE_GIRL, en: env.TTS_VOICE_GIRL };
    if (env.TTS_VOICE_BOY) voices.boy = { vi: env.TTS_VOICE_BOY, en: env.TTS_VOICE_BOY };
  } else {
    if (env.TTS_VOICE_GIRL) voices.girl.vi = env.TTS_VOICE_GIRL;
    if (env.TTS_VOICE_BOY) voices.boy.vi = env.TTS_VOICE_BOY;
  }
  return {
    provider,
    apiKey: env.TTS_API_KEY ?? "",
    region: env.TTS_REGION ?? "southeastasia",
    voices,
    pitchPercent: Number(env.TTS_PITCH_PERCENT ?? 12),
    rate: Number(env.TTS_RATE ?? 0.9),
    model: env.TTS_MODEL ?? "eleven_multilingual_v2",
  };
}

export function cloudTtsEnabled(cfg: TtsConfig): boolean {
  if (cfg.provider === "webspeech" || cfg.apiKey.length === 0) return false;
  if (cfg.provider === "elevenlabs") return Boolean(cfg.voices.girl.vi || cfg.voices.boy.vi);
  return true;
}

function langBase(lang: string): string {
  return lang.toLowerCase().split(/[-_]/)[0] ?? "vi";
}

/** Concrete voice for a persona; falls back to the other persona when one is not configured. */
export function resolveVoice(cfg: TtsConfig, persona: VoicePersona, lang: string): string | null {
  const base = langBase(lang);
  const other: VoicePersona = persona === "girl" ? "boy" : "girl";
  return cfg.voices[persona][base] ?? cfg.voices[other][base] ?? null;
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
  const semitones = Math.round(Math.log2(1 + cfg.pitchPercent / 100) * 12 * 10) / 10;
  return { audioEncoding: "MP3", speakingRate: cfg.rate, pitch: semitones };
}

/** Returns MP3 bytes, or throws with the provider's status text. */
export async function synthesizeWithProvider(
  text: string,
  lang: string,
  persona: VoicePersona,
  cfg: TtsConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<Uint8Array> {
  const voice = resolveVoice(cfg, persona, lang);
  if (!voice) throw new Error(`No ${cfg.provider} voice configured for ${persona}/${lang}`);

  if (cfg.provider === "elevenlabs") {
    const res = await fetchImpl(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_64`,
      {
        method: "POST",
        headers: { "xi-api-key": cfg.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: cfg.model,
          // Stability a bit high + similarity high keeps a child's timbre from drifting.
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
      },
    );
    if (!res.ok) throw new Error(`ElevenLabs TTS ${res.status}: ${await res.text()}`);
    return new Uint8Array(await res.arrayBuffer());
  }

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
