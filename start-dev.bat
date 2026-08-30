@echo off
cd /d "%~dp0"
echo 병원비 조회 앱을 시작합니다...
echo 최신 코드를 받아옵니다 (git pull)...
git pull origin claude/health-insurance-cost-app-112a6b
echo.
echo 서버를 켭니다. 잠시 후 브라우저에서 http://localhost:3000 으로 접속하세요.
echo 종료하려면 이 창에서 Ctrl+C를 누르세요.
echo.
call npm.cmd run dev
pause
