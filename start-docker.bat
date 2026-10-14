@echo off
chcp 65001 >nul
echo ========================================================
echo   🐳 KHỞI CHẠY GAME BẰNG DOCKER CONTAINER ĐỘC LẬP
echo ========================================================
echo.

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [CẢNH BÁO] Docker Engine chưa sẵn sàng hoặc WSL đang bị treo!
    echo.
    echo Bạn có 2 lựa chọn:
    echo  [1] Chạy file "fix-docker-wsl.bat" để tự động sửa lỗi WSL và khởi động lại Docker.
    echo  [2] Hoặc chạy ngay "start-server.bat" để chơi game ngay lập tức (không cần Docker)!
    echo.
    pause
    exit /b 1
)

echo Đang build và chạy container qua docker-compose...
docker compose up -d --build

echo.
echo Container đã được khởi chạy thành công!
echo Mở trình duyệt tại: http://localhost:8080
start "" "http://localhost:8080"
echo.
pause
