"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BigButton } from "./buttons";
import { MascotSays } from "./mascot";
import { playSound } from "./sound";
import { StarFlyToPocket } from "./stars";
import { COLOR, KID, SPRING } from "./tokens";
import { useSpeak } from "./use-speak";

/**
 * "Bài cô giao" — the station at the head of the road (FR-LRN-07, docs/11 §6.2).
 *
 * Two shapes, both of them things a child does with their mouth and their hands rather than by
 * tapping a right answer:
 *  - read the lesson N times: five big lamps that light up one by one, a star each time;
 *  - record a video for the teacher: the app saves the file for a parent to upload. It never
 *    sends anything to the school by itself.
 *
 * Nothing here is marked right or wrong. The child did what the teacher asked, or has not yet.
 */

export interface HomeworkStationData {
  id: string;
  taskType: string;
  text: string;
  repeatCount: number | null;
  progress: number;
  pages: number[];
  submitTo: string | null;
  optional: boolean;
  done: boolean;
}

export function HomeworkStation({
  homework,
  mascot,
  themeColor,
  onFinished,
}: {
  homework: HomeworkStationData;
  mascot: "robot" | "cu";
  themeColor: string;
  onFinished: () => void;
}) {
  const reduce = useReducedMotion();
  const { speak, state } = useSpeak();
  const target = homework.repeatCount ?? 1;
  const [progress, setProgress] = useState(homework.progress);
  const [busy, setBusy] = useState(false);
  const [flying, setFlying] = useState<{ x: number; y: number } | null>(null);
  const [recording, setRecording] = useState(false);
  const [saved, setSaved] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const roundsRef = useRef<HTMLUListElement>(null);

  const isVideo = homework.taskType === "VIDEO_SUBMIT";
  const line = isVideo
    ? "Cô muốn xem con đọc bài này. Mình quay một đoạn nhé!"
    : `Cô giao: ${homework.text}`;

  useEffect(() => {
    speak(line, { lang: "vi" });
  }, [line, speak]);

  const oneMoreRound = async () => {
    if (busy || progress >= target) return;
    setBusy(true);
    // The star sets off from the lamp that has just lit up.
    const lamp = roundsRef.current?.children[progress]?.getBoundingClientRect();
    setFlying(
      lamp
        ? { x: lamp.left + lamp.width / 2, y: lamp.top + lamp.height / 2 }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    );
    playSound("sao");
    try {
      const res = await fetch(`/api/homework/${homework.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "round", round: progress + 1 }),
      });
      const data = (await res.json()) as { progress?: number; done?: boolean };
      const now = data.progress ?? progress + 1;
      setProgress(now);
      if (data.done) {
        speak("Con đọc đủ số lần rồi, giỏi quá!", { lang: "vi" });
        setTimeout(onFinished, 1200);
      }
    } finally {
      setBusy(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => chunks.current.push(e.data);
      rec.onstop = async () => {
        for (const track of stream.getTracks()) track.stop();
        const blob = new Blob(chunks.current, { type: "video/webm" });
        const body = new FormData();
        body.append("video", blob, "bai-doc.webm");
        await fetch(`/api/homework/${homework.id}`, { method: "POST", body });
        setSaved(true);
        speak("Xong rồi! Ba mẹ sẽ gửi cho cô nhé.", { lang: "vi" });
      };
      rec.start();
      recorder.current = rec;
      setRecording(true);
    } catch {
      speak("Mình chưa mở được máy quay. Nhờ ba mẹ giúp nhé!", { lang: "vi" });
    }
  };

  const stopRecording = () => {
    recorder.current?.stop();
    setRecording(false);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="w-full max-w-3xl rounded-[32px] bg-white/90 px-8 py-6 text-center"
        style={{ minHeight: 120 }}
      >
        <p
          className="text-[20px] font-extrabold uppercase tracking-wide"
          style={{ color: themeColor }}
        >
          Bài cô giao
        </p>
        <p className="mt-2 text-[26px] font-bold leading-snug" style={{ color: COLOR.ink }}>
          {homework.text}
        </p>
        {homework.pages.length > 0 ? (
          <p className="mt-1 text-[22px]" style={{ color: COLOR.inkSoft }}>
            Trang {homework.pages.join(", ")}
          </p>
        ) : null}
      </div>

      {isVideo ? (
        <div className="flex flex-col items-center gap-4">
          {saved ? (
            <p className="text-[24px] font-bold" style={{ color: COLOR.correct }}>
              Đã quay xong! Ba mẹ sẽ gửi cho cô.
            </p>
          ) : null}
          <BigButton
            tone={recording ? "reward" : "primary"}
            color={recording ? undefined : themeColor}
            onClick={recording ? stopRecording : startRecording}
            data-testid="homework-record"
          >
            {recording ? "⏹️ Xong rồi!" : "🎥 Quay cho cô"}
          </BigButton>
          <BigButton tone="quiet" onClick={onFinished}>
            {saved ? "▶️ Đi tiếp" : "Để sau nhé"}
          </BigButton>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5">
          <ul
            ref={roundsRef}
            className="flex flex-wrap justify-center gap-3"
            data-testid="homework-rounds"
          >
            {Array.from({ length: target }, (_, i) => `${homework.id}-round-${i + 1}`).map(
              (roundKey, i) => (
                <motion.li
                  key={roundKey}
                  animate={reduce ? undefined : { scale: i < progress ? 1 : 0.92 }}
                  transition={SPRING.pop}
                  className="flex items-center justify-center rounded-full font-extrabold"
                  style={{
                    width: KID.tapMin,
                    height: KID.tapMin,
                    background: i < progress ? COLOR.reward : "rgba(255,255,255,0.85)",
                    color: COLOR.ink,
                    fontSize: 26,
                  }}
                >
                  {i < progress ? "★" : i + 1}
                </motion.li>
              ),
            )}
          </ul>
          <p className="text-[24px] font-bold" style={{ color: COLOR.ink }}>
            {progress}/{target} lần
          </p>
          {progress < target ? (
            <BigButton
              color={themeColor}
              onClick={oneMoreRound}
              disabled={busy}
              data-testid="homework-round"
            >
              📖 Con đọc xong một lần
            </BigButton>
          ) : (
            <BigButton tone="correct" onClick={onFinished} data-testid="homework-next">
              ▶️ Đi tiếp
            </BigButton>
          )}
          <BigButton tone="quiet" onClick={onFinished}>
            Để sau nhé
          </BigButton>
        </div>
      )}

      <MascotSays
        name={mascot}
        state={progress >= target || saved ? "cheer" : "encourage"}
        size={150}
        speaking={state === "speaking"}
        text={line}
      />
      {flying ? <StarFlyToPocket from={flying} onArrive={() => setFlying(null)} /> : null}
    </div>
  );
}
