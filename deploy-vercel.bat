@echo off
chcp 65001 >nul
echo ========================================================
echo   ▲ TRIỂN KHAI LÊN VERCEL LÀM MÁY CHỦ THỰC TẾ BETA
echo ========================================================
echo.
echo Đang kiểm tra và khởi động trình deploy Vercel...
echo.
npx -y vercel --prod
echo.
pause
