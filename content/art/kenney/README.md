# kenney/ — tài sản 3D nền cho Thế giới Học Đường (Pha 10)

Nguồn: **Kenney** (www.kenney.nl), giấy phép **CC0 1.0** (public domain — dùng cho mọi mục đích,
không bắt buộc ghi công; vẫn ghi ở đây để biết gốc gác). Bản `License.txt` gốc nằm trong từng thư
mục kit sau khi giải nén.

| Kit | Phiên bản | Tải ngày | Link trang | File zip |
|---|---|---|---|---|
| City Kit (Suburban) | 2.0 | 15/09/2026 | https://kenney.nl/assets/city-kit-suburban | `kenney_city-kit-suburban_20.zip` |
| City Kit (Commercial) | 2.1 | 15/09/2026 | https://kenney.nl/assets/city-kit-commercial | `kenney_city-kit-commercial_2.1.zip` |
| City Kit (Industrial) | 2.0 | 15/09/2026 | https://kenney.nl/assets/city-kit-industrial | `kenney_city-kit-industrial_2.0.zip` |
| City Kit (Roads) | (không ghi số) | 15/09/2026 | https://kenney.nl/assets/city-kit-roads | `kenney_city-kit-roads.zip` |
| Nature Kit | (không ghi số) | 15/09/2026 | https://kenney.nl/assets/nature-kit | `kenney_nature-kit.zip` |

## Không vào git

Thư mục này ~98 MB sau giải nén nên **gitignore toàn bộ trừ README này**. `pnpm art:sync` cũng bỏ
qua nó (không chép sang `apps/web/public/art`). Việc 2 (`packages/city`) sẽ chọn ra một bộ nhỏ các
GLB thật sự dùng và đặt vào chỗ web phục vụ được.

## Dựng lại trên máy khác (PowerShell)

```powershell
cd content/art/kenney
foreach ($s in 'city-kit-suburban','city-kit-commercial','city-kit-industrial','city-kit-roads','nature-kit') {
  $html = (Invoke-WebRequest "https://kenney.nl/assets/$s").Content
  $url = [regex]::Match($html, "https://kenney.nl/media/pages/assets/$s/[^']*\.zip").Value
  $zip = "_zip/" + (Split-Path $url -Leaf)
  New-Item -ItemType Directory -Force _zip | Out-Null
  Invoke-WebRequest $url -OutFile $zip
  Expand-Archive $zip -DestinationPath $s -Force
}
```

## Cách dùng trong dự án

- City kits: mỗi kit dùng **một ảnh `colormap.png` 512²** (các ô màu). Thành phố tô lại bằng cách vẽ
  lại các ô màu đó: trắng → màu tường, xám đậm → màu mái, xanh dương → kính, xanh lá → màu nhấn
  (`recolorMap` trong `content/art/3d-city/lib.js`).
- Nature Kit: màu nằm ở vật liệu (không có texture) → đổi màu theo sắc độ lá/thân (`natureRecolor`).
- Kích thước: 1 ô đường = 1 đơn vị Kenney; dự án nhân `TILE = 3.2`.
- Hướng ô đường (đo bằng `probe.html?kit=roads&top=1`): `road-straight` chạy theo trục x;
  `road-end` hở về +x; `road-intersection` kín phía −z.
- **Không dùng** cho công trình của kỹ năng và kỳ quan (phải cao lên theo mastery → tự dựng theo tham số).
