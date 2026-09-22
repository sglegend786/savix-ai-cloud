@echo off
echo Starting all SAVIX projects...

echo 0. Starting Central Auth Server (Port 4000)...
start "Central Auth Server" cmd /k "cd /d "%~dp0central_auth" && npm install && node server.js"

echo 1. Starting Health Scheme Navigator (Backend)...
start "Health Scheme Backend" cmd /k "cd /d "%~dp0health scheme navigator\backend" && npm install && npm start"

echo 2. Starting Health Scheme Navigator (Frontend)...
start "Health Scheme Frontend" cmd /k "cd /d "%~dp0health scheme navigator\frontend" && npm install && npm run dev"

echo 3. Starting Medial Finance and Insurance...
start "Medial Finance" cmd /k "cd /d "%~dp0medial finance and insurance\savix_ai" && py -m pip install -r requirements.txt && py app.py"

echo 4. Starting Daily Health Planer...
start "Daily Health Planer" cmd /k "cd /d "%~dp0daily health planer" && py -m pip install -r requirements.txt && py app.py"

echo 5. Starting Savitri Pharmacy (Backend)...
start "Pharmacy Backend" cmd /k "cd /d "%~dp0pharm\savitri-backend" && npm install && npm start"

echo 6. Starting Savitri Pharmacy (Frontend)...
start "Pharmacy Frontend" cmd /k "cd /d "%~dp0pharm\savitri-frontend" && npm install && npm run dev"

echo 7. Starting Hospital Management...
start "Hospital Management" cmd /k "cd "%~dp0hospital_management" && py -m pip install -r requirements.txt && py app.py"

echo 8. Starting Main UI Server (Port 8080)...
start "Main UI Server" cmd /k "cd /d "%~dp0" && py -m http.server 8080"

echo.
echo =============================================
echo All projects launching! Please wait 30-60 seconds.
echo.
echo MAIN UI:      http://127.0.0.1:8080/index.html
echo Central Auth: http://localhost:4000
echo Pharmacy:     http://127.0.0.1:3001
echo Finance:      http://127.0.0.1:5001
echo Planner:      http://127.0.0.1:5000
echo Hospital:     http://127.0.0.1:5004
echo Scheme:       http://localhost:5173
echo =============================================

timeout /t 8 /nobreak
start http://127.0.0.1:8080/index.html

pause
