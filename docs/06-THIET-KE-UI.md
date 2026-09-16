# 06 — THIẾT KẾ GIAO DIỆN

> Hai "thế giới" tách biệt: **Góc của con** (trẻ 6 tuổi, tablet) và **Bảng điều khiển ba mẹ** (người lớn, điện thoại/laptop). Không dùng chung component trực quan; dùng chung token màu/font ở mức nền.
>
> **Yêu cầu bắt buộc của chủ dự án:** Góc của con phải **hấp dẫn như một trò chơi** — có đồ hoạ minh hoạ, nhân vật, thế giới riêng và **hoạt hình chuyển động** ở mọi màn hình. Một giao diện "form + nút" sạch sẽ nhưng tĩnh là **không đạt**. Chi tiết ở §1.5–1.8; QC nghiệm thu bằng checklist §4.

---

## 1. Góc của con — nguyên tắc

1. **Một việc một màn hình.** Mỗi màn hình có đúng 1 hành động chính (nút to giữa/dưới). Không menu, không sidebar, không tab chữ.
2. **Nhìn – nghe – chạm.** Mọi đề bài có nút loa và **tự đọc khi mở**; icon lớn kèm nhãn ngắn; vùng chạm ≥ 64 px; khoảng cách nút ≥ 16 px (tránh chạm nhầm).
3. **Chữ ít, to, dễ đọc.** Font tròn, thân thiện, rõ nét chữ a/g một tầng: **Nunito** (Latin) + **Be Vietnam Pro / Baloo 2** cho tiếng Việt; cỡ ≥ 22 px; đề bài ≤ 15 từ.
4. **Không có thất bại đỏ.** Sai → rung nhẹ + mascot "Gần đúng rồi, thử lại nhé" + gợi ý; không có chữ "SAI", không đếm ngược gây áp lực; không điểm số.
5. **Phần thưởng tức thì & rõ ràng.** Sao bay lên góc túi sao, âm thanh vui ngắn (≤ 1 s), confetti khi xong phiên; huy hiệu có "lễ trao" riêng. **Sao đo công sức, không đo đúng sai** (§1.5b).
6. **Mascot đồng hành.** Mỗi bé chọn mascot (cú, mèo, robot, khủng long, kỳ lân…); mascot nói bằng bong bóng + giọng; là cửa vào gia sư giọng nói.
7. **Cá nhân hoá nhìn thấy được.** Chủ đề màu/hình theo sở thích (Chí Thanh: robot – xanh dương/cam; Mai Thy: vườn – hồng/tím); tên gọi ở nhà trong lời chào.
8. **Không lối thoát ra ngoài.** Không link ngoài, không nút mở tab, không nội dung không do hệ thống sinh. Nút "ba mẹ" ở góc (giữ 2 giây) để mở khoá về trang phụ huynh.
9. **Sống động nhưng không làm phân tâm.** Màn hình luôn có chuyển động nền nhẹ (mây trôi, mascot chớp mắt, sao lấp lánh) và mọi thao tác đều có phản hồi hoạt hình; nhưng trong lúc con đang trả lời, vùng đề bài đứng yên, hoạt hình chỉ ở nền và mascot (chậm, mờ). Tôn trọng `prefers-reduced-motion`.
10. **Tablet ngang là mặc định**; dọc vẫn dùng được; laptop chuột hoạt động (kéo thả hỗ trợ cả pointer).

### 1.1 Design token (kid)

```
Màu nền chính:   #FFF8EC (kem ấm)  · nền tối (tuỳ chọn, không bắt buộc v1)
Chủ đề Chí Thanh:    primary #2F80ED · accent #FF8C42 · thưởng #FFD447
Chủ đề Mai Thy:      primary #E85D9C · accent #7C5CFF · thưởng #FFD447
Đúng:            #34C759 (kèm icon ✓ + âm) · Gần đúng: #FFB020 (kèm icon ↻)   — không dùng đỏ
Bo góc: 24 px · Bóng mềm · Nút: cao 72 px, chữ 24 px, icon 32 px
Font: Nunito 700/800; tiếng Việt: Baloo 2 / Be Vietnam Pro
Âm thanh: bộ 6 hiệu ứng (đúng, gần đúng, sao, huy hiệu, xong phiên, chạm)
```

### 1.2 Màn hình của con

| # | Màn hình | Route | Nội dung & hành vi |
|---|---|---|---|
| K1 | Chọn bé | `/login` (phần trên của trang đăng nhập chung, `12` §4) | 2 thẻ ảnh đại diện to (Mai Thy / Chí Thanh). Chạm → chọn **4 hình theo thứ tự** trên lưới 9–12 hình; có nút loa hướng dẫn. |
| K2 | Trang chủ | `/kid/home` | Mascot chào bằng giọng; nút to **"Nhiệm vụ hôm nay"** (hiện ✓ nếu xong); túi sao, ngọn lửa streak; 3 icon môn "chơi thêm"; icon "Bộ sưu tập"; icon mascot "Hỏi bạn Cú" (nếu bật). |
| K3 | Nhiệm vụ hôm nay — bản đồ | `/kid/quest` | Con đường 8–15 ô (mỗi ô 1 bài, icon môn), vị trí nhân vật; nút "Đi thôi!". |
| K4 | Làm bài | `/kid/quest/[n]` | Khung đề (đọc tự động, nút loa), vùng tương tác theo dạng bài, nút gợi ý (bóng đèn), nút "Xong" (chỉ hiện khi có đáp án). Phản hồi overlay ngắn rồi tự sang bài kế sau 1,5 s (đúng) hoặc chờ (gợi ý). |
| K5 | Xong phiên | `/kid/quest/done` | Confetti, tổng sao, huy hiệu mới (nếu có) với "lễ trao", 2 dòng mascot ("Hôm nay bạn đọc rất giỏi từ có *sh*!"), nút "Về nhà". |
| K6 | Chơi thêm theo môn | `/kid/play/[subject]` | Chọn môn → 5 bài nhanh; giới hạn lượt hiển thị bằng "vé". |
| K7 | Bộ sưu tập / vườn | `/kid/collection` | Lưới vật phẩm, mua bằng sao; trang trí góc mascot; thanh mục tiêu phần thưởng đời thực (nếu ba mẹ đặt). |
| K8 | Hỏi bạn Cú | `/kid/ask` | Nút mic to giữ-để-nói; transcript hiện chữ + mascot trả lời bằng giọng; nút thoát. |
| K9 | Bài viết/vẽ chụp lại | trong K4 | Hiện đề, con làm ra giấy; nút "Gọi ba mẹ chụp" → camera; ảnh gửi → "Bạn Cú sẽ chấm sau nhé!" và sang bài kế. |

### 1.2b Chế độ thành phố — Thế giới Học Đường *(Pha 10, cờ `KID_UI=city`, ADR-20/21)*

Bật bằng `KID_UI=city` trong `.env` (mặc định `world` = thế giới cũ ở §1.2, vẫn chạy nguyên). Thử riêng một máy mà các máy khác không đổi: ADMIN mở `/admin/health` trên máy đó → **"Bật thành phố trên máy này"** (cookie `mtct_ui`, sống 30 ngày, còn sau khi đăng xuất, thắng `KID_UI`; nút **"Tắt"** gỡ cookie) *(Pha 10b)*. Mỗi môn là
một thành phố; **cả buổi tối diễn ra trong thành phố**, không có trang bài tập riêng.

| # | Màn hình | Route | Nội dung & hành vi |
|---|---|---|---|
| C1 | Bản đồ thế giới | `/kid/city` (`/kid/home` chuyển về đây) | Một mặt biển, **6 đảo** = 6 thành phố, mỗi đảo một biểu tượng môn và ảnh chính thành phố của con lúc rời đi (chưa ghé thì ảnh ngày đầu). Đảo **có việc tối nay** (môn trong Daily Quest, bài cô giao, hoặc thành phố đang làm dở) lấp lánh + **"⭐ số trạm còn lại"**; đảo khác yên; xong hôm nay thì ✓. Chạm đảo → bản đồ phóng vào đảo, màn thành phố tiếp bằng camera bay từ trời xuống. |
| C2 | Thành phố | `/kid/city/[city]` | 3D (`@mtct/city`). Góc trái nút 🌍 về bản đồ + thanh mở đất (`sao/ngưỡng`), giữa tên thành phố + hàng sao trạm (★ xong / ☆ chưa), phải túi sao của môn. **Chỉ 3–4 công trình có sao trên nóc** (các trạm tối nay); toà thị chính có 📜 khi có bài cô giao. Sao của trạm kế tiếp to hơn và nhấp nháy. Chạm công trình khác → thẻ tên kỹ năng + mức, đọc to; không mở gì. Ô đất trống của con: chạm → chọn xây. |
| C3 | Làm bài (trong C2) | cùng route | Chạm sao → camera phóng tới công trình (0,6 s) → **bảng trượt lên** che ~76% màn hình, thành phố phía sau mờ + tối nhẹ, vẫn thấy → 6 component bài hiện có (`ExercisePlay`) chạy nguyên trong bảng, lần lượt 3–4 bài của trạm → bảng hạ → công trình **mọc thêm tầng / dựng lên từ đất ngay trước mắt** (2 s, có tiếng, confetti) → camera lùi ra, sao kế tiếp ở giữa màn hình và nhấp nháy. |
| C4 | Xong phiên (trong C2) | cùng route | Camera bay một vòng quanh thành phố, sao đếm nhảy vào túi, (công trình công cộng/kỳ quan mới nếu có) → đủ sao mở ô đất mới (hoặc còn ô trống) → **con chọn 1 trong 3 công trình, hình to**, nhà mọc lên → mascot ăn mừng → hai nút **"Về bản đồ"** / **"Chơi thêm"** (một phiên mới cùng môn, cùng planner). |

**Luật chơi trong thành phố**

- **Phiên của thành phố**: 12 bài của môn đó, do *chính planner của Daily Quest* lập (lọc theo môn, ≥ 3
  dạng bài, bài cô giao của môn đứng đầu). **Gom theo kỹ năng thành 3–4 trạm** ≈ 3 bài/trạm
  (`planStations`, `packages/core/src/city/stations.ts`); mỗi trạm là một công trình. Trạm xong → sao tắt.
- **Công trình lớn lên theo tiến bộ thật**: mức theo mastery (0–39 giàn giáo · 40–59 · 60–84 · 85+ ·
  chọc trời khi MASTERED ≥ 30 ngày) **và bậc trong mức** (mỗi phần ba của dải mastery = cao thêm một tầng).
  Sau một trạm, công trình vừa làm không bao giờ hiện nhỏ đi.
- **Mầm nhà, không phải công trường** *(Pha 10b)*: kỹ năng chưa xây (mức 0) là **ô đất xanh gọn có
  hàng rào thấp, một cây con và biển tên nhỏ** — không khung gỗ, không thợ. Giàn giáo + thợ **chỉ** khi
  kỹ năng cần giúp (lỗi 7 ngày ≥ 2, thang khắc phục đang chạy, NEEDS_PRACTICE) và **tối đa 3 cái** trong
  một thành phố, ưu tiên kỹ năng lỗi nhiều nhất; kỹ năng yếu còn lại vẽ ở bậc thường. Lô trống dự phòng
  là nhà nhỏ chi tiết hoặc vườn, không dùng khối cao ốc sơ sài.
- **Đồng hồ game, không theo giờ thật** *(chủ dự án, 16/09/2026)*: trong thành phố **24 phút thật = 1 ngày
  game**, và ngày game **mở màn lúc 8 giờ sáng tính từ lúc con bắt đầu phiên học** — con ngồi xuống là
  thành phố sáng, không phụ thuộc đang là 18 giờ hay 21 giờ thật. Nhịp không đều theo giờ: 55% thời gian
  là ban ngày, rồi chiều vàng, hoàng hôn, và **đêm chỉ khoảng một phần mười** (một buổi 12–15 phút đi từ
  sáng tới chiều vàng, không rơi vào đêm giữa chừng). Mốc neo lấy từ `Session.startedAt` nên mọi màn và
  mọi lần tải lại đều cùng một giờ. Thế giới cũ (§1.8c mục 3) vẫn theo giờ thật.
- **Thành phố bắt đầu nhỏ**: ngày đầu chỉ toà thị chính bên hồ + một phần vành đai 1, còn lại đồi cỏ,
  rừng, hồ, sông chờ mở đất; một ô đất khoá hiện biển "N★". Cỡ thành phố = tiến bộ của con.
- **Dáng bản đồ kiểu vành đai** *(pha 12, ADR-23)*: hồ ở giữa có từ ngày đầu, toà thị chính trên bán đảo
  bờ hồ; đường **cong theo vành đai** ôm hồ, các ô đất hình thang xếp **theo nan quạt**, nhà thấp tầng
  thành **dải liền kề cùng hướng cùng mái**; **một đại lộ chéo** cắt ngang, ô nào bị cắt thành công viên;
  hồ nhỏ và dải rừng ngăn giữa các khu; **cụm 4–6 toà cao tầng chỉ ở hai cung sát hồ**. Mỗi vành đai là
  một **khu có tên** (biển ở lối vào), mở vành đai mới là một cột mốc có ăn mừng. Mượn hình học nơi hai
  bé đang sống; **không** chép bản đồ thật, **không** dùng tên thương mại nào.
- **Riêng Phố Chữ là thị trấn thật của hai bé** *(pha 12 việc 7, ADR-23 mục 6)*: vẽ theo bản quy hoạch
  thật — sông Bắc Hưng Hải phía bắc, Đường 379 chạy dọc thị trấn, các ngón kênh của The Island, Hồ
  Thiên Nga dài ở giữa, sân golf phía đông, Aqua Bay phía nam — và **giữ đúng tên khu trên bản đồ**
  (Park River, The Island, Ecopark CBD, Education HUB, Aqua Bay, Palm Springs…). Hình dáng và thứ tự
  các khu là thật, **tỉ lệ mét thì không**. Năm thành phố kia vẫn là thị trấn tưởng tượng, và sông của
  chúng **được phép chảy qua thị trấn** — chỗ nào sông cắt ngang thì đường bắc **cầu**, không xây nhà.
- **Sông và bến cảng** *(pha 12)*: sông chạy chéo ở rìa, hiện sẵn từ ngày đầu; bến cảng có cầu tàu, cần
  cẩu, thùng hàng, thuyền neo; **cầu** bắc qua khi thành phố lớn tới bờ. Thuyền đi lại **không đều
  nhau**: thuyền buồm, xà lan, thuyền câu dừng thả lưới rồi mới đi tiếp. Mỗi thành phố một tính sông.
- **Xe và người đi ngẫu nhiên** *(pha 12)*: tới ngã tư thì chọn đường tiếp theo (đi thẳng nhiều nhất),
  tốc độ mỗi xe khác nhau, chậm lại trong cua, dừng đèn; **có hạt giống theo ngày** nên tải lại trang
  thành phố vẫn y như cũ.
- **Đồng hồ mặt trời trên HUD** *(pha 12)*: một cung mảnh vắt ngang phía trên, mặt trời đi từ trái sang
  phải trong một ngày game rồi mặt trăng nối tiếp; nền cung đổi màu theo giờ. Chạm mặt trời thì mascot
  nói giờ (tiếng Việt, riêng Bến Cảng Từ nói tiếng Anh), dùng mp3 sinh sẵn. **Không đếm ngược, không hạn
  giờ** — đây là đồng hồ để ngắm, không phải để hối.
- **Bản đồ giấy** *(pha 12)*: kéo camera ra xa hết cỡ (hoặc chạm nút 🗺️) thì hiện bản đồ vẽ 2D — nước
  xanh, mảng xanh, đường trắng, tên từng khu, chấm sáng ở sao nhiệm vụ tối nay. Chạm một khu thì camera
  bay xuống đó. Đây là chỗ con nhìn thấy toàn bộ công sức cả năm trên một màn hình.
- **Màu**: mỗi công trình tô bằng bảng riêng = hai màu của thành phố + mái/tường của thành phố + **bảng
  chung**, xoay theo lô → một khu phố luôn có ≥ 3 màu mái và ≥ 4 màu tường (test `palette.test.ts`).
- Không có gì hỏng, không "sai", không đỏ, không đồng hồ, không tiền; cửa hàng đồ sưu tầm không có lối vào
  từ chế độ thành phố.

### 1.2b Bến Cảng Từ — trò chơi từ vựng *(pha 11, 16/09/2026)*

Với kỹ năng `ESL.VOC.*`, planner thay bài trắc nghiệm bằng **trạm trò chơi**, tối đa **2 trạm mỗi tối**.
Sáu trò, mỗi trò 30–60 giây, chạy ở **cả hai thế giới** (trong thành phố thì nằm trong bảng bài trượt lên):

1. **Nghe rồi chạm tranh** — nghe từ, chạm tranh đúng trong bốn tranh. Chữ tiếng Anh **không hiện** trước
   khi con trả lời (cùng lý do với LISTEN_CHOOSE, ADR-14).
2. **Lật thẻ tìm đôi** — bốn cặp tranh ↔ chữ; lật tranh thì nghe luôn từ đó.
3. **Cái gì biến mất?** — nhìn bốn tranh, một tranh bay đi, con gọi tên. Đây là trò duy nhất bắt con **nhớ
   ra** từ chứ không chọn giữa các tranh.
4. **Chợ nhỏ** — quầy hàng đọc cả **cụm câu** ("I like bananas."), con bỏ đúng món vào giỏ.
5. **Ghép chữ cái** — tranh + giọng đọc cho sẵn, con xếp chữ cái thành từ; từ dài quá 8 chữ cái không vào
   vòng này.
6. **Nói to lên** — mascot đọc, con nói lại; máy nào không nghe được thì con nói với ba mẹ rồi chạm
   "Con nói được rồi" (đường "cùng ba mẹ" của docs/04 §7).

Luật giữ nguyên như mọi màn của con: không đồng hồ đếm ngược, không hết lượt, không điểm, không chữ "sai",
không đỏ. Từ chưa nhận ra chỉ **quay lại vào ngày mai** (thang Leitner, ADR-22). Mỗi trạm được **một sao**
theo công sức (ADR-16). Từ nào lên bậc thì **một chiếc thuyền cập Bến Cảng Từ** trong thành phố ESL.

**Sổ từ** (`/kid/so-tu`, vào từ màn nhà): những từ con **đã gặp**, xếp theo chủ đề, chạm để nghe lại và xem
cụm câu. Không phần trăm, không mục tiêu, không ô trống cho từ chưa học, không so sánh hai bé.

### 1.3 Component kid (bắt buộc có trong `components/kid/`)

`BigButton` (squash & stretch), `IconTile`, `SpeakerButton` (đọc text, trạng thái đang đọc), `Mascot` (Lottie, 9 trạng thái §1.7, đồng bộ `talk` với TTS, phản ứng khi chạm), `WorldBackground` (3 lớp parallax + chuyển động nền theo thế giới), `QuestMap` (đường đi, trạm, avatar di chuyển), `Avatar`, `StarBurst` + `StarFlyToPocket`, `StarPocket` (đếm nhảy), `ProgressPath`, `HintBulb`, `FeedbackOverlay`, `KidPinPad`, `MicButton` (giữ để nói, sóng âm), `CameraCapture`, `ConfettiCelebration`, `TreasureChest`, `BadgeCeremony`, `SessionFinale` (kịch bản 4–6 s), `LoadingMascot`, `EmptyState` (minh hoạ theo ngữ cảnh), `SceneTransition`, và 9 component bài tập `exercise/<Type>.tsx` với interface chung:

```ts
type ExerciseProps = { spec: ExerciseSpecClient; onSubmit(response: unknown): void; onHint(): void; disabled: boolean; feedback?: FeedbackState };
```

### 1.4 Luồng chính của con

```
K1 chọn bé → mã 4 hình → K2 (mascot chào bằng giọng)
  → "Nhiệm vụ hôm nay" → K3 bản đồ → K4 bài 1 … bài n → K5 ăn mừng → K2
  → "Chơi thêm" → K6 → K4 ×5 → K5 (nhỏ) → K2
  → mascot → K8 hỏi đáp → K2
```

### 1.5 Định hướng mỹ thuật (art direction)

- **Phong cách:** minh hoạ phẳng, nét tròn mềm, màu tươi bão hoà vừa, có bóng đổ nhẹ và highlight — gần với phong cách các app học cho trẻ hiện đại (kiểu Duolingo ABC / Khan Kids / Lingokids), **không** dùng ảnh chụp, không dùng clip-art lẫn lộn phong cách. Một file `content/art/STYLE.md` mô tả phong cách + bảng màu + 6 ảnh tham chiếu tự vẽ/tự sinh để mọi tài sản mới nhất quán.
- **Tỷ lệ nhân vật:** đầu to, mắt to, thân ngắn (chibi 2–2.5 đầu), biểu cảm rõ ở mắt và miệng để đọc được từ xa trên tablet.
- **Nền có chiều sâu:** 3 lớp (trời/xa – cảnh vật – tiền cảnh) để làm parallax nhẹ; mỗi thế giới có bảng màu riêng nhưng cùng bút pháp.
- **Không có màn hình trống:** mọi trạng thái (đang tải, chưa có bài, mất mạng, chờ chấm) đều có minh hoạ + mascot làm gì đó (ngáp, đọc sách, xoay bánh răng).

### 1.5b Luật sao — đo công sức, không đo đúng sai *(chủ dự án chốt 11/09/2026, ADR-16)*

| Việc | Sao |
|---|---|
| **Làm xong một bài** — đúng, gần đúng, hay phải xem đáp án rồi mới xong | **1** |
| Xong cả phiên | 3 |
| Ba mẹ bấm "Khen" | 5 (sao vàng lớn) |
| Chạm "để sau" (bỏ qua trạm) | 0 — không phải phạt, chỉ là chưa làm |

**Vì sao bỏ luật "đúng ngay lần đầu 2 sao"** (ADR-15 §5): hai bé không học ngang nhau. Sao gắn với
độ đúng thì bé yếu hơn **luôn** ít sao hơn, và túi sao biến thành bảng so điểm giữa hai anh em —
trái `00` §6. Ảnh chụp bài viết tay và bài đọc to đã ghi âm vẫn được **1 sao ngay**, không chờ chấm.
Chỗ phản ánh năng lực thật là bản đồ năng lực của ba mẹ (`P4`), không phải túi sao của con.

### 1.6 Thế giới trò chơi & cá nhân hoá

Góc của con là một **thế giới** chứ không phải danh sách nút. Mỗi bé có một thế giới riêng theo sở thích, đổi được trong cài đặt:

| Thế giới | Mặc định cho | Bối cảnh | Cách thể hiện môn học |
|---|---|---|---|
| **Thành phố Robot** | Chí Thanh | Xưởng máy, bánh răng, tên lửa, bàn cờ khổng lồ, phím đàn phát sáng | Mỗi môn là một toà nhà/khu: Xưởng Số (Toán), Tháp Chữ (Tiếng Việt), Trạm Không Gian (Science), Bến Tàu Tiếng Anh |
| **Vườn Kỳ Diệu** | Mai Thy | Vườn hoa, hồ nước, nhà kính, bến sen, lâu đài nhỏ | Mỗi môn là một khu vườn: Vườn Số (Toán), Tháp Chữ — tháp chậu hoa a-b-c (Tiếng Việt), Trạm Không Gian — nhà kính + kính thiên văn (Science), Bến Tàu Tiếng Anh — thuyền lá trên hồ sen |
| Đại Dương / Rừng Khủng Long | tuỳ chọn thêm (P1) | | |

**Hai thế giới phải cân nhau: 4 khu mỗi bên** (chủ dự án chốt 11/09/2026, ADR-16). Cùng bốn cái
tên, cùng bốn môn, chỉ khác bút pháp — nếu một bé có 4 khu còn bé kia 1 khu thì đứa ít hơn nhận ra
ngay, và đó đúng là kiểu so sánh `00` §6 cấm.

- **Bản đồ nhiệm vụ (K3)** là con đường uốn lượn qua thế giới; mỗi bài là một trạm có icon môn; nhân vật của bé (avatar) **đi/nhảy/bay** giữa các trạm sau mỗi bài; trạm chưa mở tối màu, trạm xong có sao lấp lánh; cuối đường là rương kho báu.
- **Tiến bộ nhìn thấy được trong thế giới:** vật phẩm mua bằng sao đặt vào thế giới (cây, đèn, robot phụ, thú cưng đi theo avatar); thành thạo một mạch kỹ năng → một công trình "xây xong" và sáng lên. Trẻ quay lại vì muốn thấy thế giới mình lớn lên.
- **Avatar** của bé: chọn từ bộ nhân vật vẽ sẵn (≥ 6), đổi trang phục/phụ kiện bằng sao (P1).

### 1.7 Mascot có hoạt hình

Mascot (chọn 1 trong ≥ 5: cú, mèo, robot, khủng long, kỳ lân) là **nhân vật hoạt hình thật**, không phải icon tĩnh. Bắt buộc có các trạng thái hoạt hình (mỗi trạng thái 1 animation lặp hoặc một lần):

| Trạng thái | Khi nào | Mô tả |
|---|---|---|
| `idle` | mọi lúc | thở nhẹ, chớp mắt ngẫu nhiên 3–6 s, thỉnh thoảng nhìn quanh |
| `greet` | mở trang chủ | vẫy tay + nhảy nhẹ, bong bóng lời chào |
| `talk` | đang đọc đề/nói | miệng chuyển động theo âm (đơn giản: 2–3 khung mở/đóng đồng bộ với TTS đang phát) |
| `think` | con đang làm bài | tay chống cằm, mắt đảo, nền mờ |
| `cheer` | trả lời đúng | nhảy, tung tay, sao văng |
| `encourage` | gần đúng | gật đầu, tay chỉ gợi ý, biểu cảm ấm |
| `celebrate` | xong phiên / huy hiệu | nhảy múa + pháo giấy, có thể đội mũ/kèn |
| `sleep` | không thao tác > 60 s | ngủ gật, chữ Zzz; chạm → tỉnh dậy |
| `listen` | đang ghi âm (đọc to / hỏi) | ghé tai, sóng âm quanh tai |

Chạm vào mascot bất kỳ lúc nào → phản ứng vui ngẫu nhiên (nhột, xoay, kêu) — trẻ thích thử.

### 1.8 Hệ thống hoạt hình (motion system)

**Công cụ (chốt):** **Framer Motion** cho UI/layout/chuyển cảnh · **Lottie (dotLottie, `@lottiefiles/dotlottie-react`)** cho nhân vật, mascot, lễ ăn mừng, trạng thái trống · **CSS keyframes** cho chuyển động nền lặp (mây, sóng, lấp lánh) · **`canvas-confetti`** cho pháo giấy · **Rive** để dành cho P1 nếu cần mascot phản ứng theo con trỏ/âm thanh phức tạp hơn.

**Ngôn ngữ chuyển động (áp dụng nhất quán):**
- Nút & thẻ: `squash & stretch` khi nhấn (scale 0.94 → 1.04 → 1, spring stiffness 400, damping 15), nảy nhẹ khi xuất hiện (stagger 60 ms giữa các phần tử).
- Chuyển cảnh: màn hình trượt/phóng theo hướng di chuyển trong thế giới (đi tới bài kế = camera lia sang phải), 350–450 ms, easing spring; mascot "chạy theo" giữa các cảnh.
- Phản hồi đúng: đáp án phát sáng + nảy, sao bay theo đường cong về túi sao (600 ms), số sao tăng có đếm nhảy, âm thanh; mascot `cheer`.
- Gần đúng: phần tử lắc ngang 2 lần (không đỏ), gợi ý trượt lên từ mascot; mascot `encourage`.
- Kéo thả: vật thể nghiêng nhẹ theo hướng kéo, vùng thả "hít" vật khi tới gần, thả đúng → nảy và khớp, thả sai → trôi về chỗ cũ.
- Xong phiên: chuỗi 4–6 s có kịch bản (rương mở → sao tràn → tổng sao đếm → huy hiệu bay vào (nếu có) → mascot nhảy múa), có thể chạm để bỏ qua.
- Nền: parallax 3 lớp theo nghiêng thiết bị (DeviceOrientation, nhẹ ±8 px) hoặc theo con trỏ trên laptop; mây/lá/bong bóng trôi chậm; sao lấp lánh ngẫu nhiên.
- Tải dữ liệu: không spinner trơn — mascot làm việc (đọc sách, xoay bánh răng) + thanh tiến trình hình ảnh (cầu vồng, tên lửa).

**Ngân sách hiệu năng (iPad thế hệ 8–9 / Safari):** 60 fps khi làm bài; chỉ animate `transform`/`opacity`; Lottie tối đa 2 instance đang chạy cùng lúc; ảnh nền ≤ 300 KB/lớp (WebP/AVIF), Lottie ≤ 150 KB/file; tổng tài sản một màn hình ≤ 1.5 MB; preload tài sản màn hình kế tiếp; `prefers-reduced-motion` → tắt parallax và lặp nền, giữ phản hồi ngắn.

### 1.8b Giữ mới mỗi tuần, cho con quyền chọn, không ngồi quá lâu

Đồ hoạ đẹp chỉ giữ được trẻ 6 tuổi vài ngày; cái giữ được cả năm là **có gì mới** và **được tự quyết**. Bắt buộc có (pha 3 làm 1–4, pha 7 làm 5–6):

1. **Sự kiện tuần** — mỗi tuần một "chủ đề khách" (tuần khủng long, tuần vũ trụ, tuần Trung thu…) đổi vài chi tiết trang trí trong thế giới + 1 huy hiệu giới hạn chỉ tuần đó mới lấy được. Nội dung bài không đổi, chỉ đổi "áo".
2. ~~**Trạm chọn**~~ — **đã bỏ** theo yêu cầu chủ dự án (16/09/2026): màn "Con chọn bài nào?" (Bài này / Bài kia) là thêm một chạm không cần thiết; con vào thẳng bài planner đã chọn.
3. ~~**Nghỉ vận động 30 giây**~~ — **đã bỏ** theo yêu cầu chủ dự án (15/09/2026): màn đếm ngược chen giữa phiên làm con mất nhịp. Trong chế độ thành phố, giữa các trạm đã có khoảng nghỉ tự nhiên (bảng hạ, công trình mọc lên).
4. **Dừng khi mệt** — sau 8 bài mascot hỏi "Chơi tiếp hay nghỉ?"; chọn nghỉ vẫn giữ streak và nhận sao ngày. Dấu hiệu `met_cuoi_phien` (sai dồn 3 bài cuối) → hôm sau planner rút ngắn phiên 20%.
5. **Giọng mascot thu sẵn** — 40–60 câu thoại cố định (chào, khen, động viên, nghỉ, tạm biệt…) **thu âm giọng thật ấm hoặc TTS neural chất lượng cao**, không dùng giọng máy trên thiết bị; chọn ngẫu nhiên, không lặp câu trong một phiên. Đề bài thì dùng TTS neural đã sinh sẵn lúc nạp nội dung (NFR-04).
6. **Cây chung của nhà** *(P1)* — một cây lớn ở "sân chung" hai bé cùng nuôi bằng sao của cả hai; lớn theo tổng sao, ra hoa khi cả hai cùng đủ streak 5 ngày. Hợp tác thay vì so sánh — đúng nguyên tắc §00 mục 6.
7. **Mở khoá khu mới** — 4 khu môn có sẵn; khu thứ 5 "Đảo bí mật" chỉ mở khi 3 mạch kỹ năng đạt `SOLID`; con nhìn thấy hòn đảo mờ mờ ở góc bản đồ từ ngày đầu.

Thước đo (pha 8): tỉ lệ ngày con **tự mở app** không cần nhắc ≥ 60% trong 2 tuần nghiệm thu.

### 1.8c Mười bốn cơ chế thu hút, theo bốn động lực của trẻ 6 tuổi

> *Mục này được viết lại trong pha 3 từ bảng dữ liệu `03` §2.7, FR-PAR-08 ở `01` và nhật ký
> 10/09/2026 — bản gốc bị mất khỏi file. Đánh số giữ nguyên để FR-PAR-08 ("mục 5, 10") vẫn đúng.*

Đồ hoạ và phần thưởng làm trẻ thích **hôm nay**; bốn động lực dưới đây mới làm trẻ quay lại
**ngày mai**. Mỗi cơ chế ghi rõ bảng dữ liệu ở `03` và mức ưu tiên: **P0 = pha 3**, P1 = sau.

**A. Mong chờ — có thứ đang lớn lên khi con vắng mặt**

1. **Trứng nở theo ngày học** *(P0 — sửa 11/09/2026, ADR-16)* — **một quả trứng tại một thời
   điểm, không phải mỗi tuần một quả**: mỗi ngày con học xong phiên, trứng thêm một vết nứt
   (`EggProgress.cracks` 0–4); đủ **4 ngày học** thì nở ra một con thú (`Pet`, `StudentPet`) về ở
   trong thế giới của con, rồi quả trứng kế tiếp bắt đầu từ 0. **Không bao giờ reset về 0 vì nghỉ**
   — nghỉ thì thanh tiến độ đứng yên, trứng nở chậm hơn thôi. Nhịp mong đợi: **4 ngày học trong 7
   ngày** → khoảng một tuần một con thú. Hết thú trong `Pet` thì trứng đứng ở mức đầy và chờ (ba mẹ
   seed thêm thú), không tụt. Thú hiếm xuất hiện thưa, không mua được bằng sao.
2. **Mảnh tranh** *(P0 — sửa 11/09/2026, ADR-16)* — một bức tranh chủ đề tại một thời điểm
   (`WeeklyPicture`, 6 mảnh, đánh số `pictureNo` theo thứ tự con sưu tập); mỗi ngày học xong con
   lật được một mảnh (`StudentPicturePiece`). Đủ 6 mảnh → tranh hiện nguyên, cất vào bộ sưu tập và
   tranh kế tiếp bắt đầu. **Mảnh đã lật không bao giờ mất**: nghỉ một tuần thì tranh vẫn nằm đó chờ
   đúng số mảnh cũ. (Trước đây tranh theo tuần lịch nên bé học 3 buổi/tuần **không bao giờ** thấy
   được một bức tranh trọn vẹn.)
3. **Thế giới theo giờ thật** *(P0)* — sáng thế giới hửng nắng, chiều ngả vàng, tối có đèn và sao;
   mascot chào theo buổi. Không có đồng hồ đếm ngược, chỉ là thế giới sống cùng giờ của con.
4. **Thú cưng đi theo avatar** *(P1)* — thú đã nở (`StudentPet.isCompanion`) đi theo nhân vật trên
   bản đồ nhiệm vụ và nhảy cùng lúc ăn mừng.

**B. Sở hữu — cái này là của con, không phải của app**

5. **Hộp thư ba mẹ** *(P0)* — ba mẹ gửi lời nhắn ≤ 200 chữ, tuỳ chọn thu giọng 10 giây và kèm quà
   (`KidMail`, FR-PAR-08); sáng hôm sau thư nằm trên bản đồ, mascot đọc to. Con mở → `openedAt`,
   ba mẹ thấy "đã mở". Lời khen của cô trong nhật ký lớp cũng thành một lá thư
   (`fromKind=TEACHER_PRAISE`).
6. **Mục tiêu phần thưởng đời thực** *(P1)* — ba mẹ đặt một mục tiêu ("đi công viên", 200 sao,
   `RewardGoal`); thanh tiến trình hiện ở K7 để con thấy sao của mình dùng vào việc gì.

**C. Được là người lớn — con quyết định, con dạy lại**

7. **Mascot có ký ức** *(P0)* — mascot nhắc đúng một điều đã xảy ra: "Hôm qua con đọc trúng hết từ
   có *sh* đấy!", "Hôm nay lớp mình có tiết Toán nhỉ?" (`MascotMemory`, 4 loại
   `YESTERDAY_WIN|INTEREST|SCHEDULE|EVENT`). Mỗi câu dùng một lần (`usedAt`), sinh từ dữ liệu thật
   trong DB — không phải câu chung chung.
8. **Con chọn mục tiêu ngày** *(P1)* — đầu phiên con chọn "hôm nay mình làm 8 hay 12 bài"; chọn ít
   vẫn giữ streak. Quyền chọn quan trọng hơn con số.
9. **Con dạy lại mascot** *(P1)* — sau một kỹ năng `SOLID`, mascot giả vờ quên và nhờ con chỉ lại;
   con nói/chọn đúng thì mascot "hiểu ra". Dạy lại là cách ôn tốt nhất ở tuổi này.

**D. Được nhìn thấy — có người thật nhìn thấy con cố gắng**

10. **Sao vàng lớn** *(P0)* — nút "Khen" của ba mẹ (FR-PAR-08) gửi một ngôi sao vàng to kèm giọng
    thu sẵn; sao rơi xuống giữa màn hình của con kèm tên người khen. Không tính vào điểm, không
    mua được — chỉ để con biết có người vừa nhìn thấy mình.
11. **Giấy chứng nhận in được** *(P0)* — xong một mạch kỹ năng hoặc một tháng đều đặn → một tờ
    chứng nhận A4 có tên con, ngày và thứ con làm được (`Certificate`); ba mẹ in và dán lên tường.
12. **Lễ trao huy hiệu** *(P1 ở mục này; bắt buộc theo §1.5)* — huy hiệu mới không hiện thầm lặng:
    có màn riêng, nhạc ngắn, mascot trao.
13. **Góc khoe với ông bà** *(P1)* — một màn hình dọc gọn gàng (tranh tuần, huy hiệu, chứng nhận)
    để ba mẹ đưa điện thoại cho ông bà xem; không có số liệu học tập, chỉ có thành quả.
14. **Bộ sưu tập bày ra được** *(P1 — phần mua bằng sao làm ở K7 pha 3)* — vật phẩm mua bằng sao
    đặt được vào đúng chỗ trong thế giới (`StudentCollectible.placement`), nên thế giới của hai bé
    khác nhau và không bao giờ so sánh được với nhau.

Nguyên tắc chung cho cả 14 cơ chế: **không có cơ chế nào lấy đi thứ con đã có** (không mất sao,
không mất streak vì nghỉ một ngày, không đếm ngược), và **không cơ chế nào so sánh hai bé**
(`00` §6).

**Ngọn lửa `Streak` cũng theo nguyên tắc đó** (ADR-16): nó đếm **số ngày con đã học**, nghỉ thì
đứng yên — không bao giờ về 1. Vì vậy câu của mascot là "con đã học N ngày rồi", không phải "N ngày
liên tiếp".

### 1.9 Tài sản đồ hoạ — nguồn & quy trình sản xuất

Dự án gia đình không có hoạ sĩ, nên tài sản đến từ ba nguồn, **cùng một phong cách** theo `STYLE.md`:

| Loại tài sản | Nguồn đề xuất | Giấy phép | Ghi chú |
|---|---|---|---|
| Mascot 5 nhân vật × 9 trạng thái, avatar, nhân vật thế giới | **Lottie có sẵn** trên LottieFiles (miễn phí, chọn cùng phong cách) cho v1; **hoặc** sinh bằng AI ảnh (Midjourney/DALL·E/Ideogram) một bộ tư thế nhất quán theo prompt trong `STYLE.md` → tách nền → làm **sprite/frame animation** hoặc rig đơn giản bằng Lottie/Rive | LottieFiles Free (ghi công nếu yêu cầu); ảnh AI: dùng nội bộ | Chí Thanh/Mai Thy có thể chọn cùng chủ dự án — coi như một hoạt động gia đình |
| Nền thế giới (3 lớp × 2 thế giới × 4 khu môn) | Sinh bằng AI ảnh theo prompt cố định + chỉnh màu; hoặc bộ minh hoạ vector (Storyset/Freepik, Kenney.nl CC0 cho props game) | Storyset: ghi công; Kenney: CC0 | Xuất WebP nhiều kích thước |
| Icon môn, vật phẩm bộ sưu tập, huy hiệu | Bộ icon SVG phong cách phẳng (Phosphor/Iconoir cho UI; **Kenney CC0**, **OpenMoji CC-BY-SA** cho vật thể trong bài) | CC0 / CC-BY-SA | Huy hiệu vẽ SVG theo mẫu (khung + icon + ruy băng) |
| Hình trong bài luyện (đếm táo, con vật, đồ vật) | OpenMoji/Twemoji + thư viện SVG nội bộ theo chủ đề (≥ 200 vật thể), gắn nhãn EN/VI để AI chọn theo tên | CC-BY 4.0 / CC-BY-SA | `ImageRef.kind='asset'` tra theo nhãn; không sinh ảnh AI lúc chạy ở v1 |
| Hiệu ứng (pháo giấy, sao, lấp lánh, rương) | Lottie miễn phí + canvas-confetti | | |
| Âm thanh | Bộ hiệu ứng CC0 (Kenney UI audio, freesound CC0), nhạc nền nhẹ có nút tắt | CC0 | ≤ 1 s cho hiệu ứng; nhạc nền loop 30–60 s, âm lượng thấp |

Quy trình: mọi tài sản đặt trong `content/art/<loại>/` kèm `manifest.json` (tên, nhãn EN/VI, nguồn, giấy phép); script kiểm tra kích thước; ảnh nguồn AI giữ prompt trong manifest để tái sinh cùng phong cách. Tài sản là **việc của pha 3** và được bổ sung dần; pha 3 chưa cần đủ, nhưng phải có: 1 thế giới hoàn chỉnh, 2 mascot đủ 9 trạng thái, bộ hiệu ứng, ≥ 60 vật thể cho bài.

## 2. Bảng điều khiển ba mẹ — nguyên tắc

- Dùng shadcn/ui, bố cục sidebar (laptop) / bottom tab (điện thoại). Tiếng Việt. Màu trung tính, điểm nhấn theo bé (dùng lại primary của bé để phân biệt nhanh).
- Ưu tiên **hành động 1 chạm từ điện thoại**: nút nổi "📷 Chụp bài vở" luôn hiện.
- Mọi con số → bấm ra bằng chứng. Mọi đề xuất AI có nhãn "AI đề xuất" và nút Duyệt/Sửa/Bỏ.

### 2.1 Màn hình ba mẹ

| # | Màn hình | Route |
|---|---|---|
| P1 | Đăng nhập | `/login` |
| P2 | Tổng quan 2 bé | `/parent` — 2 thẻ bé (streak, phiên hôm nay, 3 điều cần chú ý), hộp thư duyệt (badge số lượng), nút chụp |
| P3 | Hồ sơ bé | `/parent/[student]` — thẻ 5 môn, xu hướng tuần, hoạt động 7 ngày, kế hoạch tuần |
| P4 | Bản đồ năng lực | `/parent/[student]/skills` — heatmap theo môn/mạch; drawer chi tiết kỹ năng (lịch sử, bằng chứng, nút "Luyện hôm nay") |
| P5 | Nạp ảnh | `/parent/intake/new` — camera/tải nhiều ảnh, chọn bé/môn/ngày, gửi |
| P6 | Duyệt intake | `/parent/intake/[id]` — ảnh trái (zoom, bbox), kết quả phải (bảng item: câu, đáp án con, đúng/sai, kỹ năng, lỗi), sửa inline, Duyệt tất cả |
| P7 | Hộp thư duyệt | `/parent/inbox` — intake, kế hoạch, bài chờ chấm, hội thoại con |
| P8 | Giáo trình & lịch học | `/parent/materials` — tải PDF/ảnh, danh sách unit, đánh dấu "tuần này" |
| P9 | Kế hoạch | `/parent/[student]/plan` — đề xuất AI, kéo thả ưu tiên, duyệt |
| P10 | Báo cáo | `/parent/[student]/reports` — danh sách tuần, xem/ in PDF |
| P11 | Hỏi về con | `/parent/assistant` — chat, trích dẫn bằng chứng |
| P12 | Thời khoá biểu & năm học | `/parent/school` |
| P13 | Cài đặt bé | `/parent/[student]/settings` — thời lượng, giờ học, mascot, sở thích, mã hình, phần thưởng đời thực |

### 2.2 Admin

`/admin/skills` (cây kỹ năng, import — pha 1), `/admin/content` (lô nội dung, xem thử bài như con thấy, gắn cờ `GOOD/BAD`, phát hành `DRAFT → PUBLISHED` — FR-ADM-05, pha 2), `/admin/inbox` (hàng chờ AI, `docs/13` — pha 2), `/admin/health` (db + worker, pha 0/8), `/admin/users` (pha 0), `/admin/logs`, `/admin/backup` (pha 8), `/dev/kit` (trình diễn component & dạng bài — pha 2/3).

> `/admin/ai` và `/admin/prompts` **bỏ khỏi v1** (ADR-10: app không gọi LLM nên không có model/ngân sách để cấu hình). Không có trang `/admin` dashboard cho tới khi mục này có thiết kế cho nó (ADR-11).

**Vỏ giao diện người lớn** (ADR-11): shadcn/ui, màu trung tính (`slate`), điểm nhấn `primary` theo bé; sidebar cố định trên laptop, ngăn kéo trên điện thoại; không dùng token thương hiệu của dự án khác.

## 3. i18n & âm thanh

- `messages/vi.json`, `messages/en.json`; giao diện con: nhãn hệ thống tiếng Việt (icon + chữ), nội dung bài theo môn.
- `useSpeak(text, lang)`: ưu tiên audio cache (mp3 từ cloud TTS) → fallback Web Speech; hàng đợi đọc, huỷ khi chuyển màn.
- `useListen(lang)`: Web Speech (Chrome/Safari) → fallback ghi âm gửi server STT.

## 4. Kiểm thử UI bắt buộc

- Storybook (hoặc trang `/dev/kit`) hiển thị mọi component kid và 9 dạng bài với spec mẫu.
- Playwright: luồng K1→K5 với 3 dạng bài; luồng P5→P6 duyệt intake (AI mock).
- Kiểm tra thủ công với 2 bé (pha nghiệm thu): 10 phút không cần ba mẹ trợ giúp là đạt.
- **Checklist "hấp dẫn với trẻ" (QC chấm từng mục, phải đạt hết):**
  1. Không màn hình nào của con chỉ có chữ + nút trên nền trơn; mỗi màn hình có nền thế giới và ít nhất một chuyển động nền.
  2. Mascot hiện ở mọi màn hình, có `idle` chớp mắt/thở, phản ứng khi chạm, đúng trạng thái theo ngữ cảnh (§1.7).
  3. Mọi nút/thẻ có phản hồi hoạt hình khi nhấn; xuất hiện có stagger.
  4. Trả lời đúng: sao bay về túi + đếm nhảy + âm thanh + mascot cheer; gần đúng: lắc + gợi ý trượt lên, không đỏ.
  5. Bản đồ nhiệm vụ: avatar di chuyển giữa trạm sau mỗi bài; trạm xong lấp lánh; cuối đường có rương.
  6. Xong phiên: kịch bản ăn mừng có rương mở, sao tràn, (huy hiệu), mascot nhảy; bỏ qua được.
  7. Tải/trống/mất mạng có minh hoạ + mascot, không spinner trơn.
  8. 60 fps khi làm bài trên iPad (đo bằng Safari Web Inspector), tài sản màn hình ≤ 1.5 MB.
  9. Quay video 2 phút một phiên học để chủ dự án xem (lưu `docs/screens/pha-3/`).
  10. Mascot hỏi "chơi tiếp hay nghỉ" sau 8 bài ở thế giới cũ (§1.8b).
  11. Mascot làm mẫu được một bài (`scaffold: model`): nói to cách nghĩ rồi đưa bài sinh đôi cho con (`04` §11.4 bậc 3).
  12. Bảy cơ chế P0 của §1.8c có mặt và chạy được: trứng nứt thêm sau phiên, mảnh tranh tuần lật thêm một mảnh, thế giới đổi theo giờ thật, thư của ba mẹ đọc được bằng giọng, mascot nhắc đúng một việc hôm qua, sao vàng lớn của ba mẹ rơi xuống, giấy chứng nhận in ra được.
  13. Chế độ thành phố (§1.2b): vào một thành phố thấy đúng 3–4 sao; chạm sao → bảng trượt lên trên nền thành phố, làm hết bài của trạm, bảng hạ, công trình mọc tầng trước mắt; hết trạm → vòng bay + mở đất + chọn xây; URL không rời màn thành phố (Playwright `e2e/phase10-city.spec.ts`).
