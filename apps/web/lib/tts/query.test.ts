import { describe, expect, it } from "vitest";
import { ttsQuerySchema } from "./query";

/**
 * The bug this guards against was invisible: every mascot line asking for `lang=vi` got a 400, the
 * client quietly fell back to the device voice, and the only symptom was that the child heard the
 * wrong voice — the one the owner rejected in phase 3.
 */
describe("/api/tts query (docs/06 §3)", () => {
  it("accepts the short tag the kid components actually send", () => {
    expect(ttsQuerySchema.parse({ text: "Chào con!", lang: "vi" }).lang).toBe("vi-VN");
    expect(ttsQuerySchema.parse({ text: "Hello", lang: "en" }).lang).toBe("en-US");
  });

  it("accepts the full tag too", () => {
    expect(ttsQuerySchema.parse({ text: "Chào con!", lang: "vi-VN" }).lang).toBe("vi-VN");
    expect(ttsQuerySchema.parse({ text: "Hello", lang: "en-US" }).lang).toBe("en-US");
  });

  it("defaults to Vietnamese, and treats anything unknown as Vietnamese", () => {
    expect(ttsQuerySchema.parse({ text: "Chào con!" }).lang).toBe("vi-VN");
    expect(ttsQuerySchema.parse({ text: "Chào con!", lang: "fr" }).lang).toBe("vi-VN");
  });

  it("still refuses empty text and a clip key that is not a key", () => {
    expect(() => ttsQuerySchema.parse({ text: "   " })).toThrow();
    expect(() => ttsQuerySchema.parse({ text: "x", clip: "../secret" })).toThrow();
  });
});
