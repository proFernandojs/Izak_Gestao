@echo off
setlocal

echo ========================================
echo IZAK - ATIVAR INICIALIZACAO AUTOMATICA
echo ========================================
echo.

set "ROOT_DIR=%~dp0"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SRC_FILE=%ROOT_DIR%iniciar-servidor-background.vbs"
set "DST_FILE=%STARTUP_DIR%\Izak - Iniciar Servidor.vbs"

if not exist "%SRC_FILE%" (
  echo [ERRO] Arquivo nao encontrado: "%SRC_FILE%"
  echo.
  pause
  exit /b 1
)

copy /Y "%SRC_FILE%" "%DST_FILE%" >nul
if errorlevel 1 (
  echo [ERRO] Falha ao copiar arquivo para inicializacao do Windows.
  echo Execute este arquivo como usuario que vai usar o sistema.
  echo.
  pause
  exit /b 1
)

echo Inicializacao automatica ativada com sucesso.
echo Arquivo instalado em:
echo %DST_FILE%
echo.
echo Reinicie o Windows para validar o funcionamento.
echo.
pause
