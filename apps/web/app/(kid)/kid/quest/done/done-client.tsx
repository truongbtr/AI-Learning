"use client";

import type { SessionSummary } from "@mtct/db";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SessionFinale } from "@/components/kid/finale";
import { SceneTransition } from "@/components/kid/states";
import { WorldBackground } from "@/components/kid/world-background";

/**
 * K5 — the end of the quest (docs/06 §1.2). The summary was produced by the server when the
 * session closed; this screen only plays it.
 */
export function DoneClient({
  summary,
  theme,
  studentId,
}: {
  summary: SessionSummary;
  theme: "robot" | "garden";
  studentId: string;
}) {
  const router = useRouter();
  const badges = summary.rewards?.badges ?? [];

  // The ceremony has been played, so these badges are no longer new.
  useEffect(() => {
    if (badges.length === 0) return;
    void fetch("/api/kid/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, codes: badges.map((b) => b.code) }),
    }).catch(() => {});
  }, [badges, studentId]);

  return (
    <WorldBackground theme={theme}>
      <SceneTransition sceneKey="done" direction="up">
        <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col items-center justify-center px-5 py-6">
          <SessionFinale
            stars={summary.starsEarned}
            totalStars={summary.starsTotal}
            lines={summary.mascotLines ?? ["Hôm nay con học rất giỏi!"]}
            badges={badges}
            mascot={theme === "garden" ? "cu" : "robot"}
            egg={summary.rewards?.egg}
            picture={
              summary.rewards?.picture
                ? {
                    nameVi: summary.rewards.picture.nameVi,
                    pieces: summary.rewards.picture.pieces.length,
                    total: summary.rewards.picture.total,
                    imageKey: summary.rewards.picture.imageKey,
                  }
                : null
            }
            onDone={() => router.push("/kid/home")}
          />
        </main>
      </SceneTransition>
    </WorldBackground>
  );
}
