const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sourceDir = path.join(rootDir, 'AppAndroidSS', 'web-build');
const targetDir = path.join(rootDir, 'web-build');

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Expected frontend build output at ${sourceDir}`);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

console.log(`Synced web build to ${targetDir}`);
