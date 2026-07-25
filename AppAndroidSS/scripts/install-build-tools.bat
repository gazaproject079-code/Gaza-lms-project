@echo off
REM Batch script to install missing Android SDK Build-Tools
echo.
echo 🔧 Installing Android SDK Build-Tools 30.0.3...
echo.

set "SDK_PATH=%LOCALAPPDATA%\Android\Sdk"
set "SDK_MANAGER=%SDK_PATH%\cmdline-tools\latest\bin\sdkmanager.bat"

if not exist "%SDK_MANAGER%" (
    echo ❌ SDK Manager not found at: %SDK_MANAGER%
    echo.
    echo Please install Android SDK Command-line Tools:
    echo 1. Open Android Studio
    echo 2. Go to Tools ^> SDK Manager
    echo 3. SDK Tools tab ^> Check 'Android SDK Command-line Tools (latest)'
    echo 4. Click Apply
    pause
    exit /b 1
)

echo ✅ SDK Manager found
echo.

REM Install Build-Tools 30.0.3
echo Installing build-tools;30.0.3...
call "%SDK_MANAGER%" "build-tools;30.0.3"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Build-Tools 30.0.3 installed successfully!
) else (
    echo ⚠️  Installation may have issues. Please install manually via Android Studio.
    echo.
    echo 1. Open Android Studio
    echo 2. Go to Tools ^> SDK Manager
    echo 3. SDK Tools tab
    echo 4. Check 'Android SDK Build-Tools 30.0.3'
    echo 5. Click Apply
)

echo.
echo Also installing Build-Tools 33.0.0 (recommended)...
call "%SDK_MANAGER%" "build-tools;33.0.0"

echo.
echo 🎉 Setup complete! Try building again: npm run android
echo.
pause

