@echo off
echo ========================================
echo  Updating Student Attendance Patterns
echo ========================================
echo.

npx ts-node scripts/updateRealisticAttendance.ts

echo.
echo ========================================
echo Press any key to exit...
pause > nul
