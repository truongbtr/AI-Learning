/**
 * Nghỉ hưu 14 bài COUNT_TAP nằm nhầm chỗ trong các gói học vần (rubric 1 — "đúng kỹ năng").
 *
 * **Vì sao:** `exercise-health.csv` ngày 12/09 có đúng một bài cả hai bé làm sai —
 * `viet-bd-0049`, "Có bao nhiêu dế? Chạm để đếm", 5 con dế, 3 lần thử, 66 giây, vẫn chưa ra.
 * Bài đó nằm trong gói **phân biệt b và d**. Đếm dế không đo được b/d chút nào: con đếm hụt thì
 * hệ thống lại ghi "yếu b/d" và hạ mastery của một kỹ năng con không hề mắc lỗi.
 *
 * Rà lại thì cả 14 bài COUNT_TAP trong `content/exercises/viet/` đều cùng kiểu "chạm từng con vật
 * để đếm" — đó là kỹ năng `VMATH.SO.DEM_VAT`, không phải học vần. `ExerciseSpec.countTarget` chỉ
 * vẽ **một** loại vật lặp lại, nên dạng bài này về bản chất không phân biệt được chữ hay âm; sửa
 * câu lệnh cũng không cứu được. Nên nghỉ hưu, và bỏ COUNT_TAP khỏi bản đồ kỹ năng của các gói đó.
 *
 * Nghỉ hưu chứ không xoá: `content:import` giữ lại bản ghi và mọi `Evidence` con đã tạo vẫn trỏ
 * đúng chỗ (docs/10 §4.2).
 *
 *   node scripts/content-gen/retire-count-tap-phonics.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

/** Gói ngữ âm nào cũng vướng, cả tiếng Việt lẫn tiếng Anh. */
const TARGETS = [
  ...readdirSync("content/exercises/viet").map((f) => `content/exercises/viet/${f}`),
  "content/exercises/enl/RF.RHYME.pack.json",
  "content/exercises/enl/RF.SIGHT_WORDS_PREPRIMER.pack.json",
  "content/exercises/esl/PH.ALPHABET_SOUNDS.pack.json",
];
let removed = 0;
for (const path of TARGETS) {
  const pack = JSON.parse(readFileSync(path, "utf8"));
  const before = pack.exercises.length;
  pack.exercises = pack.exercises.filter((e) => e.type !== "COUNT_TAP");
  const gone = before - pack.exercises.length;
  if (gone === 0) continue;
  removed += gone;
  console.log(`${pack.skillCode.padEnd(30)} -${gone} COUNT_TAP → ${pack.exercises.length} bài`);
  writeFileSync(path, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
}
console.log(`\n${removed} bài COUNT_TAP rời khỏi các gói học vần`);
