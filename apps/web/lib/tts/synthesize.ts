import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileStorage } from "@/lib/storage";
import {
  cloudTtsEnabled,
  resolveVoice,
  synthesizeWithProvider,
  ttsConfigFromEnv,
  type VoicePersona,
} from "./provider";

/**
 * Audio lookup order (docs/06 §3 `useSpeak`): recorded clip → cached mp3 → cloud synth (cached)
 * → null (the client then falls back to Web Speech or stays silent).
 */
export interface AudioResult {
  bytes: Uint8Array;
  source: "clip" | "cache" | "cloud";
}

/** Real recordings of fixed lines live in content/art/audio/<lang>/[<persona>/]<key>.mp3. */
function clipsRoot(): string {
  return process.env.CONTENT_ROOT
    ? path.join(process.env.CONTENT_ROOT, "art", "audio")
    : path.resolve(process.cwd(), "..", "..", "content", "art", "audio");
}

const KEY_RE = /^[a-z0-9][a-z0-9-]{0,60}$/;

export async function recordedClip(
  key: string,
  lang: string,
  persona: VoicePersona,
): Promise<Uint8Array | null> {
  if (!KEY_RE.test(key)) return null;
  const base = lang.toLowerCase().split(/[-_]/)[0] ?? "vi";
  for (const file of [
    path.join(clipsRoot(), base, persona, `${key}.mp3`),
    path.join(clipsRoot(), base, `${key}.mp3`),
  ]) {
    try {
      return new Uint8Array(await readFile(file));
    } catch {
      // try the next location
    }
  }
  return null;
}

export function cacheKey(text: string, lang: string, persona: VoicePersona): string {
  const cfg = ttsConfigFromEnv();
  const base = lang.toLowerCase().split(/[-_]/)[0] ?? "vi";
  const voice = resolveVoice(cfg, persona, lang) ?? "";
  const hash = createHash("sha1")
    .update([cfg.provider, voice, cfg.pitchPercent, cfg.rate, lang, text.trim()].join("|"))
    .digest("hex");
  return `tts/${base}/${hash}.mp3`;
}

export async function getOrSynthesize(
  text: string,
  lang: string,
  persona: VoicePersona,
  clip?: string,
): Promise<AudioResult | null> {
  if (clip) {
    const bytes = await recordedClip(clip, lang, persona);
    if (bytes) return { bytes, source: "clip" };
  }
  const cfg = ttsConfigFromEnv();
  if (!cloudTtsEnabled(cfg)) return null;

  const storage = fileStorage();
  const key = cacheKey(text, lang, persona);
  if (await storage.exists(key)) return { bytes: await storage.get(key), source: "cache" };

  const bytes = await synthesizeWithProvider(text, lang, persona, cfg);
  await storage.put(key, bytes, "audio/mpeg");
  return { bytes, source: "cloud" };
}
