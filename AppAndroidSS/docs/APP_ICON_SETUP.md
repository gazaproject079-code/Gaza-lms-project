# App Icon Setup Guide

This guide explains how to set up the SkillSphere app icon for Android.

## Quick Setup (Using Generated SVG)

### Step 1: Generate SVG Files

Run the icon generator script:

```bash
node scripts/generate-app-icon.js
```

This will create SVG files in the `icon-output` folder.

### Step 2: Convert SVG to PNG

You need to convert the SVG files to PNG at the correct sizes. Here are your options:

#### Option A: Online Tools (Easiest)

1. Go to https://cloudconvert.com/svg-to-png or https://convertio.co/svg-png/
2. Upload each SVG file
3. Set the output size:
   - `mipmap-mdpi-icon.svg` → 48x48 pixels
   - `mipmap-hdpi-icon.svg` → 72x72 pixels
   - `mipmap-xhdpi-icon.svg` → 96x96 pixels
   - `mipmap-xxhdpi-icon.svg` → 144x144 pixels
   - `mipmap-xxxhdpi-icon.svg` → 192x192 pixels
4. Download the PNG files

#### Option B: ImageMagick (Command Line)

If you have ImageMagick installed:

```bash
cd icon-output
convert -background none -size 48x48 mipmap-mdpi-icon.svg mipmap-mdpi-ic_launcher.png
convert -background none -size 72x72 mipmap-hdpi-icon.svg mipmap-hdpi-ic_launcher.png
convert -background none -size 96x96 mipmap-xhdpi-icon.svg mipmap-xhdpi-ic_launcher.png
convert -background none -size 144x144 mipmap-xxhdpi-icon.svg mipmap-xxhdpi-ic_launcher.png
convert -background none -size 192x192 mipmap-xxxhdpi-icon.svg mipmap-xxxhdpi-ic_launcher.png
```

#### Option C: Inkscape (Command Line)

If you have Inkscape installed:

```bash
cd icon-output
inkscape --export-png=mipmap-mdpi-ic_launcher.png --export-width=48 mipmap-mdpi-icon.svg
inkscape --export-png=mipmap-hdpi-ic_launcher.png --export-width=72 mipmap-hdpi-icon.svg
inkscape --export-png=mipmap-xhdpi-ic_launcher.png --export-width=96 mipmap-xhdpi-icon.svg
inkscape --export-png=mipmap-xxhdpi-ic_launcher.png --export-width=144 mipmap-xxhdpi-icon.svg
inkscape --export-png=mipmap-xxxhdpi-ic_launcher.png --export-width=192 mipmap-xxxhdpi-icon.svg
```

### Step 3: Create Round Icons

For round icons, you can:
1. Use the same PNG files (Android will automatically round them)
2. Or create circular versions using an image editor

### Step 4: Copy Icons to Android Project

Copy the PNG files to the appropriate folders:

```bash
# From icon-output folder
cp mipmap-mdpi-ic_launcher.png ../android/app/src/main/res/mipmap-mdpi/
cp mipmap-hdpi-ic_launcher.png ../android/app/src/main/res/mipmap-hdpi/
cp mipmap-xhdpi-ic_launcher.png ../android/app/src/main/res/mipmap-xhdpi/
cp mipmap-xxhdpi-ic_launcher.png ../android/app/src/main/res/mipmap-xxhdpi/
cp mipmap-xxxhdpi-ic_launcher.png ../android/app/src/main/res/mipmap-xxxhdpi/

# For round icons (use same files or create round versions)
cp mipmap-mdpi-ic_launcher.png ../android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
cp mipmap-hdpi-ic_launcher.png ../android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
cp mipmap-xhdpi-ic_launcher.png ../android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
cp mipmap-xxhdpi-ic_launcher.png ../android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
cp mipmap-xxxhdpi-ic_launcher.png ../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png
```

### Step 5: Rebuild the App

After copying the icons, rebuild the app:

```bash
cd android
./gradlew clean
cd ..
npm run android
```

## Icon Specifications

The SkillSphere app icon features:
- **Design**: Circuit board/sphere pattern with network nodes
- **Colors**: Blue (#3b82f6) to Purple (#8b5cf6) gradient
- **Style**: Modern, professional, tech-focused
- **Background**: Transparent (for adaptive icons)

## File Structure

```
android/app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png (48x48)
│   └── ic_launcher_round.png (48x48)
├── mipmap-hdpi/
│   ├── ic_launcher.png (72x72)
│   └── ic_launcher_round.png (72x72)
├── mipmap-xhdpi/
│   ├── ic_launcher.png (96x96)
│   └── ic_launcher_round.png (96x96)
├── mipmap-xxhdpi/
│   ├── ic_launcher.png (144x144)
│   └── ic_launcher_round.png (144x144)
└── mipmap-xxxhdpi/
    ├── ic_launcher.png (192x192)
    └── ic_launcher_round.png (192x192)
```

## Troubleshooting

### Icons Not Updating

1. **Clean build**: `cd android && ./gradlew clean && cd ..`
2. **Uninstall old app** from device/emulator
3. **Rebuild**: `npm run android`

### Icons Look Blurry

- Make sure you're using the correct sizes for each density
- Ensure PNG files are not compressed too much
- Use high-quality source images

### Icons Not Showing

- Check that files are named exactly: `ic_launcher.png` and `ic_launcher_round.png`
- Verify files are in the correct `mipmap-*` folders
- Check AndroidManifest.xml references: `@mipmap/ic_launcher`

## Alternative: Using Your Own Icon

If you have your own SkillSphere icon image:

1. Ensure it's square (1:1 aspect ratio)
2. Create versions at all required sizes
3. Follow Step 4 above to copy them to the project
4. Rebuild the app

## Notes

- The icon design matches the SkillSphere logo used in the app
- Icons should have transparent backgrounds for best results
- Round icons are optional but recommended for modern Android versions

