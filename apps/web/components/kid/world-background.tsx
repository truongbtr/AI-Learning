"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { TIME_TINT, type TimeOfDay, timeOfDay as timeOfDayNow } from "./time";
import { type KidTheme, zoneFor } from "./tokens";

/**
 * The world behind every screen of the child's area (docs/06 §1.5, §1.6).
 *
 * Three layers that drift at different speeds, so tilting the iPad or moving the mouse gives the
 * scene a little depth. The middle of the screen is deliberately quiet: the question lives there.
 *
 * Two rules from the design are enforced here rather than remembered:
 *  - `prefers-reduced-motion` turns the parallax and the drifting off, keeping the picture;
 *  - the sky changes with the real time of day (§1.8c "thế giới đổi theo giờ thật"), so a child
 *    who opens the app after dinner sees evening light.
 */

export type { TimeOfDay } from "./time";
export { timeOfDay } from "./time";

export interface WorldBackgroundProps {
  theme?: KidTheme;
  subject?: string | null;
  /** Override the time of day — the dev kit and the tests need a fixed one. */
  at?: TimeOfDay;
  children?: React.ReactNode;
  className?: string;
}

export function WorldBackground({
  theme = "robot",
  subject,
  at,
  children,
  className,
}: WorldBackgroundProps) {
  const reduce = useReducedMotion();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [now, setNow] = useState<TimeOfDay>(at ?? "day");
  const zone = zoneFor(theme, subject);
  const world = theme === "garden" ? "garden" : "robot";

  useEffect(() => {
    if (at) return;
    setNow(timeOfDayNow());
    const id = window.setInterval(() => setNow(timeOfDayNow()), 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [at]);

  useEffect(() => {
    if (reduce) return;
    const onPointer = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setTilt({ x, y });
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      const x = Math.max(-1, Math.min(1, (e.gamma ?? 0) / 30));
      const y = Math.max(-1, Math.min(1, ((e.beta ?? 45) - 45) / 30));
      setTilt({ x, y });
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("deviceorientation", onTilt);
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, [reduce]);

  const layer = (name: "sky" | "mid" | "fore", depth: number) => (
    <motion.div
      key={name}
      className="pointer-events-none absolute inset-0 bg-center bg-cover bg-no-repeat"
      style={{ backgroundImage: `url(/art/worlds/${world}/${zone}-${name}.svg)` }}
      animate={reduce ? {} : { x: tilt.x * depth * -8, y: tilt.y * depth * -5 }}
      transition={{ type: "spring", stiffness: 40, damping: 18 }}
      data-layer={name}
    />
  );

  return (
    <div
      className={`relative min-h-dvh overflow-hidden bg-[#DCEEFF] ${className ?? ""}`}
      data-world={world}
      data-zone={zone}
      data-time={now}
      data-testid="world-background"
    >
      {layer("sky", 0.25)}
      {layer("mid", 0.6)}
      {layer("fore", 1)}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: TIME_TINT[now] }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
