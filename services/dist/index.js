"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const nutritionRoutes_1 = __importDefault(require("./routes/nutritionRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
console.log('About to mount nutrition routes at /api'); // Add this
app.use('/api', nutritionRoutes_1.default);
console.log('Nutrition routes mounted successfully'); // Add this
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Available routes should be:');
    console.log('GET  http://localhost:5000/api/health');
    console.log('POST http://localhost:5000/api/analyze-image');
});
