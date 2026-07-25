@echo off
REM Kill Metro Bundler Process (Port 8081)
REM This script finds and kills any process using port 8081

echo ========================================
echo Killing Metro Bundler (Port 8081)
echo ========================================
echo.

REM Find process using port 8081
echo Finding process on port 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081') do (
    echo Found process with PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    if errorlevel 1 (
        echo Failed to kill process %%a
    ) else (
        echo Successfully killed process %%a
    )
    goto :done
)

:done
echo.
echo You can now run: npm start
echo.
pause

