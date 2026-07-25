/**
 * Script to set up Android app icons from assets/icon.png
 * 
 * Prerequisites: ImageMagick must be installed
 * Install: https://imagemagick.org/script/download.php
 * 
 * Run: node scripts/setup-android-icons.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const adaptiveIconSize = 432; // Foreground image for adaptive icons

const sourceIcon = path.join(__dirname, '../assets/icon.png');
const androidResDir = path.join(__dirname, '../android/app/src/main/res');

console.log('📱 Android Icon Setup');
console.log('====================\n');

// Check if source icon exists
if (!fs.existsSync(sourceIcon)) {
  console.log('❌ Error: assets/icon.png not found!');
  console.log('\nPlease create icon.png first:');
  console.log('1. Convert assets/icon.svg to PNG (1024x1024px)');
  console.log('2. Save it as assets/icon.png');
  console.log('\nSee assets/README.md for conversion instructions.');
  process.exit(1);
}

// Check if ImageMagick is available
try {
  execSync('magick -version', { stdio: 'ignore' });
  console.log('✅ ImageMagick found\n');
} catch (error) {
  console.log('❌ ImageMagick not found!');
  console.log('\nPlease install ImageMagick:');
  console.log('  Windows: https://imagemagick.org/script/download.php#windows');
  console.log('  Mac: brew install imagemagick');
  console.log('  Linux: sudo apt-get install imagemagick');
  process.exit(1);
}

// Create adaptive icon foreground
const foregroundPath = path.join(androidResDir, 'mipmap-xxxhdpi', 'ic_launcher_foreground.png');
try {
  execSync(`magick convert -background none -size ${adaptiveIconSize}x${adaptiveIconSize} "${sourceIcon}" "${foregroundPath}"`, { stdio: 'ignore' });
  console.log(`✅ Created adaptive icon foreground: ${adaptiveIconSize}x${adaptiveIconSize}`);
} catch (error) {
  console.log(`❌ Error creating foreground: ${error.message}`);
}

// Generate icons for each density
Object.entries(iconSizes).forEach(([folder, size]) => {
  const androidPath = path.join(androidResDir, folder);
  const launcherPath = path.join(androidPath, 'ic_launcher.png');
  const roundPath = path.join(androidPath, 'ic_launcher_round.png');
  
  if (!fs.existsSync(androidPath)) {
    console.log(`⚠️  Directory not found: ${androidPath}`);
    return;
  }
  
  try {
    // Create regular launcher icon
    execSync(`magick convert -background none -size ${size}x${size} "${sourceIcon}" "${launcherPath}"`, { stdio: 'ignore' });
    console.log(`✅ Created: ${folder}/ic_launcher.png (${size}x${size})`);
    
    // Create round launcher icon (same file)
    fs.copyFileSync(launcherPath, roundPath);
    console.log(`✅ Created: ${folder}/ic_launcher_round.png`);
  } catch (error) {
    console.log(`❌ Error creating ${folder} icons: ${error.message}`);
  }
});

// Copy foreground to all densities for adaptive icons
const foregroundSource = path.join(androidResDir, 'mipmap-xxxhdpi', 'ic_launcher_foreground.png');
if (fs.existsSync(foregroundSource)) {
  Object.keys(iconSizes).forEach((folder) => {
    const targetPath = path.join(androidResDir, folder, 'ic_launcher_foreground.png');
    if (folder !== 'mipmap-xxxhdpi') {
      try {
        fs.copyFileSync(foregroundSource, targetPath);
        console.log(`✅ Copied foreground to: ${folder}/`);
      } catch (error) {
        console.log(`⚠️  Could not copy to ${folder}: ${error.message}`);
      }
    }
  });
}

console.log('\n✨ Icon setup complete!');
console.log('\n📋 Next Steps:');
console.log('1. Verify icons in: android/app/src/main/res/mipmap-*/');
console.log('2. Clean build: cd android && ./gradlew clean && cd ..');
console.log('3. Rebuild: npm run android');
console.log('4. Uninstall old app from device/emulator before installing new version');

