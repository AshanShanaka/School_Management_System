@echo off
echo Starting School Management System...
echo.
echo Please wait while the server starts...
echo.
cd /d "C:\Users\User\OneDrive\Desktop\Projects\Final Year\FYP\school_management_system"
start "School Management System" cmd /k "npm run dev"
echo.
echo Server is starting in a new window...
echo.
echo Once the server is running:
echo 1. Open your browser and go to: http://localhost:3000
echo 2. Login with admin credentials:
echo    Username: admin
echo    Password: admin123
echo 3. Click on Teachers, Students, or Parents from the sidebar
echo.
echo Press any key to open browser automatically...
pause >nul
start http://localhost:3000
