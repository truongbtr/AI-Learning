# ADR-20 — Thành phố 3D: render thật trên máy, không dựng sẵn WebP

Ngày: 15/09/2026 · Pha 10 việc 2 · Trạng thái: **áp dụng; chờ số đo trên iPad thật để chốt** (xem
"Điều kiện lật quyết định")

## Bối cảnh

Đề bài pha 10 việc 2 đặt ngân sách cho iPad: **≤ 150 draw call, ≤ 80k tam giác, 60 fps**. Nếu không đạt
thì render sẵn từng ô thành WebP bằng Playwright rồi ghép 2D. Quyết định phải dựa trên số đo.

Cảnh mẫu của việc 1 (bảng phong cách) vượt rất xa ngưỡng: khoảng 4.300 draw call và 730k tam giác, vì
mỗi cửa sổ, cây, đèn là một mesh. Thêm nữa, thành phố của môn lớn nhất (Tiếng Việt, 102 kỹ năng) cần tới
41 khối nhà.

## Quyết định

**Render 3D thật bằng three.js** (`packages/city`). Cả sáu thành phố, ở cỡ lớn nhất, đều nằm trong ngân
sách tại mọi góc camera được phép. Không dựng đường WebP.

Năm cách làm giữ được ngân sách:

1. **Tính trước tài sản Kenney thành màu theo đỉnh** (`pnpm --filter @mtct/city bake:kenney` →
   `content/art/city/kenney.{bin,json}`, 70 mô hình, 1,56 MB). Lúc chạy không cần texture nào; tô màu
   theo thành phố chỉ là viết lại màu đỉnh.
2. **Gộp theo khối 16×16 ô và theo nhóm vật liệu.** Có 4 nhóm: `opaque` (gồm đặc, kính, đèn, nước), chữ
   biển hiệu, mảnh kỳ quan mờ, mây. Loại bề mặt nằm ở thuộc tính đỉnh `surf`, và shader tự chọn độ nhám,
   độ kim loại, độ phát sáng ngày/đêm. Nhờ vậy mỗi khối là 1 draw call.
3. **Camera không bao giờ xoay** (yaw 45°, pitch 27°, chỉ kéo và thu phóng 48–124). Vì thế lúc gộp có thể
   **bỏ hẳn các tam giác quay lưng khỏi camera** như tường sau và mặt đáy, giảm khoảng 45% tam giác. Bóng
   đổ vẽ hai mặt để không lọt sáng.
4. **Xe, người, thuyền, thú cưng dùng InstancedMesh**: 10 draw call, tối đa 6,3k tam giác. Bóng đổ tĩnh
   (`autoUpdate = false`), chỉ tính lại khi thành phố đổi.
5. **Bong bóng nhiệm vụ là nút HTML** đặt theo toạ độ chiếu (`engine.anchors()`). Không tốn tam giác,
   vùng chạm ≥ 64 px và đọc to được như mọi nút khác của giao diện con.

Có thêm lưới an toàn lúc chạy: nếu fps < 50 trong 2 giây liên tiếp thì hạ độ phân giải từng nấc 0,25,
thấp nhất về 1× (`maxPixelRatio` mặc định 2).

## Số đo

### Ngân sách: test tự động, không cần GPU

`packages/city/src/budget.test.ts` dựng thành phố mẫu cỡ lớn nhất: đủ kỹ năng (20% mỗi mức, kể cả toà
chọc trời), 14 công trình công cộng, 10 ô đất. Test đo ở 9 vị trí camera × 2 mức zoom × iPad ngang/dọc,
cộng tải tối đa của xe/người. Vượt ngưỡng thì test đỏ.

`pnpm --filter @mtct/city exec tsx scripts/budget-table.ts` (15/09/2026):

| Cỡ | Thành phố | Draw call xấu nhất | Tam giác xấu nhất | Dựng (ms, Node) |
|---|---|---|---|---|
| ngày đầu | 6 thành phố | 47–55 | 21,7k–23,1k | 61–141 |
| giữa năm (28 kỹ năng) | 6 thành phố | 59–60 | 35,8k–39,7k | 112–132 |
| đầy đủ | Phố Chữ (102 kỹ năng) | 73 | **79,5k** | 285 |
| đầy đủ | Thành Số | 70 | 70,2k | 246 |
| đầy đủ | Bến Cảng Từ | 71 | 67,6k | 215 |
| đầy đủ | Vườn Sách | 72 | 67,5k | 214 |
| đầy đủ | Xưởng Máy | 71 | 71,5k | 243 |
| đầy đủ | Trạm Khám Phá | 69 | 74,3k | 205 |

Draw call còn dư gấp đôi. Tam giác của Phố Chữ đầy đủ chỉ còn dư 0,6%. Nếu sau này thêm chi tiết mà vượt
ngưỡng, ưu tiên cắt theo thứ tự: mật độ rừng viền, `CAMERA.maxDist`, số tầng mái của toà chọc trời Phố Chữ.

### Fps: đo thay thế trên máy dev, chưa phải iPad

Chrome headless trên GPU GTX 1060, khung 1180×820 với DPR 2 (bằng độ phân giải iPad Air/Pro 11"),
thành phố Phố Chữ đầy đủ, camera lượn vòng 20 giây:

| Điều kiện | Trung bình | 5% chậm nhất | Draw call | Tam giác |
|---|---|---|---|---|
| Bình thường | 60 fps | 60 fps | 51–55 | 71,7k–75,0k |
| CPU hãm 4× | 60 fps | 60 fps | 55 | 75,0k |

Kết quả cho thấy phần việc CPU mỗi khung hình rất nhẹ. Nhưng GPU của máy này mạnh hơn và khác loại với
chip iPad, nên **đây chưa phải số đo nghiệm thu**.

## Điều kiện lật quyết định

Chủ dự án mở bench (https://claude.ai/artifact/RMeiUU6jNn2rPNWzdaVKSy) trên iPad của hai bé và bấm
"Đo 20 giây". Sẽ **làm đường WebP** (việc 2b, trước việc 4) nếu có một trong hai điều sau:

- trung bình < 50 fps, hoặc 5% khung chậm nhất < 40 fps, **sau khi** độ phân giải đã tự hạ về 1×;
- thời gian dựng thành phố (dòng "dựng … ms") > 1.200 ms. Với thời gian tải trang, con số này sẽ phá
  tiêu chí "không màn hình nào chờ quá 1,5 s".

Nếu đạt cả hai thì ghi số đo iPad vào bảng trên và đổi trạng thái ADR thành **chốt**.

## Hệ quả

- **Camera không xoay** là một ràng buộc thiết kế. Các kịch bản ăn mừng của việc 4 chỉ được bay (tịnh
  tiến và zoom), không được quay quanh công trình. Muốn xoay thì phải bỏ bước bỏ mặt lưng và đo lại ngân
  sách.
- Bộ dựng nhà không cần tạo cửa sổ ở mặt −x/−z (bước gộp đằng nào cũng bỏ). `building()` đã chỉ dựng mặt
  +x/+z.
- Đổi danh sách mô hình Kenney (`src/kenney/set.ts`) thì phải chạy lại `bake:kenney`, cần bộ kit gốc ở
  `content/art/kenney/` (tải theo README).
- Thành phố được dựng lại toàn bộ khi `CityView` đổi (~0,1–0,3 s trên máy dev). Hoạt hình "công trình mọc
  lên" của việc 4 sẽ tách riêng lô đó thành mesh động trong lúc chạy hoạt hình.
