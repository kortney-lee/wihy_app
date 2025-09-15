import dotenv from 'dotenv';

dotenv.config();

// Just export the config without connecting:
export const dbConfig = {
  server: 'localhost\\SQLEXPRESS',
  database: 'consumptiondb',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
    trustedConnection: true
  }
};