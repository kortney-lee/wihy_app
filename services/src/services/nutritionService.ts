import { getPool, sql, initializeDatabase } from '../config/database';

export default class NutritionService {
  private initialized = false;

  constructor() {
    console.log('NutritionService initialized with database connection');
    this.initializeIfNeeded();
  }

  private async initializeIfNeeded() {
    if (!this.initialized) {
      await initializeDatabase();
      this.initialized = true;
    }
  }

  async analyzeImage(imageBuffer: Buffer): Promise<any> {
    console.log('analyzeImage called with buffer size:', imageBuffer.length);
    
    try {
      // Mock image analysis - detect a food item
      const detectedFood = "Apple"; // In real implementation, this would come from image analysis
      
      // Get nutrition data for the detected food
      const nutritionData = await this.fetchNutritionData(detectedFood);
      
      // Return the expected structure with both foodName and nutrition
      const result = {
        success: true,
        foodName: detectedFood,
        confidence: 0.95,
        tags: ["fruit", "healthy", "fresh"],
        nutrition: {
          item: nutritionData.item,
          calories: nutritionData.calories,
          protein: nutritionData.protein,
          carbs: nutritionData.carbs,
          fat: nutritionData.fat,
          fiber: "3g" // Add fiber if available
        },
        analysis: {
          provider: "mock-vision-api",
          confidence: 0.95,
          tags: ["fruit", "healthy", "fresh"]
        },
        healthScore: 85,
        timestamp: new Date().toISOString(),
        message: "Image analysis complete"
      };

      return result;
    } catch (error) {
      console.error('Error analyzing image:', error);
      return {
        success: false,
        message: 'Image analysis failed'
      };
    }
  }

  async fetchNutritionData(foodName: string): Promise<any> {
    try {
      await this.initializeIfNeeded();
      
      // Use getPool() with error handling
      const pool = getPool();
      
      const result = await pool.request()
        .input('foodName', sql.VarChar, foodName)
        .query(`
          SELECT * FROM NutritionData 
          WHERE itemName LIKE '%' + @foodName + '%'
          ORDER BY itemName
        `);
      
      if (result.recordset.length === 0) {
        return this.getMockNutritionData(foodName);
      }
      
      return this.processNutritionData(result.recordset[0]);
    } catch (error) {
      console.error('Database query failed:', error);
      return this.getMockNutritionData(foodName);
    }
  }

  async saveNutritionData(barcode: string, data: any): Promise<any> {
    try {
      await this.initializeIfNeeded();
      
      // Use getPool() with error handling
      const pool = getPool();
      
      const result = await pool.request()
        .input('barcode', sql.VarChar, barcode)
        .input('foodName', sql.VarChar, data.foodName || 'Unknown')
        .input('calories', sql.Int, data.calories || 0)
        .input('protein', sql.VarChar, data.protein || '0g')
        .input('carbs', sql.VarChar, data.carbs || '0g')
        .input('fat', sql.VarChar, data.fat || '0g')
        .input('dateCreated', sql.DateTime, new Date())
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
    } catch (error) {
      console.error('Failed to save nutrition data:', error);
      return {
        success: false,
        message: 'Failed to save nutrition data'
      };
    }
  }

  private getMockNutritionData(foodName: string): any {
    const mockData: {[key: string]: any} = {
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

  private processNutritionData(data: any): any {
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