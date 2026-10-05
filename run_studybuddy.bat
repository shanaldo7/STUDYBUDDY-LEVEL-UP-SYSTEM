@echo off
setlocal enabledelayedexpansion
title StudyBuddy AI - Monarch Hunter Study System

echo =====================================================================
echo           STUDYBUDDY AI - MONARCH HUNTER STUDY SYSTEM
echo              Dark Fantasy Gamified Study Companion
echo =====================================================================
echo.

:: Check for python installation
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not found in your PATH.
    echo Please install Python 3.10+ from python.org and check "Add Python to PATH".
    pause
    exit /b 1
)

:: Navigate to script directory
cd /d "%~dp0"

:: Check for virtual environment or dependencies
if exist "venv\Scripts\activate.bat" (
    echo [INFO] Activating virtual environment...
    call "venv\Scripts\activate.bat"
) else (
    echo [INFO] No local venv found, checking global Python environment...
)

:: Check if streamlit is installed
python -c "import streamlit" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [INFO] Streamlit not detected. Installing dependencies from requirements.txt...
    python -m pip install -r requirements.txt
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Dependency installation failed. Please run: pip install streamlit
        pause
        exit /b 1
    )
)

:: Launch browser in background after short delay
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:8501"

echo [STATUS] Starting Hunter System Protocol on http://localhost:8501 ...
echo [INFO] Press Ctrl+C in this console to stop StudyBuddy AI.
echo.

python -m streamlit run app.py --server.port 8501 --server.headless false

pause
