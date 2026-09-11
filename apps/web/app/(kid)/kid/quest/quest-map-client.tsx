"use client";

import type { KidSession } from "@mtct/db";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BigButton } from "@/components/kid/buttons";
import { MascotSays } from "@/components/kid/mascot";
import { QuestMap } from "@/components/kid/quest-map";
import { StarPocket } from "@/components/kid/stars";
import { SceneTransition } from "@/components/kid/states";
import { THEME } from "@/components/kid/tokens";
import { useSpeak } from "@/components/kid/use-speak";
import { WorldBackground } from "@/components/kid/world-background";

/**
 * K3 — the quest map (docs/06 §1.2). The road through the world with one station per exercise,
 * the child's avatar standing where it got to, and the chest at the end.
 */
export function QuestMapClient({
  session,
  avatarKey,
  companion,
}: {
  session: KidSession;
  avatarKey: string | null;
  companion: string | null;
}) {
  const router = useRouter();
  const { speak, state } = useSpeak();
  const done = new Set(session.attempts.filter((a) => a.done).map((a) => a.order));
  const next = session.nextOrder;
  const allDone = next === null;
  const theme = THEME[session.theme];

  const line = allDone
    ? "Con đi hết con đường rồi! Mở rương thôi!"
    : done.size > 0
      ? `Còn ${session.items.length - done.size} trạm nữa thôi!`
      : "Con đường hôm nay đây! Mình đi nhé?";

  useEffect(() => {
    speak(line, { lang: "vi" });
  }, [line, speak]);

  const go = () => {
    if (allDone) router.push("/kid/quest/done");
    else router.push(`/kid/quest/${next}`);
  };

  return (
    <WorldBackground theme={session.theme}>
      <SceneTransition sceneKey="quest-map" direction="right">
        <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-between gap-3 px-5 py-5">
          <header className="flex items-center justify-between gap-3">
            <StarPocket count={session.starsTotal} />
            <div className="rounded-full bg-white/90 px-5 py-2 font-extrabold text-[20px]">
              {done.size}/{session.items.length} trạm
            </div>
          </header>

          <QuestMap
            stations={session.items.map((i) => ({
              order: i.order,
              subject: i.subject,
              done: done.has(i.order),
              choice: i.choice,
              homework: Boolean(i.homework),
            }))}
            at={next ?? session.items[session.items.length - 1]?.order ?? 0}
            avatarKey={avatarKey}
            companion={companion}
            onGo={(order) => {
              if (!done.has(order)) router.push(`/kid/quest/${order}`);
            }}
          />

          <div className="flex flex-wrap items-end justify-between gap-4">
            <MascotSays
              name={session.theme === "garden" ? "cu" : "robot"}
              state={allDone ? "celebrate" : "greet"}
              size={170}
              speaking={state === "speaking"}
              text={line}
            />
            <BigButton
              tone="reward"
              color={allDone ? undefined : theme.primary}
              onClick={go}
              data-testid="quest-go"
            >
              {allDone ? "🎁 Mở rương!" : done.size > 0 ? "▶️ Đi tiếp!" : "🚶 Đi thôi!"}
            </BigButton>
          </div>
        </main>
      </SceneTransition>
    </WorldBackground>
  );
}
