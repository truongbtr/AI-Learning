"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * The inbox refreshes itself when a reading comes back (docs/08 pha 4 việc 2, "SSE báo khi có
 * kết quả").
 *
 * A parent leaves this page open on the kitchen tablet while `inbox:push` runs on the computer in
 * the other room; without this they would be looking at an empty list that is no longer true. Same
 * stream the child's screens use — it reports state, never an answer.
 */
export function LiveRefresh({ studentIds }: { studentIds: string[] }) {
  const router = useRouter();
  const [arrived, setArrived] = useState(0);

  useEffect(() => {
    if (studentIds.length === 0) return;
    const seen = new Map<string, number>();
    const streams = studentIds.map((id) => {
      const source = new EventSource(`/api/events?studentId=${encodeURIComponent(id)}`);
      source.addEventListener("state", (event) => {
        const data = JSON.parse((event as MessageEvent).data) as { toReview?: number };
        const now = data.toReview ?? 0;
        const before = seen.get(id);
        seen.set(id, now);
        // The first message is the state as it already is, not news.
        if (before !== undefined && now > before) {
          setArrived((n) => n + (now - before));
          router.refresh();
        }
      });
      return source;
    });
    return () => {
      for (const source of streams) source.close();
    };
  }, [studentIds, router]);

  if (arrived === 0) return null;
  return (
    <p
      role="status"
      data-testid="inbox-live"
      className="rounded-control border border-success-200 bg-success-50 px-3 py-2 text-sm font-semibold text-success-700"
    >
      Vừa có {arrived} kết quả đọc mới về — danh sách bên dưới đã cập nhật.
    </p>
  );
}
