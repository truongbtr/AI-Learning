# ADR-11 — Ba commit ngoài phạm vi pha 0 (TTS cloud, giọng nhân bản ElevenLabs, giao diện MEDIFA ONE)

- **Trạng thái:** ĐỀ XUẤT — chờ chủ dự án chọn (a) hoặc (b). Developer **không tự quyết**.
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

*Chưa có.* Trong lúc chờ: pha 1 xây `/admin/skills` bằng các primitives hiện có (Button/Card/Input/Table/Dialog — vốn là kiểu shadcn) với màu trung tính, không đầu tư thêm vào token MEDIFA ONE; mọi thứ tiếp tục chạy khi không có khoá trả phí nào.

## Hệ quả

- Báo cáo cuối pha 1 nêu câu hỏi này để chủ dự án chọn; pha 2 không bắt đầu khi chưa chốt.
- Dù chọn (a) hay (b), nguyên tắc không đổi: **app không gọi API LLM**, Web Speech là mặc định, khoá chỉ trong `.env`.
