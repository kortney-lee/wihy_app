// database.ts  (put under src/config if that’s your convention)
import sql from 'mssql/msnodesqlv8';
import { dbConfig } from './dbConfig'; // Regular mssql config object

let pool: any = null;

// Convert regular config to connection string for msnodesqlv8
function createConnectionString(config: any): string {
  return (
    `Driver={ODBC Driver 18 for SQL Server};` +
    `Server=${config.server};` +
    `Database=${config.database};` +
    `Trusted_Connection=Yes;` +
    `Encrypt=${config.options?.encrypt ? 'Yes' : 'No'};` +
    `TrustServerCertificate=${config.options?.trustServerCertificate ? 'Yes' : 'No'};`
  );
}

export async function initializeDatabase() {
  if (pool) {
    console.log('Database already initialized');
    return pool;
  }

  console.log('🔗 Attempting database connection with SQL Express (Windows Auth)...');
  try {
    // Convert config to connection string
    const connectionString = createConnectionString(dbConfig);
    console.log('🔗 Connection string:', connectionString);
    
    pool = await sql.connect(connectionString);
    console.log('✅ Connected to SQL Server Express (Windows Auth)');

    const who = await pool.request().query(
      'SELECT SUSER_SNAME() AS login_name, SYSTEM_USER AS system_user'
    );
    console.log('👤 Connected as:', who.recordset[0]);
    return pool;
  } catch (err: any) {
    console.error('❌ Database connection failed:', err?.message || err);
    if (pool) { try { await pool.close(); } catch {} }
    pool = null;
    return null;
  }
}

export function getPool(): any {
  if (!pool) {
    throw new Error('Database pool is not available. Using mock data instead.');
  }
  return pool;
}

export { sql };

export async function closeDatabase() {
  if (!pool) return;
  try {
    await pool.close();
    console.log('✅ Database connection closed');
  } finally {
    pool = null;
  }
}