#!/bin/bash

# PV Simulator Update Script
# This script updates the PV Simulator to the latest version

echo "🔄 Updating PV Simulator..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please do not run as root. Use: sudo systemctl restart pv-simulator"
    exit 1
fi

# Stop the service
echo "⏹️ Stopping PV Simulator service..."
sudo systemctl stop pv-simulator

# Backup current version
echo "💾 Creating backup..."
BACKUP_DIR="/home/oct-dev/pv-simulator-backup-$(date +%Y%m%d-%H%M%S)"
cp -r /home/oct-dev/pv-simulator "$BACKUP_DIR"
echo "Backup created at: $BACKUP_DIR"

# Update from Git (if available)
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes from Git..."
    git pull origin main
else
    echo "⚠️ No Git repository found. Manual update required."
    echo "Please copy the updated files to /home/oct-dev/pv-simulator/"
    read -p "Press Enter when files have been updated..."
fi

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install --production

# Set permissions
sudo chown -R oct-dev:oct-dev /home/oct-dev/pv-simulator
chmod +x start.sh update.sh

# Start the service
echo "🚀 Starting PV Simulator service..."
sudo systemctl start pv-simulator

# Check status
echo "📊 Service status:"
sudo systemctl status pv-simulator --no-pager

echo "✅ PV Simulator updated successfully!"
echo "🌐 Web Dashboard: http://17.91.30.165:3000"
