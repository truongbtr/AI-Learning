import { awardStars, prisma, recordWordMeeting, STARS, starBalance } from "@mtct/db";
import { z } from "zod";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const meetingSchema = z.object({
  sessionId: z.string().min(1),
  order: z.number().int().min(0).max(40),
  /** A meeting with one word; absent when the message only says the station is over. */
  wordId: z.string().min(1).optional(),
  correct: z.boolean().optional(),
  game: z.enum(["listen-touch", "match-pairs", "what-vanished", "market", "build-word", "say-it"]),
  /** The round is over: the star for the work goes here, since there is no Attempt row. */
  done: z.boolean().optional(),
});

/**
 * POST /api/kid/vocab — one meeting with one word in a vocabulary game (pha 11, ADR-22).
 *
 * The child's device says what happened; the server decides what it means. The Leitner box, the
 * next due date and whether the word moved up are computed here from `LexemeProgress`, so nothing a
 * tampered-with client sends can invent progress: the worst it can do is claim a meeting that did
 * happen, which only ever brings a word back sooner.
 *
 * Whose session it is matters as much as who is logged in: `requireStudentAccess` checks the role
 * **and** the right to this `studentId`, and the session is checked to belong to that child.
 */
export const POST = handle(async (request: Request) => {
  const body = await parseBody(request, meetingSchema);
  const session = await prisma.session.findUnique({
    where: { id: body.sessionId },
    select: { studentId: true, status: true },
  });
  if (!session) throw new ApiError(404, "Không tìm thấy phiên học");
  const { student } = await requireStudentAccess(session.studentId);

  // The end of a round: one star for the work, exactly like any other station (ADR-16). The
  // ledger key is the station, so a reload or a second tap never pays twice.
  if (body.done) {
    const starsAwarded = await awardStars(prisma, student.id, STARS.exercise, "exercise", {
      type: "VocabStation",
      id: `${body.sessionId}-${body.order}`,
    });
    if (starsAwarded > 0) {
      await prisma.session.update({
        where: { id: body.sessionId },
        data: { starsEarned: { increment: starsAwarded }, status: "IN_PROGRESS" },
      });
    }
    return json(
      { starsAwarded, starsTotal: await starBalance(prisma, student.id) },
      { status: 201 },
    );
  }

  if (!body.wordId || body.correct === undefined)
    throw new ApiError(400, "Thiếu từ hoặc kết quả của lần gặp này");

  const word = await prisma.word.findUnique({
    where: { id: body.wordId },
    select: { id: true, isActive: true },
  });
  if (!word?.isActive) throw new ApiError(404, "Không tìm thấy từ");

  const result = await recordWordMeeting(prisma, {
    studentId: student.id,
    wordId: word.id,
    correct: body.correct,
    game: body.game,
  });
  // The box itself never goes to the child's screen — only whether a boat comes in.
  return json({ promoted: result.promoted }, { status: 201 });
});
