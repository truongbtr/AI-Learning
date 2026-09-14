/**
 * Đợt 3: khai vào bản đồ kỹ năng đúng những dạng bài và mức khó mà gói bài của kỹ năng đó dùng.
 *
 * Đợt 2 ghi tay từng kỹ năng trong `patch-skill-map.mjs`; với 129 kỹ năng thì ghi tay là chỗ sinh
 * lỗi. Script này đọc gói bài và chỉ **thêm** dạng còn thiếu (không bỏ dạng nào đã khai, trừ
 * `COUNT_TAP` — xem `patch-skill-map.mjs`), đặt biên độ khó bằng mức thấp–cao thật của gói.
 *
 *   node scripts/content-gen/align-skill-map.mjs CODE [CODE…]
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const codes = new Set(process.argv.slice(2));
if (codes.size === 0) throw new Error("cần danh sách mã kỹ năng");

const packs = new Map();
for (const d of readdirSync("content/exercises"))
  for (const f of readdirSync(`content/exercises/${d}`)) {
    const p = JSON.parse(readFileSync(`content/exercises/${d}/${f}`, "utf8"));
    if (codes.has(p.skillCode)) packs.set(p.skillCode, p);
  }

let touched = 0;
for (const name of ["emath", "enl", "esci", "esl", "viet", "vmath"]) {
  const file = `content/skill-map/${name}.json`;
  const map = JSON.parse(readFileSync(file, "utf8"));
  let changed = false;
  for (const skill of map.skills) {
    const pack = packs.get(skill.code);
    if (!pack) continue;
    const used = [...new Set(pack.exercises.map((e) => e.type))];
    const before = JSON.stringify([skill.exerciseTypes, skill.difficultyRange]);
    for (const t of used) if (!skill.exerciseTypes.includes(t)) skill.exerciseTypes.push(t);
    const ds = pack.exercises.map((e) => e.difficulty);
    skill.difficultyRange = [Math.min(...ds), Math.max(...ds)];
    if (JSON.stringify([skill.exerciseTypes, skill.difficultyRange]) !== before) {
      changed = true;
      touched++;
    }
  }
  if (changed) writeFileSync(file, `${JSON.stringify(map, null, 2)}\n`, "utf8");
}
const missing = [...codes].filter((c) => !packs.has(c));
console.log(
  `skill map: ${touched} kỹ năng khai lại theo gói bài${missing.length ? ` · chưa có gói: ${missing.join(", ")}` : ""}`,
);
