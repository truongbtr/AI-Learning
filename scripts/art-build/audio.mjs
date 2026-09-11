/**
 * The six interface sounds of docs/06 §1.1, written as small WAV files.
 *
 * Synthesised here rather than downloaded: a few sine partials with a soft attack and an
 * exponential decay give a warm, toy-like "ding" with no licence to track and no file over 30 KB.
 * They are effects, not music — each is under a second, as the design asks.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ART_ROOT } from "./lib.mjs";

const RATE = 22050;

/** A note: frequency in Hz, start and length in seconds, loudness 0..1. */
function note(
  samples,
  { freq, start, length, gain = 0.5, partials = [1, 0.35, 0.12], vibrato = 0 },
) {
  const from = Math.floor(start * RATE);
  const to = Math.min(samples.length, Math.floor((start + length) * RATE));
  for (let i = from; i < to; i++) {
    const t = (i - from) / RATE;
    const p = t / length;
    // 8 ms attack, exponential decay — no click at either end
    const env = Math.min(1, t / 0.008) * Math.exp(-3.2 * p);
    let v = 0;
    const f = freq * (1 + vibrato * Math.sin(2 * Math.PI * 5.5 * t));
    for (let h = 0; h < partials.length; h++)
      v += partials[h] * Math.sin(2 * Math.PI * f * (h + 1) * t);
    samples[i] += (v / partials.length) * env * gain;
  }
}

/** A short filtered-noise burst — the soft tap under a button press. */
function tick(samples, { start, length, gain = 0.25 }) {
  const from = Math.floor(start * RATE);
  const to = Math.min(samples.length, Math.floor((start + length) * RATE));
  let last = 0;
  for (let i = from; i < to; i++) {
    const p = (i - from) / (to - from);
    const white = Math.random() * 2 - 1;
    last = last * 0.72 + white * 0.28; // low-pass: a thud, not a hiss
    samples[i] += last * Math.exp(-6 * p) * gain;
  }
}

function wav(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32000), 44 + i * 2);
  }
  return buf;
}

const seconds = (s) => new Float32Array(Math.ceil(RATE * s));

/** C major-ish notes — nothing in the set can sound like a wrong buzzer (docs/06 §1 rule 4). */
const N = {
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880,
  C6: 1046.5,
  E6: 1318.5,
  G6: 1568,
};

const SOUNDS = {
  /** Correct answer: a bright two-note rise. */
  "dung.wav": () => {
    const s = seconds(0.6);
    note(s, { freq: N.E5, start: 0, length: 0.18, gain: 0.5 });
    note(s, { freq: N.A5, start: 0.1, length: 0.42, gain: 0.55 });
    return s;
  },
  /** Nearly right: warm, level, never sour — it must not feel like a buzzer. */
  "gan-dung.wav": () => {
    const s = seconds(0.5);
    note(s, { freq: N.D5, start: 0, length: 0.22, gain: 0.42, partials: [1, 0.2] });
    note(s, { freq: N.D5, start: 0.16, length: 0.3, gain: 0.36, partials: [1, 0.2] });
    return s;
  },
  /** A star lands in the pocket: a little glitter upward. */
  "sao.wav": () => {
    const s = seconds(0.7);
    [N.G5, N.C6, N.E6].forEach((f, i) => {
      note(s, { freq: f, start: i * 0.07, length: 0.3, gain: 0.4, partials: [1, 0.5, 0.25] });
    });
    return s;
  },
  /** A badge is awarded: a small fanfare. */
  "huy-hieu.wav": () => {
    const s = seconds(1.1);
    [
      [N.C5, 0],
      [N.E5, 0.12],
      [N.G5, 0.24],
      [N.C6, 0.36],
    ].forEach(([f, t]) => {
      note(s, { freq: f, start: t, length: 0.5, gain: 0.45 });
    });
    note(s, { freq: N.G6, start: 0.5, length: 0.55, gain: 0.3, vibrato: 0.01 });
    return s;
  },
  /** End of a session: the celebration chord. */
  "xong-phien.wav": () => {
    const s = seconds(1.4);
    [
      [N.C5, 0],
      [N.E5, 0.08],
      [N.G5, 0.16],
      [N.C6, 0.24],
      [N.E6, 0.32],
    ].forEach(([f, t]) => {
      note(s, { freq: f, start: t, length: 0.9, gain: 0.36 });
    });
    note(s, { freq: N.G6, start: 0.62, length: 0.7, gain: 0.22, vibrato: 0.012 });
    return s;
  },
  /** Any tap: quiet, short, not a note — so it never gets tiring. */
  "cham.wav": () => {
    const s = seconds(0.18);
    tick(s, { start: 0, length: 0.07, gain: 0.3 });
    note(s, { freq: N.A5, start: 0.005, length: 0.1, gain: 0.16, partials: [1] });
    return s;
  },
};

export function buildAudio() {
  const out = [];
  for (const [name, make] of Object.entries(SOUNDS)) {
    const file = join("audio", "ui", name);
    const full = join(ART_ROOT, file);
    mkdirSync(dirname(full), { recursive: true });
    const bytes = wav(make());
    writeFileSync(full, bytes);
    out.push({ file: `art/audio/ui/${name}`, bytes: bytes.length, kind: "audio" });
  }
  return out;
}

export const SOUND_KEYS = Object.keys(SOUNDS).map((n) => n.replace(".wav", ""));
