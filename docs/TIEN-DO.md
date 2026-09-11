# TIẾN ĐỘ DỰ ÁN

> Developer ghi sau mỗi pha: ngày, việc đã làm, cách chạy thử, tồn đọng, câu hỏi cho chủ dự án. Mới nhất ở trên.

## Pha 4 — 12/09/2026 — Nạp ảnh bài vở, nhật ký lớp & duyệt

Trạng thái: **xong, 7/7 tiêu chí đạt** — trừ một nửa của tiêu chí eval phải chờ 20 ảnh mẫu của chủ
dự án (mục 5 dưới). 4 commit code trong pha, **chưa push**. `lint` sạch · **295 test đơn vị** ·
**32 e2e xanh** (pha 0–4) · `build` 4 gói.

### 1. Đã làm gì, commit nào

**Việc 0 — ba quyết định của chủ dự án** (`972d454`, ADR-16)

- **Sao đo công sức, không đo đúng sai.** Gộp `firstTry: 2` + `finished: 1` thành **`exercise: 1`**:
  một sao cho mỗi trạm con **làm xong**, dù đúng, gần đúng, hay phải xem đáp án rồi mới xong; cộng
  3 sao khi hết phiên. Ảnh bài viết tay và bài đọc to ghi âm **nay được sao ngay** (trước đây rơi
  vào nhánh "chờ chấm" nên con làm thật mà không được gì). Chạm "để sau" vẫn 0 sao — chưa làm thì
  chưa có gì để thưởng.
- **Trứng 4 ngày, không bao giờ reset.** `EggProgress` bỏ khoá theo tuần, đổi sang `(studentId,
  eggNo)`: 4 **ngày học** nở một con thú rồi quả kế tiếp bắt đầu. Nghỉ thì thanh đứng yên. Tranh
  tuần và `Streak` áp cùng nguyên tắc — với lịch nhà mình (4–5 buổi/tuần), **bức tranh 6 mảnh theo
  tuần lịch là bức tranh không bao giờ xong**. Cả ba tính lại từ *số ngày riêng biệt có phiên hoàn
  thành*, nên chạy lại không thưởng hai lần. Migration `20260911120000` đánh số lại dữ liệu cũ theo
  thứ tự tuần, không mất mảnh nào.
- **Vườn Kỳ Diệu đủ 4 khu**: `thap-chu` (tháp chậu hoa a-b-c + truyện trên nấm), `tram-khong-gian`
  (nhà kính + khinh khí cầu bồ công anh + kính thiên văn), `ben-tau-tieng-anh` (thuyền lá buồm cánh
  hoa chữ A trên hồ sen). 15 → **24 lớp nền**, tổng tài sản 0,46 MB / 40 MB, `art:check` xanh.
- Sửa luôn một lỗi cũ: `weeklyEvent()`/`pictureForWeek()` trả `undefined` với mọi ngày **trước** tuần
  mốc 07/09/2026 (JS giữ dấu âm khi chia lấy dư) — một phiên ngày lùi làm hỏng cả bước trao huy hiệu.

**Việc 1–5 — ảnh bài vở, nhật ký lớp, bài cô giao** (`f27fead`, migration `20260911130000`)

| Việc | Đã làm |
|---|---|
| **1. P5 nạp ảnh** | `/parent/intake/new`: camera trực tiếp (`capture`), chọn nhiều ảnh, **nén ngay trên máy** (canvas, cạnh dài 2000, JPEG 0.82). `POST /api/intake` lưu **ảnh gốc nguyên vẹn** (bằng chứng ba mẹ quay lại xem sau này) rồi tạo `IntakeJob`. Kiểm quyền trên đúng `studentId` ở tầng server. |
| **2. Hàng chờ** | Job worker `intake.preprocess` (mỗi phút, `pnpm intake:run` gọi tay): xoay theo EXIF, cạnh dài 2000, `normalise` + `linear` nhẹ (bút chì phải còn là xám, không thành vệt đen), **tách ảnh chụp vở mở hai trang** theo rãnh gáy, nén ≤ 1,5 MB, **dHash** cảnh báo trùng trong 7 ngày. `inbox:pull` **chép ảnh nằm cạnh `context.json`**. `inbox:push` → `PENDING_REVIEW`. SSE `/api/events` thêm `toReview`, hộp thư tự làm mới khi kết quả về (`46afcfe`). |
| **3. P6 duyệt** | `/parent/intake/[id]`: ảnh trái có **bbox bấm được**, bảng item phải sửa inline (đúng/gần đúng/chưa đúng/để trống, mã lỗi, kỹ năng tìm bằng full-text). **`BLANK` ≠ sai**: ô trống có màu riêng, ghi rõ "con chưa làm xong" hay "con chưa biết làm", **đổi bằng một chạm**. Duyệt → `Evidence` (+ `ExternalProgress` cho NAVIO/Kids A-Z) → mastery. Cặp "máy đọc / ba mẹ sửa" ở lại trên `IntakeItem.skillCodes` vs `skillCodesFinal` để làm ví dụ cho lần sau. |
| **4. P7 + ghi chú nhanh** | `/parent/inbox` ba hàng chờ (chờ duyệt · chờ đọc · bài mở chờ chấm) + **badge trên thanh bên mọi trang**. FR-INT-04: ô một dòng, full-text gợi ý kỹ năng, ba mẹ chạm chọn → `Evidence(PARENT_NOTE, w=0.5)`. |
| **5. Nhật ký lớp & bài cô giao** | `/parent/diary`: dán văn bản → **bộ đọc theo mẫu, không AI** (regex trên chữ đã bỏ dấu, nên "dặn dò"/"dan do"/"Ðồng phục" đều khớp). Dòng nào không khớp mẫu → hàng chờ `DIARY_HARD`, **không đoán bừa**. Một việc cô giao → **một `Homework` cho từng bé**. Trạm "Bài cô giao" đứng **đầu bản đồ** (5 ngọn đèn sáng dần, mỗi lượt một sao; "Quay cho cô" lưu file để ba mẹ nộp Teams — app không tự nộp). Thẻ nhắc phi học tập chỉ hiện cho ba mẹ. `/parent/school` đề nghị lại ngày bắt đầu năm học. |

**Việc 6 — eval & nạp lô lớn** (`bf0bf3e`)

`pnpm eval:intake` chấm bộ nhãn `docs/eval/intake-v1/cases.json`; `pnpm content:import-intake` nạp
cả thư mục ảnh vở cũ vào **đúng hàng chờ duyệt P6**. Kết quả ở mục 4.

Sửa hai đường dẫn giải sai thư mục: `INBOX_ROOT` đẩy hàng chờ vào `packages/inbox/inbox/` thay vì
gốc repo (chỗ `CLAUDE.md` bảo nhìn và `.gitignore` che), và tương tự cho hai lệnh mới.

### 2. Cách chạy thử (PowerShell, tại gốc repo)

```powershell
docker compose --env-file .env -f docker/compose.yml up -d db     # Postgres 5433
pnpm db:migrate                                                   # 2 migration mới của pha 4
pnpm dev                                                          # web 5000 + worker (intake.preprocess mỗi phút)
```

| Tiêu chí | Chạy gì |
|---|---|
| 1. Nhật ký lớp | Mở `/parent/diary`, dán bài đăng 10/09 → xem "3 mục đã học · 3 bài cô giao · 1 lời nhắc". Rồi `pnpm plan:run -- --student thy --force` và mở `/kid/quest`: trạm đầu là **Bài cô giao** |
| 2. `BLANK` ≠ sai | `/parent/inbox` → mở phiếu ESL → 4 ô trống hiện "con chưa làm xong", chạm một cái thành "con chưa biết làm" |
| 3. 5 ảnh ≤ 90 giây | `/parent/intake/new` chụp/chọn 5 ảnh → `pnpm intake:run` → `pnpm inbox:pull` |
| 4. Duyệt → mastery | Duyệt trong `/parent/intake/<id>` rồi `Invoke-RestMethod "http://localhost:5000/api/students/<id>/mastery?subject=VIET"` |
| 5. Raz-Kids | Ảnh màn hình Kids A-Z → `result.json` có `externals` → duyệt → xem `ENL.RF.FLUENCY_LEVEL_*` |
| 6. Việc 0 | `/kid/home` xem trứng "x/4"; làm một bài sai → vẫn **+1 sao**; `/dev/kit` và `/kid/quest` xem 4 khu vườn |
| 7. Tất cả | `pnpm lint; pnpm test; pnpm build` rồi `$env:E2E_ADMIN_PASSWORD="…"; $env:E2E_CHANNEL="msedge"; pnpm --filter @mtct/web exec playwright test` |

Bộ nghiệm thu pha 4 đi **đúng đường thật**, kể cả dòng lệnh: nạp ảnh qua API → `pnpm intake:run` →
`pnpm inbox:pull` → tự viết `result.json` → `pnpm inbox:validate` → `pnpm inbox:push` → duyệt trên
web. Không có cửa sau nào cho test.

```powershell
$env:E2E_ADMIN_PASSWORD="<mật khẩu admin>"; $env:E2E_CHANNEL="msedge"
pnpm --filter @mtct/web exec playwright test e2e/phase4-acceptance.spec.ts
```

### 3. Bảng 7 tiêu chí xong

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | Dán nhật ký mẫu → **3 mục đã học + 3 bài cô giao + 1 nhắc đồng phục**; Daily Quest đổi trọng tâm | **Đạt** — bộ đọc mẫu giải thích **100%** bài đăng, không dòng nào phải vào hàng chờ. Bài "quay video" nhận đúng là **tuỳ chọn** ("cô khuyến khích") và đúng nơi nộp (Teams – Chương trình Việt). Phiên sau đó: trạm 1 = bài cô giao, phần trọng tâm có kỹ năng Tiếng Việt của bài 13. Ảnh `docs/screens/pha-4/diary-parsed.png` |
| 2 | Phiếu ESL làm dở → **`BLANK` chứ không phải sai**, đổi nhãn một chạm | **Đạt** — 2/6 câu làm được, 4 câu trống dồn về cuối → cả 4 là "con chưa làm xong" (trọng số 0,3), không dòng nào bị gắn nhãn sai. Ảnh `review-blank.png` |
| 3 | 5 ảnh vở Tiếng Việt → **≤ 90 giây** | **Đạt — 12 giây** (tiền xử lý 5 ảnh: 450 ms). Xem ADR-17 mục 1 về việc "có kết quả" nghĩa là gì sau ADR-10 |
| 4 | Duyệt → **mastery đổi và bằng chứng hiện trong drawer kỹ năng** | **Đạt** — mastery `VIET.HV.AM_U_UW` tăng sau khi duyệt; `GET /mastery/history?skill=…` trả bằng chứng `source=INTAKE_PHOTO`. **118 bằng chứng** từ ảnh/bài cô giao trên hồ sơ Thy. Ảnh `review-workbook.png` |
| 5 | Ảnh Raz-Kids → `raz_level` + `ENL.RF.FLUENCY_LEVEL_*` | **Đạt** — mức D cho: `AA=95 · A=95 · B=95 · C=85 · D=70 · E=30`, **đúng bảng `05` §5** |
| 6 | Việc 0 xong | **Đạt** — sao 1/bài làm xong (test ép sai 3 lần vẫn +1 sao), trứng 4/7 không reset (test đi qua ranh giới tuần), Vườn Kỳ Diệu 4 khu |
| 7 | `lint && test && build` xanh; **e2e pha 0–3 vẫn xanh** | **Đạt** — lint sạch · 295 test đơn vị (core 157, content 66, db 35, web 25, inbox 12) · build 4 gói · **32/32 e2e** (pha 0: 6 · pha 1: 7 · pha 2: 5 · pha 3: 5 · pha 4: 4 · login + screens: 5) |

### 4. Ngày bắt đầu năm học, và kết quả eval

**Ngày bắt đầu năm học: đề nghị tuần 1 từ thứ Hai 24/08/2026** (đang đặt 08/09/2026).

Căn cứ: nhật ký 10/09/2026 ghi lớp học **Tiếng Việt bài 13**. Tiếng Việt 1 tập một dạy **một bài mỗi
buổi** (TKB 1B3 có 5 tiết "Tiếng Việt cơ bản"/tuần, `05` §2), nên bài 13 = **buổi học thứ 13**. Đếm
ngược 13 buổi từ thứ Năm 10/09, bỏ thứ Bảy–Chủ nhật và **02/09 (Quốc khánh)** → buổi đầu tiên rơi
đúng **thứ Hai 24/08/2026**. Chuỗi bài của chính lớp đang ăn khớp với giả thiết "một bài một buổi".

**Tôi chưa tự đổi lịch.** `11` §5 nói ba xác nhận một lần, và mọi `expectedWeek` đo theo 35 tuần này
— đổi ngầm là lặng lẽ dán lại nhãn "đúng tiến độ / chậm" cho cả hai bé. Mở `/parent/school`, đối
chiếu bằng chứng trên màn hình rồi bấm **"Xác nhận và đặt lại 35 tuần"**.

Nếu trường nghỉ cả 03/09 (nhiều trường nghỉ liền 02–03/09) thì buổi đầu lùi thêm một ngày → tuần 1
từ **17/08**. Ba xem lịch trường rồi chọn giúp; ô ngày trên màn hình sửa tay được.

**Eval đọc ảnh (`pnpm eval:intake`, 9 ca có nhãn — `docs/eval/intake-v1.md`):**

```
gắn kỹ năng: top-1 33,3% · top-5 66,7% · có trong ngữ cảnh đưa cho người đọc 77,8%
đúng/sai:    chưa đo — cần 20 ảnh mẫu (mục 5)
quy tắc BLANK trên phiếu docs/11 §9: ĐÚNG
```

Ba điều rút ra, và điều thứ hai là điều đáng nhớ nhất của cả pha:

1. **Tìm kiếm một mình không đủ để gắn kỹ năng** (33% top-1, mục tiêu 80%). Nó tốt khi đề bài nói
   thẳng nội dung ("các số 6–10"), kém khi đề bài chỉ là mệnh lệnh ("Read and match") hoặc khi chữ
   trong đề trùng từ vựng của kỹ năng khác ("pets" trong bài về gia đình).
2. **Nhật ký lớp cứu phần lớn các ca đó.** Ca "Vở Tiếng Việt bài 13": tìm kiếm trượt hoàn toàn (trả
   về ba họ vần khác), nhưng vì tối hôm đó ba mẹ đã dán nhật ký nên `VIET.HV.AM_U_UW` nằm sẵn trong
   ngữ cảnh. **Dán nhật ký mỗi tối không chỉ lái Daily Quest — nó làm việc đọc ảnh chính xác hơn.**
3. **Hai lỗ thật:** kỹ năng đọc hiểu (`ENL.RL.*`) và viết câu (`ENL.W.*`) **không được đề xuất ở đâu
   cả**. Đề nghị cho pha 5/6: với phiếu ENL, đưa cả mạch kỹ năng vào ngữ cảnh chứ không chỉ kết quả
   tìm kiếm.

### 5. 20 ảnh mẫu cần chủ dự án chụp (việc 6 còn nợ nửa này)

Chép vào `intake-inbox/<tên gọi ở nhà>/<ngày>/`, ví dụ `intake-inbox/thy/2026-09-13/01.jpg`. Danh
sách đầy đủ kèm lý do từng ảnh ở `docs/eval/intake-v1.md` §5; tóm tắt:

| # | Chụp gì |
|---|---|
| 1–3 | Vở **Tiếng Việt** 3 trang con đã làm, có chữ cô sửa |
| 4–5 | Vở **Toán** 2 trang (cộng trong 10, viết số) |
| 6–8 | **Phiếu ESL** 3 tờ — **ít nhất 1 tờ con làm dở** (quan trọng nhất) |
| 9–10 | **Bài kiểm tra** có điểm và nhận xét |
| 11 | **Nhận xét / sổ liên lạc** của cô (chỉ chữ) |
| 12–13 | Màn hình **Kids A-Z**: trang cấp độ và trang sách đã đọc |
| 14 | Màn hình **NAVIO** |
| 15 | Màn hình **nhật ký lớp Edi Parent** |
| 16 | **Vở mở hai trang** chụp ngang một lần (thử tách trang) |
| 17 | **Chụp lại đúng trang ở ảnh 1** (thử cảnh báo trùng) |
| 18 | Một trang của **Chí Thanh** (thử phân biệt hai bé) |
| 19 | Một ảnh **hơi nghiêng, thiếu sáng** |
| 20 | Một ảnh **không phải bài học** (bìa vở) — phải ra `OTHER`, không bịa |

Chụp xong nói một câu, tôi đọc 20 ảnh, ghi nhãn thật và chạy lại eval để có con số "đúng/sai" đầy
đủ. Ảnh không vào git (`.gitignore` có `intake-inbox/`).

### 6. ADR đã viết

- **ADR-16** — ba quyết định của chủ dự án: sao theo công sức (thay bảng ADR-15 §5), trứng 4 ngày
  không reset, Vườn Kỳ Diệu 4 khu.
- **ADR-17** — năm chỗ pha 4 lệch tài liệu: (1) "≤ 90 giây có kết quả" nghĩa là gì sau ADR-10;
  (2) FR-INT-04 "AI gắn kỹ năng" → tìm kiếm gợi ý + ba mẹ chạm; (3) bài cô giao là loại trạm mới
  trong phiên; (4) `weightFactor` để `07` §2.2 vào được mô hình mastery; (5) ảnh Raz-Kids **đặt**
  mastery theo bảng `05` §5 thay vì nhích.

### 7. Chưa làm / tồn đọng

1. **Planner vẫn chưa đọc `PlanHint`.** `inbox:push` ghi gợi ý trọng tâm vào DB từ pha 2, nhưng
   planner chưa tôn trọng nó (`13` §3 nói phải). Không nằm trong 6 việc của pha 4 nên tôi không tự
   làm; **nên đưa vào pha 5** cùng màn kế hoạch P9, vì hai thứ cùng đụng một chỗ trong planner.
2. **Dữ liệu dev vẫn rối** (tồn từ pha 3): DB có **38 hồ sơ `Student`** lớp 1B3 do các bộ e2e cũ tạo
   — mới 2 bé còn hoạt động nên nhật ký chỉ sinh 6 `Homework`, nhưng danh sách nhìn vẫn rối. Nên dọn
   trước khi cho hai bé dùng thật.
3. **Chưa có ảnh bài vở thật nào đi qua đường này.** Toàn bộ pha 4 chạy bằng ảnh sinh trong test
   (trang kẻ dòng + nét bút giả). Pipeline đúng; chất lượng **đọc** ảnh thật chưa ai biết — đó chính
   là 20 ảnh ở mục 5.
4. **Bộ đọc nhật ký mới thấy đúng một bài đăng thật.** Mẫu của cô có thể đổi (đánh số khác, thêm
   môn). Mỗi bài đăng lệch mẫu sẽ vào hàng chờ `DIARY_HARD` chứ không mất, nhưng vài tối đầu ba mẹ
   nên liếc phần "Hệ thống đọc được" trước khi bấm "Đúng rồi".
5. **Ảnh `CLASS_DIARY` chưa có đường đọc riêng.** Chụp màn hình Edi Parent đi vào hàng chờ ảnh như
   mọi ảnh khác; đường dán văn bản (nhanh hơn, chính xác hơn, `11` §3 ưu tiên 1) đã chạy đủ.
6. **Chưa nén ảnh HEIC trên máy.** iPhone gửi HEIC thì trình duyệt không vẽ được lên canvas nên ảnh
   đi nguyên bản (server vẫn xử lý được, chỉ tốn mạng hơn).

### 8. Câu hỏi cho chủ dự án

1. **Xác nhận ngày bắt đầu năm học** — 24/08/2026 (nếu chỉ nghỉ 02/09) hay 17/08/2026 (nếu nghỉ cả
   02 và 03/09)? Mở `/parent/school`, bấm một cái là xong.
2. **20 ảnh mẫu** (mục 5) — cái này chặn nửa còn lại của việc 6.
3. **Dọn 38 hồ sơ `Student` thử nghiệm trong DB dev?** Tôi không tự xoá dữ liệu học của ai; nói một
   câu là tôi viết script dọn đúng các tài khoản do e2e tạo (`slug` bắt đầu bằng `p1kid-`).

## Pha 3 — 11/09/2026 — Góc của con: thế giới, mascot, phiên học

Trạng thái: **dựng xong, 7/8 tiêu chí tự kiểm đạt**; tiêu chí còn lại cần chủ dự án chấm trên iPad thật (60 fps, mục 8 checklist `06` §4). 14 commit trong pha, **chưa push**.

### 1. Đã làm gì

**Việc 0 — dọn tồn đọng ngân hàng bài đợt 1** (`b097402`; chi tiết: `content/_reports/pha-3-viec-0.md`)

- **Mã lỗi đúng nghĩa.** Thêm `lap_lai_tong` và `nham_chu_gan_giong` (bộ mã 42 → **44**), rồi **suy lại mã của từng phương án từ chính đáp án**: 471 bài đổi mã, 590 lượt trên từng phương án. Mã nào không có nghĩa nào khớp thì bỏ trống — một mã sai còn tệ hơn không mã, vì thang rèn sẽ rèn nhầm chỗ.
- **Bài đi trước bài học.** `VIET.HV.AM_A` là bài 1 (lớp mới biết một chữ) mà in "Nam"/"Nem" và thẻ kéo "cà" mang thanh huyền của bài 9. **156/453 bài Tiếng Việt** vi phạm → viết lại cả 10 gói từ danh sách từ đã kiểm, **giữ nguyên id** nên bài cập nhật tại chỗ, bằng chứng cũ của con vẫn trỏ đúng.
- **Một câu lệnh cho 214 bài.** Mỗi dạng nay có **≥ 6 cách hỏi và ≥ 4 gợi ý** mỗi ngôn ngữ, chia đều.
- **Lặt vặt.** Nhiễu là từ tiếng Việt thật (bỏ "trè", "dà"); câu phủ định viết lại khẳng định; **385 bài Toán** trỏ đúng trang của bài thay vì dải 11 trang; ô thả chỉ nhận thứ thuộc về nó; bài đếm không còn gửi `repeat` (vốn vẽ sẵn đáp án).
- **Ba kiểm định mới** trong `content:validate` + 20 test: mã lỗi phải *có thể* xảy ra với phương án nó gắn vào; chữ tiếng Việt in ra phải nằm trong phạm vi bài lớp đã học (bảng 83 bài của `09` §3); không câu lệnh nào chiếm quá 25% một dạng.
- Kết quả: `content:validate` **0 lỗi** · `content:import` chạy lại **0 thay đổi** · `content:stats` **1236 PUBLISHED** (không tụt), mọi kỹ năng ≥ 35 bài.

**Việc 0b — TTS Azure** (`b3223ba`)

Azure AI Speech, tầng F0, vùng **eastasia**. Tiếng Việt **`vi-VN-HoaiMyNeural`, không bọc `<prosody>`** — chủ dự án đã nghe 6 mẫu và loại bản chậm/cao hơn, nên code **từ chối** thêm lại: `buildAzureSsml` chỉ phát `<prosody>` cho tiếng Anh. Tiếng Anh **`en-US-AnaNeural` bọc `<prosody rate="-10%">`**; `TTS_RATE` **chỉ áp cho tiếng Anh** (có test). `pnpm tts:voices` gọi danh sách giọng thật của tài nguyên Azure; `pnpm tts:smoke "<câu>"` ghi một mp3 vào `_tts-thu/` (đã gitignore). Không khoá thì mọi thứ vẫn chạy bằng Web Speech, test vẫn xanh. **Khoá chỉ nằm trong `.env`; `.env.example` chỉ có chỗ trống.**

**Việc 1 — tài sản đồ hoạ** (`6548d5e` bảng phong cách, `cd3a2b0` hàng loạt, tranh tuần bổ sung ở `8d39483`)

`content/art/STYLE.md` là hợp đồng phong cách: không viền đen, ba sắc độ mỗi hình, sáng từ trên-trái, bóng là ellipse mờ (filter blur tốn khung hình trên iPad), mỗi bộ phận động nằm trong một `id` riêng để Framer Motion điều khiển. **134 tài sản, 0,43 MB / 40 MB**: 4 khu Thành phố Robot + 1 khu Vườn Kỳ Diệu × 3 lớp (15 lớp nền); 2 mascot × 9 trạng thái; 8 avatar; 11 hiệu ứng (trứng, giấy chứng nhận, sao vàng lớn, rương); **70 vật thể**; **6 tranh tuần**; 6 âm thanh WAV tự tổng hợp (không giấy phép phải theo dõi, và không tiếng nào nghe như tiếng "sai"). Ba lệnh: `art:build` vẽ tất, `art:check` đo ngân sách và **chặn blur / đen tuyền**, `art:sync` chép sang `apps/web/public`. Sửa quy tắc mỹ thuật = **sửa `STYLE.md` trước**, rồi sửa generator — tài sản không sửa tay được nên phong cách không trôi.

**Việc 2 — design system & motion** (`af6de8f`), trình diễn ở `/dev/kit`

64 px để chạm, 22 px để đọc, không đỏ ở đâu cả, mọi chữ đọc được to, mọi chuyển động tắt khi máy xin ít chuyển động. Mascot là SVG nội tuyến (không phải `<img>`) nên **thở, chớp mắt, mở miệng đúng nhịp giọng đọc, kêu "hí hí" khi bị chọc**. `WorldBackground` xếp 3 lớp, trôi theo con trỏ hoặc độ nghiêng iPad, **giữ yên vùng giữa** cho đề bài, **nhuộm trời theo giờ thật**. Có `BigButton`, `StarFlyToPocket`/`StarPocket` (sao bay theo đường cong rồi số đếm nhảy), `FeedbackOverlay` ba trạng thái không có trạng thái nào là thất bại, `LoadingMascot`/`EmptyState`/`OfflineNotice` (mascot đang làm gì đó, không có spinner trơn), `SceneTransition`, `KidPinPad`, `HintBulb`, `SpeakerButton`, `useSpeak`.

**Việc 3 — sáu dạng bài** (`fe657aa`)

Một cửa vào (`ExerciseRenderer`), props giống nhau. `LISTEN_CHOOSE` **phát chứ không in** `listenTarget` (ADR-14). `DRAG_DROP` nghiêng – hít – nảy; **thẻ đặt sai vẫn được đặt** để máy chủ chấm theo tỉ lệ và đọc được `dragItems[].errorTag`, chấm xong thẻ sai mới bay về (ADR-15); chạm cũng được, không bắt buộc kéo. `COUNT_TAP` đánh số theo ngón tay, vẽ theo `repeat`, không bao giờ theo đáp án. `READ_ALOUD` khớp từng từ bằng `packages/core` (máy chủ dùng lại đúng hàm đó nên một lần đọc không bị chấm hai kiểu), tha giọng Bắc (s/x, ch/tr, r/d) nhưng **rơi dấu vẫn tính là trượt**, và **luôn có** lối "đọc cho ba mẹ nghe". `WRITE_PHOTO` chụp → `PENDING` → hàng chờ; "để chụp sau" là **quyết định, không phải lỗi**.

**Việc 4 — planner & phiên học** (`85ca582`)

- `packages/core/planner` — thuần, **22 test**, gồm đúng ca `docs/08` nêu: 2 lỗi `nham_b_d` trong 7 ngày → phiên kế có bài **đối chiếu b/d**, **≤ 4 bài rèn**, bậc 3 xin mascot làm mẫu, bậc 4 lùi về tiên quyết, không bao giờ rèn quá 2 kỹ năng một lúc. Phiên 12 bài (1,3 phút/bài, kẹp 8–15), khởi động → thang rèn → 50/30/20, và **không quá 2 bài cùng môn liền nhau**.
- `packages/core/grading` — chấm thuần, **18 test**: `choices[].errorTag` / `dragItems[].errorTag` → `Evidence.errorCode`; ba lần: gợi ý 1 → gợi ý 2 → hiện đáp án đọc to; **không bao giờ có chữ "sai"**.
- `packages/db/session` — lên phiên (idempotent theo ngày; chọn bài từ ngân hàng pha 2; **ưu tiên thế giới của bé**; hôm qua mệt thì hôm nay ngắn 20%; bài lớp học 3 ngày gần nhất lên đầu nửa trọng tâm), ghi `Evidence` qua `commitEvidence`, sao, streak, và **một bước trên thang rèn** cho mỗi kỹ năng phiên đó rèn. **6 test tích hợp**: máy con **không nhận `answerKey` hay `errorTag`**; gửi lại cùng một câu trả lời **không chấm hai lần**; phiên dở **biết chỗ đi tiếp**; ba lần thử ra gợi ý 1, gợi ý 2, rồi đáp án + `dem_thieu_1` vào `Evidence`.
- `apps/worker` — job **`planner.daily` 04:00** (nhật ký worker in `queue: planner.daily, cron: 0 4 * * *`) + **`pnpm plan:run`** gọi tay (`--student thy --date … --force`).
- `apps/web` — `POST /api/sessions`, `GET /api/sessions/:id`, `POST /api/sessions/:id/attempts`, `.../finish`, `.../choice`, và **SSE `GET /api/events`** (tiến độ phiên, huy hiệu mới, bài chấm xong) có `retry` nên mất mạng thì trình duyệt tự nối lại; mọi route kiểm quyền trên đúng `studentId` ở tầng server.

**Việc 5 — màn hình K1–K5, K7 + giữ mới** (`8d39483`, `38e807f`)

K1 có nhân vật vẽ thật + mascot chào. K2 là **một nơi chốn**: thế giới, mascot chào bằng giọng và **nhắc một việc hôm qua**, túi sao, ngọn lửa streak, trứng tuần, tranh tuần, hộp thư, một nút to duy nhất. K3 `QuestMap`: con đường 12 trạm, avatar đi giữa các trạm, trạm xong lấp lánh, **rương cuối đường**, 2 trạm có nhãn "chọn". K4 làm bài **trên nền thế giới**, có **nghỉ vận động 30 giây** (lần đầu không bỏ qua được) và câu hỏi **"chơi tiếp hay nghỉ"** sau 8 bài. K5 `SessionFinale` 4–6 giây: rương mở → sao tràn → số đếm nhảy → **lễ trao huy hiệu** → mascot nhảy, chạm để bỏ qua. K7 mua bằng sao và **đặt vật phẩm vào đúng chỗ trong thế giới của mình**, kèm hàng giấy chứng nhận in được.

**Bảy cơ chế P0 của `06` §1.8c là dữ liệu thật, không phải trang trí:** trứng nứt theo **ngày học** (5 ngày thì nở ra thú); tranh tuần lật một mảnh mỗi ngày (6 mảnh); thế giới đổi theo giờ thật; thư ba mẹ mascot đọc to (`KidMail`, FR-PAR-08); nút "Khen" thả một **sao vàng lớn**; kỹ năng thành thạo in được **giấy chứng nhận** A4 (`/kid/certificate/<id>`, có CSS in); mascot nhắc đúng một việc đã xảy ra (`MascotMemory`, dùng một lần). Tất cả tính từ *số ngày thực sự có phiên hoàn thành* nên **không thưởng hai lần**, và **nghỉ một ngày không mất gì**.

Seed thêm: **23 huy hiệu** (6 huy hiệu sự kiện tuần chỉ tuần đó lấy được), **22 vật phẩm**, **8 thú cưng**.

### 2. Cách chạy thử (PowerShell, tại gốc repo)

```powershell
docker compose --env-file .env -f docker/compose.yml up -d db   # Postgres 5433
pnpm db:migrate; $env:SEED_DEV="1"; pnpm db:seed                # 23 huy hiệu · 22 vật phẩm · 8 thú
pnpm content:import                                             # ngân hàng 1236 bài
pnpm plan:run -- --student thy                                  # lên Daily Quest hôm nay bằng tay
pnpm dev                                                        # web 5000 + worker (planner.daily 04:00)
```

Vào `http://localhost:5000/login` → thẻ **Thy** → 4 hình **Mèo › Thỏ › Bướm › Cá** → K2. Component: `/dev/kit`. Gửi thư / khen con: `/parent/<id>`.

Chạy bộ nghiệm thu pha 3 (tự đi hết con đường và chụp ảnh):

```powershell
$env:E2E_ADMIN_PASSWORD="<mật khẩu admin>"; $env:E2E_RESET_QUEST="1"; $env:E2E_CHANNEL="msedge"
pnpm --filter @mtct/web exec playwright test e2e/phase3-acceptance.spec.ts
```

### 3. Tám tiêu chí xong

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | Thy đăng nhập → Daily Quest **12 bài ≥ 3 dạng, ≥ 2 môn** | **Đạt** — phiên hôm nay (`cmtx3003f00zh…`): **12 trạm, đủ cả 6 dạng** (MCQ 4 · LISTEN_CHOOSE 2 · COUNT_TAP 2 · DRAG_DROP 2 · READ_ALOUD 1 · WRITE_PHOTO 1), **4 môn** (ESL 4 · VIET 3 · VMATH 3 · ENL 2). Ảnh `k3-map.png` |
| 2 | Xong phiên có **kịch bản ăn mừng và sao** | **Đạt** — `SessionFinale` 4–6 giây, `+21 (tất cả 156 sao)`, trứng 1/5, tranh 1/6. Ảnh `k5-finale.png` |
| 3 | **Sai 3 lần** thấy gợi ý rồi đáp án, **không có chữ "sai"** | **Đạt** — test tích hợp `session.test.ts` ép sai 3 lần: gợi ý 1 → gợi ý 2 → `Đáp án là …` + giải thích; e2e quét toàn bộ `body` mỗi trạm, không trang nào chứa chữ "sai" hay "điểm số" |
| 4 | **Mastery các kỹ năng trong phiên thay đổi** | **Đạt** — sau các phiên hôm nay: **119 dòng `Evidence`**, **23 dòng `SkillMastery`**, và `ErrorStat` của Thy có `dem_thieu_1:6 · dem_thua_1:5 · lap_lai_tong:1 · nham_am_dau:1` — tức chẩn đoán từ `choices[].errorTag` đã chạy suốt từ lúc con chạm tới bảng thống kê lỗi |
| 5 | **Playwright K1→K5 xanh** | **Đạt** — 5 test pha 3 xanh; chạy cả bộ: **28/28 e2e xanh** (pha 0: 6 · pha 1: 7 · pha 2: 5 · pha 3: 5 · login+screens: 5) |
| 6 | **Checklist `06` §4** trên iPad Safari | **Tự kiểm 11/12 trên Edge/Chromium** (bảng ở mục 4 dưới). Mục 8 (60 fps đo bằng Safari Web Inspector trên iPad thật) **chủ dự án cần chấm** — máy này không có iPad |
| 7 | **Video 2 phút** một phiên học | **Đạt** — `docs/screens/pha-3/phien-hoc-k1-k5.webm` (2 phút 47 giây, 4,8 MB): đăng nhập bằng hình → bản đồ → 12 trạm → nghỉ vận động → "chơi tiếp hay nghỉ" → ăn mừng |
| 8 | **`pnpm tts:smoke "Nghe rồi chọn ô đúng nhé!"` ra mp3 đúng giọng** | **Đạt** (chủ dự án dán khoá lúc 22:17 ngày 11/09) — `_tts-thu/smoke-vi-*.mp3`, 15 KB, lệnh in `giọng vi-VN-HoaiMyNeural (azure/eastasia), giọng gốc, không prosody`. Câu tiếng Anh (`--en`) ra `en-US-AnaNeural … prosody rate=-10%`. `pnpm tts:voices` đọc được 79 giọng của vùng eastasia |

Thêm hai tiêu chí chủ dự án bổ sung: `docs/09` **có bảng unit Global Stage Level 1 cho cả hai quyển** (§4b.1 Language Book, §4b.2 Literacy Book) — **đạt**; `esl.json`/`enl.json` **không còn `standardRef` ước đoán kiểu `GS1.U<n>`** — **đạt** (mục 5 dưới).

### 4. Checklist "hấp dẫn với trẻ" (`06` §4, 12 mục)

| # | Mục | Kết quả |
|---|---|---|
| 1 | Không màn hình nào chỉ chữ + nút trên nền trơn | **Đạt** — K1, K2, K3, K4, K5, K7 đều đứng trên `WorldBackground` 3 lớp có mây trôi, sao lấp lánh |
| 2 | Mascot ở mọi màn hình, `idle` chớp mắt, phản ứng khi chạm, đúng trạng thái | **Đạt** — 9 trạng thái; `greet` ở K2, `think` khi con đang làm, `cheer`/`celebrate` khi xong |
| 3 | Mọi nút/thẻ có phản hồi hoạt hình; xuất hiện có stagger | **Đạt** — `BigButton` nén 0.94 rồi bật lại; thẻ vào theo `STAGGER` 60 ms |
| 4 | Đúng: sao bay + đếm nhảy + âm thanh + mascot `cheer`; gần đúng: lắc + gợi ý trượt lên, không đỏ | **Đạt** |
| 5 | Bản đồ: avatar di chuyển, trạm xong lấp lánh, cuối đường có rương | **Đạt** — ảnh `k3-map.png` |
| 6 | Xong phiên: rương mở, sao tràn, huy hiệu, mascot nhảy, bỏ qua được | **Đạt** — ảnh `k5-finale.png`, chạm bất kỳ đâu là nhảy tới cuối |
| 7 | Tải/trống/mất mạng có minh hoạ + mascot, không spinner trơn | **Đạt** — `LoadingMascot`, `EmptyState`, `OfflineNotice` |
| 8 | **60 fps trên iPad**, tài sản màn hình ≤ 1,5 MB | **Cần chủ dự án chấm trên iPad.** Phần đo được: một màn hình nặng nhất tải **≤ 120 KB** tài sản (3 lớp nền ≈ 15 KB + mascot ≤ 3,5 KB + vật thể ≤ 1,4 KB mỗi cái); `art:check` chặn blur filter — thứ hay làm rớt khung hình nhất |
| 9 | Video 2 phút | **Đạt** — mục 3 tiêu chí 7 |
| 10 | Có trạm chọn 1-trong-2; có nghỉ vận động; hỏi "chơi tiếp hay nghỉ" sau 8 bài | **Đạt** — 2 trạm chọn mỗi phiên (ảnh `k3-map.png` có nhãn "chọn"), ảnh `k4-movement-break.png`, `k4-carry-on.png` |
| 11 | Mascot làm mẫu được một bài (`scaffold: model`) | **Đạt** — ảnh `k4-model-first.png`; thang rèn bậc 3 xin đúng loại bài này |
| 12 | Bảy cơ chế P0 của §1.8c chạy được | **Đạt** — trứng, tranh tuần, giờ thật, thư ba mẹ, sao vàng lớn, giấy chứng nhận, ký ức mascot |

### 5. Tiếng Anh — Global Stage Level 1 (`c397907`, `0eafeba`)

- **Tải chương trình công khai** Scope & Sequence của Macmillan cho **Language Book 1** và **Literacy Book 1**, lưu `sach giao khoa/global-stage/`, tóm tắt vào **`docs/09` §4b**: 10 unit mỗi quyển với từ vựng → cấu trúc câu → phonics → kỹ năng đọc/viết → tuần dự kiến. Literacy Book có thêm hai bài đọc và kỹ năng đọc từng unit (long o, e, a, i, u → blend pr/pl, fl/fr, sl/st → digraph sh/ch, th).
- **Gắn lại bản đồ kỹ năng.** ESL: 32 kỹ năng gắn `GS1-LB.*`, 14 kỹ năng phonics gắn `GS1-LIT.*`, **3 kỹ năng RETIRE** (`isActive=false`, không xoá cứng): `VOC.WEATHER`, `VOC.DAYS_OF_WEEK`, `VOC.TRANSPORT` — Global Stage 1 không dạy. `VOC.NUMBERS_1_20` và `PH.BLENDS_FINAL` giữ lại nhưng bỏ `standardRef` (thuộc English Maths và Raz-Kids). **Thêm 16 kỹ năng** cho phần chương trình trước đây không kỹ năng nào trỏ tới. ENL: 7 kỹ năng gắn `GS1-LB.*`, 11 gắn `GS1-LIT.*`, thêm `ENL.RL.PREDICTING`. **Không còn `GS1.U<n>` nào.**
- **Rà 398 bài ESL/ENL/EMATH của pha 2: giữ 398 · sửa 309 · RETIRE 0.** Mọi từ trong bài đều là từ vựng Global Stage Level 1, từ trên phiếu Unit 1 của trường, nhiễu chính tả cố ý, hoặc từ phần ôn phonics — **đoán về *nội dung* ở pha 2 là đúng, chỉ tên sách là sai**. 259 bài nay trỏ đúng unit thật thay vì "chưa có giáo trình của trường"; 50 bài sight word nói rõ lấy từ danh sách Dolch, không phải từ giáo trình.
- **Đúng những trang cần chụp** (`docs/09` §4b.4) — vài trang một, theo tiến độ lớp:

| Ưu tiên | Quyển | Trang | Để làm gì |
|---|---|---|---|
| 1 | Language Book 1 | **tr.4–9** (Language Review) | danh sách từ thật của phần ôn đầu sách |
| 2 | Language Book 1 | **tr.10–21** (Unit 1) | lớp đang học: mẫu câu, bài tập, thứ tự lesson |
| 3 | Literacy Book 1 | **tr.4–7** (Phonics Review) + **tr.8–23** (Unit 1) | hai bài đọc *Come On, Family!* và *Zoom Town* |
| 4 | Language Book 1 | **tr.22–33** (Unit 2) | unit kế tiếp |
| 5 | Literacy Book 1 | **tr.24–39** (Unit 2) | unit kế tiếp |
| 6 | cả hai | **mục lục** (tr.2–3) | xác nhận số lesson mỗi unit để chia tuần |

### 6. Lệch tài liệu — ADR-15

`docs/adr/ADR-15-goc-cua-con-pha-3.md` ghi sáu chỗ: (1) tài sản là **SVG vẽ bằng code + Framer Motion**, không phải Lottie như `06` §1.9 đề xuất — không có hoạ sĩ, các gói Lottie miễn phí không cùng bút pháp, và `lottie-web` nặng gấp rưỡi cả thư viện tài sản hiện tại; (2) **`dragItems[].errorTag`** — điểm ADR-14 để ngỏ, nay làm, kèm việc **thẻ đặt sai vẫn được đặt**; (3) **hai mã lỗi mới**; (4) **`06` §1.8c được viết lại** từ `03` §2.7 + FR-PAR-08 + nhật ký 10/09 vì mục gốc không còn trong file (giữ nguyên cách đánh số để FR-PAR-08 "mục 5, 10" vẫn đúng), và thêm mục 12 vào checklist §4; (5) **chốt con số** cho sao / trứng / tranh tuần; (6) API phiên học là `POST /api/sessions/:id/attempts` chứ không phải `POST /api/attempts` như `02` §5 phác.

### 7. Chưa làm / cần chủ dự án

1. ~~Sinh mp3 cho cả ngân hàng~~ — **xong 11/09/2026, 22:35–23:41.** `pnpm content:import` sinh **986/986 câu, 0 lỗi, 0 bỏ qua** trong 66 phút (1236 đề bài gộp lại còn 986 câu khác nhau; nhịp 3,3 giây/câu để không đụng trần 20 yêu cầu/phút của tầng F0). **22 MB** trong `FILE_ROOT/tts`, ngoài git. `content:stats` báo `audio: 986/986 câu đã có mp3 (azure)`. Kiểm bằng đúng đường dẫn app dùng (`speakAudio` → `getOrSynthesize`): cả đề bài lẫn `listenTarget` đều trả `source: cache` — con nghe giọng Hoài My đã sinh sẵn, không gọi mạng và không rơi về giọng máy. Sinh lại chỉ cần chạy lại lệnh; câu nào đã có mp3 thì bỏ qua.
2. **Chấm mục 8 của checklist trên iPad thật** (60 fps trong lúc làm bài, đo bằng Safari Web Inspector) — và nếu được, để hai bé dùng thử 10 phút không cần ba mẹ trợ giúp.
3. **K6 "chơi thêm theo môn"** và **K8 "Hỏi bạn Cú"** không thuộc pha 3 (`docs/08` giao K1–K5 và K7) — K6 ở pha 7, K8 là gia sư giọng nói P2. Trang chủ vì thế **chưa có 3 icon môn** như `06` §1.2 mô tả, để không dẫn con vào màn hình trống.
4. **Dọn dữ liệu dev:** máy đang có **28 lô `content:import`** và một loạt tài khoản "Bé Thử"/"Thy"/"Thanh" do các bộ e2e cũ tạo — ảnh chụp màn hình đăng nhập vì thế hơi rối. Không ảnh hưởng bản thật (seed chỉ tạo 1 admin), nhưng nên dọn trước khi cho hai bé dùng.
5. **Giọng mascot thu sẵn** (`06` §1.8b mục 5: 40–60 câu thoại thu giọng thật) chưa làm — hiện mascot nói bằng TTS. Việc này hợp với pha 7, hoặc làm sớm nếu chủ dự án muốn tự thu.

### 8. Câu hỏi cho chủ dự án

1. **Luật sao** (ADR-15 mục 5): đúng ngay lần đầu 2 sao · làm xong 1 sao · xong phiên 3 sao · nghỉ vận động 1 sao · ba mẹ khen 5 sao. Vật phẩm K7 từ 8 đến 50 sao. Có muốn đổi tỉ lệ không?
2. **Trứng nở cần 5 ngày học/tuần** — với lịch nhà mình (học các ngày trong tuần) thì con phải học gần như đủ tuần mới nở. Giữ 5, hay hạ xuống 4?
3. Hai bé dùng **cùng một thế giới cho mọi môn** (Thy: Vườn Kỳ Diệu, Thanh: Thành phố Robot) — pha 3 mới vẽ **1 khu vườn**, 4 khu robot. Có muốn tôi vẽ đủ 4 khu vườn ở pha sau không, hay để tài sản nhẹ như hiện tại?

### 9. Bàn giao cho người làm pha 4

Pha 4 là "nạp ảnh bài vở & duyệt" (`08` pha 4). Những thứ pha 3 để lại mà pha 4 dùng được ngay, và những chỗ dễ vấp:

**Dùng lại được ngay**

| Pha 4 cần | Đã có sẵn | Ở đâu |
|---|---|---|
| Hàng chờ AI cho ảnh vở (mục 2, 6) | `packages/inbox` đủ ba lệnh `inbox:pull / validate / push`, trang `/admin/inbox`, schema `IntakeExtraction` / `GradeResult` / `DiaryParse` | `packages/inbox/src/`, `CLAUDE.md` mục "Xử lý hàng chờ AI" |
| Lưu ảnh | `POST /api/kid/photo` nhận ảnh, kiểm loại và kích thước, trả `photoKey`; dùng `fileStorage()` (FILE_ROOT) — pha 4 dùng chung adapter này cho `POST /api/intake` | `apps/web/app/api/kid/photo/route.ts`, `apps/web/lib/storage.ts` |
| Chấm bài mở đi qua hàng chờ | Mỗi `WRITE_PHOTO` con gửi đã tự tạo `InboxItem(WRITE_PHOTO_GRADE)` với `attemptId` trong payload; `inbox:push` ghi kết quả ngược vào `Attempt` | `packages/db/src/session/grade.ts` (`queueForGrading`), `packages/inbox/src/push.ts` (`applyGrade`) |
| SSE "có kết quả rồi" (mục 2) | `GET /api/events` đã phát trạng thái phiên, huy hiệu mới và **số bài đã được AI/ba mẹ chấm**; thêm một trường vào `snapshotOf` là xong | `apps/web/app/api/events/route.ts` |
| Planner đổi nguồn "bài đang học" sang `DiaryLesson` 3 ngày gần nhất (mục 5) | **Đã làm ở pha 3**: `plannerSnapshot` đọc `ClassDiary`/`DiaryLesson` theo lớp của bé và đưa vào `lessonSkills`, planner xếp các kỹ năng đó lên đầu nửa trọng tâm (có test). Pha 4 chỉ còn phải **đổ dữ liệu vào hai bảng đó** | `packages/db/src/session/plan.ts:78`, `packages/core/src/planner/plan-session.ts` |
| Trạm "Bài cô giao" đầu bản đồ (mục 5) | Slot đã mang `kind` và bản đồ đã vẽ theo `kind`; thêm một `SlotKind` mới + một renderer là có trạm mới, không phải sửa cấu trúc phiên | `packages/core/src/planner/types.ts:13`, `apps/web/components/kid/quest-map.tsx` |
| `BLANK` ≠ sai (tiêu chí xong của pha 4) | Đã là luật ở tầng chấm: bỏ qua một bài trả về `pending`, **không ghi `Evidence`**, không tính điểm | `packages/core/src/grading/mark.ts` |

**Chỗ dễ vấp trên máy này**

1. `pnpm build` **hỏng khi web server đang chạy** — `prisma generate` không đổi tên được `query_engine-windows.dll.node` (EPERM). Dừng `next dev`/`next start` trước khi build.
2. Playwright: **`E2E_CHANNEL=msedge`** (máy này không có Chromium bundled); `playwright.config.ts` đã đặt `actionTimeout: 10_000` — đừng bỏ, nếu không một nút bị che sẽ treo hết ngân sách của test.
3. Trình nạp nội dung chỉ cho nghỉ bài **trong những file mà lần nạp đó đọc** (sửa 11/09). Nếu viết test nạp nội dung mới, nhớ dùng `sourceFile` riêng, đừng mượn tên file của gói thật.
4. Ngân hàng phải giữ **1236 `PUBLISHED`**; `pnpm content:stats` là cách kiểm nhanh nhất sau mỗi lần đụng vào trình nạp.
5. Dữ liệu dev đang lẫn tài khoản và lô của các bộ e2e cũ (xem mục 7.4) — nên dọn trước khi quay video hay cho hai bé dùng.

## Pha 2 — 11/09/2026 — Xưởng nội dung & ngân hàng bài luyện (đợt 1)

Trạng thái: **xong** (7/7 tiêu chí đạt, kiểm cả trên máy dev lẫn stack Docker sạch không có khoá nào). 7 commit, chưa push. Đầu pha có 2 commit thi hành ADR-11 và dọn tài liệu QC để lại.

### Đã làm theo 5 việc

0. **Trước việc 1 — thi hành ADR-11 phương án (c) + dọn tài liệu** (`ab304db`, `d29577e`):
   - `ab304db` commit giúp phần QC sửa còn treo: bỏ nốt chữ "pgvector/embedding" trong `docs/02`, `04`, `07`, `08`. *(Ghi chú: git identity trên máy **đã có sẵn** — `truongbtr@gmail.com`, không phải cấu hình lại.)*
   - `d29577e` **gỡ hẳn nhân bản giọng**: xoá `scripts/tts-clone-voices.mjs`, lệnh `pnpm tts:clone`, provider nhân bản, `personaFor`/`VoicePersona`, và **thư mục `ai voice/`** trên máy chủ. Giữ TTS cloud tuỳ chọn với **giọng dựng sẵn** trong `packages/core/src/tts/` (dùng chung cho web và trình nạp). **Gỡ vỏ MEDIFA ONE**: token màu về slate trung tính theo `docs/06` §2, thêm token `--color-kid-thy`/`--color-kid-thanh` cho pha 5, bỏ `/admin` dashboard, giữ `/admin/health`. Env còn `TTS_PROVIDER | TTS_API_KEY | TTS_APP_ID | TTS_REGION | TTS_VOICE_VI | TTS_VOICE_EN | TTS_RATE`.
   - Sau đó chủ dự án cập nhật ADR-11 thêm **Vbee** làm nhà cung cấp tiếng Việt → đã thi hành trong `0ccf6fb`: provider `vbee` (header `App-Id`, tải mp3 ngay vì link hết hạn ~3 phút), **sinh dần và chạy lại được** (hết hạn mức thì dừng êm, báo còn bao nhiêu câu), `pnpm tts:voices` để lấy mã giọng thật, `content:stats` hiện số câu đã có mp3.

1. **`packages/content` — xưởng nội dung** (`bdaa2a6`): schema Zod cho file bài học (`10` §4.1) và gói bài luyện (`10` §4.2) + bộ dựng `ExerciseSpec` (`04` §5). Bốn lệnh thật, không stub: `content:validate` · `content:import [--dry-run] [--dir] [--no-tts]` · `content:stats` · `content:export --skill`. Validator kiểm cả những thứ schema không nói được: trùng câu hỏi, thiếu mức khó, dùng dạng bài kỹ năng không khai, `errorTag` ngoài `error-taxonomy.json`, và **bắt buộc nhiễu của bài Toán/học vần phải có chẩn đoán**.
   *Lệch tài liệu:* ba lệnh đụng DB (`import`/`stats`/`export`) đặt ở **`packages/db`** chứ không phải `packages/content` như `docs/10` §10 phác thảo — cho chiều ngược lại sẽ tạo **vòng phụ thuộc** và Turborepo từ chối chạy. Lệnh `pnpm content:*` người dùng gõ không đổi. (ADR-14 mục cuối.)

2. **`packages/inbox` — hàng chờ AI** (`0ccf6fb`): schema `IntakeExtraction`, `GradeResult`, `DiaryParse`, `WeeklyReport`, `PlanHint` + `ExerciseSpec` tái xuất từ `@mtct/content`; lệnh `inbox:pull` / `inbox:validate` / `inbox:push`; trang `/admin/inbox`. `context.json` kèm **ứng viên kỹ năng lấy từ `searchSkills` của pha 1**, bộ mã lỗi đầy đủ, 10 lần ba mẹ đã sửa nhãn, và **chỉ tên gọi ở nhà** (test kiểm `context.json` không chứa tên đầy đủ). Validator từ chối: `result.json` sai loại việc, mã lỗi ngoài bộ, và **bất kỳ câu nào nói với bé có chữ "sai"**. Mục **"Xử lý hàng chờ AI"** 4 bước đã viết vào `CLAUDE.md`.

3. **Xem trước & duyệt** (`0ccf6fb`): `/admin/content` theo FR-ADM-05 — danh sách lô, **xem thử bài đúng như con sẽ thấy** (`components/kid/exercise-preview.tsx`, nền thế giới, chạm ≥ 64 px, chữ ≥ 22 px, nút Nghe), gắn cờ `GOOD`/`BAD` (gắn `BAD` là bài rời ngân hàng ngay), phát hành / thu hồi cả lô, và bảng phủ nội dung tô đỏ kỹ năng < 10 bài. `/dev/kit` dán `ExerciseSpec` bất kỳ vào là render. Nút nghe thử dùng mp3 sinh sẵn, không có thì rơi về Web Speech.

4. **Soạn nội dung đợt 1** (`94238dc`): **28 kỹ năng · 1236 bài**. Đọc SGK thật — PDF quét không có lớp chữ nên tách ảnh từng trang ra rồi đọc: Toán B1/B2/B3/B4/B5/B10/B11, Tiếng Việt B1, 2, 3, 4, 6, 8, 13, 14. Câu nhận biết, bảng ghép âm, từ khoá có tranh và nhân vật (Nam, Mai, Việt, Mi, Rô-bốt, bà, bé) đều lấy từ sách. Báo cáo rubric ở `content/_reports/dot-1.md`.

5. **Nạp & phát hành** (`94238dc`): `content:validate` sạch → `content:import` → duyệt và phát hành trong `/admin/content` → `content:stats` cho thấy **cả 28 kỹ năng ≥ 35 bài `PUBLISHED`, không kỹ năng nào thiếu dạng hay mức khó**.

### Bảng 7 tiêu chí xong

| # | Tiêu chí | Kết quả | Cách tự kiểm (PowerShell, tại gốc repo) |
|---|---|---|---|
| 1 | `content:stats` ≥ 25 kỹ năng, mỗi kỹ năng ≥ 35 bài `PUBLISHED`, không thiếu dạng bài pha 3 | **Đạt** — 28 kỹ năng, 1236 bài, ít nhất 40 bài/kỹ năng, cột "thiếu dạng"/"thiếu mức khó" đều trống | `pnpm content:stats` |
| 2 | `content:import --dry-run` chạy lại lô cũ báo **0 thay đổi** | **Đạt** — `0 new, 0 updated, 1236 unchanged` · `dry-run: 0 changes` | `pnpm content:import --dry-run` |
| 3 | Sửa 1 bài rồi nạp lại → cập nhật tại chỗ, `stableId` giữ nguyên, `Evidence` cũ không mất | **Đạt** — làm thật: sửa lỗi "1 apples" → `0 new, 1 updated, 1231 unchanged`, bài vẫn `PUBLISHED`. Test tích hợp chứng minh `Attempt`/`Evidence` cũ còn nguyên và **7 bảng dữ liệu học của con không đổi một dòng** | `pnpm --filter @mtct/db test` (9 test importer) |
| 4 | 20 bài ngẫu nhiên, tự chấm rubric `docs/10` §6, ≥ 18/20 đạt | **Đạt 20/20 — sau hai vòng sửa.** Lần chấm đầu 14/20; 9 lỗi hệ thống tìm được và cách sửa ghi ở `content/_reports/dot-1.md` §4 | `node scripts/sample-exercises.mjs pha-2-dot-1 20` (luôn ra đúng 20 mã đó) |
| 5 | `.env` không khoá nào vẫn `docker compose --env-file .env up -d --build` chạy, vẫn truy vấn và render được bài, `content:import` vẫn chạy | **Đạt** — dựng stack thứ hai volume mới (`-p mtct-p2`, cổng 3001/5434), `TTS_API_KEY` trống: seed 359/182/42 → `content:import` 1236 bài (`tts: skipped 1450 line(s)`) → phát hành và xem thử bài trong `/admin/content` | `docker compose --env-file .env -f docker/compose.yml up -d --build` rồi `Invoke-RestMethod http://localhost:5000/api/health` |
| 6 | `pnpm lint && pnpm test && pnpm build` xanh; e2e pha 0 và pha 1 vẫn xanh sau khi gỡ vỏ MEDIFA ONE | **Đạt** — lint 0 lỗi · **167 test đơn vị/tích hợp** (core 81, content 33, db 23, web 18, inbox 12) · build 4 gói · **23 e2e xanh** (pha 0: 6, pha 1: 7, pha 2: 5, login + screens: 5) chạy trên stack Docker sạch | `pnpm lint; pnpm test; pnpm build` (dừng `pnpm dev` trước) |
| 7 | `grep -ri elevenlabs` rỗng; thư mục `ai voice/` không còn | **Đạt trong code** — không còn ở bất kỳ file mã, script, env, `package.json` hay README nào; thư mục đã xoá. **Còn đúng 2 chỗ là tài liệu lịch sử**: `docs/adr/ADR-11` (chính bản ghi quyết định gỡ) và mục pha 1 của file này. Xoá tên khỏi ADR sẽ làm mất bản ghi quyết định nên giữ lại | `Select-String -Path (Get-ChildItem -Recurse -File).FullName -Pattern "elevenlabs"` |

Ảnh chụp: `docs/screens/pha-2/admin-content.png`, `exercise-preview.png`, `dev-kit.png`.

### Số liệu ngân hàng bài đợt 1

| Hạng mục | Số lượng |
|---|---|
| Kỹ năng | **28** — Tiếng Việt 10 · Toán 9 · ESL 5 · ENL 2 · English Maths 2 |
| Bài luyện | **1236**, tất cả `PUBLISHED` — VIET 453 · VMATH 385 · ESL 218 · ENL 91 · EMATH 89 |
| Theo dạng | MCQ 527 · LISTEN_CHOOSE 214 · DRAG_DROP 185 · READ_ALOUD 125 · COUNT_TAP 100 · WRITE_PHOTO 85 |
| Theo mức khó | 1 → 204 · 2 → 300 · 3 → 291 · 4 → 271 · 5 → 170 |
| Nhiễu có chẩn đoán | **741 bài** có ít nhất một đáp án sai mang `errorTag` |
| `scaffold: model` | **190 bài** (mascot làm mẫu trước — `04` §11.4 bậc 3) |
| `targetsError` | **588 bài** nhắm đúng một mã lỗi (thang rèn bậc 5) |
| Biến thể chủ đề | 66 bài `robot` · 80 bài `garden` · còn lại `neutral` |
| Test | **167 đơn vị/tích hợp** + **23 e2e** |

### Mã 20 bài mẫu để QC chấm lại

Rút bằng `node scripts/sample-exercises.mjs pha-2-dot-1 20` — sắp toàn bộ 1236 bài theo `sha256("pha-2-dot-1" + stableId)` rồi lấy 20 bài đầu, không chọn tay:

`viet-am-ch-0012` · `vmath-cong10-0044` · `enl-sight-0043` · `vmath-cong10-0030` · `viet-am-d-0008` · `viet-am-a-0017` · `viet-am-a-0041` · `vmath-tachgop-0015` · `enl-sight-0019` · `viet-am-u-0009` · `esl-havehas-0039` · `vmath-so610-0033` · `viet-dauthanh-0043` · `vmath-nhieuit-0014` · `viet-am-o-0015` · `viet-am-a-0043` · `vmath-so610-0021` · `vmath-demvat-0013` · `vmath-so05-0002` · `vmath-tachgop-0020`

Bảng chấm từng bài ở `content/_reports/dot-1.md` §3.

### ADR đã viết

- **ADR-14** — bốn bổ sung vào hợp đồng bài luyện, đều là **sửa lỗi ở tầng dữ liệu** để pha 3 không mắc lại:
  1. `Exercise.answerKey` là một **gói** `{ value, errorTags, correctCount }` chỉ máy chủ đọc — `choices[].errorTag` và `countTarget.correctCount` bị cắt khỏi `spec` gửi client.
  2. `listenTarget` — tiếng được đọc trong bài nghe, **không bao giờ in ra**; validator chặn đề in lại nó.
  3. `ImageRef.repeat` — vẽ hình mấy lần, bắt buộc với câu hỏi đếm.
  4. Mở `difficultyRange` → `[1,5]` và thêm dạng bài cho **đúng 28 kỹ năng đợt 1** trong `content/skill-map/` cho khớp bài đã soạn (331 kỹ năng còn lại không đụng).

  `docs/04` §5 đã cập nhật cho khớp.

### Lỗi tự tìm ra khi rà số liệu cuối pha (`9a1ce6b`)

`content:stats` báo 2 kỹ năng tụt dưới 35 bài. Truy ra **lỗi thật trong trình nạp**: bài có mã rời khỏi file rồi quay lại thì kẹt `RETIRED` vĩnh viễn, vì trình nạp coi nó là “không đổi” khi nội dung giữ nguyên — **60 bài của đợt 1 đã vô hình như thế**. Đã sửa: bài quay lại được hồi sinh **trên đúng dòng cũ** (nên `Attempt`/`Evidence` của con vẫn trỏ đúng) và trở về `DRAFT` chứ không thẳng lên `PUBLISHED` — nội dung từng rời đi thì nên được ba mẹ xem lại. Có test riêng; `content:import` in thêm cột `revived`.

### Chưa làm + giả định

- **Nhiễu của `DRAG_DROP` chưa mang mã lỗi.** `ExerciseSpec` chỉ cho `errorTag` trên `choices`, nên 185 bài kéo-thả biết "chưa đúng" mà **không biết vì sao**. Đề nghị pha 3 thêm `dragItems[].errorTag`.
- **Toàn bộ ESL/ENL/EMATH (398 bài) chưa bám sách của trường** — dựng theo phiếu `GS1 – UNIT 1` và CCSS; mọi `sourceRef` ghi rõ "chưa có SGK". Có sách Global Success 1 thì phải rà lại từ vựng và thứ tự unit.
- **Hình vẫn là emoji** (đúng `04` §5 "v1 ưu tiên emoji"); `content/art/objects/manifest.json` chưa có nên validator bỏ qua bước kiểm vật thể. Pha 3 làm thư viện SVG xong phải rà lại.
- **`docs/09` §1 ghi "trang PDF = trang sách + 1"; hai file SGK trong repo thực tế lệch +3** (hai ảnh bìa lặp ở đầu). `sourceRef` đều ghi **số trang sách** nên nội dung không sai; nên sửa `docs/09` cho lần sau.
- **`LessonUnit` vẫn là khung** — pha 2 không điền `objectives`/`vocabulary` (đó là việc pha 6); schema và trình nạp bài học đã sẵn sàng, `content/lessons/` chưa có file bài học nào.
- **Chưa từng chạy `pnpm tts:clone`** trong phiên này (xem câu hỏi 1).
- `/admin/content` chưa có nút **sửa nhanh** một bài (FR-ADM-05 có nhắc). Sửa bài hiện đi đường `content/*.pack.json` → `content:import`, an toàn hơn vì mọi thay đổi có trong git.

### Câu hỏi cho chủ dự án

1. **Đã từng chạy `pnpm tts:clone` chưa?** Tôi **không chạy** lệnh đó lần nào (và nó đã bị xoá). Nếu trước đây có chạy thì giọng nhân bản của hai bé **vẫn đang nằm trên tài khoản ElevenLabs** — ADR-11 dặn developer không tự gọi API xoá, nên nhờ chủ dự án đăng nhập ElevenLabs xoá thủ công.
2. **Khoá Vbee:** cần `TTS_API_KEY` + `TTS_APP_ID`. Sau khi có, chạy `pnpm tts:voices` để lấy **mã giọng thật** rồi điền `TTS_VOICE_VI` — mã mặc định tôi đặt sẵn (`hn_female_ngochuyen_full_48k-fhg`) là mã phổ biến trong tài liệu Vbee nhưng **tôi chưa kiểm chứng được với tài khoản thật**. Gói miễn phí thường chỉ vài nghìn ký tự/ngày; 1450 câu cần sinh dần vài ngày (lệnh tự biết chỗ dừng).
3. **Sách Tiếng Anh 1 – Global Success** (và giáo trình NAVIO nếu có): vẫn là việc chặn lớn nhất — 398 bài tiếng Anh đang dựng theo suy đoán từ một phiếu bài tập.
4. **Ngày bắt đầu năm học thật** (còn nợ từ pha 0 và pha 1) — cần để chỉnh `expectedWeek`.
5. Có muốn tôi soạn tiếp **bài học** (`content/lessons/`, `docs/10` §4.1) cho 12 bài Toán và 14 bài Tiếng Việt đầu ngay bây giờ không, hay để đúng pha 6 như lộ trình?

---

## Pha 1 — 11/09/2026 — Bản đồ kỹ năng & mô hình năng lực

Trạng thái: **xong** (6/6 tiêu chí đạt, kiểm cả trên máy dev lẫn stack Docker). 6 commit, chưa push. Đầu pha có 1 commit ADR xử lý phần ngoài phạm vi của pha 0.

### Đã làm theo 5 việc

0. **Trước việc 1 — ADR cho phần ngoài phạm vi pha 0** (`b108aa4`): `docs/adr/ADR-11-pha0-ngoai-pham-vi.md` liệt kê ba commit ngoài phạm vi (`e13b042` TTS cloud, `3cb324a` giao diện MEDIFA ONE, `00f4d36` giọng nhân bản ElevenLabs), thư mục `ai voice/` (không có trong `02` §3), ba dịch vụ trả phí tuỳ chọn (ElevenLabs/Azure/Google — **không có SDK nào được cài**), 8 biến `TTS_*`, và ảnh hưởng tới `06` §2; nêu hai phương án (a) giữ + tắt bằng cờ env, (b) gỡ — **chờ chủ dự án chọn**. `docs/adr/ADR-12-bo-skill-embedding.md` ghi lại quyết định bỏ `SkillEmbedding`/pgvector của pha 0 và `docs/03` đã sửa cho khớp.

1. **Bản đồ kỹ năng + khung bài học** (`e9a8016`) — `content/skill-map/{viet,vmath,esl,enl,emath,esci}.json`: **359 kỹ năng**, mỗi kỹ năng đủ `code/subject/strand/nameVi/nameEn/description (có "Ví dụ:" và "Lỗi thường gặp:")/gradeLevel/prerequisites/relatedSkillCodes/confusableWith/exerciseTypes/difficultyRange`, Toán và Tiếng Việt có `lessonRef` + `expectedWeek` lấy từ `09`. Học vần sinh đúng **83 bài** của `09` §3 (mỗi bài không phải "Ôn tập" → 1–2 kỹ năng cùng `lessonRef`, dấu thanh tách riêng, bài 29 → `VIET.VIET.CHINH_TA_NGHE_VIET`, 11 cặp âm dễ nhầm thành `confusableWith`). Khung `LessonUnit`: **182 unit** trong **4 `Material`** (83 bài TV tập một + ôn tập/đánh giá, 41 bài Toán, 8 chủ đề TV tập hai = 46 unit) — chỉ mã, tên, trang, tuần, kỹ năng liên quan; `isApproved=false`, chưa có nội dung. `content/error-taxonomy.json`: **42 mã lỗi** theo `04` §11.1. `pnpm skills:validate` (thật, trong `packages/content`) kiểm: trùng mã, tiên quyết/related/confusable tồn tại, không vòng phụ thuộc, ≥ 35 kỹ năng/môn, `lessonRef` trỏ tới `LessonUnit` có thật, `expectedWeek` 1–35, mô tả đủ hai cụm bắt buộc, mạch hợp môn, kỹ năng đọc có `READ_ALOUD`, kỹ năng viết có `WRITE_PHOTO`/`TRACE`. `pnpm db:seed` nạp cả ba nguồn, **upsert theo `code`**, chỉ đụng `Skill`/`SkillPrerequisite`/`Material`/`LessonUnit`/`LessonUnitSkill`/`ErrorCode`/`ContentBatch`.

2. **Thuật toán mastery + bộ mã lỗi** (`49ba88b`) — `packages/core/src/mastery/`: `updateMastery`, `applyDecay`, `statusOf`, `nextReviewAt`/`reviewIntervalAfter` (SM-2 rút gọn), `computeTrend14d`, `isWeakSkill` (§3.5) — hàm thuần, không import Next/Prisma. `packages/core/src/remediation/ladder.ts`: thang rèn 6 bậc §11.4 (`nextRung`, `nextApplicableRung` bỏ bậc 4 khi tiên quyết đã vững, giới hạn ≤ 4 bài/phiên, ≤ 2 kỹ năng rèn cùng lúc). Bảng `ErrorStat` cập nhật bằng `refreshErrorStat` (tính lại cửa sổ 7/30 ngày từ `Evidence` nên job và API luôn khớp); `RemediationTrack` đã có sẵn từ pha 0. Validator chặn mã lỗi lạ ở tầng service (`commitEvidence`) nên mọi đường ghi bằng chứng đều bị chặn, không riêng API.

3. **API + job** (`6e67280`) — `GET /api/students/:id/mastery[?subject=]` (mọi kỹ năng đang dùng kèm `status`, `lastEvidenceAt`, `nextReviewAt`, `trend14d` + tóm tắt theo môn), `GET /api/students/:id/mastery/history?skill=` (đường mastery + bằng chứng), `POST /api/evidence` **nội bộ** (ADMIN hoặc `Authorization: Bearer $INTERNAL_API_TOKEN`; `CHILD`/`PARENT` → 403). Job pg-boss `mastery.decay` chạy **02:30 giờ Việt Nam** trong `apps/worker`, bù được số ngày máy tắt; lệnh chạy tay `pnpm decay:run [--force]`.

4. **`/admin/skills`** (`6e67280`) — cây môn → mạch kèm số đếm, tìm nhanh (dùng full-text việc 5), bảng có `lessonRef`/`expectedWeek`/tiên quyết, hộp thoại sửa tên/mô tả/tuần/tiên quyết (chặn vòng lặp và mã không tồn tại), **ẩn** kỹ năng (không xoá — hiện số bằng chứng đã có), nạp JSON/CSV dùng **lại chính validator của việc 1** với bước "Xem trước" bắt buộc. Giao diện dùng primitives người lớn sẵn có, không đầu tư thêm vào MEDIFA ONE khi ADR-11 chưa được chốt.

5. **Tra cứu kỹ năng bằng chuỗi** (`05047e2`) — migration `20260910223533_phase1_skills_mastery`: cột `Skill.searchVector` (tsvector) do **trigger** duy trì (dùng `unaccent`, không dùng cột sinh vì `unaccent()` không `IMMUTABLE`), index **GIN**, extension `unaccent`. `searchSkills(q, {subject?, limit})` trong `packages/db` + `GET /api/skills/search?q=` (chỉ người lớn). Tìm được cả tiếng Việt có dấu/không dấu, tiếng Anh, và mảnh mã (`VIET.HV.AM_U`).

### Bảng 6 tiêu chí xong

| # | Tiêu chí | Kết quả | Cách tự kiểm (PowerShell, tại gốc repo) |
|---|---|---|---|
| 1 | `pnpm test`: mastery 59.9 / 40.1; bảng trạng thái §3.3 | **Đạt** — 59.9 và 40.1 khớp **đúng công thức tài liệu**, không phải chọn thêm hằng số nào | `pnpm test` (104 test: core 65, content 10, web 27, db 13). Riêng phần này: `pnpm --filter @mtct/core test` |
| 2 | `POST /api/evidence` 3 lần → `status` đổi đúng §3.3; `ErrorStat` tăng đúng mã; mã lạ → 400 | **Đạt** — LEARNING (25.2) → SOLID (70) → NEEDS_PRACTICE (59.2); `nham_cong_tru` count7d=1; `khong_co_ma_nay` → 400 và **không ghi gì** | `pnpm dev` rồi `$env:E2E_ADMIN_PASSWORD="<mật khẩu admin>"; $env:E2E_CHANNEL="chrome"; pnpm --filter @mtct/web exec playwright test e2e/phase1-acceptance.spec.ts` (7 test) |
| 3 | `/admin/skills` lọc theo môn: mỗi môn ≥ 35, tổng ≥ 250; `skills:validate` sạch; seed 2 lần không trùng | **Đạt** — 359 kỹ năng (VIET 102, ESL 59, ENL 52, EMATH 51, VMATH 48, ESCI 47) | `pnpm skills:validate`; mở <http://localhost:5000/admin/skills>; `pnpm db:seed` hai lần → lần hai in `0 new, 359 updated, 0 retired` và tổng số không đổi |
| 4 | `GET /api/skills/search?q=đọc từ có sh` → `ESL.PH.DIGRAPHS_SH_CH_TH` trong top-3 | **Đạt** — cả "đọc từ có sh" lẫn "doc tu co sh"; "cộng trong phạm vi 10" → `VMATH.SO.CONG_PV_10` | Trong `/admin/skills` gõ vào ô tìm; hoặc `Invoke-RestMethod "http://localhost:5000/api/skills/search?q=đọc từ có sh"` (cần cookie ADMIN) |
| 5 | `pnpm lint && pnpm test && pnpm build` xanh; `docker compose --env-file .env up -d --build` chạy **không cần khoá API nào** | **Đạt** — `.env` không có khoá nào (`TTS_API_KEY`, `TTS_VOICE_*`, `INTERNAL_API_TOKEN` đều trống); container web tự `migrate deploy` + seed (359/182/42) rồi `next start`; 7 test nghiệm thu chạy lại trên stack Docker đều xanh | `pnpm lint; pnpm test; pnpm build` (dừng `pnpm dev` trước); `docker compose --env-file .env -f docker/compose.yml up -d --build` rồi `Invoke-RestMethod http://localhost:5000/api/health` |
| 6 | Không có SDK Anthropic/OpenAI; `packages/core` không import Next/Prisma | **Đạt** | `Select-String -Path (Get-ChildItem -Recurse -Filter package.json -Exclude node_modules).FullName -Pattern "anthropic\|openai"` → rỗng; `Select-String -Path packages/core/src/**/*.ts -Pattern "from \"next\|@mtct/db\|@prisma"` → rỗng |

Ảnh chụp: `docs/screens/pha-1/admin-skills.png`.

**Kiểm chứng "seed không đụng dữ liệu học của con":** chạy `pnpm db:seed` khi DB đang có 15 `Evidence`, 5 `SkillMastery`, 15 `MasteryHistory`, 5 `ErrorStat` → sau khi seed vẫn đúng 15/5/15/5. Trình nạp chỉ ghi `Skill`, `SkillPrerequisite`, `Material`, `LessonUnit`, `LessonUnitSkill`, `ErrorCode`, `ContentBatch`; kỹ năng biến mất khỏi file chỉ bị `isActive=false`, không xoá.

### Số liệu

| Hạng mục | Số lượng |
|---|---|
| Kỹ năng | **359** — VIET 102 · ESL 59 · ENL 52 · EMATH 51 · VMATH 48 · ESCI 47 |
| Quan hệ tiên quyết | 353 |
| `LessonUnit` khung | **182** (TV 140: 83 bài học vần + ôn tập/đánh giá + 54 bài đọc tập hai · Toán 42: 41 bài + tiết học đầu tiên) trong 4 `Material` |
| Liên kết kỹ năng ↔ bài học | 505 |
| Mã lỗi | **42** (38 mã kiến thức + 4 mã hành vi `doan_bua`, `bo_trong`, `chua_nghe_het_de`, `met_cuoi_phien`) |
| Test | **104 đơn vị/tích hợp** xanh (core 65 · web 27 · db 13 · content 10) + **18 e2e** xanh (10 pha 0 + 7 pha 1 + smoke) |

### ADR đã viết

- **ADR-11** — ba commit ngoài phạm vi pha 0 + `ai voice/` + dịch vụ trả phí: **chờ chủ dự án chọn (a) giữ-tắt-mặc-định hay (b) gỡ**.
- **ADR-12** — bỏ `SkillEmbedding`/pgvector (ghi lại quyết định của pha 0), đã sửa `docs/03`.
- **ADR-13** — bổ sung nhỏ khi hiện thực hoá: trọng số `HOMEWORK` = 0.8, định nghĩa "bằng chứng đúng" (`score ≥ 0.8` khi không có `outcome`), lịch ôn chỉ cho kỹ năng từ `SOLID` trở lên, cột `Skill.confusableWith`, bảng `ErrorCode` (file JSON vẫn là nguồn sự thật), `searchVector` bằng trigger, mã môn Toán là `VMATH` (yêu cầu pha 1 ghi nhầm `TOAN`), khung `LessonUnit` đặt ở `*.units.json`, `INTERNAL_API_TOKEN` tuỳ chọn. Đã cập nhật `docs/02` §7, `docs/03` §2.2–2.3, `docs/04` §3.1 và §3.3 cho khớp.

### Chưa làm + giả định

- `RemediationTrack` mới có mô hình dữ liệu + hàm thuần chọn bậc (đúng phạm vi pha 1); **chưa có UI và chưa nối vào planner** — pha 3/5.
- `LessonUnit` mới là **khung**: `objectives`/`vocabulary`/`sampleTasks`/`contentText` để trống, pha 6 nạp từ PDF. Số trang SGK Toán **tập hai** chưa có (chỉ biết B21 tr.4) — `09` §2 cũng chưa có.
- `expectedWeek` và `weekFrom/To` là **suy từ số tiết** (Toán 3 tiết/tuần, Tiếng Việt ~5 bài/tuần), chưa hiệu chỉnh theo nhật ký lớp — `11` §5 sẽ chỉnh. Lớp đang học bài 13 vào 10/09/2026 nên nhịp thật có thể nhanh hơn.
- Kỹ năng **ESL** gắn `standardRef` dạng `GS1.U<n>` là **ước đoán** unit Global Success 1 (chỉ Unit 1 có dữ liệu thật từ phiếu bài tập); ENL/EMATH/ESCI theo CCSS/NGSS, chưa có sách của trường. Gắn lại khi có sách (FR-INT-03).
- Ba tệp sinh kỹ năng chạy một lần trong thư mục tạm rồi bỏ; **file JSON trong `content/` là nguồn sự thật**, sửa trực tiếp hoặc qua `/admin/skills`.

### Câu hỏi cho chủ dự án

1. **ADR-11: giữ hay gỡ** phần TTS cloud + giọng nhân bản ElevenLabs + giao diện MEDIFA ONE? Nếu giữ thì cần cập nhật `docs/02` §3 (thư mục `ai voice/`) và `docs/06` §2 (token màu teal, hai trang `/admin` và `/admin/health`). Nếu đã chạy `pnpm tts:clone` thì có muốn **xoá giọng đã tải lên ElevenLabs** không (bản thu giọng thật của con đang nằm ở bên thứ ba)?
2. Ngày bắt đầu năm học thật (câu hỏi còn nợ từ pha 0) — cần để chỉnh `expectedWeek` cho khớp lớp.
3. Sách **Tiếng Anh 1 – Global Success** (và giáo trình NAVIO nếu có): có xin được bản PDF không? Thiếu nó thì 59 kỹ năng ESL vẫn là bản đồ nền, chưa bám unit thật của trường.

---

## Pha 0 — 10/09/2026 — Khung dự án + đăng nhập & quản lý người dùng

Trạng thái: **xong** (8/8 tiêu chí đạt trên máy dev; mục 1 kiểm bằng compose với volume DB mới, xem bảng). Code chạy ở 9 commit Conventional Commits, chưa push.

### Đã làm theo 5 việc

1. **Monorepo** — pnpm 9 + Turborepo 2, TypeScript strict (`packages/config`), Biome 2.5 (lint + format), Vitest 5, Playwright 1.63; cấu trúc đúng `02` §3 (`apps/{web,worker}`, `packages/{core,inbox,content,db,config}`, `content/`, `docker/`, `scripts/`). `packages/core` thuần (không Next/Prisma): chính sách khoá tài khoản, giới hạn IP, mật khẩu, bộ mã hình 4 ảnh, quyền truy cập theo vai trò/studentId, 35 tuần học, adapter `FileStorage` (`@mtct/core/storage`). *Kiểm tra:* `pnpm lint` xanh; `pnpm test` = 31 test đơn vị xanh (core 22, content 3, web 3, còn lại rỗng).
2. **`packages/db`** — Prisma 6.19, schema **58 bảng** đủ theo `03` (User/LoginAudit/TrustedDevice/Student/StudentGuardian, Skill…, InboxItem, PlanHint, ClassDiary/Homework, Pet/KidMail/Certificate, AiConfig/PromptTemplate/Setting/AuditLog…), migration `20260910145237_init`, seed idempotent. *Kiểm tra:* `pnpm db:migrate` rồi `pnpm db:seed` in `{"users":1,"skills":0,"timetableSlots":30,"schoolWeeks":35,"badges":8}`; truy vấn `information_schema.tables` = 58 bảng; `pnpm db:studio` xem được.
3. **`apps/web`** — Next 16.3 + Auth.js v5 (JWT, cookie httpOnly): provider `adult` (username + Argon2id) và `kid-login` (thẻ ảnh + 4 hình theo thứ tự, Argon2id); sai 5 lần khoá 10 phút; 10 lần sai/phút/IP tạm chặn; `LoginAudit` mọi lần; sai tên và sai mật khẩu cùng một thông báo; ép đổi mật khẩu lần đầu (proxy chặn mọi trang + API); phiên người lớn 30 ngày khi "ghi nhớ" / 12 giờ không thao tác, con 2 giờ; tiêu đề bảo mật (HSTS, nosniff, X-Frame-Options DENY, CSP cơ bản); `proxy.ts` phân quyền theo route group **và** lặp lại trong từng layout/handler (`guardPage`, `requireRole`, `requireStudentAccess` — kiểm `StudentGuardian` trong DB, không tin `studentId` client). Trang `/login` gộp, `/change-password`, `/kid/home` (hiện tên gọi ở nhà, mascot, nút đọc to), `/parent` + `/parent/[studentId]` (khung), `/api/health`, `/api/students/:id`, `/api/students/:id/mastery` (trả rỗng, chỉ để chứng minh 403). *Kiểm tra:* Playwright 10/10 xanh (xem mục e2e); `curl /api/students/x/mastery` không cookie → 401.
4. **`apps/worker` + Docker** — pg-boss 12, job `ping` mỗi phút ghi `Setting[worker.lastPing]`, log `"ping ok"`; `docker/compose.yml` chỉ 3 service (postgres:16, web, worker); `docker/Dockerfile` multi-stage với hai target `web`/`worker` (thay cho hai file Dockerfile.web/.worker — cùng nội dung base); web khởi động = `prisma migrate deploy` → seed → `next start`; `.env.example` đủ biến `02` §7 (không có khoá LLM); README chạy từ PowerShell. *Kiểm tra:* worker log `ping ok`; `GET /api/health` → `{"status":"ok","db":"ok","worker":{"lastPing":"…","ageSeconds":22,"ok":true}}`.
5. **`/admin/users`** — bảng + 5 thao tác FR-ADM-06: tạo (CHILD tạo luôn `Student` + mã hình; PARENT/ADMIN email + mật khẩu tạm, bắt đổi lần đầu), gắn phụ huynh ↔ con, đặt lại mật khẩu/mã hình (xoá bộ đếm sai), bật/tắt (không tự tắt chính mình), 50 lần đăng nhập gần nhất. API JSON `/api/admin/users*` kiểm vai trò ADMIN + Zod. *Kiểm tra:* e2e mục 2 tạo 1 phụ huynh + 2 bé (1 bé qua hộp thoại thật, còn lại qua API) và gắn quan hệ trong < 10 giây.

### Bảng 8 tiêu chí xong

| # | Tiêu chí | Kết quả | Tự kiểm tra |
|---|---|---|---|
| 1 | `docker compose -f docker/compose.yml up -d --build` → `/login` → admin bị ép đổi mật khẩu, trang khác về `/change-password` | **Đạt** — build image, chạy stack thứ hai với volume DB mới (`-p mtct-clean`, cổng 3001/5434): log web `migrate deploy → seed: admin created (mustChangePassword=true) → next start`, rồi chạy cả 10 test e2e lên stack đó (10/10 xanh, ảnh chụp lấy từ stack sạch này) | `docker compose -f docker/compose.yml up -d --build` (máy này phải thêm `--env-file .env` vì cổng 5432 bận) → mở <http://localhost:5000/login>, đăng nhập `ADMIN_USERNAME`/`ADMIN_PASSWORD` → tự chuyển `/change-password`; gõ `/admin/users` hay `Invoke-RestMethod /api/admin/users` (403) đều không vào được |
| 2 | Admin tạo 1 phụ huynh + 2 bé (hồ sơ Student + mã 4 hình), gắn quan hệ < 3 phút | **Đạt** | `/admin/users` → "+ Tạo tài khoản" (chọn Con: điền tên gọi, chọn 4 hình) ×2, tạo Phụ huynh (tick con); e2e mục 2 đo thời gian |
| 3 | Đăng xuất, con chạm thẻ ảnh + mã 4 hình → `/kid/home` hiện tên gọi ở nhà | **Đạt** | `/login` → chạm thẻ → chọn 4 hình → "Chào Thy!" (ảnh `docs/screens/pha-0/kid-home.png`); e2e mục 3 |
| 4 | Sai 5 lần → khoá 10 phút, `LoginAudit` đủ 5 dòng; sai tên và sai mật khẩu cùng thông báo | **Đạt** | e2e mục 4 (5 × WRONG_PASSWORD + LOCKED, thông báo "Mình nghỉ 10 phút…"); `login.spec` so hai thông báo bằng nhau; admin xem "Nhật ký" của tài khoản |
| 5 | CHILD gọi mastery của bé kia → 403; phụ huynh chưa gắn → 403; chưa đăng nhập vào `/parent` → `/login` | **Đạt** | e2e mục 5; hoặc đăng nhập con rồi `fetch('/api/students/<id bé kia>/mastery')` trong console → 403 |
| 6 | `GET /api/health` → `db:"ok"`, `worker.lastPing ≤ 6 phút`; worker log `ping ok` | **Đạt** | `Invoke-RestMethod http://localhost:5000/api/health`; `docker compose -f docker/compose.yml logs worker` |
| 7 | Prisma studio đủ bảng; TimetableSlot 30; SchoolWeek 35; Skill rỗng; User chỉ 1 admin | **Đạt** — 58 bảng, 30/35/0/1 (trên DB mới; DB dev có thêm tài khoản e2e) | `pnpm db:studio` hoặc `node scripts/db-query.cjs 'select count(*) from "TimetableSlot"'` |
| 8 | `pnpm lint && pnpm test && pnpm build` xanh; Playwright smoke xanh | **Đạt** (lint 0 lỗi; 31 test đơn vị; build 3 gói; e2e 10/10 trên cả dev server lẫn compose) | `pnpm lint; pnpm test; pnpm build` rồi `pnpm dev` + `pnpm e2e` (smoke 4 test); nghiệm thu đầy đủ: `$env:E2E_ADMIN_PASSWORD="<mật khẩu admin>"; $env:E2E_CHANNEL="chrome"; pnpm e2e` (10 test) |

Ảnh chụp: `docs/screens/pha-0/login.png`, `admin-users.png`, `kid-home.png` (Playwright chụp trong e2e).

### Lệch tài liệu đã xử lý (không cần ADR mới, theo tài liệu mới hơn)

- `08` việc 2 ghi "pgvector bật", `03` có `SkillEmbedding`/`LessonUnit.embedding vector(1024)` → theo ADR-10 và `13` §1 "bỏ pgvector": **không** tạo extension, bỏ bảng `SkillEmbedding` và cột `embedding`. Tra cứu kỹ năng ở pha 1 dùng full-text như `08` pha 1 việc 5.
- `12` §2 đặt tên kết quả `LoginAudit` tiếng Việt, `03` tiếng Anh → dùng `OK|WRONG_PASSWORD|LOCKED|NO_SUCH_USER|DISABLED`.
- `Student` nối 1–1 với `User` CHILD nên hồ sơ mẫu dev (`thy`, `thanh`) phải kèm 2 user CHILD mẫu → chỉ tạo khi `pnpm db:seed:dev` (chặn khi `NODE_ENV=production`); seed thường chỉ 1 admin.
- `02` §7 phác thảo `Dockerfile.web` + `Dockerfile.worker` → dùng một `docker/Dockerfile` với hai target; `cloudflared`/`backup` để pha 8 đúng lưu ý pha 0.
- Cookie `Secure`: Auth.js tự bật khi `AUTH_URL` là https (sau Cloudflare Tunnel); trên `http://localhost` không thể bật vì trình duyệt sẽ từ chối cookie.
- Giới hạn IP chỉ đếm lần **thất bại** (10/phút) để một máy của gia đình đăng nhập/đăng xuất nhiều lần không bị chặn oan.

### Chưa làm + lý do

- Ảnh đại diện/mascot là emoji tạm (`lib/avatars.ts`); tài sản thật thuộc pha 3 (`06` §1.9). `/kid/home` mới là màn chào tên + nút đọc to, chưa phải thế giới có Lottie (pha 3).
- "Báo ba mẹ" khi con bị khoá: mới ghi `AuditLog(KID_LOGIN_LOCKED)`; thẻ thông báo trên dashboard thuộc pha 5.
- Thiết bị tin cậy, 2FA, cảnh báo IP lạ: P1 pha 8 (đã có bảng `TrustedDevice`).
- `content:import/stats`, `inbox:pull/validate/push`: stub báo "pha 2".
- Image Docker chưa tối ưu dung lượng (**~2,6 GB/image**: copy cả monorepo + `pnpm install --prod`; `pnpm prune --prod` không dùng được trong workspace vì xoá sạch node_modules từng gói) — đủ cho máy nhà; có thể chuyển `output: standalone` ở pha 8.

### Sự cố môi trường trên máy dev (đã xử lý, cần chủ dự án biết)

- Ổ **C: chỉ còn ~1,4 GB** (thư mục `%TEMP%\odis_download_dest` ~50 GB, ngày 10/09) → Turbopack từng lỗi "no space" khi ghi log; Docker data đã ở E: nên build/chạy compose không ảnh hưởng. Nên dọn C: trước pha sau.
- Cổng **5432** đã bị container khác dùng → `.env` máy này đặt `POSTGRES_PORT=5433` và phải chạy compose với `--env-file .env` (compose chỉ đọc `docker/.env` mặc định). Đã ghi vào README.
- Docker Desktop treo một lần, phải khởi động lại.

### Cần điền trong `.env` trước khi chạy (từ `.env.example`)

`POSTGRES_PASSWORD`, `DATABASE_URL` (khớp cổng), `AUTH_SECRET` (32 byte base64), `AUTH_URL` (https://<domain> khi qua tunnel), `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (≥ 10 ký tự, sẽ bị bắt đổi ngay), `SCHOOL_YEAR_START` (mặc định 2026-09-08), `POSTGRES_PORT` (nếu 5432 bận). Không có `ANTHROPIC_API_KEY`.

### Câu hỏi cho chủ dự án

1. Khi con nhập sai 5 lần, ngoài ghi log, có muốn gửi thông báo tức thì (email/Telegram) ngay từ bây giờ không, hay để pha 5 hiện thẻ trên dashboard là đủ?
2. Ngày bắt đầu năm học thật (nhật ký lớp cho thấy sớm hơn 08/09) — cần giá trị để đặt `SCHOOL_YEAR_START` và chỉnh `SchoolWeek` trong admin ở pha 5.

## 10/09/2026 — Chốt mô hình vận hành hai chế độ

- Chủ dự án chốt: **không API**. Mỗi ngày có dữ liệu mới thì đưa cho Claude Code xử lý và quyết định bài học; không có dữ liệu mới thì backend tự quyết. Ghi thành `13` §3: chế độ A (Claude Code nạp dữ liệu + để lại `PlanHint`) và chế độ B (planner backend tự chạy); planner luôn chạy, tôn trọng `PlanHint` còn hiệu lực. Thêm `PlanHint` vào `03`, `04` §4 bước 3; `13` §6 cánh cửa mở worker tự động v2 với bảng rào chi phí.

## 10/09/2026 — ADR-10: app không gọi API LLM

- Chủ dự án nhắc: không dùng API Anthropic. Chốt ADR-10: mọi việc cần AI (đọc ảnh vở, chấm bài viết/nói, báo cáo tuần) đi qua **hàng chờ** (`packages/inbox`, `InboxItem`) và do Claude Code xử lý theo lô vài lần/tuần; nhật ký lớp đọc bằng **bộ đọc theo mẫu** không AI; gia sư giọng nói lùi P2; trợ lý = hỏi Claude Code trong repo; bỏ pgvector/embedding; bỏ `packages/ai`, bỏ `ANTHROPIC_API_KEY`.
- Viết `docs/13-HANG-CHO-AI.md`; sửa `00`, `01`, `02` (stack, ADR-10, env, compose), `04` §1, `07`, `08` (pha 0/1/2/4/7), `10`, `11`, `CLAUDE.md`.

## 10/09/2026 — Thêm 14 cơ chế thu hút (`06` §1.8c)

- Chủ dự án thích hướng "có gì mới + được tự quyết", yêu cầu thêm ý tưởng. Thêm 14 cơ chế theo 4 động lực (mong chờ, sở hữu, được là người lớn, được nhìn thấy); 7 mục P0 vào pha 3: trứng nở, mascot có ký ức, mảnh tranh cuối tuần, hộp thư ba mẹ, thế giới theo giờ thật, sao vàng lớn, giấy chứng nhận. Bảng mới ở `03`; FR-PAR-08 ở `01`; checklist `06` §4 mục 12; pha 3 ước lượng 6–7.

## 10/09/2026 — Rà soát "thông minh" & "sinh động", bổ sung 5 điểm

- **Bộ mã lỗi chuẩn** `content/error-taxonomy.json` (~40 mã theo môn, `04` §11.1) — trước đây `errorType`/`targetsError` là chữ tự do nên không khớp được bằng chứng ↔ bài rèn.
- **Đáp án nhiễu có chẩn đoán** (`choices[].errorTag`) và `scaffold: model` (mascot làm mẫu) trong `ExerciseSpec`; rubric soạn bài thêm mục 11.
- **Thang rèn 6 bậc** khi con yếu (`04` §11.4): đổi kênh → hạ độ khó → bài mẫu → tiên quyết → đối chiếu cặp dễ nhầm → kiểm tra lại / nhờ ba mẹ; giới hạn ≤ 4 bài rèn/phiên. Bảng `ErrorStat`, `RemediationTrack` (`03`).
- **STT tiếng Việt lên P0** + chế độ "cùng ba mẹ" chấm tay; TTS neural sinh sẵn lúc nạp nội dung (NFR-04).
- **Giữ mới & quyền chọn** (`06` §1.8b): sự kiện tuần, trạm chọn 1-trong-2, nghỉ vận động, dừng khi mệt, giọng mascot thu sẵn, cây chung của nhà (P1), mở khoá khu mới; checklist §4 thêm mục 10–11.
- Dọn: bỏ `kidPinHash` thừa ở `Student`; nhật ký lớp sinh `Homework` riêng cho từng bé (`11` §4).

## 10/09/2026 — Người dùng, vai trò & đăng nhập

- Chủ dự án yêu cầu: web mở ra internet nên cần đăng nhập + quản lý người dùng, cấu trúc đơn giản, có vai trò phân biệt con và bố mẹ, một tài khoản admin tạo sẵn.
- Viết `docs/12-NGUOI-DUNG-DANG-NHAP.md`: một bảng `User` với 3 vai trò `ADMIN|PARENT|CHILD`, `Student` nối 1–1 với user `CHILD`, `LoginAudit`, `TrustedDevice` (P1); trang `/login` gộp thẻ ảnh của con và form người lớn; `/admin/users` 5 thao tác; phần bảo vệ khi mở internet.
- Cập nhật `00`, `01` (FR-CORE-01 viết lại, thêm FR-ADM-06, NFR-05), `02` (phân quyền, API users, `.env`), `03` (User/Student/LoginAudit/TrustedDevice, seed chỉ 1 admin), `08` (pha 0 đổi tên và thêm việc 5), `CLAUDE.md`.

## 10/09/2026 — Nhận đủ SGK Toán & Tiếng Việt (cả 4 tập)

- Chủ dự án nạp SGK **học sinh**: Tiếng Việt 1 tập một & hai, Toán 1 tập một & hai (bộ Kết nối tri thức, PDF quét). Hai file SGV nạp hôm trước **không còn trong thư mục** — cần chép lại nếu còn giữ.
- Rút được **mục lục đầy đủ Tiếng Việt 1 tập một: 83 bài học vần** kèm số trang → thay hẳn danh sách kỹ năng `VIET.HV.*` đoán trước đây; ghi vào `09` §3 cùng quy tắc sinh kỹ năng và danh sách cặp âm dễ nhầm.
- Kiểm chứng: bài 13 "U u – Ư ư" trang 38–39 khớp nhật ký lớp; cấu trúc mỗi bài gồm 5 mục (Nhận biết / Đọc / Viết / Đọc / Nói) → "mục 2 và mục 4" cô giao ánh xạ thành hai nhiệm vụ `READ_ALOUD`.
- Quy đổi trang PDF = trang sách + 1. Bổ sung số trang SGK cho 20 bài Toán tập một (khác số trang SGV).
- Xác nhận sách tiếng Anh: bìa sau ghi **"Tiếng Anh 1 – Global Success – Sách học sinh"** → `GS1` trên phiếu chính là sách này.

## 10/09/2026 — Nhật ký lớp Edi Parent + phiếu bài tập

- Phát hiện nguồn dữ liệu quan trọng: GVCN đăng nhật ký hằng ngày trên **Edi Parent** (hôm nay học bài gì từng môn + bài cô giao). Viết `docs/11-NHAT-KY-LOP.md`; thêm `ClassDiary`/`DiaryLesson`/`Homework`/`ClassReminder` vào `03`, FR-INT-06 + FR-LRN-07 vào `01`, đổi planner ở `04` §4 (ưu tiên bài học 3 ngày gần nhất), thêm kênh D vào `07`, pha 4 thêm việc 5.
- Đọc thử phiếu ESL thật của Mai Thy → rút ra quy tắc **`BLANK` ≠ sai** (`07` §2.2) và 5 dạng bài của phiếu trường để ngân hàng bài bắt chước (`11` §9).
- Manh mối sách ESL: phiếu ghi `GS1` — có thể là Global Success 1; cần xác nhận với cô.
- Lưu ý: chuỗi bài (TV bài 13 vào 10/09) cho thấy **năm học bắt đầu sớm hơn giả định 08/09/2026** — cần chỉnh `SchoolWeek` khi có đủ nhật ký.

## 10/09/2026 — Chốt ADR-9: nội dung soạn ngoại tuyến

- Chủ dự án chốt: bài học và ngân hàng bài luyện do **Claude Code soạn trong repo rồi nạp DB**, app chỉ đọc; ảnh bài vở hằng tuần vẫn nạp qua app, Claude Code chỉ dùng cho lô lớn.
- Viết `docs/10-NAP-NOI-DUNG.md`; sửa `00`, `01`, `02` (ADR-9, `packages/content`), `03` (Exercise + ContentBatch), `04` (tách AI ngoại tuyến / lúc chạy, chi phí giảm còn ≤ 1 USD/tháng), `07`, `08` (pha 2 và 6 đổi thành pha nội dung), `CLAUDE.md`.

## 10/09/2026 — Nạp sách giáo khoa

- Chủ dự án nạp `sach giao khoa/01-sgv-toan-1.pdf` và `01-sgvtieng-viet-1-tap-hai.pdf` (SGV, bộ Kết nối tri thức, PDF quét). Viết `docs/09-GIAO-TRINH-TRUONG.md`; cập nhật `05`, `07`, `08`.
- Còn thiếu: Tiếng Việt 1 tập một, SGK học sinh, sách tiếng Anh (ESL/English Maths/English Science) — chủ dự án tìm sau.

## 09/09/2026 — Thiết kế xong

- Hoàn thành bộ tài liệu `docs/00`–`08`. Chưa có code.
- Việc kế tiếp: **Pha 0 — Khung dự án** (`docs/08-LO-TRINH-PHA.md`).
- Chủ dự án cần chuẩn bị trước pha 0: khoá API Anthropic, Docker Desktop, chọn máy/NAS chạy hệ thống.
