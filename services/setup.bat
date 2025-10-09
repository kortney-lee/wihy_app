@echo off
setlocal enabledelayedexpansion

echo 🚀 Welcome to vHealth Services Setup!
echo ======================================

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16 or higher.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo ✅ npm detected

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Check if .env exists, if not create from template
if not exist ".env" (
    echo.
    echo 🔧 Creating environment configuration...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ Created .env from template
        echo ⚠️  Please edit .env file with your configuration
    ) else (
        echo ❌ .env.example not found
    )
) else (
    echo ✅ .env file already exists
)

REM Final instructions
echo.
echo 🎉 Setup completed successfully!
echo ================================
echo.
echo Next steps:
echo 1. Edit .env file with your configuration
echo 2. Start the development server: npm run dev
echo 3. Or start production server: npm start
echo.
echo API will be available at: http://localhost:5000
echo Health check: http://localhost:5000/api/health
echo.
echo 📚 For more information, see README.md
echo 🚀 Happy coding!
echo.
pause