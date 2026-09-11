import { prisma } from "@mtct/db";
import { z } from "zod";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const schema = z.object({
  studentId: z.string().min(1),
  /** A letter, or the one-tap "Khen" that becomes a big gold star. */
  kind: z.enum(["letter", "praise"]).default("letter"),
  text: z.string().trim().max(200).optional(),
  giftCode: z.string().trim().max(60).optional(),
  /** Letters arrive the next morning by default (FR-PAR-08); a praise arrives at once. */
  deliverTomorrow: z.boolean().optional(),
});

const PRAISE_LINES = [
  "Ba mẹ tự hào về con lắm!",
  "Con giỏi lắm, ba mẹ thấy hết đó!",
  "Cố gắng của con đáng một ngôi sao vàng thật to!",
];

/**
 * POST /api/parent/mail — a letter into the child's mailbox, or a big gold star (FR-PAR-08,
 * docs/06 §1.8c items 5 and 10).
 *
 * A child can never call this: only a PARENT or ADMIN with access to that child. The letter is
 * plain text the parent typed — nothing here is generated.
 */
export const POST = handle(async (request: Request) => {
  const body = await parseBody(request, schema);
  const { user, student } = await requireStudentAccess(body.studentId);
  if (user.role === "CHILD") throw new ApiError(403, "Không có quyền gửi thư");

  const praise = body.kind === "praise";
  const text =
    body.text?.trim() ||
    (praise ? (PRAISE_LINES[Math.floor(Math.random() * PRAISE_LINES.length)] as string) : "");
  if (!text) throw new ApiError(400, "Thư cần có nội dung");

  const deliverOn = new Date();
  if (body.deliverTomorrow ?? !praise) {
    deliverOn.setDate(deliverOn.getDate() + 1);
    deliverOn.setHours(6, 0, 0, 0);
  }

  const mail = await prisma.kidMail.create({
    data: {
      studentId: student.id,
      fromKind: "PARENT",
      fromUserId: user.id,
      text,
      giftCode: body.giftCode ?? null,
      deliverOn,
    },
  });

  // A praise is also a star the child sees fall onto the screen — never taken back, never scored.
  if (praise) {
    await prisma.starLedger.create({
      data: {
        studentId: student.id,
        delta: 5,
        reason: "praise",
        refType: "KidMail",
        refId: mail.id,
      },
    });
  }

  return json(
    { id: mail.id, deliverOn: mail.deliverOn.toISOString(), kind: body.kind },
    { status: 201 },
  );
});
