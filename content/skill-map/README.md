# content/skill-map — bản đồ kỹ năng (nguồn seed bảng `Skill`)

Một file JSON cho mỗi môn: `viet.json`, `vmath.json`, `esl.json`, `enl.json`, `emath.json`, `esci.json` (mã môn theo `docs/05` §1 — Toán là `VMATH`). Kiểm định bằng `pnpm skills:validate`; nạp DB bằng `pnpm db:seed` (upsert theo `code`, không bao giờ xoá — kỹ năng bỏ khỏi file chỉ bị đánh dấu `isActive=false`).

## Định dạng

```jsonc
{
  "subject": "VIET",
  "strands": { "HV": "Học vần", "DOC": "Đọc" },        // nhãn tiếng Việt cho từng mạch (cây admin)
  "source": "…",
  "skills": [
    {
      "code": "VIET.HV.AM_U_UW",                      // <MÔN>.<MẠCH>.<TÊN>, duy nhất toàn hệ thống
      "strand": "HV",
      "nameVi": "Âm u, ư", "nameEn": "Letters u, ư",  // môn tiếng Anh: song ngữ
      "description": "… Ví dụ: … Lỗi thường gặp: …",  // bắt buộc có 2 cụm này (docs/05 §6)
      "standardRef": "CT2018.TV1.HV",
      "gradeLevel": "1",                              // K | 1 | 2
      "order": 25,
      "expectedWeek": 3,                              // 1–35, tuần dự kiến đạt
      "lessonRef": "KNTT-TV1-T1-B13",                 // hoặc mảng; phải là code LessonUnit có thật
      "prerequisites": ["VIET.HV.AM_H_L"],
      "relatedSkillCodes": ["EMATH.…"],               // cùng năng lực khác ngôn ngữ (hệ số 0.3)
      "confusableWith": ["VIET.HV.AM_OW"],            // cặp dễ nhầm (thang rèn bậc 5)
      "exerciseTypes": ["READ_ALOUD", "LISTEN_CHOOSE", "MCQ", "TRACE"],
      "difficultyRange": [1, 3]
    }
  ]
}
```

## Quy ước mã âm/vần tiếng Việt (telex, không dấu)

`ă=AW  â=AA  ê=EE  ô=OO  ơ=OW  ư=UW  đ=DD` — ví dụ `VAN_AN_AWN_AAN` (an ăn ân), `AM_U_UW` (u ư), `VAN_UOOI_UOOM` (uôi uôm), `VAN_UOWI_UOWU` (ươi ươu). Dấu thanh: `DAU_HUYEN`, `DAU_SAC`, `DAU_HOI`, `DAU_NGA`, `DAU_NANG`.

## Nguồn

- Học vần TV tập một: 83 bài theo `docs/09` §3 (mỗi bài không phải Ôn tập → một kỹ năng; dấu thanh tách riêng; bài 29 → `VIET.VIET.CHINH_TA_NGHE_VIET`).
- Toán: `docs/05` §3.6 + kỹ năng bổ sung `docs/09` §2, `lessonRef` = `KNTT-T1-B<n>`.
- Môn tiếng Anh: `docs/05` §3.1–3.4 (CCSS / NGSS lớp 1); `standardRef` `GS1.U<n>` của ESL là ước đoán unit Global Success 1, gắn lại khi có sách.
- Khung bài học (`LessonUnit`): `content/lessons/<mon>/*.units.json`.
