import express from 'express';
// Fix this import path:
import { openFoodFactsController } from '../controllers/openFoodFactsService';
// OR if the controller is in services folder:
// import { openFoodFactsController } from '../openFoodFactsService';

const router = express.Router();

/**
 * @route GET /api/openfoodfacts/barcode/:barcode
 * @desc Get product information by barcode
 * @access Public
 */
router.get('/barcode/:barcode', async (req, res) => {
  await openFoodFactsController.getProductByBarcodeController(req, res);
});

/**
 * @route GET /api/openfoodfacts/search
 * @desc Search products by name
 * @query q - search query, limit - number of results (optional)
 * @access Public
 */
router.get('/search', async (req, res) => {
  await openFoodFactsController.searchProductsController(req, res);
});

/**
 * @route GET /api/openfoodfacts/nutrition/:barcode
 * @desc Get detailed nutrition facts for a product
 * @access Public
 */
router.get('/nutrition/:barcode', async (req, res) => {
  await openFoodFactsController.getNutritionFactsController(req, res);
});

/**
 * @route GET /api/openfoodfacts/categories/:barcode
 * @desc Get product categories, labels, and allergens
 * @access Public
 */
router.get('/categories/:barcode', async (req, res) => {
  await openFoodFactsController.getProductCategoriesController(req, res);
});

/**
 * @route GET /api/openfoodfacts/status
 * @desc Check OpenFoodFacts service availability
 * @access Public
 */
router.get('/status', async (req, res) => {
  await openFoodFactsController.checkServiceStatusController(req, res);
});

export default router;