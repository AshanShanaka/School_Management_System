@echo off
echo ============================================
echo Generate Realistic Exam Marks
echo ============================================
echo.
echo This will create exam marks for all students
echo across Terms 1, 2, and 3.
echo.
echo Performance distribution:
echo   - 30%% Strong students (70-95 marks)
echo   - 50%% Average students (45-70 marks)  
echo   - 20%% Weak students (20-45 marks)
echo.
pause
echo.
echo Running seed script...
echo.
npx tsx scripts/seedExamMarks.ts
echo.
echo ============================================
echo Script execution completed
echo ============================================
pause
