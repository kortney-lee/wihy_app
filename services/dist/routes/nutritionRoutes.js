"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const nutritionService_1 = __importDefault(require("../services/nutritionService"));
// Configure multer for image uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
const router = express_1.default.Router();
const nutritionService = new nutritionService_1.default();
// Route to analyze uploaded food images
router.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image provided' });
        }
        const result = await nutritionService.analyzeImage(req.file.buffer);
        return res.json(result);
    }
    catch (error) {
        console.error('Error analyzing image:', error);
        return res.status(500).json({ success: false, message: 'Error analyzing image' });
    }
});
// Route to get nutrition data by food name/barcode
router.get('/:foodName', async (req, res) => {
    try {
        const result = await nutritionService.fetchNutritionData(req.params.foodName);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch nutrition data' });
    }
});
// Route to save nutrition data
router.post('/save', express_1.default.json(), async (req, res) => {
    try {
        const { barcode, data } = req.body;
        if (!barcode || !data) {
            return res.status(400).json({ success: false, message: 'Missing barcode or data' });
        }
        const result = await nutritionService.saveNutritionData(barcode, data);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to save nutrition data' });
    }
});
exports.default = router;
