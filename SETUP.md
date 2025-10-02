# PV Simulator Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Test the System**
   ```bash
   node test-system.js
   ```

3. **Start the Simulator**
   ```bash
   npm start
   ```

4. **Access the Dashboard**
   - Open http://localhost:3000 in your browser
   - Monitor real-time data from all systems

## System Overview

The PV Simulator provides:

- **PV1 System**: 50kW Huawei inverter simulation (Port 10502)
- **PV2 System**: 50kW Huawei inverter simulation (Port 10503)  
- **Battery System**: 100kW PCS with 200kWh capacity (Port 10504)
- **Web Dashboard**: Real-time monitoring interface
- **REST API**: Programmatic access to all data

## Features

### Solar Calculator
- Realistic power generation based on time of day
- 7 active MPPT channels out of 24 total
- Temperature effects and efficiency calculations
- Daily energy yield tracking
- Grid parameters simulation

### Battery Calculator
- 200kWh battery capacity
- 100kW PCS power conversion
- SOC management and load balancing
- Grid interaction simulation
- Temperature monitoring

### Modbus TCP Servers
- Standard Modbus TCP protocol
- Read Input Registers (Function Code 0x04)
- 16-bit and 32-bit data types
- Big-endian byte order
- Real-time data updates

### Web Dashboard
- Real-time data visualization
- MPPT channel monitoring
- System status indicators
- Auto-refresh capability
- Responsive design

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

## Troubleshooting

1. **Port conflicts**: Ensure ports 3000, 10502, 10503, 10504 are available
2. **Dependencies**: Run `npm install` to install required packages
3. **Permissions**: Ensure Node.js has permission to bind to the ports
4. **Firewall**: Check firewall settings for port access

## Development

- `npm run dev` - Start with nodemon for development
- `npm test` - Run test suite
- `npm run build` - Build for production

## Support

For issues and questions:
- Check the console output for error messages
- Verify all dependencies are installed
- Test individual components using the test script
