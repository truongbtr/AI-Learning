# 00 — TỔNG QUAN HỆ THỐNG "HỌC CÙNG MAI THY & CHÍ THANH"

> Tài liệu gốc của dự án. Mọi tài liệu khác trong `docs/` tham chiếu về đây.
> Phiên bản: 1.0 — 09/09/2026 — Tác giả: Phân tích & thiết kế hệ thống (Claude) theo yêu cầu của Chủ dự án (Ba).

---

## 1. Tên và mục đích

**Tên hệ thống:** Học cùng Mai Thy & Chí Thanh (mã dự án: `EDISON_LEARNING`, tên gọi ngắn trong code: `mtct`).

**Mục đích:** Một nền tảng web riêng của gia đình, dùng AI để **cá nhân hoá việc học ở nhà** cho hai bé sinh đôi Mai Thy và Chí Thanh (lớp 1B3, hệ Song ngữ, Edison Schools Ecopark, năm học 2026–2027). Hệ thống phải trả lời được ba câu hỏi mỗi tuần:

1. **Con đang ở đâu?** — năng lực hiện tại theo từng kỹ năng nhỏ (mastery), bám sát chương trình con đang học ở trường.
2. **Con yếu chỗ nào?** — điểm hổng, lỗi lặp lại, kỹ năng chưa vững.
3. **Hôm nay con nên luyện gì?** — bài luyện ngắn, đúng chỗ yếu, đúng độ khó, chọn tự động từ ngân hàng bài đã soạn sẵn theo sách của trường, chấm và phản hồi ngay.

Hệ thống **không thay thế trường học**; nó là "trợ giảng gia đình" bám theo thời khoá biểu và giáo trình của trường, dùng dữ liệu thực tế (vở bài tập, bài kiểm tra, nhận xét của cô, tài liệu học) để bổ trợ đúng chỗ.

## 2. Bối cảnh học tập của hai bé

| Mục | Nội dung |
|---|---|
| Trường | Edison Schools Ecopark — "Innovation For Life" |
| Lớp | 1B3, năm học 2026–2027 |
| Hệ | **Song ngữ**: chương trình chuẩn quốc gia (Bộ GD&ĐT) + chương trình quốc tế theo chuẩn **Common Core (Hoa Kỳ)** |
| Môn quốc tế | **ESL** (English as a Second Language), **ENL** (English Native — giáo viên bản ngữ), **English Maths** (Toán Hoa Kỳ), **English Science** (Khoa học bằng tiếng Anh) |
| Môn quốc gia | Tiếng Việt (cơ bản, tăng cường, tập viết + luyện TV), Toán, Tự nhiên & Xã hội, GDTC, Nghệ thuật, CNTT&KHMT, STEAM & Robotics, Life+ |
| Sách | Bộ **Kết nối tri thức với cuộc sống** (NXB GDVN) cho Toán và Tiếng Việt — xem `09-GIAO-TRINH-TRUONG.md` |
| Phần mềm tiếng Anh ở trường | **NAVIO** (Macmillan — nền tảng game hoá đi kèm giáo trình), **Kids A-Z** (Learning A-Z: Raz-Kids đọc theo cấp độ aa–Z, Headsprout, ...) |
| Thời khoá biểu | Xem `05-CHUONG-TRINH-HOC.md` §2 — hệ thống dùng TKB để gợi ý "hôm nay luyện gì" theo môn con vừa học |

Hai bé sinh 01/01/2020 (6 tuổi rưỡi khi bắt đầu lớp 1). Chí Thanh thích máy móc, học cờ vua và đàn; Mai Thy học múa và vẽ. Hai bé cùng lớp, cùng chương trình, nhưng **hồ sơ năng lực, tốc độ và sở thích là riêng**, hệ thống phải cá nhân hoá riêng từng bé — không so sánh hai bé với nhau trên giao diện của con.

## 3. Người dùng

| Vai trò | Ai | Thiết bị | Nhu cầu chính |
|---|---|---|---|
| **Học sinh** (`student`) | Mai Thy, Chí Thanh | iPad / máy tính bảng, laptop có màn hình cảm ứng, có thể dùng tai nghe + mic | Vào là học ngay, không đọc hướng dẫn dài; nghe – nhìn – chạm; được khen, được thưởng; thấy mình tiến bộ |
| **Phụ huynh** (`parent`) | Ba (chủ dự án), Mẹ | Điện thoại (chụp ảnh bài vở), laptop | Nạp dữ liệu nhanh (chụp ảnh), xem con yếu gì, duyệt/kích hoạt kế hoạch luyện, theo dõi tiến bộ, nhận báo cáo tuần |
| **Quản trị** (`admin`) | Ba | Laptop | **Tạo và quản lý tài khoản cho cả nhà**, cấu hình AI, chương trình học, nội dung, sao lưu, xem log & chi phí AI |

Ba vai trò nằm trên **một bảng `User`** (`ADMIN | PARENT | CHILD`); một tài khoản admin được tạo sẵn khi cài đặt, rồi admin tạo tiếp tài khoản cho Mẹ và hai bé. Không có đăng ký công khai. Học sinh **không có mật khẩu chữ** — đăng nhập bằng chọn ảnh đại diện + mã 4 hình. Chi tiết: `12-NGUOI-DUNG-DANG-NHAP.md`.

## 4. Phạm vi

### 4.1 Trong phạm vi (v1)

- Hồ sơ năng lực (skill mastery) theo **bản đồ kỹ năng** của lớp 1 gồm 5 môn cốt lõi: **ESL/ENL (Tiếng Anh)**, **English Maths**, **English Science**, **Tiếng Việt**, **Toán (chương trình VN)**.
- Nạp dữ liệu học tập: chụp ảnh vở/bài kiểm tra/nhận xét → vào hàng chờ → Claude Code đọc theo lô (`13-HANG-CHO-AI.md`) → trích lỗi & kết quả → phụ huynh duyệt → cập nhật năng lực.
- Nội dung học soạn sẵn ngoại tuyến bằng Claude Code từ sách của trường: bài học (mục tiêu, từ vựng, đáp án) và **ngân hàng bài luyện** cho từng kỹ năng, kiểm định rồi nạp vào database (`10-NAP-NOI-DUNG.md`).
- Bài luyện nhiều dạng (trắc nghiệm, kéo thả, nghe chọn, đọc to, viết/vẽ chụp lại, nói đáp); hệ thống chọn bài đúng người đúng lúc, chấm bài đóng và đọc to tại chỗ (không AI); bài viết tay/nói đáp chấm qua hàng chờ.
- Phiên học hằng ngày (Daily Quest) 10–20 phút/bé, có phần thưởng, chuỗi ngày (streak), huy hiệu.
- Bảng điều khiển phụ huynh: điểm mạnh/yếu, tiến bộ theo tuần, "3 điều cần chú ý" theo mẫu, báo cáo tuần do Claude Code viết mỗi Chủ nhật, đề xuất việc ba mẹ làm cùng con.
- "Hỏi về con": Ba hỏi Claude Code trực tiếp trong repo với dữ liệu xuất từ hệ thống.
- Chạy tại nhà bằng Docker, truy cập nội bộ + Cloudflare Tunnel; sao lưu dữ liệu.

### 4.2 Ngoài phạm vi (v1) — có thể làm sau

- Tích hợp API trực tiếp với NAVIO / Kids A-Z (không có API công khai; v1 chỉ nạp qua ảnh chụp màn hình báo cáo).
- Ứng dụng mobile native (v1 là web responsive, cài như PWA).
- Nhiều gia đình / multi-tenant, thanh toán.
- Gia sư AI giọng nói cho con (cần AI trực tuyến — trái ADR-10).
- Chấm bài viết tay tiếng Việt chi tiết đến nét chữ (v1 chỉ nhận xét mức độ tổng quát).
- Học các môn ngoài 5 môn cốt lõi (STEAM, Nghệ thuật, GDTC…) — chỉ ghi nhận hoạt động, không đánh giá năng lực.

## 5. Nguyên tắc thiết kế (bắt buộc tuân thủ)

1. **Trẻ 6 tuổi là người dùng chính.** Mọi màn hình của học sinh: chữ to, ít chữ, có đọc to (TTS), thao tác chạm lớn, không có nội dung đọc hiểu dài, không quảng cáo, không liên kết ra ngoài.
1b. **Hấp dẫn như trò chơi.** Góc của con là một thế giới có minh hoạ, nhân vật (mascot, avatar) và hoạt hình chuyển động ở mọi màn hình — chi tiết và checklist nghiệm thu ở `06-THIET-KE-UI.md` §1.5–1.9, §4. Giao diện tĩnh kiểu biểu mẫu là không đạt.
2. **AI đề xuất — phụ huynh quyết.** Mọi cập nhật năng lực từ ảnh chụp, mọi kế hoạch luyện, mọi nội dung AI sinh cho con đều qua trạng thái *đề xuất → duyệt* (có thể bật tự duyệt cho loại nội dung đã tin cậy).
3. **Bám giáo trình thật.** Bài luyện phải gắn với kỹ năng trong bản đồ kỹ năng và, khi có, với đơn vị bài học thực tế con đang học ở trường (tuần này học gì thì luyện cái đó).
4. **Đo được.** Mỗi kỹ năng có chỉ số mastery 0–100 với độ tin cậy; mọi kết luận "yếu/mạnh" phải chỉ ra bằng chứng (bài nào, ngày nào).
5. **An toàn & riêng tư.** Dữ liệu của trẻ ở nhà; app không gửi gì ra dịch vụ AI lúc chạy; ảnh bài vở chỉ được Claude Code đọc khi Ba chủ động chạy hàng chờ; không có hội thoại AI với con ở v1.
6. **Tích cực, không so sánh.** Giao diện của con không hiện điểm số kiểu 3/10, không hiện thứ hạng giữa hai bé; dùng sao, huy hiệu, "gần đúng rồi", "thử lại nhé".
7. **Không có AI trực tuyến trong app.** Nội dung học và mọi việc cần AI (đọc ảnh vở, chấm bài mở, báo cáo tuần) đều do Claude Code làm theo lô trong repo (ADR-9, ADR-10); app thuần tất định, chi phí vận hành ≈ 0, không có khoá API.
7b. **Nội dung đi trước, ứng dụng đi sau.** Bài học và bài luyện là dữ liệu trong repo, xem được, sửa được, có lịch sử git; app chỉ là nơi trình bày và đo lường (ADR-9).
8. **Đơn giản để duy trì.** Một codebase, một cơ sở dữ liệu, một `docker compose up`. Không thêm hạ tầng khi chưa cần.

## 6. Bức tranh tổng thể

```
  NGOẠI TUYẾN — Claude Code trong repo              TRONG APP — chạy hằng ngày
  ┌────────────────────────────────────┐            ┌──────────────────────────────┐
  │ sach giao khoa/  (PDF sách trường) │            │ Ảnh vở / bài KT / nhận xét cô │
  │            ↓ đọc                   │            │ Ảnh báo cáo NAVIO, Kids A-Z   │
  │ content/lessons/    bài học        │            │            ↓ AI đọc           │
  │ content/exercises/  ngân hàng bài  │            │ Ba mẹ duyệt → BẰNG CHỨNG      │
  │            ↓ tự kiểm định          │            └──────────────┬───────────────┘
  │ pnpm content:import ───────────────┼──────┐                    ▼
  └────────────────────────────────────┘      │        ┌───────────────────────┐
                                              └───────▶│      DATABASE         │
                                                       │ kỹ năng · bài luyện   │
                                                       │ mastery · bằng chứng  │
                                                       └───────┬───────┬───────┘
                        thuật toán chọn bài (không AI) ────────┘       │
                                   ▼                                   ▼
                    ┌────────────────────┐          ┌────────────────────────┐
                    │  GÓC CỦA CON       │          │  BẢNG ĐIỀU KHIỂN BA MẸ │
                    │  Daily Quest       │          │  Con đang ở đâu / yếu gì│
                    │  Thế giới, mascot  │          │  Chụp bài vở, duyệt     │
                    │  Sao, huy hiệu     │          │  Báo cáo tuần (AI viết) │
                    └────────────────────┘          └────────────────────────┘
```

## 7. Bộ tài liệu

| File | Nội dung | Ai đọc |
|---|---|---|
| `00-TONG-QUAN.md` | Tài liệu này | Tất cả |
| `01-YEU-CAU-CHUC-NANG.md` | Yêu cầu chức năng & phi chức năng, user story, tiêu chí chấp nhận | Dev, QC |
| `02-KIEN-TRUC.md` | Stack, kiến trúc, triển khai, bảo mật | Dev |
| `03-MO-HINH-DU-LIEU.md` | Thực thể, quan hệ, schema Prisma | Dev |
| `04-AI-DANH-GIA.md` | Bộ máy AI: mô hình năng lực, chẩn đoán, sinh bài, chấm, prompt, guardrail, chi phí | Dev, QC |
| `05-CHUONG-TRINH-HOC.md` | Bản đồ kỹ năng lớp 1 (5 môn), TKB, ánh xạ NAVIO/Kids A-Z | Dev, Ba Mẹ |
| `06-THIET-KE-UI.md` | Design system cho trẻ, danh sách màn hình, luồng | Dev |
| `07-DU-LIEU-DAU-VAO.md` | Pipeline nạp dữ liệu: ảnh, PDF, kết quả luyện | Dev |
| `08-LO-TRINH-PHA.md` | Các pha phát triển, mỗi pha 3–5 việc, tiêu chí xong, lưu ý riêng từng pha | Dev, QC, Ba |
| `13-HANG-CHO-AI.md` | ADR-10: app không gọi API LLM; hàng chờ AI do Claude Code xử lý theo lô | Dev, Ba |
| `12-NGUOI-DUNG-DANG-NHAP.md` | Vai trò, đăng nhập, quản lý người dùng, bảo vệ khi mở ra internet | Dev |
| `11-NHAT-KY-LOP.md` | Nhật ký lớp hằng ngày trên Edi Parent: nạp, hiểu, lái Daily Quest, "Bài cô giao" | Dev, Ba Mẹ |
| `10-NAP-NOI-DUNG.md` | Quy trình Claude Code soạn bài học + ngân hàng bài luyện, kiểm định, nạp DB (ADR-9) | Dev, Ba |
| `09-GIAO-TRINH-TRUONG.md` | Kiểm kê sách trường đã nạp (bộ Kết nối tri thức), cấu trúc bài học, ánh xạ bài ↔ kỹ năng ↔ tuần | Dev, Ba Mẹ |
| `TIEN-DO.md` | Nhật ký tiến độ, developer ghi sau mỗi pha | Tất cả |

## 8. Thuật ngữ

| Thuật ngữ | Nghĩa |
|---|---|
| **Kỹ năng (Skill)** | Đơn vị năng lực nhỏ nhất có thể đo, ví dụ "Cộng trong phạm vi 10", "Đọc từ CVC (cat, dog)". Có mã, môn, chuẩn tham chiếu (Common Core / CT 2018). |
| **Bản đồ kỹ năng (Skill map)** | Toàn bộ kỹ năng của lớp 1 kèm quan hệ tiên quyết (skill A cần trước skill B). |
| **Mastery** | Mức thành thạo 0–100 của một bé với một kỹ năng, kèm độ tin cậy (confidence) và ngày cập nhật. |
| **Bằng chứng (Evidence)** | Một quan sát về năng lực: câu trả lời trong bài luyện, một lỗi trong vở, một nhận xét của cô, một cấp độ Raz-Kids. |
| **Đơn vị bài học (Lesson unit)** | Nội dung thực tế con học ở trường (Unit 3 NAVIO, bài 12 SGK Tiếng Việt…), do phụ huynh nạp. |
| **Bài luyện (Exercise / Item)** | Một câu hỏi/nhiệm vụ trong ngân hàng bài, gắn 1–2 kỹ năng, có dạng tương tác, đáp án, cách chấm. Do Claude Code soạn ngoại tuyến, nạp vào DB. |
| **Phiên học (Session)** | Một lần con ngồi học, thường 10–20 phút, gồm nhiều bài luyện; Daily Quest là phiên học được AI lên sẵn mỗi ngày. |
| **Kế hoạch luyện (Plan)** | Tập kỹ năng ưu tiên trong 1–2 tuần tới do AI đề xuất, phụ huynh duyệt. |
| **Intake** | Tác vụ nạp ảnh bài vở của con và kết quả AI trích xuất, chờ ba mẹ duyệt. |
| **Ngân hàng bài luyện (Exercise bank)** | Toàn bộ bài đã nạp vào DB, phân theo kỹ năng/dạng/độ khó; nguồn duy nhất để lập phiên học. |
| **Lô nội dung (ContentBatch)** | Một lần chạy `content:import` — biết lô nào thêm/sửa bài nào, để duyệt và hoàn tác. |
