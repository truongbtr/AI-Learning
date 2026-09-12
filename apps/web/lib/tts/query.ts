import { z } from "zod";

/**
 * What `/api/tts` accepts (docs/06 §3).
 *
 * The language is normalised rather than demanded in full. Half the kid components ask for `vi`
 * and half for `vi-VN` — `useSpeak` defaults to `vi-VN`, but every direct call in `finale.tsx`,
 * `homework-station.tsx` and `retention.tsx` passes `vi`. A strict enum turned all of those into
 * 400s, and because the client falls back to the device voice on any non-200, nothing looked
 * broken: the child simply never heard the Azure voice the owner picked in phase 3
 * (`vi-VN-HoaiMyNeural`, chosen from six samples) and got the robotic system voice instead.
 *
 * `packages/core/tts/config.ts` already reduces any tag to `vi` or `en`, so accepting the short
 * form here loses nothing and removes a whole class of silent failure.
 */
export const ttsQuerySchema = z.object({
  text: z.string().trim().min(1).max(400),
  lang: z
    .string()
    .trim()
    .default("vi-VN")
    .transform((value) => (value.toLowerCase().startsWith("en") ? "en-US" : "vi-VN")),
  /** Optional recorded-clip key (content/art/audio/<lang>/<key>.mp3), checked first. */
  clip: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{0,60}$/)
    .optional(),
});

export type TtsQuery = z.infer<typeof ttsQuerySchema>;
