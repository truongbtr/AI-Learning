<#
.SYNOPSIS
  Diễn tập khôi phục sao lưu trên một máy chủ Postgres TRẮNG (docs/08 pha 8 việc 2).

.DESCRIPTION
  Một script khôi phục chưa từng chạy là một script chưa tồn tại. Cái này dựng một container
  postgres:16 hoàn toàn mới — volume mới, không có gì bên trong, không nối tới database đang chạy —
  rồi khôi phục bản sao lưu vào đó và đếm lại từng bảng. Đó là đúng tình huống thật: ổ cứng hỏng,
  cài Docker trên máy khác, còn mỗi thư mục sao lưu.

  Xong thì nó tự xoá container và volume tạm. Database thật không bị đụng vào ở bất kỳ bước nào.

.PARAMETER BackupDir
  Thư mục sao lưu (mặc định: BACKUP_DIR trong .env).

.PARAMETER Dump
  Tên file .dump muốn thử (mặc định: bản mới nhất trong <BackupDir>/latest.txt).

.PARAMETER Keep
  Giữ lại container tạm sau khi chạy, để soi bằng tay.

.EXAMPLE
  pwsh scripts/restore-drill.ps1
  pwsh scripts/restore-drill.ps1 -Dump mtct-2026-09-12-0100.dump -Keep
#>
[CmdletBinding()]
param(
  [string]$BackupDir,
  [string]$Dump,
  [switch]$Keep
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $repo '.env'

function Get-EnvValue([string]$name, [string]$fallback) {
  if (Test-Path $envFile) {
    $line = Get-Content $envFile | Where-Object { $_ -match "^\s*$name=" } | Select-Object -First 1
    if ($line) { return ($line -replace "^\s*$name=", '').Trim() }
  }
  return $fallback
}

if (-not $BackupDir) { $BackupDir = Get-EnvValue 'BACKUP_DIR' (Join-Path $repo '_sao-luu') }
$pgUser = Get-EnvValue 'POSTGRES_USER' 'mtct'
$pgPass = Get-EnvValue 'POSTGRES_PASSWORD' 'mtct'
$pgDb   = Get-EnvValue 'POSTGRES_DB' 'mtct'

if (-not (Test-Path $BackupDir)) { throw "Không thấy thư mục sao lưu: $BackupDir" }
if (-not $Dump) {
  $latest = Join-Path $BackupDir 'latest.txt'
  if (Test-Path $latest) { $Dump = (Get-Content $latest | Select-Object -First 1).Trim() }
  else {
    $newest = Get-ChildItem (Join-Path $BackupDir 'db') -Filter 'mtct-*.dump' -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $newest) { throw "Không có bản sao lưu nào trong $BackupDir\db" }
    $Dump = $newest.Name
  }
}
$dumpPath = Join-Path (Join-Path $BackupDir 'db') $Dump
if (-not (Test-Path $dumpPath)) { throw "Không thấy $dumpPath" }

$stamp     = Get-Date -Format 'yyyyMMdd-HHmmss'
$container = "mtct-restore-drill-$stamp"
$volume    = "mtct-restore-drill-$stamp-data"
$logDir    = Join-Path $repo 'docs\dien-tap'
New-Item -ItemType Directory -Force $logDir | Out-Null
$logFile   = Join-Path $logDir "khoi-phuc-$stamp.md"
# Markdown, not .log: *.log is gitignored, and this file is the evidence that the rehearsal
# happened (docs/08 pha 8, tiêu chí 2). The fence keeps the transcript readable on GitHub.
$fence = '```'
Add-Content -Path $logFile -Encoding utf8 -Value @(
  "# Diễn tập khôi phục sao lưu — $stamp",
  '',
  '> Sinh tự động bởi `scripts/restore-drill.ps1`. Chạy lại là có bản mới.',
  '',
  $fence
)

function Say([string]$text) {
  $line = "[$(Get-Date -Format 'HH:mm:ss')] $text"
  Write-Host $line
  Add-Content -Path $logFile -Value $line -Encoding utf8
}

Say "DIỄN TẬP KHÔI PHỤC — máy chủ Postgres trắng, không đụng database đang chạy"
Say "bản sao lưu : $dumpPath ($([math]::Round((Get-Item $dumpPath).Length / 1MB, 2)) MB)"
Say "container   : $container (volume mới $volume)"

$ok = $false
try {
  Say "1/5 dựng container trắng…"
  docker volume create $volume | Out-Null
  docker run -d --name $container -v "${volume}:/var/lib/postgresql/data" `
    -e POSTGRES_USER=$pgUser -e POSTGRES_PASSWORD=$pgPass -e POSTGRES_DB=$pgDb `
    -e TZ=Asia/Ho_Chi_Minh postgres:16 | Out-Null

  Say "2/5 đợi Postgres sẵn sàng…"
  $ready = $false
  foreach ($i in 1..60) {
    Start-Sleep -Seconds 1
    docker exec $container pg_isready -U $pgUser -d $pgDb 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { $ready = $true; Say "    sẵn sàng sau ${i}s"; break }
  }
  if (-not $ready) { throw "Postgres không sẵn sàng sau 60 giây" }

  Say "3/5 chép bản sao lưu vào container…"
  docker cp $dumpPath "${container}:/tmp/restore.dump"

  Say "4/5 pg_restore vào database trắng…"
  $restore = docker exec -e PGPASSWORD=$pgPass $container `
    pg_restore -U $pgUser -d $pgDb --no-owner --exit-on-error /tmp/restore.dump 2>&1
  if ($LASTEXITCODE -ne 0) {
    $restore | ForEach-Object { Say "    $_" }
    throw "pg_restore thất bại (mã $LASTEXITCODE)"
  }
  Say "    pg_restore không báo lỗi nào"

  Say "5/5 đếm lại từng bảng trên bản vừa khôi phục:"
  $sql = @"
SELECT 'Skill', count(*) FROM "Skill"
UNION ALL SELECT 'SkillPrerequisite', count(*) FROM "SkillPrerequisite"
UNION ALL SELECT 'Exercise', count(*) FROM "Exercise"
UNION ALL SELECT 'LessonUnit', count(*) FROM "LessonUnit"
UNION ALL SELECT 'User', count(*) FROM "User"
UNION ALL SELECT 'Student', count(*) FROM "Student"
UNION ALL SELECT 'Session', count(*) FROM "Session"
UNION ALL SELECT 'Attempt', count(*) FROM "Attempt"
UNION ALL SELECT 'Evidence', count(*) FROM "Evidence"
UNION ALL SELECT 'SkillMastery', count(*) FROM "SkillMastery"
UNION ALL SELECT 'IntakeJob', count(*) FROM "IntakeJob"
UNION ALL SELECT 'SchoolWeek', count(*) FROM "SchoolWeek"
ORDER BY 1
"@
  $counts = docker exec -e PGPASSWORD=$pgPass $container psql -U $pgUser -d $pgDb -t -A -F' ' -c $sql
  $counts | Where-Object { $_ } | ForEach-Object { Say "    $_" }

  # Một bản khôi phục "thành công" mà ngân hàng bài rỗng thì không phải thành công.
  $skills = ($counts | Where-Object { $_ -match '^Skill ' }) -replace 'Skill ', ''
  $exercises = ($counts | Where-Object { $_ -match '^Exercise ' }) -replace 'Exercise ', ''
  if ([int]$skills -le 0 -or [int]$exercises -le 0) {
    throw "Khôi phục xong nhưng ngân hàng rỗng (Skill=$skills, Exercise=$exercises)"
  }

  # Và migration phải khớp, nếu không app sẽ tự chạy migrate lên trên dữ liệu khôi phục.
  $migrations = docker exec -e PGPASSWORD=$pgPass $container psql -U $pgUser -d $pgDb -t -A `
    -c 'SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL'
  Say "    _prisma_migrations $migrations"

  Say ""
  Say "KẾT QUẢ: ĐẠT — khôi phục được trên máy trắng, $skills kỹ năng và $exercises bài luyện trở về đủ."
  $ok = $true
}
catch {
  Say ""
  Say "KẾT QUẢ: HỎNG — $($_.Exception.Message)"
  throw
}
finally {
  if ($Keep) {
    Say "giữ lại container $container (xoá tay: docker rm -f $container; docker volume rm $volume)"
  } else {
    docker rm -f $container 2>&1 | Out-Null
    docker volume rm $volume 2>&1 | Out-Null
    Say "đã dọn container và volume tạm"
  }
  Add-Content -Path $logFile -Value $fence -Encoding utf8
  Write-Host "nhật ký: $logFile"
  if (-not $ok) { exit 1 }
}
