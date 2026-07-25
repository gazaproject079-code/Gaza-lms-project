# Java 17 Build Fix - Complete Guide

## Problem
Kotlin compiler is trying to parse Java version "25.0.1" which causes build failures, even though you have Java 17 installed.

## Solution

### Step 1: Run the Fix Script

```powershell
.\fix-java17-complete.ps1
```

This script will:
- ✅ Find your Java 17 installation
- ✅ Set JAVA_HOME automatically
- ✅ Add JAVA_HOME to gradle.properties
- ✅ Clean all build caches
- ✅ Clean react-native-reanimated cache

### Step 2: Verify Java 17

```powershell
java -version
```

Should show: `openjdk version "17.0.16"`

### Step 3: Build the App

```powershell
# Terminal 1: Start Metro
npm start

# Terminal 2: Build Android
npm run android
```

## Manual Fix (If Script Doesn't Work)

### 1. Find Java 17 Installation

```powershell
where java
# Or
Get-Command java | Select-Object -ExpandProperty Source
```

### 2. Set JAVA_HOME

```powershell
# Temporary (for current session)
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
# Replace with your actual Java 17 path

# Permanent: Add to System Environment Variables
# 1. Open System Properties → Environment Variables
# 2. Add new System Variable:
#    Variable: JAVA_HOME
#    Value: C:\Program Files\Java\jdk-17
```

### 3. Add to gradle.properties

Edit `android/gradle.properties` and add:

```properties
# Force Java 17
org.gradle.java.home=C:\\Program Files\\Java\\jdk-17
# Replace with your actual path (use double backslashes)
```

### 4. Clean Everything

```powershell
# Clean react-native-reanimated
Remove-Item -Path "node_modules\react-native-reanimated\android\.cxx" -Recurse -Force -ErrorAction SilentlyContinue

# Clean Android build
cd android
.\gradlew.bat --stop
.\gradlew.bat clean
cd ..
```

## Configuration Summary

| Component | Version | Status |
|-----------|---------|--------|
| Java | 17.0.16 | ✅ |
| Kotlin | 1.8.22 | ✅ Compatible with Java 17 |
| Gradle | 7.6.3 | ✅ |
| AGP | 7.4.2 | ✅ |
| Android SDK | API 33 | ✅ Android 13+ |

## Troubleshooting

### Error: "Java version parsing error"
- Make sure JAVA_HOME points to Java 17
- Run `.\fix-java17-complete.ps1` again
- Check `android/gradle.properties` has `org.gradle.java.home`

### Error: "build.ninja still dirty"
- The fix script cleans react-native-reanimated cache
- If still occurs, manually delete:
  ```
  node_modules\react-native-reanimated\android\.cxx
  ```

### Error: "Gradle daemon failed"
```powershell
cd android
.\gradlew.bat --stop
cd ..
```

## Notes

- Kotlin 1.8.22 is used (stable with Java 17)
- All Java compatibility set to VERSION_17
- Android 13+ (API 33) fully supported
- react-native-reanimated cache is cleaned automatically

