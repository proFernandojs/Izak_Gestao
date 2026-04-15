@echo off
setlocal

echo ========================================
echo IZAK - BACKUP DE DADOS LOCAIS
echo ========================================
echo.

set "ROOT_DIR=%~dp0"
set "DATA_DIR=%ROOT_DIR%server\data"
set "BACKUP_BASE=%ROOT_DIR%backups"

if not exist "%DATA_DIR%" (
  echo [ERRO] Pasta de dados nao encontrada: "%DATA_DIR%"
  echo.
  pause
  exit /b 1
)

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "STAMP=%%i"
set "DEST_DIR=%BACKUP_BASE%\%STAMP%"

mkdir "%DEST_DIR%" >nul 2>&1

if exist "%DATA_DIR%\users.json" (
  copy /Y "%DATA_DIR%\users.json" "%DEST_DIR%\users.json" >nul
) else (
  echo [AVISO] users.json nao encontrado.
)

if exist "%DATA_DIR%\app-data.json" (
  copy /Y "%DATA_DIR%\app-data.json" "%DEST_DIR%\app-data.json" >nul
) else (
  echo [AVISO] app-data.json nao encontrado.
)

echo Backup concluido em:
echo %DEST_DIR%
echo.
pause
