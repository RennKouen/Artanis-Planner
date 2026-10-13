@echo off
title Encerrando Mundo de Artanis
color 0C

echo Encerrando os servidores do Mundo de Artanis...

taskkill /FI "WindowTitle eq Artanis - Backend*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Artanis - Frontend*" /T /F >nul 2>&1

echo.
echo Servidores encerrados.
timeout /t 2 /nobreak >nul
