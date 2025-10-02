#!/bin/bash

# PV Simulator Deployment Script for Raspberry Pi
# Target: oct-dev@17.91.30.165

set -e

echo "🚀 PV Simulator Deployment Script"
echo "=================================="

# Configuration
PI_USER="oct-dev"
PI_HOST="17.91.30.165"
PI_PORT="22"
APP_DIR="/home/$PI_USER/pv-simulator"
SERVICE_NAME="pv-simulator"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're running on the Pi or locally
if [[ "$HOSTNAME" == *"raspberrypi"* ]] || [[ "$(hostname -I)" == *"17.91.30.165"* ]]; then
    print_status "Running on Raspberry Pi - local installation"
    IS_PI=true
else
    print_status "Running locally - will deploy to Pi"
    IS_PI=false
fi

if [ "$IS_PI" = false ]; then
    print_status "Preparing deployment package..."
    
    # Create deployment directory
    mkdir -p deploy/package
    
    # Copy application files
    print_status "Copying application files..."
    cp -r src deploy/package/
    cp -r config deploy/package/
    cp -r views deploy/package/
    cp -r public deploy/package/
    cp package.json deploy/package/
    cp package-lock.json deploy/package/ 2>/dev/null || true
    cp README.md deploy/package/
    cp SETUP.md deploy/package/
    
        # Copy deployment files
        cp deploy/pv-simulator.service deploy/package/
        cp deploy/start.sh deploy/package/
        cp deploy/update.sh deploy/package/
        cp deploy/control.sh deploy/package/
    
    # Create .env file for Pi
    cat > deploy/package/.env << EOF
NODE_ENV=production
PORT=3000
PV1_MODBUS_PORT=10502
PV2_MODBUS_PORT=10503
BATTERY_MODBUS_PORT=10504
LOG_LEVEL=info
EOF
    
    print_status "Creating deployment archive..."
    cd deploy
    tar -czf pv-simulator.tar.gz -C package .
    cd ..
    
    print_status "Deploying to Raspberry Pi..."
    scp -P $PI_PORT deploy/pv-simulator.tar.gz $PI_USER@$PI_HOST:/tmp/
    
    print_status "Installing on Raspberry Pi..."
    ssh -p $PI_PORT $PI_USER@$PI_HOST << 'EOF'
        set -e
        
        # Create application directory
        sudo mkdir -p /home/oct-dev/pv-simulator
        sudo chown oct-dev:oct-dev /home/oct-dev/pv-simulator
        
        # Extract application
        cd /home/oct-dev/pv-simulator
        tar -xzf /tmp/pv-simulator.tar.gz
        
        # Install Node.js if not present
        if ! command -v node &> /dev/null; then
            echo "Installing Node.js..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
        
        # Install dependencies
        echo "Installing dependencies..."
        npm install --production
        
        # Install systemd service (manual start only)
        echo "Installing systemd service..."
        sudo cp pv-simulator.service /etc/systemd/system/
        sudo systemctl daemon-reload
        # Note: NOT enabling auto-start - manual control only
        
        # Set permissions
        sudo chown -R oct-dev:oct-dev /home/oct-dev/pv-simulator
        chmod +x start.sh update.sh control.sh control.sh
        
        # Note: Service installed but not started - manual control
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
        
        # Cleanup
        rm /tmp/pv-simulator.tar.gz
EOF

else
    print_status "Running installation on Raspberry Pi..."
    
    # Install Node.js if not present
    if ! command -v node &> /dev/null; then
        print_status "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm install --production
    
    # Install systemd service (manual start only)
    print_status "Installing systemd service..."
    sudo cp pv-simulator.service /etc/systemd/system/
    sudo systemctl daemon-reload
    # Note: NOT enabling auto-start - manual control only
    
    # Set permissions
    sudo chown -R $PI_USER:$PI_USER $APP_DIR
    chmod +x start.sh update.sh control.sh
    
    # Note: Service installed but not started - manual control
    print_status "PV Simulator service installed (manual start only)"
    print_status "To start: sudo systemctl start pv-simulator"
    print_status "To stop:  sudo systemctl stop pv-simulator"
    print_status "To check: sudo systemctl status pv-simulator"
    
    print_status "✅ PV Simulator installed successfully!"
    print_status "🌐 Web Dashboard: http://17.91.30.165:3000"
    print_status "📊 REST API: http://17.91.30.165:3000/api"
    print_status "🔌 Modbus PV1: 17.91.30.165:10502"
    print_status "🔌 Modbus PV2: 17.91.30.165:10503"
    print_status "🔌 Modbus Battery: 17.91.30.165:10504"
fi

print_status "Deployment completed!"
