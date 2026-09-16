# ADR-23 — Bản đồ thành phố kiểu vành đai, đồ thị đường, và ngân sách cuối năm

**Ngày:** 16/09/2026 · **Pha:** 12 · **Trạng thái:** đã chốt

## Bối cảnh

Pha 10 xếp thành phố trên **lưới vuông**: khối 5×5 ô cách nhau một ô đường, phát theo xoắn ốc từ
tâm. Nó chạy tốt và giữ được quy tắc ổn định, nhưng mọi con đường đều gặp nhau ở góc vuông, sáu
thành phố chỉ khác nhau ở màu và mái nhà — chủ dự án nhìn vào thấy **đơn điệu**, và đúng.

Hai bé sống ở Ecopark (Văn Giang, Hưng Yên). Đó là hình dáng đô thị con nhìn thấy mỗi ngày: hồ ở
giữa, đường **cong theo vành đai** ôm hồ, các dải nhà thấp tầng xếp **theo nan quạt** cùng hướng
cùng mái, **một trục chéo lớn** cắt ngang, **sông ở rìa**, và rất nhiều mặt nước với mảng xanh.
Chủ dự án gửi 4 ảnh tham khảo (`docs/screens/pha-12/tham-khao/`).

**Chỉ mượn đặc trưng hình học.** Không chép bản đồ thật theo tỉ lệ, không đưa ảnh vào sản phẩm,
không dùng tên thương mại "Ecopark" hay tên phân khu có thật; tên khu trong game do ta đặt
(`DISTRICT_NAMES`, khác nhau theo từng thành phố).

> **Đã đổi cuối ngày 16/09/2026 — xem mục 6.** Chủ dự án yêu cầu **một** thành phố vẽ *giống* thị
> trấn thật của hai bé, kể cả tên thật. Năm thành phố còn lại vẫn theo đoạn trên.

Làm ngay ở pha 12 vì hai bé mới học vài buổi: đổi bố cục lúc này không xoá công sức của ai.

## Quyết định

### 1. Toạ độ cực thay cho lưới vuông

- Hồ ở giữa (`LAKE_RADIUS = 14`), có từ ngày đầu; toà thị chính đứng trên **bán đảo** ở bờ hồ.
- **Vành đai** r ở bán kính `FIRST_RING + (r−1) × RING_PITCH` (34 và 26), **méo nhẹ** bằng hai hàm
  sin có pha gieo theo `cityId` — tất định, không random lúc chạy, nên mọi máy vẽ giống nhau.
- Vành đai r cắt thành ô hình thang giữa hai vành đai và hai tia, theo **bề rộng ô cố định 13,5**
  (không theo `8 + 6r` như đề bài: xem "Chỗ làm khác đề bài").
- **Quy tắc ổn định giữ nguyên** (ADR-21): vai trò của một ô chỉ phụ thuộc **chỉ số ô** và `cityId`.
  Chỉ ánh xạ chỉ số → (vành đai, cung) là mới. Test: thêm 1 kỹ năng + 1 huy hiệu + 1 ô đất → không
  công trình nào đang có đổi chỗ, ở cả sáu thành phố.
- Không đều đặn hoá: **đại lộ chéo** (một dây cung né hồ) biến ô nó cắt qua thành công viên; hồ nhỏ
  ở vành đai chẵn, **dải rừng** ở vành đai lẻ ngăn giữa các khu; **cụm 4–6 toà cao tầng** chỉ ở hai
  cung sát hồ.
- Mỗi vành đai là một **khu có tên**, có biển ở lối vào và tên trên bản đồ giấy.

### 2. Đường là đồ thị, không phải ô lưới

`roads: Set<string>` (ô đường) đổi thành `RoadGraph { nodes, edges }`: nút là ngã tư, cạnh là một
đoạn đường **cong** có danh sách điểm. Mặt đường dựng bằng cách **trải hình theo đường cong**
(ribbon: hai tam giác mỗi đoạn, một mesh cho cả tuyến) — nên một vành đai cong tốn đúng bằng một
đường thẳng.

Ba loại cạnh: **belt** (cung vành đai), **spoke** (tia, đi men theo **ranh giới ô** rồi mới đổi
hướng trong khoảng trống giữa hai vành đai), **avenue** (đại lộ). Đại lộ cắt vành đai **tại nút**
của vành đai đó, nên không có cạnh nào cắt ngang ô đất — có test.

### 3. Giao thông ngẫu nhiên có hạt giống

Xe/người đi trên chính đồ thị này: tới nút thì **chọn cạnh tiếp theo theo trọng số** (đi thẳng 6,
rẽ nhẹ 3, rẽ gắt 1,2, quay đầu 0,05 — chỉ khi cụt). Mỗi tác nhân có tốc độ riêng ±20%, chậm lại
trong cua, dừng ở đèn; xe buýt dừng bến; người đi bộ dừng ngắm. Ngẫu nhiên lấy từ hạt giống
`(studentId, cityId, ngày)` nên **tải lại trang thành phố không nhảy loạn** và test kiểm được:
200 bước không ai rời đường, cùng hạt giống cho cùng kết quả, phân bố rẽ đúng trọng số.

### 4. Sông, bến cảng, thuyền

Sông chạy chéo ở rìa (cách tâm ~5 vành đai, có một khúc uốn), hiện **từ ngày đầu** để con thấy đất
còn rộng. Bến cảng ở khúc gần thành phố nhất. **Cầu** dựng khi thành phố lớn tới bờ. Mỗi thành phố
một **tính sông** (`RiverStyle` — tham số, không phải mã riêng): âu tàu, thuyền giấy, xà lan, cảng
lớn, sông hiền, ghềnh. Bến Cảng Từ là cảng lớn nhất và mỗi từ tiếng Anh con thuộc kéo một chiếc
thuyền vào (nối từ pha 11 qua `CityView.harbourBoats`).

### 5. Chi phí vẽ theo khung hình, không theo cỡ thành phố

- Ô lưới bake **60 × 60**, mỗi ô một draw call cho mỗi nhóm vật liệu.
- **LOD ba mức** bake sẵn: `near` (đủ) · `mid` (bỏ chi tiết nhỏ hơn 2,2 đơn vị, > 120 đơn vị) ·
  `far` (bóng khối: mỗi phần lớn thành một hộp ba mặt, > 220 đơn vị).
- **Bóng đổ** chỉ trong hộp 90 đơn vị **bám theo camera**.
- **Tác nhân** chỉ vẽ trong bán kính camera + đệm.
- **Bản đồ giấy** khi con kéo xa hết cỡ: canvas 2D, không phải 3D.

**Đo thật (kịch bản cuối năm: 102 kỹ năng, 40 ô đất, 15 công trình, kỳ quan xong, nhộn nhịp tối đa,
quét camera khắp thành phố, iPad ngang và dọc):** xấu nhất **64 draw call / 35.100 tam giác** —
dưới **một nửa** ngân sách ADR-20 (150 / 80.000). Test `budget.test.ts` chạy cả sáu thành phố ở
kịch bản này.

### Chỗ làm khác đề bài — và vì sao

Đề pha 12 yêu cầu "giới hạn camera sao cho khung hình rộng nhất chạm **tối đa 9 ô**". Với ô 60×60
và camera nghiêng 27°, **không đạt được**: hình chiếu của khung nhìn xuống đất là một hình thang
dài, chạm khoảng **18 ô** dù canh lưới thế nào. Muốn đúng 9 ô thì phải:

- đổi sang ô **100×100** — cắt LOD thô hơn và lọc khung nhìn lỏng hơn, hoặc
- kéo camera gần còn **dist 80** — con mất cảm giác đang nhìn một thành phố.

Điều mà luật "9 ô" bảo vệ là **số draw call**, và số đó đo được là 64/150. Nên giữ ô 60×60, hạ
`maxDist` từ 124 xuống **108** (vẫn thoáng), và test canh giữ ở mức 20 ô kèm ghi chú này.

### 6. Một thành phố là thị trấn thật của hai bé (đổi quyết định, 16/09/2026 tối)

Chủ dự án, kèm ảnh bản đồ quy hoạch: *"Có 1 thành phố giống y hệt thế này, các con đang ở đây, vẽ
giống từng con đường, dòng sông, ngôi nhà, tên lấy theo đúng tên trên bản đồ. Giống được 99% thì
tốt."* và *"Các thành phố khác sáng tạo ra giống như thế, có thể có con sông chảy qua giữa thành
phố."*

Đây là **đảo ngược** ràng buộc "không chép bản đồ thật, không dùng tên thật" ở đầu pha. Ghi lại
nguyên văn vì nó là quyết định của chủ dự án, không phải suy diễn của người viết mã.

- **Phố Chữ (`viet`) thành thị trấn nhà**: `HOME_CITY = "viet"` — môn Tiếng Việt cũng là môn có
  nhiều kỹ năng nhất (102), tức là thị trấn cần nhiều đất nhất, và nó là thành phố hai bé vào nhiều
  nhất. `layoutCity` gặp `HOME_CITY` thì gọi `layoutFromPlan(ECOPARK, …)` thay cho `layoutBelts`.
- **Bản quy hoạch là dữ liệu** (`packages/city/src/home-plan.ts`): sông Bắc Hưng Hải vắt ngang phía
  bắc, Đường 379 chạy suốt từ tây bắc xuống đông nam, các ngón kênh của The Island ở phía tây (mỗi
  dải đất giữa hai kênh một con phố), Hồ Thiên Nga dài nằm giữa, sân golf 18 lỗ ở phía đông, Aqua
  Bay ở phía nam. Tên khu lấy đúng tên thật: Park River, The Island, Ecopark CBD, Education HUB,
  Khu Đồi Hoa, Dragon Islands, Aqua Bay, Palm Springs, Sân Golf 18 lỗ, Học viện Golf EPGA.
- **Tỉ lệ thì không thật.** Đây là phác thảo bằng mắt từ bản đồ và ảnh vệ tinh: đúng *hình dáng* và
  *thứ tự* các khu, không đúng mét. Ảnh tham khảo vẫn **không** vào sản phẩm.
- **Luật ổn định giữ nguyên.** Vai trò một ô vẫn chỉ phụ thuộc chỉ số ô (`planCellRole`). Các ô rơi
  xuống nước, xuống đường, vào sân golf hay chồng lên hàng xóm bị **loại một lần, từ bản quy hoạch**
  — không bao giờ từ việc con học được gì — nên thứ tự phần còn lại không đổi và nhà đã xây không
  bao giờ dịch chỗ. Có test. `planReport()` in ra khu nào mất bao nhiêu ô và vì sao, để lần sau sửa
  bản quy hoạch còn biết đường.
- **Sức chứa**: bản quy hoạch hiện cho ~185 ô, trong đó ~124 ô nhà — đủ 102 kỹ năng của Tiếng Việt
  và còn dư. Test canh mốc này; hết đất thì phải thêm phố, không phải thêm vành đai.
- **Thị trấn nhà lớn lên khác các thành phố kia**: đường phố có **đủ từ ngày đầu** (thị trấn thật thì
  đã ở đó rồi), con xây **nhà** vào các lô trống dọc theo phố. Năm thành phố kia vẫn mở thêm vành đai
  mới như cũ.
- **Sông chảy qua thành phố**: năm thành phố còn lại giữ sông của mình, nhưng giờ **được phép cắt
  qua phần ngoài của thị trấn** khi thị trấn lớn lên. Kèm theo đó là bốn chỗ sửa thật sự:
  1. Ô nào nằm trong lòng sông thì thành **mặt nước**, không phải đất xây (`cellRole` hỏi
     `cityRiver(seed)`). Trước đó thành phố cuối năm đặt 5–25 ngôi nhà **giữa dòng sông** ở cả năm
     thành phố — lỗi này chỉ lộ ra khi đo.
  2. Đoạn đường nào vắt qua nước thì thành **cầu** (`RoadEdge.overWater`): mặt cầu nâng lên, có lan
     can hai bên, thay vì nhựa đường sơn trên mặt nước.
  3. Dòng sông **không đổi theo độ lớn thành phố** nữa (trước đây chiều dài đường sông tính theo số
     vành đai), nếu không một ô khô tháng Mười có thể ngập vào tháng Năm.
  4. Một cửa duy nhất để lấy nước của thành phố: `cityWaterways(seed, rings)`. Trước đó cảnh 3D và
     bản đồ giấy tự suy góc đại lộ **từ đường vẽ ra** — đường này chạy ngược chiều, nên sông trong
     cảnh nằm ở phía **đối diện** so với sông mà bố cục đã chừa chỗ.
- **Bản đồ giấy**: chạm vào một khu giờ chọn **biển gần nhất** chứ không phải vành đai gần nhất —
  thị trấn nhà không xếp theo vành đai.
- **Máy ảnh về nhà** đặt ở **toà thị chính** thay vì tâm hình vuông của bản đồ (tâm ấy, ở thị trấn
  nhà, là một cánh đồng bên kia hồ).

Nếu kho mã này có ngày mở ra ngoài: `home-plan.ts` và `docs/screens/pha-12/tham-khao/` là hai thứ
phải bỏ trước tiên.

## Hệ quả

- `layout.ts` viết lại; `compose.ts` viết lại phần nền/nước/đường; `CITY_WATER` và `roadTile` bỏ.
- Hợp đồng dữ liệu của ADR-21 **không đổi**: `CityView`, `StudentCity`, `skillOrder`, luật mastery →
  bậc nhà, sao → ô đất, huy hiệu → công trình công cộng đều giữ nguyên. Chỉ hình học đổi.
- `LayoutLot.id` đổi dạng (`r<vành đai>s<cung>` thay cho `bx,bz:slot`). Id này chỉ dùng trong bộ nhớ
  một phiên vẽ, không lưu DB, nên không cần migration.
- Ảnh đảo trên bản đồ 6 môn vẽ lại theo bố cục mới.
