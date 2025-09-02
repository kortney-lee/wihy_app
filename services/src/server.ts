import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nutritionRoutes from './routes/nutritionRoutes';
import { initializeDatabase } from './config/database';

// Load environment variables
dotenv.config();

// Add this for debugging
console.log('Environment variables loaded:');
console.log('PORT:', process.env.PORT);
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_NAME:', process.env.DB_NAME);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database connection
initializeDatabase();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/nutrition', nutritionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'vHealth API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 vHealth API server running on port ${PORT}`);
  console.log(`📱 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});