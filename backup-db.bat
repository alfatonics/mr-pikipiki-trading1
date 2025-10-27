@echo off
REM MR PIKIPIKI TRADING - Database Backup Script
REM Run this daily using Windows Task Scheduler

set BACKUP_DIR=C:\backups\mr-pikipiki
set DATE=%date:~-4,4%%date:~-10,2%%date:~-7,2%
set TIME=%time:~0,2%%time:~3,2%%time:~6,2%
set TIME=%TIME: =0%

echo ========================================
echo MR PIKIPIKI TRADING - Database Backup
echo ========================================
echo Date: %DATE%
echo Time: %TIME%
echo.

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%BACKUP_DIR%\%DATE%" mkdir "%BACKUP_DIR%\%DATE%"

echo Creating database backup...
mongodump --uri="mongodb://localhost:27017/mr-pikipiki-trading" --out="%BACKUP_DIR%\%DATE%\backup_%TIME%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✓ Backup completed successfully!
    echo Location: %BACKUP_DIR%\%DATE%\backup_%TIME%
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ✗ Backup failed!
    echo Error code: %ERRORLEVEL%
    echo ========================================
)

REM Optional: Delete backups older than 30 days
REM forfiles /p "%BACKUP_DIR%" /s /m *.* /d -30 /c "cmd /c del @path"

echo.
pause


