import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { speakAudio } from "@/lib/tts/synthesize";

export const dynamic = "force-dynamic";

const Query = z.object({
  text: z.string().trim().min(1).max(400),
  lang: z.enum(["vi-VN", "en-US"]).default("vi-VN"),
  /** Optional recorded-clip key (content/art/audio/<lang>/<key>.mp3), checked first. */
  clip: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{0,60}$/)
    .optional(),
});

/**
 * GET /api/tts?text=…&lang=vi-VN[&clip=key] → audio/mpeg, or 204 when there is no recorded clip,
 * nothing in the import-time mp3 cache and cloud TTS is not configured (the client then falls
 * back to Web Speech). Any signed-in user; text only — no child data leaves the machine, and the
 * voice is a stock provider voice, never a cloned one (ADR-11).
 */
export const GET = handle(async (request: Request) => {
  await requireUser();
  const url = new URL(request.url);
  const q = Query.parse({
    text: url.searchParams.get("text") ?? "",
    lang: url.searchParams.get("lang") ?? "vi-VN",
    clip: url.searchParams.get("clip") ?? undefined,
  });
  let result: Awaited<ReturnType<typeof speakAudio>> = null;
  try {
    result = await speakAudio(q.text, q.lang, q.clip);
  } catch (err) {
    // Provider outage must never break a kid screen: fall back to on-device speech.
    console.error("[tts] cloud synth failed", err);
    result = null;
  }
  if (!result) return new NextResponse(null, { status: 204 });
  return new NextResponse(Buffer.from(result.bytes), {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=86400",
      "X-Tts-Source": result.source,
    },
  });
});
