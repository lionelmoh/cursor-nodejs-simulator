/**
 * Data processing utilities for PV Simulator
 */

class DataProcessor {
    /**
     * Convert 32-bit register value to actual value
     * @param {number} highWord - High word (16-bit)
     * @param {number} lowWord - Low word (16-bit)
     * @param {number} scaling - Scaling factor
     * @returns {number} Actual value
     */
    static from32Bit(highWord, lowWord, scaling = 1) {
        const value = (highWord << 16) | lowWord;
        return value * scaling;
    }

    /**
     * Convert actual value to 32-bit register format
     * @param {number} value - Actual value
     * @param {number} scaling - Scaling factor
     * @returns {object} Object with highWord and lowWord
     */
    static to32Bit(value, scaling = 1) {
        const scaledValue = Math.round(value / scaling);
        return {
            highWord: Math.floor(scaledValue / 65536),
            lowWord: scaledValue & 0xFFFF
        };
    }

    /**
     * Convert 16-bit register value to actual value
     * @param {number} value - Register value
     * @param {number} scaling - Scaling factor
     * @returns {number} Actual value
     */
    static from16Bit(value, scaling = 1) {
        return value * scaling;
    }

    /**
     * Convert actual value to 16-bit register format
     * @param {number} value - Actual value
     * @param {number} scaling - Scaling factor
     * @returns {number} Register value
     */
    static to16Bit(value, scaling = 1) {
        return Math.round(value / scaling);
    }

    /**
     * Add noise to a value for realistic simulation
     * @param {number} value - Base value
     * @param {number} noiseLevel - Noise level (percentage)
     * @returns {number} Value with noise
     */
    static addNoise(value, noiseLevel = 0.02) {
        const noise = (Math.random() - 0.5) * 2 * noiseLevel * value;
        return value + noise;
    }

    /**
     * Calculate power from voltage and current
     * @param {number} voltage - Voltage in V
     * @param {number} current - Current in A
     * @returns {number} Power in W
     */
    static calculatePower(voltage, current) {
        return voltage * current;
    }

    /**
     * Calculate current from power and voltage
     * @param {number} power - Power in W
     * @param {number} voltage - Voltage in V
     * @returns {number} Current in A
     */
    static calculateCurrent(power, voltage) {
        return voltage > 0 ? power / voltage : 0;
    }

    /**
     * Calculate efficiency
     * @param {number} output - Output value
     * @param {number} input - Input value
     * @returns {number} Efficiency (0-1)
     */
    static calculateEfficiency(output, input) {
        return input > 0 ? output / input : 0;
    }

    /**
     * Calculate temperature derating factor
     * @param {number} temperature - Current temperature in °C
     * @param {number} nominalTemp - Nominal temperature in °C
     * @param {number} tempCoeff - Temperature coefficient
     * @returns {number} Derating factor
     */
    static calculateTemperatureDerating(temperature, nominalTemp = 25, tempCoeff = -0.004) {
        return Math.max(0, 1 + (temperature - nominalTemp) * tempCoeff);
    }

    /**
     * Calculate solar irradiance based on time of day
     * @param {number} hour - Hour of day (0-23)
     * @param {number} minute - Minute of hour (0-59)
     * @param {number} second - Second of minute (0-59)
     * @returns {number} Irradiance in W/m²
     */
    static calculateSolarIrradiance(hour, minute = 0, second = 0) {
        if (hour < 6 || hour > 18) return 0;
        
        const timeOfDay = hour + minute / 60 + second / 3600;
        const peakHour = 12;
        const irradiance = Math.max(0, Math.sin((timeOfDay - 6) * Math.PI / 12) * 1000);
        
        // Add cloud cover simulation
        const cloudFactor = 0.7 + Math.random() * 0.3;
        return irradiance * cloudFactor;
    }

    /**
     * Calculate daily temperature cycle
     * @param {number} hour - Hour of day (0-23)
     * @param {number} baseTemp - Base temperature in °C
     * @param {number} variation - Daily variation in °C
     * @returns {number} Temperature in °C
     */
    static calculateDailyTemperature(hour, baseTemp = 20, variation = 10) {
        const dailyVariation = variation * Math.sin((hour - 6) * Math.PI / 12);
        return Math.max(5, baseTemp + dailyVariation);
    }

    /**
     * Generate load profile for a day
     * @param {number} hour - Hour of day (0-23)
     * @param {object} profile - Load profile configuration
     * @returns {number} Load power in kW
     */
    static generateLoadProfile(hour, profile = {}) {
        const {
            baseLoad = 50,
            peakMultiplier = 1.4,
            nightMultiplier = 0.6,
            peakHours = [6, 9, 17, 22],
            nightHours = [22, 6]
        } = profile;

        let multiplier = 1;
        
        // Check if in peak hours
        if (hour >= peakHours[0] && hour < peakHours[1]) {
            multiplier = peakMultiplier;
        } else if (hour >= peakHours[2] && hour < peakHours[3]) {
            multiplier = peakMultiplier;
        } else if (hour >= nightHours[0] || hour < nightHours[1]) {
            multiplier = nightMultiplier;
        }

        return baseLoad * multiplier;
    }

    /**
     * Calculate battery SOC based on power flow
     * @param {number} currentSOC - Current SOC in %
     * @param {number} power - Power flow in W (positive = discharge, negative = charge)
     * @param {number} capacity - Battery capacity in Wh
     * @param {number} timeStep - Time step in seconds
     * @returns {number} New SOC in %
     */
    static calculateSOC(currentSOC, power, capacity, timeStep = 1) {
        const energyChange = power * timeStep / 3600; // Convert to Wh
        const socChange = energyChange / capacity * 100;
        return Math.max(0, Math.min(100, currentSOC + socChange));
    }

    /**
     * Format value with appropriate units
     * @param {number} value - Value to format
     * @param {string} unit - Unit of measurement
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted string
     */
    static formatValue(value, unit, decimals = 2) {
        const formatted = value.toFixed(decimals);
        return `${formatted} ${unit}`;
    }

    /**
     * Convert timestamp to readable format
     * @param {number} timestamp - Unix timestamp
     * @returns {string} Formatted timestamp
     */
    static formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString();
    }

    /**
     * Calculate energy yield for a time period
     * @param {number} power - Power in W
     * @param {number} timeStep - Time step in seconds
     * @returns {number} Energy in Wh
     */
    static calculateEnergyYield(power, timeStep = 1) {
        return power * timeStep / 3600;
    }

    /**
     * Validate register address
     * @param {number} address - Register address
     * @param {number} minAddress - Minimum address
     * @param {number} maxAddress - Maximum address
     * @returns {boolean} True if valid
     */
    static validateRegisterAddress(address, minAddress = 0, maxAddress = 65535) {
        return address >= minAddress && address <= maxAddress;
    }

    /**
     * Calculate checksum for data integrity
     * @param {Array} data - Data array
     * @returns {number} Checksum
     */
    static calculateChecksum(data) {
        return data.reduce((sum, value) => sum + value, 0) & 0xFFFF;
    }
}

module.exports = { DataProcessor };
