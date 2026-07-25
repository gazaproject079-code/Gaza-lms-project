@echo off
echo ========================================
echo  CLEARING ALL CACHES AND RESTARTING
echo ========================================
echo.

cd /d D:\skillsphere\AppAndroidSS\skillsphere_app\skillsphere_app\AppAndroidSS

echo [1/4] Stopping any running processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] Clearing Metro bundler cache...
call npx react-native start --reset-cache &
timeout /t 3 /nobreak >nul
taskkill /F /IM node.exe 2>nul

echo [3/4] Clearing watchman cache...
call watchman watch-del-all 2>nul

echo [4/4] Starting fresh Metro bundler...
start cmd /k "title Metro Bundler && npx react-native start --reset-cache"

echo.
echo ========================================
echo  Metro bundler started!
echo  Now run ONE of these in a NEW terminal:
echo.
echo  For Android:
echo    npx react-native run-android
echo.
echo  For Web:
echo    npm run web
echo ========================================
pause
