@echo off
echo Building and minifying project...
echo.

call npm run build:all

if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo ✅ Build complete! Minified files are in dist/ folder
echo.
pause