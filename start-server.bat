@echo off
chcp 65001 >nul
echo ========================================================
echo   🎮 KHỞI ĐỘNG MÁY CHỦ GAME 2.5D ACTION MMORPG
echo ========================================================
echo.
echo [1/3] Đang kiểm tra môi trường Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Không tìm thấy Node.js! Vui lòng cài đặt Node.js từ https://nodejs.org
    pause
    exit /b 1
)

echo [2/3] Đang mở trình duyệt vào game: http://localhost:3000
start "" "http://localhost:3000"

echo [3/3] Đang khởi chạy máy chủ kết hợp (API + 3D Web Client)...
echo Cổng máy chủ: http://localhost:3000 (hoặc http://chienlongba.local:3000)
echo Nhấn Ctrl+C để dừng máy chủ bất cứ lúc nào.
echo.

set PORT=3000
node artifacts/api-server/dist/index.mjs
pause

