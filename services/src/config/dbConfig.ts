// dbConfig.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the services directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Debug logging to see what's loaded
console.log('🔍 Environment variables check:');
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_ENCRYPT:', process.env.DB_ENCRYPT);

export const dbConfig = {
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
  server: dbConfig.server,
  database: dbConfig.database,
  port: dbConfig.port,
  encrypt: dbConfig.options.encrypt,
  user: dbConfig.user ? '***masked***' : 'undefined'
});
