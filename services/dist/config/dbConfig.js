"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConfig = void 0;
// dbConfig.ts
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from the services directory
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
// Debug logging to see what's loaded
console.log('🔍 Environment variables check:');
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_ENCRYPT:', process.env.DB_ENCRYPT);
exports.dbConfig = {
    server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.DB_NAME || 'vhealth',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 1433,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true,
        connectTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
        requestTimeout: 30000,
    }
};
// Debug the final config
console.log('📊 Final database config:', {
    server: exports.dbConfig.server,
    database: exports.dbConfig.database,
    port: exports.dbConfig.port,
    encrypt: exports.dbConfig.options.encrypt,
    user: exports.dbConfig.user ? '***masked***' : 'undefined'
});
