# Kill Metro Bundler Process (Port 8081)
# This script finds and kills any process using port 8081

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Killing Metro Bundler (Port 8081)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find process using port 8081
Write-Host "Finding process on port 8081..." -ForegroundColor Yellow
$portInfo = netstat -ano | findstr :8081

if ($portInfo) {
    # Extract PID from the output
    $pid = ($portInfo | Select-String -Pattern '\s+(\d+)$').Matches.Groups[1].Value
    
    if ($pid) {
        Write-Host "Found process with PID: $pid" -ForegroundColor Yellow
        
        # Kill the process
        try {
            taskkill /F /PID $pid 2>&1 | Out-Null
            Write-Host "✓ Successfully killed process $pid" -ForegroundColor Green
        } catch {
            Write-Host "✗ Failed to kill process: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠ Could not extract PID from output" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ No process found on port 8081" -ForegroundColor Green
}

Write-Host ""
Write-Host "You can now run: npm start" -ForegroundColor Cyan
Write-Host ""

