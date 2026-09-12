import { readFile } from "node:fs/promises";
import path from "node:path";
import { getOrSynthesize, ttsConfigFromEnv } from "@mtct/core/tts";
import { prisma, recordTtsUsage } from "@mtct/db";
import { fileStorage } from "@/lib/storage";

/**
 * Audio lookup order (docs/06 §3 `useSpeak`): recorded clip → mp3 cached at import time → cloud
 * synth (also cached) → null, and then the client falls back to Web Speech.
 *
 * The mp3 cache is normally filled by `pnpm content:import` (ADR-11 muc 3), so at runtime this
 * almost always hits the `cache` branch and costs nothing.
 */
export interface AudioResult {
  bytes: Uint8Array;
  source: "clip" | "cache" | "cloud";
}

/** Real recordings of fixed mascot lines live in content/art/audio/<lang>/<key>.mp3. */
function clipsRoot(): string {
  return process.env.CONTENT_ROOT
    ? path.join(process.env.CONTENT_ROOT, "art", "audio")
    : path.resolve(process.cwd(), "..", "..", "content", "art", "audio");
}

const KEY_RE = /^[a-z0-9][a-z0-9-]{0,60}$/;

export async function recordedClip(key: string, lang: string): Promise<Uint8Array | null> {
  if (!KEY_RE.test(key)) return null;
  const base = lang.toLowerCase().startsWith("en") ? "en" : "vi";
  try {
    return new Uint8Array(await readFile(path.join(clipsRoot(), base, `${key}.mp3`)));
  } catch {
    return null;
  }
}

export async function speakAudio(
  text: string,
  lang: string,
  clip?: string,
): Promise<AudioResult | null> {
  if (clip) {
    const bytes = await recordedClip(clip, lang);
    if (bytes) return { bytes, source: "clip" };
  }
  const cfg = ttsConfigFromEnv();
  const result = await getOrSynthesize(text, lang, cfg, fileStorage());
  // Only a `cloud` result cost anything; a `cache` hit is a file on disk. Counted so the free
  // Azure allowance is visible on /admin/health (docs/08 pha 8, tiêu chí 5) rather than on a bill.
  if (result?.source === "cloud") await recordTtsUsage(prisma, text.length, cfg.provider);
  return result ? { bytes: result.bytes, source: result.source } : null;
}
