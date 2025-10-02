module.exports = {
    // Modbus Server Configuration
    servers: {
        pv1: {
            port: 10502,
            host: '0.0.0.0',
            unitId: 1,
            debug: false
        },
        pv2: {
            port: 10503,
            host: '0.0.0.0',
            unitId: 1,
            debug: false
        },
        battery: {
            port: 10504,
            host: '0.0.0.0',
            unitId: 1,
            debug: false
        }
    },

    // PV System Register Map
    pvRegisters: {
        // MPPT Data (24 channels)
        mppt: {
            startAddress: 32016,
            count: 48, // 24 channels × 2 (voltage + current)
            voltageRegisters: Array.from({length: 24}, (_, i) => 32016 + (i * 2)),
            currentRegisters: Array.from({length: 24}, (_, i) => 32017 + (i * 2))
        },
        
        // Main Inverter Data
        main: {
            inputPower: { address: 32064, type: '32bit', units: 'W', scaling: 1 },
            inputVoltage: { address: 32066, type: '16bit', units: 'V', scaling: 0.1 },
            inputCurrent: { address: 32067, type: '16bit', units: 'A', scaling: 0.1 },
            outputPower: { address: 32068, type: '32bit', units: 'W', scaling: 1 },
            lineVoltageVAB: { address: 32070, type: '16bit', units: 'V', scaling: 0.1 },
            lineVoltageVBC: { address: 32071, type: '16bit', units: 'V', scaling: 0.1 },
            lineVoltageVCA: { address: 32072, type: '16bit', units: 'V', scaling: 0.1 },
            phaseACurrent: { address: 32073, type: '32bit', units: 'A', scaling: 0.1 },
            phaseBCurrent: { address: 32075, type: '32bit', units: 'A', scaling: 0.1 },
            phaseCCurrent: { address: 32077, type: '32bit', units: 'A', scaling: 0.1 },
            gridFrequency: { address: 32079, type: '16bit', units: 'Hz', scaling: 0.01 },
            inverterTemperature: { address: 32080, type: '16bit', units: '°C', scaling: 0.1 },
            inputTemperature: { address: 32081, type: '16bit', units: '°C', scaling: 0.1 },
            boostTemperature: { address: 32082, type: '16bit', units: '°C', scaling: 0.1 },
            inverterEfficiency: { address: 32083, type: '16bit', units: '%', scaling: 0.1 },
            inputEfficiency: { address: 32084, type: '16bit', units: '%', scaling: 0.1 },
            outputEfficiency: { address: 32085, type: '16bit', units: '%', scaling: 0.1 },
            gridVoltage: { address: 32086, type: '16bit', units: 'V', scaling: 0.1 },
            gridCurrent: { address: 32087, type: '16bit', units: 'A', scaling: 0.1 },
            gridPower: { address: 32088, type: '16bit', units: 'W', scaling: 1 },
            gridFrequency2: { address: 32089, type: '16bit', units: 'Hz', scaling: 0.01 },
            gridPowerFactor: { address: 32090, type: '16bit', units: '-', scaling: 0.01 }
        },
        
        // Time Data
        time: {
            startupTime: { address: 32091, type: '32bit', units: 's', scaling: 1 },
            shutdownTime: { address: 32093, type: '32bit', units: 's', scaling: 1 },
            totalRuntime: { address: 32095, type: '32bit', units: 's', scaling: 1 }
        },
        
        // Energy Data
        energy: {
            totalEnergy: { address: 32097, type: '32bit', units: 'kWh', scaling: 0.1 },
            dailyEnergy: { address: 32099, type: '32bit', units: 'kWh', scaling: 0.01 },
            monthlyEnergy: { address: 32101, type: '32bit', units: 'kWh', scaling: 0.1 },
            yearlyEnergy: { address: 32103, type: '32bit', units: 'kWh', scaling: 0.1 },
            accumulatedEnergy: { address: 32105, type: '32bit', units: 'kWh', scaling: 0.1 },
            dailyEnergyYield: { address: 32107, type: '32bit', units: 'kWh', scaling: 0.01 },
            monthlyEnergyYield: { address: 32109, type: '32bit', units: 'kWh', scaling: 0.1 },
            yearlyEnergyYield: { address: 32111, type: '32bit', units: 'kWh', scaling: 0.1 },
            accumulatedEnergyYield: { address: 32113, type: '32bit', units: 'kWh', scaling: 0.1 }
        }
    },

    // Battery System Register Map
    batteryRegisters: {
        // System Status
        status: {
            systemStatus: { address: 40001, type: '16bit', units: '-', scaling: 1 },
            batteryStatus: { address: 40002, type: '16bit', units: '-', scaling: 1 },
            pcsStatus: { address: 40003, type: '16bit', units: '-', scaling: 1 }
        },
        
        // Battery Parameters
        battery: {
            soc: { address: 40004, type: '32bit', units: '%', scaling: 0.1 },
            voltage: { address: 40006, type: '32bit', units: 'V', scaling: 0.1 },
            current: { address: 40008, type: '32bit', units: 'A', scaling: 0.1 },
            power: { address: 40010, type: '32bit', units: 'W', scaling: 1 },
            temperature: { address: 40012, type: '32bit', units: '°C', scaling: 0.1 }
        },
        
        // Grid Parameters
        grid: {
            voltage: { address: 40014, type: '32bit', units: 'V', scaling: 0.1 },
            current: { address: 40016, type: '32bit', units: 'A', scaling: 0.1 },
            power: { address: 40018, type: '32bit', units: 'W', scaling: 1 }
        },
        
        // Load Parameters
        load: {
            power: { address: 40020, type: '32bit', units: 'W', scaling: 1 }
        },
        
        // PCS Parameters
        pcs: {
            power: { address: 40022, type: '32bit', units: 'W', scaling: 1 },
            efficiency: { address: 40024, type: '32bit', units: '%', scaling: 0.1 },
            temperature: { address: 40026, type: '32bit', units: '°C', scaling: 0.1 }
        }
    },

    // Register Data Types
    dataTypes: {
        '16bit': {
            min: 0,
            max: 65535,
            signed: false
        },
        '32bit': {
            min: 0,
            max: 4294967295,
            signed: false
        }
    }
};
