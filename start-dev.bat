@echo off
cd /d "%~dp0"
echo 병원비 조회 앱을 시작합니다...
echo 최신 코드를 받아옵니다 (git pull)...
git pull origin claude/health-insurance-cost-app-112a6b

echo.
echo 서버를 켭니다...
start "병원비 조회 서버 (끄려면 이 창에서 Ctrl+C)" cmd /k "npm.cmd run dev"

echo 잠시 후 브라우저를 자동으로 엽니다...
timeout /t 8 /nobreak >nul
start http://localhost:3000

echo.
echo 브라우저가 자동으로 안 열리면 주소창에 http://localhost:3000 을 직접 입력하세요.
echo 이 창은 닫아도 됩니다. 서버를 끄려면 새로 열린 검은 창에서 Ctrl+C를 누르세요.
pause
