# Quick Test Script for Student Features
# Run this to verify all fixes are working

Write-Host "`n=== STUDENT DATA FIXES - VERIFICATION SCRIPT ===" -ForegroundColor Cyan
Write-Host "This script will help you verify all the fixes are working`n" -ForegroundColor Yellow

# 1. Check if icon exists
Write-Host "1. Checking ai-prediction.svg icon..." -ForegroundColor Green
$iconPath = "public\ai-prediction.svg"
if (Test-Path $iconPath) {
    Write-Host "   ✅ Icon file exists at: $iconPath" -ForegroundColor Green
    $iconSize = (Get-Item $iconPath).Length
    Write-Host "   📏 File size: $iconSize bytes" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Icon file NOT found!" -ForegroundColor Red
}

# 2. Check if Python API is running
Write-Host "`n2. Checking ML Prediction API..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5000/health" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✅ ML API is ONLINE" -ForegroundColor Green
    Write-Host "   📡 Response: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ ML API is OFFLINE" -ForegroundColor Red
    Write-Host "   💡 Start it with: cd Predict; python api.py" -ForegroundColor Yellow
}

# 3. Check if Next.js is running
Write-Host "`n3. Checking Next.js server..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✅ Next.js server is ONLINE" -ForegroundColor Green
    Write-Host "   📡 Response: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Next.js server is OFFLINE" -ForegroundColor Red
    Write-Host "   💡 Start it with: npm run dev" -ForegroundColor Yellow
}

# 4. Check database connection
Write-Host "`n4. Checking database..." -ForegroundColor Green
if (Test-Path "prisma\schema.prisma") {
    Write-Host "   ✅ Prisma schema found" -ForegroundColor Green
    Write-Host "   💡 Test DB with: npx prisma studio" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Prisma schema NOT found!" -ForegroundColor Red
}

# 5. Check data check script
Write-Host "`n5. Checking data verification script..." -ForegroundColor Green
$scriptPath = "scripts\check-student-data.ts"
if (Test-Path $scriptPath) {
    Write-Host "   ✅ Data check script exists" -ForegroundColor Green
    Write-Host "   💡 Run with: npx ts-node scripts\check-student-data.ts <student-id>" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Data check script NOT found!" -ForegroundColor Red
}

# Summary
Write-Host "`n=== NEXT STEPS ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. If ML API is offline:" -ForegroundColor Yellow
Write-Host "   cd Predict"
Write-Host "   python api.py"
Write-Host ""
Write-Host "2. If Next.js is offline:" -ForegroundColor Yellow
Write-Host "   npm run dev"
Write-Host ""
Write-Host "3. Check student data:" -ForegroundColor Yellow
Write-Host "   npx ts-node scripts\check-student-data.ts student-temp-id"
Write-Host ""
Write-Host "4. Test in browser:" -ForegroundColor Yellow
Write-Host "   - Login as student (student1/student123)"
Write-Host "   - Open browser console (F12)"
Write-Host "   - Click 'Previous Marks (9 & 10)'"
Write-Host "   - Click 'My O/L Examination Predictions'"
Write-Host "   - Check console logs for detailed info"
Write-Host ""
Write-Host "5. Read detailed documentation:" -ForegroundColor Yellow
Write-Host "   See STUDENT_DATA_FIXES.md for complete troubleshooting guide"
Write-Host ""
Write-Host "=== ALL CHECKS COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
