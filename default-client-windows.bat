@echo off
title JiraCLI

set "cli_path=%cd%\bin\lib\cli\console.app.js"

C:\Distrib\node-v12.13.0-win-x64\node.exe %cli_path% 0

echo Continue...
timeout /t 10 /nobreak > nul