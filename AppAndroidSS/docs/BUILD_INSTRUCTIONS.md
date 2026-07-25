# Quick Build Instructions for Android APK

## Method 1: Quick Build (Recommended)

Run this single command:
```bash
npm run android:apk
```

This will:
1. Generate native Android folders
2. Build the release APK

**APK Location**: `android/app/build/outputs/apk/release/app-release.apk`

## Method 2: Step by Step

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Generate Native Folders
```bash
npm run prebuild
```
This creates the `android/` folder with all native code.

### Step 3: Build APK
```bash
cd android
./gradlew assembleRelease
```

**Windows users use:**
```bash
cd android
gradlew.bat assembleRelease
```

### Step 4: Find Your APK
The APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

## Prerequisites

Before building, make sure you have:

1. **Node.js** (v14+)
   ```bash
   node -v
   ```

2. **Java JDK** (11+)
   ```bash
   java -version
   ```

3. **Android Studio** installed with:
   - Android SDK Platform 33
   - Android SDK Build-Tools
   - Set ANDROID_HOME environment variable

## Setting ANDROID_HOME

### Windows
```cmd
set ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
```

Add to System Environment Variables permanently.

### Mac/Linux
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
```

Add to `~/.bashrc` or `~/.zshrc` to make permanent.

## Troubleshooting

### "gradlew: command not found"
- Make sure you're in the `android` folder
- Use `./gradlew` on Mac/Linux
- Use `gradlew.bat` on Windows

### "SDK location not found"
- Install Android Studio
- Set ANDROID_HOME environment variable
- Make sure Android SDK is installed

### Build Fails
Try cleaning and rebuilding:
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

## Alternative: Cloud Build (EAS)

If local build is too complex:

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login:
```bash
eas login
```

3. Build:
```bash
eas build --platform android --profile preview
```

This builds in the cloud and gives you a download link.

## Installing the APK

1. Transfer APK to your Android device
2. Enable "Install from Unknown Sources" in Settings
3. Open and install the APK

Or use ADB:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

