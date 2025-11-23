@echo off
echo ========================================
echo Seeding Historical Marks (Grade 9 & 10)
echo For Grade 11-A Students
echo ========================================
echo.

echo Running seed script...
npx ts-node scripts/seedHistoricalMarks.ts

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo ✓ Historical marks seeded successfully!
    echo ========================================
    echo.
    echo Grade 9 & 10 marks have been generated
    echo for all Grade 11-A students.
    echo.
) else (
    echo.
    echo ========================================
    echo ✗ Error seeding historical marks
    echo ========================================
    echo.
)

pause
