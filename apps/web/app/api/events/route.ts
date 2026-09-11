import { prisma } from "@mtct/db";
import { ApiError, handle } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
/** A long-lived response: never cache it, never pre-render it. */
export const fetchCache = "force-no-store";

/** How often the stream looks for something new. Cheap queries, one child at a time. */
const POLL_MS = 3_000;
/** A comment line often enough that no proxy decides the connection is idle. */
const HEARTBEAT_MS = 20_000;

interface Snapshot {
  sessionId: string | null;
  status: string | null;
  answered: number;
  stars: number;
  graded: number;
  badges: string[];
}

async function snapshotOf(studentId: string): Promise<Snapshot> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const session = await prisma.session.findFirst({
    where: { studentId, date: today },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      starsEarned: true,
      attempts: { select: { gradedBy: true } },
    },
  });
  const badges = await prisma.studentBadge.findMany({
    where: { studentId, seen: false },
    select: { badgeCode: true },
    orderBy: { earnedAt: "asc" },
  });
  return {
    sessionId: session?.id ?? null,
    status: session?.status ?? null,
    answered: session?.attempts.length ?? 0,
    stars: session?.starsEarned ?? 0,
    graded:
      session?.attempts.filter((a) => a.gradedBy === "AI" || a.gradedBy === "PARENT").length ?? 0,
    badges: badges.map((b) => b.badgeCode),
  };
}

function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return (
    a.sessionId === b.sessionId &&
    a.status === b.status &&
    a.answered === b.answered &&
    a.stars === b.stars &&
    a.graded === b.graded &&
    a.badges.join(",") === b.badges.join(",")
  );
}

/**
 * GET /api/events?studentId=… — server-sent events (docs/02 §5).
 *
 * What it is for: a parent watching the quest from another room, a badge that has just been
 * earned, and a photo that came back from the offline grading queue. It reports state, never
 * answers — nothing here can leak an answer key.
 *
 * The stream sets `retry`, so a browser that loses the network reconnects by itself; the child's
 * session is stored server-side and nothing depends on the stream staying up.
 */
export const GET = handle(async (request: Request) => {
  const studentId = new URL(request.url).searchParams.get("studentId");
  if (!studentId) throw new ApiError(400, "Thiếu studentId");
  const { student } = await requireStudentAccess(studentId);

  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | null = null;
  let beat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let last: Snapshot | null = null;
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      const stop = () => {
        if (timer) clearInterval(timer);
        if (beat) clearInterval(beat);
        timer = null;
        beat = null;
        try {
          controller.close();
        } catch {
          // already closed by the client going away
        }
      };

      controller.enqueue(encoder.encode(`retry: ${POLL_MS}\n\n`));
      last = await snapshotOf(student.id);
      send("state", last);

      timer = setInterval(async () => {
        try {
          const now = await snapshotOf(student.id);
          if (last && !sameSnapshot(last, now)) send("state", now);
          last = now;
        } catch {
          stop();
        }
      }, POLL_MS);
      beat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          stop();
        }
      }, HEARTBEAT_MS);

      request.signal.addEventListener("abort", stop);
    },
    cancel() {
      if (timer) clearInterval(timer);
      if (beat) clearInterval(beat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});
