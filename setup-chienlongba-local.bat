@echo off
title Cau hinh ten mien chienlongba.local
chcp 65001 >nul

:: Kiem tra quyen Administrator va tu dong yeu cau neu chua co
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Dang yeu cau quyen Administrator (UAC)...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c `\"%~f0`\"' -Verb RunAs"
    exit /b
)

echo ====================================================================
echo    CẤU HÌNH TÊN MIỀN NỘI BỘ: chienlongba.local - CHIẾN LONG BÁ
echo ====================================================================
echo.

set HOSTS_FILE=%SystemRoot%\System32\drivers\etc\hosts

findstr /I "chienlongba.local" "%HOSTS_FILE%" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] chienlongba.local da ton tai trong file hosts!
) else (
    echo [..] Dang them ban ghi chienlongba.local vao file hosts...
    echo. >> "%HOSTS_FILE%"
    echo # Domain noi bo cho Game 2.5D Chien Long Ba >> "%HOSTS_FILE%"
    echo 127.0.0.1 chienlongba.local >> "%HOSTS_FILE%"
    echo ::1 chienlongba.local >> "%HOSTS_FILE%"
    echo [OK] Da them 127.0.0.1 va ::1 chienlongba.local thanh cong!
)

echo.
echo [..] Dang xoa va lam moi bo nho dem DNS (ipconfig /flushdns)...
ipconfig /flushdns >nul

echo.
echo ====================================================================
echo  HOÀN TẤT THÀNH CÔNG!
echo  Bạn có thể mở game bằng đường dẫn:
echo  👉 http://chienlongba.local:3000
echo ====================================================================
echo.
pause
