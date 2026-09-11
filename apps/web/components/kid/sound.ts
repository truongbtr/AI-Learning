"use client";

/**
 * The six interface sounds (docs/06 §1.1). They live in content/art/audio/ui and are served from
 * /art after `pnpm art:sync`.
 *
 * Rules that matter more than the code: every sound is under a second, none of them can be read
 * as "wrong" (docs/06 §1 rule 4), and the child can turn them off — the switch is remembered on
 * the device, because a family sometimes needs the tablet quiet.
 */

export type KidSound = "dung" | "gan-dung" | "sao" | "huy-hieu" | "xong-phien" | "cham";

const FILES: Record<KidSound, string> = {
  dung: "/art/audio/ui/dung.wav",
  "gan-dung": "/art/audio/ui/gan-dung.wav",
  sao: "/art/audio/ui/sao.wav",
  "huy-hieu": "/art/audio/ui/huy-hieu.wav",
  "xong-phien": "/art/audio/ui/xong-phien.wav",
  cham: "/art/audio/ui/cham.wav",
};

const VOLUME: Record<KidSound, number> = {
  dung: 0.7,
  "gan-dung": 0.55,
  sao: 0.6,
  "huy-hieu": 0.7,
  "xong-phien": 0.7,
  cham: 0.35,
};

const STORAGE_KEY = "mtct.kid.sound";
const cache = new Map<KidSound, HTMLAudioElement>();

export function soundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) !== "off";
}

export function setSoundEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
}

/** Plays a sound; never throws and never blocks — a missing file must not break a lesson. */
export function playSound(name: KidSound): void {
  if (typeof window === "undefined" || !soundEnabled()) return;
  try {
    let el = cache.get(name);
    if (!el) {
      el = new Audio(FILES[name]);
      el.preload = "auto";
      cache.set(name, el);
    }
    el.volume = VOLUME[name];
    el.currentTime = 0;
    void el.play().catch(() => {});
  } catch {
    /* an audio element the browser refuses is not a reason to stop the exercise */
  }
}

/** Warms the cache on the first interaction so the first star does not arrive silently. */
export function preloadSounds(): void {
  if (typeof window === "undefined") return;
  for (const name of Object.keys(FILES) as KidSound[]) {
    if (cache.has(name)) continue;
    const el = new Audio(FILES[name]);
    el.preload = "auto";
    cache.set(name, el);
  }
}
