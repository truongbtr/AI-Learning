import { describe, expect, it } from "vitest";
import {
  buildAzureSsml,
  cloudTtsEnabled,
  googleAudioConfig,
  resolveVoice,
  synthesizeWithProvider,
  ttsConfigFromEnv,
} from "./provider";

describe("ttsConfigFromEnv", () => {
  it("defaults to webspeech (no cloud call) and northern Vietnamese stock voices per persona", () => {
    const cfg = ttsConfigFromEnv({});
    expect(cfg.provider).toBe("webspeech");
    expect(cloudTtsEnabled(cfg)).toBe(false);
    const azure = ttsConfigFromEnv({ TTS_PROVIDER: "azure" });
    expect(azure.voices.girl.vi).toBe("vi-VN-HoaiMyNeural");
    expect(azure.voices.boy.vi).toBe("vi-VN-NamMinhNeural");
    expect(ttsConfigFromEnv({ TTS_PROVIDER: "google" }).voices.boy.vi).toBe("vi-VN-Neural2-D");
  });

  it("is only enabled with a provider and a key (and cloned voice ids for ElevenLabs)", () => {
    expect(cloudTtsEnabled(ttsConfigFromEnv({ TTS_PROVIDER: "azure" }))).toBe(false);
    expect(cloudTtsEnabled(ttsConfigFromEnv({ TTS_PROVIDER: "azure", TTS_API_KEY: "k" }))).toBe(
      true,
    );
    expect(
      cloudTtsEnabled(ttsConfigFromEnv({ TTS_PROVIDER: "elevenlabs", TTS_API_KEY: "k" })),
    ).toBe(false);
    expect(
      cloudTtsEnabled(
        ttsConfigFromEnv({ TTS_PROVIDER: "elevenlabs", TTS_API_KEY: "k", TTS_VOICE_GIRL: "v1" }),
      ),
    ).toBe(true);
  });

  it("uses the cloned voice for every language and falls back across personas", () => {
    const cfg = ttsConfigFromEnv({
      TTS_PROVIDER: "elevenlabs",
      TTS_API_KEY: "k",
      TTS_VOICE_GIRL: "girl-id",
    });
    expect(resolveVoice(cfg, "girl", "en-US")).toBe("girl-id");
    expect(resolveVoice(cfg, "boy", "vi-VN")).toBe("girl-id"); // boy not cloned yet
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
  it("posts to ElevenLabs with the cloned voice id and the api key", async () => {
    const cfg = ttsConfigFromEnv({
      TTS_PROVIDER: "elevenlabs",
      TTS_API_KEY: "secret",
      TTS_VOICE_BOY: "boy-id",
      TTS_VOICE_GIRL: "girl-id",
    });
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(new Uint8Array([7]), { status: 200 });
    }) as unknown as typeof fetch;
    await synthesizeWithProvider("Chào Thanh", "vi-VN", "boy", cfg, fetchImpl);
    expect(calls[0]?.url).toContain("/v1/text-to-speech/boy-id");
    const headers = (calls[0]?.init.headers ?? {}) as Record<string, string>;
    expect(headers["xi-api-key"]).toBe("secret");
    expect(JSON.parse(String(calls[0]?.init.body)).model_id).toBe("eleven_multilingual_v2");
  });

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
    const bytes = await synthesizeWithProvider("Xin chào", "vi-VN", "girl", cfg, fetchImpl);
    expect(Array.from(bytes)).toEqual([1, 2, 3]);
    expect(calls[0]?.url).toBe(
      "https://southeastasia.tts.speech.microsoft.com/cognitiveservices/v1",
    );
    const headers = (calls[0]?.init.headers ?? {}) as Record<string, string>;
    expect(headers["Ocp-Apim-Subscription-Key"]).toBe("secret");
    expect(String(calls[0]?.init.body)).toContain("vi-VN-HoaiMyNeural");
  });

  it("surfaces provider errors", async () => {
    const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "google", TTS_API_KEY: "bad" });
    const fetchImpl = (async () =>
      new Response("denied", { status: 403 })) as unknown as typeof fetch;
    await expect(synthesizeWithProvider("x", "vi-VN", "girl", cfg, fetchImpl)).rejects.toThrow(
      "Google TTS 403",
    );
  });
});
