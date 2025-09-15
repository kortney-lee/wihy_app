"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const nutritionRoutes_1 = __importDefault(require("./routes/nutritionRoutes"));
const database_1 = require("./config/database");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize database connection
(0, database_1.initializeDatabase)()
    .then((pool) => {
    if (pool) {
        console.log('✅ Database connection established');
    }
    else {
        console.log('📝 Running with mock data only');
    }
})
    .catch((error) => {
    console.error('❌ Database initialization error:', error);
    console.log('📝 Continuing with mock data...');
});
console.log('About to mount nutrition routes at /api');
app.use('/api', nutritionRoutes_1.default);
console.log('Nutrition routes mounted successfully');
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Available routes should be:');
    console.log(`GET  http://localhost:${PORT}/api/health`);
    console.log(`POST http://localhost:${PORT}/api/analyze-image`);
});
