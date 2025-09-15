import express from 'express';
import cors from 'cors';
import nutritionRoutes from './routes/nutritionRoutes';
import { initializeDatabase } from './config/database';

const app = express();

app.use(cors());
app.use(express.json());

// Initialize database connection
initializeDatabase()
  .then((pool) => {
    if (pool) {
      console.log('✅ Database connection established');
    } else {
      console.log('📝 Running with mock data only');
    }
  })
  .catch((error) => {
    console.error('❌ Database initialization error:', error);
    console.log('📝 Continuing with mock data...');
  });

console.log('About to mount nutrition routes at /api');
app.use('/api', nutritionRoutes);
console.log('Nutrition routes mounted successfully');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available routes should be:');
  console.log(`GET  http://localhost:${PORT}/api/health`);
  console.log(`POST http://localhost:${PORT}/api/analyze-image`);
});