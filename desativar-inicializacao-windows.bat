@echo off
setlocal

echo ========================================
echo IZAK - DESATIVAR INICIALIZACAO AUTOMATICA
echo ========================================
echo.

set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "DST_FILE=%STARTUP_DIR%\Izak - Iniciar Servidor.vbs"

if exist "%DST_FILE%" (
  del /F /Q "%DST_FILE%"
)

if exist "%DST_FILE%" (
  echo [ERRO] Nao foi possivel remover o arquivo de inicializacao.
  echo.
  pause
  exit /b 1
)

echo Inicializacao automatica desativada.
echo.
pause
