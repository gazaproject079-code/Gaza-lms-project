/**
 * Script to generate app icons from GazaRise logo
 * 
 * This script creates app icons at different sizes for Android
 * Run: node scripts/generate-app-icon.js
 */

const fs = require('fs');
const path = require('path');

// Icon sizes for different densities
const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// SVG template for the GazaRise logo (circuit board/sphere design)
const logoSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="1" />
      <stop offset="50%" stop-color="#6366f1" stop-opacity="1" />
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="1" />
    </linearGradient>
    <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0" />
    </radialGradient>
  </defs>
  
  <!-- Background glow -->
  <circle cx="60" cy="60" r="58" fill="url(#glowGradient)" opacity="0.4" />
  <circle cx="60" cy="60" r="55" fill="url(#glowGradient)" />
  
  <g>
    <!-- Outer incomplete circle (C-shape) -->
    <path
      d="M 60 15 A 45 45 0 0 1 105 60"
      stroke="url(#logoGradient)"
      stroke-width="7"
      fill="none"
      stroke-linecap="round"
    />
    <path
      d="M 105 60 A 45 45 0 0 1 60 105"
      stroke="url(#logoGradient)"
      stroke-width="7"
      fill="none"
      stroke-linecap="round"
    />
    
    <!-- Inner curve for depth -->
    <path
      d="M 60 32 A 28 28 0 0 1 88 60"
      stroke="url(#logoGradient)"
      stroke-width="4"
      fill="none"
      stroke-linecap="round"
      opacity="0.8"
    />
    <path
      d="M 88 60 A 28 28 0 0 1 60 88"
      stroke="url(#logoGradient)"
      stroke-width="4"
      fill="none"
      stroke-linecap="round"
      opacity="0.8"
    />
    
    <!-- Central network hub -->
    <circle cx="60" cy="60" r="5" fill="#ffffff" />
    
    <!-- Network nodes along the curve -->
    <circle cx="60" cy="30" r="4" fill="url(#logoGradient)" />
    <circle cx="75" cy="40" r="4" fill="url(#logoGradient)" />
    <circle cx="90" cy="55" r="4" fill="url(#logoGradient)" />
    <circle cx="95" cy="70" r="4" fill="url(#logoGradient)" />
    <circle cx="90" cy="85" r="4" fill="url(#logoGradient)" />
    <circle cx="75" cy="95" r="4" fill="url(#logoGradient)" />
    <circle cx="60" cy="90" r="4" fill="url(#logoGradient)" />
    <circle cx="45" cy="80" r="4" fill="url(#logoGradient)" />
    <circle cx="35" cy="65" r="4" fill="url(#logoGradient)" />
    <circle cx="40" cy="50" r="4" fill="url(#logoGradient)" />
    <circle cx="50" cy="40" r="4" fill="url(#logoGradient)" />
    
    <!-- Connection lines - main network pattern -->
    <path
      d="M 60 60 L 60 30"
      stroke="url(#logoGradient)"
      stroke-width="2.5"
      opacity="0.6"
    />
    <path
      d="M 60 60 L 75 40"
      stroke="url(#logoGradient)"
      stroke-width="2.5"
      opacity="0.6"
    />
    <path
      d="M 60 60 L 90 55"
      stroke="url(#logoGradient)"
      stroke-width="2.5"
      opacity="0.6"
    />
    <path
      d="M 60 60 L 95 70"
      stroke="url(#logoGradient)"
      stroke-width="2.5"
      opacity="0.6"
    />
    <path
      d="M 60 60 L 90 85"
      stroke="url(#logoGradient)"
      stroke-width="2.5"
      opacity="0.6"
    />
    <path
      d="M 60 60 L 75 95"
      stroke="url(#logoGradient)"
      stroke-width="2.5"
      opacity="0.6"
    />
    <path
      d="M 60 60 L 60 90"
      stroke="url(#logoGradient)"
      stroke-width="2.5"
      opacity="0.6"
    />
    <path
      d="M 60 60 L 45 80"
      stroke="url(#logoGradient)"
      stroke-width="2.5"
      opacity="0.6"
    />
    <path
      d="M 60 60 L 35 65"
      stroke="url(#logoGradient)"
      stroke-width="2.5"
      opacity="0.6"
    />
    <path
      d="M 60 60 L 40 50"
      stroke="url(#logoGradient)"
      stroke-width="2.5"
      opacity="0.6"
    />
    <path
      d="M 60 60 L 50 40"
      stroke="url(#logoGradient)"
      stroke-width="2.5"
      opacity="0.6"
    />
  </g>
</svg>
`;

console.log('📱 GazaRise App Icon Generator');
console.log('================================\n');

console.log('This script generates SVG files for the app icon.');
console.log('To convert SVG to PNG for Android, you can:');
console.log('\n1. Use an online tool like:');
console.log('   - https://cloudconvert.com/svg-to-png');
console.log('   - https://convertio.co/svg-png/');
console.log('\n2. Use ImageMagick (if installed):');
console.log('   convert -background none -size 192x192 icon.svg icon.png');
console.log('\n3. Use Inkscape (if installed):');
console.log('   inkscape --export-png=icon.png --export-width=192 icon.svg');
console.log('\nGenerating SVG files...\n');

// Create output directory
const outputDir = path.join(__dirname, '../icon-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate SVG files for each size
Object.entries(iconSizes).forEach(([folder, size]) => {
  const svgContent = logoSVG(size);
  const svgPath = path.join(outputDir, `${folder}-icon.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`✅ Generated: ${folder}-icon.svg (${size}x${size})`);
});

console.log(`\n✨ SVG files generated in: ${outputDir}`);
console.log('\n📋 Next Steps:');
console.log('1. Convert each SVG to PNG at the specified size');
console.log('2. Copy the PNG files to:');
console.log('   android/app/src/main/res/mipmap-mdpi/ic_launcher.png');
console.log('   android/app/src/main/res/mipmap-hdpi/ic_launcher.png');
console.log('   android/app/src/main/res/mipmap-xhdpi/ic_launcher.png');
console.log('   android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png');
console.log('   android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png');
console.log('\n3. Also create round versions (ic_launcher_round.png) for each size');
console.log('4. Rebuild the app: npm run android');

