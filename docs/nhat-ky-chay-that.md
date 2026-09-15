# Nhật ký hai tuần chạy thật

> Pha 8 việc 5. Mỗi tối ba mẹ ghi **bốn dòng** cho mỗi bé. Không cần dài — cái quý nhất ở đây là
> **nguyên văn con nói gì**, vì đó là thứ duy nhất không có trong cơ sở dữ liệu.
>
> Số liệu (mấy phút, mấy câu, bỏ dở chỗ nào) **không phải chép tay** — máy tự đếm:
>
> ```powershell
> pnpm db:trial
> ```
>
> Cột "ba mẹ giúp" của máy chỉ thấy được hai việc: ba mẹ sửa nhãn, và ba mẹ chấm bài nói/viết.
> **Ba mẹ ngồi cạnh đọc hộ đề thì máy không biết** — đó đúng là chỗ cần ghi tay ở đây. Cuối hai
> tuần đối chiếu hai bên: nếu máy nói "đạt 12/14 ngày" mà nhật ký ghi 6 ngày phải nhờ đọc đề, thì
> con số của máy sai, và nhật ký đúng.

## Cách ghi (chép mẫu này xuống dưới mỗi ngày)

```
### Thứ N, dd/mm — <Tên bé>
- Học lúc:            19:35, trên iPad, tự mở app
- Phải nhờ ba mẹ:     không / có — chỗ nào (đọc đề? bấm nút? không hiểu hình?)
- Bỏ dở ở đâu:        không / trạm số mấy, đang làm gì
- Con nói gì:         "…"   ← nguyên văn, kể cả khi con chê
```

Bốn thứ đáng ghi thêm khi gặp:

- Con **tự mở lại** app lần thứ hai trong ngày → ghi lại, đó là tín hiệu tốt nhất có thể có.
- Con **hỏi "hết chưa"** trước khi xong → ghi trạm số mấy.
- Dạng bài nào con **cười**, dạng nào con **thở dài** → đây là đầu vào chính của pha 6.
- Bất cứ chỗ nào con **bấm mà không có gì xảy ra** → lỗi giao diện, ghi ngay.

---

## Ngày 0 — 12/09/2026 (thứ Bảy) — bàn giao

Chưa phải ngày học. Ghi lại trạng thái lúc giao máy, để hai tuần sau còn đối chiếu được.

**Cơ sở dữ liệu lúc bàn giao**

| Thứ | Số |
|---|---|
| Hồ sơ bé | 2 — `thy` (Mai Thy, mascot Cú → Vườn Kỳ Diệu), `thanh` (Chí Thanh, mascot Robot → Thành phố Robot) |
| Tài khoản | 2 `ADMIN`, **0 `PARENT`** ← xem "việc chủ dự án phải làm" bên dưới |
| Dữ liệu học | **0** phiên, 0 bằng chứng, 0 mastery — sạch hoàn toàn (pha 8 việc 0.3) |
| Ngân hàng bài | 1.236 bài đã phát hành, 376 kỹ năng, 182 bài học, 44 mã lỗi |
| Phủ bài | **28/376 kỹ năng có bài** — VIET 10, VMATH 9, ESL 5, ENL 2, EMATH 2, **ESCI 0** |
| Năm học | Tuần 1 từ 24/08/2026, 35 tuần; hôm nay là **tuần 3** |
| Sao lưu | `E:\SAO-LUU-MTCT`, bản đầu tiên 12/09 10:43, 0,6 MB |
| Diễn tập khôi phục | **ĐẠT** — 12/09 10:49, máy trắng, 7 giây (`docs/dien-tap/`) |
| Giọng đọc | Azure F0, đã dùng 0/500.000 ký tự tháng 09 |

**Ba tối đầu của mỗi bé là phiên chẩn đoán** (`docs/04` §10) — con không được cho biết, con chỉ
bấm "Học ngay" như mọi hôm. Xem trước: `pnpm db:assess -- --status`.

**Việc chủ dự án phải làm trước tối đầu tiên** (không có mấy thứ này thì hai tuần không chạy được):

1. **Tạo tài khoản `PARENT` cho Ba và Mẹ** ở `/admin/users`, và **nối với cả hai bé** ở ô "Con".
   Hiện `thy` và `thanh` **chưa nối với tài khoản phụ huynh nào**, nên `/parent` sẽ trống.
2. **Đặt mã 4 hình cho từng bé** ở `/admin/users` → chọn bé → mã hình. Cho chính con chọn 4 hình
   con thích — con nhớ được mã của con hơn là mã của người lớn đặt.
3. **Sửa ngày sinh hai bé** — hiện là `2020-01-01`, giá trị tạm của seed.
4. **Kiểm tra mascot đã đúng bé chưa**: Mai Thy = Cú (Vườn Kỳ Diệu), Chí Thanh = Robot (Thành phố Robot).
   Đổi ở `/parent/<bé>/settings` nếu con muốn khác.
5. **Cài app lên iPad** cho từng bé (`docs/VAN-HANH.md` §5) và để con **tự đăng nhập một lần** có
   ba mẹ ngồi cạnh — đó là lần duy nhất nên ngồi cạnh.
6. **Mở ra internet + Cloudflare Access** (`docs/VAN-HANH.md` §4) nếu muốn dùng ngoài mạng nhà.
7. **Bật sao lưu hằng đêm**: `docker compose --env-file .env -f docker/compose.yml --profile backup up -d backup`.

---

## Tuần 1

<!-- Chép mẫu ở đầu file xuống đây, mỗi tối một khối cho mỗi bé. -->

### Thứ …, ../09 — Mai Thy

- Học lúc:
- Phải nhờ ba mẹ:
- Bỏ dở ở đâu:
- Con nói gì:

### Thứ …, ../09 — Chí Thanh

- Học lúc:
- Phải nhờ ba mẹ:
- Bỏ dở ở đâu:
- Con nói gì:

---

## Tuần 2

<!-- Như trên. -->

---

## Chốt hai tuần (ghi khi hết ngày 14)

Chạy và dán kết quả vào đây:

```powershell
pnpm db:trial
```

| Câu hỏi | Trả lời |
|---|---|
| Máy nói đạt bao nhiêu ngày? | Mai Thy …/14 · Chí Thanh …/14 |
| Nhật ký nói bao nhiêu ngày thật sự không cần trợ giúp? | Mai Thy … · Chí Thanh … |
| Hai con số lệch nhau vì sao? | |
| Bỏ dở nhiều nhất ở trạm nào, dạng bài nào? | |
| Dạng bài con thích nhất / chán nhất | |
| Kỹ năng nào hết bài (`pnpm content:stats`) | |
| Lỗi giao diện đã ghi được | |

Rồi chuyển phần "dạng bài con chán / kỹ năng hụt bài" sang **danh sách việc pha 6** ở cuối mục
Pha 8 trong `docs/TIEN-DO.md`.

## Việc chờ sau 14 ngày (không sửa trong lúc chạy thật)

- **Màn "ảnh hôm nay" cho ba mẹ** (chủ dự án nêu 14/09): một chỗ duy nhất trả lời "ảnh tôi gửi qua
  chat đã xử lý chưa" — theo ngày, mỗi ảnh một dòng: đã đọc / đang chờ / không đọc được, bao nhiêu câu
  ghi nhận, bao nhiêu câu chờ ba mẹ xem, bấm vào ra ảnh gốc và các bằng chứng sinh ra từ nó. Gộp cả
  ảnh chụp bằng app lẫn ảnh đẩy qua `/api/internal/intake/photo` (`source=CHAT_INTAKE`).
  Hiện phải nhìn ở ba chỗ rời nhau: `/parent/intake`, thẻ tối nay trên dashboard, `/admin/inbox`.
