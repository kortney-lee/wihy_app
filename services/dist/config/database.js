"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.sql = exports.getPool = exports.initializeDatabase = void 0;
// database.ts  (put under src/config if that’s your convention)
const msnodesqlv8_1 = __importDefault(require("mssql/msnodesqlv8"));
exports.sql = msnodesqlv8_1.default;
const dbConfig_1 = require("./dbConfig"); // dbConfig is { connectionString: string }
let pool = null;
async function initializeDatabase() {
    if (pool) {
        console.log('Database already initialized');
        return pool;
    }
    console.log('🔗 Attempting database connection with SQL Express (Windows Auth)...');
    try {
        // Use dbConfig.connectionString since dbConfig is an object
        pool = await msnodesqlv8_1.default.connect(dbConfig_1.dbConfig.connectionString);
        console.log('✅ Connected to SQL Server Express (Windows Auth)');
        const who = await pool.request().query('SELECT SUSER_SNAME() AS login_name, SYSTEM_USER AS system_user');
        console.log('👤 Connected as:', who.recordset[0]);
        return pool;
    }
    catch (err) {
        console.error('❌ Database connection failed:', err?.message || err);
        if (pool) {
            try {
                await pool.close();
            }
            catch { }
        }
        pool = null;
        return null;
    }
}
exports.initializeDatabase = initializeDatabase;
function getPool() {
    if (!pool) {
        throw new Error('Database pool is not available. Using mock data instead.');
    }
    return pool;
}
exports.getPool = getPool;
async function closeDatabase() {
    if (!pool)
        return;
    try {
        await pool.close();
        console.log('✅ Database connection closed');
    }
    finally {
        pool = null;
    }
}
exports.closeDatabase = closeDatabase;
