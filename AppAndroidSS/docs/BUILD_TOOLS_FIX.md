# Fix Missing Android SDK Build-Tools 30.0.3

## Problem
Error: "Failed to install the following SDK components: build-tools;30.0.3"

Some React Native dependencies require Build-Tools 30.0.3 even though we're using 33.0.0.

## Quick Fix

### Option 1: Run Setup Script (Recommended)

**PowerShell:**
```powershell
.\install-build-tools.ps1
```

**Command Prompt:**
```cmd
install-build-tools.bat
```

### Option 2: Install via Android Studio (Easiest)

1. **Open Android Studio**
2. **Go to**: Tools > SDK Manager
3. **Click**: SDK Tools tab
4. **Check**: 
   - ✅ Android SDK Build-Tools 30.0.3
   - ✅ Android SDK Build-Tools 33.0.0 (recommended)
5. **Click**: Apply
6. **Wait** for installation to complete

### Option 3: Install via Command Line

```powershell
# Navigate to SDK
cd $env:LOCALAPPDATA\Android\Sdk

# Install Build-Tools 30.0.3
.\cmdline-tools\latest\bin\sdkmanager.bat "build-tools;30.0.3"

# Also install 33.0.0 (recommended)
.\cmdline-tools\latest\bin\sdkmanager.bat "build-tools;33.0.0"
```

## Verify Installation

Check if build tools are installed:

```powershell
dir "$env:LOCALAPPDATA\Android\Sdk\build-tools"
```

You should see folders:
- `30.0.3`
- `33.0.0` (or latest)

## After Installation

1. **Clean the build:**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

2. **Try building again:**
   ```bash
   npm run android
   ```

## Why Both Versions?

- **30.0.3**: Required by some React Native dependencies
- **33.0.0**: Used by your app (configured in build.gradle)

Having both versions installed ensures compatibility with all dependencies.

## Troubleshooting

### "SDK Manager not found"
- Install Android SDK Command-line Tools via Android Studio
- Tools > SDK Manager > SDK Tools > Android SDK Command-line Tools (latest)

### "Permission denied"
- Run PowerShell/Command Prompt as Administrator
- Or use Android Studio GUI method

### "Still getting error after installation"
1. Close and reopen terminal
2. Clean build: `cd android && ./gradlew clean && cd ..`
3. Try building again

---

**After installing, run `npm run android` again!** 🚀

