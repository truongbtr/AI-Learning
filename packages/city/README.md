# @mtct/city — thành phố 3D của góc con (Pha 10)

Mỗi môn là một thành phố. Kỹ năng thành công trình cao dần theo mastery, sao mở ô đất, huy hiệu mở
công trình công cộng, tuần học đủ thêm mảnh kỳ quan. Package này **chỉ lo phần trình bày**; hàm biến
dữ liệu học thành `CityView` nằm ở `packages/core` (việc 3). Quyết định hiệu năng: `docs/adr/ADR-20`.

```
src/
  layout.ts          bố cục khối/lô — thuần, lô không bao giờ đổi chỗ khi thành phố lớn lên
  color.ts           quy tắc tô lại màu Kenney theo thành phố (không đỏ báo lỗi)
  palette.ts         6 thành phố: tên, hai màu riêng, biến thể tô Kenney
  kenney/set.ts      danh sách mô hình Kenney được dùng
  build/             bộ dựng: kit hình học, nhà 5 mức × 6 thành phố, kỳ quan ghép mảnh,
                     công trình công cộng, danh mục ô đất và vật trang trí, gộp khối (bake)
  scene/             CityView → cảnh tĩnh + kế hoạch xe/người → khối đã gộp
  engine/            chạy trên trình duyệt: camera, ngày/đêm, đất cong, xe/người, chạm, điểm neo
  sample.ts          CityView mẫu cho bench và test (không phải dữ liệu của con)
bench/               trang đo: fps, draw call, tam giác, nút "Đo 20 giây"
scripts/             bake-kenney, build-bench, shoot-bench, analyze, budget-table
```

## Lệnh (PowerShell, từ gốc repo)

```powershell
pnpm --filter @mtct/city test                           # layout, màu, ngân sách iPad, engine thuần
pnpm --filter @mtct/city bake:kenney                    # sau khi đổi src/kenney/set.ts (cần content/art/kenney/)
pnpm --filter @mtct/city bench:build                    # bench/dist/bench.js
pnpm --filter @mtct/city bench:shoot -- "city=viet&size=full&hour=10" engine-viet.jpg
pnpm --filter @mtct/city bench:shoot -- --fps --throttle "city=viet&size=full"
pnpm --filter @mtct/city exec tsx scripts/analyze.ts viet full    # tam giác theo hạng mục
pnpm --filter @mtct/city exec tsx scripts/budget-table.ts         # bảng của ADR-20
```

## Luật khi thêm hình

- Camera **không xoay**. Bước gộp bỏ mặt quay lưng khỏi camera, nên đừng dựng chi tiết ở mặt −x/−z.
- Dùng `cbox` (hộp vát, 28 tam giác) thay cho hộp bo tròn; cửa sổ là `quad`; cầu/trụ ít cạnh.
- Màu truyền qua `tok(màu, loại)`: `glass` sáng ấm về đêm, `light` là đèn, `water`, `sign` (chữ trong
  atlas), `ghost` (mảnh kỳ quan chưa có).
- Chạy `pnpm --filter @mtct/city test` sau mỗi thay đổi. `budget.test.ts` đỏ nghĩa là vượt ngân sách iPad.
