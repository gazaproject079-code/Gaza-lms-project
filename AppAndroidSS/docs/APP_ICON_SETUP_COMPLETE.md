# App Icon Setup - Complete Guide

## Files Created/Modified

### 1. Assets Directory
- ✅ `assets/icon.svg` - Source SVG logo file
- ✅ `assets/icon.png` - Main app icon (needs to be created from SVG)
- ✅ `assets/README.md` - Instructions for icon conversion

### 2. Configuration Files
- ✅ `app.json` - Updated with icon configuration
  - Added `icon` field
  - Added Android adaptive icon configuration
  - Added iOS icon configuration

### 3. Android Adaptive Icon Support
- ✅ `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` - Adaptive icon config
- ✅ `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` - Round adaptive icon
- ✅ `android/app/src/main/res/values/colors.xml` - Added `ic_launcher_background` color

### 4. Helper Scripts
- ✅ `scripts/setup-android-icons.js` - Automated icon setup script

## Setup Instructions

### Step 1: Create icon.png

Convert `assets/icon.svg` to PNG format (1024x1024px):

**Option A: Online Tool**
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `assets/icon.svg`
3. Set size to 1024x1024 pixels
4. Download and save as `assets/icon.png`

**Option B: ImageMagick**
```bash
magick convert -background none -size 1024x1024 assets/icon.svg assets/icon.png
```

**Option C: Inkscape**
```bash
inkscape --export-png=assets/icon.png --export-width=1024 assets/icon.svg
```

### Step 2: Generate Android Icons

Run the setup script:
```bash
node scripts/setup-android-icons.js
```

This will:
- Generate all required Android icon sizes
- Create adaptive icon foreground images
- Copy icons to all `mipmap-*` folders

### Step 3: Rebuild the App

```bash
cd android
./gradlew clean
cd ..
npm run android
```

**Important:** Uninstall the old app from your device/emulator before installing the new version to see the updated icon.

## Icon Sizes Generated

### Android Launcher Icons
- `mipmap-mdpi`: 48x48px
- `mipmap-hdpi`: 72x72px
- `mipmap-xhdpi`: 96x96px
- `mipmap-xxhdpi`: 144x144px
- `mipmap-xxxhdpi`: 192x192px

### Android Adaptive Icons (Android 8.0+)
- Foreground: 432x432px (stored in all mipmap folders)
- Background: White (#FFFFFF) - defined in colors.xml

## File Structure

```
assets/
├── icon.svg          # Source SVG logo
├── icon.png          # Main icon (1024x1024px) - CREATE THIS
└── README.md         # Conversion instructions

android/app/src/main/res/
├── mipmap-anydpi-v26/
│   ├── ic_launcher.xml          # Adaptive icon config
│   └── ic_launcher_round.xml    # Round adaptive icon config
├── mipmap-*/                    # Icon sizes for different densities
│   ├── ic_launcher.png
│   ├── ic_launcher_round.png
│   └── ic_launcher_foreground.png (for adaptive icons)
└── values/
    └── colors.xml               # Background color for adaptive icons
```

## Verification

After setup, verify:
1. ✅ `assets/icon.png` exists (1024x1024px)
2. ✅ All `mipmap-*/ic_launcher.png` files exist
3. ✅ All `mipmap-*/ic_launcher_round.png` files exist
4. ✅ All `mipmap-*/ic_launcher_foreground.png` files exist
5. ✅ `app.json` has icon configuration
6. ✅ Adaptive icon XML files exist

## Troubleshooting

### Icons Not Updating
1. Clean build: `cd android && ./gradlew clean && cd ..`
2. Uninstall old app from device/emulator
3. Rebuild: `npm run android`

### ImageMagick Not Found
- Install ImageMagick from https://imagemagick.org/script/download.php
- Or use online tools to convert SVG to PNG manually

### Adaptive Icons Not Working
- Ensure `mipmap-anydpi-v26` folder exists
- Check that `ic_launcher_foreground.png` exists in all mipmap folders
- Verify `colors.xml` has `ic_launcher_background` color

## Notes

- The icon uses the SkillSphere logo design (circuit board/sphere pattern)
- Background color for adaptive icons is white (#FFFFFF)
- All icons are generated from the same source SVG for consistency
- The setup script automatically handles all required sizes

