# CLEANUP SCRIPT - Remove unwanted files and clean project
# Run as: .\cleanup-project.ps1

Write-Host "=== SCHOOL MANAGEMENT SYSTEM - PROJECT CLEANUP ===" -ForegroundColor Cyan
Write-Host ""

$rootPath = "c:\Users\User\OneDrive\Desktop\Projects\Final Year\FYP\school_management_system"
Set-Location $rootPath

# 1. Remove backup files
Write-Host "[1/6] Removing backup files..." -ForegroundColor Yellow
$backupPatterns = @("*.backup", "*.bak", "*.old", "*-OLD-BACKUP.*", "*-FIXED.*")
$backupCount = 0
foreach ($pattern in $backupPatterns) {
    $files = Get-ChildItem -Path . -Recurse -Include $pattern -File -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Write-Host "  Removing: $($file.FullName)" -ForegroundColor Gray
        Remove-Item $file.FullName -Force
        $backupCount++
    }
}
Write-Host "  Removed $backupCount backup file(s)" -ForegroundColor Green

# 2. Remove duplicate/test files in Predict folder
Write-Host "[2/6] Cleaning Predict folder..." -ForegroundColor Yellow
if (Test-Path ".\Predict") {
    $predictTestFiles = @(
        ".\Predict\test_*.py",
        ".\Predict\demo*.py",
        ".\Predict\simple_*.py",
        ".\Predict\basic_*.py",
        ".\Predict\interactive_*.py",
        ".\Predict\web_interface.py",
        ".\Predict\*.html",
        ".\Predict\Untitled*.ipynb",
        ".\Predict\*.json" # Except config if needed
    )
    
    $predictCount = 0
    foreach ($pattern in $predictTestFiles) {
        if (Test-Path $pattern) {
            Remove-Item $pattern -Force
            Write-Host "  Removed: $pattern" -ForegroundColor Gray
            $predictCount++
        }
    }
    Write-Host "  Removed $predictCount test/demo file(s) from Predict folder" -ForegroundColor Green
}

# 3. Remove notebook files
Write-Host "[3/6] Removing Jupyter notebooks..." -ForegroundColor Yellow
$notebooks = Get-ChildItem -Path . -Recurse -Include "*.ipynb" -File -ErrorAction SilentlyContinue
$notebookCount = 0
foreach ($notebook in $notebooks) {
    Write-Host "  Removing: $($notebook.FullName)" -ForegroundColor Gray
    Remove-Item $notebook.FullName -Force
    $notebookCount++
}
Write-Host "  Removed $notebookCount notebook file(s)" -ForegroundColor Green

# 4. Clean node_modules cache and .next
Write-Host "[4/6] Cleaning build caches..." -ForegroundColor Yellow
if (Test-Path ".\.next") {
    Write-Host "  Removing .next folder..." -ForegroundColor Gray
    Remove-Item ".\.next" -Recurse -Force
    Write-Host "  .next folder removed" -ForegroundColor Green
}

# 5. Clean Python cache
Write-Host "[5/6] Cleaning Python cache..." -ForegroundColor Yellow
$pycache = Get-ChildItem -Path . -Recurse -Include "__pycache__" -Directory -ErrorAction SilentlyContinue
$cacheCount = 0
foreach ($cache in $pycache) {
    Write-Host "  Removing: $($cache.FullName)" -ForegroundColor Gray
    Remove-Item $cache.FullName -Recurse -Force
    $cacheCount++
}
Write-Host "  Removed $cacheCount __pycache__ folder(s)" -ForegroundColor Green

# 6. List remaining prediction-related files
Write-Host "[6/6] Verifying Predict folder structure..." -ForegroundColor Yellow
if (Test-Path ".\Predict") {
    Write-Host "  Essential files:" -ForegroundColor Cyan
    Get-ChildItem ".\Predict" -File | ForEach-Object {
        Write-Host "    ✓ $($_.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== CLEANUP COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run dev" -ForegroundColor White
Write-Host "2. Ensure Python ML API is running: cd Predict ; python api.py" -ForegroundColor White
Write-Host "3. Test predictions at /student/ol-prediction" -ForegroundColor White
Write-Host ""
