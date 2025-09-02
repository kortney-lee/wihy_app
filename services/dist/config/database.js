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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.pool = exports.dbConfigSqlAuth = exports.dbConfig = void 0;
const sql = __importStar(require("mssql"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.dbConfig = {
    server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.DB_NAME || 'consumptiondb',
    authentication: {
        type: 'ntlm',
        options: {
            domain: '',
            userName: '',
            password: '' // Leave empty for Windows auth
        }
    },
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};
// Alternative configuration using SQL Server authentication
exports.dbConfigSqlAuth = {
    server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.DB_NAME || 'consumptiondb',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};
// Create connection pool
exports.pool = new sql.ConnectionPool(exports.dbConfig);
// Initialize connection with better error handling
const initializeDatabase = async () => {
    try {
        await exports.pool.connect();
        console.log('✅ Database connected successfully');
        // Test the connection
        const result = await exports.pool.request().query('SELECT 1 as test');
        console.log('✅ Database test query successful');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        console.log('⚠️  Continuing without database - using mock data only');
        // Don't throw error - let app continue with mock data
    }
};
exports.initializeDatabase = initializeDatabase;
// Handle connection errors gracefully
exports.pool.on('error', (err) => {
    console.error('Database pool error:', err);
});
// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await exports.pool.close();
        console.log('Database connection closed');
    }
    catch (error) {
        console.error('Error closing database connection:', error);
    }
    process.exit(0);
});
