"use client";

import type { CitySubject } from "@mtct/core";
import type { WorldCity } from "@mtct/db";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ParentDoor } from "@/components/kid/buttons";
import { MascotSays } from "@/components/kid/mascot";
import { playSound, preloadSounds } from "@/components/kid/sound";
import { StarPocket } from "@/components/kid/stars";
import { useSpeak } from "@/components/kid/use-speak";
import { CITY_INFO, snapshotKey } from "@/lib/kid/city-names";

/** Where each island sits on the sea (percent of the map), and the shape of its shore. */
/** A ring of islands around the mascot, who stands in the middle of the sea. */
const ISLANDS: Record<CitySubject, { x: number; y: number; shore: string; tilt: number }> = {
  viet: { x: 17, y: 28, shore: "58% 42% 55% 45% / 48% 58% 42% 52%", tilt: -3 },
  vmath: { x: 50, y: 20, shore: "46% 54% 42% 58% / 55% 45% 55% 45%", tilt: 2 },
  esl: { x: 83, y: 28, shore: "52% 48% 60% 40% / 42% 55% 45% 58%", tilt: -2 },
  enl: { x: 17, y: 70, shore: "44% 56% 50% 50% / 58% 44% 56% 42%", tilt: 3 },
  emath: { x: 50, y: 78, shore: "56% 44% 46% 54% / 46% 56% 44% 54%", tilt: -2 },
  esci: { x: 83, y: 70, shore: "50% 50% 58% 42% / 52% 46% 54% 48%", tilt: 2 },
};

const WAVES = Array.from({ length: 9 }, (_, i) => ({
  id: `wave-${i}`,
  d: `M${40 + ((i * 137) % 1000)} ${60 + i * 85} q 25 -14 50 0 t 50 0`,
  duration: 4 + (i % 3),
}));

/**
 * Pha 10 — the world map (bổ sung §1). One sea, six islands, one per subject, each with the
 * subject's own sign. An island with work tonight sparkles and says how many stars wait there;
 * the others rest quietly. Tapping an island dives into it — the city screen continues the dive
 * with its camera coming down from the sky.
 */
export function WorldMapClient({
  cities,
  studentId,
  nickname,
  mascot,
  stars,
  daysLearnt,
  signOut,
}: {
  cities: WorldCity[];
  studentId: string;
  nickname: string;
  mascot: "robot" | "cu";
  stars: number;
  daysLearnt: number;
  signOut: React.ReactNode;
}) {
  const router = useRouter();
  const { speak } = useSpeak();
  const reduce = !!useReducedMotion();
  const greeted = useRef(false);
  const [diving, setDiving] = useState<CitySubject | null>(null);
  // the child's own cities as they last left them (a new city shows its day-one picture)
  const [pictures, setPictures] = useState<Partial<Record<CitySubject, string>>>({});
  useEffect(() => {
    const found: Partial<Record<CitySubject, string>> = {};
    for (const c of cities) {
      try {
        const src = localStorage.getItem(snapshotKey(studentId, c.city));
        if (src) found[c.city] = src;
      } catch {
        /* private mode */
      }
    }
    setPictures(found);
  }, [cities, studentId]);
  const tonight = cities.filter((c) => c.tonight && c.missions > 0);
  const suggested = tonight.find((c) => c.onTimetable) ?? tonight[0] ?? null;
  const line = suggested
    ? `Chào ${nickname}! Tối nay ${CITY_INFO[suggested.city].name} có ${suggested.missions} ngôi sao chờ con!`
    : `Chào ${nickname}! Con muốn thăm thành phố nào?`;

  useEffect(() => {
    preloadSounds();
    if (greeted.current) return;
    greeted.current = true;
    void speak(line);
  }, [line, speak]);

  const dive = (city: CitySubject) => {
    if (diving) return;
    playSound("cham");
    void speak(CITY_INFO[city].name);
    setDiving(city);
    window.setTimeout(() => router.push(`/kid/city/${city}`), reduce ? 0 : 650);
  };

  return (
    <div
      className="relative h-dvh w-full overflow-hidden"
      style={{
        background: "radial-gradient(120% 90% at 50% 40%, #8fe3f7 0%, #4fc0ea 55%, #2f9fd8 100%)",
      }}
      data-testid="world-map"
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
        aria-hidden
      >
        {WAVES.map((w) => (
          <motion.path
            key={w.id}
            d={w.d}
            stroke="#ffffff"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            animate={reduce ? undefined : { x: [0, 24, 0] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: w.duration,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>

      <motion.main
        className="absolute inset-0"
        animate={
          diving
            ? {
                scale: 3.2,
                x: `${(50 - ISLANDS[diving].x) * 3.2}%`,
                y: `${(50 - ISLANDS[diving].y) * 3.2}%`,
              }
            : { scale: 1, x: 0, y: 0 }
        }
        transition={{ duration: reduce ? 0 : 0.65, ease: [0.5, 0, 0.3, 1] }}
      >
        {cities.map((c, i) => {
          const info = CITY_INFO[c.city];
          const spot = ISLANDS[c.city];
          const sparkle = c.tonight && c.missions > 0;
          return (
            <motion.button
              key={c.city}
              type="button"
              onClick={() => dive(c.city)}
              data-testid={`city-${c.city}`}
              data-sparkle={sparkle ? "1" : "0"}
              data-missions={c.missions}
              aria-label={`${info.name}, ${info.subject}${sparkle ? `, ${c.missions} ngôi sao` : ""}`}
              className="absolute flex w-[min(24vw,260px)] flex-col items-center"
              style={{
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                translateX: "-50%",
                translateY: "-50%",
              }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{
                opacity: diving && diving !== c.city ? 0.4 : 1,
                scale: 1,
                rotate: spot.tilt,
              }}
              transition={{ type: "spring", stiffness: 220, damping: 18, delay: i * 0.06 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* the island: a sand shore with the city on it */}
              <span
                className="relative block aspect-[4/3] w-full p-[6%] shadow-[0_18px_0_rgba(20,80,120,0.25)]"
                style={{ borderRadius: spot.shore, background: "#ffe39a" }}
              >
                <span
                  className="block h-full w-full overflow-hidden"
                  style={{ borderRadius: spot.shore, boxShadow: `inset 0 0 0 5px ${info.a}` }}
                >
                  {/* biome-ignore lint/performance/noImgElement: pre-rendered webp of the city */}
                  <img
                    src={pictures[c.city] ?? `/art/city/thumbs/${c.city}.webp`}
                    alt=""
                    className={`h-full w-full object-cover ${sparkle || c.doneToday ? "" : "saturate-[0.8]"}`}
                  />
                </span>
                {/* the subject's sign */}
                <span
                  className="absolute -bottom-3 -left-2 flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white text-[40px] shadow-lg"
                  style={{ background: info.a }}
                  aria-hidden
                >
                  {info.emoji}
                </span>
                {sparkle ? (
                  <motion.span
                    className="absolute -top-3 -right-2 flex min-h-[68px] min-w-[68px] items-center justify-center gap-1 rounded-full border-4 border-white bg-[#FFD447] px-3 font-black text-[28px] text-[#1f3b63] shadow-lg"
                    animate={reduce ? undefined : { scale: [1, 1.12, 1], rotate: [0, 8, -8, 0] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.6 }}
                    data-testid="island-stars"
                  >
                    ⭐ {c.missions}
                  </motion.span>
                ) : null}
                {c.doneToday ? (
                  <span className="absolute -top-3 -right-2 flex h-[64px] w-[64px] items-center justify-center rounded-full border-4 border-white bg-[#34C759] text-[34px] text-white shadow-lg">
                    ✓
                  </span>
                ) : null}
                {sparkle && !reduce ? <Sparkles /> : null}
              </span>
              <span className="-mt-3 relative rounded-full bg-white/95 px-5 py-2 font-black text-[24px] text-[#1f3b63] shadow">
                {info.name}
              </span>
            </motion.button>
          );
        })}
      </motion.main>

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
        <button
          type="button"
          onClick={() => void speak(`Con đã học ${daysLearnt} ngày rồi!`)}
          className="pointer-events-auto flex min-h-[64px] items-center gap-2 rounded-full bg-white/90 px-5 font-extrabold text-[22px] text-[#1f3b63] shadow"
          data-testid="days-learnt"
        >
          🔥 {daysLearnt} ngày
        </button>
        <div className="pointer-events-auto">
          <StarPocket count={stars} />
        </div>
      </header>
      {!diving ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
          <div className="pointer-events-auto">
            <MascotSays name={mascot} state="greet" size={96} text={line} />
          </div>
        </div>
      ) : null}
      <footer className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3">
        <div className="pointer-events-auto">
          <ParentDoor onOpen={() => router.push("/parent")} />
        </div>
        <div className="pointer-events-auto">{signOut}</div>
      </footer>
    </div>
  );
}

const SPARKLES = [
  { id: "a", x: 12, y: 18 },
  { id: "b", x: 80, y: 12 },
  { id: "c", x: 66, y: 70 },
];

function Sparkles() {
  return (
    <>
      {SPARKLES.map((s, i) => (
        <motion.span
          key={s.id}
          aria-hidden
          className="pointer-events-none absolute text-[26px]"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.4] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.8, delay: i * 0.5 }}
        >
          ✨
        </motion.span>
      ))}
    </>
  );
}
