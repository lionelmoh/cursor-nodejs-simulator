const net = require('net');
const { batteryCalculator } = require('../simulators/battery-calculator');
const { registerMaps } = require('./register-maps');

class BatteryServer {
    constructor(port = 10504) {
        this.port = port;
        this.server = net.createServer();
        this.registerData = new Array(50000).fill(0);
        this.isRunning = false;
        this.connections = new Set();
        
        this.setupServer();
        this.startDataGeneration();
    }

    setupServer() {
        this.server.on('connection', (socket) => {
            console.log(`Battery Modbus client connected to port ${this.port}`);
            this.connections.add(socket);
            
            socket.on('data', (data) => {
                this.handleModbusRequest(socket, data);
            });
            
            socket.on('end', () => {
                console.log(`Battery Modbus client disconnected from port ${this.port}`);
                this.connections.delete(socket);
            });
            
            socket.on('error', (err) => {
                console.error(`Battery Modbus socket error on port ${this.port}:`, err);
                this.connections.delete(socket);
            });
            
            socket.on('close', () => {
                this.connections.delete(socket);
            });
        });
        
        this.server.on('error', (err) => {
            console.error(`Battery Modbus server error on port ${this.port}:`, err);
        });
        
        console.log(`Battery Modbus server configured on port ${this.port}`);
    }

    handleModbusRequest(socket, data) {
        try {
            if (data.length < 8) {
                console.log(`Battery: Invalid Modbus request length: ${data.length}`);
                return;
            }

            // Parse Modbus TCP header
            const transactionId = data.readUInt16BE(0);
            const protocolId = data.readUInt16BE(2);
            const length = data.readUInt16BE(4);
            const unitId = data.readUInt8(6);
            const functionCode = data.readUInt8(7);

            console.log(`Battery: Modbus request - TID:${transactionId}, FC:${functionCode}, Unit:${unitId}, Len:${length}`);

            // Check protocol ID (should be 0 for Modbus)
            if (protocolId !== 0) {
                console.log(`Battery: Invalid protocol ID: ${protocolId}`);
                const errorResponse = this.createErrorResponse(transactionId, unitId, functionCode, 0x0B);
                socket.write(errorResponse);
                return;
            }

            // Validate request length
            if (data.length !== length + 6) {
                console.log(`Battery: Length mismatch - expected: ${length + 6}, actual: ${data.length}`);
                const errorResponse = this.createErrorResponse(transactionId, unitId, functionCode, 0x0B);
                socket.write(errorResponse);
                return;
            }

            let response;
            try {
                switch (functionCode) {
                    case 0x03: // Read Holding Registers
                        if (data.length < 12) {
                            response = this.createErrorResponse(transactionId, unitId, functionCode, 0x03);
                            break;
                        }
                        const startAddr = data.readUInt16BE(8);
                        const quantity = data.readUInt16BE(10);
                        response = this.readRegisters(transactionId, unitId, startAddr, quantity);
                        break;
                    case 0x04: // Read Input Registers
                        if (data.length < 12) {
                            response = this.createErrorResponse(transactionId, unitId, functionCode, 0x03);
                            break;
                        }
                        const startAddr2 = data.readUInt16BE(8);
                        const quantity2 = data.readUInt16BE(10);
                        response = this.readRegisters(transactionId, unitId, startAddr2, quantity2);
                        break;
                    case 0x06: // Write Single Register
                        if (data.length < 12) {
                            response = this.createErrorResponse(transactionId, unitId, functionCode, 0x03);
                            break;
                        }
                        const regAddr = data.readUInt16BE(8);
                        const regValue = data.readUInt16BE(10);
                        response = this.writeRegister(transactionId, unitId, regAddr, regValue);
                        break;
                    case 0x10: // Write Multiple Registers
                        if (data.length < 13) {
                            response = this.createErrorResponse(transactionId, unitId, functionCode, 0x03);
                            break;
                        }
                        const startAddr3 = data.readUInt16BE(8);
                        const quantity3 = data.readUInt16BE(10);
                        const byteCount = data.readUInt8(12);
                        if (data.length < 13 + byteCount) {
                            response = this.createErrorResponse(transactionId, unitId, functionCode, 0x03);
                            break;
                        }
                        const values = [];
                        for (let i = 0; i < quantity3; i++) {
                            values.push(data.readUInt16BE(13 + i * 2));
                        }
                        response = this.writeRegisters(transactionId, unitId, startAddr3, values);
                        break;
                    default:
                        response = this.createErrorResponse(transactionId, unitId, functionCode, 0x01);
                }
            } catch (error) {
                console.error(`Battery: Error processing function ${functionCode}:`, error);
                response = this.createErrorResponse(transactionId, unitId, functionCode, 0x04);
            }

            if (response) {
                socket.write(response);
                console.log(`Battery: Sent response - TID:${transactionId}, Len:${response.length}`);
            }
        } catch (error) {
            console.error(`Battery: Error handling Modbus request:`, error);
            try {
                if (data.length >= 8) {
                    const transactionId = data.readUInt16BE(0);
                    const unitId = data.readUInt8(6);
                    const functionCode = data.readUInt8(7);
                    const errorResponse = this.createErrorResponse(transactionId, unitId, functionCode, 0x04);
                    socket.write(errorResponse);
                }
            } catch (e) {
                console.error(`Battery: Failed to send error response:`, e);
            }
        }
    }

    readRegisters(transactionId, unitId, startAddress, quantity) {
        try {
            // Validate quantity
            if (quantity < 1 || quantity > 125) {
                return this.createErrorResponse(transactionId, unitId, 0x04, 0x03);
            }

            // Validate address range
            if (startAddress + quantity > this.registerData.length) {
                return this.createErrorResponse(transactionId, unitId, 0x04, 0x02);
            }

            const data = [];
            for (let i = 0; i < quantity; i++) {
                const address = startAddress + i;
                let value = this.registerData[address] || 0;
                
                // Clamp value to valid 16-bit unsigned integer range
                if (!isFinite(value)) {
                    value = 0;
                } else if (value < 0) {
                    value = 0;
                } else if (value > 65535) {
                    value = 65535;
                }
                
                data.push(Math.round(value));
            }

            const response = Buffer.alloc(9 + data.length * 2);
            response.writeUInt16BE(transactionId, 0);
            response.writeUInt16BE(0, 2); // Protocol ID
            response.writeUInt16BE(3 + data.length * 2, 4); // Length
            response.writeUInt8(unitId, 6);
            response.writeUInt8(0x04, 7); // Function code
            response.writeUInt8(data.length * 2, 8); // Byte count

            for (let i = 0; i < data.length; i++) {
                let value = data[i];
                // Final safety check before writing to buffer
                if (!isFinite(value) || value < 0 || value > 65535) {
                    value = 0;
                }
                response.writeUInt16BE(Math.round(value), 9 + i * 2);
            }

            return response;
        } catch (error) {
            console.error(`Battery: Error reading registers:`, error);
            return this.createErrorResponse(transactionId, unitId, 0x04, 0x04);
        }
    }

    writeRegister(transactionId, unitId, address, value) {
        try {
            if (address >= 0 && address < this.registerData.length) {
                this.registerData[address] = value;
                
                const response = Buffer.alloc(12);
                response.writeUInt16BE(transactionId, 0);
                response.writeUInt16BE(0, 2); // Protocol ID
                response.writeUInt16BE(6, 4); // Length
                response.writeUInt8(unitId, 6);
                response.writeUInt8(0x06, 7); // Function code
                response.writeUInt16BE(address, 8);
                response.writeUInt16BE(value, 10);
                
                return response;
            } else {
                return this.createErrorResponse(transactionId, unitId, 0x06, 0x02);
            }
        } catch (error) {
            console.error(`Battery: Error writing register:`, error);
            return this.createErrorResponse(transactionId, unitId, 0x06, 0x04);
        }
    }

    writeRegisters(transactionId, unitId, startAddress, values) {
        try {
            if (startAddress + values.length > this.registerData.length) {
                return this.createErrorResponse(transactionId, unitId, 0x10, 0x02);
            }

            for (let i = 0; i < values.length; i++) {
                this.registerData[startAddress + i] = values[i];
            }

            const response = Buffer.alloc(12);
            response.writeUInt16BE(transactionId, 0);
            response.writeUInt16BE(0, 2); // Protocol ID
            response.writeUInt16BE(6, 4); // Length
            response.writeUInt8(unitId, 6);
            response.writeUInt8(0x10, 7); // Function code
            response.writeUInt16BE(startAddress, 8);
            response.writeUInt16BE(values.length, 10);

            return response;
        } catch (error) {
            console.error(`Battery: Error writing registers:`, error);
            return this.createErrorResponse(transactionId, unitId, 0x10, 0x04);
        }
    }

    createErrorResponse(transactionId, unitId, functionCode, errorCode) {
        const response = Buffer.alloc(9);
        response.writeUInt16BE(transactionId, 0);
        response.writeUInt16BE(0, 2); // Protocol ID
        response.writeUInt16BE(3, 4); // Length
        response.writeUInt8(unitId, 6);
        response.writeUInt8(functionCode | 0x80, 7); // Error function code
        response.writeUInt8(errorCode, 8);
        return response;
    }

    startDataGeneration() {
        setInterval(() => {
            this.updateRegisterData();
        }, 1000); // Update every second
    }

    updateRegisterData() {
        try {
            // Get battery data from calculator
            const batteryData = batteryCalculator.getCurrentData();
            
            // System level registers (30002-30030)
            this.registerData[30002] = batteryData.systemVoltage; // System voltage (0.1V units)
            this.registerData[30003] = batteryData.systemCurrent; // System current (0.1A units)
            this.registerData[30004] = batteryData.systemSOC; // System SOC (0.1% units)
            this.registerData[30005] = batteryData.systemSOH; // System SOH (0.1% units)
            this.registerData[30006] = 0; // Reserved
            this.registerData[30007] = batteryData.maxCellVoltage; // Max cell voltage (1mV units)
            this.registerData[30008] = batteryData.minCellVoltage; // Min cell voltage (1mV units)
            this.registerData[30009] = batteryData.maxCellTemperature; // Max cell temperature (0.01°C units)
            this.registerData[30010] = batteryData.minCellTemperature; // Min cell temperature (0.01°C units)
            
            // Protection and alarm registers (30011-30022)
            this.registerData[30011] = batteryData.majorProtection4; // Major Protection #4
            this.registerData[30012] = batteryData.majorProtection3; // Major Protection #3
            this.registerData[30013] = batteryData.majorProtection2; // Major Protection #2
            this.registerData[30014] = batteryData.majorProtection1; // Major Protection #1
            this.registerData[30015] = batteryData.minorProtection4; // Minor Protection #4
            this.registerData[30016] = batteryData.minorProtection3; // Minor Protection #3
            this.registerData[30017] = batteryData.minorProtection2; // Minor Protection #2
            this.registerData[30018] = batteryData.minorProtection1; // Minor Protection #1
            this.registerData[30019] = batteryData.alarm4; // Alarm #4
            this.registerData[30020] = batteryData.alarm3; // Alarm #3
            this.registerData[30021] = batteryData.alarm2; // Alarm #2
            this.registerData[30022] = batteryData.alarm1; // Alarm #1
            
            this.registerData[30023] = 0; // Reserved
            this.registerData[30024] = 0; // Reserved
            this.registerData[30025] = Math.floor(Math.random() * 256); // Watchdog response
            this.registerData[30026] = Math.floor((Date.now() - batteryCalculator.startTime) / 1000) % 1000; // System heartbeat
            this.registerData[30027] = (1 << 8) | 1; // Connecting status (1 rack in service, 1 total)
            this.registerData[30028] = batteryData.systemVoltage; // Service voltage
            this.registerData[30029] = batteryData.systemSOC; // Service SOC
            this.registerData[30030] = 0; // Digital I/O status
            
            // Rack level registers (30041-30090)
            this.registerData[30041] = batteryData.rackVoltage; // Rack voltage
            this.registerData[30042] = batteryData.rackVoltage; // String #1 rack voltage
            this.registerData[30046] = batteryData.rackCurrent; // Rack current (real)
            this.registerData[30047] = batteryData.rackCurrent; // String #1 rack current
            this.registerData[30049] = batteryData.rackCurrentAverage; // Rack current (average)
            this.registerData[30050] = batteryData.rackMode; // Rack mode
            this.registerData[30051] = batteryData.rackSOC; // Rack SOC
            this.registerData[30052] = batteryData.rackSOH; // Rack SOH
            
            // Rack protection and alarm registers (30053-30064)
            this.registerData[30053] = batteryData.majorProtection4; // Major Protection #4
            this.registerData[30054] = batteryData.majorProtection3; // Major Protection #3
            this.registerData[30055] = batteryData.majorProtection2; // Major Protection #2
            this.registerData[30056] = batteryData.majorProtection1; // Major Protection #1
            this.registerData[30057] = batteryData.minorProtection4; // Minor Protection #4
            this.registerData[30058] = batteryData.minorProtection3; // Minor Protection #3
            this.registerData[30059] = batteryData.minorProtection2; // Minor Protection #2
            this.registerData[30060] = batteryData.minorProtection1; // Minor Protection #1
            this.registerData[30061] = batteryData.alarm4; // Alarm #4
            this.registerData[30062] = batteryData.alarm3; // Alarm #3
            this.registerData[30063] = batteryData.alarm2; // Alarm #2
            this.registerData[30064] = batteryData.alarm1; // Alarm #1
            
            // Cell voltage monitoring (30065-30072)
            this.registerData[30065] = batteryData.maxCellVoltage1; // Max (#1) cell voltage
            this.registerData[30067] = batteryData.maxCellVoltage2; // Max (#2) cell voltage
            this.registerData[30069] = batteryData.avgCellVoltage; // Average cell voltage
            this.registerData[30070] = batteryData.minCellVoltage2; // Min (#2) cell voltage
            this.registerData[30072] = batteryData.minCellVoltage1; // Min (#1) cell voltage
            
            // Cell temperature monitoring (30074-30081)
            this.registerData[30074] = batteryData.maxCellTemperature1; // Max (#1) cell temperature
            this.registerData[30076] = batteryData.maxCellTemperature2; // Max (#2) cell temperature
            this.registerData[30078] = batteryData.avgCellTemperature; // Average cell temperature
            this.registerData[30079] = batteryData.minCellTemperature2; // Min (#2) cell temperature
            this.registerData[30081] = batteryData.minCellTemperature1; // Min (#1) cell temperature
            
            // Rack status and control (30083-30090)
            this.registerData[30083] = batteryData.rackHeartbeat; // Rack heartbeat
            this.registerData[30085] = 0; // Rack switch control
            this.registerData[30086] = 0; // Rack switch sensor
            this.registerData[30087] = 0; // Rack external sensor
            this.registerData[30090] = 0; // Rack external indicator
            
        } catch (error) {
            console.error('Error updating Battery register data:', error);
        }
    }

    async start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, '0.0.0.0', () => {
                this.isRunning = true;
                console.log(`✅ Battery Modbus server started on port ${this.port}`);
                resolve();
            });
            
            this.server.on('error', (err) => {
                console.error(`❌ Failed to start Battery Modbus server on port ${this.port}:`, err);
                reject(err);
            });
        });
    }

    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                // Close all connections
                this.connections.forEach(socket => {
                    socket.destroy();
                });
                this.connections.clear();
                
                this.server.close(() => {
                    this.isRunning = false;
                    console.log(`✅ Battery Modbus server stopped on port ${this.port}`);
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            port: this.port,
            connections: this.connections.size
        };
    }
}

module.exports = { BatteryServer };