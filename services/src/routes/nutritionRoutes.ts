import express from 'express';
import multer from 'multer';
import NutritionService from '../services/nutritionService';

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();
const nutritionService = new NutritionService();

// ADD THIS ROUTE to match your frontend requests
router.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image provided' });
      return;
    }
    
    const result = await nutritionService.analyzeImage(req.file.buffer);
    res.json(result);
  } catch (error) {
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
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ success: false, message: 'Error analyzing image' });
  }
});

// Route to get nutrition data by food name/barcode
router.get('/nutrition/:foodName', async (req, res) => {
  try {
    const result = await nutritionService.fetchNutritionData(req.params.foodName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch nutrition data' });
  }
});

// Route to save nutrition data - FIXED
router.post('/save', express.json(), async (req, res) => {
  try {
    const { barcode, data } = req.body;
    if (!barcode || !data) {
      res.status(400).json({ success: false, message: 'Missing barcode or data' });
      return;
    }
    
    const result = await nutritionService.saveNutritionData(barcode, data);
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

export default router;