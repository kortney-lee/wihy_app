import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST, before any other imports
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Now import other modules that depend on env vars
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './config/database';
import nutritionRoutes from './routes/nutritionRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database on server startup
async function startServer() {
  try {
    console.log('Initializing database connection...');
    const pool = await initializeDatabase();
    
    if (pool) {
      console.log('Database initialized successfully');
      
      // Test query to verify tables were created
      try {
        const tables = await pool.request().query(`
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_TYPE = 'BASE TABLE' 
          ORDER BY TABLE_NAME
        `);
        console.log('Database tables:', tables.recordset.map(t => t.TABLE_NAME));
      } catch (err) {
        console.log('Tables query failed, but connection established');
      }
      
      // Mount routes after database is ready
      app.use('/api', nutritionRoutes);
      
      // Health check endpoint
      app.get('/api/health', (req, res) => {
        res.json({ 
          status: 'OK', 
          message: 'VHealth API is running',
          timestamp: new Date().toISOString() 
        });
      });
      
      // Start server
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log('Available routes:');
        console.log(`GET  http://localhost:${PORT}/api/health`);
        console.log(`POST http://localhost:${PORT}/api/analyze-image`);
      });
    } else {
      console.error('Database connection failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;