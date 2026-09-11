"use client";

import { Camera, Hand, Lightbulb, Mic } from "lucide-react";
import { useState } from "react";
import { SpeakButton } from "@/components/kid/speak-button";
import { cn } from "@/lib/utils";

/**
 * Renders an `ExerciseSpec` the way the child will see it (FR-ADM-05 "xem thử bài đúng như con
 * sẽ thấy", docs/08 pha 2 item 3). Used by /admin/content to review a batch and by /dev/kit.
 *
 * Deliberately dumb: it shows the six phase-3 types with the kid rules already applied — touch
 * targets >= 64px, text >= 22px, everything readable aloud, no red, never the word "sai".
 * The animated versions with the world background and the mascot arrive in phase 3 (docs/06 §1.8);
 * this is what the *content* looks like, which is what a reviewer needs to judge.
 */

export interface ImageRef {
  kind: "emoji" | "icon" | "asset" | "generated";
  value: string;
  labelVi?: string;
  labelEn?: string;
  /** Draw the picture this many times — a counting question needs it. */
  repeat?: number;
}

export interface PreviewSpec {
  type: string;
  language: "vi" | "en";
  subject?: string;
  difficulty?: number;
  scaffold?: "none" | "model" | "guided";
  prompt: { text: string; tts?: boolean; image?: ImageRef };
  choices?: { id: string; text?: string; image?: ImageRef; audio?: string }[];
  dragItems?: { id: string; text?: string; image?: ImageRef }[];
  dropZones?: { id: string; label?: string; image?: ImageRef; accepts: string[] }[];
  readTarget?: { text: string; words: string[] };
  /** Spoken only. NEVER render this — printing it hands the child the answer (docs/adr/ADR-14). */
  listenTarget?: { text: string; audioKey?: string };
  countTarget?: { objects: ImageRef; layout?: "grid" | "line" };
  traceTarget?: { glyph: string };
  story?: { sentences: { text: string; image?: ImageRef }[] };
  rubric?: { criteria: string[]; sampleAnswers?: string[] };
  hints: string[];
  explanation?: string;
  meta?: { estSeconds?: number; sourceRef?: string; lessonUnitCode?: string; theme?: string };
}

/** Placeholders are replaced per child at run time (docs/10 §7); show a sample so text reads. */
export function fillPlaceholders(text: string, nickname = "Thy", object = "ngôi sao"): string {
  return text
    .replaceAll("{ten}", nickname)
    .replaceAll("{vat}", object)
    .replaceAll("{ban}", "bạn Cú");
}

function Img({ image, size = "text-6xl" }: { image?: ImageRef; size?: string }) {
  if (!image) return null;
  if (image.kind === "emoji") {
    const times = image.repeat ?? 1;
    if (times === 1) return <span className={size}>{image.value}</span>;
    return (
      <span className={cn("flex max-w-md flex-wrap justify-center gap-2", size)}>
        {Array.from({ length: times }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: identical glyphs, position is the identity
          <span key={i}>{image.value}</span>
        ))}
      </span>
    );
  }
  return (
    <span className="rounded-2xl bg-white/70 px-3 py-2 text-lg font-bold text-slate-600">
      {image.labelVi ?? image.value}
    </span>
  );
}

function ChoiceButton({
  choice,
  selected,
  onSelect,
}: {
  choice: { id: string; text?: string; image?: ImageRef };
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-3xl border-4 bg-white px-5 py-4 text-2xl font-extrabold text-slate-700 shadow-md transition-transform active:scale-95",
        selected ? "border-sky-500 ring-4 ring-sky-200" : "border-transparent",
      )}
    >
      <Img image={choice.image} size="text-5xl" />
      {choice.text ? <span>{choice.text}</span> : null}
    </button>
  );
}

export function ExercisePreview({
  spec,
  nickname = "Thy",
  className,
}: {
  spec: PreviewSpec;
  nickname?: string;
  className?: string;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [hintIndex, setHintIndex] = useState(0);
  const lang = spec.language === "en" ? "en-US" : "vi-VN";
  const promptText = fillPlaceholders(spec.prompt.text, nickname);

  return (
    <div className={cn("kid-world rounded-3xl p-5 sm:p-7", className)}>
      {spec.scaffold === "model" ? (
        <p className="mb-4 flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-3 text-lg font-bold text-slate-600">
          <span className="text-3xl" aria-hidden>
            🦉
          </span>
          Bạn Cú làm mẫu một bài giống hệt trước, rồi con làm bài này.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-4 text-center">
        <Img image={spec.prompt.image} />
        <p className="max-w-2xl text-[26px] font-extrabold leading-snug text-slate-800">
          {promptText}
        </p>
        <SpeakButton text={promptText} lang={lang} label="Nghe" />
      </div>

      <div className="mt-6">
        {(spec.type === "MCQ" || spec.type === "MINI_STORY") && spec.choices ? (
          <div className="flex flex-wrap justify-center gap-3">
            {spec.choices.map((c) => (
              <ChoiceButton
                key={c.id}
                choice={c}
                selected={picked === c.id}
                onSelect={() => setPicked(c.id)}
              />
            ))}
          </div>
        ) : null}

        {spec.type === "LISTEN_CHOOSE" && spec.choices ? (
          <div className="flex flex-col items-center gap-4">
            {/* The spoken word is played, never printed. */}
            {spec.listenTarget ? (
              <SpeakButton
                text={spec.listenTarget.text}
                lang={lang}
                label="Nghe lại"
                className="bg-violet-500"
              />
            ) : null}
            <p className="text-lg font-bold text-slate-500">Nghe rồi chạm vào ô đúng</p>
            <div className="flex flex-wrap justify-center gap-3">
              {spec.choices.map((c) => (
                <ChoiceButton
                  key={c.id}
                  choice={c}
                  selected={picked === c.id}
                  onSelect={() => setPicked(c.id)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {spec.type === "DRAG_DROP" && spec.dragItems && spec.dropZones ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap justify-center gap-3">
              {spec.dragItems.map((item) => (
                <span
                  key={item.id}
                  className="flex min-h-16 min-w-16 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-2xl font-extrabold text-slate-700 shadow-md"
                >
                  <Hand className="h-5 w-5 text-slate-300" aria-hidden />
                  <Img image={item.image} size="text-4xl" />
                  {item.text}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {spec.dropZones.map((zone) => (
                <span
                  key={zone.id}
                  className="flex min-h-24 min-w-32 flex-col items-center justify-center rounded-3xl border-4 border-dashed border-white bg-white/50 px-6 text-xl font-extrabold text-slate-600"
                >
                  <Img image={zone.image} size="text-4xl" />
                  {zone.label}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {spec.type === "COUNT_TAP" && spec.countTarget ? (
          <div
            className={cn(
              "mx-auto flex max-w-lg flex-wrap justify-center gap-3 rounded-3xl bg-white/60 p-5",
              spec.countTarget.layout === "line" && "flex-nowrap overflow-x-auto",
            )}
          >
            {/* The count is server-side only, so the preview shows one object, not the answer. */}
            <Img image={{ ...spec.countTarget.objects, repeat: 1 }} />
            <p className="w-full text-center text-lg font-bold text-slate-500">
              Con chạm vào từng {spec.countTarget.objects.labelVi ?? "vật"} để đếm
            </p>
          </div>
        ) : null}

        {spec.type === "READ_ALOUD" && spec.readTarget ? (
          <div className="flex flex-col items-center gap-4">
            <p className="rounded-3xl bg-white/80 px-8 py-6 text-center text-4xl font-extrabold tracking-wide text-slate-800">
              {spec.readTarget.text}
            </p>
            <span className="flex min-h-16 items-center gap-2 rounded-full bg-rose-400 px-7 text-2xl font-bold text-white shadow-lg">
              <Mic className="h-7 w-7" aria-hidden /> Giữ để đọc
            </span>
          </div>
        ) : null}

        {spec.type === "WRITE_PHOTO" ? (
          <div className="flex flex-col items-center gap-3">
            <p className="rounded-3xl bg-white/80 px-6 py-4 text-center text-xl font-bold text-slate-600">
              Con làm ra giấy rồi nhờ ba mẹ chụp nhé!
            </p>
            <span className="flex min-h-16 items-center gap-2 rounded-full bg-amber-400 px-7 text-2xl font-bold text-white shadow-lg">
              <Camera className="h-7 w-7" aria-hidden /> Gọi ba mẹ chụp
            </span>
          </div>
        ) : null}

        {spec.type === "TRACE" && spec.traceTarget ? (
          <p className="mx-auto w-fit rounded-3xl bg-white/80 px-12 py-8 text-8xl font-black text-slate-300">
            {spec.traceTarget.glyph}
          </p>
        ) : null}

        {spec.type === "SPEAK_ANSWER" ? (
          <div className="flex flex-col items-center gap-3">
            <span className="flex min-h-16 items-center gap-2 rounded-full bg-rose-400 px-7 text-2xl font-bold text-white shadow-lg">
              <Mic className="h-7 w-7" aria-hidden /> Giữ để trả lời
            </span>
          </div>
        ) : null}

        {spec.story ? (
          <div className="mx-auto mt-5 flex max-w-xl flex-col gap-2 rounded-3xl bg-white/80 p-5 text-xl font-bold text-slate-700">
            {spec.story.sentences.map((s) => (
              <p key={s.text}>{fillPlaceholders(s.text, nickname)}</p>
            ))}
          </div>
        ) : null}
      </div>

      {spec.hints.length > 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setHintIndex((i) => Math.min(i + 1, spec.hints.length))}
            className="flex min-h-16 items-center gap-2 rounded-full bg-amber-300 px-6 text-xl font-extrabold text-amber-900 shadow-md transition-transform active:scale-95"
          >
            <Lightbulb className="h-6 w-6" aria-hidden />
            Gợi ý
          </button>
          {spec.hints.slice(0, hintIndex).map((hint) => (
            <p
              key={hint}
              className="max-w-xl rounded-2xl bg-white/90 px-5 py-3 text-center text-xl font-bold text-slate-700"
            >
              {fillPlaceholders(hint, nickname)}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
