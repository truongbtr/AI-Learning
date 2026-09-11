"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { playSound } from "./sound";

/**
 * The companion (docs/06 §1.7). Nine states, and in every one of them it is alive: it breathes,
 * it blinks every few seconds, its mouth moves while the text is being read, and if the child
 * pokes it, it wobbles and squeaks.
 *
 * The art is a real SVG file per state (content/art/mascots/…), fetched once and inlined so the
 * parts inside it — `#eye-l`, `#eye-r`, `#mouth`, `#head` — can be animated. An `<img>` would
 * have been simpler and completely still.
 */

export type MascotName = "robot" | "cu";
export type MascotState =
  | "idle"
  | "greet"
  | "talk"
  | "think"
  | "cheer"
  | "encourage"
  | "celebrate"
  | "sleep"
  | "listen";

const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

async function loadSvg(url: string): Promise<string> {
  const hit = cache.get(url);
  if (hit) return hit;
  const inFlight = pending.get(url);
  if (inFlight) return inFlight;
  const p = fetch(url)
    .then((r) => (r.ok ? r.text() : ""))
    .then((text) => {
      cache.set(url, text);
      pending.delete(url);
      return text;
    })
    .catch(() => {
      pending.delete(url);
      return "";
    });
  pending.set(url, p);
  return p;
}

export interface MascotProps {
  name?: MascotName;
  state?: MascotState;
  /** px; the tap target is the whole figure, so this is also how big it is to poke. */
  size?: number;
  /** True while `useSpeak` is speaking: the mouth moves in time with it. */
  speaking?: boolean;
  /** Poke reaction on/off (off on screens where the mascot is only decoration). */
  interactive?: boolean;
  className?: string;
  onPoke?: () => void;
}

const POKE_LINES = ["Hí hí!", "Nhột quá!", "Mình đây!", "Oa!", "Lại nữa đi!"];

export function Mascot({
  name = "robot",
  state = "idle",
  size = 220,
  speaking = false,
  interactive = true,
  className,
  onPoke,
}: MascotProps) {
  const [markup, setMarkup] = useState("");
  const [poked, setPoked] = useState<string | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const uid = useId().replace(/[:]/g, "");

  useEffect(() => {
    let alive = true;
    loadSvg(`/art/mascots/${name}/${state}.svg`).then((text) => {
      if (!alive) return;
      // The file is a whole document; strip its size so it fills the box.
      setMarkup(text.replace(/<svg([^>]*)width="\d+" height="\d+"/, "<svg$1"));
    });
    return () => {
      alive = false;
    };
  }, [name, state]);

  const poke = useCallback(() => {
    if (!interactive) return;
    playSound("cham");
    setPoked(POKE_LINES[Math.floor(Math.random() * POKE_LINES.length)] ?? "Hí hí!");
    onPoke?.();
    window.setTimeout(() => setPoked(null), 1200);
  }, [interactive, onPoke]);

  const breathing = reduce
    ? {}
    : {
        animate: { scale: [1, 1.02, 1], y: [0, -4, 0] },
        transition: {
          duration: state === "sleep" ? 5 : 3.4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut" as const,
        },
      };

  return (
    <motion.div
      className={`relative select-none ${interactive ? "cursor-pointer" : ""} ${className ?? ""}`}
      style={{ width: size, height: size * 1.06 }}
      {...breathing}
      whileTap={interactive && !reduce ? { scale: 0.94, rotate: -3 } : undefined}
      onClick={poke}
      onKeyDown={(e) => {
        if (interactive && (e.key === "Enter" || e.key === " ")) poke();
      }}
      role={interactive ? "button" : "img"}
      aria-label={name === "cu" ? "bạn Cú" : "bạn Rô-bốt"}
      tabIndex={interactive ? 0 : -1}
      data-mascot={name}
      data-state={state}
      data-testid="mascot"
    >
      {/* the art */}
      <div
        ref={hostRef}
        className={`h-full w-full ${reduce ? "" : "mascot-alive"} ${speaking ? "mascot-talking" : ""}`}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: our own build output, no user input
        dangerouslySetInnerHTML={{ __html: markup }}
        id={`mascot-${uid}`}
      />
      {/* the squeak when poked */}
      {poked ? (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: -6, scale: 1 }}
          exit={{ opacity: 0 }}
          className="-translate-x-1/2 pointer-events-none absolute top-0 left-1/2 rounded-full bg-white/95 px-4 py-2 font-extrabold text-[20px] text-[#2B2B3A] shadow-lg"
        >
          {poked}
        </motion.div>
      ) : null}
    </motion.div>
  );
}

/** The mascot with a speech bubble — the shape a child sees on every screen. */
export function MascotSays({
  text,
  sub,
  side = "right",
  ...mascot
}: MascotProps & { text: string; sub?: string; side?: "left" | "right" }) {
  return (
    <div className={`flex items-end gap-3 ${side === "left" ? "flex-row-reverse" : ""}`}>
      <Mascot {...mascot} />
      {text ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="relative mb-6 max-w-[26rem] rounded-[28px] bg-white/95 px-6 py-4 shadow-[0_10px_30px_-12px_rgba(43,43,58,0.45)]"
        >
          <p className="font-extrabold text-[24px] text-[#2B2B3A] leading-snug">{text}</p>
          {sub ? <p className="mt-1 text-[19px] text-[#6B6B7B]">{sub}</p> : null}
          <span
            className={`absolute bottom-4 h-4 w-4 rotate-45 bg-white/95 ${side === "left" ? "-right-2" : "-left-2"}`}
          />
        </motion.div>
      ) : null}
    </div>
  );
}
