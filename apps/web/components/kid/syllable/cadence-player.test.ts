import { describe, expect, it } from "vitest";
import { playCadence } from "./cadence-player";

/**
 * docs/08 pha 12 việc 5: the audio a child hears comes out in exactly the order of `cadence()`,
 * for five sample syllables — one with no onset ("anh") and one with a glide ("quyển"). Each step
 * is a separate mp3 fetched from /api/tts; the fake voice below records the URL it would fetch and
 * only lets the next step start once the last one has "finished playing".
 */
const SAMPLES: Record<string, string[]> = {
  bà: ["bờ", "a", "ba", "huyền", "bà"],
  anh: ["anh"],
  quyển: ["quờ", "yên", "quyên", "hỏi", "quyển"],
  nghé: ["ngờ", "e", "nghe", "sắc", "nghé"],
  mẹ: ["mờ", "e", "me", "nặng", "mẹ"],
};

describe("the rhythm as it is played", () => {
  it.each(Object.entries(SAMPLES))(
    "plays %s one mp3 after another, in order",
    async (tieng, steps) => {
      const fetched: string[] = [];
      let playingNow = 0;
      const said = await playCadence(tieng, {
        speak: async (text) => {
          playingNow++;
          expect(playingNow).toBe(1); // never two steps at once
          fetched.push(`/api/tts?text=${encodeURIComponent(text)}&lang=vi-VN`);
          await Promise.resolve();
          playingNow--;
        },
        wait: async () => {},
      });
      expect(said).toEqual(steps);
      expect(fetched).toEqual(
        steps.map((s) => `/api/tts?text=${encodeURIComponent(s)}&lang=vi-VN`),
      );
    },
  );

  it("lights each step as it starts", async () => {
    const lit: string[] = [];
    await playCadence("bà", {
      speak: async () => {},
      wait: async () => {},
      onStep: (s) => lit.push(s.kind),
    });
    expect(lit).toEqual(["onset", "rime", "blend", "tone", "full"]);
  });

  it("stops quietly when the child has moved on", async () => {
    let n = 0;
    const said = await playCadence("quyển", {
      speak: async () => {
        n++;
      },
      wait: async () => {},
      alive: () => n < 2,
    });
    expect(said).toEqual(["quờ", "yên"]);
  });
});
