# react-native-reanimated build.ninja Error - Complete Fix

## Problem

The error `ninja: error: manifest 'build.ninja' still dirty after 100 tries` occurs when:
- CMake repeatedly regenerates build files
- The build.ninja file gets locked or corrupted
- Multiple processes try to access the same build files simultaneously
- Windows file system locks prevent proper cleanup

## Solution

### Quick Fix (Recommended)

Run the fix script:

```powershell
.\scripts\fix-reanimated-ninja.ps1
```

Or on Windows CMD:

```cmd
.\scripts\fix-reanimated-ninja.bat
```

### Manual Fix Steps

If the script doesn't work, follow these steps:

#### Step 1: Stop All Processes

```powershell
# Stop Gradle
cd android
.\gradlew.bat --stop
cd ..

# Kill Java processes
taskkill /F /IM java.exe
```

#### Step 2: Remove react-native-reanimated Cache

```powershell
# Remove all build artifacts
Remove-Item -Path "node_modules\react-native-reanimated\android\.cxx" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules\react-native-reanimated\android\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules\react-native-reanimated\android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
```

#### Step 3: Clean Android Build

```powershell
cd android
.\gradlew.bat clean
cd ..
```

#### Step 4: Remove Android Build Directories

```powershell
Remove-Item -Path "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\build" -Recurse -Force -ErrorAction SilentlyContinue
```

#### Step 5: Reinstall react-native-reanimated

```powershell
npm uninstall react-native-reanimated
npm install react-native-reanimated@~3.3.0
```

#### Step 6: Rebuild

```powershell
npm start
# In another terminal:
npm run android
```

## Permanent Fix

The following settings have been added to `android/gradle.properties` to prevent this issue:

```properties
# Fix for react-native-reanimated build.ninja errors
android.enableParallelNativeBuild=false
android.enableIncrementalNativeBuilds=false
```

These settings:
- Disable parallel native builds to prevent CMake conflicts
- Disable incremental builds to ensure clean native compilation
- Prevent multiple processes from accessing build files simultaneously

## Why This Happens

1. **Windows File Locks**: Windows file system can lock files during build, preventing cleanup
2. **CMake Regeneration Loop**: CMake detects changes and regenerates, causing infinite loop
3. **Parallel Builds**: Multiple native modules building simultaneously cause conflicts
4. **Corrupted Cache**: Previous failed builds leave corrupted build.ninja files

## Prevention Tips

1. **Always stop Gradle before cleaning**:
   ```powershell
   cd android
   .\gradlew.bat --stop
   cd ..
   ```

2. **Clean before major changes**:
   ```powershell
   .\scripts\fix-reanimated-ninja.ps1
   ```

3. **Don't interrupt builds**: Let builds complete or properly stop them

4. **Use the fix script regularly**: If you see CMake re-running multiple times, run the fix script

## Troubleshooting

### Error persists after running script

1. **Close all terminals and IDEs** (VS Code, Android Studio)
2. **Restart your computer** (clears all file locks)
3. **Run the fix script again**
4. **Try building with verbose output**:
   ```powershell
   cd android
   .\gradlew.bat assembleDebug --stacktrace --info
   ```

### Build still fails

1. **Check CMake version**:
   ```powershell
   cmake --version
   ```
   Should be 3.22.1 or compatible

2. **Verify NDK installation**:
   - Open Android Studio → SDK Manager → SDK Tools
   - Ensure "NDK (Side by side)" is installed
   - Version should be 23.1.7779620

3. **Check disk space**: Ensure you have at least 5GB free space

4. **Antivirus interference**: Temporarily disable antivirus during build

## Related Files

- `scripts/fix-reanimated-ninja.ps1` - PowerShell fix script
- `scripts/fix-reanimated-ninja.bat` - Batch fix script
- `android/gradle.properties` - Contains permanent fix settings

## Additional Resources

- [react-native-reanimated GitHub Issues](https://github.com/software-mansion/react-native-reanimated/issues)
- [CMake Documentation](https://cmake.org/documentation/)
- [Gradle Native Build Documentation](https://docs.gradle.org/current/userguide/native_software.html)

