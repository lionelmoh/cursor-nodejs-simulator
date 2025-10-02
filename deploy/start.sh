#!/bin/bash

# PV Simulator Start Script
# This script starts the PV Simulator service

echo "🚀 Starting PV Simulator..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please do not run as root. Use: sudo systemctl start pv-simulator"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
fi

# Start the application
echo "🌱 Starting PV Simulator server..."
node src/server.js
