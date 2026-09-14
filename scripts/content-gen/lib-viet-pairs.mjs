/**
 * Gói "phân biệt hai âm dễ nhầm" (ch/tr, ng/ngh, g/gh, s/x, p/q, c/k/q, hỏi/ngã) — tách khỏi
 * `viet-letters-2.mjs` ở đợt 3 để các gói mới dùng chung; nội dung không đổi.
 */
import { choicesOf, ex, img, listenPrompt, numberId, writePack } from "./lib.mjs";
import { hasUnit } from "./vn-units.mjs";

const LISTEN = [
  "Nghe rồi chọn ô đúng nhé!",
  "{ban} đọc một tiếng, con chọn ô đúng.",
  "Nghe kỹ rồi chỉ vào tiếng con vừa nghe.",
  "Con nghe rồi tìm đúng tiếng nhé!",
  "Lắng nghe, tiếng nào vừa vang lên?",
  "Nghe lần nữa rồi chọn ô con nghe thấy.",
];
const READ = [
  "Con đọc to các tiếng này nhé!",
  "Đọc chậm từng tiếng cho {ban} nghe.",
  "Đọc to câu này nhé!",
  "Con đọc cho cả nhà cùng nghe.",
  "Đọc rõ từng tiếng nhé!",
  "Cùng đọc to nào!",
];
const WRITE = ["Viết vào vở:", "Con chép vào vở:", "Viết lại giúp {ban}:", "Chép vào vở nhé:"];

/**
 * `pairs[i]` = [tiếng đúng, tiếng nhầm, mã lỗi, tranh, tên tranh, âm của tiếng đúng, âm của tiếng
 * nhầm]. Gói ch/tr: cả hai tiếng đều thật. Gói ng/ngh, g/gh: tiếng nhầm là **lỗi chính tả** —
 * đúng thứ gói này dạy con tránh, nên nó mới được làm ô nhiễu (khác gói âm, nơi mọi ô phải là
 * tiếng thật).
 */
export function pairPack(cfg) {
  const { code, prefix, lessonRefs, unit, source, note, pairs, spelling, sorts } = cfg;
  const list = [];
  let n = 0;
  const add = (e) => {
    n += 1;
    list.push(ex({ id: numberId(prefix, n), language: "vi", skillCodes: [code], ...e }));
  };
  const meta = (s) => ({ estSeconds: s, lessonUnitCode: unit, sourceRef: source });
  const fillers = ["bà", "cá", "bé", "hồ", "lá", "cô"];

  pairs.forEach(([right, wrong, tag, pic, gloss, uR, uW], i) => {
    if (spelling) {
      // ① Tiếng nào viết đúng chính tả? — hai ô, một ô sai đúng quy tắc đang học.
      const { choices, answerKey } = choicesOf(
        { text: right },
        [{ text: wrong, errorTag: tag }],
        i,
      );
      add({
        type: "MCQ",
        difficulty: 1 + (i % 4),
        scaffold: i < 6 ? "model" : "none",
        targetsError: tag,
        prompt: {
          text: [
            "Tiếng nào viết đúng?",
            "Chọn tiếng viết đúng chính tả nhé!",
            "Đố con: ô nào viết đúng?",
            "Tìm giúp {ban} tiếng viết đúng.",
            "Hai ô đọc giống nhau. Ô nào viết đúng?",
            "Ô nào viết đúng luật chính tả?",
          ][i % 6],
        },
        choices,
        answerKey,
        hints: cfg.ruleHints[i % cfg.ruleHints.length],
        explanation: `Viết đúng là "${right}". ${cfg.why(right)}`,
        meta: meta(20),
      });
    } else {
      // ① Tiếng nào có âm tr? — ô nhiễu là tiếng ch cùng vần, và ô thứ ba không có âm nào của cặp.
      const filler = fillers[i % fillers.length];
      const { choices, answerKey } = choicesOf(
        { text: right },
        [{ text: wrong, errorTag: tag }, { text: filler }],
        i,
      );
      if (hasUnit(wrong, uR)) throw new Error(`${code}: "${wrong}" cũng có âm ${uR}`);
      add({
        type: "MCQ",
        difficulty: 1 + (i % 4),
        scaffold: i < 6 ? "model" : "none",
        targetsError: tag,
        prompt: {
          text: [
            `Tiếng nào có âm ${uR}?`,
            `Chọn tiếng có âm ${uR} nhé!`,
            `Ô nào chứa âm ${uR}?`,
            `Đố con: tiếng nào có âm ${uR}?`,
          ][i % 4],
        },
        choices,
        answerKey,
        hints: [[`Âm ${uR} và âm ${uW} đọc khác nhau, nhìn chữ đầu nhé.`], ["Đọc to từng ô lên."]][
          i % 2
        ],
        explanation: `"${right}" có âm ${uR}, "${wrong}" có âm ${uW}.`,
        meta: meta(20),
      });
    }

    // ② Nghe tiếng đúng, chọn ô.
    {
      const { choices, answerKey } = choicesOf(
        { text: right },
        [{ text: wrong, errorTag: tag }],
        i + 1,
      );
      add({
        type: "LISTEN_CHOOSE",
        difficulty: 2 + (i % 4),
        targetsError: tag,
        prompt: { text: listenPrompt(LISTEN, right, i) },
        listenTarget: { text: right },
        choices,
        answerKey,
        hints: [
          ["Nghe lại một lần nữa nhé!"],
          ["Chú ý âm đầu của tiếng."],
          ["Đọc thầm hai ô rồi so."],
        ][i % 3],
        explanation: spelling
          ? `Tiếng con nghe viết là "${right}".`
          : `Con vừa nghe "${right}", có âm ${uR}.`,
        meta: meta(20),
      });
    }

    // ③ Gói ch/tr: nghe cả tiếng ch — để con phân biệt bằng tai, không đoán theo bài đang học.
    if (!spelling && i % 2 === 0) {
      const { choices, answerKey } = choicesOf(
        { text: wrong },
        [{ text: right, errorTag: tag }],
        i,
      );
      add({
        type: "LISTEN_CHOOSE",
        difficulty: 3 + (i % 3),
        targetsError: tag,
        prompt: { text: listenPrompt(LISTEN, wrong, i + 3) },
        listenTarget: { text: wrong },
        choices,
        answerKey,
        hints: [`Tiếng ${uW} đọc nhẹ hơn tiếng ${uR}.`],
        explanation: `Con vừa nghe "${wrong}", có âm ${uW}.`,
        meta: meta(20),
      });
    }

    // ④ Nhìn tranh chọn tiếng.
    if (pic) {
      const { choices, answerKey } = choicesOf(
        { text: right },
        [{ text: wrong, errorTag: tag }],
        i + 2,
      );
      add({
        type: "MCQ",
        difficulty: 3 + (i % 3),
        assetTheme: i % 2 === 0 ? "garden" : "robot",
        targetsError: tag,
        prompt: { text: "Tranh vẽ gì? Chọn tiếng đúng nhé!", image: img(pic, gloss, null, 1) },
        choices,
        answerKey,
        hints: [`Tranh vẽ ${gloss}.`],
        explanation: `Tranh vẽ ${gloss}, viết là "${right}".`,
        meta: meta(25),
      });
    }
  });

  // ⑤ Xếp thẻ vào hai giỏ theo âm đầu.
  sorts.forEach(([zoneA, zoneB, cardsA, cardsB, tag], i) => {
    const cards = [
      ...cardsA.map((t, k) => ({ id: `a${k}`, text: t, errorTag: tag })),
      ...cardsB.map((t, k) => ({ id: `b${k}`, text: t, errorTag: tag })),
    ];
    add({
      type: "DRAG_DROP",
      difficulty: 2 + (i % 4),
      targetsError: tag,
      prompt: {
        text: [
          "Xếp mỗi tiếng vào đúng giỏ nhé!",
          "Chia các tiếng thành hai giỏ giúp {ban}.",
          "Kéo mỗi tiếng về giỏ của nó.",
          "Tiếng nào về giỏ nào?",
        ][i % 4],
      },
      dragItems: cards,
      dropZones: [
        { id: "za", label: zoneA, accepts: cards.map((c) => c.id) },
        { id: "zb", label: zoneB, accepts: cards.map((c) => c.id) },
      ],
      answerKey: { za: cardsA.map((_, k) => `a${k}`), zb: cardsB.map((_, k) => `b${k}`) },
      hints: [cfg.sortHint],
      explanation: `${cardsA.join(", ")} về giỏ "${zoneA}".`,
      meta: meta(45),
    });
  });

  // ⑥ Đọc to, ⑦ viết vào vở.
  cfg.phrases.forEach((p, i) => {
    const words = p.split(" ");
    add({
      type: "READ_ALOUD",
      difficulty: 2 + (i % 4),
      scaffold: i === 0 ? "model" : "none",
      prompt: { text: READ[i % 6] },
      readTarget: { text: p, words },
      answerKey: { words },
      hints: [["Đọc chậm từng tiếng một."], ["Đọc rõ âm đầu của từng tiếng."]][i % 2],
      explanation: `Câu này đọc là "${p}".`,
      meta: meta(25),
    });
  });
  cfg.writeSets.forEach((set, i) => {
    add({
      type: "WRITE_PHOTO",
      difficulty: 3 + (i % 3),
      prompt: { text: `${WRITE[i % 4]} ${set.join(", ")}.` },
      rubric: {
        criteria: [
          `Viết đủ ${set.join(" ").split(" ").length} tiếng`,
          cfg.rubricRule,
          "Dấu thanh đặt đúng chỗ",
        ],
        sampleAnswers: [set.join(" ")],
      },
      answerKey: null,
      hints: [["Đọc thầm tiếng trước khi viết."], ["Viết chậm, nhìn mẫu nhé!"]][i % 2],
      explanation: "Viết xong con đọc lại một lượt nhé!",
      meta: meta(70),
    });
  });

  writePack(`content/exercises/viet/${code.split(".").slice(1).join(".")}.pack.json`, {
    skillCode: code,
    subject: "VIET",
    generatedBy: "claude-code",
    promptVersion: "exercise-gen-v2",
    lessonRefs,
    note,
    exercises: list,
  });
}
