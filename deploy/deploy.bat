@echo off
REM PV Simulator Deployment Script for Windows -> Raspberry Pi
REM Target: oct-dev@17.91.30.165

echo 🚀 PV Simulator Deployment Script
echo ==================================

REM Configuration
set PI_USER=oct-dev
set PI_HOST=17.91.30.165
set PI_PORT=22
set APP_DIR=/home/%PI_USER%/pv-simulator

echo 📦 Preparing deployment package...

REM Create deployment directory
if not exist "deploy\package" mkdir deploy\package

REM Copy application files
echo 📁 Copying application files...
xcopy /E /I /Y src deploy\package\src
xcopy /E /I /Y config deploy\package\config
xcopy /E /I /Y views deploy\package\views
xcopy /E /I /Y public deploy\package\public
copy package.json deploy\package\
if exist package-lock.json copy package-lock.json deploy\package\
copy README.md deploy\package\
copy SETUP.md deploy\package\

REM Copy deployment files
copy deploy\pv-simulator.service deploy\package\
copy deploy\start.sh deploy\package\
copy deploy\update.sh deploy\package\

REM Create .env file for Pi
echo NODE_ENV=production > deploy\package\.env
echo PORT=3000 >> deploy\package\.env
echo PV1_MODBUS_PORT=10502 >> deploy\package\.env
echo PV2_MODBUS_PORT=10503 >> deploy\package\.env
echo BATTERY_MODBUS_PORT=10504 >> deploy\package\.env
echo LOG_LEVEL=info >> deploy\package\.env

echo 📦 Creating deployment archive...
cd deploy
tar -czf pv-simulator.tar.gz -C package .
cd ..

echo 🚀 Deploying to Raspberry Pi...
scp -P %PI_PORT% deploy\pv-simulator.tar.gz %PI_USER%@%PI_HOST%:/tmp/

echo 🔧 Installing on Raspberry Pi...
ssh -p %PI_PORT% %PI_USER%@%PI_HOST% "set -e && sudo mkdir -p /home/oct-dev/pv-simulator && sudo chown oct-dev:oct-dev /home/oct-dev/pv-simulator && cd /home/oct-dev/pv-simulator && tar -xzf /tmp/pv-simulator.tar.gz && if ! command -v node &> /dev/null; then echo 'Installing Node.js...' && curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs; fi && echo 'Installing dependencies...' && npm install --production && echo 'Installing systemd service (manual start only)...' && sudo cp pv-simulator.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo chown -R oct-dev:oct-dev /home/oct-dev/pv-simulator && chmod +x start.sh update.sh && echo 'PV Simulator service installed (manual start only)' && echo 'To start: sudo systemctl start pv-simulator' && echo 'To stop:  sudo systemctl stop pv-simulator' && echo 'To check: sudo systemctl status pv-simulator' && echo '✅ PV Simulator deployed successfully!' && echo '🌐 Web Dashboard: http://17.91.30.165:3000' && echo '📊 REST API: http://17.91.30.165:3000/api' && echo '🔌 Modbus PV1: 17.91.30.165:10502' && echo '🔌 Modbus PV2: 17.91.30.165:10503' && echo '🔌 Modbus Battery: 17.91.30.165:10504' && rm /tmp/pv-simulator.tar.gz"

echo ✅ Deployment completed!
echo 🌐 Web Dashboard: http://17.91.30.165:3000
echo 📊 REST API: http://17.91.30.165:3000/api
echo 🔌 Modbus PV1: 17.91.30.165:10502
echo 🔌 Modbus PV2: 17.91.30.165:10503
echo 🔌 Modbus Battery: 17.91.30.165:10504

pause
