import { getPool, sql, initializeDatabase } from '../config/database';

interface CachedResultRow {
  id: number;
  query: string;
  results: any;
  source: string;
  timestamp: number;
  expiresAt: number;
  createdAt: number;
}

interface CachedResultInput {
  query: string;
  results: any;
  source: string;
  timestamp?: number; // Optional, will be auto-generated
  expiresAt?: number; // Optional, will be auto-generated
}

interface CachedResult {
  id: number;        // Always required for returned results
  query: string;
  results: any;
  source: string;
  timestamp: number;
  expiresAt: number;
  createdAt: number;
}

interface CacheStats {
  total: number;
  active: number;
  expired: number;
  oldest: string | null;
  newest: string | null;
}

// Define the shape of what your database returns
interface DatabaseCacheStatsResult {
  total: number;
  active: number;
  expired: number;
  oldest: string | null;
  newest: string | null;
}

// Add the missing CacheStatsRow interface
interface CacheStatsRow {
  total: number;
  active: number;
  expired: number;
  oldest: string | null;
  newest: string | null;
}

interface SaveResult {
  id: number;
  success: boolean;
}

interface DeleteResult {
  success: boolean;
  deleted?: number;
}

class ResultsCacheService {
  private initialized = false;

  constructor() {
    console.log('ResultsCacheService initialized with database connection');
    this.initializeIfNeeded();
  }

  private async initializeIfNeeded() {
    if (!this.initialized) {
      await initializeDatabase();
      await this.createTables();
      this.initialized = true;
    }
  }

  // Create the results cache table using SQL Server
  private async createTables(): Promise<void> {
    try {
      const pool = getPool();
      
      // Create the results cache table
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='results_cache' AND xtype='U')
        CREATE TABLE results_cache (
          id INT IDENTITY(1,1) PRIMARY KEY,
          query NVARCHAR(500) NOT NULL,
          results NVARCHAR(MAX) NOT NULL,
          source NVARCHAR(50) NOT NULL,
          timestamp BIGINT NOT NULL,
          expires_at BIGINT NOT NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT UQ_results_cache_query UNIQUE(query)
        )
      `);

      // Create indexes
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_query' AND object_id = OBJECT_ID('results_cache'))
        CREATE INDEX idx_query ON results_cache(query)
      `);

      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_expires_at' AND object_id = OBJECT_ID('results_cache'))
        CREATE INDEX idx_expires_at ON results_cache(expires_at)
      `);

      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_timestamp' AND object_id = OBJECT_ID('results_cache'))
        CREATE INDEX idx_timestamp ON results_cache(timestamp)
      `);

      console.log('Results cache table and indexes created successfully');
    } catch (error) {
      console.error('Error creating results cache table:', error);
    }
  }

  // Save results to database
  async saveResults(query: string, results: any, source: string): Promise<SaveResult> {
    try {
      await this.initializeIfNeeded();
      
      const normalizedQuery = query.toLowerCase().trim();
      const timestamp = Date.now();
      const expiresAt = timestamp + (24 * 60 * 60 * 1000); // 24 hours
      
      console.log('Saving results to database for:', normalizedQuery);

      const pool = getPool();
      
      const result = await pool.request()
        .input('query', sql.NVarChar, normalizedQuery)
        .input('results', sql.NVarChar, JSON.stringify(results))
        .input('source', sql.NVarChar, source)
        .input('timestamp', sql.BigInt, timestamp)
        .input('expiresAt', sql.BigInt, expiresAt)
        .query(`
          MERGE results_cache AS target
          USING (SELECT @query AS query) AS source_table
          ON target.query = source_table.query
          WHEN MATCHED THEN
            UPDATE SET 
              results = @results,
              source = @source,
              timestamp = @timestamp,
              expires_at = @expiresAt,
              created_at = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (query, results, source, timestamp, expires_at)
            VALUES (@query, @results, @source, @timestamp, @expiresAt);
          
          SELECT SCOPE_IDENTITY() AS id;
        `);

      const insertedId = result.recordset[0]?.id || 1;
      console.log('Results cached with ID:', insertedId);
      
      return { id: insertedId, success: true };
    } catch (error) {
      console.error('Error saving to cache:', error);
      throw error;
    }
  }

  // Get results from database
  async getResults(query: string): Promise<CachedResult | null> {
    try {
      await this.initializeIfNeeded();
      
      const normalizedQuery = query.toLowerCase().trim();
      const now = Date.now();

      console.log('Checking cache for:', normalizedQuery);

      const pool = getPool();
      
      const result = await pool.request()
        .input('query', sql.NVarChar, normalizedQuery)
        .input('now', sql.BigInt, now)
        .query(`
          SELECT 
            id, 
            query, 
            results, 
            source, 
            timestamp, 
            expires_at as expiresAt,
            DATEDIFF(millisecond, '1970-01-01', created_at) as createdAt
          FROM results_cache 
          WHERE query = @query AND expires_at > @now
        `);

      if (result.recordset.length > 0) {
        const row = result.recordset[0];
        console.log('Found cached result');
        
        try {
          const cachedResult: CachedResult = {
            id: row.id,
            query: row.query,
            results: typeof row.results === 'string' ? JSON.parse(row.results) : row.results,
            source: row.source,
            timestamp: row.timestamp,
            expiresAt: row.expiresAt,
            createdAt: row.createdAt
          };
          
          return cachedResult;
        } catch (parseError) {
          console.error('Error parsing cached results:', parseError);
          return null;
        }
      } else {
        console.log('No cached results found');
        return null;
      }
    } catch (error) {
      console.error('Error retrieving from cache:', error);
      return null;
    }
  }

  // Find similar results using fuzzy matching
  async findSimilarResults(query: string): Promise<CachedResult[]> {
    try {
      await this.initializeIfNeeded();
      
      const searchTerm = `%${query.toLowerCase().trim()}%`;
      const now = Date.now();

      console.log('Searching for similar results:', query);

      const pool = getPool();
      
      const result = await pool.request()
        .input('searchTerm', sql.NVarChar, searchTerm)
        .input('now', sql.BigInt, now)
        .query(`
          SELECT TOP 5
            id, 
            query, 
            results, 
            source, 
            timestamp, 
            expires_at as expiresAt,
            DATEDIFF(millisecond, '1970-01-01', created_at) as createdAt
          FROM results_cache 
          WHERE query LIKE @searchTerm AND expires_at > @now
          ORDER BY timestamp DESC
        `);

      console.log(`Found ${result.recordset.length} similar results`);
      
      const results: CachedResult[] = result.recordset.map((row: any) => {
        try {
          return {
            id: row.id,
            query: row.query,
            results: typeof row.results === 'string' ? JSON.parse(row.results) : row.results,
            source: row.source,
            timestamp: row.timestamp,
            expiresAt: row.expiresAt,
            createdAt: row.createdAt
          };
        } catch (parseError) {
          console.error('Error parsing similar result:', parseError);
          return null;
        }
      }).filter((result: CachedResult | null): result is CachedResult => result !== null);
      
      return results;
    } catch (error) {
      console.error('Error finding similar results:', error);
      return [];
    }
  }

  // Delete expired results
  async cleanupExpired(): Promise<DeleteResult> {
    try {
      await this.initializeIfNeeded();
      
      const now = Date.now();
      
      const pool = getPool();
      
      // Fix: Explicitly type the SQL result parameter
      const sqlResult = await pool.request()
        .input('now', sql.BigInt, now)
        .query('DELETE FROM results_cache WHERE expires_at <= @now');
  
      return {
        success: true,
        deleted: sqlResult.rowsAffected[0] || 0
      };
    } catch (error) {
      console.error('Error cleaning up expired results:', error);
      return {
        success: false,
        deleted: 0
      };
    }
  }

  // Delete specific result
  async deleteResult(id: number): Promise<DeleteResult> {
    try {
      await this.initializeIfNeeded();
      
      const pool = getPool();
      
      await pool.request()
        .input('id', sql.Int, id)
        .query(`DELETE FROM results_cache WHERE id = @id`);

      console.log(`Deleted cache entry with ID: ${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting cache entry:', error);
      throw error;
    }
  }

  // Get cache statistics - FIXED to use SQL Server
  async getCacheStats(): Promise<CacheStats> {
    try {
      await this.initializeIfNeeded();
      
      const now = Date.now();
      
      const pool = getPool();
      
      const result = await pool.request()
        .input('now', sql.BigInt, now)
        .query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN expires_at > @now THEN 1 END) as active,
            COUNT(CASE WHEN expires_at <= @now THEN 1 END) as expired,
            MIN(created_at) as oldest,
            MAX(created_at) as newest
          FROM results_cache
        `);

      const row = result.recordset[0];
      
      return {
        total: row?.total || 0,
        active: row?.active || 0,
        expired: row?.expired || 0,
        oldest: row?.oldest || null,
        newest: row?.newest || null
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      throw error;
    }
  }

  // If you have other methods with 'result' parameters, type them as well
  private processResults(results: CachedResult[]): CachedResult[] {
    return results.filter((result: CachedResult) => result.expiresAt > Date.now());
  }

  // Type guard for cache stats results
  private isCacheStatsRow(row: any): row is CacheStatsRow {
    return row && 
      typeof row.total === 'number' &&
      typeof row.active === 'number' &&
      typeof row.expired === 'number' &&
      (row.oldest === null || typeof row.oldest === 'string') &&
      (row.newest === null || typeof row.newest === 'string');
  }
}

export default ResultsCacheService;
// Fix: Use 'export type' for type-only exports
export type { CachedResult, CachedResultInput, CacheStats, SaveResult, DeleteResult, CacheStatsRow };