# fix-docker-wsl.ps1
# Requires Administrator privileges to restart WSL services

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[INFO] Dang yeu cau quyen Administrator de reset dich vu WSL..." -ForegroundColor Yellow
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  REPAIR DOCKER DESKTOP - WSL UNRESPONSIVE" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Cuong che dong cac tien trinh treo (Docker, WSL, vmmem)..." -ForegroundColor Yellow
Get-Process -Name "Docker Desktop", "com.docker.backend", "com.docker.build", "com.docker.diagnose", "docker", "wsl", "wslhost", "vmmemWSL", "vmmem" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "[2/4] Khoi dong lai dich vu he thong Windows (WSLService & LxssManager)..." -ForegroundColor Yellow
try {
    Restart-Service -Name "WSLService" -Force -ErrorAction SilentlyContinue
    Restart-Service -Name "LxssManager" -Force -ErrorAction SilentlyContinue
} catch {
    Write-Host "   Khong the restart truc tiep service, thu dung net stop/start..." -ForegroundColor Gray
    cmd.exe /c "net stop WSLService /y & net start WSLService" 2>$null
    cmd.exe /c "net stop LxssManager /y & net start LxssManager" 2>$null
}

Start-Sleep -Seconds 2

Write-Host "[3/4] Kiem tra trang thai dich vu WSL..." -ForegroundColor Yellow
Get-Service -Name "WSLService" -ErrorAction SilentlyContinue | Select-Object Status, DisplayName | Format-Table -AutoSize

Write-Host "[4/4] Khoi dong lai Docker Desktop..." -ForegroundColor Yellow
$dockerPath = "$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe"
if (Test-Path $dockerPath) {
    Start-Process $dockerPath
} elseif (Test-Path "C:\Program Files\Docker\Docker\Docker Desktop.exe") {
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host " [THANH CONG] Da giai phong hoan toan WSL va Docker Desktop!" -ForegroundColor Green
Write-Host " Hay doi khoang 15-30 giay de Docker Engine san sang." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Nhan phim bat ky de dong cua so nay..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
