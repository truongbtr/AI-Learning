import {
  awardStars,
  prisma,
  recordSyllableMeeting,
  STARS,
  SyllableMeetingError,
  starBalance,
} from "@mtct/db";
import { z } from "zod";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const tone = z.enum(["ngang", "huyen", "sac", "hoi", "nga", "nang"]);
const piece = z
  .string()
  .max(4)
  .regex(/^[a-zàáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]*$/);

const answerSchema = z.discriminatedUnion("game", [
  z.object({ game: z.enum(["build", "split"]), onset: piece, rime: piece.min(1), tone }),
  z.object({ game: z.literal("tone"), tone }),
  z.object({
    game: z.literal("pair"),
    picked: z.string().min(1).max(10),
    errorCode: z.string().min(1).max(40),
  }),
  z.object({ game: z.literal("train") }),
  z.object({ game: z.literal("read") }),
]);

const meetingSchema = z.object({
  sessionId: z.string().min(1),
  order: z.number().int().min(0).max(40),
  /** One meeting with one syllable; absent when the message only says the station is over. */
  syllableId: z.string().min(1).optional(),
  answer: answerSchema.optional(),
  /** The station is over: its one star goes here, since there is no Attempt row. */
  done: z.boolean().optional(),
});

/**
 * POST /api/kid/syllable — one meeting with one syllable in Xưởng Tiếng (pha 12, ADR-24).
 *
 * The device says what the child built or picked; the server decides whether that is the
 * syllable, which error it shows, what it does to the Leitner box, and writes the evidence for the
 * syllable's VIET.HV skill. A tampered-with client can claim a meeting, never a right answer: a
 * build is compared piece by piece with the syllable in the database.
 *
 * `requireStudentAccess` checks the role **and** the right to this child, and the session and its
 * station are checked to belong to that child.
 */
export const POST = handle(async (request: Request) => {
  const body = await parseBody(request, meetingSchema);
  const session = await prisma.session.findUnique({
    where: { id: body.sessionId },
    select: { studentId: true, slots: true },
  });
  if (!session) throw new ApiError(404, "Không tìm thấy phiên học");
  const { student } = await requireStudentAccess(session.studentId);

  const slots = (Array.isArray(session.slots) ? session.slots : []) as {
    order?: number;
    syllable?: { games?: string[] };
  }[];
  const station = slots.find((s) => s.order === body.order)?.syllable;
  if (!station) throw new ApiError(404, "Trạm này không phải Xưởng Tiếng");

  // The end of the station: one star for the work, like any other station (ADR-16), keyed to the
  // station so a reload or a second tap never pays twice.
  if (body.done) {
    const starsAwarded = await awardStars(prisma, student.id, STARS.exercise, "exercise", {
      type: "SyllableStation",
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

  if (!body.syllableId || !body.answer)
    throw new ApiError(400, "Thiếu tiếng hoặc câu trả lời của lần gặp này");
  // a game that cannot be dealt from tonight's syllables falls back to one that always can
  const allowed = new Set([...(station.games ?? []), "build", "pair", "read"]);
  if (!allowed.has(body.answer.game)) throw new ApiError(400, "Trò chơi không thuộc trạm này");

  try {
    const result = await recordSyllableMeeting(prisma, {
      studentId: student.id,
      syllableId: body.syllableId,
      answer: body.answer,
    });
    // The box never goes to the child's screen — only whether a brick lands on the pile.
    return json(
      { correct: result.correct, promoted: result.promoted, brick: result.brick },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof SyllableMeetingError) throw new ApiError(400, err.message);
    throw err;
  }
});
