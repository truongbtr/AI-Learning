/**
 * Khuôn gói tiếng Việt cho đợt 3: kỹ năng viết (mạch VIET), nói–nghe (mạch NN), đọc câu (DOC).
 *
 * Mọi tiếng in ra cho con đọc phải nằm trong phạm vi `lessonRef` — validator
 * `tieng-viet-progression.ts` canh; khuôn chỉ lo cấu trúc và luật "một đáp án".
 */
import { at, choicesOf, img, listenPrompt, mkPack } from "./lib.mjs";
import { bare } from "./vn-units.mjs";

export const LISTEN = [
  "Nghe rồi chọn ô đúng nhé!",
  "{ban} đọc, con chọn ô đúng.",
  "Nghe kỹ rồi chỉ vào ô con vừa nghe.",
  "Con nghe rồi tìm đúng ô nhé!",
  "Lắng nghe rồi chọn nhé!",
  "Nghe lần nữa rồi chọn ô đúng.",
];
export const READ = [
  "Con đọc to nhé!",
  "Đọc chậm từng tiếng cho {ban} nghe.",
  "Đọc to câu này nhé!",
  "Con đọc cho cả nhà cùng nghe.",
  "Đọc rõ từng tiếng nhé!",
  "Cùng đọc to nào!",
];
const WRITE = [
  "Viết vào vở:",
  "Con chép vào vở:",
  "Viết lại giúp {ban}:",
  "Chép vào vở nhé:",
  "Viết vào vở rồi chụp cho ba mẹ xem:",
  "Con viết vào vở:",
];

const NEAR = ["aăâ", "oôơ", "eê", "uư", "dđ"];
/** Mã lỗi đúng nghĩa cho một tiếng/từ viết sai so với tiếng/từ đúng; null khi không mã nào tả được. */
export function spellTag(rightIn, wrongIn) {
  // Từ nhiều tiếng: so đúng tiếng bị viết sai ("bí đỏ" / "bí đo" là quên dấu ở tiếng thứ hai).
  const rs = rightIn.split(" ");
  const ws = wrongIn.split(" ");
  let right = rightIn;
  let wrong = wrongIn;
  if (rs.length > 1 && rs.length === ws.length) {
    const diff = rs.map((r, i) => [r, ws[i]]).filter(([r, w]) => r !== w);
    if (diff.length !== 1) return null;
    [right, wrong] = diff[0];
  }
  if (bare(right) === bare(wrong)) {
    const toned = (s) => s.normalize("NFD").length > bare(s).length;
    return toned(right) && !toned(wrong) ? "thieu_dau_thanh" : "sai_dau_thanh";
  }
  const [a, b] = [bare(right), bare(wrong)];
  if (a.length !== b.length) return null;
  const diff = [...a].map((c, i) => [c, b[i]]).filter(([x, y]) => x !== y);
  if (diff.length === 1 && NEAR.some((f) => f.includes(diff[0][0]) && f.includes(diff[0][1])))
    return "nham_chu_gan_giong";
  if (
    diff.length === 1 &&
    ((diff[0][0] === "b" && diff[0][1] === "d") || (diff[0][0] === "d" && diff[0][1] === "b"))
  )
    return "nham_b_d";
  return null;
}
const opt = (right, t) => {
  const tag = spellTag(right, t);
  return tag ? { text: t, errorTag: tag } : { text: t };
};

/**
 * Kỹ năng viết: con viết vào vở (WRITE_PHOTO) là chính; thêm nhận ra cách viết đúng (MCQ, nghe),
 * dựng từ bằng thẻ, đọc trước khi viết.
 * cfg.words: [{ w, pic?, gloss?, wrongs: [..] }] — `wrongs` là cách viết sai thật hay gặp.
 */
export function writingPack(cfg) {
  const P = mkPack({ ...cfg, dir: "viet", subject: "VIET", language: "vi" });
  const add = P.add;
  const { words } = cfg;

  cfg.copies.forEach((set, i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: Math.min(5, 1 + (i % 5)),
      scaffold: i < 2 ? "model" : "none",
      prompt: { text: `${WRITE[i % 6]} ${set.join(", ")}.` },
      rubric: {
        criteria: cfg.criteria ?? [
          `Viết đủ ${set.length} phần`,
          "Chữ đúng nét, đúng độ cao",
          "Dấu thanh đặt đúng chỗ",
        ],
        sampleAnswers: [set.join(", ")],
      },
      answerKey: null,
      hints: [
        ["Viết chậm, nhìn mẫu nhé!"],
        ["Viết con chữ trước, đánh dấu sau."],
        ["Đọc thầm rồi mới viết."],
      ][i % 3],
      explanation: "Viết xong con đọc lại một lượt nhé!",
      meta: { estSeconds: 80 },
    });
  });
  words.forEach((wd, i) => {
    const { choices, answerKey } = choicesOf(
      { text: wd.w },
      wd.wrongs.map((t) => opt(wd.w, t)),
      i,
    );
    const tag = choices.find((c) => c.errorTag)?.errorTag ?? null;
    add({
      type: "MCQ",
      difficulty: 1 + (i % 5),
      targetsError: tag,
      scaffold: i < 4 ? "model" : "none",
      prompt: wd.pic
        ? {
            text: [
              "Tranh vẽ gì? Chọn chữ viết đúng.",
              "Chọn cách viết đúng tên tranh.",
              "Tên tranh viết thế nào?",
            ][i % 3],
            image: img(wd.pic, wd.gloss, null, 1),
          }
        : {
            text: [
              `Chọn cách viết đúng của "${wd.say ?? wd.w}".`,
              "Ô nào viết đúng?",
              "Đố con: ô nào viết đúng chính tả?",
            ][i % 3],
          },
      choices,
      answerKey,
      hints: ["Đọc thầm từng ô, nhìn kỹ dấu và con chữ."],
      explanation: `Viết đúng là "${wd.w}".`,
    });
  });
  words.slice(0, 8).forEach((wd, i) => {
    const { choices, answerKey } = choicesOf(
      { text: wd.w },
      wd.wrongs.map((t) => opt(wd.w, t)),
      i + 1,
    );
    add({
      type: "LISTEN_CHOOSE",
      difficulty: 2 + (i % 4),
      targetsError: choices.find((c) => c.errorTag)?.errorTag ?? null,
      prompt: { text: listenPrompt(LISTEN, wd.w, i) },
      listenTarget: { text: wd.w },
      choices,
      answerKey,
      hints: [["Nghe lại rồi nhìn kỹ dấu thanh."], ["Đánh vần thầm tiếng con nghe."]][i % 2],
      explanation: `Tiếng con nghe viết là "${wd.w}".`,
    });
  });
  (cfg.builds ?? []).forEach(([onset, rime, w, decoy], i) => {
    const cards = [
      { id: "d1", text: onset },
      { id: "v1", text: rime },
      ...(decoy ? [{ id: "d2", text: decoy, errorTag: "nham_am_dau" }] : []),
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      prompt: {
        text: [
          `Ghép "${w}" bằng thẻ nhé!`,
          `Kéo thẻ để viết tiếng "${w}".`,
          `Dựng tiếng "${w}": âm đầu rồi vần.`,
        ][i % 3],
      },
      dragItems: cards,
      dropZones: [
        {
          id: "dau",
          label: "Âm đầu",
          accepts: cards.filter((c) => c.id !== "v1").map((c) => c.id),
        },
        { id: "van", label: "Vần", accepts: ["v1"] },
      ],
      answerKey: { dau: ["d1"], van: ["v1"] },
      hints: ["Đọc chậm tiếng đó, phần đầu là âm đầu."],
      explanation: `"${w}" gồm ${onset} và ${rime}.`,
      meta: { estSeconds: 40 },
    });
  });
  (cfg.reads ?? []).forEach((r, i) => {
    const words = r.split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: 1 + (i % 5),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: r, words },
      answerKey: { words },
      hints: [["Đọc chậm từng tiếng một."], ["Đọc thầm trước rồi mới đọc to."]][i % 2],
      explanation: `Đọc là "${r}".`,
    });
  });
  P.save();
}

/**
 * Nói – nghe (mạch NN) và đọc câu: câu hỏi tình huống viết tay.
 * cfg: items [{ q, right, wrongs, pic?, d, hint, why }], listens [{ say, right, wrongs }],
 * orders [{ q, steps: [text...] }] (xếp thứ tự), reads, writes?
 */
export function situationPack(cfg) {
  const P = mkPack({ ...cfg, dir: "viet", subject: "VIET", language: "vi" });
  const add = P.add;
  const o = (w) =>
    Array.isArray(w) ? (w[1] ? { text: w[0], errorTag: w[1] } : { text: w[0] }) : { text: w };
  cfg.items.forEach((it, i) => {
    const { choices, answerKey } = choicesOf({ text: it.right }, it.wrongs.map(o), i);
    add({
      type: "MCQ",
      difficulty: it.d ?? 1 + (i % 5),
      scaffold: i < 6 ? "model" : "none",
      targetsError: choices.find((c) => c.errorTag)?.errorTag ?? null,
      prompt: {
        text: it.q,
        ...(it.pic ? { image: img(it.pic, it.picLabel ?? null, null, 1) } : {}),
      },
      choices,
      answerKey,
      hints: Array.isArray(it.hint) ? it.hint : [it.hint ?? "Đọc hết các ô rồi mới chọn nhé!"],
      explanation: it.why ?? `Đáp án: ${it.right}`,
    });
  });
  (cfg.listens ?? []).forEach((it, i) => {
    const { choices, answerKey } = choicesOf({ text: it.right }, it.wrongs.map(o), i + 1);
    add({
      type: "LISTEN_CHOOSE",
      difficulty: it.d ?? 1 + (i % 5),
      targetsError: choices.find((c) => c.errorTag)?.errorTag ?? null,
      prompt: { text: listenPrompt(cfg.listenPrompts ?? LISTEN, it.say, i) },
      listenTarget: { text: it.say },
      choices,
      answerKey,
      hints: [["Nghe lại một lần nữa nhé!"], ["Nghe hết cả câu rồi mới chọn."]][i % 2],
      explanation: it.why ?? `Con vừa nghe: "${it.say}"`,
    });
  });
  (cfg.orders ?? []).forEach((ord, i) => {
    const cards = ord.steps.map((t, k) => ({ id: `c${k}`, text: t }));
    const shown = [...cards].sort(
      (a, b) =>
        ((a.id.charCodeAt(1) * 3 + i) % cards.length) -
        ((b.id.charCodeAt(1) * 3 + i) % cards.length),
    );
    add({
      type: "DRAG_DROP",
      difficulty: ord.d ?? 2 + (i % 4),
      prompt: { text: ord.q },
      dragItems: shown,
      dropZones: ord.steps.map((_, k) => ({
        id: `o${k}`,
        label: ["Đầu tiên", "Tiếp theo", "Sau đó", "Cuối cùng"][k] ?? `Bước ${k + 1}`,
        accepts: cards.map((c) => c.id),
      })),
      answerKey: Object.fromEntries(ord.steps.map((_, k) => [`o${k}`, [`c${k}`]])),
      hints: [ord.hint ?? "Việc nào xảy ra trước thì xếp trước."],
      explanation: `Thứ tự đúng: ${ord.steps.join(" → ")}.`,
      meta: { estSeconds: 50 },
    });
  });
  (cfg.reads ?? []).forEach((r, i) => {
    const words = r.replace(/[.,!?]/g, "").split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: Math.min(5, 1 + (i % 5)),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: r, words },
      answerKey: { words },
      hints: [["Đọc chậm, rõ từng tiếng."], ["Đọc thầm trước rồi mới đọc to."]][i % 2],
      explanation: `Câu này đọc là "${r}".`,
    });
  });
  (cfg.writes ?? []).forEach(([q, sample], i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 3 + (i % 3),
      prompt: { text: q },
      rubric: {
        criteria: ["Làm đúng yêu cầu của đề", "Chữ rõ ràng, đúng dấu thanh"],
        sampleAnswers: [sample],
      },
      answerKey: null,
      hints: ["Nghĩ trước câu mình sẽ viết nhé!"],
      explanation: `Ví dụ: ${sample}`,
      meta: { estSeconds: 90 },
    });
  });
  P.save();
}

export { at };
