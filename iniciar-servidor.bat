@echo off
setlocal

echo ========================================
echo IZAK - INICIAR SERVIDOR LOCAL
echo ========================================
echo.

cd /d "%~dp0server"

where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado no PATH.
  echo Instale o Node.js LTS em https://nodejs.org
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Dependencias nao encontradas. Instalando...
  call npm install
  if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias.
    echo.
    pause
    exit /b 1
  )
)

echo Iniciando servidor em http://localhost:3000 ...
echo Para encerrar, pressione Ctrl+C nesta janela.
echo.

node server.js

echo.
echo Servidor encerrado.
pause
