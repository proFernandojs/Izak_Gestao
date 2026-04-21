@echo off
setlocal enabledelayedexpansion

echo ========================================
echo IZAK - INICIAR SERVIDOR LOCAL
echo ========================================
echo.

REM Obter o diretorio do script
for %%I in ("%~dp0.") do set "SCRIPT_DIR=%%~fI"
set "SERVER_DIR=%SCRIPT_DIR%\server"

REM Verificar se o arquivo server.js existe
if not exist "%SERVER_DIR%\server.js" (
  echo ERRO: Nao foi possivel encontrar a pasta server.
  echo.
  echo Certifique-se de que este arquivo esteja na pasta do projeto
  echo Caminho atual: %SCRIPT_DIR%
  echo.
  pause
  exit /b 1
)

REM Navegar para o diretorio do servidor
cd /d "%SERVER_DIR%"

if errorlevel 1 (
  echo ERRO: Nao foi possivel acessar o diretorio do servidor.
  echo.
  pause
  exit /b 1
)

REM Verificar se Node.js esta instalado
where node >nul 2>&1
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado no PATH.
  echo Instale o Node.js LTS em https://nodejs.org
  echo.
  pause
  exit /b 1
)

REM Verificar se node_modules existe, senao instalar
if not exist "node_modules" (
  echo Dependencias nao encontradas. Instalando...
  echo.
  call npm install
  if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias.
    echo.
    pause
    exit /b 1
  )
  echo.
)

REM Iniciar o servidor
echo Iniciando servidor em http://localhost:3000
echo Para encerrar, pressione Ctrl+C nesta janela.
echo.

call node server.js

echo.
echo Servidor encerrado.
pause
