# Âm thanh cho góc của con

## 1. Giọng nhân bản của gia đình (bé trai + bé gái)

Hai bản thu trong thư mục `ai voice/` (không vào git — giọng thật của trẻ) được nhân bản một lần
trên ElevenLabs (Instant Voice Cloning, không cần "train" dài — 30–60 giây thu sạch là đủ):

```powershell
# .env: TTS_PROVIDER=elevenlabs, TTS_API_KEY=<khoá ElevenLabs>
pnpm tts:clone          # tạo 2 giọng, ghi TTS_VOICE_GIRL / TTS_VOICE_BOY vào .env
```

Sau đó mọi câu (lời chào, đề bài, câu có tên riêng) đều được đọc bằng giọng đó qua `/api/tts`,
cache mp3 dưới `FILE_ROOT/tts/` nên mỗi câu chỉ tốn phí một lần.

**Chọn giọng theo ngữ cảnh** (`lib/tts/voices.ts` → `personaFor`): màn hình của bé gái (avatar
`girl-*`, mascot Cú) dùng giọng bé gái; của bé trai (avatar `boy-*`, mascot Rô-bốt) dùng giọng bé trai.
Thiếu một giọng thì dùng giọng còn lại.

## 2. Clip thu sẵn (ưu tiên cao nhất)

Câu thoại cố định của mascot có thể là bản thu thật, đặt vào:

```
content/art/audio/vi/<key>.mp3            # dùng chung
content/art/audio/vi/girl/<key>.mp3       # riêng giọng bé gái
content/art/audio/vi/boy/<key>.mp3        # riêng giọng bé trai
```

- `key`: chữ thường, số, dấu `-`, tối đa 60 ký tự. MP3 mono 24 kHz, 48 kbps; cắt lặng đầu/cuối.
- Trong code: `<SpeakButton text="Giỏi lắm!" clip="gioi-lam" voice="boy" />`.

Không thu âm hay gửi tên đầy đủ, ngày sinh của bé — chỉ tên gọi ở nhà.
