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
5. **Phần thưởng tức thì & rõ ràng.** Sao bay lên góc túi sao, âm thanh vui ngắn (≤ 1 s), confetti khi xong phiên; huy hiệu có "lễ trao" riêng.
6. **Mascot đồng hành.** Mỗi bé chọn mascot (cú, mèo, robot, khủng long, kỳ lân…); mascot nói bằng bong bóng + giọng; là cửa vào gia sư giọng nói.
7. **Cá nhân hoá nhìn thấy được.** Chủ đề màu/hình theo sở thích (Thanh: robot – xanh dương/cam; Thy: vườn – hồng/tím); tên gọi ở nhà trong lời chào.
8. **Không lối thoát ra ngoài.** Không link ngoài, không nút mở tab, không nội dung không do hệ thống sinh. Nút "ba mẹ" ở góc (giữ 2 giây) để mở khoá về trang phụ huynh.
9. **Sống động nhưng không làm phân tâm.** Màn hình luôn có chuyển động nền nhẹ (mây trôi, mascot chớp mắt, sao lấp lánh) và mọi thao tác đều có phản hồi hoạt hình; nhưng trong lúc con đang trả lời, vùng đề bài đứng yên, hoạt hình chỉ ở nền và mascot (chậm, mờ). Tôn trọng `prefers-reduced-motion`.
10. **Tablet ngang là mặc định**; dọc vẫn dùng được; laptop chuột hoạt động (kéo thả hỗ trợ cả pointer).

### 1.1 Design token (kid)

```
Màu nền chính:   #FFF8EC (kem ấm)  · nền tối (tuỳ chọn, không bắt buộc v1)
Chủ đề Thanh:    primary #2F80ED · accent #FF8C42 · thưởng #FFD447
Chủ đề Thy:      primary #E85D9C · accent #7C5CFF · thưởng #FFD447
Đúng:            #34C759 (kèm icon ✓ + âm) · Gần đúng: #FFB020 (kèm icon ↻)   — không dùng đỏ
Bo góc: 24 px · Bóng mềm · Nút: cao 72 px, chữ 24 px, icon 32 px
Font: Nunito 700/800; tiếng Việt: Baloo 2 / Be Vietnam Pro
Âm thanh: bộ 6 hiệu ứng (đúng, gần đúng, sao, huy hiệu, xong phiên, chạm)
```

### 1.2 Màn hình của con

| # | Màn hình | Route | Nội dung & hành vi |
|---|---|---|---|
| K1 | Chọn bé | `/login` (phần trên của trang đăng nhập chung, `12` §4) | 2 thẻ ảnh đại diện to (Thy / Thanh). Chạm → chọn **4 hình theo thứ tự** trên lưới 9–12 hình; có nút loa hướng dẫn. |
| K2 | Trang chủ | `/kid/home` | Mascot chào bằng giọng; nút to **"Nhiệm vụ hôm nay"** (hiện ✓ nếu xong); túi sao, ngọn lửa streak; 3 icon môn "chơi thêm"; icon "Bộ sưu tập"; icon mascot "Hỏi bạn Cú" (nếu bật). |
| K3 | Nhiệm vụ hôm nay — bản đồ | `/kid/quest` | Con đường 8–15 ô (mỗi ô 1 bài, icon môn), vị trí nhân vật; nút "Đi thôi!". |
| K4 | Làm bài | `/kid/quest/[n]` | Khung đề (đọc tự động, nút loa), vùng tương tác theo dạng bài, nút gợi ý (bóng đèn), nút "Xong" (chỉ hiện khi có đáp án). Phản hồi overlay ngắn rồi tự sang bài kế sau 1,5 s (đúng) hoặc chờ (gợi ý). |
| K5 | Xong phiên | `/kid/quest/done` | Confetti, tổng sao, huy hiệu mới (nếu có) với "lễ trao", 2 dòng mascot ("Hôm nay bạn đọc rất giỏi từ có *sh*!"), nút "Về nhà". |
| K6 | Chơi thêm theo môn | `/kid/play/[subject]` | Chọn môn → 5 bài nhanh; giới hạn lượt hiển thị bằng "vé". |
| K7 | Bộ sưu tập / vườn | `/kid/collection` | Lưới vật phẩm, mua bằng sao; trang trí góc mascot; thanh mục tiêu phần thưởng đời thực (nếu ba mẹ đặt). |
| K8 | Hỏi bạn Cú | `/kid/ask` | Nút mic to giữ-để-nói; transcript hiện chữ + mascot trả lời bằng giọng; nút thoát. |
| K9 | Bài viết/vẽ chụp lại | trong K4 | Hiện đề, con làm ra giấy; nút "Gọi ba mẹ chụp" → camera; ảnh gửi → "Bạn Cú sẽ chấm sau nhé!" và sang bài kế. |

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

### 1.6 Thế giới trò chơi & cá nhân hoá

Góc của con là một **thế giới** chứ không phải danh sách nút. Mỗi bé có một thế giới riêng theo sở thích, đổi được trong cài đặt:

| Thế giới | Mặc định cho | Bối cảnh | Cách thể hiện môn học |
|---|---|---|---|
| **Thành phố Robot** | Chí Thanh | Xưởng máy, bánh răng, tên lửa, bàn cờ khổng lồ, phím đàn phát sáng | Mỗi môn là một toà nhà/khu: Xưởng Số (Toán), Tháp Chữ (Tiếng Việt), Trạm Không Gian (Science), Bến Tàu Tiếng Anh |
| **Vườn Kỳ Diệu** | Mai Thy | Vườn hoa, hồ nước, sân khấu múa, xưởng vẽ, lâu đài nhỏ | Mỗi môn là một khu vườn/nhà: Vườn Số, Cây Chữ, Hồ Khoa Học, Sân Khấu Tiếng Anh |
| Đại Dương / Rừng Khủng Long | tuỳ chọn thêm (P1) | | |

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
2. **Trạm chọn** — 2–3 vị trí trên bản đồ nhiệm vụ cho con **chọn 1 trong 2 bài** (cùng kỹ năng, khác ngữ cảnh/dạng). Trẻ chọn được thì chịu làm hơn.
3. **Nghỉ vận động 30 giây** — giữa phiên (sau bài 6–7) mascot rủ "đứng lên nhảy 5 cái / vươn vai / xoay người" với đếm ngược hình ảnh; xong tặng 1 sao. Không bỏ qua được lần đầu, các lần sau bỏ qua được.
4. **Dừng khi mệt** — sau 8 bài mascot hỏi "Chơi tiếp hay nghỉ?"; chọn nghỉ vẫn giữ streak và nhận sao ngày. Dấu hiệu `met_cuoi_phien` (sai dồn 3 bài cuối) → hôm sau planner rút ngắn phiên 20%.
5. **Giọng mascot thu sẵn** — 40–60 câu thoại cố định (chào, khen, động viên, nghỉ, tạm biệt…) **thu âm giọng thật ấm hoặc TTS neural chất lượng cao**, không dùng giọng máy trên thiết bị; chọn ngẫu nhiên, không lặp câu trong một phiên. Đề bài thì dùng TTS neural đã sinh sẵn lúc nạp nội dung (NFR-04).
6. **Cây chung của nhà** *(P1)* — một cây lớn ở "sân chung" hai bé cùng nuôi bằng sao của cả hai; lớn theo tổng sao, ra hoa khi cả hai cùng đủ streak 5 ngày. Hợp tác thay vì so sánh — đúng nguyên tắc §00 mục 6.
7. **Mở khoá khu mới** — 4 khu môn có sẵn; khu thứ 5 "Đảo bí mật" chỉ mở khi 3 mạch kỹ năng đạt `SOLID`; con nhìn thấy hòn đảo mờ mờ ở góc bản đồ từ ngày đầu.

Thước đo (pha 8): tỉ lệ ngày con **tự mở app** không cần nhắc ≥ 60% trong 2 tuần nghiệm thu.

### 1.9 Tài sản đồ hoạ — nguồn & quy trình sản xuất

Dự án gia đình không có hoạ sĩ, nên tài sản đến từ ba nguồn, **cùng một phong cách** theo `STYLE.md`:

| Loại tài sản | Nguồn đề xuất | Giấy phép | Ghi chú |
|---|---|---|---|
| Mascot 5 nhân vật × 9 trạng thái, avatar, nhân vật thế giới | **Lottie có sẵn** trên LottieFiles (miễn phí, chọn cùng phong cách) cho v1; **hoặc** sinh bằng AI ảnh (Midjourney/DALL·E/Ideogram) một bộ tư thế nhất quán theo prompt trong `STYLE.md` → tách nền → làm **sprite/frame animation** hoặc rig đơn giản bằng Lottie/Rive | LottieFiles Free (ghi công nếu yêu cầu); ảnh AI: dùng nội bộ | Thanh/Thy có thể chọn cùng chủ dự án — coi như một hoạt động gia đình |
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

`/admin/ai` (model theo task, ngân sách, chi phí biểu đồ), `/admin/prompts`, `/admin/skills` (cây kỹ năng, import), `/admin/exercises` (bank, gắn cờ), `/admin/logs`, `/admin/backup`, `/admin/users`.

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
  10. Có ít nhất 1 trạm chọn "1 trong 2" trong phiên; có nghỉ vận động giữa phiên; mascot hỏi "chơi tiếp hay nghỉ" sau 8 bài (§1.8b).
  11. Mascot làm mẫu được một bài (`scaffold: model`): nói to cách nghĩ rồi đưa bài sinh đôi cho con (`04` §11.4 bậc 3).
