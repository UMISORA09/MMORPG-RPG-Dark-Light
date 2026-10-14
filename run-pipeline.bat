@echo off
echo ========================================================
echo   2D SPRITE PIPELINE AUTOMATION RUNNER
echo ========================================================
echo.
echo [1/2] Generating dummy raw sprites (dummy_ai_generator.py)...
python tools\dummy_ai_generator.py
if errorlevel 1 (
    echo [ERROR] Failed to generate raw sprites!
    pause
    exit /b 1
)

echo.
echo [2/2] Slicing, normalizing and packing atlas (sprite_pipeline.py)...
python tools\sprite_pipeline.py
if errorlevel 1 (
    echo [ERROR] Pipeline processing failed!
    pause
    exit /b 1
)

echo.
echo ========================================================
echo  [SUCCESS] Atlas and Mapping JSON Generated!
echo  Output: assets\exported\atlas.png and mapping.json
echo ========================================================
echo.
pause
