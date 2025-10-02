# PV Simulator Deployment Guide

This guide explains how to deploy the PV Simulator software to your Raspberry Pi.

## Prerequisites

- Raspberry Pi with Raspberry Pi OS (or compatible Linux distribution)
- SSH access to the Pi
- Internet connection on the Pi

## Quick Deployment

### Option 1: Deploy from Local Machine

1. **Run the deployment script:**
   ```bash
   chmod +x deploy/install.sh
   ./deploy/install.sh
   ```

2. **The script will:**
   - Package the application
   - Copy files to your Pi
   - Install Node.js (if needed)
   - Install dependencies
   - Set up systemd service
   - Start the PV Simulator

### Option 2: Deploy on Pi Directly

1. **Copy files to your Pi:**
   ```bash
   scp -r . oct-dev@17.91.30.165:/home/oct-dev/pv-simulator/
   ```

2. **SSH into your Pi:**
   ```bash
   ssh oct-dev@17.91.30.165
   ```

3. **Run the installation:**
   ```bash
   cd /home/oct-dev/pv-simulator
   chmod +x deploy/install.sh
   ./deploy/install.sh
   ```

## Service Management

### Easy Control with Control Script
```bash
# Use the control script for easy management
./control.sh start      # Start the service
./control.sh stop       # Stop the service
./control.sh restart    # Restart the service
./control.sh status     # Check status and ports
./control.sh logs       # View logs (follow mode)
./control.sh logs-tail  # View last 50 log lines
./control.sh help       # Show all commands
```

### Manual Systemctl Commands
```bash
# Start the service
sudo systemctl start pv-simulator

# Stop the service
sudo systemctl stop pv-simulator

# Restart the service
sudo systemctl restart pv-simulator

# Check status
sudo systemctl status pv-simulator

# View logs
sudo journalctl -u pv-simulator -f
```

### Auto-start Control (Optional)
```bash
# Enable auto-start on boot (NOT recommended - manual control preferred)
sudo systemctl enable pv-simulator

# Disable auto-start (default - manual control)
sudo systemctl disable pv-simulator
```

**Note**: By default, the PV Simulator is installed with manual control only. It will NOT start automatically on boot. You must manually start it when needed.

## Accessing the Application

Once deployed, you can access:

- **Web Dashboard**: http://17.91.30.165:3000
- **REST API**: http://17.91.30.165:3000/api
- **Modbus PV1**: 17.91.30.165:10502
- **Modbus PV2**: 17.91.30.165:10503
- **Modbus Battery**: 17.91.30.165:10504

## Updating the Application

### Using the update script:
```bash
cd /home/oct-dev/pv-simulator
./deploy/update.sh
```

### Manual update:
1. Stop the service: `sudo systemctl stop pv-simulator`
2. Update files
3. Install dependencies: `npm install --production`
4. Start the service: `sudo systemctl start pv-simulator`

## Configuration

The application uses environment variables for configuration. Edit `/home/oct-dev/pv-simulator/.env`:

```env
NODE_ENV=production
PORT=3000
PV1_MODBUS_PORT=10502
PV2_MODBUS_PORT=10503
BATTERY_MODBUS_PORT=10504
LOG_LEVEL=info
```

## Troubleshooting

### Check service status
```bash
sudo systemctl status pv-simulator
```

### View logs
```bash
sudo journalctl -u pv-simulator -f
```

### Check if ports are in use
```bash
sudo netstat -tlnp | grep -E ":(3000|10502|10503|10504)"
```

### Restart service
```bash
sudo systemctl restart pv-simulator
```

## Security Notes

- The service runs as user `oct-dev` (not root)
- Modbus ports (10502-10504) are only accessible from the local network
- Web interface (port 3000) is accessible from any network
- Consider setting up a firewall if needed

## File Structure

```
/home/oct-dev/pv-simulator/
├── src/                    # Application source code
├── config/                 # Configuration files
├── views/                  # Web dashboard templates
├── public/                 # Static web assets
├── deploy/                 # Deployment scripts
├── package.json           # Node.js dependencies
├── .env                   # Environment variables
├── start.sh               # Start script
└── update.sh              # Update script
```

## Support

If you encounter issues:

1. Check the service status: `sudo systemctl status pv-simulator`
2. View logs: `sudo journalctl -u pv-simulator -f`
3. Verify ports are available: `sudo netstat -tlnp | grep -E ":(3000|10502|10503|10504)"`
4. Check file permissions: `ls -la /home/oct-dev/pv-simulator/`
