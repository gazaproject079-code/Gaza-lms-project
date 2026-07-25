# React Native CLI Setup Guide

This project has been converted from Expo to React Native CLI. Follow these steps to set it up.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Java JDK** (JDK 11 or higher)
3. **Android Studio** (for Android development)
4. **Xcode** (for iOS development - Mac only)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Pods (iOS only)

```bash
cd ios
pod install
cd ..
```

### 3. Link Native Dependencies

Most dependencies should auto-link, but if you encounter issues:

```bash
# For Android
cd android
./gradlew clean
cd ..

# For iOS
cd ios
pod install
cd ..
```

### 4. Run the App

#### Android
```bash
npm run android
```

#### iOS
```bash
npm run ios
```

#### Start Metro Bundler
```bash
npm start
```

## Key Changes from Expo

1. **Entry Point**: Changed from `expo/AppEntry.js` to `index.js`
2. **StatusBar**: Using React Native's `StatusBar` instead of `expo-status-bar`
3. **Linear Gradient**: Using `react-native-linear-gradient` instead of `expo-linear-gradient`
4. **Icons**: Using `react-native-vector-icons` (Ionicons)
5. **Storage**: Using `@react-native-async-storage/async-storage`
6. **No Expo SDK**: All Expo-specific APIs removed

## New Features

### Dark/Light Mode Toggle
- Added `ThemeContext` for theme management
- Professional theme based on SkillSphere logo colors (blue to purple gradient)
- Theme toggle button in header
- Theme persists using AsyncStorage

### Logo Component
- SVG-based logo matching the SkillSphere brand
- Responsive and theme-aware
- Integrated throughout the app

## Project Structure

```
SkillSphereApp/
├── android/          # Android native code (generated)
├── ios/              # iOS native code (generated)
├── src/
│   ├── components/  # Reusable components
│   │   ├── Logo.js
│   │   ├── ThemeToggle.js
│   │   ├── AnimatedButton.js
│   │   └── AnimatedInput.js
│   ├── context/      # Context providers
│   │   ├── ThemeContext.js (NEW)
│   │   ├── AuthContext.js
│   │   └── DataContext.js
│   ├── navigation/  # Navigation setup
│   └── screens/     # Screen components
├── App.js           # Main app component
├── index.js         # Entry point
└── package.json
```

## Troubleshooting

### Android Build Issues

1. **Clean build**:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

2. **Clear Metro cache**:
```bash
npm start -- --reset-cache
```

3. **Check Android SDK**: Make sure ANDROID_HOME is set correctly

### iOS Build Issues

1. **Reinstall pods**:
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

2. **Clean build folder in Xcode**: Product > Clean Build Folder

### Vector Icons Not Showing

1. **Android**: Add to `android/app/build.gradle`:
```gradle
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

2. **iOS**: Already handled in Podfile

## Building APK

See `BUILD_APK.md` for detailed instructions on building Android APK.

## Theme System

The app uses a professional theme system based on the SkillSphere logo:

- **Light Mode**: White backgrounds with blue-purple accents
- **Dark Mode**: Dark backgrounds with brighter blue-purple accents
- **Gradient**: Blue (#6366f1) to Purple (#8b5cf6)

All components automatically adapt to the current theme.

