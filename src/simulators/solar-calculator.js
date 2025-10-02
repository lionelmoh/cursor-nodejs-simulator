const moment = require('moment');

class SolarCalculator {
    constructor() {
        this.startTime = Date.now();
        this.dailyEnergy = 0;
        this.monthlyEnergy = 0;
        this.yearlyEnergy = 0;
        this.accumulatedEnergy = 0;
        this.dailyEnergyYield = 0;
        this.monthlyEnergyYield = 0;
        this.yearlyEnergyYield = 0;
        this.accumulatedEnergyYield = 0;
        this.totalRuntime = 0;
        this.startupTime = 0;
        this.shutdownTime = 0;
        
        // System configuration
        this.maxPower = 50000; // 50kW
        this.nominalVoltage = 600; // 600V
        this.nominalCurrent = 83.33; // 83.33A at 600V
        this.gridVoltage = 240; // 240V
        this.gridFrequency = 50; // 50Hz
        this.mpptChannels = 7; // 7 active MPPT channels out of 24
        
        // Initialize MPPT data
        this.mpptVoltages = new Array(24).fill(0);
        this.mpptCurrents = new Array(24).fill(0);
        
        // Initialize current data
        this.currentData = {};
        
        // Start the simulation
        this.startSimulation();
    }

    startSimulation() {
        // Simulate startup time
        this.startupTime = Math.floor(Math.random() * 300) + 60; // 1-6 minutes
        this.totalRuntime = this.startupTime;
        
        // Start data generation
        setInterval(() => {
            this.updateData();
        }, 1000);
    }

    updateData() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const second = now.getSeconds();
        
        // Calculate solar irradiance based on time of day
        const solarIrradiance = this.calculateSolarIrradiance(hour, minute, second);
        
        // Calculate temperature effects
        const ambientTemp = this.calculateAmbientTemperature(hour);
        const panelTemp = ambientTemp + (solarIrradiance * 0.03); // Panel heating effect
        
        // Calculate power generation
        const powerFactor = this.calculatePowerFactor(solarIrradiance, panelTemp);
        const inputPower = Math.min(this.maxPower * powerFactor, this.maxPower);
        
        // Calculate MPPT data
        this.updateMPPTData(solarIrradiance, panelTemp);
        
        // Calculate inverter parameters
        const efficiency = this.calculateEfficiency(inputPower, panelTemp);
        const outputPower = inputPower * efficiency;
        
        // Calculate grid parameters
        const gridPower = outputPower;
        const gridCurrent = gridPower / (this.gridVoltage * Math.sqrt(3));
        
        // Calculate energy yields
        this.updateEnergyData(outputPower);
        
        // Update runtime
        this.totalRuntime += 1;
        
        // Store current data
        this.currentData = {
            // MPPT data
            mpptVoltages: [...this.mpptVoltages],
            mpptCurrents: [...this.mpptCurrents],
            
            // Input parameters
            input_power: Math.round(inputPower),
            input_voltage: this.calculateInputVoltage(solarIrradiance, panelTemp),
            input_current: this.calculateInputCurrent(inputPower, this.calculateInputVoltage(solarIrradiance, panelTemp)),
            
            // Output parameters
            output_power: Math.round(outputPower),
            line_voltage_vab: this.gridVoltage + this.addNoise(2),
            line_voltage_vbc: this.gridVoltage + this.addNoise(2),
            line_voltage_vca: this.gridVoltage + this.addNoise(2),
            
            // Phase currents
            phase_a_current: Math.round(gridCurrent * 1000 + this.addNoise(100)),
            phase_b_current: Math.round(gridCurrent * 1000 + this.addNoise(100)),
            phase_c_current: Math.round(gridCurrent * 1000 + this.addNoise(100)),
            
            // Grid parameters
            grid_frequency: this.gridFrequency + this.addNoise(0.1),
            grid_voltage: this.gridVoltage + this.addNoise(2),
            grid_current: Math.round(gridCurrent * 1000 + this.addNoise(100)),
            grid_power: Math.round(gridPower),
            grid_power_factor: 0.98 + this.addNoise(0.02),
            
            // Temperature data
            inverter_temperature: 25 + (outputPower / this.maxPower) * 30 + this.addNoise(2),
            input_temperature: panelTemp + this.addNoise(1),
            boost_temperature: 30 + (outputPower / this.maxPower) * 25 + this.addNoise(2),
            
            // Efficiency data
            inverter_efficiency: efficiency * 100,
            input_efficiency: 0.95 + this.addNoise(0.02),
            output_efficiency: efficiency * 100,
            
            // Time data
            startup_time: this.startupTime,
            shutdown_time: this.shutdownTime,
            total_runtime: this.totalRuntime,
            
            // Energy data
            total_energy: this.accumulatedEnergy,
            daily_energy: this.dailyEnergy,
            monthly_energy: this.monthlyEnergy,
            yearly_energy: this.yearlyEnergy,
            accumulated_energy: this.accumulatedEnergy,
            daily_energy_yield: this.dailyEnergyYield,
            monthly_energy_yield: this.monthlyEnergyYield,
            yearly_energy_yield: this.yearlyEnergyYield,
            accumulated_energy_yield: this.accumulatedEnergyYield
        };
    }

    calculateSolarIrradiance(hour, minute, second) {
        // Simulate solar irradiance based on time of day
        if (hour < 6 || hour > 18) return 0;
        
        const timeOfDay = hour + minute / 60 + second / 3600;
        const peakHour = 12; // Peak at noon
        const irradiance = Math.max(0, Math.sin((timeOfDay - 6) * Math.PI / 12) * 1000);
        
        // Add some cloud cover simulation
        const cloudFactor = 0.7 + Math.random() * 0.3;
        return irradiance * cloudFactor;
    }

    calculateAmbientTemperature(hour) {
        // Simulate daily temperature cycle
        const baseTemp = 20; // Base temperature
        const dailyVariation = 10 * Math.sin((hour - 6) * Math.PI / 12);
        return Math.max(5, baseTemp + dailyVariation + this.addNoise(2));
    }

    calculatePowerFactor(irradiance, temperature) {
        if (irradiance < 100) return 0; // No power below 100 W/m²
        
        // Temperature derating
        const tempDerating = Math.max(0, 1 - (temperature - 25) * 0.004);
        
        // Irradiance factor
        const irradianceFactor = Math.min(irradiance / 1000, 1);
        
        return irradianceFactor * tempDerating;
    }

    calculateEfficiency(power, temperature) {
        // Inverter efficiency curve
        const baseEfficiency = 0.96;
        const tempDerating = Math.max(0.85, 1 - (temperature - 25) * 0.002);
        const loadFactor = power / this.maxPower;
        const loadDerating = 0.9 + (loadFactor * 0.1);
        
        return baseEfficiency * tempDerating * loadDerating;
    }

    calculateInputVoltage(irradiance, temperature) {
        if (irradiance < 100) return 0;
        
        const baseVoltage = this.nominalVoltage;
        const tempCoeff = -0.003; // -0.3% per °C
        const tempDerating = 1 + (temperature - 25) * tempCoeff;
        
        return baseVoltage * tempDerating + this.addNoise(5);
    }

    calculateInputCurrent(power, voltage) {
        if (voltage === 0) return 0;
        return power / voltage;
    }

    updateMPPTData(irradiance, temperature) {
        for (let i = 0; i < 24; i++) {
            if (i < this.mpptChannels) {
                // Active MPPT channels
                const channelIrradiance = irradiance * (0.8 + Math.random() * 0.4);
                const channelPower = (this.maxPower / this.mpptChannels) * (channelIrradiance / 1000);
                const channelVoltage = this.calculateInputVoltage(channelIrradiance, temperature) / this.mpptChannels;
                
                // Calculate current with proper bounds checking
                let channelCurrent = 0;
                if (channelVoltage > 0.1) { // Minimum voltage threshold
                    channelCurrent = channelPower / channelVoltage;
                } else {
                    channelCurrent = 0; // No current if voltage is too low
                }
                
                // Ensure positive values (power flowing out of PV)
                this.mpptVoltages[i] = Math.max(0, channelVoltage + this.addNoise(2));
                this.mpptCurrents[i] = Math.max(0, Math.min(channelCurrent + this.addNoise(0.5), 100)); // Cap at 100A
            } else {
                // Inactive MPPT channels
                this.mpptVoltages[i] = 0;
                this.mpptCurrents[i] = 0;
            }
        }
    }

    updateEnergyData(power) {
        // Convert power (W) to energy (kWh) - 1 second = 1/3600 hour
        const energyIncrement = power / 3600;
        
        this.accumulatedEnergy += energyIncrement;
        this.accumulatedEnergyYield += energyIncrement;
        
        // Check if it's a new day
        const now = moment();
        const today = now.format('YYYY-MM-DD');
        
        if (!this.lastUpdateDate) {
            this.lastUpdateDate = today;
        }
        
        if (today !== this.lastUpdateDate) {
            // New day - reset daily counters
            this.dailyEnergy = 0;
            this.dailyEnergyYield = 0;
            this.lastUpdateDate = today;
        }
        
        this.dailyEnergy += energyIncrement;
        this.dailyEnergyYield += energyIncrement;
        
        // Update monthly and yearly (simplified)
        this.monthlyEnergy += energyIncrement;
        this.yearlyEnergy += energyIncrement;
        this.monthlyEnergyYield += energyIncrement;
        this.yearlyEnergyYield += energyIncrement;
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
            totalRuntime: this.totalRuntime,
            accumulatedEnergy: this.accumulatedEnergy,
            dailyEnergy: this.dailyEnergy
        };
    }

    reset() {
        this.dailyEnergy = 0;
        this.monthlyEnergy = 0;
        this.yearlyEnergy = 0;
        this.accumulatedEnergy = 0;
        this.dailyEnergyYield = 0;
        this.monthlyEnergyYield = 0;
        this.yearlyEnergyYield = 0;
        this.accumulatedEnergyYield = 0;
        this.totalRuntime = 0;
        this.startupTime = 0;
        this.shutdownTime = 0;
    }
}

// Create singleton instance
const solarCalculator = new SolarCalculator();

module.exports = { solarCalculator };
