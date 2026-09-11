"use client";

import type { AttemptFeedback, KidItem, KidSession } from "@mtct/db";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ExerciseRenderer } from "@/components/kid/exercise";
import type { ClientSpec } from "@/components/kid/exercise/types";
import { type FeedbackKind, FeedbackOverlay, HintBubble } from "@/components/kid/feedback";
import { CarryOnPrompt, ChoiceStation, MovementBreak } from "@/components/kid/retention";
import { StarFlyToPocket, StarPocket } from "@/components/kid/stars";
import { OfflineNotice, SceneTransition } from "@/components/kid/states";
import { SUBJECT_LABEL } from "@/components/kid/tokens";
import { useSpeak } from "@/components/kid/use-speak";
import { WorldBackground } from "@/components/kid/world-background";

/**
 * K4 — one station of the quest (docs/06 §1.2, §1.3).
 *
 * The exercise is drawn on the world, not on a blank page. What the child taps goes to the server,
 * which is the only place that knows the answer (ADR-14); what comes back is a yes, a hint, or —
 * after the third try — the answer read aloud. Two things interrupt on purpose: a thirty-second
 * movement break in the middle, and the question "carry on or stop?" after eight exercises
 * (docs/06 §1.8b items 3 and 4).
 */

type Phase = "choice" | "exercise" | "break" | "carry-on";

const MOVEMENT_BREAK_AFTER = 6;
const CARRY_ON_AFTER = 8;

export function StationClient({
  session,
  item: initialItem,
  index,
}: {
  session: KidSession;
  item: KidItem;
  index: number;
}) {
  const router = useRouter();
  const { speak } = useSpeak();
  const [item, setItem] = useState(initialItem);
  const [phase, setPhase] = useState<Phase>(initialItem.choice ? "choice" : "exercise");
  const [choices, setChoices] = useState<KidItem[]>([]);
  const [feedback, setFeedback] = useState<FeedbackKind>(null);
  const [message, setMessage] = useState<string>("");
  const [explanation, setExplanation] = useState<string | undefined>();
  const [hint, setHint] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [tries, setTries] = useState(0);
  const [stars, setStars] = useState(session.starsTotal);
  const [flying, setFlying] = useState<{ x: number; y: number } | null>(null);
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [startedAt] = useState(() => Date.now());

  const answered = session.attempts.filter((a) => a.done).length;
  const mascot = session.theme === "garden" ? "cu" : "robot";

  // The station the child goes to next; null when the road is finished.
  const nextOrder =
    session.items.find(
      (i) => i.order > item.order && !session.attempts.some((a) => a.order === i.order && a.done),
    )?.order ?? null;

  const goOn = useCallback(() => {
    if (answered + 1 >= CARRY_ON_AFTER && nextOrder !== null) return setPhase("carry-on");
    if (answered + 1 === MOVEMENT_BREAK_AFTER && nextOrder !== null) return setPhase("break");
    if (nextOrder === null) router.push("/kid/quest/done");
    else router.push(`/kid/quest/${nextOrder}`);
  }, [answered, nextOrder, router]);

  useEffect(() => {
    if (phase !== "choice") return;
    fetch(`/api/sessions/${session.id}/choice?order=${item.order}`)
      .then((r) => r.json())
      .then((d: { items: KidItem[] }) => {
        if (d.items?.length > 1) setChoices(d.items);
        else setPhase("exercise");
      })
      .catch(() => setPhase("exercise"));
  }, [phase, session.id, item.order]);

  const submit = async (response: unknown, origin?: { x: number; y: number }) => {
    if (busy) return;
    setBusy(true);
    setOffline(false);
    const token = `${session.id}-${item.order}-${tries + 1}-${startedAt}`;
    try {
      const res = await fetch(`/api/sessions/${session.id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: item.order,
          response,
          hintsUsed,
          timeMs: Date.now() - startedAt,
          token,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as AttemptFeedback;
      setTries(data.tries);
      setMessage(data.line);

      if (data.stage === "correct") {
        setFeedback("correct");
        setFlying(origin ?? { x: window.innerWidth / 2, y: window.innerHeight * 0.6 });
        setStars(data.starsTotal);
      } else if (data.stage === "reveal" || data.stage === "pending") {
        setFeedback("answer");
        setExplanation(revealText(data, item.spec as ClientSpec));
        if (data.stage === "pending") setStars(data.starsTotal);
      } else {
        setFeedback("almost");
        if (data.hint) {
          setHint(data.hint);
          setHintsUsed((h) => h + 1);
          speak(data.hint, { lang: item.language });
        }
      }
    } catch {
      setOffline(true);
    } finally {
      setBusy(false);
    }
  };

  if (offline) {
    return (
      <WorldBackground theme={session.theme} subject={item.subject}>
        <main className="flex min-h-dvh items-center justify-center p-6">
          <OfflineNotice retry={() => setOffline(false)} />
        </main>
      </WorldBackground>
    );
  }

  return (
    <WorldBackground theme={session.theme} subject={item.subject}>
      <SceneTransition sceneKey={`station-${item.order}-${phase}`} direction="right">
        <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-4 px-4 py-4">
          <header className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/kid/quest")}
              className="flex min-h-[64px] items-center gap-2 rounded-[28px] bg-white/90 px-5 font-extrabold text-[20px] text-[#6B6B7B]"
            >
              🗺️ Bản đồ
            </button>
            <div className="rounded-full bg-white/90 px-5 py-2 font-extrabold text-[20px]">
              Trạm {index + 1}/{session.items.length} ·{" "}
              {SUBJECT_LABEL[item.subject] ?? item.subject}
            </div>
            <StarPocket count={stars} />
          </header>

          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            {phase === "choice" && choices.length > 1 ? (
              <ChoiceStation
                options={choices.map((_choice, i) => ({
                  order: i,
                  label: i === 0 ? "Bài này" : "Bài kia",
                  icon: i === 0 ? "🎈" : "🎁",
                }))}
                onPick={async (pick) => {
                  const chosen = choices[pick];
                  if (!chosen) return setPhase("exercise");
                  await fetch(`/api/sessions/${session.id}/choice`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ order: item.order, exerciseId: chosen.exerciseId }),
                  }).catch(() => {});
                  setItem(chosen);
                  setPhase("exercise");
                }}
              />
            ) : null}

            {phase === "break" ? (
              <MovementBreak
                mascot={mascot}
                canSkip={answered > MOVEMENT_BREAK_AFTER}
                onDone={async (completed) => {
                  if (completed) {
                    await fetch("/api/kid/break", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        studentId: session.studentId,
                        sessionId: session.id,
                      }),
                    }).catch(() => {});
                  }
                  if (nextOrder === null) router.push("/kid/quest/done");
                  else router.push(`/kid/quest/${nextOrder}`);
                }}
              />
            ) : null}

            {phase === "carry-on" ? (
              <CarryOnPrompt
                mascot={mascot}
                onCarryOn={() => {
                  if (nextOrder === null) router.push("/kid/quest/done");
                  else router.push(`/kid/quest/${nextOrder}`);
                }}
                onStop={() => router.push("/kid/quest/done")}
              />
            ) : null}

            {phase === "exercise" ? (
              <>
                <ExerciseRenderer
                  spec={item.spec as ClientSpec}
                  vars={session.vars}
                  mascot={mascot}
                  disabled={busy || feedback !== null}
                  feedback={
                    feedback
                      ? { kind: feedback, tries, reveal: explanation ? undefined : undefined }
                      : undefined
                  }
                  onHint={() => {
                    const spec = item.spec as ClientSpec;
                    const next = spec.hints[Math.min(hintsUsed, spec.hints.length - 1)];
                    if (!next) return;
                    setHint(next);
                    setHintsUsed((h) => Math.min(h + 1, spec.hints.length));
                    speak(next, { lang: item.language });
                  }}
                  onSubmit={(response) => void submit(response)}
                />
                <AnimatePresence>
                  {hint && !feedback ? (
                    <motion.div exit={{ opacity: 0 }}>
                      <HintBubble hint={hint} mascot={mascot} />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </>
            ) : null}
          </div>
        </main>
      </SceneTransition>

      {flying ? (
        <StarFlyToPocket
          from={flying}
          onArrive={() => {
            setFlying(null);
          }}
        />
      ) : null}

      <FeedbackOverlay
        kind={feedback}
        message={message}
        explanation={explanation}
        mascot={mascot}
        onDone={() => {
          const wasFinal = feedback === "correct" || feedback === "answer";
          setFeedback(null);
          setHint(null);
          if (wasFinal) goOn();
        }}
      />
    </WorldBackground>
  );
}

/** What to show when the answer is revealed: the answer itself, in the child's own words. */
function revealText(feedback: AttemptFeedback, spec: ClientSpec): string {
  const explanation = feedback.reveal?.explanation ?? "";
  const value = feedback.reveal?.value;
  if (typeof value === "string" && spec.choices) {
    const choice = spec.choices.find((c) => c.id === value);
    const label = choice?.text ?? choice?.image?.labelVi ?? "";
    return label ? `Đáp án là ${label}. ${explanation}`.trim() : explanation;
  }
  if (typeof value === "number") return `Đáp án là ${value}. ${explanation}`.trim();
  return explanation;
}
