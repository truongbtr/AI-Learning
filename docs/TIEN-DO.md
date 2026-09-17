# TIẾN ĐỘ DỰ ÁN

> Developer ghi sau mỗi pha: ngày, việc đã làm, cách chạy thử, tồn đọng, câu hỏi cho chủ dự án. Mới nhất ở trên.

## Sửa nhỏ — 16/09/2026 tối — Bỏ bài "viết vào vở rồi chụp ảnh" (ADR-25)

Chủ dự án: *"Bỏ các câu viết rồi chụp ảnh nhé."*

- Không phiên nào giao bài `WRITE_PHOTO` nữa (Daily Quest, trạm thành phố, Chơi thêm, thang khắc
  phục): loại ở chỗ chọn bài duy nhất, `pickExercises` (`EXCLUDED_TYPES`). Ngân hàng giữ nguyên 797
  bài; bật lại là bỏ một dòng.
- Không kỹ năng nào hết bài (mỗi kỹ năng còn ≥ 12 bài dạng khác). **Nhưng trong app không còn bài tập
  viết tay nào** — ngân hàng có 0 bài `TRACE`; kỹ năng tập viết chỉ còn luyện bằng bài chạm/chọn.
- Test tích hợp `no-photo.test.ts`: đỏ với hành vi cũ, xanh với hành vi mới.
- **Lên production 21:08 cùng lần triển khai `master` của phiên Xưởng Tiếng** (git máy chủ `9d1a935`, image web `2ed5107b96f2`, migration 10, health ok; image chứa `EXCLUDED_TYPES`). Tôi đã dựng sẵn một bản riêng (bản đang chạy + đúng commit này, test DB 140/140 trên DB tạm schema pha 11) để không kéo Xưởng Tiếng theo, nhưng lúc 21:06 phiên kia đã triển khai `master` — gồm cả commit này — nên bản riêng không được dùng, để tránh hai phiên tráo container chồng nhau.
- Phiên đã lập trước khi đổi (tối nay) vẫn có thể còn bài chụp ảnh; từ phiên lập sau lúc triển khai
  (04:30 sáng mai) thì không còn.

## Pha 12 — 16/09/2026 — Xưởng Tiếng: trò chơi đánh vần tiếng Việt

> Bản đồ vành đai (mục "Pha 12" bên dưới) đã hoàn tác; số pha 12 dùng cho Xưởng Tiếng theo đề bài.
> ADR-23 vẫn giữ số của nó, nên ADR của pha này là **ADR-24**.

Trạng thái: **việc 1–5 xong trên máy dev, CHƯA deploy.** `pnpm lint` sạch, `pnpm test` xanh (core 335 ·
db 145 · web 71 · content 69 · city 72 · inbox 18), `pnpm build` xanh, `content:validate` sạch.

### Việc 1 — kho tiếng, nhịp đánh vần, mp3

- `content/lexicon/viet.json`: **707 tiếng** (305 có tranh Noto), **27 âm đầu**, **125 vần** tập một
  (đề bài ước ~160 là tính cả tập hai), 6 thanh. 30 tiếng đầu là tiếng hằng ngày, có **thy** và
  **thanh** (viết thường — trò lắp bằng mảnh chữ thường). Rút từ 1.154 chuỗi trong 93 gói `HV.*`, bỏ
  tiếng vô nghĩa, soạn nghĩa + tranh. Bài/tuần/kỹ năng **suy ra** từ phần muộn nhất của tiếng.
- `cadence()` thuần ở `packages/core/src/syllable/cadence.ts`; 50 ca test (có/không âm đầu, thanh
  ngang, vần có âm cuối, `oan`, `uyên`, `ươu`, `gi`, `qu`).
- `content:validate` kiểm từng tiếng bằng chính hàm tách/ghép của trò chơi; `pnpm art:emoji` thêm 34
  tranh mới.
- **TTS** (`vi-VN-HoaiMyNeural`), ước lượng trước khi chạy: đợt `pieces` 1.237 câu / 3.971 ký tự; đợt
  `rhythm` 723 câu / 16.208 ký tự; cả hai 20.172 ký tự. Hạn mức tháng trước khi chạy **159.033 /
  500.000 (32 %)** → cả hai đợt vẫn dưới 37 %, **không cần chia vì hạn mức**. Vẫn chia vì nhịp đọc chưa
  được cô giáo xác nhận: trên máy dev đã sinh **đợt 1** (`--viet-tts pieces`): 776 mp3 mới, 979 đã có sẵn,
  0 lỗi, mất 50 phút ở tốc độ gói F0; bộ đếm tháng giờ ghi **166.832** (bộ đếm ước theo thứ tự câu nên
  ghi dư ~4 nghìn ký tự so với thực tế — dư là an toàn). Đợt 2 chưa sinh.

### Việc 2 — `WordProgress` → `LexemeProgress`

Migration `20260916160000_phase12_syllables_and_lexeme_progress`: đổi tên bảng tại chỗ, `wordId` →
`lexemeId`, thêm `kind` (dòng cũ = `word`), bỏ khoá ngoại sang `Word`; bảng nội dung `Syllable`;
`StudentCity.syllableBricks`. Một module ghi duy nhất (`packages/db/src/lexeme/progress.ts`). Đã cập nhật
planner, trạm từ vựng, thành phố, `ops/requests` (chặn cả hai tên), `ops:export` (`lexemes.csv`,
`schemaVersion` 2, dòng trong `ops/CHANGELOG.md`), docs/03, docs/14, bổ sung ADR-22.
**Lỗ hổng pha 11 được vá luôn**: `db:reset-learning` và `db:export-student` trước đây **không** đụng tới
`WordProgress`; giờ có `LexemeProgress`.
Mỗi lần gặp tiếng ghi thêm **một `Evidence`** cho `VIET.HV.*` (qua `commitEvidence`) — **không cần mã
lỗi mới**: `nham_am_dau`, `doc_nham_van`, `nham_hoi_nga`, `thieu_dau_thanh`, `sai_dau_thanh` và 5 mã cặp
dễ lẫn đều đã có.

### Việc 3 — sáu trò

`apps/web/components/kid/syllable/`: Lắp tiếng (băng chuyền, 3 khe, máy đọc nhịp, khe sáng theo tiếng),
Tách tiếng, Bánh xe thanh điệu, Cặp dễ lẫn (đúng 2 thẻ), Tàu chở vần (không có đáp án sai), Đọc to (cùng
`matchReadAloud`, đường "cùng ba mẹ"). Chạy trong `exercise-play.tsx`; API `POST /api/kid/syllable`
kiểm vai trò + quyền trên bé + trạm thuộc phiên của bé, **tự chấm từng mảnh**. Bộ sinh vòng thuần
(`rounds.ts`) có 23 test trên kho thật: không trùng tiếng, nhiễu là âm đầu/vần/thanh **thật**, đúng số
lượng. Bàn thử admin `/dev/syllable` (không ghi dữ liệu).

**Lỗi tìm ra khi chạy thật với mp3**: `useSpeak` dừng câu cũ bằng `pause()` nhưng không báo cho người
đang chờ câu đó — `<audio>` bị dừng không bao giờ phát `ended`, nên trò nào chờ giọng đọc sẽ **đứng
hình** khi có câu khác chen vào. Đã sửa ở `use-speak.ts` (dừng là báo xong; câu tải xong muộn không
được phát đè câu mới). Sửa chung cho mọi màn của con.

### Việc 4 — planner, Phố Chữ, Sổ tiếng

- Tối đa 2 trạm/tối; chỉ ô `focus/new` của `VIET.HV.*`; một trạm nuốt tối đa 3 ô học vần, thiếu thì
  nhường chỗ ô `focus/new` cuối buổi — **buổi không dài thêm** (ghi vào `generationLog`). Ôn tập, thang
  rèn, bài cô giao giữ bài cũ. 5 tiếng đến hạn + 3 tiếng mới mỗi trạm. Chạy ở cả Daily Quest (thế giới
  cũ) và Phố Chữ.
- Phố Chữ: trạm có **bánh răng ⚙️**; nút **Sổ tiếng** ở HUD với hàng gạch vẽ; box ≥ 3 = 1 gạch,
  10 gạch = 1 nhà (mốc cao nhất, không tụt). Sao của trạm trò chơi giờ tính vào đúng thành phố
  (`SyllableStation` → Tiếng Việt, và `VocabStation` → Tiếng Anh — trước đây sao Bến Cảng Từ không vào
  thành phố nào).
- Thành phố trước đây coi mọi ô không có `exerciseId` là "thiếu bài" → trạm trò chơi **không hiện** trong
  thành phố; đã sửa.
- `/kid/so-tieng` và Sổ từ dùng chung `components/kid/lexeme-book.tsx`.

### Việc 5 — kiểm tra

| Kiểm tra | Kết quả |
|---|---|
| `e2e/phase12-syllable.spec.ts` — Mai Thy → Phố Chữ → ⚙️ → 2 vòng | **xanh**: Lắp tiếng 8 tiếng + Cặp dễ lẫn 7 tiếng, mỗi lần lắp nhịp khớp `cadence()`, `LexemeProgress` `kind=syllable` tăng đúng 15 lần gặp, dòng `word` không đổi, quét không "sai"/đỏ/đồng hồ |
| Sổ tiếng | **xanh**: số thẻ = số tiếng box ≥ 3, không %, không phân số |
| Nhịp mp3 cho 5 tiếng mẫu (bà, **anh**, **quyển**, nghé, mẹ) | **xanh** ở `cadence-player.test.ts` (thứ tự fetch `/api/tts`, không bao giờ hai câu cùng lúc) |
| 3 test trên bàn thử admin (nhịp trên bàn thử, Tàu chở vần, 4 trò còn lại) | **bỏ qua** — cần `E2E_ADMIN_PASSWORD`, `.env` không có; developer không gõ mật khẩu thật của chủ dự án. Sáu màn có thêm test dựng HTML (`games.test.ts`) |
| e2e pha 10 (Thành Số, thành phố lạ) | **xanh** |
| e2e pha 10 "đảo sáu thành phố" | **đỏ trên `next dev`**: nút Next.js Dev Tools đè lên cửa ba mẹ ở góc — không liên quan pha này, chạy trên bản build sẽ không có nút đó |
| e2e pha 11 | cả file bỏ qua khi thiếu `E2E_ADMIN_PASSWORD`; Sổ từ đã kiểm riêng bằng một lần chạy tạm |
| e2e thế giới cũ (pha 3, 5 test) | **xanh**; một lần chạy đi qua trạm Xưởng Tiếng (Lắp tiếng 8 + Bánh xe 4); walker pha 3 đã học cách chơi trạm |

Ảnh: `docs/screens/pha-12-xuong-tieng/` (x3 Phố Chữ với bánh răng, x4 Lắp tiếng, x10 Sổ tiếng; x1, x2,
x5–x9 sẽ có khi chạy với `E2E_ADMIN_PASSWORD`).
Docker dev (cổng 5000) đã build lại image web + worker cho khớp bảng mới.

### Chưa làm + giả định

- **Ngôi nhà Xưởng Tiếng trong cảnh 3D**: `CityView.workshop` đã có, nhưng `compose.ts` đang được làm lại
  song song (phiên khác, bản đồ Ecopark) — không đụng để khỏi giẫm chân. Trong thành phố hiện có bánh
  răng trên toà nhà của trạm + đống gạch/ số nhà ở HUD và Sổ tiếng.
- Luật mở Bánh xe thanh (đủ 6 thanh + đã gặp 6 tiếng) và Tàu chở vần (10 tiếng box ≥ 2) là **diễn giải**
  của developer; đề bài chỉ nêu điều kiện của Tách tiếng.
- Bảng giữ tên cột `box` (0–5) và `known` thay vì `box 0-4`/`correct` để không đổi nghĩa dữ liệu pha 11.
- Enum `ExerciseType` không thêm `SYL_*` (không có dòng bài nào dùng) — ADR-24 §4.

### Đã lên production — 16/09 21:08

- Git máy chủ `9d1a935` (Xưởng Tiếng + bỏ câu viết rồi chụp ảnh), image web `2ed5107b96f2`, worker
  `488d2382c571`, dựng trên máy dev từ worktree sạch (lint/build/test xanh). Sao lưu trước khi đổi:
  `~/pre-deploy-20260916-2057.dump` (3,2 MB).
- Migration `20260916160000_phase12_syllables_and_lexeme_progress` đã áp (health: 10 migration, web
  healthy, `/login` 200).
- Nạp tiếng: dry-run `lexicon 262 unchanged`, `syllables 707 new`; chạy thật `--viet-tts pieces
  --tts-pace 3300` ở nền 21:12–21:58: 776 mp3 mới, 979 có sẵn, 0 lỗi; hạn mức TTS tháng 9 172.274/500.000 (34 %).
- Chủ dự án xác nhận nhịp đánh vần (câu hỏi 1) → mp3 đợt 2 `--viet-tts all --tts-pace 3300` chạy nền
  trên production 22:48–23:38: 714 mp3 mới, 1.761 có sẵn, 0 lỗi; hạn mức TTS tháng 9 179.357/500.000
  (36 %). Xưởng Tiếng trên production đã đủ mp3 cả hai đợt.
- 17/09 09:35: git máy chủ lên `7a8d99e` ("Hoàn thành pha 12" — chỉ ảnh + `ops/context`, không đổi code nên
  không đổi image/không khởi động lại). `ops/context/HIEN-TRANG.md` giữ bản production tự xuất lúc 04:30.
- Từ giờ deploy bằng skill `/update_edu_prod` (`.claude/skills/update_edu_prod/SKILL.md`).

### Lệnh deploy (đã dùng)

Theo quy trình hiện hành (build image trên máy dev từ worktree sạch của commit `43ce14a`, backup
`pg_dump` trên server, `git bundle` + `merge --ff-only`, `docker save … | ssh … docker load`), rồi trên
server, ngoài giờ 18:00–21:00:

```
docker compose -f docker/compose.yml --env-file .env up -d --no-build web worker
    # web tự chạy migration: ĐỔI TÊN WordProgress → LexemeProgress (dữ liệu từ vựng pha 11 của hai bé
    # được giữ, thành kind=word), thêm bảng Syllable và cột StudentCity.syllableBricks
docker compose -f docker/compose.yml --env-file .env exec -T web sh -c '. ./docker/env.sh; cd packages/db && ./node_modules/.bin/tsx src/cli/content-import.ts --dir content/lexicon --viet-tts pieces --tts-pace 3300'
    # 707 tiếng + mp3 đợt 1: tối đa 3.971 ký tự, ~50 phút (bộ đệm mp3 của server riêng với máy dev)
# chỉ sau khi cô giáo xác nhận nhịp đánh vần:
docker compose -f docker/compose.yml --env-file .env exec -T web sh -c '. ./docker/env.sh; cd packages/db && ./node_modules/.bin/tsx src/cli/content-import.ts --dir content/lexicon --viet-tts all --tts-pace 3300'
    # mp3 đợt 2: tối đa 16.208 ký tự
```

Tổng TTS cho cả hai đợt ≤ 20.172 ký tự — hạn mức tháng 9 sau đó vẫn dưới 40 %.

### Câu hỏi cho chủ dự án

1. **Nhịp đánh vần trên lớp 1B3 có đúng là "bờ – a – ba – huyền – bà" không** (đọc âm, không đọc tên
   chữ; thanh ngang không gọi tên; tiếng không âm đầu như "anh" chỉ đọc một lần)? Cần trả lời **trước khi
   sinh mp3 đợt 2**. Nếu khác, chỉ sửa `cadence()`.
   → **Đã trả lời 16/09: đúng nhịp này.** `cadence()` giữ nguyên.
2. `nham_am_dau` trong bộ mã lỗi đang gắn môn **ESL**, nhưng pha này (và gói `HV.DANH_VAN_TIENG` có sẵn)
   dùng nó cho tiếng Việt như đề bài dặn. Có muốn tách một mã riêng cho tiếng Việt không?
3. Tên hai bé trong kho tiếng viết thường ("thy", "thanh") để lắp được bằng mảnh chữ thường. Được không,
   hay muốn trò hiện chữ hoa riêng cho tên?
4. Có muốn đặt `E2E_ADMIN_PASSWORD` trong `.env` máy dev để ba test bàn thử (và e2e pha 11) chạy được?

## Pha 12 — 16/09/2026 — Bản đồ thành phố kiểu vành đai, sông và bến cảng, giao thông ngẫu nhiên

> **ĐÃ HOÀN TÁC trên production, chiều 16/09/2026.** Chủ dự án xem bản đồ mới trên máy thật:
> *"Bản đồ mới xấu quá, tôi muốn trở lại bản đồ cũ ô bàn cờ."* Commit `491f92e` được `git revert`
> (`fb57312`) — mã trở về **đúng bản pha 11** (so `9c8fa2d`, ngoài `docs/` không khác một byte).
> Pha 11 **giữ nguyên** trên production: migration `Word`/`WordProgress`, từ điển 262 từ, bản vá
> "Xong!" với 1552 bài kéo-thả đã ghi lại spec (`expect` 1552/1552, `accepts` 0).
> Cùng đi với bản đồ: đồng hồ mặt trời, sông/bến cảng/cầu, giao thông trên đồ thị đường, LOD ba
> mức, bản đồ giấy, thị trấn nhà Ecopark. Phần dưới đây giữ lại làm lịch sử; mã vẫn còn trong
> `491f92e` nếu muốn lấy lại từng phần (vd. đồng hồ mặt trời không phụ thuộc bản đồ).
>
> Hai bài học triển khai, ghi cho lần sau:
> - **Production là máy Ubuntu `192.168.1.102`**, không phải máy Windows này (máy này là dev,
>   DB riêng). Xem `host` trong `/api/health` trước khi kết luận đang nhìn máy nào.
> - **Đừng build image trên máy Ubuntu** (3,3 GB RAM, đĩa cơ, đã swap sẵn): mất ~25 phút. Build trên
>   máy dev **từ một `git worktree` sạch của đúng commit** (thư mục làm việc có thể đang có mã dở
>   của phiên khác), rồi `docker save | gzip | ssh … docker load` và `up -d` không `--build`.
> **Sửa tiếp trên bản ô bàn cờ, cùng chiều 16/09 (đã lên production, image `5710f71a03d3`):**
> - **Xe buýt rỗng** — lỗi ở `cbox` (khối bo góc dùng cho cả nhà lẫn xe): nắp quay úp nên bị bỏ lúc
>   nướng hình, đáy quay ngửa, pháp tuyến vách quay vào trong. Xe buýt chỉ là một khối nên thành cái
>   vỏ rỗng thấy cả sàn; nhà cửa đỡ lộ vì có mái riêng, nhưng các vách đang được chiếu sáng ngược phía
>   và các cục số trên nóc cũng rỗng. Sửa `780bbb3`, số tam giác không đổi; test `kit.test.ts`.
>   Trang `bench/agents` + `scripts/shoot-agents.ts` vẽ riêng từng mẫu xe/người ở 4 hướng.
> - **Xe và người đi vòng quanh một khối mãi** → giờ đi trên lưới đường, tới ngã tư chọn ngẫu nhiên
>   (thẳng 6 · rẽ 3 · quay đầu chỉ ở ngõ cụt; người đôi khi quay lại và dừng ngắm), ôm cua mượt, xe
>   đi bên phải, người trên vỉa hè; hạt giống theo thành phố + ngày (`engine/traffic.ts`).
> - **Đèn xanh đèn đỏ ở mọi ngã tư** (4 nhánh; ngã ba không có): cột đèn hai mặt, mỗi mặt một chiều
>   đường, chu kỳ 13 giây, luôn có ít nhất một chiều đỏ; xe dừng khi đỏ (và khi vàng nếu còn kịp),
>   xếp hàng sau xe trước, kể cả khi vừa rẽ qua góc. Thay 4 cột đèn trang trí cũ quanh toà thị chính.
> - 12 test giao thông; cả repo sạch trên bản checkout riêng: lint, build 4/4, test 7/7. Bench
>   60 khung hình/giây ở thành phố ngày đầu và cuối năm.
>
> **Tiếp, chiều 16/09 (image `d43ba739be05`, commit `46f82bb`):**
> - **Sân vườn cho mỗi nhà** (chủ dự án: *"Mỗi nhà có thêm đường đi vào, sân, tiểu cảnh"*): sân lát
>   trước cửa, lối ra mép lô, một món tiểu cảnh (hàng rào cây / hai khóm cây / luống hoa) ở phía máy
>   quay nhìn thấy; khoảng giữa mỗi khối lát thành **ngõ** — nhà nửa bắc có cửa nhìn ra ngõ. Đặt theo
>   nền nhà thật, không đặt gì cao hơn mặt lát vào dải người đi bộ (`build/garden.ts`, 5 test).
>   Vẫn trong trần 80k của ADR-20: Phố Chữ lớn nhất **79.922** (mặt lát là mặt phẳng, luống hoa rẻ,
>   một món mỗi lô, không trồng cây sau nhà vì máy quay không thấy).
> - **Cổng thành phố** luôn đứng ở đầu một con phố (trước đó ~9% các bước lớn lên nó đứng giữa cỏ,
>   ngay khi một vòng khối mới bắt đầu). **Đèn giao thông** chỉ thắp trong bán kính 100 quanh chỗ máy
>   quay nhìn, nên thành phố to mấy cũng đủ đèn. Xe ôm cua gọn hơn.
> - **Thành phố lớn tới đâu** (đo): kỹ năng có trần theo môn (≤ 102), huy hiệu có hạn; thứ tăng mãi là
>   ô đất (giá 20, 25, 30… sao). Hai bé kiếm ~35–43 sao/ngày học → ~18 ô/thành phố/năm nếu chia đều,
>   ~50 ô nếu dồn một thành phố (104 khối, khung nặng nhất ~170k tam giác — **vượt trần 80k**; máy dev
>   vẫn 60 khung/giây ở 280k). Không có trần cứng trong mã. Muốn giữ trần 80k cho thành phố lớn thì
>   phải đưa LOD về (mã trong `491f92e`) — chờ chủ dự án đo trên máy của hai bé.
> - Ổ máy chủ tụt còn 7,7 GB vì 30,9 GB bộ đệm build của lần build tại chỗ → đã `docker builder prune`,
>   còn 35 GB trống, health `ok`.
>
> - Trong container không có `dotenv`: chạy CLI bằng
>   `sh -c '. ./docker/env.sh; cd packages/db && ./node_modules/.bin/tsx src/cli/content-import.ts …'`
>   (không nạp `docker/env.sh` thì CLI trỏ `localhost:5432` và không vào được DB).

Trạng thái: **việc 1–7 xong trên máy dev, CHƯA deploy**. `lint` sạch, **toàn bộ test xanh**, `build`
xanh. Viết lại `layout.ts` (lõi pha 10) và phần nền/nước/đường của `compose.ts`; **hợp đồng dữ liệu
ADR-21 giữ nguyên** — `CityView`, `StudentCity`, `skillOrder`, luật mastery→nhà, sao→đất,
huy hiệu→công trình không đổi một chữ. ADR-23 ghi lại toàn bộ quyết định.

### Việc 1 — vành đai và nan quạt thay lưới vuông

Hồ ở giữa có từ ngày đầu, toà thị chính trên bán đảo bờ hồ. Vành đai r ở bán kính
`34 + (r−1)×26`, **méo theo một hình duy nhất của cả thành phố** (không phải mỗi vành một kiểu —
hai vành cạnh nhau phải chừa đủ chỗ cho một con đường) và **lệch tâm dần** theo một hướng riêng của
từng thành phố. Ô đất là mảnh hình thang; số ô mỗi vành tính theo **bề rộng ô cố định 13,5** chứ
không theo công thức `8+6r` của đề bài — với `8+6r`, vành ngoài thành dải cỏ rộng có một ngôi nhà
mỗi ba mươi mét, không giống ảnh tham khảo.

**Quy tắc ổn định giữ nguyên và có test cho cả sáu thành phố**: thêm 1 kỹ năng + 1 huy hiệu + 1 ô
đất → không công trình nào đang có đổi chỗ (toạ độ khớp tới 6 chữ số).

Không đều đặn hoá: đại lộ chéo (dây cung né hồ) biến ô nó cắt thành công viên; **mỗi vành đai bị hai
quãng xanh cắt ngang** (công viên + hồ nhỏ + rừng), và đoạn vành đai chạy qua quãng xanh là **đường
mòn** chứ không phải mặt nhựa — nhờ vậy vành đai không còn là vòng kín; cụm 4–6 toà cao tầng chỉ ở
hai cung sát hồ; nhà thấp tầng dựng thành **dải liền kề cùng hướng** theo cung.

Mỗi vành đai là một khu có tên riêng theo thành phố (Khu Bến Cũ, Đồi Hoa, Vườn Thiên Nga…), có biển
ở lối vào và tên trên bản đồ giấy.

### Việc 2 — sông, bến cảng, thuyền

Sông chạy chéo ở rìa (cách tâm ~5 vành đai, có khúc uốn), hiện từ ngày đầu. Bến cảng ở khúc gần
thành phố nhất: cầu tàu gỗ, cột buộc, nhà điều hành có đèn hiệu, cần cẩu, thùng hàng, thuyền neo.
**Cầu** dựng khi thành phố lớn tới bờ. Mỗi thành phố một tính sông (`RiverStyle`, là tham số):
âu tàu · sông hiền · cảng lớn · thuyền giấy · xà lan · ghềnh. Thuyền đi **không đều nhau** — mỗi
chiếc một tốc độ, cứ ba chiếc có một chiếc dừng thả lưới 9 giây rồi mới đi tiếp. Bến Cảng Từ vẫn
nhận thuyền theo số từ tiếng Anh con thuộc (nối từ pha 11).

### Việc 3 — xe, người đi ngẫu nhiên trên đồ thị đường

`roads: Set<string>` (ô lưới) đổi thành **đồ thị**: nút là ngã tư, cạnh là đoạn đường cong.
Xe tới nút thì **chọn đường theo trọng số** (thẳng 6 · rẽ nhẹ 3 · rẽ gắt 1,2 · quay đầu 0,05, chỉ
khi cụt), mỗi xe một tốc độ ±20%, chậm lại trong cua, dừng đèn ở chỗ đại lộ cắt vành đai; xe buýt
dừng bến; người đi bộ dừng ngắm. **Có hạt giống** theo `(studentId, cityId, ngày)` → tải lại trang
thành phố không nhảy loạn. Test: 200 bước không ai rời đường, cùng hạt giống cho cùng kết quả,
phân bố rẽ đúng trọng số, đường cụt thì quay đầu được.

### Việc 4 — đồng hồ mặt trời trên HUD

Cung mảnh vắt ngang phía trên; mặt trời đi trái→phải trong một ngày game, lặn rồi mặt trăng mọc đi
tiếp; nền cung đổi màu theo giờ. Chạm mặt trời → mascot nói giờ, **tiếng Anh ở Bến Cảng Từ**, dùng
mp3 sinh sẵn (`content/voice/city-lines.json`, nạp cùng `content:import` — 15 câu, ~350 ký tự).
Gộp luôn đề xuất treo từ pha 10b: **nâng ánh sáng môi trường ban đêm** (`Lighting.ambient` 0 ban
ngày → 0,3 ban đêm) nên màu nhà vẫn tươi khi trời tối.

### Việc 5 — hiệu năng và bản đồ giấy

Ô lưới bake **60×60**; **LOD ba mức** bake sẵn (đủ · bỏ chi tiết < 2,2 đơn vị · bóng khối ba mặt),
đổi mức theo khoảng cách camera (100 và 190); **bóng đổ chỉ trong hộp 90 đơn vị bám theo camera**;
tác nhân chỉ vẽ trong tầm nhìn. `maxDist` 124 → 108.

**Đo kịch bản "cuối năm"** (102 kỹ năng, 40 ô đất, 15 công trình, kỳ quan xong, nhộn nhịp 4, quét
camera khắp thành phố, iPad ngang + dọc), cả sáu thành phố: **57–64 draw call · 23,0–35,1k tam
giác** — dưới một nửa trần 150/80k. Test nằm trong `budget.test.ts`.

**Bản đồ giấy**: nút 🗺️ trên HUD mở bản đồ 2D vẽ bằng canvas — nước xanh, mảng xanh, đường trắng,
đường mòn kem, **dải nhà** (không phải chấm tròn), tên từng khu, chấm sáng ở sao tối nay; chạm một
khu thì camera bay xuống đó. Xem trước không cần trình duyệt:
`pnpm --filter @mtct/city exec tsx scripts/paper-map-svg.ts viet endOfYear`.

### Việc 6 — ảnh, tài liệu

18 ảnh bench (6 thành phố × ngày đầu/giữa năm/cuối năm) + ảnh bến cảng + ảnh ban đêm + bản đồ giấy,
trong `docs/screens/pha-12/`. Sáu ảnh đảo ngày đầu vẽ lại (`content/art/city/thumbs/*.webp`, 14–16
KB). ADR-23 mới; docs/06 §1.2 bổ sung; ADR-20 thêm bảng số đo mới.

### Việc 7 — Phố Chữ vẽ thành thị trấn thật của hai bé (chủ dự án giao thêm, tối 16/09)

Chủ dự án gửi ảnh bản đồ quy hoạch: *"Có 1 thành phố giống y hệt thế này, các con đang ở đây, vẽ
giống từng con đường, dòng sông, ngôi nhà, tên lấy theo đúng tên trên bản đồ"* — **đảo lại** ràng
buộc "không chép bản đồ thật, không dùng tên thật" ở đầu pha. Ghi vào ADR-23 mục 6 và vào README
của thư mục ảnh tham khảo.

- **Phố Chữ (`viet`) thành thị trấn nhà.** Chọn môn Tiếng Việt vì đó là môn nhiều kỹ năng nhất
  (102 — tức thị trấn cần nhiều đất nhất) và là thành phố hai bé vào nhiều nhất.
- **Bản quy hoạch là dữ liệu**, gõ tay bằng mắt từ bản đồ và ảnh vệ tinh
  (`packages/city/src/home-plan.ts`): sông Bắc Hưng Hải vắt ngang phía bắc, **Đường 379** chạy suốt
  từ tây bắc xuống đông nam, **các ngón kênh của The Island** ở phía tây với một con phố trên mỗi
  dải đất, **Hồ Thiên Nga** dài nằm giữa có đường ven hồ ôm quanh, **sân golf 18 lỗ** phía đông,
  **Aqua Bay** phía nam, **Park River** trên bờ sông, **Ecopark CBD** (cụm cao tầng) ở rìa tây,
  **Education HUB** ngay dưới sông, **Palm Springs**, **Dragon Islands**, **Khu Đồi Hoa**, **Học
  viện Golf EPGA**. Tên khu là tên thật trên bản đồ; **tỉ lệ mét thì không thật** — đúng hình dáng
  và thứ tự các khu, đây là phác thảo cỡ đồ chơi.
- **Luật ổn định không mẻ một chỗ nào.** Ô rơi xuống nước / xuống đường / vào sân golf / chồng lên
  hàng xóm bị loại **một lần, từ bản quy hoạch** (không bao giờ từ việc con học được gì), nên thứ tự
  phần còn lại cố định và nhà đã xây không dịch chỗ — có test riêng
  (`packages/city/src/home-plan.test.ts`, 10 test). `planReport()` in ra khu nào mất bao nhiêu ô, để
  lần sau sửa bản quy hoạch còn biết vì sao.
- **Sức chứa**: 185 ô, trong đó 124 ô nhà — đủ 102 kỹ năng Tiếng Việt và còn dư. Test canh mốc này.
- **Cách lớn lên cũng khác**: ở thị trấn nhà, **đường phố có đủ từ ngày đầu** (thị trấn thật thì đã ở
  đó rồi) và con xây **nhà** vào các lô trống dọc phố — ngày đầu là một thị trấn vắng chờ được ở.
  Năm thành phố kia vẫn mở thêm vành đai mới như cũ.
- **Năm thành phố kia**: chủ dự án cho phép *"có thể có con sông chảy qua giữa thành phố"*. Khi mở
  ra làm việc đó thì lòi ra **một lỗi thật**: thành phố cuối năm đang đặt **5–25 ngôi nhà giữa lòng
  sông** ở cả năm thành phố (bố cục không biết gì về sông). Đã sửa ba chỗ:
  1. ô nằm trong lòng sông thành **mặt nước**, không phải đất xây;
  2. đoạn đường vắt qua nước thành **cầu** (mặt cầu nâng, có lan can) thay vì nhựa sơn trên nước;
  3. đường sông **không còn đổi theo độ lớn thành phố** — nếu không, một ô khô tháng Mười có thể
     ngập vào tháng Năm, và nhà trên đó sẽ phải dọn đi.
  Và **một cửa duy nhất lấy nước của thành phố** (`cityWaterways`): trước đó cảnh 3D tự suy góc đại
  lộ từ đường đã vẽ — đường ấy chạy ngược chiều, nên **sông trong cảnh nằm ở phía đối diện** so với
  sông mà bố cục đã chừa chỗ. Giờ cả ba nơi (bố cục, cảnh 3D, bản đồ giấy) hỏi cùng một hàm.
- Hai chỗ nhỏ đi kèm: chạm vào một khu trên bản đồ giấy chọn **biển gần nhất** (không phải vành đai
  gần nhất — thị trấn nhà không xếp theo vành đai); **máy ảnh "về nhà"** đặt ở **toà thị chính**
  (tâm hình vuông của bản đồ, ở thị trấn nhà, là một cánh đồng bên kia hồ).
- Ảnh: `docs/screens/pha-12/thanh-pho-nha-viet.jpg` (3D) và
  `docs/screens/pha-12/ban-do-giay-viet-endOfYear.svg` (bản đồ giấy).

### Làm khác đề bài (đã ghi trong ADR-23)

1. **"Khung hình rộng nhất chạm tối đa 9 ô"** — không đạt được với ô 60×60 và camera nghiêng 27°:
   hình chiếu khung nhìn là hình thang dài, chạm ~18 ô. Muốn đúng 9 thì phải dùng ô 100×100 (cắt
   LOD thô, lọc lỏng) hoặc kéo camera còn dist 80 (con mất cảm giác thành phố). Thứ mà luật này bảo
   vệ là **số draw call** và số đó đo được là 57–64/150, nên giữ ô 60 và ghi rõ lý do.
2. **Số ô mỗi vành đai** theo bề rộng cố định thay vì `8+6r` (lý do ở việc 1).

### Cần chủ dự án

1. **Nhìn từ trên xuống vẫn hơi "vòng tròn đồng tâm"** — chủ dự án đã nói và tôi đồng ý. Đã làm
   được: lệch tâm dần, một hình méo chung, hai quãng xanh cắt mỗi vành, đoạn qua công viên thành
   đường mòn, và trên bản đồ giấy nhà vẽ thành dải chứ không phải chấm. Trong 3D (góc con chơi) đã
   đỡ hẳn; nhìn thẳng từ trên vẫn thấy các vòng. Bước tiếp nếu chủ dự án muốn: **chia ô trong từng
   cung thành khối nhỏ bất quy tắc có ngõ cụt** (như khu nhà thật) thay vì nan quạt đều — khoảng
   nửa ngày, và là pha 12b. **Riêng Phố Chữ thì việc 7 đã giải xong chuyện này** — nó vẽ theo bản đồ
   thật nên không còn vòng nào; nếu chủ dự án thấy thị trấn nhà dễ nhìn hơn hẳn thì tôi vẽ tay bản
   quy hoạch cho cả năm thành phố kia theo cùng cách (mỗi thành phố ~nửa ngày).
2. **Chưa deploy.** Khi deploy: `pnpm build` rồi `docker compose -f docker/compose.yml up -d --build`;
   không cần migration (pha 12 không đụng DB), nhưng vẫn cần lệnh của pha 11 nếu máy chủ chưa chạy:
   `pnpm db:migrate` + `pnpm content:import` + `pnpm content:import --respec --no-tts`.
3. Bốn bản vá QC của pha 11 **vẫn chưa lên production** (bản vá kéo-thả chạm 512 bài hai bé gặp mỗi
   tối) — vẫn chờ chủ dự án gật.
4. Ảnh tham khảo trong `docs/screens/pha-12/tham-khao/` là ảnh bên thứ ba; nếu có lúc nào mở repo ra
   công khai thì xoá thư mục đó trước (README trong thư mục đã ghi).

## Pha 11 — 16/09/2026 — Bến Cảng Từ: trò chơi từ vựng tiếng Anh (+ 4 bản vá QC)

Trạng thái: **việc 1–5 xong trên máy dev, CHƯA deploy** (theo yêu cầu chủ dự án). `pnpm lint` sạch
(14 cảnh báo cũ), `pnpm test` 592 test xanh, `pnpm build` xanh, `content:validate` sạch.

### Việc 1 — bốn bản vá QC (commit `db8bd85`, `43e9f53`, `2349af8`, `b5a6b3c`)

**a) Nút "Xong!" của bài kéo thả bấm được quá sớm.** Luật cũ là "mỗi giỏ có ít nhất một thẻ", mà
**573/1552 bài có giỏ cần từ 2 thẻ trở lên** — con thả một thẻ mỗi giỏ là nút sáng, nộp nửa chừng,
bị chấm PARTIAL **và bị ghi một mã lỗi oan vào `Evidence`** (thứ mà planner và thang rèn đọc hôm
sau). Hai lớp khoá:

- `ExerciseSpec` nay nói cho máy con **số thẻ mỗi giỏ** (`dropZones[].expect`, lấy từ answerKey) và
  **không còn gửi `accepts`** — trường này hẹp đáp án lại cho bất kỳ ai đọc payload. Luật sáng nút
  tách thành hàm thuần `dragReady` có test.
- Server coi lượt nộp thiếu — giỏ còn chờ, chưa có thẻ nhiễu nào trong giỏ — là **lời nhắc**
  (`stage: "nudge"`): mascot nói một câu ấm, **không ghi `Attempt`, không tính lượt, không mã lỗi**.
- `pnpm content:import --respec` (cờ mới) ghi lại `spec` cho bài có *hình dạng* spec đổi mà chữ
  không đổi: so từng spec, chạm đúng **1552 bài kéo thả**, 9180 bài còn lại không đụng.

**b) Đồng hồ game.** Bản 15 phút chia đều 24 giờ ⇒ **6 phút mỗi ngày game là đêm**: buổi học 12 phút
vẫn tối gần 4/10 thời gian, lại tối ngay giữa bài, và con mở màn vào lúc nào là hên xui. Nay **24
phút một ngày game, mở màn 8 giờ sáng tính từ `Session.startedAt`** (ổn định qua tải lại, giống nhau
ở mọi màn), nhịp không đều: 55% ban ngày, rồi chiều vàng, hoàng hôn, **đêm chỉ ~10%**. Bảng ánh sáng
không đổi. Đề xuất "nâng ánh sáng buổi tối" của pha 10b **bỏ** — nguyên nhân là nhịp, không phải màu
(ADR-21 đã ghi).

**c) `ops:export` lại xoá trắng `QUYET-DINH.md`** sáng 16/09. Nguyên nhân thật: container worker trên
**máy dev** dựng từ 12/09, chạy image trước bản vá và không có mount `docs/`. Nhưng bản vá cũng chưa
đủ chặt: nó chỉ giữ file cũ khi *không tìm thấy* thư mục docs; tìm thấy mà đọc không ra ADR nào thì
vẫn ghi đè bằng file rỗng. Nay chỉ ghi đè khi **dựng lại được ADR thật**, kèm cảnh báo trong
SUMMARY.md nói rõ là "không có thư mục" hay "có thư mục nhưng rỗng". Đã dựng lại container dev
(`docker compose … up -d --build`) và khôi phục QUYET-DINH.md.

**d) `content:validate` chặn emoji chưa có tranh.** Trước đây không có khâu nào kiểm, nên bài mới
dùng emoji lạ sẽ âm thầm quay về emoji chữ bé tí (lỗi pha 10b đã sửa). Nay: emoji Noto có mà chưa
vendor → **lỗi**, kèm câu nhắc `pnpm art:emoji`; ký tự hình học Noto không vẽ (▬ ⬢ ◤) → cảnh báo, vì
chúng cố tình hiện dạng chữ. Việc này lại lòi ra một lỗi nữa: `art:emoji` tra cả cụm "🦗🎶" như một
khoá nên **mất cả hai** emoji của cảnh nhỏ; nay tách theo grapheme như `Picture` (414 → 480 tranh).

### Việc 2 — từ điển hình `content/lexicon/esl.json`

**262 từ / 28 kỹ năng `ESL.VOC.*`** còn hiệu lực, lấy đúng danh sách từ trong bản đồ kỹ năng (Global
Stage 1). Mỗi từ: chữ tiếng Anh, nghĩa Việt, tranh Noto, **một cụm câu mẫu** en + vi, unit khi có.
Ba kỹ năng đã ngừng dùng (WEATHER, DAYS_OF_WEEK, TRANSPORT) **không có từ nào** — validator chặn.
Phủ cả 9 kỹ năng VOC trước đây trắng bài: FEELINGS, HOUSE_ROOMS, JOBS, PLACES_TOWN, NATURE,
DAILY_ROUTINES, JOB_VERBS, PARTIES, TABLEWARE.

- Schema + kiểm định trong `packages/content/src/lexicon.ts`; `content:validate` kiểm kỹ năng còn
  hiệu lực, tranh có thật, id không trùng.
- TTS: **~6.400 ký tự** cho 262 từ + 262 cụm câu, giọng `en-US-AnaNeural` — khoảng **1,3%** hạn mức
  tháng (đang dùng ~31%).
- Nhân tiện sửa một lỗi cũ: `isActive` trong file bản đồ kỹ năng bị Zod bỏ đi, nên **mỗi lần
  `content:import` là ba kỹ năng ngừng dùng lại sống lại** trong DB. Nay file quyết định.

### Việc 3 — `WordProgress` + lịch Leitner (ADR-22, migration `20260916110000`)

Bảng dữ liệu học **mới duy nhất** kể từ pha 10. Thang 1-3-7-14-30 ngày, thuần trong
`packages/core/src/vocab/leitner.ts`: nhận ra → lên bậc; chưa nhận ra → **về bậc 1, gặp lại ngày
mai** (không "sai", không trừ gì); **một tối chỉ lên một bậc** — giãn cách là lý do bảng này tồn tại.
`Word` là nội dung (trình nạp ghi), `WordProgress` là của con: đã thêm vào `FORBIDDEN_TARGETS` của
`ops/requests`, và `ops:export` có thêm `word-progress.csv` **chỉ đọc**.

### Việc 4 — sáu trò chơi (`components/kid/vocab/`)

Nghe-chạm tranh · lật thẻ ghép đôi · cái gì biến mất · chợ nhỏ theo cụm câu · ghép chữ cái · nói to
(có đường lui "cùng ba mẹ" khi máy không nghe được). Chạy ở **cả hai thế giới** vì đi qua
`ExercisePlay`. Mỗi lần gặp từ báo về ngay `POST /api/kid/vocab` (không chờ hết ván), server mới là
nơi quyết định bậc; màn của con không bao giờ thấy số bậc. Một sao cho cả trạm theo ADR-16, khoá theo
trạm nên tải lại không trả hai lần.

### Việc 5 — planner, Sổ từ, bến cảng

- `vocabStations` đổi tối đa **2 trạm/tối** của kỹ năng VOC thành trò chơi, chọn trò **khác lần
  trước** cho cùng kỹ năng; kỹ năng chưa có từ thì giữ nguyên bài thường.
- Trạm đã chơi trong ngày được coi là xong (đếm `WordProgress.lastSeenAt` hôm nay), vì trò chơi không
  sinh `Attempt`.
- **Sổ từ** `/kid/so-tu` (vào từ màn nhà): chỉ những từ con đã gặp, theo chủ đề, chạm để nghe lại và
  xem cụm câu. Không phần trăm, không mục tiêu, không so sánh hai bé.
- **Thuyền cập cảng**: mỗi từ đạt bậc 4 trở lên kéo một chiếc thuyền vào Bến Cảng Từ (tối đa 4).

### Cách chạy thử trên máy dev

```
pnpm content:validate && pnpm content:import --dir content/lexicon   # 262 từ + mp3
pnpm dev                                                            # rồi mở:
#   /dev/vocab?game=listen-touch   (đổi game=match-pairs|what-vanished|market|build-word|say-it)
#   /kid/so-tu                     (Sổ từ của con)
pnpm --filter @mtct/web exec playwright test e2e/phase11-vocab.spec.ts   # cần E2E_ADMIN_PASSWORD
```

### Chưa làm / cần chủ dự án

1. **Chưa deploy** — đúng như yêu cầu. Khi deploy cần chạy `pnpm db:migrate` (migration mới) và
   `pnpm content:import` trên máy chủ, cộng **`pnpm content:import --respec --no-tts`** để 1552 bài
   kéo thả trên production có `expect`.
2. **Bốn bản vá của việc 1 chưa lên production**, trong đó bản vá kéo-thả-bị-treo chạm **512 bài hai
   bé đang gặp mỗi tối**. Đề nghị deploy riêng phần vá (thế giới cũ vẫn mặc định) — **cần chủ dự án
   gật**.
3. **Chưa xem bằng mắt**: tôi không đăng nhập bằng tài khoản của gia đình, nên sáu trò chơi mới chỉ
   được kiểm bằng test và bằng việc các trang biên dịch/redirect đúng. Chủ dự án mở `/dev/vocab` (đăng
   nhập admin) xem sáu trò rồi cho ý kiến trước khi hai bé chơi.
4. Docker Desktop trên máy dev treo ~40 phút khi dựng lại image (một vmmem chiếm 20 GB); các container
   `medifa-*` khác bị khởi động lại theo. Không mất dữ liệu, nhưng nên dựng image vào lúc máy rảnh.

## Pha 10b — 15/09/2026 — Chỉnh hình thành phố, sửa lỗi nhỏ, deploy pha 10 lên Ubuntu

Trạng thái: **việc 1–6 xong, đã deploy** — `edu.medifa.vn` chạy code pha 10b với `migrations: 8`,
`host: ubuntu-edison`, **vẫn thế giới cũ** cho hai bé (không đặt `KID_UI`). Mỗi việc một commit, không push.

### Việc 1 — thành phố ngày đầu không còn là công trường (commit `42e4ff4`)

- Luật mới trong `packages/core/src/city/rules.ts`:
  - kỹ năng mức 0 không cần giúp (chưa attempt, hoặc mastery < 40 mà không lỗi lặp) → **"mầm nhà"**:
    ô đất xanh gọn, hàng rào trắng thấp, một cây con, biển tên nhỏ; không khung gỗ, không thợ;
  - giàn giáo + thợ **chỉ** khi cần giúp (`remediationActive`, `errorCount7d ≥ 2`, `NEEDS_PRACTICE`), **tối
    đa 3** cái (`MAX_SCAFFOLDS`), ưu tiên lỗi nhiều nhất; kỹ năng yếu còn lại vẽ ở bậc thường.
- Test: 20 kỹ năng chưa attempt → 0 giàn giáo; 6 kỹ năng cần giúp → đúng 3 (đúng 3 kỹ năng lỗi nhiều nhất).
- Lô trống dự phòng dùng nhà nhỏ chi tiết hoặc vườn thay cho khối cao ốc sơ sài → trần tam giác xấu nhất
  **giảm** từ 79,5k xuống 74,6k (Phố Chữ).
- 6 ảnh đảo vẽ lại từ mẫu `size=start` mới. Ảnh: `docs/screens/pha-10b/ngay-dau-vmath.jpg`,
  `ngay-dau-viet.jpg`; màn thật `docs/screens/pha-10/c2-city-stars.png` (chỉ còn 1 giàn giáo).

### Việc 2 — màu theo bảng phong cách (commit `218c1c4`)

- Đường `0x8793a8` → **`0xB9B3A8`** (xám ấm sáng), lề `0xFFF3DD` giữ.
- Toà chọc trời Thành Số: bỏ khối kính lớn (shader kính phản trời nên trông gần navy) → **tầng pastel xen
  kẽ xanh ngọc / kem / hồng phấn** + dải cửa sổ sáng từng tầng, viền vàng giữ nguyên.
- Bảng màu công trình (mái, tường, khối) nhân **cùng hệ số bão hoà ×1,18** như bảng phong cách
  (`styleColour` trong `palette.ts`); test "≥ 3 mái, ≥ 4 tường mỗi khu phố" giữ nguyên và xanh.
- Ảnh đối chiếu **`docs/screens/pha-10b/so-sanh.jpg`** (trái: `thanh-so.jpg`; phải trên: engine
  `size=full`, phải dưới: `size=start`, cùng giờ 10:00). Trước khi sửa: `truoc-vmath-full.jpg`.
- **Tôi tự nhìn, còn lệch ở:**
  1. **Ánh sáng buổi tối** — lệch lớn nhất, và nằm ngoài bảng màu. Engine đổi sáng theo **giờ thật**; hai
     bé học 18–21 giờ nên thành phố ở ánh hoàng hôn/đêm, tối và xỉn hơn hẳn bảng phong cách (chụp ban
     ngày). Ảnh pha 10 cũ chụp buổi tối, nên đây có lẽ là phần lớn cái "xỉn" chủ dự án thấy. Chưa sửa vì
     "ngày/đêm theo giờ thật" là quyết định đã chốt. **Đề xuất:** giữ trời tối nhưng nâng ánh sáng môi
     trường buổi tối để màu nhà vẫn tươi. Cần chủ dự án gật.
  2. Cỏ engine hơi vàng chanh, rừng thưa hơn bảng (bảng có rừng dày bao quanh).
  3. Cao ốc bảng phong cách chủ yếu vàng/cam kính xanh; engine giờ là pastel ngọc/kem/hồng (theo yêu cầu),
     nên khác bảng về tông nhưng không còn xanh đậm.
  4. Đường engine giờ sáng hơn đường của bảng (bảng là xám xanh vừa) — đúng yêu cầu "xám ấm sáng".

### Việc 3 — ba chỗ nhỏ trên màn thành phố (commit `179d622`)

- Thẻ chọn xây: **ảnh render thật** của từng công trình (`pnpm --filter @mtct/city shoot:builds` →
  `content/art/city/builds/*.webp`, 13–21 KB, 10 ảnh), thẻ to hơn, ảnh chiếm ~73% thẻ (e2e kiểm ≥ 60%).
  Ảnh: `docs/screens/pha-10/c6-choose-build.png`.
- Bong bóng mascot **ẩn khi có bảng mở** (bảng bài hoặc bảng chọn xây); e2e kiểm bong bóng không hiện dưới
  bảng.
- Nút "ba mẹ" góc bản đồ: trên **bản build production** (`next start`) không có huy hiệu dev của Next,
  không bị gì chồng — e2e lấy `elementFromPoint` ở tâm nút và trúng đúng nút; nút to hơn (72 px) để chữ
  không tràn (`docs/screens/pha-10/c1-world-map.png`).

### Việc 4 — `ops:export` ghi đè QUYET-DINH.md (commit `2899eef`)

- **Nguyên nhân**: `.dockerignore` loại `docs/` khỏi image. Worker trong container tìm được gốc repo (có
  `pnpm-workspace.yaml`) nhưng không có `docs/02-KIEN-TRUC.md`, rồi ghi dòng lỗi vào `ops/context/` của
  máy chủ qua bind mount. Không phải do cwd.
- **Sửa**: `docsRoot()` tìm lần lượt `DOCS_ROOT`, `docs/` ở gốc repo, `docs/` cạnh thư mục ops (không
  phụ thuộc cwd); compose mount `../docs:/data/docs:ro` cho worker (đã kiểm trên Ubuntu: worker thấy
  `/data/docs/02-KIEN-TRUC.md`). Nếu vẫn không đọc được: **giữ nguyên QUYET-DINH.md cũ**, giữ nhãn pha
  của HIEN-TRANG.md lần trước, ghi cảnh báo vào SUMMARY.md. 3 test mới (thiếu docs, khác cwd, `DOCS_ROOT`).
- QUYET-DINH.md đã khôi phục (git checkout rồi chạy lại export, nay có thêm ADR-19–21).

### Việc 5 — dọn 8 file treo (commit `f5221d3`)

`content:validate` sạch; 4 gói emath giống hệt khi rút gọn JSON (41/40/36/39 bài, không đổi); esl.json,
nhat-ky, ops/context vào một commit.

### Việc 6 — deploy pha 10 lên Ubuntu, thế giới cũ vẫn chạy (commit `b7a2717`, `18b6bdb`)

**Bật thử riêng một máy**: `/admin/health` có thẻ "Giao diện của con trên máy này" với nút **"Bật thành
phố trên máy này"** / **"Tắt"** (chỉ ADMIN). Nút ghi cookie `mtct_ui=city` (httpOnly, 30 ngày, còn sau
khi đăng xuất). Máy chủ đọc cookie trước rồi mới tới `KID_UI`. Test đơn vị: cookie thắng env cả hai chiều;
không cookie → env. E2E: có cookie → bản đồ 6 đảo, trình duyệt khác → thế giới cũ.

**Triển khai** (SSH khoá như pha 9; **không push** — commit chuyển lên bằng `git bundle` qua `scp`):

1. Máy chủ đang ở `31e60f2` có vài sửa tay (trường `host`, bind loopback, gói nội dung). Đối chiếu: tất
   cả đã có trong `master`, riêng nhật ký/esl chỉ khác tên bé. Lưu `~/pre-pha10b-20260915-2235.patch`,
   `git stash`, fast-forward tới `18b6bdb`.
2. Sao lưu DB trước: `~/pre-pha10b-20260915-2235.dump` (2,8 MB).
3. **Build lần đầu hỏng** — lỗi có sẵn từ pha 10 (chưa ai build image): Dockerfile không chép
   `packages/city/package.json` nên thiếu `three`, và image dùng bản `public/art` cũ nằm sẵn trong thư mục
   máy chủ (không có `art/city`). Sửa Dockerfile (`18b6bdb`): chép package city và chạy `art-sync` trong
   image. Lúc build hỏng, container cũ vẫn chạy nên web không gián đoạn.
4. `docker compose up -d web worker`: web tự `prisma migrate deploy` (2 migration mới) + seed idempotent.
5. `content:import` trong container: `exercises: 0 new, 1 updated` (bài `enl-syll-0034` đổi tên), TTS sinh
   104 câu còn thiếu mp3 từ pha 9 (hạn mức tháng 30%). Lưu ý: lần chạy thật báo `lessons: 107 updated`
   dù dry-run báo `unchanged`. Nội dung bài học không đổi; có lẽ bộ nạp ghi lại dòng — chưa tìm hiểu thêm.

**Xác nhận**:

| Kiểm | Kết quả |
|---|---|
| `curl https://edu.medifa.vn/api/health` | `status: ok`, `host: ubuntu-edison`, `db.migrations: 8`, worker ok |
| Tên bé trong DB | `thy → Mai Thy`, `thanh → Chí Thanh` |
| `KID_UI` trong `.env` Ubuntu | không đặt → **thế giới cũ** |
| `/login` trên domain thật | trang đăng nhập thế giới cũ, thẻ "Mai Thy" |
| Ảnh thành phố được phục vụ | `/art/city/thumbs/vmath.webp` 200, `/art/city/builds/house.webp` 200, `kenney.bin` 200 |
| `/kid/city`, `/admin/health` khi chưa đăng nhập | 307 về `/login` |
| Bật cookie trên một trình duyệt → bản đồ 6 đảo | **Đạt trên máy dev** (e2e). **Trên domain thật cần chủ dự án bấm**: tôi không đăng nhập bằng mật khẩu admin hay mã hình của con |

`/etc/sudoers.d/010-deploy-temp` **giữ nguyên**, không gỡ.

### Việc 7 — kiểm tra

- `pnpm lint` xanh (chỉ cảnh báo cũ) · `pnpm test`: core 245, db 128, web 49, city 47, content 67,
  inbox 18 · `pnpm build` xanh.
- `e2e/phase10-city.spec.ts` **3/3 xanh trên bản build production** (4 trạm × 3 bài, chọn xây có ảnh thật).
- Thế giới cũ `login.spec.ts` + `phase3-acceptance.spec.ts` **9/9 xanh** trên máy chủ `KID_UI=world`. K4
  chỉ kiểm màn ăn mừng vì Daily Quest hôm nay của Mai Thy đã xong từ lần chạy trước.
- `phase10b-ui-cookie.spec.ts`: kiểm cookie xanh; phần bấm nút admin **bỏ qua** vì `.env` không có
  `E2E_ADMIN_PASSWORD`. Chủ dự án thêm biến đó thì test tự chạy cả luồng nút.

### Chủ dự án cần làm

1. **Đo bench trên iPad của con** (ADR-20): mở https://claude.ai/artifact/RMeiUU6jNn2rPNWzdaVKSy trên iPad, bấm "Đo 20 giây", gửi số. Pha 10 đã chốt
   "chạy trên web" nên ngân sách hiện chỉ là lưới an toàn. Nay ba định mở trên iPad, nên số đo iPad lại
   quyết định: **dưới 50 fps trung bình, hoặc 5% chậm nhất dưới 40 fps**, thì phải xem lại đường WebP.
2. **Test với hai bé** (việc 5 pha 10): trên iPad của con, ba đăng nhập admin → `/admin/health` → "Bật
   thành phố trên máy này" → đăng xuất → con đăng nhập, chơi một buổi có người lớn ngồi cạnh, quay video 2
   phút, chấm checklist `docs/06` §4 (mục 13). Máy khác của nhà vẫn thế giới cũ.
3. Gật hay không cho đề xuất **nâng ánh sáng buổi tối** (việc 2, mục lệch 1).

## Pha 10 — 15/09/2026 — Thế giới Học Đường: thành phố 3D *(việc 1–4 xong, việc 5 cần hai bé)*

Trạng thái: **việc 1 đã duyệt; việc 2, 3, 4 xong** (gồm phần bổ sung "cách chơi" và hai yêu cầu giữa
chừng: bỏ nghỉ vận động, đổi tên gọi hai bé). Giao diện thành phố chạy sau cờ `KID_UI=city`; mặc định
`world` vẫn là thế giới cũ. **Việc 5 (nghiệm thu với hai bé, video 2 phút) cần chủ dự án.**

### Việc 4 — màn hình thành phố + bổ sung "cách chơi" (15/09)

Thiết kế: `docs/06` §1.2b (mới). Quyết định dữ liệu: ADR-21 mục "Bổ sung 15/09".

**Cách chạy thử (máy dev):** thêm `KID_UI=city` vào `.env` rồi `pnpm dev` (hoặc cấu hình `web-city` trong
`.claude/launch.json`, cổng 5001) → `/login` → thẻ **Mai Thy** → 4 hình → bản đồ 6 đảo. Tắt cờ (hoặc
`KID_UI=world`) là về thế giới cũ ngay, không cần build lại dữ liệu.

Đã làm:

- **Bản đồ thế giới** `/kid/city`: một mặt biển, 6 đảo xếp vòng quanh mascot. Mỗi đảo có biểu tượng môn
  và ảnh thành phố **của chính con** lúc rời đi (lưu theo từng bé trên trình duyệt; chưa ghé thì ảnh ngày
  đầu). Đảo có việc tối nay (môn trong Daily Quest, bài cô giao, thành phố đang làm dở) lấp lánh kèm
  "⭐ số trạm"; đảo khác yên; xong thì ✓. Chạm đảo → bản đồ phóng vào đảo → camera thành phố bay từ trời
  xuống. `/kid/home` chuyển về đây khi cờ bật.
- **Thành phố** `/kid/city/[city]`: **3–4 sao trên nóc** các công trình của trạm tối nay; toà thị chính có
  📜 khi có bài cô giao; hàng sao trạm trên HUD; sao kế tiếp to và nhấp nháy. Chạm công trình khác → thẻ
  tên kỹ năng + mức, đọc to. Chạm sao → camera tới (0,6 s) → **bảng trượt lên ~76% màn hình**, thành phố
  mờ phía sau → 6 component bài hiện có (tách thành `components/kid/exercise-play.tsx`, dùng chung với
  thế giới cũ) → hết bài của trạm → bảng hạ → công trình mọc tầng trước mắt (2 s, tiếng, confetti) →
  camera lùi ra, sao kế tiếp ở giữa màn hình. **URL không đổi suốt buổi** (e2e kiểm).
- **Xong phiên**: gọi `/api/sessions/:id/finish` → camera bay một vòng, sao đếm vào túi → ăn mừng công
  trình công cộng/kỳ quan mới → có ô đất trống thì **chọn 1 trong 3 công trình hình to** (hoặc "Để sau")
  → nhà mọc → "Về bản đồ" / "Chơi thêm" (`POST /api/kid/city/again`).
- **Engine**: thành phố mới chỉ 2 khu phố (`MIN_BLOCKS` 2, 1 ô khoá "N★"); màu theo lô (≥ 3 mái, ≥ 4 tường
  mỗi khu phố, test); bậc tăng trưởng trong mức (`step`); `hold/rise`, `home()`, `tour()`, `snapshot()`.
  Ảnh đảo ngày đầu vẽ lại từ engine (`content/art/city/thumbs/*.webp`, ~35 KB).
- **Dữ liệu**: `planStations` (core, 6 test) + `stepFor`; `cityRead` trả trạm của phiên; `worldRead` đếm
  trạm còn lại; `planCitySession(..., { again })`. **Bỏ** `POST /api/kid/city/practice` (luật mới: công
  trình không sao thì không mở gì).
- **Bỏ nghỉ vận động 30 giây** ở cả hai thế giới (theo yêu cầu 15/09): xoá `MovementBreak`,
  `/api/kid/break`, cập nhật `docs/06` §1.5b, §1.8b, checklist §4.
- **Đổi tên gọi**: "Thy" → **Mai Thy**, "Thanh" → **Chí Thanh** trong code, nội dung bài (`RF.SYLLABLES`
  "Chí Thanh: 2 claps", `esl.json`), seed, tài liệu; dữ liệu qua migration
  `20260915200000_rename_kid_nicknames` (có điều kiện theo giá trị cũ). Máy dev đã chạy.
- **Sửa lỗi có sẵn phát hiện nhờ e2e**: bài **đếm** và **kéo thả** ném lỗi Framer Motion ("chỉ 2 keyframe
  với spring") ngay khi con chạm → bài đứng im. Đã sửa ở cả hai thế giới. Lớp phủ phản hồi và sao bay
  giờ vẽ qua portal nên không bị kẹt trong bảng trượt.

Tiêu chí xong (docs/08 pha 10 + bổ sung):

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | Mai Thy vào bản đồ 6 thành phố → Thành Số → nhiệm vụ ≥ 3 dạng → xong → mở đất + công trình mọc + ăn mừng | **Đạt** — `e2e/phase10-city.spec.ts`: 4 trạm × 3 bài, dạng kéo thả / chọn / đếm / nghe; vòng bay; chọn xây (ảnh `docs/screens/pha-10/c1…c7`) |
| 1b | Đúng 3–4 sao; chạm sao → bảng lên, làm 3 bài, bảng xuống, nhà mọc tầng trước mắt; hết 4 trạm → mở đất → chọn xây; không rời màn thành phố | **Đạt** — e2e kiểm số trạm 3–4, `data-mode`, URL không đổi |
| 2 | Mastery đổi → công trình đổi lần mở sau; lỗi nhiều → giàn giáo + thợ | **Đạt** (test tích hợp việc 3 + `stepFor`). Phần "chạm giàn giáo mở phiên TARGETED" **đã thay** theo bổ sung: công trình không sao không bấm được |
| 3 | Huy hiệu → công trình công cộng; tuần 4/7 → mảnh kỳ quan | **Đạt** — test core/db; màn thành phố ăn mừng khi thấy thay đổi |
| 4 | 60 fps web, không màn nào chờ > 1,5 s | **Đạt trên máy dev** — thành phố sẵn sàng 1,5–1,7 s đo trong e2e (gồm tải three.js lần đầu), ngân sách ≤ 150 draw call / ≤ 80k tam giác vẫn giữ (test) |
| 5 | Không "sai", không đỏ, không đồng hồ, không tiền | **Đạt** — e2e quét chữ trên mọi màn thành phố/bảng bài |
| 6 | Cờ `KID_UI` bật/tắt hai chiều, thế giới cũ vẫn chạy | **Đạt** — test `ui-mode`; e2e thế giới cũ (`login`, `phase3` K1→K7) xanh trên máy chủ `KID_UI=world` |
| 7 | docs/06 + ADR + README Kenney | **Đạt** — `docs/06` §1.2b, ADR-20, ADR-21 (+ bổ sung) |
| 8 | lint/test/build xanh, e2e cũ xanh | **Đạt** — lint xanh (chỉ cảnh báo cũ); test: core 242, db 125, web 47, city 47, content 67, inbox 18; build xanh |

Tồn đọng / cần chủ dự án:

1. **Việc 5**: chạy thử có giám sát với hai bé, quay video 2 phút, chấm checklist `docs/06` §4 (mục 13 mới).
2. **Triển khai Ubuntu**: `pnpm db:deploy` (2 migration: `phase10_city`, `rename_kid_nicknames`), `pnpm content:import`
   (bài `RF.SYLLABLES` đổi tên), thêm `KID_UI=city` vào `.env` khi muốn bật. Tôi không tự triển khai.
3. Test `content/import.test.ts > never writes a child's learning data` đếm dữ liệu toàn DB nên thỉnh thoảng
   đỏ khi chạy song song với test khác ghi bằng chứng; chạy lại thì xanh (có từ trước pha 10).
4. `content/skill-map/esl.json`, `docs/nhat-ky-chay-that.md` và vài gói bài `emath` đang có thay đổi **từ
   trước phiên này** chưa commit; tôi đã đổi tên trong hai file đầu nhưng **không commit** chúng để khỏi gộp
   thay đổi không phải của tôi.

### Việc 3 — nối dữ liệu học vào thành phố (15/09)

Quyết định: `docs/adr/ADR-21-du-lieu-thanh-pho.md`.

- **Hàm thuần `packages/core/src/city/rules.ts`** (20 test):
  - mastery → mức công trình (0–39 / 40–59 / 60–84 / 85+; MASTERED giữ ≥ 30 ngày → chọc trời);
  - sao **đã kiếm** theo môn → ô đất (20, 25, 30 … sao, **không trừ sao**);
  - huy hiệu → công trình công cộng theo thứ tự riêng từng thành phố;
  - tuần ≥ 4 ngày học → mảnh kỳ quan (không reset);
  - streak → mức nhộn nhịp; đồ sưu tầm → vật trang trí; thú cưng → con vật; bài cô giao → đơn toà thị
    chính;
  - nhãn biển nhà; thứ tự lô chỉ nối thêm; công trình mở theo độ vững; phát hiện thay đổi để ăn mừng.
- **Schema** (migration `20260915114558_phase10_city`, đã gỡ dòng Prisma định xoá chỉ mục full-text):
  - cột `SkillMastery.masteredSince`, điền sẵn từ lịch sử cho các dòng đang MASTERED, và được giữ đúng ở
    cả 4 chỗ ghi mastery;
  - **bảng `StudentCity`** (thứ tự lô, lựa chọn xây của con, lần cuối con xem). Đây là bảng mới duy nhất;
    lý do ở ADR-21.
- **`packages/db/src/city`**: `cityRead`, `worldRead`, `markCitySeen`, `choosePlotBuild`,
  `startCityPractice`, `starsBySubject` — 6 test tích hợp trên Postgres thật (học sinh tạm).
  `StudentCity` đã vào công cụ xoá dữ liệu học và file xuất dữ liệu một bé.
- **API** (mọi route kiểm `requireStudentAccess`, chỉ nhận định danh, máy chủ tự tính lại):
  - `GET /api/kid/world`, `GET /api/kid/city?city=`;
  - `POST /api/kid/city/seen`, `POST /api/kid/city/plot`;
  - ~~`POST /api/kid/city/practice`~~ (con chạm giàn giáo → phiên TARGETED) — **đã bỏ ở việc 4** theo
    luật "chỉ công trình có sao mới bấm được".
- **Sửa kèm**: `kidHome` chỉ đọc phiên `DAILY_QUEST` (trước đây phiên TARGETED trong ngày sẽ bị hiểu
  nhầm là nhiệm vụ hôm nay).
- **Test hợp đồng** `packages/city/src/contract.test.ts`: mọi mã core sinh ra đều có trong catalogue
  engine vẽ được.

Cần làm khi triển khai lên Ubuntu: `pnpm db:deploy` (migration mới). Tôi không tự triển khai.

### Việc 2 — engine `packages/city` (15/09)

Bench cho iPad: https://claude.ai/artifact/RMeiUU6jNn2rPNWzdaVKSy · ảnh `docs/screens/3d-city/engine-*.jpg`.

- **Kiểu dữ liệu `CityView`** đặt ở `packages/core/src/city/view.ts` (chỉ khai báo kiểu; việc 3 viết
  hàm thuần sinh ra nó).
- **Bố cục** (`layout.ts`): khối 5×5 ô, mỗi khối 4 lô 2×2, xếp xoắn ốc từ toà thị chính ra. Vai trò của
  lô (kỹ năng / công trình công cộng / ô đất của con) chỉ phụ thuộc số thứ tự khối, nên thêm kỹ năng,
  huy hiệu hay đất **không làm công trình nào đổi chỗ** (có test). Môn lớn nhất (102 kỹ năng) cần 41 khối.
- **Tài sản Kenney tính trước** (`bake:kenney`): 70 mô hình thành màu theo đỉnh,
  `content/art/city/kenney.{bin,json}` 1,56 MB, vào git và được `art:sync` phục vụ. Lúc chạy không cần
  texture; tô màu theo thành phố chạy trên CPU (đỏ luôn giữ sáng dạng san hô, có test).
- **Nhà kỹ năng 5 mức × 6 thành phố**, gồm bốn thành phố mới: Bến Cảng Từ (hải đăng), Vườn Sách (chồng
  sách khổng lồ), Xưởng Máy (tháp bánh răng), Trạm Khám Phá (tên lửa). **6 kỳ quan ghép mảnh**: Kim tự
  tháp 8, Chùa Một Cột 6, Tượng Nữ thần Tự do 7, Parthenon 7, Tháp Eiffel 7, Vạn Lý Trường Thành 8.
  **15 công trình công cộng** (đề yêu cầu ≥ 12). **10 công trình con chọn xây** trên ô đất, **10 vật
  trang trí**. Ngoài ra có toà thị chính với bảng đơn, cổng mang tên thành phố, cảnh vật (rừng viền,
  sông/hồ/biển theo từng thành phố, đồi, núi, mây), ngày/đêm theo giờ thật, xe/buýt/người/thuyền/thú
  cưng chạy theo mức nhộn nhịp (streak).
- **Engine** (`@mtct/city/engine`): `setView`, chạm để chọn (kỹ năng / công trình công cộng / ô đất /
  toà thị chính / kỳ quan), `focus` bay camera tới, `anchors()` trả toạ độ màn hình cho bong bóng HTML,
  kéo/chụm để di chuyển và thu phóng trong giới hạn, tự hạ độ phân giải khi chậm, dừng khi tab ẩn.
- **Test**: 37 test (layout, màu, ngày/đêm, đường đi, camera, bước gộp, đất cong, atlas chữ, danh mục,
  **ngân sách iPad cho cả 6 thành phố ở cỡ lớn nhất**, không có đỏ báo lỗi).

**Quyết định 3D thật hay WebP (ADR-20): render 3D thật.** Số đo xấu nhất lấy từ test (9 vị trí camera ×
2 mức zoom × iPad ngang/dọc, tính cả xe/người): ngày đầu **47–55 draw call, ~23k tam giác**; đầy đủ
**69–73 draw call, 67,5k–79,5k tam giác** (Phố Chữ 102 kỹ năng là ca sát nhất). Trên máy dev, ở độ phân
giải iPad DPR 2, đạt 60 fps (trung bình và 5% chậm nhất), kể cả khi hãm CPU 4×. **Chưa có số iPad thật**:
ADR ghi rõ ngưỡng để chuyển sang WebP (< 50 fps trung bình hoặc < 40 fps ở 5% chậm nhất sau khi đã hạ
độ phân giải; hoặc dựng > 1.200 ms).

Cách chạy thử:

```powershell
pnpm --filter @mtct/city test
pnpm --filter @mtct/city bench:build
pnpm --filter @mtct/city bench:shoot -- "city=viet&size=full&hour=10" engine-viet.jpg
```

Cần chủ dự án (việc 2):

1. **Mở bench trên iPad của hai bé** (link trên), xoay ngang, bấm "Đo 20 giây", chụp kết quả gửi lại.
   Đây là số đo quyết định cho ADR-20.
2. Xem thiết kế nhà 5 mức của bốn thành phố mới trong bench (đổi thành phố ở góc phải) và nói nếu có
   thành phố nào chưa đúng ý.

### Việc 1 — bảng phong cách (15/09, đã duyệt)

Trang duyệt: https://claude.ai/artifact/FxS1xjZj3oYRFmik5q65Tq · ảnh gốc `docs/screens/3d-city/`.

#### Đã làm

- **Tải 5 kit Kenney** (City Suburban 2.0, Commercial 2.1, Industrial 2.0, Roads, Nature Kit — CC0)
  vào `content/art/kenney/`. ~98 MB → gitignore toàn bộ trừ `README.md` (ghi nguồn, phiên bản, ngày
  tải, lệnh PowerShell tải lại). `scripts/art-sync.mjs` bỏ qua `kenney/`, `3d-city/`, `3d-proto/`,
  `node_modules` (trước đây sẽ chép cả 98 MB sang `public/art`).
- **Bàn render `content/art/3d-city/`** — mầm của `packages/city`, three.js thuần:
  - `lib.js`: tô lại Kenney theo thành phố (vẽ lại ô màu của `colormap.png`; Nature Kit đổi màu vật
    liệu), nhà kỹ năng **5 mức** cho Toán và Tiếng Việt, mái ngói cong tự dựng lưới, 9 công trình
    công cộng (trường, thư viện, sân chơi, bể bơi, sân bóng, rạp xiếc, vườn thú, ga tàu, vòng quay) +
    chợ + toà thị chính có bảng đơn, kỳ quan **Kim tự tháp 8 mảnh** và **Chùa Một Cột 6 mảnh** (mảnh
    chưa có hiện kính xanh mờ có viền), ô đất khoá/ô đất mới, cổng thành phố, người, thú cưng, xe,
    thuyền, khinh khí cầu, xe kem, cây đa, đèn lồng, mây, đồi, núi.
  - `city.html` (Thành Số, Phố Chữ + HUD mẫu), `sheet.html` (5 mức), `wonder.html` (3 giai đoạn),
    `probe.html` (bảng tiếp xúc Kenney), `shoot.mjs` (Chrome headless GPU thật, ~9 s/thành phố).
- **Bảng màu tươi hơn mẫu**: cỏ `#79DC48`, trời `#3FA9F5→#D2F3FF`, bão hoà vật liệu Kenney ×1,18.
- 8 ảnh: `thanh-so.jpg`, `pho-chu.jpg` (+ bản `-khong-hud`), `thanh-so-5-muc.jpg`,
  `pho-chu-5-muc.jpg`, `kim-tu-thap-ghep-manh.jpg`, `chua-mot-cot-ghep-manh.jpg`.

#### Quyết định kỹ thuật

- **Đất cong ra xa** thay cho camera trực giao của mẫu: thành phố phẳng trong bán kính 62, ngoài
  đó hạ `0,0055·d²`. Camera nghiêng 27° vẫn thấy trời có mây (yêu cầu mới) mà không phải hạ góc
  xuống kiểu nhìn ngang phố. Vá vào `project_vertex` nên bóng đổ khớp.
- **Ánh sáng bán cầu nửa dưới màu kem**, không phải xanh cỏ — xanh cỏ hắt lên làm tường vàng ngả
  ô-liu (đã thử, thấy rõ trên ảnh).
- Kỳ quan và nhà kỹ năng tự dựng; Kenney chỉ cho phố, nhà trang trí, cao ốc nền, cây.

#### Số đo bảng phong cách (máy render GTX 1060)

| Cảnh | Draw call | Tam giác |
|---|---|---|
| Thành Số | ~4.300 | ~730k |
| Phố Chữ | ~4.700 | ~700k |
| Bảng 5 mức | 440–580 | 113–127k |

**Vượt xa ngân sách iPad** (≤ 150 draw call, ≤ 80k tam giác) — đúng dự kiến cho ảnh chất lượng mục
tiêu. Việc 2 đo trên iPad thật rồi chọn InstancedMesh/gộp theo ô hay đường WebP, ghi ADR.

#### Đã hỏi chủ dự án (đã duyệt 15/09)

1. Duyệt hướng hình (độ tươi, góc có trời, mật độ), 5 mức công trình, cách hiện mảnh kỳ quan.
2. **Link bảng phong cách 6 khung trên claude.ai chưa nhận được** — bản này dựng theo đề bài chữ; nếu
   khung nào lệch thì chỉ ra để sửa trước việc 2.
3. Cổng Phố Chữ hiện là hai cột + mái cong; nếu thấy giống cổng nước khác thì đổi sang tam quan.

### Tồn đọng

- Việc 4 (màn hình, cờ `KID_UI`), việc 5 (nghiệm thu, hai bé dùng thử) chưa làm.
- Còn mở cho việc 4: khi ẩn cửa hàng đồ sưu tầm ở chế độ thành phố, con nhận vật trang trí bằng cách nào
  (đề xuất ở ADR-21). Link bảng phong cách 6 khung vẫn chưa nhận được.
- `docs/06` chưa cập nhật hướng thành phố (tiêu chí 7, sẽ làm cùng việc 4).
- `pnpm lint && pnpm test && pnpm build` xanh (15/09).

## Pha 9 — 15/09/2026 — Dựng máy chủ Ubuntu, chuyển dữ liệu, cắt tunnel

Trạng thái: **§1, §2, §3 xong và đã cắt tunnel — `edu.medifa.vn` trả lời từ máy Ubuntu thật.** Chỉ
còn việc chủ dự án tự làm: đăng nhập thật bằng mã 4 hình của hai bé (tiêu chí 4), và dọn quyền
`sudo` tạm sau khi nghiệm thu xong. Máy Windows **không tắt** — vẫn giữ Docker chạy vì Windows còn
phục vụ tunnel cho một site khác (`one2.medifa.vn`, không liên quan dự án này); chỉ riêng
`edu.medifa.vn` đã chuyển hẳn sang Ubuntu.

### §0 — chuẩn bị máy (đổi kế hoạch so với đề bài)

- Máy ảo đổi sang **IP tĩnh `192.168.1.102`** (đề bài ghi `.94` — chủ dự án đổi ý giữa chừng, đã
  làm theo, không phải sai lệch tài liệu).
- **Sự cố giữa chừng, đã sửa**: `netplan apply` liên tục bị kernel OOM-kill dù `free -h` báo còn
  dư RAM — nguyên nhân là VM chỉ có 1 vCPU / 2.1 GiB RAM (Hyper-V Dynamic Memory đặt sàn quá thấp).
  Chủ dự án đã tự nâng lên 4 vCPU / 3.2 GiB qua Hyper-V Manager (tôi không có quyền admin để tự
  làm) — sau đó mọi thao tác hệ thống chạy bình thường. **Khuyến nghị**: nếu sau này thấy máy chậm
  bất thường khi có nhiều gia đình dùng cùng lúc, cân nhắc nâng thêm — 3.2 GiB là mức tối thiểu đã
  kiểm chứng chạy được, không phải mức dư dả.
- SSH chỉ vào bằng khoá (`PasswordAuthentication no`, kiểm chứng bằng thử đăng nhập mật khẩu và bị
  từ chối thẳng), `ufw` chỉ mở cổng 22 trong LAN, Docker Engine + compose plugin (không phải Docker
  Desktop), `unattended-upgrades` bật, múi giờ `Asia/Ho_Chi_Minh`. Khởi động lại một lần để lên
  kernel mới — lên lại sạch.
- **Sự cố khác phát hiện giữa chừng, đã sửa**: trong lúc làm, phát hiện **Docker Desktop trên máy
  Windows đang chạy thật bị tắt dịch vụ** (không rõ từ bao lâu) — nghĩa là hệ thống thật của hai bé
  đang không vào được. Đã bật lại Docker Desktop và `docker compose up -d`, xác nhận `/api/health`
  trả `200` trở lại. Không rõ nguyên nhân gốc (Windows Update? treo máy?) — nên chủ dự án để ý xem
  còn tái diễn không; nếu có, cân nhắc đặt Docker Desktop tự khởi động cùng Windows.

### §2 — chuyển dữ liệu: bảng đối chiếu (không lệch dòng nào)

Nguồn: bản sao lưu mới chụp lúc chuyển (`mtct-2026-09-15-0948.dump`), không dùng bản cũ 3 ngày
trước đó. Đếm hai lần — trước khi sao lưu và sau khi phục hồi trên Ubuntu — khớp tuyệt đối:

| Bảng | Windows (trước) | Ubuntu (sau) | Lệch |
|---|---:|---:|---:|
| Student | 2 | 2 | 0 |
| User | 4 | 4 | 0 |
| Session | 4 | 4 | 0 |
| Attempt | 20 | 20 | 0 |
| Evidence | 19 | 19 | 0 |
| SkillMastery | 18 | 18 | 0 |
| ClassDiary | 3 | 3 | 0 |

`content:import --dry-run` trên Ubuntu báo **"0 changes"** — nội dung (376 kỹ năng, 10759 bài
luyện) khớp tuyệt đối với Windows. Phát hiện thêm: **165 MB / 7509 file** (chủ yếu cache mp3 giọng
đọc đã sinh sẵn, `pnpm content:import` chạy trực tiếp trên máy Windows chứ không qua Docker) nằm ở
`E:\data\files` — một thư mục **ngoài** volume Docker mà container thật dùng — đã gộp cả hai nguồn
vào volume `mtct_files` trên Ubuntu để không sót gì; `content:stats` sau đó khớp y hệt Windows
(kể cả dòng "audio: 7288/7392 câu đã có mp3").

Bí mật production **hoàn toàn mới**: mật khẩu Postgres, `AUTH_SECRET`, `INTERNAL_API_TOKEN` — không
cái nào chép từ `.env` dev. `TTS_*` giữ y hệt (cùng khoá Azure, cùng vùng `eastasia`). **Token mới
đã báo riêng cho chủ dự án qua chat** (không ghi vào file này — đây là bí mật, không nên nằm trong
git).

### Sửa một chỗ nhỏ trong code — thêm trường `host` vào `/api/health`

Tiêu chí xong đòi hỏi phân biệt được máy nào đang trả lời. `os.hostname()` bên trong container chỉ
ra một chuỗi ngẫu nhiên (id container), không nói lên gì — nên đổi sang đọc biến môi trường mới
`DEPLOY_HOST` (đặt `ubuntu-edison` trong `.env` trên Ubuntu), rơi về `hostname()` nếu không đặt.
Sửa `packages/db/src/ops/health.ts` (+ test), `apps/web/app/(admin)/admin/health/page.tsx` (thêm
dòng "Máy chủ" ở khối Chi tiết), `.env.example`. `lint`/`test`/`build` xanh trên máy Windows sau khi
sửa. Chưa commit (đề bài không yêu cầu commit trong việc vận hành; hỏi chủ dự án có muốn commit
riêng thay đổi code này không).

### §3 — vận hành

- **Sao lưu hằng đêm**: đổi kế hoạch so với đề bài khi hỏi chủ dự án — chưa có NAS/ổ chia sẻ riêng,
  nên tạm thời Ubuntu tự sao lưu cục bộ lúc 1:00 sáng (như cũ), rồi một **Task Scheduler trên máy
  Windows** (`MTCT-PullUbuntuBackup`, 1:20 sáng, không cần quyền admin) tự kéo bản mới nhất về
  `E:\SAO-LUU-MTCT` qua LAN bằng khoá SSH sẵn có. Đã chạy thử tay, log ở
  `docs/dien-tap/pull-ubuntu-backup.log`. Kịch bản: `scripts/pull-ubuntu-backup.ps1` +
  `scripts/register-backup-pull-task.ps1`. **Đây là giải pháp tạm** — nên bàn lại khi có chỗ lưu
  cố định (NAS, ổ ngoài).
- **Diễn tập khôi phục thật trên Ubuntu**: phục hồi bản sao lưu vào database tạm `mtct_restore`
  (không đụng `mtct` thật), đếm khớp, rồi xoá. Log: `docs/dien-tap/khoi-phuc-20260915-ubuntu-pha9.md`.
  Chưa dựng bản Bash tương đương `scripts/restore-drill.ps1` để lần sau tự sinh log — để lại làm
  sau nếu chủ dự án muốn.
- **Khởi động lại máy ảo**: đã thử thật (reboot qua SSH) — cả 4 dịch vụ (postgres, web, worker,
  backup) tự lên lại, `/api/health` trả `200` sau ~30 giây, không gõ gì. Đạt tiêu chí 5.
- Đã cập nhật `docs/VAN-HANH.md`: thêm §0 "Vào máy chủ Ubuntu" (cách SSH bằng khoá, khởi động lại
  qua Hyper-V Manager), sửa §6 để nói rõ sao lưu giờ đi hai chặng.

### Cắt tunnel — xong, cập nhật sau khi viết mục trên

Đề bài giả định tunnel Windows chỉ phục vụ riêng dự án này và có thể tắt hẳn sau khi cắt — **thực tế
không phải vậy**: tunnel "118 Mimosa" trên Windows phục vụ **chung hai site**
(`edu.medifa.vn` + `one2.medifa.vn`, site kia không liên quan dự án này). Tắt hẳn connector Windows
sẽ làm sập luôn `one2.medifa.vn`. Xử lý: chủ dự án tạo **tunnel mới riêng cho dự án** (`edison-learning`),
chuyển route `edu.medifa.vn` sang tunnel mới, dựng connector cho tunnel mới ngay trong
docker-compose trên Ubuntu (`cloudflared` service, `Service: http://web:3000` — không mở cổng nào,
đúng thiết kế outbound-only), giữ tunnel "118 Mimosa" nguyên vẹn cho `one2.medifa.vn`. Đã kiểm chứng:

- `https://edu.medifa.vn/api/health` → `200`, `"host":"ubuntu-edison"`, ổn định qua 5 lần gọi liên tiếp.
- `https://edu.medifa.vn/api/internal/context?student=thy` với token mới → `200` kèm `skillCandidates`;
  token dev cũ → `401`.
- Trang `/login` qua domain thật hiện đúng tên và ảnh cả hai bé.
- **Không đụng gì tới Windows Service `Cloudflared`** — vẫn phải chạy, vì còn phục vụ `one2.medifa.vn`.

**Phát hiện thêm giữa chừng, đã sửa**: cổng web (5000) trên Ubuntu **lộ ra cả LAN** dù `ufw` báo chỉ
mở cổng 22 — nguyên nhân là Docker tự ghi luật iptables riêng, vượt mặt `ufw`. Sửa bằng cách đổi
`docker/compose.yml`: `ports: "${PORT}:3000"` → `"127.0.0.1:${PORT}:3000"` (giống cách `postgres` đã
làm sẵn) — khớp đúng nguyên tắc "không mở cổng web ra ngoài" của đề bài, và không ảnh hưởng gì vì
tunnel nói chuyện với `web` qua tên service trong mạng Docker nội bộ, không qua cổng này.

### Còn lại

1. **Đăng nhập thật bằng mã 4 hình của hai bé, đi trọn một phiên học** (tiêu chí 4) — tôi chỉ kiểm
   tra được trang `/login` hiện đúng tên và ảnh đại diện hai bé (dữ liệu đã sang đúng), không tự
   đoán mã của con. Giờ đã cắt tunnel, chủ dự án làm thử trực tiếp trên domain thật được rồi.
2. Sau khi nghiệm thu xong: gỡ `/etc/sudoers.d/010-deploy-temp` trên Ubuntu (tự đặt khi mở đầu pha 9
   để tôi chạy `sudo` không cần hỏi mật khẩu) — hỏi lại chủ dự án trước khi gỡ, phòng khi còn việc
   dở dang.
3. Ổ đĩa Ubuntu hiện dùng 62.5/125 GB (còn ~62 GB chưa gán vào LVM) — đủ dùng, không cần làm gì
   ngay, ghi lại để biết còn dư địa mở rộng sau này nếu cần.

### Câu hỏi cho chủ dự án

- Chỗ sao lưu cố định lâu dài (NAS? ổ ngoài?) hay cứ để tạm ở `E:\SAO-LUU-MTCT` qua LAN như hiện
  tại?
- Có muốn commit riêng thay đổi `host` trong `/api/health` (mã nguồn, không phải bí mật) trước khi
  merge các việc pha 9 khác không?

## Pha 6d — 15/09/2026 — Đọc phản hồi thật, ruột bài học, thư viện vật thể

Trạng thái: **Việc 1 và việc 4 xong. Việc 2 xong đúng phần ưu tiên (107/182), phần còn lại (HK2) để
sau. Việc 3 vượt mục tiêu (212/200 vật thể).** Không soạn bài luyện mới, đúng yêu cầu đề bài. `lint`
/ `test` / `build` xanh · `content:validate` sạch · `content:import --dry-run` **0 thay đổi** sau khi
nạp thật. Chạy song song với pha 8c, không dựng lại Docker. Chưa push.

### Việc 1 — đọc `exercise-health.csv`, sửa theo dữ liệu thật

Báo cáo đầy đủ: `content/_reports/dot-4.md`. Tóm tắt: chỉ có 20 lượt làm thật (2 phiên, 12/09).
Phát hiện lại đúng lỗi pha 6b tưởng đã sửa — `EMATH.NBT.COUNT_TO_20` vẽ ảnh lặp (`repeat`) nhưng
`frame.tsx`/`choice.tsx` (MCQ/LISTEN_CHOOSE) không đọc field này, chỉ vẽ một hình; pha 6b chỉ sửa
đúng số liệu chứ chưa sửa hiển thị. Sửa bằng cách chuyển 19 bài MCQ → `COUNT_TAP` (cơ chế có sẵn vẽ
đúng). Xác nhận `viet-bd-0049` (bài sai duy nhất khác) là dữ liệu cũ trước khi RETIRE ở đợt 2, không
phải lỗi mới. Việc 4 (2 kỹ năng ESL "trống") xác nhận là quyết định đã chốt (`isActive=false`, docs/09
§4b.3) — không soạn bài, không tự đổi quyết định.

### Việc 2 — ruột 182 LessonUnit

**107/182 kỹ năng đã có `objectives`/`vocabulary`/`concepts`/`sampleTasks`/`answerKeyNotes`/
`contentText`** — đúng toàn bộ phần ưu tiên đề bài nêu: 86 bài Tiếng Việt tập một (Bài 0–83 +
Ôn tập + Đánh giá cuối kỳ 1) và 21 bài Toán tập một (Bài 0–20), đọc thật từ
`sach giao khoa/01-sgk-tieng-viet-1-tap-mot.pdf` và `01-sgk-toan-1-tap-mot.pdf`. **Chưa làm 75 bài
còn lại** — Tiếng Việt tập hai (54 bài, HK2) và Toán tập hai (21 bài, HK2) chưa có số trang xác nhận
trong DB (`pageFrom=null`) và thuộc chương trình các tuần sau 18, ngoài phạm vi khẩn của đợt này; ESL/
ENL/EMATH ("Global Stage và MATH NOTES") **hiện chưa có `LessonUnit` nào cả** (182 unit hiện tại toàn
bộ là VIET+VMATH) nên "làm sau" chưa có gì để làm — cần tạo skeleton trước ở một đợt khác nếu muốn.
`answerKeyNotes` viết trong file nguồn nhưng **không tới được DB** (`lessonToRow()` ở
`packages/content/src/to-rows.ts:99-116` không map field này — lỗi đã biết, không tự sửa code app);
đã gộp nội dung đó vào `contentText` để phụ huynh không mất thông tin.

**Phát hiện khi đọc sách:**
- `01-sgk-toan-1-tap-mot.pdf` có ít nhất 2 đoạn trang bị **đóng nhầm trang sách Tiếng Việt** vào đúng
  chỗ thiếu trang Toán (PDF tr.39–42 và 61–64, đáng lẽ là trang sách Toán 38–41 và 60–63). Bài 6 và
  Bài 10 soạn thiếu phần bị mất trang, không bịa. Đã gửi việc riêng (`spawn_task`) đề nghị chủ dự án
  kiểm tra/quét lại 8 trang này.
- Mã `KNTT-TV1-T1-ONTAP` (skeleton ghi trang sách 174–179) trùng hoàn toàn phạm vi trang với Bài 81–83
  (cũng 174–179) — vì Bài 81 và 82 trong sách thật ra chính là "ÔN TẬP" (trang 174, 176), không phải
  "Bài đọc tổng hợp" như tên skeleton ghi; chỉ Bài 83 (trang 178) mới là bài đọc thật ("Voi, hổ và
  khỉ"). Không tự sửa tên/trang skeleton (ngoài phạm vi "điền nội dung" của việc 2) — ghi lại để chủ
  dự án hoặc đợt sau đối chiếu và quyết định gộp/sửa.

### Việc 3 — thư viện vật thể

**70 → 212 vật thể** (mục tiêu ≥ 200), thêm đúng 7 nhóm bám sát từ vựng các gói `ESL VOC.*` đang dạy
(trái cây/món ăn, con vật, quần áo/cơ thể, đồ dùng học tập/hình khối, đồ chơi/sân chơi, nội thất/gia
đình, phương tiện/thời tiết/nhạc cụ/vật đếm Toán). `pnpm art:check` sạch — 0.63 MB / 40 MB, vật thể
nặng nhất 1.8 KB (trần 6 KB). Đã `art:sync` sang `apps/web/public/art`. Ghi chú thật: 0 bài luyện nào
hiện dùng `ImageRef.kind="asset"` (toàn bộ dùng emoji) — mở rộng này là hạ tầng cho tương lai, chưa có
bài nào trỏ tới (nên cũng không có bài nào trỏ tới hình thiếu).

### Ghi vào danh sách cho sau (không sửa vì đụng code app hoặc ngoài phạm vi)

1. `frame.tsx`/`choice.tsx` cần vẽ lặp theo `ImageRef.repeat` cho MCQ/LISTEN_CHOOSE — hiện chỉ
   `COUNT_TAP` vẽ đúng, dù schema (`packages/content/src/exercise.ts:48-51`) ghi rõ ý định khác.
2. Planner nên tránh xếp `WRITE_PHOTO`/`SPEAK_ANSWER` làm câu đầu phiên (cần người lớn ngay lúc đó).
3. `lessonToRow()` cần lưu `answerKeyNotes` vào DB (thêm cột hoặc gộp có kiểm soát vào `contentText`
   ở tầng import, thay vì để từng lesson tự gộp tay như đợt này).
4. Đối chiếu lại trang/tên `KNTT-TV1-T1-ONTAP` vs Bài 81–82 (mục Việc 2 ở trên).
5. Xin 8 trang Toán bị đóng nhầm (mục Việc 2 ở trên) — cần bản quét đúng để soạn nốt Bài 6, Bài 10.
6. 75 bài LessonUnit còn lại (Tiếng Việt tập hai, Toán tập hai) — cần trang sách trước khi soạn.

## Pha 6b — 14/09/2026 — Vá 129 kỹ năng trống của tuần 1–12

Trạng thái: **129 → 0 kỹ năng tuần 1–12 còn trống ở cả 6 môn.** 130 gói · **5.010 bài** · tất cả
`PUBLISHED`. `content:validate` sạch · `audit-closed` 0/5.173 · `lint` / `test` / `build` xanh ·
`content:import --dry-run` **0 thay đổi** (sau lần nạp bản sửa 90 bài lúc 23:25).
Báo cáo đầy đủ: `content/_reports/dot-3.md`. ADR mới: **ADR-19**. Chưa push.

> Nạp 8 lô từ **21:01 tới 23:08** (PowerShell `Get-Date`, giờ VN), mỗi lô `--dry-run` trước và kiểm
> bảng `Session` trước; 0 phiên mở. Không dựng lại, không khởi động lại container nào.

### 1. Số kỹ năng / bài theo môn

| Môn | Kỹ năng mới | Bài | Nguồn |
|---|---|---|---|
| VIET | 42 | 1.801 | **Ảnh trang SGK tr.64–133** (âm ph–qu, v–x, y; 24 bài vần 31–59) + bài 29 chính tả; phân biệt s/x, c/k/q, p/q, hỏi/ngã; bảng chữ cái; đọc câu; tô chữ, chữ số; chép, nghe–viết; 4 kỹ năng nói–nghe |
| ESL | 34 | 1.258 | Global Stage 1 (bảng chương trình): 7 chủ đề từ vựng, CVC a/e/i/o/u, chữ cái, âm đầu, vần, magic e, 5 nghe, 5 nói, 6 ngữ pháp |
| ENL | 26 | 931 | CCSS ELA + Global Stage Literacy; đọc trôi chảy aa–D bằng **sách nhỏ viết mới** (không chép Raz-Kids) |
| EMATH | 12 | 427 | CCSS: number bonds, doubles, count on/back, fact family, giao hoán, hình, quy luật, từ vựng toán, đọc đề |
| VMATH | 9 | 348 | SGK Toán 1: đếm 1–10, số lượng 1–5, cộng/trừ phạm vi 5, cộng với 0, bài toán thêm, **3 kỹ năng hình tuần 8** |
| ESCI | 7 | 245 | NGSS: âm thanh, to–nhỏ/cao–trầm, tín hiệu, đẩy–kéo, nam châm, nóng–lạnh, đặt câu hỏi |

Ngân hàng: **8.443 bài `PUBLISHED` / 209 kỹ năng** (sáng 14/09: 3.433 / 79). **207/207** kỹ năng tuần
1–12 đang dùng có ≥ 35 bài.

### 2. Tiêu chí xong (đề bài §4)

1. **0 kỹ năng tuần 1–12 còn 0 bài** — đạt. Đo bằng script riêng đọc DB (`ExerciseSkill` ⨝
   `Exercise.status = PUBLISHED`, `Skill.isActive`, `expectedWeek ≤ 12`): trống 0, dưới 35 bài 0.
2. **≥ 35 bài, đủ 5 mức khó** — đạt 130/130. **"Đủ 6 dạng": 26/130** — 103 gói cố ý không có COUNT_TAP
   (ngữ pháp, ngữ âm, đọc hiểu, khoa học: bài đếm ghi bằng chứng sai kỹ năng, như `viet-bd-0049` đợt 2),
   1 gói viết chữ số không có đọc to. Lý do và cách lùi: **ADR-19**. Mọi gói ≥ 5 dạng trừ 1 gói 4 dạng.
3. **Không bài đóng nào hai đáp án đúng** — `scripts/content-gen/audit-closed.mjs` đếm số ô thoả câu
   hỏi cho mọi dạng máy suy được (ô trùng, có âm/vần/dấu X, phép tính, câu đếm có tranh, điền dấu,
   luật chính tả); dạng nghĩa soát bằng cấu trúc + tay (dữ kiện trong ngoặc cho điều emoji không vẽ được,
   tranh chỉ một tên, ô nhiễu chỉ định tay ở truyện có nhân vật lặp). Kết quả **0/5.173**. Bắt được và
   sửa trước khi nạp: 6 câu chính tả "Ô nào viết đúng?" có hai tiếng thật, 2 bài quy luật có hai cách xếp.
4. **`content:import --dry-run` 0 thay đổi** — đạt: `0 new, 0 updated, 0 revived, 8443 unchanged, 0 retired`.
5. **Không ngày học nào gián đoạn** — đạt (0 phiên trong 10 giờ trước 23:15; mọi lần nạp sau 21:00).
6. **20 mã mẫu đợt 3** (seed `pha-6b-dot-3`, pool 5.010):
   `esl-greet-0014` · `enl-label-0011` · `viet-vanan-0002` · `esl-shapes-0023` · `viet-vanep-0042` ·
   `vmath-toanthem-0010` · `viet-hoinga-0015` · `enl-longshort-0026` · `emath-compose-0018` ·
   `vmath-cong5-0020` · `viet-vanat-0012` · `esl-intro-0024` · `esci-vibrate-0005` · `esl-color-0008` ·
   `viet-vanat-0046` · `esl-school-0022` · `esl-intro-0021` · `esl-instruct-0002` · `viet-amphqu-0038` ·
   `emath-pattern-0015`. Tự chấm **18/20 → 20/20** (2 bài viết ghi "Viết đủ 2 tiếng" cho 4 tiếng — lỗi
   đếm cụm, sửa cho 70 bài của cả ba đợt).

### 3. Bài học từ `exercise-health.csv`

Mới 20 dòng, mỗi bài 1 lượt — chưa đủ để RETIRE hay nâng khó. Nhưng một dòng lạ (119 giây, 3 lần thử)
dẫn tới lỗi thật: **cả 20 câu trắc nghiệm của `EMATH.NBT.COUNT_TO_20` vẽ một vật** mà hỏi 2…20, câu lệnh
"Point to the right one." không nói phải làm gì. Đã sửa (tranh lặp đúng số, câu lệnh "How many? Count,
then tap."); quét toàn kho không còn gói nào như vậy. Bài học: đọc từng dòng lạ ngay cả khi số lượt ít —
thời gian dài + nhiều lần thử là dấu hiệu đề hỏng, không phải con yếu.

### 4. Thay đổi ngoài nội dung (ADR-19)

- `packages/content/src/tieng-viet-progression.ts`: bài 26 dạy thêm chữ **p** (SGK tr.64 "p – ph") + test.
  Chỉ validator dùng; không cần dựng lại image.
- `content/skill-map/viet.json`: mở `lessonRef` của hỏi/ngã (→ bài 19), nói theo tranh (→ 31), kể lại
  (→ 40). `enl.json`: bỏ COUNT_TAP của 3 kỹ năng âm/chữ in.

### 5. Tồn đọng

- **Giọng đọc: xong** lúc 02:37 ngày 15/09 — 2.966 câu mới sinh, 2.804 đã có sẵn, 0 lỗi. Tháng 09
  đã dùng 136.832 / 500.000 ký tự Azure (27%).
- **English Maths học theo "MATH NOTES Grade 1"** (tài liệu nội bộ Edison, ghi vào `docs/09` §1c trong
  lúc làm pha này): 773 bài EMATH đang bám CCSS, cần rà lại khi có ảnh mục lục.
- **Sau restart container phải chạy lại `sync-skill-types` cho 130 kỹ năng** tới khi chú dựng lại image
  buổi sáng (seed trong image cũ ghi đè `exerciseTypes`).
- Chưa có ảnh trang Global Stage, sách English Science / English Maths: 2.861 bài đang bám bảng chương
  trình / chuẩn.
- TRACE và MINI_STORY chưa có trình hiển thị → tô chữ và truyện đi bằng bài viết và bài nghe.
- Mã lỗi còn thiếu (gọi nhầm tên hình, viết hoa, dấu câu, lễ phép, từ vựng): nhiều gói tiếng Anh/khoa học
  có `targetsError` = 0.
- Đọc lại `exercise-health.csv` ngày 17/09.

## Pha 6a (tiếp) — 14/09/2026 — Học vần bài 16–24, Toán bài 1–6, ESL Unit 2

Trạng thái: **3 lô mới đã phát hành**, sửa **38 bài lỗi** trong nội dung cũ, và phát hiện **web đã chết
~36 giờ**. Pha 6 **chưa xong** (xem 5.1). `content:validate` sạch · `audit-has-letter` báo 0 ·
`content:import --dry-run` 0 thay đổi · `lint` / `test` / `build` xanh. 1 commit, **chưa push**.

> ⚠️ **Đọc trước:** máy khởi động lại lúc 07:02 ngày 13/09, Docker không tự bật, **tối 13/09 hai bé
> không học được**. Cháu bật lại lúc **19:36 ngày 14/09 — trong giờ học** vì đọc nhầm giờ UTC (Git
> Bash) thành giờ VN. Không có phiên nào bị cắt ngang (bảng `Session` trống từ 13/09), nhưng đó là
> sai luật §0 và cháu đã báo chú sai giờ lúc làm. Ba việc chú cần làm ở mục 5.2.

### 1. Đã soạn

**17 kỹ năng · 753 bài.** Ngân hàng: **3.433 bài / 79 kỹ năng**, 27 bài nghỉ hưu, mọi kỹ năng ≥ 35 bài.

| Lô | Kỹ năng | Bài | Nguồn |
|---|---|---|---|
| 5 — Tiếng Việt | âm m–n, g–gi, gh–nh, ng–ngh, r–s, t–tr, th · vần ia, ua–ưa · phân biệt ch/tr, luật ng/ngh–g/gh | 509 | Ảnh trang SGK bài 16–24 (tr.44–61) |
| 6 — Toán | thứ tự số · đọc viết số 0–10 · các số 1–10 | 130 | SGK tr.24–45 (đoàn tàu số, bể cá, điền dấu) |
| 7 — ESL | food · fruits · I like / I don't like | 121 | Global Stage 1 Unit 2 (scope and sequence) |

Phủ: **78/207** kỹ năng tuần 1–12 có ≥ 30 bài (12/09: 62) · **79/271** kỹ năng học kỳ 1.

**Không soạn được `VMATH.HH.HINH_VUONG_TRON_TAM_GIAC_CN`** (bài 7): Toán bắt mọi câu trắc nghiệm có mã
lỗi, mà bộ 44 mã không có mã nào cho "gọi nhầm tên hình". Cần ADR bổ sung mã.

### 2. Lỗi tìm ra trong nội dung **đã phát hành**

- **31 bài "Tiếng nào có âm X?" có hai đáp án đúng** — tất cả trong 4 gói âm cháu soạn ngày 12/09
  (`hồ` / `hò` cho "âm h"). Ô nhiễu "nhìn giống" thường cũng chứa chính âm đó. Viết
  `scripts/content-gen/audit-has-letter.mjs` soát theo **âm** chứ không theo con chữ, sửa khuôn; nay 0.
- **7 bài có hai thẻ/ô cùng chữ**, gồm 3 bài đợt 1 viết tay (`viet-am-b-0036`: thẻ `b`, `à`, `à` — kéo
  thẻ `à` thứ hai bị chấm chưa đúng). Đã sửa; `choicesOf` nay tự bỏ ô trùng.
- Tự chấm 20 bài của lô 5–7: **17/20 → 20/20** sau khi sửa 3 tranh không khớp tên (🚪 "cửa sổ",
  👂 "nghe", 🥒 "su su").

Không bài nào trong số đó từng được con làm (20 lượt thật đều thuộc gói khác), nên không có bằng
chứng nào của con bị ảnh hưởng.

### 3. 20 mã bài mẫu lô 5–7

`viet-amngngh-0009` · `viet-amggi-0001` · `viet-amttr-0014` · `viet-ngngh-0014` · `vmath-docviet-0040` ·
`esl-like-0035` · `viet-amrs-0015` · `viet-amrs-0031` · `esl-food-0010` · `viet-amngngh-0033` ·
`esl-fruit-0030` · `esl-like-0036` · `esl-fruit-0028` · `vmath-so110-0002` · `viet-amrs-0008` ·
`viet-ngngh-0040` · `viet-ngngh-0006` · `viet-ammn-0006` · `viet-vanua-0038` · `viet-vanua-0015`

Bảng chấm và lệnh dựng lại: `content/_reports/dot-2.md` §10.4.

### 4. Dữ liệu thật

Không có gì mới — máy tắt từ sáng 13/09. Mỗi bé vẫn 1/14 ngày.

### 5. Tồn đọng và câu hỏi

**5.1 — Pha 6 chưa xong.** Đợt 6a mới làm được một phần việc 1 trong 4 việc của `docs/08`. Việc 2
(bài học đầy đủ, `/parent/materials`), việc 3 (bám tuần học) và việc 4 (thư viện ≥ 200 hình) đều cần
sửa code, nên để sau khi xong 14 ngày chạy thật. Câu hỏi hôm 12/09 về tiêu chí 1 vẫn chờ chú trả lời.

**5.2 — Ba việc vận hành, cần chú làm:**
1. Bật Docker Desktop *Start when you sign in*. Cháu không đổi cài đặt hệ thống.
2. **Dựng lại image vào buổi sáng** (`docker compose -f docker/compose.yml up -d --build`). Container
   web chạy seed mỗi lần khởi động bằng bản đồ kỹ năng **nằm trong image cũ** (trước 12/09): lần khởi
   động tối nay đã ghi đè dạng bài / mức khó của 47 kỹ năng và bật lại 3 kỹ năng ESL đã tắt. Cháu đã
   đồng bộ lại 47 kỹ năng, nhưng restart lần sau sẽ ghi đè tiếp cho tới khi dựng image mới. Ba kỹ năng
   ESL chưa tắt lại (chưa có bài nào nên planner không chọn tới).
3. Sao lưu hằng đêm chưa chạy — bản gần nhất 12/09 10:43.

**5.3 — Đính chính báo cáo 12/09:** câu "mọi lệnh chạy 08:30–10:30" là giờ UTC đọc nhầm. Giờ VN thật:
nạp 15:29–15:55, nghỉ hưu 24 bài lúc 19:39. Đã sửa tại chỗ.

---

## Pha 6a — 12/09/2026 — Nội dung đợt 2, chạy song song với 14 ngày dùng thật

Trạng thái: **5/6 tiêu chí đạt**; tiêu chí 1 (phủ hết tuần 1–12 của 5 môn) **không đạt và không thể
đạt trong một đợt** — đề bài tự mâu thuẫn, số liệu ở mục 5. 1 commit, **chưa push**. `lint` sạch ·
`test` xanh · `build` xanh · `content:validate` sạch · `content:import --dry-run` báo **0 thay đổi**.

> Không sửa một dòng code nào của app, không dựng lại Docker lần nào, không ngày học nào bị gián
> đoạn. ~~Mọi lệnh chạy 08:30–10:30 giờ VN.~~ **Đính chính 14/09:** giờ đó đọc nhầm UTC. Giờ thật: 5
> lô nạp 15:29–15:55; lượt nghỉ hưu 24 bài và lượt sinh mp3 cuối lúc **19:39–19:42**, tức trong giờ
> học. Hôm đó không có phiên nào đang mở nên không ai bị gián đoạn — nhưng câu cũ sai.

### 1. Đã soạn bao nhiêu

**34 kỹ năng mới · 1.463 bài · tất cả đã `PUBLISHED`.** Ngân hàng: **1.236 → 2.676 bài**,
**28 → 62 kỹ năng**.

| Môn | Kỹ năng mới | Bài | Nội dung |
|---|---|---|---|
| **ESCI** | **10** | **442** | English Science, từ **0 bài** — vật sống, giác quan, nhu cầu sinh vật, vật liệu, tính chất, dự đoán, nổi–chìm, phân loại, ánh sáng, bóng |
| VIET | 12 | 517 | 5 dấu thanh · âm ô, ơ, i–k, h–l · đánh vần ghép tiếng · đọc tiếng · đọc từ ngữ |
| EMATH | 6 | 257 | cộng/trừ trong 5 và 10 · so sánh tới 10 · tia số tới 20 · số thứ tự first–tenth |
| ESL | 4 | 167 | số đếm 1–20 · đánh vần CVC · con vật nông trại & sở thú · How many…? – There are… |
| ENL | 2 | 80 | ghép âm · tách âm (Phonics Review) |

**Ưu tiên 1 làm trước, và làm trúng:** nhật ký lớp 10–12/09 ghi *"Bài 13: U u – Ư ư"* và
*"Unit 1 – Lesson 16 – Unit Review"*, gắn 7 kỹ năng — 6 trong số đó trước hôm nay **chưa có bài
nào**. Cả 6 nay đã đủ 40 bài: `VIET.DOC.DOC_TIENG`, `VIET.DOC.DOC_TU`, `VIET.HV.DANH_VAN_TIENG`,
`ESL.VOC.NUMBERS_1_20`, `ESL.PH.SPELL_CVC`, `ESL.VOC.ANIMALS_FARM`. Giọng đọc: **1.858/1.858 câu có
mp3**, dùng 5% hạn mức Azure tháng 09.

### 2. 20 mã bài mẫu (QC chấm lại đúng bộ này)

`esl-animal-0037` · `emath-ord-0025` · `esci-predict-0037` · `viet-huyen-0044` · `esci-vocmat-0007` ·
`viet-amhl-0028` · `viet-doctieng-0016` · `viet-nga-0014` · `esci-float-0021` · `enl-blend-0015` ·
`esl-animal-0035` · `viet-hoi-0043` · `viet-amik-0030` · `esci-living-0035` · `enl-isolate-0017` ·
`viet-huyen-0042` · `viet-amoo-0044` · `emath-line-0009` · `esl-cvc-0011` · `enl-isolate-0023`

Bảng chấm từng bài ở `content/_reports/dot-2.md` §3. Lệnh dựng lại đúng bộ 20 nằm ở đầu §3 đó.
**20/20 đạt — sau một vòng sửa**; vòng đầu chỉ 16/20 và 10 lỗi tìm ra ghi ở §4 của báo cáo.

### 3. Học được gì từ dữ liệu thật

**Đính chính trước:** đề bài ghi "đếm 10/14 ngày". `pnpm db:trial` nói **1/14** — mỗi bé đúng một
phiên, 10 câu, 4–5 phút, đều trong hôm nay. `exercise-health.csv` mới có 20 dòng, mỗi bài một lượt
gặp, nên chưa đủ để nói bài nào "quá dễ" hay "ai cũng sai" theo ngưỡng của đề bài.

**Nhưng một dòng trong đó đủ để lộ một lỗi thật.** `viet-bd-0049` — *"Có bao nhiêu dế? Chạm để
đếm"*, 5 con dế, 3 lần thử, 66 giây, vẫn chưa ra — là bài duy nhất bị làm sai. Nó nằm trong gói
**phân biệt b và d**. Đếm dế không đo b/d chút nào; con đếm hụt thì hệ thống ghi "yếu b/d" và hạ
mastery của một kỹ năng con **không hề mắc lỗi**.

Rà lại thì **cả 23 bài `COUNT_TAP` trong các gói ngữ âm** (10 gói tiếng Việt + `ENL.RF.RHYME`,
`ENL.RF.SIGHT_WORDS_PREPRIMER`, `ESL.PH.ALPHABET_SOUNDS`) đều cùng kiểu "chạm từng con vật để đếm"
— đó là `VMATH.SO.DEM_VAT`, không phải học vần. `countTarget` theo thiết kế chỉ vẽ **một** loại vật
lặp lại, nên dạng bài này *về nguyên tắc* không phân biệt được b với d; sửa câu lệnh không cứu được.

→ **24 bài nghỉ hưu** (23 bài đếm + 1 bài đọc bị đổi mã khi dựng lại gói), bỏ `COUNT_TAP` khỏi
`exerciseTypes` của **16 kỹ năng ngữ âm**, và bỏ luôn 14 bài đếm khỏi ba gói **đợt 2 vừa soạn** vì
mắc đúng lỗi ấy. Nghỉ hưu chứ không xoá — `Evidence` con đã tạo vẫn trỏ đúng chỗ.

### 4. Cách chạy thử

```powershell
pnpm content:validate                 # sạch
pnpm content:stats                    # 62 kỹ năng · 2.676 PUBLISHED · 24 RETIRED · mọi kỹ năng >= 35 bài
pnpm content:import --dry-run         # 0 new, 0 updated, 0 revived, 2676 unchanged, 0 retired
node scripts/content-gen/viet-tones.mjs   # sinh lại gói bất kỳ, git diff phải trống
```

Xem tận mắt: `/admin/content` → lô "Dot 2 lo 1…4b"; `/dev/kit` để nhìn đúng như con thấy.

### 5. Tồn đọng và câu hỏi cho chủ dự án

**5.1 — Tiêu chí 1 của pha tự mâu thuẫn với mục tiêu của pha, cần chú chọn lại.**
§3 đặt mục tiêu *"30–35 kỹ năng"*; §6.1 đòi *"không kỹ năng nào thuộc tuần 1–12 của VIET, VMATH,
EMATH, ENL, ESL còn 0 bài"*. Năm môn đó có **190 kỹ năng** tuần 1–12; sau đợt 2 mới **51** kỹ năng
có bài. Phủ nốt là **139 kỹ năng ≈ 4.900 bài** — gấp 3,6 lần mục tiêu §3 và nhiều hơn cả đợt 1 lẫn
đợt 2 cộng lại. Cháu làm đúng con số §3 theo đúng thứ tự ưu tiên §3. Hiện trạng: VIET 22/75 ·
ESL 9/45 · ENL 4/30 · VMATH 8/20 · EMATH 8/20 · **ESCI 10/17**.

Đề nghị: đổi tiêu chí thành *"mọi kỹ năng **lớp đã dạy tính tới hôm nay** đều có bài"* — đo theo
nhật ký lớp thay vì theo tuần dự kiến. Lớp 1B3 đang ở bài 13–14 (tuần 3), nên đo như vậy thì đợt 2
đã phủ gần trọn phần con đã học. Đợt 3 xin nhắm **VIET bài 16–24** (m, n, g, gi, gh, nh, ng, ngh,
r, s, t, tr, th, vần ia/ua/ưa) — thứ hai con gặp trong ba tuần tới.

**5.2 — Mastery `NHAM_LAN_B_D` của một bé đang mang một lượt sai oan.** Bài gây ra nó đã nghỉ hưu,
nhưng bằng chứng vẫn nằm đó; đợt này không đụng `Evidence`/`SkillMastery` (`10` §11). Chú vào
dashboard → `VIET.HV.NHAM_LAN_B_D` → xem bằng chứng đó và ghi đè nếu thấy nên.

**5.3 — 442 bài ESCI dựng theo NGSS, không theo sách của trường.** Rủi ro lớn nhất của đợt này: nếu
trường dạy "Materials" ở học kỳ 2 thì con gặp bài trước khi học. Cần chú hỏi cô giáo môn English
Science dùng giáo trình nào (`docs/09` §1 ưu tiên 3 vẫn còn nguyên).

**5.4 — Mười gói ESCI không có thẻ lỗi nào.** Bộ 44 mã của `04` §11 không có mã nào tả được "con
nghĩ ô tô là vật sống". Muốn thang ôn tập lái được môn khoa học thì phải bổ sung bộ mã — đụng hợp
đồng dữ liệu, nên cần một ADR. Chưa làm.

**5.5 — Đã phát hành hết ngay theo quyết định của chú trong phiên này.** 1.464 bài nạp ở `DRAFT`
đúng `10` §5 bước ⑤, rồi bật `PUBLISHED` cho cả 10 lô bằng đúng `updateMany` + dòng
`CONTENT_PUBLISH` mà nút "phát hành" của `/admin/content` ghi. Hoàn tác được bằng nút **"gỡ phát
hành"** theo lô. Nếu tối nay thấy bài nào lạ, chú bấm gỡ lô đó rồi nhắn cháu.

**5.6 — Còn nhỏ:** `ENL.RF.RHYME` còn 38 bài (trên sàn 35, dưới mốc 40) sau khi nghỉ hưu 3 bài
hỏng; `lessonRef` mới của năm gói dấu thanh chưa nối lại vào `LessonUnitSkill`; hình vẫn là emoji vì
`content/art/objects/manifest.json` chưa có.

### 6. ADR

Không có ADR mới. Ba quyết định đã ghi trong `content/_reports/dot-2.md` §6 (mở rộng hợp đồng
`exerciseTypes`/`difficultyRange` cho kỹ năng đã có ngân hàng đủ; `lessonRef` của gói dấu thanh kéo
tới bài 9 theo đúng quy ước `DAU_THANH` của đợt 1; bỏ `COUNT_TAP` khỏi mọi kỹ năng ngữ âm).

---

## Pha 8b — 12/09/2026 — Cửa cho Claude chat và dữ liệu vận hành

Trạng thái: **6/7 tiêu chí đạt và đã chạy thật qua `https://edu.medifa.vn`**; tiêu chí 3 (bấm nút
"Hoàn tác lô này" trên web) chứng minh được ở tầng dữ liệu nhưng **cái bấm** vẫn chờ tài khoản test.
1 commit, **chưa push**. `lint` sạch · **458 test đơn vị** (core 215, db 116, content 66, web 43,
inbox 18) · `build` 4 gói xanh · **e2e 51 bài: 18 xanh, 33 skip, 0 đỏ**.

> Từ tối nay anh chụp bài vở bằng app Claude trên điện thoại là xong — **không gõ lệnh nào**. Thẻ
> hiện trên `/parent`, sai thì bấm "Hoàn tác lô này".

### 1. Đã làm gì

| Việc | Tóm tắt |
|---|---|
| 0 — tên hai chữ | `pnpm db:seed:dev` đã chạy: `/login` hiện **Mai Thy** và **Chí Thanh**. Không đụng gì khác của hai hồ sơ |
| 1 — API nội bộ | 4 endpoint `/api/internal/{context, intake, intake/photo, diary}`, token bearer, giới hạn tần suất, log mọi lời gọi lên `/admin/inbox`, `batchId` + `source=CHAT_INTAKE` (0,8), thẻ tối nay + **nút hoàn tác** trên `/parent` |
| 2 — dữ liệu vận hành | `pnpm ops:export` (11 CSV + `meta.json` + `SUMMARY.md` + `ops/context/`), tự chạy 04:30 sau planner; `pnpm ops:apply` in diff → chờ gật → áp → đường lùi + `CHANGELOG.md` |

**Cửa vào là token, không phải phiên đăng nhập.** `/api/internal/*` **chỉ** nhận
`Authorization: Bearer $INTERNAL_API_TOKEN`; không nhận cookie, không nhận cả phiên ADMIN. Lý do:
điện thoại không tạo được phiên nào trong ba thứ đó, mà nhận phiên thì một tab bỏ quên trên iPad
trong bếp cũng ghi được bằng chứng. Cloudflare Access cho nhánh này qua (docs/13 §7.1), nên token là
khoá duy nhất — và mọi lời gọi, kể cả lần bị từ chối, nằm trong bảng mới ở `/admin/inbox`.

**Áp luôn, nhưng ba chỗ thì không.** Máy đọc chữ viết tay của trẻ 6 tuổi sai nhiều nhất ở ba chỗ,
và sai ở đó thì hại nhất, nên chúng **không tự áp**: `confidence < 0,6`; không phân biệt được ô
trống với làm chưa đúng; kỹ năng không nằm trong danh sách ngữ cảnh máy chủ đã phát ra. Thêm hai
chỗ nữa tôi chặn vì cùng loại rủi ro: ảnh ghi **tên bé khác**, và người đọc tự đánh dấu
`needsParent` (kỹ năng `nap-bai-vo-edison` trên điện thoại được dạy đặt cờ này — trước khi sửa,
máy chủ **bỏ qua** nó). Những câu bị giữ nằm trong `/parent/inbox` như ảnh vở bình thường, duyệt
một chạm.

**Hoàn tác là tính lại, không phải khôi phục ảnh chụp.** Nút "Hoàn tác lô này" xoá `Evidence` của lô
rồi **dựng lại mastery từ bằng chứng còn lại** (`recomputeSkillMastery`). Khôi phục một bản chụp
thì ít code hơn, nhưng nó sẽ xoá luôn thứ con làm *sau* lô đó — phiên lúc 8 giờ trong khi ảnh được
đọc lúc 9 giờ. Mastery là hàm của bằng chứng (`04` §3.1), nên phát lại **chính là** giá trị cũ, và
đúng dù trong lúc đó có chuyện gì xảy ra. Hai thứ không nằm trong `Evidence` được lấy lại từ chỗ
chúng sống: `hintsUsed`/`tries` trên `Attempt`, và `weightFactor` chia ngược ra từ `weight`. Có test
chứng minh sai số **dưới 10⁻⁶** trên một kỹ năng đã có lịch sử thật (một bài làm đúng một nửa, có
gợi ý, ở lần thử thứ hai).

**`ops/` — thư mục là API.** Claude chat trên điện thoại không nói chuyện được với Postgres, nên
04:30 mỗi đêm máy chụp lại toàn bộ số liệu ra CSV phẳng: cùng thứ tự cột mỗi đêm để `diff` được hai
ngày, dưới 5 MB/ngày (hiện 30 KB), giữ 90 ngày, **không có tên đầy đủ, không ngày sinh** — có test
lấy tên thật trong DB rồi khẳng định không file nào chứa nó. Muốn đổi gì thì đặt một file JSON vào
`ops/requests/`; `pnpm ops:apply` in **trước → sau → đường lùi** rồi hỏi `y/N`.

**Sàn ôn 30% giờ có ba lớp khoá.** `setPlannerWeight` xin ôn 20% bị **từ chối ngay ở validator** kèm
câu giải thích; nếu bằng cách nào đó vẫn lọt vào `Setting`, `plannerMix()` trong `packages/core`
kẹp lại ở 30% khi dựng phiên. Lý do đáng ghi: phần ôn trả kết quả vào tháng 11, lúc không ai nhìn —
nên nó phải được bảo vệ ở chỗ kế hoạch thật sự được dựng, không phải ở chỗ người ta nhớ ra.

### 2. Cách chạy thử từng tiêu chí (PowerShell, tại gốc repo)

```powershell
$T = (Select-String .env -Pattern '^INTERNAL_API_TOKEN=(.*)$').Matches.Groups[1].Value.Trim()

# 1. ngữ cảnh + 401
curl.exe -s -o NUL -w "%{http_code}`n" "https://edu.medifa.vn/api/internal/context?student=thy"
curl.exe -s -H "Authorization: Bearer $T" "https://edu.medifa.vn/api/internal/context?student=thy&date=2026-09-12"

# 2+3+4. cả đường: đọc ngữ cảnh → đẩy kết quả → 400 khi mã lạ
pnpm --filter @mtct/web exec playwright test e2e/phase8b-acceptance.spec.ts

# 5. ảnh chụp vận hành
pnpm ops:export ; notepad ops\state\SUMMARY.md

# 6. tên hai chữ
start https://edu.medifa.vn/login

# 7. xanh hết
pnpm lint ; pnpm test ; pnpm build ; pnpm e2e:all
```

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | `context` trả 200 + skillCandidates; không token → 401 | **Đạt** — 200 với 32 ứng viên kỹ năng, 44 mã lỗi, 12 kỹ năng bài lớp 3 ngày gần nhất; không token và token sai đều **401**; bé không có → 404 |
| 2 | Đẩy IntakeExtraction hợp lệ → Evidence, mastery đổi, thẻ hiện | **Đạt** — 3 câu → 3 `Evidence` `CHAT_INTAKE` trọng số 0,8, mastery `VMATH.SO.SO_SANH_1_10` **23,2 → 43,7**, thẻ có `canUndo` |
| 3 | Bấm "Hoàn tác lô này" → Evidence biến mất, mastery về cũ | **Một nửa đạt** — cơ chế chạy thật: 3 → 0 bằng chứng, mastery **43,73 → 23,184** (đúng giá trị trước), lô sang `UNDONE`, bấm lần hai không đổi gì. **Cái bấm trên web chưa chạy được** vì chưa có tài khoản test — bài e2e đã viết sẵn, `skip` cho tới khi có |
| 4 | Mã kỹ năng lạ → 400 kèm chỗ sai | **Đạt** — ba ca đều 400: mã kỹ năng lạ (`items[0].skillCodes[0]`), mã lỗi lạ (`items[0].errorCode`), thiếu trường (`kind`) |
| 5 | `ops:export` sinh đủ file, `SUMMARY.md` đọc hiểu trong 30 giây | **Đạt** — 13 file / 30 KB, `SUMMARY.md` một trang |
| 6 | `/login` hiện "Mai Thy" và "Chí Thanh" | **Đạt** — đã xem trên máy |
| 7 | lint/test/build xanh, e2e pha cũ vẫn xanh | **Đạt** — 458 test, build 4 gói, e2e **0 đỏ** (18 xanh / 33 skip). Sửa thêm một assert cũ đã đỏ từ pha 8: `login.spec` còn kiểm `body.db === "ok"` trong khi `/api/health` đã đổi thành thẻ `{ok, migrations, sizeMb}` |

### 3. Hai việc tôi làm hỏng rồi sửa — **anh nên đọc mục này**

**a) Bài e2e của tôi đè lên nhật ký lớp hôm nay.** Bài kiểm tra `POST /api/internal/diary` dán một
đoạn giả vào **đúng lớp 1B3, đúng ngày hôm nay**, mà `saveClassDiary` ghi đè theo khoá (lớp, ngày) —
nên bài đăng thật của cô sáng nay bị thay bằng đoạn giả, và bài cô giao buổi tối được dựng lại từ
đoạn giả đó. **Đã khôi phục**: bản sao lưu 10:43 sáng nay còn nguyên văn bản gốc, tôi lấy ra và chạy
lại bộ đọc — 3 bài học, 3 việc cô giao, 1 lời nhắc, `confidence` 1, không dòng nào đọc hụt, đúng như
trước. Bài e2e nay dán vào lớp `E2E-8B` (lớp không bé nào thuộc về) nên không thể chạm vào ngày thật
nữa. Đây cũng là lần đầu bản sao lưu hằng đêm **được dùng thật** thay vì diễn tập.

**b) Chạy bộ e2e để lại dữ liệu học giả.** Bài pha 3 làm hết một phiên của `thy` — máy giờ ghi
`thy: 1 ngày, 78 phút` cho hôm nay, và `pnpm db:trial` sẽ đếm đó là **một ngày đạt**. Mọi lô ảnh và
bằng chứng `CHAT_INTAKE` do tôi tạo đã được gỡ sạch (`chatEvidence: 0`), nhưng phiên của pha 3 thì
không phải của tôi mà xoá. **Đề nghị:** sáng hôm bắt đầu hai tuần chạy thật, chạy
`pnpm db:reset-learning --apply` một lần cho sạch vạch xuất phát — lệnh này in số dòng nội dung
trước/sau để chứng minh không đụng ngân hàng bài.

### 4. Quyết định tôi tự lấy (không viết ADR, nhưng anh nên biết)

1. **Không đọc ngữ cảnh thì lô bị giữ lại, không bị từ chối.** `docs/13` §7.4 nói chat *phải* đọc
   `/context` trước. Từ chối thẳng sẽ làm mất một tối ảnh vì một lỗi quy trình; giữ lại thì không
   mất gì mà vẫn không tự ghi. Máy chủ trả về `contextId` và một dòng nhắc gửi kèm.
2. **Mã kỹ năng "lạ" chia làm hai.** Mã **không có trong bản đồ** → 400 (tiêu chí 4). Mã **có thật
   nhưng không nằm trong danh sách ngữ cảnh đã phát ra** → giữ lại chờ người (docs/13 §7.3). Hai câu
   trong đề bài nói như nhau nhưng là hai chuyện khác nhau: một cái là bịa, một cái là chọn lệch.
3. **`setSessionLength` nhận 8–20 nhưng planner giữ 8–15.** `docs/14` §4 cho 8–20, `docs/04` §4 kẹp
   một phiên trong 8–15 bài. Tôi giữ cả hai: yêu cầu 20 được nhận, diff nói rõ "sẽ thành 15".
4. **Nhật ký lớp không có nút hoàn tác.** Một lô ảnh sinh bằng chứng nên gỡ được; nhật ký thì không
   sinh bằng chứng nào về con — dán lại là sửa xong, và đó mới là thao tác đúng.
5. **Giới hạn tần suất để trong bộ nhớ**, không thêm Redis: một tiến trình phục vụ cả nhà; khởi động
   lại quên một phút đếm không phải rủi ro đáng một service.

### 5. Tồn đọng

1. **Tiêu chí 3 còn nửa cái bấm** — cần tài khoản `ADMIN` test (`qc`) hoặc một tài khoản `PARENT`
   thật. Vẫn là món nợ thứ ba liên tiếp (pha 5, pha 8, pha 8b) và nó chặn **34 bài e2e**.
2. **Chưa thử với ảnh thật.** Toàn bộ đường đi đã chạy thật qua tên miền, nhưng bằng JSON tôi tự
   dựng. Tối đầu tiên anh gửi ảnh thật là lần đầu `POST /intake/photo` nhận một tấm ảnh thật.
3. **20 ảnh vở mẫu của pha 4 vẫn nợ** — vẫn chặn nửa còn lại của eval đọc ảnh.
4. **`ops/state/` không lên git** (có dữ liệu học của con); `ops/requests`, `ops/applied`,
   `ops/rejected`, `ops/context`, `ops/CHANGELOG.md` thì theo git.
5. **Ảnh chụp màn hình trong `docs/screens/` bị bộ e2e vẽ lại** — nay đã hiện đúng "Mai Thy" /
   "Chí Thanh", nên tôi giữ bản mới.

### 6. Câu hỏi cần chủ dự án quyết

1. **Tài khoản test** (mục 5.1) — năm phút, và nó mở khoá 34 bài e2e.
2. **Có chạy `pnpm db:reset-learning --apply` trước ngày 1 không?** (mục 3b). Tôi nghiêng về có.
3. **Đã thêm `edu.medifa.vn` vào danh sách mạng cho phép của tài khoản Claude chưa?** Nếu chưa thì
   app trên điện thoại sẽ báo bị chặn ở tầng mạng, không phải lỗi máy chủ.

## Pha 8 — 12/09/2026 — Vận hành & nghiệm thu thực tế *(đang chạy: hai tuần dùng thật chưa bắt đầu)*

Trạng thái: **hạ tầng xong, 4/7 tiêu chí đạt, 3 tiêu chí cần thời gian thật hoặc cần chủ dự án.**
3 commit, **chưa push**. `lint` sạch · **424 test đơn vị** (core 212, db 95, content 66, web 34,
inbox 17) · `build` 4 gói xanh · **e2e pha 8: 4/6 chạy, 2 skip** vì chưa có tài khoản test.

> **Pha này khác mọi pha trước:** tiêu chí xong không phải code xanh, mà là hai đứa trẻ 6 tuổi tự
> mở ra học được trong 14 ngày. Ngày hôm nay là **ngày 0**. Mọi thứ chạy được bằng máy đã làm và đã
> kiểm; thứ còn thiếu là **thời gian lịch** và **bảy việc của chủ dự án** ở mục 7.

### 1. Đã làm gì, commit nào

| Việc | Commit | Tóm tắt |
|---|---|---|
| 0 — nợ pha 5 | `8a8dc70` | đảo ADR-18 mục 1, xoá dữ liệu dev lệch múi giờ, 15 tài khoản e2e, test canh giữ TZ |
| 1, 2, 3, 4 | `bb51b8c` | Tunnel + Access, PWA, sao lưu + diễn tập khôi phục, phiên chẩn đoán, health |
| 5 + đo lường | `ceab327` | `pnpm db:trial`, nhật ký chạy thật, bộ nghiệm thu pha 8, tiêu chí mới ở `docs/08` |

*(Giữa `8a8dc70` và `bb51b8c` có `817232c` — **không phải của tôi**, một phiên Claude Code khác
sửa lỗi TTS `vi` vs `vi-VN` trên cùng nhánh. Không đụng nhau.)*

**Việc 0.1 — nhịp ôn thắng con số nghiệm thu.** Chủ dự án đảo ADR-18 mục 1. `PLAN_SHARE` xuống
**0,4**, và có **sàn ôn cứng** đúng 30% của `04` §4: vòng lấn chỗ bỏ qua trạm ôn khi đã chạm sàn.
Khi hai ràng buộc va nhau, planner **không phá sàn** — nó ghi vào log ba mẹ đọc được:
`kế hoạch tuần đã duyệt: … (dưới 40% vì giữ nhịp ôn)` và `giữ n/y bài ôn (sàn m)`. Lý do đáng ghi
lại: phần ôn trả kết quả vào tháng 11, lúc không ai nhìn, nên nó phải được bảo vệ bằng luật chứ
không bằng trí nhớ.

**Việc 0.3 — xoá, không migrate.** 52/72 phiên lệch ngày, **và** toàn bộ 1.662 dòng do bộ e2e sinh
ra. Dịch ngày chỉ chữa nửa vấn đề; nửa còn lại là phiên chẩn đoán đầu vào sẽ khởi động từ một mô
hình năng lực dựng bằng câu trả lời của máy. `pnpm db:reset-learning --apply` in số dòng của
`Skill`/`Exercise`/`LessonUnit`/`ContentBatch` trước và sau để chứng minh không đụng nội dung.

**Việc 1 — ra internet, nhưng không phải phần của con.** Access chắn `/parent`, `/admin`, `/dev`,
`/api/admin`, và **máy chủ ở nhà tự kiểm chữ ký** chứ không tin rằng không ai tìm được đường khác
vào. Phần của con cố ý nằm ngoài: trẻ 6 tuổi không đọc được email lấy mã một lần, bắt con qua lớp
đó nghĩa là ba mẹ phải ngồi cạnh mỗi tối — đúng thứ dự án này sinh ra để khỏi phải làm. Có một test
mà việc duy nhất của nó là **đỏ lên nếu `/kid` lọt vào danh sách bị chắn**.

**Việc 1 — icon.** Vẽ mới, không cắt từ mascot: ở 60 px giữa ba mươi icon khác, mặt mascot thành
một vệt nhoè. Một ngôi sao trên nền trời bình minh chung của hai thế giới — sao là đơn vị phần
thưởng cả app, hai bé đã quen. Zoom tắt **chỉ trong vùng của con**: con tì tay lên màn hình khi
nghĩ; ba mẹ vẫn cần chụm tay phóng to trang bằng chứng trên điện thoại.

**Việc 2 — sao lưu đã được khôi phục thật.** `pg_dump` + bản sao ảnh mỗi đêm ra một thư mục
Explorer mở được. Diễn tập dựng một Postgres trắng, khôi phục vào đó, đếm lại từng bảng, tự dọn:
**ĐẠT, 7 giây, 1.236 bài và 376 kỹ năng về đủ** (`docs/dien-tap/khoi-phuc-20260912-104915.md`).

**Việc 4 — phiên chẩn đoán `04` §10, trước nay chưa từng được xây.** Mười câu một tối, ba tối, mỗi
câu trả lời chọn câu sau: đúng → lên trong mạch, chưa chắc → **về tiên quyết** (chứ không phải lùi
một bậc — `04` §2 nói rõ tiên quyết lung lay mới là thứ đáng tìm ra). Nó được trả về **dưới dạng
Daily Quest**, không phải một màn hình riêng: con bấm "Học ngay" như mọi hôm và không được cho biết
đây là bài kiểm tra.

### 2. Cách chạy thử (PowerShell, tại gốc repo)

```powershell
docker compose --env-file .env -f docker/compose.yml up -d
pnpm db:usage                    # sức khoẻ + chi phí + "cần làm gì"
pnpm db:assess -- --status       # còn mấy phiên chẩn đoán
pwsh scripts/restore-drill.ps1   # diễn tập khôi phục (~10 giây)
pnpm db:trial                    # số liệu 14 ngày (hôm nay còn trống)
```

| Tiêu chí | Chạy gì |
|---|---|
| 1. 10 phút/ngày, ≥10/14 ngày | `pnpm db:trial` — sau 14 ngày thật |
| 2. Khôi phục trên máy sạch | `pwsh scripts/restore-drill.ps1` |
| 3. iPad + mã 4 hình | `pnpm e2e:all` bài `phase8` 3a/3b/3c, và một lần thật trên iPad |
| 4. Access chắn `/parent`, `/admin` | `phase8` bài 4 — tự bật máy chủ thứ hai có Access |
| 5. Hạn mức giọng Azure | `/admin/health` hoặc `pnpm db:usage` |
| 6. `VAN-HANH.md` đủ dùng | `phase8` bài 5, và test `health.test.ts` |
| 7. Việc 0 | `pnpm test` (planner + 2 bộ canh giữ múi giờ) |

### 3. Bảng 7 tiêu chí xong

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | 2 bé tự dùng 10 phút/ngày, ≥ 10/14 ngày | **Chưa đo được — hôm nay là ngày 0.** Công cụ đo xong và đã chạy: `pnpm db:trial` in bảng 14 ngày cho từng bé. Cách đo và **giới hạn trung thực của nó** ở mục 6 |
| 2 | Khôi phục sao lưu trên máy sạch | **Đạt** — 12/09 10:49, container trắng, 7 giây, log trong `docs/dien-tap/` |
| 3 | Hai bé mở từ icon, đăng nhập 4 hình, không bàn phím | **Một nửa đạt** — manifest + 5 icon PNG + màn hình 4 hình đã kiểm bằng e2e (kể cả opacity của thẻ ảnh, vì `toBeVisible()` bỏ qua opacity). **Chưa thử trên iPad thật** vì chưa có iPad và **hai bé chưa có mã 4 hình** (mục 7) |
| 4 | `/parent`, `/admin` chặn; phần con vẫn vào | **Đạt** — e2e bật một máy chủ thứ hai có Access: `/parent`, `/admin/users`, `/admin/health`, `/api/admin/users` → **403**; `/login`, `/manifest.webmanifest`, `/api/health`, `/kid/home` → **không 403** |
| 5 | Chi phí TTS Azure trong hạn mức F0 | **Đạt** — tháng 09: **71 / 500.000 ký tự** (0%). Bộ đếm đã bắt được một lần gọi thật. Xem ở `/admin/health` và `pnpm db:usage` |
| 6 | `VAN-HANH.md` đủ để tự xử lý | **Đạt về phần máy** — `docs/VAN-HANH.md` 11 mục, bắt đầu bằng "web không vào được"; mọi cảnh báo trên `/admin/health` kèm dòng lệnh, có test bắt buộc điều đó. **Chưa ai ngoài tôi đọc thử** — đây là thứ chỉ chủ dự án nghiệm thu được |
| 7 | Việc 0 xong | **Một nửa đạt** — nhịp ôn ≥ 30% (có test), dữ liệu múi giờ sạch, 2 bộ test canh giữ TZ xanh, `.env.example` + README có đường chạy 39 bài. **Chưa chạy đủ 39 bài** vì tài khoản test là việc chủ dự án (mục 7) |

### 4. Số liệu 14 ngày

**Bằng 0 — hôm nay là ngày 0.** Không có số liệu để báo, và tôi không đoán.

```
HAI TUẦN CHẠY THẬT — 2026-08-30 → 2026-09-12 (14 ngày)
Mai Thy   : học 0/14 ngày · 0 phút · 0 câu · bỏ dở 0 phiên · đạt 0/14
Chí Thanh : học 0/14 ngày · 0 phút · 0 câu · bỏ dở 0 phiên · đạt 0/14
```

Đúng như phải thế: dữ liệu học dev đã xoá ở việc 0.3, và hai bé chưa bắt đầu.

### 5. Hai bé phàn nàn gì

**Chưa có gì để trích** — chưa bé nào dùng. `docs/nhat-ky-chay-that.md` đã sẵn khung ghi, và mục
đáng giá nhất trong đó là **nguyên văn con nói gì**, vì đó là thứ duy nhất không có trong DB.

### 6. Cách đo tiêu chí 1, và chỗ nó *không* đo được

`pnpm db:trial` đếm, cho từng bé từng ngày: một **ngày đạt** là ngày con (1) **làm xong** một phiên,
(2) ≥ **10 phút**, (3) **không có dấu vết ba mẹ giúp**.

- "Phút" đếm từ **khoảng cách giữa các câu trả lời**, mỗi câu tối đa 3 phút, không quá đồng hồ của
  phiên. Lý do: iPad ngửa trên bàn 40 phút không phải 40 phút học, và một tiêu chí đếm theo đồng hồ
  treo tường sẽ **đạt chỉ bằng cách để app mở**.
- "Ba mẹ giúp" máy chỉ thấy **hai** thứ: ba mẹ sửa nhãn (`PARENT_OVERRIDE`), và ba mẹ chấm bài
  nói/viết (`gradedBy = PARENT`).

**Thứ máy không thấy:** ba mẹ ngồi cạnh đọc hộ đề, hay chỉ tay vào ô đúng. Không dấu vết nào cả.
Nên **con số của máy là trần, không phải sự thật** — nhật ký viết tay là phần hiệu chỉnh. Nếu cuối
hai tuần máy nói "đạt 12/14" mà nhật ký ghi 6 ngày phải nhờ đọc đề, thì **nhật ký đúng**. Tôi viết
điều này vào cả module, cả đầu ra của lệnh, và cả nhật ký, để không ai vô tình báo cáo con số trần.

### 7. Việc chủ dự án phải làm — **hai tuần không bắt đầu được nếu thiếu**

1. **Hai bé chưa đăng nhập được.** `thy` và `thanh` **chưa có mã 4 hình** (`passwordHash` rỗng).
   `/admin/users` → chọn bé → đặt mã hình. **Cho chính con chọn 4 hình con thích.**
2. **Chưa có tài khoản `PARENT` nào**, và `thy`/`thanh` **chưa nối với người lớn nào** —
   `/parent` sẽ trống. `/admin/users` → thêm `PARENT` cho Ba và Mẹ, chọn cả hai bé ở ô "Con".
3. **Tài khoản `ADMIN` test** (`qc`) để chạy 39 bài e2e — README mục "Chạy bộ nghiệm thu". Đây là
   thứ duy nhất chặn tiêu chí 7, và là món nợ thứ hai liên tiếp sau pha 5.
4. **Ngày sinh hai bé** đang là `2020-01-01` (giá trị tạm của seed).
5. **Cloudflare Tunnel + Access** — `docs/VAN-HANH.md` §4, cần tài khoản Cloudflare + tên miền.
6. **Cài lên iPad** cho từng bé — `docs/VAN-HANH.md` §5.
7. **Bật sao lưu hằng đêm**:
   `docker compose --env-file .env -f docker/compose.yml --profile backup up -d backup`

### 8. Danh sách việc cho pha 6 — xếp theo mức cấp thiết

Hai tuần chạy thật chưa cho dữ liệu, nhưng **việc dựng phiên chẩn đoán đã lộ ra một con số đủ để
xếp hạng ngay**, và nó nghiêm trọng hơn dự đoán:

> **1.236 bài của đợt 1 phủ đúng 28 / 376 kỹ năng.** Sâu (40–60 bài mỗi kỹ năng) nhưng **rất hẹp**.
> **132 kỹ năng lớp đã học hoặc sắp học (tuần 1–8) chưa có bài nào.**

| # | Việc | Vì sao cấp thiết |
|---|---|---|
| **1** | **ESCI — 0 bài trên 47 kỹ năng.** Cả môn không có gì | Tối chẩn đoán thứ ba đáng lẽ hỏi EMATH + ESCI; nó **không hỏi được câu nào** về ESCI. Bản đồ năng lực của cả hai bé sẽ trắng cả một môn |
| **2** | **EMATH — 2/51 kỹ năng có bài**; `G`, `MD`, `MP` trắng hoàn toàn | Cùng lý do; tối thứ ba phải mượn môn khác lấp chỗ |
| **3** | **132 kỹ năng tuần 1–8 chưa có bài** — nhiều nhất ở `VIET.HV` (vần), `ESL.PH` (CVC), `ESL.VOC` | Lớp **đang học chính những thứ này**. Nhật ký lớp sẽ trỏ vào chúng mỗi tối và planner không có gì để đưa ra |
| **4** | **`ENL.RL.*` và `ENL.W.*`** — món nợ pha 5 ghi vào pha 7 | Không dạng bài nào chở được; xem `docs/08` pha 7 mục 6 |
| **5** | **`ESL.LIS.*`, `ESL.SPK.*`, `ENL.SL.*`, `VIET.NN.*`** — nghe/nói, trắng hoàn toàn | Cần dạng bài `SPEAK_ANSWER` (pha 7 mục 4) trước khi soạn được |
| **6** | **`VMATH.HH.*`, `VMATH.DL.*`, `VIET.DOC.*`, `VIET.VIET.*`** trắng | Hình học, đo lường, đọc, viết — bốn mạch lớn |
| 7 | Dạng bài nào con chán / con thích | **Chờ hai tuần chạy thật** — mục 5 của pha 8 |
| 8 | Gộp thẻ "Bài cô giao hôm nay" theo nội dung | Món nợ pha 5 tồn đọng 4 |

Danh sách kỹ năng đầy đủ lấy lại bất cứ lúc nào bằng `pnpm content:stats`.

### 9. ADR đã viết

**Không viết ADR mới.** Hai chỗ lệch tài liệu đều đã có chỗ ghi sẵn:

- **ADR-18 mục 1 bị đảo ngược**, ghi ngay trong ADR-18 (mục "Cập nhật 12/09/2026") thay vì mở ADR
  mới — một quyết định bị lật thì thuộc về chính tài liệu đã chốt nó, không phải một tài liệu khác.
- **Ghi chú cuối ADR-18** (lỗi múi giờ) cập nhật: dữ liệu cũ **đã xoá**, không migrate.
- `docs/08` pha 8: **7 tiêu chí xong** viết lại theo đúng bản chủ dự án chốt; bỏ "chi phí AI ≤ 6
  USD/tháng" (ADR-9/ADR-10 đã lấy hết lời gọi LLM ra khỏi hệ thống đang chạy).

### 10. Chưa làm / tồn đọng / giả định

1. **Hai tuần chạy thật chưa bắt đầu** — đây là thời gian lịch, không phải việc code. Mục 7 là điều
   kiện cần.
2. **2/6 bài e2e pha 8 skip** (và 23/39 của các pha trước) vì chưa có tài khoản `ADMIN` test.
3. **Sao lưu thư mục file đang rỗng** — `/data/files` là volume của Docker, mà máy dev đang chạy
   `pnpm dev` với `FILE_ROOT` trên host. Khi chạy bằng docker thật thì nó đầy. Không phải lỗi, là
   khác môi trường; `restore.sh` in sẵn lệnh chép ngược.
4. **Access cần chung một AUD cho `/parent` và `/admin`.** Nếu Cloudflare cấp AUD khác nhau cho hai
   ứng dụng thì phải làm **một** ứng dụng phủ cả tên miền + Bypass policy cho `/kid`, `/login`,
   `/api`, `/art` — ghi ở `VAN-HANH.md` §4.3. Chưa kiểm được vì chưa có tài khoản Cloudflare.
5. **Giả định về `04` §10:** "3 phiên, mỗi môn ~10 bài" không thể là 10 bài cho 6 môn trong 3 phiên
   10 bài. Tôi đọc là **3 tối × 10 trạm, mỗi tối 2 môn** (Việt+Toán / ESL+ENL / EMath+ESci). Nếu
   chủ dự án đọc khác thì sửa `ASSESSMENT_ROUNDS` là xong.
6. **Tôi đã tạm dừng `next start` và worker của một phiên Claude Code khác** để chạy `pnpm build`
   (hai tiến trình đó giữ `query_engine-windows.dll.node`) — **có hỏi và được đồng ý**, và đã bật
   lại ngay sau khi build xong; `/api/health` trả `ok`.
7. **`prisma migrate dev` của phiên kia (PID 27368) đang treo ~1 tiếng**, nhiều khả năng kẹt ở một
   câu hỏi tương tác. Tôi không đụng vào. Nếu nó vẫn treo, đóng cửa sổ đó.

### 11. Câu hỏi cần chủ dự án quyết

1. **Bảy việc ở mục 7** — hai tuần bắt đầu được ngay sau khi xong, và việc 1 (mã 4 hình) chỉ mất
   năm phút.
2. **Thứ tự soạn pha 6:** tôi xếp ESCI lên đầu vì cả môn trắng. Nhưng nếu ở lớp ESCI chỉ là 1
   tiết/tuần và ít bài về nhà, thì **132 kỹ năng tuần 1–8** (mục 3 của bảng) đáng làm trước. Anh
   nhìn thực tế lớp rõ hơn tôi.
3. **Hai tuần chạy thật bắt đầu ngày nào?** Nên bắt đầu vào **thứ Hai** để 14 ngày phủ đúng hai
   tuần học — bắt đầu giữa tuần sẽ có hai cuối tuần rơi vào giữa và con số 10/14 khó đạt vì lý do
   không liên quan gì đến app.
4. **20 ảnh vở mẫu của pha 4 vẫn nợ** — vẫn là thứ chặn nửa còn lại của eval đọc ảnh.

## Pha 5 — 12/09/2026 — Bảng điều khiển ba mẹ

Trạng thái: **xong, 8/8 tiêu chí đạt** — nhưng phần e2e chỉ chạy được **16/39** bài vì tôi không có
mật khẩu admin (mục 7 dưới). 5 commit, **chưa push**. `lint` sạch · **347 test đơn vị** (core 186,
content 66, db 55, web 25, inbox 17) · `build` 4 gói · **e2e pha 5: 7/7 xanh**, pha 3: 5/5 xanh.

### 1. Đã làm gì, commit nào

| Việc | Commit | Tóm tắt |
|---|---|---|
| 0 — ba quyết định | `c72ea42` | năm học 24/08, dọn hồ sơ test, ghi hai lỗ ENL vào pha 7 |
| 1 — P2, P3 · 2 — P4 | `9e36cea` | tổng quan, hồ sơ bé, bản đồ năng lực, trang bằng chứng, "Luyện hôm nay" |
| 3 — P9 kế hoạch | `9eb6b28` | task `PLAN` qua hàng chờ, duyệt, planner đọc kế hoạch + `PlanHint` + TKB |
| 4, 5, 6 — P12, P13, điện thoại, nhật ký | `2359b5a` | sửa TKB & tuần nghỉ, cài đặt bé, bottom tab + nút chụp, ô dán nhật ký trên P2 |
| Bộ nghiệm thu | `f58e12a` | 7 bài e2e đi đúng đường thật, và 3 lỗi nó tìm ra |

**Việc 1 — P2/P3 và nguyên tắc "không con số nào là hộp đen".** Mọi ô số trên hai màn hình là một
link vào **một** trang bằng chứng duy nhất (`/parent/<bé>/evidence`), lọc đúng cách con số đó được
đếm. Một dòng ở trang đó kết thúc ở **thứ đã thật sự xảy ra**: câu con làm trong app, hoặc câu đọc
được từ ảnh vở — kèm chính tấm ảnh. Làm một trang drill-down tử tế thay vì sáu trang dở dang.

"3 điều cần chú ý" tính bằng quy tắc trong `packages/core/src/attention/` (`04` §3.5 + §11.5): **lỗi
gì · mấy lần · bậc mấy của thang rèn · 5 phút tối nay làm gì**, hoạt động 5 phút chọn theo *nhóm*
lỗi nên cả 44 mã đều có việc để làm. Thứ tự xếp hạng có lý do: lỗi lặp lại thắng một con số thấp
trên biểu đồ (nó cụ thể, nó lặp, và tối nay làm được gì đó); kỹ năng yếu **có tiên quyết yếu hơn**
thì báo cáo tiên quyết (`04` §3.5 "tìm gốc rễ") vì rèn ngọn của một chồng không có gốc là mất một
tuần; mã hành vi (`doan_bua`, `bo_trong`) xếp **cuối** — thật, nhưng không phải lỗ hổng kiến thức,
và ba mẹ đọc nó đầu tiên sẽ nghĩ con cẩu thả trong khi con đang bí. Định nghĩa "yếu" **import từ**
`mastery/status.ts` chứ không viết lại — không được có hai câu trả lời cho "con có yếu phần này
không", nếu không dashboard và phiên học tối nay sẽ cãi nhau trước mặt ba mẹ.

**Việc 2 — P4.** Mỗi kỹ năng một ô vuông, xếp theo thứ tự lớp dạy, màu theo trạng thái, viền xanh
khi lớp đã học mà con chưa có bằng chứng nào. Drawer mở ra lịch sử, bằng chứng (gồm ảnh của pha 4),
lộ trình mong đợi theo `expectedWeek`, và nút **"Luyện hôm nay"**. Xuất PDF bằng hộp thoại in của
trình duyệt — lý do ở ADR-18 mục 3.

**Việc 3 — P9.** `PLAN` là `InboxKind` mới nên nó đi đúng con đường của mọi việc cần đọc (ADR-10).
`inbox:pull` đính kèm snapshot **dựng lúc pull**, không phải lúc bấm nút: mastery, lỗi đang hoạt
động, thang rèn, thời khoá biểu, bài lớp học tuần qua, và hai kế hoạch gần nhất đã chạy ra sao.
Schema **từ chối** một kỹ năng không có câu lý do — ba mẹ phải cãi được với một câu, chứ không phải
với một danh sách mã. Sửa không phải là duyệt. Planner nay cũng đọc `PlanHint` (món nợ pha 4 ghi ở
mục 7.1) và **thời khoá biểu** — `todaySubjects` đã nằm trong `PlannerInput` từ pha 3 mà chưa ai
dùng, nên tiêu chí 2 trước pha này chưa từng đạt.

**Việc 6 — nhật ký lớp thành thói quen.** Ô dán nằm **trên** P2, không trong menu. Một nút đọc bảng
nhớ tạm nên trên điện thoại không cần bàn phím. Lưu xong, thẻ nói ngay **20 giây vừa mua được gì**:
lớp hôm nay học gì, và kỹ năng nào vào quest tối nay của từng bé. Thẻ nhắc chỉ hiện vào **buổi tối
ngày học** khi chưa dán, tắt một chạm là im hết ngày, và **không bao giờ hiện cuối tuần** — quy tắc
là hàm thuần có test riêng.

### 2. Cách chạy thử (PowerShell, tại gốc repo)

```powershell
docker compose --env-file .env -f docker/compose.yml up -d db
pnpm db:migrate          # 1 migration mới: InboxKind.PLAN
pnpm dev
```

| Tiêu chí | Chạy gì |
|---|---|
| 1. Con số → bằng chứng | Mở `/parent` → thẻ bé → bấm ô "Từ ảnh bài vở": số trên thẻ phải khớp số trên trang bằng chứng, và mỗi dòng có ảnh + câu hỏi |
| 2. Đổi TKB → đổi môn ưu tiên | `/parent/school`, đổi 2 tiết thứ Ba sang Toán → `pnpm plan:run -- --student thy --date 2026-09-15 --force` → xem `generationLog.log` |
| 3. Duyệt plan → ≥ 50% | `/parent/<bé>/plan` → "Nhờ Claude Code đề xuất" → `pnpm inbox:pull` → viết `result.json` → `pnpm inbox:validate; pnpm inbox:push` → Duyệt → `pnpm plan:run` |
| 4. "Luyện hôm nay" | `/parent/<bé>/skills` → chạm một ô → "Luyện hôm nay" |
| 5. Dán nhật ký | `/parent`, dán bài đăng của cô vào ô trên cùng |
| 6. Điện thoại | Thu cửa sổ còn 390 px, hoặc mở bằng điện thoại qua Cloudflare Tunnel |
| 7. Việc 0 | `pnpm db:school-year` · `pnpm db:clean-test-students` |
| 8. Tất cả | `pnpm lint; pnpm test; pnpm build` rồi `$env:E2E_ADMIN_PASSWORD="…"; $env:E2E_CHANNEL="msedge"; pnpm --filter @mtct/web exec playwright test` |

Bộ nghiệm thu pha 5 đi **đúng đường thật, kể cả dòng lệnh**: kế hoạch ra hàng chờ bằng
`inbox:pull`, bài test tự viết `result.json` như người đọc sẽ viết, `inbox:push` nạp về, và planner
chạy bằng đúng CLI mà job 04:00 dùng.

```powershell
$env:E2E_ADMIN_PASSWORD="<mật khẩu admin>"; $env:E2E_CHANNEL="msedge"
pnpm --filter @mtct/web exec playwright test e2e/phase5-acceptance.spec.ts
```

### 3. Bảng 8 tiêu chí xong

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | Mọi con số trên P2/P3 bấm ra bằng chứng thật | **Đạt** — e2e đối chiếu con số trên thẻ với tổng trên trang bằng chứng và mở đúng dòng có ảnh. Ảnh `p2-tong-quan.png`, `p3-ho-so.png`, `bang-chung.png` |
| 2 | Đổi TKB → Daily Quest hôm sau đổi môn ưu tiên | **Đạt** — thứ Ba 15/09 trước: `ưu tiên VIET`, mix VIET 8 / VMATH 2. Đổi 2 tiết → `ưu tiên VMATH`, mix **VMATH 7 / VIET 3**. e2e tự trả TKB về nguyên trạng sau khi đo |
| 3 | Duyệt plan → phiên hôm sau ≥ 50% thuộc plan | **Đạt — 7/13 bài (54%)** trong e2e; lần chạy tay với kế hoạch 6 kỹ năng đạt **9/13 (69%)**. Cách bảo đảm con số này và cái giá của nó: ADR-18 mục 1–2 |
| 4 | "Luyện hôm nay" → đúng `Session kind=TARGETED` | **Đạt** — DB: `kind=TARGETED`, 8 trạm, `skillCode` duy nhất `VIET.HV.AM_B`, `generationLog.targetSkill` khớp; Daily Quest hôm đó không đổi |
| 5 | Dán nhật ký → dưới 5 giây thấy bài lớp + kỹ năng tối nay | **Đạt — 180–205 ms** (API đo trong e2e). Lần đầu trên `next dev` mất 5,5 s vì Next biên dịch route; bản `build` không có độ trễ đó. Ảnh `p2-nhat-ky-vua-dan.png` |
| 6 | Điện thoại: tổng quan, dán nhật ký, chụp bài vở bằng một tay | **Đạt** — 390×844: bottom tab, nút nổi 56 px cách đáy < 220 px, nút "Dán từ bảng nhớ tạm" cao 48 px, **không cuộn ngang** (đo `scrollWidth − clientWidth ≤ 1`). Ảnh `dt-*.png` |
| 7 | Việc 0 xong | **Đạt** — `SchoolWeek` tuần 1 = `24/08 → 30/08`, 35 tuần; script dọn chạy `--dry-run` mặc định và báo đúng 17 hồ sơ giữ vì có dữ liệu |
| 8 | `lint && test && build` xanh; e2e pha 0–4 vẫn xanh | **Một nửa đạt** — lint sạch, 347 test đơn vị, build 4 gói, e2e pha 3 và pha 5 xanh. **23 bài e2e của pha 0/1/2/4 bị `skip`** vì cần `E2E_ADMIN_PASSWORD` mà tôi không có — xem mục 7 |

### 4. Việc 0: hồ sơ test — xoá bao nhiêu, giữ bao nhiêu

*(chi tiết đã ghi ở mục "Việc 0" bên dưới; tóm tắt)* 50 hồ sơ → **19**. Xoá **31** hồ sơ rỗng, giữ
**17** vì có dữ liệu học thật (15 hồ sơ `p1kid-*` mỗi cái 3 bằng chứng · `p1kid-bllrg` 11 bằng
chứng + 1 phiên + 12 lượt làm bài · `thy-bo9kq` 3 phiên) và 2 hồ sơ thật. `Evidence` không mất dòng
nào. Cuối pha script còn tìm ra thêm **1 hồ sơ `test-session-*`** do một lần chạy test tích hợp bị
ngắt để lại — mẫu slug đó nay nằm trong script, có test.

Còn **15 tài khoản phụ huynh e2e** (`me-*`) không còn con nào. Ngoài phạm vi việc 0 nên chưa xoá:

```powershell
pnpm db:clean-test-students -- --apply --with-orphan-parents
```

### 5. Ảnh chụp màn hình

`docs/screens/pha-5/` — 12 ảnh, sinh tự động trong bộ nghiệm thu nên chạy lại là có bản mới:

| Máy tính | Điện thoại (390×844) |
|---|---|
| `p2-tong-quan.png` · `p3-ho-so.png` · `p4-ban-do-nang-luc.png` | `dt-p2-tong-quan.png` · `dt-p3-ho-so.png` · `dt-p4-ban-do.png` |
| `p4-drawer-ky-nang.png` · `p9-ke-hoach-de-xuat.png` · `p12-thoi-khoa-bieu.png` | `dt-chup-bai-vo.png` |
| `bang-chung.png` · `p2-nhat-ky-vua-dan.png` | |

### 6. ADR đã viết

**ADR-18** — bốn chỗ pha 5 lệch tài liệu: (1) kế hoạch đã duyệt được lấn phần "ôn"/"mới" của
`04` §4 bước 3 để giữ lời hứa của tiêu chí 3, **và phần ôn có thể tụt dưới 30% trong tuần đó**;
(2) "nửa phiên" tính cả bài cô giao, kế hoạch ít kỹ năng thì quay vòng; (3) "xuất PDF" = hộp thoại
in của trình duyệt, không thêm phụ thuộc; (4) "thẻ 5 môn" hiện ra 6 thẻ vì ESL và ENL là hai bản đồ
kỹ năng khác nhau.

### 7. Chưa làm / tồn đọng

1. **Tôi không chạy được 23/39 bài e2e.** Mật khẩu admin đã được chủ dự án đổi (tài khoản `admin`
   có `mustChangePassword=false` và đã đăng nhập), nên mọi bài cần vùng `/admin/*` — pha 0, 1, 2, 4
   và `screens.spec.ts` — đều `skip`. Để tự kiểm phần ba mẹ tôi đã **tạo một tài khoản PARENT tạm**
   `qc-pha5-tam`, gắn với Mai Thy và Chí Thanh, chụp ảnh, rồi **xoá đi** (đã kiểm: `select ... where
   username like 'qc-%'` trả 0 dòng). Bộ nghiệm thu pha 5 nay nhận cả hai đường:
   `E2E_ADMIN_PASSWORD`, hoặc `E2E_PARENT_USER` + `E2E_PARENT_PASSWORD`. **Chủ dự án chạy lại cả bộ
   với mật khẩu admin giúp tôi** — đó là nửa còn lại của tiêu chí 8.
2. **Ba lỗi bộ nghiệm thu tìm ra, đã sửa** (`f58e12a`), ghi lại vì chúng cho thấy tự kiểm bằng mắt
   là không đủ: "Phiên hôm nay" hiện nhầm phiên `TARGETED` vừa tạo thay vì Daily Quest; kế hoạch ít
   kỹ năng không bao giờ đạt nửa phiên; và ba dòng phụ trên P3 **mất mất con số** ("dài nhất ngày"
   thay vì "dài nhất 22 ngày") do một lần sửa bằng script để Perl nuốt `${…}` trong template
   literal. Bài học: mọi lần sửa hàng loạt bằng `perl -pi` trên chuỗi có `${…}` phải đọc lại file.
3. **Một lỗi cũ từ pha 3, sửa trong pha này:** `Session.date`, `Streak.lastActiveDate`,
   `EggProgress.startedOn` là cột `@db.Date` nhưng được ghi bằng nửa đêm **giờ máy** → ở UTC+7 mọi
   phiên bị xếp vào **hôm trước**. Nay có `vnDayDate` dùng chung. **Dữ liệu cũ vẫn lệch một ngày**
   — không migrate vì là dữ liệu dev; nếu chủ dự án muốn số liệu lịch sử đúng ngày thì nói một câu.
4. **Thẻ "Bài cô giao hôm nay" trên P2 đang rất dài** — 15 dòng, nhiều dòng trùng nội dung. Không
   phải lỗi: cửa sổ 2 ngày của `homeworkForToday` cộng với việc tôi dán cùng một bài đăng ba ngày
   liên tiếp khi thử. Với nhật ký thật mỗi ngày một khác thì không lặp. Nếu vẫn rối, đề nghị gộp
   theo nội dung ở pha 6.
5. **P10 báo cáo, P11 "Hỏi về con" chưa có** — đúng lịch, cả hai ở pha 7.
6. **Chưa có ai dùng thật.** Toàn bộ pha 5 chạy trên dữ liệu của Mai Thy (321 bằng chứng, phần lớn do
   e2e sinh) và hồ sơ Chí Thanh gần như trống. "3 điều cần chú ý" của Chí Thanh hiện đúng là "chưa có gì
   phải chú ý" — đúng, nhưng chưa chứng minh được gì.

### 8. Câu hỏi cho chủ dự án

1. **Chạy lại cả bộ e2e với mật khẩu admin** (tồn đọng 1) — đây là thứ duy nhất chặn tiêu chí 8.
2. **Xoá 15 tài khoản phụ huynh e2e không còn con nào?** Một lệnh, ở mục 4.
3. **ADR-18 mục 1:** trong tuần có kế hoạch đã duyệt, phần "ôn" có thể tụt dưới 30% của `04` §4.
   Chấp nhận, hay ưu tiên giữ nhịp ôn và hạ ngưỡng của tiêu chí 3?
4. **20 ảnh mẫu của pha 4 vẫn còn nợ** — vẫn là thứ chặn nửa còn lại của eval đọc ảnh.

---

### Việc 0 — ba quyết định của chủ dự án

**1. Năm học bắt đầu 24/08/2026.** `SchoolWeek` tính lại: tuần 1 `24/08 → 30/08`, tuần 3 là tuần
có ngày 12/09. Đúng con số chính nhật ký lớp suy ra (`pnpm db:school-year` in cả hai để đối chiếu:
"từ ngày 11/09 bài 13, đếm ngược 13 buổi"). Mặc định của seed và `.env.example` đổi theo. Ô ngày
vẫn sửa tay được ở `/parent/school`; lệnh `pnpm db:school-year -- --apply` làm cùng việc từ dòng
lệnh và **chỉ in ra** nếu thiếu `--apply`.

**2. Dọn hồ sơ test: 31 xoá, 19 giữ.** `pnpm db:clean-test-students` (thêm `--apply` mới xoá thật).
Quy tắc ba tầng ở `packages/db/src/maintenance/test-students.ts`, có test đơn vị: `thy`/`thanh`
không bao giờ là ứng viên; ứng viên phải **vừa** khớp mẫu slug e2e sinh ra **vừa** có tài khoản đã
tắt; và ứng viên nào mang **bất kỳ** dữ liệu học nào cũng được **giữ lại và báo cáo**. Kết quả:

| Nhóm | Số | Vì sao |
|---|---|---|
| Hồ sơ thật | 2 | `thy` (249 bằng chứng, 34 phiên), `thanh` |
| Giữ vì có dữ liệu | **17** | 15 hồ sơ `p1kid-*` mỗi hồ sơ 3 bằng chứng · `p1kid-bllrg` 11 bằng chứng + 1 phiên + 12 lượt làm bài · `thy-bo9kq` 3 phiên |
| Đã xoá | **31** | hồ sơ `thy-*`/`thanh-*` rỗng hoàn toàn |

Sau khi chạy: 50 → **19 hồ sơ**, `Evidence` vẫn **305** (không mất dòng nào), `thy` vẫn 34 phiên.
Còn **15 tài khoản phụ huynh e2e** (`me-*`) nay không còn con nào — chưa xoá vì ngoài phạm vi việc
0; xoá được bằng `pnpm db:clean-test-students -- --apply --with-orphan-parents`.

**3. Hai lỗ `ENL.RL.*` và `ENL.W.*` chờ pha 7.** Đọc hiểu (`ENL.RL.*`) và viết câu (`ENL.W.*`) hiện
**không có dạng bài nào chở được**, nên trên bản đồ năng lực P4 hai mạch này để trắng và eval đọc
ảnh trượt 100% số ca thuộc chúng (`docs/eval/intake-v1.md` §2: *Read and match*, *Draw and write* —
mã đúng **không xuất hiện ở đâu** trong ngữ cảnh đưa cho người đọc). Dạng bài chở được chúng là
`MINI_STORY` và `TRACE`/`WRITE_PHOTO`, đã nằm ở pha 7 mục 4 — nay ghi thành **mục 6 và một tiêu chí
xong riêng** của pha 7 trong `docs/08`. Không cố nhét vào pha 5.

## Pha 4 — 12/09/2026 — Nạp ảnh bài vở, nhật ký lớp & duyệt

Trạng thái: **xong, 7/7 tiêu chí đạt** — trừ một nửa của tiêu chí eval phải chờ 20 ảnh mẫu của chủ
dự án (mục 5 dưới). 4 commit code trong pha, **chưa push**. `lint` sạch · **295 test đơn vị** ·
**32 e2e xanh** (pha 0–4) · `build` 4 gói.

### 1. Đã làm gì, commit nào

**Việc 0 — ba quyết định của chủ dự án** (`972d454`, ADR-16)

- **Sao đo công sức, không đo đúng sai.** Gộp `firstTry: 2` + `finished: 1` thành **`exercise: 1`**:
  một sao cho mỗi trạm con **làm xong**, dù đúng, gần đúng, hay phải xem đáp án rồi mới xong; cộng
  3 sao khi hết phiên. Ảnh bài viết tay và bài đọc to ghi âm **nay được sao ngay** (trước đây rơi
  vào nhánh "chờ chấm" nên con làm thật mà không được gì). Chạm "để sau" vẫn 0 sao — chưa làm thì
  chưa có gì để thưởng.
- **Trứng 4 ngày, không bao giờ reset.** `EggProgress` bỏ khoá theo tuần, đổi sang `(studentId,
  eggNo)`: 4 **ngày học** nở một con thú rồi quả kế tiếp bắt đầu. Nghỉ thì thanh đứng yên. Tranh
  tuần và `Streak` áp cùng nguyên tắc — với lịch nhà mình (4–5 buổi/tuần), **bức tranh 6 mảnh theo
  tuần lịch là bức tranh không bao giờ xong**. Cả ba tính lại từ *số ngày riêng biệt có phiên hoàn
  thành*, nên chạy lại không thưởng hai lần. Migration `20260911120000` đánh số lại dữ liệu cũ theo
  thứ tự tuần, không mất mảnh nào.
- **Vườn Kỳ Diệu đủ 4 khu**: `thap-chu` (tháp chậu hoa a-b-c + truyện trên nấm), `tram-khong-gian`
  (nhà kính + khinh khí cầu bồ công anh + kính thiên văn), `ben-tau-tieng-anh` (thuyền lá buồm cánh
  hoa chữ A trên hồ sen). 15 → **24 lớp nền**, tổng tài sản 0,46 MB / 40 MB, `art:check` xanh.
- Sửa luôn một lỗi cũ: `weeklyEvent()`/`pictureForWeek()` trả `undefined` với mọi ngày **trước** tuần
  mốc 07/09/2026 (JS giữ dấu âm khi chia lấy dư) — một phiên ngày lùi làm hỏng cả bước trao huy hiệu.

**Việc 1–5 — ảnh bài vở, nhật ký lớp, bài cô giao** (`f27fead`, migration `20260911130000`)

| Việc | Đã làm |
|---|---|
| **1. P5 nạp ảnh** | `/parent/intake/new`: camera trực tiếp (`capture`), chọn nhiều ảnh, **nén ngay trên máy** (canvas, cạnh dài 2000, JPEG 0.82). `POST /api/intake` lưu **ảnh gốc nguyên vẹn** (bằng chứng ba mẹ quay lại xem sau này) rồi tạo `IntakeJob`. Kiểm quyền trên đúng `studentId` ở tầng server. |
| **2. Hàng chờ** | Job worker `intake.preprocess` (mỗi phút, `pnpm intake:run` gọi tay): xoay theo EXIF, cạnh dài 2000, `normalise` + `linear` nhẹ (bút chì phải còn là xám, không thành vệt đen), **tách ảnh chụp vở mở hai trang** theo rãnh gáy, nén ≤ 1,5 MB, **dHash** cảnh báo trùng trong 7 ngày. `inbox:pull` **chép ảnh nằm cạnh `context.json`**. `inbox:push` → `PENDING_REVIEW`. SSE `/api/events` thêm `toReview`, hộp thư tự làm mới khi kết quả về (`46afcfe`). |
| **3. P6 duyệt** | `/parent/intake/[id]`: ảnh trái có **bbox bấm được**, bảng item phải sửa inline (đúng/gần đúng/chưa đúng/để trống, mã lỗi, kỹ năng tìm bằng full-text). **`BLANK` ≠ sai**: ô trống có màu riêng, ghi rõ "con chưa làm xong" hay "con chưa biết làm", **đổi bằng một chạm**. Duyệt → `Evidence` (+ `ExternalProgress` cho NAVIO/Kids A-Z) → mastery. Cặp "máy đọc / ba mẹ sửa" ở lại trên `IntakeItem.skillCodes` vs `skillCodesFinal` để làm ví dụ cho lần sau. |
| **4. P7 + ghi chú nhanh** | `/parent/inbox` ba hàng chờ (chờ duyệt · chờ đọc · bài mở chờ chấm) + **badge trên thanh bên mọi trang**. FR-INT-04: ô một dòng, full-text gợi ý kỹ năng, ba mẹ chạm chọn → `Evidence(PARENT_NOTE, w=0.5)`. |
| **5. Nhật ký lớp & bài cô giao** | `/parent/diary`: dán văn bản → **bộ đọc theo mẫu, không AI** (regex trên chữ đã bỏ dấu, nên "dặn dò"/"dan do"/"Ðồng phục" đều khớp). Dòng nào không khớp mẫu → hàng chờ `DIARY_HARD`, **không đoán bừa**. Một việc cô giao → **một `Homework` cho từng bé**. Trạm "Bài cô giao" đứng **đầu bản đồ** (5 ngọn đèn sáng dần, mỗi lượt một sao; "Quay cho cô" lưu file để ba mẹ nộp Teams — app không tự nộp). Thẻ nhắc phi học tập chỉ hiện cho ba mẹ. `/parent/school` đề nghị lại ngày bắt đầu năm học. |

**Việc 6 — eval & nạp lô lớn** (`bf0bf3e`)

`pnpm eval:intake` chấm bộ nhãn `docs/eval/intake-v1/cases.json`; `pnpm content:import-intake` nạp
cả thư mục ảnh vở cũ vào **đúng hàng chờ duyệt P6**. Kết quả ở mục 4.

Sửa hai đường dẫn giải sai thư mục: `INBOX_ROOT` đẩy hàng chờ vào `packages/inbox/inbox/` thay vì
gốc repo (chỗ `CLAUDE.md` bảo nhìn và `.gitignore` che), và tương tự cho hai lệnh mới.

### 2. Cách chạy thử (PowerShell, tại gốc repo)

```powershell
docker compose --env-file .env -f docker/compose.yml up -d db     # Postgres 5433
pnpm db:migrate                                                   # 2 migration mới của pha 4
pnpm dev                                                          # web 5000 + worker (intake.preprocess mỗi phút)
```

| Tiêu chí | Chạy gì |
|---|---|
| 1. Nhật ký lớp | Mở `/parent/diary`, dán bài đăng 10/09 → xem "3 mục đã học · 3 bài cô giao · 1 lời nhắc". Rồi `pnpm plan:run -- --student thy --force` và mở `/kid/quest`: trạm đầu là **Bài cô giao** |
| 2. `BLANK` ≠ sai | `/parent/inbox` → mở phiếu ESL → 4 ô trống hiện "con chưa làm xong", chạm một cái thành "con chưa biết làm" |
| 3. 5 ảnh ≤ 90 giây | `/parent/intake/new` chụp/chọn 5 ảnh → `pnpm intake:run` → `pnpm inbox:pull` |
| 4. Duyệt → mastery | Duyệt trong `/parent/intake/<id>` rồi `Invoke-RestMethod "http://localhost:5000/api/students/<id>/mastery?subject=VIET"` |
| 5. Raz-Kids | Ảnh màn hình Kids A-Z → `result.json` có `externals` → duyệt → xem `ENL.RF.FLUENCY_LEVEL_*` |
| 6. Việc 0 | `/kid/home` xem trứng "x/4"; làm một bài sai → vẫn **+1 sao**; `/dev/kit` và `/kid/quest` xem 4 khu vườn |
| 7. Tất cả | `pnpm lint; pnpm test; pnpm build` rồi `$env:E2E_ADMIN_PASSWORD="…"; $env:E2E_CHANNEL="msedge"; pnpm --filter @mtct/web exec playwright test` |

Bộ nghiệm thu pha 4 đi **đúng đường thật**, kể cả dòng lệnh: nạp ảnh qua API → `pnpm intake:run` →
`pnpm inbox:pull` → tự viết `result.json` → `pnpm inbox:validate` → `pnpm inbox:push` → duyệt trên
web. Không có cửa sau nào cho test.

```powershell
$env:E2E_ADMIN_PASSWORD="<mật khẩu admin>"; $env:E2E_CHANNEL="msedge"
pnpm --filter @mtct/web exec playwright test e2e/phase4-acceptance.spec.ts
```

### 3. Bảng 7 tiêu chí xong

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | Dán nhật ký mẫu → **3 mục đã học + 3 bài cô giao + 1 nhắc đồng phục**; Daily Quest đổi trọng tâm | **Đạt** — bộ đọc mẫu giải thích **100%** bài đăng, không dòng nào phải vào hàng chờ. Bài "quay video" nhận đúng là **tuỳ chọn** ("cô khuyến khích") và đúng nơi nộp (Teams – Chương trình Việt). Phiên sau đó: trạm 1 = bài cô giao, phần trọng tâm có kỹ năng Tiếng Việt của bài 13. Ảnh `docs/screens/pha-4/diary-parsed.png` |
| 2 | Phiếu ESL làm dở → **`BLANK` chứ không phải sai**, đổi nhãn một chạm | **Đạt** — 2/6 câu làm được, 4 câu trống dồn về cuối → cả 4 là "con chưa làm xong" (trọng số 0,3), không dòng nào bị gắn nhãn sai. Ảnh `review-blank.png` |
| 3 | 5 ảnh vở Tiếng Việt → **≤ 90 giây** | **Đạt — 12 giây** (tiền xử lý 5 ảnh: 450 ms). Xem ADR-17 mục 1 về việc "có kết quả" nghĩa là gì sau ADR-10 |
| 4 | Duyệt → **mastery đổi và bằng chứng hiện trong drawer kỹ năng** | **Đạt** — mastery `VIET.HV.AM_U_UW` tăng sau khi duyệt; `GET /mastery/history?skill=…` trả bằng chứng `source=INTAKE_PHOTO`. **118 bằng chứng** từ ảnh/bài cô giao trên hồ sơ Mai Thy. Ảnh `review-workbook.png` |
| 5 | Ảnh Raz-Kids → `raz_level` + `ENL.RF.FLUENCY_LEVEL_*` | **Đạt** — mức D cho: `AA=95 · A=95 · B=95 · C=85 · D=70 · E=30`, **đúng bảng `05` §5** |
| 6 | Việc 0 xong | **Đạt** — sao 1/bài làm xong (test ép sai 3 lần vẫn +1 sao), trứng 4/7 không reset (test đi qua ranh giới tuần), Vườn Kỳ Diệu 4 khu |
| 7 | `lint && test && build` xanh; **e2e pha 0–3 vẫn xanh** | **Đạt** — lint sạch · 295 test đơn vị (core 157, content 66, db 35, web 25, inbox 12) · build 4 gói · **32/32 e2e** (pha 0: 6 · pha 1: 7 · pha 2: 5 · pha 3: 5 · pha 4: 4 · login + screens: 5) |

### 4. Ngày bắt đầu năm học, và kết quả eval

**Ngày bắt đầu năm học: đề nghị tuần 1 từ thứ Hai 24/08/2026** (đang đặt 08/09/2026).

Căn cứ: nhật ký 10/09/2026 ghi lớp học **Tiếng Việt bài 13**. Tiếng Việt 1 tập một dạy **một bài mỗi
buổi** (TKB 1B3 có 5 tiết "Tiếng Việt cơ bản"/tuần, `05` §2), nên bài 13 = **buổi học thứ 13**. Đếm
ngược 13 buổi từ thứ Năm 10/09, bỏ thứ Bảy–Chủ nhật và **02/09 (Quốc khánh)** → buổi đầu tiên rơi
đúng **thứ Hai 24/08/2026**. Chuỗi bài của chính lớp đang ăn khớp với giả thiết "một bài một buổi".

**Tôi chưa tự đổi lịch.** `11` §5 nói ba xác nhận một lần, và mọi `expectedWeek` đo theo 35 tuần này
— đổi ngầm là lặng lẽ dán lại nhãn "đúng tiến độ / chậm" cho cả hai bé. Mở `/parent/school`, đối
chiếu bằng chứng trên màn hình rồi bấm **"Xác nhận và đặt lại 35 tuần"**.

Nếu trường nghỉ cả 03/09 (nhiều trường nghỉ liền 02–03/09) thì buổi đầu lùi thêm một ngày → tuần 1
từ **17/08**. Ba xem lịch trường rồi chọn giúp; ô ngày trên màn hình sửa tay được.

**Eval đọc ảnh (`pnpm eval:intake`, 9 ca có nhãn — `docs/eval/intake-v1.md`):**

```
gắn kỹ năng: top-1 33,3% · top-5 66,7% · có trong ngữ cảnh đưa cho người đọc 77,8%
đúng/sai:    chưa đo — cần 20 ảnh mẫu (mục 5)
quy tắc BLANK trên phiếu docs/11 §9: ĐÚNG
```

Ba điều rút ra, và điều thứ hai là điều đáng nhớ nhất của cả pha:

1. **Tìm kiếm một mình không đủ để gắn kỹ năng** (33% top-1, mục tiêu 80%). Nó tốt khi đề bài nói
   thẳng nội dung ("các số 6–10"), kém khi đề bài chỉ là mệnh lệnh ("Read and match") hoặc khi chữ
   trong đề trùng từ vựng của kỹ năng khác ("pets" trong bài về gia đình).
2. **Nhật ký lớp cứu phần lớn các ca đó.** Ca "Vở Tiếng Việt bài 13": tìm kiếm trượt hoàn toàn (trả
   về ba họ vần khác), nhưng vì tối hôm đó ba mẹ đã dán nhật ký nên `VIET.HV.AM_U_UW` nằm sẵn trong
   ngữ cảnh. **Dán nhật ký mỗi tối không chỉ lái Daily Quest — nó làm việc đọc ảnh chính xác hơn.**
3. **Hai lỗ thật:** kỹ năng đọc hiểu (`ENL.RL.*`) và viết câu (`ENL.W.*`) **không được đề xuất ở đâu
   cả**. Đề nghị cho pha 5/6: với phiếu ENL, đưa cả mạch kỹ năng vào ngữ cảnh chứ không chỉ kết quả
   tìm kiếm.

### 5. 20 ảnh mẫu cần chủ dự án chụp (việc 6 còn nợ nửa này)

Chép vào `intake-inbox/<tên gọi ở nhà>/<ngày>/`, ví dụ `intake-inbox/thy/2026-09-13/01.jpg`. Danh
sách đầy đủ kèm lý do từng ảnh ở `docs/eval/intake-v1.md` §5; tóm tắt:

| # | Chụp gì |
|---|---|
| 1–3 | Vở **Tiếng Việt** 3 trang con đã làm, có chữ cô sửa |
| 4–5 | Vở **Toán** 2 trang (cộng trong 10, viết số) |
| 6–8 | **Phiếu ESL** 3 tờ — **ít nhất 1 tờ con làm dở** (quan trọng nhất) |
| 9–10 | **Bài kiểm tra** có điểm và nhận xét |
| 11 | **Nhận xét / sổ liên lạc** của cô (chỉ chữ) |
| 12–13 | Màn hình **Kids A-Z**: trang cấp độ và trang sách đã đọc |
| 14 | Màn hình **NAVIO** |
| 15 | Màn hình **nhật ký lớp Edi Parent** |
| 16 | **Vở mở hai trang** chụp ngang một lần (thử tách trang) |
| 17 | **Chụp lại đúng trang ở ảnh 1** (thử cảnh báo trùng) |
| 18 | Một trang của **Chí Thanh** (thử phân biệt hai bé) |
| 19 | Một ảnh **hơi nghiêng, thiếu sáng** |
| 20 | Một ảnh **không phải bài học** (bìa vở) — phải ra `OTHER`, không bịa |

Chụp xong nói một câu, tôi đọc 20 ảnh, ghi nhãn thật và chạy lại eval để có con số "đúng/sai" đầy
đủ. Ảnh không vào git (`.gitignore` có `intake-inbox/`).

### 6. ADR đã viết

- **ADR-16** — ba quyết định của chủ dự án: sao theo công sức (thay bảng ADR-15 §5), trứng 4 ngày
  không reset, Vườn Kỳ Diệu 4 khu.
- **ADR-17** — năm chỗ pha 4 lệch tài liệu: (1) "≤ 90 giây có kết quả" nghĩa là gì sau ADR-10;
  (2) FR-INT-04 "AI gắn kỹ năng" → tìm kiếm gợi ý + ba mẹ chạm; (3) bài cô giao là loại trạm mới
  trong phiên; (4) `weightFactor` để `07` §2.2 vào được mô hình mastery; (5) ảnh Raz-Kids **đặt**
  mastery theo bảng `05` §5 thay vì nhích.

### 7. Chưa làm / tồn đọng

1. **Planner vẫn chưa đọc `PlanHint`.** `inbox:push` ghi gợi ý trọng tâm vào DB từ pha 2, nhưng
   planner chưa tôn trọng nó (`13` §3 nói phải). Không nằm trong 6 việc của pha 4 nên tôi không tự
   làm; **nên đưa vào pha 5** cùng màn kế hoạch P9, vì hai thứ cùng đụng một chỗ trong planner.
2. **Dữ liệu dev vẫn rối** (tồn từ pha 3): DB có **38 hồ sơ `Student`** lớp 1B3 do các bộ e2e cũ tạo
   — mới 2 bé còn hoạt động nên nhật ký chỉ sinh 6 `Homework`, nhưng danh sách nhìn vẫn rối. Nên dọn
   trước khi cho hai bé dùng thật.
3. **Chưa có ảnh bài vở thật nào đi qua đường này.** Toàn bộ pha 4 chạy bằng ảnh sinh trong test
   (trang kẻ dòng + nét bút giả). Pipeline đúng; chất lượng **đọc** ảnh thật chưa ai biết — đó chính
   là 20 ảnh ở mục 5.
4. **Bộ đọc nhật ký mới thấy đúng một bài đăng thật.** Mẫu của cô có thể đổi (đánh số khác, thêm
   môn). Mỗi bài đăng lệch mẫu sẽ vào hàng chờ `DIARY_HARD` chứ không mất, nhưng vài tối đầu ba mẹ
   nên liếc phần "Hệ thống đọc được" trước khi bấm "Đúng rồi".
5. **Ảnh `CLASS_DIARY` chưa có đường đọc riêng.** Chụp màn hình Edi Parent đi vào hàng chờ ảnh như
   mọi ảnh khác; đường dán văn bản (nhanh hơn, chính xác hơn, `11` §3 ưu tiên 1) đã chạy đủ.
6. **Chưa nén ảnh HEIC trên máy.** iPhone gửi HEIC thì trình duyệt không vẽ được lên canvas nên ảnh
   đi nguyên bản (server vẫn xử lý được, chỉ tốn mạng hơn).

### 8. Câu hỏi cho chủ dự án

1. **Xác nhận ngày bắt đầu năm học** — 24/08/2026 (nếu chỉ nghỉ 02/09) hay 17/08/2026 (nếu nghỉ cả
   02 và 03/09)? Mở `/parent/school`, bấm một cái là xong.
2. **20 ảnh mẫu** (mục 5) — cái này chặn nửa còn lại của việc 6.
3. **Dọn 38 hồ sơ `Student` thử nghiệm trong DB dev?** Tôi không tự xoá dữ liệu học của ai; nói một
   câu là tôi viết script dọn đúng các tài khoản do e2e tạo (`slug` bắt đầu bằng `p1kid-`).

## Pha 3 — 11/09/2026 — Góc của con: thế giới, mascot, phiên học

Trạng thái: **dựng xong, 7/8 tiêu chí tự kiểm đạt**; tiêu chí còn lại cần chủ dự án chấm trên iPad thật (60 fps, mục 8 checklist `06` §4). 14 commit trong pha, **chưa push**.

### 1. Đã làm gì

**Việc 0 — dọn tồn đọng ngân hàng bài đợt 1** (`b097402`; chi tiết: `content/_reports/pha-3-viec-0.md`)

- **Mã lỗi đúng nghĩa.** Thêm `lap_lai_tong` và `nham_chu_gan_giong` (bộ mã 42 → **44**), rồi **suy lại mã của từng phương án từ chính đáp án**: 471 bài đổi mã, 590 lượt trên từng phương án. Mã nào không có nghĩa nào khớp thì bỏ trống — một mã sai còn tệ hơn không mã, vì thang rèn sẽ rèn nhầm chỗ.
- **Bài đi trước bài học.** `VIET.HV.AM_A` là bài 1 (lớp mới biết một chữ) mà in "Nam"/"Nem" và thẻ kéo "cà" mang thanh huyền của bài 9. **156/453 bài Tiếng Việt** vi phạm → viết lại cả 10 gói từ danh sách từ đã kiểm, **giữ nguyên id** nên bài cập nhật tại chỗ, bằng chứng cũ của con vẫn trỏ đúng.
- **Một câu lệnh cho 214 bài.** Mỗi dạng nay có **≥ 6 cách hỏi và ≥ 4 gợi ý** mỗi ngôn ngữ, chia đều.
- **Lặt vặt.** Nhiễu là từ tiếng Việt thật (bỏ "trè", "dà"); câu phủ định viết lại khẳng định; **385 bài Toán** trỏ đúng trang của bài thay vì dải 11 trang; ô thả chỉ nhận thứ thuộc về nó; bài đếm không còn gửi `repeat` (vốn vẽ sẵn đáp án).
- **Ba kiểm định mới** trong `content:validate` + 20 test: mã lỗi phải *có thể* xảy ra với phương án nó gắn vào; chữ tiếng Việt in ra phải nằm trong phạm vi bài lớp đã học (bảng 83 bài của `09` §3); không câu lệnh nào chiếm quá 25% một dạng.
- Kết quả: `content:validate` **0 lỗi** · `content:import` chạy lại **0 thay đổi** · `content:stats` **1236 PUBLISHED** (không tụt), mọi kỹ năng ≥ 35 bài.

**Việc 0b — TTS Azure** (`b3223ba`)

Azure AI Speech, tầng F0, vùng **eastasia**. Tiếng Việt **`vi-VN-HoaiMyNeural`, không bọc `<prosody>`** — chủ dự án đã nghe 6 mẫu và loại bản chậm/cao hơn, nên code **từ chối** thêm lại: `buildAzureSsml` chỉ phát `<prosody>` cho tiếng Anh. Tiếng Anh **`en-US-AnaNeural` bọc `<prosody rate="-10%">`**; `TTS_RATE` **chỉ áp cho tiếng Anh** (có test). `pnpm tts:voices` gọi danh sách giọng thật của tài nguyên Azure; `pnpm tts:smoke "<câu>"` ghi một mp3 vào `_tts-thu/` (đã gitignore). Không khoá thì mọi thứ vẫn chạy bằng Web Speech, test vẫn xanh. **Khoá chỉ nằm trong `.env`; `.env.example` chỉ có chỗ trống.**

**Việc 1 — tài sản đồ hoạ** (`6548d5e` bảng phong cách, `cd3a2b0` hàng loạt, tranh tuần bổ sung ở `8d39483`)

`content/art/STYLE.md` là hợp đồng phong cách: không viền đen, ba sắc độ mỗi hình, sáng từ trên-trái, bóng là ellipse mờ (filter blur tốn khung hình trên iPad), mỗi bộ phận động nằm trong một `id` riêng để Framer Motion điều khiển. **134 tài sản, 0,43 MB / 40 MB**: 4 khu Thành phố Robot + 1 khu Vườn Kỳ Diệu × 3 lớp (15 lớp nền); 2 mascot × 9 trạng thái; 8 avatar; 11 hiệu ứng (trứng, giấy chứng nhận, sao vàng lớn, rương); **70 vật thể**; **6 tranh tuần**; 6 âm thanh WAV tự tổng hợp (không giấy phép phải theo dõi, và không tiếng nào nghe như tiếng "sai"). Ba lệnh: `art:build` vẽ tất, `art:check` đo ngân sách và **chặn blur / đen tuyền**, `art:sync` chép sang `apps/web/public`. Sửa quy tắc mỹ thuật = **sửa `STYLE.md` trước**, rồi sửa generator — tài sản không sửa tay được nên phong cách không trôi.

**Việc 2 — design system & motion** (`af6de8f`), trình diễn ở `/dev/kit`

64 px để chạm, 22 px để đọc, không đỏ ở đâu cả, mọi chữ đọc được to, mọi chuyển động tắt khi máy xin ít chuyển động. Mascot là SVG nội tuyến (không phải `<img>`) nên **thở, chớp mắt, mở miệng đúng nhịp giọng đọc, kêu "hí hí" khi bị chọc**. `WorldBackground` xếp 3 lớp, trôi theo con trỏ hoặc độ nghiêng iPad, **giữ yên vùng giữa** cho đề bài, **nhuộm trời theo giờ thật**. Có `BigButton`, `StarFlyToPocket`/`StarPocket` (sao bay theo đường cong rồi số đếm nhảy), `FeedbackOverlay` ba trạng thái không có trạng thái nào là thất bại, `LoadingMascot`/`EmptyState`/`OfflineNotice` (mascot đang làm gì đó, không có spinner trơn), `SceneTransition`, `KidPinPad`, `HintBulb`, `SpeakerButton`, `useSpeak`.

**Việc 3 — sáu dạng bài** (`fe657aa`)

Một cửa vào (`ExerciseRenderer`), props giống nhau. `LISTEN_CHOOSE` **phát chứ không in** `listenTarget` (ADR-14). `DRAG_DROP` nghiêng – hít – nảy; **thẻ đặt sai vẫn được đặt** để máy chủ chấm theo tỉ lệ và đọc được `dragItems[].errorTag`, chấm xong thẻ sai mới bay về (ADR-15); chạm cũng được, không bắt buộc kéo. `COUNT_TAP` đánh số theo ngón tay, vẽ theo `repeat`, không bao giờ theo đáp án. `READ_ALOUD` khớp từng từ bằng `packages/core` (máy chủ dùng lại đúng hàm đó nên một lần đọc không bị chấm hai kiểu), tha giọng Bắc (s/x, ch/tr, r/d) nhưng **rơi dấu vẫn tính là trượt**, và **luôn có** lối "đọc cho ba mẹ nghe". `WRITE_PHOTO` chụp → `PENDING` → hàng chờ; "để chụp sau" là **quyết định, không phải lỗi**.

**Việc 4 — planner & phiên học** (`85ca582`)

- `packages/core/planner` — thuần, **22 test**, gồm đúng ca `docs/08` nêu: 2 lỗi `nham_b_d` trong 7 ngày → phiên kế có bài **đối chiếu b/d**, **≤ 4 bài rèn**, bậc 3 xin mascot làm mẫu, bậc 4 lùi về tiên quyết, không bao giờ rèn quá 2 kỹ năng một lúc. Phiên 12 bài (1,3 phút/bài, kẹp 8–15), khởi động → thang rèn → 50/30/20, và **không quá 2 bài cùng môn liền nhau**.
- `packages/core/grading` — chấm thuần, **18 test**: `choices[].errorTag` / `dragItems[].errorTag` → `Evidence.errorCode`; ba lần: gợi ý 1 → gợi ý 2 → hiện đáp án đọc to; **không bao giờ có chữ "sai"**.
- `packages/db/session` — lên phiên (idempotent theo ngày; chọn bài từ ngân hàng pha 2; **ưu tiên thế giới của bé**; hôm qua mệt thì hôm nay ngắn 20%; bài lớp học 3 ngày gần nhất lên đầu nửa trọng tâm), ghi `Evidence` qua `commitEvidence`, sao, streak, và **một bước trên thang rèn** cho mỗi kỹ năng phiên đó rèn. **6 test tích hợp**: máy con **không nhận `answerKey` hay `errorTag`**; gửi lại cùng một câu trả lời **không chấm hai lần**; phiên dở **biết chỗ đi tiếp**; ba lần thử ra gợi ý 1, gợi ý 2, rồi đáp án + `dem_thieu_1` vào `Evidence`.
- `apps/worker` — job **`planner.daily` 04:00** (nhật ký worker in `queue: planner.daily, cron: 0 4 * * *`) + **`pnpm plan:run`** gọi tay (`--student thy --date … --force`).
- `apps/web` — `POST /api/sessions`, `GET /api/sessions/:id`, `POST /api/sessions/:id/attempts`, `.../finish`, `.../choice`, và **SSE `GET /api/events`** (tiến độ phiên, huy hiệu mới, bài chấm xong) có `retry` nên mất mạng thì trình duyệt tự nối lại; mọi route kiểm quyền trên đúng `studentId` ở tầng server.

**Việc 5 — màn hình K1–K5, K7 + giữ mới** (`8d39483`, `38e807f`)

K1 có nhân vật vẽ thật + mascot chào. K2 là **một nơi chốn**: thế giới, mascot chào bằng giọng và **nhắc một việc hôm qua**, túi sao, ngọn lửa streak, trứng tuần, tranh tuần, hộp thư, một nút to duy nhất. K3 `QuestMap`: con đường 12 trạm, avatar đi giữa các trạm, trạm xong lấp lánh, **rương cuối đường**, 2 trạm có nhãn "chọn". K4 làm bài **trên nền thế giới**, có **nghỉ vận động 30 giây** (lần đầu không bỏ qua được) và câu hỏi **"chơi tiếp hay nghỉ"** sau 8 bài. K5 `SessionFinale` 4–6 giây: rương mở → sao tràn → số đếm nhảy → **lễ trao huy hiệu** → mascot nhảy, chạm để bỏ qua. K7 mua bằng sao và **đặt vật phẩm vào đúng chỗ trong thế giới của mình**, kèm hàng giấy chứng nhận in được.

**Bảy cơ chế P0 của `06` §1.8c là dữ liệu thật, không phải trang trí:** trứng nứt theo **ngày học** (5 ngày thì nở ra thú); tranh tuần lật một mảnh mỗi ngày (6 mảnh); thế giới đổi theo giờ thật; thư ba mẹ mascot đọc to (`KidMail`, FR-PAR-08); nút "Khen" thả một **sao vàng lớn**; kỹ năng thành thạo in được **giấy chứng nhận** A4 (`/kid/certificate/<id>`, có CSS in); mascot nhắc đúng một việc đã xảy ra (`MascotMemory`, dùng một lần). Tất cả tính từ *số ngày thực sự có phiên hoàn thành* nên **không thưởng hai lần**, và **nghỉ một ngày không mất gì**.

Seed thêm: **23 huy hiệu** (6 huy hiệu sự kiện tuần chỉ tuần đó lấy được), **22 vật phẩm**, **8 thú cưng**.

### 2. Cách chạy thử (PowerShell, tại gốc repo)

```powershell
docker compose --env-file .env -f docker/compose.yml up -d db   # Postgres 5433
pnpm db:migrate; $env:SEED_DEV="1"; pnpm db:seed                # 23 huy hiệu · 22 vật phẩm · 8 thú
pnpm content:import                                             # ngân hàng 1236 bài
pnpm plan:run -- --student thy                                  # lên Daily Quest hôm nay bằng tay
pnpm dev                                                        # web 5000 + worker (planner.daily 04:00)
```

Vào `http://localhost:5000/login` → thẻ **Mai Thy** → 4 hình **Mèo › Thỏ › Bướm › Cá** → K2. Component: `/dev/kit`. Gửi thư / khen con: `/parent/<id>`.

Chạy bộ nghiệm thu pha 3 (tự đi hết con đường và chụp ảnh):

```powershell
$env:E2E_ADMIN_PASSWORD="<mật khẩu admin>"; $env:E2E_RESET_QUEST="1"; $env:E2E_CHANNEL="msedge"
pnpm --filter @mtct/web exec playwright test e2e/phase3-acceptance.spec.ts
```

### 3. Tám tiêu chí xong

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | Mai Thy đăng nhập → Daily Quest **12 bài ≥ 3 dạng, ≥ 2 môn** | **Đạt** — phiên hôm nay (`cmtx3003f00zh…`): **12 trạm, đủ cả 6 dạng** (MCQ 4 · LISTEN_CHOOSE 2 · COUNT_TAP 2 · DRAG_DROP 2 · READ_ALOUD 1 · WRITE_PHOTO 1), **4 môn** (ESL 4 · VIET 3 · VMATH 3 · ENL 2). Ảnh `k3-map.png` |
| 2 | Xong phiên có **kịch bản ăn mừng và sao** | **Đạt** — `SessionFinale` 4–6 giây, `+21 (tất cả 156 sao)`, trứng 1/5, tranh 1/6. Ảnh `k5-finale.png` |
| 3 | **Sai 3 lần** thấy gợi ý rồi đáp án, **không có chữ "sai"** | **Đạt** — test tích hợp `session.test.ts` ép sai 3 lần: gợi ý 1 → gợi ý 2 → `Đáp án là …` + giải thích; e2e quét toàn bộ `body` mỗi trạm, không trang nào chứa chữ "sai" hay "điểm số" |
| 4 | **Mastery các kỹ năng trong phiên thay đổi** | **Đạt** — sau các phiên hôm nay: **119 dòng `Evidence`**, **23 dòng `SkillMastery`**, và `ErrorStat` của Mai Thy có `dem_thieu_1:6 · dem_thua_1:5 · lap_lai_tong:1 · nham_am_dau:1` — tức chẩn đoán từ `choices[].errorTag` đã chạy suốt từ lúc con chạm tới bảng thống kê lỗi |
| 5 | **Playwright K1→K5 xanh** | **Đạt** — 5 test pha 3 xanh; chạy cả bộ: **28/28 e2e xanh** (pha 0: 6 · pha 1: 7 · pha 2: 5 · pha 3: 5 · login+screens: 5) |
| 6 | **Checklist `06` §4** trên iPad Safari | **Tự kiểm 11/12 trên Edge/Chromium** (bảng ở mục 4 dưới). Mục 8 (60 fps đo bằng Safari Web Inspector trên iPad thật) **chủ dự án cần chấm** — máy này không có iPad |
| 7 | **Video 2 phút** một phiên học | **Đạt** — `docs/screens/pha-3/phien-hoc-k1-k5.webm` (2 phút 47 giây, 4,8 MB): đăng nhập bằng hình → bản đồ → 12 trạm → nghỉ vận động → "chơi tiếp hay nghỉ" → ăn mừng |
| 8 | **`pnpm tts:smoke "Nghe rồi chọn ô đúng nhé!"` ra mp3 đúng giọng** | **Đạt** (chủ dự án dán khoá lúc 22:17 ngày 11/09) — `_tts-thu/smoke-vi-*.mp3`, 15 KB, lệnh in `giọng vi-VN-HoaiMyNeural (azure/eastasia), giọng gốc, không prosody`. Câu tiếng Anh (`--en`) ra `en-US-AnaNeural … prosody rate=-10%`. `pnpm tts:voices` đọc được 79 giọng của vùng eastasia |

Thêm hai tiêu chí chủ dự án bổ sung: `docs/09` **có bảng unit Global Stage Level 1 cho cả hai quyển** (§4b.1 Language Book, §4b.2 Literacy Book) — **đạt**; `esl.json`/`enl.json` **không còn `standardRef` ước đoán kiểu `GS1.U<n>`** — **đạt** (mục 5 dưới).

### 4. Checklist "hấp dẫn với trẻ" (`06` §4, 12 mục)

| # | Mục | Kết quả |
|---|---|---|
| 1 | Không màn hình nào chỉ chữ + nút trên nền trơn | **Đạt** — K1, K2, K3, K4, K5, K7 đều đứng trên `WorldBackground` 3 lớp có mây trôi, sao lấp lánh |
| 2 | Mascot ở mọi màn hình, `idle` chớp mắt, phản ứng khi chạm, đúng trạng thái | **Đạt** — 9 trạng thái; `greet` ở K2, `think` khi con đang làm, `cheer`/`celebrate` khi xong |
| 3 | Mọi nút/thẻ có phản hồi hoạt hình; xuất hiện có stagger | **Đạt** — `BigButton` nén 0.94 rồi bật lại; thẻ vào theo `STAGGER` 60 ms |
| 4 | Đúng: sao bay + đếm nhảy + âm thanh + mascot `cheer`; gần đúng: lắc + gợi ý trượt lên, không đỏ | **Đạt** |
| 5 | Bản đồ: avatar di chuyển, trạm xong lấp lánh, cuối đường có rương | **Đạt** — ảnh `k3-map.png` |
| 6 | Xong phiên: rương mở, sao tràn, huy hiệu, mascot nhảy, bỏ qua được | **Đạt** — ảnh `k5-finale.png`, chạm bất kỳ đâu là nhảy tới cuối |
| 7 | Tải/trống/mất mạng có minh hoạ + mascot, không spinner trơn | **Đạt** — `LoadingMascot`, `EmptyState`, `OfflineNotice` |
| 8 | **60 fps trên iPad**, tài sản màn hình ≤ 1,5 MB | **Cần chủ dự án chấm trên iPad.** Phần đo được: một màn hình nặng nhất tải **≤ 120 KB** tài sản (3 lớp nền ≈ 15 KB + mascot ≤ 3,5 KB + vật thể ≤ 1,4 KB mỗi cái); `art:check` chặn blur filter — thứ hay làm rớt khung hình nhất |
| 9 | Video 2 phút | **Đạt** — mục 3 tiêu chí 7 |
| 10 | Có trạm chọn 1-trong-2; có nghỉ vận động; hỏi "chơi tiếp hay nghỉ" sau 8 bài | **Đạt** — 2 trạm chọn mỗi phiên (ảnh `k3-map.png` có nhãn "chọn"), ảnh `k4-movement-break.png`, `k4-carry-on.png` |
| 11 | Mascot làm mẫu được một bài (`scaffold: model`) | **Đạt** — ảnh `k4-model-first.png`; thang rèn bậc 3 xin đúng loại bài này |
| 12 | Bảy cơ chế P0 của §1.8c chạy được | **Đạt** — trứng, tranh tuần, giờ thật, thư ba mẹ, sao vàng lớn, giấy chứng nhận, ký ức mascot |

### 5. Tiếng Anh — Global Stage Level 1 (`c397907`, `0eafeba`)

- **Tải chương trình công khai** Scope & Sequence của Macmillan cho **Language Book 1** và **Literacy Book 1**, lưu `sach giao khoa/global-stage/`, tóm tắt vào **`docs/09` §4b**: 10 unit mỗi quyển với từ vựng → cấu trúc câu → phonics → kỹ năng đọc/viết → tuần dự kiến. Literacy Book có thêm hai bài đọc và kỹ năng đọc từng unit (long o, e, a, i, u → blend pr/pl, fl/fr, sl/st → digraph sh/ch, th).
- **Gắn lại bản đồ kỹ năng.** ESL: 32 kỹ năng gắn `GS1-LB.*`, 14 kỹ năng phonics gắn `GS1-LIT.*`, **3 kỹ năng RETIRE** (`isActive=false`, không xoá cứng): `VOC.WEATHER`, `VOC.DAYS_OF_WEEK`, `VOC.TRANSPORT` — Global Stage 1 không dạy. `VOC.NUMBERS_1_20` và `PH.BLENDS_FINAL` giữ lại nhưng bỏ `standardRef` (thuộc English Maths và Raz-Kids). **Thêm 16 kỹ năng** cho phần chương trình trước đây không kỹ năng nào trỏ tới. ENL: 7 kỹ năng gắn `GS1-LB.*`, 11 gắn `GS1-LIT.*`, thêm `ENL.RL.PREDICTING`. **Không còn `GS1.U<n>` nào.**
- **Rà 398 bài ESL/ENL/EMATH của pha 2: giữ 398 · sửa 309 · RETIRE 0.** Mọi từ trong bài đều là từ vựng Global Stage Level 1, từ trên phiếu Unit 1 của trường, nhiễu chính tả cố ý, hoặc từ phần ôn phonics — **đoán về *nội dung* ở pha 2 là đúng, chỉ tên sách là sai**. 259 bài nay trỏ đúng unit thật thay vì "chưa có giáo trình của trường"; 50 bài sight word nói rõ lấy từ danh sách Dolch, không phải từ giáo trình.
- **Đúng những trang cần chụp** (`docs/09` §4b.4) — vài trang một, theo tiến độ lớp:

| Ưu tiên | Quyển | Trang | Để làm gì |
|---|---|---|---|
| 1 | Language Book 1 | **tr.4–9** (Language Review) | danh sách từ thật của phần ôn đầu sách |
| 2 | Language Book 1 | **tr.10–21** (Unit 1) | lớp đang học: mẫu câu, bài tập, thứ tự lesson |
| 3 | Literacy Book 1 | **tr.4–7** (Phonics Review) + **tr.8–23** (Unit 1) | hai bài đọc *Come On, Family!* và *Zoom Town* |
| 4 | Language Book 1 | **tr.22–33** (Unit 2) | unit kế tiếp |
| 5 | Literacy Book 1 | **tr.24–39** (Unit 2) | unit kế tiếp |
| 6 | cả hai | **mục lục** (tr.2–3) | xác nhận số lesson mỗi unit để chia tuần |

### 6. Lệch tài liệu — ADR-15

`docs/adr/ADR-15-goc-cua-con-pha-3.md` ghi sáu chỗ: (1) tài sản là **SVG vẽ bằng code + Framer Motion**, không phải Lottie như `06` §1.9 đề xuất — không có hoạ sĩ, các gói Lottie miễn phí không cùng bút pháp, và `lottie-web` nặng gấp rưỡi cả thư viện tài sản hiện tại; (2) **`dragItems[].errorTag`** — điểm ADR-14 để ngỏ, nay làm, kèm việc **thẻ đặt sai vẫn được đặt**; (3) **hai mã lỗi mới**; (4) **`06` §1.8c được viết lại** từ `03` §2.7 + FR-PAR-08 + nhật ký 10/09 vì mục gốc không còn trong file (giữ nguyên cách đánh số để FR-PAR-08 "mục 5, 10" vẫn đúng), và thêm mục 12 vào checklist §4; (5) **chốt con số** cho sao / trứng / tranh tuần; (6) API phiên học là `POST /api/sessions/:id/attempts` chứ không phải `POST /api/attempts` như `02` §5 phác.

### 7. Chưa làm / cần chủ dự án

1. ~~Sinh mp3 cho cả ngân hàng~~ — **xong 11/09/2026, 22:35–23:41.** `pnpm content:import` sinh **986/986 câu, 0 lỗi, 0 bỏ qua** trong 66 phút (1236 đề bài gộp lại còn 986 câu khác nhau; nhịp 3,3 giây/câu để không đụng trần 20 yêu cầu/phút của tầng F0). **22 MB** trong `FILE_ROOT/tts`, ngoài git. `content:stats` báo `audio: 986/986 câu đã có mp3 (azure)`. Kiểm bằng đúng đường dẫn app dùng (`speakAudio` → `getOrSynthesize`): cả đề bài lẫn `listenTarget` đều trả `source: cache` — con nghe giọng Hoài My đã sinh sẵn, không gọi mạng và không rơi về giọng máy. Sinh lại chỉ cần chạy lại lệnh; câu nào đã có mp3 thì bỏ qua.
2. **Chấm mục 8 của checklist trên iPad thật** (60 fps trong lúc làm bài, đo bằng Safari Web Inspector) — và nếu được, để hai bé dùng thử 10 phút không cần ba mẹ trợ giúp.
3. **K6 "chơi thêm theo môn"** và **K8 "Hỏi bạn Cú"** không thuộc pha 3 (`docs/08` giao K1–K5 và K7) — K6 ở pha 7, K8 là gia sư giọng nói P2. Trang chủ vì thế **chưa có 3 icon môn** như `06` §1.2 mô tả, để không dẫn con vào màn hình trống.
4. **Dọn dữ liệu dev:** máy đang có **28 lô `content:import`** và một loạt tài khoản "Bé Thử"/"Mai Thy"/"Chí Thanh" do các bộ e2e cũ tạo — ảnh chụp màn hình đăng nhập vì thế hơi rối. Không ảnh hưởng bản thật (seed chỉ tạo 1 admin), nhưng nên dọn trước khi cho hai bé dùng.
5. **Giọng mascot thu sẵn** (`06` §1.8b mục 5: 40–60 câu thoại thu giọng thật) chưa làm — hiện mascot nói bằng TTS. Việc này hợp với pha 7, hoặc làm sớm nếu chủ dự án muốn tự thu.

### 8. Câu hỏi cho chủ dự án

1. **Luật sao** (ADR-15 mục 5): đúng ngay lần đầu 2 sao · làm xong 1 sao · xong phiên 3 sao · nghỉ vận động 1 sao · ba mẹ khen 5 sao. Vật phẩm K7 từ 8 đến 50 sao. Có muốn đổi tỉ lệ không?
2. **Trứng nở cần 5 ngày học/tuần** — với lịch nhà mình (học các ngày trong tuần) thì con phải học gần như đủ tuần mới nở. Giữ 5, hay hạ xuống 4?
3. Hai bé dùng **cùng một thế giới cho mọi môn** (Mai Thy: Vườn Kỳ Diệu, Chí Thanh: Thành phố Robot) — pha 3 mới vẽ **1 khu vườn**, 4 khu robot. Có muốn tôi vẽ đủ 4 khu vườn ở pha sau không, hay để tài sản nhẹ như hiện tại?

### 9. Bàn giao cho người làm pha 4

Pha 4 là "nạp ảnh bài vở & duyệt" (`08` pha 4). Những thứ pha 3 để lại mà pha 4 dùng được ngay, và những chỗ dễ vấp:

**Dùng lại được ngay**

| Pha 4 cần | Đã có sẵn | Ở đâu |
|---|---|---|
| Hàng chờ AI cho ảnh vở (mục 2, 6) | `packages/inbox` đủ ba lệnh `inbox:pull / validate / push`, trang `/admin/inbox`, schema `IntakeExtraction` / `GradeResult` / `DiaryParse` | `packages/inbox/src/`, `CLAUDE.md` mục "Xử lý hàng chờ AI" |
| Lưu ảnh | `POST /api/kid/photo` nhận ảnh, kiểm loại và kích thước, trả `photoKey`; dùng `fileStorage()` (FILE_ROOT) — pha 4 dùng chung adapter này cho `POST /api/intake` | `apps/web/app/api/kid/photo/route.ts`, `apps/web/lib/storage.ts` |
| Chấm bài mở đi qua hàng chờ | Mỗi `WRITE_PHOTO` con gửi đã tự tạo `InboxItem(WRITE_PHOTO_GRADE)` với `attemptId` trong payload; `inbox:push` ghi kết quả ngược vào `Attempt` | `packages/db/src/session/grade.ts` (`queueForGrading`), `packages/inbox/src/push.ts` (`applyGrade`) |
| SSE "có kết quả rồi" (mục 2) | `GET /api/events` đã phát trạng thái phiên, huy hiệu mới và **số bài đã được AI/ba mẹ chấm**; thêm một trường vào `snapshotOf` là xong | `apps/web/app/api/events/route.ts` |
| Planner đổi nguồn "bài đang học" sang `DiaryLesson` 3 ngày gần nhất (mục 5) | **Đã làm ở pha 3**: `plannerSnapshot` đọc `ClassDiary`/`DiaryLesson` theo lớp của bé và đưa vào `lessonSkills`, planner xếp các kỹ năng đó lên đầu nửa trọng tâm (có test). Pha 4 chỉ còn phải **đổ dữ liệu vào hai bảng đó** | `packages/db/src/session/plan.ts:78`, `packages/core/src/planner/plan-session.ts` |
| Trạm "Bài cô giao" đầu bản đồ (mục 5) | Slot đã mang `kind` và bản đồ đã vẽ theo `kind`; thêm một `SlotKind` mới + một renderer là có trạm mới, không phải sửa cấu trúc phiên | `packages/core/src/planner/types.ts:13`, `apps/web/components/kid/quest-map.tsx` |
| `BLANK` ≠ sai (tiêu chí xong của pha 4) | Đã là luật ở tầng chấm: bỏ qua một bài trả về `pending`, **không ghi `Evidence`**, không tính điểm | `packages/core/src/grading/mark.ts` |

**Chỗ dễ vấp trên máy này**

1. `pnpm build` **hỏng khi web server đang chạy** — `prisma generate` không đổi tên được `query_engine-windows.dll.node` (EPERM). Dừng `next dev`/`next start` trước khi build.
2. Playwright: **`E2E_CHANNEL=msedge`** (máy này không có Chromium bundled); `playwright.config.ts` đã đặt `actionTimeout: 10_000` — đừng bỏ, nếu không một nút bị che sẽ treo hết ngân sách của test.
3. Trình nạp nội dung chỉ cho nghỉ bài **trong những file mà lần nạp đó đọc** (sửa 11/09). Nếu viết test nạp nội dung mới, nhớ dùng `sourceFile` riêng, đừng mượn tên file của gói thật.
4. Ngân hàng phải giữ **1236 `PUBLISHED`**; `pnpm content:stats` là cách kiểm nhanh nhất sau mỗi lần đụng vào trình nạp.
5. Dữ liệu dev đang lẫn tài khoản và lô của các bộ e2e cũ (xem mục 7.4) — nên dọn trước khi quay video hay cho hai bé dùng.

## Pha 2 — 11/09/2026 — Xưởng nội dung & ngân hàng bài luyện (đợt 1)

Trạng thái: **xong** (7/7 tiêu chí đạt, kiểm cả trên máy dev lẫn stack Docker sạch không có khoá nào). 7 commit, chưa push. Đầu pha có 2 commit thi hành ADR-11 và dọn tài liệu QC để lại.

### Đã làm theo 5 việc

0. **Trước việc 1 — thi hành ADR-11 phương án (c) + dọn tài liệu** (`ab304db`, `d29577e`):
   - `ab304db` commit giúp phần QC sửa còn treo: bỏ nốt chữ "pgvector/embedding" trong `docs/02`, `04`, `07`, `08`. *(Ghi chú: git identity trên máy **đã có sẵn** — `truongbtr@gmail.com`, không phải cấu hình lại.)*
   - `d29577e` **gỡ hẳn nhân bản giọng**: xoá `scripts/tts-clone-voices.mjs`, lệnh `pnpm tts:clone`, provider nhân bản, `personaFor`/`VoicePersona`, và **thư mục `ai voice/`** trên máy chủ. Giữ TTS cloud tuỳ chọn với **giọng dựng sẵn** trong `packages/core/src/tts/` (dùng chung cho web và trình nạp). **Gỡ vỏ MEDIFA ONE**: token màu về slate trung tính theo `docs/06` §2, thêm token `--color-kid-thy`/`--color-kid-thanh` cho pha 5, bỏ `/admin` dashboard, giữ `/admin/health`. Env còn `TTS_PROVIDER | TTS_API_KEY | TTS_APP_ID | TTS_REGION | TTS_VOICE_VI | TTS_VOICE_EN | TTS_RATE`.
   - Sau đó chủ dự án cập nhật ADR-11 thêm **Vbee** làm nhà cung cấp tiếng Việt → đã thi hành trong `0ccf6fb`: provider `vbee` (header `App-Id`, tải mp3 ngay vì link hết hạn ~3 phút), **sinh dần và chạy lại được** (hết hạn mức thì dừng êm, báo còn bao nhiêu câu), `pnpm tts:voices` để lấy mã giọng thật, `content:stats` hiện số câu đã có mp3.

1. **`packages/content` — xưởng nội dung** (`bdaa2a6`): schema Zod cho file bài học (`10` §4.1) và gói bài luyện (`10` §4.2) + bộ dựng `ExerciseSpec` (`04` §5). Bốn lệnh thật, không stub: `content:validate` · `content:import [--dry-run] [--dir] [--no-tts]` · `content:stats` · `content:export --skill`. Validator kiểm cả những thứ schema không nói được: trùng câu hỏi, thiếu mức khó, dùng dạng bài kỹ năng không khai, `errorTag` ngoài `error-taxonomy.json`, và **bắt buộc nhiễu của bài Toán/học vần phải có chẩn đoán**.
   *Lệch tài liệu:* ba lệnh đụng DB (`import`/`stats`/`export`) đặt ở **`packages/db`** chứ không phải `packages/content` như `docs/10` §10 phác thảo — cho chiều ngược lại sẽ tạo **vòng phụ thuộc** và Turborepo từ chối chạy. Lệnh `pnpm content:*` người dùng gõ không đổi. (ADR-14 mục cuối.)

2. **`packages/inbox` — hàng chờ AI** (`0ccf6fb`): schema `IntakeExtraction`, `GradeResult`, `DiaryParse`, `WeeklyReport`, `PlanHint` + `ExerciseSpec` tái xuất từ `@mtct/content`; lệnh `inbox:pull` / `inbox:validate` / `inbox:push`; trang `/admin/inbox`. `context.json` kèm **ứng viên kỹ năng lấy từ `searchSkills` của pha 1**, bộ mã lỗi đầy đủ, 10 lần ba mẹ đã sửa nhãn, và **chỉ tên gọi ở nhà** (test kiểm `context.json` không chứa tên đầy đủ). Validator từ chối: `result.json` sai loại việc, mã lỗi ngoài bộ, và **bất kỳ câu nào nói với bé có chữ "sai"**. Mục **"Xử lý hàng chờ AI"** 4 bước đã viết vào `CLAUDE.md`.

3. **Xem trước & duyệt** (`0ccf6fb`): `/admin/content` theo FR-ADM-05 — danh sách lô, **xem thử bài đúng như con sẽ thấy** (`components/kid/exercise-preview.tsx`, nền thế giới, chạm ≥ 64 px, chữ ≥ 22 px, nút Nghe), gắn cờ `GOOD`/`BAD` (gắn `BAD` là bài rời ngân hàng ngay), phát hành / thu hồi cả lô, và bảng phủ nội dung tô đỏ kỹ năng < 10 bài. `/dev/kit` dán `ExerciseSpec` bất kỳ vào là render. Nút nghe thử dùng mp3 sinh sẵn, không có thì rơi về Web Speech.

4. **Soạn nội dung đợt 1** (`94238dc`): **28 kỹ năng · 1236 bài**. Đọc SGK thật — PDF quét không có lớp chữ nên tách ảnh từng trang ra rồi đọc: Toán B1/B2/B3/B4/B5/B10/B11, Tiếng Việt B1, 2, 3, 4, 6, 8, 13, 14. Câu nhận biết, bảng ghép âm, từ khoá có tranh và nhân vật (Nam, Mai, Việt, Mi, Rô-bốt, bà, bé) đều lấy từ sách. Báo cáo rubric ở `content/_reports/dot-1.md`.

5. **Nạp & phát hành** (`94238dc`): `content:validate` sạch → `content:import` → duyệt và phát hành trong `/admin/content` → `content:stats` cho thấy **cả 28 kỹ năng ≥ 35 bài `PUBLISHED`, không kỹ năng nào thiếu dạng hay mức khó**.

### Bảng 7 tiêu chí xong

| # | Tiêu chí | Kết quả | Cách tự kiểm (PowerShell, tại gốc repo) |
|---|---|---|---|
| 1 | `content:stats` ≥ 25 kỹ năng, mỗi kỹ năng ≥ 35 bài `PUBLISHED`, không thiếu dạng bài pha 3 | **Đạt** — 28 kỹ năng, 1236 bài, ít nhất 40 bài/kỹ năng, cột "thiếu dạng"/"thiếu mức khó" đều trống | `pnpm content:stats` |
| 2 | `content:import --dry-run` chạy lại lô cũ báo **0 thay đổi** | **Đạt** — `0 new, 0 updated, 1236 unchanged` · `dry-run: 0 changes` | `pnpm content:import --dry-run` |
| 3 | Sửa 1 bài rồi nạp lại → cập nhật tại chỗ, `stableId` giữ nguyên, `Evidence` cũ không mất | **Đạt** — làm thật: sửa lỗi "1 apples" → `0 new, 1 updated, 1231 unchanged`, bài vẫn `PUBLISHED`. Test tích hợp chứng minh `Attempt`/`Evidence` cũ còn nguyên và **7 bảng dữ liệu học của con không đổi một dòng** | `pnpm --filter @mtct/db test` (9 test importer) |
| 4 | 20 bài ngẫu nhiên, tự chấm rubric `docs/10` §6, ≥ 18/20 đạt | **Đạt 20/20 — sau hai vòng sửa.** Lần chấm đầu 14/20; 9 lỗi hệ thống tìm được và cách sửa ghi ở `content/_reports/dot-1.md` §4 | `node scripts/sample-exercises.mjs pha-2-dot-1 20` (luôn ra đúng 20 mã đó) |
| 5 | `.env` không khoá nào vẫn `docker compose --env-file .env up -d --build` chạy, vẫn truy vấn và render được bài, `content:import` vẫn chạy | **Đạt** — dựng stack thứ hai volume mới (`-p mtct-p2`, cổng 3001/5434), `TTS_API_KEY` trống: seed 359/182/42 → `content:import` 1236 bài (`tts: skipped 1450 line(s)`) → phát hành và xem thử bài trong `/admin/content` | `docker compose --env-file .env -f docker/compose.yml up -d --build` rồi `Invoke-RestMethod http://localhost:5000/api/health` |
| 6 | `pnpm lint && pnpm test && pnpm build` xanh; e2e pha 0 và pha 1 vẫn xanh sau khi gỡ vỏ MEDIFA ONE | **Đạt** — lint 0 lỗi · **167 test đơn vị/tích hợp** (core 81, content 33, db 23, web 18, inbox 12) · build 4 gói · **23 e2e xanh** (pha 0: 6, pha 1: 7, pha 2: 5, login + screens: 5) chạy trên stack Docker sạch | `pnpm lint; pnpm test; pnpm build` (dừng `pnpm dev` trước) |
| 7 | `grep -ri elevenlabs` rỗng; thư mục `ai voice/` không còn | **Đạt trong code** — không còn ở bất kỳ file mã, script, env, `package.json` hay README nào; thư mục đã xoá. **Còn đúng 2 chỗ là tài liệu lịch sử**: `docs/adr/ADR-11` (chính bản ghi quyết định gỡ) và mục pha 1 của file này. Xoá tên khỏi ADR sẽ làm mất bản ghi quyết định nên giữ lại | `Select-String -Path (Get-ChildItem -Recurse -File).FullName -Pattern "elevenlabs"` |

Ảnh chụp: `docs/screens/pha-2/admin-content.png`, `exercise-preview.png`, `dev-kit.png`.

### Số liệu ngân hàng bài đợt 1

| Hạng mục | Số lượng |
|---|---|
| Kỹ năng | **28** — Tiếng Việt 10 · Toán 9 · ESL 5 · ENL 2 · English Maths 2 |
| Bài luyện | **1236**, tất cả `PUBLISHED` — VIET 453 · VMATH 385 · ESL 218 · ENL 91 · EMATH 89 |
| Theo dạng | MCQ 527 · LISTEN_CHOOSE 214 · DRAG_DROP 185 · READ_ALOUD 125 · COUNT_TAP 100 · WRITE_PHOTO 85 |
| Theo mức khó | 1 → 204 · 2 → 300 · 3 → 291 · 4 → 271 · 5 → 170 |
| Nhiễu có chẩn đoán | **741 bài** có ít nhất một đáp án sai mang `errorTag` |
| `scaffold: model` | **190 bài** (mascot làm mẫu trước — `04` §11.4 bậc 3) |
| `targetsError` | **588 bài** nhắm đúng một mã lỗi (thang rèn bậc 5) |
| Biến thể chủ đề | 66 bài `robot` · 80 bài `garden` · còn lại `neutral` |
| Test | **167 đơn vị/tích hợp** + **23 e2e** |

### Mã 20 bài mẫu để QC chấm lại

Rút bằng `node scripts/sample-exercises.mjs pha-2-dot-1 20` — sắp toàn bộ 1236 bài theo `sha256("pha-2-dot-1" + stableId)` rồi lấy 20 bài đầu, không chọn tay:

`viet-am-ch-0012` · `vmath-cong10-0044` · `enl-sight-0043` · `vmath-cong10-0030` · `viet-am-d-0008` · `viet-am-a-0017` · `viet-am-a-0041` · `vmath-tachgop-0015` · `enl-sight-0019` · `viet-am-u-0009` · `esl-havehas-0039` · `vmath-so610-0033` · `viet-dauthanh-0043` · `vmath-nhieuit-0014` · `viet-am-o-0015` · `viet-am-a-0043` · `vmath-so610-0021` · `vmath-demvat-0013` · `vmath-so05-0002` · `vmath-tachgop-0020`

Bảng chấm từng bài ở `content/_reports/dot-1.md` §3.

### ADR đã viết

- **ADR-14** — bốn bổ sung vào hợp đồng bài luyện, đều là **sửa lỗi ở tầng dữ liệu** để pha 3 không mắc lại:
  1. `Exercise.answerKey` là một **gói** `{ value, errorTags, correctCount }` chỉ máy chủ đọc — `choices[].errorTag` và `countTarget.correctCount` bị cắt khỏi `spec` gửi client.
  2. `listenTarget` — tiếng được đọc trong bài nghe, **không bao giờ in ra**; validator chặn đề in lại nó.
  3. `ImageRef.repeat` — vẽ hình mấy lần, bắt buộc với câu hỏi đếm.
  4. Mở `difficultyRange` → `[1,5]` và thêm dạng bài cho **đúng 28 kỹ năng đợt 1** trong `content/skill-map/` cho khớp bài đã soạn (331 kỹ năng còn lại không đụng).

  `docs/04` §5 đã cập nhật cho khớp.

### Lỗi tự tìm ra khi rà số liệu cuối pha (`9a1ce6b`)

`content:stats` báo 2 kỹ năng tụt dưới 35 bài. Truy ra **lỗi thật trong trình nạp**: bài có mã rời khỏi file rồi quay lại thì kẹt `RETIRED` vĩnh viễn, vì trình nạp coi nó là “không đổi” khi nội dung giữ nguyên — **60 bài của đợt 1 đã vô hình như thế**. Đã sửa: bài quay lại được hồi sinh **trên đúng dòng cũ** (nên `Attempt`/`Evidence` của con vẫn trỏ đúng) và trở về `DRAFT` chứ không thẳng lên `PUBLISHED` — nội dung từng rời đi thì nên được ba mẹ xem lại. Có test riêng; `content:import` in thêm cột `revived`.

### Chưa làm + giả định

- **Nhiễu của `DRAG_DROP` chưa mang mã lỗi.** `ExerciseSpec` chỉ cho `errorTag` trên `choices`, nên 185 bài kéo-thả biết "chưa đúng" mà **không biết vì sao**. Đề nghị pha 3 thêm `dragItems[].errorTag`.
- **Toàn bộ ESL/ENL/EMATH (398 bài) chưa bám sách của trường** — dựng theo phiếu `GS1 – UNIT 1` và CCSS; mọi `sourceRef` ghi rõ "chưa có SGK". Có sách Global Success 1 thì phải rà lại từ vựng và thứ tự unit.
- **Hình vẫn là emoji** (đúng `04` §5 "v1 ưu tiên emoji"); `content/art/objects/manifest.json` chưa có nên validator bỏ qua bước kiểm vật thể. Pha 3 làm thư viện SVG xong phải rà lại.
- **`docs/09` §1 ghi "trang PDF = trang sách + 1"; hai file SGK trong repo thực tế lệch +3** (hai ảnh bìa lặp ở đầu). `sourceRef` đều ghi **số trang sách** nên nội dung không sai; nên sửa `docs/09` cho lần sau.
- **`LessonUnit` vẫn là khung** — pha 2 không điền `objectives`/`vocabulary` (đó là việc pha 6); schema và trình nạp bài học đã sẵn sàng, `content/lessons/` chưa có file bài học nào.
- **Chưa từng chạy `pnpm tts:clone`** trong phiên này (xem câu hỏi 1).
- `/admin/content` chưa có nút **sửa nhanh** một bài (FR-ADM-05 có nhắc). Sửa bài hiện đi đường `content/*.pack.json` → `content:import`, an toàn hơn vì mọi thay đổi có trong git.

### Câu hỏi cho chủ dự án

1. **Đã từng chạy `pnpm tts:clone` chưa?** Tôi **không chạy** lệnh đó lần nào (và nó đã bị xoá). Nếu trước đây có chạy thì giọng nhân bản của hai bé **vẫn đang nằm trên tài khoản ElevenLabs** — ADR-11 dặn developer không tự gọi API xoá, nên nhờ chủ dự án đăng nhập ElevenLabs xoá thủ công.
2. **Khoá Vbee:** cần `TTS_API_KEY` + `TTS_APP_ID`. Sau khi có, chạy `pnpm tts:voices` để lấy **mã giọng thật** rồi điền `TTS_VOICE_VI` — mã mặc định tôi đặt sẵn (`hn_female_ngochuyen_full_48k-fhg`) là mã phổ biến trong tài liệu Vbee nhưng **tôi chưa kiểm chứng được với tài khoản thật**. Gói miễn phí thường chỉ vài nghìn ký tự/ngày; 1450 câu cần sinh dần vài ngày (lệnh tự biết chỗ dừng).
3. **Sách Tiếng Anh 1 – Global Success** (và giáo trình NAVIO nếu có): vẫn là việc chặn lớn nhất — 398 bài tiếng Anh đang dựng theo suy đoán từ một phiếu bài tập.
4. **Ngày bắt đầu năm học thật** (còn nợ từ pha 0 và pha 1) — cần để chỉnh `expectedWeek`.
5. Có muốn tôi soạn tiếp **bài học** (`content/lessons/`, `docs/10` §4.1) cho 12 bài Toán và 14 bài Tiếng Việt đầu ngay bây giờ không, hay để đúng pha 6 như lộ trình?

---

## Pha 1 — 11/09/2026 — Bản đồ kỹ năng & mô hình năng lực

Trạng thái: **xong** (6/6 tiêu chí đạt, kiểm cả trên máy dev lẫn stack Docker). 6 commit, chưa push. Đầu pha có 1 commit ADR xử lý phần ngoài phạm vi của pha 0.

### Đã làm theo 5 việc

0. **Trước việc 1 — ADR cho phần ngoài phạm vi pha 0** (`b108aa4`): `docs/adr/ADR-11-pha0-ngoai-pham-vi.md` liệt kê ba commit ngoài phạm vi (`e13b042` TTS cloud, `3cb324a` giao diện MEDIFA ONE, `00f4d36` giọng nhân bản ElevenLabs), thư mục `ai voice/` (không có trong `02` §3), ba dịch vụ trả phí tuỳ chọn (ElevenLabs/Azure/Google — **không có SDK nào được cài**), 8 biến `TTS_*`, và ảnh hưởng tới `06` §2; nêu hai phương án (a) giữ + tắt bằng cờ env, (b) gỡ — **chờ chủ dự án chọn**. `docs/adr/ADR-12-bo-skill-embedding.md` ghi lại quyết định bỏ `SkillEmbedding`/pgvector của pha 0 và `docs/03` đã sửa cho khớp.

1. **Bản đồ kỹ năng + khung bài học** (`e9a8016`) — `content/skill-map/{viet,vmath,esl,enl,emath,esci}.json`: **359 kỹ năng**, mỗi kỹ năng đủ `code/subject/strand/nameVi/nameEn/description (có "Ví dụ:" và "Lỗi thường gặp:")/gradeLevel/prerequisites/relatedSkillCodes/confusableWith/exerciseTypes/difficultyRange`, Toán và Tiếng Việt có `lessonRef` + `expectedWeek` lấy từ `09`. Học vần sinh đúng **83 bài** của `09` §3 (mỗi bài không phải "Ôn tập" → 1–2 kỹ năng cùng `lessonRef`, dấu thanh tách riêng, bài 29 → `VIET.VIET.CHINH_TA_NGHE_VIET`, 11 cặp âm dễ nhầm thành `confusableWith`). Khung `LessonUnit`: **182 unit** trong **4 `Material`** (83 bài TV tập một + ôn tập/đánh giá, 41 bài Toán, 8 chủ đề TV tập hai = 46 unit) — chỉ mã, tên, trang, tuần, kỹ năng liên quan; `isApproved=false`, chưa có nội dung. `content/error-taxonomy.json`: **42 mã lỗi** theo `04` §11.1. `pnpm skills:validate` (thật, trong `packages/content`) kiểm: trùng mã, tiên quyết/related/confusable tồn tại, không vòng phụ thuộc, ≥ 35 kỹ năng/môn, `lessonRef` trỏ tới `LessonUnit` có thật, `expectedWeek` 1–35, mô tả đủ hai cụm bắt buộc, mạch hợp môn, kỹ năng đọc có `READ_ALOUD`, kỹ năng viết có `WRITE_PHOTO`/`TRACE`. `pnpm db:seed` nạp cả ba nguồn, **upsert theo `code`**, chỉ đụng `Skill`/`SkillPrerequisite`/`Material`/`LessonUnit`/`LessonUnitSkill`/`ErrorCode`/`ContentBatch`.

2. **Thuật toán mastery + bộ mã lỗi** (`49ba88b`) — `packages/core/src/mastery/`: `updateMastery`, `applyDecay`, `statusOf`, `nextReviewAt`/`reviewIntervalAfter` (SM-2 rút gọn), `computeTrend14d`, `isWeakSkill` (§3.5) — hàm thuần, không import Next/Prisma. `packages/core/src/remediation/ladder.ts`: thang rèn 6 bậc §11.4 (`nextRung`, `nextApplicableRung` bỏ bậc 4 khi tiên quyết đã vững, giới hạn ≤ 4 bài/phiên, ≤ 2 kỹ năng rèn cùng lúc). Bảng `ErrorStat` cập nhật bằng `refreshErrorStat` (tính lại cửa sổ 7/30 ngày từ `Evidence` nên job và API luôn khớp); `RemediationTrack` đã có sẵn từ pha 0. Validator chặn mã lỗi lạ ở tầng service (`commitEvidence`) nên mọi đường ghi bằng chứng đều bị chặn, không riêng API.

3. **API + job** (`6e67280`) — `GET /api/students/:id/mastery[?subject=]` (mọi kỹ năng đang dùng kèm `status`, `lastEvidenceAt`, `nextReviewAt`, `trend14d` + tóm tắt theo môn), `GET /api/students/:id/mastery/history?skill=` (đường mastery + bằng chứng), `POST /api/evidence` **nội bộ** (ADMIN hoặc `Authorization: Bearer $INTERNAL_API_TOKEN`; `CHILD`/`PARENT` → 403). Job pg-boss `mastery.decay` chạy **02:30 giờ Việt Nam** trong `apps/worker`, bù được số ngày máy tắt; lệnh chạy tay `pnpm decay:run [--force]`.

4. **`/admin/skills`** (`6e67280`) — cây môn → mạch kèm số đếm, tìm nhanh (dùng full-text việc 5), bảng có `lessonRef`/`expectedWeek`/tiên quyết, hộp thoại sửa tên/mô tả/tuần/tiên quyết (chặn vòng lặp và mã không tồn tại), **ẩn** kỹ năng (không xoá — hiện số bằng chứng đã có), nạp JSON/CSV dùng **lại chính validator của việc 1** với bước "Xem trước" bắt buộc. Giao diện dùng primitives người lớn sẵn có, không đầu tư thêm vào MEDIFA ONE khi ADR-11 chưa được chốt.

5. **Tra cứu kỹ năng bằng chuỗi** (`05047e2`) — migration `20260910223533_phase1_skills_mastery`: cột `Skill.searchVector` (tsvector) do **trigger** duy trì (dùng `unaccent`, không dùng cột sinh vì `unaccent()` không `IMMUTABLE`), index **GIN**, extension `unaccent`. `searchSkills(q, {subject?, limit})` trong `packages/db` + `GET /api/skills/search?q=` (chỉ người lớn). Tìm được cả tiếng Việt có dấu/không dấu, tiếng Anh, và mảnh mã (`VIET.HV.AM_U`).

### Bảng 6 tiêu chí xong

| # | Tiêu chí | Kết quả | Cách tự kiểm (PowerShell, tại gốc repo) |
|---|---|---|---|
| 1 | `pnpm test`: mastery 59.9 / 40.1; bảng trạng thái §3.3 | **Đạt** — 59.9 và 40.1 khớp **đúng công thức tài liệu**, không phải chọn thêm hằng số nào | `pnpm test` (104 test: core 65, content 10, web 27, db 13). Riêng phần này: `pnpm --filter @mtct/core test` |
| 2 | `POST /api/evidence` 3 lần → `status` đổi đúng §3.3; `ErrorStat` tăng đúng mã; mã lạ → 400 | **Đạt** — LEARNING (25.2) → SOLID (70) → NEEDS_PRACTICE (59.2); `nham_cong_tru` count7d=1; `khong_co_ma_nay` → 400 và **không ghi gì** | `pnpm dev` rồi `$env:E2E_ADMIN_PASSWORD="<mật khẩu admin>"; $env:E2E_CHANNEL="chrome"; pnpm --filter @mtct/web exec playwright test e2e/phase1-acceptance.spec.ts` (7 test) |
| 3 | `/admin/skills` lọc theo môn: mỗi môn ≥ 35, tổng ≥ 250; `skills:validate` sạch; seed 2 lần không trùng | **Đạt** — 359 kỹ năng (VIET 102, ESL 59, ENL 52, EMATH 51, VMATH 48, ESCI 47) | `pnpm skills:validate`; mở <http://localhost:5000/admin/skills>; `pnpm db:seed` hai lần → lần hai in `0 new, 359 updated, 0 retired` và tổng số không đổi |
| 4 | `GET /api/skills/search?q=đọc từ có sh` → `ESL.PH.DIGRAPHS_SH_CH_TH` trong top-3 | **Đạt** — cả "đọc từ có sh" lẫn "doc tu co sh"; "cộng trong phạm vi 10" → `VMATH.SO.CONG_PV_10` | Trong `/admin/skills` gõ vào ô tìm; hoặc `Invoke-RestMethod "http://localhost:5000/api/skills/search?q=đọc từ có sh"` (cần cookie ADMIN) |
| 5 | `pnpm lint && pnpm test && pnpm build` xanh; `docker compose --env-file .env up -d --build` chạy **không cần khoá API nào** | **Đạt** — `.env` không có khoá nào (`TTS_API_KEY`, `TTS_VOICE_*`, `INTERNAL_API_TOKEN` đều trống); container web tự `migrate deploy` + seed (359/182/42) rồi `next start`; 7 test nghiệm thu chạy lại trên stack Docker đều xanh | `pnpm lint; pnpm test; pnpm build` (dừng `pnpm dev` trước); `docker compose --env-file .env -f docker/compose.yml up -d --build` rồi `Invoke-RestMethod http://localhost:5000/api/health` |
| 6 | Không có SDK Anthropic/OpenAI; `packages/core` không import Next/Prisma | **Đạt** | `Select-String -Path (Get-ChildItem -Recurse -Filter package.json -Exclude node_modules).FullName -Pattern "anthropic\|openai"` → rỗng; `Select-String -Path packages/core/src/**/*.ts -Pattern "from \"next\|@mtct/db\|@prisma"` → rỗng |

Ảnh chụp: `docs/screens/pha-1/admin-skills.png`.

**Kiểm chứng "seed không đụng dữ liệu học của con":** chạy `pnpm db:seed` khi DB đang có 15 `Evidence`, 5 `SkillMastery`, 15 `MasteryHistory`, 5 `ErrorStat` → sau khi seed vẫn đúng 15/5/15/5. Trình nạp chỉ ghi `Skill`, `SkillPrerequisite`, `Material`, `LessonUnit`, `LessonUnitSkill`, `ErrorCode`, `ContentBatch`; kỹ năng biến mất khỏi file chỉ bị `isActive=false`, không xoá.

### Số liệu

| Hạng mục | Số lượng |
|---|---|
| Kỹ năng | **359** — VIET 102 · ESL 59 · ENL 52 · EMATH 51 · VMATH 48 · ESCI 47 |
| Quan hệ tiên quyết | 353 |
| `LessonUnit` khung | **182** (TV 140: 83 bài học vần + ôn tập/đánh giá + 54 bài đọc tập hai · Toán 42: 41 bài + tiết học đầu tiên) trong 4 `Material` |
| Liên kết kỹ năng ↔ bài học | 505 |
| Mã lỗi | **42** (38 mã kiến thức + 4 mã hành vi `doan_bua`, `bo_trong`, `chua_nghe_het_de`, `met_cuoi_phien`) |
| Test | **104 đơn vị/tích hợp** xanh (core 65 · web 27 · db 13 · content 10) + **18 e2e** xanh (10 pha 0 + 7 pha 1 + smoke) |

### ADR đã viết

- **ADR-11** — ba commit ngoài phạm vi pha 0 + `ai voice/` + dịch vụ trả phí: **chờ chủ dự án chọn (a) giữ-tắt-mặc-định hay (b) gỡ**.
- **ADR-12** — bỏ `SkillEmbedding`/pgvector (ghi lại quyết định của pha 0), đã sửa `docs/03`.
- **ADR-13** — bổ sung nhỏ khi hiện thực hoá: trọng số `HOMEWORK` = 0.8, định nghĩa "bằng chứng đúng" (`score ≥ 0.8` khi không có `outcome`), lịch ôn chỉ cho kỹ năng từ `SOLID` trở lên, cột `Skill.confusableWith`, bảng `ErrorCode` (file JSON vẫn là nguồn sự thật), `searchVector` bằng trigger, mã môn Toán là `VMATH` (yêu cầu pha 1 ghi nhầm `TOAN`), khung `LessonUnit` đặt ở `*.units.json`, `INTERNAL_API_TOKEN` tuỳ chọn. Đã cập nhật `docs/02` §7, `docs/03` §2.2–2.3, `docs/04` §3.1 và §3.3 cho khớp.

### Chưa làm + giả định

- `RemediationTrack` mới có mô hình dữ liệu + hàm thuần chọn bậc (đúng phạm vi pha 1); **chưa có UI và chưa nối vào planner** — pha 3/5.
- `LessonUnit` mới là **khung**: `objectives`/`vocabulary`/`sampleTasks`/`contentText` để trống, pha 6 nạp từ PDF. Số trang SGK Toán **tập hai** chưa có (chỉ biết B21 tr.4) — `09` §2 cũng chưa có.
- `expectedWeek` và `weekFrom/To` là **suy từ số tiết** (Toán 3 tiết/tuần, Tiếng Việt ~5 bài/tuần), chưa hiệu chỉnh theo nhật ký lớp — `11` §5 sẽ chỉnh. Lớp đang học bài 13 vào 10/09/2026 nên nhịp thật có thể nhanh hơn.
- Kỹ năng **ESL** gắn `standardRef` dạng `GS1.U<n>` là **ước đoán** unit Global Success 1 (chỉ Unit 1 có dữ liệu thật từ phiếu bài tập); ENL/EMATH/ESCI theo CCSS/NGSS, chưa có sách của trường. Gắn lại khi có sách (FR-INT-03).
- Ba tệp sinh kỹ năng chạy một lần trong thư mục tạm rồi bỏ; **file JSON trong `content/` là nguồn sự thật**, sửa trực tiếp hoặc qua `/admin/skills`.

### Câu hỏi cho chủ dự án

1. **ADR-11: giữ hay gỡ** phần TTS cloud + giọng nhân bản ElevenLabs + giao diện MEDIFA ONE? Nếu giữ thì cần cập nhật `docs/02` §3 (thư mục `ai voice/`) và `docs/06` §2 (token màu teal, hai trang `/admin` và `/admin/health`). Nếu đã chạy `pnpm tts:clone` thì có muốn **xoá giọng đã tải lên ElevenLabs** không (bản thu giọng thật của con đang nằm ở bên thứ ba)?
2. Ngày bắt đầu năm học thật (câu hỏi còn nợ từ pha 0) — cần để chỉnh `expectedWeek` cho khớp lớp.
3. Sách **Tiếng Anh 1 – Global Success** (và giáo trình NAVIO nếu có): có xin được bản PDF không? Thiếu nó thì 59 kỹ năng ESL vẫn là bản đồ nền, chưa bám unit thật của trường.

---

## Pha 0 — 10/09/2026 — Khung dự án + đăng nhập & quản lý người dùng

Trạng thái: **xong** (8/8 tiêu chí đạt trên máy dev; mục 1 kiểm bằng compose với volume DB mới, xem bảng). Code chạy ở 9 commit Conventional Commits, chưa push.

### Đã làm theo 5 việc

1. **Monorepo** — pnpm 9 + Turborepo 2, TypeScript strict (`packages/config`), Biome 2.5 (lint + format), Vitest 5, Playwright 1.63; cấu trúc đúng `02` §3 (`apps/{web,worker}`, `packages/{core,inbox,content,db,config}`, `content/`, `docker/`, `scripts/`). `packages/core` thuần (không Next/Prisma): chính sách khoá tài khoản, giới hạn IP, mật khẩu, bộ mã hình 4 ảnh, quyền truy cập theo vai trò/studentId, 35 tuần học, adapter `FileStorage` (`@mtct/core/storage`). *Kiểm tra:* `pnpm lint` xanh; `pnpm test` = 31 test đơn vị xanh (core 22, content 3, web 3, còn lại rỗng).
2. **`packages/db`** — Prisma 6.19, schema **58 bảng** đủ theo `03` (User/LoginAudit/TrustedDevice/Student/StudentGuardian, Skill…, InboxItem, PlanHint, ClassDiary/Homework, Pet/KidMail/Certificate, AiConfig/PromptTemplate/Setting/AuditLog…), migration `20260910145237_init`, seed idempotent. *Kiểm tra:* `pnpm db:migrate` rồi `pnpm db:seed` in `{"users":1,"skills":0,"timetableSlots":30,"schoolWeeks":35,"badges":8}`; truy vấn `information_schema.tables` = 58 bảng; `pnpm db:studio` xem được.
3. **`apps/web`** — Next 16.3 + Auth.js v5 (JWT, cookie httpOnly): provider `adult` (username + Argon2id) và `kid-login` (thẻ ảnh + 4 hình theo thứ tự, Argon2id); sai 5 lần khoá 10 phút; 10 lần sai/phút/IP tạm chặn; `LoginAudit` mọi lần; sai tên và sai mật khẩu cùng một thông báo; ép đổi mật khẩu lần đầu (proxy chặn mọi trang + API); phiên người lớn 30 ngày khi "ghi nhớ" / 12 giờ không thao tác, con 2 giờ; tiêu đề bảo mật (HSTS, nosniff, X-Frame-Options DENY, CSP cơ bản); `proxy.ts` phân quyền theo route group **và** lặp lại trong từng layout/handler (`guardPage`, `requireRole`, `requireStudentAccess` — kiểm `StudentGuardian` trong DB, không tin `studentId` client). Trang `/login` gộp, `/change-password`, `/kid/home` (hiện tên gọi ở nhà, mascot, nút đọc to), `/parent` + `/parent/[studentId]` (khung), `/api/health`, `/api/students/:id`, `/api/students/:id/mastery` (trả rỗng, chỉ để chứng minh 403). *Kiểm tra:* Playwright 10/10 xanh (xem mục e2e); `curl /api/students/x/mastery` không cookie → 401.
4. **`apps/worker` + Docker** — pg-boss 12, job `ping` mỗi phút ghi `Setting[worker.lastPing]`, log `"ping ok"`; `docker/compose.yml` chỉ 3 service (postgres:16, web, worker); `docker/Dockerfile` multi-stage với hai target `web`/`worker` (thay cho hai file Dockerfile.web/.worker — cùng nội dung base); web khởi động = `prisma migrate deploy` → seed → `next start`; `.env.example` đủ biến `02` §7 (không có khoá LLM); README chạy từ PowerShell. *Kiểm tra:* worker log `ping ok`; `GET /api/health` → `{"status":"ok","db":"ok","worker":{"lastPing":"…","ageSeconds":22,"ok":true}}`.
5. **`/admin/users`** — bảng + 5 thao tác FR-ADM-06: tạo (CHILD tạo luôn `Student` + mã hình; PARENT/ADMIN email + mật khẩu tạm, bắt đổi lần đầu), gắn phụ huynh ↔ con, đặt lại mật khẩu/mã hình (xoá bộ đếm sai), bật/tắt (không tự tắt chính mình), 50 lần đăng nhập gần nhất. API JSON `/api/admin/users*` kiểm vai trò ADMIN + Zod. *Kiểm tra:* e2e mục 2 tạo 1 phụ huynh + 2 bé (1 bé qua hộp thoại thật, còn lại qua API) và gắn quan hệ trong < 10 giây.

### Bảng 8 tiêu chí xong

| # | Tiêu chí | Kết quả | Tự kiểm tra |
|---|---|---|---|
| 1 | `docker compose -f docker/compose.yml up -d --build` → `/login` → admin bị ép đổi mật khẩu, trang khác về `/change-password` | **Đạt** — build image, chạy stack thứ hai với volume DB mới (`-p mtct-clean`, cổng 3001/5434): log web `migrate deploy → seed: admin created (mustChangePassword=true) → next start`, rồi chạy cả 10 test e2e lên stack đó (10/10 xanh, ảnh chụp lấy từ stack sạch này) | `docker compose -f docker/compose.yml up -d --build` (máy này phải thêm `--env-file .env` vì cổng 5432 bận) → mở <http://localhost:5000/login>, đăng nhập `ADMIN_USERNAME`/`ADMIN_PASSWORD` → tự chuyển `/change-password`; gõ `/admin/users` hay `Invoke-RestMethod /api/admin/users` (403) đều không vào được |
| 2 | Admin tạo 1 phụ huynh + 2 bé (hồ sơ Student + mã 4 hình), gắn quan hệ < 3 phút | **Đạt** | `/admin/users` → "+ Tạo tài khoản" (chọn Con: điền tên gọi, chọn 4 hình) ×2, tạo Phụ huynh (tick con); e2e mục 2 đo thời gian |
| 3 | Đăng xuất, con chạm thẻ ảnh + mã 4 hình → `/kid/home` hiện tên gọi ở nhà | **Đạt** | `/login` → chạm thẻ → chọn 4 hình → "Chào Mai Thy!" (ảnh `docs/screens/pha-0/kid-home.png`); e2e mục 3 |
| 4 | Sai 5 lần → khoá 10 phút, `LoginAudit` đủ 5 dòng; sai tên và sai mật khẩu cùng thông báo | **Đạt** | e2e mục 4 (5 × WRONG_PASSWORD + LOCKED, thông báo "Mình nghỉ 10 phút…"); `login.spec` so hai thông báo bằng nhau; admin xem "Nhật ký" của tài khoản |
| 5 | CHILD gọi mastery của bé kia → 403; phụ huynh chưa gắn → 403; chưa đăng nhập vào `/parent` → `/login` | **Đạt** | e2e mục 5; hoặc đăng nhập con rồi `fetch('/api/students/<id bé kia>/mastery')` trong console → 403 |
| 6 | `GET /api/health` → `db:"ok"`, `worker.lastPing ≤ 6 phút`; worker log `ping ok` | **Đạt** | `Invoke-RestMethod http://localhost:5000/api/health`; `docker compose -f docker/compose.yml logs worker` |
| 7 | Prisma studio đủ bảng; TimetableSlot 30; SchoolWeek 35; Skill rỗng; User chỉ 1 admin | **Đạt** — 58 bảng, 30/35/0/1 (trên DB mới; DB dev có thêm tài khoản e2e) | `pnpm db:studio` hoặc `node scripts/db-query.cjs 'select count(*) from "TimetableSlot"'` |
| 8 | `pnpm lint && pnpm test && pnpm build` xanh; Playwright smoke xanh | **Đạt** (lint 0 lỗi; 31 test đơn vị; build 3 gói; e2e 10/10 trên cả dev server lẫn compose) | `pnpm lint; pnpm test; pnpm build` rồi `pnpm dev` + `pnpm e2e` (smoke 4 test); nghiệm thu đầy đủ: `$env:E2E_ADMIN_PASSWORD="<mật khẩu admin>"; $env:E2E_CHANNEL="chrome"; pnpm e2e` (10 test) |

Ảnh chụp: `docs/screens/pha-0/login.png`, `admin-users.png`, `kid-home.png` (Playwright chụp trong e2e).

### Lệch tài liệu đã xử lý (không cần ADR mới, theo tài liệu mới hơn)

- `08` việc 2 ghi "pgvector bật", `03` có `SkillEmbedding`/`LessonUnit.embedding vector(1024)` → theo ADR-10 và `13` §1 "bỏ pgvector": **không** tạo extension, bỏ bảng `SkillEmbedding` và cột `embedding`. Tra cứu kỹ năng ở pha 1 dùng full-text như `08` pha 1 việc 5.
- `12` §2 đặt tên kết quả `LoginAudit` tiếng Việt, `03` tiếng Anh → dùng `OK|WRONG_PASSWORD|LOCKED|NO_SUCH_USER|DISABLED`.
- `Student` nối 1–1 với `User` CHILD nên hồ sơ mẫu dev (`thy`, `thanh`) phải kèm 2 user CHILD mẫu → chỉ tạo khi `pnpm db:seed:dev` (chặn khi `NODE_ENV=production`); seed thường chỉ 1 admin.
- `02` §7 phác thảo `Dockerfile.web` + `Dockerfile.worker` → dùng một `docker/Dockerfile` với hai target; `cloudflared`/`backup` để pha 8 đúng lưu ý pha 0.
- Cookie `Secure`: Auth.js tự bật khi `AUTH_URL` là https (sau Cloudflare Tunnel); trên `http://localhost` không thể bật vì trình duyệt sẽ từ chối cookie.
- Giới hạn IP chỉ đếm lần **thất bại** (10/phút) để một máy của gia đình đăng nhập/đăng xuất nhiều lần không bị chặn oan.

### Chưa làm + lý do

- Ảnh đại diện/mascot là emoji tạm (`lib/avatars.ts`); tài sản thật thuộc pha 3 (`06` §1.9). `/kid/home` mới là màn chào tên + nút đọc to, chưa phải thế giới có Lottie (pha 3).
- "Báo ba mẹ" khi con bị khoá: mới ghi `AuditLog(KID_LOGIN_LOCKED)`; thẻ thông báo trên dashboard thuộc pha 5.
- Thiết bị tin cậy, 2FA, cảnh báo IP lạ: P1 pha 8 (đã có bảng `TrustedDevice`).
- `content:import/stats`, `inbox:pull/validate/push`: stub báo "pha 2".
- Image Docker chưa tối ưu dung lượng (**~2,6 GB/image**: copy cả monorepo + `pnpm install --prod`; `pnpm prune --prod` không dùng được trong workspace vì xoá sạch node_modules từng gói) — đủ cho máy nhà; có thể chuyển `output: standalone` ở pha 8.

### Sự cố môi trường trên máy dev (đã xử lý, cần chủ dự án biết)

- Ổ **C: chỉ còn ~1,4 GB** (thư mục `%TEMP%\odis_download_dest` ~50 GB, ngày 10/09) → Turbopack từng lỗi "no space" khi ghi log; Docker data đã ở E: nên build/chạy compose không ảnh hưởng. Nên dọn C: trước pha sau.
- Cổng **5432** đã bị container khác dùng → `.env` máy này đặt `POSTGRES_PORT=5433` và phải chạy compose với `--env-file .env` (compose chỉ đọc `docker/.env` mặc định). Đã ghi vào README.
- Docker Desktop treo một lần, phải khởi động lại.

### Cần điền trong `.env` trước khi chạy (từ `.env.example`)

`POSTGRES_PASSWORD`, `DATABASE_URL` (khớp cổng), `AUTH_SECRET` (32 byte base64), `AUTH_URL` (https://<domain> khi qua tunnel), `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (≥ 10 ký tự, sẽ bị bắt đổi ngay), `SCHOOL_YEAR_START` (mặc định 2026-09-08), `POSTGRES_PORT` (nếu 5432 bận). Không có `ANTHROPIC_API_KEY`.

### Câu hỏi cho chủ dự án

1. Khi con nhập sai 5 lần, ngoài ghi log, có muốn gửi thông báo tức thì (email/Telegram) ngay từ bây giờ không, hay để pha 5 hiện thẻ trên dashboard là đủ?
2. Ngày bắt đầu năm học thật (nhật ký lớp cho thấy sớm hơn 08/09) — cần giá trị để đặt `SCHOOL_YEAR_START` và chỉnh `SchoolWeek` trong admin ở pha 5.

## 10/09/2026 — Chốt mô hình vận hành hai chế độ

- Chủ dự án chốt: **không API**. Mỗi ngày có dữ liệu mới thì đưa cho Claude Code xử lý và quyết định bài học; không có dữ liệu mới thì backend tự quyết. Ghi thành `13` §3: chế độ A (Claude Code nạp dữ liệu + để lại `PlanHint`) và chế độ B (planner backend tự chạy); planner luôn chạy, tôn trọng `PlanHint` còn hiệu lực. Thêm `PlanHint` vào `03`, `04` §4 bước 3; `13` §6 cánh cửa mở worker tự động v2 với bảng rào chi phí.

## 10/09/2026 — ADR-10: app không gọi API LLM

- Chủ dự án nhắc: không dùng API Anthropic. Chốt ADR-10: mọi việc cần AI (đọc ảnh vở, chấm bài viết/nói, báo cáo tuần) đi qua **hàng chờ** (`packages/inbox`, `InboxItem`) và do Claude Code xử lý theo lô vài lần/tuần; nhật ký lớp đọc bằng **bộ đọc theo mẫu** không AI; gia sư giọng nói lùi P2; trợ lý = hỏi Claude Code trong repo; bỏ pgvector/embedding; bỏ `packages/ai`, bỏ `ANTHROPIC_API_KEY`.
- Viết `docs/13-HANG-CHO-AI.md`; sửa `00`, `01`, `02` (stack, ADR-10, env, compose), `04` §1, `07`, `08` (pha 0/1/2/4/7), `10`, `11`, `CLAUDE.md`.

## 10/09/2026 — Thêm 14 cơ chế thu hút (`06` §1.8c)

- Chủ dự án thích hướng "có gì mới + được tự quyết", yêu cầu thêm ý tưởng. Thêm 14 cơ chế theo 4 động lực (mong chờ, sở hữu, được là người lớn, được nhìn thấy); 7 mục P0 vào pha 3: trứng nở, mascot có ký ức, mảnh tranh cuối tuần, hộp thư ba mẹ, thế giới theo giờ thật, sao vàng lớn, giấy chứng nhận. Bảng mới ở `03`; FR-PAR-08 ở `01`; checklist `06` §4 mục 12; pha 3 ước lượng 6–7.

## 10/09/2026 — Rà soát "thông minh" & "sinh động", bổ sung 5 điểm

- **Bộ mã lỗi chuẩn** `content/error-taxonomy.json` (~40 mã theo môn, `04` §11.1) — trước đây `errorType`/`targetsError` là chữ tự do nên không khớp được bằng chứng ↔ bài rèn.
- **Đáp án nhiễu có chẩn đoán** (`choices[].errorTag`) và `scaffold: model` (mascot làm mẫu) trong `ExerciseSpec`; rubric soạn bài thêm mục 11.
- **Thang rèn 6 bậc** khi con yếu (`04` §11.4): đổi kênh → hạ độ khó → bài mẫu → tiên quyết → đối chiếu cặp dễ nhầm → kiểm tra lại / nhờ ba mẹ; giới hạn ≤ 4 bài rèn/phiên. Bảng `ErrorStat`, `RemediationTrack` (`03`).
- **STT tiếng Việt lên P0** + chế độ "cùng ba mẹ" chấm tay; TTS neural sinh sẵn lúc nạp nội dung (NFR-04).
- **Giữ mới & quyền chọn** (`06` §1.8b): sự kiện tuần, trạm chọn 1-trong-2, nghỉ vận động, dừng khi mệt, giọng mascot thu sẵn, cây chung của nhà (P1), mở khoá khu mới; checklist §4 thêm mục 10–11.
- Dọn: bỏ `kidPinHash` thừa ở `Student`; nhật ký lớp sinh `Homework` riêng cho từng bé (`11` §4).

## 10/09/2026 — Người dùng, vai trò & đăng nhập

- Chủ dự án yêu cầu: web mở ra internet nên cần đăng nhập + quản lý người dùng, cấu trúc đơn giản, có vai trò phân biệt con và bố mẹ, một tài khoản admin tạo sẵn.
- Viết `docs/12-NGUOI-DUNG-DANG-NHAP.md`: một bảng `User` với 3 vai trò `ADMIN|PARENT|CHILD`, `Student` nối 1–1 với user `CHILD`, `LoginAudit`, `TrustedDevice` (P1); trang `/login` gộp thẻ ảnh của con và form người lớn; `/admin/users` 5 thao tác; phần bảo vệ khi mở internet.
- Cập nhật `00`, `01` (FR-CORE-01 viết lại, thêm FR-ADM-06, NFR-05), `02` (phân quyền, API users, `.env`), `03` (User/Student/LoginAudit/TrustedDevice, seed chỉ 1 admin), `08` (pha 0 đổi tên và thêm việc 5), `CLAUDE.md`.

## 10/09/2026 — Nhận đủ SGK Toán & Tiếng Việt (cả 4 tập)

- Chủ dự án nạp SGK **học sinh**: Tiếng Việt 1 tập một & hai, Toán 1 tập một & hai (bộ Kết nối tri thức, PDF quét). Hai file SGV nạp hôm trước **không còn trong thư mục** — cần chép lại nếu còn giữ.
- Rút được **mục lục đầy đủ Tiếng Việt 1 tập một: 83 bài học vần** kèm số trang → thay hẳn danh sách kỹ năng `VIET.HV.*` đoán trước đây; ghi vào `09` §3 cùng quy tắc sinh kỹ năng và danh sách cặp âm dễ nhầm.
- Kiểm chứng: bài 13 "U u – Ư ư" trang 38–39 khớp nhật ký lớp; cấu trúc mỗi bài gồm 5 mục (Nhận biết / Đọc / Viết / Đọc / Nói) → "mục 2 và mục 4" cô giao ánh xạ thành hai nhiệm vụ `READ_ALOUD`.
- Quy đổi trang PDF = trang sách + 1. Bổ sung số trang SGK cho 20 bài Toán tập một (khác số trang SGV).
- Xác nhận sách tiếng Anh: bìa sau ghi **"Tiếng Anh 1 – Global Success – Sách học sinh"** → `GS1` trên phiếu chính là sách này.

## 10/09/2026 — Nhật ký lớp Edi Parent + phiếu bài tập

- Phát hiện nguồn dữ liệu quan trọng: GVCN đăng nhật ký hằng ngày trên **Edi Parent** (hôm nay học bài gì từng môn + bài cô giao). Viết `docs/11-NHAT-KY-LOP.md`; thêm `ClassDiary`/`DiaryLesson`/`Homework`/`ClassReminder` vào `03`, FR-INT-06 + FR-LRN-07 vào `01`, đổi planner ở `04` §4 (ưu tiên bài học 3 ngày gần nhất), thêm kênh D vào `07`, pha 4 thêm việc 5.
- Đọc thử phiếu ESL thật của Mai Thy → rút ra quy tắc **`BLANK` ≠ sai** (`07` §2.2) và 5 dạng bài của phiếu trường để ngân hàng bài bắt chước (`11` §9).
- Manh mối sách ESL: phiếu ghi `GS1` — có thể là Global Success 1; cần xác nhận với cô.
- Lưu ý: chuỗi bài (TV bài 13 vào 10/09) cho thấy **năm học bắt đầu sớm hơn giả định 08/09/2026** — cần chỉnh `SchoolWeek` khi có đủ nhật ký.

## 10/09/2026 — Chốt ADR-9: nội dung soạn ngoại tuyến

- Chủ dự án chốt: bài học và ngân hàng bài luyện do **Claude Code soạn trong repo rồi nạp DB**, app chỉ đọc; ảnh bài vở hằng tuần vẫn nạp qua app, Claude Code chỉ dùng cho lô lớn.
- Viết `docs/10-NAP-NOI-DUNG.md`; sửa `00`, `01`, `02` (ADR-9, `packages/content`), `03` (Exercise + ContentBatch), `04` (tách AI ngoại tuyến / lúc chạy, chi phí giảm còn ≤ 1 USD/tháng), `07`, `08` (pha 2 và 6 đổi thành pha nội dung), `CLAUDE.md`.

## 10/09/2026 — Nạp sách giáo khoa

- Chủ dự án nạp `sach giao khoa/01-sgv-toan-1.pdf` và `01-sgvtieng-viet-1-tap-hai.pdf` (SGV, bộ Kết nối tri thức, PDF quét). Viết `docs/09-GIAO-TRINH-TRUONG.md`; cập nhật `05`, `07`, `08`.
- Còn thiếu: Tiếng Việt 1 tập một, SGK học sinh, sách tiếng Anh (ESL/English Maths/English Science) — chủ dự án tìm sau.

## 09/09/2026 — Thiết kế xong

- Hoàn thành bộ tài liệu `docs/00`–`08`. Chưa có code.
- Việc kế tiếp: **Pha 0 — Khung dự án** (`docs/08-LO-TRINH-PHA.md`).
- Chủ dự án cần chuẩn bị trước pha 0: khoá API Anthropic, Docker Desktop, chọn máy/NAS chạy hệ thống.
