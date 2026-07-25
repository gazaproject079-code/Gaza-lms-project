@echo off
REM Android Build Setup Script for SkillSphere App (Windows)
REM This script helps set up the environment for building Android APK

echo.
echo 🚀 SkillSphere Android Build Setup
echo ====================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

echo ✅ Node.js found
node -v

REM Check if Java is installed
where java >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Java is not installed. Please install JDK 11 or higher.
    exit /b 1
)

echo ✅ Java found
java -version

REM Check Android SDK
if "%ANDROID_HOME%"=="" (
    echo ⚠️  ANDROID_HOME is not set.
    echo    Please set it to your Android SDK path.
    echo    Example: set ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
    exit /b 1
)

echo ✅ ANDROID_HOME: %ANDROID_HOME%

REM Install dependencies
echo.
echo 📦 Installing npm dependencies...
call npm install

REM Generate native folders
echo.
echo 🔨 Generating native Android folders...
call npx expo prebuild --platform android

REM Build APK
echo.
echo 🏗️  Building release APK...
cd android
call gradlew.bat assembleRelease

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Build successful!
    echo 📱 APK location: android\app\build\outputs\apk\release\app-release.apk
) else (
    echo.
    echo ❌ Build failed. Please check the error messages above.
    exit /b 1
)

cd ..

