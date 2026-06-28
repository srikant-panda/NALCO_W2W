@echo off
REM ============================================
REM NALCO W2W - FULL STACK SETUP (Windows)
REM Run this in the PROJECT_FILES folder
REM ============================================

echo.
echo ============================================================
echo    🏭 NALCO WASTE-TO-WEALTH — FULL STACK SETUP
echo ============================================================
echo.

echo [1/5] Installing backend dependencies...
cd nalco-w2w-backend
call npm install
if errorlevel 1 goto error

echo.
echo [2/5] Creating .env file...
copy /y .env.example .env

echo.
echo [3/5] Running database migrations (creating 12 tables)...
call npx prisma migrate dev --name init

echo.
echo [4/5] Seeding database (6 streams, 8 buyers, 8 batches, 1 admin)...
node seed.js
if errorlevel 1 goto error

echo.
echo [5/5] Starting backend server...
echo.
echo ============================================================
echo    ✅ Backend running on http://localhost:4000
echo    🔐 Login: admin@nalco.in / admin123
echo    💡 KEEP THIS TERMINAL OPEN. Open a NEW terminal for frontend.
echo ============================================================
echo.

call npm run dev

goto end

:error
echo.
echo ============================================================
echo    ❌ ERROR: Something went wrong.
echo    💡 Make sure PostgreSQL is running locally on port 5432
echo    💡 Or run Docker first (see README_SEED_FIX.md)
echo ============================================================
echo.
pause

:end
