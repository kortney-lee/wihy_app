"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables FIRST
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./config/database");
const nutritionRoutes_1 = __importDefault(require("./routes/nutritionRoutes"));
const foodController_1 = require("./controllers/foodController");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'VHealth API is running',
        timestamp: new Date().toISOString()
    });
});
// Register food search route BEFORE startServer function
console.log('🍎 Registering food search route...');
app.get('/api/search/food', (req, res) => {
    console.log('🍎 Food search route accessed!', req.query);
    return (0, foodController_1.searchFoodInDatabase)(req, res);
});
console.log('✅ Food search route registered at /api/search/food');
// Initialize database and start server
async function startServer() {
    try {
        console.log('🔌 Initializing database connection...');
        const pool = await (0, database_1.initializeDatabase)();
        if (pool) {
            console.log('✅ Database initialized successfully');
            // Mount nutrition routes AFTER database is ready
            console.log('📡 About to mount nutrition routes at /api');
            app.use('/api', nutritionRoutes_1.default);
            console.log('✅ Nutrition routes mounted successfully');
            console.log('✅ All routes registered');
            // Start the server
            app.listen(PORT, () => {
                console.log(`🚀 Server running on port ${PORT}`);
                console.log('');
                console.log('📡 Available routes:');
                console.log(`   GET  http://localhost:${PORT}/api/health`);
                console.log(`   GET  http://localhost:${PORT}/api/search/food?q=broccoli`); // This should now show
                console.log(`   POST http://localhost:${PORT}/api/analyze-image`);
                console.log('');
                console.log('🧪 Test the food route:');
                console.log(`   http://localhost:${PORT}/api/search/food?q=apple`);
            });
        }
        else {
            console.error('❌ Database connection failed');
            process.exit(1);
        }
    }
    catch (error) {
        console.error('💥 Failed to start server:', error);
        process.exit(1);
    }
}
// Start the server
startServer();
exports.default = app;
