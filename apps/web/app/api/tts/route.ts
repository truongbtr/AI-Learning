import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { getOrSynthesize } from "@/lib/tts/synthesize";

export const dynamic = "force-dynamic";

const Query = z.object({
  text: z.string().trim().min(1).max(400),
  lang: z.enum(["vi-VN", "en-US"]).default("vi-VN"),
  /** Which cloned child voice: decided by the screen from the child's avatar/mascot. */
  voice: z.enum(["boy", "girl"]).default("girl"),
  /** Optional recorded-clip key (content/art/audio/<lang>/[voice/]<key>.mp3), checked first. */
  clip: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{0,60}$/)
    .optional(),
});

/**
 * GET /api/tts?text=…&lang=vi-VN&voice=girl[&clip=key] → audio/mpeg, or 204 when no recorded
 * clip exists and cloud TTS is not configured (client falls back to Web Speech). Any signed-in
 * user; text only — no student data is sent to the provider (nicknames only, docs/00).
 */
export const GET = handle(async (request: Request) => {
  await requireUser();
  const url = new URL(request.url);
  const q = Query.parse({
    text: url.searchParams.get("text") ?? "",
    lang: url.searchParams.get("lang") ?? "vi-VN",
    voice: url.searchParams.get("voice") ?? "girl",
    clip: url.searchParams.get("clip") ?? undefined,
  });
  let result: Awaited<ReturnType<typeof getOrSynthesize>> = null;
  try {
    result = await getOrSynthesize(q.text, q.lang, q.voice, q.clip);
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
