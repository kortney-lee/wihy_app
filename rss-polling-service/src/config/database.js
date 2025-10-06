const sql = require('mssql');
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // Use this if you're on Windows Azure
    trustServerCertificate: true // Change to true for local dev / self-signed certs
  }
};

let pool;

const getPool = async () => {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
};

module.exports = {
  getPool,
  sql
};