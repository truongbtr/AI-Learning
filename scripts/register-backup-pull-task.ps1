<#
.SYNOPSIS
  Đăng ký Task Scheduler chạy scripts/pull-ubuntu-backup.ps1 mỗi đêm 1:20 (sau giờ Ubuntu backup
  1:00 giờ VN, docs/08 pha 9 §3). Không cần quyền admin — chạy dưới tài khoản đang đăng nhập.

.EXAMPLE
  pwsh scripts/register-backup-pull-task.ps1
#>
[CmdletBinding()]
param(
  [string]$TaskName = 'MTCT-PullUbuntuBackup',
  [string]$At = '01:20am'
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$script = Join-Path $repo 'scripts\pull-ubuntu-backup.ps1'

$action = New-ScheduledTaskAction -Execute 'pwsh.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`""
$trigger = New-ScheduledTaskTrigger -Daily -At $At

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
  -Description 'Kéo sao lưu hằng đêm từ máy chủ Ubuntu (pha 9) về E:\SAO-LUU-MTCT qua LAN.' | Out-Null

Write-Host "Đã đăng ký '$TaskName' chạy lúc $At mỗi ngày."
Write-Host "Chạy thử ngay: Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "Xem log: docs\dien-tap\pull-ubuntu-backup.log"
