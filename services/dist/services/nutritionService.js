"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveNutritionData = exports.fetchNutritionData = void 0;
const sql = __importStar(require("mssql"));
const dbConfig_1 = require("../config/dbConfig");
// Create connection pool
const pool = new sql.ConnectionPool(dbConfig_1.dbConfig);
const poolConnect = pool.connect();
poolConnect.catch(err => {
    console.error('SQL Database Connection Error:', err);
});
async function fetchNutritionData(foodName) {
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
    }
    catch (err) {
        console.error('Database error:', err);
        return {
            success: false,
            message: 'Database error'
        };
    }
}
exports.fetchNutritionData = fetchNutritionData;
async function saveNutritionData(barcode, data) {
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
    }
    catch (err) {
        console.error('Error saving to database:', err);
        return { success: false, message: 'Failed to save data' };
    }
}
exports.saveNutritionData = saveNutritionData;
