# 3d-proto — mẫu render thành phố (QC dựng 15/09/2026)

Mẫu chất lượng đồ hoạ cho hướng "Thế giới Học Đường" (mỗi môn một thành phố). Toàn bộ là code, chưa có gì vẽ tay.

- `scene.html` — cảnh three.js: hàm `building({w,d,floors,roofType,wall,roof,dome,tower,clock,columns,storefront,garden,tank,chimney,awning,sign})`,
  cây/bụi/đèn/ghế/xe buýt, rừng viền, công viên, ô đất đang xây (giàn giáo + cần cẩu), sao nhiệm vụ.
  `?mode=city` = một thành phố; `?mode=sheet` = bộ nhà mẫu trên nền tối.
- `shoot.mjs` — render bằng Chromium headless (Playwright) → PNG. Cần `npm i three@0.169 playwright`.
- Ánh sáng: 1 mặt trời chếch trái + hemisphere + fill; PCFSoft shadow 4096; KHÔNG dùng ACES (làm bạc màu) — `NoToneMapping`.
- Camera trực giao, yaw 45°, pitch 33°.

Ảnh kết quả: `docs/screens/3d-proto/` (thanh-so-render-3d.png, bo-nha-6-mon-render-3d.png).
