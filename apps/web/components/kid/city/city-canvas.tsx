"use client";

import type { CityEngine, TapTarget } from "@mtct/city/engine";
import type { CityView } from "@mtct/core";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { LoadingMascot } from "@/components/kid/states";

export interface CityOverlayItem {
  /** Anchor id from the engine: `skill:<id>`, `plot:<n>`, `townHall:order`, `wonder`, `public:<code>`. */
  anchor: string;
  key: string;
  node: ReactNode;
}

/**
 * The 3D city (Pha 10 việc 2 engine) in a React screen. three.js is loaded only here, on the client,
 * after the page has painted. HTML overlays (mission bubbles — real buttons, ≥ 64 px, read aloud)
 * follow their anchors every frame by writing styles directly, without re-rendering React.
 */
export function CityCanvas({
  view,
  hour,
  dayAnchorMs,
  overlays,
  onReady,
  onTap,
}: {
  view: CityView;
  hour?: number;
  /** When the game day starts in the morning — the child's session start (pha 11). */
  dayAnchorMs?: number;
  overlays: CityOverlayItem[];
  onReady?: (engine: CityEngine) => void;
  onTap?: (target: TapTarget) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CityEngine | null>(null);
  const holders = useRef(new Map<string, HTMLDivElement>());
  const overlaysRef = useRef(overlays);
  overlaysRef.current = overlays;
  const viewRef = useRef(view);
  viewRef.current = view;
  const tapRef = useRef(onTap);
  tapRef.current = onTap;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // the engine is built once per screen; view changes go through setView below
  // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
  useEffect(() => {
    let disposed = false;
    let raf = 0;
    let onResize: (() => void) | null = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    (async () => {
      try {
        const { createCityEngine } = await import("@mtct/city/engine");
        if (disposed) return;
        const engine = await createCityEngine(canvas, {
          assetsBase: "/art/city",
          hour,
          dayAnchorMs,
        });
        if (disposed) {
          engine.dispose();
          return;
        }
        engineRef.current = engine;
        engine.setView(viewRef.current);
        engine.on("tap", (t) => tapRef.current?.(t));
        onResize = () => engine.resize();
        window.addEventListener("resize", onResize);
        const follow = () => {
          raf = requestAnimationFrame(follow);
          const items = overlaysRef.current;
          if (items.length === 0) return;
          const positions = new Map(
            engine.anchors(items.map((o) => o.anchor)).map((a) => [a.id, a]),
          );
          for (const item of items) {
            const el = holders.current.get(item.key);
            const at = positions.get(item.anchor);
            if (!el) continue;
            if (!at?.visible) {
              el.style.visibility = "hidden";
              continue;
            }
            el.style.visibility = "visible";
            el.style.transform = `translate(${Math.round(at.x)}px, ${Math.round(at.y)}px) translate(-50%, -100%)`;
          }
        };
        follow();
        setReady(true);
        onReady?.(engine);
      } catch (err) {
        console.error(err);
        setFailed(true);
      }
    })();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      if (onResize) window.removeEventListener("resize", onResize);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setView(view);
  }, [view]);

  return (
    <div className="fixed inset-0" data-testid="city-canvas" data-ready={ready ? "1" : "0"}>
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="pointer-events-none fixed inset-0">
        {overlays.map((o) => (
          <div
            key={o.key}
            ref={(el) => {
              if (el) holders.current.set(o.key, el);
              else holders.current.delete(o.key);
            }}
            className="pointer-events-auto absolute top-0 left-0"
            style={{ visibility: "hidden" }}
          >
            {o.node}
          </div>
        ))}
      </div>
      {!ready && !failed ? (
        <div className="fixed inset-0 flex items-center justify-center bg-[#d2f3ff]">
          <LoadingMascot />
        </div>
      ) : null}
      {failed ? (
        <div className="fixed inset-0 flex items-center justify-center bg-[#d2f3ff] p-6 text-center font-extrabold text-[24px] text-[#1f3b63]">
          Thành phố đang ngủ một chút. Ba mẹ tải lại trang giúp con nhé.
        </div>
      ) : null}
    </div>
  );
}
