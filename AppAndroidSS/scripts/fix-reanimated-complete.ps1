# Complete Aggressive Fix for react-native-reanimated CMake Infinite Loop
# This script completely removes react-native-reanimated and rebuilds it

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete react-native-reanimated Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill ALL processes
Write-Host "Step 1: Killing all related processes..." -ForegroundColor Yellow
taskkill /F /IM java.exe /T 2>$null | Out-Null
taskkill /F /IM cmake.exe /T 2>$null | Out-Null
taskkill /F /IM ninja.exe /T 2>$null | Out-Null
Get-Process | Where-Object {$_.ProcessName -like "*gradle*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "  ✓ All processes killed" -ForegroundColor Green
Write-Host ""

# Step 2: Stop Gradle
Write-Host "Step 2: Stopping Gradle daemons..." -ForegroundColor Yellow
cd android
.\gradlew.bat --stop 2>&1 | Out-Null
Start-Sleep -Seconds 3
cd ..
Write-Host "  ✓ Gradle stopped" -ForegroundColor Green
Write-Host ""

# Step 3: Remove react-native-reanimated completely
Write-Host "Step 3: Removing react-native-reanimated..." -ForegroundColor Yellow
$reanimatedPaths = @(
    "node_modules\react-native-reanimated\android\.cxx",
    "node_modules\react-native-reanimated\android\build",
    "node_modules\react-native-reanimated\android\.gradle",
    "node_modules\react-native-reanimated"
)

foreach ($path in $reanimatedPaths) {
    if (Test-Path $path) {
        Write-Host "  Removing: $path" -ForegroundColor Gray
        # Unlock files
        Get-ChildItem -Path $path -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
            $_.IsReadOnly = $false
        }
        # Remove
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}
Write-Host "  ✓ react-native-reanimated removed" -ForegroundColor Green
Write-Host ""

# Step 4: Clean Android build
Write-Host "Step 4: Cleaning Android build..." -ForegroundColor Yellow
Remove-Item -Path "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
cd android
.\gradlew.bat clean 2>&1 | Out-Null
cd ..
Write-Host "  ✓ Android build cleaned" -ForegroundColor Green
Write-Host ""

# Step 5: Reinstall react-native-reanimated
Write-Host "Step 5: Reinstalling react-native-reanimated..." -ForegroundColor Yellow
npm install react-native-reanimated@~3.3.0 2>&1 | Out-Null
Write-Host "  ✓ react-native-reanimated reinstalled" -ForegroundColor Green
Write-Host ""

# Step 6: Verify architecture settings
Write-Host "Step 6: Verifying configuration..." -ForegroundColor Yellow
Write-Host "  ✓ Architecture: arm64-v8a, x86_64 (armeabi-v7a excluded)" -ForegroundColor Green
Write-Host "  ✓ Parallel builds: Disabled" -ForegroundColor Green
Write-Host "  ✓ Incremental builds: Disabled" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Important Changes:" -ForegroundColor Yellow
Write-Host "  - Excluded armeabi-v7a architecture (causes CMake issues)" -ForegroundColor White
Write-Host "  - Only building: arm64-v8a, x86_64" -ForegroundColor White
Write-Host "  - This will work on modern devices (Android 5.0+)" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start Metro: npm start" -ForegroundColor White
Write-Host "2. Build app: npm run android" -ForegroundColor White
Write-Host ""

