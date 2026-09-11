import { createHash } from "node:crypto";
import type { FileStorage } from "../storage/file-storage";
import {
  azureTtsUrl,
  azureVoicesUrl,
  buildAzureSsml,
  cloudTtsEnabled,
  googleAudioConfig,
  langBase,
  localeFor,
  resolveVoice,
  type TtsConfig,
  VBEE_TTS_URL,
  VBEE_VOICES_URL,
  vbeeBody,
} from "./config";

/**
 * Cloud synthesis + the mp3 cache under FILE_ROOT/tts (ADR-11 phuong an (c) muc 2-3).
 *
 * The mp3 files are generated once, at content import time, and the running app only plays what
 * is already on disk — so a family machine with no API key still works (Web Speech fallback) and
 * the same sentence is never paid for twice.
 *
 * Free plans are small, so generation is **incremental and resumable**: only lines without an mp3
 * are sent, and hitting the daily quota stops the run quietly instead of failing the import.
 *
 * No SDK: plain `fetch` against Vbee / Azure Speech / Google Cloud TTS.
 */

/** The provider says "you are out of quota for now". Not a bug — stop and try again tomorrow. */
export class TtsQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TtsQuotaError";
  }
}

function isQuotaFailure(status: number, body: string): boolean {
  if (status === 429 || status === 402) return true;
  return /quota|limit|exceed|insufficient|balance|hết lượt|vượt quá/i.test(body);
}

/** Stable cache key: the text, the voice and the rate that produced the audio. */
export function ttsCacheKey(text: string, lang: string, cfg: TtsConfig): string {
  const voice = resolveVoice(cfg, lang) ?? "";
  const hash = createHash("sha1")
    .update([cfg.provider, voice, cfg.rate, localeFor(lang), text.trim()].join("|"))
    .digest("hex");
  return `tts/${langBase(lang)}/${hash}.mp3`;
}

export interface VoiceInfo {
  code: string;
  name: string;
  gender?: string;
  locale?: string;
}

/**
 * The Azure voices the resource may use — `pnpm tts:voices` prints this (ADR-11 addendum).
 * GET https://{region}.tts.speech.microsoft.com/cognitiveservices/voices/list
 */
export async function listAzureVoices(
  cfg: TtsConfig,
  language = "",
  fetchImpl: typeof fetch = fetch,
): Promise<VoiceInfo[]> {
  const res = await fetchImpl(azureVoicesUrl(cfg.region), {
    headers: { "Ocp-Apim-Subscription-Key": cfg.apiKey },
  });
  if (!res.ok) throw new Error(`Azure voices ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as {
    ShortName?: string;
    DisplayName?: string;
    LocalName?: string;
    Gender?: string;
    Locale?: string;
  }[];
  return body
    .filter((v) => !language || (v.Locale ?? "").toLowerCase().startsWith(language.toLowerCase()))
    .map((v) => ({
      code: v.ShortName ?? "",
      name: v.LocalName ?? v.DisplayName ?? "",
      gender: v.Gender,
      locale: v.Locale,
    }));
}

/** The voices the account may use — `pnpm tts:voices` prints this (ADR-11). */
export async function listVbeeVoices(
  cfg: TtsConfig,
  language = "vi-VN",
  fetchImpl: typeof fetch = fetch,
): Promise<{ code: string; name: string; gender?: string }[]> {
  const res = await fetchImpl(`${VBEE_VOICES_URL}?language_code=${encodeURIComponent(language)}`, {
    headers: cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {},
  });
  if (!res.ok) throw new Error(`Vbee voices ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as {
    result?: { voices?: { code?: string; voice_code?: string; name?: string; gender?: string }[] };
  };
  return (body.result?.voices ?? []).map((v) => ({
    code: v.code ?? v.voice_code ?? "",
    name: v.name ?? "",
    gender: v.gender,
  }));
}

/** Returns MP3 bytes, or throws (TtsQuotaError when the provider says "out of quota"). */
export async function synthesizeWithProvider(
  text: string,
  lang: string,
  cfg: TtsConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<Uint8Array> {
  const voice = resolveVoice(cfg, lang);
  if (!voice) throw new Error(`No ${cfg.provider} voice configured for ${lang}`);
  const locale = localeFor(lang);

  if (cfg.provider === "vbee") {
    const res = await fetchImpl(VBEE_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "App-Id": cfg.appId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vbeeBody(text, voice, cfg, lang)),
    });
    const raw = await res.text();
    if (!res.ok) {
      if (isQuotaFailure(res.status, raw)) throw new TtsQuotaError(`Vbee ${res.status}: ${raw}`);
      throw new Error(`Vbee TTS ${res.status}: ${raw}`);
    }
    const body = JSON.parse(raw) as {
      result?: { audio_link?: string; audio_url?: string; link?: string };
      status?: number;
      message?: string;
    };
    const link = body.result?.audio_link ?? body.result?.audio_url ?? body.result?.link;
    if (!link) {
      if (isQuotaFailure(200, raw)) throw new TtsQuotaError(`Vbee: ${body.message ?? raw}`);
      throw new Error(`Vbee TTS returned no audio link: ${raw}`);
    }
    // The link expires after ~3 minutes, so download it now and never store the URL.
    const audio = await fetchImpl(link);
    if (!audio.ok) throw new Error(`Vbee audio download ${audio.status}`);
    return new Uint8Array(await audio.arrayBuffer());
  }

  if (cfg.provider === "azure") {
    const res = await fetchImpl(azureTtsUrl(cfg.region), {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": cfg.apiKey,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "mtct-learning",
      },
      body: buildAzureSsml(text, lang, voice, cfg),
    });
    if (!res.ok) {
      const raw = await res.text();
      if (isQuotaFailure(res.status, raw)) throw new TtsQuotaError(`Azure ${res.status}: ${raw}`);
      throw new Error(`Azure TTS ${res.status}: ${raw}`);
    }
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
          audioConfig: googleAudioConfig(cfg, lang),
        }),
      },
    );
    if (!res.ok) {
      const raw = await res.text();
      if (isQuotaFailure(res.status, raw)) throw new TtsQuotaError(`Google ${res.status}: ${raw}`);
      throw new Error(`Google TTS ${res.status}: ${raw}`);
    }
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

export interface TtsLine {
  text: string;
  lang: string;
}

export interface PregenerateResult {
  requested: number;
  generated: number;
  cached: number;
  /** No key configured, or no voice for that language: Web Speech will read it instead. */
  skipped: number;
  /** Still without an mp3 after this run — run `content:import` again tomorrow. */
  remaining: number;
  /** True when the provider's quota stopped the run (not an error). */
  quotaReached: boolean;
  failed: { text: string; error: string }[];
}

/**
 * Pre-generates the mp3 for every (text, lang) pair of a content batch (ADR-11 muc 2-3).
 * Never throws: with no key it reports everything as `skipped` so `content:import` still succeeds,
 * and a quota stop leaves `remaining` > 0 so the next run picks up where this one left off.
 */
export async function pregenerateAudio(
  lines: TtsLine[],
  cfg: TtsConfig,
  storage: FileStorage,
  fetchImpl: typeof fetch = fetch,
): Promise<PregenerateResult> {
  const out: PregenerateResult = {
    requested: lines.length,
    generated: 0,
    cached: 0,
    skipped: 0,
    remaining: 0,
    quotaReached: false,
    failed: [],
  };
  if (!cloudTtsEnabled(cfg)) {
    out.skipped = lines.length;
    return out;
  }

  // Dedupe first: the same prompt in two packs is one mp3.
  const unique = new Map<string, TtsLine>();
  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;
    if (!resolveVoice(cfg, line.lang)) {
      out.skipped++;
      continue;
    }
    unique.set(ttsCacheKey(text, line.lang, cfg), { text, lang: line.lang });
  }

  const pending: TtsLine[] = [];
  for (const [key, line] of unique) {
    if (await storage.exists(key)) out.cached++;
    else pending.push(line);
  }

  for (let i = 0; i < pending.length; i++) {
    const line = pending[i] as TtsLine;
    try {
      await getOrSynthesize(line.text, line.lang, cfg, storage, fetchImpl);
      out.generated++;
    } catch (err) {
      if (err instanceof TtsQuotaError) {
        out.quotaReached = true;
        out.remaining = pending.length - i;
        return out;
      }
      out.failed.push({ text: line.text, error: (err as Error).message });
    }
  }
  return out;
}

/** How many of these lines still have no mp3 — used by `content:stats`. */
export async function missingAudio(
  lines: TtsLine[],
  cfg: TtsConfig,
  storage: FileStorage,
): Promise<{ total: number; missing: number; enabled: boolean }> {
  if (!cloudTtsEnabled(cfg)) return { total: lines.length, missing: lines.length, enabled: false };
  const keys = new Set<string>();
  for (const line of lines) {
    const text = line.text.trim();
    if (text && resolveVoice(cfg, line.lang)) keys.add(ttsCacheKey(text, line.lang, cfg));
  }
  let missing = 0;
  for (const key of keys) if (!(await storage.exists(key))) missing++;
  return { total: keys.size, missing, enabled: true };
}
