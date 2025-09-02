import dotenv from 'dotenv';
dotenv.config();

export const dbConfig = {
  server: 'localhost\\SQLEXPRESS',
  database: 'consumptiondb',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    trustedConnection: true,
    enableArithAbort: true,
    integratedSecurity: true
  }
};