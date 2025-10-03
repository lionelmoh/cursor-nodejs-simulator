const moment = require('moment');

class BatteryCalculator {
    constructor() {
        this.startTime = Date.now();
        
        // Battery system configuration
        this.batteryCapacity = 200; // 200kWh
        this.pcsCapacity = 100; // 100kW
        this.nominalVoltage = 400; // 400V
        this.maxCurrent = 250; // 250A
        
        // Rack configuration - 17 modules, 8 cells each
        this.rackCount = 1; // Single rack system
        this.modulesPerRack = 17;
        this.cellsPerModule = 8;
        this.totalCells = this.rackCount * this.modulesPerRack * this.cellsPerModule; // 136 cells
        
        // Cell specifications (Lithium NMC)
        this.cellNominalVoltage = 3.7; // V
        this.cellCapacity = 50; // Ah
        this.cellMaxVoltage = 4.2; // V
        this.cellMinVoltage = 3.0; // V
        this.cellMaxTemperature = 60; // °C
        this.cellMinTemperature = -20; // °C
        
        // Rack state
        this.rackMode = 3; // 3 = Online
        this.rackSOC = 50; // 50% SOC
        this.rackSOH = 95; // 95% SOH
        this.rackVoltage = this.nominalVoltage;
        this.rackCurrent = 0;
        this.rackPower = 0;
        this.rackTemperature = 25;
        
        // Cell monitoring arrays
        this.cellVoltages = new Array(this.totalCells).fill(this.cellNominalVoltage);
        this.cellTemperatures = new Array(this.totalCells).fill(25);
        
        // Peak shaving parameters
        this.peakShavingEnabled = true;
        this.peakThreshold = 60; // kW - start peak shaving above this load
        this.peakShavingPower = 40; // kW - power to shave from peak
        this.peakShavingSOC = 20; // % - minimum SOC for peak shaving
        
        // Grid and load parameters (3-phase)
        this.gridVoltageA = 240;
        this.gridVoltageB = 240;
        this.gridVoltageC = 240;
        this.gridCurrentA = 0;
        this.gridCurrentB = 0;
        this.gridCurrentC = 0;
        this.gridPower = 0;
        this.gridPowerFactor = 0.95;
        this.gridFrequency = 50.0;
        this.loadPower = 0;
        this.pcsPower = 0;
        this.pcsEfficiency = 0.95;
        this.pcsTemperature = 30;
        
        // System status
        this.systemStatus = 1; // 1 = Running
        this.batteryStatus = 1; // 1 = Normal
        this.pcsStatus = 1; // 1 = Normal
        
        // Load profile
        this.loadProfile = this.generateLoadProfile();
        this.currentLoadIndex = 0;
        
        // Initialize current data
        this.currentData = {};
        
        // Alarm system
        this.alarmSystem = {
            isActive: false,
            alarmType: null,
            startTime: 0,
            duration: 10000, // 10 seconds in milliseconds
            triggerInterval: 120000, // 2 minutes in milliseconds
            lastTrigger: 0,
            alarmTypes: [
                'overvoltage',
                'undervoltage',
                'overtemperature',
                'undertemperature',
                'overcurrent',
                'communication_error',
                'cell_imbalance',
                'isolation_fault',
                'ground_fault',
                'thermal_runaway',
                'low_soc',
                'high_soc'
            ]
        };
        
        // Start the simulation
        this.startSimulation();
    }

    startSimulation() {
        // Start data generation
        setInterval(() => {
            this.updateData();
        }, 1000);
        
        // Start alarm system
        setInterval(() => {
            this.updateAlarmSystem();
        }, 1000);
    }

    generateLoadProfile() {
        // Generate a realistic daily load profile
        const profile = [];
        for (let hour = 0; hour < 24; hour++) {
            let baseLoad;
            if (hour >= 6 && hour < 9) {
                // Morning peak
                baseLoad = 60 + Math.random() * 20;
            } else if (hour >= 17 && hour < 22) {
                // Evening peak
                baseLoad = 70 + Math.random() * 20;
            } else if (hour >= 22 || hour < 6) {
                // Night low
                baseLoad = 30 + Math.random() * 10;
            } else {
                // Daytime
                baseLoad = 50 + Math.random() * 15;
            }
            profile.push(baseLoad);
        }
        return profile;
    }

    updateData() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        // Update load power based on time of day
        this.updateLoadPower(hour, minute);
        
        // Update cell monitoring
        this.updateCellMonitoring();
        
        // Calculate peak shaving operation
        this.updatePeakShavingOperation();
        
        // Calculate battery operation
        this.updateBatteryOperation();
        
        // Calculate grid interaction
        this.updateGridInteraction();
        
        // Update PCS parameters
        this.updatePCSParameters();
        
        // Update system status
        this.updateSystemStatus();
        
        // Store current data
        this.currentData = {
            // System level data
            systemStatus: this.systemStatus,
            batteryStatus: this.batteryStatus,
            pcsStatus: this.pcsStatus,
            systemVoltage: Math.round(this.rackVoltage * 10), // 0.1V units
            systemCurrent: Math.round(this.rackCurrent * 10), // 0.1A units
            systemSOC: Math.round(this.rackSOC * 10), // 0.1% units
            systemSOH: Math.round(this.rackSOH * 10), // 0.1% units
            maxCellVoltage: Math.round(this.getMaxCellVoltage() * 1000), // 1mV units
            minCellVoltage: Math.round(this.getMinCellVoltage() * 1000), // 1mV units
            maxCellTemperature: Math.round(this.getMaxCellTemperature() * 100), // 0.01°C units
            minCellTemperature: Math.round(this.getMinCellTemperature() * 100), // 0.01°C units
            
            // Rack level data
            rackVoltage: Math.round(this.rackVoltage * 10), // 0.1V units
            rackCurrent: Math.round(this.rackCurrent * 10), // 0.1A units
            rackCurrentAverage: Math.round(this.rackCurrent * 10), // 0.1A units
            rackMode: this.rackMode,
            rackSOC: Math.round(this.rackSOC * 10), // 0.1% units
            rackSOH: Math.round(this.rackSOH * 10), // 0.1% units
            rackPower: Math.round(this.rackPower), // 1W units
            rackTemperature: Math.round(this.rackTemperature * 10), // 0.1°C units
            rackHeartbeat: Math.floor((Date.now() - this.startTime) / 1000) % 256,
            
            // Cell monitoring
            maxCellVoltage1: Math.round(this.getMaxCellVoltage() * 1000), // 1mV units
            maxCellVoltage2: Math.round(this.getSecondMaxCellVoltage() * 1000), // 1mV units
            avgCellVoltage: Math.round(this.getAvgCellVoltage() * 1000), // 1mV units
            minCellVoltage2: Math.round(this.getSecondMinCellVoltage() * 1000), // 1mV units
            minCellVoltage1: Math.round(this.getMinCellVoltage() * 1000), // 1mV units
            maxCellTemperature1: Math.round(this.getMaxCellTemperature() * 100), // 0.01°C units
            maxCellTemperature2: Math.round(this.getSecondMaxCellTemperature() * 100), // 0.01°C units
            avgCellTemperature: Math.round(this.getAvgCellTemperature() * 100), // 0.01°C units
            minCellTemperature2: Math.round(this.getSecondMinCellTemperature() * 100), // 0.01°C units
            minCellTemperature1: Math.round(this.getMinCellTemperature() * 100), // 0.01°C units
            
            // Grid and load parameters
            gridVoltageA: Math.round(this.gridVoltageA * 10), // 0.1V units
            gridVoltageB: Math.round(this.gridVoltageB * 10), // 0.1V units
            gridVoltageC: Math.round(this.gridVoltageC * 10), // 0.1V units
            gridCurrentA: Math.round(this.gridCurrentA * 10), // 0.1A units
            gridCurrentB: Math.round(this.gridCurrentB * 10), // 0.1A units
            gridCurrentC: Math.round(this.gridCurrentC * 10), // 0.1A units
            gridPower: Math.round(this.gridPower), // 1W units
            gridPowerFactor: Math.round(this.gridPowerFactor * 100), // 0.01 units
            gridFrequency: Math.round(this.gridFrequency * 100), // 0.01Hz units
            loadPower: Math.round(this.loadPower), // 1W units
            pcsPower: Math.round(this.pcsPower), // 1W units
            pcsEfficiency: Math.round(this.pcsEfficiency * 1000), // 0.1% units
            pcsTemperature: Math.round(this.pcsTemperature * 10), // 0.1°C units
            
            // Protection and alarm flags
            majorProtection1: this.getMajorProtection(1),
            majorProtection2: this.getMajorProtection(2),
            majorProtection3: this.getMajorProtection(3),
            majorProtection4: this.getMajorProtection(4),
            minorProtection1: this.getMinorProtection(1),
            minorProtection2: this.getMinorProtection(2),
            minorProtection3: this.getMinorProtection(3),
            minorProtection4: this.getMinorProtection(4),
            alarm1: this.getAlarm(1),
            alarm2: this.getAlarm(2),
            alarm3: this.getAlarm(3),
            alarm4: this.getAlarm(4),
            
            // Alarm system data
            alarm_active: this.alarmSystem.isActive,
            alarm_type: this.alarmSystem.alarmType,
            alarm_code: this.getAlarmCode()
        };
    }

    updateLoadPower(hour, minute) {
        // Get base load for current hour
        const baseLoad = this.loadProfile[hour];
        
        // Add some variation
        const variation = (Math.random() - 0.5) * 10;
        this.loadPower = -Math.max(20, baseLoad + variation); // Negative = consumption
        
        // Add some minute-level variation
        const minuteVariation = Math.sin(minute * Math.PI / 30) * 5;
        this.loadPower -= minuteVariation; // Subtract to keep load negative
        
        this.loadPower = Math.round(this.loadPower);
    }

    updateCellMonitoring() {
        // Update cell voltages with realistic variations
        for (let i = 0; i < this.totalCells; i++) {
            // Base voltage varies with SOC
            const baseVoltage = this.cellMinVoltage + (this.cellMaxVoltage - this.cellMinVoltage) * (this.rackSOC / 100);
            
            // Add small random variations
            const variation = (Math.random() - 0.5) * 0.1; // ±0.05V variation
            this.cellVoltages[i] = Math.max(this.cellMinVoltage, Math.min(this.cellMaxVoltage, baseVoltage + variation));
            
            // Update cell temperatures
            const baseTemp = 25 + (this.rackPower / this.pcsCapacity) * 15; // Heating with power
            const tempVariation = (Math.random() - 0.5) * 5; // ±2.5°C variation
            this.cellTemperatures[i] = Math.max(this.cellMinTemperature, Math.min(this.cellMaxTemperature, baseTemp + tempVariation));
        }
    }

    updatePeakShavingOperation() {
        if (!this.peakShavingEnabled) {
            this.rackPower = 0;
            return;
        }

        // Check if we should engage peak shaving
        // Load power is negative, so we check if absolute value exceeds threshold
        if (Math.abs(this.loadPower) > this.peakThreshold && this.rackSOC > this.peakShavingSOC) {
            // Calculate how much power we can provide
            const availablePower = Math.min(this.peakShavingPower, this.pcsCapacity);
            const socBasedPower = (this.rackSOC / 100) * this.pcsCapacity;
            const actualPower = Math.min(availablePower, socBasedPower);
            
            // Discharge to shave peak
            this.rackPower = actualPower; // Positive = discharge (power flowing out of battery)
        } else if (Math.abs(this.loadPower) < this.peakThreshold * 0.8 && this.rackSOC < 80) {
            // Charge during low load periods
            const chargePower = Math.min(20, this.pcsCapacity * 0.2); // 20kW or 20% of capacity
            this.rackPower = -chargePower; // Negative = charge (power flowing into battery)
        } else {
            // Idle
            this.rackPower = 0;
        }
    }

    updateBatteryOperation() {
        // Use rack power from peak shaving operation
        // Current follows power sign (positive = discharge, negative = charge)
        if (this.rackVoltage > 0) {
            this.rackCurrent = this.rackPower / this.rackVoltage;
        } else {
            this.rackCurrent = 0;
        }
        
        // Update SOC based on power flow
        // Positive power = discharge = SOC decreases
        // Negative power = charge = SOC increases
        const energyChange = this.rackPower / 3600; // Convert W to kWh per second
        this.rackSOC -= energyChange / this.batteryCapacity * 100; // Subtract for discharge, add for charge
        this.rackSOC = Math.max(0, Math.min(100, this.rackSOC));
        
        // Update rack voltage based on SOC and cell voltages
        const avgCellVoltage = this.getAvgCellVoltage();
        this.rackVoltage = avgCellVoltage * this.cellsPerModule * this.modulesPerRack;
        
        // Update rack temperature (average of cell temperatures)
        this.rackTemperature = this.getAvgCellTemperature();
        
        // Update SOH (slowly decreases over time)
        if (Math.random() < 0.001) { // 0.1% chance per update
            this.rackSOH = Math.max(80, this.rackSOH - 0.01);
        }
    }

    updateGridInteraction() {
        // Calculate grid power based on load and rack operation
        // Load power is negative (consumption), rack power is positive (discharge) or negative (charge)
        // Grid power = Load power + Rack power (since load is negative, we add rack power)
        this.gridPower = this.loadPower + this.rackPower;
        
        // Update 3-phase grid voltages with slight variations
        const baseVoltage = 240;
        this.gridVoltageA = baseVoltage + this.addNoise(2);
        this.gridVoltageB = baseVoltage + this.addNoise(2);
        this.gridVoltageC = baseVoltage + this.addNoise(2);
        
        // Calculate 3-phase grid currents
        const avgVoltage = (this.gridVoltageA + this.gridVoltageB + this.gridVoltageC) / 3;
        // Grid power is positive when exporting to grid, negative when importing from grid
        const baseCurrent = Math.abs(this.gridPower) / (avgVoltage * Math.sqrt(3));
        this.gridCurrentA = baseCurrent + this.addNoise(0.5);
        this.gridCurrentB = baseCurrent + this.addNoise(0.5);
        this.gridCurrentC = baseCurrent + this.addNoise(0.5);
        
        // Update grid frequency with slight variation
        this.gridFrequency = 50.0 + this.addNoise(0.1);
        
        // Update power factor
        this.gridPowerFactor = 0.95 + this.addNoise(0.02);
        this.gridPowerFactor = Math.max(0.8, Math.min(1.0, this.gridPowerFactor));
    }

    // Cell monitoring helper methods
    getMaxCellVoltage() {
        if (!this.cellVoltages || this.cellVoltages.length === 0) {
            return this.cellNominalVoltage;
        }
        return Math.max(...this.cellVoltages);
    }

    getMinCellVoltage() {
        if (!this.cellVoltages || this.cellVoltages.length === 0) {
            return this.cellNominalVoltage;
        }
        return Math.min(...this.cellVoltages);
    }

    getSecondMaxCellVoltage() {
        const sorted = [...this.cellVoltages].sort((a, b) => b - a);
        return sorted[1] || sorted[0];
    }

    getSecondMinCellVoltage() {
        const sorted = [...this.cellVoltages].sort((a, b) => a - b);
        return sorted[1] || sorted[0];
    }

    getAvgCellVoltage() {
        if (!this.cellVoltages || this.cellVoltages.length === 0) {
            return this.cellNominalVoltage;
        }
        return this.cellVoltages.reduce((sum, voltage) => sum + voltage, 0) / this.cellVoltages.length;
    }

    getMaxCellTemperature() {
        if (!this.cellTemperatures || this.cellTemperatures.length === 0) {
            return 25;
        }
        return Math.max(...this.cellTemperatures);
    }

    getMinCellTemperature() {
        if (!this.cellTemperatures || this.cellTemperatures.length === 0) {
            return 25;
        }
        return Math.min(...this.cellTemperatures);
    }

    getSecondMaxCellTemperature() {
        const sorted = [...this.cellTemperatures].sort((a, b) => b - a);
        return sorted[1] || sorted[0];
    }

    getSecondMinCellTemperature() {
        const sorted = [...this.cellTemperatures].sort((a, b) => a - b);
        return sorted[1] || sorted[0];
    }

    getAvgCellTemperature() {
        return this.cellTemperatures.reduce((sum, temp) => sum + temp, 0) / this.cellTemperatures.length;
    }

    updatePCSParameters() {
        // PCS power is the same as rack power
        this.pcsPower = this.rackPower;
        
        // PCS efficiency varies with power
        if (Math.abs(this.pcsPower) < 10) {
            this.pcsEfficiency = 0.85; // Low efficiency at low power
        } else {
            this.pcsEfficiency = 0.95 - Math.abs(this.pcsPower) / this.pcsCapacity * 0.05;
        }
        
        // PCS temperature
        this.pcsTemperature = 30 + Math.abs(this.pcsPower) / this.pcsCapacity * 20;
        this.pcsTemperature += this.addNoise(1);
    }

    updateSystemStatus() {
        // Check for alarm conditions
        if (this.rackSOC < 5) {
            this.batteryStatus = 2; // Low SOC alarm
        } else if (this.rackSOC > 95) {
            this.batteryStatus = 3; // High SOC alarm
        } else {
            this.batteryStatus = 1; // Normal
        }
        
        if (this.rackTemperature > 60) {
            this.pcsStatus = 2; // High temperature alarm
        } else if (this.pcsTemperature > 70) {
            this.pcsStatus = 3; // Critical temperature alarm
        } else {
            this.pcsStatus = 1; // Normal
        }
        
        // Overall system status
        if (this.batteryStatus === 1 && this.pcsStatus === 1) {
            this.systemStatus = 1; // Normal
        } else {
            this.systemStatus = 2; // Warning
        }
    }

    addNoise(value) {
        return (Math.random() - 0.5) * value;
    }

    getCurrentData() {
        // Ensure data is initialized
        if (!this.currentData || Object.keys(this.currentData).length === 0) {
            this.updateData();
        }
        return this.currentData || {};
    }

    getStatus() {
        return {
            isRunning: true,
            rackSOC: this.rackSOC,
            rackSOH: this.rackSOH,
            rackPower: this.rackPower,
            loadPower: this.loadPower,
            gridPower: this.gridPower,
            peakShavingEnabled: this.peakShavingEnabled,
            totalCells: this.totalCells,
            modulesPerRack: this.modulesPerRack,
            cellsPerModule: this.cellsPerModule
        };
    }

    reset() {
        this.rackSOC = 50;
        this.rackSOH = 95;
        this.rackVoltage = this.nominalVoltage;
        this.rackCurrent = 0;
        this.rackPower = 0;
        this.rackTemperature = 25;
        this.gridCurrentA = 0;
        this.gridCurrentB = 0;
        this.gridCurrentC = 0;
        this.gridPower = 0;
        this.gridPowerFactor = 0.95;
        this.gridFrequency = 50.0;
        this.loadPower = 0;
        this.pcsPower = 0;
        this.pcsEfficiency = 0.95;
        this.pcsTemperature = 30;
        this.systemStatus = 1;
        this.batteryStatus = 1;
        this.pcsStatus = 1;
        
        // Reset cell arrays
        this.cellVoltages.fill(this.cellNominalVoltage);
        this.cellTemperatures.fill(25);
        
        // Reset alarm system
        this.alarmSystem.isActive = false;
        this.alarmSystem.alarmType = null;
        this.alarmSystem.startTime = 0;
        this.alarmSystem.lastTrigger = 0;
    }

    setSOC(soc) {
        this.rackSOC = Math.max(0, Math.min(100, soc));
    }

    setLoadPower(power) {
        this.loadPower = -Math.max(0, power); // Ensure load power is negative (consumption)
    }

    setPeakShaving(enabled) {
        this.peakShavingEnabled = enabled;
    }

    setPeakThreshold(threshold) {
        this.peakThreshold = Math.max(0, threshold);
    }

    setPeakShavingPower(power) {
        this.peakShavingPower = Math.max(0, Math.min(power, this.pcsCapacity));
    }
    
    updateAlarmSystem() {
        const now = Date.now();
        
        // Check if we should trigger a new alarm
        if (!this.alarmSystem.isActive && 
            (now - this.alarmSystem.lastTrigger) >= this.alarmSystem.triggerInterval) {
            this.triggerRandomAlarm();
        }
        
        // Check if current alarm should expire
        if (this.alarmSystem.isActive && 
            (now - this.alarmSystem.startTime) >= this.alarmSystem.duration) {
            this.clearAlarm();
        }
    }
    
    triggerRandomAlarm() {
        const randomIndex = Math.floor(Math.random() * this.alarmSystem.alarmTypes.length);
        this.alarmSystem.alarmType = this.alarmSystem.alarmTypes[randomIndex];
        this.alarmSystem.isActive = true;
        this.alarmSystem.startTime = Date.now();
        this.alarmSystem.lastTrigger = Date.now();
        
        console.log(`🚨 Battery Alarm triggered: ${this.alarmSystem.alarmType}`);
    }
    
    clearAlarm() {
        console.log(`✅ Battery Alarm cleared: ${this.alarmSystem.alarmType}`);
        this.alarmSystem.isActive = false;
        this.alarmSystem.alarmType = null;
        this.alarmSystem.startTime = 0;
    }
    
    getAlarmCode() {
        if (!this.alarmSystem.isActive) return 0;
        
        const alarmCodes = {
            'overvoltage': 0x2001,
            'undervoltage': 0x2002,
            'overtemperature': 0x2003,
            'undertemperature': 0x2004,
            'overcurrent': 0x2005,
            'communication_error': 0x2006,
            'cell_imbalance': 0x2007,
            'isolation_fault': 0x2008,
            'ground_fault': 0x2009,
            'thermal_runaway': 0x200A,
            'low_soc': 0x200B,
            'high_soc': 0x200C
        };
        
        return alarmCodes[this.alarmSystem.alarmType] || 0;
    }
    
    getMajorProtection(number) {
        if (!this.alarmSystem.isActive) return 0;
        
        // Map alarm types to major protection bits
        const majorProtectionMap = {
            'overvoltage': 1,
            'undervoltage': 2,
            'overtemperature': 4,
            'overcurrent': 8,
            'thermal_runaway': 16,
            'isolation_fault': 32,
            'ground_fault': 64,
            'cell_imbalance': 128
        };
        
        const bitValue = majorProtectionMap[this.alarmSystem.alarmType] || 0;
        return (bitValue >> (number - 1)) & 1;
    }
    
    getMinorProtection(number) {
        if (!this.alarmSystem.isActive) return 0;
        
        // Map alarm types to minor protection bits
        const minorProtectionMap = {
            'undertemperature': 1,
            'low_soc': 2,
            'high_soc': 4,
            'communication_error': 8
        };
        
        const bitValue = minorProtectionMap[this.alarmSystem.alarmType] || 0;
        return (bitValue >> (number - 1)) & 1;
    }
    
    getAlarm(number) {
        if (!this.alarmSystem.isActive) return 0;
        
        // Map alarm types to alarm bits
        const alarmMap = {
            'overvoltage': 1,
            'undervoltage': 2,
            'overtemperature': 4,
            'undertemperature': 8,
            'overcurrent': 16,
            'communication_error': 32,
            'cell_imbalance': 64,
            'isolation_fault': 128
        };
        
        const bitValue = alarmMap[this.alarmSystem.alarmType] || 0;
        return (bitValue >> (number - 1)) & 1;
    }
}

// Create singleton instance
const batteryCalculator = new BatteryCalculator();

module.exports = { batteryCalculator };
