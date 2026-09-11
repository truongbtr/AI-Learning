# ADR-11 — Ba commit ngoài phạm vi pha 0 (TTS cloud, giọng nhân bản ElevenLabs, giao diện MEDIFA ONE)

- **Trạng thái:** ĐÃ CHỐT 11/09/2026 — phương án (c). **Sửa 11/09/2026 (bổ sung ở cuối):** nhà cung cấp mặc định đổi từ Vbee sang **Azure** — xem mục "Bổ sung: đổi nhà cung cấp TTS".
- **Ngày:** 11/09/2026 (đầu pha 1)
- **Liên quan:** ADR-6 (Web Speech mặc định, cloud TTS qua adapter), ADR-10 (không SDK LLM), NFR-04, NFR-09, `docs/06` §2 (giao diện ba mẹ/admin).

## Bối cảnh

Pha 0 (`docs/08`) chỉ gồm 5 việc: monorepo, Prisma, Auth.js + `/login`, worker + Docker, `/admin/users`. Sau khi nghiệm thu, lịch sử git có **ba commit không nằm trong danh sách đó**:

| Commit | Nội dung | Tệp chính |
|---|---|---|
| `e13b042` `feat(web): read-aloud pipeline — recorded clips, cloud neural TTS with mp3 cache, safe Web Speech fallback` | `/api/tts`; adapter Azure Speech / Google Cloud TTS (gọi bằng `fetch`, không SDK); cache mp3 dưới `FILE_ROOT/tts`; `SpeakButton` đọc clip thu sẵn → mp3 cache → cloud → Web Speech; im lặng khi không có giọng đúng ngôn ngữ | `apps/web/app/api/tts/route.ts`, `apps/web/lib/tts/{provider,synthesize,voices}.ts`, `apps/web/components/kid/speak-button.tsx`, `content/art/audio/README.md` |
| `3cb324a` `feat(web): adult area restyled after the MEDIFA ONE design system` | Vỏ giao diện người lớn chép theo dự án MEDIFA ONE (sidebar 264 px, topbar, `PageHeader`, `KpiCard`, token màu teal/ink trong `globals.css`), trang `/admin` (dashboard) và `/admin/health` mới, primitives `Button/Card/Badge/Input/Table/Dialog` đổi kiểu | `apps/web/components/admin/*`, `apps/web/components/ui/*`, `apps/web/app/globals.css`, `apps/web/lib/nav.ts`, `apps/web/app/(admin)/admin/{page,health/page}.tsx` |
| `00f4d36` `feat(tts): cloned boy/girl child voices via ElevenLabs, chosen by screen context` | Nhân bản giọng hai bé từ hai bản thu trong `ai voice/` bằng **ElevenLabs** (dịch vụ trả phí); chọn giọng bé trai/bé gái theo avatar/mascot | `scripts/tts-clone-voices.mjs`, lệnh `pnpm tts:clone`, `apps/web/lib/tts/*` |

Ngoài ra:

- Thư mục **`ai voice/`** (hai file `Giọng bé gái.mp3`, `Giọng bé trai.mp3` — bản thu giọng thật của con) **không có trong cấu trúc chốt ở `docs/02` §3**; đã được gitignore (`/ai voice/`) nên không vào git, nhưng là dữ liệu riêng tư nhạy cảm và đã được **tải lên ElevenLabs** khi chạy `pnpm tts:clone` (nếu chủ dự án đã chạy).
- **Dịch vụ trả phí / khoá API đã thêm** (đều tuỳ chọn, chọn bằng `TTS_PROVIDER`): ElevenLabs (`elevenlabs`), Azure Speech (`azure`), Google Cloud Text-to-Speech (`google`). Không có SDK nào được cài — chỉ gọi HTTP bằng `fetch`. **Không có SDK Anthropic/OpenAI** (đã kiểm `package.json` mọi app/package — đúng ADR-10).
- **Biến `.env` liên quan:** `TTS_PROVIDER` (mặc định `webspeech`), `TTS_API_KEY`, `TTS_REGION`, `TTS_VOICE_GIRL`, `TTS_VOICE_BOY`, `TTS_MODEL`, `TTS_PITCH_PERCENT`, `TTS_RATE` (cũng nằm trong `turbo.json` `globalPassThroughEnv`).
- **Ảnh hưởng tới `docs/06`:** §2 chốt giao diện ba mẹ/admin là **shadcn/ui, màu trung tính, điểm nhấn theo bé, sidebar (laptop) / bottom tab (điện thoại)**. Vỏ MEDIFA ONE giữ sidebar và các primitives kiểu shadcn nhưng đổi sang **token thương hiệu teal + pill đỏ** của một dự án khác, thêm hai trang không có trong `docs/06` §2.2 (`/admin` dashboard, `/admin/health`). Giao diện con (`docs/06` §1) **không bị ảnh hưởng** (chỉ thêm nút đọc to). NFR-04 vẫn thoả: Web Speech là mặc định, cloud là tuỳ chọn.

## Tình trạng hiện tại (đã kiểm ở đầu pha 1)

- Khi `.env` **không có** `TTS_API_KEY`/`TTS_VOICE_*` và `TTS_PROVIDER=webspeech` (giá trị mặc định trong `.env.example`): `cloudTtsEnabled()` trả `false`, `/api/tts` trả 204, nút đọc to dùng Web Speech hoặc im lặng — **mọi thứ chạy được không cần khoá nào**. `pnpm tts:clone` chỉ chạy khi gọi tay và báo lỗi rõ nếu thiếu khoá.
- Docker compose không cần biến TTS nào.

## Hai phương án — chủ dự án chọn

**(a) Giữ, tắt mặc định bằng cờ env** *(trạng thái kỹ thuật hiện nay đã gần như vậy)*
- Giữ code TTS cloud và script nhân bản giọng; `TTS_PROVIDER=webspeech` mặc định; ghi rõ trong README rằng ElevenLabs/Azure/Google là **tuỳ chọn trả phí**.
- Giữ vỏ MEDIFA ONE nhưng cần **cập nhật `docs/06` §2** (ghi token màu teal/ink, hai trang mới) để tài liệu và code khớp nhau; hoặc đổi token về màu trung tính theo `docs/06` mà vẫn giữ cấu trúc shell.
- Thư mục `ai voice/`: ghi vào `docs/02` §3 như thư mục dữ liệu riêng tư không vào git, hoặc chuyển sang `data/voice/` (đã gitignore `/data`).
- Việc còn nợ nếu chọn (a): cập nhật `docs/02` §3 (thư mục), `docs/02` §7 (biến env), `docs/06` §2; cân nhắc **xoá giọng đã tải lên ElevenLabs** nếu không dùng (dữ liệu giọng thật của con ở bên thứ ba).

**(b) Gỡ**
- Revert ba commit (hoặc gỡ chọn lọc): xoá `/api/tts`, `lib/tts/*`, `scripts/tts-clone-voices.mjs`, lệnh `pnpm tts:clone`, biến `TTS_*` trừ `TTS_PROVIDER`/`TTS_API_KEY` (hai biến này có trong `docs/02` §7); `SpeakButton` về Web Speech thuần (ADR-6).
- Đưa vỏ người lớn về shadcn/ui trung tính theo `docs/06` §2; bỏ `/admin` dashboard và `/admin/health` hoặc giữ lại `/admin/health` vì hữu ích cho pha 8 (cần chốt).
- Xoá `ai voice/` khỏi máy chủ và **xoá giọng đã nhân bản trên ElevenLabs**.

## Quyết định

**Phương án (c) — gỡ phần nhân bản giọng, giữ TTS cloud với giọng tiếng Việt chuẩn.** Chủ dự án: *"Không cần phải theo giọng thu sẵn, tôi cần giọng chuẩn tiếng Việt dễ thương là được."*

1. **Gỡ hẳn nhân bản giọng:** xoá `scripts/tts-clone-voices.mjs`, lệnh `pnpm tts:clone`, mọi nhánh code chọn giọng nhân bản, provider `elevenlabs`; xoá thư mục `ai voice/` khỏi máy chủ (giọng thật của trẻ em là dữ liệu sinh trắc học, không đưa lên bên thứ ba). Nếu đã từng chạy `pnpm tts:clone` thì báo chủ dự án tự đăng nhập ElevenLabs xoá giọng đã tạo — developer không gọi API xoá.
2. **Giữ TTS cloud tuỳ chọn** (ADR-6, NFR-04) với **giọng dựng sẵn của nhà cung cấp**, không nhân bản. Chọn bằng `TTS_PROVIDER`:
   - `vbee` — **mặc định cho tiếng Việt** (nhà cung cấp Việt Nam, có sẵn giọng trẻ em tiếng Việt). `POST https://api.vbee.vn/v1/tts`, header `Authorization: Bearer <token>` + `App-Id`; body `text`, `voiceCode`, `speed` (0.25–1.9), `outputFormat: mp3`; `mode` đồng bộ cho câu ngắn. Danh sách giọng: `GET https://vbee.vn/api/public/v1/voices?language_code=vi-VN`. **Link audio trả về hết hạn sau 3 phút** → phải tải mp3 về lưu ngay, không lưu link vào DB.
   - `azure` — dự phòng / dùng cho tiếng Anh (`vi-VN-HoaiMyNeural` nếu cần tiếng Việt).
   - `google`, `webspeech` (mặc định khi không có khoá).
   Sinh sẵn mp3 **lúc nạp nội dung**, cache theo hash (văn bản + mã giọng + tốc độ); lúc chạy app chỉ phát file. Không khoá → Web Speech, app vẫn đủ chức năng.
   **Sinh dần, có thể chạy lại:** hạn mức miễn phí của nhà cung cấp có thể chỉ vài nghìn ký tự/ngày, nên `content:import` sinh những câu chưa có mp3, gặp lỗi hết hạn mức thì **dừng êm** (không hỏng lô nạp), ghi số câu còn thiếu; chạy lại hôm sau là tiếp tục. `content:stats` hiển thị số câu chưa có audio.
3. **Giao diện người lớn:** gỡ vỏ MEDIFA ONE, trả `/admin/*` và `/parent/*` về `docs/06` §2 (shadcn/ui, màu trung tính, điểm nhấn theo bé). Giữ `/admin/health` vì pha 8 cần; bỏ `/admin` dashboard cho tới khi `docs/06` §2.2 có thiết kế cho nó.
4. Biến env còn lại: `TTS_PROVIDER` (mặc định `webspeech`), `TTS_API_KEY`, `TTS_REGION`, `TTS_VOICE_VI`, `TTS_VOICE_EN`, `TTS_APP_ID` (Vbee), `TTS_RATE`. Bỏ `TTS_VOICE_GIRL`/`TTS_VOICE_BOY`/`TTS_PITCH_PERCENT`. Trong lúc chờ: pha 1 xây `/admin/skills` bằng các primitives hiện có (Button/Card/Input/Table/Dialog — vốn là kiểu shadcn) với màu trung tính, không đầu tư thêm vào token MEDIFA ONE; mọi thứ tiếp tục chạy khi không có khoá trả phí nào.

## Hệ quả

- Báo cáo cuối pha 1 nêu câu hỏi này để chủ dự án chọn; pha 2 không bắt đầu khi chưa chốt.
- Dù chọn (a) hay (b), nguyên tắc không đổi: **app không gọi API LLM**, Web Speech là mặc định, khoá chỉ trong `.env`.


## Bổ sung: đổi nhà cung cấp TTS mặc định sang Azure (11/09/2026)

Sau khi chốt phương án (c), QC kiểm tra bảng giá thật của Vbee: **tab API không niêm yết giá**, chỉ có biểu mẫu "liên hệ nhận báo giá doanh nghiệp"; gói 599k/năm mà chủ dự án thấy là gói **Studio** (gõ tay trên web, không kèm quyền gọi API). Không phù hợp với một dự án gia đình cần ~36.000 ký tự một lần.

**Quyết định:** nhà cung cấp mặc định là **Azure AI Speech**, bậc `F0` (miễn phí ~500.000 ký tự giọng neural/tháng), vùng **`eastasia`** (tài nguyên `mimosa118` của chủ dự án).

- `POST https://{region}.tts.speech.microsoft.com/cognitiveservices/v1`; header `Ocp-Apim-Subscription-Key`, `Content-Type: application/ssml+xml`, `X-Microsoft-OutputFormat: audio-24khz-48kbitrate-mono-mp3`; thân là SSML; đáp lại **chính là mp3** (không có link hết hạn như Vbee).
- **Giọng đã nghe thử và chốt 11/09/2026** (chủ dự án nghe 6 mẫu, chọn mẫu 1 và mẫu 6):
  - Tiếng Việt: `vi-VN-HoaiMyNeural`, **giữ nguyên tốc độ và cao độ gốc** — không bọc `<prosody>`. (Các mẫu chậm 10% / nâng cao độ đều bị loại.)
  - Tiếng Anh: `en-US-AnaNeural` (giọng bé gái), bọc `<prosody rate="-10%">`.
  - `TTS_RATE` chỉ áp cho tiếng Anh; tiếng Việt để trống.
- Danh sách giọng: `GET https://{region}.tts.speech.microsoft.com/cognitiveservices/voices/list`.
- Mã Vbee đã viết ở pha 2 **giữ lại làm provider tuỳ chọn**, không phải mặc định; không đi hỏi báo giá doanh nghiệp.
- Azure không có giọng **trẻ em tiếng Việt**. Nếu sau này nghe thấy khô, đường lùi rẻ: mua gói Vbee Studio 599k/năm, xuất tay ~100 câu thoại cố định của mascot bỏ vào `content/art/audio/`; phần câu lệnh bài tập vẫn do Azure sinh. Quyết định ở pha 3 sau khi nghe thử.
- Biến env: `TTS_PROVIDER=azure|vbee|google|webspeech`, `TTS_API_KEY`, `TTS_REGION`, `TTS_VOICE_VI`, `TTS_VOICE_EN`, `TTS_RATE`; `TTS_APP_ID` chỉ dùng cho Vbee.
