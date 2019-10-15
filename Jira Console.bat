@echo off
@cd/d "%~dp0"
@title JiraRAC Console

set "Application=%cd%\console.App.js"

if exist "%Application%" (
	node "%Application%" -cmd "getIsue" -args [1, 2, 4, 5] -host "loacalhost:8080" -auth admin:admin -log "./tests/console.test.log"

	echo continue
	timeout /t 10 /nobreak >nul
) else (
	echo Application not exist!
	pause
)
