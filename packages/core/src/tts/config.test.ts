import { describe, expect, it } from "vitest";
import {
  azureTtsUrl,
  azureVoicesUrl,
  buildAzureSsml,
  cloudTtsEnabled,
  DEFAULT_TTS_RATE,
  googleAudioConfig,
  localeFor,
  resolveVoice,
  speedMultiplier,
  ttsConfigFromEnv,
  vbeeBody,
} from "./config";
import {
  listAzureVoices,
  missingAudio,
  pregenerateAudio,
  synthesizeWithProvider,
  ttsCacheKey,
} from "./synthesize";

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

describe("TTS config (ADR-11 phuong an c + bo sung Azure)", () => {
  it("defaults to Azure eastasia but stays silent with no key — an empty .env still runs", () => {
    const cfg = ttsConfigFromEnv({});
    expect(cfg.provider).toBe("azure");
    expect(cfg.region).toBe("eastasia");
    expect(cloudTtsEnabled(cfg)).toBe(false); // no key -> Web Speech
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

  it("reads Vietnamese at the voice's own speed — no prosody (the owner chose that sample)", () => {
    const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "azure", TTS_API_KEY: "k" });
    const ssml = buildAzureSsml("ba cong hai", "vi-VN", cfg.voices.vi, cfg);
    expect(ssml).not.toContain("prosody");
    expect(ssml).toContain("vi-VN-HoaiMyNeural");
    expect(ssml).toContain('xml:lang="vi-VN"');
  });

  it("slows English by TTS_RATE, and only English", () => {
    const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "azure", TTS_API_KEY: "k" });
    expect(cfg.rate).toBe("-10%");
    const ssml = buildAzureSsml("How many apples?", "en-US", cfg.voices.en, cfg);
    expect(ssml).toContain('<prosody rate="-10%">');
    expect(ssml).toContain("en-US-AnaNeural");
    expect(googleAudioConfig(cfg, "en").speakingRate).toBeCloseTo(0.9);
    expect(googleAudioConfig(cfg, "vi").speakingRate).toBe(1);
  });

  it("reads the rate as a percentage or as a multiplier", () => {
    expect(speedMultiplier("-10%")).toBeCloseTo(0.9);
    expect(speedMultiplier("+20%")).toBeCloseTo(1.2);
    expect(speedMultiplier("0.85")).toBe(0.85);
    expect(speedMultiplier("")).toBe(1);
    expect(speedMultiplier("nonsense")).toBe(1);
  });

  it("builds the Azure endpoints from the region", () => {
    const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "azure", TTS_API_KEY: "k" });
    expect(azureTtsUrl(cfg.region)).toBe(
      "https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1",
    );
    expect(azureVoicesUrl(cfg.region)).toBe(
      "https://eastasia.tts.speech.microsoft.com/cognitiveservices/voices/list",
    );
  });

  it("escapes XML so a prompt with & or < cannot break the SSML", () => {
    const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "azure", TTS_API_KEY: "k" });
    expect(buildAzureSsml("3 < 5 & 2", "vi", "v", cfg)).toContain("3 &lt; 5 &amp; 2");
  });

  it("maps any language tag onto the two supported locales", () => {
    expect(localeFor("en-GB")).toBe("en-US");
    expect(localeFor("vi")).toBe("vi-VN");
  });

  it("keeps Vbee as an optional provider, at a speed its API accepts (ADR-11)", () => {
    const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "vbee", TTS_API_KEY: "k", TTS_APP_ID: "app" });
    expect(cfg.provider).toBe("vbee");
    expect(resolveVoice(cfg, "vi")).toBe("hn_female_ngochuyen_full_48k-fhg");
    // Vietnamese keeps its own speed, English takes TTS_RATE.
    expect(vbeeBody("ba cong hai", "v", cfg, "vi")).toMatchObject({ speed: 1, audio_type: "mp3" });
    expect(vbeeBody("three", "v", cfg, "en").speed).toBeCloseTo(0.9);
    // Vbee refuses anything outside 0.25-1.9, so the rate is clamped rather than rejected.
    expect(vbeeBody("x", "v", { ...cfg, rate: "500%" }, "en").speed).toBe(1.9);
    expect(vbeeBody("x", "v", { ...cfg, rate: "0.05" }, "en").speed).toBe(0.25);
  });

  it("leaves English on Web Speech when Vbee has no English voice configured", () => {
    const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "vbee", TTS_API_KEY: "k" });
    expect(resolveVoice(cfg, "en-US")).toBeNull();
  });
});

describe("talking to Azure", () => {
  const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "azure", TTS_API_KEY: "secret" });

  it("posts SSML to the region endpoint and takes the mp3 straight from the reply", async () => {
    const seen: { url: string; init: RequestInit }[] = [];
    const fakeFetch = (async (url: string, init: RequestInit) => {
      seen.push({ url, init });
      return new Response(new Uint8Array([0xff, 0xfb, 0x90]), { status: 200 });
    }) as unknown as typeof fetch;

    const bytes = await synthesizeWithProvider("Chào con!", "vi", cfg, fakeFetch);
    expect(bytes).toEqual(new Uint8Array([0xff, 0xfb, 0x90]));
    const call = seen[0];
    expect(call?.url).toBe("https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1");
    const headers = call?.init.headers as Record<string, string>;
    expect(headers["Ocp-Apim-Subscription-Key"]).toBe("secret");
    expect(headers["Content-Type"]).toBe("application/ssml+xml");
    expect(headers["X-Microsoft-OutputFormat"]).toBe("audio-24khz-48kbitrate-mono-mp3");
    expect(String(call?.init.body)).toContain("vi-VN-HoaiMyNeural");
    expect(String(call?.init.body)).not.toContain("prosody");
  });

  it("lists the voices of the resource", async () => {
    const fakeFetch = (async () =>
      Response.json([
        {
          ShortName: "vi-VN-HoaiMyNeural",
          LocalName: "Hoài My",
          Gender: "Female",
          Locale: "vi-VN",
        },
        { ShortName: "en-US-AnaNeural", LocalName: "Ana", Gender: "Female", Locale: "en-US" },
        { ShortName: "fr-FR-DeniseNeural", LocalName: "Denise", Gender: "Female", Locale: "fr-FR" },
      ])) as unknown as typeof fetch;
    const all = await listAzureVoices(cfg, "", fakeFetch);
    expect(all).toHaveLength(3);
    const vi = await listAzureVoices(cfg, "vi", fakeFetch);
    expect(vi.map((v) => v.code)).toEqual(["vi-VN-HoaiMyNeural"]);
  });
});

describe("TTS cache", () => {
  const cfg = ttsConfigFromEnv({ TTS_PROVIDER: "azure", TTS_API_KEY: "k" });

  it("keys by text + voice + rate, splitting the two languages", () => {
    expect(ttsCacheKey("mot hai ba", "vi", cfg)).toBe(ttsCacheKey(" mot hai ba ", "vi-VN", cfg));
    expect(ttsCacheKey("mot hai ba", "vi", cfg)).not.toBe(ttsCacheKey("mot hai bon", "vi", cfg));
    expect(ttsCacheKey("one", "en", cfg)).toMatch(/^tts\/en\//);
    const slower = { ...cfg, rate: "-30%" };
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
    const first = await pregenerateAudio(lines, cfg, storage, {
      fetchImpl: fakeFetch,
      pacingMs: 0,
    });
    expect(first.generated).toBe(2);
    expect(calls).toBe(2);

    const second = await pregenerateAudio(lines, cfg, storage, {
      fetchImpl: fakeFetch,
      pacingMs: 0,
    });
    expect(second.generated).toBe(0);
    expect(second.cached).toBe(2);
    expect(calls).toBe(2);
  });

  it("waits out a rate limit and carries on — the free tier allows 20 requests a minute", async () => {
    const storage = memoryStorage();
    let calls = 0;
    const throttled = (async () => {
      calls++;
      // Every other request is refused for being too fast, the way Azure's F0 tier does it.
      return calls % 2 === 0
        ? new Response("Too many requests", { status: 429, headers: { "Retry-After": "0.01" } })
        : new Response(new Uint8Array([1, 2, 3]), { status: 200 });
    }) as unknown as typeof fetch;
    const lines = [
      { text: "Mot", lang: "vi" },
      { text: "Hai", lang: "vi" },
      { text: "Ba", lang: "vi" },
    ];
    const result = await pregenerateAudio(lines, cfg, storage, {
      fetchImpl: throttled,
      pacingMs: 0,
    });
    expect(result.generated).toBe(3);
    expect(result.quotaReached).toBe(false);
    expect(result.waitedMs).toBeGreaterThan(0);
  });

  it("gives up for now when the rate limit never lifts, keeping what it already wrote", async () => {
    const storage = memoryStorage();
    const alwaysThrottled = (async () =>
      new Response("Too many requests", {
        status: 429,
        headers: { "Retry-After": "0.01" },
      })) as unknown as typeof fetch;
    const result = await pregenerateAudio(
      [
        { text: "Mot", lang: "vi" },
        { text: "Hai", lang: "vi" },
      ],
      cfg,
      storage,
      { fetchImpl: alwaysThrottled, pacingMs: 0 },
    );
    expect(result.generated).toBe(0);
    expect(result.quotaReached).toBe(true);
    expect(result.remaining).toBe(2);
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
    const result = await pregenerateAudio(lines, cfg, storage, {
      fetchImpl: quotaFetch,
      pacingMs: 0,
    });
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
