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
// Load environment variables
dotenv_1.default.config();
// Add this for debugging
console.log('Environment variables loaded:');
console.log('PORT:', process.env.PORT);
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_NAME:', process.env.DB_NAME);
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Initialize database connection
(0, database_1.initializeDatabase)();
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Routes
app.use('/api/nutrition', nutritionRoutes_1.default);
// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'vHealth API is running',
        timestamp: new Date().toISOString()
    });
});
// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 vHealth API server running on port ${PORT}`);
    console.log(`📱 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});
