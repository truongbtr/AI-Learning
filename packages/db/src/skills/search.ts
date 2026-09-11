/**
 * Full-text skill lookup (docs/08 phase 1 item 5, ADR-12): Postgres tsvector + unaccent, no
 * embeddings. Works for Vietnamese with or without diacritics and for English; matches code
 * fragments too because the trigger indexes the code split on "." and "_".
 */
import { Prisma, type PrismaClient, type Subject } from "../../generated/client";

export interface SkillSearchOptions {
  subject?: Subject | null;
  limit?: number;
  includeInactive?: boolean;
}

export interface SkillSearchHit {
  id: string;
  code: string;
  subject: Subject;
  strand: string;
  nameVi: string;
  nameEn: string;
  expectedWeek: number | null;
  isActive: boolean;
  /** ts_rank_cd against the OR query */
  rank: number;
  /** every token matched */
  full: boolean;
}

/** Letters/digits only (any script); everything else separates tokens. */
export function searchTokens(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, 12);
}

export async function searchSkills(
  db: PrismaClient,
  q: string,
  opts: SkillSearchOptions = {},
): Promise<SkillSearchHit[]> {
  const tokens = searchTokens(q);
  if (tokens.length === 0) return [];
  const limit = Math.min(Math.max(opts.limit ?? 10, 1), 50);
  // Prefix match on every token; unaccent() runs server-side so "đọc" and "doc" are the same.
  const orQuery = tokens.map((t) => `${t}:*`).join(" | ");
  const andQuery = tokens.map((t) => `${t}:*`).join(" & ");
  const subjectFilter = opts.subject
    ? Prisma.sql`AND s."subject" = ${opts.subject}::"Subject"`
    : Prisma.empty;
  const activeFilter = opts.includeInactive ? Prisma.empty : Prisma.sql`AND s."isActive" = true`;

  const rows = await db.$queryRaw<SkillSearchHit[]>(Prisma.sql`
    WITH q AS (
      SELECT to_tsquery('simple', unaccent(${orQuery})) AS orq,
             to_tsquery('simple', unaccent(${andQuery})) AS andq
    )
    SELECT s."id", s."code", s."subject", s."strand", s."nameVi", s."nameEn", s."expectedWeek",
           s."isActive",
           ts_rank_cd(s."searchVector", q.orq)::float8 AS "rank",
           (s."searchVector" @@ q.andq) AS "full"
    FROM "Skill" s, q
    WHERE s."searchVector" @@ q.orq ${subjectFilter} ${activeFilter}
    ORDER BY "full" DESC, "rank" DESC, s."code" ASC
    LIMIT ${limit}
  `);
  return rows;
}
