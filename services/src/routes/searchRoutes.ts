import { Router } from 'express';
import { searchFoodInDatabase } from '../controllers/foodController';

const router = Router();

// Add food search endpoint
router.get('/food', searchFoodInDatabase);

export default router;