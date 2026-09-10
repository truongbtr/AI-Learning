import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileStorage } from "@/lib/storage";
import { cloudTtsEnabled, synthesizeWithProvider, ttsConfigFromEnv } from "./provider";

/**
 * Audio lookup order (docs/06 §3 `useSpeak`): recorded clip → cached mp3 → cloud synth (cached)
 * → null (the client then falls back to Web Speech or stays silent).
 */
export interface AudioResult {
  bytes: Uint8Array;
  source: "clip" | "cache" | "cloud";
}

/** Real recordings of fixed lines live in content/art/audio/<lang>/<key>.mp3 (docs/06 §1.8). */
function clipsRoot(): string {
  return process.env.CONTENT_ROOT
    ? path.join(process.env.CONTENT_ROOT, "art", "audio")
    : path.resolve(process.cwd(), "..", "..", "content", "art", "audio");
}

const KEY_RE = /^[a-z0-9][a-z0-9-]{0,60}$/;

export async function recordedClip(key: string, lang: string): Promise<Uint8Array | null> {
  if (!KEY_RE.test(key)) return null;
  const base = lang.toLowerCase().split(/[-_]/)[0];
  try {
    return new Uint8Array(await readFile(path.join(clipsRoot(), base ?? "vi", `${key}.mp3`)));
  } catch {
    return null;
  }
}

export function cacheKey(text: string, lang: string): string {
  const cfg = ttsConfigFromEnv();
  const base = lang.toLowerCase().split(/[-_]/)[0] ?? "vi";
  const voice = cfg.voices[base] ?? "";
  const hash = createHash("sha1")
    .update([cfg.provider, voice, cfg.pitchPercent, cfg.rate, lang, text.trim()].join("|"))
    .digest("hex");
  return `tts/${base}/${hash}.mp3`;
}

export async function getOrSynthesize(
  text: string,
  lang: string,
  clip?: string,
): Promise<AudioResult | null> {
  if (clip) {
    const bytes = await recordedClip(clip, lang);
    if (bytes) return { bytes, source: "clip" };
  }
  const cfg = ttsConfigFromEnv();
  if (!cloudTtsEnabled(cfg)) return null;

  const storage = fileStorage();
  const key = cacheKey(text, lang);
  if (await storage.exists(key)) return { bytes: await storage.get(key), source: "cache" };

  const bytes = await synthesizeWithProvider(text, lang, cfg);
  await storage.put(key, bytes, "audio/mpeg");
  return { bytes, source: "cloud" };
}
