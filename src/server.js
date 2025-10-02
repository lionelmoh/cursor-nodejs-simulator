const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import modbus servers
const { PV1Server } = require('./modbus/pv1-server');
const { PV2Server } = require('./modbus/pv2-server');
const { BatteryServer } = require('./modbus/battery-server');

// Import calculators
const { solarCalculator } = require('./simulators/solar-calculator');
const { batteryCalculator } = require('./simulators/battery-calculator');

// Import configuration
const systemConfig = require('../config/system-config');
const modbusConfig = require('../config/modbus-config');

class PVSimulatorServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.modbusServers = {};
        this.isRunning = false;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupModbusServers();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet());
        
        // CORS middleware
        this.app.use(cors());
        
        // Logging middleware
        this.app.use(morgan('combined'));
        
        // Body parsing middleware
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // Static file serving
        this.app.use(express.static(path.join(__dirname, '../public')));
        
        // View engine setup
        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, '../views'));
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // API routes
        this.app.get('/api/status', (req, res) => {
            res.json({
                server: {
                    isRunning: this.isRunning,
                    uptime: process.uptime(),
                    timestamp: new Date().toISOString()
                },
                modbus: {
                    pv1: this.modbusServers.pv1?.getStatus() || { isRunning: false },
                    pv2: this.modbusServers.pv2?.getStatus() || { isRunning: false },
                    battery: this.modbusServers.battery?.getStatus() || { isRunning: false }
                }
            });
        });

        // PV1 data endpoint
        this.app.get('/api/pv1/data', (req, res) => {
            try {
                const data = solarCalculator.getCurrentData();
                res.json({
                    timestamp: new Date().toISOString(),
                    data: data
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // PV2 data endpoint
        this.app.get('/api/pv2/data', (req, res) => {
            try {
                const data = solarCalculator.getCurrentData();
                res.json({
                    timestamp: new Date().toISOString(),
                    data: data
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Battery data endpoint
        this.app.get('/api/battery/data', (req, res) => {
            try {
                const data = batteryCalculator.getCurrentData();
                res.json({
                    timestamp: new Date().toISOString(),
                    data: data
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // All systems data endpoint
        this.app.get('/api/all/data', (req, res) => {
            try {
                const pvData = solarCalculator.getCurrentData();
                const batteryData = batteryCalculator.getCurrentData();
                
                res.json({
                    timestamp: new Date().toISOString(),
                    pv1: pvData,
                    pv2: pvData, // Same data for both PV systems
                    battery: batteryData
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Configuration endpoints
        this.app.get('/api/config', (req, res) => {
            res.json({
                system: systemConfig,
                modbus: modbusConfig
            });
        });

        this.app.post('/api/config', (req, res) => {
            // Configuration update endpoint (placeholder)
            res.json({ message: 'Configuration update not implemented yet' });
        });

        // Web dashboard route
        this.app.get('/', (req, res) => {
            res.render('dashboard', {
                title: 'PV Simulator Dashboard',
                pv1Port: modbusConfig.servers.pv1.port,
                pv2Port: modbusConfig.servers.pv2.port,
                batteryPort: modbusConfig.servers.battery.port
            });
        });

        // Error handling middleware
        this.app.use((err, req, res, next) => {
            console.error('Error:', err);
            res.status(500).json({ error: 'Internal server error' });
        });

        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({ error: 'Not found' });
        });
    }

    async setupModbusServers() {
        try {
            // Create modbus servers
            this.modbusServers.pv1 = new PV1Server(modbusConfig.servers.pv1.port);
            this.modbusServers.pv2 = new PV2Server(modbusConfig.servers.pv2.port);
            this.modbusServers.battery = new BatteryServer(modbusConfig.servers.battery.port);
            
            console.log('✅ Modbus servers created');
        } catch (error) {
            console.error('❌ Failed to create modbus servers:', error);
            throw error;
        }
    }

    async start() {
        try {
            // Start modbus servers
            await this.modbusServers.pv1.start();
            await this.modbusServers.pv2.start();
            await this.modbusServers.battery.start();
            
            // Start web server
            this.app.listen(this.port, () => {
                this.isRunning = true;
                console.log(`✅ PV Simulator server started on port ${this.port}`);
                console.log(`🌐 Web Dashboard: http://localhost:${this.port}`);
                console.log(`📊 REST API: http://localhost:${this.port}/api`);
                console.log(`🔌 Modbus PV1: localhost:${modbusConfig.servers.pv1.port}`);
                console.log(`🔌 Modbus PV2: localhost:${modbusConfig.servers.pv2.port}`);
                console.log(`🔌 Modbus Battery: localhost:${modbusConfig.servers.battery.port}`);
            });
            
        } catch (error) {
            console.error('❌ Failed to start server:', error);
            throw error;
        }
    }

    async stop() {
        try {
            // Stop modbus servers
            await this.modbusServers.pv1.stop();
            await this.modbusServers.pv2.stop();
            await this.modbusServers.battery.stop();
            
            this.isRunning = false;
            console.log('✅ PV Simulator server stopped');
        } catch (error) {
            console.error('❌ Failed to stop server:', error);
            throw error;
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            port: this.port,
            modbusServers: {
                pv1: this.modbusServers.pv1?.getStatus() || { isRunning: false },
                pv2: this.modbusServers.pv2?.getStatus() || { isRunning: false },
                battery: this.modbusServers.battery?.getStatus() || { isRunning: false }
            }
        };
    }
}

// Create and start server
const server = new PVSimulatorServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down PV Simulator...');
    try {
        await server.stop();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down PV Simulator...');
    try {
        await server.stop();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

// Start the server
if (require.main === module) {
    server.start().catch(error => {
        console.error('❌ Failed to start PV Simulator:', error);
        process.exit(1);
    });
}

module.exports = { PVSimulatorServer };
