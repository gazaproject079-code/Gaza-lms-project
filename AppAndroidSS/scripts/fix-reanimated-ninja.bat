@echo off
REM Complete Fix for react-native-reanimated build.ninja Error
REM This script completely removes and rebuilds react-native-reanimated native code

echo ========================================
echo Fixing react-native-reanimated Build Error
echo ========================================
echo.

REM Step 1: Stop all Gradle processes
echo Step 1: Stopping all Gradle processes...
cd android
call gradlew.bat --stop >nul 2>&1
timeout /t 3 /nobreak >nul
cd ..

REM Kill Java processes
taskkill /F /IM java.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo   [OK] All Gradle processes stopped
echo.

REM Step 2: Remove react-native-reanimated build cache
echo Step 2: Removing react-native-reanimated build cache...
if exist "node_modules\react-native-reanimated\android\.cxx" (
    echo   Removing .cxx directory...
    rd /s /q "node_modules\react-native-reanimated\android\.cxx" 2>nul
    echo   [OK] Removed .cxx
)
if exist "node_modules\react-native-reanimated\android\build" (
    echo   Removing build directory...
    rd /s /q "node_modules\react-native-reanimated\android\build" 2>nul
    echo   [OK] Removed build
)
if exist "node_modules\react-native-reanimated\android\.gradle" (
    echo   Removing .gradle directory...
    rd /s /q "node_modules\react-native-reanimated\android\.gradle" 2>nul
    echo   [OK] Removed .gradle
)
echo.

REM Step 3: Clean Android build
echo Step 3: Cleaning Android build...
cd android
call gradlew.bat clean >nul 2>&1
cd ..
echo   [OK] Android build cleaned
echo.

REM Step 4: Remove Android build directories
echo Step 4: Removing Android build directories...
if exist "android\app\build" (
    rd /s /q "android\app\build" 2>nul
    echo   [OK] Removed app\build
)
if exist "android\build" (
    rd /s /q "android\build" 2>nul
    echo   [OK] Removed android\build
)
echo.

REM Step 5: Reinstall react-native-reanimated
echo Step 5: Reinstalling react-native-reanimated...
echo   This will ensure a clean native build
call npm uninstall react-native-reanimated >nul 2>&1
timeout /t 2 /nobreak >nul
call npm install react-native-reanimated@~3.3.0 >nul 2>&1
echo   [OK] react-native-reanimated reinstalled
echo.

echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start Metro: npm start
echo 2. Build app: npm run android
echo.
echo Note: The first build may take longer as it rebuilds native code.
echo.
pause

