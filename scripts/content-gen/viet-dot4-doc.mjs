/**
 * Pha 6c, lô A7 — Tiếng Việt: 2 kỹ năng đọc hiểu trống của tuần 16–17 (bài 81–83, trang 174–179,
 * đúng nội dung đã quét từ sách): "Tết đang vào nhà" (bài 81), "Mùa xuân đến" (bài 82), "Voi, hổ và
 * khỉ" (bài 83, có sẵn 3 câu hỏi a/b/c thật trong sách). Ở giai đoạn ôn tập cuối học kỳ 1 này trẻ đã
 * học gần hết bảng chữ cái và phần lớn vần, nên không dùng letterPack — đây là đọc hiểu đoạn văn
 * (MINI_STORY: story.sentences + câu hỏi trắc nghiệm), không phải nhận diện một âm/vần.
 *
 * Strand DOC không nằm trong DIAGNOSTIC_STRANDS (chỉ HV bắt buộc mã lỗi), nên ô nhiễu ở đây là suy
 * luận sai nội dung bài đọc — không cần mã lỗi ngữ âm.
 *
 *   node scripts/content-gen/viet-dot4-doc.mjs
 */
import { choicesOf, listenPrompt, mkPack } from "./lib.mjs";

const pack = (code, prefix, lessonRefs, src, note) =>
  mkPack({ dir: "viet", subject: "VIET", language: "vi", code, prefix, lessonRefs, src, note });

const READ_PROMPTS = [
  "Con đọc to câu này nhé!",
  "Đọc chậm cho {ban} nghe.",
  "Con đọc cho cả nhà cùng nghe.",
  "Đọc rõ từng tiếng nhé!",
  "Cùng đọc to nào!",
  "Đọc thong thả câu này nhé!",
];
const STORY_PROMPTS = [
  "Đọc đoạn văn rồi trả lời câu hỏi.",
  "Nghe {ban} đọc rồi chọn ý đúng.",
  "Đọc kỹ rồi chọn câu trả lời đúng.",
  "Đọc xong, con chọn ý đúng nhé!",
  "Đọc đoạn văn, rồi trả lời nhé!",
  "Đọc thầm một lượt rồi chọn ý đúng.",
];
const STORY_HINTS = [
  "Đọc lại đoạn văn một lần nữa rồi mới chọn.",
  "Tìm câu có chứa câu trả lời rồi đọc kỹ.",
  "Đọc chậm từng câu một, đừng vội chọn.",
  "Nhớ lại chi tiết trong bài rồi mới chọn.",
];
const LISTEN_PROMPTS = [
  "Nghe rồi chọn ý đúng nhé!",
  "{ban} đọc một câu, con chọn ý đúng.",
  "Nghe kỹ rồi chọn câu trả lời đúng.",
  "Con nghe rồi tìm ý đúng nhé!",
  "Lắng nghe, rồi chọn ý đúng.",
  "Nghe lại rồi chọn ý đúng nhé!",
];

function addMini(P, i, sentences, _q, right, wrongs, d, why) {
  const { choices, answerKey } = choicesOf(
    { text: right },
    wrongs.map((text) => ({ text })),
    i,
  );
  P.add({
    type: "MINI_STORY",
    difficulty: d,
    scaffold: i < 4 ? "model" : "none",
    prompt: { text: STORY_PROMPTS[i % STORY_PROMPTS.length] },
    story: { sentences: sentences.map((text) => ({ text })) },
    choices,
    answerKey,
    hints: [STORY_HINTS[i % STORY_HINTS.length]],
    explanation: why,
  });
}
function addListen(P, i, say, right, wrongs, d) {
  const { choices, answerKey } = choicesOf(
    { text: right },
    wrongs.map((text) => ({ text })),
    i + 2,
  );
  P.add({
    type: "LISTEN_CHOOSE",
    difficulty: d,
    scaffold: i < 2 ? "model" : "none",
    prompt: { text: listenPrompt(LISTEN_PROMPTS, say, i) },
    listenTarget: { text: say },
    choices,
    answerKey,
    hints: [["Nghe lại một lần nữa nhé!"], ["Nghe hết cả câu rồi mới chọn."]][i % 2],
    explanation: `Con vừa nghe: "${say}"`,
  });
}
function addOrder(P, _i, q, steps, d) {
  const cards = steps.map((t, k) => ({ id: `c${k}`, text: t }));
  const shown = [...cards].reverse();
  P.add({
    type: "DRAG_DROP",
    difficulty: d,
    prompt: { text: q },
    dragItems: shown,
    dropZones: steps.map((_, k) => ({
      id: `o${k}`,
      label: ["Đầu tiên", "Tiếp theo", "Cuối cùng"][k] ?? `Bước ${k + 1}`,
      accepts: cards.map((c) => c.id),
    })),
    answerKey: Object.fromEntries(steps.map((_, k) => [`o${k}`, [`c${k}`]])),
    hints: ["Việc nào xảy ra trước thì xếp trước."],
    explanation: `Thứ tự đúng: ${steps.join(" → ")}.`,
    meta: { estSeconds: 50 },
  });
}
function addMcq(P, i, q, right, wrongs, d) {
  const { choices, answerKey } = choicesOf(
    { text: right },
    wrongs.map((text) => ({ text })),
    i + 1,
  );
  P.add({
    type: "MCQ",
    difficulty: d,
    prompt: { text: q },
    choices,
    answerKey,
    hints: ["Đọc kỹ câu hỏi rồi chọn ý đúng."],
    explanation: `Đáp án đúng: ${right}.`,
  });
}
function addRead(P, i, text, d) {
  const words = text.split(" ");
  P.add({
    type: "READ_ALOUD",
    difficulty: d,
    scaffold: i === 0 ? "model" : "none",
    prompt: { text: READ_PROMPTS[i % READ_PROMPTS.length] },
    readTarget: { text, words },
    answerKey: { words },
    hints: ["Đọc chậm, rõ từng tiếng."],
    explanation: `Câu này đọc là "${text}".`,
  });
}
function addSpeak(P, _i, q, sample, d) {
  P.add({
    type: "SPEAK_ANSWER",
    difficulty: d,
    prompt: { text: q },
    rubric: {
      criteria: ["Trả lời đúng nội dung bài đọc", "Nói thành câu rõ ràng"],
      sampleAnswers: [sample],
    },
    answerKey: null,
    hints: ["Nhớ lại đoạn văn vừa đọc rồi trả lời."],
    explanation: "Nói xong con nghe lại xem đã rõ ràng chưa nhé!",
    meta: { estSeconds: 60 },
  });
}

// ═══════════════════════════════════════════════ Đọc đoạn ngắn (bài 81-83, tr.174-179) ═════════
{
  const P = pack(
    "VIET.DOC.DOC_DOAN_NGAN",
    "viet-docngan",
    ["KNTT-TV1-T1-B81", "KNTT-TV1-T1-B82", "KNTT-TV1-T1-B83"],
    "SGK Tiếng Việt 1 tập một, Bài 81-83 tr.174-179 (Ôn tập: Tết đang vào nhà, Mùa xuân đến, Voi hổ và khỉ)",
    "Đọc đoạn ngắn 2-4 câu rồi trả lời trắc nghiệm. Ba đoạn từ sách: bài thơ 'Tết đang vào nhà' (bài 81), đoạn văn 'Mùa xuân đến' (bài 82), chuyện 'Voi, hổ và khỉ' (bài 83). Strand DOC không bắt buộc mã lỗi.",
  );
  addMini(
    P,
    0,
    ["Hoa đào trước ngõ.", "Cười tươi sáng hồng."],
    "",
    "trước ngõ",
    ["trong vườn", "trên mái nhà"],
    2,
    "Bài thơ nói hoa đào ở trước ngõ.",
  );
  addMini(
    P,
    1,
    ["Sân nhà đầy nắng.", "Mẹ phơi áo hoa.", "Em dán tranh gà.", "Ông treo câu đối."],
    "",
    "ông",
    ["mẹ", "em"],
    2,
    "Ông là người treo câu đối.",
  );
  addMini(
    P,
    2,
    ["Bầu trời ngày một thêm xanh.", "Vườn cây lại đâm chồi nảy lộc."],
    "",
    "đâm chồi nảy lộc",
    ["rụng hết lá", "không thay đổi"],
    3,
    "Khi xuân đến, vườn cây đâm chồi nảy lộc.",
  );
  addMini(
    P,
    3,
    ["Hoa bưởi nồng nàn.", "Hoa nhãn ngọt.", "Hoa cau thơm dịu."],
    "",
    "ngọt",
    ["chua", "đắng"],
    2,
    "Hoa nhãn có vị ngọt.",
  );
  addMini(
    P,
    4,
    ["Thua hổ trong một cuộc thi tài, voi phải nộp mạng cho hổ.", "Khỉ bày mưu giúp voi."],
    "",
    "khỉ",
    ["hổ", "chim"],
    3,
    "Khỉ là người bày mưu giúp voi.",
  );
  addMini(
    P,
    5,
    ["Hổ thấy voi to lớn mà sợ một con vật nhỏ bé.", "Hổ sợ quá, liền bỏ chạy."],
    "",
    "bỏ chạy",
    ["ở lại", "đi ngủ"],
    4,
    "Cuối cùng hổ sợ quá và bỏ chạy.",
  );
  addMini(
    P,
    6,
    ["Hoa đào trước ngõ.", "Hoa mai trong vườn.", "Tết đang vào nhà.", "Sắp thêm một tuổi."],
    "",
    "Tết",
    ["mùa hè", "trung thu"],
    3,
    "Bài thơ nói về ngày Tết.",
  );
  addMini(
    P,
    7,
    ["Khỉ cưỡi voi đi gặp hổ.", "Hổ thấy voi to lớn mà sợ khỉ bé nhỏ.", "Hổ sợ quá, liền bỏ chạy."],
    "",
    "thấy voi to lớn mà sợ khỉ bé nhỏ",
    ["vì trời mưa to", "vì đói bụng"],
    5,
    "Hổ sợ vì thấy voi to mà lại sợ một con vật nhỏ bé.",
  );

  const mcqs = [
    [
      "Hoa đào trước ngõ, hoa mai trong vườn. Hoa mai ở đâu?",
      "trong vườn",
      ["trước ngõ", "trên mái"],
      1,
    ],
    [
      "Mẹ phơi áo hoa, ông treo câu đối. Ông làm gì?",
      "treo câu đối",
      ["phơi áo hoa", "dán tranh gà"],
      1,
    ],
    ["Em dán tranh gà đón Tết. Em dán tranh gì?", "tranh gà", ["tranh mèo", "tranh hoa"], 2],
    [
      "Vườn cây đâm chồi nảy lộc khi xuân đến. Mùa nào cây đâm chồi?",
      "mùa xuân",
      ["mùa hè", "mùa đông"],
      3,
    ],
    [
      "Hoa bưởi nồng nàn, hoa nhãn ngọt. Hoa bưởi có mùi gì?",
      "nồng nàn",
      ["ngọt lịm", "không mùi"],
      3,
    ],
    [
      "Chích choè nhanh nhảu, khướu lắm điều. Khướu thế nào?",
      "lắm điều",
      ["nhanh nhảu", "trầm ngâm"],
      3,
    ],
    ["Voi thua hổ, phải nộp mạng cho hổ. Ai thua cuộc thi?", "voi", ["hổ", "khỉ"], 2],
    ["Khỉ bày mưu giúp voi thoát nạn. Ai bày mưu?", "khỉ", ["voi", "hổ"], 2],
    ["Khỉ cưỡi voi đi gặp hổ. Khỉ cưỡi con gì?", "voi", ["hổ", "ngựa"], 3],
    ["Hổ thấy voi to lớn mà sợ khỉ bé nhỏ. Hổ sợ ai?", "khỉ", ["voi", "chính mình"], 4],
    ["Hổ sợ quá liền bỏ chạy. Cuối cùng hổ đã làm gì?", "bỏ chạy", ["ở lại", "ngủ quên"], 3],
    ["Sân nhà đầy nắng, mẹ phơi áo hoa. Ai phơi áo hoa?", "mẹ", ["ông", "em"], 2],
    [
      "Đất trời nở hoa, Tết đang vào nhà. Bài thơ nói về dịp gì?",
      "Tết",
      ["hè về", "khai giảng"],
      3,
    ],
    [
      "Vườn cây rộn rã tiếng chim khi xuân về. Tiếng gì rộn rã?",
      "tiếng chim",
      ["tiếng xe", "tiếng trống"],
      3,
    ],
    ["Nắng vàng ngày càng rực rỡ khi xuân đến. Nắng có màu gì?", "vàng", ["đỏ", "tím"], 2],
    ["Ông treo câu đối, em dán tranh gà. Ai dán tranh gà?", "em", ["ông", "mẹ"], 2],
    ["Hoa mai trong vườn có cánh trắng. Cánh hoa mai màu gì?", "trắng", ["đỏ", "vàng"], 2],
    [
      "Vườn cây lại đâm chồi nảy lộc khi xuân sang. Vườn cây làm gì?",
      "đâm chồi nảy lộc",
      ["rụng hết lá", "khô héo dần"],
      4,
    ],
    [
      "Hoa cau thơm dịu trong vườn xuân. Hoa cau có mùi thế nào?",
      "thơm dịu",
      ["hôi nồng", "không có mùi"],
      3,
    ],
    [
      "Cu gáy chậm rãi đậu trên cành cây. Cu gáy có tính thế nào?",
      "chậm rãi",
      ["nhanh nhảu", "ồn ào"],
      4,
    ],
    [
      "Voi tỏ vẻ lễ phép khi gặp hổ. Voi có thái độ gì?",
      "lễ phép",
      ["hỗn láo", "sợ hãi run rẩy"],
      4,
    ],
  ];
  mcqs.forEach(([q, right, wrongs, d], i) => {
    addMcq(P, i, q, right, wrongs, d);
  });

  const listens = [
    ["Hoa đào trước ngõ.", "trước ngõ", ["trong vườn", "trên mái"], 1],
    ["Ông treo câu đối.", "ông", ["mẹ", "em"], 1],
    ["Hoa nhãn có vị ngọt.", "ngọt", ["chua", "đắng"], 2],
    ["Khỉ bày mưu giúp voi.", "khỉ", ["hổ", "chim"], 2],
    ["Hổ sợ quá, liền bỏ chạy.", "bỏ chạy", ["ở lại", "đi ngủ"], 3],
    ["Vườn cây rộn rã tiếng chim.", "tiếng chim", ["tiếng xe", "tiếng trống"], 3],
  ];
  listens.forEach(([say, right, wrongs, d], i) => {
    addListen(P, i, say, right, wrongs, d);
  });

  addOrder(
    P,
    0,
    "Xếp đúng thứ tự bài thơ 'Tết đang vào nhà'.",
    ["Hoa đào trước ngõ.", "Sân nhà đầy nắng.", "Tết đang vào nhà."],
    3,
  );
  addOrder(
    P,
    1,
    "Xếp đúng thứ tự chuyện Voi, hổ và khỉ.",
    ["Voi thua hổ trong cuộc thi.", "Khỉ bày mưu giúp voi.", "Hổ sợ quá, bỏ chạy."],
    4,
  );

  [
    "Hoa đào trước ngõ.",
    "Sân nhà đầy nắng.",
    "Tết đang vào nhà.",
    "Hoa bưởi nồng nàn.",
    "Khỉ bày mưu giúp voi.",
    "Hổ sợ quá, liền bỏ chạy.",
  ].forEach((text, i) => {
    addRead(P, i, text, 2 + (i % 3));
  });

  P.save();
}

// ═══════════════════════════════════════════ Đọc hiểu: trả lời câu hỏi (bài 81-83) ═════════════
{
  const P = pack(
    "VIET.DOC.DOC_HIEU_TRA_LOI",
    "viet-dochieu",
    ["KNTT-TV1-T1-B81", "KNTT-TV1-T2-CD1-B01"],
    "SGK Tiếng Việt 1 tập một, Bài 81-83 tr.174-179 (câu hỏi thật trong sách: a/b/c của bài Voi, hổ và khỉ)",
    "Đọc đoạn văn/câu chuyện rồi trả lời câu hỏi thật của sách (a/b/c). Dùng lại ba đoạn của VIET.DOC.DOC_DOAN_NGAN với câu hỏi khác, thêm SPEAK_ANSWER cho câu hỏi mở ('Vì sao...', 'Em thích...'). Strand DOC không bắt buộc mã lỗi.",
  );
  addMini(
    P,
    0,
    ["Thua hổ trong một cuộc thi tài, voi phải nộp mạng cho hổ.", "Khỉ bày mưu giúp voi."],
    "",
    "vì thua hổ trong một cuộc thi tài",
    ["vì voi ăn trộm của hổ", "vì voi làm hổ tức giận"],
    4,
    "Sách nói rõ: voi thua hổ trong một cuộc thi tài.",
  );
  addMini(
    P,
    1,
    ["Khỉ bày mưu giúp voi.", "Khỉ cưỡi voi đi gặp hổ."],
    "",
    "khỉ",
    ["chim", "rùa"],
    2,
    "Khỉ là người bày mưu giúp voi.",
  );
  addMini(
    P,
    2,
    ["Khỉ cưỡi voi đi gặp hổ.", "Đến điểm hẹn, khỉ quát lớn: Hổ ở đâu?"],
    "",
    "Hổ ở đâu?",
    ["Voi ở đâu?", "Ai gọi đó?"],
    3,
    "Khỉ quát lớn: 'Hổ ở đâu?'.",
  );
  addMini(
    P,
    3,
    ["Voi tỏ vẻ lễ phép: Thưa ông, hổ sắp tới rồi ạ."],
    "",
    "lễ phép",
    ["giận dữ", "im lặng không nói"],
    3,
    "Voi trả lời rất lễ phép.",
  );
  addMini(
    P,
    4,
    ["Hổ thấy voi to lớn mà sợ một con vật nhỏ bé.", "Hổ sợ quá, liền bỏ chạy."],
    "",
    "thấy voi to lớn mà sợ con vật nhỏ bé",
    ["vì trời tối", "vì đói bụng quá"],
    5,
    "Hổ sợ vì thấy voi to mà vẫn sợ một con vật nhỏ bé.",
  );
  addMini(
    P,
    5,
    ["Sân nhà đầy nắng.", "Mẹ phơi áo hoa.", "Em dán tranh gà."],
    "",
    "em",
    ["ông", "mẹ"],
    2,
    "Em là người dán tranh gà.",
  );
  addMini(
    P,
    6,
    ["Vườn cây lại rộn rã tiếng chim.", "Những anh chích choè nhanh nhảu."],
    "",
    "chim",
    ["chó", "mèo"],
    2,
    "Tiếng chim làm vườn cây rộn rã.",
  );
  addMini(
    P,
    7,
    ["Khỉ bày mưu giúp voi.", "Hổ sợ quá, liền bỏ chạy."],
    "",
    "khỉ",
    ["hổ", "voi"],
    3,
    "Khỉ là con vật khôn ngoan nhất trong câu chuyện.",
  );

  const mcqs = [
    ["Khỉ bày mưu giúp voi thoát nạn. Voi có thoát được không?", "có", ["không", "không rõ"], 1],
    ["Voi phải nộp mạng vì thua cuộc thi. Ai thắng cuộc thi?", "hổ", ["voi", "khỉ"], 1],
    ["Khỉ quát to để doạ hổ. Khỉ muốn hổ làm gì?", "sợ mà bỏ đi", ["đến gần hơn", "ngủ quên"], 4],
    ["Hổ nấp trong bụi cây nhìn ra. Hổ đang làm gì?", "rình xem", ["ngủ say", "ăn cỏ"], 3],
    [
      "Voi tỏ vẻ lễ phép khi nói với hổ. Vì sao voi lễ phép?",
      "để làm đúng ý khỉ",
      ["vì sợ hổ thật sự", "vì không biết nói gì"],
      5,
    ],
    [
      "Đất trời nở hoa khi Tết đến. Tết là dịp thế nào?",
      "vui vẻ, ấm áp",
      ["buồn bã", "lạnh lẽo"],
      3,
    ],
    ["Mẹ phơi áo hoa trong sân đầy nắng. Sân nhà thế nào?", "đầy nắng", ["đầy mưa", "tối om"], 2],
    [
      "Hoa nhãn ngọt, hoa cau thơm dịu trong vườn xuân. Vườn có mấy loại hoa được nhắc tới?",
      "ba loại",
      ["một loại", "năm loại"],
      4,
    ],
    [
      "Chim chóc rộn rã trong vườn khi xuân về. Vì sao vườn rộn rã?",
      "vì có nhiều tiếng chim",
      ["vì có xe cộ", "vì có máy móc"],
      3,
    ],
    [
      "Khỉ khôn ngoan bày mưu cứu voi khỏi hổ. Câu chuyện khen con vật nào?",
      "khỉ",
      ["hổ", "voi"],
      4,
    ],
    [
      "Voi to lớn nhưng vẫn sợ theo lời khỉ dặn. Vì sao voi giả vờ sợ?",
      "để đánh lừa hổ",
      ["vì voi thật sự yếu", "vì voi không biết gì"],
      5,
    ],
    [
      "Hổ bỏ chạy sau khi thấy voi. Hổ bỏ chạy vì hiểu lầm điều gì?",
      "tưởng voi cũng sợ con vật nhỏ như khỉ",
      ["tưởng trời sắp mưa", "tưởng voi sắp tấn công"],
      5,
    ],
    [
      "Khỉ đứng trên đầu voi để trông oai hơn. Khỉ đứng ở đâu?",
      "trên đầu voi",
      ["dưới chân voi", "trên cây cao"],
      3,
    ],
  ];
  mcqs.forEach(([q, right, wrongs, d], i) => {
    addMcq(P, i, q, right, wrongs, d);
  });

  [
    "Vì sao voi phải nộp mạng cho hổ?",
    "Những từ ngữ nào chỉ vóc dáng của voi và của khỉ?",
    "Trong câu chuyện trên, em thích con vật nào nhất? Vì sao?",
    "Tết đang vào nhà, em thích nhất điều gì?",
    "Mùa xuân đến, em thấy vườn cây thế nào?",
    "Ai giúp voi thoát nạn? Kể lại bằng lời của em.",
    "Vì sao hổ sợ quá rồi bỏ chạy?",
    "Em học được điều gì từ câu chuyện Voi, hổ và khỉ?",
  ].forEach((q, i) => {
    addSpeak(
      P,
      i,
      q,
      [
        "vì voi thua hổ trong một cuộc thi tài",
        "voi to lớn, khỉ bé nhỏ",
        "em thích khỉ vì khỉ thông minh",
        "em thích được mặc áo mới",
        "vườn cây xanh tươi, đâm chồi nảy lộc",
        "khỉ đã bày mưu giúp voi",
        "vì hổ tưởng voi cũng sợ như mình",
        "phải thông minh và bình tĩnh khi gặp khó khăn",
      ][i],
      3 + (i % 3),
    );
  });

  const listens2 = [
    ["Khỉ bày mưu giúp voi.", "khỉ", ["chim", "rùa"], 1],
    ["Voi tỏ vẻ lễ phép.", "lễ phép", ["giận dữ", "im lặng"], 2],
    ["Hổ sợ quá, liền bỏ chạy.", "bỏ chạy", ["ở lại", "đi ngủ"], 3],
    ["Em dán tranh gà.", "em", ["ông", "mẹ"], 2],
    ["Vườn cây rộn rã tiếng chim.", "tiếng chim", ["tiếng xe", "tiếng trống"], 3],
    ["Đất trời nở hoa.", "nở hoa", ["rụng lá", "khô héo"], 2],
  ];
  listens2.forEach(([say, right, wrongs, d], i) => {
    addListen(P, i, say, right, wrongs, d);
  });

  addOrder(
    P,
    2,
    "Xếp đúng thứ tự chuyện Voi, hổ và khỉ.",
    ["Khỉ cưỡi voi đi gặp hổ.", "Khỉ quát: Hổ ở đâu?", "Hổ sợ quá, bỏ chạy."],
    4,
  );
  addOrder(
    P,
    3,
    "Xếp đúng thứ tự bài Mùa xuân đến.",
    ["Bầu trời thêm xanh.", "Vườn cây đâm chồi.", "Chim chóc rộn rã."],
    3,
  );

  [
    "Khỉ bày mưu giúp voi.",
    "Hổ sợ quá, liền bỏ chạy.",
    "Voi tỏ vẻ lễ phép.",
    "Hoa đào trước ngõ.",
    "Vườn cây rộn rã tiếng chim.",
    "Đất trời nở hoa.",
  ].forEach((text, i) => {
    addRead(P, i, text, 2 + (i % 3));
  });

  P.save();
}
