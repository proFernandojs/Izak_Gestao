@echo off
setlocal

echo ========================================
echo IZAK - INSTALADOR LOCAL DO CLIENTE
echo ========================================
echo.

set "ROOT_DIR=%~dp0"
set "SERVER_DIR=%ROOT_DIR%server"
set "STARTUP_SCRIPT=%ROOT_DIR%ativar-inicializacao-windows.bat"
set "BACKUP_SCRIPT=%ROOT_DIR%backup-dados.bat"
set "START_SCRIPT=%ROOT_DIR%iniciar-servidor.bat"
set "DESKTOP_DIR=%USERPROFILE%\Desktop"

if not exist "%SERVER_DIR%" (
  echo [ERRO] Pasta server nao encontrada em:
  echo %SERVER_DIR%
  echo.
  pause
  exit /b 1
)

echo [1/5] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado no PATH.
  echo Instale Node.js LTS em https://nodejs.org e rode novamente.
  echo.
  pause
  exit /b 1
)

echo [2/5] Instalando dependencias do servidor...
cd /d "%SERVER_DIR%"
call npm install
if errorlevel 1 (
  echo [ERRO] Falha no npm install.
  echo.
  pause
  exit /b 1
)

echo [3/5] Ativando inicializacao automatica no Windows...
if exist "%STARTUP_SCRIPT%" (
  call "%STARTUP_SCRIPT%" <nul
) else (
  echo [AVISO] Nao foi encontrado: %STARTUP_SCRIPT%
)

echo [4/5] Criando atalho de backup na area de trabalho...
powershell -NoProfile -Command "$desk=[Environment]::GetFolderPath('Desktop'); $s=(New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $desk 'Izak - Backup.lnk')); $s.TargetPath='cmd.exe'; $s.Arguments='/c """%BACKUP_SCRIPT%"""'; $s.WorkingDirectory='%ROOT_DIR%'; $s.IconLocation='shell32.dll,258'; $s.Save()" >nul 2>&1
if errorlevel 1 (
  echo [AVISO] Nao foi possivel criar atalho de backup automaticamente.
)

echo [5/6] Criando atalho para iniciar servidor na area de trabalho...
powershell -NoProfile -Command "$desk=[Environment]::GetFolderPath('Desktop'); $s=(New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $desk 'Izak - Iniciar Servidor.lnk')); $s.TargetPath='cmd.exe'; $s.Arguments='/c """%START_SCRIPT%"""'; $s.WorkingDirectory='%ROOT_DIR%'; $s.IconLocation='shell32.dll,14'; $s.Save()" >nul 2>&1
if errorlevel 1 (
  echo [AVISO] Nao foi possivel criar atalho de inicializacao automaticamente.
)

echo [6/6] Criando atalho para abrir o GraficaHome no navegador...
powershell -NoProfile -Command "$desk=[Environment]::GetFolderPath('Desktop'); $path=Join-Path $desk 'Izak - Abrir GraficaHome.url'; @('[InternetShortcut]','URL=http://localhost:3000/login.html','IconFile=C:\Windows\System32\shell32.dll','IconIndex=1') | Out-File -FilePath $path -Encoding ASCII" >nul 2>&1
if errorlevel 1 (
  echo [AVISO] Nao foi possivel criar atalho do navegador automaticamente.
)

echo.
echo ========================================
echo INSTALACAO CONCLUIDA
echo ========================================
echo.
echo Proximos passos:
echo 1) Reinicie o Windows para validar a inicializacao automatica.
echo 2) Abra no navegador do servidor: http://localhost:3000/login.html
echo 3) Nos outros PCs da rede: http://IP-DO-SERVIDOR:3000/login.html
echo.
pause
