"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { playSound } from "./sound";
import { COLOR, SPRING, SUBJECT_LABEL } from "./tokens";

/**
 * K3, the quest map (docs/06 §1.2, §1.6): a winding road through the world with one station per
 * exercise, the child's avatar walking from station to station, and a treasure chest at the end.
 *
 * Stations that are done sparkle, the one that is next bounces, the rest wait quietly — nothing is
 * ever greyed out with a cross, because there is no failure in this world.
 */

export interface Station {
  order: number;
  subject: string;
  done: boolean;
  /** Two exercises to choose from at this station (docs/06 §1.8b item 2). */
  choice?: boolean;
  /** The teacher's own homework: first on the road, with its own mark (FR-LRN-07). */
  homework?: boolean;
}

const SUBJECT_ICON: Record<string, string> = {
  VMATH: "🔢",
  EMATH: "➕",
  VIET: "🔤",
  ESL: "🔤",
  ENL: "📖",
  ESCI: "🔬",
};

/** A gentle S-curve across the scene; the same shape for any number of stations. */
function pointsFor(count: number): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const t = count > 1 ? i / (count - 1) : 0;
    return { x: 8 + t * 84, y: 62 - Math.sin(t * Math.PI * 2.1) * 26 };
  });
}

export function Avatar({
  avatarKey,
  size = 84,
  className,
}: {
  avatarKey?: string | null;
  size?: number;
  className?: string;
}) {
  const key = avatarKey && /^avatar-\d\d$/.test(avatarKey) ? avatarKey : "avatar-01";
  return (
    // biome-ignore lint/performance/noImgElement: an inline SVG asset, not a photo
    <img
      src={`/art/avatars/${key}.svg`}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

export function TreasureChest({
  open,
  size = 120,
  onClick,
}: {
  open?: boolean;
  size?: number;
  onClick?: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Rương kho báu"
      animate={reduce || open ? {} : { y: [0, -6, 0], rotate: [0, -2, 2, 0] }}
      transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY }}
      className="relative"
      style={{ width: size, height: size }}
    >
      {/* biome-ignore lint/performance/noImgElement: an inline SVG asset, not a photo */}
      <img
        src={`/art/effects/chest-${open ? "open" : "closed"}.svg`}
        alt=""
        width={size}
        height={size}
      />
    </motion.button>
  );
}

export interface QuestMapProps {
  stations: Station[];
  /** Where the avatar stands: the first station not done. */
  at: number;
  avatarKey?: string | null;
  onGo?: (order: number) => void;
  companion?: string | null;
}

export function QuestMap({ stations, at, avatarKey, onGo, companion }: QuestMapProps) {
  const reduce = useReducedMotion();
  const points = useMemo(() => pointsFor(stations.length + 1), [stations.length]);
  const [walking, setWalking] = useState(false);
  const here = Math.max(
    0,
    stations.findIndex((s) => s.order === at),
  );
  const avatarPoint = points[here] ?? points[0];
  const chest = points[points.length - 1];

  // The walk is what makes progress feel like a journey: it plays whenever the position changes.
  useEffect(() => {
    setWalking(true);
    const id = window.setTimeout(() => setWalking(false), 900);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="relative h-[clamp(20rem,48vh,32rem)] w-full" data-testid="quest-map">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <title>Con đường nhiệm vụ</title>
        <path
          d={pathThrough(points)}
          fill="none"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d={pathThrough(points)}
          fill="none"
          stroke="rgba(255,212,71,0.9)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="5 6"
        />
      </svg>

      {stations.map((s, i) => {
        const p = points[i] ?? points[0];
        const isNext = s.order === at;
        return (
          <motion.button
            key={s.order}
            type="button"
            data-testid={`station-${s.order}`}
            data-done={s.done ? "1" : "0"}
            onClick={() => {
              playSound("cham");
              onGo?.(s.order);
            }}
            initial={reduce ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...SPRING.pop, delay: reduce ? 0 : i * 0.05 }}
            whileTap={{ scale: 0.92 }}
            className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col items-center"
            style={{ left: `${p?.x}%`, top: `${p?.y}%` }}
          >
            <motion.span
              animate={isNext && !reduce ? { y: [0, -8, 0] } : {}}
              transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY }}
              className="flex h-[clamp(3.5rem,7vw,4.5rem)] w-[clamp(3.5rem,7vw,4.5rem)] items-center justify-center rounded-full text-[28px] shadow-[0_8px_18px_-10px_rgba(43,43,58,0.7)]"
              style={{
                background: s.done ? COLOR.reward : isNext ? COLOR.white : "rgba(255,255,255,0.72)",
                outline: isNext ? `4px solid ${COLOR.reward}` : "none",
              }}
            >
              {s.done ? "⭐" : s.homework ? "🍎" : (SUBJECT_ICON[s.subject] ?? "✨")}
            </motion.span>
            <span className="sr-only">
              {`Bài ${s.order + 1} — ${SUBJECT_LABEL[s.subject] ?? s.subject}${s.done ? ", đã xong" : ""}`}
            </span>
            {s.choice ? (
              <span className="-bottom-3 absolute rounded-full bg-white px-2 font-extrabold text-[#E85D9C] text-[14px] shadow">
                chọn
              </span>
            ) : null}
            {s.homework ? (
              <span className="-bottom-3 absolute whitespace-nowrap rounded-full bg-white px-2 font-extrabold text-[#2F80ED] text-[14px] shadow">
                cô giao
              </span>
            ) : null}
          </motion.button>
        );
      })}

      <motion.div
        className="-translate-x-1/2 absolute"
        style={{ left: `${chest?.x}%`, top: `${(chest?.y ?? 50) - 8}%` }}
      >
        <TreasureChest open={stations.every((s) => s.done)} size={110} />
      </motion.div>

      <motion.div
        data-testid="quest-avatar"
        className="-translate-x-1/2 pointer-events-none absolute"
        animate={{
          left: `${avatarPoint?.x}%`,
          top: `${(avatarPoint?.y ?? 50) - 12}%`,
          rotate: walking && !reduce ? [0, -6, 6, 0] : 0,
        }}
        transition={{ ...SPRING.glide, rotate: { duration: 0.6, repeat: walking ? 1 : 0 } }}
      >
        <div className="flex items-end gap-1">
          <Avatar avatarKey={avatarKey} size={76} />
          {companion ? (
            /* biome-ignore lint/performance/noImgElement: an inline SVG asset, not a photo */
            <motion.img
              src={`/art/objects/${companion}.svg`}
              alt=""
              width={40}
              height={40}
              animate={reduce ? {} : { y: [0, -5, 0] }}
              transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY }}
            />
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

function pathThrough(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  return points
    .map((p, i) => {
      if (i === 0) return `M${p.x} ${p.y}`;
      const prev = points[i - 1] as { x: number; y: number };
      const cx = (prev.x + p.x) / 2;
      return `C${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
    })
    .join(" ");
}
