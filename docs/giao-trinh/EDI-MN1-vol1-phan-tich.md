# MATH NOTES Grade 1 · Volume 1 (EDI-MN1) — phân tích từng bài để dựng bài học

> Hai bản scan chủ dự án gửi (sách của Chí Thanh, lớp 1B3): tr.1–51 ngày 17/09/2026
> (`sach giao khoa/02-edison-math-notes-g1-vol1-tr1-51.pdf`, **trang PDF = trang sách + 1**) và tr.52–97 ngày
> 18/09/2026 (`…/03-edison-math-notes-g1-vol1-tr52-97.pdf`, **ảnh không theo thứ tự trang** — mục 5–7 dưới đây ghi
> theo số trang in trên sách). Cả quyển **97 trang**, đã đọc hết; mục 1–4 là phần tr.1–51, mục 5–7 là phần còn lại.

## 0. Phát hiện quan trọng so với `docs/09` §1c

1. **Volume 1 không chỉ có Unit 3–4.** Mục lục trang 2 có **Unit 5** (tr.61–80: Lesson 5-1, *Subtraction within
   10*, 5-2, 5-3, 5-4, Math in Real Life, Self-Reflection) và **Unit 6** (tr.81–97: Lesson 6-1…6-4, Math in Real
   Life, Self-Reflection). Quyển dài 97 trang, không phải 60.
2. **Tên bài trong mục lục/đầu trang lệch số với trang "Unit Introduction".** Đầu trang và mục lục đánh 3-2, 3-3,
   3-6, 3-7, 3-8; trang giới thiệu Unit 3 đánh 3-1…3-9. Unit 4 cũng vậy. Bảng dưới ghi **cả hai**; mã bài của ta
   theo **thứ tự trong trang giới thiệu** (liền mạch 1…9), còn `bookLabel` giữ số in trên đầu trang để khớp khi cô
   giáo nói "Lesson 3-6".
3. "Patterns on a Number Chart / Number Line" là **quy luật đếm** (hàng, cột, đếm tới/lui, số còn thiếu) —
   **không phải** quy luật lặp AB/ABB. `EMATH.G.PATTERNS` không gắn với sách này.
4. Nhịp trường **nhanh hơn nhiều** so với `expectedWeek` hiện tại: chục–đơn vị (`TENS_ONES` tuần 20,
   `PLACE_VALUE_MODELS` tuần 21), so sánh với dấu (`COMPARE_TWO_DIGIT` tuần 22), make ten (tuần 13), doubles
   (tuần 10) đều nằm trong Unit 3–4 — tức là **học kỳ 1, khoảng tháng 9–10**. Hai kỹ năng `TENS_ONES` và
   `PLACE_VALUE_MODELS` hiện có **0 bài luyện**.
5. Trường dạy bằng **mô hình trực quan** ở mọi bài: ten-frame, khối lập phương/que chục, chuỗi hạt, tia số có bước
   nhảy, sơ đồ number bond, bàn tính, xúc xắc chấm. Bài luyện của ta nên cho con **nhìn đúng mô hình đó**.
6. Mỗi bài có cấu trúc cố định: *Why does this matter? · Big Idea · Try This First! · khung mẫu · QR video/online*
   → **Exit Ticket** (3–4 câu + "Reflect On Your Learning" 3 mặt trời) → **Additional Practice**. Cuối unit:
   **Math in Real Life** (việc làm ở nhà) và **Student Self-Reflection** (tự đánh giá bằng 3 mặt trời).

## 1. Unit 3 — Numbers to 20 (tr.3–34)

Từ vựng unit (tr.3): ten-frame, group of ten, teen numbers, number chart, number line, ten, one, greater than,
less than, equal to. Learning Tips (tr.4): đếm đồ thật (12 cây bút), nói to khi đếm, *teen numbers 11–19 = 1 ten
và 1–9 ones (13 = 10 + 3)*, **"Alligator eats the bigger number!"** cho dấu < > (15 > 12).

| Mã đề xuất | Đầu trang / giới thiệu | Tên bài | Trang | Kỹ năng `EMATH.*` |
|---|---|---|---|---|
| `EDI-MN1-U3-L1` | — / 3-1 | Numbers 1 to 10 | 5–7 | `NBT.COUNT_TO_20` (1–10), `MP.MATH_VOCAB_EN` (one…ten) |
| `EDI-MN1-U3-L2` | — / 3-2 | Numbers 11 to 19 (mục lục ghi "11 to 20") | 8–10 | **mới** `NBT.TEEN_NUMBERS` |
| `EDI-MN1-U3-L3` | — / 3-3 | Patterns on a Number Chart to 20 | 11–13 | **mới** `NBT.NUMBER_CHART_20` |
| `EDI-MN1-U3-L4` | — / 3-4 | Patterns on a Number Line to 20 | 14–16 | `NBT.NUMBER_LINE_TO_20` |
| `EDI-MN1-U3-L5` | 3-2 / 3-5 | Understand Tens | 17–19 | `NBT.TENS_ONES` |
| `EDI-MN1-U3-L6` | 3-3 / 3-6 | Represent Tens and Ones | 20–22 | `NBT.PLACE_VALUE_MODELS` |
| `EDI-MN1-U3-L7` | 3-6 / 3-7 | Compare Numbers | 23–25 | **mới** `NBT.COMPARE_TO_20` |
| `EDI-MN1-U3-L8` | 3-7 / 3-8 | Compare Numbers on a Number Line | 26–28 | `NBT.COMPARE_TO_20`, `NBT.NUMBER_LINE_TO_20` |
| `EDI-MN1-U3-L9` | 3-8 / 3-9 | Use Symbols to Compare Numbers | 29–31 | `NBT.COMPARE_TO_20` |
| (không phải bài) | — | Math in Real Life | 32 | ghi vào `contentText` cho ba mẹ |
| (không phải bài) | — | Student Self-Reflection | 33–34 | xem mục 8 |

### U3-L1 Numbers 1 to 10 (tr.5–7)
Big Idea: đếm đồ vật và viết số 1–10. Try This First: *How many fingers are on one hand?* (5). Khung mẫu: cột
tròn 0–10 kèm chữ Zero…Ten.
Exit Ticket (tr.6): (1) viết số — 10 ô tô, 10 gấu bông [ảnh: 2 hàng × 5 xe; 2 cột × 5 gấu → 10 và 10]; (2)
khoanh số đúng — 3 tam giác {2,3,4}, 5 ngôi sao {5,7,9}, 8 trái tim {7,8,9}; (3) vẽ 7 đồ vật.
Additional Practice (tr.7): (1) nối số với chữ và tô chữ one…ten (số trộn: 4,1,5,3,2 / 7,10,9,6,8); (2a) 4 con
ong, vẽ thêm 2 → *How many bees now?* (6); (2b) 3 con bướm, vẽ thêm 2 → 5.

### U3-L2 Numbers 11 to 19 (tr.8–10)
Why: gặp teen numbers trong trò chơi, lịch. Try This First: *What number comes after 14?* (15). Khung mẫu: 18 =
ten-frame đầy + 8 chấm, "1 group of ten, 8 ones"; bảng 11 = 10 + 1 … 19 = 10 + 9; "11–19 là teen numbers vì có 1
nhóm chục và vài đơn vị".
Exit Ticket (tr.9): (1) 2 ten-frame (10 + 4) → "__ ten and __ ones is __" (1, 4, 14); (2) *Which ten-frame shows
17?* A = 10 + 7 (đúng) · B = 10 + 9 (19) · C = 10 + 5 (15); (3) vẽ số 14 vào 2 ten-frame.
Additional Practice (tr.10): (1) 10 + 3 → 13; (2) 10 + 7 → 17; (3) vẽ "1 group of ten and 5 ones"; (4) "1 group
of ten and 1 one"; (5) **khoanh teen numbers** trong 7, 4, 12, 15, 9, 10, 17 (đáp án 12, 15, 17 — **10 không phải**
teen number: bẫy tốt cho `errorTag`).

### U3-L3 Patterns on a Number Chart to 20 (tr.11–13)
Try This First: *What number is 2 more than 13?* (15). Khung mẫu: bảng 2 hàng × 10 (1–10 / 11–20), chỉ **column**
(4 trên 14) và **row**; "A number chart helps you count".
Exit Ticket (tr.12): (1) viết 1–20 vào bảng trống; (2) điền số thiếu trong bảng 2 hàng; (3) điền số thiếu trong
mảnh bảng: [16, 17, _ / _, 10, 11] và [6, _, 8 / 18, _, 20] → học sinh dùng quan hệ **cột: số dưới = số trên + 10**.
Additional Practice (tr.13): *What numbers come next?* 14→15,16,17,18 · 10→11,12,13,14 · 8→9,10,11,12 ·
16→17,18,19,20; nối điểm 1–20 thành tranh.

### U3-L4 Patterns on a Number Line to 20 (tr.14–16)
Try This First: *What number is one step after 7?* (8). Khung mẫu: tia số 10–20 chỉ **arrow**, **mark**, **equal
space**; "Number lines can show counting patterns"; "Fill in the numbers from small to big, left to right".
Exit Ticket (tr.15): (1) *Which numbers come next?* A 8,10,12,14 · B 17,18,19,20 · C 15,14,13,12 cho tia số
10…16 ? ? ? ? (đáp án **B**; A là đếm cách 2, C là đếm lui — hai nhiễu có nghĩa); (2) *Which number line is
missing 10, 11, 12, 13?* (C); (3) điền số thiếu trên tia số chỉ ghi 6 và 13.
Additional Practice (tr.16): chọn dãy số tiếp theo (tia 3–8 → 9,10,11,12,13 = D; tia 7–12 → 13,14,15,16,17 = A);
điền số thiếu trên tia số thưa nhãn (2, 5 / 8, 12, 15 / 11); vẽ tia số từ 3 đến 14.

### U3-L5 Understand Tens (tr.17–19) — đầu trang "Lesson 3-2"
Try This First: *How many ones make a ten?* (10). Khung mẫu: 10 khối rời → thanh 10 khối; "10 ones is the same
as 1 ten"; 2 thanh → "2 tens and 0 ones is 20".
Exit Ticket (tr.18): (1) 2 thanh chục → "__ tens and __ ones is __" (2, 0, 20); YES/NO: 10 khối rời = 1 ten
(YES); 25 khối rời xếp đôi = 2 tens (**NO** — đếm ra 25, không phải 20).
Additional Practice (tr.19): khoanh nhóm 10 khối trong đám khối rời, viết "__ ones = __ ten" (10 = 1) và
"__ ones = __ tens" (20 = 2); mỗi xe buýt chở 10 bạn, 20 bạn chờ → "20 children = __ buses; 20 ones = __ tens".

### U3-L6 Represent Tens and Ones (tr.20–22) — đầu trang "Lesson 3-3"
Try This First: *How many tens are in 10?* (1). Khung mẫu: 1 thanh + 6 khối → "1 ten and 6 ones is 16".
Exit Ticket (tr.21): (1) *How can you show number 13?* A = 1 thanh + 3 khối (đúng) · B = 2 thanh + 3 · C = 1
thanh + 6 · D = thanh 9 khối + 3 (**nhiễu: thanh không đủ 10**); (2) vẽ chục và đơn vị cho 17; (3) chuỗi hạt:
vòng 10 hạt + 7 hạt rời → 1 ten, 7 ones, 17.
Additional Practice (tr.22, ảnh mờ): khoanh chục và viết số từ các nhóm hình nhỏ; ten-frame 10 + 3 và 10 + 4
(khung thứ hai kèm hàng chấm) → viết số; vẽ chục và đơn vị cho **20**.

### U3-L7 Compare Numbers (tr.23–25) — đầu trang "Lesson 3-6"
Try This First: *Which is greater: 8 or 12?* Khung mẫu: 15 (1 thanh + 5) và 18 (1 thanh + 8) → "18 is greater than
15. 15 is less than 18."
Exit Ticket (tr.24): (1) 9 khối vs 1 thanh + 2 → *Which sentence is correct?* A "9 is greater than 12" · B "12 is
greater than 9" (B); (2) *Val has 17 beads. Jean has 11 beads. Who has more?* (Val); (3) TRUE/FALSE: "11 is
greater than 12" (F), "13 is greater than 2" (T), "9 is equal to 19" (F).
Additional Practice (tr.25): khoanh cụm từ đúng (15 [is less than / is greater than / is equal to] 15 → equal;
3 … 11 → less than); điền greater/less: 19 __ than 2 (greater), 10 __ than 14 (less); vẽ chục-đơn vị cho 13 và 8
rồi khoanh quan hệ.

### U3-L8 Compare Numbers on a Number Line (tr.26–28) — đầu trang "Lesson 3-7"
Try This First: *Which number is farther to the right: 7 or 10?* Khung mẫu: tia 10–20 đánh dấu 13 và 17: "The
number to the right is greater. The number to the left is less." (nhãn LESS ← → GREATER).
Exit Ticket (tr.27): (1) tia 0–20: A "8 is greater than 14" · B "14 is greater than 8" (B); (2) tia 3–17,
TRUE/FALSE: "4 is less than 7" (T), "3 is greater than 13" (F), "8 is equal to 9" (F); (3) *Pat says that 6 is
greater than 11. Do you agree?* (No).
Additional Practice (tr.28): điền is greater than / is less than / is equal to: 8 __ 14 · 17 __ 13; khoanh số bé
hơn: 12 hay 14 · 18 hay 15; *Jake has 12 cards. Caleb has 18 cards. Who has more?* (vẽ tia số rồi so).

### U3-L9 Use Symbols to Compare Numbers (tr.29–31) — đầu trang "Lesson 3-8"
Try This First: *Which symbol would you use between 15 and 12?* (>). Khung mẫu: nhân vật dấu > "greater than",
< "less than", = "equal to"; ví dụ 12 > 10 · 9 < 13 · 11 = 11.
Exit Ticket (tr.30): (1) *Which symbol means less than?* A > · B < · C = (B); (2) vẽ chục-đơn vị 15 và 12, điền dấu
(>); (3) 5 ○ 11 (<) · 17 ○ 8 (>) · 16 ○ 13 (>) · 12 ○ 12 (=).
Additional Practice (tr.31): khoanh dấu cho "is equal to" / "is greater than" / "is less than"; so hai nhóm tranh
(10 dâu vs 12 táo → <; 8 vợt bóng bàn vs 14 que → <); 15 ○ 19 · 2 ○ 1 · 14 ○ 13 · 10 ○ 10 · 20 ○ 19 · 18 ○ 7;
*Pat writes 8 > 17. Is Pat correct?* (No).

### Math in Real Life (tr.32) · Student Self-Reflection (tr.33–34)
Đếm đồ chơi, ghế, bàn, sách ở nhà; "vẽ ghế trong nhà em và viết số ghế". Tự đánh giá 3 mặt trời cho 6 mục: đếm và
viết 1–10 · đếm và nhận biết teen numbers · quy luật trên bảng số 20 · quy luật trên tia số 20 · biểu diễn chục và
đơn vị (14 → 1 ten, 4 ones) · so sánh số (thẻ Equal to / Less than / Greater than).

## 2. Unit 4 — Addition within 20 (tr.35–60; năm bài đầu, xem mục 5 cho hai bài cuối)

Mục tiêu unit (tr.35): 4-1 count to add within 20 · 4-2 know ways to make 10 · 4-3 count on using a number line ·
4-4 use doubles · 4-5 make a 10 to add · 4-6 use properties to add · 4-7 add three numbers. Từ vựng: sum, addend,
doubles, number bond. Learning Tips (tr.36): **bắt đầu từ số lớn hơn** (9 + 3 → từ 9 đếm thêm 3) · tìm cặp làm tròn
10 (6 + 4, 9 + 1) · cộng 3 số thì cộng cặp dễ trước ((3 + 7) + 2 = 12) · dùng ngón tay, tia số.

| Mã đề xuất | Đầu trang / giới thiệu | Tên bài | Trang | Kỹ năng `EMATH.*` |
|---|---|---|---|---|
| `EDI-MN1-U4-L1` | 4-1 / 4-1 | Relate Counting to Addition | 37–39 | `OA.ADD_WITHIN_10` (+ `ADD_WITHIN_20` mức khó) |
| `EDI-MN1-U4-L2` | — ("Addition within 10" trong mục lục) / 4-2 | Ways to make 10 | 40–42 | `OA.NUMBER_BONDS_10` |
| `EDI-MN1-U4-L3` | 4-2 / 4-3 | Count On to Add Using a Number Line | 43–45 | `OA.COUNT_ON` |
| `EDI-MN1-U4-L4` | 4-3 / 4-4 | Doubles | 46–48 | `OA.DOUBLES` |
| `EDI-MN1-U4-L5` | 4-5 / 4-5 | Make a 10 to Add | 49–51 | `OA.MAKE_TEN` |
| `EDI-MN1-U4-L6` | 4-7? / 4-6 | (use properties to add) — **chưa có ảnh** | 52–54 | `OA.PROPERTIES_COMMUTATIVE` |
| `EDI-MN1-U4-L7` | 4-8? / 4-7 | (add three numbers) — **chưa có ảnh** | 55–57 | `OA.THREE_ADDENDS` |

### U4-L1 Relate Counting to Addition (tr.37–39)
Try This First: *What is 8 + 2?* (10). Khung mẫu: 5 ếch + 3 ếch — đếm 1…8 ("You can count") hoặc 5 + 3 = 8 ("You can
add"); "One way to find a **sum** is to add the **addends**."
Exit Ticket (tr.38): (1) 3 chim + 3 chim → _ + _ = _ birds (6); (2) 5 mũ + 3 mũ → 8 caps; (3) 2 diều + 4 diều → 6.
Additional Practice (tr.39): 7 bò + 2 bò = 9; ngựa 3 + 3 = 6 horses; vẽ tranh cho 6 + 5 (11).

### U4-L2 Ways to make 10 (tr.40–42)
Try This First: *What number goes with 6 to make 10?* (4). Khung mẫu: bàn tính 10 hàng 10 hạt: 10 + 0 … 1 + 9 = 10.
Exit Ticket (tr.41): *How many more to make 10?* ten-frame đã tô: 6 + _ · 5 + _ · 10 + _ · 1 + _ · 8 + _ · 7 + _ ·
4 + _ · 2 + _ (4, 5, 0, 9, 2, 3, 6, 8).
Additional Practice (tr.42): **Rainbow to 10** — 0…5 nối với 10…5 bằng cầu vồng; 0 + □ = □ … 10 + □ = □.

### U4-L3 Count On to Add Using a Number Line (tr.43–45) — đầu trang "Lesson 4-2"
Try This First: *What is 5 + 7?* (12). Khung mẫu: 9 + 3 trên tia số 1–20 — bắt đầu từ 9 nhảy 3 bước (3 nhảy)
so với bắt đầu từ 3 nhảy 9 bước; "**Counting on is quicker when you start with the greater addend.**" 9 + 3 = 12.
Exit Ticket (tr.44): (1) *Start at 6. Count on 3 more. What is the sum of 6 + 3?* A 7 · B 8 · C 9 · D 10 (C; A/B là
đếm thiếu bước, D là đếm cả số đầu); (2) 5 + 2 = __ (tia 0–10); (3) tia số chấm ở 9 nhảy 4 → *Which expression?* A 4 + 4
· B 9 + 4 · C 9 + 9 · D 9 + 13 (B); (4) chấm ở 8, đếm thêm 6 → 8 + 6 = 14.
Additional Practice (tr.45): 1 + 8 · 7 + 5 · 6 + 1; *Cory reads 7 pages in the morning and 3 pages in the evening.
How many pages in all?* (10).

### U4-L4 Doubles (tr.46–48) — đầu trang "Lesson 4-3"
Try This First: *What is 7 + 7?* (14). Khung mẫu: bảng doubles có tranh đời thường: 1 + 1 mắt · 2 + 2 chân chó ·
3 + 3 chân côn trùng · 4 + 4 chân nhện · 5 + 5 ngón tay · 6 + 6 hộp trứng · 7 + 7 lịch tuần · 8 + 8 hộp bút sáp · 9 + 9
vỉ 18 · 10 + 10 ngón tay chân. "When you use doubles, the two addends are the same."
Exit Ticket (tr.47): (1) hai thẻ 2 chấm → 2 + 2 = 4; (2) *sum of 5 + 5?* A 11 · B 10 · C 9 · D 8 (B); (3) *A box has
8 crackers. How many are in 2 boxes?* 8 + 8 = 16; (4) hai thẻ chấm giống nhau, mỗi thẻ 5 + 3 = 8 chấm → *Which
doubles fact?* A 3 + 3 = 5 · B 4 + 4 = 8 · C 5 + 5 = 9 · D 8 + 8 = 16 (D; A và C là doubles **cộng sai** — nhiễu tốt).
Additional Practice (tr.48): vẽ chấm cho doubles lên bọ rùa; 7 + 7 · 2 + 2 · 6 + 6 · 5 + 5 · 8 + 8 · 1 + 1 · 9 + 9 ·
3 + 3; thẻ chấm 6 | 6 và 5 | 5 → viết phép cộng.

### U4-L5 Make a 10 to Add (tr.49–51)
Try This First: *What number makes 10 with 8?* (2). Khung mẫu: 7 + 5 — cách 1 ten-frame (7 chấm đen + 3 chấm xám đầy
khung, còn 2) → 10 + 2 = 12; cách 2 **number bond** tách 5 thành 3 và 2 → 10 + 2 = 12.
Exit Ticket (tr.50): (1) 6 chấm đen + 8 chấm trắng trên 2 ten-frame (khung đầu đầy: 6 đen + 4 trắng, khung sau 4 trắng) → 6 + 8 = 14; (2) vẽ counters để cộng 3 + 9 (12);
(3) number bond 9 + 8, tách 8 thành 1 và 7 → *What is the sum?* A 19 · B 18 · C 17 · D 16 (C).
Additional Practice (tr.51): 6 + 5 (ten-frame) · 9 + 6 (bond 1 và 5) · 7 + 6 · 4 + 9 (bond của 4); *Kelly has 8
pencils. Carl has 7 pencils. How many pencils in all?* — "How can you make a 10 to add?" (15).

## 3. Tổng hợp dạng câu hỏi sách dùng → dạng bài của app (không viết tay, không chụp ảnh)

| Sách | Trong app |
|---|---|
| Write the number / How many? | COUNT_TAP (đếm đồ vật) hoặc MCQ số, tranh vẽ **đúng mô hình** (ten-frame, thanh chục) |
| Circle the correct number / Which shows…? / Which expression? | MCQ, nhiễu mang `errorTag` theo lỗi thật (đếm thiếu, đếm cả số đầu, thanh 9 khối, 10 là teen…) |
| YES/NO, TRUE/FALSE, "Do you agree?" | MCQ 2 lựa chọn |
| Fill in missing numbers (bảng số, tia số) | DRAG_DROP thẻ số vào ô trống |
| Match numbers and words | DRAG_DROP số ↔ chữ, LISTEN_CHOOSE nghe "seventeen" chạm số |
| Draw N objects / draw counters in ten-frame / draw tens and ones | DRAG_DROP kéo đủ N hình/chấm vào khung (chấm theo số lượng) — không tô, không vẽ |
| Write >, <, = | DRAG_DROP 1 trong 3 thẻ dấu vào ô tròn; LISTEN_CHOOSE "less than" |
| Word problem (Val/Jean, Cory, Kelly/Carl, crackers) | MCQ, `prompt.tts`, giữ đúng tên và số của sách ở độ khó 1–2, biến thể ở độ khó 3–5 |
| Say numbers out loud | READ_ALOUD ("fourteen", "18 is greater than 15") |
| Math in Real Life | không thành bài; ghi vào `contentText` gợi ý ba mẹ làm cùng con |
| Reflect / Self-Reflection (3 mặt trời) | hoãn — ghi thành ý tưởng |

## 5. Unit 4 — hai bài cuối (tr.52–60; bản scan 2, 18/09/2026)

| Mã | Đầu trang | Tên bài | Trang | Kỹ năng `EMATH.*` |
|---|---|---|---|---|
| `EDI-MN1-U4-L6` | Lesson 4-7 | Use Properties to Add | 52–54 | `OA.PROPERTIES_COMMUTATIVE` |
| `EDI-MN1-U4-L7` | Lesson 4-8 | Add Three Numbers | 55–57 | `OA.THREE_ADDENDS` (+ `ADD_WITHIN_20`) |
| (không phải bài) | — | Math in Real Life | 58 | `contentText` |
| (không phải bài) | — | Student Self-Reflection | 59–60 | xem mục 8 |

### U4-L6 Use Properties to Add (tr.52–54) — đầu trang "Lesson 4-7"
Try This First: *Which is the same as 3 + 5: 5 + 3 or 5 + 4?* (5 + 3). Khung mẫu: 7 + 4 = 11 và 4 + 7 = 11 trên hai
tia số — "You can switch the order of addends. The sum stays the same."
Exit Ticket (tr.53): (1) *Which gives the same sum as 7 + 9?* A 7 + 10 · B 10 + 3 · C 9 + 7 · D 3 + 7 (**C**);
(2) Ken 5 bút, Sam 8 bút → 5 + 8 = 13 và 8 + 5 = 13; (3) Yes/No cùng tổng với 8 + 2: 2 + 8 (Yes), 10 + 2 (No),
8 + 10 (No); (4) viết phép cùng tổng với 7 + 4 bằng chính hai số ấy (4 + 7 = 11).
Additional Practice (tr.54): 8 + 1 = 1 + 8 = 9 · 5 + 7 = 7 + 5 = 12 · 4 + 6 = 6 + 4 = 10 · 9 + 8 = 8 + 9 = 17;
cùng tổng với 7 + 2 → C (2 + 7); cùng tổng với 3 + 9 → B (9 + 3); cách khác cho 6 + 7 → 7 + 6 = 13.

### U4-L7 Add Three Numbers (tr.55–57) — đầu trang "Lesson 4-8"
Try This First: *What is 2 + 3 + 8?* (13). Khung mẫu: ba tia số cho 4 + 6 + 4, 6 + 4 + 4, 4 + 4 + 6 — "The sum is
the same" (14).
Exit Ticket (tr.56): (1) 3 + 1 + 4 = 8; (2) *Which equation has the same value as 7 + 3 + 6?* A 9 + 7 + 3 ·
B 6 + 10 + 3 · C 3 + 6 + 7 · D 13 + 3 + 1 (**C**); (3) Maya lật 3 thẻ chấm (2, 6, 5) → 2 + 6 + 5 = 13.
Additional Practice (tr.57): 5 + 1 + 5 = 11 · 4 + 2 + 4 = 10 · 3 + 5 + 2 = 10 · 7 + 3 + 8 = 18 · 9 + 4 + 1 = 14 ·
7 + 5 + 5 = 17.

**Math in Real Life (tr.58)** "I eat 8 grapes and then 8 more" (8 + 8); "We put 4 apples and 3 bananas in the cart"
(4 + 3); vẽ ghế và bàn trong nhà rồi viết tổng. **Self-Reflection (tr.59–60)**: đếm để cộng trong 20 · biết các cách
làm 10 · dùng tia số để cộng · dùng doubles (bảng 1 + 1 … 10 + 10) · make a 10 · dùng tính chất · cộng ba số.

## 6. Unit 5 — Subtraction within 20 (tr.61–80)

Unit Introduction (tr.61): *count to subtract within 20 (5-1) · subtract within 10 using number box · count back to
subtract using a number line (5-2) · count on to subtract using a number line (5-3) · make a 10 to subtract (5-4)*.
Từ vựng: difference, minus, subtract, count back, count on, number line, number box.
Learning Tips (tr.62): đọc chậm, **số lớn trừ số bé** (14 − 6, không phải 6 − 14) · đếm lùi từ số lớn bằng ngón tay
(13 − 4 → 12, 11, 10, 9) · trên tia số thì nhảy sang trái (10 − 3 = 7) · **thử lại bằng cách cộng** (12 − 5 = 7 vì
7 + 5 = 12).

| Mã | Đầu trang | Tên bài | Trang | Kỹ năng `EMATH.*` |
|---|---|---|---|---|
| `EDI-MN1-U5-L1` | Lesson 5-1 | Relate Counting to Subtraction | 63–65 | `OA.SUB_WITHIN_20`, `OA.SUB_WITHIN_10` |
| `EDI-MN1-U5-L2` | — (giới thiệu: "subtract within 10 using number box") | Subtraction within 10 | 66–68 | `OA.SUB_WITHIN_10`, `OA.COUNT_BACK` |
| `EDI-MN1-U5-L3` | Lesson 5-2 | Count Back to Subtract | 69–71 | `OA.COUNT_BACK` |
| `EDI-MN1-U5-L4` | Lesson 5-3 | Count On to Subtract | 72–74 | **mới** `OA.COUNT_ON_SUBTRACT` |
| `EDI-MN1-U5-L5` | Lesson 5-4 | Make a 10 to Subtract | 75–77 | **mới** `OA.MAKE_TEN_SUBTRACT` |
| (không phải bài) | — | Math in Real Life · Self-Reflection | 78–80 | `contentText` |

- **U5-L1** (tr.63): 7 con chim, 2 bay đi → 7 − 2 = 5. Exit Ticket (tr.64): 7 − 3 = 4 (vịt bơi đi); tranh gạch chéo
  → 12 − 3 = 9; *Which equation matches the picture?* A 8 − 3 = 5 · B 8 − 3 = 11 · **C 11 − 3 = 8** · D 5 − 3 = 8.
  Additional Practice (tr.65): 4 − 4 = 0 · 8 − 4 = 4 (bọ rùa trên lá) · 10 − 2 = 8 foxes · 8 − 2 = 6 turtles.
- **U5-L2** (tr.66): number box 1–10, 7 − 3 lùi 3 bước tới 4. Exit Ticket (tr.67) là bài **tô màu theo kết quả**:
  5 − 3 = 2, 3 − 1 = 2, 10 − 5 = 5, 10 − 8 = 2, 8 − 6 = 2, 9 − 5 = 4, 4 − 1 = 3, 10 − 1 = 9, 9 − 6 = 3, 9 − 3 = 6
  (bảng màu: nâu 4 · cam 5 và 10 · vàng 0, 1, 7, 8 · xanh lá 3, 6, 9 · đỏ 2). Additional Practice (tr.68): 14 phép
  trừ trong 10, có 9 − 0 = 9 và 5 − 5 = 0.
- **U5-L3** (tr.69): 12 − 5 — chấm ở 12, đếm lùi 5, dừng ở 7. Exit Ticket (tr.70): Magda 14 − 5, vẽ 5 bước nhảy →
  A 10 · **B 9** · C 8 · D 7; 13 − 10 = 3; 17 − 9 → A 6 · B 7 · **C 8** · D 9. Practice (tr.71): 8 − 2 = 6 ·
  13 − 6 = 7 · 11 − 3 = 8 · 16 − 7 = 9.
- **U5-L4** (tr.72): 15 − 9 — **bắt đầu ở 9, đếm tiến 6 bước tới 15**, hiệu là 6 ("how far apart"). Exit Ticket
  (tr.73): 9 − 4 vẽ bước nhảy tiến → A 13 · B 11 · **C 5** · D 4; 13 − 7 = 6; 14 − 9 = 5. Practice (tr.74):
  11 − 5 = 6 · 15 − 8 = 7 · 18 − 8 = 10 · Malik 12 vỏ sò cho em 5 → 7.
- **U5-L5** (tr.75): 13 − 5 — number bond tách 5 thành 3 và 2; 13 − 3 = 10 rồi 10 − 2 = 8. Exit Ticket (tr.76):
  *Which equation does the ten-frame show?* A 10 − 2 = 8 · B 10 − 7 = 3 · C 12 − 6 = 6 · **D 12 − 7 = 5** (ảnh mờ,
  nên kiểm lại khi cầm sách); 15 − 6 = 9. Practice (tr.77): 11 − 6 = 5 · 13 − 7 = 6 · 16 − 8 = 8 · 14 − 5 = 9 ·
  18 − 9 = 9 · 15 − 7 = 8.
- **Math in Real Life (tr.78)**: "I had 10 crayons. I lost 2" (10 − 2); chia bánh 8 miếng (câu bị ảnh che); con kể
  một chuyện bớt đi rồi viết phép trừ. **Self-Reflection (tr.79–80)**: đếm để trừ trong 20 · number box · đếm lùi ·
  đếm tiến · make a 10 để trừ (17 − 8 → 10 − 1 = 9).

## 7. Unit 6 — 2D Shapes (tr.81–97)

Unit Introduction (tr.81): *understand defining attributes (6-1) · understand non-defining attributes (6-2) ·
compose shapes from other shapes (6-3) · use parts of a shape to build a new shape (6-4)*. Từ vựng: attributes,
2D shape, triangle, circle, square, rectangle. Learning Tips (tr.82): nhìn **cạnh và đỉnh** · **bỏ qua cỡ và màu** ·
nghĩ như xếp hình (hai nửa tròn thành hình tròn).

| Mã | Đầu trang | Tên bài | Trang | Kỹ năng `EMATH.*` |
|---|---|---|---|---|
| `EDI-MN1-U6-L1` | Lesson 6-1 | Understand Defining Attributes of Shapes | 83–85 | `G.SHAPE_ATTRIBUTES` |
| `EDI-MN1-U6-L2` | Lesson 6-2 | Understand Non-Defining Attributes | 86–88 | **mới** `G.NON_DEFINING_ATTRS` |
| `EDI-MN1-U6-L3` | Lesson 6-3 | Compose Shapes | 89–91 | `G.COMPOSE_SHAPES` |
| `EDI-MN1-U6-L4` | Lesson 6-4 | Build New Shapes | 92–94 | **mới** `G.DECOMPOSE_SHAPES` |
| (không phải bài) | — | Math in Real Life · Self-Reflection | 95–97 | `contentText` |

- **U6-L1** (tr.83): *How many sides does a triangle have?* (3); cạnh thẳng, đỉnh, "no openings or gaps". Exit Ticket
  (tr.84): nối hình khép kín / hình hở; *Which shapes have 4 vertices?* (rhombus và trapezoid); square 4 cạnh 4 đỉnh,
  rectangle 4 và 4. Practice (tr.85): bảng "Look, count and write" — triangle 3/3, circle 0/0, square 4/4,
  rectangle 4/4, pentagon 5/5, hexagon 6/6, oval 0/0, rhombus 4/4, trapezoid 4/4.
- **U6-L2** (tr.86): *Is a red square still a square?* (Yes); sáu tam giác khác màu khác cỡ — "They are all
  triangles". Exit Ticket (tr.87): *Which shapes are rectangles?* (chỉ hình chữ nhật thật; nhiễu: hình có cạnh cong,
  tam giác, đa giác 7 cạnh); đếm trong 8 hình: 3 hình tròn, 1 hình 6 đỉnh, 2 hình 3 cạnh; vẽ một hình tròn.
  Practice (tr.88): 15 đồ vật nối với hình (thước → chữ nhật, đồng xu → tròn, miếng pizza → tam giác…).
- **U6-L3** (tr.89): *How many triangles can make a square?* (2); 2 vuông → chữ nhật, 2 tam giác → chữ nhật,
  chữ nhật + hình thang → lục giác. Exit Ticket (tr.90): chọn mọi cặp ghép được; hai nửa hình tròn → **hình tròn**.
  Practice (tr.91): kẻ đường tách hình thang, lục giác; ghép mảnh thành hình mới (bài vẽ).
- **U6-L4** (tr.92): tam giác lớn gồm 4 tam giác nhỏ — "They look different, but they have the same parts". Exit
  Ticket (tr.93): Yes/No hai cặp hình có cùng mảnh không (cặp 1 No, cặp 2 Yes); dùng mảnh dựng một tam giác.
  Practice (tr.94): hai câu Yes/No và hai bài vẽ.
- **Math in Real Life (tr.95)**: tìm hình quanh nhà (đĩa, đồng hồ, sô cô la, biển báo, khung ảnh, thước); vẽ và gọi
  tên 3 hình. **Self-Reflection (tr.96–97)**: cạnh và đỉnh · màu/cỡ không đổi hình · ghép hình (ngôi nhà) · tách và
  dựng lại (tangram 7 mảnh thành con thỏ).

**Chỗ còn ngờ (ảnh mờ, nên xem lại sách giấy khi dùng):** ô nhiễu của Exit Ticket tr.76 (đếm chấm bị gạch trên hai
ten-frame); số vật trong vài tranh của tr.64–65; câu thứ hai của Math in Real Life tr.78 bị ảnh bánh che mất.

## 8. Việc chủ dự án cần làm (gom)

~~Chụp tiếp sách tr.52–97~~ **xong 18/09/2026** · ~~lớp đang ở bài nào~~ **xong: 18/09/2026 lớp học tới trang 28**
(bài Compare Numbers on a Number Line) → 2 bài/tuần, sách bắt đầu tuần 1. Còn lại: xem lại vài chỗ ảnh mờ ghi ở cuối
mục 7; hỏi cô về **Volume 2** (học kỳ 2).
