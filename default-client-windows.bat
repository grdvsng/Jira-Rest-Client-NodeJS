@echo off
title JiraCLI

set "cli_path=%cd%\bin\lib\cli\console.app.js"

node %cli_path% 0

echo Continue...
pause > nul
rm %cd%\_stdout