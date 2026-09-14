/**
 * Kiểm "một câu hỏi, một đáp án" cho dạng *"Tiếng nào có âm X?"* (rubric 4).
 *
 * Câu hỏi đó chỉ có một đáp án khi **mọi ô sai đều không chứa âm X**. Ô nhiễu "gần giống" rất dễ
 * phá luật này: trong gói âm h, `hò` là tiếng nhìn giống `hồ` nhất — và cũng có âm h. Validator
 * không thể biết câu lệnh hỏi âm nào, nên script này đọc câu lệnh, rút âm/vần được hỏi, rồi đếm
 * bao nhiêu ô chứa nó. Dạng kéo-thả "có / không có" cũng được soát theo đúng giỏ của đáp án.
 *
 *   node scripts/content-gen/audit-has-letter.mjs          # in bài lỗi, thoát 1 nếu có
 */
import { readdirSync, readFileSync } from "node:fs";
import { hasUnit } from "./vn-units.mjs";

/** Rút âm/vần mà câu lệnh hỏi: "có âm h", "có vần ia", "mang âm gi". */
function askedUnit(prompt) {
  // `\b` của JS chỉ hiểu chữ ASCII, nên "âm ô?" phải chặn đuôi bằng lookahead Unicode.
  const m = /(?:âm|vần)\s+([a-zăâêôơưđ]{1,4})(?!\p{L})/iu.exec(prompt);
  return m ? m[1].toLowerCase() : null;
}

const issues = [];
for (const sub of readdirSync("content/exercises")) {
  for (const f of readdirSync(`content/exercises/${sub}`)) {
    const pack = JSON.parse(readFileSync(`content/exercises/${sub}/${f}`, "utf8"));
    for (const ex of pack.exercises) {
      if (ex.language !== "vi") continue;
      const unit = askedUnit(ex.prompt.text);
      if (!unit || !/có|chứa|mang/.test(ex.prompt.text)) continue;
      if (ex.type === "MCQ" && ex.choices) {
        const label = (c) => c.text ?? c.image?.labelVi ?? "";
        const hits = ex.choices.filter((c) => hasUnit(label(c), unit)).map(label);
        const right = label(ex.choices.find((c) => c.id === ex.answerKey) ?? {});
        if (hits.length !== 1 || hits[0] !== right)
          issues.push(
            `${ex.id}  "${ex.prompt.text}"  → ${hits.length} ô chứa ${unit}: ${hits.join(", ")}`,
          );
      }
      if (ex.type === "DRAG_DROP" && ex.dropZones?.length === 2) {
        const [yes, no] = ex.dropZones;
        const text = (id) => ex.dragItems.find((d) => d.id === id)?.text ?? "";
        const bad = [
          ...(ex.answerKey[yes.id] ?? []).filter((id) => !hasUnit(text(id), unit)),
          ...(ex.answerKey[no.id] ?? []).filter((id) => hasUnit(text(id), unit)),
        ].map(text);
        if (bad.length)
          issues.push(`${ex.id}  "${ex.prompt.text}"  → xếp nhầm giỏ: ${bad.join(", ")}`);
      }
    }
  }
}
for (const i of issues) console.log(i);
console.log(`\n${issues.length} bài "có âm X" không có đúng một đáp án`);
process.exitCode = issues.length ? 1 : 0;
