import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import from the services directory (where your actual routes are)
import nutritionRoutes from './services/src/routes/nutritionRoutes';
import openFoodFactsRoutes from './services/src/routes/openFoodFactsRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/api', nutritionRoutes);
app.use('/api/openfoodfacts', openFoodFactsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: ['OpenFoodFacts API', 'Nutrition API'],
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'vHealth API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      nutrition: '/api/*',
      openfoodfacts: '/api/openfoodfacts/*'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedPath: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`🚀 vHealth server running on port ${PORT}`);
  console.log(`📱 Health API available at http://localhost:${PORT}/api/health`);
  console.log(`🍎 OpenFoodFacts API available at http://localhost:${PORT}/api/openfoodfacts`);
  console.log(`🥗 Nutrition API available at http://localhost:${PORT}/api`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;