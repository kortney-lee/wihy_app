import { pool } from '../config/database';
import * as sql from 'mssql';

// Vision API interfaces
interface VisionAnalysisResult {
  success: boolean;
  foodName: string;
  tags: string[];
  confidence?: number;
  provider?: string;
}

interface NutritionData {
  success: boolean;
  item?: string;
  calories_per_serving?: number;
  macros?: {
    protein: string;
    carbs: string;
    fat: string;
  };
  processed_level?: string;
  verdict?: string;
  snap_eligible?: boolean;
  message?: string;
}

// Mock Google Vision API response for now
export const analyzeFoodImage = async (imageBuffer: Buffer): Promise<VisionAnalysisResult> => {
  try {
    // TODO: Implement actual Google Vision API call
    // For now, return mock data
    const mockFoodLabels = ['apple', 'fruit', 'fresh'];
    const mockWebEntities = ['healthy', 'organic', 'red apple'];
    
    return {
      success: true,
      provider: 'google',
      foodName: mockFoodLabels[0] || 'Unknown food',
      tags: [...new Set([...mockFoodLabels, ...mockWebEntities])],
      confidence: 0.85
    };
  } catch (error) {
    console.error('Google Vision API error:', error);
    return {
      success: false,
      foodName: 'Unknown food',
      tags: [],
      confidence: 0
    };
  }
};

// Process uploaded food image
export const processUploadedFoodImage = async (imageBuffer: Buffer): Promise<any> => {
  try {
    // Analyze the image
    const visionResult = await analyzeFoodImage(imageBuffer);
    
    if (!visionResult.success) {
      return {
        success: false,
        message: 'Failed to analyze image'
      };
    }
    
    // Get nutrition data for the detected food
    const nutritionData = await fetchNutritionData(visionResult.foodName);
    
    return {
      success: true,
      analysis: visionResult,
      nutrition: nutritionData,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error processing uploaded image:', error);
    return {
      success: false,
      message: 'Error processing image'
    };
  }
};

// Fetch nutrition data from database
export const fetchNutritionData = async (query: string): Promise<NutritionData> => {
  try {
    const request = pool.request();
    request.input('query', sql.VarChar, query);
    
    // Search by barcode or item name
    const result = await request.query(`
      SELECT TOP 1 * FROM dbo.NutritionData 
      WHERE barcode = @query 
         OR itemName LIKE '%' + @query + '%'
         OR LOWER(itemName) LIKE '%' + LOWER(@query) + '%'
      ORDER BY 
        CASE 
          WHEN barcode = @query THEN 1
          WHEN itemName = @query THEN 2
          ELSE 3
        END
    `);
    
    if (result.recordset && result.recordset.length > 0) {
      const data = result.recordset[0];
      
      return {
        success: true,
        item: data.itemName || query,
        calories_per_serving: data.calories || 0,
        macros: {
          protein: data.protein || '0g',
          carbs: data.carbs || '0g',
          fat: data.fat || '0g'
        },
        processed_level: data.processedLevel || 'unknown',
        verdict: data.ingredients || 'No ingredient information available',
        snap_eligible: data.snapEligible === 1 || false
      };
    }
    
    // Return mock data if not found in database
    return generateMockNutritionData(query);
    
  } catch (error) {
    console.error('Database error in fetchNutritionData:', error);
    // Return mock data on database error
    return generateMockNutritionData(query);
  }
};

// Generate mock nutrition data when database lookup fails
const generateMockNutritionData = (query: string): NutritionData => {
  // Simple mock data based on common foods
  const mockData: { [key: string]: Partial<NutritionData> } = {
    'apple': {
      calories_per_serving: 95,
      macros: { protein: '0.5g', carbs: '25g', fat: '0.3g' },
      processed_level: 'unprocessed',
      verdict: 'Fresh fruit, excellent source of fiber and vitamin C',
      snap_eligible: true
    },
    'banana': {
      calories_per_serving: 105,
      macros: { protein: '1.3g', carbs: '27g', fat: '0.4g' },
      processed_level: 'unprocessed',
      verdict: 'Fresh fruit, good source of potassium',
      snap_eligible: true
    },
    'bread': {
      calories_per_serving: 80,
      macros: { protein: '3g', carbs: '15g', fat: '1g' },
      processed_level: 'processed',
      verdict: 'Processed grain product, check ingredients for whole grains',
      snap_eligible: true
    }
  };
  
  // Find the closest match or use default
  const lowerQuery = query.toLowerCase();
  const matchedKey = Object.keys(mockData).find(key => 
    lowerQuery.includes(key) || key.includes(lowerQuery)
  );
  
  const baseData = matchedKey ? mockData[matchedKey] : {
    calories_per_serving: 150,
    macros: { protein: '5g', carbs: '20g', fat: '3g' },
    processed_level: 'unknown',
    verdict: 'Nutrition information estimated',
    snap_eligible: false
  };
  
  return {
    success: true,
    item: query,
    ...baseData
  };
};

// Save nutrition data to database
export const saveNutritionData = async (barcode: string, data: any): Promise<{ success: boolean; message: string }> => {
  try {
    const request = pool.request();
    request.input('barcode', sql.VarChar, barcode);
    request.input('itemName', sql.NVarChar, data.item || '');
    request.input('calories', sql.Float, data.calories_per_serving || null);
    request.input('protein', sql.NVarChar, data.macros?.protein || null);
    request.input('carbs', sql.NVarChar, data.macros?.carbs || null);
    request.input('fat', sql.NVarChar, data.macros?.fat || null);
    request.input('processedLevel', sql.NVarChar, data.processed_level || null);
    request.input('ingredients', sql.NVarChar, data.verdict || null);
    request.input('snapEligible', sql.Bit, data.snap_eligible || false);
    
    await request.query(`
      MERGE INTO dbo.NutritionData AS target
      USING (SELECT @barcode AS barcode) AS source
      ON target.barcode = source.barcode
      WHEN MATCHED THEN
        UPDATE SET 
          itemName = @itemName,
          calories = @calories,
          protein = @protein,
          carbs = @carbs,
          fat = @fat,
          processedLevel = @processedLevel,
          ingredients = @ingredients,
          snapEligible = @snapEligible,
          lastUpdated = GETDATE()
      WHEN NOT MATCHED THEN
        INSERT (barcode, itemName, calories, protein, carbs, fat, processedLevel, ingredients, snapEligible, createDate, lastUpdated)
        VALUES (@barcode, @itemName, @calories, @protein, @carbs, @fat, @processedLevel, @ingredients, @snapEligible, GETDATE(), GETDATE());
    `);
    
    return { success: true, message: 'Nutrition data saved successfully' };
    
  } catch (error) {
    console.error('Error saving nutrition data:', error);
    return { success: false, message: 'Failed to save nutrition data' };
  }
};

// Barcode lookup function
export const lookupBarcode = async (barcode: string): Promise<NutritionData> => {
  try {
    // First try database lookup
    const dbResult = await fetchNutritionData(barcode);
    
    if (dbResult.success && dbResult.item) {
      return dbResult;
    }
    
    // TODO: If not found in database, try external APIs
    // For now, return mock data
    return generateMockNutritionData(`Product ${barcode}`);
    
  } catch (error) {
    console.error('Error looking up barcode:', error);
    return {
      success: false,
      message: 'Error looking up barcode'
    };
  }
};