# PV Simulator - Pure Node.js Implementation

A comprehensive solar photovoltaic (PV) and battery energy storage system (BESS) simulator built with pure Node.js, providing Modbus TCP servers and real-time web dashboard with proper electrical engineering sign conventions.

## 🚀 **What's Included**

### **Dual PV System Simulation**
- **PV System 1**: 50kW Huawei inverter simulation (Port 10502)
- **PV System 2**: 50kW Huawei inverter simulation (Port 10503)
- **Battery System**: 100kW PCS with 200kWh capacity (Port 10504)
- **Real-time Web Dashboard**: Live monitoring and control interface
- **REST API**: Programmatic access to all system data
- **3-Phase Grid Monitoring**: Complete grid voltage and current simulation

### **Solar Calculator Features**
- **Power Generation**: 50kW maximum per inverter
- **MPPT Configuration**: 7 active channels (600V nominal) out of 24 total
- **Grid Parameters**: 240V ± 1%, 50Hz ± 0.5% (3-phase)
- **Energy Yield Tracking**: Daily and accumulated energy monitoring
- **Temperature Simulation**: Realistic thermal modeling
- **Proper Sign Conventions**: Positive current/power for generation
- **Bounds Checking**: Prevents invalid values and division by zero

### **Battery System Features**
- **PCS Capacity**: 100kW Power Conversion System
- **Battery Capacity**: 200kWh energy storage (17 modules × 8 cells each)
- **Peak Shaving**: Intelligent load management and grid interaction
- **Cell-Level Monitoring**: Individual cell voltage and temperature tracking
- **Proper Sign Conventions**: 
  - Positive power = discharge (power flowing out of battery)
  - Negative power = charge (power flowing into battery)
  - Negative load power = consumption
- **SOC Tracking**: State of Charge monitoring and management

### **🚨 Alarm System Features**
- **Random Alarm Triggers**: Alarms trigger every 2 minutes automatically
- **Alarm Duration**: Each alarm lasts for 10 seconds before auto-clearing
- **Real-time Monitoring**: Console logging and API data integration
- **Battery Alarms**: 12 different alarm types including overvoltage, overtemperature, cell imbalance, etc.
- **PV Alarms**: 8 different alarm types including MPPT faults, grid faults, isolation faults, etc.
- **Modbus Integration**: Alarm states reflected in protection and alarm registers
- **API Access**: Alarm status available through REST API endpoints

## 🌐 **Access URLs**

- **Web Dashboard**: http://localhost:3000
- **REST API**: http://localhost:3000/api
- **Modbus PV1**: localhost:10502
- **Modbus PV2**: localhost:10503
- **Modbus Battery**: localhost:10504

## 📋 **Prerequisites**

- Node.js 16+ 
- npm 8+
- Git

## 🚀 **Quick Start**

1. **Clone and Install**
   ```bash
   git clone https://github.com/lionelmoh/cursor-nodejs-simulator.git
   cd cursor-nodejs-simulator
   npm install
   ```

2. **Start the Simulator**
   ```bash
   npm start
   ```

3. **Access the Dashboard**
   - Open http://localhost:3000 in your browser
   - Monitor real-time data from all systems
   - View 3-phase grid monitoring and cell-level battery data

4. **Test Modbus Connections**
   ```bash
   # Test PV1 server
   telnet localhost 10502
   
   # Test PV2 server  
   telnet localhost 10503
   
   # Test Battery server
   telnet localhost 10504
   ```

## 🔧 **Configuration**

### **System Configuration**
Edit `config/system-config.js` to modify:
- Solar panel specifications
- Inverter parameters
- Battery system settings
- Load profiles

### **Modbus Configuration**
Edit `config/modbus-config.js` to modify:
- Port numbers
- Register mappings
- Data scaling factors

## 📊 **Modbus Register Maps**

### **PV Systems (Ports 10502, 10503)**
- **Function Code**: 0x04 (Read Input Registers)
- **Data Type**: All registers are Input Registers (read-only)
- **Byte Order**: Big-Endian
- **Starting Address**: 32016

| Register | Parameter | Units | Scaling | Range |
|----------|-----------|-------|---------|-------|
| 32016-32039 | MPPT String Voltages | V | 0.1 | 0-1000V |
| 32017-32040 | MPPT String Currents | A | 0.1 | 0-100A |
| 32064-32065 | Input Power | W | 1 | 0-50000W |
| 32066 | Input Voltage | V | 0.1 | 0-1000V |
| 32067 | Input Current | A | 0.1 | 0-100A |
| 32068-32069 | Output Power | W | 1 | 0-50000W |
| 32070 | Line Voltage VAB | V | 0.1 | 0-500V |
| 32071 | Line Voltage VBC | V | 0.1 | 0-500V |
| 32072 | Line Voltage VCA | V | 0.1 | 0-500V |
| 32073-32074 | Phase A Current | A | 0.1 | 0-250A |
| 32075-32076 | Phase B Current | A | 0.1 | 0-250A |
| 32077-32078 | Phase C Current | A | 0.1 | 0-250A |
| 32079 | Grid Frequency | Hz | 0.01 | 45-55Hz |
| 32080 | Inverter Temperature | °C | 0.1 | -40 to 80°C |
| 32081 | Input Temperature | °C | 0.1 | -40 to 80°C |
| 32082 | Boost Temperature | °C | 0.1 | -40 to 80°C |
| 32083 | Inverter Efficiency | % | 0.1 | 0-100% |
| 32084 | Input Efficiency | % | 0.1 | 0-100% |
| 32085 | Output Efficiency | % | 0.1 | 0-100% |
| 32086 | Grid Voltage | V | 0.1 | 0-500V |
| 32087 | Grid Current | A | 0.1 | 0-250A |
| 32088 | Grid Power | W | 1 | 0-50000W |
| 32089 | Grid Frequency | Hz | 0.01 | 45-55Hz |
| 32090 | Grid Power Factor | - | 0.01 | 0-1 |
| 32091-32092 | Startup Time | s | 1 | 0-86400s |
| 32093-32094 | Shutdown Time | s | 1 | 0-86400s |
| 32095-32096 | Total Runtime | s | 1 | 0-31536000s |
| 32097-32098 | Total Energy | kWh | 0.1 | 0-9999999.9kWh |
| 32099-32100 | Daily Energy | kWh | 0.01 | 0-999.99kWh |
| 32101-32102 | Monthly Energy | kWh | 0.1 | 0-999999.9kWh |
| 32103-32104 | Yearly Energy | kWh | 0.1 | 0-999999.9kWh |
| 32105-32106 | Accumulated Energy | kWh | 0.1 | 0-9999999.9kWh |
| 32107-32108 | Daily Energy Yield | kWh | 0.01 | 0-999.99kWh |
| 32109-32110 | Monthly Energy Yield | kWh | 0.1 | 0-999999.9kWh |
| 32111-32112 | Yearly Energy Yield | kWh | 0.1 | 0-999999.9kWh |
| 32113-32114 | Accumulated Energy Yield | kWh | 0.1 | 0-9999999.9kWh |

### **Battery System (Port 10504)**
- **Function Code**: 0x04 (Read Input Registers)
- **Data Type**: All registers are Input Registers (read-only)
- **Byte Order**: Big-Endian
- **Starting Address**: 30002

| Register | ID | Parameter | Description | Units | Scaling | Range | Bit Details |
|----------|----|-----------|-------------|-------|---------|-------|-------------|
| 30002 | 0001 | System Voltage | Average value | V | 0.1 | - | System Voltage |
| 30003 | 0002 | System Current | Summation value (2's complement) | A | 1 | - | System Current |
| 30004 | 0003 | System SOC | Average value | % | 0.1 | 0-100 | System SOC |
| 30005 | 0004 | System SOH | Minimum SOH value among racks | % | 0.1 | 0-100 | System SOH |
| 30006 | 0005 | Reserved | - | - | - | - | Reserved |
| 30007 | 0006 | Max Cell Voltage | Maximum cell voltage in system | mV | 1 | - | Maximum Cell Voltage of System |
| 30008 | 0007 | Min Cell Voltage | Minimum cell voltage in system | mV | 1 | - | Minimum Cell Voltage of System |
| 30009 | 0008 | Max Cell Temperature | Maximum cell temperature (2's complement) | °C | 0.01 | - | Maximum Cell Temperature of System |
| 30010 | 0009 | Min Cell Temperature | Minimum cell temperature (2's complement) | °C | 0.01 | - | Minimum Cell Temperature of System |
| 30011 | 000A | Major Protection #4 | System protection flags | bit | 1 | - | See Protection & Alarm Bit Fields table |
| 30012 | 000B | Major Protection #3 | System protection flags | bit | 1 | - | See Protection & Alarm Bit Fields table |
| 30013 | 000C | Major Protection #2 | System protection flags | bit | 1 | - | See Protection & Alarm Bit Fields table |
| 30014 | 000D | Major Protection #1 | System protection flags | bit | 1 | - | See Protection & Alarm Bit Fields table |
| 30015 | 000E | Minor Protection #4 | System minor protection flags | bit | 1 | - | See Protection & Alarm Bit Fields table |
| 30016 | 000F | Minor Protection #3 | System minor protection flags | bit | 1 | - | See Protection & Alarm Bit Fields table |
| 30017 | 0010 | Minor Protection #2 | System minor protection flags | bit | 1 | - | See Protection & Alarm Bit Fields table |
| 30018 | 0011 | Minor Protection #1 | System minor protection flags | bit | 1 | - | See Protection & Alarm Bit Fields table |
| 30019 | 0012 | Alarm #4 | System alarm flags | bit | 1 | - | See Protection & Alarm Bit Fields table |
| 30020 | 0013 | Alarm #3 | System alarm flags | bit | 1 | - | See Protection & Alarm Bit Fields table |
| 30021 | 0014 | Alarm #2 | System alarm flags | bit | 1 | - | See Protection & Alarm Bit Fields table |
| 30022 | 0015 | Alarm #1 | System alarm flags | bit | 1 | - | See Protection & Alarm Bit Fields table |
| 30023 | 0016 | Reserved | - | - | - | - | Reserved |
| 30024 | 0017 | Reserved | - | - | - | - | Reserved |
| 30025 | 0018 | Watchdog Response | Inverts watchdog query request value | dec | 1 | - | Watchdog Response |
| 30026 | 0019 | System Heartbeat | Increases by 1 every second (0-999) | dec | 1 | 0-999 | System Heartbeat |
| 30027 | 001A | Connecting Status | MSB: Racks in Service, LSB: Total Rack Count | dec | 1 | 1-24 | Number of Racks in Service, Total Rack Count |
| 30028 | 001B | Service Voltage | Average voltage of connected racks | V | 0.1 | - | Service Voltage(Connected) |
| 30029 | 001C | Service SOC | Average SOC of all racks | % | 0.1 | 0-100 | Service SOC(Connected) |
| 30030 | 001D | Digital I/O Status | MSB: Output Port, LSB: Input Port | bit | 1 | - | Output: Reserved(5), Output_2, Output_1, Output_0, Reserved(3); Input: System Reset Button, Input_0: MCCB Trip, Reserved(3) |

### **Rack-Level Monitoring (Registers 30041-30090)**
| Register | ID | Parameter | Description | Units | Scaling | Range | Bit Details |
|----------|----|-----------|-------------|-------|---------|-------|-------------|
| 30041 | 0028 | Rack Voltage | Final output voltage on battery side | V | 0.1 | - | Rack Voltage |
| 30042 | 0029 | String #1 Rack Voltage | String #1 rack output voltage | V | 0.1 | - | String #1 Rack Voltage |
| 30046 | 002D | Rack Current (Real) | Current sensing value (2's complement) | A | 0.1 | - | Rack Current (Real) |
| 30047 | 002E | String #1 Rack Current | String #1 rack current (2's complement) | A | 0.1 | - | String #1 Rack Current |
| 30049 | 0030 | Rack Current (Average) | 3sec moving average current (2's complement) | A | 0.1 | - | Rack Current (Average) |
| 30050 | 0031 | Rack Mode | Operating mode (0:None/1:Init/2:Offline/3:Online) | dec | 1 | 0-3 | Rack Mode |
| 30051 | 0032 | Rack SOC | Rack State of Charge | % | 0.1 | 0-100 | Rack SOC |
| 30052 | 0033 | Rack SOH | Rack State of Health | % | 0.1 | 0-100 | Rack SOH |
| 30053 | 0034 | Major Protection #4 | Rack protection flags | bit | 1 | - | See Rack Protection & Alarm Bit Fields table |
| 30054 | 0035 | Major Protection #3 | Rack protection flags | bit | 1 | - | See Rack Protection & Alarm Bit Fields table |
| 30055 | 0036 | Major Protection #2 | Rack protection flags | bit | 1 | - | See Rack Protection & Alarm Bit Fields table |
| 30056 | 0037 | Major Protection #1 | Rack protection flags | bit | 1 | - | See Rack Protection & Alarm Bit Fields table |
| 30057 | 0038 | Minor Protection #4 | Rack minor protection flags | bit | 1 | - | See Rack Protection & Alarm Bit Fields table |
| 30058 | 0039 | Minor Protection #3 | Rack minor protection flags | bit | 1 | - | See Rack Protection & Alarm Bit Fields table |
| 30059 | 003A | Minor Protection #2 | Rack minor protection flags | bit | 1 | - | See Rack Protection & Alarm Bit Fields table |
| 30060 | 003B | Minor Protection #1 | Rack minor protection flags | bit | 1 | - | See Rack Protection & Alarm Bit Fields table |
| 30061 | 003C | Alarm #4 Summary | Rack alarm flags | bit | 1 | - | See Rack Protection & Alarm Bit Fields table |
| 30062 | 003D | Alarm #3 Summary | Rack alarm flags | bit | 1 | - | See Rack Protection & Alarm Bit Fields table |
| 30063 | 003E | Alarm #2 Summary | Rack alarm flags | bit | 1 | - | See Rack Protection & Alarm Bit Fields table |
| 30064 | 003F | Alarm #1 Summary | Rack alarm flags | bit | 1 | - | See Rack Protection & Alarm Bit Fields table |
| 30065 | 0040 | Max (#1) Cell Voltage | Maximum (#1) cell voltage in rack | mV | 1 | - | Maximum (#1) Cell Voltage Value |
| 30067 | 0042 | Max (#2) Cell Voltage | Maximum (#2) cell voltage in rack | mV | 1 | - | Maximum (#2) Cell Voltage Value |
| 30069 | 0044 | Average Cell Voltage | Average cell voltage in rack | mV | 1 | - | Average Cell Voltage Value |
| 30070 | 0045 | Min (#2) Cell Voltage | Minimum (#2) cell voltage in rack | mV | 1 | - | Minimum (#2) Cell Voltage Value |
| 30072 | 0047 | Min (#1) Cell Voltage | Minimum (#1) cell voltage in rack | mV | 1 | - | Minimum (#1) Cell Voltage Value |
| 30074 | 0049 | Max (#1) Cell Temperature | Maximum (#1) cell temperature in rack | °C | 0.01 | - | Maximum (#1) Cell Temperature Value |
| 30076 | 004B | Max (#2) Cell Temperature | Maximum (#2) cell temperature in rack | °C | 0.01 | - | Maximum (#2) Cell Temperature Value |
| 30078 | 004D | Average Cell Temperature | Average cell temperature in rack | °C | 0.01 | - | Average Cell Temperature Value |
| 30079 | 004E | Min (#2) Cell Temperature | Minimum (#2) cell temperature in rack | °C | 0.01 | - | Minimum (#2) Cell Temperature Value |
| 30081 | 0050 | Min (#1) Cell Temperature | Minimum (#1) cell temperature in rack | °C | 0.01 | - | Minimum (#1) Cell Temperature Value |
| 30083 | 0052 | Rack Heartbeat | Increments every second (0-255) | dec | 1 | 0-255 | Rack heartbeat |
| 30085 | 0054 | Rack Switch Control | Switch control information | bit | 1 | - | Reserved(16) |
| 30086 | 0055 | Rack Switch Sensor | Switch sensor information | bit | 1 | - | Reserved(16) |
| 30087 | 0056 | Rack External Sensor | External sensor information | bit | 1 | - | Reserved(16) |
| 30090 | 0059 | Rack External Indicator | External indicator status | bit | 1 | - | Reserved(12), major protection, minor protection, discharge, charge |

### **System Protection & Alarm Bit Fields**

| Register | Type | Bit Position | Flag Name | Description |
|----------|------|--------------|-----------|-------------|
| 30011 | Major Protection #4 | 0 | e-stop | Emergency stop |
| 30011 | Major Protection #4 | 1 | rack ChgOC#2 | Rack charge overcurrent #2 |
| 30011 | Major Protection #4 | 2 | rack DchgOC#2 | Rack discharge overcurrent #2 |
| 30011 | Major Protection #4 | 3 | rack DchgOC#3 | Rack discharge overcurrent #3 |
| 30011 | Major Protection #4 | 4 | rack DchgOC#4 | Rack discharge overcurrent #4 |
| 30011 | Major Protection #4 | 5 | Reserved | Reserved |
| 30011 | Major Protection #4 | 6 | iterative_cell_balancing | Iterative cell balancing |
| 30012 | Major Protection #3 | 0 | mccb fail | MCCB failure |
| 30012 | Major Protection #3 | 1 | mccb sensing fail | MCCB sensing failure |
| 30013 | Major Protection #2 | 0 | module V Sensing | Module voltage sensing |
| 30013 | Major Protection #2 | 1 | current-ic failure | Current IC failure |
| 30014 | Major Protection #1 | 0 | module UT | Module under temperature |
| 30014 | Major Protection #1 | 1 | module OT | Module over temperature |
| 30014 | Major Protection #1 | 2 | module UV | Module under voltage |
| 30014 | Major Protection #1 | 3 | module OV | Module over voltage |
| 30014 | Major Protection #1 | 4 | module V-imb | Module voltage imbalance |
| 30014 | Major Protection #1 | 5 | module T-imb | Module temperature imbalance |
| 30014 | Major Protection #1 | 6 | R-M comm fail | Rack-Master communication failure |
| 30014 | Major Protection #1 | 7 | R-S comm fail | Rack-Slave communication failure |
| 30014 | Major Protection #1 | 8 | rack ChgOC | Rack charge overcurrent |
| 30014 | Major Protection #1 | 9 | rack DchgOC | Rack discharge overcurrent |
| 30014 | Major Protection #1 | 10 | rack UV | Rack under voltage |
| 30014 | Major Protection #1 | 11 | rack OV | Rack over voltage |
| 30014 | Major Protection #1 | 12 | rack V sensing diff | Rack voltage sensing difference |
| 30014 | Major Protection #1 | 13 | rack I senser fail | Rack current sensor failure |
| 30014 | Major Protection #1 | 14 | rack fuse fail | Rack fuse failure |
| 30014 | Major Protection #1 | 15 | permanent uv | Permanent under voltage |

### **Rack Protection & Alarm Bit Fields**

| Register | Type | Bit Position | Flag Name | Description |
|----------|------|--------------|-----------|-------------|
| 30053 | Major Protection #4 | 0 | rack OC2 | Rack overcurrent #2 |
| 30053 | Major Protection #4 | 1 | rack Dch OC2 | Rack discharge overcurrent #2 |
| 30053 | Major Protection #4 | 2 | rack Dch DC3 | Rack discharge DC #3 |
| 30053 | Major Protection #4 | 3 | rack Dch OCM | Rack discharge overcurrent M |
| 30054 | Major Protection #3 | 0 | rack V sensing fail | Rack voltage sensing failure |
| 30055 | Major Protection #2 | 0 | rack V sensing fail | Rack voltage sensing failure |
| 30056 | Major Protection #1 | 0 | rack OC2 | Rack overcurrent #2 |
| 30056 | Major Protection #1 | 1 | rack Dch OC2 | Rack discharge overcurrent #2 |
| 30056 | Major Protection #1 | 2 | rack Dch DC3 | Rack discharge DC #3 |
| 30056 | Major Protection #1 | 3 | rack Dch OCM | Rack discharge overcurrent M |
| 30056 | Major Protection #1 | 4 | rack UV | Rack under voltage |
| 30056 | Major Protection #1 | 5 | rack OV | Rack over voltage |
| 30056 | Major Protection #1 | 6 | rack V sensing fail | Rack voltage sensing failure |
| 30056 | Major Protection #1 | 7 | permanent rack fuse fail | Permanent rack fuse failure |

**Note:** Minor Protection and Alarm registers use the same bit field structure as their corresponding Major Protection registers.

## 🚨 **Alarm System Details**

### **Alarm Trigger Schedule**
- **Frequency**: Every 2 minutes (120 seconds)
- **Duration**: 10 seconds per alarm
- **Auto-clear**: Alarms automatically clear after duration expires
- **Random Selection**: Alarm types are randomly selected from available types

### **Battery Alarm Types**
| Alarm Type | Code | Description | Protection Level |
|------------|------|-------------|------------------|
| `overvoltage` | 0x2001 | Battery voltage exceeds safe limits | Major |
| `undervoltage` | 0x2002 | Battery voltage below minimum threshold | Major |
| `overtemperature` | 0x2003 | Cell temperature too high | Major |
| `undertemperature` | 0x2004 | Cell temperature too low | Minor |
| `overcurrent` | 0x2005 | Current exceeds safe limits | Major |
| `communication_error` | 0x2006 | Communication failure | Minor |
| `cell_imbalance` | 0x2007 | Cell voltage imbalance detected | Major |
| `isolation_fault` | 0x2008 | Isolation resistance fault | Major |
| `ground_fault` | 0x2009 | Ground fault detected | Major |
| `thermal_runaway` | 0x200A | Thermal runaway condition | Major |
| `low_soc` | 0x200B | State of charge too low | Minor |
| `high_soc` | 0x200C | State of charge too high | Minor |

### **PV Alarm Types**
| Alarm Type | Code | Description | Protection Level |
|------------|------|-------------|------------------|
| `overvoltage` | 0x1001 | DC voltage exceeds safe limits | Major |
| `undervoltage` | 0x1002 | DC voltage below minimum threshold | Major |
| `overtemperature` | 0x1003 | Inverter temperature too high | Major |
| `communication_error` | 0x1004 | Communication failure | Minor |
| `mppt_fault` | 0x1005 | MPPT tracking fault | Major |
| `grid_fault` | 0x1006 | Grid connection fault | Major |
| `isolation_fault` | 0x1007 | Isolation resistance fault | Major |
| `ground_fault` | 0x1008 | Ground fault detected | Major |

### **API Alarm Data**
All alarm information is available through the REST API:

```json
{
  "alarm_active": true,
  "alarm_type": "overtemperature",
  "alarm_code": 8195
}
```

### **Console Monitoring**
The system logs all alarm events to the console:
```
🚨 PV Alarm triggered: overvoltage
✅ PV Alarm cleared: overvoltage
🚨 Battery Alarm triggered: cell_imbalance
✅ Battery Alarm cleared: cell_imbalance
```

## 🧪 **Testing**

### **Modbus Testing**
```bash
# Test PV1 system
modpoll -m tcp -a 1 -r 32016 -c 10 localhost 10502

# Test PV2 system  
modpoll -m tcp -a 1 -r 32016 -c 10 localhost 10503

# Test Battery system (System level)
modpoll -m tcp -a 1 -r 30002 -c 10 localhost 10504

# Test Battery system (Rack level)
modpoll -m tcp -a 1 -r 30041 -c 10 localhost 10504

# Test specific rack parameters
modpoll -m tcp -a 1 -r 30050 -c 5 localhost 10504  # Rack mode, SOC, SOH
modpoll -m tcp -a 1 -r 30065 -c 10 localhost 10504 # Cell voltage monitoring
modpoll -m tcp -a 1 -r 30074 -c 10 localhost 10504 # Cell temperature monitoring
```

### **Web Dashboard Testing**
1. Open http://localhost:3000
2. Verify real-time data updates
3. Check all system parameters
4. Test alarm conditions

### **Alarm System Testing**
```bash
# Monitor alarm events in console
npm start

# Test alarm data via API
curl http://localhost:3000/api/pv1/data | jq '.data.alarm_active'
curl http://localhost:3000/api/battery/data | jq '.data.alarm_active'

# Test alarm registers via Modbus
modpoll -m tcp -a 1 -r 30011 -c 12 localhost 10504  # Battery protection/alarm registers
modpoll -m tcp -a 1 -r 30053 -c 12 localhost 10504  # Rack protection/alarm registers
```

### **Alarm Monitoring**
- **Console Output**: Watch for `🚨` and `✅` alarm messages
- **API Endpoints**: Check `/api/pv1/data`, `/api/pv2/data`, `/api/battery/data`
- **Modbus Registers**: Monitor protection and alarm registers for bit changes
- **Timing**: Alarms trigger every 2 minutes, last 10 seconds

## ✨ **Recent Improvements & Fixes**

### **Energy Flow Sign Conventions (Fixed)**
- **PV Current/Power**: ✅ Positive (power flowing out of PV system)
- **Battery Discharge**: ✅ Positive (power flowing out of battery)
- **Battery Charge**: ✅ Negative (power flowing into battery)
- **Load Power**: ✅ Negative (power consumption)
- **Grid Power**: ✅ Positive when exporting, negative when importing

### **Modbus Server Stability (Fixed)**
- **Connection Stability**: ✅ No more disconnections
- **Value Validation**: ✅ Prevents invalid data (Infinity, negative values)
- **Bounds Checking**: ✅ All values within 16-bit unsigned integer range (0-65535)
- **Error Handling**: ✅ Robust error responses and recovery

### **Battery System Enhancements**
- **Cell-Level Monitoring**: ✅ 17 modules × 8 Lithium NMC cells each (136 total cells)
- **Peak Shaving Logic**: ✅ Intelligent load management and grid interaction
- **3-Phase Grid Simulation**: ✅ Complete voltage and current monitoring
- **Real-time Data**: ✅ Live SOC, SOH, voltage, current, and temperature tracking

### **PV System Improvements**
- **MPPT Current Calculation**: ✅ Fixed division by zero and bounds checking
- **Realistic Power Generation**: ✅ Proper solar irradiance simulation
- **Temperature Modeling**: ✅ Accurate thermal calculations
- **Efficiency Tracking**: ✅ Real-time inverter efficiency monitoring

## 📁 **Project Structure**
```
cursor-nodejs-simulator/
├── src/
│   ├── simulators/          # Solar and battery calculators
│   │   ├── solar-calculator.js
│   │   └── battery-calculator.js
│   ├── modbus/              # Modbus TCP servers
│   │   ├── pv1-server.js
│   │   ├── pv2-server.js
│   │   ├── battery-server.js
│   │   └── register-maps.js
│   ├── utils/               # Utility functions
│   │   └── data-processor.js
│   └── server.js            # Main Express server
├── views/                   # EJS templates
│   └── dashboard.ejs
├── config/                  # Configuration files
│   ├── system-config.js
│   └── modbus-config.js
├── deploy/                  # Deployment scripts
│   ├── install.sh
│   ├── start.sh
│   ├── update.sh
│   ├── control.sh
│   ├── deploy.ps1
│   ├── deploy.bat
│   └── pv-simulator.service
├── package.json
├── test-system.js
├── README.md
└── SETUP.md
```

## 🔧 **Development**

### **Start Development Server**
```bash
npm run dev
```

### **Run Tests**
```bash
npm test
```

### **Build for Production**
```bash
npm run build
```

## 📝 **API Endpoints**

### **System Data**
- `GET /api/pv1/data` - PV1 system data
- `GET /api/pv2/data` - PV2 system data  
- `GET /api/battery/data` - Battery system data
- `GET /api/all/data` - All systems data

### **Configuration**
- `GET /api/config` - System configuration
- `POST /api/config` - Update configuration
- `GET /api/status` - System status

## 🚀 **Deployment**

### **Local Development**
```bash
npm start
```

### **Production Deployment**
```bash
npm run build
npm run start:prod
```

### **Docker Deployment**
```bash
docker build -t pv-simulator .
docker run -p 3000:3000 -p 10502:10502 -p 10503:10503 -p 10504:10504 pv-simulator
```

## 📞 **Support**

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Check system logs

## 📄 **License**

MIT License - see LICENSE file for details