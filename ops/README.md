# `ops/` — cửa chung của Claude Code và Claude chat

Xem `docs/14-DU-LIEU-VAN-HANH.md` cho toàn bộ lý do và hợp đồng. Tóm tắt để dùng ngay:

```
DB  ──(pnpm ops:export, 04:30 mỗi đêm + gọi tay)──▶  ops/state/…   ← ĐỌC
DB  ◀─(pnpm ops:apply, người duyệt)───────────────   ops/requests/… ← GHI
```

| Thư mục | Là gì |
|---|---|
| `state/SUMMARY.md` | **Đọc trước.** Một trang, tuần này thế nào, có gì hỏng không |
| `state/latest/` | Bản sao ngày mới nhất — 11 file CSV + `meta.json` |
| `state/<ngày>/` | Ảnh chụp từng ngày, giữ 90 ngày (không theo git) |
| `context/HIEN-TRANG.md` | **Phiên chat mới đọc file này đầu tiên** |
| `context/QUYET-DINH.md` | Quyết định đã chốt — đừng đề xuất lại |
| `requests/` | Muốn thay đổi gì thì đặt một file JSON vào đây |
| `applied/<ngày>/` | Đã áp, kèm **đường lùi** của từng thao tác |
| `rejected/` | Bị từ chối, kèm lý do |
| `CHANGELOG.md` | Một dòng mỗi lần áp |

## Đặt một yêu cầu

```json
{
  "schemaVersion": 1,
  "createdBy": "claude-chat",
  "createdAt": "2026-09-12T21:10:00+07:00",
  "reason": "Mai Thy sai nham_b_d 4 lần trong 9 ngày, thang rèn đang đứng ở bậc 2",
  "ops": [
    {
      "type": "planHint",
      "student": "thy",
      "focusSkills": ["VIET.HV.NHAM_LAN_B_D"],
      "validDays": 3,
      "note": "ưu tiên bài đối chiếu"
    }
  ]
}
```

Đặt tên `<ngày>-<số>-<việc>.json`, rồi:

```powershell
pnpm ops:apply --dry-run   # chỉ in diff
pnpm ops:apply             # in diff rồi hỏi y/N
```

Chín thao tác được phép: `planHint` · `retireExercise` · `reviveExercise` · `flagExercise` ·
`setSkillStatus` · `setSessionLength` (8–20, planner giữ trong 8–15) · `setPlannerWeight`
(**ôn không dưới 30%**) · `remapSkill` · `noteForParent`.

**Cấm tuyệt đối:** `Evidence`, `Attempt`, `Session`, `SkillMastery`, `User`, `.env`, xoá file. Yêu
cầu nào nhắc tới những thứ đó bị từ chối cả file — kể cả khi thao tác trông vô hại. Muốn sửa nhãn
của con thì ba mẹ dùng `PARENT_OVERRIDE` trên web, có ghi vết.
