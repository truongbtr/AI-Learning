/**
 * Soát lại bài luyện EDI-MN1 **độc lập với bộ sinh**: đọc file trong `content/exercises/emath/`,
 * tự tính lại đáp án từ đề và từ hình, rồi so với `answerKey`. Bộ sinh và bộ soát mà cùng sai một
 * kiểu thì test không bắt được, nên ở đây mọi thứ được tính lại từ đầu theo cách khác.
 *
 * Kiểm:
 *  1. phép tính trong đề ("What is 7 + 5?", "10 + 3", "13 − 5") khớp ô đáp án;
 *  2. hình trong đề khớp con số của đề: ten-frame (số chấm), thanh chục (tens × rodSize + ones,
 *     kể cả bẫy thanh 9 khối), tia số (điểm xuất phát + số bước nhảy), number bond (phần + phần =
 *     tổng), thẻ chấm (doubles), bảng số (ô ẩn nằm trong khoảng);
 *  3. COUNT_TAP: số hình vẽ đúng bằng số phải đếm;
 *  4. DRAG_DROP: giỏ ten-frame đủ ô cho chấm in sẵn + chấm phải kéo; khoá đáp án chỉ dùng thẻ có
 *     thật; thẻ nhiễu (mang mã lỗi) không nằm trong khoá;
 *  5. gợi ý không lộ đáp án; đáp án chỉ xuất hiện một lần trong các ô;
 *  6. `sourceRef` trỏ đúng khoảng trang của bài học trong `meta.lessonUnitCode`.
 *
 *   node scripts/content-gen/emath-mn1-qc.mjs
 */
import { readdirSync, readFileSync } from "node:fs";

const DIR = "content/exercises/emath";
const units = JSON.parse(readFileSync("content/lessons/emath/EDI-MN1.units.json", "utf8")).units;
const pagesOf = new Map(units.map((u) => [u.code, [u.pageFrom, u.pageTo]]));

const problems = [];
const flag = (ex, why) => problems.push(`${ex.id.padEnd(22)} ${why}`);
let checked = 0;

const EN = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};
const answerText = (ex) => ex.choices?.find((c) => c.id === ex.answerKey)?.text ?? null;
const answerNum = (ex) => {
  const t = answerText(ex);
  return t != null && /^\d+$/.test(t) ? Number(t) : null;
};
const modelOf = (ex) => (ex.prompt.image?.kind === "model" ? ex.prompt.image.model : null);
const dotsIn = (m) => (m.dots ?? []).reduce((n, d) => n + d.count, 0);
/** Số lượng của một mô hình chục–đơn vị, đếm đúng số khối thật (thanh 9 khối chỉ là 9). */
const valueOfTensOnes = (m) => m.tens * (m.rodSize ?? 10) + m.ones;

for (const file of readdirSync(DIR)) {
  const pack = JSON.parse(readFileSync(`${DIR}/${file}`, "utf8"));
  for (const ex of pack.exercises) {
    if (!ex.meta.sourceRef.startsWith("EDI-MN1")) continue;
    checked++;
    const q = ex.prompt.text;
    const model = modelOf(ex);
    const got = answerNum(ex);

    // 1. phép tính viết thẳng trong đề
    const add = /(\d+)\s*\+\s*(\d+)\s*(?:=\s*\?|\?)?/.exec(q);
    const sub = /(\d+)\s*−\s*(\d+)/.exec(q);
    if (/^What is \d+ \+ \d+\?$/.test(q) && add && got !== null) {
      const want = Number(add[1]) + Number(add[2]);
      if (got !== want) flag(ex, `"${q}" → đáp án ${got}, phải là ${want}`);
    }
    if (sub && got !== null && /difference|What is/.test(q)) {
      const want = Number(sub[1]) - Number(sub[2]);
      if (got !== want) flag(ex, `"${q}" → đáp án ${got}, phải là ${want}`);
    }
    // "What is 10 + 3?" đã bắt ở trên; "10 + ? = 16" thì đáp án là hiệu
    const missing = /^(\d+) \+ \? = (\d+)$/.exec(q);
    if (missing && got !== null) {
      const want = Number(missing[2]) - Number(missing[1]);
      if (got !== want) flag(ex, `"${q}" → đáp án ${got}, phải là ${want}`);
    }

    // 2. hình khớp đề
    if (model?.kind === "tenFrame") {
      const total = dotsIn(model);
      if (total > model.frames * 10) flag(ex, `ten-frame ${total} chấm > ${model.frames * 10} ô`);
      if (/^How many dots/.test(q) && got !== null && got !== total)
        flag(ex, `đề hỏi số chấm: hình vẽ ${total}, đáp án ${got}`);
      if (add && /What is \d+ \+ \d+/.test(q)) {
        const [a, b] = [Number(add[1]), Number(add[2])];
        const shown = (model.dots ?? []).map((d) => d.count);
        if (shown.length === 2 && (shown[0] !== a || shown[1] !== b))
          flag(ex, `"${q}" nhưng ten-frame vẽ ${shown.join(" + ")}`);
        if (shown.length === 1 && shown[0] !== a && shown[0] !== a + b)
          flag(ex, `"${q}" nhưng ten-frame vẽ ${shown[0]} chấm`);
      }
      // "How many more to make 10?" — số chấm đã tô cộng đáp án phải bằng 10
      if (/make 10/.test(q) && got !== null && total + got !== 10)
        flag(ex, `"${q}": hình có ${total} chấm, đáp án ${got} → ${total + got} ≠ 10`);
    }
    if (
      model?.kind === "tensOnes" &&
      got !== null &&
      /What number is this|How many beads/.test(q)
    ) {
      const want = valueOfTensOnes(model);
      if (got !== want)
        flag(
          ex,
          `mô hình ${model.tens}×${model.rodSize ?? 10} + ${model.ones} = ${want}, đáp án ${got}`,
        );
    }
    if (model?.kind === "numberLine") {
      if (model.hops && got !== null && add) {
        const [a, b] = [Number(add[1]), Number(add[2])];
        if (model.hops.start !== a || model.hops.count !== b)
          flag(ex, `"${q}" nhưng tia số nhảy ${model.hops.count} bước từ ${model.hops.start}`);
        if (got !== model.hops.start + model.hops.count)
          flag(ex, `tia số dừng ở ${model.hops.start + model.hops.count}, đáp án ${got}`);
      }
      for (const n of [...(model.labels ?? []), ...(model.hidden ?? []), ...(model.marks ?? [])])
        if (n < model.from || n > model.to)
          flag(ex, `tia số: ${n} nằm ngoài ${model.from}–${model.to}`);
    }
    if (model?.kind === "numberBond") {
      const [x, y] = model.parts;
      if (model.whole != null && x != null && y != null && x + y !== model.whole)
        flag(ex, `number bond ${x} + ${y} ≠ ${model.whole}`);
      const split = /^Split (\d+) into (\d+) and (\d+)\. What is (\d+) \+ (\d+)\?$/.exec(q);
      if (split) {
        const [b, x2, y2, a2, b2] = split.slice(1).map(Number);
        if (b !== b2) flag(ex, `"${q}": tách ${b} nhưng phép cộng dùng ${b2}`);
        if (x2 + y2 !== b) flag(ex, `"${q}": ${x2} + ${y2} ≠ ${b}`);
        if (a2 + x2 !== 10) flag(ex, `"${q}": ${a2} + ${x2} = ${a2 + x2}, không tròn 10`);
        if (got !== a2 + b) flag(ex, `"${q}": đáp án ${got}, phải là ${a2 + b}`);
      }
    }
    if (model?.kind === "dotCards") {
      const want = model.cards.reduce((n, c) => n + c, 0);
      const fact = /^(\d+) \+ (\d+) = (\d+)$/.exec(answerText(ex) ?? "");
      if (fact) {
        const [a, b, sum] = fact.slice(1).map(Number);
        if (a + b !== sum) flag(ex, `ô đúng "${answerText(ex)}" tính sai`);
        if (model.cards.length === 2 && (a !== model.cards[0] || b !== model.cards[1]))
          flag(ex, `thẻ chấm ${model.cards.join(" | ")} nhưng đáp án "${answerText(ex)}"`);
      } else if (got !== null && /sum|How many/.test(q) && got !== want) {
        flag(ex, `thẻ chấm cộng lại ${want}, đáp án ${got}`);
      }
    }
    if (model?.kind === "numberChart")
      for (const n of [...(model.hidden ?? []), ...(model.marked ?? [])])
        if (n < model.from || n > model.to)
          flag(ex, `bảng số: ${n} ngoài ${model.from}–${model.to}`);

    // 3. đếm
    if (ex.type === "COUNT_TAP") {
      const drawn = ex.countTarget.objects.repeat;
      if (drawn !== ex.countTarget.correctCount)
        flag(ex, `vẽ ${drawn} hình nhưng phải đếm ra ${ex.countTarget.correctCount}`);
      if (ex.answerKey !== ex.countTarget.correctCount) flag(ex, "answerKey ≠ correctCount");
    }

    // 4. kéo thả
    if (ex.type === "DRAG_DROP") {
      const ids = new Set(ex.dragItems.map((i) => i.id));
      const key = ex.answerKey;
      const placed = new Set(Object.values(key).flat());
      for (const id of placed) if (!ids.has(id)) flag(ex, `khoá đáp án dùng thẻ lạ "${id}"`);
      // ADR-15: thẻ đúng được mang mã lỗi khi bài có nhiều giỏ (đặt nhầm giỏ là lỗi có tên);
      // bài một giỏ thì mã lỗi chỉ thuộc về thẻ nhiễu.
      for (const item of ex.dragItems)
        if (item.errorTag && placed.has(item.id) && ex.dropZones.length === 1)
          flag(ex, `thẻ "${item.id}" là thẻ đúng mà vẫn mang mã lỗi (bài chỉ có một giỏ)`);
      for (const zone of ex.dropZones) {
        const m = zone.image?.kind === "model" ? zone.image.model : null;
        if (m?.kind === "tenFrame") {
          const printed = dotsIn(m);
          const need = (key[zone.id] ?? []).length;
          if (printed + need > m.frames * 10)
            flag(
              ex,
              `giỏ ten-frame: ${printed} chấm in sẵn + ${need} chấm kéo > ${m.frames * 10} ô`,
            );
        }
        if ((key[zone.id] ?? []).length === 0)
          flag(ex, `giỏ "${zone.id}" không có thẻ nào trong khoá`);
      }
    }

    // 5. gợi ý không lộ đáp án, đáp án không trùng ô khác
    const ans = answerText(ex);
    if (ans && /^\d+$/.test(ans))
      for (const h of ex.hints)
        if (new RegExp(`(^|[^\\d])${ans}([^\\d]|$)`).test(h) && !/count|đếm|Start|Fill|10/i.test(h))
          flag(ex, `gợi ý "${h}" có sẵn đáp án ${ans}`);
    if (ex.choices) {
      const texts = ex.choices.map((c) => c.text).filter(Boolean);
      if (new Set(texts).size !== texts.length)
        flag(ex, `hai ô đáp án trùng chữ: ${texts.join(" / ")}`);
    }

    // 6. trang nguồn nằm trong khoảng trang của bài học
    const page = /tr\.(\d+)/.exec(ex.meta.sourceRef);
    const range = pagesOf.get(ex.meta.lessonUnitCode ?? "");
    if (page && range) {
      const p = Number(page[1]);
      if (p < range[0] - 1 || p > range[1] + 1)
        flag(
          ex,
          `sourceRef tr.${p} ngoài bài ${ex.meta.lessonUnitCode} (tr.${range[0]}–${range[1]})`,
        );
    }
  }
}

console.log(`đã soát ${checked} bài EDI-MN1`);
if (problems.length === 0) console.log("OK  không có chỗ nào lệch");
else {
  for (const p of problems) console.log(`!!  ${p}`);
  console.log(`${problems.length} chỗ cần xem`);
  process.exitCode = 1;
}
