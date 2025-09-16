"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const nutritionRoutes_1 = __importDefault(require("./routes/nutritionRoutes"));
const database_1 = require("./config/database");
// Load environment
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 5000;
// Initialize database when the application starts
async function initialize() {
    try {
        console.log('Starting VHealth Services...');
        console.log('Environment check:');
        console.log(`- DB_SERVER: ${process.env.DB_SERVER}`);
        console.log(`- DB_NAME: ${process.env.DB_NAME}`);
        console.log(`- DB_USER: ${process.env.DB_USER}`);
        console.log(`- DB_PASSWORD: ${process.env.DB_PASSWORD ? 'SET' : 'NOT SET'}`);
        // Initialize database first
        console.log('Connecting to database...');
        const pool = await (0, database_1.initializeDatabase)();
        if (pool) {
            console.log('Database connection established and tables created');
            // Test query to verify tables were created
            try {
                const tables = await pool.request().query(`
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_TYPE = 'BASE TABLE' 
          ORDER BY TABLE_NAME
        `);
                console.log('Tables found:', tables.recordset.map(t => t.TABLE_NAME));
            }
            catch (err) {
                console.log('Could not query tables yet, but connection is established');
            }
            // Mount routes after database is ready
            console.log('About to mount nutrition routes at /api');
            app.use('/api', nutritionRoutes_1.default);
            console.log('Nutrition routes mounted successfully');
            // Start server
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
                console.log('Available routes should be:');
                console.log(`GET  http://localhost:${PORT}/api/health`);
                console.log(`POST http://localhost:${PORT}/api/analyze-image`);
            });
            console.log('VHealth Services started successfully');
        }
        else {
            console.error('Database connection failed - cannot start server');
            process.exit(1);
        }
    }
    catch (error) {
        console.error('Failed to initialize VHealth Services:', error);
        console.error('Full error details:', error);
        process.exit(1);
    }
}
// Run initialization
initialize();
