@echo off
title Mundo de Artanis - Planner
color 0E

echo ============================================
echo   Mundo de Artanis - Iniciando o Planner
echo ============================================
echo.

REM Pega a pasta onde este arquivo esta salvo
set ROOT=%~dp0

echo Iniciando o Backend (porta 3001)...
start "Artanis - Backend" cmd /k "cd /d %ROOT%backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Iniciando o Frontend (porta 5173)...
start "Artanis - Frontend" cmd /k "cd /d %ROOT%frontend && npm run dev"

echo.
echo Aguardando os servidores subirem...
timeout /t 6 /nobreak >nul

echo Abrindo o site no navegador...
start http://localhost:5173

echo.
echo ============================================
echo  Tudo pronto! Duas janelas foram abertas:
echo  - Artanis - Backend
echo  - Artanis - Frontend
echo  NAO feche essas janelas enquanto usar o site.
echo ============================================
echo.
pause
