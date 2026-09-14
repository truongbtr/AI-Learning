/**
 * Shared machinery for writing exercise packs (docs/10 §4.2).
 *
 * The pedagogy lives in the per-skill files next to this one: the words, the numbers, the wrong
 * answers and why a six-year-old picks them. This file only does the bookkeeping that is the same
 * for every pack — stable ids, rotating the instruction and hint wording so no child meets the
 * same sentence twelve times in an evening (docs/08 pha 3 việc 0), and writing the file.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/** Rotates through a list; `i` is the exercise index so neighbours never say the same thing. */
export const rotate = (list, i) => list[i % list.length];

/** A deterministic shuffle, so a rebuild does not churn the diff. */
export function seeded(seed) {
  let s = 0;
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** Places the answer at a different position each time — the answer is never "always b". */
export function choicesOf(correct, wrongsIn, slot) {
  // Hai ô cùng chữ là một câu hỏi hỏng (bấm ô nào cũng "đúng" mà máy chỉ nhận một): bỏ ô trùng.
  const key = (c) => c.text ?? c.image?.value;
  const wrongs = wrongsIn.filter(
    (w, i) => key(w) !== key(correct) && wrongsIn.findIndex((x) => key(x) === key(w)) === i,
  );
  const all = [correct, ...wrongs];
  const at = slot % all.length;
  const ordered = [...wrongs];
  ordered.splice(at, 0, correct);
  const ids = ["a", "b", "c", "d"];
  const out = ordered.map((c, i) => ({ id: ids[i], ...c }));
  return { choices: out, answerKey: ids[at] };
}

export function numberId(prefix, n) {
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

export function writePack(file, pack) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  const byType = {};
  const byDiff = {};
  for (const ex of pack.exercises) {
    byType[ex.type] = (byType[ex.type] ?? 0) + 1;
    byDiff[ex.difficulty] = (byDiff[ex.difficulty] ?? 0) + 1;
  }
  const models = pack.exercises.filter((e) => e.scaffold === "model").length;
  const targeted = pack.exercises.filter((e) => e.targetsError).length;
  console.log(
    `${pack.skillCode.padEnd(38)} ${String(pack.exercises.length).padStart(3)} · ` +
      `d${[1, 2, 3, 4, 5].map((d) => byDiff[d] ?? 0).join("/")} · model ${models} · targets ${targeted} · ` +
      Object.entries(byType)
        .map(([t, n]) => `${t}:${n}`)
        .join(" "),
  );
}

/** emoji picture, the v1 illustration (docs/04 §5). `repeat` is how many to draw. */
export const img = (value, labelVi, labelEn, repeat) => {
  const out = { kind: "emoji", value };
  if (labelVi) out.labelVi = labelVi;
  if (labelEn) out.labelEn = labelEn;
  if (repeat) out.repeat = repeat;
  return out;
};

/**
 * Fills in the parts every exercise needs but nobody wants to retype. Anything passed in wins.
 */
export function ex(base) {
  return {
    assetTheme: "neutral",
    targetsError: null,
    scaffold: "none",
    ...base,
    prompt: { tts: true, ...base.prompt },
  };
}

/**
 * Picks an instruction that does not happen to contain the spoken word. "Nghe rồi chọn ô đúng
 * nhé!" is a fine sentence until the word being read out *is* "ô" — then the instruction hands
 * the answer to a child who can already read (ADR-14, and the validator refuses it).
 */
export function listenPrompt(list, spoken, i) {
  const strip = (s) =>
    ` ${s
      .toLowerCase()
      .replace(/[.,!?:;"“”…]/g, " ")
      .replace(/\s+/g, " ")} `;
  const needle = strip(spoken).trim();
  const safe = list.filter((t) => !strip(t).includes(` ${needle} `));
  const pool = safe.length > 0 ? safe : list;
  return pool[i % pool.length];
}

/** Capitalises a sentence that starts with an interpolated label ("dấu huyền là ..."). */
export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/**
 * A pack being built: `add` fills id, language, skill and the meta every exercise shares; `save`
 * writes the file. Used by the đợt-3 generators so a pack is data plus a handful of `add` calls.
 */
export function mkPack({
  dir,
  code,
  subject,
  prefix,
  language,
  src,
  unit = null,
  lessonRefs = [],
  note,
}) {
  const list = [];
  let n = 0;
  return {
    list,
    add(e) {
      n += 1;
      list.push(
        ex({
          id: numberId(prefix, n),
          language,
          skillCodes: [code],
          ...e,
          meta: { estSeconds: 25, lessonUnitCode: unit, sourceRef: src, ...(e.meta ?? {}) },
        }),
      );
    },
    save() {
      writePack(`content/exercises/${dir}/${code.split(".").slice(1).join(".")}.pack.json`, {
        skillCode: code,
        subject,
        generatedBy: "claude-code",
        promptVersion: "exercise-gen-v3",
        lessonRefs,
        note,
        exercises: list,
      });
    },
  };
}

/** i-th item of a list, wrapping. */
export const at = (list, i) => list[((i % list.length) + list.length) % list.length];
