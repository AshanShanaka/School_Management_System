@echo off
echo ========================================
echo   Attendance Data Seeding Script
echo ========================================
echo.
echo This will generate realistic attendance data:
echo   - Last 90 school days (excluding weekends)
echo   - 30%% Excellent attendance (95%%+)
echo   - 50%% Good attendance (85-95%%)
echo   - 15%% Average attendance (75-85%%)
echo   - 5%%  Poor attendance (65-75%%)
echo.
echo Patterns include:
echo   - Sick leave patterns
echo   - Consecutive absences (up to 3 days)
echo   - Late arrivals (10%% probability)
echo   - Realistic distribution
echo.
pause
echo.
echo Running attendance seeding script...
echo.
npx tsx scripts/seedAttendance.ts
echo.
echo ========================================
echo   Seeding Complete!
echo ========================================
pause
