"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables FIRST, before any other imports
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
// Now import other modules that depend on env vars
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./config/database");
const nutritionRoutes_1 = __importDefault(require("./routes/nutritionRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Initialize database on server startup
async function startServer() {
    try {
        console.log('Initializing database connection...');
        const pool = await (0, database_1.initializeDatabase)();
        if (pool) {
            console.log('Database initialized successfully');
            // Test query to verify tables were created
            try {
                const tables = await pool.request().query(`
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_TYPE = 'BASE TABLE' 
          ORDER BY TABLE_NAME
        `);
                console.log('Database tables:', tables.recordset.map(t => t.TABLE_NAME));
            }
            catch (err) {
                console.log('Tables query failed, but connection established');
            }
            // Mount routes after database is ready
            app.use('/api', nutritionRoutes_1.default);
            // Health check endpoint
            app.get('/api/health', (req, res) => {
                res.json({
                    status: 'OK',
                    message: 'VHealth API is running',
                    timestamp: new Date().toISOString()
                });
            });
            // Start server
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
                console.log('Available routes:');
                console.log(`GET  http://localhost:${PORT}/api/health`);
                console.log(`POST http://localhost:${PORT}/api/analyze-image`);
            });
        }
        else {
            console.error('Database connection failed');
            process.exit(1);
        }
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Start the server
startServer();
exports.default = app;
