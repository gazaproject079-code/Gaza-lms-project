# Complete Fix for react-native-reanimated build.ninja Error
# This script completely removes and rebuilds react-native-reanimated native code

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing react-native-reanimated Build Error" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop all Gradle processes
Write-Host "Step 1: Stopping all Gradle processes..." -ForegroundColor Yellow
cd android
.\gradlew.bat --stop 2>&1 | Out-Null
Start-Sleep -Seconds 3

# Kill any remaining Java/Gradle processes
Get-Process | Where-Object {$_.ProcessName -like "*java*" -or $_.ProcessName -like "*gradle*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
cd ..
Write-Host "  ✓ All Gradle processes stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Completely remove react-native-reanimated build cache
Write-Host "Step 2: Removing react-native-reanimated build cache..." -ForegroundColor Yellow
$reanimatedPaths = @(
    "node_modules\react-native-reanimated\android\.cxx",
    "node_modules\react-native-reanimated\android\build",
    "node_modules\react-native-reanimated\android\.gradle"
)

foreach ($path in $reanimatedPaths) {
    if (Test-Path $path) {
        Write-Host "  Removing: $path" -ForegroundColor Gray
        $maxRetries = 5
        $retryCount = 0
        $removed = $false
        
        while (($retryCount -lt $maxRetries) -and (-not $removed)) {
            try {
                Remove-Item -Path $path -Recurse -Force -ErrorAction Stop
                $removed = $true
                Write-Host "    ✓ Removed successfully" -ForegroundColor Green
            }
            catch {
                $retryCount++
                if ($retryCount -lt $maxRetries) {
                    Write-Host "    ⚠ Retry $retryCount/$maxRetries..." -ForegroundColor Yellow
                    Start-Sleep -Seconds 2
                    Get-ChildItem -Path $path -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
                        $_.Attributes = 'Normal'
                    }
                }
                else {
                    Write-Host "    ✗ Failed to remove after $maxRetries retries" -ForegroundColor Red
                }
            }
        }
    }
}
Write-Host ""

# Step 3: Clean Android build
Write-Host "Step 3: Cleaning Android build..." -ForegroundColor Yellow
cd android
.\gradlew.bat clean 2>&1 | Out-Null
cd ..
Write-Host "  ✓ Android build cleaned" -ForegroundColor Green
Write-Host ""

# Step 4: Remove Android build directories
Write-Host "Step 4: Removing Android build directories..." -ForegroundColor Yellow
$androidBuildPaths = @(
    "android\app\build",
    "android\build",
    "android\.gradle"
)

foreach ($path in $androidBuildPaths) {
    if (Test-Path $path) {
        try {
            Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Removed: $path" -ForegroundColor Green
        }
        catch {
            Write-Host "  ⚠ Could not remove: $path" -ForegroundColor Yellow
        }
    }
}
Write-Host ""

# Step 5: Clear Metro cache
Write-Host "Step 5: Clearing Metro cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Metro cache cleared" -ForegroundColor Green
}
else {
    Write-Host "  ✓ Metro cache already clean" -ForegroundColor Green
}
Write-Host ""

# Step 6: Reinstall react-native-reanimated
Write-Host "Step 6: Reinstalling react-native-reanimated..." -ForegroundColor Yellow
Write-Host "  This will ensure a clean native build" -ForegroundColor Gray
npm uninstall react-native-reanimated 2>&1 | Out-Null
Start-Sleep -Seconds 2
npm install react-native-reanimated@~3.3.0 2>&1 | Out-Null
Write-Host "  ✓ react-native-reanimated reinstalled" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start Metro: npm start" -ForegroundColor White
Write-Host "2. Build app: npm run android" -ForegroundColor White
Write-Host ""
Write-Host "Note: The first build may take longer as it rebuilds native code." -ForegroundColor Gray
Write-Host ""
