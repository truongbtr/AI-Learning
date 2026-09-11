import { createHash } from "node:crypto";
import type { FileStorage } from "../storage/file-storage";
import {
  buildAzureSsml,
  cloudTtsEnabled,
  googleAudioConfig,
  langBase,
  localeFor,
  resolveVoice,
  type TtsConfig,
} from "./config";

/**
 * Cloud synthesis + the mp3 cache under FILE_ROOT/tts (ADR-11 phuong an (c) muc 3).
 *
 * The mp3 files are generated once, at content import time, and the running app only plays what
 * is already on disk — so a family machine with no API key still works (Web Speech fallback) and
 * the same sentence is never paid for twice.
 *
 * No SDK: plain `fetch` against Azure Speech / Google Cloud TTS (ADR-10 bans LLM SDKs; these are
 * speech services, still called without a vendor SDK to keep the dependency tree small).
 */

/** Stable cache key: the text, the voice and the rate that produced the audio. */
export function ttsCacheKey(text: string, lang: string, cfg: TtsConfig): string {
  const voice = resolveVoice(cfg, lang) ?? "";
  const hash = createHash("sha1")
    .update([cfg.provider, voice, cfg.rate, localeFor(lang), text.trim()].join("|"))
    .digest("hex");
  return `tts/${langBase(lang)}/${hash}.mp3`;
}

/** Returns MP3 bytes, or throws with the provider's status text. */
export async function synthesizeWithProvider(
  text: string,
  lang: string,
  cfg: TtsConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<Uint8Array> {
  const voice = resolveVoice(cfg, lang);
  if (!voice) throw new Error(`No ${cfg.provider} voice configured for ${lang}`);
  const locale = localeFor(lang);

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
          voice: { languageCode: locale, name: voice },
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

export interface CachedAudio {
  key: string;
  bytes: Uint8Array;
  source: "cache" | "cloud";
}

/**
 * Cache-first synthesis. Returns null when cloud TTS is not configured — callers must treat that
 * as "fall back to Web Speech", never as an error.
 */
export async function getOrSynthesize(
  text: string,
  lang: string,
  cfg: TtsConfig,
  storage: FileStorage,
  fetchImpl: typeof fetch = fetch,
): Promise<CachedAudio | null> {
  if (!cloudTtsEnabled(cfg)) return null;
  const key = ttsCacheKey(text, lang, cfg);
  if (await storage.exists(key)) return { key, bytes: await storage.get(key), source: "cache" };
  const bytes = await synthesizeWithProvider(text, lang, cfg, fetchImpl);
  await storage.put(key, bytes, "audio/mpeg");
  return { key, bytes, source: "cloud" };
}

export interface PregenerateResult {
  requested: number;
  generated: number;
  cached: number;
  skipped: number;
  failed: { text: string; error: string }[];
}

/**
 * Pre-generates the mp3 for every (text, lang) pair of a content batch (ADR-11 muc 3).
 * Never throws: with no key it reports everything as `skipped` so `content:import` still succeeds.
 */
export async function pregenerateAudio(
  lines: { text: string; lang: string }[],
  cfg: TtsConfig,
  storage: FileStorage,
  fetchImpl: typeof fetch = fetch,
): Promise<PregenerateResult> {
  const out: PregenerateResult = {
    requested: lines.length,
    generated: 0,
    cached: 0,
    skipped: 0,
    failed: [],
  };
  if (!cloudTtsEnabled(cfg)) {
    out.skipped = lines.length;
    return out;
  }
  const seen = new Set<string>();
  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;
    const key = ttsCacheKey(text, line.lang, cfg);
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      const result = await getOrSynthesize(text, line.lang, cfg, storage, fetchImpl);
      if (result?.source === "cloud") out.generated++;
      else if (result?.source === "cache") out.cached++;
      else out.skipped++;
    } catch (err) {
      out.failed.push({ text, error: (err as Error).message });
    }
  }
  return out;
}
