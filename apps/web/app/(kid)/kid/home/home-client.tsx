"use client";

import type { KidHome } from "@mtct/db";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BigButton, ParentDoor } from "@/components/kid/buttons";
import { MascotSays } from "@/components/kid/mascot";
import {
  BigGoldStar,
  EggCard,
  EventBanner,
  MailBox,
  WeekPicture,
} from "@/components/kid/retention";
import { preloadSounds } from "@/components/kid/sound";
import { StarPocket } from "@/components/kid/stars";
import { SceneTransition } from "@/components/kid/states";
import { TIME_GREETING, timeOfDay } from "@/components/kid/time";
import { THEME } from "@/components/kid/tokens";
import { useSpeak } from "@/components/kid/use-speak";
import { WorldBackground } from "@/components/kid/world-background";

/**
 * K2 — home (docs/06 §1.2). Not a menu: a place. The world is drawn behind, the mascot says hello
 * out loud and remembers something from yesterday, and there is exactly one big thing to do.
 */
export function KidHomeClient({ home, signOut }: { home: KidHome; signOut: React.ReactNode }) {
  const router = useRouter();
  const { speak, state } = useSpeak();
  const [greeted, setGreeted] = useState(false);
  const [stars, setStars] = useState(home.stars);
  const [praise, setPraise] = useState<{ from: string } | null>(null);
  const theme = THEME[home.theme];

  const hello = `${TIME_GREETING[timeOfDay()]} ${home.nickname}!`;
  const line = home.memory?.text ?? home.event.lineVi;

  useEffect(() => {
    preloadSounds();
  }, []);

  // Greet once, out loud, and then mark the mascot's memory as used so it is not repeated.
  useEffect(() => {
    if (greeted) return;
    setGreeted(true);
    speak(`${hello} ${line}`, { lang: "vi" });
    if (home.memory) {
      void fetch(`/api/kid/memory/${home.memory.id}`, { method: "POST" }).catch(() => {});
    }
  }, [greeted, hello, line, home.memory, speak]);

  useEffect(() => {
    if (home.mail.next?.isPraise) {
      setPraise({ from: home.mail.next.fromName ?? "Ba mẹ" });
    }
  }, [home.mail.next]);

  const questDone = home.quest.finished;
  const questStarted = home.quest.done > 0 && !questDone;

  return (
    <WorldBackground theme={home.theme}>
      <SceneTransition sceneKey="home" direction="right">
        <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-between gap-4 px-5 py-5">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <StarPocket count={stars} />
              <div
                className="flex min-h-[56px] items-center gap-2 rounded-full bg-white/90 px-5 font-extrabold text-[22px]"
                data-testid="streak"
              >
                {/* biome-ignore lint/performance/noImgElement: an inline SVG asset, not a photo */}
                <img src="/art/effects/streak-flame.svg" alt="" width={34} height={34} />
                {home.streak.current}
              </div>
            </div>
            <EventBanner
              name={home.event.nameVi}
              emoji={home.event.emoji}
              line={home.event.lineVi}
            />
          </header>

          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <MascotSays
              name={home.mascot}
              state={questDone ? "celebrate" : "greet"}
              size={230}
              speaking={state === "speaking"}
              text={hello}
              sub={line}
            />

            <BigButton
              tone="reward"
              color={questDone ? undefined : theme.primary}
              onClick={() => router.push("/kid/quest")}
              data-testid="today-quest"
            >
              {questDone
                ? "✓ Hôm nay xong rồi!"
                : questStarted
                  ? `▶️ Làm tiếp (${home.quest.done}/${home.quest.total})`
                  : "🚀 Nhiệm vụ hôm nay"}
            </BigButton>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <MailBox
                unopened={home.mail.unopened}
                letter={
                  home.mail.next
                    ? {
                        id: home.mail.next.id,
                        text: home.mail.next.text,
                        fromName: home.mail.next.fromName,
                        audioKey: home.mail.next.audioKey,
                      }
                    : null
                }
                mascot={home.mascot}
                onOpen={async (id) => {
                  await fetch(`/api/kid/mail/${id}`, { method: "POST" }).catch(() => {});
                  router.refresh();
                }}
              />
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/kid/collection")}
                data-testid="go-collection"
                className="flex min-h-[64px] items-center gap-2 rounded-[28px] bg-white/92 px-5 font-extrabold text-[20px] shadow-[0_10px_24px_-14px_rgba(43,43,58,0.7)]"
              >
                <span className="text-[30px]">🧺</span> Bộ sưu tập
                {home.collectibles > 0 ? (
                  <span className="font-extrabold text-[#6B6B7B]">({home.collectibles})</span>
                ) : null}
              </motion.button>
            </div>
          </div>

          <footer className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <EggCard
                cracks={home.egg.cracks}
                needed={home.egg.needed}
                hatched={home.egg.hatched}
              />
              <WeekPicture
                imageKey={home.picture.imageKey}
                nameVi={home.picture.nameVi}
                pieces={home.picture.pieces}
                total={home.picture.total}
              />
            </div>
            <div className="flex items-center gap-3">
              {home.pets.length > 0 ? (
                <div className="flex items-center gap-2 rounded-[28px] bg-white/90 px-4 py-2 font-extrabold text-[19px]">
                  {home.pets.slice(0, 3).map((p) => (
                    <span key={p.code} title={p.name}>
                      {/* biome-ignore lint/performance/noImgElement: an inline SVG asset, not a photo */}
                      <img
                        src={`/art/objects/${petAsset(p.code)}.svg`}
                        alt={p.name}
                        width={38}
                        height={38}
                      />
                    </span>
                  ))}
                </div>
              ) : null}
              <ParentDoor onOpen={() => router.push("/parent")} />
              {signOut}
            </div>
          </footer>
        </main>
      </SceneTransition>

      <AnimatePresence>
        {praise ? (
          <BigGoldStar
            from={praise.from}
            onDone={() => {
              setPraise(null);
              setStars((s) => s + 5);
            }}
          />
        ) : null}
      </AnimatePresence>
    </WorldBackground>
  );
}

/** Pets are drawn with the object of the same animal (content/art/objects). */
function petAsset(code: string): string {
  const map: Record<string, string> = {
    "meo-con": "con-meo",
    "cun-con": "con-cho",
    "vit-con": "con-vit",
    "ga-con": "con-ga",
    "buom-nho": "con-buom",
    "ech-xanh": "con-ech",
    "canh-cut": "chim-canh-cut",
    "robot-nho": "con-robot",
  };
  return map[code] ?? "con-meo";
}
