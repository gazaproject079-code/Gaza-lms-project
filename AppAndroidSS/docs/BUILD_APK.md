# Building Android APK

This guide will help you build an APK file for Android.

## Prerequisites

1. **Node.js** (v14 or higher)
2. **Java JDK** (JDK 11 or higher)
3. **Android Studio** (for Android SDK)
4. **Android SDK** with:
   - Android SDK Platform 33
   - Android SDK Build-Tools
   - Android Emulator (optional)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Expo CLI (if not already installed)

```bash
npm install -g expo-cli
```

### 3. Generate Native Folders

Expo needs to generate the native Android and iOS folders:

```bash
npm run prebuild
```

This will create `android/` and `ios/` folders in your project.

### 4. Build APK

#### Option A: Build Release APK (Recommended)

```bash
npm run android:apk
```

This will:
1. Generate native folders
2. Build the release APK

The APK will be located at:
```
android/app/build/outputs/apk/release/app-release.apk
```

#### Option B: Build Debug APK (For Testing)

```bash
npm run android:build-debug
```

Debug APK location:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

#### Option C: Manual Build Steps

1. Generate native folders:
```bash
npm run prebuild
```

2. Navigate to Android folder:
```bash
cd android
```

3. Build the APK:
```bash
./gradlew assembleRelease
```

For Windows:
```bash
gradlew.bat assembleRelease
```

## Alternative: Using EAS Build (Cloud Build)

If you don't want to set up local build environment:

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure project:
```bash
eas build:configure
```

4. Build APK:
```bash
eas build --platform android --profile preview
```

This will build in the cloud and give you a download link.

## Troubleshooting

### Issue: "gradlew: command not found"

**Solution**: Make sure you're in the `android` folder and use:
- Linux/Mac: `./gradlew`
- Windows: `gradlew.bat`

### Issue: "SDK location not found"

**Solution**: Set ANDROID_HOME environment variable:
- Windows: Add to System Environment Variables
  ```
  ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
  ```
- Mac/Linux: Add to ~/.bashrc or ~/.zshrc
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/tools
  export PATH=$PATH:$ANDROID_HOME/tools/bin
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  ```

### Issue: "Java version error"

**Solution**: Make sure you have JDK 11 or higher:
```bash
java -version
```

If needed, install JDK 11+ and set JAVA_HOME.

### Issue: "Build failed"

**Solution**: 
1. Clean the build:
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

2. Or regenerate native folders:
```bash
npm run prebuild:clean
npm run android:apk
```

## Signing the APK (For Production)

For production releases, you need to sign your APK:

1. Generate a keystore:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. Create `android/keystore.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your-store-password
MYAPP_RELEASE_KEY_PASSWORD=your-key-password
```

3. Update `android/app/build.gradle` to use the keystore (Expo will handle this automatically if configured in app.json)

## Quick Build Commands Summary

```bash
# Generate native folders
npm run prebuild

# Build release APK
npm run android:apk

# Build debug APK (faster, for testing)
npm run android:build-debug

# Clean and rebuild
npm run prebuild:clean
npm run android:apk
```

## APK Location

After successful build, find your APK at:
- **Release**: `android/app/build/outputs/apk/release/app-release.apk`
- **Debug**: `android/app/build/outputs/apk/debug/app-debug.apk`

## Installing the APK

1. Transfer the APK to your Android device
2. Enable "Install from Unknown Sources" in device settings
3. Open the APK file and install

Or use ADB:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

