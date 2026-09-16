# Ảnh tham khảo hình dáng bản đồ — pha 12

Chủ dự án gửi 15/09/2026. Hai bé đang sống ở Ecopark Văn Giang, Hưng Yên; đây là nơi con nhìn
thấy mỗi ngày, nên thành phố trong game nên có dáng tương tự.

| Ảnh | Nội dung | Rút ra cho engine |
|---|---|---|
| `01-ban-do-google-ecopark.png` | Ảnh chụp màn hình Google Maps khu Ecopark – Văn Giang | Dáng đường: vành đai cong ôm hồ, một trục chéo lớn (DT379), sông Bắc Hưng Hải chéo ở rìa trên, nhiều mặt nước xanh rải rác. **Đây cũng là mẫu cho "bản đồ giấy" khi zoom hết cỡ** (việc 5) |
| `02-anh-ve-tinh-cum-cao-tang.png` | Ảnh vệ tinh: cụm 4–6 toà cao tầng sát hồ | Cao tầng phải **túm cụm bên hồ trung tâm**, không rải đều khắp phố |
| `03-anh-ve-tinh-dai-nha-cong.png` | Ảnh vệ tinh: các dải nhà thấp tầng xếp theo cung tròn | Ô đất hình thang theo nan quạt, nhà cùng hướng cùng mái → nhìn từ trên xuống thành dải nhịp nhàng |
| `04-anh-ve-tinh-toan-canh.png` | Toàn cảnh: tỉ lệ xanh/nước/nhà | Nước + cây chiếm gần 1/3 diện tích; ranh giới giữa các khu là **dải cây**, không phải hàng rào |

## Ràng buộc

- Ảnh chỉ để **tham khảo hình học** trong lúc dựng. KHÔNG chép bản đồ thật theo tỉ lệ và KHÔNG
  đưa ảnh này (hay phần nào của ảnh) vào sản phẩm.
- **Đổi 16/09/2026 (ADR-23 mục 6):** chủ dự án yêu cầu **một** thành phố — Phố Chữ (`viet`) — vẽ
  giống thị trấn thật của hai bé, **dùng đúng tên trên bản đồ** (Park River, The Island, Ecopark
  CBD, Education HUB, Aqua Bay, Palm Springs, Dragon Islands, Khu Đồi Hoa, Sân Golf 18 lỗ, Học viện
  Golf EPGA). Bản quy hoạch gõ tay bằng mắt từ các ảnh này, nằm ở
  `packages/city/src/home-plan.ts` — đúng hình dáng và thứ tự các khu, không đúng tỉ lệ mét. Năm
  thành phố còn lại vẫn **tự đặt tên** và chỉ mượn đặc trưng hình học như trên.
- Ảnh có nguồn từ bên thứ ba (ảnh vệ tinh/ảnh quảng cáo bất động sản có watermark, ảnh chụp màn
  hình Google Maps). Repo này là riêng tư của gia đình; nếu có lúc nào định mở công khai thì xoá
  thư mục này **và `packages/city/src/home-plan.ts`** trước.
