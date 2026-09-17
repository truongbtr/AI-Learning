/**
 * Pha 13 việc 1 — 25 bài học của MATH NOTES Grade 1 · Volume 1 (EDI-MN1): Unit 3, Unit 4, Unit 5 và
 * Unit 6 (11 bài cuối ở `emath-mn1-lessons-b.mjs`, đọc từ bản scan tr.52–97). Số liệu lấy từ docs/giao-trinh/EDI-MN1-vol1-phan-tich.md (QC đã đọc hết bản
 * scan sách tr.1–51) và đối chiếu lại ảnh trang.
 *
 * Mã bài theo thứ tự trang "Unit Introduction" (liền mạch 1…9); `bookLabel` giữ số in trên đầu
 * trang ("Lesson 3-6") khi nó khác, vì cô giáo nói theo số đó.
 *
 * Tuần lấy từ tiến độ thật: 18/09/2026 chủ dự án cho biết lớp đang học tới **trang 28** (bài
 * Compare Numbers on a Number Line) ở tuần 4 → sách bắt đầu tuần 1 và đi **2 bài/tuần** (4 tiết
 * English Maths của TKB 1B3). Unit 3 khép lại ở tuần 5 (Math in Real Life + Self-Reflection), Unit 4
 * bắt đầu tuần 6.
 *
 *   node scripts/content-gen/emath-mn1-lessons.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { MORE } from "./emath-mn1-lessons-b.mjs";

const BOOK = {
  name: "MATH NOTES Grade 1 · Volume 1 (Edison Schools)",
  // hai bản scan: tr.1–51 và tr.52–97
  file: "02-edison-math-notes-g1-vol1-tr1-51.pdf",
};
/** Bản scan chứa trang này. */
const fileFor = (page) => (page <= 51 ? BOOK.file : "03-edison-math-notes-g1-vol1-tr52-97.pdf");
const WEEK_NOTE =
  "Tuần theo tiến độ thật của lớp 1B3 (chủ dự án 18/09/2026: lớp học tới trang 28, tức bài Compare Numbers on a Number Line, tuần 4) — 2 bài/tuần, 4 tiết English Maths/tuần.";
const REAL_LIFE_U3 =
  "Toán trong đời sống (sách tr.32): cùng con đếm đồ chơi, ghế, bàn, sách trong nhà rồi nói to số đếm bằng tiếng Anh; vẽ những chiếc ghế trong nhà và viết số ghế.";
const ALLIGATOR =
  'Mẹo của sách: "Alligator eats the bigger number!" — miệng cá sấu (dấu < hoặc >) luôn há về phía số lớn hơn, ví dụ 15 > 12.';
const REAL_LIFE_U4 =
  "Mẹo của sách cho Unit 4 (tr.36): cộng thì bắt đầu từ số lớn hơn (9 + 3: từ 9 đếm thêm 3); tìm cặp làm tròn 10 (6 + 4, 9 + 1); dùng ngón tay và tia số. Trang Math in Real Life của Unit 4 (tr.58) chưa có ảnh.";

const L = [
  // ── Unit 3 — Numbers to 20 ─────────────────────────────────────────────────────────────────
  {
    code: "EDI-MN1-U3-L1",
    bookLabel: null,
    title: "Numbers 1 to 10",
    pages: [5, 7],
    weeks: [1, 1],
    topic: "Unit 3. Numbers to 20",
    objectives: [
      "Đếm đồ vật trong nhóm tới 10 và viết số 1–10.",
      "Đọc và nối số với chữ tiếng Anh zero … ten.",
      "Vẽ (hay bày) đúng số đồ vật được yêu cầu.",
    ],
    vocabulary: [
      "count",
      "number",
      "how many",
      "zero",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
    ],
    concepts: ["đếm đồ vật tới 10", "số và chữ số tiếng Anh tới ten", "thêm đồ vật rồi đếm lại"],
    tasks: [
      ["Try This First: How many fingers are on one hand?", "5", "try this first"],
      ["Exit Ticket 1: Write the number. (10 cars, 10 teddy bears)", "10 và 10", "exit ticket"],
      [
        "Exit Ticket 2: Circle the correct number. (3 triangles: 2 3 4 · 5 stars: 5 7 9 · 8 hearts: 7 8 9)",
        "3 · 5 · 8",
        "exit ticket",
      ],
      ["Exit Ticket 3: Draw 7 objects.", "7 đồ vật", "exit ticket"],
    ],
    answerKey:
      "Tr.5: một bàn tay có 5 ngón. Tr.6: 10 ô tô (2 hàng × 5), 10 gấu bông; 3 tam giác, 5 ngôi sao, 8 trái tim; vẽ đúng 7 đồ vật. Tr.7: nối 4,1,5,3,2 và 7,10,9,6,8 với chữ; 4 con ong vẽ thêm 2 → 6; 3 con bướm vẽ thêm 2 → 5.",
    text: [
      "Bài mở đầu Unit 3: con đếm đồ vật tới 10, viết số và nói tên số bằng tiếng Anh (zero … ten). Sách dùng hàng ô tô, gấu bông, tam giác, ngôi sao, trái tim để con đếm rồi khoanh đúng số.",
      "Ở nhà: đưa con một nắm đồ chơi nhỏ, nhờ con đếm to bằng tiếng Anh và chạm từng món khi đếm; hỏi 'How many fingers are on one hand?'.",
      REAL_LIFE_U3,
    ],
    skills: [
      ["EMATH.NBT.COUNT_TO_20", 1],
      ["EMATH.MP.MATH_VOCAB_EN", 0.5],
    ],
  },
  {
    code: "EDI-MN1-U3-L2",
    bookLabel: null,
    title: "Numbers 11 to 19",
    pages: [8, 10],
    weeks: [1, 1],
    topic: "Unit 3. Numbers to 20",
    objectives: [
      "Nhận ra số 11–19 là teen numbers: 1 nhóm mười và vài đơn vị.",
      "Đọc số trên hai ten-frame (khung đầu đầy) và viết thành 10 + đơn vị.",
      "Biết 10 không phải là teen number.",
    ],
    vocabulary: [
      "teen numbers",
      "ten-frame",
      "group of ten",
      "ones",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
    ],
    concepts: ["11–19 = 1 nhóm mười và 1–9 đơn vị", "đọc số trên hai ten-frame", "10 + 3 = 13"],
    tasks: [
      ["Try This First: What number comes after 14?", "15", "try this first"],
      [
        "Exit Ticket 1: How many? Write the numbers. (a full ten-frame and 4 dots) __ ten and __ ones is __.",
        "1, 4, 14",
        "exit ticket",
      ],
      [
        "Exit Ticket 2: Which ten-frame shows 17? (A: 10 + 7 · B: 10 + 9 · C: 10 + 5)",
        "A",
        "exit ticket",
      ],
      [
        "Exit Ticket 3: Draw number 14. (two empty ten-frames)",
        "khung đầu 10 chấm, khung sau 4 chấm",
        "exit ticket",
      ],
    ],
    answerKey:
      "Tr.8: 18 = 1 group of ten, 8 ones; 11 = 10 + 1 … 19 = 10 + 9. Tr.9: 1 ten and 4 ones is 14; ten-frame 17 là A (B là 19, C là 15); vẽ 14. Tr.10: 10 + 3 = 13; 10 + 7 = 17; vẽ 1 group of ten and 5 ones (15), 1 group of ten and 1 one (11); khoanh teen numbers trong 7, 4, 12, 15, 9, 10, 17 → 12, 15, 17 (10 không phải).",
    text: [
      "Con học teen numbers 11–19: mỗi số là một nhóm mười (một ten-frame đầy) cộng thêm vài chấm lẻ, ví dụ 18 là 1 group of ten và 8 ones, 13 = 10 + 3. Sách gài một bẫy hay: số 10 không phải teen number.",
      "Ở nhà: xếp 10 hạt vào khay trứng 10 ô rồi thêm vài hạt bên ngoài, hỏi con 'How many? … ten and … ones'.",
    ],
    skills: [["EMATH.NBT.TEEN_NUMBERS", 1]],
  },
  {
    code: "EDI-MN1-U3-L3",
    bookLabel: null,
    title: "Patterns on a Number Chart to 20",
    pages: [11, 13],
    weeks: [2, 2],
    topic: "Unit 3. Numbers to 20",
    objectives: [
      "Đọc bảng số 1–20 (2 hàng × 10 cột), chỉ đúng hàng (row) và cột (column).",
      "Điền số còn thiếu bằng quy luật: sang phải thêm 1, xuống dưới thêm 10.",
      "Nói được các số tiếp theo khi đếm tới.",
    ],
    vocabulary: ["number chart", "row", "column", "pattern", "comes next", "more"],
    concepts: ["bảng số 1–20", "cùng cột: số dưới = số trên + 10", "đếm tới trên bảng số"],
    tasks: [
      ["Try This First: What number is 2 more than 13?", "15", "try this first"],
      [
        "Exit Ticket 1: Write the numbers 1 to 20 in the chart.",
        "1–10 hàng trên, 11–20 hàng dưới",
        "exit ticket",
      ],
      [
        "Exit Ticket 2: Fill in the missing numbers. (a 2-row number chart)",
        "các số còn thiếu theo thứ tự",
        "exit ticket",
      ],
      [
        "Exit Ticket 3: Fill in the missing numbers. (chart pieces [16, 17, _ / _, 10, 11] and [6, _, 8 / 18, _, 20])",
        "18 và 9 · 7 và 19",
        "exit ticket",
      ],
    ],
    answerKey:
      "Tr.11: 2 more than 13 là 15; cột của 4 có 14 ở dưới. Tr.12: mảnh bảng [16, 17, 18 / 9, 10, 11] và [6, 7, 8 / 18, 19, 20]. Tr.13: What numbers come next? 14 → 15, 16, 17, 18 · 10 → 11, 12, 13, 14 · 8 → 9, 10, 11, 12 · 16 → 17, 18, 19, 20; nối điểm 1–20.",
    text: [
      "Bài này là quy luật đếm trên bảng số 20 (không phải quy luật lặp màu/hình): đi sang phải số tăng 1, đi xuống cùng cột số tăng 10 (4 ở trên thì 14 ở dưới). Con điền số thiếu trong bảng và trong các mảnh bảng nhỏ.",
      "Ở nhà: viết bảng 1–20 lên giấy, che vài ô bằng đồng xu cho con đoán; hỏi 'What number is 2 more than 13?'.",
    ],
    skills: [["EMATH.NBT.NUMBER_CHART_20", 1]],
  },
  {
    code: "EDI-MN1-U3-L4",
    bookLabel: null,
    title: "Patterns on a Number Line to 20",
    pages: [14, 16],
    weeks: [2, 2],
    topic: "Unit 3. Numbers to 20",
    objectives: [
      "Nhận ra mũi tên, vạch (mark) và khoảng đều trên tia số.",
      "Điền số còn thiếu trên tia số từ trái sang phải, từ bé đến lớn.",
      "Chọn đúng dãy số tiếp theo (đếm tới từng 1, không đếm cách 2, không đếm lùi).",
    ],
    vocabulary: ["number line", "arrow", "mark", "equal space", "one step after", "comes next"],
    concepts: ["tia số 0–20", "đếm tới từng bước một", "điền số thiếu trên tia số"],
    tasks: [
      ["Try This First: What number is one step after 7?", "8", "try this first"],
      [
        "Exit Ticket 1: Which numbers come next? (number line 10 … 16 ? ? ? ?) A 8, 10, 12, 14 · B 17, 18, 19, 20 · C 15, 14, 13, 12",
        "B",
        "exit ticket",
      ],
      ["Exit Ticket 2: Which number line is missing 10, 11, 12, 13?", "C", "exit ticket"],
      [
        "Exit Ticket 3: Fill in the missing numbers. (a number line showing only 6 and 13)",
        "7–12 và các số hai đầu",
        "exit ticket",
      ],
    ],
    answerKey:
      "Tr.14: one step after 7 là 8. Tr.15: tia 10…16 → 17, 18, 19, 20 (B; A là đếm cách 2, C là đếm lùi); tia thiếu 10–13 là C. Tr.16: tia 3–8 → 9, 10, 11, 12, 13 (D); tia 7–12 → 13, 14, 15, 16, 17 (A); điền số thiếu trên tia số thưa nhãn; vẽ tia số từ 3 đến 14.",
    text: [
      "Con làm quen tia số tới 20: mũi tên, vạch cách đều, số tăng dần từ trái sang phải. Câu khó của bài là chọn 'số tiếp theo' — sách để sẵn hai nhiễu: dãy đếm cách 2 và dãy đếm lùi.",
      "Ở nhà: kẻ tia số bằng băng dính trên sàn, cho con nhảy từng bước và đọc số; hỏi 'What number is one step after 7?'.",
    ],
    skills: [["EMATH.NBT.NUMBER_LINE_TO_20", 1]],
  },
  {
    code: "EDI-MN1-U3-L5",
    bookLabel: "Lesson 3-2",
    title: "Understand Tens",
    pages: [17, 19],
    weeks: [3, 3],
    topic: "Unit 3. Numbers to 20",
    objectives: [
      "Hiểu 10 đơn vị (ones) gộp lại thành 1 chục (ten).",
      "Đọc 2 thanh chục là 2 tens and 0 ones = 20.",
      "Kiểm tra một nhóm có đúng 10 hay không trước khi gọi là một chục.",
    ],
    vocabulary: ["ten", "tens", "ones", "group of ten", "the same as", "yes", "no"],
    concepts: ["10 ones = 1 ten", "20 ones = 2 tens", "nhóm chục phải đủ 10"],
    tasks: [
      ["Try This First: How many ones make a ten?", "10", "try this first"],
      ["Exit Ticket 1: (two ten-rods) __ tens and __ ones is __.", "2, 0, 20", "exit ticket"],
      ["Exit Ticket 2: YES or NO? 10 loose cubes = 1 ten.", "YES", "exit ticket"],
      [
        "Exit Ticket 3: YES or NO? 25 loose cubes in pairs = 2 tens.",
        "NO (25, không phải 20)",
        "exit ticket",
      ],
    ],
    answerKey:
      "Tr.17: 10 ones is the same as 1 ten; 2 tens and 0 ones is 20. Tr.18: 2, 0, 20; YES; NO. Tr.19: khoanh nhóm 10 khối: 10 ones = 1 ten, 20 ones = 2 tens; 20 children, mỗi xe buýt 10 bạn → 2 buses, 20 ones = 2 tens.",
    text: [
      "Đầu trang sách in 'Lesson 3-2' (trang giới thiệu gọi là 3-5). Con hiểu 10 khối rời ghép thành 1 thanh chục: '10 ones is the same as 1 ten', hai thanh là 20. Câu YES/NO với 25 khối gài bẫy: phải đếm thật, không đoán.",
      "Ở nhà: gom que kem hoặc bút chì thành bó 10 bằng dây thun; hỏi con 'How many ones make a ten?' và 'How many tens?'.",
    ],
    skills: [["EMATH.NBT.TENS_ONES", 1]],
  },
  {
    code: "EDI-MN1-U3-L6",
    bookLabel: "Lesson 3-3",
    title: "Represent Tens and Ones",
    pages: [20, 22],
    weeks: [3, 3],
    topic: "Unit 3. Numbers to 20",
    objectives: [
      "Biểu diễn số 11–20 bằng thanh chục và khối rời, chuỗi hạt, ten-frame.",
      "Đọc mô hình thành câu '1 ten and 6 ones is 16'.",
      "Nhận ra mô hình sai: thanh không đủ 10 khối, thừa một thanh chục.",
    ],
    vocabulary: ["tens", "ones", "show", "represent", "beads", "cubes"],
    concepts: ["thanh chục + khối rời", "chuỗi 10 hạt + hạt rời", "ten-frame 10 + đơn vị"],
    tasks: [
      ["Try This First: How many tens are in 10?", "1", "try this first"],
      [
        "Exit Ticket 1: How can you show number 13? (A 1 rod + 3 · B 2 rods + 3 · C 1 rod + 6 · D a 9-cube rod + 3)",
        "A",
        "exit ticket",
      ],
      ["Exit Ticket 2: Draw tens and ones to show 17.", "1 thanh chục và 7 khối", "exit ticket"],
      [
        "Exit Ticket 3: (a string of 10 beads and 7 beads) __ ten, __ ones, __.",
        "1, 7, 17",
        "exit ticket",
      ],
    ],
    answerKey:
      "Tr.20: 1 ten and 6 ones is 16. Tr.21: 13 là A (B là 23, C là 16, D thanh chỉ có 9 khối); vẽ 17 = 1 ten 7 ones; chuỗi hạt 1 ten, 7 ones, 17. Tr.22 (ảnh mờ): khoanh chục và viết số; ten-frame 10 + 3 = 13 và 10 + 4 = 14; vẽ chục và đơn vị cho 20.",
    text: [
      "Đầu trang in 'Lesson 3-3' (giới thiệu gọi 3-6). Con biểu diễn một số bằng nhiều mô hình: thanh chục và khối rời, chuỗi hạt, ten-frame. Câu chọn mô hình cho số 13 có một nhiễu tinh: thanh chục chỉ có 9 khối.",
      "Ở nhà: dùng khối Lego xếp một thanh 10 và vài khối lẻ, con nói 'one ten and … ones is …'.",
    ],
    skills: [
      ["EMATH.NBT.PLACE_VALUE_MODELS", 1],
      ["EMATH.NBT.TENS_ONES", 0.5],
    ],
  },
  {
    code: "EDI-MN1-U3-L7",
    bookLabel: "Lesson 3-6",
    title: "Compare Numbers",
    pages: [23, 25],
    weeks: [4, 4],
    topic: "Unit 3. Numbers to 20",
    objectives: [
      "So sánh hai số tới 20 bằng mô hình chục – đơn vị.",
      "Nói và chọn đúng câu 'is greater than', 'is less than', 'is equal to'.",
      "Giải bài toán lời 'Who has more?'.",
    ],
    vocabulary: ["compare", "greater than", "less than", "equal to", "more", "true", "false"],
    concepts: ["so sánh bằng số chục trước", "câu so sánh tiếng Anh", "đúng/sai với câu so sánh"],
    tasks: [
      ["Try This First: Which is greater: 8 or 12?", "12", "try this first"],
      [
        "Exit Ticket 1: Which sentence is correct? (9 cubes and 1 ten 2 ones) A 9 is greater than 12 · B 12 is greater than 9",
        "B",
        "exit ticket",
      ],
      ["Exit Ticket 2: Val has 17 beads. Jean has 11 beads. Who has more?", "Val", "exit ticket"],
      [
        "Exit Ticket 3: True or false? 11 is greater than 12 · 13 is greater than 2 · 9 is equal to 19",
        "F · T · F",
        "exit ticket",
      ],
    ],
    answerKey:
      "Tr.23: 18 is greater than 15; 15 is less than 18. Tr.24: B; Val; F, T, F. Tr.25: 15 is equal to 15; 3 is less than 11; 19 is greater than 2; 10 is less than 14; vẽ 13 và 8 rồi khoanh quan hệ (13 is greater than 8).",
    text: [
      "Đầu trang in 'Lesson 3-6' (giới thiệu gọi 3-7). Con so sánh hai số tới 20 và nói thành câu tiếng Anh: 18 is greater than 15, 15 is less than 18. Bài toán lời của sách: Val có 17 hạt, Jean có 11 hạt — ai nhiều hơn?",
      "Ở nhà: chia kẹo thành hai đĩa, con đếm rồi nói 'Mom has … . I have … . … is greater than …'.",
      ALLIGATOR,
    ],
    skills: [["EMATH.NBT.COMPARE_TO_20", 1]],
  },
  {
    code: "EDI-MN1-U3-L8",
    bookLabel: "Lesson 3-7",
    title: "Compare Numbers on a Number Line",
    pages: [26, 28],
    weeks: [4, 4],
    topic: "Unit 3. Numbers to 20",
    objectives: [
      "Dùng tia số để so sánh: số bên phải lớn hơn, số bên trái bé hơn.",
      "Đánh giá một câu so sánh là đúng hay sai ('Do you agree?').",
      "Khoanh số bé hơn trong hai số.",
    ],
    vocabulary: ["number line", "right", "left", "farther", "greater", "less", "agree"],
    concepts: ["bên phải = lớn hơn", "bên trái = bé hơn", "so sánh trên tia số 0–20"],
    tasks: [
      ["Try This First: Which number is farther to the right: 7 or 10?", "10", "try this first"],
      [
        "Exit Ticket 1: (number line 0–20) A 8 is greater than 14 · B 14 is greater than 8",
        "B",
        "exit ticket",
      ],
      [
        "Exit Ticket 2: True or false? 4 is less than 7 · 3 is greater than 13 · 8 is equal to 9",
        "T · F · F",
        "exit ticket",
      ],
      ["Exit Ticket 3: Pat says that 6 is greater than 11. Do you agree?", "No", "exit ticket"],
    ],
    answerKey:
      "Tr.26: 17 ở bên phải 13 nên 17 lớn hơn. Tr.27: B; T, F, F; No. Tr.28: 8 is less than 14; 17 is greater than 13; số bé hơn: 12 (12 hay 14), 15 (18 hay 15); Jake 12 thẻ, Caleb 18 thẻ → Caleb nhiều hơn.",
    text: [
      "Đầu trang in 'Lesson 3-7' (giới thiệu gọi 3-8). Con so sánh bằng tia số: số nằm bên phải lớn hơn, bên trái bé hơn. Câu 'Pat says that 6 is greater than 11. Do you agree?' tập cho con kiểm tra lời người khác.",
      "Ở nhà: dán tia số 0–20, hai người đứng ở hai số; ai đứng bên phải là số lớn hơn.",
      ALLIGATOR,
    ],
    skills: [
      ["EMATH.NBT.COMPARE_TO_20", 1],
      ["EMATH.NBT.NUMBER_LINE_TO_20", 0.5],
    ],
  },
  {
    code: "EDI-MN1-U3-L9",
    bookLabel: "Lesson 3-8",
    title: "Use Symbols to Compare Numbers",
    pages: [29, 31],
    weeks: [5, 5],
    topic: "Unit 3. Numbers to 20",
    objectives: [
      "Nhận ra ba dấu: > greater than, < less than, = equal to.",
      "Điền đúng dấu giữa hai số tới 20.",
      "Phát hiện dấu đặt ngược chiều (Pat writes 8 > 17).",
    ],
    vocabulary: ["symbol", "greater than", "less than", "equal to", ">", "<", "="],
    concepts: ["dấu > < =", "miệng cá sấu há về số lớn", "so sánh hai nhóm tranh"],
    tasks: [
      ["Try This First: Which symbol would you use between 15 and 12?", ">", "try this first"],
      ["Exit Ticket 1: Which symbol means less than? A > · B < · C =", "B", "exit ticket"],
      [
        "Exit Ticket 2: Draw tens and ones for 15 and 12. Write the symbol.",
        "15 > 12",
        "exit ticket",
      ],
      ["Exit Ticket 3: 5 ○ 11 · 17 ○ 8 · 16 ○ 13 · 12 ○ 12", "< · > · > · =", "exit ticket"],
    ],
    answerKey:
      "Tr.29: 12 > 10; 9 < 13; 11 = 11. Tr.30: B; 15 > 12; <, >, >, =. Tr.31: 10 dâu < 12 táo; 8 vợt < 14 que; 15 < 19, 2 > 1, 14 > 13, 10 = 10, 20 > 19, 18 > 7; Pat writes 8 > 17 → No.",
    text: [
      "Đầu trang in 'Lesson 3-8' (giới thiệu gọi 3-9). Con viết so sánh bằng dấu: > là greater than, < là less than, = là equal to. Lỗi hay gặp nhất là đặt dấu ngược chiều.",
      ALLIGATOR,
      "Ở nhà: làm thẻ dấu bằng giấy (miệng cá sấu), đặt giữa hai nhóm đồ chơi và cho con xoay đúng chiều.",
      REAL_LIFE_U3,
    ],
    skills: [["EMATH.NBT.COMPARE_TO_20", 1]],
  },
  // ── Unit 4 — Addition within 20 ────────────────────────────────────────────────────────────
  {
    code: "EDI-MN1-U4-L1",
    bookLabel: "Lesson 4-1",
    title: "Relate Counting to Addition",
    pages: [37, 39],
    weeks: [6, 6],
    topic: "Unit 4. Addition within 20",
    objectives: [
      "Tìm tổng của hai nhóm bằng cách đếm hết hoặc bằng phép cộng.",
      "Hiểu từ sum và addend.",
      "Viết phép cộng cho tranh hai nhóm.",
    ],
    vocabulary: ["add", "addend", "sum", "plus", "equals", "in all"],
    concepts: ["đếm để cộng", "phép cộng cho tranh", "sum = addend + addend"],
    tasks: [
      ["Try This First: What is 8 + 2?", "10", "try this first"],
      ["Exit Ticket 1: (3 birds and 3 birds) _ + _ = _ birds", "3 + 3 = 6", "exit ticket"],
      ["Exit Ticket 2: (5 caps and 3 caps) _ + _ = _ caps", "5 + 3 = 8", "exit ticket"],
      ["Exit Ticket 3: (2 kites and 4 kites) _ + _ = _ kites", "2 + 4 = 6", "exit ticket"],
    ],
    answerKey:
      "Tr.37: 5 ếch + 3 ếch = 8 (đếm 1…8 hoặc cộng 5 + 3). Tr.38: 3 + 3 = 6 birds; 5 + 3 = 8 caps; 2 + 4 = 6 kites. Tr.39: 7 + 2 = 9 cows; 3 + 3 = 6 horses; vẽ tranh cho 6 + 5 = 11.",
    text: [
      "Mở đầu Unit 4 (Addition within 20): con thấy đếm hết hai nhóm và làm phép cộng cho cùng một kết quả. Sách giới thiệu hai từ mới: addend (số hạng) và sum (tổng).",
      REAL_LIFE_U4,
    ],
    skills: [
      ["EMATH.OA.ADD_WITHIN_10", 1],
      ["EMATH.OA.ADD_WITHIN_20", 0.3],
    ],
  },
  {
    code: "EDI-MN1-U4-L2",
    bookLabel: null,
    title: "Ways to make 10",
    pages: [40, 42],
    weeks: [6, 6],
    topic: "Unit 4. Addition within 20",
    objectives: [
      "Tìm mọi cặp số có tổng bằng 10 (10 + 0 … 0 + 10).",
      "Trả lời 'How many more to make 10?' từ ten-frame đã tô.",
      "Nhớ các cặp bằng 'Rainbow to 10'.",
    ],
    vocabulary: ["make 10", "how many more", "ten-frame", "rainbow", "number bond"],
    concepts: ["các cặp số làm thành 10", "phần còn trống của ten-frame", "cầu vồng tới 10"],
    tasks: [
      ["Try This First: What number goes with 6 to make 10?", "4", "try this first"],
      [
        "Exit Ticket: How many more to make 10? 6 + _ · 5 + _ · 10 + _ · 1 + _ · 8 + _ · 7 + _ · 4 + _ · 2 + _",
        "4, 5, 0, 9, 2, 3, 6, 8",
        "exit ticket",
      ],
    ],
    answerKey:
      "Tr.40: bàn tính 10 hàng: 10 + 0, 9 + 1, … 1 + 9 = 10. Tr.41: 4, 5, 0, 9, 2, 3, 6, 8. Tr.42: Rainbow to 10 — 0 + 10, 1 + 9, 2 + 8, 3 + 7, 4 + 6, 5 + 5 (và đổi chỗ).",
    text: [
      "Mục lục ghi bài này là 'Addition within 10'; trang giới thiệu gọi 4-2 'Know ways to make 10'. Con tìm cặp số cộng lại bằng 10 bằng ten-frame ('How many more to make 10?') và bằng cầu vồng Rainbow to 10.",
      "Ở nhà: giơ vài ngón tay, hỏi 'How many more to make 10?'; con giơ nốt số ngón còn thiếu.",
      REAL_LIFE_U4,
    ],
    skills: [["EMATH.OA.NUMBER_BONDS_10", 1]],
  },
  {
    code: "EDI-MN1-U4-L3",
    bookLabel: "Lesson 4-2",
    title: "Count On to Add Using a Number Line",
    pages: [43, 45],
    weeks: [7, 7],
    topic: "Unit 4. Addition within 20",
    objectives: [
      "Cộng bằng cách đếm tiếp trên tia số: đứng ở số đầu, nhảy thêm số bước.",
      "Bắt đầu từ số hạng lớn hơn để đếm nhanh hơn.",
      "Không đếm cả số bắt đầu khi đếm tiếp.",
    ],
    vocabulary: ["count on", "number line", "jump", "start at", "greater addend", "sum"],
    concepts: ["đếm tiếp từ số lớn", "mỗi bước nhảy là thêm 1", "đọc phép cộng từ tia số"],
    tasks: [
      ["Try This First: What is 5 + 7?", "12", "try this first"],
      [
        "Exit Ticket 1: Start at 6. Count on 3 more. What is the sum of 6 + 3? A 7 · B 8 · C 9 · D 10",
        "C",
        "exit ticket",
      ],
      ["Exit Ticket 2: 5 + 2 = __ (number line 0–10)", "7", "exit ticket"],
      [
        "Exit Ticket 3: (a dot at 9 and 4 jumps) Which expression? A 4 + 4 · B 9 + 4 · C 9 + 9 · D 9 + 13",
        "B",
        "exit ticket",
      ],
      ["Exit Ticket 4: (a dot at 8, count on 6) 8 + 6 = __", "14", "exit ticket"],
    ],
    answerKey:
      "Tr.43: 9 + 3 — từ 9 nhảy 3 bước là 12 (nhanh hơn bắt đầu từ 3 nhảy 9 bước). Tr.44: C (A/B đếm thiếu bước, D đếm cả số đầu); 7; B; 14. Tr.45: 1 + 8 = 9; 7 + 5 = 12; 6 + 1 = 7; Cory reads 7 pages and 3 pages → 10 pages.",
    text: [
      "Đầu trang in 'Lesson 4-2' (giới thiệu gọi 4-3). Con cộng bằng cách đếm tiếp trên tia số: 9 + 3 là đứng ở 9, nhảy 3 bước tới 12. Sách dạy 'Counting on is quicker when you start with the greater addend.' Lỗi thường gặp: đếm luôn cả số đứng đầu (6 + 3 ra 10).",
      REAL_LIFE_U4,
    ],
    skills: [["EMATH.OA.COUNT_ON", 1]],
  },
  {
    code: "EDI-MN1-U4-L4",
    bookLabel: "Lesson 4-3",
    title: "Doubles",
    pages: [46, 48],
    weeks: [7, 7],
    topic: "Unit 4. Addition within 20",
    objectives: [
      "Nhận ra doubles: hai số hạng giống nhau (1 + 1 … 10 + 10).",
      "Nhớ bảng doubles qua đồ vật đời thường.",
      "Chọn đúng phép doubles cho hai thẻ chấm giống nhau.",
    ],
    vocabulary: ["doubles", "same", "addend", "sum", "dot cards"],
    concepts: ["doubles 1 + 1 … 10 + 10", "thẻ chấm giống nhau", "bài toán 2 hộp"],
    tasks: [
      ["Try This First: What is 7 + 7?", "14", "try this first"],
      ["Exit Ticket 1: (two cards with 2 dots) _ + _ = _", "2 + 2 = 4", "exit ticket"],
      ["Exit Ticket 2: What is the sum of 5 + 5? A 11 · B 10 · C 9 · D 8", "B", "exit ticket"],
      [
        "Exit Ticket 3: A box has 8 crackers. How many are in 2 boxes?",
        "8 + 8 = 16",
        "exit ticket",
      ],
      [
        "Exit Ticket 4: (two same dot cards, 8 dots each) Which doubles fact? A 3 + 3 = 5 · B 4 + 4 = 8 · C 5 + 5 = 9 · D 8 + 8 = 16",
        "D",
        "exit ticket",
      ],
    ],
    answerKey:
      "Tr.46: 1 + 1 (mắt), 2 + 2 (chân chó), 3 + 3 (chân côn trùng), 4 + 4 (chân nhện), 5 + 5 (ngón tay), 6 + 6 (hộp trứng), 7 + 7 (lịch 2 tuần), 8 + 8 (hộp bút sáp), 9 + 9 (vỉ 18), 10 + 10 (ngón tay và ngón chân). Tr.47: 2 + 2 = 4; B; 16; D (A, C là doubles cộng sai). Tr.48: 14, 4, 12, 10, 16, 2, 18, 6; thẻ 6|6 → 6 + 6 = 12, 5|5 → 5 + 5 = 10.",
    text: [
      "Đầu trang in 'Lesson 4-3' (giới thiệu gọi 4-4). Doubles là phép cộng hai số giống nhau. Sách gắn mỗi phép với một đồ vật: 2 + 2 là 4 chân chó, 4 + 4 là 8 chân nhện, 6 + 6 là hộp 12 trứng, 7 + 7 là 14 ngày của 2 tuần.",
      "Ở nhà: đi tìm doubles quanh nhà (hộp trứng, đôi giày, hai bàn tay) và nói to '6 plus 6 is 12'.",
      REAL_LIFE_U4,
    ],
    skills: [["EMATH.OA.DOUBLES", 1]],
  },
  {
    code: "EDI-MN1-U4-L5",
    bookLabel: "Lesson 4-5",
    title: "Make a 10 to Add",
    pages: [49, 51],
    weeks: [8, 8],
    topic: "Unit 4. Addition within 20",
    objectives: [
      "Cộng qua 10 bằng cách làm tròn 10: 7 + 5 = 7 + 3 + 2 = 12.",
      "Dùng hai ten-frame và sơ đồ number bond để tách số hạng thứ hai.",
      "Giải bài toán lời bằng cách làm tròn 10.",
    ],
    vocabulary: ["make a 10", "number bond", "ten-frame", "counters", "sum", "in all"],
    concepts: ["lấp đầy ten-frame trước", "tách số hạng thành hai phần", "10 + phần còn lại"],
    tasks: [
      ["Try This First: What number makes 10 with 8?", "2", "try this first"],
      [
        "Exit Ticket 1: (6 dark and 8 light counters on two ten-frames) 6 + 8 = __",
        "14",
        "exit ticket",
      ],
      ["Exit Ticket 2: Draw counters to add 3 + 9.", "12", "exit ticket"],
      [
        "Exit Ticket 3: (number bond: 8 is 1 and 7) What is the sum of 9 + 8? A 19 · B 18 · C 17 · D 16",
        "C",
        "exit ticket",
      ],
    ],
    answerKey:
      "Tr.49: 7 + 5 — 7 chấm và 3 chấm lấp đầy khung, còn 2 → 10 + 2 = 12; hoặc tách 5 thành 3 và 2. Tr.50: 14; 12; C. Tr.51: 6 + 5 = 11; 9 + 6 = 15 (tách 6 thành 1 và 5); 7 + 6 = 13; 4 + 9 = 13 (tách 4); Kelly 8 bút + Carl 7 bút = 15.",
    text: [
      "Bài 4-5: cộng qua 10 bằng cách làm tròn 10. Với 7 + 5, con lấy 3 từ số 5 để 7 thành 10 (tách 5 thành 3 và 2), rồi 10 + 2 = 12. Sách dùng hai ten-frame và sơ đồ number bond. Bài toán lời: Kelly có 8 bút chì, Carl có 7 bút chì.",
      "Ở nhà: dùng khay trứng 10 ô, đặt 8 viên bi, thêm 7 viên — con lấp đầy khay trước rồi đếm phần thừa.",
      REAL_LIFE_U4,
    ],
    skills: [["EMATH.OA.MAKE_TEN", 1]],
  },
];

// tr.52–97 (chủ dự án gửi 18/09/2026): hai bài cuối Unit 4, Unit 5 và Unit 6
L.push(...MORE);

const units = [];
for (const l of L) {
  const lesson = {
    code: l.code,
    subject: "EMATH",
    title: l.title,
    ...(l.bookLabel ? { bookLabel: l.bookLabel } : {}),
    book: { ...BOOK, file: fileFor(l.pages[0]), pageFrom: l.pages[0], pageTo: l.pages[1] },
    periods: 2,
    weekFrom: l.weeks[0],
    weekTo: l.weeks[1],
    objectives: l.objectives,
    vocabulary: l.vocabulary,
    concepts: l.concepts,
    sampleTasks: l.tasks.map(([text, answer, type]) => ({ text, answer, type })),
    answerKeyNotes: l.answerKey,
    contentText: `${l.text.join("\n\n")}\n\n${WEEK_NOTE}`,
    skills: l.skills.map(([code, weight]) => ({ code, weight })),
    source: { extractedBy: "claude-code", at: "2026-09-17", verified: true },
  };
  mkdirSync("content/lessons/emath", { recursive: true });
  writeFileSync(
    `content/lessons/emath/${l.code}.json`,
    `${JSON.stringify(lesson, null, 2)}\n`,
    "utf8",
  );
  units.push({
    code: l.code,
    // same string the lesson importer builds, so the seed and the importer never fight over it
    title: l.bookLabel ? `${l.bookLabel} · ${l.title}` : l.title,
    kind: "LESSON",
    pageFrom: l.pages[0],
    pageTo: l.pages[1],
    periods: 2,
    weekFrom: l.weeks[0],
    weekTo: l.weeks[1],
    topic: l.topic,
    skills: l.skills.map(([code, weight]) => ({ code, weight })),
  });
}

writeFileSync(
  "content/lessons/emath/EDI-MN1.units.json",
  `${JSON.stringify(
    {
      $schema: "../lesson-units.schema.json",
      material: {
        title: BOOK.name,
        subject: "EMATH",
        kind: "TEXTBOOK",
        term: 1,
        file: BOOK.file,
        pageCount: 97,
        publisher: "Edison Schools (tài liệu nội bộ)",
      },
      source:
        "docs/giao-trinh/EDI-MN1-vol1-phan-tich.md — bản scan sách tr.1–51 (17/09/2026). Lesson 4-6/4-7 (tr.52–57), Unit 5–6 chưa có ảnh. Tuần là ước: 2 bài/tuần, bắt đầu tuần 4.",
      units,
    },
    null,
    2,
  )}\n`,
  "utf8",
);
console.log(`${L.length} lessons + EDI-MN1.units.json`);
