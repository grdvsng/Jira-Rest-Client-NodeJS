@echo off
title JiraCLI


node "%cd%\__main__.js" 0

echo Continue...
pause > nul
rm %cd%\_stdout