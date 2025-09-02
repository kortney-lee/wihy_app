"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'vHealth API is working!' });
});
// Basic nutrition route
app.get('/api/nutrition/:query', (req, res) => {
    const query = req.params.query;
    res.json({
        success: true,
        item: query,
        calories_per_serving: 250,
        macros: {
            protein: '10g',
            carbs: '30g',
            fat: '12g'
        },
        processed_level: 'medium',
        verdict: 'Generally healthy option with moderate processing.',
        snap_eligible: true
    });
});
app.listen(PORT, () => {
    console.log(`🚀 vHealth API server running on port ${PORT}`);
});
