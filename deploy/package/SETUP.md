# PV Simulator Setup Guide

## Quick Start

1. **Clone the Repository**
   ```bash
   git clone https://github.com/lionelmoh/cursor-nodejs-simulator.git
   cd cursor-nodejs-simulator
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Test the System**
   ```bash
   node test-system.js
   ```

4. **Start the Simulator**
   ```bash
   npm start
   ```

5. **Access the Dashboard**
   - Open http://localhost:3000 in your browser
   - Monitor real-time data from all systems
   - View 3-phase grid monitoring and cell-level battery data

## System Overview

The PV Simulator provides:

- **PV1 System**: 50kW Huawei inverter simulation (Port 10502)
- **PV2 System**: 50kW Huawei inverter simulation (Port 10503)  
- **Battery System**: 100kW PCS with 200kWh capacity (Port 10504)
- **Web Dashboard**: Real-time monitoring interface with 3-phase grid data
- **REST API**: Programmatic access to all data
- **Modbus TCP Servers**: Stable connections with proper error handling
- **Cell-Level Monitoring**: 17 modules × 8 Lithium NMC cells each

## Features

### Solar Calculator
- Realistic power generation based on time of day and solar irradiance
- 7 active MPPT channels out of 24 total (600V nominal)
- Temperature effects and efficiency calculations
- Daily energy yield tracking
- 3-phase grid parameters simulation (240V ± 1%, 50Hz ± 0.5%)
- Proper electrical sign conventions (positive current/power for generation)
- Bounds checking to prevent invalid values

### Battery Calculator
- 200kWh battery capacity (17 modules × 8 Lithium NMC cells each)
- 100kW PCS power conversion system
- Peak shaving logic for intelligent load management
- Cell-level monitoring (136 individual cells)
- SOC and SOH management with real-time tracking
- 3-phase grid interaction simulation
- Proper electrical sign conventions:
  - Positive power = discharge (power flowing out of battery)
  - Negative power = charge (power flowing into battery)
  - Negative load power = consumption

### Modbus TCP Servers
- Custom Modbus TCP implementation with stable connections
- Read Input Registers (Function Code 0x04)
- 16-bit and 32-bit data types with proper validation
- Big-endian byte order
- Real-time data updates with bounds checking
- Error handling and recovery mechanisms
- No more connection disconnections

### Web Dashboard
- Real-time data visualization with auto-refresh
- MPPT channel monitoring with proper current values
- 3-phase grid voltage and current monitoring
- Cell-level battery monitoring (voltage, temperature)
- System status indicators and alarms
- Responsive design for all screen sizes
- Peak shaving status and load management display

## API Endpoints

- `GET /api/pv1/data` - PV1 system data
- `GET /api/pv2/data` - PV2 system data
- `GET /api/battery/data` - Battery system data
- `GET /api/all/data` - All systems data
- `GET /api/status` - System status
- `GET /api/config` - Configuration

## Modbus Testing

Test the Modbus servers using modpoll:

```bash
# Test PV1 system
modpoll -m tcp -a 1 -r 32016 -c 10 localhost 10502

# Test PV2 system
modpoll -m tcp -a 1 -r 32016 -c 10 localhost 10503

# Test Battery system
modpoll -m tcp -a 1 -r 40001 -c 10 localhost 10504
```

## Configuration

Edit `config/system-config.js` to modify:
- Solar panel specifications
- Inverter parameters
- Battery system settings
- Load profiles

Edit `config/modbus-config.js` to modify:
- Port numbers
- Register mappings
- Data scaling factors

## Recent Fixes & Improvements

### ✅ **Energy Flow Sign Conventions Fixed**
- PV current and power now properly positive (generation)
- Battery discharge positive, charge negative
- Load power negative (consumption)
- Grid power positive when exporting, negative when importing

### ✅ **Modbus Server Stability Fixed**
- No more connection disconnections
- Proper value validation and bounds checking
- All values within 16-bit unsigned integer range (0-65535)
- Robust error handling and recovery

### ✅ **PV System Improvements**
- Fixed MPPT current calculation (no more Infinity values)
- Added bounds checking to prevent division by zero
- Proper voltage thresholds for current calculation
- Realistic power generation simulation

### ✅ **Battery System Enhancements**
- Cell-level monitoring for 136 individual cells
- Peak shaving logic for intelligent load management
- 3-phase grid voltage and current simulation
- Real-time SOC, SOH, and temperature tracking

## Troubleshooting

1. **Port conflicts**: Ensure ports 3000, 10502, 10503, 10504 are available
2. **Dependencies**: Run `npm install` to install required packages
3. **Permissions**: Ensure Node.js has permission to bind to the ports
4. **Firewall**: Check firewall settings for port access
5. **Modbus connections**: Use the test script to verify server stability
6. **Data validation**: All values are now properly bounded and validated

## Development

- `npm run dev` - Start with nodemon for development
- `npm test` - Run test suite
- `npm run build` - Build for production

## Support

For issues and questions:
- Check the console output for error messages
- Verify all dependencies are installed
- Test individual components using the test script
