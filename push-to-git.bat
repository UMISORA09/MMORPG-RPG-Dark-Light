@echo off
chcp 65001 >nul
title ĐẨY REPO LÊN GIT (MAIN SHOWCASE + MASTER SOURCE CODE)
cls

echo =========================================================================
echo    🐉 CHIẾN LONG BÍ SỬ — TỰ ĐỘNG ĐẨY MÃ NGUỒN LÊN GIT REMOTE 🐉
echo =========================================================================
echo.
echo Cấu trúc Repository đã được chuẩn bị:
echo   - Nhánh [main]   : Trang bìa sinh động (Landing Showcase), KHÔNG CHỨA CODE
echo   - Nhánh [master] : Toàn bộ mã nguồn game (Full Source Code để phát triển)
echo.
echo =========================================================================
echo.

set /p REPO_URL="Nhập đường link Git Remote Repository (vd: https://github.com/user/game.git): "

if "%REPO_URL%"=="" (
    echo [LỖI] Bạn chưa nhập link Git Repository. Thoát...
    pause
    exit /b 1
)

echo.
echo [1/4] Cập nhật Git Remote origin...
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo.
echo [2/4] Đang đẩy nhánh [main] (Trang bìa rỗng code sinh động)...
git checkout main >nul 2>&1
git push -u origin main --force

echo.
echo [3/4] Đang đẩy nhánh [master] (Toàn bộ mã nguồn phát triển)...
git checkout master >nul 2>&1
git push -u origin master --force

echo.
echo [4/4] Đặt nhánh mặc định về lại master để tiếp tục code...
git checkout master >nul 2>&1

echo.
echo =========================================================================
echo    🎉 CHÚC MỪNG: REPO ĐÃ ĐƯỢC TẠO VÀ ĐẨY LÊN THÀNH CÔNG!
echo =========================================================================
echo - Xem trang bìa sinh động tại link repo GitHub (nhánh mặc định main).
echo - Bạn đang ở nhánh [master] để bắt đầu lập trình và phát triển!
echo.
pause
