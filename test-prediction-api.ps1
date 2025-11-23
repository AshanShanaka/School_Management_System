# Test ML Prediction API
# Run this to test if the API is working correctly

Write-Host "Testing ML Prediction API..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:5000/health" -Method Get
    Write-Host "   Status: " -NoNewline
    Write-Host "OK" -ForegroundColor Green
    Write-Host "   Model Loaded: $($health.model_loaded)" -ForegroundColor Green
} catch {
    Write-Host "   Status: " -NoNewline
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Student Prediction
Write-Host "2. Testing Student Prediction..." -ForegroundColor Yellow

$testData = @{
    subjects = @(
        @{
            name = "Mathematics"
            marks = @(75, 78, 80, 82, 85)
        },
        @{
            name = "Science"
            marks = @(70, 72, 75, 78, 80)
        },
        @{
            name = "English"
            marks = @(65, 68, 70, 72, 75)
        }
    )
    attendance = 85
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/predict/student" -Method Post -Body $testData -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "   Status: " -NoNewline
        Write-Host "SUCCESS" -ForegroundColor Green
        Write-Host "   Risk Level: $($response.data.risk_level)" -ForegroundColor Cyan
        Write-Host "   Overall Average: $($response.data.overall_average)%" -ForegroundColor Cyan
        Write-Host "   Subject Predictions:" -ForegroundColor Cyan
        
        foreach ($pred in $response.data.subject_predictions) {
            Write-Host "     - $($pred.subject): $($pred.predicted_mark)% (Grade: $($pred.predicted_grade))" -ForegroundColor White
        }
    } else {
        Write-Host "   Status: " -NoNewline
        Write-Host "FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "   Status: " -NoNewline
    Write-Host "ERROR" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test completed!" -ForegroundColor Green
