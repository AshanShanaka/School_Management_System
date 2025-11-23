@echo off
echo ============================================
echo Clear Database (Keep Admin User)
echo ============================================
echo.
echo WARNING: This will delete ALL data from the database
echo except the admin user account.
echo.
echo Press Ctrl+C to cancel, or
pause

echo.
echo Starting database cleanup...
echo.

npx tsx scripts/clear-database-keep-admin.ts

echo.
echo ============================================
echo Database cleanup completed!
echo ============================================
echo.
pause
