"use client";

import { useState } from "react";
import { ExercisePreview, type PreviewSpec } from "@/components/kid/exercise-preview";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const SAMPLES: Record<string, PreviewSpec> = {
  MCQ: {
    type: "MCQ",
    language: "vi",
    subject: "VMATH",
    skillCodes: [],
    difficulty: 2,
    prompt: { text: "{ten} có 3 {vat} và 2 {vat} nữa. Tất cả mấy {vat}?", tts: true },
    choices: [
      { id: "a", text: "4" },
      { id: "b", text: "5" },
      { id: "c", text: "1" },
    ],
    scaffold: "none",
    hints: ["Đếm tiếp từ 3: bốn, năm.", "Gộp 3 và 2 lại xem được mấy?"],
    explanation: "3 cộng 2 bằng 5.",
    meta: { estSeconds: 25, sourceRef: "SGK Toán 1 tập một tr.41" },
  },
  LISTEN_CHOOSE: {
    type: "LISTEN_CHOOSE",
    language: "vi",
    subject: "VIET",
    skillCodes: [],
    difficulty: 2,
    prompt: { text: "Nghe rồi chọn chữ đúng: bà", tts: true },
    choices: [
      { id: "a", text: "b", image: { kind: "emoji", value: "🅱️" } },
      { id: "b", text: "d", image: { kind: "emoji", value: "🇩" } },
    ],
    scaffold: "model",
    hints: ["Chữ b có bụng quay sang phải."],
    explanation: "Chữ b có bụng quay sang phải, như trong tiếng bà.",
    meta: { estSeconds: 20, sourceRef: "SGK Tiếng Việt 1 tập một tr.16" },
  },
  COUNT_TAP: {
    type: "COUNT_TAP",
    language: "vi",
    subject: "VMATH",
    skillCodes: [],
    difficulty: 1,
    prompt: { text: "Có mấy quả táo?", tts: true },
    countTarget: {
      objects: { kind: "emoji", value: "🍎", labelVi: "quả táo", labelEn: "apple" },
      layout: "grid",
    },
    scaffold: "none",
    hints: ["Chạm vào từng quả rồi đếm một, hai, ba."],
    explanation: "Đếm từng quả một lần thôi nhé.",
    meta: { estSeconds: 20, sourceRef: "SGK Toán 1 tập một tr.8" },
  },
  READ_ALOUD: {
    type: "READ_ALOUD",
    language: "vi",
    subject: "VIET",
    skillCodes: [],
    difficulty: 2,
    prompt: { text: "Con đọc to hai tiếng này nhé!", tts: true },
    readTarget: { text: "bà · bé", words: ["bà", "bé"] },
    scaffold: "none",
    hints: ["Đọc chậm từng tiếng."],
    explanation: "Con đọc rõ từng tiếng là được rồi.",
    meta: { estSeconds: 30, sourceRef: "SGK Tiếng Việt 1 tập một tr.16" },
  },
  DRAG_DROP: {
    type: "DRAG_DROP",
    language: "vi",
    subject: "VMATH",
    skillCodes: [],
    difficulty: 3,
    prompt: { text: "Kéo hai số vào ô cho đủ 5.", tts: true },
    dragItems: [
      { id: "i1", text: "3" },
      { id: "i2", text: "2" },
    ],
    dropZones: [{ id: "z1", label: "5", expect: 2 }],
    scaffold: "none",
    hints: ["3 và mấy thì được 5?"],
    explanation: "3 và 2 gộp lại được 5.",
    meta: { estSeconds: 35, sourceRef: "SGK Toán 1 tập một tr.32" },
  },
  WRITE_PHOTO: {
    type: "WRITE_PHOTO",
    language: "vi",
    subject: "VIET",
    skillCodes: [],
    difficulty: 3,
    prompt: { text: "Con viết chữ u vào vở rồi nhờ ba mẹ chụp nhé.", tts: true },
    rubric: { criteria: ["Viết đúng nét", "Đúng độ cao"], sampleAnswers: ["u"] },
    scaffold: "none",
    hints: ["Viết nét móc xuống rồi nét móc lên."],
    explanation: "Chữ u có hai nét móc và một nét sổ.",
    meta: { estSeconds: 60, sourceRef: "SGK Tiếng Việt 1 tập một tr.38" },
  },
};

/** Paste-any-spec renderer (docs/08 pha 2 item 3). */
export function DevKit() {
  const [text, setText] = useState(JSON.stringify(SAMPLES.MCQ, null, 2));
  const [spec, setSpec] = useState<PreviewSpec | null>(SAMPLES.MCQ ?? null);
  const [error, setError] = useState<string | null>(null);

  function render(value: string) {
    setText(value);
    try {
      const parsed = JSON.parse(value) as PreviewSpec;
      if (!parsed.type || !parsed.prompt?.text) throw new Error("thiếu type hoặc prompt.text");
      setSpec({ ...parsed, hints: parsed.hints ?? [] });
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="flex flex-col gap-3">
        <div>
          <CardTitle>ExerciseSpec</CardTitle>
          <CardDescription>
            Dán JSON của một bài (trường <code>spec</code> trong DB, hoặc một mục trong
            <code> *.pack.json</code>).
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(SAMPLES).map((key) => (
            <Button
              key={key}
              size="sm"
              variant="outline"
              onClick={() => render(JSON.stringify(SAMPLES[key], null, 2))}
            >
              {key}
            </Button>
          ))}
        </div>
        <textarea
          aria-label="ExerciseSpec JSON"
          value={text}
          onChange={(e) => render(e.target.value)}
          spellCheck={false}
          className="thin-scrollbar h-[28rem] w-full rounded-control border border-ink-200 bg-white p-3 font-mono text-xs text-ink-800 focus:border-ink-400 focus:outline-none"
        />
        {error ? (
          <p className="rounded-control bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-3">
        <div>
          <CardTitle>Con sẽ thấy thế này</CardTitle>
          <CardDescription>
            Nút “Nghe” dùng mp3 đã sinh sẵn lúc nạp nội dung; không có thì rơi về giọng của máy.
          </CardDescription>
        </div>
        {spec ? (
          <ExercisePreview spec={spec} />
        ) : (
          <p className="py-10 text-center text-sm text-ink-400">JSON chưa hợp lệ.</p>
        )}
      </Card>
    </div>
  );
}
