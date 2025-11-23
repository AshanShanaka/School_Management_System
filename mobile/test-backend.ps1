# Test Backend Connection from Mobile Perspective

Write-Host "🔍 Testing Backend Connection..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if backend is running
Write-Host "Test 1: Checking if backend is accessible..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5
    Write-Host "✅ Backend is running on http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is NOT accessible on http://localhost:3000" -ForegroundColor Red
    Write-Host "   Please start the backend with: npm run dev" -ForegroundColor Yellow
    exit
}

Write-Host ""

# Test 2: Test login with your real users
Write-Host "Test 2: Testing login API with real users..." -ForegroundColor Yellow
Write-Host ""

$users = @(
    @{
        identifier = "ravi.perera@wkcc.lk"
        name = "Ravi Perera"
    },
    @{
        identifier = "kamala.senanayake@wkcc.lk"
        name = "Kamala Senanayake"
    }
)

foreach ($user in $users) {
    Write-Host "Testing user: $($user.name) ($($user.identifier))" -ForegroundColor Cyan
    
    # You need to replace PASSWORD_HERE with the actual password
    $password = Read-Host "Enter password for $($user.identifier)" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
    $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    $body = @{
        identifier = $user.identifier
        password = $plainPassword
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 10
        
        $result = $response.Content | ConvertFrom-Json
        
        if ($result.success -eq $true) {
            Write-Host "✅ Login successful!" -ForegroundColor Green
            Write-Host "   User: $($result.user.name) $($result.user.surname)" -ForegroundColor White
            Write-Host "   Role: $($result.user.role)" -ForegroundColor White
            Write-Host "   Email: $($result.user.email)" -ForegroundColor White
            
            # Check for token in cookies
            $cookies = $response.Headers['Set-Cookie']
            if ($cookies -match 'auth-token=([^;]+)') {
                Write-Host "   Token: $($matches[1].Substring(0, 20))..." -ForegroundColor White
            }
        } else {
            Write-Host "❌ Login failed!" -ForegroundColor Red
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ Login failed with status code: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 401) {
            Write-Host "   Reason: Invalid credentials (wrong password)" -ForegroundColor Yellow
        } else {
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
}

Write-Host "🎯 Testing Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 If login was successful, use the SAME credentials in the mobile app!" -ForegroundColor Green
Write-Host "   Mobile app connects to http://10.0.2.2:3000 (which maps to localhost:3000)" -ForegroundColor Yellow
