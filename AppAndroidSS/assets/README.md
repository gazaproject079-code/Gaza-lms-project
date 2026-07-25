# App Icon Setup

## Icon Files

- `icon.svg` - Source SVG file for the SkillSphere logo
- `icon.png` - Main app icon (1024x1024px recommended)

## Converting SVG to PNG

To create `icon.png` from `icon.svg`, use one of these methods:

### Option 1: Online Tools
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`
3. Set size to 1024x1024 pixels
4. Download as `icon.png`

### Option 2: ImageMagick
```bash
magick convert -background none -size 1024x1024 assets/icon.svg assets/icon.png
```

### Option 3: Inkscape
```bash
inkscape --export-png=assets/icon.png --export-width=1024 assets/icon.svg
```

## Android Icon Setup

After creating `icon.png`, run the setup script:

```bash
node scripts/setup-android-icons.js
```

This will:
1. Generate all required Android icon sizes from `icon.png`
2. Copy them to the appropriate `mipmap-*` folders
3. Create foreground images for adaptive icons

## Icon Sizes Required

### Android
- `mipmap-mdpi`: 48x48px
- `mipmap-hdpi`: 72x72px
- `mipmap-xhdpi`: 96x96px
- `mipmap-xxhdpi`: 144x144px
- `mipmap-xxxhdpi`: 192x192px
- Adaptive icon foreground: 432x432px (for Android 8.0+)

### iOS (if applicable)
- 1024x1024px for App Store
- Various sizes for different devices (handled by Xcode)

