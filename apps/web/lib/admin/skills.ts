import { prisma, type Subject } from "@mtct/db";

/** Subject labels for the adult UI (docs/05 §1). */
export const SUBJECT_LABEL: Record<Subject, string> = {
  VIET: "Tiếng Việt",
  VMATH: "Toán",
  ESL: "Tiếng Anh (ESL)",
  ENL: "Tiếng Anh bản ngữ (ENL)",
  EMATH: "English Maths",
  ESCI: "English Science",
};

export const SUBJECT_ORDER: Subject[] = ["VIET", "VMATH", "ESL", "ENL", "EMATH", "ESCI"];

export interface SkillRow {
  id: string;
  code: string;
  subject: Subject;
  strand: string;
  nameVi: string;
  nameEn: string;
  description: string;
  standardRef: string | null;
  gradeLevel: string;
  expectedWeek: number | null;
  order: number;
  isActive: boolean;
  source: string;
  exerciseTypes: string[];
  relatedSkillCodes: string[];
  confusableWith: string[];
  prerequisites: string[];
  /** LessonUnit codes this skill is taught in (docs/09). */
  lessonRefs: string[];
  evidenceCount: number;
}

export interface StrandNode {
  strand: string;
  total: number;
  active: number;
}

export interface SubjectNode {
  subject: Subject;
  label: string;
  total: number;
  active: number;
  strands: StrandNode[];
}

export interface SkillTree {
  subjects: SubjectNode[];
  total: number;
  active: number;
  retired: number;
}

/** Counts per subject and strand for the tree, in one grouped query. */
export async function loadSkillTree(): Promise<SkillTree> {
  const groups = await prisma.skill.groupBy({
    by: ["subject", "strand", "isActive"],
    _count: { _all: true },
  });
  const bySubject = new Map<Subject, SubjectNode>();
  let total = 0;
  let active = 0;
  for (const g of groups) {
    const n = g._count._all;
    total += n;
    if (g.isActive) active += n;
    const node = bySubject.get(g.subject) ?? {
      subject: g.subject,
      label: SUBJECT_LABEL[g.subject],
      total: 0,
      active: 0,
      strands: [],
    };
    node.total += n;
    if (g.isActive) node.active += n;
    const strand = node.strands.find((s) => s.strand === g.strand) ?? {
      strand: g.strand,
      total: 0,
      active: 0,
    };
    strand.total += n;
    if (g.isActive) strand.active += n;
    if (!node.strands.includes(strand)) node.strands.push(strand);
    bySubject.set(g.subject, node);
  }
  const subjects = SUBJECT_ORDER.filter((s) => bySubject.has(s)).map((s) => {
    const node = bySubject.get(s)!;
    node.strands.sort((a, b) => a.strand.localeCompare(b.strand));
    return node;
  });
  return { subjects, total, active, retired: total - active };
}

export interface ListSkillsFilter {
  subject?: Subject | null;
  strand?: string | null;
  /** Codes to fetch (used after a full-text search so the order is kept). */
  codes?: string[];
  includeRetired?: boolean;
  limit?: number;
}

export async function listSkills(filter: ListSkillsFilter = {}): Promise<SkillRow[]> {
  const rows = await prisma.skill.findMany({
    where: {
      ...(filter.subject ? { subject: filter.subject } : {}),
      ...(filter.strand ? { strand: filter.strand } : {}),
      ...(filter.codes ? { code: { in: filter.codes } } : {}),
      ...(filter.includeRetired ? {} : { isActive: true }),
    },
    orderBy: [{ subject: "asc" }, { strand: "asc" }, { order: "asc" }, { code: "asc" }],
    take: Math.min(filter.limit ?? 500, 1000),
    select: {
      id: true,
      code: true,
      subject: true,
      strand: true,
      nameVi: true,
      nameEn: true,
      description: true,
      standardRef: true,
      gradeLevel: true,
      expectedWeek: true,
      order: true,
      isActive: true,
      source: true,
      exerciseTypes: true,
      relatedSkillCodes: true,
      confusableWith: true,
      prerequisites: { select: { prerequisite: { select: { code: true } } } },
      lessonUnitSkills: { select: { unit: { select: { code: true } } } },
      _count: { select: { evidences: true } },
    },
  });
  const mapped = rows.map((r) => ({
    id: r.id,
    code: r.code,
    subject: r.subject,
    strand: r.strand,
    nameVi: r.nameVi,
    nameEn: r.nameEn,
    description: r.description,
    standardRef: r.standardRef,
    gradeLevel: r.gradeLevel,
    expectedWeek: r.expectedWeek,
    order: r.order,
    isActive: r.isActive,
    source: r.source,
    exerciseTypes: r.exerciseTypes,
    relatedSkillCodes: r.relatedSkillCodes,
    confusableWith: r.confusableWith,
    prerequisites: r.prerequisites.map((p) => p.prerequisite.code).sort(),
    lessonRefs: r.lessonUnitSkills.map((l) => l.unit.code).sort(),
    evidenceCount: r._count.evidences,
  }));
  if (!filter.codes) return mapped;
  const rank = new Map(filter.codes.map((c, i) => [c, i] as const));
  return mapped.sort((a, b) => (rank.get(a.code) ?? 0) - (rank.get(b.code) ?? 0));
}
