import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './config/database';
import nutritionRoutes from './routes/nutritionRoutes';
import { searchFoodInDatabase } from './controllers/foodController';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'VHealth API is running',
    timestamp: new Date().toISOString() 
  });
});

// Register food search route BEFORE startServer function
console.log('Registering food search route...');
app.get('/api/search/food', (req, res) => {
  console.log('Food search route accessed!', req.query);
  return searchFoodInDatabase(req, res);
});
console.log('Food search route registered at /api/search/food');

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔌 Initializing database connection...');
    const pool = await initializeDatabase();
    
    if (pool) {
      console.log('Database initialized successfully');
      
      // Mount nutrition routes AFTER database is ready
      console.log(' About to mount nutrition routes at /api');
      app.use('/api', nutritionRoutes);
      console.log(' Nutrition routes mounted successfully');
      
      console.log('All routes registered');
      
      // Start the server
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log('');
        console.log(' Available routes:');
        console.log(`   GET  http://localhost:${PORT}/api/health`);
        console.log(`   GET  http://localhost:${PORT}/api/search/food?q=broccoli`); // This should now show
        console.log(`   POST http://localhost:${PORT}/api/analyze-image`);
        console.log('');
        console.log(' Test the food route:');
        console.log(`   http://localhost:${PORT}/api/search/food?q=apple`);
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