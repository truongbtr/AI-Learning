# Âm thanh thu sẵn (giọng thật)

Không nhà cung cấp TTS lớn nào có **giọng trẻ em tiếng Việt** thật. Với 40–60 câu thoại cố định của
mascot (chào, khen, động viên, tạm biệt… — `docs/06-THIET-KE-UI.md` §1.8 mục 5) cách tốt nhất là
**thu âm giọng thật** (một bé/người thân giọng miền Bắc) rồi đặt vào đây:

```
content/art/audio/vi/<key>.mp3      # ví dụ: chao-buoi-sang.mp3, gioi-lam.mp3, tam-biet.mp3
content/art/audio/en/<key>.mp3
```

- `key`: chữ thường, số, dấu `-`, tối đa 60 ký tự.
- Định dạng: MP3 mono 24 kHz, 48 kbps là đủ; cắt bỏ khoảng lặng đầu/cuối, chuẩn hoá âm lượng −16 LUFS.
- Trong code: `<SpeakButton text="Giỏi lắm!" clip="gioi-lam" />` → `/api/tts` trả clip này trước, không
  có clip mới dùng TTS neural (nếu cấu hình) rồi Web Speech.

Đề bài và câu có tên riêng (thay đổi theo bé) dùng TTS neural (`TTS_PROVIDER=azure|google`, giọng
`vi-VN-HoaiMyNeural` / `vi-VN-Neural2-A` — nữ miền Bắc, đã nâng cao độ +12% cho trẻ hơn) và được
cache mp3 dưới `FILE_ROOT/tts/`, nên mỗi câu chỉ tốn tiền một lần.

Không thu âm tên đầy đủ hay thông tin cá nhân của bé vào file — chỉ tên gọi ở nhà.
