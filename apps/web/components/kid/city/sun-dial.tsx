"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { playSound } from "../sound";
import { useSpeak } from "../use-speak";

/**
 * The sun dial across the top of the city (pha 12 việc 4).
 *
 * A thin arc with the sun travelling along it, left to right, once per game day; it sets at the
 * right-hand end and the moon rises at the left and carries on. The arc itself changes colour with
 * the hour, so a glance tells the child where in the day their city is — which is the only clock
 * this world is allowed, because it counts nothing down and takes nothing away.
 *
 * Tapping the sun makes the mascot say the time of day: in Vietnamese in five cities, in English in
 * the English one, so the words arrive where the child is already expecting English.
 */
export type TimeOfDay = "dawn" | "morning" | "noon" | "afternoon" | "golden" | "dusk" | "night";

export function timeOfDayAt(hour: number): TimeOfDay {
  if (hour < 5.5) return "night";
  if (hour < 7) return "dawn";
  if (hour < 11) return "morning";
  if (hour < 13.5) return "noon";
  if (hour < 16.5) return "afternoon";
  if (hour < 18.3) return "golden";
  if (hour < 19.6) return "dusk";
  return "night";
}

/** What the mascot says. Pre-generated as mp3 at import time, never synthesised at play time. */
export const CLOCK_LINES: Record<TimeOfDay, { vi: string; en: string }> = {
  dawn: { vi: "Trời vừa sáng ở thành phố!", en: "The sun is coming up!" },
  morning: { vi: "Buổi sáng ở thành phố rồi!", en: "It's morning in the city!" },
  noon: { vi: "Đứng bóng rồi, giữa trưa đó!", en: "It's the middle of the day!" },
  afternoon: { vi: "Buổi chiều ở thành phố!", en: "It's afternoon in the city!" },
  golden: { vi: "Nắng chiều vàng rồi!", en: "The evening sun is gold!" },
  dusk: { vi: "Trời sắp tối, đèn sắp lên!", en: "The lights are coming on!" },
  night: { vi: "Ban đêm rồi, thành phố sáng đèn!", en: "It's night, and the city is lit!" },
};

/** The colour of the arc behind the sun, by hour. */
function arcColours(hour: number): [string, string] {
  const t = timeOfDayAt(hour);
  if (t === "dawn") return ["#FFC8B0", "#FFE3C0"];
  if (t === "morning") return ["#CFEBFF", "#EAF6FF"];
  if (t === "noon") return ["#BFE6FF", "#F2FBFF"];
  if (t === "afternoon") return ["#CDE6FF", "#FFF0D8"];
  if (t === "golden") return ["#FFD6A0", "#FFE9C4"];
  if (t === "dusk") return ["#B79BE0", "#FFB69E"];
  return ["#2F3F7E", "#5C6FB8"];
}

export function SunDial({
  hour,
  language = "vi",
  onSaid,
}: {
  /** The game hour, 0–24 (packages/city daynight.ts). */
  hour: number;
  /** The English city says it in English. */
  language?: "vi" | "en";
  onSaid?: (line: string) => void;
}) {
  const reduce = useReducedMotion();
  const { speak } = useSpeak();
  const [pressed, setPressed] = useState(false);
  const said = useRef(0);

  const period = timeOfDayAt(hour);
  const night = period === "night";
  // the sun crosses the arc through the day; at night the moon takes the same path
  const dayProgress = night
    ? (hour >= 19.6 ? hour - 19.6 : hour + 4.4) / 9.9
    : Math.max(0, Math.min(1, (hour - 5.5) / 14.1));
  const angle = Math.PI * (1 - dayProgress); // left (π) to right (0)
  const cx = 50 + Math.cos(angle) * 44;
  const cy = 46 - Math.sin(angle) * 34;
  const [arcFrom, arcTo] = arcColours(hour);

  const say = () => {
    const now = Date.now();
    if (now - said.current < 1200) return;
    said.current = now;
    playSound("cham");
    const line = CLOCK_LINES[period][language];
    void speak(line, { lang: language === "en" ? "en-US" : "vi-VN" });
    onSaid?.(line);
  };

  useEffect(() => {
    setPressed(false);
  }, []);

  return (
    <button
      type="button"
      onClick={say}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      aria-label={CLOCK_LINES[period][language]}
      className="pointer-events-auto"
      data-testid="sun-dial"
      data-period={period}
    >
      <svg
        viewBox="0 0 100 52"
        className="h-[72px] w-[220px]"
        role="img"
        aria-hidden="true"
        style={{ filter: pressed && !reduce ? "brightness(1.08)" : undefined }}
      >
        <title>Đồng hồ mặt trời</title>
        <defs>
          <linearGradient id="dial-arc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={arcFrom} />
            <stop offset="100%" stopColor={arcTo} />
          </linearGradient>
        </defs>
        <path
          d="M 6 46 A 44 38 0 0 1 94 46"
          fill="none"
          stroke="url(#dial-arc)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path d="M 6 46 L 94 46" stroke="#FFF3DD" strokeWidth="2.4" strokeLinecap="round" />
        <motion.g
          animate={{ x: cx, y: cy }}
          initial={false}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 60, damping: 18 }}
        >
          {night ? (
            <>
              <circle r="7.5" fill="#FFF6D8" />
              <circle r="6.2" cx="2.6" cy="-1.4" fill={arcFrom} />
            </>
          ) : (
            <>
              <circle r="10" fill="#FFD447" opacity="0.35" />
              <circle r="6.6" fill="#FFC531" />
            </>
          )}
        </motion.g>
      </svg>
    </button>
  );
}
