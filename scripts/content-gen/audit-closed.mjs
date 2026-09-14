/**
 * "Mỗi bài đóng có đúng MỘT phương án đúng" — tự kiểm trước khi nạp (đề bài pha 6b §2).
 *
 * Validator Zod chỉ biết `answerKey` trỏ tới một ô có thật; nó không biết ô nhiễu có *cũng đúng*
 * không. Đợt 2 lọt 38 bài như vậy. Script này đọc câu lệnh, suy ra cái được hỏi, rồi đếm xem bao
 * nhiêu ô thoả mãn — dạng nào đếm được bằng máy thì đếm:
 *
 *  1. hai ô / hai thẻ cùng chữ;
 *  2. "Tiếng nào có âm/vần X?" — theo âm, không theo con chữ (`vn-units.mjs`);
 *  3. "Tiếng nào có dấu X?";
 *  4. phép tính "a + b = ?", "a - b = ?", "a và mấy được b?", "a plus b" — đúng một ô bằng kết quả;
 *  5. câu hỏi đếm có tranh lặp `repeat` lần — đúng một ô bằng số lần lặp;
 *  6. điền dấu "a ? b" — đúng một ô là dấu đúng;
 *  7. "Tiếng nào viết đúng?" — đúng một ô theo luật ng/ngh, g/gh, c/k;
 *  8. kéo-thả hai giỏ "có âm X / không có" — mỗi thẻ nằm đúng giỏ theo âm của nó.
 *
 * Dạng nghĩa (từ vựng, khoa học) máy không tự đếm được: ở đó bộ sinh bảo đảm bằng cấu trúc (ô
 * nhiễu lấy từ nhóm đối lập), và bộ 20 bài mẫu chấm tay.
 *
 *   node scripts/content-gen/audit-closed.mjs [--only=<regex đường dẫn gói>]
 */
import { readdirSync, readFileSync } from "node:fs";
import { bare, hasUnit, splitSyllable } from "./vn-units.mjs";

const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const only = onlyArg ? new RegExp(onlyArg.slice(7)) : null;

const EN = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const VI = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười"];
const TONE = { huyền: "̀", sắc: "́", hỏi: "̉", ngã: "̃", nặng: "̣" };
const label = (c) => c?.text ?? c?.image?.labelVi ?? c?.image?.labelEn ?? "";
const num = (s) => (/^\d+$/.test(String(s).trim()) ? Number(s) : null);

/** Luật chính tả âm đầu: ngh/gh/k chỉ trước e, ê, i (và y); ng/g/c không đứng trước chúng. */
function spelledRight(word) {
  const b = bare(word);
  const { onset, rime } = splitSyllable(word);
  const front = /^[eêiy]/.test(rime);
  if (onset === "ngh" || onset === "gh" || onset === "k") return front;
  if (onset === "ng" || onset === "c") return !front;
  if (onset === "g") return !front || b.startsWith("gi");
  return true;
}

const issues = [];
let checked = 0;
for (const sub of readdirSync("content/exercises")) {
  for (const f of readdirSync(`content/exercises/${sub}`)) {
    const path = `${sub}/${f}`;
    if (only && !only.test(path)) continue;
    const pack = JSON.parse(readFileSync(`content/exercises/${path}`, "utf8"));
    for (const ex of pack.exercises) {
      const bad = (msg) => issues.push(`${ex.id}  ${msg}  | "${ex.prompt.text}"`);
      const p = ex.prompt.text;
      const choices = ex.choices ?? [];
      const right = choices.find((c) => c.id === ex.answerKey);
      if (choices.length) checked++;

      // 1. ô trùng
      const texts = choices.map((c) => c.text ?? c.image?.value);
      if (new Set(texts).size !== texts.length) bad(`hai ô cùng nội dung: ${texts.join(" / ")}`);
      if (ex.dragItems && ex.type === "DRAG_DROP") {
        const zoneOf = (id) =>
          Object.entries(ex.answerKey ?? {}).find(([, items]) => items.includes(id))?.[0] ?? "khay";
        const seen = new Map();
        for (const d of ex.dragItems) {
          const k = d.text ?? d.image?.value;
          if (seen.has(k) && seen.get(k) !== zoneOf(d.id))
            bad(`hai thẻ "${k}" giống nhau nhưng khác giỏ`);
          seen.set(k, zoneOf(d.id));
        }
      }
      if (!choices.length && ex.type !== "DRAG_DROP") continue;

      // 2. có âm / vần X
      const unitM = /(?:âm|vần)\s+([a-zăâêôơưđ]{1,4})(?!\p{L})/iu.exec(p);
      if (unitM && /có|chứa|mang/.test(p) && ex.language === "vi") {
        const u = unitM[1].toLowerCase();
        if (choices.length) {
          const hits = choices.filter((c) => hasUnit(label(c), u));
          if (hits.length !== 1 || hits[0] !== right)
            bad(`${hits.length} ô có ${u}: ${hits.map(label).join(", ")}`);
        }
        if (ex.dropZones?.length === 2 && ex.dragItems) {
          const [yes, no] = ex.dropZones;
          const t = (id) => ex.dragItems.find((d) => d.id === id)?.text ?? "";
          const wrong = [
            ...(ex.answerKey[yes.id] ?? []).filter((id) => !hasUnit(t(id), u)),
            ...(ex.answerKey[no.id] ?? []).filter((id) => hasUnit(t(id), u)),
          ];
          if (wrong.length) bad(`thẻ nằm nhầm giỏ: ${wrong.map(t).join(", ")}`);
        }
      }

      // 3. có dấu X
      const toneM = /dấu (huyền|sắc|hỏi|ngã|nặng)/u.exec(p);
      if (toneM && /có|mang|đánh|đội/.test(p) && choices.length) {
        const mark = TONE[toneM[1]];
        const hits = choices.filter((c) => label(c).normalize("NFD").includes(mark));
        if (hits.length !== 1 || hits[0] !== right) bad(`${hits.length} ô có dấu ${toneM[1]}`);
      }

      // 4. phép tính
      let expect = null;
      const ar = /(\d+)\s*([+\-−])\s*(\d+)\s*=\s*\?/.exec(p);
      if (ar) expect = ar[2] === "+" ? +ar[1] + +ar[3] : +ar[1] - +ar[3];
      const vm = /(\d+)\s+và\s+mấy\s+(?:thì\s+)?được\s+(\d+)/u.exec(p);
      if (vm) expect = +vm[2] - +vm[1];
      const lt = ex.listenTarget?.text ?? "";
      const en = /^(\w+) (plus|minus) (\w+)$/.exec(lt);
      if (en && EN.includes(en[1]) && EN.includes(en[3]))
        expect =
          en[2] === "plus"
            ? EN.indexOf(en[1]) + EN.indexOf(en[3])
            : EN.indexOf(en[1]) - EN.indexOf(en[3]);
      if (expect != null && choices.length) {
        const hits = choices.filter((c) => num(c.text) === expect);
        if (hits.length !== 1 || hits[0] !== right)
          bad(`phép tính ra ${expect}, ${hits.length} ô khớp`);
      }

      // 5. câu hỏi đếm có tranh lặp
      const rep = ex.prompt.image?.repeat;
      // Chỉ khi đề không có số nào khác (bài lời văn "có 3 con, 2 bơi tới" có tranh 3 con nhưng hỏi tổng)
      // và mọi ô là chữ số (ô "five oranges" / "five orange" khác nhau ở số nhiều, không ở số đếm).
      if (
        rep &&
        rep > 1 &&
        !/[0-9]/.test(p) &&
        !p
          .toLowerCase()
          .split(/[^\p{L}]+/u)
          .some((w) => EN.slice(1).includes(w) || VI.slice(1).includes(w)) &&
        /mấy|bao nhiêu|how many|count/i.test(p) &&
        choices.every((c) => num(c.text) != null)
      ) {
        const val = (c) => {
          const t = label(c).toLowerCase();
          if (num(t) != null) return num(t);
          const w = t.split(" ")[0];
          return EN.includes(w) ? EN.indexOf(w) : VI.includes(w) ? VI.indexOf(w) : null;
        };
        const numeric = choices.filter((c) => val(c) != null);
        if (numeric.length === choices.length) {
          const hits = choices.filter((c) => val(c) === rep);
          if (hits.length !== 1 || hits[0] !== right)
            bad(`tranh vẽ ${rep}, ${hits.length} ô bằng ${rep}, đáp án là ${label(right)}`);
        }
      }

      // 6. điền dấu
      const sg = /(\d+)\s*\?\s*(\d+)\s*$/.exec(p);
      if (sg && choices.length && choices.every((c) => /^[<>=]$/.test(c.text ?? ""))) {
        const s = +sg[1] > +sg[2] ? ">" : +sg[1] < +sg[2] ? "<" : "=";
        if (right?.text !== s) bad(`dấu đúng là ${s}, đáp án là ${right?.text}`);
      }

      // 7. viết đúng chính tả
      if (/viết đúng/u.test(p) && ex.language === "vi" && choices.length) {
        const ok = choices.filter((c) => spelledRight(label(c)));
        // Chỉ phán khi luật âm đầu phân biệt được các ô (gói ng/ngh, g/gh, c/k); ô sai vì dấu thì bỏ qua.
        if (ok.length < choices.length && (ok.length !== 1 || ok[0] !== right))
          bad(`${ok.length} ô viết đúng luật: ${ok.map(label).join(", ")}`);
      }
    }
  }
}
for (const i of issues) console.log(i);
console.log(
  `\nđã soát ${checked} bài có ô lựa chọn · ${issues.length} bài không có đúng một đáp án`,
);
process.exitCode = issues.length ? 1 : 0;
