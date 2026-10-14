@echo off
rem Check Administrator privileges
net session >nul 2>&1
if errorlevel 1 (
    echo [INFO] Requesting Administrator privileges to restart WSL...
    powershell -NoProfile -Command "Start-Process cmd.exe -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo ========================================================
echo   REPAIR DOCKER DESKTOP - WSL UNRESPONSIVE
echo ========================================================
echo.

echo [1/4] Terminating hung Docker, WSL and vmmem processes...
taskkill /F /IM "Docker Desktop.exe" >nul 2>&1
taskkill /F /IM "com.docker.backend.exe" >nul 2>&1
taskkill /F /IM "com.docker.build.exe" >nul 2>&1
taskkill /F /IM "com.docker.diagnose.exe" >nul 2>&1
taskkill /F /IM "docker.exe" >nul 2>&1
taskkill /F /IM "wsl.exe" >nul 2>&1
taskkill /F /IM "wslhost.exe" >nul 2>&1
taskkill /F /IM "vmmemWSL.exe" >nul 2>&1
taskkill /F /IM "vmmem.exe" >nul 2>&1

echo [2/4] Restarting Windows WSL services directly...
net stop WSLService /y >nul 2>&1
net stop LxssManager /y >nul 2>&1
timeout /t 2 /nobreak >nul
net start LxssManager >nul 2>&1
net start WSLService >nul 2>&1

echo [3/4] Checking WSL service status...
powershell -NoProfile -Command "Get-Service -Name WSLService -ErrorAction SilentlyContinue | Select-Object Status, DisplayName"

echo [4/4] Launching Docker Desktop...
if exist "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe" (
    start "" "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe"
) else (
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    )
)

echo.
echo ========================================================
echo  [SUCCESS] WSL reset complete! Docker Desktop is starting.
echo  Please wait 15-30 seconds for Docker Engine to be ready.
echo ========================================================
echo.
pause
