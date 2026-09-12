import { applyChatIntake, ChatIntakeRejected, prisma } from "@mtct/db";
import { ApiError, json } from "@/lib/api";
import { internalHandler } from "@/lib/internal/guard";
import { chatIntakeSchema } from "@/lib/internal/schemas";

export const dynamic = "force-dynamic";

/**
 * `POST /api/internal/intake` — the reading itself (docs/13 §7.1, §7.3).
 *
 * Applied straight away and undoable, except for the three cases `validateChatIntake` holds. The
 * reply is written to be read out loud in a chat window, because that is where it is going: what
 * was recorded, what moved, what is waiting for a grown-up, and the one link that takes it all back.
 */
export const POST = internalHandler("/api/internal/intake", async (request) => {
  const raw = await request.json().catch(() => {
    throw new ApiError(400, "Thân yêu cầu phải là JSON");
  });
  const parsed = chatIntakeSchema.safeParse(raw);
  if (!parsed.success)
    throw new ApiError(
      400,
      "Thân yêu cầu không đúng IntakeExtraction",
      parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    );
  const body = parsed.data;

  const student = await prisma.student.findFirst({
    where: {
      isActive: true,
      OR: [
        { slug: body.student.toLowerCase() },
        { nickname: { equals: body.student, mode: "insensitive" } },
      ],
    },
    select: { id: true, nickname: true },
  });
  if (!student)
    throw new ApiError(404, `Không có bé nào tên gọi "${body.student}" (dùng thy hoặc thanh)`);

  let applied: Awaited<ReturnType<typeof applyChatIntake>>;
  try {
    applied = await applyChatIntake(prisma, {
      studentId: student.id,
      body: {
        kind: "PHOTO_INTAKE",
        docType: body.docType,
        subject: body.subject ?? null,
        detectedStudent: body.detectedStudent ?? null,
        summary: body.summary,
        teacherComment: body.teacherComment ?? null,
        confidence: body.confidence,
        needsParent: body.needsParent,
        items: body.items.map((item) => ({
          index: item.index,
          questionText: item.questionText,
          studentAnswer: item.studentAnswer ?? null,
          expectedAnswer: item.expectedAnswer ?? null,
          outcome: item.outcome,
          blankReason: item.blankReason ?? null,
          errorCode: item.errorCode ?? null,
          skillCodes: item.skillCodes,
          bbox: item.bbox ?? null,
          fileIndex: item.fileIndex,
          needsParent: item.needsParent,
        })),
        externals: body.externals.map((e) => ({
          platform: e.platform,
          metric: e.metric,
          value: e.value,
          valueNum: e.valueNum ?? null,
        })),
      },
      photoIds: body.photoIds,
      contextId: body.contextId ?? null,
      date: body.date ? new Date(`${body.date}T00:00:00+07:00`) : null,
    });
  } catch (err) {
    // A code that does not exist is the sender's mistake and fixable on the spot — say where.
    if (err instanceof ChatIntakeRejected)
      throw new ApiError(400, "Có mã không dùng được", err.fields);
    throw err;
  }

  const message =
    applied.status === "HELD"
      ? `Đã lưu ${applied.items} câu nhưng chưa áp: ${applied.heldReasons.join("; ")}. Ba mẹ xem rồi duyệt trong trang của ba mẹ.`
      : applied.status === "PARTIAL"
        ? `Đã ghi ${applied.evidence} bằng chứng cho ${student.nickname}; ${applied.held} câu giữ lại chờ ba mẹ.`
        : `Đã ghi ${applied.evidence} bằng chứng cho ${student.nickname}. Thẻ tối nay đã hiện trên trang ba mẹ, có nút hoàn tác.`;

  return {
    response: json(
      {
        batchId: applied.batchId,
        status: applied.status,
        student: student.nickname,
        items: applied.items,
        evidence: applied.evidence,
        held: applied.held,
        heldReasons: applied.heldReasons,
        externals: applied.externals,
        mastery: applied.mastery.map((m) => ({
          skillCode: m.skillCode,
          before: Math.round(m.before * 10) / 10,
          after: Math.round(m.after * 10) / 10,
        })),
        reviewHref: applied.held > 0 ? `/parent/intake/${applied.intakeResultId}` : null,
        message,
      },
      { status: 201 },
    ),
    studentId: student.id,
    batchId: applied.batchId,
    note: `${student.nickname}: ${applied.items} câu, ${applied.evidence} bằng chứng, ${applied.held} giữ lại (${applied.status})`,
  };
});
