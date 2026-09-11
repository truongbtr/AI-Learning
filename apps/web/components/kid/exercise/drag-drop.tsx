"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { playSound } from "../sound";
import { SPRING, STAGGER } from "../tokens";
import { ExerciseFrame } from "./frame";
import { type ExerciseProps, fillPlaceholders, imageSrc } from "./types";

/**
 * DRAG_DROP, with the three movements docs/06 §1.3 asks for by name:
 *  - **nghiêng**: the card tilts the way it is being dragged;
 *  - **hít**: a zone within reach pulls the card in and glows;
 *  - **nảy**: a card that lands where it belongs bounces; one that does not floats back.
 *
 * Dropping a card the zone will not take is not a failure — it simply drifts home, with the soft
 * "almost" sound and no red anywhere.
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
  vars,
  mascot,
}: ExerciseProps) {
  const [placed, setPlaced] = useState<Placed>({});
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const zoneRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const reduce = useReducedMotion();

  const zones = spec.dropZones ?? [];
  const items = spec.dragItems ?? [];
  const ready = zones.every((z) => Object.values(placed).includes(z.id));

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
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone?.accepts.includes(itemId)) {
      // the zone will not take it: float home, quietly
      playSound("gan-dung");
      setPlaced((p) => {
        const { [itemId]: _gone, ...rest } = p;
        return rest;
      });
      return;
    }
    playSound("cham");
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
    const src = item.image ? imageSrc(item.image.value, item.image.kind) : null;
    return (
      <motion.div
        key={item.id}
        variants={STAGGER.item}
        drag={!disabled}
        dragSnapToOrigin
        dragElastic={0.18}
        whileDrag={reduce ? undefined : { scale: 1.12, rotate: 6, zIndex: 30 }}
        onDrag={(_, info) => setHover(zoneUnder(info.point.x, info.point.y))}
        onDragEnd={(_, info) => drop(item.id, info.point.x, info.point.y)}
        animate={inZone && !reduce ? { scale: [1.15, 0.95, 1] } : {}}
        transition={SPRING.press}
        className={`flex min-h-[104px] min-w-[104px] cursor-grab touch-none select-none items-center justify-center rounded-[26px] bg-white px-5 py-3 shadow-[0_12px_28px_-14px_rgba(43,43,58,0.55)] ${
          inZone ? "ring-4 ring-[#34C759]" : ""
        }`}
        data-testid="drag-item"
        data-item={item.id}
      >
        {item.image ? (
          src ? (
            // biome-ignore lint/performance/noImgElement: local SVG asset
            <img src={src} alt={item.image.labelVi ?? ""} className="h-20 w-20 object-contain" />
          ) : (
            <span className="text-[52px] leading-none">{item.image.value}</span>
          )
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
              <div
                key={z.id}
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
              </div>
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
