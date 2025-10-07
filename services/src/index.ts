import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nutritionRoutes from './routes/nutritionRoutes';
import openFoodFactsRoutes from './routes/openFoodFactsRoutes'; // Add this
import { initializeDatabase } from './config/database';
import rssRoutes from './routes/rssRoutes';

// Load environment
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Initialize database when the application starts
async function initialize() {
  try {
    console.log('Starting VHealth Services...');
    console.log('Environment check:');
    console.log(`- DB_SERVER: ${process.env.DB_SERVER}`);
    console.log(`- DB_NAME: ${process.env.DB_NAME}`);
    console.log(`- DB_USER: ${process.env.DB_USER}`);
    console.log(`- DB_PASSWORD: ${process.env.DB_PASSWORD ? 'SET' : 'NOT SET'}`);
    
    // Initialize database first
    console.log('Connecting to database...');
    const pool = await initializeDatabase();
    
    if (pool) {
      console.log('Database connection established and tables created');
      
      // Test query to verify tables were created
      try {
        const tables = await pool.request().query(`
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_TYPE = 'BASE TABLE' 
          ORDER BY TABLE_NAME
        `);
        console.log('Tables found:', tables.recordset.map(t => t.TABLE_NAME));
      } catch (err) {
        console.log('Could not query tables yet, but connection is established');
      }
      
      // Mount routes after database is ready
      console.log('About to mount routes at /api');
      app.use('/api', nutritionRoutes);
      app.use('/api/openfoodfacts', openFoodFactsRoutes); // Add this
      app.use('/api/news', rssRoutes);
      console.log('All routes mounted successfully');
      
      // Start server
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log('Available routes:');
        console.log(`GET  http://localhost:${PORT}/api/health`);
        console.log(`POST http://localhost:${PORT}/api/analyze-image`);
        console.log(`GET  http://localhost:${PORT}/api/openfoodfacts/barcode/:barcode`);
        console.log(`GET  http://localhost:${PORT}/api/openfoodfacts/search`);
        console.log(`GET  http://localhost:${PORT}/api/openfoodfacts/nutrition/:barcode`);
        console.log(`GET  http://localhost:${PORT}/api/news/articles`);
      });
      
      console.log('VHealth Services started successfully');
    } else {
      console.error('Database connection failed - cannot start server');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Failed to initialize VHealth Services:', error);
    console.error('Full error details:', error);
    process.exit(1);
  }
}

// Run initialization
initialize();