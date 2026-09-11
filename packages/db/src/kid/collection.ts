import type { PrismaClient } from "../../generated/client";
import { starBalance } from "../session/grade";

/**
 * K7, the collection (docs/06 §1.2 K7, §1.8c item 14).
 *
 * Stars buy things that go *into the child's world*, which is the point: the world grows visibly
 * and the two children's worlds end up different, so there is nothing to compare.
 */

type Db = PrismaClient;

export interface CollectionItem {
  code: string;
  nameVi: string;
  cost: number;
  category: string;
  assetKey: string | null;
  owned: boolean;
  placement: { x: number; y: number } | null;
}

export interface CollectionView {
  stars: number;
  items: CollectionItem[];
  goal: { id: string; title: string; starsNeeded: number; starsSpent: number } | null;
}

export async function collectionFor(db: Db, studentId: string): Promise<CollectionView> {
  const [items, owned, stars, goal] = await Promise.all([
    db.collectible.findMany({ orderBy: [{ category: "asc" }, { cost: "asc" }] }),
    db.studentCollectible.findMany({ where: { studentId } }),
    starBalance(db, studentId),
    db.rewardGoal.findFirst({ where: { studentId, status: "ACTIVE" } }),
  ]);
  const mine = new Map(owned.map((o) => [o.collectibleCode, o]));

  return {
    stars,
    items: items.map((i) => ({
      code: i.code,
      nameVi: i.nameVi,
      cost: i.cost,
      category: i.category,
      assetKey: i.assetKey,
      owned: mine.has(i.code),
      placement: (mine.get(i.code)?.placement ?? null) as { x: number; y: number } | null,
    })),
    goal: goal
      ? {
          id: goal.id,
          title: goal.title,
          starsNeeded: goal.starsNeeded,
          starsSpent: goal.starsSpent,
        }
      : null,
  };
}

export class CollectionError extends Error {
  constructor(
    public code: "NOT_FOUND" | "ALREADY_OWNED" | "NOT_ENOUGH_STARS",
    message: string,
  ) {
    super(message);
  }
}

/**
 * Buying: the stars are spent through the ledger (a negative entry), so the balance always equals
 * the sum of the ledger and a parent can see where every star went.
 */
export async function buyCollectible(
  db: Db,
  studentId: string,
  code: string,
): Promise<{ item: CollectionItem; stars: number }> {
  const item = await db.collectible.findUnique({ where: { code } });
  if (!item) throw new CollectionError("NOT_FOUND", "Không có vật phẩm này");
  const already = await db.studentCollectible.findUnique({
    where: { studentId_collectibleCode: { studentId, collectibleCode: code } },
  });
  if (already) throw new CollectionError("ALREADY_OWNED", "Con đã có vật phẩm này rồi");
  const stars = await starBalance(db, studentId);
  if (stars < item.cost) throw new CollectionError("NOT_ENOUGH_STARS", "Chưa đủ sao, cố thêm nhé!");

  await db.$transaction([
    db.starLedger.create({
      data: {
        studentId,
        delta: -item.cost,
        reason: "collectible",
        refType: "Collectible",
        refId: item.code,
      },
    }),
    db.studentCollectible.create({ data: { studentId, collectibleCode: item.code } }),
  ]);

  return {
    item: {
      code: item.code,
      nameVi: item.nameVi,
      cost: item.cost,
      category: item.category,
      assetKey: item.assetKey,
      owned: true,
      placement: null,
    },
    stars: stars - item.cost,
  };
}

/** Putting an item somewhere in the world; the position is the child's, so it is never reset. */
export async function placeCollectible(
  db: Db,
  studentId: string,
  code: string,
  placement: { x: number; y: number } | null,
): Promise<void> {
  const owned = await db.studentCollectible.findUnique({
    where: { studentId_collectibleCode: { studentId, collectibleCode: code } },
  });
  if (!owned) throw new CollectionError("NOT_FOUND", "Con chưa có vật phẩm này");
  await db.studentCollectible.update({
    where: { id: owned.id },
    data: { placement: placement ?? undefined },
  });
}
