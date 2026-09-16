"use client";

import { TONE_NAMES, type Tone } from "@mtct/core";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { BigButton, SpeakerButton } from "../buttons";
import { Picture } from "../exercise/picture";
import { playSound } from "../sound";
import { SPRING } from "../tokens";
import { useSpeak } from "../use-speak";
import { PieceFace, toneGlyph } from "./tile";
import { PIECE_STYLE, type SyllableGameProps, type SyllableRound } from "./types";
import { useCadence } from "./use-cadence";

type ToneRound = Extract<SyllableRound, { game: "tone" }>;

const WHEEL = 300;

/**
 * (c) "Bánh xe thanh điệu" — the onset and the rime stay put, the wheel of six hats turns: ma, mà,
 * má, mả, mã, mạ. Every notch says its syllable, and a real one brings its picture. The machine
 * asks for one of them; the child turns the wheel to it and presses "Xong".
 *
 * Wheels where hỏi and ngã are both in play come first for a child who mixes them up.
 */
export function ToneWheelGame({ round, onMeeting, onDone }: SyllableGameProps<ToneRound>) {
  const reduce = useReducedMotion();
  const { speak } = useSpeak();
  const cadence = useCadence();
  const [index, setIndex] = useState(0);
  const [at, setAt] = useState(0);
  const [answered, setAnswered] = useState<null | "right" | "shown">(null);
  const item = round.items[index];
  const notch = item?.notches[at];

  useEffect(() => {
    if (!item) return;
    setAt(0);
    setAnswered(null);
    const id = window.setTimeout(async () => {
      await speak("Con xoay bánh xe tìm tiếng", { lang: "vi-VN" });
      await speak(item.syllable.text, { lang: "vi-VN" });
    }, 400);
    return () => window.clearTimeout(id);
  }, [item, speak]);

  const turnTo = useCallback(
    (i: number) => {
      if (!item || answered) return;
      const next = (i + 6) % 6;
      setAt(next);
      playSound("cham");
      const n = item.notches[next];
      if (n) void speak(n.text, { lang: "vi-VN" });
    },
    [item, answered, speak],
  );

  const confirm = useCallback(async () => {
    if (!item || !notch || answered) return;
    const right = notch.tone === item.syllable.tone;
    onMeeting(item.syllable.id, { game: "tone", tone: notch.tone as Tone });
    playSound(right ? "dung" : "gan-dung");
    if (!right) {
      await speak(`Tiếng ${item.syllable.text} ở đây này.`, { lang: "vi-VN" });
      setAt(item.notches.findIndex((n) => n.tone === item.syllable.tone));
      setAnswered("shown");
    } else {
      setAnswered("right");
    }
    await cadence.play(item.syllable.text);
    window.setTimeout(() => {
      if (index + 1 >= round.items.length) onDone();
      else setIndex((i) => i + 1);
    }, 1100);
  }, [item, notch, answered, onMeeting, speak, cadence, index, round.items.length, onDone]);

  if (!item || !notch) return null;
  const picture = notch.syllable?.picture;

  return (
    <div
      className="flex w-full flex-col items-center gap-4"
      data-testid="syl-tone"
      data-target={item.syllable.text}
      data-at={notch.text}
      data-spoken={cadence.spoken.join("|")}
    >
      <div className="flex items-center gap-3">
        <SpeakerButton text={item.syllable.text} lang="vi-VN" size={84} />
        {item.onset ? <PieceFace kind="onset" value={item.onset} /> : null}
        <PieceFace kind="rime" value={item.rime} />
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          type="button"
          aria-label="xoay trái"
          onClick={() => turnTo(at - 1)}
          whileTap={reduce ? undefined : { scale: 0.9 }}
          className="flex h-[96px] w-[96px] items-center justify-center rounded-full bg-white text-[46px] shadow"
          data-testid="syl-tone-left"
        >
          ↺
        </motion.button>

        <div className="relative" style={{ width: WHEEL, height: WHEEL }}>
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(${PIECE_STYLE.tone.bg} 0 60deg, #FFF3DD 60deg 120deg, ${PIECE_STYLE.tone.bg} 120deg 180deg, #FFF3DD 180deg 240deg, ${PIECE_STYLE.tone.bg} 240deg 300deg, #FFF3DD 300deg 360deg)`,
              boxShadow: `inset 0 0 0 8px ${PIECE_STYLE.tone.ring}`,
            }}
            animate={{ rotate: -at * 60 }}
            transition={reduce ? { duration: 0 } : SPRING.soft}
          >
            {item.notches.map((n, i) => {
              const angle = (i * 60 * Math.PI) / 180;
              const r = WHEEL / 2 - 56;
              return (
                <button
                  key={n.tone}
                  type="button"
                  aria-label={`thanh ${TONE_NAMES[n.tone as Tone]}`}
                  onClick={() => turnTo(i)}
                  className="absolute flex h-[92px] w-[92px] items-center justify-center rounded-full"
                  style={{
                    left: WHEEL / 2 + r * Math.sin(angle) - 46,
                    top: WHEEL / 2 - r * Math.cos(angle) - 46,
                    transform: `rotate(${i * 60}deg)`,
                  }}
                  data-testid="syl-tone-notch"
                  data-tone={n.tone}
                >
                  <span
                    className="font-black text-[46px] leading-none"
                    style={{ color: PIECE_STYLE.tone.ink }}
                  >
                    {toneGlyph(n.tone as Tone)}
                  </span>
                </button>
              );
            })}
          </motion.div>
          {/* the pointer and the syllable at the top */}
          <div
            className="-top-4 -translate-x-1/2 pointer-events-none absolute left-1/2 h-0 w-0"
            style={{
              borderLeft: "18px solid transparent",
              borderRight: "18px solid transparent",
              borderTop: `30px solid ${PIECE_STYLE.tone.ring}`,
            }}
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <motion.span
              key={notch.text}
              initial={reduce ? false : { scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-[26px] bg-white px-5 py-2 font-black text-[56px] text-[#2B2B3A] leading-none shadow"
              style={answered === "right" ? { boxShadow: "0 0 0 8px #34C759" } : undefined}
              data-testid="syl-tone-text"
            >
              {notch.text}
            </motion.span>
          </div>
        </div>

        <motion.button
          type="button"
          aria-label="xoay phải"
          onClick={() => turnTo(at + 1)}
          whileTap={reduce ? undefined : { scale: 0.9 }}
          className="flex h-[96px] w-[96px] items-center justify-center rounded-full bg-white text-[46px] shadow"
          data-testid="syl-tone-right"
        >
          ↻
        </motion.button>
      </div>

      <div className="flex min-h-[110px] items-center gap-4">
        <AnimatePresence mode="wait">
          {picture ? (
            <motion.div
              key={notch.text}
              initial={reduce ? false : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 rounded-[28px] bg-white px-4 py-2 shadow"
            >
              <Picture image={picture as never} size={88} alt={notch.syllable?.meaning ?? ""} />
              <span className="font-bold text-[24px] text-[#6B6B7B]">
                {notch.syllable?.meaning}
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <BigButton
          tone="correct"
          disabled={Boolean(answered)}
          onClick={() => void confirm()}
          data-testid="syl-tone-done"
        >
          Xong
        </BigButton>
      </div>
    </div>
  );
}
