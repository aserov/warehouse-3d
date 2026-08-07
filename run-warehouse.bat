@echo off
title 3D Warehouse Viewer Launcher
echo Starting 3D Warehouse Visualization Server...
echo.

:: Automatically open default browser after a 2 second delay
start "" http://localhost:3005

:: Start lightweight local static server
npx serve -l 3005

pause