# Eval — đọc ảnh bài vở, phiên bản `intake-v1`

- **Ngày:** 12/09/2026 (pha 4 việc 6)
- **Chạy lại:** `pnpm eval:intake` · dữ liệu nhãn: `docs/eval/intake-v1/cases.json`
- **Mục tiêu của `docs/04` §9:** đúng/sai ≥ 85%, gắn kỹ năng top-1 ≥ 80%
- **Trạng thái:** **đo được một nửa.** Phần "đúng/sai" cần **20 ảnh mẫu chủ dự án chụp** (§5)

---

## 1. Đo cái gì, và vì sao đo cái đó

Pipeline đọc ảnh có ba chỗ có thể sai, mỗi chỗ hỏng theo một kiểu khác nhau với gia đình:

| Đo | Hỏng thì sao |
|---|---|
| **Gắn kỹ năng** — câu này thuộc kỹ năng nào | Bằng chứng vào nhầm ô: con giỏi phần A mà bảng năng lực nói con yếu phần B, planner rèn nhầm suốt tuần |
| **`BLANK` ≠ sai** — ô trống là *chưa làm* hay *chưa biết làm* | Nguy hiểm nhất. Một phiếu làm dở bị đọc thành một phiếu sai bét sẽ nói với ba mẹ rằng con học kém ngay buổi tối đầu tiên |
| **Đúng/sai** — con làm đúng câu này chưa | Mastery lệch, nhưng ba mẹ nhìn thấy và sửa được ở màn duyệt P6 |

Thứ tự nguy hiểm đó quyết định thứ tự ưu tiên: quy tắc `BLANK` được viết thành **hàm thuần có test riêng**
(`inferBlankReasons`, `packages/db/src/intake/review.ts`), chứ không để người đọc ảnh tự quyết.

Một lưu ý về cách đọc con số "gắn kỹ năng": hệ thống **không tự gắn kỹ năng**. `inbox:pull` đưa cho
người đọc một danh sách ứng viên (`skillCandidates` từ full-text `searchSkills`, cộng
`currentSkills` = kỹ năng của bài lớp học 3 ngày gần nhất), người đọc **chọn trong danh sách đó**, và
ba mẹ sửa lần cuối ở P6. Vì vậy con số quan trọng nhất không phải top-1 mà là **"kỹ năng đúng có nằm
trong ngữ cảnh đưa cho người đọc không"** — cái không có trong danh sách thì không ai chọn được.

## 2. Kết quả hôm nay (9 ca có nhãn)

```
gắn kỹ năng: top-1 33,3% · top-5 66,7% · có trong ngữ cảnh 77,8%   (mục tiêu top-1 ≥ 80%)
đúng/sai:    chưa đo — cần 20 ảnh mẫu
quy tắc BLANK trên phiếu docs/11 §9: ĐÚNG
```

| Ca (nguồn: `docs/11` §9 và §1) | top-1 | trong ngữ cảnh | Ghi chú |
|---|---|---|---|
| Ex1 *Look and circle* (từ vựng gia đình) | ✗ | ✓ | top-1 ra `ESL.VOC.ANIMALS_PETS` vì phiếu có chữ "pets" |
| Ex2 *unscramble* đã làm (old, young) | ✓ | ✓ | |
| Ex2 *unscramble* bỏ trống (tall…smart) | ✓ | ✓ | |
| Ex3 *Circle to choose* (have/has, to be) | ✗ | ✓ | top-1 ra `ESL.GR.AM_IS_ARE`, đúng ý nhưng khác mã với `ESL.GR.IS_ARE` |
| Ex4 *Read and match* | ✗ | **✗** | `ENL.RL.KEY_DETAILS` không hiện ở đâu cả |
| *Draw and write* | ✗ | **✗** | `ENL.W.SENTENCE` không hiện ở đâu cả |
| Vở Tiếng Việt bài 13 (u, ư) | ✗ | ✓ | search trả về các vần `uân/uôc/ươi`; đúng mã `VIET.HV.AM_U_UW` đến từ **nhật ký lớp**, không từ search |
| Toán: các số 6–10 | ✓ | ✓ | |
| Màn hình Kids A-Z mức D | ✗ | ✓ | top-1 ra `FLUENCY_LEVEL_A`; mức D có trong top-5 |

### Đọc kết quả này

1. **Full-text search một mình không đủ để gắn kỹ năng** (33% top-1). Nó tốt khi đề bài nói thẳng
   nội dung ("các số 6–10", "unscramble tính từ"), và kém khi đề bài là *mệnh lệnh* chứ không phải
   *nội dung* ("Read and match", "Draw and write") hoặc khi chữ trong đề trùng từ vựng của kỹ năng
   khác ("pets" trong bài về gia đình).
2. **Nhật ký lớp cứu phần lớn các ca đó.** Ca Tiếng Việt bài 13 là ví dụ rõ nhất: search trượt hoàn
   toàn, nhưng vì tối hôm đó ba mẹ đã dán nhật ký, `currentSkills` có sẵn `VIET.HV.AM_U_UW`. Đây là
   lý do thực dụng để giữ thói quen dán nhật ký mỗi tối (`docs/07` §5) — nó không chỉ lái Daily
   Quest, nó còn làm việc đọc ảnh chính xác hơn.
3. **Hai lỗ thật:** kỹ năng đọc hiểu (`ENL.RL.*`) và viết câu (`ENL.W.*`) không được đề xuất ở đâu
   cả. Đề nghị cho lần sau (pha 5 hoặc 6): khi `docType = WORKSHEET` và môn là ENL, thêm vào ngữ
   cảnh toàn bộ kỹ năng của **mạch** tương ứng, không chỉ kết quả tìm kiếm.
4. **`BLANK` đúng như tài liệu đòi hỏi** trên đúng cái phiếu mà tài liệu lấy làm ví dụ: 2 câu đầu
   làm được, 4 câu cuối bỏ trống liên tiếp → cả 4 là `NOT_FINISHED` ("con chưa làm xong"), không câu
   nào bị tính là sai. Ba mẹ đổi sang "chưa biết làm" bằng một chạm.

## 3. Quy tắc `BLANK` được kiểm ở ba chỗ

| Chỗ | Kiểm gì |
|---|---|
| `packages/core` + `packages/db` (test đơn vị) | `inferBlankReasons`: trống cuối bài → `NOT_FINISHED`; trống giữa các câu đã làm → `DOES_NOT_KNOW`; trống cả bài (chưa làm gì) → `DOES_NOT_KNOW` |
| `pnpm eval:intake` | chạy lại quy tắc trên đúng phiếu của `docs/11` §9 |
| `e2e/phase4-acceptance.spec.ts` | nạp phiếu thật qua hàng chờ, mở P6: không dòng nào bị gắn nhãn sai, 4 ô trống hiện "con chưa làm xong", đổi nhãn một chạm rồi duyệt |

Trọng số khi thành bằng chứng (`docs/07` §2.2): `NOT_FINISHED` × 0,3 (`OBSERVED`, ghi chú "chưa làm
xong") · `DOES_NOT_KNOW` × 0,6 (`INCORRECT` nhẹ, score 0). Không bao giờ là một bằng chứng sai đầy đủ.

## 4. Pipeline đo được (không cần ảnh thật)

Từ `e2e/phase4-acceptance.spec.ts`, chạy thật trên máy này:

| Đoạn | Số đo |
|---|---|
| 5 ảnh vở → nạp → tiền xử lý → `context.json` sẵn sàng để đọc | **12 giây** (tiêu chí: ≤ 90 giây) |
| Tiền xử lý 5 ảnh bằng sharp (xoay, 2000px, tăng tương phản, nén) | **450 ms** |
| Ảnh trùng (cùng một trang chụp lại) | phát hiện **5/5** bằng dHash |
| `context.json` | 5 ảnh chép kèm, 44 mã lỗi, 8 ứng viên kỹ năng, 12 kỹ năng "lớp đang học", **chỉ có tên gọi ở nhà** |

## 5. 20 ảnh mẫu cần chủ dự án chụp

Chép vào `intake-inbox/<tên gọi ở nhà>/<ngày>/`, ví dụ `intake-inbox/thy/2026-09-12/01.jpg`. Chụp
thẳng, đủ sáng, **mỗi trang một ảnh** (trừ hai ảnh số 19–20 cố ý chụp sai để thử).

| # | Chụp cái gì | Để đo điều gì |
|---|---|---|
| 1–3 | **Vở Tiếng Việt** 3 trang con đã làm, có chữ cô sửa/chấm | đọc chữ viết tay tiếng Việt của trẻ lớp 1, nhận dấu ✓/✗ của cô |
| 4–5 | **Vở Toán** 2 trang (phép cộng trong 10, viết số) | đọc chữ số viết tay, nhận phép tính |
| 6–8 | **Phiếu ESL** 3 phiếu, trong đó **ít nhất 1 phiếu làm dở** | `BLANK` ≠ sai — quan trọng nhất |
| 9–10 | **Bài kiểm tra** có điểm và nhận xét của cô | `docType=TEST`, đọc điểm và nhận xét |
| 11 | **Nhận xét/sổ liên lạc** của cô (chỉ chữ, không có bài) | `docType=TEACHER_NOTE` |
| 12–13 | **Ảnh màn hình Kids A-Z / Raz-Kids**: trang cấp độ hiện tại và trang sách đã đọc | `raz_level`, `books_read` → `ENL.RF.FLUENCY_LEVEL_*` |
| 14 | **Ảnh màn hình NAVIO** (unit, sao, %) | `NAVIO_REPORT` |
| 15 | **Ảnh màn hình nhật ký lớp Edi Parent** | đường ảnh của `CLASS_DIARY` (đường dán văn bản đã chạy) |
| 16 | **Vở mở hai trang** chụp ngang một lần | tách ảnh hai trang |
| 17 | **Cùng một trang** đã chụp ở ảnh 1, chụp lại lần hai | cảnh báo trùng (pHash) |
| 18 | Một trang của **Chí Thanh** (để phân biệt hai bé) | đọc tên trên nhãn vở |
| 19 | Một ảnh **hơi nghiêng và thiếu sáng** | tiền xử lý xoay + tăng tương phản |
| 20 | Một ảnh **không phải bài học** (ví dụ trang bìa) | phải ra `OTHER` và nêu lý do, không bịa ra câu hỏi |

Chụp xong, nói một câu là tôi chạy: đọc 20 ảnh, ghi nhãn thật vào `docs/eval/intake-v1/cases.json`,
chạy `pnpm eval:intake` và cập nhật mục 2 của tài liệu này bằng số đo đầy đủ.

> Ảnh bài vở **không vào git** (`.gitignore` có `intake-inbox/`): chúng có chữ viết tay và tên của
> con. Chúng nằm trên máy nhà và trong `FILE_ROOT`, đúng như ảnh chụp qua app.

## 6. Cách thêm ca vào bộ nhãn

Mỗi ca trong `docs/eval/intake-v1/cases.json`:

```jsonc
{
  "id": "vo-tv-2026-09-12-01",
  "source": "intake-inbox/thy/2026-09-12/01.jpg",
  "docType": "WORKBOOK",
  "subject": "VIET",
  "questionText": "đề bài như trên giấy",
  "truth":  { "outcome": "CORRECT", "skillCodes": ["VIET.HV.AM_U_UW"] },
  "read":   { "outcome": "CORRECT", "skillCodes": ["VIET.HV.AM_U_UW"] }  // người/máy đọc ra gì
}
```

`truth` là nhãn người ghi (nguồn sự thật), `read` là kết quả đọc. Ca nào chưa có `read` thì tính là
**"chưa đo"**, không bao giờ tính là đạt.
