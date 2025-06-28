@echo off
REM Hatena MCP Server Startup Script
echo 🚀 Starting Hatena MCP Server...

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: Python is not installed or not in PATH
    echo Please install Python from https://python.org/
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist node_modules (
    echo 📦 Installing Node.js dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Node.js dependencies
        pause
        exit /b 1
    )
)

REM Install Python dependencies if needed
if not exist venv (
    echo 🐍 Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

if not exist venv\Lib\site-packages\requests (
    echo 📦 Installing Python dependencies...
    pip install requests python-dotenv
)

REM Check if .env file exists
if not exist .env (
    echo ⚠️  Warning: .env file not found
    echo Please copy .env.example to .env and configure your API keys
    if exist .env.example (
        copy .env.example .env
        echo 📋 Created .env file from template
        echo Please edit .env file with your actual API keys
    )
)

REM Start the MCP server
echo ✅ Starting Hatena MCP Server on stdio...
node src/index.js

REM If we reach here, the server stopped
echo 🔄 MCP Server stopped
pause
