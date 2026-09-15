# 3d-city — bàn render bảng phong cách Pha 10 (việc 1)

Dựng lại cảnh mẫu `3d-proto/` bằng **Kenney City/Nature Kit (CC0)** + nhà kỹ năng/kỳ quan tự dựng,
bảng màu tươi hơn, có trời mây. Đây là **mầm của `packages/city`** (việc 2): `lib.js` chỉ dùng
three.js thuần, chuyển sang được nguyên vẹn.

## Chạy (PowerShell, cần Chrome đã cài và đã tải kit vào `../kenney/`)

```powershell
cd content/art/3d-city
npm install            # three 0.169 + playwright-core (không thuộc pnpm workspace)
node shoot.mjs --all   # 6 ảnh → docs/screens/3d-city/
node shoot.mjs "city.html?city=viet&hud=0" ..\..\..\docs\screens\3d-city\pho-chu-khong-hud.jpg 2400 1500
```

Render bằng GPU thật (Chrome headless, ANGLE/D3D11): ~1 s cho bảng, ~9 s cho cả thành phố.

| Trang | Tham số | Nội dung |
|---|---|---|
| `city.html` | `city=vmath\|viet`, `hud=0`, `pitch`, `fov`, `dist`, `k`, `r0` | một thành phố đầy đủ + HUD mẫu |
| `sheet.html` | `city=` | một kỹ năng, 5 mức công trình |
| `wonder.html` | `city=` | kỳ quan ghép mảnh, 3 giai đoạn |
| `probe.html` | `kit=`, `only=<regex>`, `top=1` | bảng tiếp xúc mô hình Kenney + in kích thước |

## Quyết định kỹ thuật trong bản này

- **Đất cong ra xa** (`enableCurvature`): thành phố phẳng trong bán kính `r0`, ngoài đó mặt đất
  dốc xuống `k·d²`. Nhờ vậy camera kiểu city-builder (nghiêng 27°) vẫn thấy trời và mây phía trên
  núi. Vá chung vào `project_vertex` nên bóng đổ uốn khớp; mây gắn `defines.NO_CURVE`.
- **Ánh sáng**: bán cầu trời xanh nhạt + đất **kem** (đất xanh lá làm tường ngả ô-liu), nắng
  chếch trái-trước, `NoToneMapping` như mẫu cũ.
- **Mái ngói cong** tự dựng lưới (4 mặt lõm, góc vểnh, vân ngói bằng canvas) — thay ConeGeometry.
- **Mảnh kỳ quan chưa có** hiện kính xanh nhạt + viền xanh để con thấy hình sắp hoàn thành.

## Số đo (máy render, chưa phải iPad)

Cảnh thành phố hiện ~4.200 draw call, ~720k tam giác — **vượt xa** ngân sách iPad (≤ 150 draw
call, ≤ 80k tam giác). Bản này là ảnh chất lượng mục tiêu; việc 2 phải gộp InstancedMesh / gộp
geometry theo ô, hoặc bật đường WebP render sẵn — quyết bằng số đo trên iPad thật, ghi ADR.
