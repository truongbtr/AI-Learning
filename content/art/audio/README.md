# Âm thanh cho góc của con

## 1. Giọng đọc đề bài — TTS neural có sẵn (ADR-6, ADR-11)

Dự án **không nhân bản giọng thật của trẻ** (giọng là dữ liệu sinh trắc học, không đưa lên dịch vụ
bên thứ ba — ADR-11). Đề bài dùng **giọng dựng sẵn của nhà cung cấp**, đọc chậm hơn mặc định
(`TTS_RATE=0.9`) cho trẻ 6 tuổi dễ nghe:

| `TTS_PROVIDER` | Giọng tiếng Việt | Giọng tiếng Anh | Cần gì trong `.env` |
|---|---|---|---|
| `vbee` (**khuyên dùng cho tiếng Việt**) | giọng trẻ em / nữ miền Bắc của Vbee | — (rơi về Web Speech) | `TTS_API_KEY`, `TTS_APP_ID`, `TTS_VOICE_VI` |
| `azure` | `vi-VN-HoaiMyNeural` — nữ miền Bắc | `en-US-AnaNeural` — giọng bé gái | `TTS_API_KEY`, `TTS_REGION` |
| `google` | `vi-VN-Neural2-A` | `en-US-Neural2-F` | `TTS_API_KEY` |
| `webspeech` *(mặc định)* | giọng cài trên máy | giọng cài trên máy | — |

Mã giọng khác nhau theo gói cước, nên với Vbee hãy chạy **`pnpm tts:voices`** (gọi `GET https://vbee.vn/api/public/v1/voices?language_code=vi-VN`) rồi chép mã vào `TTS_VOICE_VI`. Ghi đè giọng bằng `TTS_VOICE_VI` / `TTS_VOICE_EN`.

Link audio Vbee trả về **hết hạn sau ~3 phút**, nên trình nạp tải mp3 về ngay và không bao giờ lưu link vào DB.

**Sinh sẵn lúc nạp nội dung:** `pnpm content:import` đọc mọi `prompt.text` có `tts: true` và sinh
mp3 vào `FILE_ROOT/tts/<vi|en>/<hash>.mp3`, hash theo (văn bản + mã giọng + tốc độ). Lúc chạy, app
chỉ phát file có sẵn nên mỗi câu chỉ tốn phí **một lần** và con không phải chờ. Không có khoá →
bước sinh bị bỏ qua, `content:import` vẫn chạy trót lọt và nút Nghe rơi về Web Speech.

**Sinh dần, chạy lại được:** gói miễn phí thường chỉ vài nghìn ký tự mỗi ngày. Trình nạp chỉ sinh
những câu **chưa có** mp3; gặp báo hết hạn mức thì **dừng êm** (lô nạp vẫn thành công) và in số câu
còn thiếu. Chạy lại `pnpm content:import` hôm sau là sinh tiếp. `pnpm content:stats` hiện
"audio: x/y câu đã có mp3".

## 2. Clip thu sẵn (ưu tiên cao nhất)

Câu thoại cố định của mascot (chào, khen, động viên — `docs/06` §1.8b mục 5) có thể là bản thu
thật hoặc mp3 chất lượng cao, đặt vào:

```
content/art/audio/vi/<key>.mp3
content/art/audio/en/<key>.mp3
```

- `key`: chữ thường, số, dấu `-`, tối đa 60 ký tự. MP3 mono 24 kHz, 48 kbps; cắt lặng đầu/cuối.
- Trong code: `<SpeakButton text="Giỏi lắm!" clip="gioi-lam" />`.

Không thu âm giọng của con để đưa lên dịch vụ ngoài; không gửi tên đầy đủ hay ngày sinh của bé —
chỉ tên gọi ở nhà.
