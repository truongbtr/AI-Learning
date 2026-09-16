"use client";

import { joinSyllable, type Tone } from "@mtct/core";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SpeakerButton } from "../buttons";
import { Picture } from "../exercise/picture";
import { playSound } from "../sound";
import { SPRING } from "../tokens";
import { useSpeak } from "../use-speak";
import { PieceFace, PieceTile, pieceSpeech } from "./tile";
import {
  type BuildItem,
  PIECE_STYLE,
  type PieceKind,
  type SyllableGameProps,
  type SyllableRound,
  TILE_MIN,
} from "./types";
import { useCadence } from "./use-cadence";

type BuildRound = Extract<SyllableRound, { game: "build" | "split" }>;
type Placed = { onset?: string; rime?: string; tone?: Tone };
type Phase = "building" | "running" | "right" | "again" | "shown";

/** After this many builds that are not the syllable, the machine builds it and moves on. */
const MAX_TRIES = 2;

/**
 * (a) "Lắp tiếng" and (b) "Tách tiếng".
 *
 * The machine says a syllable and shows its picture. Pieces ride a slow conveyor belt — onsets
 * are squares, rimes long bars, tones hats — and every piece says its sound when touched. The
 * child drags one of each into the machine (or touches a piece, then its slot). The machine runs
 * and reads back exactly what was built, in the school's rhythm, lighting each piece as it says
 * it. The right syllable lights up with its picture; anything else is simply heard, and the
 * pieces that do not belong slide back to the belt for another go.
 *
 * Tách tiếng is the same machine with the written syllable on screen from the start: the child
 * takes a word she can see apart into the pieces she can hear.
 */
export function BuildGame({ round, onMeeting, onDone }: SyllableGameProps<BuildRound>) {
  const reduce = useReducedMotion();
  const { speak } = useSpeak();
  const cadence = useCadence();
  const items = round.items;
  const [index, setIndex] = useState(0);
  const [placed, setPlaced] = useState<Placed>({});
  const [held, setHeld] = useState<{ kind: PieceKind; value: string } | null>(null);
  const [nudge, setNudge] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("building");
  const [tries, setTries] = useState(0);
  const slotRefs = useRef<Partial<Record<PieceKind, HTMLButtonElement | null>>>({});
  /** Bumped for every new syllable and on unmount: a machine run from before stops quietly. */
  const run = useRef(0);
  const item: BuildItem | undefined = items[index];
  const target = item?.syllable;
  const kinds: PieceKind[] = target?.onset ? ["onset", "rime", "tone"] : ["rime", "tone"];

  // a fresh machine for every syllable, and the syllable said out loud
  useEffect(() => {
    if (!target) return;
    run.current++;
    setPlaced({});
    setHeld(null);
    setPhase("building");
    setTries(0);
    const id = window.setTimeout(() => void speak(target.text, { lang: "vi-VN" }), 450);
    return () => window.clearTimeout(id);
  }, [target, speak]);
  useEffect(
    () => () => {
      run.current++;
    },
    [],
  );

  const belt = useMemo(() => {
    if (!item) return [];
    const tiles = [
      ...item.onsets.map((v) => ({ kind: "onset" as const, value: v })),
      ...item.rimes.map((v) => ({ kind: "rime" as const, value: v })),
      ...item.tones.map((v) => ({ kind: "tone" as const, value: v as string })),
    ];
    // interleave the kinds so a belt is never "all squares, then all bars"
    const out: typeof tiles = [];
    for (let i = 0; i < 3; i++)
      for (const k of ["onset", "rime", "tone"] as const) {
        const t = tiles.filter((x) => x.kind === k)[i];
        if (t) out.push(t);
      }
    return out;
  }, [item]);

  const touch = useCallback(
    (kind: PieceKind, value: string) => {
      playSound("cham");
      setHeld({ kind, value });
      void speak(pieceSpeech(kind, value), { lang: "vi-VN" });
    },
    [speak],
  );

  const place = useCallback(
    (kind: PieceKind, value: string) => {
      if (phase !== "building") return;
      setPlaced((p) => ({ ...p, [kind]: value }));
      setHeld(null);
      playSound("cham");
    },
    [phase],
  );

  const dropAt = useCallback(
    (kind: PieceKind, value: string, point: { x: number; y: number }) => {
      const hit = (
        Object.entries(slotRefs.current) as [PieceKind, HTMLButtonElement | null][]
      ).find(([, el]) => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        const x = point.x - window.scrollX;
        const y = point.y - window.scrollY;
        return x >= r.left - 12 && x <= r.right + 12 && y >= r.top - 12 && y <= r.bottom + 12;
      });
      if (!hit) return;
      if (hit[0] !== kind) {
        // a square does not fit a bar-shaped hole: say so with a wiggle, never with a word
        setNudge(`${kind}:${value}`);
        playSound("gan-dung");
        window.setTimeout(() => setNudge(null), 500);
        return;
      }
      void speak(pieceSpeech(kind, value), { lang: "vi-VN" });
      place(kind, value);
    },
    [place, speak],
  );

  const full = kinds.every((k) => placed[k] !== undefined);

  // the machine runs as soon as every slot has a piece
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once each time the machine fills
  useEffect(() => {
    if (!target || !full || phase !== "building") return;
    const built = { onset: placed.onset ?? "", rime: placed.rime ?? "", tone: placed.tone as Tone };
    const right =
      built.onset === target.onset && built.rime === target.rime && built.tone === target.tone;
    setPhase("running");
    const mine = run.current;
    const cancelled = () => run.current !== mine;
    void (async () => {
      await new Promise((r) => setTimeout(r, reduce ? 150 : 700));
      if (cancelled()) return;
      // only the first build of a syllable counts for the Leitner box and the evidence
      if (tries === 0) onMeeting(target.id, { game: round.game, ...built });
      await cadence.play({ amDau: built.onset, van: built.rime, thanh: built.tone });
      if (cancelled()) return;
      if (right) {
        playSound("dung");
        setPhase("right");
        window.setTimeout(() => {
          if (index + 1 >= items.length) onDone();
          else setIndex((i) => i + 1);
        }, 1500);
        return;
      }
      playSound("gan-dung");
      const nextTries = tries + 1;
      setTries(nextTries);
      if (nextTries >= MAX_TRIES) {
        // the machine builds it itself, and reads it, and the round goes on
        setPlaced({ onset: target.onset || undefined, rime: target.rime, tone: target.tone });
        setPhase("shown");
        await speak("Tiếng mẫu đây, con nghe nhé!", { lang: "vi-VN" });
        await cadence.play(target.text);
        if (cancelled()) return;
        window.setTimeout(() => {
          if (index + 1 >= items.length) onDone();
          else setIndex((i) => i + 1);
        }, 1200);
        return;
      }
      setPhase("again");
      await speak("Mình nghe lại tiếng mẫu nhé.", { lang: "vi-VN" });
      await speak(target.text, { lang: "vi-VN" });
      if (cancelled()) return;
      // the pieces that are not the syllable's go back to the belt; the right ones stay
      setPlaced((p) => ({
        onset: p.onset === target.onset ? p.onset : undefined,
        rime: p.rime === target.rime ? p.rime : undefined,
        tone: p.tone === target.tone ? p.tone : undefined,
      }));
      setPhase("building");
    })();
  }, [full, phase]);

  if (!item || !target) return null;

  const litKinds = new Set<PieceKind>();
  const step = cadence.step;
  if (step?.kind === "onset") litKinds.add("onset");
  if (step?.kind === "rime") litKinds.add("rime");
  if (step?.kind === "blend") {
    litKinds.add("onset");
    litKinds.add("rime");
  }
  if (step?.kind === "tone") litKinds.add("tone");
  if (step?.kind === "full") for (const k of kinds) litKinds.add(k);
  const wordShown = round.game === "split" || phase === "right" || phase === "shown";
  const builtText = full
    ? joinSyllable(placed.onset ?? "", placed.rime ?? "", placed.tone as Tone)
    : null;

  return (
    <div
      className="flex w-full flex-col items-center gap-4"
      data-testid="syl-build"
      data-game={round.game}
      data-target={target.text}
      data-onset={target.onset}
      data-rime={target.rime}
      data-tone={target.tone}
      data-state={phase}
      data-index={index}
      data-spoken={cadence.spoken.join("|")}
    >
      {/* what to build: the voice, the picture, and — in Tách tiếng — the word */}
      <div className="flex items-center gap-4">
        {target.picture ? (
          <motion.div
            key={target.id}
            initial={reduce ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: phase === "right" && !reduce ? [1, 1.18, 1] : 1, opacity: 1 }}
            transition={SPRING.pop}
            className="flex h-[128px] w-[128px] items-center justify-center rounded-[32px] bg-white shadow-[0_14px_30px_-18px_rgba(43,43,58,0.55)]"
          >
            <Picture image={target.picture as never} size={104} alt={target.meaning} />
          </motion.div>
        ) : null}
        <div className="flex flex-col items-center gap-1">
          <SpeakerButton text={target.text} lang="vi-VN" size={84} />
          <span className="font-bold text-[22px] text-[#6B6B7B]">{target.meaning}</span>
        </div>
        <AnimatePresence>
          {wordShown ? (
            <motion.button
              type="button"
              key={`word-${target.id}`}
              initial={reduce ? false : { opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => void cadence.play(target.text)}
              className="min-h-[96px] rounded-[30px] bg-white px-6 font-black text-[64px] text-[#2B2B3A] leading-none shadow-[0_14px_30px_-18px_rgba(43,43,58,0.55)]"
              style={
                phase === "right"
                  ? { boxShadow: "0 0 0 8px #FFD447, 0 0 40px 6px #FFE58A" }
                  : undefined
              }
              data-testid="syl-word"
            >
              {target.text}
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      {/* the machine */}
      <div className="relative flex items-center gap-3 rounded-[40px] bg-[#FFF3DD] px-5 py-4 shadow-[inset_0_-10px_0_#F2DDB6]">
        <motion.span
          className="-top-5 -left-4 absolute text-[42px]"
          animate={phase === "running" && !reduce ? { rotate: 360 } : { rotate: 0 }}
          transition={
            phase === "running"
              ? { repeat: Number.POSITIVE_INFINITY, duration: 0.9 }
              : { duration: 0 }
          }
          aria-hidden
        >
          ⚙️
        </motion.span>
        {kinds.map((kind, i) => {
          const value = placed[kind];
          const style = PIECE_STYLE[kind];
          return (
            <div key={kind} className="flex items-center gap-3">
              {i > 0 ? (
                <span className="font-black text-[34px] text-[#C9A56A]" aria-hidden>
                  +
                </span>
              ) : null}
              <button
                type="button"
                ref={(el) => {
                  slotRefs.current[kind] = el;
                }}
                aria-label={`khe ${style.label}`}
                data-testid="syl-slot"
                data-kind={kind}
                data-filled={value ?? ""}
                onClick={() => {
                  if (phase !== "building") return;
                  if (value !== undefined) {
                    // a piece taken out of the machine says itself and goes back to the belt
                    void speak(pieceSpeech(kind, value), { lang: "vi-VN" });
                    setPlaced((p) => ({ ...p, [kind]: undefined }));
                    return;
                  }
                  if (held?.kind === kind) {
                    void speak(pieceSpeech(kind, held.value), { lang: "vi-VN" });
                    place(kind, held.value);
                  } else if (held) {
                    setNudge(`${held.kind}:${held.value}`);
                    window.setTimeout(() => setNudge(null), 500);
                  }
                }}
                className="flex items-center justify-center rounded-[24px]"
                style={{
                  minWidth: kind === "rime" ? TILE_MIN * 1.6 : TILE_MIN,
                  minHeight: TILE_MIN,
                  border: value ? "none" : `4px dashed ${style.ring}88`,
                  background: value ? "transparent" : `${style.bg}AA`,
                  boxShadow: litKinds.has(kind) ? `0 0 0 7px ${style.ring}88` : undefined,
                  transition: "box-shadow 120ms",
                }}
              >
                {value !== undefined ? (
                  <motion.span
                    key={`${kind}-${value}`}
                    initial={reduce ? false : { scale: 0.5, y: 40 }}
                    animate={{ scale: litKinds.has(kind) && !reduce ? 1.08 : 1, y: 0 }}
                    transition={SPRING.pop}
                  >
                    <PieceFace kind={kind} value={value} />
                  </motion.span>
                ) : (
                  <span className="text-[30px] opacity-40" aria-hidden>
                    {kind === "tone" ? "🎩" : kind === "onset" ? "▢" : "▭"}
                  </span>
                )}
              </button>
            </div>
          );
        })}
        {builtText && (phase === "running" || phase === "again") ? (
          <span className="ml-2 font-black text-[40px] text-[#6B6B7B]" data-testid="syl-built">
            = {builtText}
          </span>
        ) : null}
      </div>

      {/* the conveyor belt */}
      <div className="w-full overflow-hidden rounded-[30px] bg-[#E9EEF5] py-4 shadow-[inset_0_6px_0_#D5DDE8]">
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 px-3"
          animate={reduce || held ? { x: 0 } : { x: [0, -14, 0, 14, 0] }}
          transition={{ duration: 9, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          data-testid="syl-belt"
        >
          {belt.map((t) => {
            const inMachine = placed[t.kind] === t.value;
            if (inMachine) return null;
            return (
              <PieceTile
                key={`${t.kind}-${t.value}`}
                kind={t.kind}
                value={t.value}
                disabled={phase !== "building"}
                lit={held?.kind === t.kind && held.value === t.value}
                nudge={nudge === `${t.kind}:${t.value}`}
                onTap={() => touch(t.kind, t.value)}
                onDragEnd={(point) => dropAt(t.kind, t.value, point)}
              />
            );
          })}
        </motion.div>
      </div>

      <div className="flex items-center gap-2" aria-hidden>
        {items.map((it, i) => (
          <span
            key={it.syllable.id}
            className="h-3 w-8 rounded-full"
            style={{ background: i < index ? "#34C759" : i === index ? "#FFD447" : "#E3DCCB" }}
          />
        ))}
      </div>
    </div>
  );
}
