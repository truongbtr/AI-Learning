# 01 — YÊU CẦU CHỨC NĂNG & PHI CHỨC NĂNG (SRS)

> Đọc `00-TONG-QUAN.md` trước. Mã yêu cầu: `FR-<khu>-<số>` (chức năng), `NFR-<số>` (phi chức năng). Mỗi user story có tiêu chí chấp nhận (AC) — QC dùng AC để nghiệm thu.
>
> Ưu tiên: **P0** = phải có ở v1 · **P1** = nên có ở v1 · **P2** = sau v1.

---

## A. Khu **CORE** — Tài khoản, hồ sơ, bản đồ kỹ năng

### FR-CORE-01 Tài khoản, vai trò & đăng nhập (P0)
> Thiết kế chi tiết: `12-NGUOI-DUNG-DANG-NHAP.md`. Website mở ra internet nên phần này là bắt buộc trước mọi thứ khác.
- Ba vai trò trên **một bảng `User`**: `ADMIN` (Ba), `PARENT` (Ba, Mẹ), `CHILD` (Mai Thy, Chí Thanh). Không có đăng ký công khai — chỉ admin tạo tài khoản.
- **Một tài khoản `ADMIN` được seed sẵn** từ `.env`, bắt buộc đổi mật khẩu ở lần đăng nhập đầu.
- Một trang `/login`: phần trên là 2 thẻ ảnh của con (chạm → chọn 4 hình theo thứ tự, không gõ chữ); phần dưới là tên đăng nhập + mật khẩu cho người lớn.
- Chặn dò mật khẩu: sai 5 lần khoá tài khoản 10 phút + giới hạn theo IP; thông báo lỗi không tiết lộ tài khoản có tồn tại hay không; ghi `LoginAudit` mọi lần.
- Phiên: cookie httpOnly/Secure/SameSite=Lax; người lớn 30 ngày (có "ghi nhớ máy này"), con hết hạn sau 2 giờ không thao tác.
- **AC:** seed xong đăng nhập `admin` → bị ép đổi mật khẩu, chưa đổi thì không vào được trang nào khác; sai mật khẩu 5 lần → khoá 10 phút, `LoginAudit` ghi đủ; `CHILD` gọi API của `/parent` → 403; phụ huynh A xem dữ liệu con không được gắn → 403; đăng nhập sai tên và sai mật khẩu trả cùng một thông báo.

### FR-CORE-02 Hồ sơ học sinh (P0)
- Mỗi bé: tên, tên gọi ở nhà, ảnh đại diện, ngày sinh, lớp, năm học, sở thích (dùng để cá nhân hoá ví dụ trong bài: Chí Thanh → máy móc, robot, cờ vua; Mai Thy → múa, vẽ, công chúa…), nhân vật đồng hành (mascot) tự chọn.
- Cài đặt riêng từng bé: thời lượng Daily Quest (mặc định 15 phút), giờ học gợi ý, mức khó khởi điểm, bật/tắt gia sư giọng nói.
- **AC:** tạo/sửa hồ sơ; sở thích xuất hiện trong prompt sinh bài (kiểm tra bằng log prompt).

### FR-CORE-03 Bản đồ kỹ năng (P0)
- Seed sẵn bản đồ kỹ năng lớp 1 cho 5 môn theo `05-CHUONG-TRINH-HOC.md` (mã, tên VN/EN, môn, mạch (strand), chuẩn tham chiếu, kỹ năng tiên quyết, mức lớp, mô tả để AI dùng).
- Admin xem dạng cây/đồ thị, thêm/sửa/ẩn kỹ năng, nhập thêm từ file CSV/JSON.
- **AC:** seed thành công ≥ 250 kỹ năng; giao diện admin lọc theo môn/mạch; xoá kỹ năng đang có bằng chứng chỉ được *ẩn*, không xoá cứng.

### FR-CORE-04 Hồ sơ năng lực (mastery) (P0)
- Với mỗi (học sinh, kỹ năng): `mastery` 0–100, `confidence` 0–1, số bằng chứng, ngày bằng chứng cuối, xu hướng 14 ngày (↑ → ↓), trạng thái: *chưa học / đang học / cần củng cố / vững / thành thạo*.
- Cập nhật tự động khi có bằng chứng mới theo thuật toán ở `04-AI-DANH-GIA.md` §3; có lịch sử thay đổi (ai/cái gì gây thay đổi).
- Phụ huynh có thể chỉnh tay (ghi lý do) — bằng chứng loại `parent_override`.
- **AC:** thêm 1 bằng chứng đúng → mastery tăng; sai → giảm; 21 ngày không có bằng chứng → confidence giảm dần (decay); xem lịch sử.

---

## B. Khu **INTAKE** — Nạp dữ liệu đầu vào

### FR-INT-01 Nạp ảnh bài vở (P0)
- Phụ huynh chụp/tải 1–20 ảnh (vở bài tập, bài kiểm tra, phiếu bài tập, sổ liên lạc/nhận xét của cô, màn hình báo cáo NAVIO/Kids A-Z). Chọn bé, môn (có thể để AI đoán), ngày.
- Từ điện thoại: dùng camera trực tiếp trong web (`<input capture>`), tự xoay, nén trước khi tải.
- Hệ thống tạo `IntakeJob`, xử lý nền bằng AI Vision (xem `07-DU-LIEU-DAU-VAO.md`), kết quả: loại tài liệu, môn, nội dung trích xuất, danh sách câu/bài → đúng/sai/không chấm, lỗi cụ thể, kỹ năng liên quan, nhận xét của giáo viên (nếu có), gợi ý bằng chứng.
- Ảnh vào **hàng chờ AI** (`13-HANG-CHO-AI.md`); kết quả có sau khi Ba chạy Claude Code "Xử lý hàng chờ AI" (2–3 lần/tuần). App hiện rõ "đang chờ xử lý — N ảnh".
- **AC:** tải 5 ảnh → mục hàng chờ tạo ngay, ảnh gốc lưu không mất; sau `inbox:push` kết quả ở trạng thái chờ duyệt đúng số ảnh; ảnh mờ/không phải bài học → `needs_review` kèm lý do.

### FR-INT-02 Duyệt kết quả trích xuất (P0)
- Màn hình duyệt: ảnh bên trái, kết quả bên phải; sửa được từng dòng (đúng/sai, kỹ năng gắn, ghi chú); "Duyệt tất cả", "Bỏ qua".
- Sau duyệt: tạo `Evidence` và cập nhật mastery; nếu là báo cáo NAVIO/Kids A-Z thì cập nhật `ExternalProgress` (cấp độ, điểm, ngày).
- **AC:** duyệt → mastery thay đổi ngay; sửa nhãn kỹ năng của AI được ghi lại để dùng làm ví dụ few-shot lần sau.

### FR-INT-03 Nạp giáo trình & bài học (P0) — **ngoại tuyến bằng Claude Code**
- Bài học rút từ sách của trường **không nạp qua giao diện**: Claude Code đọc PDF trong `sach giao khoa/`, soạn `content/lessons/**.json`, kiểm định, rồi `pnpm content:import` (`10-NAP-NOI-DUNG.md`).
- App cung cấp: màn hình xem danh sách `LessonUnit` đã nạp, xem nguồn (sách, trang), sửa nhỏ, và **đánh dấu "tuần này học bài nào"** cho từng môn (mặc định theo `expectedWeek` seed từ `09`).
- Thông báo tuần của lớp: phụ huynh dán văn bản hoặc chụp ảnh → dùng kênh intake thường (FR-INT-01) để đề xuất bài của tuần.
- **AC:** sau `content:import`, unit hiện đủ trong `/parent/materials` kèm nguồn; đổi "tuần này" → Daily Quest hôm sau ưu tiên kỹ năng của bài đó; app **không** có nút tải PDF giáo trình.

### FR-INT-04 Ghi chép nhanh của phụ huynh (P1)
- Nhập tay 1 dòng: "Hôm nay Mai Thy đọc *cat, bat* chưa được, hay nhầm b/d" → AI gắn kỹ năng, tạo bằng chứng (loại `parent_note`, trọng số thấp).
- **AC:** ghi chú ≤ 30 giây; AI gợi ý kỹ năng đúng ≥ 80% khi thử 20 ghi chú mẫu.

### FR-INT-06 Nạp nhật ký lớp hằng ngày (P0)
- Ô "Nhật ký lớp hôm nay": dán văn bản bài đăng Edi Parent (ưu tiên) hoặc chụp màn hình → `docType=CLASS_DIARY`.
- **Bộ đọc theo mẫu, không AI** (`11` §4, `13` §4): phần "Thông tin" (`- Môn: Bài`) và các dặn dò theo mẫu (`luyện đọc N lần Bài X trang Y`) đọc ngay, ba mẹ xác nhận một chạm; đoạn không khớp mẫu → hàng chờ AI, hôm sau có.
- Nạp trùng ngày → cập nhật, không tạo thêm. Nhắc nhẹ 19:00 nếu hôm đó chưa có nhật ký (tắt được).
- **AC:** dán bài đăng mẫu ngày 10/09/2026 → ra đúng 3 mục đã học, 3 bài cô giao (1 optional), 1 nhắc đồng phục; Daily Quest tối đó ưu tiên kỹ năng của bài đã học; ≤ 15 giây khi dán văn bản.

### FR-INT-05 Kết quả từ bài luyện trong hệ thống (P0)
- Mọi câu trả lời của con trong phiên học tự động thành bằng chứng (loại `exercise`, trọng số cao nhất), kèm thời gian trả lời, số lần thử, có dùng gợi ý không.
- **AC:** kết thúc phiên → mastery các kỹ năng liên quan cập nhật ≤ 5 giây.

---

## C. Khu **LEARN** — Học sinh học

### FR-LRN-01 Trang chủ của con (P0)
- Sau đăng nhập: mascot chào bằng giọng nói + tên gọi ở nhà; nút lớn **"Bắt đầu nhiệm vụ hôm nay"**; chuỗi ngày (streak), sao, huy hiệu mới; 2–3 "trò chơi luyện thêm" theo môn.
- **AC:** không quá 5 phần tử tương tác trên màn hình; mọi chữ có nút loa đọc.

### FR-LRN-02 Daily Quest — phiên học hằng ngày (P0)
- Mỗi ngày (job 04:00 hoặc khi con mở lần đầu) AI lên 1 phiên 10–20 phút: 8–15 bài, trộn: 50% kỹ năng đang yếu/đang học tuần này, 30% ôn (spaced repetition), 20% thử thách mới; xen kẽ môn; ưu tiên môn có tiết ở trường hôm đó/hôm qua.
- Trong phiên: thanh tiến trình hình con đường; mỗi bài đúng → sao + âm thanh; sai → gợi ý (tối đa 2 lần) rồi hiện đáp án đúng có giải thích ngắn bằng giọng; không bao giờ hiện "sai" đỏ to.
- Hết phiên: màn hình ăn mừng, tổng sao, huy hiệu (nếu có), "Bé giỏi nhất ở… / Mai mình luyện thêm…".
- Phụ huynh có thể tạm dừng/tiếp tục; phiên dở dang lưu lại.
- **AC:** phiên sinh ≤ 20 giây (có cache); phần trăm kỹ năng yếu trong phiên đúng với cấu hình ± 10%; phiên có thể chơi offline-tolerant (mất mạng vẫn hoàn thành bài đang mở, gửi kết quả sau).

### FR-LRN-03 Các dạng bài tương tác (P0 = dạng 1–6, P1 = 7–9)
1. **Chọn 1 trong 3–4** (ảnh/chữ/âm) — có đọc đề.
2. **Nghe và chọn** — TTS/âm thanh chuẩn, chọn hình/từ.
3. **Kéo thả** — ghép từ-hình, sắp thứ tự số/chữ, phân loại.
4. **Đọc to** — hiện tiếng/từ/câu (tiếng Việt học vần và tiếng Anh), con bấm mic đọc, STT chấm từng tiếng (chính xác, tốc độ), có phát mẫu; máy không chắc → ba mẹ chạm "đúng / chưa đúng" cho tiếng đó (chế độ cùng ba mẹ); lỗi phát hiện được ghi theo mã chuẩn (`04` §11.1).
5. **Đếm & chạm** — chạm đủ số vật; số dòng số (number line).
6. **Viết/vẽ chụp lại** — con viết ra giấy/bảng, ba mẹ chụp; AI chấm sau (bất đồng bộ).
7. **Nói đáp** — câu hỏi mở ngắn (Science: "What do plants need?"), STT + AI chấm ý.
8. **Tô/vẽ trên màn hình** — tập viết chữ, số theo nét (canvas), chấm sơ bộ bằng hình.
9. **Câu chuyện mini** — đọc hiểu 3–5 câu có hình, 2 câu hỏi.
- **AC:** mỗi dạng có component riêng, nhận `ExerciseSpec` JSON chuẩn (xem `04-AI-DANH-GIA.md` §5), trả `Attempt` chuẩn; test snapshot cho từng dạng.

### FR-LRN-07 "Bài cô giao" (P0)
- `Homework` gắn được dạng bài trong app → **trạm đặc biệt đứng đầu bản đồ nhiệm vụ**, làm xong mới mở phần luyện của hệ thống; có huy hiệu riêng.
- Đọc lặp N lần (`READ_ALOUD` + `repeatCount`): đếm 1/5→5/5, mỗi lượt một sao, chấm phát âm, ghi lại tiếng đọc sai.
- `VIDEO_SUBMIT`: nút "Quay cho cô" — quay trong app, lưu file vào thư mục kết quả để **ba mẹ tự nộp lên Teams**; app không tự nộp.
- Việc ngoài app (phiếu bài tập ESL, mang đồ): checklist cho ba mẹ tick; kèm gợi ý luyện thêm từ ngân hàng bài đúng kỹ năng của bài đó.
- **AC:** bài "luyện đọc 5 lần Bài 13" hiện thành trạm đếm 5 lượt; xong → `Homework.status=DONE`, sinh `Evidence(source=HOMEWORK)`; ba mẹ thấy tick trên dashboard trong ngày.

### FR-LRN-04 Luyện tự do theo môn / trò chơi kỹ năng (P1)
- Con chọn môn (icon) → AI sinh mini-game 5 bài đúng kỹ năng đang học của môn đó. Giới hạn số lượt/ngày (cấu hình).
- **AC:** không sinh trùng bài đã làm trong 7 ngày.

### FR-LRN-05 Gia sư giọng nói (P2 — cần AI trực tuyến, ngoài v1 theo ADR-10)
- Nút "Hỏi bạn Cú" (mascot): con nói câu hỏi (tiếng Việt hoặc Anh), AI trả lời ngắn (≤ 2 câu), giọng thân thiện, chỉ trong chủ đề học tập; ngoài chủ đề → "Mình hỏi ba mẹ nhé!".
- Phụ huynh xem lại toàn bộ hội thoại; lưu 90 ngày.
- **AC:** phản hồi ≤ 4 giây; bộ lọc chủ đề chặn 100% bộ 30 câu kiểm thử ngoài phạm vi.

### FR-LRN-06 Thưởng & động lực (P0)
- Sao mỗi bài; huy hiệu theo cột mốc (7 ngày liên tiếp, thành thạo 1 mạch, đọc 10 câu…); "vườn/bộ sưu tập" mở khoá bằng sao (trang trí, thú cưng, phụ kiện mascot).
- Không có bảng xếp hạng giữa hai bé. Phụ huynh có thể đặt "phần thưởng đời thực" (ví dụ 100 sao = đi công viên) hiển thị thanh tiến trình.
- **AC:** quy tắc thưởng cấu hình được trong admin; sao không bị mất khi làm sai.

---

## D. Khu **PARENT** — Bảng điều khiển phụ huynh

### FR-PAR-01 Tổng quan từng bé (P0)
- Thẻ theo môn: mastery trung bình, số kỹ năng vững / cần củng cố, xu hướng tuần; "3 điều cần chú ý" theo mẫu **lỗi gì · mấy lần · đang ở bậc mấy của thang rèn · ba mẹ làm gì 5 phút tối nay** (`04` §11.5), kèm bằng chứng; hoạt động 7 ngày; streak; phiên hôm nay xong chưa.
- **AC:** tải trang ≤ 2 giây; bấm vào mỗi con số dẫn tới bằng chứng.

### FR-PAR-02 Bản đồ năng lực chi tiết (P0)
- Heatmap/cây kỹ năng theo môn & mạch, màu theo trạng thái; bấm kỹ năng → lịch sử mastery, bằng chứng, bài luyện gần đây, nút "Luyện kỹ năng này hôm nay".
- So sánh với lộ trình mong đợi theo tuần học (không so sánh hai bé).
- **AC:** hiển thị đủ 5 môn; lọc trạng thái; xuất PDF.

### FR-PAR-03 Kế hoạch luyện & duyệt (P0)
- AI đề xuất kế hoạch 1–2 tuần: kỹ năng ưu tiên, lý do, số phiên; phụ huynh sửa/duyệt. Daily Quest sinh theo kế hoạch đã duyệt.
- Hộp thư duyệt chung: intake chờ duyệt, kế hoạch chờ duyệt, bài viết tay chờ chấm, hội thoại gia sư cần xem.
- **AC:** không có kế hoạch duyệt → hệ thống dùng kế hoạch mặc định "theo TKB"; số mục chờ duyệt hiện badge.

### FR-PAR-04 Báo cáo tuần (P0)
- Chủ nhật Ba chạy Claude Code "Viết báo cáo tuần": `pnpm report:data` xuất số liệu → Claude Code viết báo cáo mỗi bé (tiếng Việt, ≤ 1 trang: tiến bộ, điểm cần chú ý, việc ba mẹ làm cùng con 5–10 phút/ngày, câu hỏi gợi ý hỏi cô) → `pnpm report:push`. App luôn có sẵn **bản tóm tắt bằng mẫu câu + số liệu** kể cả tuần không chạy Claude Code.
- **AC:** báo cáo có dẫn chứng số liệu đúng với DB (QC đối chiếu 3 số bất kỳ).

### FR-PAR-05 Trợ lý "Hỏi về con" (P1 — thực hiện bằng Claude Code trong repo, không phải chat trong app)
- Chat cho phụ huynh: "Chí Thanh yếu nhất môn gì tháng này?", "Tuần sau con học Unit 4 NAVIO, cần chuẩn bị gì?" — AI trả lời dựa trên DB (tool-use/RAG), có trích dẫn bằng chứng.
- **AC:** trả lời có nêu nguồn; không bịa dữ liệu (kiểm thử 10 câu).

### FR-PAR-08 Gửi thư & khen con (P0)
- Ba mẹ gõ một lời nhắn (≤ 200 ký tự), tuỳ chọn thu giọng 10 giây, tuỳ chọn kèm quà (vật phẩm) → sáng hôm sau xuất hiện trong hộp thư của con, mascot đọc bằng giọng. Nút "Khen" nhanh → con nhận sao vàng lớn kèm giọng ba/mẹ thu sẵn (`06` §1.8c mục 5, 10).
- Lời khen của cô trong nhật ký lớp cũng thành một lá thư.
- **AC:** gửi lúc 21:00 → con thấy trên bản đồ sáng hôm sau; con mở thư → `openedAt` ghi, ba mẹ thấy đã mở.

### FR-PAR-06 Thời khoá biểu & lịch học (P0)
- Nhập TKB lớp (seed sẵn TKB 1B3), lịch nghỉ, tuần học; hiển thị "hôm nay ở trường con học gì" và dùng cho Daily Quest.
- **AC:** đổi TKB → Daily Quest ngày sau phản ánh.

---

## E. Khu **ADMIN** — Quản trị & vận hành

### FR-ADM-01 Hàng chờ AI & TTS (P0)
- `/admin/inbox`: số mục đang chờ theo loại, lần `inbox:push` gần nhất, mục lỗi; hướng dẫn ngắn "mở Claude Code và nói: Xử lý hàng chờ AI". Cấu hình TTS (Web Speech / cloud) và chạy sinh audio cache.
- **AC:** tạo 3 ảnh → `/admin/inbox` hiện 3 mục chờ; sau `inbox:push` về 0 và 3 kết quả chờ duyệt.

### FR-ADM-02 Thư viện prompt & nội dung (P1)
- Xem/sửa prompt template theo tác vụ (version hoá), thư viện bài luyện đã sinh (tìm, gắn cờ "hay/lỗi", tái sử dụng).
- **AC:** sửa prompt không cần deploy lại.

### FR-ADM-06 Quản lý người dùng (P0)
- `/admin/users`: bảng người dùng (ảnh, tên hiển thị, tên đăng nhập, vai trò, con được gắn, đang bật, đăng nhập lần cuối) và **năm thao tác**: tạo tài khoản · gắn phụ huynh ↔ con · đặt lại mật khẩu / mã hình · bật-tắt tài khoản · xem 50 lần đăng nhập gần nhất.
- Tạo tài khoản `CHILD` **tạo luôn hồ sơ `Student`** đi kèm (tên gọi ở nhà, lớp, sở thích, mascot, mã 4 hình).
- Không xoá cứng tài khoản đã có dữ liệu học — chỉ tắt.
- **AC:** admin tạo 1 phụ huynh + 2 bé và gắn quan hệ trong dưới 3 phút; tắt một tài khoản → không đăng nhập được nhưng mastery của bé không đổi; đặt lại mã hình → con đăng nhập bằng mã mới ngay.

### FR-ADM-05 Quản lý nội dung đã nạp (P0)
- `/admin/content`: danh sách `ContentBatch` (lô, thời điểm, số bài thêm/sửa/nghỉ hưu); duyệt lô: xem thử từng bài **đúng như con sẽ thấy**, gắn cờ `GOOD/BAD`, sửa nhanh, **phát hành** (`DRAFT → PUBLISHED`).
- Bảng phủ nội dung: mỗi kỹ năng có bao nhiêu bài đã phát hành, theo dạng và độ khó; tô đỏ kỹ năng < 10 bài (đầu vào cho đợt soạn tiếp theo).
- **AC:** bài `DRAFT` không bao giờ xuất hiện trong phiên học; gắn `BAD` → planner loại ngay; hoàn tác được một lô bằng cách nạp lại bản trước.

### FR-ADM-03 Sao lưu & khôi phục (P0)
- Sao lưu DB + file hằng đêm ra thư mục/NAS; khôi phục bằng 1 lệnh; xuất toàn bộ dữ liệu 1 bé ra JSON.
- **AC:** kịch bản khôi phục được kiểm thử trong pha triển khai.

### FR-ADM-04 Nhật ký & giám sát (P1)
- Log tác vụ AI (input tóm tắt, output, token, thời gian, lỗi), log intake, health check `/api/health`.

---

## F. Yêu cầu phi chức năng

| Mã | Yêu cầu |
|---|---|
| NFR-01 | **Thiết bị:** iPad/tablet (chính, 768–1024px ngang), laptop, điện thoại (phụ huynh). Web responsive; cài được như PWA; hỗ trợ Safari iOS ≥ 16, Chrome. |
| NFR-02 | **Hiệu năng:** trang con tải ≤ 2 s trên mạng LAN; chuyển bài ≤ 300 ms; sinh phiên ≤ 20 s (có pre-generate ban đêm). |
| NFR-03 | **Ngôn ngữ giao diện:** học sinh: song ngữ Việt–Anh theo môn (môn Anh hiển thị tiếng Anh, nút hệ thống tiếng Việt có icon); phụ huynh: tiếng Việt. Toàn bộ chuỗi i18n trong file. |
| NFR-04 | **Âm thanh:** TTS tiếng Việt và tiếng Anh **chất lượng cao, sinh sẵn lúc nạp nội dung** (cloud neural, cache mp3 — Web Speech chỉ là dự phòng, vì giọng vi-VN trên thiết bị nghe máy móc, trẻ 6 tuổi không chịu). **STT tiếng Việt là P0** (đọc thành tiếng là kỹ năng số một của lớp 1 học kỳ 1): Web Speech `vi-VN` trên Chrome/Android; iPad Safari kém → ghi âm gửi Whisper/Deepgram; và **luôn có chế độ "cùng ba mẹ"** — ba mẹ chạm "đọc đúng / chưa đúng" cho từng tiếng khi máy nghe không chắc. STT tiếng Anh P0. |
| NFR-05 | **Bảo mật (web mở ra internet):** HTTPS qua Cloudflare Tunnel; Argon2id; cookie httpOnly/Secure/SameSite; rate-limit + khoá tài khoản; CSRF; tiêu đề HSTS/X-Frame-Options/CSP; phân quyền kiểm ở tầng server theo vai trò **và** theo `studentId`; Cloudflare Access chắn thêm trước `/admin`; không lộ khoá API ra client; ảnh/tài liệu chỉ truy cập qua URL ký tạm thời. Chi tiết `12-NGUOI-DUNG-DANG-NHAP.md` §6. |
| NFR-06 | **Riêng tư:** dữ liệu ở máy nhà; gửi tới AI provider chỉ phần cần thiết; có nút xoá toàn bộ dữ liệu 1 bé; không tracking bên thứ ba. |
| NFR-07 | **Độ tin cậy:** sao lưu hằng đêm; job nền có retry; **mất mạng hoặc không có khoá AI → con vẫn học bình thường** (bài luyện nằm sẵn trong DB), chỉ tạm mất intake ảnh, báo cáo và trợ lý. |
| NFR-08 | **Khả năng bảo trì:** TypeScript strict; lint/format; test đơn vị cho thuật toán mastery, lập phiên, chấm; test e2e cho luồng chính (Playwright); tài liệu ADR cho quyết định lớn. |
| NFR-09 | **Chi phí vận hành ≈ 0:** app không gọi API LLM (ADR-10); chi phí duy nhất có thể có là cloud TTS tuỳ chọn (mặc định Web Speech miễn phí). |
| NFR-10 | **Khả năng truy cập (trẻ em):** vùng chạm ≥ 64 px; font ≥ 20 px trên giao diện con; tương phản ≥ 4.5:1; không phụ thuộc màu để phân biệt đúng/sai; mọi nội dung có âm thanh. |
| NFR-12 | **Hấp dẫn thị giác (trẻ em):** giao diện con có nền thế giới minh hoạ, mascot hoạt hình 9 trạng thái, phản hồi chuyển động cho mọi thao tác, kịch bản ăn mừng; 60 fps trên iPad; đạt toàn bộ checklist `06-THIET-KE-UI.md` §4. |
| NFR-11 | **Triển khai:** `docker compose up -d` chạy toàn bộ (app, PostgreSQL, worker, MinIO hoặc volume); biến môi trường trong `.env`; hướng dẫn cài trên Windows (Docker Desktop) và NAS. |

---

## G. Ma trận ưu tiên tổng hợp

| Khu | P0 | P1 | P2 |
|---|---|---|---|
| CORE | 01, 02, 03, 04 | — | — |
| INTAKE | 01, 02, 03, 05, 06 | 04 | tích hợp API NAVIO/Kids A-Z |
| LEARN | 01, 02, 03 (dạng 1–6), 06, 07 | 03 (dạng 7–9), 04, 05 | đa người chơi, học nhóm |
| PARENT | 01, 02, 03, 04, 06, 08 | 05 | gửi Zalo/email |
| ADMIN | 01, 03, 05, 06 | 02, 04 | multi-tenant, 2FA, đăng nhập Google |
