// database.ts  (put under src/config if that’s your convention)
import sql from 'mssql';
import dotenv from 'dotenv';
import { dbConfig } from './dbConfig';

// Load environment variables at the top
dotenv.config();

let pool: any = null;

// SQL table creation scripts - WITHOUT foreign keys initially
const createTablesSQL: Record<string, string> = {
  // Users table for authentication and profiles
  users: `
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
    CREATE TABLE Users (
      user_id NVARCHAR(128) PRIMARY KEY,
      email NVARCHAR(255) UNIQUE NOT NULL,
      display_name NVARCHAR(100),
      created_at DATETIME2 DEFAULT GETDATE(),
      updated_at DATETIME2 DEFAULT GETDATE(),
      is_active BIT DEFAULT 1
    )
  `,

  // Food items with nutritional information
  foods: `
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Foods')
    CREATE TABLE Foods (
      food_id INT IDENTITY(1,1) PRIMARY KEY,
      name NVARCHAR(255) NOT NULL,
      brand NVARCHAR(100),
      category NVARCHAR(100),
      serving_size NVARCHAR(50),
      serving_unit NVARCHAR(20),
      calories_per_serving DECIMAL(8,2),
      protein_g DECIMAL(8,2),
      carbs_g DECIMAL(8,2),
      fat_g DECIMAL(8,2),
      fiber_g DECIMAL(8,2),
      sugar_g DECIMAL(8,2),
      sodium_mg DECIMAL(8,2),
      cholesterol_mg DECIMAL(8,2),
      saturated_fat_g DECIMAL(8,2),
      trans_fat_g DECIMAL(8,2),
      vitamin_a_iu DECIMAL(8,2),
      vitamin_c_mg DECIMAL(8,2),
      calcium_mg DECIMAL(8,2),
      iron_mg DECIMAL(8,2),
      usda_code NVARCHAR(50),
      barcode NVARCHAR(50),
      created_at DATETIME2 DEFAULT GETDATE(),
      updated_at DATETIME2 DEFAULT GETDATE()
    )
  `,

  // User food searches - NO foreign key initially
  user_searches: `
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserSearches')
    CREATE TABLE UserSearches (
      search_id INT IDENTITY(1,1) PRIMARY KEY,
      user_id NVARCHAR(128),
      search_query NVARCHAR(500) NOT NULL,
      search_type NVARCHAR(50) DEFAULT 'text',
      results_count INT DEFAULT 0,
      created_at DATETIME2 DEFAULT GETDATE()
    )
  `,

  // Food consumption tracking - NO foreign keys initially
  user_food_logs: `
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserFoodLogs')
    CREATE TABLE UserFoodLogs (
      log_id INT IDENTITY(1,1) PRIMARY KEY,
      user_id NVARCHAR(128),
      food_id INT,
      serving_amount DECIMAL(8,2) DEFAULT 1.0,
      meal_type NVARCHAR(20),
      consumed_at DATETIME2 DEFAULT GETDATE(),
      notes NVARCHAR(500),
      created_at DATETIME2 DEFAULT GETDATE()
    )
  `,

  // Health scores and AI analysis results - NO foreign keys initially
  health_scores: `
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HealthScores')
    CREATE TABLE HealthScores (
      score_id INT IDENTITY(1,1) PRIMARY KEY,
      user_id NVARCHAR(128),
      food_id INT,
      overall_score DECIMAL(3,1),
      nutrition_score DECIMAL(3,1),
      ingredient_score DECIMAL(3,1),
      processing_score DECIMAL(3,1),
      allergen_warnings NVARCHAR(MAX),
      health_benefits NVARCHAR(MAX),
      concerns NVARCHAR(MAX),
      recommendations NVARCHAR(MAX),
      analyzed_at DATETIME2 DEFAULT GETDATE()
    )
  `,

  // Image analysis results - NO foreign keys initially
  image_analyses: `
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ImageAnalyses')
    CREATE TABLE ImageAnalyses (
      analysis_id INT IDENTITY(1,1) PRIMARY KEY,
      user_id NVARCHAR(128),
      image_url NVARCHAR(500),
      identified_foods NVARCHAR(MAX),
      confidence_score DECIMAL(3,2),
      analysis_provider NVARCHAR(50) DEFAULT 'openai',
      raw_response NVARCHAR(MAX),
      created_at DATETIME2 DEFAULT GETDATE()
    )
  `,

  // User preferences - NO foreign keys initially
  user_preferences: `
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserPreferences')
    CREATE TABLE UserPreferences (
      preference_id INT IDENTITY(1,1) PRIMARY KEY,
      user_id NVARCHAR(128) UNIQUE,
      dietary_restrictions NVARCHAR(MAX),
      allergies NVARCHAR(MAX),
      health_goals NVARCHAR(MAX),
      daily_calorie_target INT,
      daily_protein_target_g DECIMAL(6,2),
      daily_carb_target_g DECIMAL(6,2),
      daily_fat_target_g DECIMAL(6,2),
      created_at DATETIME2 DEFAULT GETDATE(),
      updated_at DATETIME2 DEFAULT GETDATE()
    )
  `
};

// Create indexes for better performance
const createIndexesSQL = [
  `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email')
   CREATE INDEX IX_Users_Email ON Users(email)`,
  `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Foods_Name')
   CREATE INDEX IX_Foods_Name ON Foods(name)`,
  `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Foods_Barcode')
   CREATE INDEX IX_Foods_Barcode ON Foods(barcode)`,
  `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UserSearches_UserId_CreatedAt')
   CREATE INDEX IX_UserSearches_UserId_CreatedAt ON UserSearches(user_id, created_at DESC)`,
  `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UserFoodLogs_UserId_ConsumedAt')
   CREATE INDEX IX_UserFoodLogs_UserId_ConsumedAt ON UserFoodLogs(user_id, consumed_at DESC)`,
  `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HealthScores_FoodId')
   CREATE INDEX IX_HealthScores_FoodId ON HealthScores(food_id)`,
  `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ImageAnalyses_UserId_CreatedAt')
   CREATE INDEX IX_ImageAnalyses_UserId_CreatedAt ON ImageAnalyses(user_id, created_at DESC)`
];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

export async function createTables(): Promise<void> {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  console.log('Creating database tables...');
  
  try {
    // Create tables in dependency order - Users and Foods first
    const tableOrder = [
      'users', 
      'foods', 
      'user_searches', 
      'user_food_logs', 
      'health_scores', 
      'image_analyses', 
      'user_preferences'
    ];
    
    for (const tableName of tableOrder) {
      try {
        await pool.request().query(createTablesSQL[tableName]);
        console.log(`Table ${tableName} ready`);
      } catch (err: any) {
        console.error(`Error with table ${tableName}:`, err.message);
      }
    }

    // Create indexes
    console.log('Creating indexes...');
    for (const indexSQL of createIndexesSQL) {
      try {
        await pool.request().query(indexSQL);
        console.log('Index created');
      } catch (err: any) {
        if (!err.message.includes('already exists')) {
          console.error('Error creating index:', err.message);
        }
      }
    }

    console.log('Database schema setup completed');
  } catch (err: any) {
    console.error('Error creating database schema:', err.message);
    throw err;
  }
}

export async function initializeDatabase(): Promise<sql.ConnectionPool | null> {
  if (pool) {
    console.log('Database already initialized');
    return pool;
  }

  console.log('Connecting to Azure SQL Database...');
  
  try {
    const config = {
      server: process.env.DB_SERVER!,
      database: process.env.DB_NAME!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      port: parseInt(process.env.DB_PORT || '1433'),
      options: {
        encrypt: true,
        enableArithAbort: true,
        trustServerCertificate: false
      }
    };

    pool = await sql.connect(config);
    console.log('Connected to Azure SQL Database');

    // Fixed table query - use proper Azure SQL syntax
    try {
      const tablesResult = await pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
      `);
      console.log(`Found ${tablesResult.recordset.length} tables in database`);
    } catch (tableError) {
      console.log('Could not query table list, but connection is working:', (tableError as Error).message);
    }
    
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    
    if (pool) { 
      try { 
        await pool.close(); 
      } catch (closeError: unknown) {
        console.error('Error closing pool:', getErrorMessage(closeError));
      } 
    }
    pool = null;
    return null;
  }
}

export const getPool = () => {
  if (!pool) {
    throw new Error('Database pool is not initialized. Call initializeDatabase() first.');
  }
  return pool;
};

export { sql };

export async function closeDatabase(): Promise<void> {
  if (!pool) return;
  try {
    await pool.close();
    console.log('Database connection closed');
  } catch (error: unknown) {
    console.error('Error closing database:', getErrorMessage(error));
  } finally {
    pool = null;
  }
}

// Helper function to insert sample data
export async function insertSampleData(): Promise<void> {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  console.log('Adding sample data...');
  
  try {
    // Check if data already exists
    const existingFoods = await pool.request().query('SELECT COUNT(*) as count FROM Foods');
    
    if (existingFoods.recordset[0].count === 0) {
      const sampleFoods = `
        INSERT INTO Foods (name, brand, category, serving_size, serving_unit, calories_per_serving, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg)
        VALUES 
          ('Apple', 'Generic', 'Fruits', '1', 'medium', 95, 0.5, 25, 0.3, 4, 19, 2),
          ('Chicken Breast', 'Generic', 'Protein', '100', 'grams', 165, 31, 0, 3.6, 0, 0, 74),
          ('Brown Rice', 'Generic', 'Grains', '1', 'cup cooked', 216, 5, 45, 1.8, 4, 0.7, 10),
          ('Broccoli', 'Generic', 'Vegetables', '1', 'cup chopped', 25, 3, 5, 0.3, 2.3, 1.5, 33),
          ('Salmon', 'Generic', 'Protein', '100', 'grams', 208, 25.4, 0, 12.4, 0, 0, 59),
          ('Quinoa', 'Generic', 'Grains', '1', 'cup cooked', 222, 8, 39, 3.6, 5, 0.9, 13)
      `;

      await pool.request().query(sampleFoods);
      console.log('Sample foods inserted');
    } else {
      console.log('Sample data already exists');
    }

  } catch (err: any) {
    console.error('Error with sample data:', err.message);
  }
}