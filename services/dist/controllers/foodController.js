"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchFoodInDatabase = void 0;
const database_1 = require("../config/database");
// Helper function to safely get error message
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
const searchFoodInDatabase = async (req, res) => {
    console.log('Food controller called with query:', req.query);
    try {
        const { q: query } = req.query;
        if (!query || typeof query !== 'string') {
            console.log('No query provided');
            return res.status(400).json({
                error: 'Query parameter is required',
                found: false
            });
        }
        console.log('Searching for food:', query);
        // Get database pool
        let pool;
        try {
            pool = (0, database_1.getPool)();
            console.log('Database pool obtained');
        }
        catch (error) {
            console.log('Database not available:', getErrorMessage(error));
            return res.status(500).json({
                error: 'Database not available',
                found: false
            });
        }
        // Query the Foods table - GET ALL NUTRITION FIELDS FROM DATABASE
        console.log('Querying Foods table for:', query);
        const foodResult = await pool.request()
            .input('searchTerm', `%${query}%`)
            .query(`
        SELECT TOP 1 
          [food_id],
          [name],
          [brand],
          [category],
          [serving_size],
          [serving_unit],
          [calories_per_serving],
          [protein_g],
          [carbs_g],
          [fat_g],
          [fiber_g],
          [sugar_g],
          [sodium_mg],
          [cholesterol_mg],
          [saturated_fat_g],
          [trans_fat_g],
          [vitamin_a_iu],
          [vitamin_c_mg],
          [calcium_mg],
          [iron_mg],
          [nova_classification],
          [nova_description]
        FROM [dbo].[Foods]
        WHERE [name] LIKE @searchTerm
        ORDER BY 
          CASE 
            WHEN LOWER([name]) = LOWER('${query}') THEN 1
            WHEN LOWER([name]) LIKE LOWER('${query}%') THEN 2
            ELSE 3
          END
      `);
        console.log('Database query result:', foodResult.recordset);
        if (foodResult.recordset.length === 0) {
            console.log('No food found in database');
            return res.json({
                found: false,
                message: `No food found for "${query}"`,
                suggestions: ['Try searching for foods in the database']
            });
        }
        const food = foodResult.recordset[0];
        console.log('Found food in database:', food);
        console.log('NOVA classification from DB:', food.nova_classification);
        // Get processing level based on NOVA score
        const getProcessingLevel = (novaScore) => {
            switch (novaScore) {
                case 1: return 'Unprocessed or minimally processed foods';
                case 2: return 'Processed culinary ingredients';
                case 3: return 'Processed foods';
                case 4: return 'Ultra-processed food and drink products';
                default: return 'Unknown';
            }
        };
        // Return the REAL database response format
        return res.json({
            found: true,
            item: food.name,
            food_id: food.food_id,
            name: food.name,
            brand: food.brand,
            category: food.category,
            serving_size: food.serving_size,
            serving_unit: food.serving_unit,
            // Use REAL nutrition values from database
            calories_per_serving: food.calories_per_serving || 0,
            protein_g: food.protein_g || 0,
            carbs_g: food.carbs_g || 0,
            fat_g: food.fat_g || 0,
            fiber_g: food.fiber_g || 0,
            sugar_g: food.sugar_g || 0,
            sodium_mg: food.sodium_mg || 0,
            cholesterol_mg: food.cholesterol_mg || 0,
            saturated_fat_g: food.saturated_fat_g || 0,
            trans_fat_g: food.trans_fat_g || 0,
            vitamin_a_iu: food.vitamin_a_iu || 0,
            vitamin_c_mg: food.vitamin_c_mg || 0,
            calcium_mg: food.calcium_mg || 0,
            iron_mg: food.iron_mg || 0,
            // Use REAL NOVA classification from database
            nova_classification: food.nova_classification,
            nova_description: food.nova_description,
            processed_level: getProcessingLevel(food.nova_classification),
            verdict: `${food.name} has a NOVA classification of ${food.nova_classification} (${getProcessingLevel(food.nova_classification)}).`
        });
    }
    catch (error) {
        console.error('Food search error:', getErrorMessage(error));
        return res.status(500).json({
            error: 'Database search failed',
            found: false,
            details: getErrorMessage(error)
        });
    }
};
exports.searchFoodInDatabase = searchFoodInDatabase;
