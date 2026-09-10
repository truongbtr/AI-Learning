import { describe, expect, it } from "vitest";
import {
  buildAzureSsml,
  cloudTtsEnabled,
  googleAudioConfig,
  synthesizeWithProvider,
  ttsConfigFromEnv,
} from "./provider";

describe("ttsConfigFromEnv", () => {
  it("defaults to webspeech (no cloud call) and northern Vietnamese neural voices", () => {
    const cfg = ttsConfigFromEnv({});
    expect(cfg.provider).toBe("webspeech");
    expect(cloudTtsEnabled(cfg)).toBe(false);
    expect(ttsConfigFromEnv({ TTS_PROVIDER: "azure" }).voices.vi).toBe("vi-VN-HoaiMyNeural");
    expect(ttsConfigFromEnv({ TTS_PROVIDER: "google" }).voices.vi).toBe("vi-VN-Neural2-A");
  });

  it("is only enabled with a provider and a key", () => {
    expect(cloudTtsEnabled(ttsConfigFromEnv({ TTS_PROVIDER: "azure" }))).toBe(false);
    expect(cloudTtsEnabled(ttsConfigFromEnv({ TTS_PROVIDER: "azure", TTS_API_KEY: "k" }))).toBe(
      true,
    );
  });
});

describe("prosody", () => {
  it("builds SSML with a raised pitch and escaped text", () => {
    const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "azure", TTS_API_KEY: "k" });
    const ssml = buildAzureSsml("Chào Thy & bạn!", "vi-VN", "vi-VN-HoaiMyNeural", cfg);
    expect(ssml).toContain('pitch="+12%"');
    expect(ssml).toContain('rate="0.9"');
    expect(ssml).toContain("Chào Thy &amp; bạn!");
  });

  it("converts the pitch percentage to semitones for Google", () => {
    const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "google", TTS_API_KEY: "k" });
    expect(googleAudioConfig(cfg)).toEqual({ audioEncoding: "MP3", speakingRate: 0.9, pitch: 2 });
  });
});

describe("synthesizeWithProvider", () => {
  it("posts SSML to Azure with the subscription key and returns the bytes", async () => {
    const cfg = ttsConfigFromEnv({
      TTS_PROVIDER: "azure",
      TTS_API_KEY: "secret",
      TTS_REGION: "southeastasia",
    });
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
    }) as unknown as typeof fetch;
    const bytes = await synthesizeWithProvider("Xin chào", "vi-VN", cfg, fetchImpl);
    expect(Array.from(bytes)).toEqual([1, 2, 3]);
    expect(calls[0]?.url).toBe(
      "https://southeastasia.tts.speech.microsoft.com/cognitiveservices/v1",
    );
    const headers = (calls[0]?.init.headers ?? {}) as Record<string, string>;
    expect(headers["Ocp-Apim-Subscription-Key"]).toBe("secret");
  });

  it("surfaces provider errors", async () => {
    const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "google", TTS_API_KEY: "bad" });
    const fetchImpl = (async () =>
      new Response("denied", { status: 403 })) as unknown as typeof fetch;
    await expect(synthesizeWithProvider("x", "vi-VN", cfg, fetchImpl)).rejects.toThrow(
      "Google TTS 403",
    );
  });
});
