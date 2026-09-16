# ADR-20 — Thành phố 3D: render thật trên máy, không dựng sẵn WebP

Ngày: 15/09/2026 · Pha 10 việc 2 · Trạng thái: **chốt** (15/09/2026 — chủ dự án xác nhận hai bé dùng
trên web, không dùng iPad; xem "Thiết bị đích")

## Bối cảnh

Đề bài pha 10 việc 2 đặt ngân sách cho iPad: **≤ 150 draw call, ≤ 80k tam giác, 60 fps**. Nếu không đạt
thì render sẵn từng ô thành WebP bằng Playwright rồi ghép 2D. Quyết định phải dựa trên số đo.

Cảnh mẫu của việc 1 (bảng phong cách) vượt rất xa ngưỡng: khoảng 4.300 draw call và 730k tam giác, vì
mỗi cửa sổ, cây, đèn là một mesh. Thêm nữa, thành phố của môn lớn nhất (Tiếng Việt, 102 kỹ năng) cần tới
41 khối nhà.

## Thiết bị đích

Đề bài viết theo iPad. Sau việc 2, chủ dự án cho biết **hai bé chạy trên web** (trình duyệt máy
tính), không chạy trên iPad. Vì vậy:

- số đo quyết định là số đo trên trình duyệt web — bảng "Fps" dưới đây, 60 fps ở độ phân giải cao;
- ngân sách ≤ 150 draw call, ≤ 80k tam giác **vẫn giữ** làm lưới an toàn, để một máy tính yếu hoặc
  laptop cũ (GPU tích hợp) vẫn mượt, và test `budget.test.ts` vẫn chặn khi vượt;
- bench trên iPad không còn là điều kiện nghiệm thu; đường WebP không cần làm.

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

### Fps trên trình duyệt web (máy dev)

Chrome headless trên GPU GTX 1060, khung 1180×820 với DPR 2 (bằng độ phân giải iPad Air/Pro 11"),
thành phố Phố Chữ đầy đủ, camera lượn vòng 20 giây:

| Điều kiện | Trung bình | 5% chậm nhất | Draw call | Tam giác |
|---|---|---|---|---|
| Bình thường | 60 fps | 60 fps | 51–55 | 71,7k–75,0k |
| CPU hãm 4× | 60 fps | 60 fps | 55 | 75,0k |

Phần việc CPU mỗi khung hình rất nhẹ (vẫn 60 fps khi hãm CPU 4×), nên máy tính bàn/laptop thường của
gia đình đủ sức. Nghiệm thu việc 5 sẽ đo lại trên đúng máy hai bé dùng bằng nút "Đo 20 giây".

## Khi nào xem lại

Chỉ xem lại quyết định này nếu trên máy hai bé thật (việc 5, bench "Đo 20 giây") trung bình < 50 fps
hoặc 5% khung chậm nhất < 40 fps sau khi độ phân giải đã tự hạ về 1×, hoặc dựng thành phố > 1.200 ms.
Khi đó thứ tự xử lý: giảm `maxPixelRatio`, tắt bóng đổ mềm, rồi mới tính tới ảnh dựng sẵn.

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

## Bổ sung 16/09/2026 — số đo mới sau pha 12 (ADR-23)

Bản đồ đổi sang vành đai/nan quạt, đường thành đồ thị cong, thêm sông và bến cảng, thêm LOD ba mức.
Ngân sách **giữ nguyên** (≤ 150 draw call, ≤ 80k tam giác) và có thêm một kịch bản khó hơn hẳn:

| Kịch bản | Draw call xấu nhất | Tam giác xấu nhất |
|---|---|---|
| Cỡ `full` (như ADR-20 cũ) | 58–66 | 21,1–39,7k |
| **Cuối năm** (102 kỹ năng, 40 ô đất, 15 công trình, kỳ quan xong, nhộn nhịp 4, quét khắp thành phố, iPad ngang + dọc) | **57–64** | **23,0–35,1k** |

Phố Chữ — thị trấn thật của hai bé (ADR-23 mục 6) — là thành phố **nhẹ nhất** trong sáu (57 draw
call, 23k tam giác cuối năm): nó trải trên một bản đồ rộng gấp rưỡi nên phần lớn nằm ngoài ngưỡng
LOD ở mọi khung hình.

Một lưu ý khi đọc bench: cửa sổ bench trên máy dev rộng hơn iPad (tỉ lệ 1,6 thay vì 1,44) nên khung
hình xấu nhất ở đó đo được ~80k tam giác — sát trần. Ngân sách ADR-20 tính theo tỉ lệ iPad thật, và
test `budget.test.ts` canh đúng hai tỉ lệ đó.

Ba thay đổi làm nên con số đó: ô lưới bake **60 × 60** (trước là 51,2), **LOD ba mức** bake sẵn
(`near` / `mid` bỏ chi tiết < 2,2 đơn vị / `far` bóng khối), và **bóng đổ chỉ trong hộp 90 đơn vị bám
theo camera** thay vì phủ cả thành phố. `maxDist` hạ 124 → **108**.

Vì sao số tam giác *giảm* dù thành phố to hơn: ở khung hình xấu nhất phần lớn thành phố nằm ngoài
ngưỡng LOD, nên được vẽ ở mức `mid`/`far`. Chi tiết và lý do không đạt "9 ô mỗi khung hình": ADR-23.
