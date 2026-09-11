/**
 * `pnpm tts:voices` (ADR-11): prints the provider voices this account may use, so TTS_VOICE_VI
 * can be set to a code that really exists instead of a guess. Vbee only for now.
 */
import { listVbeeVoices, ttsConfigFromEnv } from "@mtct/core/tts";

async function main() {
  const cfg = ttsConfigFromEnv();
  if (cfg.provider !== "vbee") {
    console.log(
      `TTS_PROVIDER=${cfg.provider}: danh sách giọng xem ở tài liệu của nhà cung cấp. ` +
        "Đặt TTS_PROVIDER=vbee để liệt kê giọng tiếng Việt.",
    );
    return;
  }
  const voices = await listVbeeVoices(cfg, process.argv[2] ?? "vi-VN");
  if (voices.length === 0) {
    console.log("Không lấy được danh sách giọng (kiểm tra TTS_API_KEY / TTS_APP_ID).");
    return;
  }
  for (const v of voices) console.log(`${v.code.padEnd(40)} ${v.gender ?? ""} ${v.name}`);
  console.log(`\n${voices.length} giọng. Chép mã vào TTS_VOICE_VI trong .env.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
