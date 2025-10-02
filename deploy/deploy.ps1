# PV Simulator Deployment Script for Windows PowerShell -> Raspberry Pi
# Target: oct-dev@17.91.30.165

Write-Host "🚀 PV Simulator Deployment Script" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Configuration
$PI_USER = "oct-dev"
$PI_HOST = "17.91.30.165"
$PI_PORT = "22"
$APP_DIR = "/home/$PI_USER/pv-simulator"

Write-Host "📦 Preparing deployment package..." -ForegroundColor Yellow

# Create deployment directory
if (!(Test-Path "deploy\package")) {
    New-Item -ItemType Directory -Path "deploy\package" -Force
}

# Copy application files
Write-Host "📁 Copying application files..." -ForegroundColor Yellow
Copy-Item -Path "src" -Destination "deploy\package\" -Recurse -Force
Copy-Item -Path "config" -Destination "deploy\package\" -Recurse -Force
Copy-Item -Path "views" -Destination "deploy\package\" -Recurse -Force
Copy-Item -Path "public" -Destination "deploy\package\" -Recurse -Force
Copy-Item -Path "package.json" -Destination "deploy\package\" -Force
if (Test-Path "package-lock.json") {
    Copy-Item -Path "package-lock.json" -Destination "deploy\package\" -Force
}
Copy-Item -Path "README.md" -Destination "deploy\package\" -Force
Copy-Item -Path "SETUP.md" -Destination "deploy\package\" -Force

# Copy deployment files
Copy-Item -Path "deploy\pv-simulator.service" -Destination "deploy\package\" -Force
Copy-Item -Path "deploy\start.sh" -Destination "deploy\package\" -Force
Copy-Item -Path "deploy\update.sh" -Destination "deploy\package\" -Force

# Create .env file for Pi
$envContent = @"
NODE_ENV=production
PORT=3000
PV1_MODBUS_PORT=10502
PV2_MODBUS_PORT=10503
BATTERY_MODBUS_PORT=10504
LOG_LEVEL=info
"@
$envContent | Out-File -FilePath "deploy\package\.env" -Encoding UTF8

Write-Host "📦 Creating deployment archive..." -ForegroundColor Yellow
Set-Location deploy
tar -czf pv-simulator.tar.gz -C package .
Set-Location ..

Write-Host "🚀 Deploying to Raspberry Pi..." -ForegroundColor Green
scp -P $PI_PORT "deploy\pv-simulator.tar.gz" "${PI_USER}@${PI_HOST}:/tmp/"

Write-Host "🔧 Installing on Raspberry Pi..." -ForegroundColor Green
$installScript = @"
set -e
sudo mkdir -p /home/oct-dev/pv-simulator
sudo chown oct-dev:oct-dev /home/oct-dev/pv-simulator
cd /home/oct-dev/pv-simulator
tar -xzf /tmp/pv-simulator.tar.gz

if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Installing dependencies..."
npm install --production

echo "Installing systemd service (manual start only)..."
sudo cp pv-simulator.service /etc/systemd/system/
sudo systemctl daemon-reload
# Note: NOT enabling auto-start - manual control only

sudo chown -R oct-dev:oct-dev /home/oct-dev/pv-simulator
chmod +x start.sh update.sh

echo "PV Simulator service installed (manual start only)"
echo "To start: sudo systemctl start pv-simulator"
echo "To stop:  sudo systemctl stop pv-simulator"
echo "To check: sudo systemctl status pv-simulator"

echo "✅ PV Simulator deployed successfully!"
echo "🌐 Web Dashboard: http://17.91.30.165:3000"
echo "📊 REST API: http://17.91.30.165:3000/api"
echo "🔌 Modbus PV1: 17.91.30.165:10502"
echo "🔌 Modbus PV2: 17.91.30.165:10503"
echo "🔌 Modbus Battery: 17.91.30.165:10504"

rm /tmp/pv-simulator.tar.gz
"@

ssh -p $PI_PORT "${PI_USER}@${PI_HOST}" $installScript

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "🌐 Web Dashboard: http://17.91.30.165:3000" -ForegroundColor Cyan
Write-Host "📊 REST API: http://17.91.30.165:3000/api" -ForegroundColor Cyan
Write-Host "🔌 Modbus PV1: 17.91.30.165:10502" -ForegroundColor Cyan
Write-Host "🔌 Modbus PV2: 17.91.30.165:10503" -ForegroundColor Cyan
Write-Host "🔌 Modbus Battery: 17.91.30.165:10504" -ForegroundColor Cyan

Read-Host "Press Enter to continue"
