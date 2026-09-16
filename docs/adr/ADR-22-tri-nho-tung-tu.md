# ADR-22 — Trí nhớ từng từ tiếng Anh (`WordProgress`) tách khỏi `SkillMastery`

**Ngày:** 16/09/2026 · **Pha:** 11 (Bến Cảng Từ) · **Trạng thái:** đã chốt

## Bối cảnh

Hai bé yếu từ mới tiếng Anh. 31 kỹ năng `ESL.VOC.*` hiện có **754 bài luyện**, trong đó **302 bài
(40%) là trắc nghiệm** — con đang *trả lời câu hỏi về từ* chứ không *chơi với từ*. Nặng hơn: hệ
thống không biết con thuộc **từ nào**. `SkillMastery` chỉ nói "ESL.VOC.FAMILY ≈ 0,62", không nói
được con nhớ `grandma` mà quên `uncle`.

Ba điều đã biết về trẻ lớp 1 học từ mới, và đều nói ngược lại cách làm cũ:

1. cần gặp lại **15–20 lần, giãn cách nhiều ngày** thì từ mới nằm lại; gặp 20 lần trong một tối thì
   không;
2. từ **nghe và nói** nhớ tốt hơn từ **nhìn chữ** — hai bé chưa đọc được tiếng Anh, nên tranh và
   giọng đọc mới là từ, còn chữ chỉ để quen mặt;
3. từ nằm trong **một cụm câu** nhớ tốt hơn từ đứng một mình.

## Quyết định

Thêm **một bảng dữ liệu học mới duy nhất** kể từ pha 10: `WordProgress` — trí nhớ của *từng bé* với
*từng từ*, theo lịch Leitner **1-3-7-14-30 ngày** (`packages/core/src/vocab/leitner.ts`, thuần và
có test).

- `Word` là **nội dung** (`content/lexicon/esl.json`, nạp bằng `content:import` theo ADR-9): chữ
  tiếng Anh, nghĩa Việt, tranh, một cụm câu mẫu, mp3 giọng `en-US-AnaNeural` sinh sẵn lúc nạp.
- `WordProgress` là **dữ liệu học của con**: `box` (0–5), `dueAt`, `seen`, `known`, `streak`,
  `lastGame`. Chỉ được ghi khi con thật sự chơi, qua `POST /api/kid/vocab`.

### Vì sao không nhét vào `SkillMastery`

- `SkillMastery` là BKT-lite trên **kỹ năng**, cập nhật theo bằng chứng có độ khó và trọng số
  (docs/04 §3). Trí nhớ một từ là **lịch nhắc lại**, không phải xác suất nắm kỹ năng: trộn hai thứ
  làm hỏng cả hai — mastery sẽ nhảy theo số lần lật thẻ, còn lịch ôn từ sẽ bị kéo theo độ khó bài.
- 262 từ × 2 bé = tối đa 524 dòng, nhỏ hơn `Evidence` vài bậc; không có lý do kỹ thuật để gộp.
- Tách ra thì **xoá được riêng**: nếu sau này bỏ trò chơi từ vựng, dữ liệu học cũ của con không hề
  hấn gì.

### Ranh giới

`WordProgress` nằm cùng nhóm với `Evidence`/`Attempt`/`Session`/`SkillMastery`/`User`:

- `ops/requests/` **không được** chạm (đã thêm vào `FORBIDDEN_TARGETS`, docs/14 §4);
- `ops:export` **chỉ đọc** — thêm `word-progress.csv` (chỉ nickname);
- trình nạp nội dung chỉ ghi `Word`, không bao giờ ghi `WordProgress`.

### Luật của thang Leitner

- nhận ra → lên một bậc, hẹn theo `BOX_DAYS = [0, 1, 3, 7, 14, 30]`;
- chưa nhận ra → **về bậc 1**, gặp lại ngày mai. Không có "sai", không trừ gì cả;
- **một tối chỉ lên một bậc**: gặp lại từ đó trong cùng buổi vẫn tính là luyện (`seen`), nhưng bậc
  chờ sang ngày mới — giãn cách là toàn bộ lý do bảng này tồn tại;
- từ bậc 4 trở lên coi là "thuộc rồi" (`KNOWN_BOX`), và mỗi từ như vậy kéo một chiếc thuyền vào Bến
  Cảng Từ trong thành phố ESL.

## Hệ quả

- Planner thay tối đa **2 trạm/tối** của kỹ năng `ESL.VOC.*` bằng trò chơi (`vocabStations`), chọn
  trò khác lần trước cho cùng kỹ năng.
- Trò chơi **không sinh `Attempt`/`Evidence`** — nên không đụng tới mastery, cũng không vào thang
  rèn 6 bậc. Sao vẫn được trả một lần mỗi trạm theo ADR-16.
- "Sổ từ" (`/kid/so-tu`) đọc từ bảng này: chỉ hiện từ con đã gặp, không điểm, không phần trăm,
  không so sánh hai bé.
- Nếu một từ rời khỏi `content/lexicon/esl.json`, `Word` chỉ bị tắt (`isActive=false`) — tiến độ
  của con giữ nguyên ý nghĩa.

## Đã cân nhắc rồi bỏ

- **Nhét box vào `Evidence.note`**: không truy vấn được "từ nào tới hẹn hôm nay" mà không quét cả
  bảng bằng chứng.
- **Không có bảng nào, tính lại từ `Attempt`**: trò chơi không sinh attempt; mà kể cả có, việc tính
  lại lịch Leitner mỗi tối từ lịch sử là công việc thừa cho một thứ vốn là một con số.
- **SM-2 / Anki thật**: quá mịn cho 262 từ và cho trẻ 6 tuổi; năm bậc là đủ và giải thích được cho
  ba mẹ trong một câu.
