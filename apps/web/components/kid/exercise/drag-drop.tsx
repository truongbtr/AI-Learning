"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { playSound } from "../sound";
import { SPRING, STAGGER } from "../tokens";
import { ExerciseFrame } from "./frame";
import { Picture } from "./picture";
import { type ExerciseProps, fillPlaceholders } from "./types";

/**
 * DRAG_DROP, with the three movements docs/06 §1.3 asks for by name:
 *  - **nghiêng**: the card tilts the way it is being dragged;
 *  - **hít**: a zone within reach pulls the card in and glows;
 *  - **nảy**: a card that lands where it belongs bounces; one that does not floats back.
 *
 * A card may be dropped in any zone, including the wrong one: that is the whole point of
 * `dragItems[].errorTag` (ADR-15) — the server sees where the card actually went and can say what
 * the child was thinking. A card that turns out to be in the wrong place floats home afterwards,
 * with the soft "almost" sound and no red anywhere.
 *
 * Cards can also be tapped instead of dragged (tap the card, then tap the zone): a six-year-old on
 * a tablet drags happily, but a tired one, or one using a mouse, should not be stuck.
 */

const SNAP_PX = 90;

interface Placed {
  [itemId: string]: string | undefined; // itemId -> zoneId
}

export function DragDropExercise({
  spec,
  onSubmit,
  onHint,
  disabled,
  feedback,
  vars,
  mascot,
}: ExerciseProps) {
  const [placed, setPlaced] = useState<Placed>({});
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const zoneRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const reduce = useReducedMotion();

  const zones = spec.dropZones ?? [];
  const items = spec.dragItems ?? [];
  // Ready once every basket holds a card, or once the tray is empty. Not "every card placed": in
  // many exercises some cards are distractors that stay in the tray ("Kéo chữ ch vào giỏ" — kh and
  // tr stay behind). And an empty tray is always enough, so a child who put every card in one basket
  // can still press "Xong!" and get the hint, instead of a button that never lights up.
  const trayEmpty = items.length > 0 && items.every((i) => placed[i.id]);
  const everyZoneFilled =
    zones.length > 0 && zones.every((z) => Object.values(placed).some((zoneId) => zoneId === z.id));
  const ready = trayEmpty || everyZoneFilled;

  // The server has marked it: the cards that went to the wrong place float home so the child can
  // try those again — the ones that were right stay where they were put.
  const wrong = feedback?.wrongItems;
  useEffect(() => {
    if (!wrong?.length) return;
    setPlaced((p) => {
      const next = { ...p };
      for (const id of wrong) delete next[id];
      return next;
    });
  }, [wrong]);

  const zoneUnder = useCallback((x: number, y: number) => {
    let best: { id: string; d: number } | null = null;
    for (const [id, el] of Object.entries(zoneRefs.current)) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const inside = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      const d = Math.hypot(x - cx, y - cy);
      if (inside || d < SNAP_PX) {
        if (!best || d < best.d) best = { id, d };
      }
    }
    return best?.id ?? null;
  }, []);

  const drop = (itemId: string, x: number, y: number) => {
    const zoneId = zoneUnder(x, y);
    setHover(null);
    if (!zoneId) {
      setPlaced((p) => {
        const { [itemId]: _gone, ...rest } = p;
        return rest;
      });
      return;
    }
    playSound("cham");
    setSelected(null);
    setPlaced((p) => ({ ...p, [itemId]: zoneId }));
  };

  /** Tap-to-place: the same landing as a drag, without the dragging. */
  const drop2 = (itemId: string, zoneId: string) => {
    playSound("cham");
    setSelected(null);
    setPlaced((p) => ({ ...p, [itemId]: zoneId }));
  };

  const submit = () => {
    if (disabled || !ready) return;
    const byZone: Record<string, string[]> = {};
    for (const [itemId, zoneId] of Object.entries(placed)) {
      if (!zoneId) continue;
      const list = byZone[zoneId] ?? [];
      list.push(itemId);
      byZone[zoneId] = list;
    }
    const el = zoneRefs.current[zones[0]?.id ?? ""];
    const r = el?.getBoundingClientRect();
    onSubmit({
      placement: byZone,
      at: r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined,
    });
  };

  const card = (item: (typeof items)[number], inZone: boolean) => {
    return (
      <motion.div
        key={item.id}
        // a card that has just landed in a zone is a new element outside the stagger: without its
        // own initial state it would stay at the "hidden" variant and vanish from the basket
        variants={inZone ? undefined : STAGGER.item}
        initial={inZone ? { opacity: 1, scale: 1 } : undefined}
        drag={!disabled}
        dragSnapToOrigin
        dragElastic={0.18}
        whileDrag={reduce ? undefined : { scale: 1.12, rotate: 6, zIndex: 30 }}
        onDrag={(_, info) => setHover(zoneUnder(info.point.x, info.point.y))}
        onDragEnd={(_, info) => drop(item.id, info.point.x, info.point.y)}
        onClick={() => {
          if (disabled) return;
          playSound("cham");
          setSelected((s) => (s === item.id ? null : item.id));
        }}
        animate={inZone && !reduce ? { scale: [1.15, 0.95, 1] } : {}}
        // a three-step pop cannot be a spring (motion allows two keyframes per spring)
        transition={inZone ? { duration: 0.35, ease: "easeOut" } : SPRING.press}
        className={`flex min-h-[104px] min-w-[104px] cursor-grab touch-none select-none items-center justify-center rounded-[26px] bg-white px-5 py-3 shadow-[0_12px_28px_-14px_rgba(43,43,58,0.55)] ${
          selected === item.id ? "ring-4 ring-[#FFD447]" : inZone ? "ring-4 ring-[#34C759]" : ""
        }`}
        data-testid="drag-item"
        data-item={item.id}
      >
        {item.image ? (
          <Picture image={item.image} size={96} className="pointer-events-none" />
        ) : (
          <span className="font-extrabold text-[34px] text-[#2B2B3A]">
            {fillPlaceholders(item.text ?? "", vars)}
          </span>
        )}
      </motion.div>
    );
  };

  return (
    <ExerciseFrame
      spec={spec}
      vars={vars}
      onHint={() => {
        setHintsUsed((n) => Math.min(spec.hints.length, n + 1));
        onHint();
      }}
      hintsUsed={hintsUsed}
      disabled={disabled}
      mascot={mascot}
    >
      <div className="flex flex-col items-center gap-6">
        {/* the zones */}
        <div className="flex flex-wrap justify-center gap-5">
          {zones.map((z) => {
            const mine = Object.entries(placed)
              .filter(([, zoneId]) => zoneId === z.id)
              .map(([itemId]) => items.find((i) => i.id === itemId))
              .filter(Boolean);
            return (
              <button
                type="button"
                key={z.id}
                onClick={() => {
                  if (!selected || disabled) return;
                  drop2(selected, z.id);
                }}
                ref={(el) => {
                  zoneRefs.current[z.id] = el;
                }}
                className={`flex min-h-[150px] min-w-[190px] flex-col items-center justify-center gap-2 rounded-[32px] border-4 border-dashed px-5 py-4 transition-colors ${
                  hover === z.id ? "border-[#2F80ED] bg-[#EAF2FE]" : "border-[#C9BDA4] bg-white/70"
                }`}
                data-testid="drop-zone"
                data-zone={z.id}
              >
                {z.label ? (
                  <span className="font-extrabold text-[20px] text-[#6B6B7B]">{z.label}</span>
                ) : null}
                <div className="flex flex-wrap justify-center gap-2">
                  {mine.map((item) => (item ? card(item, true) : null))}
                </div>
              </button>
            );
          })}
        </div>

        {/* the tray */}
        <div
          className="flex min-h-[120px] w-full flex-wrap items-center justify-center gap-4 rounded-[32px] bg-white/50 p-4"
          data-testid="drag-tray"
        >
          {items.filter((i) => !placed[i.id]).map((item) => card(item, false))}
        </div>

        <motion.button
          type="button"
          onClick={submit}
          disabled={!ready || disabled}
          animate={{ opacity: ready && !disabled ? 1 : 0.45, scale: ready ? 1 : 0.96 }}
          className="min-h-[84px] rounded-[34px] bg-[#34C759] px-10 font-extrabold text-[26px] text-white shadow-[0_10px_0_-2px_#22A344]"
          data-testid="drag-submit"
        >
          Xong!
        </motion.button>
      </div>
    </ExerciseFrame>
  );
}
