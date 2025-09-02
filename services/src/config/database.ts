import * as sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

export const dbConfig: sql.config = {
  server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.DB_NAME || 'consumptiondb',
  authentication: {
    type: 'ntlm', // Use Windows Authentication
    options: {
      domain: '', // Leave empty for local
      userName: '', // Leave empty for Windows auth
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
export const dbConfigSqlAuth: sql.config = {
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
export const pool = new sql.ConnectionPool(dbConfig);

// Initialize connection with better error handling
export const initializeDatabase = async (): Promise<void> => {
  try {
    await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Test the connection
    const result = await pool.request().query('SELECT 1 as test');
    console.log('✅ Database test query successful');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('⚠️  Continuing without database - using mock data only');
    
    // Don't throw error - let app continue with mock data
  }
};

// Handle connection errors gracefully
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await pool.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
  process.exit(0);
});