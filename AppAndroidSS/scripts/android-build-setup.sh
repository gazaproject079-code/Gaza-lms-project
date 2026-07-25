#!/bin/bash

# Android Build Setup Script for SkillSphere App
# This script helps set up the environment for building Android APK

echo "🚀 SkillSphere Android Build Setup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node -v)"

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install JDK 11 or higher."
    exit 1
fi

echo "✅ Java found: $(java -version 2>&1 | head -n 1)"

# Check Android SDK
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  ANDROID_HOME is not set."
    echo "   Please set it to your Android SDK path."
    echo "   Example: export ANDROID_HOME=\$HOME/Library/Android/sdk"
    exit 1
fi

echo "✅ ANDROID_HOME: $ANDROID_HOME"

# Install dependencies
echo ""
echo "📦 Installing npm dependencies..."
npm install

# Generate native folders
echo ""
echo "🔨 Generating native Android folders..."
npx expo prebuild --platform android

# Build APK
echo ""
echo "🏗️  Building release APK..."
cd android
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo "📱 APK location: android/app/build/outputs/apk/release/app-release.apk"
else
    echo ""
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi

