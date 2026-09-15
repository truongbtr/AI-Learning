<#
.SYNOPSIS
  Kéo bản sao lưu hằng đêm từ máy chủ Ubuntu (pha 9) về E:\SAO-LUU-MTCT qua LAN.

.DESCRIPTION
  Máy chủ thật giờ chạy trên Ubuntu (192.168.1.102), tự sao lưu mỗi đêm 1:00 giờ VN vào
  /opt/edison-learning/_sao-luu (docker/backup/backup-loop.sh). Script này chạy trên máy Windows
  cũ, kéo bản mới nhất về chỗ cũ (E:\SAO-LUU-MTCT) để chưa cần dựng NAS/SMB riêng — chủ dự án chọn
  cách này khi hỏi ở pha 9 (giữ tạm qua LAN).

  Đăng ký chạy tự động: scripts/register-backup-pull-task.ps1 (Task Scheduler, không cần quyền
  admin, chạy dưới tài khoản đang đăng nhập, 1:20 sáng — sau giờ Ubuntu backup 20 phút).

.PARAMETER RemoteHost
  Địa chỉ máy chủ Ubuntu.

.PARAMETER RemoteDir
  Thư mục sao lưu trên Ubuntu.

.PARAMETER LocalDir
  Thư mục sao lưu trên Windows (mặc định BACKUP_DIR trong .env, hoặc E:\SAO-LUU-MTCT).

.PARAMETER KeyFile
  Khoá SSH dùng để vào máy Ubuntu.
#>
[CmdletBinding()]
param(
  [string]$RemoteHost = '192.168.1.102',
  [string]$RemoteUser = 'truong',
  [string]$RemoteDir  = '/opt/edison-learning/_sao-luu',
  [string]$LocalDir   = 'E:\SAO-LUU-MTCT',
  [string]$KeyFile    = "$env:USERPROFILE\.ssh\medifa_deploy_ed25519"
)

$ErrorActionPreference = 'Stop'
$logDir = Join-Path (Split-Path -Parent $PSScriptRoot) 'docs\dien-tap'
New-Item -ItemType Directory -Force $logDir | Out-Null
$logFile = Join-Path $logDir 'pull-ubuntu-backup.log'

function Say([string]$text) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $text"
  Write-Host $line
  Add-Content -Path $logFile -Value $line -Encoding utf8
}

$remote = "$RemoteUser@$RemoteHost"
$sshOpts = @('-i', $KeyFile, '-o', 'StrictHostKeyChecking=accept-new', '-o', 'ConnectTimeout=10')

try {
  Say "kéo sao lưu từ $remote`:$RemoteDir về $LocalDir"

  New-Item -ItemType Directory -Force (Join-Path $LocalDir 'db') | Out-Null
  New-Item -ItemType Directory -Force (Join-Path $LocalDir 'files') | Out-Null

  # 1) latest.txt cho biết tên bản mới nhất
  $latestRemote = & ssh @sshOpts $remote "cat $RemoteDir/latest.txt 2>/dev/null"
  if ($LASTEXITCODE -ne 0 -or -not $latestRemote) { throw "không đọc được $RemoteDir/latest.txt trên $remote" }
  $dumpName = ($latestRemote -split "`n")[0].Trim()
  Say "bản mới nhất trên Ubuntu: $dumpName"

  # 2) chỉ chép nếu chưa có (dump không đổi tên/nội dung sau khi ghi)
  $localDump = Join-Path (Join-Path $LocalDir 'db') $dumpName
  if (Test-Path $localDump) {
    Say "đã có $dumpName ở máy này — bỏ qua bước chép .dump"
  } else {
    & scp @sshOpts "${remote}:$RemoteDir/db/$dumpName" $localDump
    if ($LASTEXITCODE -ne 0) { throw "scp .dump thất bại (mã $LASTEXITCODE)" }
    Say "đã chép $dumpName ($([math]::Round((Get-Item $localDump).Length / 1MB, 2)) MB)"
  }

  # 3) latest.txt — ghi đè để trỏ đúng bản Ubuntu mới nhất
  & scp @sshOpts "${remote}:$RemoteDir/latest.txt" (Join-Path $LocalDir 'latest.txt') | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "scp latest.txt thất bại (mã $LASTEXITCODE)" }

  # 4) ảnh bài vở + cache giọng đọc — chép kiểu cập nhật (thêm/mới thì chép, không xoá bên đích)
  & scp @sshOpts -r "${remote}:$RemoteDir/files/." (Join-Path $LocalDir 'files')
  if ($LASTEXITCODE -ne 0) { throw "scp files/ thất bại (mã $LASTEXITCODE)" }
  Say "đã đồng bộ files/"

  Say "KẾT QUẢ: ĐẠT"
}
catch {
  Say "KẾT QUẢ: HỎNG — $($_.Exception.Message)"
  throw
}
