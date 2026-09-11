import { describe, expect, it } from "vitest";
import {
  buildAzureSsml,
  cloudTtsEnabled,
  DEFAULT_TTS_RATE,
  googleAudioConfig,
  localeFor,
  resolveVoice,
  ttsConfigFromEnv,
  vbeeBody,
} from "./config";
import { missingAudio, pregenerateAudio, ttsCacheKey } from "./synthesize";

/** In-memory FileStorage so the cache logic can be tested without touching disk. */
function memoryStorage() {
  const files = new Map<string, Uint8Array>();
  return {
    files,
    async put(key: string, data: Uint8Array) {
      files.set(key, data);
      return { key, size: data.byteLength };
    },
    async get(key: string) {
      const v = files.get(key);
      if (!v) throw new Error(`missing ${key}`);
      return v;
    },
    async exists(key: string) {
      return files.has(key);
    },
    async delete(key: string) {
      files.delete(key);
    },
  };
}

describe("TTS config (ADR-11 phuong an c)", () => {
  it("defaults to Web Speech with no key, so the app runs with an empty .env", () => {
    const cfg = ttsConfigFromEnv({});
    expect(cfg.provider).toBe("webspeech");
    expect(cloudTtsEnabled(cfg)).toBe(false);
    expect(cfg.rate).toBe(DEFAULT_TTS_RATE);
  });

  it("uses the stock Vietnamese neural voice, never a cloned one", () => {
    const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "azure", TTS_API_KEY: "k" });
    expect(cfg.voices.vi).toBe("vi-VN-HoaiMyNeural");
    expect(cfg.voices.en).toBe("en-US-AnaNeural");
    expect(cloudTtsEnabled(cfg)).toBe(true);
  });

  it("rejects an unknown provider (e.g. the voice-cloning vendor ADR-11 removed)", () => {
    const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "voice-cloning-vendor", TTS_API_KEY: "k" });
    expect(cfg.provider).toBe("webspeech");
    expect(cloudTtsEnabled(cfg)).toBe(false);
  });

  it("stays disabled when a provider is set but the key is missing", () => {
    expect(cloudTtsEnabled(ttsConfigFromEnv({ TTS_PROVIDER: "azure" }))).toBe(false);
  });

  it("lets TTS_VOICE_VI / TTS_VOICE_EN override the stock voices", () => {
    const cfg = ttsConfigFromEnv({
      TTS_PROVIDER: "google",
      TTS_API_KEY: "k",
      TTS_VOICE_VI: "vi-VN-Wavenet-A",
      TTS_VOICE_EN: "en-US-Wavenet-F",
    });
    expect(resolveVoice(cfg, "vi-VN")).toBe("vi-VN-Wavenet-A");
    expect(resolveVoice(cfg, "en-US")).toBe("en-US-Wavenet-F");
  });

  it("reads slower than default for a 6-year-old", () => {
    const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "azure", TTS_API_KEY: "k" });
    expect(cfg.rate).toBeLessThan(1);
    const ssml = buildAzureSsml("ba cong hai", "vi-VN", cfg.voices.vi, cfg);
    expect(ssml).toContain('rate="0.9"');
    expect(ssml).toContain("vi-VN-HoaiMyNeural");
    expect(googleAudioConfig(cfg).speakingRate).toBe(0.9);
  });

  it("escapes XML so a prompt with & or < cannot break the SSML", () => {
    const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "azure", TTS_API_KEY: "k" });
    expect(buildAzureSsml("3 < 5 & 2", "vi", "v", cfg)).toContain("3 &lt; 5 &amp; 2");
  });

  it("maps any language tag onto the two supported locales", () => {
    expect(localeFor("en-GB")).toBe("en-US");
    expect(localeFor("vi")).toBe("vi-VN");
  });

  it("uses Vbee for Vietnamese with a speed the API accepts (ADR-11)", () => {
    const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "vbee", TTS_API_KEY: "k", TTS_APP_ID: "app" });
    expect(cfg.provider).toBe("vbee");
    expect(resolveVoice(cfg, "vi")).toBe("hn_female_ngochuyen_full_48k-fhg");
    expect(vbeeBody("ba cong hai", "v", cfg)).toMatchObject({ speed: 0.9, audio_type: "mp3" });
    // Vbee refuses anything outside 0.25-1.9, so the rate is clamped rather than rejected.
    expect(vbeeBody("x", "v", { ...cfg, rate: 5 }).speed).toBe(1.9);
    expect(vbeeBody("x", "v", { ...cfg, rate: 0.05 }).speed).toBe(0.25);
  });

  it("leaves English on Web Speech when Vbee has no English voice configured", () => {
    const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "vbee", TTS_API_KEY: "k" });
    expect(resolveVoice(cfg, "en-US")).toBeNull();
  });
});

describe("TTS cache", () => {
  const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "azure", TTS_API_KEY: "k" });

  it("keys by text + voice + rate, splitting the two languages", () => {
    expect(ttsCacheKey("mot hai ba", "vi", cfg)).toBe(ttsCacheKey(" mot hai ba ", "vi-VN", cfg));
    expect(ttsCacheKey("mot hai ba", "vi", cfg)).not.toBe(ttsCacheKey("mot hai bon", "vi", cfg));
    expect(ttsCacheKey("one", "en", cfg)).toMatch(/^tts\/en\//);
    const slower = { ...cfg, rate: 0.7 };
    expect(ttsCacheKey("mot", "vi", cfg)).not.toBe(ttsCacheKey("mot", "vi", slower));
  });

  it("pregenerates once per distinct line and reuses the cache", async () => {
    const storage = memoryStorage();
    let calls = 0;
    const fakeFetch = (async () => {
      calls++;
      return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
    }) as unknown as typeof fetch;
    const lines = [
      { text: "Ba cong hai bang may?", lang: "vi" },
      { text: "Ba cong hai bang may?", lang: "vi" },
      { text: "How many apples?", lang: "en" },
    ];
    const first = await pregenerateAudio(lines, cfg, storage, fakeFetch);
    expect(first.generated).toBe(2);
    expect(calls).toBe(2);

    const second = await pregenerateAudio(lines, cfg, storage, fakeFetch);
    expect(second.generated).toBe(0);
    expect(second.cached).toBe(2);
    expect(calls).toBe(2);
  });

  it("skips silently (never throws) when there is no key — content:import must still pass", async () => {
    const storage = memoryStorage();
    const result = await pregenerateAudio(
      [{ text: "Hai cong hai", lang: "vi" }],
      ttsConfigFromEnv({}),
      storage,
    );
    expect(result.skipped).toBe(1);
    expect(result.failed).toEqual([]);
    expect(storage.files.size).toBe(0);
  });

  it("stops quietly when the provider's daily quota is reached, and says what is left", async () => {
    const storage = memoryStorage();
    let calls = 0;
    const quotaFetch = (async () => {
      calls++;
      return calls === 1
        ? new Response(new Uint8Array([1]), { status: 200 })
        : new Response("daily quota exceeded", { status: 429 });
    }) as unknown as typeof fetch;
    const lines = [
      { text: "Mot", lang: "vi" },
      { text: "Hai", lang: "vi" },
      { text: "Ba", lang: "vi" },
    ];
    const result = await pregenerateAudio(lines, cfg, storage, quotaFetch);
    expect(result.generated).toBe(1);
    expect(result.quotaReached).toBe(true);
    expect(result.remaining).toBe(2);
    expect(result.failed).toEqual([]); // a quota stop is not a failure

    // Tomorrow's run picks up exactly the two that are missing.
    const okFetch = (async () =>
      new Response(new Uint8Array([1]), { status: 200 })) as unknown as typeof fetch;
    const second = await pregenerateAudio(lines, cfg, storage, okFetch);
    expect(second.cached).toBe(1);
    expect(second.generated).toBe(2);
    expect(second.remaining).toBe(0);
  });

  it("counts how many lines still have no mp3 (content:stats)", async () => {
    const storage = memoryStorage();
    const lines = [
      { text: "Mot", lang: "vi" },
      { text: "Hai", lang: "vi" },
    ];
    expect(await missingAudio(lines, cfg, storage)).toEqual({
      total: 2,
      missing: 2,
      enabled: true,
    });
    await pregenerateAudio(
      [lines[0] as { text: string; lang: string }],
      cfg,
      storage,
      (async () => new Response(new Uint8Array([1]), { status: 200 })) as unknown as typeof fetch,
    );
    expect((await missingAudio(lines, cfg, storage)).missing).toBe(1);
  });

  it("records a provider failure per line instead of aborting the import", async () => {
    const storage = memoryStorage();
    const failing = (async () =>
      new Response("voice not found", { status: 500 })) as unknown as typeof fetch;
    const result = await pregenerateAudio([{ text: "Mot", lang: "vi" }], cfg, storage, failing);
    expect(result.generated).toBe(0);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]?.error).toContain("500");
    expect(result.quotaReached).toBe(false);
  });
});
