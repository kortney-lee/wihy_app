"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const dbConfig_1 = require("../config/dbConfig");
// Create a pool using your existing config
const pool = new mssql_1.default.ConnectionPool(dbConfig_1.dbConfig);
const poolConnect = pool.connect();
// Log connection status
poolConnect
    .then(() => console.log('Connected to SQL Server'))
    .catch(err => console.error('Database connection failed:', err));
class NutritionService {
    async fetchNutritionData(foodName) {
        try {
            // Ensure pool is connected
            await poolConnect;
            // Query the database
            const result = await pool.request()
                .input('foodName', mssql_1.default.VarChar, foodName)
                .query(`
          SELECT * FROM NutritionFacts 
          WHERE FoodName LIKE '%' + @foodName + '%'
        `);
            // If no results found, return mock data
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
}
exports.default = NutritionService;
