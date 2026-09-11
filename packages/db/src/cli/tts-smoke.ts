/**
 * `pnpm tts:smoke "Nghe rồi chọn ô đúng nhé!" [--en] [--out file.mp3]`
 *
 * Synthesises one sentence with the voice that is actually configured and writes an mp3 you can
 * play, so "does it sound right to a six-year-old?" can be answered in ten seconds instead of by
 * importing 1450 lines (ADR-11 addendum). Writes into `_tts-thu/` next to the repo, which is
 * gitignored — recordings are for listening, not for committing.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  cloudTtsEnabled,
  langBase,
  resolveVoice,
  synthesizeWithProvider,
  ttsConfigFromEnv,
} from "@mtct/core/tts";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const text = process.argv.slice(2).filter((a) => !a.startsWith("--"))[0];
  if (!text) {
    console.log('Dùng: pnpm tts:smoke "câu cần nghe" [--en] [--out duong-dan.mp3]');
    process.exitCode = 1;
    return;
  }
  const lang = process.argv.includes("--en") ? "en" : "vi";
  const cfg = ttsConfigFromEnv();

  if (!cloudTtsEnabled(cfg)) {
    console.log(
      `TTS_PROVIDER=${cfg.provider}, TTS_API_KEY trống — chưa gọi được nhà cung cấp. ` +
        "App vẫn chạy bình thường (con nghe bằng giọng của máy), nhưng lệnh này cần khoá.",
    );
    process.exitCode = 1;
    return;
  }
  const voice = resolveVoice(cfg, lang);
  if (!voice) {
    console.log(`Chưa có giọng cho ${lang} với nhà cung cấp ${cfg.provider}.`);
    process.exitCode = 1;
    return;
  }

  const bytes = await synthesizeWithProvider(text, lang, cfg);
  const dir = resolve(process.cwd(), "..", "..", "_tts-thu");
  mkdirSync(dir, { recursive: true });
  const out = arg("--out") ?? join(dir, `smoke-${langBase(lang)}-${Date.now()}.mp3`);
  writeFileSync(out, bytes);
  console.log(
    `${bytes.byteLength} byte → ${out}\n` +
      `giọng ${voice} (${cfg.provider}/${cfg.region})` +
      (langBase(lang) === "en"
        ? `, prosody rate=${cfg.rate || "giọng gốc"}`
        : ", giọng gốc, không prosody"),
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
