/**
 * Đợt 3, lô D10 — Tiếng Việt, mạch Nói – nghe: nói theo tranh, trả lời câu hỏi, kể lại, chào hỏi.
 *
 * Nói thật (SPEAK_ANSWER) cần chấm giọng qua hàng chờ; đợt này dựng phần máy chấm được quanh kỹ năng:
 * chọn câu nói đủ ý (ô nhiễu là câu một từ — lỗi "chỉ nói một từ" — và câu lạc đề), nghe rồi chọn,
 * xếp tiếng thành câu, đọc to câu mẫu, vẽ–viết vào vở.
 *
 * Phạm vi chữ: NOI_THEO_TRANH ghi bài 1 (con chưa đọc được tiếng nào) — mở tới bài 31 để in được câu;
 * KE_LAI ghi bài 5–20 — mở tới bài 40 để có truyện Kiến và dế mèn (bài 30), Gà nâu và vịt xám (bài 35),
 * Hai người bạn và con gấu (bài 40). Tranh truyện là emoji ghép, không in chữ nên không vướng phạm vi.
 *
 *   node scripts/content-gen/viet-dot3-nn.mjs
 */
import { situationPack } from "./lib-vi.mjs";

const P = (e, w) => ({ e, w });

const SCENES = [
  ["🐔", "gà mẹ và gà con", "Gà mẹ che cho gà nhỏ.", "Gà.", "Bé đi nhà trẻ."],
  ["🐟", "cá ở hồ", "Cá ở hồ.", "Cá.", "Bà đi chợ."],
  ["🍉", "quả dưa", "Mẹ bổ quả dưa.", "Dưa.", "Bố đi xe."],
  ["🚲", "bé đi xe", "Bé đi xe.", "Xe.", "Bà cho cá ăn."],
  ["🐄", "con bò", "Bò ăn cỏ ở bờ đê.", "Bò.", "Bé vẽ nhà."],
  ["👵", "bà", "Bà kể cho bé nghe.", "Bà.", "Chó ở sân."],
  ["🏡", "nhà ở quê", "Nhà bà ở quê.", "Nhà.", "Bé ăn chè."],
  ["🛶", "con đò", "Bố chở bé đi đò.", "Đò.", "Mẹ nhổ cỏ."],
  ["🐕", "con chó", "Chó nhà Hà đi ra ngõ.", "Chó.", "Bé ghi chữ."],
  ["🌧️", "trời mưa", "Mưa to quá.", "Mưa.", "Bé đi ngủ."],
  ["🍜", "bát phở", "Bố ăn phở.", "Phở.", "Bé tô chữ a."],
  ["🎨", "bé vẽ tranh", "Hà vẽ quả na.", "Vẽ.", "Bà đi phà."],
  ["🐐", "con dê", "Dê ăn lá.", "Dê.", "Bố đi phố."],
  ["🧺", "giỏ đi chợ", "Mẹ đi chợ.", "Chợ.", "Bé ngủ."],
  ["🍐", "quả lê", "Bà cho bé quả lê.", "Lê.", "Chó ở ngõ."],
];
situationPack({
  code: "VIET.NN.NOI_THEO_TRANH",
  prefix: "viet-noitranh",
  unit: "KNTT-TV1-T1-B31",
  lessonRefs: ["KNTT-TV1-T1-B01", "KNTT-TV1-T1-B31"],
  src: "SGK Tiếng Việt 1 tập một, mục 'Nói theo tranh' của các bài học âm (Bài 1–31); tranh emoji thay tranh sách",
  note: "Nhìn tranh, chọn câu nói đủ ý. Ô nhiễu: câu một từ ('Gà.') — đúng lỗi 'chỉ nói một từ' của bản đồ kỹ năng — và câu lạc đề. Nói thật vẫn cần ba mẹ nghe; phần này tập nhận ra câu đủ ý. lessonRef mở tới bài 31 để in được câu.",
  items: SCENES.map(([pic, label, right, one, off], i) => ({
    q: [
      "Nhìn tranh. Câu nào nói đủ ý?",
      "Chọn câu nói về tranh nhé!",
      "Bạn nào nói đúng về tranh?",
    ][i % 3],
    pic,
    picLabel: label,
    right,
    wrongs: [[one], [off]],
    d: 1 + (i % 5),
    hint: ["Câu đủ ý nói ai và làm gì.", "Câu đó có nói về tranh không?"],
    why: `Tranh vẽ ${label}: "${right}"`,
  })),
  listenPrompts: [
    "Nghe câu rồi chọn tranh đúng nhé!",
    "{ban} nói một câu. Tranh nào hợp?",
    "Nghe kỹ rồi chỉ vào tranh.",
    "Con nghe rồi tìm tranh nhé!",
    "Lắng nghe cả câu rồi mới chọn.",
    "Nghe lần nữa rồi chọn tranh.",
  ],
  listens: [
    {
      say: "Bò ăn cỏ ở bờ đê.",
      right: P("🐄", "con bò"),
      wrongs: [P("🐔", "con gà"), P("🐟", "con cá")],
      d: 1,
    },
    {
      say: "Bà kể cho bé nghe.",
      right: P("👵", "bà"),
      wrongs: [P("🐕", "con chó"), P("🚲", "xe")],
      d: 1,
    },
    {
      say: "Mẹ bổ quả dưa.",
      right: P("🍉", "quả dưa"),
      wrongs: [P("🍐", "quả lê"), P("🍜", "bát phở")],
      d: 2,
    },
    {
      say: "Bố chở bé đi đò.",
      right: P("🛶", "con đò"),
      wrongs: [P("🚲", "xe"), P("🏡", "nhà")],
      d: 3,
    },
    {
      say: "Trời mưa to quá.",
      right: P("🌧️", "trời mưa"),
      wrongs: [P("☀️", "trời nắng"), P("🌙", "ban đêm")],
      d: 4,
    },
    {
      say: "Dê ăn lá cây.",
      right: P("🐐", "con dê"),
      wrongs: [P("🐄", "con bò"), P("🐟", "con cá")],
      d: 5,
    },
  ],
  orders: [
    {
      q: "Xếp các tiếng thành câu nói về tranh.",
      steps: ["Bà", "kể", "cho", "bé"],
      d: 2,
      hint: "Tiếng viết hoa đứng đầu câu.",
    },
    {
      q: "Kéo tiếng vào đúng chỗ để thành câu.",
      steps: ["Mẹ", "bổ", "quả", "dưa"],
      d: 3,
      hint: "Tiếng viết hoa đứng đầu câu.",
    },
    {
      q: "Xếp giúp {ban} câu nói về tranh.",
      steps: ["Hà", "vẽ", "quả", "na"],
      d: 4,
      hint: "Tiếng viết hoa đứng đầu câu.",
    },
    {
      q: "Xếp các tiếng thành câu nhé!",
      steps: ["Cá", "ở", "hồ"],
      d: 1,
      hint: "Tiếng viết hoa đứng đầu câu.",
    },
  ],
  reads: [
    "Gà mẹ che cho gà nhỏ.",
    "Bò ăn cỏ ở bờ đê.",
    "Bà kể cho bé nghe.",
    "Bố chở bé đi đò.",
    "Nhà bà ở quê.",
    "Mẹ đi chợ.",
  ],
  writes: [
    [
      "Vẽ nhà con, rồi nói một câu về tranh cho ba mẹ nghe.",
      "Nhà con có mẹ và bé.",
      ["Có tranh", "Nói (hoặc viết) được một câu đủ ai – làm gì"],
    ],
    [
      "Vẽ con vật con thích, nói một câu về nó.",
      "Chó nhà con ở sân.",
      ["Có tranh", "Câu nói đủ ý, đúng tranh"],
    ],
    [
      "Vẽ bữa cơm nhà con, kể một câu về tranh.",
      "Bố mẹ và bé ăn cơm.",
      ["Có tranh", "Câu nói đủ ý"],
    ],
    [
      "Vẽ đường tới trường, nói một câu về tranh.",
      "Mẹ chở bé đi học.",
      ["Có tranh", "Câu nói đủ ý"],
    ],
  ],
});

const QA = [
  ["Con thích con vật nào?", "Con thích con mèo.", "Mèo.", "Con đi học rồi."],
  ["Con mấy tuổi?", "Con sáu tuổi ạ.", "Sáu.", "Con thích màu đỏ."],
  ["Nhà con có mấy người?", "Nhà con có bốn người.", "Bốn.", "Con có con chó."],
  ["Con thích ăn quả gì?", "Con thích ăn quả xoài.", "Xoài.", "Con học lớp một."],
  ["Con học lớp mấy?", "Con học lớp một ạ.", "Lớp một.", "Con thích con mèo."],
  ["Buổi sáng con ăn gì?", "Buổi sáng con ăn phở.", "Phở.", "Con đi ngủ lúc chín giờ."],
  ["Con thích màu gì?", "Con thích màu xanh.", "Xanh.", "Con có ba cái bút."],
  ["Ai đưa con đi học?", "Mẹ đưa con đi học.", "Mẹ.", "Con thích đi học."],
  ["Con thích chơi trò gì?", "Con thích chơi đá bóng.", "Đá bóng.", "Con ăn cơm rồi."],
  ["Ở lớp, con ngồi cạnh ai?", "Con ngồi cạnh bạn Na.", "Bạn Na.", "Lớp con có cô giáo."],
  ["Hôm nay con học bài gì?", "Hôm nay con học vần an.", "Vần an.", "Con thích con thỏ."],
  ["Con thường đọc sách với ai?", "Con đọc sách với bố.", "Bố.", "Sách của con màu đỏ."],
  ["Cuối tuần con đi đâu?", "Cuối tuần con về quê.", "Về quê.", "Con thích ăn kem."],
];
situationPack({
  code: "VIET.NN.TRA_LOI_CAU_HOI",
  prefix: "viet-traloi",
  unit: null,
  lessonRefs: [],
  src: "SGK Tiếng Việt 1 tập một, hoạt động hỏi – đáp của mục 'Nói theo tranh'; chưa gắn bài cụ thể",
  note: "Nghe câu hỏi, trả lời thành câu đủ ý. Ô nhiễu có hai loại, đúng hai lỗi của bản đồ kỹ năng: trả lời một từ ('Mèo.') và trả lời không đúng câu hỏi. Câu trả lời dùng tên chung (bạn Na), không dùng tên thật của con.",
  items: QA.map(([q, right, one, off], i) => ({
    q: `Hỏi: ${q} Câu trả lời nào đủ ý?`,
    right,
    wrongs: [[one], [off]],
    d: 1 + (i % 5),
    hint: [
      "Câu trả lời đủ ý nhắc lại ý của câu hỏi.",
      "Câu đó có trả lời đúng điều được hỏi không?",
    ],
    why: `Trả lời đủ ý: "${right}"`,
  })),
  listenPrompts: [
    "Nghe câu hỏi rồi chọn câu trả lời đủ ý.",
    "{ban} hỏi con. Chọn câu trả lời nhé!",
    "Nghe kỹ câu hỏi rồi chọn.",
    "Con nghe rồi tìm câu trả lời đúng nhé!",
    "Lắng nghe hết câu hỏi rồi mới chọn.",
    "Nghe lần nữa rồi chọn câu trả lời.",
  ],
  listens: QA.slice(0, 8).map(([q, right, one, off], i) => ({
    say: q,
    right,
    wrongs: [[i % 2 === 0 ? one : off], [QA[(i + 5) % QA.length][1]]],
    d: 1 + (i % 5),
    why: `Câu hỏi "${q}" — trả lời: "${right}"`,
  })),
  orders: [
    {
      q: "Xếp các tiếng thành câu trả lời.",
      steps: ["Con", "thích", "màu", "đỏ"],
      d: 2,
      hint: "Tiếng viết hoa đứng đầu câu.",
    },
    {
      q: "Kéo tiếng vào đúng chỗ để trả lời.",
      steps: ["Mẹ", "đưa", "con", "đi"],
      d: 3,
      hint: "Ai làm gì?",
    },
    {
      q: "Xếp giúp {ban} câu trả lời.",
      steps: ["Con", "sáu", "tuổi", "ạ"],
      d: 2,
      hint: "Tiếng viết hoa đứng đầu câu.",
    },
    {
      q: "Xếp các tiếng thành câu nhé!",
      steps: ["Con", "học", "lớp", "một"],
      d: 4,
      hint: "Tiếng viết hoa đứng đầu câu.",
    },
  ],
  reads: [
    "Con thích con mèo.",
    "Con sáu tuổi ạ.",
    "Nhà con có bốn người.",
    "Mẹ đưa con đi học.",
    "Con thích màu xanh.",
    "Cuối tuần con về quê.",
  ],
  writes: [
    [
      "Viết câu trả lời: Con thích con vật nào?",
      "Con thích con chó.",
      ["Viết thành câu đủ ý", "Viết hoa đầu câu, có dấu chấm"],
    ],
    [
      "Viết câu trả lời: Con thích ăn gì?",
      "Con thích ăn cơm.",
      ["Viết thành câu đủ ý", "Viết hoa đầu câu, có dấu chấm"],
    ],
    [
      "Ba mẹ hỏi một câu, con trả lời bằng một câu rồi viết lại.",
      "Con học lớp một.",
      ["Câu trả lời đúng câu hỏi", "Viết thành câu đủ ý"],
    ],
    [
      "Vẽ bạn thân của con, viết một câu trả lời: Bạn tên là gì?",
      "Bạn con tên là Na.",
      ["Có tranh", "Câu trả lời đủ ý"],
    ],
  ],
});

situationPack({
  code: "VIET.NN.KE_LAI",
  prefix: "viet-kelai",
  unit: "KNTT-TV1-T1-B30",
  lessonRefs: ["KNTT-TV1-T1-B30", "KNTT-TV1-T1-B35", "KNTT-TV1-T1-B40"],
  src: "SGK Tiếng Việt 1 tập một, mục Kể chuyện: Bài 30 tr.73 (Kiến và dế mèn), Bài 35 tr.83 (Gà nâu và vịt xám), Bài 40 tr.93 (Hai người bạn và con gấu)",
  note: "Kể lại chuyện theo tranh. Câu hỏi bám câu hỏi dưới tranh của sách ('Mùa thu đến, đàn kiến làm gì?', 'Vịt đã làm gì để giúp gà?'). Xếp tranh theo thứ tự bằng thẻ tranh (không in chữ). Ô nhiễu là việc của nhân vật khác trong cùng truyện — đúng lỗi 'nhầm nhân vật, nhầm thứ tự'. lessonRef mở tới bài 40 để in được câu trả lời.",
  items: [
    {
      q: "Truyện Kiến và dế mèn: mùa thu, ai chăm chỉ tha mồi?",
      right: P("🐜", "đàn kiến"),
      wrongs: [P("🦗", "dế mèn"), P("🐔", "chú gà")],
      d: 1,
    },
    { q: "Mùa thu, dế mèn làm gì?", right: "ca múa", wrongs: [["tha mồi"], ["ngủ"]], d: 1 },
    {
      q: "Đông sang, vì sao dế mèn đi xin ăn?",
      right: "vì dế mèn đói",
      wrongs: [["vì dế mèn no"], ["vì dế mèn ốm"]],
      d: 2,
    },
    {
      q: "Xuân về, dế mèn làm gì cùng đàn kiến?",
      right: "tha mồi",
      wrongs: [["ca múa"], ["ngủ"]],
      d: 3,
    },
    {
      q: "Truyện Kiến và dế mèn khuyên con điều gì?",
      right: "phải chăm chỉ",
      wrongs: [["chỉ ca múa"], ["bỏ nhà đi"]],
      d: 5,
    },
    {
      q: "Truyện Gà nâu và vịt xám: ai cõng bạn qua sông?",
      right: P("🦆", "vịt xám"),
      wrongs: [P("🐔", "gà nâu"), P("🐟", "con cá")],
      d: 2,
    },
    {
      q: "Thương vịt vất vả, gà nâu giúp vịt việc gì?",
      right: P("🥚", "ấp trứng"),
      wrongs: [P("🏊", "bơi qua sông"), P("🌽", "ăn ngô")],
      d: 3,
    },
    {
      q: "Truyện Gà nâu và vịt xám khuyên con điều gì?",
      right: "đỡ đần bạn",
      wrongs: [["chê bạn"], ["bỏ bạn"]],
      d: 4,
    },
    {
      q: "Truyện Hai người bạn và con gấu: hai bạn gặp con gì?",
      right: P("🐻", "con gấu"),
      wrongs: [P("🐯", "con hổ"), P("🐘", "con voi")],
      d: 2,
    },
    {
      q: "Thấy gấu, người bạn thứ nhất làm gì?",
      right: P("🌳", "trèo lên cây"),
      wrongs: [P("😴", "nằm im"), P("🏃", "chạy về nhà")],
      d: 4,
    },
    {
      q: "Con gấu làm gì với người nằm im?",
      right: P("👃", "ngửi mặt rồi bỏ đi"),
      wrongs: [P("🍯", "ăn mật"), P("🌳", "trèo lên cây")],
      d: 5,
    },
    {
      q: "Kể chuyện, con kể thế nào cho bạn nghe rõ?",
      right: "nói to, chậm rãi",
      wrongs: [["nói thầm"], ["kể lộn xộn"]],
      d: 3,
    },
  ],
  listenPrompts: [
    "Nghe đoạn truyện rồi chọn nhé!",
    "{ban} kể một đoạn. Con chọn ô đúng.",
    "Nghe kỹ rồi trả lời.",
    "Con nghe rồi tìm ô đúng nhé!",
    "Lắng nghe hết đoạn truyện rồi mới chọn.",
    "Nghe lần nữa rồi chọn.",
  ],
  listens: [
    {
      say: "Mùa thu đến, đàn kiến chăm chỉ tha mồi về tổ.",
      q: "Mùa thu, đàn kiến làm gì?",
      right: "tha mồi về tổ",
      wrongs: [["ca múa"], ["ngủ"]],
      d: 1,
    },
    {
      say: "Còn dế mèn thì chỉ mải ca hát, nhảy múa.",
      q: "Dế mèn làm gì?",
      right: "ca múa",
      wrongs: [["tha mồi"], ["đi chợ"]],
      d: 1,
    },
    {
      say: "Đông sang, dế mèn đói quá, phải đi xin ăn.",
      q: "Đông sang, dế mèn làm gì?",
      right: "đi xin ăn",
      wrongs: [["đi ngủ"], ["đi bơi"]],
      d: 2,
    },
    {
      say: "Xuân về, dế mèn cùng đàn kiến tha mồi.",
      q: "Xuân về, dế mèn làm gì?",
      right: "tha mồi",
      wrongs: [["ca múa"], ["đi xin ăn"]],
      d: 2,
    },
    {
      say: "Hằng ngày, gà nâu và vịt xám đi chơi cùng nhau.",
      q: "Gà nâu chơi với ai?",
      right: P("🦆", "vịt xám"),
      wrongs: [P("🐱", "con mèo"), P("🐕", "con chó")],
      d: 3,
    },
    {
      say: "Vịt xám cõng gà nâu qua sông.",
      q: "Ai giúp gà nâu qua sông?",
      right: P("🦆", "vịt xám"),
      wrongs: [P("🐔", "gà mẹ"), P("🐟", "con cá")],
      d: 3,
    },
    {
      say: "Hai người bạn đi vào rừng thì gặp một con gấu.",
      q: "Hai người bạn gặp con gì?",
      right: P("🐻", "con gấu"),
      wrongs: [P("🐯", "con hổ"), P("🐘", "con voi")],
      d: 3,
    },
    {
      say: "Một người vội trèo lên cây, người kia nằm im dưới đất.",
      q: "Người bạn thứ nhất làm gì?",
      right: P("🌳", "trèo lên cây"),
      wrongs: [P("😴", "nằm im"), P("🏃", "chạy đi")],
      d: 4,
    },
    {
      say: "Gấu ngửi mặt người nằm im rồi bỏ đi.",
      q: "Gấu làm gì?",
      right: P("👃", "ngửi rồi bỏ đi"),
      wrongs: [P("🍯", "ăn mật"), P("🌳", "trèo cây")],
      d: 4,
    },
    {
      say: "Chị kiến cho dế mèn ăn và dặn dế mèn phải chăm chỉ.",
      q: "Chị kiến dặn dế mèn điều gì?",
      right: "phải chăm chỉ",
      wrongs: [["chỉ ca múa"], ["bỏ nhà đi"]],
      d: 5,
    },
    {
      say: "Thỏ mẹ dặn: được ai giúp thì phải nói cảm ơn.",
      q: "Được giúp, thỏ con cần nói gì?",
      right: "cảm ơn",
      wrongs: [["ca múa"], ["bỏ đi"]],
      d: 5,
    },
  ],
  orders: [
    {
      q: "Xếp tranh truyện Kiến và dế mèn theo thứ tự.",
      steps: [
        P("🐜🍂", "kiến tha mồi"),
        P("🦗🎶", "dế mèn ca hát"),
        P("❄️🦗", "dế mèn đói"),
        P("🌸🐜🦗", "dế mèn tha mồi cùng kiến"),
      ],
      d: 3,
      hint: "Thu, rồi đông, rồi xuân.",
    },
    {
      q: "Xếp tranh truyện Gà nâu và vịt xám.",
      steps: [
        P("🐔🦆", "gà và vịt đi chơi"),
        P("🏞️🐔", "gà đứng bên sông"),
        P("🌊🦆", "vịt cõng gà qua sông"),
        P("🥚🐔", "gà ấp trứng giúp vịt"),
      ],
      d: 4,
      hint: "Chuyện gì xảy ra trước?",
    },
    {
      q: "Xếp tranh truyện Hai người bạn và con gấu.",
      steps: [
        P("🚶🌲", "hai bạn đi vào rừng"),
        P("🐻", "gặp gấu"),
        P("🌳😴", "một bạn trèo cây, một bạn nằm im"),
        P("🗣️", "hai bạn nói chuyện"),
      ],
      d: 5,
      hint: "Gặp gấu xảy ra trước khi trèo cây.",
    },
    {
      q: "Truyện Kiến và dế mèn: mùa nào trước?",
      steps: [P("🍂", "mùa thu"), P("❄️", "mùa đông"), P("🌸", "mùa xuân")],
      d: 2,
      hint: "Thu – đông – xuân.",
    },
  ],
  reads: [
    "Dế mèn chỉ ca múa.",
    "Dế mèn đói quá.",
    "Dế mèn cần chăm chỉ.",
    "Bé kể cho mẹ nghe.",
    "Bé nói to, chậm rãi.",
  ],
  writes: [
    [
      "Vẽ tranh con thích nhất trong truyện Kiến và dế mèn, kể lại cho ba mẹ.",
      "tranh dế mèn ca hát",
      ["Có tranh đúng truyện", "Kể lại được ít nhất 3 ý đúng thứ tự"],
    ],
    [
      "Kể lại truyện Gà nâu và vịt xám cho ba mẹ nghe, vẽ một tranh.",
      "tranh vịt cõng gà",
      ["Có tranh đúng truyện", "Kể đủ nhân vật gà nâu, vịt xám"],
    ],
    [
      "Vẽ đoạn con nhớ nhất trong truyện Hai người bạn và con gấu.",
      "tranh con gấu",
      ["Có tranh đúng truyện", "Kể lại được đoạn đó"],
    ],
  ],
});

const POLITE = [
  ["Gặp bà ở cổng, con nói gì?", "Con chào bà ạ.", "Chào bà.", "Bà ơi, cho con kẹo."],
  ["Cô giáo cho con quyển vở. Con nói gì?", "Con cảm ơn cô ạ.", "Cảm ơn.", "Vở này xấu quá."],
  [
    "Con làm rơi bút của bạn. Con nói gì?",
    "Tớ xin lỗi bạn nhé.",
    "Bút của bạn đây.",
    "Tại bạn để đó.",
  ],
  ["Bạn cho con mượn thước. Con nói gì?", "Tớ cảm ơn bạn.", "Đưa đây.", "Thước của tớ đẹp hơn."],
  ["Gặp chú bảo vệ ở trường, con nói gì?", "Con chào chú ạ.", "Chào chú.", "Chú mở cổng đi."],
  [
    "Con đi học muộn, vào lớp con nói gì?",
    "Con xin lỗi cô, con đến muộn ạ.",
    "Con vào đây.",
    "Hôm nay con dậy muộn.",
  ],
  ["Ông cho con quả táo. Con nói gì?", "Con cảm ơn ông ạ.", "Cảm ơn.", "Con không thích táo."],
  [
    "Con va vào một bạn ở sân trường. Con nói gì?",
    "Tớ xin lỗi, bạn có đau không?",
    "Tránh ra.",
    "Tớ đi đây.",
  ],
  [
    "Đi học về, gặp mẹ, con nói gì?",
    "Con chào mẹ, con đi học về ạ.",
    "Mẹ ơi, đói.",
    "Con xem ti vi đây.",
  ],
  [
    "Muốn đi chơi với bạn, con nói gì với mẹ?",
    "Mẹ ơi, con xin phép đi chơi ạ.",
    "Con đi chơi.",
    "Mẹ nấu cơm chưa?",
  ],
  ["Bạn giúp con nhặt sách. Con nói gì?", "Tớ cảm ơn bạn nhé.", "Sách đây.", "Bạn nhặt chậm quá."],
  [
    "Làm đổ nước lên bàn của cô, con nói gì?",
    "Con xin lỗi cô ạ.",
    "Nước đổ rồi.",
    "Không phải con.",
  ],
  [
    "Chào tạm biệt cô giáo khi ra về, con nói gì?",
    "Con chào cô, con về ạ.",
    "Về đây.",
    "Cô ơi, mai nghỉ nhé.",
  ],
  ["Khách đến nhà, gặp bác, con nói gì?", "Con chào bác ạ.", "Chào.", "Bác tìm ai?"],
];
situationPack({
  code: "VIET.NN.CHAO_HOI_LE_PHEP",
  prefix: "viet-chaohoi",
  unit: null,
  lessonRefs: [],
  src: "SGK Tiếng Việt 1, mục Nói 'Cảm ơn' (Bài 26, 28), 'Xin lỗi' (Bài 31, 33, 36, 38), 'Xin phép' (Bài 41, 43, 46, 48); bản đồ kỹ năng gắn tập hai Chủ đề 4",
  note: "Chào hỏi, cảm ơn, xin lỗi, xin phép theo tình huống của các mục Nói trong sách. Ô nhiễu: câu thiếu 'ạ' / thiếu lời với người lớn (lỗi 'quên ạ'), và câu cộc lốc hoặc đổ lỗi. Không dùng mã lỗi — bộ mã chưa có mã cho lễ phép.",
  items: POLITE.map(([q, right, short, rude], i) => ({
    q,
    right,
    wrongs: [[short], [rude]],
    d: 1 + (i % 5),
    hint: ["Với người lớn, nhớ nói 'ạ' ở cuối câu.", "Lời nói lễ phép làm người nghe vui."],
    why: `Nói lễ phép: "${right}"`,
  })),
  listenPrompts: [
    "Nghe tình huống rồi chọn lời nói lễ phép.",
    "{ban} kể một chuyện. Con nói gì?",
    "Nghe kỹ rồi chọn câu con sẽ nói.",
    "Con nghe rồi tìm lời nói đúng nhé!",
    "Lắng nghe hết rồi mới chọn.",
    "Nghe lần nữa rồi chọn.",
  ],
  listens: POLITE.slice(0, 8).map(([q, right, short], i) => ({
    say: q,
    right,
    wrongs: [[short], [POLITE[(i + 4) % POLITE.length][1]]],
    d: 1 + (i % 5),
  })),
  orders: [
    {
      q: "Xếp các tiếng thành lời chào lễ phép.",
      steps: ["Con", "chào", "bà", "ạ"],
      d: 1,
      hint: "Lời chào người lớn kết thúc bằng 'ạ'.",
    },
    {
      q: "Kéo tiếng vào đúng chỗ để thành lời cảm ơn.",
      steps: ["Con", "cảm", "ơn", "cô"],
      d: 2,
      hint: "Ai – cảm ơn – ai.",
    },
    {
      q: "Xếp giúp {ban} lời xin lỗi.",
      steps: ["Tớ", "xin", "lỗi", "bạn"],
      d: 3,
      hint: "Tớ – xin lỗi – bạn.",
    },
  ],
  reads: [
    "Con chào bác ạ.",
    "Con chào bà ạ.",
    "Con cảm ơn cô ạ.",
    "Tớ xin lỗi bạn nhé.",
    "Mẹ ơi, con xin phép đi chơi ạ.",
    "Con chào cô, con về ạ.",
    "Tớ cảm ơn bạn.",
  ],
  writes: [
    [
      "Vẽ con đang chào ông bà, viết lời chào.",
      "Con chào ông bà ạ.",
      ["Có tranh", "Lời chào có 'ạ'"],
    ],
    ["Viết một lời cảm ơn gửi cô giáo.", "Con cảm ơn cô ạ.", ["Viết thành câu", "Lời nói lễ phép"]],
    [
      "Viết một lời xin lỗi khi con làm bạn buồn.",
      "Tớ xin lỗi bạn.",
      ["Viết thành câu", "Có lời xin lỗi"],
    ],
  ],
});
