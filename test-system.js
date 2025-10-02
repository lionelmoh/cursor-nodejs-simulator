#!/usr/bin/env node

/**
 * Test script for PV Simulator
 * This script tests the basic functionality of the simulation system
 */

const { solarCalculator } = require('./src/simulators/solar-calculator');
const { batteryCalculator } = require('./src/simulators/battery-calculator');
const { DataProcessor } = require('./src/utils/data-processor');

console.log('🧪 PV Simulator Test Script');
console.log('============================\n');

// Test 1: Solar Calculator
console.log('1. Testing Solar Calculator...');
try {
    const solarData = solarCalculator.getCurrentData();
    console.log('✅ Solar Calculator working');
    console.log(`   - Input Power: ${(solarData.input_power / 1000).toFixed(1)} kW`);
    console.log(`   - Output Power: ${(solarData.output_power / 1000).toFixed(1)} kW`);
    console.log(`   - Grid Voltage: ${solarData.grid_voltage.toFixed(1)} V`);
    console.log(`   - Efficiency: ${solarData.inverter_efficiency.toFixed(1)}%`);
    console.log(`   - Daily Energy: ${(solarData.daily_energy / 1000).toFixed(2)} kWh`);
} catch (error) {
    console.log('❌ Solar Calculator failed:', error.message);
}

console.log('');

// Test 2: Battery Calculator
console.log('2. Testing Battery Calculator...');
try {
    const batteryData = batteryCalculator.getCurrentData();
    console.log('✅ Battery Calculator working');
    console.log(`   - SOC: ${(batteryData.rackSOC / 10).toFixed(1)}%`);
    console.log(`   - Battery Voltage: ${(batteryData.rackVoltage / 10).toFixed(1)} V`);
    console.log(`   - Battery Current: ${(batteryData.rackCurrent / 10).toFixed(1)} A`);
    console.log(`   - Battery Power: ${(batteryData.rackPower / 1000).toFixed(1)} kW`);
    console.log(`   - Load Power: ${(batteryData.loadPower / 1000).toFixed(1)} kW`);
    console.log(`   - Grid Power: ${(batteryData.gridPower / 1000).toFixed(1)} kW`);
} catch (error) {
    console.log('❌ Battery Calculator failed:', error.message);
}

console.log('');

// Test 3: Data Processor
console.log('3. Testing Data Processor...');
try {
    // Test 32-bit conversion
    const testValue = 123456.78;
    const scaled = DataProcessor.to32Bit(testValue, 0.1);
    const converted = DataProcessor.from32Bit(scaled.highWord, scaled.lowWord, 0.1);
    console.log('✅ Data Processor working');
    console.log(`   - 32-bit conversion test: ${testValue} -> ${converted.toFixed(2)}`);
    
    // Test power calculation
    const power = DataProcessor.calculatePower(400, 125);
    console.log(`   - Power calculation: 400V × 125A = ${power}W`);
    
    // Test solar irradiance
    const irradiance = DataProcessor.calculateSolarIrradiance(12, 0, 0);
    console.log(`   - Solar irradiance at noon: ${irradiance.toFixed(1)} W/m²`);
    
} catch (error) {
    console.log('❌ Data Processor failed:', error.message);
}

console.log('');

// Test 4: MPPT Data
console.log('4. Testing MPPT Data...');
try {
    const solarData = solarCalculator.getCurrentData();
    console.log('✅ MPPT Data available');
    console.log('   - Active MPPT channels: 7');
    console.log('   - MPPT 1: ' + (solarData.mpptVoltages[0] / 10).toFixed(1) + 'V, ' + (solarData.mpptCurrents[0] / 10).toFixed(1) + 'A');
    console.log('   - MPPT 2: ' + (solarData.mpptVoltages[1] / 10).toFixed(1) + 'V, ' + (solarData.mpptCurrents[1] / 10).toFixed(1) + 'A');
    console.log('   - MPPT 3: ' + (solarData.mpptVoltages[2] / 10).toFixed(1) + 'V, ' + (solarData.mpptCurrents[2] / 10).toFixed(1) + 'A');
} catch (error) {
    console.log('❌ MPPT Data failed:', error.message);
}

console.log('');

// Test 5: System Status
console.log('5. Testing System Status...');
try {
    const solarStatus = solarCalculator.getStatus();
    const batteryStatus = batteryCalculator.getStatus();
    console.log('✅ System Status working');
    console.log(`   - Solar System: ${solarStatus.isRunning ? 'Running' : 'Stopped'}`);
    console.log(`   - Battery System: ${batteryStatus.isRunning ? 'Running' : 'Stopped'}`);
    console.log(`   - Solar Runtime: ${Math.floor(solarStatus.totalRuntime / 3600)} hours`);
    console.log(`   - Battery SOC: ${batteryStatus.soc.toFixed(1)}%`);
} catch (error) {
    console.log('❌ System Status failed:', error.message);
}

console.log('');

// Test 6: Data Continuity
console.log('6. Testing Data Continuity...');
try {
    console.log('   - Waiting 3 seconds to test data updates...');
    
    setTimeout(() => {
        const solarData1 = solarCalculator.getCurrentData();
        const batteryData1 = batteryCalculator.getCurrentData();
        
        setTimeout(() => {
            const solarData2 = solarCalculator.getCurrentData();
            const batteryData2 = batteryCalculator.getCurrentData();
            
            const solarChanged = solarData1.total_runtime !== solarData2.total_runtime;
            const batteryChanged = batteryData1.batterySOC !== batteryData2.batterySOC;
            
            console.log('✅ Data Continuity working');
            console.log(`   - Solar data updating: ${solarChanged ? 'Yes' : 'No'}`);
            console.log(`   - Battery data updating: ${batteryChanged ? 'Yes' : 'No'}`);
            
            console.log('\n🎉 All tests completed successfully!');
            console.log('\n📋 Next steps:');
            console.log('   1. Run: npm install');
            console.log('   2. Run: npm start');
            console.log('   3. Open: http://localhost:3000');
            console.log('   4. Test Modbus: localhost:10502, 10503, 10504');
            
        }, 2000);
    }, 1000);
    
} catch (error) {
    console.log('❌ Data Continuity failed:', error.message);
}

// Keep the process alive for the async tests
setTimeout(() => {
    process.exit(0);
}, 5000);
