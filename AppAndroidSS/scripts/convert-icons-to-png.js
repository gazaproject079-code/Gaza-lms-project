/**
 * Script to convert SVG icons to PNG using ImageMagick
 * 
 * Prerequisites: ImageMagick must be installed
 * Install: https://imagemagick.org/script/download.php
 * 
 * Run: node scripts/convert-icons-to-png.js
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

const iconOutputDir = path.join(__dirname, '../icon-output');
const androidResDir = path.join(__dirname, '../android/app/src/main/res');

console.log('🔄 Converting SVG Icons to PNG');
console.log('================================\n');

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
  console.log('\nOr use online tools:');
  console.log('  https://cloudconvert.com/svg-to-png');
  console.log('  https://convertio.co/svg-png/');
  process.exit(1);
}

// Convert each SVG to PNG
Object.entries(iconSizes).forEach(([folder, size]) => {
  const svgPath = path.join(iconOutputDir, `${folder}-icon.svg`);
  const pngPath = path.join(iconOutputDir, `${folder}-ic_launcher.png`);
  const roundPngPath = path.join(iconOutputDir, `${folder}-ic_launcher_round.png`);
  const androidPath = path.join(androidResDir, folder);
  
  if (!fs.existsSync(svgPath)) {
    console.log(`⚠️  SVG not found: ${svgPath}`);
    return;
  }
  
  try {
    // Convert to PNG
    execSync(`magick convert -background none -size ${size}x${size} "${svgPath}" "${pngPath}"`, { stdio: 'ignore' });
    console.log(`✅ Converted: ${folder}-ic_launcher.png (${size}x${size})`);
    
    // Create round version (same file for now)
    fs.copyFileSync(pngPath, roundPngPath);
    console.log(`✅ Created: ${folder}-ic_launcher_round.png`);
    
    // Copy to Android project
    if (fs.existsSync(androidPath)) {
      fs.copyFileSync(pngPath, path.join(androidPath, 'ic_launcher.png'));
      fs.copyFileSync(roundPngPath, path.join(androidPath, 'ic_launcher_round.png'));
      console.log(`✅ Copied to: android/app/src/main/res/${folder}/`);
    }
  } catch (error) {
    console.log(`❌ Error converting ${folder}: ${error.message}`);
  }
});

console.log('\n✨ Conversion complete!');
console.log('\n📋 Next Steps:');
console.log('1. Verify icons in: android/app/src/main/res/mipmap-*/');
console.log('2. Rebuild the app: npm run android');
console.log('3. Uninstall old app from device/emulator before installing new version');

