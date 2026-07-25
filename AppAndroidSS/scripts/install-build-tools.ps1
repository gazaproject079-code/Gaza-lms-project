# PowerShell script to install missing Android SDK Build-Tools
Write-Host "🔧 Installing Android SDK Build-Tools 30.0.3..." -ForegroundColor Cyan

$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
$sdkManager = "$sdkPath\cmdline-tools\latest\bin\sdkmanager.bat"

if (-not (Test-Path $sdkManager)) {
    Write-Host "❌ SDK Manager not found at: $sdkManager" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Android SDK Command-line Tools:" -ForegroundColor Yellow
    Write-Host "1. Open Android Studio" -ForegroundColor Yellow
    Write-Host "2. Go to Tools > SDK Manager" -ForegroundColor Yellow
    Write-Host "3. SDK Tools tab > Check 'Android SDK Command-line Tools (latest)'" -ForegroundColor Yellow
    Write-Host "4. Click Apply" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ SDK Manager found" -ForegroundColor Green
Write-Host ""

# Install Build-Tools 30.0.3
Write-Host "Installing build-tools;30.0.3..." -ForegroundColor Yellow
& $sdkManager "build-tools;30.0.3"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build-Tools 30.0.3 installed successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Installation may have issues. Trying alternative method..." -ForegroundColor Yellow
    
    # Try installing via Android Studio method
    Write-Host ""
    Write-Host "Please install manually via Android Studio:" -ForegroundColor Yellow
    Write-Host "1. Open Android Studio" -ForegroundColor Yellow
    Write-Host "2. Go to Tools > SDK Manager" -ForegroundColor Yellow
    Write-Host "3. SDK Tools tab" -ForegroundColor Yellow
    Write-Host "4. Check 'Android SDK Build-Tools 30.0.3'" -ForegroundColor Yellow
    Write-Host "5. Click Apply" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Also installing Build-Tools 33.0.0 (recommended)..." -ForegroundColor Yellow
& $sdkManager "build-tools;33.0.0"

Write-Host ""
Write-Host "🎉 Setup complete! Try building again: npm run android" -ForegroundColor Green

