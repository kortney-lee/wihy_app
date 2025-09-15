"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class NutritionService {
    constructor() {
        this.initialized = false;
        console.log('NutritionService initialized with database connection');
        this.initializeIfNeeded();
    }
    async initializeIfNeeded() {
        if (!this.initialized) {
            await (0, database_1.initializeDatabase)();
            this.initialized = true;
        }
    }
    async analyzeImage(imageBuffer) {
        console.log('analyzeImage called with buffer size:', imageBuffer.length);
        try {
            // For now, return mock data. Later you can add real image analysis
            const mockResult = {
                success: true,
                foodName: "Detected Food Item",
                confidence: 0.95,
                nutritionFacts: {
                    calories: 150,
                    protein: "8g",
                    carbs: "20g",
                    fat: "5g",
                    fiber: "3g"
                },
                healthScore: 85,
                message: "Image analysis complete"
            };
            // Optionally save to database
            // await this.saveAnalysisResult(mockResult);
            return mockResult;
        }
        catch (error) {
            console.error('Error analyzing image:', error);
            return {
                success: false,
                message: 'Image analysis failed'
            };
        }
    }
    async fetchNutritionData(foodName) {
        try {
            await this.initializeIfNeeded();
            // Use getPool() with error handling
            const pool = (0, database_1.getPool)();
            const result = await pool.request()
                .input('foodName', database_1.sql.VarChar, foodName)
                .query(`
          SELECT * FROM NutritionData 
          WHERE itemName LIKE '%' + @foodName + '%'
          ORDER BY itemName
        `);
            if (result.recordset.length === 0) {
                return this.getMockNutritionData(foodName);
            }
            return this.processNutritionData(result.recordset[0]);
        }
        catch (error) {
            console.error('Database query failed:', error);
            return this.getMockNutritionData(foodName);
        }
    }
    async saveNutritionData(barcode, data) {
        try {
            await this.initializeIfNeeded();
            // Use getPool() with error handling
            const pool = (0, database_1.getPool)();
            const result = await pool.request()
                .input('barcode', database_1.sql.VarChar, barcode)
                .input('foodName', database_1.sql.VarChar, data.foodName || 'Unknown')
                .input('calories', database_1.sql.Int, data.calories || 0)
                .input('protein', database_1.sql.VarChar, data.protein || '0g')
                .input('carbs', database_1.sql.VarChar, data.carbs || '0g')
                .input('fat', database_1.sql.VarChar, data.fat || '0g')
                .input('dateCreated', database_1.sql.DateTime, new Date())
                .query(`
          MERGE INTO NutritionData AS target
          USING (SELECT @barcode AS barcode) AS source
          ON target.barcode = source.barcode
          WHEN MATCHED THEN
            UPDATE SET 
              itemName = @foodName,
              calories = @calories,
              protein = @protein,
              carbs = @carbs,
              fat = @fat,
              lastUpdated = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (barcode, itemName, calories, protein, carbs, fat, createDate, lastUpdated)
            VALUES (@barcode, @foodName, @calories, @protein, @carbs, @fat, GETDATE(), GETDATE());
        `);
            return {
                success: true,
                message: 'Nutrition data saved successfully'
            };
        }
        catch (error) {
            console.error('Failed to save nutrition data:', error);
            return {
                success: false,
                message: 'Failed to save nutrition data'
            };
        }
    }
    getMockNutritionData(foodName) {
        const mockData = {
            apple: {
                success: true,
                item: "Apple",
                calories: 95,
                protein: "0.5g",
                carbs: "25g",
                fat: "0.3g"
            },
            banana: {
                success: true,
                item: "Banana",
                calories: 105,
                protein: "1.3g",
                carbs: "27g",
                fat: "0.4g"
            },
            default: {
                success: true,
                item: foodName,
                calories: 100,
                protein: "2g",
                carbs: "15g",
                fat: "1g"
            }
        };
        return mockData[foodName.toLowerCase()] || mockData.default;
    }
    processNutritionData(data) {
        return {
            success: true,
            item: data.itemName,
            calories: data.calories,
            protein: `${data.protein}g`,
            carbs: `${data.carbs}g`,
            fat: `${data.fat}g`
        };
    }
}
exports.default = NutritionService;
