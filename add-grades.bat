@echo off
echo ============================================
echo Add Grades 9, 11, 12 to Database
echo ============================================
echo.
echo This will add Grade 9, 11, and 12 to your database
echo.
pause

echo.
echo Adding grades...
echo.

npx tsx scripts/seed-grades-9-11-12.ts

echo.
echo ============================================
echo Grades added successfully!
echo ============================================
echo.
pause
