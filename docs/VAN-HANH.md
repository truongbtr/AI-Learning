# VAN-HANH.md — Sổ tay vận hành

> Viết cho **chủ dự án**, không phải cho lập trình viên. Mỗi mục trả lời một câu hỏi thật, theo
> thứ tự bạn sẽ cần đến chúng.
>
> **Từ pha 9**: máy chủ thật chạy trên **Ubuntu** (`192.168.1.102`), không còn trên máy Windows.
> Mọi lệnh `docker compose ...` trong sổ tay này giờ chạy **sau khi vào được máy Ubuntu** — xem
> [§0](#0-vào-máy-chủ-ubuntu) — chứ không mở PowerShell tại `E:\PROJECT\EDISON_LEARNING` trên máy
> Windows nữa (máy Windows chỉ còn giữ bản sao lưu kéo về qua LAN, xem [§6](#6-sao-lưu-và-khôi-phục)).

## Mục lục

| Cần gì | Mục |
|---|---|
| Vào máy chủ Ubuntu | [§0](#0-vào-máy-chủ-ubuntu) |
| Web không vào được — làm gì trước tiên | [§1](#1-web-không-vào-được) |
| Khởi động / tắt / khởi động lại | [§2](#2-khởi-động-tắt-khởi-động-lại) |
| Xem log | [§3](#3-xem-log) |
| Mở web ra internet (Cloudflare Tunnel + Access) | [§4](#4-mở-ra-internet-cloudflare-tunnel--access) |
| Cài lên iPad và điện thoại | [§5](#5-cài-lên-ipad-và-điện-thoại) |
| Sao lưu và khôi phục | [§6](#6-sao-lưu-và-khôi-phục) |
| Thêm / sửa / khoá tài khoản | [§7](#7-tài-khoản) |
| Xuất hoặc xoá dữ liệu một bé | [§8](#8-xuất-hoặc-xoá-dữ-liệu-một-bé) |
| Chi phí và hạn mức | [§9](#9-chi-phí) |
| Ba tối đầu của một bé mới | [§10](#10-ba-tối-đầu-phiên-chẩn-đoán) |
| Việc hằng tuần | [§11](#11-việc-hằng-tuần) |
| Chụp bài vở bằng app Claude trên điện thoại | [§12](#12-chụp-bài-vở-bằng-app-claude-trên-điện-thoại) |
| Thư mục `ops/` — số liệu và cách nhờ đổi | [§13](#13-thư-mục-ops--số-liệu-và-cách-nhờ-đổi) |

---

## 0. Vào máy chủ Ubuntu

Máy chủ là một máy ảo Ubuntu chạy trên chính máy Windows này (Hyper-V), địa chỉ `192.168.1.102`.
Vào bằng khoá — **không có mật khẩu** để gõ (đã tắt từ pha 9, an toàn hơn).

Mở PowerShell (ở đâu cũng được, không cần đúng thư mục), gõ:

```powershell
ssh -i $env:USERPROFILE\.ssh\medifa_deploy_ed25519 truong@192.168.1.102
```

Vào được thì thấy dấu nhắc `truong@eduserver:~$`. Dự án nằm ở `/opt/edison-learning` — mọi lệnh
`docker compose ...` trong sổ tay này chạy tại đó:

```bash
cd /opt/edison-learning
docker compose --env-file .env -f docker/compose.yml ps
```

**Khởi động lại cả máy ảo** (ví dụ sau khi cúp điện): vào Hyper-V Manager trên máy Windows này →
chọn máy ảo → **Start** (hoặc **Restart** nếu đang chạy). Không cần gõ gì thêm — mọi dịch vụ
(Postgres, web, worker, sao lưu) tự khởi động lại cùng máy (đã kiểm chứng ở pha 9).

**Xem máy ảo có đang chạy không, không cần vào máy**: mở Hyper-V Manager trên máy Windows, nhìn
trạng thái máy ảo trong danh sách.

---

## 1. Web không vào được

Làm theo thứ tự này. **Dừng lại ngay khi web vào được** — không cần làm tiếp.

### Bước 1 — hỏi máy một câu

```powershell
Invoke-RestMethod http://localhost:5000/api/health | ConvertTo-Json -Depth 4
```

| Thấy gì | Nghĩa là | Sang bước |
|---|---|---|
| `status: ok` | Máy chủ vẫn chạy — lỗi ở đường truyền, không ở máy | 4 |
| `status: degraded` | Chạy nhưng có gì đó hỏng; đọc dòng `worker` và `jobs` | 3 |
| `status: error` hoặc `db: error` | Cơ sở dữ liệu không nối được | 2 |
| Lệnh báo lỗi đỏ, không trả gì | Web không chạy | 2 |

### Bước 2 — bật lại cả ba container

```powershell
docker compose --env-file .env -f docker/compose.yml up -d
```

Đợi khoảng 60 giây (lần đầu sau khi cập nhật có thể 2–3 phút vì phải chạy migration), rồi hỏi lại
bước 1.

Nếu Docker Desktop chưa chạy: mở **Docker Desktop** từ Start Menu, đợi biểu tượng cá voi hết nhấp
nháy, rồi chạy lại lệnh trên.

### Bước 3 — xem cái gì hỏng

```powershell
pnpm db:usage
```

Dòng nào bắt đầu bằng `!!` là dòng có vấn đề, và câu ngay sau nó nói phải làm gì. Hoặc mở
<http://localhost:5000/admin/health> — trang đó có hẳn một khối **"Cần làm gì"**, chép nguyên dòng
lệnh trong đó dán vào PowerShell.

### Bước 4 — vào được ở nhà nhưng không vào được từ ngoài

Máy chủ ổn, vấn đề ở Cloudflare Tunnel.

```powershell
docker compose --env-file .env -f docker/compose.yml --profile tunnel restart cloudflared
docker compose -f docker/compose.yml logs --tail 40 cloudflared
```

Log có `Registered tunnel connection` là đường hầm đã lên. Nếu có `Unauthorized` hoặc
`invalid token` thì `TUNNEL_TOKEN` trong `.env` sai hoặc tunnel đã bị xoá trên Cloudflare — làm lại
[§4](#4-mở-ra-internet-cloudflare-tunnel--access).

### Bước 5 — vẫn không được

Khởi động lại toàn bộ, mạnh tay hơn:

```powershell
docker compose --env-file .env -f docker/compose.yml down
docker compose --env-file .env -f docker/compose.yml up -d
```

Lệnh `down` **không** xoá dữ liệu (dữ liệu nằm trong volume `mtct_pgdata`, không nằm trong
container). Nếu sau bước này vẫn hỏng, chụp màn hình kết quả của:

```powershell
docker compose -f docker/compose.yml ps
docker compose -f docker/compose.yml logs --tail 100 web worker
```

và gửi cho người phát triển. **Đừng chạy lệnh nào có chữ `volume rm` hay `-v`** — đó là lệnh xoá
dữ liệu.

> **Trong lúc chờ:** hai bé vẫn học được nếu iPad đang mở sẵn màn hình bài. Nếu không, hôm đó nghỉ
> một buổi — chuỗi ngày (`Streak`) **không bị mất** khi nghỉ, đó là quy tắc đã chốt ở ADR-16.

---

## 2. Khởi động, tắt, khởi động lại

```powershell
# Bật tất cả (postgres + web + worker)
docker compose --env-file .env -f docker/compose.yml up -d

# Bật thêm đường hầm ra internet
docker compose --env-file .env -f docker/compose.yml --profile tunnel up -d cloudflared

# Bật thêm sao lưu hằng đêm
docker compose --env-file .env -f docker/compose.yml --profile backup up -d backup

# Khởi động lại một cái thôi
docker compose --env-file .env -f docker/compose.yml restart web
docker compose --env-file .env -f docker/compose.yml restart worker

# Tắt hết (dữ liệu vẫn còn)
docker compose --env-file .env -f docker/compose.yml down

# Xem cái nào đang chạy
docker compose -f docker/compose.yml ps
```

> `--env-file .env` **không được bỏ** — không có nó thì Postgres mở cổng 5432 thay vì 5433 và đụng
> với hệ thống khác trên máy này.

**Cập nhật lên bản mới** (sau khi `git pull`):

```powershell
docker compose --env-file .env -f docker/compose.yml up -d --build
```

Migration tự chạy khi container `web` khởi động. Nên [sao lưu](#6-sao-lưu-và-khôi-phục) trước.

---

## 3. Xem log

```powershell
# Đang xảy ra gì, theo dõi trực tiếp (Ctrl+C để thoát)
docker compose -f docker/compose.yml logs -f web worker

# 100 dòng cuối
docker compose -f docker/compose.yml logs --tail 100 worker

# Chỉ tìm dòng có lỗi
docker compose -f docker/compose.yml logs --tail 500 worker | Select-String -Pattern "error|failed"
```

Dòng bình thường của worker là `ping ok` mỗi phút. Không thấy dòng đó trong vài phút nghĩa là worker
chết — khởi động lại nó ([§2](#2-khởi-động-tắt-khởi-động-lại)).

**Ai đã đăng nhập:** `/admin/users` → chọn tài khoản → 50 lần đăng nhập gần nhất (thời điểm, IP,
thành công hay không).

---

## 4. Mở ra internet (Cloudflare Tunnel + Access)

Làm một lần. Bạn cần: tài khoản Cloudflare và một tên miền đã trỏ nameserver về Cloudflare.

> **Vì sao dùng đường hầm:** cổng 80 và 443 trên máy này đã có hệ thống khác dùng, và mở cổng ra
> router là thứ không nên làm với dữ liệu của trẻ con. Đường hầm **gọi ra ngoài**, không mở cổng
> nào vào trong.

### 4.1 Tạo đường hầm

1. Vào <https://one.dash.cloudflare.com> → **Networks** → **Tunnels** → **Create a tunnel**.
2. Chọn **Cloudflared**, đặt tên `mtct-nha`, bấm **Save tunnel**.
3. Màn hình tiếp theo hiện một dòng lệnh dài có chứa token. **Chỉ copy phần token** — chuỗi rất
   dài sau chữ `--token`.
4. Mở `.env`, dán vào:

   ```
   TUNNEL_TOKEN=<chuỗi vừa copy>
   AUTH_URL=https://hoc.tenmien-cua-ban.com
   ```

5. Ở tab **Public Hostnames** của tunnel, bấm **Add a public hostname**:

   | Ô | Điền |
   |---|---|
   | Subdomain | `hoc` |
   | Domain | tên miền của bạn |
   | Type | `HTTP` |
   | URL | `web:3000` |

   `web:3000` là tên container, không phải `localhost` — cloudflared chạy trong cùng mạng Docker.

6. Bật đường hầm:

   ```powershell
   docker compose --env-file .env -f docker/compose.yml restart web
   docker compose --env-file .env -f docker/compose.yml --profile tunnel up -d cloudflared
   ```

7. Mở `https://hoc.tenmien-cua-ban.com` bằng điện thoại **tắt wifi** (dùng 4G) để chắc chắn là đi
   đường internet thật. HTTPS do Cloudflare cấp, không cần cài chứng chỉ gì.

### 4.2 Khoá `/parent` và `/admin` bằng Access

Đây là **lớp khoá thứ hai**: kể cả khi mật khẩu của bạn lộ, người lạ vẫn phải qua được email của
bạn. Phần của con **không** đặt sau lớp này — trẻ 6 tuổi không đọc được email để lấy mã.

1. Zero Trust → **Access** → **Applications** → **Add an application** → **Self-hosted**.
2. Điền:

   | Ô | Điền |
   |---|---|
   | Application name | `MTCT — ba mẹ` |
   | Session Duration | `1 month` |
   | Subdomain / Domain | `hoc` / tên miền của bạn |
   | Path | `parent` |

3. **Add policy**: tên `Ba và Mẹ`, Action `Allow`, Include → **Emails** → điền email của hai vợ
   chồng. Save.
4. **Làm lại từ bước 1 cho `Path = admin`** (một ứng dụng nữa, cùng policy). Làm thêm một cái cho
   `Path = dev` nếu muốn kín hoàn toàn.
5. **Đừng tạo ứng dụng nào cho `/kid`, `/login`, `/api`** — làm thế là khoá luôn hai bé ra ngoài.

### 4.3 Bắt máy chủ tự kiểm tra Access

Bước 4.2 mới là Cloudflare chặn. Để chính máy chủ ở nhà cũng kiểm tra (phòng trường hợp có ai tìm
được đường khác vào), lấy hai giá trị và dán vào `.env`:

- **Team domain**: Zero Trust → Settings → Custom Pages, dòng `<tên-team>.cloudflareaccess.com`.
- **Application Audience (AUD) tag**: mở ứng dụng `MTCT — ba mẹ` → tab **Overview**, copy chuỗi hex
  dài.

```
CF_ACCESS_TEAM_DOMAIN=giadinh.cloudflareaccess.com
CF_ACCESS_AUD=<chuỗi AUD>
```

Rồi `docker compose --env-file .env -f docker/compose.yml restart web`.

> Hai ứng dụng Access (`parent` và `admin`) **phải dùng chung một AUD** thì cách này mới nhận cả
> hai. Nếu Cloudflare cho AUD khác nhau, tạo **một** ứng dụng với Path để trống (bảo vệ cả tên
> miền) rồi thêm **Bypass policy** cho `/kid`, `/login`, `/api`, `/art` — và dùng AUD của nó.

**Kiểm tra:**

```powershell
# Từ ngoài internet: phải trả 302 sang cloudflareaccess.com (hoặc 403)
curl.exe -I https://hoc.tenmien-cua-ban.com/parent
# Phần của con vẫn phải vào được bình thường
curl.exe -I https://hoc.tenmien-cua-ban.com/login
```

`/admin/health` có một dòng **Cloudflare Access** cho biết máy chủ đã bật kiểm tra hay chưa.

---

## 5. Cài lên iPad và điện thoại

Cài xong thì app có icon riêng trên màn hình chính và chạy **toàn màn hình**, không có thanh địa chỉ
cho con bấm nhầm ra ngoài.

### iPad / iPhone (Safari — bắt buộc, Chrome trên iOS không cài được)

1. Mở **Safari**, vào `https://hoc.tenmien-cua-ban.com`.
2. Bấm nút **Chia sẻ** (ô vuông có mũi tên lên) ở thanh trên.
3. Kéo xuống, chọn **Thêm vào MH chính** (*Add to Home Screen*).
4. Sửa tên thành **"Học"** cho ngắn — tên dài bị cắt trên màn hình iPad.
5. Bấm **Thêm**. Icon ngôi sao vàng xuất hiện trên màn hình chính.

### Android

Mở Chrome → menu ba chấm → **Cài đặt ứng dụng** / *Install app*.

### Cho hai bé dùng lần đầu

1. Mở app từ icon → màn hình đăng nhập.
2. Chạm **ảnh đại diện** của bé → chọn **4 hình theo đúng thứ tự** đã đặt. Không cần bàn phím.
3. Lần đầu trên một máy mới, hệ thống hỏi xác nhận của ba mẹ **một lần**; sau đó máy đó được nhớ 90
   ngày.
4. Phiên của con hết hạn sau **2 giờ không thao tác** — tối hôm sau con đăng nhập lại bằng 4 hình,
   mất 5 giây.

> **Nên làm:** bật **Screen Time → Giới hạn nội dung** trên iPad để con không mở Safari ra ngoài.
> App này không có link nào ra internet, nhưng iPad thì có.

---

## 6. Sao lưu và khôi phục

> **Từ pha 9, sao lưu đi hai chặng**: container `backup` trên máy Ubuntu tự chạy mỗi đêm 1 giờ,
> ghi vào `/opt/edison-learning/_sao-luu` trên chính máy Ubuntu; rồi một tác vụ trên máy Windows
> (`Task Scheduler` → `MTCT-PullUbuntuBackup`, chạy 1:20 sáng, không cần quyền admin) tự kéo bản
> mới nhất về `E:\SAO-LUU-MTCT` như cũ qua mạng LAN. Muốn kéo tay ngay: mở PowerShell tại
> `E:\PROJECT\EDISON_LEARNING`, chạy `pwsh scripts\pull-ubuntu-backup.ps1`. Nhật ký ở
> `docs\dien-tap\pull-ubuntu-backup.log`. Đây là giải pháp tạm — khi nào có NAS hay ổ chia sẻ
> riêng, đổi `BACKUP_DIR` trong `.env` trên Ubuntu và bỏ tác vụ kéo này đi.

### 6.1 Sao lưu chạy tự động (trên máy Ubuntu)

Container `backup` chạy mỗi đêm lúc `BACKUP_HOUR` (mặc định 1 giờ sáng) và ghi vào `BACKUP_DIR`
(mặc định `/opt/edison-learning/_sao-luu` trên Ubuntu — không phải `E:\SAO-LUU-MTCT` nữa, xem
khung trên):

```
E:\SAO-LUU-MTCT\
  db\mtct-2026-09-12-0100.dump    ← toàn bộ cơ sở dữ liệu, nén sẵn
  files\                          ← ảnh bài vở, mp3 giọng đọc
  latest.txt                      ← tên bản mới nhất
```

Bật nó:

```powershell
docker compose --env-file .env -f docker/compose.yml --profile backup up -d backup
```

Sao lưu **ngay bây giờ**, không chờ tới đêm:

```powershell
docker compose --env-file .env -f docker/compose.yml --profile backup run --rm backup /backup/backup.sh
```

Bản cũ hơn `BACKUP_KEEP_DAYS` (mặc định 30) ngày tự xoá — trừ khi mọi bản đều cũ, lúc đó nó không
xoá gì cả, để không bao giờ có ngày nào không còn bản nào.

> **Chép sang NAS:** `BACKUP_DIR` là một thư mục Windows bình thường. Trỏ Synology Drive /
> OneDrive / một tác vụ `robocopy` vào đó là xong — không cần sửa gì trong dự án.

### 6.2 Diễn tập khôi phục (nên làm mỗi quý)

Dựng một máy chủ Postgres **trắng tinh**, khôi phục bản sao lưu vào đó, đếm lại từng bảng, rồi tự
dọn. **Không đụng gì tới dữ liệu đang chạy.**

```powershell
pwsh scripts/restore-drill.ps1
```

Mất khoảng 10 giây. Dòng cuối phải là `KẾT QUẢ: ĐẠT`. Nhật ký lưu ở `docs/dien-tap/`.

### 6.3 Khôi phục thật (khi ổ hỏng, hoặc lỡ xoá nhầm)

**Bước 1 — tắt web và worker**, để không có ai ghi thêm trong lúc khôi phục:

```powershell
docker compose --env-file .env -f docker/compose.yml stop web worker
```

**Bước 2 — khôi phục vào một database mới trước, xem thử:**

```powershell
docker compose --env-file .env -f docker/compose.yml --profile backup run --rm backup /backup/restore.sh
```

Không truyền tên file thì nó lấy bản mới nhất. Nó in ra số dòng của từng bảng — đối chiếu với con
số bạn nhớ (ví dụ 1.236 bài luyện, 376 kỹ năng).

**Bước 3 — nếu đúng, đè lên database thật:**

```powershell
docker compose --env-file .env -f docker/compose.yml --profile backup run --rm `
  -e RESTORE_OVERWRITE=1 backup /backup/restore.sh mtct-2026-09-12-0100.dump mtct
```

**Bước 4 — chép ảnh bài vở về, rồi bật lại:**

```powershell
docker compose --env-file .env -f docker/compose.yml up -d web worker
Invoke-RestMethod http://localhost:5000/api/health
```

---

## 7. Tài khoản

**Không có đăng ký công khai.** Chỉ admin tạo được tài khoản.

| Việc | Làm ở đâu |
|---|---|
| Thêm ba/mẹ, thêm bé | `/admin/users` → **Thêm người dùng** |
| Đặt lại mật khẩu người lớn | `/admin/users` → chọn tài khoản → **Đặt lại** (người đó bị bắt đổi ở lần đăng nhập kế) |
| Đổi mã 4 hình của bé | `/admin/users` → chọn bé → **Đặt lại mã hình** |
| Khoá tạm một tài khoản | `/admin/users` → **Tắt** (không xoá, dữ liệu học còn nguyên) |
| Nối ba mẹ với con | Khi tạo tài khoản `PARENT`, chọn các bé ở ô **Con** |
| Xem lịch sử đăng nhập | `/admin/users` → chọn tài khoản → 50 lần gần nhất |

> **Tài khoản `PARENT` phải được nối với bé** qua ô "Con", nếu không `/parent` sẽ trống. Tài khoản
> `ADMIN` xem được mọi bé.

**Tài khoản riêng để chạy test:** tạo một `ADMIN` tên `qc`, đăng nhập một lần để đổi mật khẩu, rồi
điền `E2E_ADMIN_USER` / `E2E_ADMIN_PASSWORD` vào `.env`. Đừng dùng mật khẩu admin thật (README §
"Chạy bộ nghiệm thu").

**Sai mật khẩu 5 lần** → khoá 10 phút. Chờ, hoặc vào `/admin/users` mở khoá.

---

## 8. Xuất hoặc xoá dữ liệu một bé

**Xuất ra một file JSON đọc được** (mọi thứ hệ thống biết về bé đó):

```powershell
pnpm db:export-student -- --student thy
```

File nằm ở `_xuat-du-lieu\thy-<ngày>.json`. Ảnh bài vở **không** nằm trong file này — chúng ở
`FILE_ROOT` và trong thư mục sao lưu.

**Xoá sạch dữ liệu một bé** (không quay lại được):

```powershell
pnpm db:delete-student -- --student thy            # chỉ in ra, chưa xoá gì
pnpm db:delete-student -- --student thy --apply    # xoá thật
```

Nó **luôn xuất một bản JSON trước khi xoá**, rồi bắt bạn gõ đúng tên gọi ở nhà của bé để xác nhận.
Thêm `--keep-login` nếu chỉ muốn xoá dữ liệu học mà giữ hồ sơ và tài khoản.

---

## 9. Chi phí

**App không gọi API AI nào** (ADR-9, ADR-10). Mọi việc cần đọc-hiểu-viết do Claude Code làm theo lô
trong repo, không tính phí theo lần chạy.

Dịch vụ trả phí duy nhất là **Azure Speech** (giọng đọc), bậc **F0 — miễn phí 500.000 ký tự/tháng**.

```powershell
pnpm db:usage
```

hoặc mở `/admin/health`, thẻ **"Giọng đọc tháng này"**, và bảng theo tháng bên dưới.

Chỉ tính lần **thật sự gọi Azure**. Câu đã có mp3 trong kho thì phát file, không tốn gì — nên tối
nào hai bé học cũng gần như bằng 0. Thứ ăn hạn mức là `pnpm content:import` khi nạp nội dung mới.

**Nếu sắp chạm 500.000:** trang health tự chuyển vàng từ 80%. Lúc đó tạm dừng `content:import` tới
đầu tháng sau, hoặc đặt `TTS_PROVIDER=webspeech` trong `.env` (giọng trên máy, miễn phí, nghe máy
móc hơn).

**Ổ đĩa:** `/admin/health` cảnh báo khi còn dưới `DISK_WARN_FREE_GB` (mặc định 10 GB). Ảnh bài vở
là thứ ăn chỗ nhất.

---

## 10. Ba tối đầu: phiên chẩn đoán

Một bé mới chưa có dữ liệu gì thì hệ thống **không biết con đang ở đâu**, nên ba tối đầu là ba
phiên **chẩn đoán đầu vào** (`docs/04` §10): mỗi tối ~10 câu, làm đúng thì câu sau khó hơn, chưa
chắc thì câu sau lùi về phần nền.

**Bạn không phải làm gì cả.** Con vẫn bấm "Học ngay" như mọi hôm; bản đồ nhiệm vụ nhìn y hệt. Con
**không được cho biết** đây là bài kiểm tra — trẻ 6 tuổi biết mình đang bị kiểm tra sẽ làm khác đi,
và thường là kém hơn.

Xem trước ba tối đó sẽ hỏi gì:

```powershell
pnpm db:assess -- --status          # còn mấy phiên nữa
pnpm db:assess                      # dựng phiên kế tiếp và in ra các trạm
```

Sau ba tối, hệ thống tự chuyển sang nhiệm vụ hằng ngày bình thường. Sau 7 ngày thì đề xuất kế hoạch
tuần đầu tiên (`/parent/<bé>/plan` → **Nhờ Claude Code đề xuất**).

Nếu bạn **đã biết rõ con đang ở đâu** và muốn bỏ qua: `pnpm plan:run -- --student thy --force
--no-assessment`.

---

## 11. Việc hằng tuần

| Khi nào | Việc | Lệnh / chỗ làm |
|---|---|---|
| Mỗi tối sau giờ học | Dán nhật ký lớp của cô vào ô trên cùng `/parent` | web |
| Khi con làm bài trên giấy | Chụp bài vở → nút nổi trên `/parent` | web |
| 2–3 ngày một lần | Xử lý hàng chờ AI | `pnpm inbox:pull` → Claude Code → `pnpm inbox:validate` → `pnpm inbox:push` |
| Sau khi hàng chờ về | Duyệt kết quả đọc ảnh | `/parent/inbox` |
| Chủ nhật | Duyệt kế hoạch tuần | `/parent/<bé>/plan` |
| Mỗi tuần | Liếc trang sức khoẻ | `/admin/health` |
| Mỗi quý | Diễn tập khôi phục | `pwsh scripts/restore-drill.ps1` |

---

## 12. Chụp bài vở bằng app Claude trên điện thoại

Đây là đường hằng ngày, và **anh không phải gõ lệnh nào** (docs/13 §7). Buổi tối:

1. Mở app Claude trên điện thoại, chụp bài vở của con, gửi vào chat.
2. Nói một câu kiểu *"bài của Mai Thy tối nay"* (hoặc dán nguyên bài đăng Edi Parent của cô).
3. Chat tự đọc ảnh rồi đẩy vào hệ thống qua `https://edu.medifa.vn/api/internal/*`.
4. Mở `/parent` — **thẻ tối nay** hiện ngay: đọc mấy ảnh, ghi nhận gì, kỹ năng nào lên bao nhiêu.
   Nếu thấy máy đọc sai thì bấm **"Hoàn tác lô này"**: bằng chứng của lô biến mất và điểm kỹ năng
   quay về đúng giá trị trước đó.

### Làm một lần, trước khi dùng

| Việc | Ở đâu |
|---|---|
| Thêm `edu.medifa.vn` vào danh sách mạng cho phép của tài khoản Claude | cài đặt tài khoản Claude |
| `INTERNAL_API_TOKEN` có giá trị trong `.env` (đã có, 43 ký tự) | `.env` trên máy chủ |
| Nói cho phiên chat biết nó phải đọc ngữ cảnh trước | kỹ năng `nap-bai-vo-edison` đã cài sẵn |

### Khi nào máy **không** tự ghi

Ba trường hợp máy hay sai nhất thì nó **không** tự ghi, mà giữ lại cho anh xem (thẻ sẽ ghi rõ lý do):

- máy đọc chưa chắc (`confidence` dưới 0,6);
- không phân biệt được **ô trống** với **làm chưa đúng**;
- kỹ năng nó chọn không nằm trong danh sách ngữ cảnh mà máy chủ đã phát ra.

Những câu đó nằm trong `/parent/inbox` như ảnh vở bình thường, duyệt một chạm là xong.

### Khi thẻ không hiện

```powershell
# 1. Máy chủ còn ra internet không?
curl.exe https://edu.medifa.vn/api/health
# 2. Token còn đúng không? (401 = token sai; 200 = ổn)
curl.exe -H "Authorization: Bearer $env:INTERNAL_API_TOKEN" "https://edu.medifa.vn/api/internal/context?student=thy"
```

`/admin/inbox` có bảng **40 lời gọi nội bộ gần nhất**, kể cả lần bị từ chối và lý do — nhìn đó trước
khi đoán.

---

## 13. Thư mục `ops/` — số liệu và cách nhờ đổi

04:30 mỗi đêm máy tự chụp lại toàn bộ số liệu vận hành ra `ops/state/<ngày>/` (docs/14). Gọi tay
bất cứ lúc nào:

```powershell
pnpm ops:export
```

| Muốn biết | Mở |
|---|---|
| Tuần này thế nào, có gì hỏng không | `ops/state/SUMMARY.md` — một trang, đọc 30 giây |
| Bài nào con hay bỏ qua, bài nào ai cũng đúng / ai cũng sai | `ops/state/latest/exercise-health.csv` |
| Kỹ năng nào chưa có bài | `ops/state/latest/content-coverage.csv` |
| Con đang ở đâu từng kỹ năng | `ops/state/latest/mastery.csv` |

Giữ 90 ngày, dưới 5 MB mỗi ngày, **chỉ có tên gọi ở nhà** (`thy`, `thanh`) — không tên đầy đủ,
không ngày sinh. Thư mục này không lên git.

### Nhờ Claude đổi một thứ gì

Claude (Code hay chat) **không sửa thẳng cơ sở dữ liệu**. Nó đặt một file yêu cầu vào
`ops/requests/`, rồi anh chạy:

```powershell
pnpm ops:apply
```

Lệnh in ra **trước → sau → đường lùi** của từng thay đổi rồi hỏi `y/N`. Gật thì áp, ghi kết quả vào
`ops/applied/<ngày>/` và một dòng vào `ops/CHANGELOG.md`. Không gật thì không có gì xảy ra. Xem thử
mà chưa muốn quyết: `pnpm ops:apply --dry-run`.

**Không yêu cầu nào chạm được vào dữ liệu học của con** (`Evidence`, `Attempt`, `Session`,
`SkillMastery`) hay vào tài khoản (`User`) — file nào nhắc tới chúng bị từ chối cả file. Sửa nhãn
của con thì ba mẹ làm trên web, có ghi vết.

---

## Phụ lục — những gì KHÔNG bao giờ nên làm

- **Đừng** chạy lệnh có `docker volume rm` hoặc `docker compose down -v` — đó là xoá sạch dữ liệu.
- **Đừng** sửa file trong `packages/db/prisma/migrations/` — migration đã chạy rồi thì sửa là hỏng.
- **Đừng** đặt Cloudflare Access trước `/kid` hay `/login` — hai bé sẽ không vào được.
- **Đừng** chép `.env` ra ngoài máy hay gửi qua chat — trong đó có mật khẩu và token.
- **Đừng** bỏ `--env-file .env` trong lệnh docker — Postgres sẽ mở nhầm cổng 5432.
