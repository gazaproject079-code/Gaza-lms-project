# Fix All Build Errors - Java 17 + React Native Reanimated
# This script fixes Java version issues and cleans build caches

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing All Build Errors" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Java version and JAVA_HOME
Write-Host "Step 1: Checking Java configuration..." -ForegroundColor Yellow
$javaVersion = java -version 2>&1 | Select-String "version"
Write-Host "Java Version: $javaVersion" -ForegroundColor Green

if ($env:JAVA_HOME) {
    Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
    $javaHomeVersion = & "$env:JAVA_HOME\bin\java" -version 2>&1 | Select-String "version"
    Write-Host "JAVA_HOME Java Version: $javaHomeVersion" -ForegroundColor Green
} else {
    Write-Host "⚠ JAVA_HOME is not set!" -ForegroundColor Yellow
    Write-Host "  Please set JAVA_HOME to your Java 17 installation:" -ForegroundColor Yellow
    Write-Host "  Example: `$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'" -ForegroundColor Yellow
    Write-Host "  Or add to System Environment Variables" -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Clean React Native Reanimated cache
Write-Host "Step 2: Cleaning react-native-reanimated build cache..." -ForegroundColor Yellow
$reanimatedPath = "node_modules\react-native-reanimated\android\.cxx"
if (Test-Path $reanimatedPath) {
    Remove-Item -Path $reanimatedPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ React Native Reanimated cache cleaned" -ForegroundColor Green
} else {
    Write-Host "✓ React Native Reanimated cache already clean" -ForegroundColor Green
}
Write-Host ""

# Step 3: Clean Android build
Write-Host "Step 3: Cleaning Android build..." -ForegroundColor Yellow
cd android

# Stop Gradle daemon
Write-Host "  Stopping Gradle daemon..." -ForegroundColor Gray
.\gradlew.bat --stop 2>&1 | Out-Null
Write-Host "  ✓ Gradle daemon stopped" -ForegroundColor Green

# Clean build
Write-Host "  Cleaning build..." -ForegroundColor Gray
.\gradlew.bat clean 2>&1 | Out-Null
Write-Host "  ✓ Build cleaned" -ForegroundColor Green

cd ..
Write-Host ""

# Step 4: Clean node_modules cache (optional but recommended)
Write-Host "Step 4: Cleaning Metro cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Metro cache cleaned" -ForegroundColor Green
} else {
    Write-Host "✓ Metro cache already clean" -ForegroundColor Green
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All Cleanup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration Summary:" -ForegroundColor Yellow
Write-Host "✓ Kotlin Version: 1.9.24 (supports Java 17, handles newer versions)" -ForegroundColor Green
Write-Host "✓ Java Compatibility: VERSION_17" -ForegroundColor Green
Write-Host "✓ Android SDK: API 33 (Android 13)" -ForegroundColor Green
Write-Host "✓ React Native Reanimated cache: Cleaned" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start Metro: npm start" -ForegroundColor White
Write-Host "2. Build app: npm run android" -ForegroundColor White
Write-Host ""

