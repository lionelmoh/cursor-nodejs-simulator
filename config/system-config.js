module.exports = {
    // Solar Panel Configuration
    solar: {
        maxPower: 50000, // 50kW
        nominalVoltage: 600, // 600V
        nominalCurrent: 83.33, // 83.33A
        mpptChannels: 7, // 7 active channels out of 24
        totalChannels: 24,
        temperatureCoeff: -0.003, // -0.3% per °C
        efficiency: 0.95
    },

    // Inverter Configuration
    inverter: {
        maxPower: 50000, // 50kW
        nominalEfficiency: 0.96,
        gridVoltage: 240, // 240V
        gridFrequency: 50, // 50Hz
        powerFactor: 0.98,
        operatingTempRange: [-40, 80], // °C
        startupTime: 60, // seconds
        shutdownTime: 30 // seconds
    },

    // Battery System Configuration
    battery: {
        capacity: 200, // 200kWh
        nominalVoltage: 400, // 400V
        maxCurrent: 250, // 250A
        socRange: [5, 95], // 5% to 95%
        operatingTempRange: [-20, 60], // °C
        efficiency: 0.95,
        maxChargeRate: 0.5, // 0.5C
        maxDischargeRate: 1.0 // 1.0C
    },

    // PCS Configuration
    pcs: {
        capacity: 100, // 100kW
        efficiency: 0.95,
        operatingTempRange: [-20, 70], // °C
        responseTime: 1, // seconds
        powerFactor: 0.98
    },

    // Load Profile Configuration
    load: {
        minLoad: 20, // 20kW
        maxLoad: 80, // 80kW
        averageLoad: 50, // 50kW
        peakHours: [6, 9, 17, 22], // Peak load hours
        nightHours: [22, 6] // Night hours
    },

    // Grid Configuration
    grid: {
        voltage: 240, // 240V
        frequency: 50, // 50Hz
        voltageTolerance: 0.01, // ±1%
        frequencyTolerance: 0.005, // ±0.5%
        powerFactor: 0.98
    },

    // Simulation Configuration
    simulation: {
        updateInterval: 1000, // 1 second
        dataRetention: 86400, // 24 hours in seconds
        logLevel: 'info',
        enableAlarms: true,
        enableDataLogging: true
    },

    // Alarm Configuration
    alarms: {
        lowSOC: 10, // 10%
        highSOC: 90, // 90%
        highTemperature: 60, // 60°C
        criticalTemperature: 70, // 70°C
        lowVoltage: 200, // 200V
        highVoltage: 280, // 280V
        lowFrequency: 49.5, // 49.5Hz
        highFrequency: 50.5 // 50.5Hz
    }
};
