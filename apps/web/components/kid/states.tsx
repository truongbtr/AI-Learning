"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Mascot, type MascotName } from "./mascot";
import { SPRING } from "./tokens";

/**
 * The screens that are usually forgotten: loading, nothing here yet, no connection, waiting to be
 * marked (docs/06 §1.5 "không có màn hình trống", checklist §4 item 7).
 *
 * None of them is a spinner. The mascot is doing something — thinking, dozing, listening — and
 * there is a sentence a six-year-old can read.
 */

export function LoadingMascot({
  text = "Đang chuẩn bị nhiệm vụ…",
  mascot = "robot",
}: {
  text?: string;
  mascot?: MascotName;
}) {
  const reduce = useReducedMotion();
  return (
    <div
      className="flex flex-col items-center justify-center gap-5 py-14"
      data-testid="loading-mascot"
    >
      <Mascot name={mascot} state="think" size={200} interactive={false} />
      <p className="font-extrabold text-[24px] text-[#2B2B3A]">{text}</p>
      {/* a rainbow progress bar, not a spinner */}
      <div className="h-4 w-64 overflow-hidden rounded-full bg-white/70">
        <motion.div
          className="h-full w-1/3 rounded-full"
          style={{
            background: "linear-gradient(90deg,#FFD447,#FF8C42,#E85D9C,#7C5CFF,#2F80ED,#34C759)",
          }}
          animate={reduce ? {} : { x: ["-40%", "220%"] }}
          transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  mascot = "robot",
  state = "sleep",
  action,
}: {
  title: string;
  hint?: string;
  mascot?: MascotName;
  state?: "sleep" | "think" | "idle" | "listen";
  action?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-12 text-center"
      data-testid="empty-state"
    >
      <Mascot name={mascot} state={state} size={190} interactive />
      <p className="max-w-md font-extrabold text-[26px] text-[#2B2B3A] leading-snug">{title}</p>
      {hint ? <p className="max-w-md text-[21px] text-[#6B6B7B]">{hint}</p> : null}
      {action}
    </div>
  );
}

/** Lost the network mid-session: say so kindly, and keep the answers already given. */
export function OfflineNotice({ retry }: { retry?: () => void }) {
  return (
    <EmptyState
      title="Mạng đi lạc một chút rồi!"
      hint="Bài con vừa làm vẫn được giữ. Chờ mình một lát nhé."
      state="listen"
      action={
        retry ? (
          <button
            type="button"
            onClick={retry}
            className="min-h-[64px] rounded-[28px] bg-[#2F80ED] px-8 font-extrabold text-[22px] text-white"
          >
            Thử lại
          </button>
        ) : null
      }
    />
  );
}

/**
 * Moving between screens: the camera pans the way the child is travelling through the world
 * (docs/06 §1.3). `direction` is which way the journey goes; `key` must change per screen.
 */
export function SceneTransition({
  children,
  sceneKey,
  direction = "right",
}: {
  children: React.ReactNode;
  sceneKey: string;
  direction?: "left" | "right" | "up" | "down";
}) {
  const reduce = useReducedMotion();
  const vertical = direction === "up" || direction === "down";
  const enter =
    direction === "up" ? 60 : direction === "down" ? -60 : direction === "left" ? -80 : 80;
  const leave =
    direction === "up" ? -60 : direction === "down" ? 60 : direction === "left" ? 80 : -80;
  const from = vertical ? { y: enter } : { x: enter };
  const to = vertical ? { y: 0 } : { x: 0 };
  const away = vertical ? { y: leave } : { x: leave };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sceneKey}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, ...from }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, ...to }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, ...away }}
        transition={SPRING.glide}
        data-testid="scene"
        data-scene={sceneKey}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
