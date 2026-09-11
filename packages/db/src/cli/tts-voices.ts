/**
 * `pnpm tts:voices [locale]` (ADR-11 + the Azure addendum): prints the voices the configured
 * resource may really use, so TTS_VOICE_VI / TTS_VOICE_EN can be set to a code that exists
 * instead of a guess. Default vendor is Azure; Vbee is still listed when TTS_PROVIDER=vbee.
 */
import { cloudTtsEnabled, listAzureVoices, listVbeeVoices, ttsConfigFromEnv } from "@mtct/core/tts";

async function main() {
  const cfg = ttsConfigFromEnv();
  const filter = process.argv[2];

  if (cfg.provider === "vbee") {
    const voices = await listVbeeVoices(cfg, filter ?? "vi-VN");
    if (voices.length === 0) {
      console.log("Không lấy được danh sách giọng (kiểm tra TTS_API_KEY / TTS_APP_ID).");
      return;
    }
    for (const v of voices) console.log(`${v.code.padEnd(40)} ${v.gender ?? ""} ${v.name}`);
    console.log(`\n${voices.length} giọng Vbee. Chép mã vào TTS_VOICE_VI trong .env.`);
    return;
  }

  if (cfg.provider !== "azure") {
    console.log(
      `TTS_PROVIDER=${cfg.provider}: danh sách giọng xem ở tài liệu của nhà cung cấp. ` +
        "Đặt TTS_PROVIDER=azure (mặc định) để liệt kê giọng Azure.",
    );
    return;
  }
  if (!cloudTtsEnabled(cfg)) {
    console.log(
      "Chưa có TTS_API_KEY trong .env — chưa gọi được Azure. " +
        "Điền khoá của tài nguyên Speech (bậc F0) rồi chạy lại.",
    );
    return;
  }

  const voices = await listAzureVoices(cfg, filter ?? "");
  const interesting = filter ? voices : voices.filter((v) => /^(vi-VN|en-US)/.test(v.locale ?? ""));
  for (const v of interesting)
    console.log(`${(v.locale ?? "").padEnd(8)} ${v.code.padEnd(30)} ${v.gender ?? ""} ${v.name}`);
  console.log(
    `\n${interesting.length}/${voices.length} giọng ở vùng ${cfg.region}. ` +
      `Đang dùng: vi=${cfg.voices.vi} · en=${cfg.voices.en} (TTS_RATE=${cfg.rate || "giọng gốc"}, chỉ áp cho tiếng Anh).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
