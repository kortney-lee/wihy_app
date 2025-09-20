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
// ADD THIS ROUTE to match your frontend requests
router.post('/analyze-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No image provided' });
            return;
        }
        const result = await nutritionService.analyzeImage(req.file.buffer);
        res.json(result);
    }
    catch (error) {
        console.error('Error analyzing image:', error);
        res.status(500).json({ success: false, message: 'Error analyzing image' });
    }
});
// Keep the original route too (if needed)
router.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No image provided' });
            return;
        }
        const result = await nutritionService.analyzeImage(req.file.buffer);
        res.json(result);
    }
    catch (error) {
        console.error('Error analyzing image:', error);
        res.status(500).json({ success: false, message: 'Error analyzing image' });
    }
});
// Route to get nutrition data by food name/barcode
router.get('/nutrition/:foodName', async (req, res) => {
    try {
        const result = await nutritionService.fetchNutritionData(req.params.foodName);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch nutrition data' });
    }
});
// Route to save nutrition data - FIXED
router.post('/save', express_1.default.json(), async (req, res) => {
    try {
        const { barcode, data } = req.body;
        if (!barcode || !data) {
            res.status(400).json({ success: false, message: 'Missing barcode or data' });
            return;
        }
        const result = await nutritionService.saveNutritionData(barcode, data);
        res.json({ success: true, message: 'Data saved successfully' });
    }
    catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});
exports.default = router;
