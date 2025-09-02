"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const nutritionService_1 = require("../services/nutritionService");
// Import vision service when ready
// import { analyzeFoodImage } from '../services/nutritionVisionService';
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const nutritionService = new nutritionService_1.NutritionService();
// Analyze food image endpoint
router.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image provided' });
        }
        // For now, return mock data - implement vision processing later
        const mockAnalysis = {
            success: true,
            foodName: 'Detected Food Item',
            tags: ['healthy', 'fresh'],
            confidence: 0.85,
            nutrition: await nutritionService.fetchNutritionData('apple') // Default nutrition
        };
        res.json(mockAnalysis);
    }
    catch (error) {
        console.error('Error analyzing image:', error);
        res.status(500).json({ success: false, message: 'Error analyzing image' });
    }
});
exports.default = router;
