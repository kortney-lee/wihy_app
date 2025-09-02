import express from 'express';
import multer from 'multer';
import { NutritionService } from '../services/nutritionService';
// Import vision service when ready
// import { analyzeFoodImage } from '../services/nutritionVisionService';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const nutritionService = new NutritionService();

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
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ success: false, message: 'Error analyzing image' });
  }
});

export default router;