import type { PrismaClient } from "../../generated/client";

/**
 * Everything the system knows about one child, as one JSON file (FR-ADM-03, docs/08 pha 8 việc 2).
 *
 * Two reasons it exists, and they pull in opposite directions, which is why it is worth writing
 * down which one won:
 *
 *   - **Leaving.** If the family ever stops using this, the record of what the child learned is
 *     theirs and has to come out in a form a person can read. So: skill codes and names, not
 *     internal ids; dates as `YYYY-MM-DD`; the question text next to the answer.
 *   - **Moving.** Restoring this into another instance would want ids and foreign keys.
 *
 * Leaving won. A backup already covers moving — `pg_dump` does it better than any hand-written
 * exporter ever will — so this one is written for a human being opening the file.
 *
 * The child's full name and birth date *are* included: this is the family's own copy of their own
 * child's record. The rule about not sending the full name anywhere (CLAUDE.md) is about the AI
 * queue, and nothing here goes near it.
 */

export interface StudentExport {
  $schema: string;
  exportedAt: string;
  student: Record<string, unknown>;
  guardians: Record<string, unknown>[];
  mastery: Record<string, unknown>[];
  evidence: Record<string, unknown>[];
  sessions: Record<string, unknown>[];
  errors: Record<string, unknown>[];
  remediation: Record<string, unknown>[];
  intake: Record<string, unknown>[];
  homework: Record<string, unknown>[];
  plans: Record<string, unknown>[];
  external: Record<string, unknown>[];
  rewards: Record<string, unknown>;
  counts: Record<string, number>;
}

const day = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);
const stamp = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export class StudentNotFound extends Error {}

export async function exportStudent(db: PrismaClient, slug: string): Promise<StudentExport> {
  const student = await db.student.findUnique({
    where: { slug },
    include: {
      user: { select: { username: true, displayName: true, role: true, isActive: true } },
      guardians: { include: { user: { select: { username: true, displayName: true } } } },
    },
  });
  if (!student) throw new StudentNotFound(`Không có bé nào slug = ${slug}`);
  const studentId = student.id;

  // Skill codes and names, so a row reads without a second file open.
  const skills = await db.skill.findMany({
    select: { id: true, code: true, nameVi: true, subject: true, strand: true },
  });
  const skillById = new Map(skills.map((s) => [s.id, s]));
  const named = (skillId: string | null) => {
    const s = skillId ? skillById.get(skillId) : undefined;
    return s ? { code: s.code, nameVi: s.nameVi, subject: s.subject, strand: s.strand } : null;
  };

  const [
    mastery,
    evidence,
    sessions,
    errorStats,
    tracks,
    intakeJobs,
    homework,
    plans,
    external,
    stars,
    badges,
    pets,
    certificates,
    streak,
  ] = await Promise.all([
    db.skillMastery.findMany({ where: { studentId }, orderBy: { mastery: "desc" } }),
    db.evidence.findMany({ where: { studentId }, orderBy: { observedAt: "asc" } }),
    db.session.findMany({
      where: { studentId },
      orderBy: { date: "asc" },
      include: { attempts: { orderBy: { order: "asc" } } },
    }),
    db.errorStat.findMany({ where: { studentId } }),
    db.remediationTrack.findMany({ where: { studentId } }),
    db.intakeJob.findMany({
      where: { studentId },
      orderBy: { createdAt: "asc" },
      include: { results: { include: { items: { orderBy: { index: "asc" } } } } },
    }),
    db.homework.findMany({ where: { studentId }, orderBy: { createdAt: "asc" } }),
    db.plan.findMany({
      where: { studentId },
      orderBy: { weekStart: "asc" },
      include: { items: true },
    }),
    db.externalProgress.findMany({ where: { studentId }, orderBy: { observedAt: "asc" } }),
    db.starLedger.findMany({ where: { studentId }, orderBy: { at: "asc" } }),
    db.studentBadge.findMany({ where: { studentId } }),
    db.studentPet.findMany({ where: { studentId } }),
    db.certificate.findMany({ where: { studentId } }),
    db.streak.findUnique({ where: { studentId } }),
  ]);

  // The kid's cities (Pha 10): the lot order and what the child chose to build on each plot.
  const cities = await db.studentCity.findMany({
    where: { studentId },
    orderBy: { subject: "asc" },
  });

  const out: StudentExport = {
    $schema: "mtct/student-export/1",
    exportedAt: new Date().toISOString(),
    student: {
      slug: student.slug,
      fullName: student.fullName,
      nickname: student.nickname,
      birthDate: day(student.birthDate),
      grade: student.grade,
      className: student.className,
      schoolYear: student.schoolYear,
      interests: student.interests,
      mascot: student.mascot,
      settings: student.settings,
      login: student.user,
      createdAt: stamp(student.createdAt),
    },
    guardians: student.guardians.map((g) => ({
      username: g.user.username,
      displayName: g.user.displayName,
      relation: g.relation,
      canApprove: g.canApprove,
    })),
    mastery: mastery.map((m) => ({
      skill: named(m.skillId),
      mastery: Math.round(m.mastery * 10) / 10,
      confidence: Math.round(m.confidence * 100) / 100,
      status: m.status,
      evidenceCount: m.evidenceCount,
      trend14d: m.trend14d,
      lastEvidenceAt: stamp(m.lastEvidenceAt),
      nextReviewAt: day(m.nextReviewAt),
      intervalDays: m.intervalDays,
    })),
    evidence: evidence.map((e) => ({
      observedAt: stamp(e.observedAt),
      skill: named(e.skillId),
      source: e.source,
      outcome: e.outcome,
      score: e.score,
      weight: e.weight,
      difficulty: e.difficulty,
      errorCode: e.errorCode,
      note: e.note,
    })),
    sessions: sessions.map((s) => ({
      date: day(s.date),
      kind: s.kind,
      status: s.status,
      startedAt: stamp(s.startedAt),
      finishedAt: stamp(s.finishedAt),
      minutes:
        s.startedAt && s.finishedAt
          ? Math.round((s.finishedAt.getTime() - s.startedAt.getTime()) / 60000)
          : null,
      stars: s.starsEarned,
      why: (s.generationLog as { log?: string[] } | null)?.log ?? [],
      attempts: s.attempts.map((a) => ({
        order: a.order,
        exerciseId: a.exerciseId,
        response: a.response,
        isCorrect: a.isCorrect,
        score: a.score,
        tries: a.tries,
        hintsUsed: a.hintsUsed,
        seconds: Math.round(a.timeMs / 1000),
        gradedBy: a.gradedBy,
        at: stamp(a.createdAt),
      })),
    })),
    errors: errorStats.map((e) => ({
      code: e.errorCode,
      count7d: e.count7d,
      count30d: e.count30d,
      lastAt: stamp(e.lastAt),
    })),
    remediation: tracks.map((t) => ({
      skill: named(t.skillId),
      errorCode: t.errorCode,
      rung: t.rung,
      status: t.status,
      startedAt: stamp(t.startedAt),
    })),
    intake: intakeJobs.map((j) => ({
      createdAt: stamp(j.createdAt),
      status: j.status,
      kind: j.kind,
      note: j.note,
      // The photograph itself is in the file backup, not in this JSON. The key says where.
      files: j.files,
      readings: j.results.map((r) => ({
        docType: r.docType,
        subject: r.subject,
        summary: r.summary,
        teacherComment: r.teacherComment,
        confidence: r.confidence,
        items: r.items.map((i) => ({
          index: i.index,
          question: i.questionText,
          studentAnswer: i.studentAnswer,
          expectedAnswer: i.expectedAnswer,
          outcome: i.outcome,
          blankReason: i.blankReason,
          errorCode: i.errorCode,
          skillsRead: i.skillCodes,
          skillsFinal: i.skillCodesFinal,
          editedByParent: i.editedByParent,
        })),
      })),
    })),
    homework: homework.map((h) => ({
      createdAt: stamp(h.createdAt),
      dueDate: day(h.dueDate),
      subject: h.subject,
      taskType: h.taskType,
      text: h.text,
      skillCodes: h.skillCodes,
      status: h.status,
      progress: h.progress,
      doneAt: stamp(h.doneAt),
    })),
    plans: plans.map((p) => ({
      weekStart: day(p.weekStart),
      weekEnd: day(p.weekEnd),
      status: p.status,
      rationale: p.rationale,
      items: p.items.map((i) => ({
        skill: named(i.skillId),
        priority: i.priority,
        reason: i.reason,
        targetMastery: i.targetMastery,
        sessionsPlanned: i.sessionsPlanned,
        sessionsDone: i.sessionsDone,
      })),
    })),
    external: external.map((e) => ({
      observedAt: stamp(e.observedAt),
      platform: e.platform,
      metric: e.metric,
      value: e.value,
      valueNum: e.valueNum,
    })),
    rewards: {
      starsTotal: stars.reduce((n, s) => n + s.delta, 0),
      ledger: stars.map((s) => ({ at: stamp(s.at), delta: s.delta, reason: s.reason })),
      badges: badges.map((b) => ({ code: b.badgeCode, earnedAt: stamp(b.earnedAt) })),
      cities: cities.map((c) => ({
        subject: c.subject,
        buildings: c.skillOrder.map((id) => named(id)?.code ?? id),
        plotBuilds: c.plotBuilds,
      })),
      pets: pets.map((p) => ({ code: p.petCode, hatchedAt: stamp(p.hatchedAt) })),
      certificates: certificates.map((c) => ({
        kind: c.kind,
        title: c.title,
        issuedAt: stamp(c.issuedAt),
      })),
      streak: streak
        ? {
            current: streak.current,
            longest: streak.longest,
            lastActiveDate: day(streak.lastActiveDate),
          }
        : null,
    },
    counts: {
      mastery: mastery.length,
      evidence: evidence.length,
      sessions: sessions.length,
      attempts: sessions.reduce((n, s) => n + s.attempts.length, 0),
      intakeJobs: intakeJobs.length,
      homework: homework.length,
      plans: plans.length,
      external: external.length,
    },
  };
  return out;
}
