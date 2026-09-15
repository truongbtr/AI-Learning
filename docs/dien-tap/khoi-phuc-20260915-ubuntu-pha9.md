# Diễn tập khôi phục sao lưu — máy chủ Ubuntu (pha 9), 20260915

> Ghi tay theo đúng định dạng `scripts/restore-drill.ps1`, nhưng chạy trên máy chủ Ubuntu thật
> (192.168.1.102) bằng `docker/backup/restore.sh` sẵn có — khôi phục vào database tạm
> `mtct_restore`, không đụng database `mtct` đang chạy thật.

```
[09:52] DIỄN TẬP KHÔI PHỤC — máy chủ Ubuntu (pha 9), không đụng database "mtct" đang chạy
[09:52] bản sao lưu : /opt/edison-learning/_sao-luu/db/mtct-2026-09-15-0948.dump (2.6 MB)
[09:52] đích        : mtct_restore trên postgres (mtct-postgres-1)
[09:52] DROP DATABASE IF EXISTS mtct_restore — không có gì để xoá (lần đầu)
[09:52] CREATE DATABASE mtct_restore
[09:52] pg_restore — không báo lỗi nào
[09:52] đếm lại từng bảng trên bản vừa khôi phục:
[09:52]     Evidence 19
[09:52]     Exercise 10759
[09:52]     Session 4
[09:52]     Skill 376
[09:52]     SkillMastery 18
[09:52]     Student 2
[09:52]     User 4
[09:52] KẾT QUẢ: ĐẠT — khôi phục được trên máy Ubuntu, đúng số dòng ghi trong bảng đối chiếu pha 9
[09:52] (khớp với TIEN-DO.md pha 9: Student 2, User 4, Session 4, Evidence 19, SkillMastery 18)
[09:53] dọn: DROP DATABASE mtct_restore WITH (FORCE) — xong, database thật "mtct" không bị đụng
```

Lệnh đã chạy (nguyên văn, trên `truong@192.168.1.102`):

```bash
cd /opt/edison-learning
docker compose --env-file .env -f docker/compose.yml run --rm \
  --entrypoint /backup/restore.sh backup mtct-2026-09-15-0948.dump
# … đếm khớp, rồi dọn:
docker compose --env-file .env -f docker/compose.yml exec -T postgres \
  psql -U mtct -d postgres -c 'DROP DATABASE IF EXISTS mtct_restore WITH (FORCE);'
```

Việc kế tiếp: dựng `scripts/restore-drill.sh` (bản Bash tương đương `restore-drill.ps1`) để lần diễn
tập hằng quý tiếp theo trên Ubuntu tự sinh log như thế này mà không cần gõ tay từng lệnh.
