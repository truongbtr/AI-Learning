# 12 — NGƯỜI DÙNG, VAI TRÒ & ĐĂNG NHẬP

> Website chạy tại nhà nhưng **mở ra internet** qua Cloudflare Tunnel, nên đăng nhập phải chắc. Cấu trúc cố ý giữ **thật đơn giản**: một bảng người dùng, ba vai trò, một tài khoản admin tạo sẵn, admin tạo tiếp mọi tài khoản khác. **Không có đăng ký công khai.**

---

## 1. Ba vai trò

| Vai trò | Ai | Đăng nhập bằng | Vào được |
|---|---|---|---|
| `ADMIN` | Ba | tên đăng nhập + mật khẩu | tất cả: `/admin`, `/parent`, xem `/kid` ở chế độ xem thử |
| `PARENT` | Ba, Mẹ | tên đăng nhập + mật khẩu | `/parent` — chỉ dữ liệu của con mình được gắn |
| `CHILD` | Mai Thy, Chí Thanh | chọn ảnh đại diện + **mã hình** (không gõ chữ) | `/kid` — chỉ dữ liệu của chính bé |

Một người có thể vừa `ADMIN` vừa `PARENT` (Ba). Vai trò lưu ở trường `role` của `User`; ai cần cả hai thì đặt `ADMIN` (đã bao hàm quyền phụ huynh).

## 2. Cấu trúc dữ liệu (đơn giản nhất có thể)

```
User                     ── một bảng duy nhất cho cả nhà
 ├─ id, username (duy nhất, không dấu: admin | ba | me | thy | thanh)
 ├─ displayName ("Ba", "Mẹ", "Mai Thy")   avatarKey
 ├─ email (bắt buộc với ADMIN/PARENT, để trống với CHILD)
 ├─ role: ADMIN | PARENT | CHILD
 ├─ passwordHash (Argon2id)        ← ADMIN/PARENT
 ├─ picturePinHash (Argon2id)      ← CHILD, chuỗi 4 hình
 ├─ isActive, mustChangePassword, lastLoginAt, failedCount, lockedUntil
 └─ createdById (ai tạo tài khoản này)

Student   ── hồ sơ học tập, nối 1–1 với một User role=CHILD qua userId
StudentGuardian ── nối User role=PARENT ↔ Student (một phụ huynh có thể gắn cả hai bé)
LoginAudit ── userId?, usernameTried, ip, userAgent, result (OK|SAI_MAT_KHAU|BI_KHOA|KHONG_TON_TAI), at
```

Toàn bộ dữ liệu học tập vẫn treo ở `Student` như cũ (`03-MO-HINH-DU-LIEU.md`) — thêm vai trò **không** làm thay đổi phần đó.

## 3. Tài khoản admin tạo sẵn

Seed lúc chạy migration lần đầu, lấy từ `.env`:

```
ADMIN_USERNAME=admin
ADMIN_EMAIL=...
ADMIN_PASSWORD=...        # đặt mật khẩu mạnh; sau lần đăng nhập đầu bắt buộc đổi
```

- Nếu đã có người dùng `ADMIN` trong DB thì bỏ qua, không tạo trùng.
- `mustChangePassword = true` → lần đăng nhập đầu tiên bị chuyển tới trang đổi mật khẩu, không vào được chỗ nào khác.
- Seed **không** tạo sẵn tài khoản cho Ba/Mẹ/hai bé — admin tự tạo trong `/admin/users`, để mật khẩu và mã hình do người thật đặt.

## 4. Màn hình đăng nhập

Một trang `/login` duy nhất, chia hai phần rõ ràng:

```
┌──────────────────────────────────────────┐
│        HỌC CÙNG MAI THY & CHÍ THANH      │
│                                          │
│   ┌────────┐   ┌────────┐                │   ← phần của con: 2 thẻ ảnh to
│   │  🧒    │   │  👧    │                │      chạm vào → lưới 9–12 hình
│   │ Chí Thanh  │   │  Mai Thy   │                │      chọn đúng 4 hình theo thứ tự
│   └────────┘   └────────┘                │
│                                          │
│   ─────────  Ba mẹ đăng nhập  ─────────  │   ← phần người lớn, chữ nhỏ hơn
│   Tên đăng nhập  [            ]          │
│   Mật khẩu       [            ]          │
│   [ Đăng nhập ]        Quên mật khẩu?    │
└──────────────────────────────────────────┘
```

- Thẻ của con chỉ hiện ảnh và tên gọi — không hiện tên đầy đủ.
- Mã hình: lưới 9–12 hình (con vật, đồ vật) do admin chọn khi tạo tài khoản; con nhớ **4 hình theo thứ tự**. Có nút loa đọc "Chọn 4 hình của con nhé".
- "Quên mật khẩu": không gửi email tự động — hiện hướng dẫn "nhờ admin đặt lại trong `/admin/users`". Đơn giản và an toàn hơn cho một hệ thống gia đình.

## 5. Quản lý người dùng — `/admin/users`

Một bảng, năm thao tác. Không hơn.

| Cột | |
|---|---|
| Ảnh · Tên hiển thị · Tên đăng nhập · Vai trò · Con được gắn · Đang bật? · Đăng nhập lần cuối |

**Thao tác:**
1. **Tạo tài khoản** — chọn vai trò; `PARENT` thì nhập email + mật khẩu tạm (bắt buộc đổi lần đầu); `CHILD` thì chọn ảnh đại diện, đặt mã 4 hình, và **tạo luôn hồ sơ `Student` đi kèm** (tên gọi ở nhà, lớp, sở thích, mascot).
2. **Gắn phụ huynh ↔ con** — tick con nào thuộc phụ huynh nào; phụ huynh chỉ thấy dữ liệu của con được gắn.
3. **Đặt lại mật khẩu / mã hình** — admin đặt giá trị mới, hệ thống bắt đổi ở lần đăng nhập kế (với người lớn).
4. **Bật/tắt tài khoản** — tắt thì không đăng nhập được nhưng dữ liệu học của con vẫn giữ nguyên.
5. **Xem nhật ký đăng nhập** — 50 lần gần nhất của tài khoản đó (thời điểm, IP, kết quả).

Không xoá cứng tài khoản có dữ liệu học; chỉ tắt. Xoá hẳn một bé đi theo quy trình xoá dữ liệu ở `01` FR-ADM-03.

## 6. Bảo vệ khi mở ra internet

Bắt buộc có ở v1:

| Việc | Cách làm |
|---|---|
| Không ai tự đăng ký | Không có trang đăng ký; chỉ admin tạo tài khoản |
| Mật khẩu | Argon2id; tối thiểu 10 ký tự với `ADMIN`/`PARENT`; chặn mật khẩu quá phổ biến |
| Chặn dò mật khẩu | Sai 5 lần → khoá tài khoản 10 phút (`lockedUntil`); đồng thời giới hạn theo IP (10 lần/phút). Với con: thông báo thân thiện "Mình thử lại sau nhé", đồng thời báo ba mẹ |
| Không lộ tài khoản nào tồn tại | Sai tên đăng nhập và sai mật khẩu đều trả cùng một thông báo |
| Phiên đăng nhập | Cookie `httpOnly` + `Secure` + `SameSite=Lax`; người lớn 30 ngày (có "ghi nhớ máy này"), con hết hạn sau 2 giờ không thao tác |
| CSRF | Token cho mọi thao tác ghi (Auth.js lo sẵn) |
| Tiêu đề bảo mật | HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`, CSP cơ bản |
| Phân quyền ở tầng server | Mọi API kiểm tra vai trò **và** quyền trên đúng `studentId`; không tin dữ liệu từ client |
| Nhật ký | `LoginAudit` mọi lần đăng nhập thành công/thất bại; xem được trong admin |
| Lớp chắn thêm | Cloudflare Access (email OTP) đặt trước `/admin` — chỉ Ba vào được, kể cả khi mật khẩu lộ |

Nên có (P1, làm ở pha 8):
- **Thiết bị tin cậy cho phần của con**: lần đầu vào từ một máy mới, phải có phụ huynh xác nhận một lần; sau đó máy đó nhớ cookie 90 ngày. Ngăn người lạ ngoài internet mò vào phần của con dù có đoán được mã hình.
- **2FA (TOTP)** cho tài khoản `ADMIN`.
- Cảnh báo email khi có đăng nhập admin từ IP lạ.

## 7. Tắt đăng nhập để thử (công tắc trong DB)

Khi ngồi thử máy, phải gõ mật khẩu mỗi lần rất mất công. Có một công tắc **trong cơ sở dữ liệu**
(`Setting`, khoá `auth.bypass`): bật lên thì mở địa chỉ web là vào thẳng `/admin`, không hỏi gì.

- **Bật/tắt ở đâu**: trang `/admin/auth` (một chạm), hoặc trên máy chủ:
  `pnpm auth:bypass on --hours 4` · `pnpm auth:bypass off` · `pnpm auth:bypass status`.
  Dòng lệnh là đường thoát khi chính trang đăng nhập đang hỏng.
- **Luôn có hạn**: mặc định 8 giờ, tối đa 7 ngày. Hết hạn là tự bật lại đăng nhập, không cần ai nhớ.
- **Mượn một tài khoản `ADMIN` thật**, không tạo danh tính ảo — nên mọi kiểm tra vai trò và quyền
  trên `studentId` ở tầng server vẫn chạy y như cũ (§6).
- **Luôn có băng cảnh báo** trên mọi màn hình người lớn: đang tắt, mượn tài khoản nào, mấy giờ tự
  bật lại. Mỗi lần bật/tắt ghi một dòng `AuditLog` (`auth.bypass.on` / `auth.bypass.off`).
- **Không mở cửa Cloudflare Access**: nếu đã đặt Access trước `/admin` thì vẫn phải qua Access.
  Công tắc này mở một lớp, không mở cả hai.
- **Cảnh báo**: web mở ra internet, nên trong lúc tắt, bất kỳ ai biết địa chỉ đều xem được bài vở và
  số liệu của hai bé. Chỉ tắt khi đang thử máy; xong thì bật lại ngay. Mặc định trên production là
  **tắt công tắc** (tức là vẫn phải đăng nhập).

## 8. Điều KHÔNG làm (giữ đơn giản)

- Không phân quyền chi tiết theo từng chức năng — chỉ ba vai trò.
- Không có đăng nhập bằng Google/Facebook ở v1 (có thể thêm sau, Auth.js hỗ trợ sẵn).
- Không có luồng quên mật khẩu qua email, không có mời qua email.
- Không multi-tenant, không phân quyền theo lớp/trường.
