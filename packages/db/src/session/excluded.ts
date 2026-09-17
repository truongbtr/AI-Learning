import type { PrismaClient } from "../../generated/client";

/**
 * Exercise types no child is ever handed. A write-then-photograph question stops the evening until
 * a parent comes with a phone, and the owner has taken them out (16/09/2026, ADR-25). The bank
 * keeps them; every place that puts an exercise in front of a child checks this list — the picker,
 * the choice station, and the screens that read sessions planned before the rule existed.
 */
export const EXCLUDED_TYPES = ["WRITE_PHOTO"] as const;

export const isExcludedType = (type: string): boolean =>
  (EXCLUDED_TYPES as readonly string[]).includes(type);

/** The slot orders of a session whose exercise a child must not be shown. */
export async function hiddenOrders(
  db: PrismaClient,
  slots: readonly { order?: number; exerciseId?: string | null }[],
): Promise<Set<number>> {
  const ids = slots.map((s) => s.exerciseId).filter((id): id is string => Boolean(id));
  if (ids.length === 0) return new Set();
  const excluded = new Set(
    (
      await db.exercise.findMany({
        where: { id: { in: ids }, type: { in: [...EXCLUDED_TYPES] } },
        select: { id: true },
      })
    ).map((e) => e.id),
  );
  return new Set(
    slots
      .filter((s) => typeof s.order === "number" && s.exerciseId && excluded.has(s.exerciseId))
      .map((s) => s.order as number),
  );
}
