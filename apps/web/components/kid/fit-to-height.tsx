"use client";

import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";

/** A screen this short gets the compact layout (a 1366×768 laptop leaves ~625 px to the page). */
export const SHORT_SCREEN_QUERY = "(max-height: 820px)";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** True on a short screen, so a component can pick smaller pictures (CSS can't size a <Picture>). */
export function useShortScreen(): boolean {
  const [short, setShort] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(SHORT_SCREEN_QUERY);
    const update = () => setShort(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return short;
}

/**
 * Keeps an exercise inside the space it is given, centred, with nothing below the fold: a child
 * does not scroll to find the answers (owner, 17/09/2026, on a low-resolution screen).
 *
 * The layouts are compact on short screens already; this is the last step. When the content is
 * still taller than the box it is zoomed down, but never below `min` — 0.9 keeps a 72 px button
 * at 65 px, so the 64 px tap rule still holds. Anything taller than that scrolls, as before.
 */
export function FitToHeight({ children, min = 0.9 }: { children: ReactNode; min?: number }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);

  useIsoLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const fit = () => {
      const available = o.clientHeight;
      // getBoundingClientRect is already zoomed; divide to get the natural height back
      const natural = i.getBoundingClientRect().height / zoomRef.current;
      if (available <= 0 || natural <= 0) return;
      const next = Math.max(min, Math.min(1, available / natural));
      if (Math.abs(next - zoomRef.current) < 0.01) return;
      zoomRef.current = next;
      setZoom(next);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [min]);

  return (
    <div
      ref={outer}
      className="flex min-h-0 w-full flex-1 flex-col items-center justify-center"
      data-testid="fit-to-height"
      data-zoom={zoom.toFixed(2)}
    >
      <div ref={inner} className="flex w-full flex-col items-center" style={{ zoom }}>
        {children}
      </div>
    </div>
  );
}
