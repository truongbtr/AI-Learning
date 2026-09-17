/**
 * Pha 13b — 11 bài còn lại của MATH NOTES Grade 1 · Volume 1: hai bài cuối Unit 4, Unit 5
 * (Subtraction within 20) và Unit 6 (2D Shapes). Số liệu đọc từ bản scan tr.52–97 chủ dự án gửi
 * 18/09/2026 (`sach giao khoa/03-edison-math-notes-g1-vol1-tr52-97.pdf`).
 *
 * Dùng chung bộ sinh với 14 bài đầu: `emath-mn1-lessons.mjs` nối mảng này vào cuối.
 *
 * Tuần tiếp theo nhịp 2 bài/tuần của lớp 1B3 (tuần 4 = trang 28): Unit 4 xong tuần 9, Unit 5 tuần
 * 10–12, Unit 6 tuần 13–14.
 */

const REAL_LIFE_U4 =
  'Toán trong đời sống (sách tr.58): "I eat 8 grapes and then 8 more" (8 + 8), "We put 4 apples and 3 bananas in the cart" (4 + 3); cùng con đếm ghế và bàn trong nhà rồi viết phép cộng tổng số.';
const REAL_LIFE_U5 =
  'Toán trong đời sống (sách tr.78): "I had 10 crayons. I lost 2" (10 − 2); chia bánh 8 miếng; con kể một chuyện "bớt đi" rồi viết phép trừ.';
const REAL_LIFE_U6 =
  "Toán trong đời sống (sách tr.95): tìm hình quanh nhà — đĩa tròn, đồng hồ, thanh sô cô la, biển báo tam giác, khung ảnh, thước; con vẽ và gọi tên 3 hình tìm được.";
const TIPS_U5 =
  "Mẹo của sách cho Unit 5 (tr.62): đọc chậm và lấy số lớn trừ số bé (14 − 6, không phải 6 − 14); đếm lùi từ số lớn bằng ngón tay; trên tia số thì nhảy sang trái; thử lại bằng cách cộng (12 − 5 = 7 vì 7 + 5 = 12).";
const TIPS_U6 =
  "Mẹo của sách cho Unit 6 (tr.82): nhìn cạnh và đỉnh (tam giác có 3 cạnh, 3 đỉnh); to nhỏ hay màu gì cũng không đổi tên hình; nghĩ như xếp hình — ghép các mảnh thành hình mới.";

export const MORE = [
  // ── Unit 4 — hai bài cuối ───────────────────────────────────────────────────────────────────
  {
    code: "EDI-MN1-U4-L6",
    bookLabel: "Lesson 4-7",
    title: "Use Properties to Add",
    pages: [52, 54],
    weeks: [8, 8],
    topic: "Unit 4. Addition within 20",
    objectives: [
      "Hiểu đổi chỗ hai số hạng thì tổng không đổi (7 + 4 = 4 + 7).",
      "Tìm phép cộng có cùng tổng với một phép cho trước.",
      "Nhận ra phép cộng chỉ đổi chỗ số hạng, khác với phép đổi luôn con số.",
    ],
    vocabulary: ["addend", "sum", "order", "same sum", "properties"],
    concepts: ["đổi chỗ số hạng", "cùng tổng", "kiểm tra bằng tia số"],
    tasks: [
      ["Try This First: Which is the same as 3 + 5: 5 + 3 or 5 + 4?", "5 + 3", "try this first"],
      [
        "Exit Ticket 1: Which gives the same sum as 7 + 9? A 7 + 10 · B 10 + 3 · C 9 + 7 · D 3 + 7",
        "C",
        "exit ticket",
      ],
      [
        "Exit Ticket 2: Ken has 5 pens. Sam has 8 pens. Complete the equations. 5 + __ = __ pens; 8 + __ = __ pens",
        "5 + 8 = 13; 8 + 5 = 13",
        "exit ticket",
      ],
      [
        "Exit Ticket 3: Does the equation have the same sum as 8 + 2? (2 + 8 · 10 + 2 · 8 + 10)",
        "Yes · No · No",
        "exit ticket",
      ],
      [
        "Exit Ticket 4: Write an addition problem that gives the same sum as 7 + 4 using the same addends.",
        "4 + 7 = 11",
        "exit ticket",
      ],
    ],
    answerKey:
      "Tr.52: 7 + 4 = 11 và 4 + 7 = 11 trên tia số — đổi chỗ số hạng, tổng giữ nguyên. Tr.53: C; 5 + 8 = 13 và 8 + 5 = 13; Yes/No/No; 4 + 7 = 11. Tr.54: 8 + 1 = 1 + 8 = 9; 5 + 7 = 7 + 5 = 12; 4 + 6 = 6 + 4 = 10; 9 + 8 = 8 + 9 = 17; cùng tổng với 7 + 2 là C (2 + 7); cùng tổng với 3 + 9 là B (9 + 3); 6 + 7 = 7 + 6 = 13.",
    text: [
      "Đầu trang in 'Lesson 4-7'. Con học tính chất giao hoán: 7 + 4 và 4 + 7 cùng bằng 11 — đổi chỗ hai số hạng thì tổng không đổi, nên khi cộng con được phép bắt đầu từ số lớn hơn.",
      "Ở nhà: đặt 7 viên kẹo bên trái, 4 bên phải rồi đổi chỗ hai đĩa — hỏi con tổng có đổi không.",
      REAL_LIFE_U4,
    ],
    skills: [
      ["EMATH.OA.PROPERTIES_COMMUTATIVE", 1],
      ["EMATH.OA.ADD_WITHIN_20", 0.5],
    ],
  },
  {
    code: "EDI-MN1-U4-L7",
    bookLabel: "Lesson 4-8",
    title: "Add Three Numbers",
    pages: [55, 57],
    weeks: [9, 9],
    topic: "Unit 4. Addition within 20",
    objectives: [
      "Cộng ba số bằng cách chọn cặp dễ cộng trước (thường là cặp làm tròn 10).",
      "Hiểu cộng ba số theo thứ tự nào cũng ra cùng một tổng.",
      "Đọc số chấm trên ba thẻ rồi viết phép cộng ba số.",
    ],
    vocabulary: ["three addends", "in any order", "group", "sum", "dot cards"],
    concepts: ["cộng ba số", "chọn cặp dễ trước", "thứ tự không đổi tổng"],
    tasks: [
      ["Try This First: What is 2 + 3 + 8?", "13", "try this first"],
      ["Exit Ticket 1: What is the sum? 3 + 1 + 4 = __", "8", "exit ticket"],
      [
        "Exit Ticket 2: Which equation has the same value as 7 + 3 + 6? A 9 + 7 + 3 · B 6 + 10 + 3 · C 3 + 6 + 7 · D 13 + 3 + 1",
        "C",
        "exit ticket",
      ],
      [
        "Exit Ticket 3: Maya flips over 3 dot cards (2, 6, 5 dots). Fill in the numbers. 2 + __ + 5 = __",
        "2 + 6 + 5 = 13",
        "exit ticket",
      ],
    ],
    answerKey:
      "Tr.55: 4 + 6 + 4 = 6 + 4 + 4 = 4 + 4 + 6 = 14 trên ba tia số — 'The sum is the same'. Tr.56: 3 + 1 + 4 = 8; C (3 + 6 + 7 = 16); thẻ chấm 2, 6, 5 → 2 + 6 + 5 = 13. Tr.57: 5 + 1 + 5 = 11; 4 + 2 + 4 = 10; 3 + 5 + 2 = 10; 7 + 3 + 8 = 18; 9 + 4 + 1 = 14; 7 + 5 + 5 = 17.",
    text: [
      "Đầu trang in 'Lesson 4-8'. Con cộng ba số: tìm cặp dễ cộng trước — ví dụ 7 + 3 + 8 thì lấy 7 + 3 = 10 rồi 10 + 8 = 18. Sách cho thấy đổi thứ tự ba số vẫn ra cùng một tổng.",
      "Ở nhà: tung ba quân xúc xắc, con tìm cặp làm tròn 10 trước rồi cộng nốt.",
      REAL_LIFE_U4,
    ],
    skills: [
      ["EMATH.OA.THREE_ADDENDS", 1],
      ["EMATH.OA.ADD_WITHIN_20", 0.5],
    ],
  },
  // ── Unit 5 — Subtraction within 20 ──────────────────────────────────────────────────────────
  {
    code: "EDI-MN1-U5-L1",
    bookLabel: "Lesson 5-1",
    title: "Relate Counting to Subtraction",
    pages: [63, 65],
    weeks: [10, 10],
    topic: "Unit 5. Subtraction within 20",
    objectives: [
      "Hiểu trừ là bớt đi rồi đếm phần còn lại.",
      "Viết phép trừ khớp với tranh có vật bị gạch đi.",
      "Giải bài toán lời 'some … away. How many are left?'.",
    ],
    vocabulary: ["subtract", "minus", "difference", "take away", "how many are left", "count back"],
    concepts: ["bớt rồi đếm phần còn lại", "phép trừ khớp tranh", "tổng − phần bớt = phần còn lại"],
    tasks: [
      ["Try This First: What is 9 − 2?", "7", "try this first"],
      [
        "Exit Ticket 1: Bea sees some ducks. Some swim away. How many ducks are left? 7 − 3 = __",
        "4",
        "exit ticket",
      ],
      [
        "Exit Ticket 2: What equation matches the picture? __ − __ = 9",
        "12 − 3 = 9",
        "exit ticket",
      ],
      [
        "Exit Ticket 3: Which equation matches the picture? A 8 − 3 = 5 · B 8 − 3 = 11 · C 11 − 3 = 8 · D 5 − 3 = 8",
        "C",
        "exit ticket",
      ],
    ],
    answerKey:
      "Tr.63: 7 con chim trên cây, 2 con bay đi → 7 − 2 = 5 ('count back from the total to find the difference'). Tr.64: 7 − 3 = 4; 12 − 3 = 9; C (11 − 3 = 8). Tr.65: 4 − 4 = 0 (cả 4 con cáo bị gạch); 8 − 4 = 4 (bọ rùa trên lá); 10 − 2 = 8 foxes; 8 − 2 = 6 turtles.",
    text: [
      "Mở đầu Unit 5 (Subtraction within 20). Con hiểu phép trừ là bớt đi rồi đếm phần còn lại: 7 con chim đậu trên cây, 2 con bay đi, còn 7 − 2 = 5. Sách dùng tranh có vật bị gạch chéo để con viết phép trừ.",
      "Ở nhà: bày 9 viên kẹo, cất đi 2 viên và hỏi 'How many are left?'.",
      TIPS_U5,
    ],
    skills: [
      ["EMATH.OA.SUB_WITHIN_20", 1],
      ["EMATH.OA.SUB_WITHIN_10", 0.5],
    ],
  },
  {
    code: "EDI-MN1-U5-L2",
    bookLabel: null,
    title: "Subtraction within 10 (number box)",
    pages: [66, 68],
    weeks: [10, 10],
    topic: "Unit 5. Subtraction within 20",
    objectives: [
      "Dùng bảng số 1–10 (number box) để đếm lùi khi trừ.",
      "Trừ thành thạo trong phạm vi 10.",
      "Trừ với 0 và trừ hết (5 − 5 = 0, 9 − 0 = 9).",
    ],
    vocabulary: ["number box", "count back", "subtract", "difference", "minus"],
    concepts: ["đếm lùi trên bảng số 1–10", "bảng trừ trong 10", "trừ 0 và trừ hết"],
    tasks: [
      ["Try This First: What is 9 − 5?", "4", "try this first"],
      [
        "Exit Ticket: Do the subtraction problems. Then color the picture. (5 − 3 · 3 − 1 · 10 − 5 · 10 − 8 · 8 − 6 · 9 − 5 · 4 − 1 · 10 − 1 · 9 − 6 · 9 − 3)",
        "2 · 2 · 5 · 2 · 2 · 4 · 3 · 9 · 3 · 6",
        "exit ticket",
      ],
    ],
    answerKey:
      "Tr.66: 7 − 3 trên number box 1–10: bắt đầu ở 7, lùi 3 bước, dừng ở 4. Tr.67 (tô màu theo kết quả): 5 − 3 = 2, 3 − 1 = 2, 10 − 5 = 5, 10 − 8 = 2, 8 − 6 = 2, 9 − 5 = 4, 4 − 1 = 3, 10 − 1 = 9, 9 − 6 = 3, 9 − 3 = 6. Tr.68: 9 − 5 = 4, 6 − 4 = 2, 9 − 0 = 9, 8 − 1 = 7, 5 − 4 = 1, 5 − 2 = 3, 10 − 2 = 8, 5 − 5 = 0, 4 − 1 = 3, 7 − 2 = 5, 6 − 4 = 2, 9 − 2 = 7, 10 − 3 = 7, 2 − 1 = 1.",
    text: [
      "Bài này đầu trang không in số (trang giới thiệu Unit 5 gọi là 'subtract within 10 using number box'). Con đặt ngón tay vào số lớn trên bảng số 1–10 rồi lùi từng bước: 7 − 3 là lùi 3 bước tới 4.",
      "Ở nhà: viết dãy số 1–10 lên giấy, con vừa lùi ngón tay vừa đọc to.",
      TIPS_U5,
    ],
    skills: [
      ["EMATH.OA.SUB_WITHIN_10", 1],
      ["EMATH.OA.COUNT_BACK", 0.5],
    ],
  },
  {
    code: "EDI-MN1-U5-L3",
    bookLabel: "Lesson 5-2",
    title: "Count Back to Subtract",
    pages: [69, 71],
    weeks: [11, 11],
    topic: "Unit 5. Subtraction within 20",
    objectives: [
      "Trừ bằng cách đếm lùi trên tia số tới 20.",
      "Vẽ đúng số bước nhảy lùi cho một phép trừ.",
      "Không đếm cả số bắt đầu khi lùi.",
    ],
    vocabulary: ["count back", "number line", "jumps", "difference", "start at", "stop at"],
    concepts: ["đếm lùi trên tia số", "mỗi bước lùi là bớt 1", "12 − 5 = 7"],
    tasks: [
      ["Try This First: What is 18 − 9?", "9", "try this first"],
      [
        "Exit Ticket 1: Magda is subtracting 14 − 5. She places a dot at 14. Draw the jumps. What is the difference? A 10 · B 9 · C 8 · D 7",
        "B (14 − 5 = 9)",
        "exit ticket",
      ],
      ["Exit Ticket 2: 13 − 10 = __", "3", "exit ticket"],
      [
        "Exit Ticket 3: What is the difference of 17 − 9? A 6 · B 7 · C 8 · D 9",
        "C",
        "exit ticket",
      ],
    ],
    answerKey:
      "Tr.69: 12 − 5 — bắt đầu ở 12, đếm lùi 5, dừng ở 7. Tr.70: B (14 − 5 = 9); 13 − 10 = 3; C (17 − 9 = 8). Tr.71: 8 − 2 = 6; 13 − 6 = 7; 11 − 3 = 8; 16 − 7 = 9.",
    text: [
      "Đầu trang in 'Lesson 5-2'. Con đặt chấm ở số lớn rồi nhảy lùi trên tia số: 12 − 5 là nhảy 5 bước về 7. Lỗi hay gặp là đếm cả số đứng đầu nên ra thừa một.",
      "Ở nhà: dán tia số 0–20 xuống sàn, con bước lùi đúng số bước rồi đọc kết quả.",
      TIPS_U5,
    ],
    skills: [
      ["EMATH.OA.COUNT_BACK", 1],
      ["EMATH.OA.SUB_WITHIN_20", 0.5],
    ],
  },
  {
    code: "EDI-MN1-U5-L4",
    bookLabel: "Lesson 5-3",
    title: "Count On to Subtract",
    pages: [72, 74],
    weeks: [11, 11],
    topic: "Unit 5. Subtraction within 20",
    objectives: [
      "Trừ bằng cách bắt đầu từ số bé và đếm tiến tới số lớn.",
      "Hiểu hiệu là khoảng cách giữa hai số trên tia số.",
      "Chọn cách đếm tiến khi hai số gần nhau (15 − 9).",
    ],
    vocabulary: ["count on", "difference", "how far apart", "number line", "start with"],
    concepts: ["đếm tiến để trừ", "hiệu = số bước từ số bé tới số lớn", "15 − 9 = 6"],
    tasks: [
      ["Try This First: What is 17 − 5?", "12", "try this first"],
      [
        "Exit Ticket 1: How can you count on to subtract 9 − 4? What is the difference? A 13 · B 11 · C 5 · D 4",
        "C (5 bước từ 4 tới 9)",
        "exit ticket",
      ],
      ["Exit Ticket 2: 13 − 7 = __", "6", "exit ticket"],
      ["Exit Ticket 3: 14 − 9 = __", "5", "exit ticket"],
    ],
    answerKey:
      "Tr.72: 15 − 9 — bắt đầu ở 9, đếm tiến 6 bước tới 15, hiệu là 6. Tr.73: C (9 − 4 = 5); 13 − 7 = 6; 14 − 9 = 5. Tr.74: 11 − 5 = 6; 15 − 8 = 7; 18 − 8 = 10; Malik có 12 vỏ sò, cho em 5 → còn 7.",
    text: [
      "Đầu trang in 'Lesson 5-3'. Đây là cách trừ thứ hai: đứng ở số bé rồi đếm tiến tới số lớn, đếm được mấy bước thì đó là hiệu — 15 − 9 chỉ mất 6 bước, nhanh hơn lùi 9 bước.",
      "Ở nhà: hỏi 'từ 9 lên 15 phải đi mấy bước?' rồi cùng con đếm trên tia số.",
      TIPS_U5,
    ],
    skills: [
      ["EMATH.OA.COUNT_ON_SUBTRACT", 1],
      ["EMATH.OA.SUB_WITHIN_20", 0.5],
    ],
  },
  {
    code: "EDI-MN1-U5-L5",
    bookLabel: "Lesson 5-4",
    title: "Make a 10 to Subtract",
    pages: [75, 77],
    weeks: [12, 12],
    topic: "Unit 5. Subtraction within 20",
    objectives: [
      "Trừ qua 10 bằng cách bớt về 10 trước rồi bớt phần còn lại.",
      "Tách số trừ bằng number bond (13 − 5: tách 5 thành 3 và 2).",
      "Đọc phép trừ từ hai ten-frame có chấm bị gạch.",
    ],
    vocabulary: ["make a 10", "number bond", "ten-frame", "difference", "subtract"],
    concepts: ["bớt về 10 trước", "tách số trừ thành hai phần", "13 − 5 = 10 − 2 = 8"],
    tasks: [
      ["Try This First: What is 14 − 9?", "5", "try this first"],
      [
        "Exit Ticket 1: Which equation does the ten-frame show? A 10 − 2 = 8 · B 10 − 7 = 3 · C 12 − 6 = 6 · D 12 − 7 = 5",
        "D (ảnh scan hơi mờ, cần kiểm lại khi có sách)",
        "exit ticket",
      ],
      [
        "Exit Ticket 2: How can you make a 10 to subtract? Write the difference. 15 − 6 = __",
        "9 (15 − 5 = 10, 10 − 1 = 9)",
        "exit ticket",
      ],
    ],
    answerKey:
      "Tr.75: 13 − 5 — number bond tách 5 thành 3 và 2; 13 − 3 = 10 rồi 10 − 2 = 8. Tr.76: D (12 − 7 = 5, ảnh mờ); 15 − 6 = 9. Tr.77: 11 − 6 = 5; 13 − 7 = 6; 16 − 8 = 8; 14 − 5 = 9; 18 − 9 = 9; 15 − 7 = 8.",
    text: [
      "Đầu trang in 'Lesson 5-4'. Cách trừ thứ ba: bớt về 10 cho tròn rồi bớt nốt phần còn lại. Với 13 − 5, con tách 5 thành 3 và 2: 13 − 3 = 10, rồi 10 − 2 = 8. Đây là phép trừ soi gương của 'make a 10 to add' ở Unit 4.",
      "Ở nhà: dùng khay trứng 10 ô và vài viên bi để con bớt về đúng 10 trước.",
      REAL_LIFE_U5,
    ],
    skills: [
      ["EMATH.OA.MAKE_TEN_SUBTRACT", 1],
      ["EMATH.OA.SUB_WITHIN_20", 0.5],
    ],
  },
  // ── Unit 6 — 2D Shapes ──────────────────────────────────────────────────────────────────────
  {
    code: "EDI-MN1-U6-L1",
    bookLabel: "Lesson 6-1",
    title: "Understand Defining Attributes of Shapes",
    pages: [83, 85],
    weeks: [13, 13],
    topic: "Unit 6. 2D Shapes",
    objectives: [
      "Gọi tên dấu hiệu nhận biết hình: cạnh thẳng, đỉnh, hình khép kín.",
      "Đếm số cạnh và số đỉnh của hình phẳng.",
      "Phân biệt hình khép kín và hình hở.",
    ],
    vocabulary: [
      "attributes",
      "defining attributes",
      "straight side",
      "vertex",
      "vertices",
      "closed shape",
      "2-D shape",
    ],
    concepts: ["cạnh thẳng và đỉnh", "hình khép kín, không có khe hở", "đếm cạnh và đỉnh"],
    tasks: [
      ["Try This First: How many sides does a triangle have?", "3", "try this first"],
      [
        "Exit Ticket 1: Is the shape closed? Match each shape to closed shape or not closed shape.",
        "tứ giác, ngũ giác, hình thoi: closed; hình hở: not closed",
        "exit ticket",
      ],
      [
        "Exit Ticket 2: Which shapes have 4 vertices? Choose all. A rhombus · B triangle · C trapezoid · D pentagon",
        "A và C",
        "exit ticket",
      ],
      [
        "Exit Ticket 3: How many sides and vertices does the shape have? (square, rectangle)",
        "4 cạnh 4 đỉnh cho cả hai",
        "exit ticket",
      ],
    ],
    answerKey:
      "Tr.83: 'Vertices and straight sides are defining attributes' — cạnh thẳng, đỉnh, không có khe hở. Tr.84: hình hở → not closed, ba hình còn lại closed; 4 đỉnh: A (rhombus) và C (trapezoid); square 4/4, rectangle 4/4. Tr.85 (bảng Look, count and write): triangle 3/3, circle 0/0, square 4/4, rectangle 4/4, pentagon 5/5, hexagon 6/6, oval 0/0, rhombus 4/4, trapezoid 4/4.",
    text: [
      "Mở đầu Unit 6 (2D Shapes). Con học ba dấu hiệu để nhận ra hình: cạnh thẳng, đỉnh (vertex) và hình phải khép kín, không hở. Sau đó đếm cạnh và đỉnh của tam giác, vuông, chữ nhật, ngũ giác, lục giác, hình thoi, hình thang.",
      "Ở nhà: cùng con sờ theo cạnh và chạm vào từng đỉnh của một viên gạch lót sàn hay quyển sách rồi đếm to.",
      TIPS_U6,
    ],
    skills: [
      ["EMATH.G.SHAPE_ATTRIBUTES", 1],
      ["EMATH.G.NAME_2D_SHAPES", 0.5],
    ],
  },
  {
    code: "EDI-MN1-U6-L2",
    bookLabel: "Lesson 6-2",
    title: "Understand Non-Defining Attributes",
    pages: [86, 88],
    weeks: [13, 13],
    topic: "Unit 6. 2D Shapes",
    objectives: [
      "Hiểu màu sắc, kích thước và hướng đặt không làm đổi tên hình.",
      "Nhận ra hình dù to nhỏ, xoay nghiêng vẫn là hình đó.",
      "Nối đồ vật đời thường với hình tương ứng.",
    ],
    vocabulary: ["non-defining attributes", "color", "size", "position", "still a square"],
    concepts: ["màu và cỡ không đổi tên hình", "hình xoay vẫn là hình đó", "hình trong đồ vật"],
    tasks: [
      ["Try This First: Is a red square still a square?", "Yes", "try this first"],
      [
        "Exit Ticket 1: Which shapes are rectangles? (A hình có cạnh cong · B hình chữ nhật cao · C tam giác · D đa giác 7 cạnh)",
        "B",
        "exit ticket",
      ],
      [
        "Exit Ticket 2: Use the shapes to answer. How many are circles? How many have 6 vertices? How many have 3 sides?",
        "3 · 1 · 2",
        "exit ticket",
      ],
      ["Exit Ticket 3: Draw a circle.", "vẽ một hình tròn", "exit ticket"],
    ],
    answerKey:
      "Tr.86: 'Color and size are non-defining attributes' — sáu tam giác khác màu, khác cỡ vẫn đều là tam giác. Tr.87: B; 3 hình tròn, 1 hình có 6 đỉnh (lục giác), 2 hình có 3 cạnh; vẽ hình tròn. Tr.88 (nối 15 đồ vật với hình): thước → chữ nhật, đồng xu → tròn, bánh mì tam giác → tam giác, thanh sô cô la → chữ nhật, miếng pizza → tam giác, mũ sinh nhật → tam giác, cục tẩy → chữ nhật, khung ảnh → vuông, kẻng tam giác → tam giác, phong bì → chữ nhật, cúc áo → tròn, quả bóng → tròn, gối vuông → vuông.",
    text: [
      "Đầu trang in 'Lesson 6-2'. Con học điều ngược lại của bài trước: màu sắc, kích thước, hướng đặt là những thứ *không* quyết định tên hình — hình vuông màu đỏ hay xanh, to hay nhỏ thì vẫn là hình vuông.",
      "Ở nhà: tìm hai đồ vật cùng hình nhưng khác cỡ (đĩa và nắp chai) rồi hỏi con chúng là hình gì.",
      TIPS_U6,
    ],
    skills: [
      ["EMATH.G.NON_DEFINING_ATTRS", 1],
      ["EMATH.G.NAME_2D_SHAPES", 0.5],
    ],
  },
  {
    code: "EDI-MN1-U6-L3",
    bookLabel: "Lesson 6-3",
    title: "Compose Shapes",
    pages: [89, 91],
    weeks: [14, 14],
    topic: "Unit 6. 2D Shapes",
    objectives: [
      "Ghép hai hình phẳng thành một hình mới.",
      "Biết hai nửa hình tròn ghép lại thành hình tròn, hai tam giác thành hình chữ nhật.",
      "Chia một hình thành các hình nhỏ bằng cách kẻ thêm đường.",
    ],
    vocabulary: ["compose", "put together", "new shape", "half-circle", "hexagon", "trapezoid"],
    concepts: ["ghép hình", "2 tam giác thành chữ nhật", "2 nửa tròn thành hình tròn"],
    tasks: [
      ["Try This First: How many triangles can make a square?", "2", "try this first"],
      [
        "Exit Ticket 1: How can you use the shapes to make a new shape? Choose all the correct answers.",
        "cả bốn cặp đều ghép được",
        "exit ticket",
      ],
      [
        "Exit Ticket 2: Which shape can you make by putting these two shapes together? (hai nửa hình tròn) A circle · B rectangle · C square · D triangle",
        "A",
        "exit ticket",
      ],
    ],
    answerKey:
      "Tr.89: 2 hình vuông ghép thành chữ nhật; 2 tam giác thành chữ nhật; chữ nhật + hình thang thành lục giác. Tr.90: chọn tất cả các cặp ghép được; A (hai nửa hình tròn ghép thành hình tròn). Tr.91: kẻ đường chia hình thang và lục giác; ghép tam giác + hình bình hành + tam giác, và nửa tròn + lục giác + vuông thành hình mới (bài vẽ mở).",
    text: [
      "Đầu trang in 'Lesson 6-3'. Con ghép hình như xếp hình: hai hình vuông thành một chữ nhật, hai tam giác thành một chữ nhật, hai nửa hình tròn thành một hình tròn.",
      "Ở nhà: cắt vài mảnh giấy hình tam giác, vuông, nửa tròn cho con ghép thử và gọi tên hình mới.",
      TIPS_U6,
    ],
    skills: [["EMATH.G.COMPOSE_SHAPES", 1]],
  },
  {
    code: "EDI-MN1-U6-L4",
    bookLabel: "Lesson 6-4",
    title: "Build New Shapes",
    pages: [92, 94],
    weeks: [14, 14],
    topic: "Unit 6. 2D Shapes",
    objectives: [
      "Tách một hình thành các mảnh rồi xếp lại thành hình khác.",
      "Nhận ra hai hình trông khác nhau nhưng làm từ cùng những mảnh.",
      "Dùng các mảnh của một hình để dựng hình được yêu cầu.",
    ],
    vocabulary: ["take apart", "parts", "build", "same parts", "new shape"],
    concepts: ["tách hình thành mảnh", "cùng mảnh, khác hình", "dựng hình từ mảnh"],
    tasks: [
      [
        "Try This First: What shape do 2 triangles make?",
        "hình chữ nhật (hoặc tam giác lớn hơn)",
        "try this first",
      ],
      [
        "Exit Ticket 1: Can you make the pair of shapes from the same parts? Choose Yes or No for each pair.",
        "cặp 1: No · cặp 2: Yes",
        "exit ticket",
      ],
      [
        "Exit Ticket 2: How can you use the parts of this shape to make a triangle? Draw to show your thinking.",
        "xếp hai mảnh tam giác thành một tam giác lớn",
        "exit ticket",
      ],
    ],
    answerKey:
      "Tr.92: một tam giác lớn gồm 4 tam giác nhỏ — tách ra rồi xếp thành dải hình mới, 'They look different, but they have the same parts'. Tr.93: cặp 1 No, cặp 2 Yes; bài vẽ mở. Tr.94: cặp tam giác Yes; cặp hình viên thuốc Yes; hai bài vẽ mở.",
    text: [
      "Đầu trang in 'Lesson 6-4'. Con tách một hình thành các mảnh rồi xếp thành hình khác — vẫn từng ấy mảnh nhưng hình trông khác hẳn. Đây là bài cuối của quyển 1.",
      "Ở nhà: dùng bộ xếp hình tangram (hoặc giấy cắt 7 mảnh) cho con xếp con thỏ, ngôi nhà như trang tự đánh giá cuối sách.",
      REAL_LIFE_U6,
    ],
    skills: [
      ["EMATH.G.DECOMPOSE_SHAPES", 1],
      ["EMATH.G.COMPOSE_SHAPES", 0.5],
    ],
  },
];
