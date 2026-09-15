"use client";

import type { KidItem, KidSession } from "@mtct/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExercisePlay } from "@/components/kid/exercise-play";
import { CarryOnPrompt } from "@/components/kid/retention";
import { StarPocket } from "@/components/kid/stars";
import { SceneTransition } from "@/components/kid/states";
import { SUBJECT_LABEL } from "@/components/kid/tokens";
import { WorldBackground } from "@/components/kid/world-background";

/**
 * K4 — one station of the quest (docs/06 §1.2, §1.3).
 *
 * The exercise is drawn on the world, not on a blank page (`ExercisePlay` does the exercise itself).
 * One thing interrupts on purpose: the question "carry on or stop?" after eight exercises
 * (docs/06 §1.8b item 4; the movement break was removed in Pha 10).
 */

const CARRY_ON_AFTER = 8;

export function StationClient({
  session,
  item,
  index,
}: {
  session: KidSession;
  item: KidItem;
  index: number;
}) {
  const router = useRouter();
  const [carryOn, setCarryOn] = useState(false);
  const [stars, setStars] = useState(session.starsTotal);
  const answered = session.attempts.filter((a) => a.done).length;
  const mascot = session.theme === "garden" ? "cu" : "robot";

  // The station the child goes to next; null when the road is finished.
  const nextOrder =
    session.items.find(
      (i) => i.order > item.order && !session.attempts.some((a) => a.order === i.order && a.done),
    )?.order ?? null;
  const go = () => router.push(nextOrder === null ? "/kid/quest/done" : `/kid/quest/${nextOrder}`);

  return (
    <WorldBackground theme={session.theme} subject={item.subject}>
      <SceneTransition sceneKey={`station-${item.order}-${carryOn}`} direction="right">
        <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-4 px-4 py-4">
          <header className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/kid/quest")}
              className="flex min-h-[64px] items-center gap-2 rounded-[28px] bg-white/90 px-5 font-extrabold text-[20px] text-[#6B6B7B]"
            >
              🗺️ Bản đồ
            </button>
            <div className="rounded-full bg-white/90 px-5 py-2 font-extrabold text-[20px]">
              Trạm {index + 1}/{session.items.length} ·{" "}
              {SUBJECT_LABEL[item.subject] ?? item.subject}
            </div>
            <StarPocket count={stars} />
          </header>

          {carryOn ? (
            <div className="flex flex-1 items-center justify-center">
              <CarryOnPrompt
                mascot={mascot}
                onCarryOn={go}
                onStop={() => router.push("/kid/quest/done")}
              />
            </div>
          ) : (
            <ExercisePlay
              key={item.order}
              session={session}
              item={item}
              onStars={setStars}
              onFinished={() => {
                if (answered + 1 >= CARRY_ON_AFTER && nextOrder !== null) setCarryOn(true);
                else go();
              }}
            />
          )}
        </main>
      </SceneTransition>
    </WorldBackground>
  );
}
