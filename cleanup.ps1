# Project Cleanup Script
# Run this script to clean up temporary files and build artifacts
# Usage: .\cleanup.ps1

Write-Host "Starting Project Cleanup..." -ForegroundColor Green

# Remove test scripts
Write-Host "`nRemoving test scripts..." -ForegroundColor Yellow
Remove-Item -Path "test-*.js" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "check-*.js" -Force -ErrorAction SilentlyContinue

# Remove build artifacts
Write-Host "Removing build artifacts..." -ForegroundColor Yellow
Remove-Item -Path "tsconfig.tsbuildinfo" -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

# Remove node_modules (if needed for fresh install)
# Uncomment the next line if you want to remove node_modules
# Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue

# Remove temporary documentation
Write-Host "Removing temporary documentation..." -ForegroundColor Yellow
Remove-Item -Path "*_FIX.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "*_DRAFT.md" -Force -ErrorAction SilentlyContinue

# Clean Python cache (in Predict folder)
Write-Host "Cleaning Python cache..." -ForegroundColor Yellow
if (Test-Path "Predict") {
    Get-ChildItem -Path "Predict" -Include "__pycache__","*.pyc" -Recurse -Force | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
}

Write-Host "`nCleanup completed successfully!" -ForegroundColor Green
Write-Host "You can now run 'npm install' if needed." -ForegroundColor Cyan
