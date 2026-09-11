"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { playSound } from "./sound";
import { SPRING } from "./tokens";

/**
 * Stars — the whole reward economy a six-year-old can see (docs/06 §1.3).
 *
 * A star does not simply appear in a counter: it flies out of the answer, curves up to the pocket
 * in the corner, and the number there counts up one at a time. That journey is the reward.
 */

const StarShape = ({ size = 48 }: { size?: number }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
    <path
      d="M50 8 61.8 40.6 96 44.4 70.2 68.4 77 102 50 84.8 23 102 29.8 68.4 4 44.4 38.2 40.6Z"
      fill="#FFD447"
    />
    <path d="M50 8 61.8 40.6 96 44.4 70.2 68.4 77 102 50 84.8Z" fill="#FFC21A" />
    <circle cx="37" cy="37" r="6" fill="#FFF0B8" />
  </svg>
);

/** The pocket in the corner: how many stars today, counting up as they land. */
export function StarPocket({
  count,
  className,
  id = "star-pocket",
}: {
  count: number;
  className?: string;
  id?: string;
}) {
  const [shown, setShown] = useState(count);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (count === shown) return;
    if (reduce) {
      setShown(count);
      return;
    }
    const step = count > shown ? 1 : -1;
    const id = window.setInterval(() => {
      setShown((s) => {
        if (s === count) {
          window.clearInterval(id);
          return s;
        }
        return s + step;
      });
    }, 90);
    return () => window.clearInterval(id);
  }, [count, shown, reduce]);

  return (
    <div
      id={id}
      data-testid="star-pocket"
      data-stars={count}
      className={`flex items-center gap-2 rounded-full bg-white/90 py-2 pr-5 pl-3 shadow-[0_8px_20px_-12px_rgba(43,43,58,0.6)] ${className ?? ""}`}
    >
      <motion.div
        animate={shown !== count ? { rotate: [0, -12, 12, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <StarShape size={40} />
      </motion.div>
      <motion.span
        key={shown}
        initial={reduce ? false : { scale: 1.5, y: -4 }}
        animate={{ scale: 1, y: 0 }}
        transition={SPRING.pop}
        className="font-extrabold text-[26px] text-[#2B2B3A] tabular-nums"
      >
        {shown}
      </motion.span>
    </div>
  );
}

/**
 * One star flying from where the child answered to the pocket. Mount it with the origin point;
 * it removes itself when it lands and calls `onArrive` so the counter can go up.
 */
export function StarFlyToPocket({
  from,
  to,
  onArrive,
  delay = 0,
}: {
  from: { x: number; y: number };
  to?: { x: number; y: number };
  onArrive?: () => void;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const [target, setTarget] = useState(to);
  useEffect(() => {
    if (to) return;
    const pocket = document.getElementById("star-pocket");
    if (!pocket) return setTarget({ x: window.innerWidth - 80, y: 60 });
    const r = pocket.getBoundingClientRect();
    setTarget({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  }, [to]);

  useEffect(() => {
    const id = window.setTimeout(
      () => {
        playSound("sao");
        onArrive?.();
      },
      (reduce ? 0 : 620) + delay * 1000,
    );
    return () => window.clearTimeout(id);
  }, [onArrive, delay, reduce]);

  if (!target) return null;
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  return (
    <motion.div
      className="pointer-events-none fixed z-50"
      style={{ left: from.x - 24, top: from.y - 24 }}
      initial={{ scale: 0.4, opacity: 0 }}
      animate={
        reduce
          ? { x: dx, y: dy, opacity: 0, scale: 0.6 }
          : {
              // a curve, not a straight line: up first, then into the pocket
              x: [0, dx * 0.4, dx],
              y: [0, dy * 0.2 - 90, dy],
              scale: [0.6, 1.25, 0.5],
              opacity: [0, 1, 0.9],
            }
      }
      transition={{ duration: reduce ? 0.2 : 0.62, delay, ease: "easeInOut" }}
      aria-hidden
    >
      <StarShape size={48} />
    </motion.div>
  );
}

/** A burst of stars around a correct answer. */
export function StarBurst({ x, y, count = 5 }: { x: number; y: number; count?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => i).map((i) => {
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
        return (
          <motion.div
            key={`burst-${x}-${y}-${angle}`}
            className="pointer-events-none fixed z-40"
            style={{ left: x, top: y }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * 90,
              y: Math.sin(angle) * 90,
              scale: [0, 1, 0.2],
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            aria-hidden
          >
            <StarShape size={26} />
          </motion.div>
        );
      })}
    </>
  );
}

/** Holds the flying stars for a screen; call `fly(x, y)` when an answer is right. */
export function useStarFlight(onArrive?: () => void) {
  const [flights, setFlights] = useState<{ id: number; x: number; y: number }[]>([]);
  const next = useRef(0);
  const fly = (x: number, y: number) => {
    const id = next.current++;
    setFlights((f) => [...f, { id, x, y }]);
    window.setTimeout(() => setFlights((f) => f.filter((s) => s.id !== id)), 1200);
  };
  const layer = (
    <AnimatePresence>
      {flights.map((f) => (
        <StarFlyToPocket key={f.id} from={{ x: f.x, y: f.y }} onArrive={onArrive} />
      ))}
    </AnimatePresence>
  );
  return { fly, layer };
}
