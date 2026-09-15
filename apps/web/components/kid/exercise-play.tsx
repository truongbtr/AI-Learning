"use client";

import type { AttemptFeedback, KidItem, KidSession } from "@mtct/db";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ExerciseRenderer } from "@/components/kid/exercise";
import { speechLang } from "@/components/kid/exercise/speech-lang";
import type { ClientSpec } from "@/components/kid/exercise/types";
import { type FeedbackKind, FeedbackOverlay, HintBubble } from "@/components/kid/feedback";
import { HomeworkStation } from "@/components/kid/homework-station";
import { ChoiceStation } from "@/components/kid/retention";
import { StarFlyToPocket } from "@/components/kid/stars";
import { OfflineNotice } from "@/components/kid/states";
import { THEME } from "@/components/kid/tokens";
import { useSpeak } from "@/components/kid/use-speak";

/**
 * One exercise of a session, wherever it is shown: a page of the quest road (K4), or the panel that
 * slides up over a city (Pha 10). What the child taps goes to the server, which is the only place
 * that knows the answer (ADR-14); what comes back is a yes, a hint, or — after the third try — the
 * answer read aloud. `onFinished` fires once the exercise is over (right, revealed, or homework done).
 *
 * Give it `key={item.order}` so every exercise starts fresh.
 */
export function ExercisePlay({
  session,
  item: initialItem,
  onFinished,
  onStars,
}: {
  session: KidSession;
  item: KidItem;
  onFinished: () => void;
  /** The pocket's new total after a star. */
  onStars?: (total: number) => void;
}) {
  const { speak } = useSpeak();
  const [item, setItem] = useState(initialItem);
  const [phase, setPhase] = useState<"choice" | "exercise">(
    initialItem.choice ? "choice" : "exercise",
  );
  const [choices, setChoices] = useState<KidItem[]>([]);
  const [feedback, setFeedback] = useState<FeedbackKind>(null);
  const [message, setMessage] = useState<string>("");
  const [explanation, setExplanation] = useState<string | undefined>();
  const [hint, setHint] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [tries, setTries] = useState(0);
  const [flying, setFlying] = useState<{ x: number; y: number } | null>(null);
  const [wrongItems, setWrongItems] = useState<string[] | undefined>();
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const mascot = session.theme === "garden" ? "cu" : "robot";

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

  const submit = async (raw: unknown) => {
    if (busy) return;
    setBusy(true);
    setOffline(false);
    const token = `${session.id}-${item.order}-${tries + 1}-${startedAt}`;
    try {
      const { response, origin } = await toAttemptResponse(raw, startedAt);
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
        onStars?.(data.starsTotal);
      } else if (data.stage === "reveal" || data.stage === "pending") {
        setFeedback("answer");
        setExplanation(revealText(data, item.spec as ClientSpec));
        if (data.stage === "pending") onStars?.(data.starsTotal);
      } else {
        setFeedback("almost");
        setWrongItems(data.wrongItems);
        if (data.hint) {
          setHint(data.hint);
          setHintsUsed((h) => h + 1);
          speak(data.hint, { lang: speechLang(data.hint, item.language) });
        }
      }
    } catch {
      setOffline(true);
    } finally {
      setBusy(false);
    }
  };

  if (offline) return <OfflineNotice retry={() => setOffline(false)} />;

  return (
    <>
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-4">
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

        {phase === "exercise" && item.homework ? (
          <HomeworkStation
            homework={item.homework}
            mascot={mascot}
            themeColor={THEME[session.theme].primary}
            onFinished={onFinished}
          />
        ) : null}

        {phase === "exercise" && !item.homework ? (
          <>
            <ExerciseRenderer
              spec={item.spec as ClientSpec}
              vars={session.vars}
              mascot={mascot}
              disabled={busy || feedback !== null}
              feedback={feedback ? { kind: feedback, tries, wrongItems } : undefined}
              onHint={() => {
                const spec = item.spec as ClientSpec;
                const next = spec.hints[Math.min(hintsUsed, spec.hints.length - 1)];
                if (!next) return;
                setHint(next);
                setHintsUsed((h) => Math.min(h + 1, spec.hints.length));
                speak(next, { lang: speechLang(next, item.language) });
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

      {/* the overlay and the flying star cover the whole screen: portalled, so a panel that slides
          (a transformed parent) cannot trap or clip them */}
      <BodyPortal>
        {flying ? <StarFlyToPocket from={flying} onArrive={() => setFlying(null)} /> : null}

        <FeedbackOverlay
          kind={feedback}
          message={message}
          explanation={explanation}
          mascot={mascot}
          onDone={() => {
            const wasFinal = feedback === "correct" || feedback === "answer";
            setFeedback(null);
            setHint(null);
            if (wasFinal) onFinished();
          }}
        />
      </BodyPortal>
    </>
  );
}

function BodyPortal({ children }: { children: React.ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => setHost(document.body), []);
  return host ? createPortal(children, host) : null;
}

/**
 * The exercise components speak in their own shapes (a tapped card, a tray of dropped cards, what
 * the microphone heard); the API takes one shape (`AttemptResponse`). Translating here keeps both
 * sides honest — and keeps the point on the screen where the star should fly from.
 */
async function toAttemptResponse(
  raw: unknown,
  startedAt: number,
): Promise<{ response: Record<string, unknown>; origin?: { x: number; y: number } }> {
  const r = (raw ?? {}) as Record<string, unknown>;
  const origin = r.at as { x: number; y: number } | undefined;
  const seconds = Math.round((Date.now() - startedAt) / 1000);

  if (typeof r.choiceId === "string") return { response: { choiceId: r.choiceId }, origin };
  if (r.placement) return { response: { placements: r.placement as object }, origin };
  if (typeof r.count === "number") return { response: { count: r.count }, origin };
  if (r.parentConfirmed) return { response: { parentVerdict: "good" }, origin };
  if (typeof r.transcript === "string") {
    return { response: { heard: r.transcript, seconds }, origin };
  }
  if (r.photo instanceof File) {
    const form = new FormData();
    form.append("file", r.photo);
    const res = await fetch("/api/kid/photo", { method: "POST", body: form });
    if (res.ok) {
      const { photoKey } = (await res.json()) as { photoKey: string };
      return { response: { photoKey }, origin };
    }
    return { response: { skipped: true }, origin };
  }
  return { response: { skipped: true }, origin };
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
