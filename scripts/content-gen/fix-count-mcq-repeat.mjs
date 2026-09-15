// Đợt 4 — dot-4: `emath-count20-0016` cho thấy prompt.image.repeat > 1 không được vẽ lại nhiều lần
// cho MCQ (chỉ COUNT_TAP mới đọc field này ở app). Chuyển 19 bài "how many" MCQ có repeat > 1
// trong gói này sang COUNT_TAP, đúng cơ chế render đã có sẵn — không sửa code app.
import { readFileSync, writeFileSync } from "node:fs";

const file = "content/exercises/emath/NBT.COUNT_TO_20.pack.json";
const data = JSON.parse(readFileSync(file, "utf8"));

let changed = 0;
for (const ex of data.exercises) {
  const img = ex.prompt?.image;
  if (ex.type !== "MCQ" || !img || !img.repeat || img.repeat <= 1) continue;

  const correct = ex.choices.find((c) => c.id === ex.answerKey);
  const n = Number(correct.text);
  if (!Number.isInteger(n) || n !== img.repeat) {
    throw new Error(`${ex.id}: correct choice "${correct.text}" != repeat ${img.repeat}`);
  }

  ex.type = "COUNT_TAP";
  ex.countTarget = {
    objects: {
      kind: img.kind,
      value: img.value,
      labelEn: img.labelEn,
      labelVi: img.labelVi,
      repeat: img.repeat,
    },
    correctCount: n,
    layout: "grid",
  };
  ex.answerKey = n;
  delete ex.prompt.image;
  delete ex.choices;
  changed++;
}

writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(`đổi ${changed} bài MCQ -> COUNT_TAP trong ${file}`);
