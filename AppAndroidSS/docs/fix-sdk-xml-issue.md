# Fix SDK XML Version Mismatch

## Problem
Error: "This version only understands SDK XML versions up to 3 but an SDK XML file of version 4 was encountered"

This happens when your Android SDK command-line tools are outdated compared to Android Studio.

## Solution Applied

### 1. Updated Android Gradle Plugin
- Changed from `7.4.2` to `8.0.2` (supports SDK XML v4)
- Updated Gradle wrapper to `8.0.2`

### 2. Added Configuration
- Added `android.disableAutomaticComponentCreation=true` to `gradle.properties`

## Manual Fix (If Still Having Issues)

### Option 1: Update SDK Command-Line Tools via Android Studio

1. Open Android Studio
2. Go to **Tools > SDK Manager**
3. Click on **SDK Tools** tab
4. Check **Android SDK Command-line Tools (latest)**
5. Click **Apply** to install/update
6. Click **OK**

### Option 2: Update via Command Line

```powershell
# Navigate to SDK location
cd $env:LOCALAPPDATA\Android\Sdk

# Update command-line tools
.\cmdline-tools\latest\bin\sdkmanager --update
.\cmdline-tools\latest\bin\sdkmanager "cmdline-tools;latest"
```

### Option 3: Reinstall Command-Line Tools

1. Open Android Studio
2. Go to **Tools > SDK Manager**
3. **SDK Tools** tab
4. Uncheck **Android SDK Command-line Tools**
5. Click **Apply** (removes old version)
6. Check **Android SDK Command-line Tools (latest)**
7. Click **Apply** (installs new version)

## Verify Fix

After updating, try building again:

```bash
cd android
./gradlew clean
cd ..
npm run android
```

## If Error Persists

1. **Check SDK Tools Version:**
   ```powershell
   dir "$env:LOCALAPPDATA\Android\Sdk\cmdline-tools"
   ```
   Should show a `latest` folder

2. **Verify Android Studio Version:**
   - Open Android Studio
   - Help > About
   - Should be Android Studio Hedgehog or newer

3. **Clean Everything:**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew --stop
   cd ..
   rm -rf node_modules/.cache
   npm start -- --reset-cache
   ```

## Alternative: Downgrade SDK (Not Recommended)

If you can't update, you can downgrade the SDK platform tools, but this is not recommended:

```powershell
cd $env:LOCALAPPDATA\Android\Sdk
.\cmdline-tools\latest\bin\sdkmanager "platform-tools;33.0.3"
```

But it's better to update everything to the latest versions.

