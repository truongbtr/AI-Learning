# STYLE.md — phong cách mỹ thuật của Góc của con

> Mọi tài sản trong `content/art/` phải theo tài liệu này, để thứ vẽ hôm nay và thứ vẽ sáu tháng
> nữa nhìn vẫn như cùng một bàn tay. Nguồn: `docs/06` §1.1, §1.5–1.9.
> **Bảng tham chiếu:** `content/art/style-sheet.svg` (Thành phố Robot) và
> `content/art/garden-frame.svg` (Vườn Kỳ Diệu) — mở hai file đó ra là thấy đúng cái đang mô tả.

**Tài sản được sinh ra, không vẽ tay từng file.** `pnpm art:build` chạy `scripts/art-build/` và ghi
đè toàn bộ `content/art/**` (trừ `STYLE.md` và `style-sheet.svg`). Sửa một file SVG bằng tay thì lần
build sau mất — **sửa trong `scripts/art-build/` ấy**; và nếu chính quy tắc đổi thì **sửa
`STYLE.md` trước**. Ba lệnh:

| Lệnh | Làm gì |
|---|---|
| `pnpm art:build` | vẽ lại mọi tài sản + `manifest.json` + trang kiểm kê `_contact-sheet.html` |
| `pnpm art:check` | đo ngân sách dung lượng (§7) và bắt hai lỗi phong cách: dùng `filter`/blur, dùng màu đen tuyền |
| `pnpm art:sync` | chép `content/art/` → `apps/web/public/art/` để Next phục vụ (tự chạy trong `pnpm dev` và `pnpm build`) |

Mở `content/art/_contact-sheet.html` bằng trình duyệt để xem **tất cả** tài sản trên một trang —
9 trạng thái của hai mascot, 5 khu thế giới đã chồng ba lớp, avatar, hiệu ứng, 70 vật thể và 6 âm
thanh bấm nghe được.

---

## 1. Một câu tóm tắt

**Minh hoạ phẳng, nét tròn, màu tươi vừa phải, có nắng.** Gần với Duolingo ABC / Khan Kids:
hình khối to và đơn giản, không viền đen, không đổ bóng nặng, không gradient loè loẹt. Trẻ 6 tuổi
nhìn từ cách 40 cm trên iPad phải nhận ra ngay **cái gì là nút bấm** và **cái gì là trang trí**.

## 2. Mười nguyên tắc vẽ

1. **Không viền đen.** Khối được tách nhau bằng màu, không bằng nét. Cần nhấn thì dùng nét **cùng
   hệ màu, đậm hơn 15 %**, dày 3–4 px.
2. **Ba tông cho mỗi khối:** màu nền (base), **mảng tối** (base tối hơn ~12 %) ở đáy/bên phải,
   **mảng sáng** (sáng hơn ~10 %) ở đỉnh/bên trái. Ánh sáng luôn đến **từ trên bên trái**.
3. **Bo tròn mọi góc.** Bán kính ≥ 8 px với vật nhỏ, ≥ 24 px với thẻ và nút. Không có góc nhọn
   nào trong giao diện của con, kể cả mũi tên.
4. **Bóng đổ = một hình elip mềm**, `fill` màu tối của nền với `opacity` 0.10–0.16 — **không dùng
   `filter: blur`** (chậm trên iPad và render khác nhau giữa các trình duyệt).
5. **Màu tươi nhưng không chói:** độ bão hoà 55–75 %. Nền luôn nhạt hơn nhân vật, để nhân vật nổi.
6. **Không dùng màu đỏ để báo lỗi** — không có "sai" trong thế giới này. Đỏ chỉ dùng làm màu vật
   thể (quả táo, mái nhà), không bao giờ làm phản hồi.
7. **Mỗi hình một ý.** Một vật thể = một bóng đổ + 3–8 khối. Vật thể trong bài tập phải đọc được
   ở kích thước 64 px.
8. **Khoảng trống là bạn.** Nền để chừa vùng giữa cho đề bài; chi tiết dồn ra rìa và xuống đáy.
9. **Vẽ bằng SVG**, toạ độ tròn số, không path thừa. Mỗi nhóm chuyển động được có `id` riêng
   (xem §6) để Framer Motion bắt vào.
10. **Không chữ trong tài sản đồ hoạ.** Chữ do giao diện vẽ (để đọc to được và đổi ngôn ngữ được).
    Ngoại lệ duy nhất: biển số nhà/biển hiệu đã là hình trang trí.

## 3. Bảng màu

Token dùng chung (`docs/06` §1.1) — tên biến trong `globals.css` là `--kid-*`:

| Vai trò | Mã | Dùng ở đâu |
|---|---|---|
| Nền kem | `#FFF8EC` | nền màn hình, thẻ |
| Mực | `#2B2B3A` | chữ chính (không dùng đen tuyền) |
| Mực nhạt | `#6B6B7B` | chữ phụ |
| Thưởng | `#FFD447` | sao, rương, huy hiệu |
| Đúng | `#34C759` | phản hồi đúng |
| Gần đúng | `#FFB020` | phản hồi gần đúng (**không đỏ**) |

Thế giới **Thành phố Robot** (mặc định của Chí Thanh):

| Vai trò | Mã |
|---|---|
| Primary | `#2F80ED` |
| Accent | `#FF8C42` |
| Trời xa | `#DCEEFF` → `#B9DCFF` |
| Nhà & máy | `#8FB8E8`, `#6E9AD6`, `#4E79B8` |
| Kim loại | `#C9D6E6`, `#A9BDD3` |
| Mặt đất | `#F2E2C6`, `#E3CFA8` |
| Cây cỏ | `#7BC67E`, `#5FA968` |

Thế giới **Vườn Kỳ Diệu** (mặc định của Mai Thy):

| Vai trò | Mã |
|---|---|
| Primary | `#E85D9C` |
| Accent | `#7C5CFF` |
| Trời xa | `#FFE9F3` → `#FFD3E6` |
| Hoa lá | `#F49AC1`, `#C77DFF`, `#7BC67E` |
| Mặt đất | `#F6E6CF`, `#E7D2AE` |

Quy tắc: **một khu chỉ dùng tối đa 6 màu** (chưa kể mảng sáng/tối), để 4 khu đứng cạnh nhau không
loạn.

## 4. Nhân vật

- **Tỷ lệ chibi 2,2 đầu** (đầu to bằng thân). Mắt chiếm ~1/3 chiều cao mặt, cách nhau bằng một mắt.
- **Mắt:** tròng trắng lớn + con ngươi tròn đậm + một đốm sáng lệch trên-trái. Chớp mắt = co chiều
  cao tròng trắng còn 10 % trong 120 ms.
- **Miệng:** 3 khung dùng chung cho mọi lời nói — ngậm (đường cong), mở nhỏ (elip nhỏ), mở to (elip
  lớn). Đủ để đồng bộ với TTS mà không cần vẽ khẩu hình thật.
- **Tay** ngắn, không có ngón chi tiết (bàn tay = một khối tròn).
- **Mascot mặc định:** Rô-bốt (Thành phố Robot) và Cú (Vườn Kỳ Diệu, cũng là "bạn Cú" trong lời
  thoại). Mỗi mascot **9 trạng thái** theo `docs/06` §1.7: `idle · greet · talk · think · cheer ·
  encourage · celebrate · sleep · listen`.
- **Avatar của bé** (≥ 6): cùng bút pháp, chỉ thấy nửa người, dùng trong bản đồ nhiệm vụ và màn
  đăng nhập.

## 5. Nền thế giới — ba lớp

| Lớp | File | Nội dung | Parallax |
|---|---|---|---|
| `sky` | `<world>/<zone>-sky.svg` | trời, mây, mặt trời/trăng, núi xa | 0,25× |
| `mid` | `<world>/<zone>-mid.svg` | công trình chính của khu, cây lớn | 0,6× |
| `fore` | `<world>/<zone>-fore.svg` | mặt đất, vật thể sát khung, cỏ | 1× |

- Khung vẽ **1600 × 1000**, `viewBox` giống nhau ở cả ba lớp để xếp chồng khít.
- **Vùng an toàn**: hình chữ nhật giữa `(400,180)–(1200,700)` phải trống để đặt đề bài và vùng trả
  lời. Chi tiết đắt mắt đặt ngoài vùng đó.
- Thành phố Robot có 4 khu: `xuong-so` (Toán) · `thap-chu` (Tiếng Việt) · `tram-khong-gian`
  (Science) · `ben-tau-tieng-anh` (English). Vườn Kỳ Diệu pha 3 làm tối thiểu `vuon-so`.

## 6. Nhóm chuyển động (bắt buộc có `id`)

Giao diện chỉ được animate `transform` và `opacity`. Vì vậy mọi thứ động phải nằm trong group riêng:

| `id` | Ở lớp | Chuyển động |
|---|---|---|
| `clouds` | sky | trôi ngang chậm, 40–60 s một vòng |
| `sun` / `moon` | sky | xoay nhẹ hoặc nhấp nháy tia |
| `gears` | mid | xoay đều (robot) |
| `smoke` | mid | phồng lên rồi mờ dần |
| `grass` | fore | đung đưa ±2° |
| `sparkles` | fore | hiện/ẩn ngẫu nhiên |

Mascot: mỗi bộ phận cử động là một group — `head`, `eye-l`, `eye-r`, `mouth`, `arm-l`, `arm-r`,
`antenna`, `body`, `shadow`.

## 7. File, tên và kích thước

```
content/art/
  style-sheet.svg             bảng tham chiếu (file này mô tả nó)
  worlds/robot/xuong-so-{sky,mid,fore}.svg
  worlds/garden/vuon-so-{sky,mid,fore}.svg
  mascots/robot/{idle,greet,talk,think,cheer,encourage,celebrate,sleep,listen}.svg
  mascots/cu/…
  avatars/avatar-01.svg …
  effects/{star,confetti,chest,sparkle}.svg
  objects/<key>.svg + objects/manifest.json
  audio/<lang>/<key>.mp3
  ui/{button,badge-frame,…}.svg
  manifest.json               kiểm kê toàn bộ (script kiểm kích thước đọc file này)
```

- **Tên file**: chữ thường, không dấu, gạch nối. Tên khu và tên vật thể bằng **tiếng Việt không
  dấu** (`banh-rang`, `ten-lua`, `qua-tao`), nhãn hiển thị nằm trong manifest.
- **Ngân sách dung lượng** (`docs/06` §1.8 và lưu ý pha 3): một lớp nền ≤ 40 KB · một trạng thái
  mascot ≤ 25 KB · một vật thể ≤ 6 KB · một hiệu ứng ≤ 20 KB · **tổng `content/art/` ≤ 40 MB**.
  `pnpm art:check` đo và báo đỏ khi vượt.
- Mỗi vật thể trong `objects/manifest.json` có: `key`, `labelVi`, `labelEn`, `category`, `tags`,
  `source`, `license`. Bài luyện trỏ tới vật thể bằng `ImageRef.kind = "asset"`, `value = key`.

## 8. Giấy phép

Toàn bộ tài sản trong thư mục này **do dự án tự vẽ bằng SVG** (`source: "mtct-hand-drawn"`,
`license: "internal"`). Không chép hình có bản quyền, không sinh ảnh AI cho tài sản v1. Nếu sau này
lấy thêm từ Kenney (CC0) hay OpenMoji (CC-BY-SA) thì ghi đúng `source`/`license` trong manifest và
giữ đúng bảng màu ở §3.

## 9. Trước khi thêm một tài sản mới — 7 câu hỏi

1. Nó có nằm trong bảng màu của khu không?
2. Có viền đen nào không? (phải là **không**)
3. Có đủ mảng sáng và mảng tối, ánh sáng từ trên-trái không?
4. Bóng đổ có phải elip mềm, không blur không?
5. Đọc được ở 64 px không?
6. Nhóm chuyển động đã có `id` chưa?
7. Dưới ngân sách dung lượng chưa? (`pnpm art:check`)
