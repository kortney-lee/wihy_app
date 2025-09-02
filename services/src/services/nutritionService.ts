import * as sql from 'mssql';
import { dbConfig } from '../config/dbConfig';

// Create connection pool
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

poolConnect.catch(err => {
  console.error('SQL Database Connection Error:', err);
});

export async function fetchNutritionData(foodName: string): Promise<any> {
  try {
    await poolConnect;
    
    const request = pool.request();
    request.input('barcode', sql.VarChar, foodName);
    
    const result = await request.query(`
      SELECT * FROM dbo.NutritionData 
      WHERE barcode = @barcode
    `);
    
    if (result.recordset && result.recordset.length > 0) {
      const data = result.recordset[0];
      
      return {
        success: true,
        item: data.itemName,
        calories_per_serving: data.calories,
        macros: {
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat
        },
        processed_level: data.processedLevel,
        verdict: data.ingredients,
        snap_eligible: data.snapEligible === 1
      };
    }
    
    return {
      success: false,
      message: 'No nutrition data found'
    };
  } catch (err) {
    console.error('Database error:', err);
    return {
      success: false,
      message: 'Database error'
    };
  }
}

export async function saveNutritionData(barcode: string, data: any): Promise<any> {
  try {
    await poolConnect;
    
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
    
    return { success: true, message: 'Data saved successfully' };
  } catch (err) {
    console.error('Error saving to database:', err);
    return { success: false, message: 'Failed to save data' };
  }
}