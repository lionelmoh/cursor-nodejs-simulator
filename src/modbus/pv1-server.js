const net = require('net');
const { solarCalculator } = require('../simulators/solar-calculator');
const { registerMaps } = require('./register-maps');

class PV1Server {
    constructor(port = 10502) {
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
            console.log(`PV1 Modbus client connected to port ${this.port}`);
            this.connections.add(socket);
            
            socket.on('data', (data) => {
                this.handleModbusRequest(socket, data);
            });
            
            socket.on('end', () => {
                console.log(`PV1 Modbus client disconnected from port ${this.port}`);
                this.connections.delete(socket);
            });
            
            socket.on('error', (err) => {
                console.error(`PV1 Modbus socket error on port ${this.port}:`, err);
                this.connections.delete(socket);
            });
            
            socket.on('close', () => {
                this.connections.delete(socket);
            });
        });
        
        this.server.on('error', (err) => {
            console.error(`PV1 Modbus server error on port ${this.port}:`, err);
        });
        
        console.log(`PV1 Modbus server configured on port ${this.port}`);
    }

    handleModbusRequest(socket, data) {
        try {
            if (data.length < 8) {
                console.log(`PV1: Invalid Modbus request length: ${data.length}`);
                return;
            }

            // Parse Modbus TCP header
            const transactionId = data.readUInt16BE(0);
            const protocolId = data.readUInt16BE(2);
            const length = data.readUInt16BE(4);
            const unitId = data.readUInt8(6);
            const functionCode = data.readUInt8(7);

            console.log(`PV1: Modbus request - TID:${transactionId}, FC:${functionCode}, Unit:${unitId}, Len:${length}`);

            // Check protocol ID (should be 0 for Modbus)
            if (protocolId !== 0) {
                console.log(`PV1: Invalid protocol ID: ${protocolId}`);
                const errorResponse = this.createErrorResponse(transactionId, unitId, functionCode, 0x0B);
                socket.write(errorResponse);
                return;
            }

            // Validate request length
            if (data.length !== length + 6) {
                console.log(`PV1: Length mismatch - expected: ${length + 6}, actual: ${data.length}`);
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
                console.error(`PV1: Error processing function ${functionCode}:`, error);
                response = this.createErrorResponse(transactionId, unitId, functionCode, 0x04);
            }

            if (response) {
                socket.write(response);
                console.log(`PV1: Sent response - TID:${transactionId}, Len:${response.length}`);
            }
        } catch (error) {
            console.error(`PV1: Error handling Modbus request:`, error);
            try {
                if (data.length >= 8) {
                    const transactionId = data.readUInt16BE(0);
                    const unitId = data.readUInt8(6);
                    const functionCode = data.readUInt8(7);
                    const errorResponse = this.createErrorResponse(transactionId, unitId, functionCode, 0x04);
                    socket.write(errorResponse);
                }
            } catch (e) {
                console.error(`PV1: Failed to send error response:`, e);
            }
        }
    }

    readRegisters(transactionId, unitId, startAddress, quantity) {
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
            console.error(`PV1: Error writing register:`, error);
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
            console.error(`PV1: Error writing registers:`, error);
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
            // Get PV data from calculator
            const pvData = solarCalculator.getCurrentData();
            // console.log(`PV1: Updating register data, input power: ${pvData.inputPower}`);
            
            // Update MPPT voltage registers (32016-32063)
            if (pvData.mpptVoltages) {
                for (let i = 0; i < 24; i++) {
                    let voltage = (pvData.mpptVoltages[i] || 0) * 10; // 0.1V units
                    voltage = Math.round(Math.max(0, Math.min(65535, voltage))); // Clamp to valid range
                    this.registerData[32016 + (i * 2)] = voltage;
                }
            }
            
            // Update MPPT current registers (32017-32064)
            if (pvData.mpptCurrents) {
                for (let i = 0; i < 24; i++) {
                    let current = (pvData.mpptCurrents[i] || 0) * 10; // 0.1A units
                    current = Math.round(Math.max(0, Math.min(65535, current))); // Clamp to valid range
                    this.registerData[32017 + (i * 2)] = current;
                }
            }
            
            // Update main system registers
            const inputPower = Math.max(0, Math.min(4294967295, pvData.inputPower || 0)); // Clamp to 32-bit range
            this.registerData[32064] = Math.floor(inputPower / 65536); // High word
            this.registerData[32065] = inputPower & 0xFFFF; // Low word
            // console.log(`PV1: Register 32064-32065 set to: ${this.registerData[32064]}, ${this.registerData[32065]}`);
            this.registerData[32066] = Math.round(Math.max(0, Math.min(65535, (pvData.inputVoltage || 0) * 10))); // 0.1V units
            this.registerData[32067] = Math.round(Math.max(0, Math.min(65535, (pvData.inputCurrent || 0) * 10))); // 0.1A units
            const outputPower = Math.max(0, Math.min(4294967295, pvData.outputPower || 0)); // Clamp to 32-bit range
            this.registerData[32068] = Math.floor(outputPower / 65536); // High word
            this.registerData[32069] = outputPower & 0xFFFF; // Low word
            this.registerData[32070] = Math.round(pvData.lineVoltageVAB * 10); // 0.1V units
            this.registerData[32071] = Math.round(pvData.lineVoltageVBC * 10); // 0.1V units
            this.registerData[32072] = Math.round(pvData.lineVoltageVCA * 10); // 0.1V units
            this.registerData[32073] = Math.floor(pvData.phaseACurrent / 65536); // High word
            this.registerData[32074] = pvData.phaseACurrent & 0xFFFF; // Low word
            this.registerData[32075] = Math.floor(pvData.phaseBCurrent / 65536); // High word
            this.registerData[32076] = pvData.phaseBCurrent & 0xFFFF; // Low word
            this.registerData[32077] = Math.floor(pvData.phaseCCurrent / 65536); // High word
            this.registerData[32078] = pvData.phaseCCurrent & 0xFFFF; // Low word
            this.registerData[32079] = Math.round(pvData.gridFrequency * 100); // 0.01Hz units
            this.registerData[32080] = Math.round(pvData.inverterTemperature * 10); // 0.1°C units
            this.registerData[32081] = Math.round(pvData.inputTemperature * 10); // 0.1°C units
            this.registerData[32082] = Math.round(pvData.boostTemperature * 10); // 0.1°C units
            this.registerData[32083] = Math.round(pvData.inverterEfficiency * 10); // 0.1% units
            this.registerData[32084] = Math.round(pvData.inputEfficiency * 10); // 0.1% units
            this.registerData[32085] = Math.round(pvData.outputEfficiency * 10); // 0.1% units
            this.registerData[32086] = Math.round(pvData.gridVoltage * 10); // 0.1V units
            this.registerData[32087] = Math.round(pvData.gridCurrent * 10); // 0.1A units
            this.registerData[32088] = Math.round(pvData.gridPower); // 1W units
            this.registerData[32090] = Math.round(pvData.gridPowerFactor * 100); // 0.01 units
            this.registerData[32091] = Math.floor(pvData.startupTime / 65536); // High word
            this.registerData[32092] = pvData.startupTime & 0xFFFF; // Low word
            this.registerData[32093] = Math.floor(pvData.shutdownTime / 65536); // High word
            this.registerData[32094] = pvData.shutdownTime & 0xFFFF; // Low word
            this.registerData[32095] = Math.floor(pvData.totalRuntime / 65536); // High word
            this.registerData[32096] = pvData.totalRuntime & 0xFFFF; // Low word
            this.registerData[32097] = Math.floor(pvData.totalEnergy / 65536); // High word
            this.registerData[32098] = pvData.totalEnergy & 0xFFFF; // Low word
            this.registerData[32099] = Math.floor(pvData.dailyEnergy / 65536); // High word
            this.registerData[32100] = pvData.dailyEnergy & 0xFFFF; // Low word
            this.registerData[32101] = Math.floor(pvData.monthlyEnergy / 65536); // High word
            this.registerData[32102] = pvData.monthlyEnergy & 0xFFFF; // Low word
            this.registerData[32103] = Math.floor(pvData.yearlyEnergy / 65536); // High word
            this.registerData[32104] = pvData.yearlyEnergy & 0xFFFF; // Low word
            this.registerData[32105] = Math.floor(pvData.accumulatedEnergy / 65536); // High word
            this.registerData[32106] = pvData.accumulatedEnergy & 0xFFFF; // Low word
            this.registerData[32107] = Math.floor(pvData.dailyEnergyYield / 65536); // High word
            this.registerData[32108] = pvData.dailyEnergyYield & 0xFFFF; // Low word
            this.registerData[32109] = Math.floor(pvData.monthlyEnergyYield / 65536); // High word
            this.registerData[32110] = pvData.monthlyEnergyYield & 0xFFFF; // Low word
            this.registerData[32111] = Math.floor(pvData.yearlyEnergyYield / 65536); // High word
            this.registerData[32112] = pvData.yearlyEnergyYield & 0xFFFF; // Low word
            this.registerData[32113] = Math.floor(pvData.accumulatedEnergyYield / 65536); // High word
            this.registerData[32114] = pvData.accumulatedEnergyYield & 0xFFFF; // Low word
            
        } catch (error) {
            console.error('Error updating PV1 register data:', error);
        }
    }

    async start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, '0.0.0.0', () => {
                this.isRunning = true;
                console.log(`✅ PV1 Modbus server started on port ${this.port}`);
                resolve();
            });
            
            this.server.on('error', (err) => {
                console.error(`❌ Failed to start PV1 Modbus server on port ${this.port}:`, err);
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
                    console.log(`✅ PV1 Modbus server stopped on port ${this.port}`);
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

module.exports = { PV1Server };