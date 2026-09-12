import type { StudentOverview } from "@mtct/db";
import { ChevronRight, Flame, Star } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { avatarEmoji } from "@/lib/avatars";
import { AttentionList } from "./attention-list";

/**
 * One child on P2 (docs/06 §2.1): how many days they have learned, whether tonight is done, and
 * the three things worth an evening — each of which opens the evidence behind it.
 *
 * The two cards stack, never sit side by side as columns to compare: docs/00 §6 forbids putting
 * the children next to each other, and a two-column layout is exactly that in disguise.
 */

const STATUS_LABEL: Record<string, string> = {
  PLANNED: "chưa bắt đầu",
  IN_PROGRESS: "đang làm dở",
  COMPLETED: "xong rồi",
  ABANDONED: "bỏ dở",
};

export function ChildCard({ overview }: { overview: StudentOverview }) {
  const { student, today, streak, attention } = overview;
  return (
    <Card className="flex flex-col gap-4" data-testid={`child-card-${student.slug}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
          {avatarEmoji(student.avatarKey)}
        </span>
        <div className="min-w-0 flex-1">
          <Link
            href={`/parent/${student.id}`}
            className="block truncate text-base font-bold text-ink-900 hover:text-brand-700 hover:underline"
          >
            {student.nickname}
          </Link>
          <p className="truncate text-xs text-ink-400">Lớp {student.className}</p>
        </div>
        <Link
          href={`/parent/${student.id}`}
          aria-label={`Mở hồ sơ ${student.nickname}`}
          className="rounded-control p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-1 text-xs font-semibold text-warning-700">
          <Flame className="h-3.5 w-3.5" aria-hidden />
          {streak.current} ngày đã học
        </span>
        {today ? (
          <Link
            href={`/parent/${student.id}/evidence?days=1`}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100"
          >
            Phiên hôm nay: {STATUS_LABEL[today.status] ?? today.status} · {today.done}/{today.total}{" "}
            bài
          </Link>
        ) : (
          <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-500">
            Hôm nay chưa có phiên nào
          </span>
        )}
        {today && today.starsEarned > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500">
            <Star className="h-3.5 w-3.5 text-warning-500" aria-hidden />
            {today.starsEarned} sao
          </span>
        ) : null}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-ink-900">3 điều cần chú ý</h3>
        <AttentionList studentId={student.id} points={attention} compact />
      </div>
    </Card>
  );
}
