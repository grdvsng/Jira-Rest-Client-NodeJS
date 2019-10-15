@echo off
@title JSDoc

powershell -noexit -c "jsdoc '%cd%' -c '%cd%/conf.json'; exit;"
 
echo continue...
pause
