@echo off
chcp 65001 >nul
echo ========================================================
echo   🧪 CHẠY KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN (E2E TEST)
echo ========================================================
echo.
node test-e2e.mjs
echo.
pause
