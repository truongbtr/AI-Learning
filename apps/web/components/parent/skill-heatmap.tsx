"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SkillDrawer } from "./skill-drawer";

/**
 * P4 — bản đồ năng lực (FR-PAR-02, docs/06 §2.1).
 *
 * A grid per strand rather than a chart: one square per skill, in the order the curriculum teaches
 * them, coloured by status. That shape says the two things a parent actually asks — *how far has
 * the class got, and where did my child stop following* — which a bar chart of averages cannot.
 *
 * Colour carries status, but never alone: every square also shows its position and its name in the
 * tooltip, and the legend is on the page. The one thing missing on purpose is red — docs/06 §1
 * bans it in the child's world, and a parent looking at their six-year-old's reading does not need
 * it either. "Cần củng cố" is amber and says what to do next.
 */

export interface HeatmapSkill {
  code: string;
  nameVi: string;
  strand: string;
  subject: string;
  mastery: number;
  status: string;
  evidenceCount: number;
  expectedWeek: number | null;
  trend14d: number;
}

export const STATUS_META: Record<
  string,
  { label: string; cell: string; dot: string; order: number }
> = {
  MASTERED: {
    label: "Thành thạo",
    cell: "bg-success-500 text-white ring-success-600",
    dot: "bg-success-500",
    order: 0,
  },
  SOLID: {
    label: "Đã vững",
    cell: "bg-success-100 text-success-800 ring-success-200",
    dot: "bg-success-200",
    order: 1,
  },
  LEARNING: {
    label: "Đang học",
    cell: "bg-info-100 text-info-800 ring-info-200",
    dot: "bg-info-200",
    order: 2,
  },
  NEEDS_PRACTICE: {
    label: "Cần củng cố",
    cell: "bg-warning-200 text-warning-900 ring-warning-300",
    dot: "bg-warning-300",
    order: 3,
  },
  NOT_STARTED: {
    label: "Chưa có bằng chứng",
    cell: "bg-ink-100 text-ink-400 ring-ink-200",
    dot: "bg-ink-200",
    order: 4,
  },
};

export function StatusLegend({ counts }: { counts?: Record<string, number> }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-500">
      {Object.entries(STATUS_META)
        .sort((a, b) => a[1].order - b[1].order)
        .map(([status, meta]) => (
          <li key={status} className="flex items-center gap-1.5">
            <span className={cn("h-3 w-3 rounded-[4px]", meta.cell.split(" ")[0])} aria-hidden />
            {meta.label}
            {counts ? (
              <strong className="font-semibold text-ink-700">{counts[status] ?? 0}</strong>
            ) : null}
          </li>
        ))}
    </ul>
  );
}

export function SkillHeatmap({
  studentId,
  nickname,
  strands,
  currentWeek,
}: {
  studentId: string;
  nickname: string;
  strands: { subject: string; subjectLabel: string; strand: string; skills: HeatmapSkill[] }[];
  currentWeek: number | null;
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      <div className="flex flex-col gap-6" data-testid="skill-heatmap">
        {strands.map((group) => (
          <section key={`${group.subject}-${group.strand}`} className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-ink-800">
              {group.subjectLabel}
              <span className="ml-2 font-medium text-ink-400">{group.strand}</span>
              <span className="ml-2 text-xs font-normal text-ink-300">
                {group.skills.length} kỹ năng
              </span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {group.skills.map((skill) => {
                const meta = STATUS_META[skill.status] ?? STATUS_META.NOT_STARTED;
                // A skill the class has already covered but the child has no evidence for is worth
                // seeing at a glance: it is the gap between the timetable and the child.
                const behind =
                  currentWeek != null &&
                  skill.expectedWeek != null &&
                  skill.expectedWeek <= currentWeek &&
                  skill.evidenceCount === 0;
                return (
                  <button
                    key={skill.code}
                    type="button"
                    onClick={() => setOpen(skill.code)}
                    data-testid={`skill-cell-${skill.code}`}
                    data-status={skill.status}
                    title={`${skill.nameVi} — ${meta?.label}${
                      skill.evidenceCount ? ` · ${Math.round(skill.mastery)}/100` : ""
                    }${skill.expectedWeek ? ` · lớp học tuần ${skill.expectedWeek}` : ""}`}
                    className={cn(
                      "h-9 w-9 rounded-control text-[11px] font-bold tabular-nums ring-1 ring-inset transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-500",
                      meta?.cell,
                      behind && "outline outline-2 outline-offset-1 outline-info-400",
                    )}
                  >
                    {skill.evidenceCount ? Math.round(skill.mastery) : "·"}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <SkillDrawer
        studentId={studentId}
        nickname={nickname}
        skillCode={open}
        onClose={() => setOpen(null)}
      />
    </>
  );
}
