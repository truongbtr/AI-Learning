/**
 * Sửa gói `EMATH.G.PATTERNS`: bài quy luật phải **vẽ dãy ra**, không tả bằng chữ tiếng Anh.
 *
 * Chủ dự án 18/09/2026 gửi ảnh màn hình bài "Red, blue, red, blue, … Drag what comes next.":
 * trên màn chỉ có dòng chữ và ba khoanh tròn màu, không thấy dãy mẫu đâu, nên nhìn vào tưởng phải
 * xếp đủ bốn khoanh. Con sáu tuổi lại càng không đọc được "red, blue" để hình dung dãy.
 *
 * Cách sửa: đặt `prompt.image` là chính dãy mẫu (chuỗi nhiều emoji — `Picture` vẽ từng hình cạnh
 * nhau), đổi đề thành câu ngắn không phụ thuộc vào việc đọc chữ, và đổi nhãn giỏ thành "?" để nó
 * chính là ô trống cuối dãy. Ba bài COUNT_TAP nhắc tới "pattern" mà chỉ vẽ một loại hình cũng được
 * sửa lời cho đúng thứ con nhìn thấy.
 *
 * Chạy lại được nhiều lần (khớp theo id, chỉ đặt giá trị).
 *
 *   node scripts/content-gen/fix-pattern-pictures.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "content/exercises/emath/G.PATTERNS.pack.json";
const pack = JSON.parse(readFileSync(FILE, "utf8"));
const byId = new Map(pack.exercises.map((e) => [e.id, e]));

/** Dãy mẫu vẽ trong đề, và câu hỏi thay cho câu tả bằng chữ. */
const STRIPS = {
  "emath-pattern-0021": {
    strip: "🔴🔵🔴🔵",
    label: "dãy màu",
    q: "What comes next? Drag it in.",
    hints: ["Point to each colour and say it out loud.", "Look at the two colours taking turns."],
  },
  "emath-pattern-0022": {
    strip: "⭐💛⭐💛",
    label: "dãy hình",
    q: "Finish the pattern. Drag the next one.",
    hints: ["Say the pattern out loud as you point.", "Two pictures take turns."],
  },
  "emath-pattern-0023": {
    strip: "🔴🔴🟦🔴",
    label: "dãy hình",
    q: "Which one comes next? Drag it in.",
    hints: ["Circle, circle, square — then it starts again.", "Point to each one and say it."],
  },
  "emath-pattern-0024": {
    strip: "🐈🐕🐕🐈🐕",
    label: "dãy con vật",
    q: "What comes next? Drag it in.",
    hints: ["One cat, then two dogs, again and again.", "Say the animals out loud."],
  },
  "emath-pattern-0025": {
    strip: "🍎🍌🍇🍎",
    label: "dãy quả",
    q: "Finish the pattern. Drag the next fruit.",
    hints: ["Three fruits take turns in the same order.", "Say them out loud as you point."],
  },
  "emath-pattern-0026": {
    strip: "☀️🌙🌙☀️🌙",
    label: "dãy hình",
    q: "Which one comes next? Drag it in.",
    hints: ["One sun, then two moons, again and again.", "Point to each picture and say it."],
  },
};

/** Ba bài đếm nhắc "pattern" nhưng chỉ vẽ một loại hình — nói đúng thứ con nhìn thấy. */
const COUNT_PROMPTS = {
  "emath-pattern-0027": "Tap each red bead to count.",
  "emath-pattern-0028": "Count the stars. Tap each one.",
  "emath-pattern-0029": "Tap each heart to count them.",
};

let changed = 0;
for (const [id, fix] of Object.entries(STRIPS)) {
  const ex = byId.get(id);
  if (!ex) throw new Error(`missing ${id}`);
  ex.prompt.text = fix.q;
  ex.prompt.image = { kind: "emoji", value: fix.strip, labelVi: fix.label };
  ex.hints = fix.hints;
  for (const zone of ex.dropZones) zone.label = "?";
  changed++;
}
for (const [id, text] of Object.entries(COUNT_PROMPTS)) {
  const ex = byId.get(id);
  if (!ex) throw new Error(`missing ${id}`);
  ex.prompt.text = text;
  changed++;
}

writeFileSync(FILE, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
console.log(`sửa ${changed} bài quy luật: dãy mẫu giờ được vẽ ra`);
for (const [id, fix] of Object.entries(STRIPS)) {
  const ex = byId.get(id);
  const right = ex.dragItems.find((i) => i.id === Object.values(ex.answerKey)[0][0]);
  console.log(`  ${id} ${fix.strip} → ${right.image.value}`);
}
