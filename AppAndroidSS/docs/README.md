# Documentation Index

This folder contains all documentation files for the SkillSphere Android App project.

## Setup & Installation Guides

- **[QUICK_START.md](./QUICK_START.md)** - Quick start guide for getting the app running
- **[COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)** - Complete setup instructions
- **[RN_CLI_SETUP.md](./RN_CLI_SETUP.md)** - React Native CLI setup guide
- **[ANDROID_SDK_SETUP.md](./ANDROID_SDK_SETUP.md)** - Android SDK setup instructions

## Build & Configuration

- **[BUILD_INSTRUCTIONS.md](./BUILD_INSTRUCTIONS.md)** - General build instructions
- **[BUILD_APK.md](./BUILD_APK.md)** - Instructions for building APK
- **[README_JAVA17_FIX.md](./README_JAVA17_FIX.md)** - Java 17 configuration and fixes

## Fixes & Troubleshooting

- **[ALL_FIXES_COMPLETE.md](./ALL_FIXES_COMPLETE.md)** - Summary of all fixes applied
- **[ANDROID_FIXES.md](./ANDROID_FIXES.md)** - Android-specific fixes
- **[COMPLETE_ANDROID_FIX.md](./COMPLETE_ANDROID_FIX.md)** - Complete Android fix guide
- **[KOTLIN_FIX_COMPLETE.md](./KOTLIN_FIX_COMPLETE.md)** - Kotlin compatibility fixes
- **[FINAL_GRADLE_FIX.md](./FINAL_GRADLE_FIX.md)** - Gradle configuration fixes
- **[BUILD_TOOLS_FIX.md](./BUILD_TOOLS_FIX.md)** - Build tools installation fixes
- **[BUILDCONFIG_FIX.md](./BUILDCONFIG_FIX.md)** - Build configuration fixes
- **[ANDROID_13_COMPATIBILITY_FIX.md](./ANDROID_13_COMPATIBILITY_FIX.md)** - Android 13+ compatibility
- **[fix-sdk-xml-issue.md](./fix-sdk-xml-issue.md)** - SDK XML issues fix

## Migration & Updates

- **[THEME_MIGRATION_GUIDE.md](./THEME_MIGRATION_GUIDE.md)** - Theme system migration
- **[UPDATE_REMAINING_SCREENS.md](./UPDATE_REMAINING_SCREENS.md)** - Screen update guide
- **[EXPO_ICONS_FIX.md](./EXPO_ICONS_FIX.md)** - Expo icons migration

## Quick Reference

### Common Issues

1. **Port 8081 already in use**: Run `.\scripts\kill-metro.ps1` or `.\scripts\kill-metro.bat`
2. **Java version errors**: See [README_JAVA17_FIX.md](./README_JAVA17_FIX.md)
3. **Build failures**: See [ALL_FIXES_COMPLETE.md](./ALL_FIXES_COMPLETE.md)
4. **Android 13+ issues**: See [ANDROID_13_COMPATIBILITY_FIX.md](./ANDROID_13_COMPATIBILITY_FIX.md)

### Scripts

All helper scripts are in the `scripts/` folder:
- `kill-metro.ps1` / `kill-metro.bat` - Kill Metro bundler on port 8081
- `fix-java17-complete.ps1` - Fix Java 17 configuration
- `fix-all-build-errors.ps1` - Clean all build caches

