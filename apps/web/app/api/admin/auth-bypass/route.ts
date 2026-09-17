import { activeBypass, prisma, setAuthBypass } from "@mtct/db";
import { z } from "zod";
import { handle, json, parseBody } from "@/lib/api";
import { forgetBypass } from "@/lib/auth/bypass-gate";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  enabled: z.boolean(),
  /** Hours until it closes by itself; the db package clamps it to 15 minutes … 7 days. */
  hours: z
    .number()
    .positive()
    .max(24 * 7)
    .optional(),
  note: z.string().max(200).optional(),
});

/** GET — is login off, and until when? */
export const GET = handle(async () => {
  await requireRole("ADMIN");
  const state = await activeBypass(prisma);
  return json(
    state.on
      ? { on: true, until: state.until, as: state.user.displayName, note: state.row.note }
      : { on: false, reason: state.reason },
  );
});

/**
 * POST — flip "tắt đăng nhập" (docs/12 §7). ADMIN only, and an ADMIN is what an anonymous visitor
 * becomes, so this cannot hand out more than the caller already has.
 */
export const POST = handle(async (request: Request) => {
  const user = await requireRole("ADMIN");
  const input = await parseBody(request, bodySchema);
  const state = await setAuthBypass(prisma, {
    enabled: input.enabled,
    hours: input.hours,
    note: input.note,
    byUserId: user.id,
  });
  forgetBypass();
  return json(
    state.on
      ? { on: true, until: state.until, as: state.user.displayName }
      : { on: false, reason: state.reason },
  );
});
