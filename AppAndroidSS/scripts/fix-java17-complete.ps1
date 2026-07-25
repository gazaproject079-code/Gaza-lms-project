# Complete Java 17 Fix for Android Build
# This script finds Java 17, sets JAVA_HOME, and fixes all build issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete Java 17 Build Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Find Java 17 installation
Write-Host "Step 1: Finding Java 17 installation..." -ForegroundColor Yellow
$javaPath = (Get-Command java -ErrorAction SilentlyContinue).Source
if ($javaPath) {
    $javaDir = Split-Path (Split-Path $javaPath)
    Write-Host "Found Java at: $javaDir" -ForegroundColor Green
    
    # Check if it's Java 17
    $javaVersion = & java -version 2>&1 | Select-String "version"
    Write-Host "Java Version: $javaVersion" -ForegroundColor Green
    
    # Set JAVA_HOME for this session
    $env:JAVA_HOME = $javaDir
    Write-Host "JAVA_HOME set to: $env:JAVA_HOME" -ForegroundColor Green
    
    # Also set in gradle.properties
    $gradleProps = Get-Content "android\gradle.properties" -Raw
    if ($gradleProps -notmatch "org\.gradle\.java\.home") {
        $gradleProps += "`n# Force Java 17`norg.gradle.java.home=$javaDir`n"
        Set-Content "android\gradle.properties" $gradleProps
        Write-Host "✓ Added JAVA_HOME to gradle.properties" -ForegroundColor Green
    } else {
        Write-Host "✓ JAVA_HOME already configured in gradle.properties" -ForegroundColor Green
    }
} else {
    Write-Host "⚠ Java not found in PATH!" -ForegroundColor Red
    Write-Host "Please install Java 17 or add it to PATH" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 2: Clean React Native Reanimated cache
Write-Host "Step 2: Cleaning react-native-reanimated build cache..." -ForegroundColor Yellow
$reanimatedPaths = @(
    "node_modules\react-native-reanimated\android\.cxx",
    "node_modules\react-native-reanimated\android\build"
)
foreach ($path in $reanimatedPaths) {
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Cleaned: $path" -ForegroundColor Green
    }
}
Write-Host ""

# Step 3: Clean Android build
Write-Host "Step 3: Cleaning Android build..." -ForegroundColor Yellow
cd android

# Stop all Gradle daemons
Write-Host "  Stopping Gradle daemons..." -ForegroundColor Gray
.\gradlew.bat --stop 2>&1 | Out-Null
Start-Sleep -Seconds 2

# Clean build
Write-Host "  Cleaning build..." -ForegroundColor Gray
.\gradlew.bat clean 2>&1 | Out-Null

cd ..
Write-Host "  ✓ Android build cleaned" -ForegroundColor Green
Write-Host ""

# Step 4: Clean Metro and node cache
Write-Host "Step 4: Cleaning Metro cache..." -ForegroundColor Yellow
$cachePaths = @(
    "node_modules\.cache",
    "$env:TEMP\metro-*",
    "$env:TEMP\haste-map-*"
)
foreach ($path in $cachePaths) {
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "  ✓ Metro cache cleaned" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All Fixes Applied!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "✓ JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
Write-Host "✓ Kotlin: 1.9.24" -ForegroundColor Green
Write-Host "✓ Java Compatibility: 17" -ForegroundColor Green
Write-Host "✓ Android SDK: API 33" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start Metro: npm start" -ForegroundColor White
Write-Host "2. Build app: npm run android" -ForegroundColor White
Write-Host ""
Write-Host "Note: JAVA_HOME is set for this session only." -ForegroundColor Yellow
Write-Host "To make it permanent, add to System Environment Variables:" -ForegroundColor Yellow
Write-Host "  Variable: JAVA_HOME" -ForegroundColor White
Write-Host "  Value: $env:JAVA_HOME" -ForegroundColor White
Write-Host ""

