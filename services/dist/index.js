"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const nutritionRoutes_1 = __importDefault(require("./routes/nutritionRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'vHealth API is working!' });
});
// Mount the nutrition routes at /api/nutrition
app.use('/api/nutrition', nutritionRoutes_1.default);
app.listen(PORT, () => {
    console.log(`🚀 vHealth API server running on port ${PORT}`);
});
